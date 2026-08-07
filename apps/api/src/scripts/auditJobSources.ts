import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { ProviderCompany } from '../models/ProviderCompany';
import { Job } from '../models/Job';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const main = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not configured');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });

  const [sourceSummary, syncSummary, jobSummary, quality] = await Promise.all([
    ProviderCompany.aggregate([
      { $group: { _id: { provider: '$provider', active: '$isActive', discovery: '$discoveryStatus' }, count: { $sum: 1 } } },
      { $sort: { '_id.provider': 1, '_id.active': -1, '_id.discovery': 1 } }
    ]),
    ProviderCompany.aggregate([
      { $group: { _id: { status: '$lastSyncStatus' }, sources: { $sum: 1 }, fetched: { $sum: '$lastFetchedCount' }, created: { $sum: '$lastCreatedCount' }, updated: { $sum: '$lastUpdatedCount' } } },
      { $sort: { '_id.status': 1 } }
    ]),
    Job.aggregate([
      { $match: { status: 'active', isPublic: true } },
      { $group: { _id: { provider: { $ifNull: ['$sourceProvider', 'campuspe'] }, type: '$jobType' }, jobs: { $sum: 1 } } },
      { $sort: { '_id.provider': 1, '_id.type': 1 } }
    ]),
    Job.aggregate([
      { $match: { status: 'active', isPublic: true } },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        missingSkills: { $sum: { $cond: [{ $eq: [{ $size: { $ifNull: ['$requiredSkills', []] } }, 0] }, 1, 0] } },
        missingLocation: { $sum: { $cond: [{ $eq: [{ $size: { $ifNull: ['$locations', []] } }, 0] }, 1, 0] } },
        suspiciousExperience: { $sum: { $cond: [{ $gt: ['$minExperience', 15] }, 1, 0] } },
        unspecifiedIndustry: { $sum: { $cond: [{ $in: [{ $ifNull: ['$industry', ''] }, ['', 'Not specified', 'General Technology']] }, 1, 0] } },
        encodedDescription: { $sum: { $cond: [{ $regexMatch: { input: '$description', regex: /&(?:#\d+|[a-z]+);/i } }, 1, 0] } }
      } }
    ])
  ]);

  const summaryOnly = process.argv.includes('--summary');
  const runtimeProblemsOnly = process.argv.includes('--runtime-problems');
  const problemFilter = runtimeProblemsOnly
    ? { lastSyncStatus: { $in: ['failed', 'partial'] } }
    : { $or: [{ lastSyncStatus: { $in: ['failed', 'partial'] } }, { discoveryStatus: 'failed' }] };
  const failedSources = summaryOnly ? [] : await ProviderCompany.find(problemFilter)
    .select('provider companySlug companyName pageUrl lastSyncStatus discoveryStatus lastError lastSyncedAt')
    .sort({ provider: 1, companyName: 1 }).lean();

  const report = runtimeProblemsOnly
    ? { generatedAt: new Date().toISOString(), runtimeProblems: failedSources }
    : { generatedAt: new Date().toISOString(), sourceSummary, syncSummary, jobSummary, quality: quality[0] || {}, failedSources };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  await mongoose.disconnect();
};

main().catch(async error => {
  console.error(error instanceof Error ? error.message : error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
