import crypto from 'crypto';
import CareerAlertService from '../career-alerts';
import { Types } from 'mongoose';
import { ProviderCompany } from '../../models/ProviderCompany';
import { Job } from '../../models/Job';
import JobsRepository from './jobs.repository';
import ProviderCompaniesService from './provider-companies.service';
import ProviderRegistry from './provider-registry';
import { ProviderCompanyConfig, ProviderName, ProviderSyncTier, SyncResult } from './types';
import AIJobNormalizer from './ai-job-normalizer';
import { enrichJob } from '../job-intelligence';
import { SourceJobSnapshot } from '../../models/SourceJobSnapshot';
import ProductEventService from '../product-events';

class JobSyncService {
  private running = false;
  private readonly alertQueue: Types.ObjectId[] = [];
  private alertQueueRunning = false;

  async syncAllProviders(): Promise<SyncResult[]> {
    if (this.running) throw new Error('A job synchronization is already running');
    this.running = true;
    try {
      await ProviderCompaniesService.seedFromEnvironment();
      const refreshed = await JobsRepository.refreshIntelligence();
      if (refreshed) console.log(`🧠 Refreshed skills and experience for ${refreshed} existing jobs`);
      const companies = await ProviderCompaniesService.getActive();
      return await this.syncCompanies(companies);
    } finally {
      this.running = false;
    }
  }

  async syncTier(tier: ProviderSyncTier): Promise<SyncResult[]> {
    if (this.running) throw new Error('A job synchronization is already running');
    this.running = true;
    try {
      await ProviderCompaniesService.seedFromEnvironment();
      const companies = (await ProviderCompaniesService.getActive()).filter(company => providerTier(company.provider) === tier);
      return await this.syncCompanies(companies);
    } finally {
      this.running = false;
    }
  }

  async revalidateMissingSources(): Promise<SyncResult[]> {
    if (this.running) throw new Error('A job synchronization is already running');
    this.running = true;
    try {
      const providerCompanyIds = await Job.distinct('providerCompanyId', {
        sourceLifecycleStatus: { $in: ['missing_on_source', 'recheck'] },
        nextSourceRecheckAt: { $lte: new Date() },
        providerCompanyId: { $exists: true }
      });
      if (!providerCompanyIds.length) return [];
      const companies = await ProviderCompany.find({ _id: { $in: providerCompanyIds }, isActive: true }).lean() as unknown as ProviderCompanyConfig[];
      return await this.syncCompanies(companies);
    } finally {
      this.running = false;
    }
  }

  async syncProvider(providerName: string): Promise<SyncResult[]> {
    if (this.running) throw new Error('A job synchronization is already running');
    this.running = true;
    try {
      const provider = ProviderRegistry.get(providerName);
      await ProviderCompaniesService.seedFromEnvironment();
      const companies = await ProviderCompaniesService.getActive(provider.name);
      return await this.syncCompanies(companies);
    } finally {
      this.running = false;
    }
  }

  async syncProviderCompany(providerName: string, companySlug: string): Promise<SyncResult> {
    if (this.running) throw new Error('A job synchronization is already running');
    this.running = true;
    try {
      const provider = ProviderRegistry.get(providerName);
      const company = await ProviderCompaniesService.getOrCreate(provider.name, companySlug);
      return await this.syncCompany(company);
    } finally {
      this.running = false;
    }
  }

  private async syncCompany(company: ProviderCompanyConfig): Promise<SyncResult> {
    const provider = ProviderRegistry.get(company.provider);
    const result: SyncResult = {
      provider: company.provider,
      companySlug: company.companySlug,
      fetched: 0,
      created: 0,
      updated: 0,
      closed: 0,
      errors: []
    };

    try {
      const rawJobs = await this.fetchWithRetry(() => provider.fetchJobs(company));
      result.fetched = rawJobs.length;
      const upstreamIds: string[] = [];
      const createdJobIds: Types.ObjectId[] = [];
      let aiEnrichmentCount = 0;
      const aiEnrichmentLimit = Math.min(100, Math.max(0, Number(process.env.AI_JOB_ENRICHMENT_MAX_PER_SYNC || 50)));

      for (const rawJob of rawJobs) {
        const rawExternalId = String((rawJob as any)?.id || '');
        if (rawExternalId && !upstreamIds.includes(rawExternalId)) upstreamIds.push(rawExternalId);
        try {
          let dto = provider.mapJob(rawJob, company);
          await this.persistSourceSnapshot(company, dto.sourceExternalId, rawJob);
          // Every provider passes through the same deterministic normalizer so
          // incomplete ATS payloads still receive skills and experience data.
          const normalized = enrichJob(dto) as any;
          dto = {
            ...dto,
            jobType: normalized.jobType || dto.jobType,
            requiredSkills: normalized.requiredSkills || dto.requiredSkills,
            requirements: normalized.requirements || dto.requirements,
            minExperience: normalized.minExperience ?? dto.minExperience,
            maxExperience: normalized.maxExperience ?? dto.maxExperience,
            experienceLevel: normalized.experienceLevel || dto.experienceLevel
          };
          if (!upstreamIds.includes(dto.sourceExternalId)) upstreamIds.push(dto.sourceExternalId);
          const isFresh = dto.postedAt >= new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
          const needsEnrichment = dto.requiredSkills.length < 3 || (!dto.minExperience && dto.experienceLevel === 'entry');
          if (isFresh && needsEnrichment && aiEnrichmentCount < aiEnrichmentLimit && AIJobNormalizer.isEnabled()) {
            dto = await AIJobNormalizer.enrich(dto);
            aiEnrichmentCount += 1;
          }
          const persisted = await JobsRepository.upsertJob(dto, company);
          if (!persisted.job || persisted.skipped) continue;
          if (persisted.created) {
            result.created += 1;
            createdJobIds.push(persisted.job._id);
          } else {
            result.updated += 1;
          }
          ProductEventService.record({
            name: persisted.created ? 'job_ingested' : 'job_updated',
            jobId: persisted.job._id,
            sourceProvider: company.provider,
            jobVersion: String((persisted.job as any).normalizationVersion || 1),
            metadata: { sourceExternalId: dto.sourceExternalId, companySlug: company.companySlug }
          }).catch(() => undefined);
        } catch (error) {
          result.errors.push(error instanceof Error ? error.message : String(error));
        }
      }

      const authoritativeSnapshot = provider.isAuthoritativeSnapshot?.(company, rawJobs as any[]) !== false;
      result.closed = authoritativeSnapshot ? await JobsRepository.closeMissingJobs(company, upstreamIds) : 0;
      await ProviderCompaniesService.updateSyncResult(company._id, {
        lastSyncedAt: new Date(),
        lastSyncStatus: result.errors.length ? 'partial' : 'success',
        lastError: result.errors.length ? result.errors.slice(0, 10).join('; ') : null,
        lastFetchedCount: result.fetched,
        lastCreatedCount: result.created,
        lastUpdatedCount: result.updated
      });

      this.enqueueAlerts(createdJobIds);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.errors.push(message);
      if (company._id) {
        await ProviderCompany.findByIdAndUpdate(company._id, {
          $set: { lastSyncedAt: new Date(), lastSyncStatus: 'failed', lastError: message }
        });
      }
      return result;
    }
  }

  private async syncCompanies(companies: ProviderCompanyConfig[]): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    const concurrency = Math.min(8, Math.max(1, Number(process.env.JOB_SYNC_CONCURRENCY || 4)));
    for (let index = 0; index < companies.length; index += concurrency) {
      results.push(...await Promise.all(companies.slice(index, index + concurrency).map(company => this.syncCompany(company))));
    }
    return results;
  }

  private async fetchWithRetry<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try { return await operation(); } catch (error) {
        lastError = error;
        if (attempt < attempts) await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
    throw lastError;
  }

  private async persistSourceSnapshot(company: ProviderCompanyConfig, externalId: string, rawPayload: unknown): Promise<void> {
    try {
      const serialized = JSON.stringify(rawPayload);
      const contentHash = crypto.createHash('sha256').update(serialized).digest('hex');
      await SourceJobSnapshot.updateOne(
        { provider: company.provider, companySlug: company.companySlug, externalId, contentHash },
        {
          $setOnInsert: {
            provider: company.provider,
            companySlug: company.companySlug,
            externalId,
            contentHash,
            providerCompanyId: company._id,
            fetchedAt: new Date(),
            parserVersion: 1,
            rawPayload,
            normalizationWarnings: []
          }
        },
        { upsert: true }
      );
    } catch (error) {
      console.warn(`Unable to persist raw source snapshot for ${company.provider}/${externalId}:`, error);
    }
  }

  private enqueueAlerts(jobIds: Types.ObjectId[]): void {
    if (process.env.JOB_ALERTS_ENABLED === 'false') return;
    this.alertQueue.push(...jobIds);
    if (this.alertQueueRunning || !this.alertQueue.length) return;
    this.alertQueueRunning = true;
    setImmediate(() => this.drainAlertQueue().catch(error => console.error('Automatic job alert queue failed:', error)));
  }

  private async drainAlertQueue(): Promise<void> {
    const concurrency = Math.min(10, Math.max(1, Number(process.env.JOB_MATCH_CONCURRENCY || 3)));
    try {
      while (this.alertQueue.length) {
        const batch = this.alertQueue.splice(0, concurrency);
        await Promise.all(batch.map(jobId => CareerAlertService.processNewJobPosting(jobId).catch(error =>
          console.error(`Automatic matching failed for synchronized job ${jobId}:`, error)
        )));
      }
    } finally {
      this.alertQueueRunning = false;
      if (this.alertQueue.length) this.enqueueAlerts([]);
    }
  }
}

export default new JobSyncService();

const providerTier = (provider: ProviderName): ProviderSyncTier => {
  if (['adzuna', 'greenhouse', 'lever', 'ashby', 'smartrecruiters'].includes(provider)) return 'high_priority';
  if (['himalayas', 'weworkremotely'].includes(provider)) return 'daily';
  return 'standard';
};
