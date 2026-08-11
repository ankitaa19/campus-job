import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../utils/database';
import { Job } from '../models/Job';
import { Student } from '../models/Student';
import { User } from '../models/User';
import { JobMatch } from '../models/JobMatch';

const run = async () => {
  await connectDB();

  const [jobs, students, users, matches] = await Promise.all([
    Job.updateMany({ featureVector: { $exists: true } }, { $unset: { featureVector: 1 } }),
    Student.updateMany({ profileFeatureVector: { $exists: true } }, { $unset: { profileFeatureVector: 1 } }),
    User.updateMany({ profileVector: { $exists: true } }, { $unset: { profileVector: 1 } }),
    JobMatch.deleteMany({})
  ]);

  const userEnterprise = mongoose.connection.collection('userenterprises');
  const enterpriseUsers = await userEnterprise.updateMany(
    { profileVector: { $exists: true } },
    { $unset: { profileVector: '' } }
  ).catch(() => ({ modifiedCount: 0 }));

  console.log('Cleared incompatible OpenAI embedding data:', {
    jobFeatureVectors: jobs.modifiedCount,
    studentProfileFeatureVectors: students.modifiedCount,
    userProfileVectors: users.modifiedCount,
    enterpriseUserProfileVectors: enterpriseUsers.modifiedCount,
    jobMatchesDeleted: matches.deletedCount
  });
};

run()
  .catch(error => {
    console.error('Failed to clear embedding vectors:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB().catch(() => undefined);
  });
