import { Request, Response } from 'express';
import JobSyncService from '../services/job-aggregation/job-sync.service';
import ProviderRegistry from '../services/job-aggregation/provider-registry';
import CareerSourceDiscoveryService from '../services/job-aggregation/career-source-discovery.service';
import { Job } from '../models/Job';
import { ProviderCompany } from '../models/ProviderCompany';

const sendSyncResponse = (res: Response, results: any[]) => {
  const errorCount = results.reduce((total, result) => total + result.errors.length, 0);
  return res.status(200).json({
    success: errorCount === 0,
    providers: ProviderRegistry.list(),
    summary: {
      companies: results.length,
      fetched: results.reduce((total, result) => total + result.fetched, 0),
      created: results.reduce((total, result) => total + result.created, 0),
      updated: results.reduce((total, result) => total + result.updated, 0),
      closed: results.reduce((total, result) => total + result.closed, 0),
      errors: errorCount
    },
    data: results
  });
};

export const syncAllJobs = async (_req: Request, res: Response) => {
  try {
    return sendSyncResponse(res, await JobSyncService.syncAllProviders());
  } catch (error) {
    return res.status(409).json({ success: false, message: error instanceof Error ? error.message : 'Job synchronization failed' });
  }
};

export const syncProviderJobs = async (req: Request, res: Response) => {
  try {
    return sendSyncResponse(res, await JobSyncService.syncProvider(req.params.provider.toLowerCase()));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Provider synchronization failed';
    return res.status(message.startsWith('Unsupported') ? 400 : 500).json({ success: false, message });
  }
};

export const syncProviderCompanyJobs = async (req: Request, res: Response) => {
  try {
    return sendSyncResponse(res, [await JobSyncService.syncProviderCompany(
      req.params.provider.toLowerCase(),
      req.params.companySlug
    )]);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Company synchronization failed';
    return res.status(message.startsWith('Unsupported') || message.startsWith('Invalid') ? 400 : 500).json({ success: false, message });
  }
};

export const discoverCareerSources = async (req: Request, res: Response) => {
  try {
    const data = await CareerSourceDiscoveryService.discoverPending(Number(req.query.limit || 20));
    return res.json({
      success: true,
      summary: {
        checked: data.length,
        verified: data.filter(item => item.status === 'verified').length,
        unsupported: data.filter(item => item.status === 'unsupported').length,
        failed: data.filter(item => item.status === 'failed').length
      },
      data
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Career source discovery failed' });
  }
};

export const getJobAggregationStatus = async (_req: Request, res: Response) => {
  try {
    const [totalStored, verifiedActive, campusPeActive, missingOnSource, recheck, expiredBySource, providers] = await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ source: { $ne: 'campuspe' }, status: 'active', sourceLifecycleStatus: 'active' }),
      Job.countDocuments({ source: 'campuspe', status: 'active' }),
      Job.countDocuments({ sourceLifecycleStatus: 'missing_on_source' }),
      Job.countDocuments({ sourceLifecycleStatus: 'recheck' }),
      Job.countDocuments({ sourceLifecycleStatus: 'expired' }),
      ProviderCompany.find({ isActive: true })
        .select('provider companySlug companyName lastSyncedAt lastSyncStatus lastFetchedCount lastError')
        .sort({ provider: 1, companySlug: 1 }).lean()
    ]);
    return res.json({
      success: true,
      data: {
        totalStored,
        verifiedActive,
        campusPeActive,
        totalVisibleActive: verifiedActive + campusPeActive,
        lifecycle: { active: verifiedActive, missingOnSource, recheck, expired: expiredBySource },
        providers
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Unable to load aggregation status' });
  }
};
