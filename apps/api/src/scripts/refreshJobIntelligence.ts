import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import JobsRepository from '../services/job-aggregation/jobs.repository';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const main = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not configured');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  let total = 0;
  while (true) {
    const modified = await JobsRepository.refreshIntelligence(5000);
    total += modified;
    if (!modified) break;
  }
  console.log(JSON.stringify({ refreshedJobs: total, normalizationVersion: 5 }));
  await mongoose.disconnect();
};

main().catch(async error => {
  console.error(error instanceof Error ? error.message : error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
