import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import JobSyncService from '../services/job-aggregation/job-sync.service';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// A bulk maintenance sync can create hundreds of records. Recommendations are
// calculated on demand; suppress notification fan-out during this operator run.
process.env.JOB_ALERTS_ENABLED = 'false';

const main = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not configured');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  const [provider, companySlug] = process.argv.slice(2);
  const results = provider && companySlug
    ? [await JobSyncService.syncProviderCompany(provider, companySlug)]
    : provider
      ? await JobSyncService.syncProvider(provider)
      : await JobSyncService.syncAllProviders();
  const totals = results.reduce((sum, result) => ({
    fetched: sum.fetched + result.fetched,
    created: sum.created + result.created,
    updated: sum.updated + result.updated,
    closed: sum.closed + result.closed,
    errors: sum.errors + result.errors.length
  }), { fetched: 0, created: 0, updated: 0, closed: 0, errors: 0 });
  console.log(JSON.stringify({ sourcesRun: results.length, totals, results }, null, 2));
  await mongoose.disconnect();
};

main().catch(async error => {
  console.error(error instanceof Error ? error.message : error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
