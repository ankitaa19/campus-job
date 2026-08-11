import { Types } from 'mongoose';
import { Job } from '../models/Job';
import { JobInteraction, JobInteractionType } from '../models/JobInteraction';
import { Student } from '../models/Student';
import { canonicalSkill, normalizeTitle } from './job-intelligence';
import ProductEventService from './product-events';

const weights: Record<JobInteractionType, number> = {
  view: 0.5, click: 1, save: 2, dismiss: -3, apply: 4, abandon: -2
};

interface BehaviorProfile { expiresAt: number; industries: Map<string, number>; titles: Map<string, number>; skills: Map<string, number>; }

class JobBehaviorService {
  private cache = new Map<string, BehaviorProfile>();
  private pendingProfiles = new Map<string, Promise<BehaviorProfile>>();

  async record(userId: Types.ObjectId, jobId: Types.ObjectId, type: JobInteractionType, metadata?: Record<string, unknown>): Promise<void> {
    const [student, job] = await Promise.all([Student.findOne({ userId }).select('_id'), Job.findById(jobId).select('industry normalizedTitle title canonicalSkills requiredSkills jobType workMode sourceProvider')]);
    if (!student || !job) throw new Error('Student or job not found');
    await JobInteraction.create({
      studentId: student._id, userId, jobId, type, weight: weights[type], metadata,
      jobFeatures: {
        industry: job.industry, title: job.normalizedTitle || normalizeTitle(job.title),
        skills: job.canonicalSkills?.length ? job.canonicalSkills : job.requiredSkills,
        jobType: job.jobType, workMode: job.workMode
      }
    });
    const eventName = {
      view: 'job_impression',
      click: 'job_opened',
      save: 'job_saved',
      dismiss: 'job_hidden',
      apply: 'application_started',
      abandon: 'job_hidden'
    } as const;
    await ProductEventService.record({
      name: eventName[type],
      actorUserId: userId,
      studentId: student._id,
      jobId,
      sourceProvider: (job as any).sourceProvider,
      reason: type === 'abandon' ? 'abandoned' : undefined,
      metadata
    });
    this.cache.delete(student._id.toString());
  }

  async adjustment(studentId: Types.ObjectId, job: any): Promise<number> {
    const profile = await this.profile(studentId);
    let signal = 0; let evidence = 0;
    const add = (value?: number) => { if (value) { signal += value; evidence += Math.abs(value); } };
    add(profile.industries.get(String(job.industry || '').toLowerCase()));
    add(profile.titles.get(normalizeTitle(job.normalizedTitle || job.title || '')));
    for (const skill of job.canonicalSkills || job.requiredSkills || []) add(profile.skills.get(canonicalSkill(skill)));
    if (!evidence) return 0;
    return Math.max(-8, Math.min(8, Math.round(signal / Math.sqrt(evidence) * 10) / 10));
  }

  private async profile(studentId: Types.ObjectId): Promise<BehaviorProfile> {
    const key = studentId.toString(); const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached;
    const pending = this.pendingProfiles.get(key); if (pending) return pending;
    const load = (async () => {
      const interactions = await JobInteraction.find({ studentId, createdAt: { $gte: new Date(Date.now() - 180 * 86400000) } }).sort({ createdAt: -1 }).limit(500).lean();
      const profile: BehaviorProfile = { expiresAt: Date.now() + 5 * 60000, industries: new Map(), titles: new Map(), skills: new Map() };
      const increment = (map: Map<string, number>, item: string, value: number) => item && map.set(item, (map.get(item) || 0) + value);
      interactions.forEach((interaction, index) => {
        const decay = Math.exp(-index / 150); const weight = interaction.weight * decay;
        increment(profile.industries, String(interaction.jobFeatures?.industry || '').toLowerCase(), weight);
        increment(profile.titles, normalizeTitle(interaction.jobFeatures?.title || ''), weight);
        (interaction.jobFeatures?.skills || []).forEach(skill => increment(profile.skills, canonicalSkill(skill), weight));
      });
      this.cache.set(key, profile); return profile;
    })();
    this.pendingProfiles.set(key, load);
    try { return await load; } finally { this.pendingProfiles.delete(key); }
  }
}

export default new JobBehaviorService();
