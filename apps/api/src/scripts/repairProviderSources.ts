import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { ProviderCompany } from '../models/ProviderCompany';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const main = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not configured');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });

  const disabled = [
    { provider: 'ashby', companySlug: 'mistral', reason: 'Career board migrated to the verified public Lever tenant mistral' },
    { provider: 'greenhouse', companySlug: 'embed', reason: 'Incorrect Greenhouse token; replaced by verified token inflectionai' },
    { provider: 'lever', companySlug: 'dreamsports', reason: 'Public Lever tenant returns 404; disabled until a current official structured endpoint is verified' },
    { provider: 'smartrecruiters', companySlug: 'boschgroup', reason: 'Provider API robots.txt disallows automated collection' },
    { provider: 'smartrecruiters', companySlug: 'westerndigital', reason: 'Provider API robots.txt disallows automated collection' },
    { provider: 'workday', companySlug: 'ghr-lateral-us', reason: 'Obsolete Workday endpoint returns 404; official careers site uses a different platform' }
  ];
  for (const source of disabled) {
    await ProviderCompany.updateOne(
      { provider: source.provider, companySlug: source.companySlug },
      { $set: { isActive: false, lastError: source.reason } }
    );
  }

  const replacements = [
    { provider: 'lever', companySlug: 'mistral', companyName: 'Mistral AI' },
    { provider: 'greenhouse', companySlug: 'inflectionai', companyName: 'Inflection AI' }
  ];
  for (const source of replacements) {
    await ProviderCompany.findOneAndUpdate(
      { provider: source.provider, companySlug: source.companySlug },
      { $set: { companyName: source.companyName, sourceType: 'company_careers', apiRegion: 'global', isActive: true, lastError: null }, $setOnInsert: { lastSyncStatus: 'never' } },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }

  console.log(JSON.stringify({ disabled: disabled.length, activatedReplacements: replacements.length }));
  await mongoose.disconnect();
};

main().catch(async error => {
  console.error(error instanceof Error ? error.message : error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
