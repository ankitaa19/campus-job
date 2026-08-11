import 'dotenv/config';
import mongoose from 'mongoose';
import { Job } from '../models/Job';
import { COHERE_EMBEDDING_DIMENSIONS } from '../services/cohere-client';

const run = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required');

  await mongoose.connect(uri);

  const result = await Job.collection.updateMany({}, [
    {
      $set: {
        featureVectorLength: {
          $cond: [
            { $isArray: '$featureVector' },
            { $size: '$featureVector' },
            null
          ]
        }
      }
    },
    {
      $set: {
        featureVector: {
          $cond: [
            {
              $or: [
                { $eq: ['$featureVectorLength', null] },
                { $eq: ['$featureVectorLength', COHERE_EMBEDDING_DIMENSIONS] }
              ]
            },
            '$featureVector',
            '$$REMOVE'
          ]
        }
      }
    },
    { $unset: 'featureVectorLength' }
  ]);

  const dimensions = await Job.aggregate([
    { $match: { featureVector: { $exists: true, $type: 'array' } } },
    { $project: { dimensions: { $size: '$featureVector' } } },
    { $group: { _id: '$dimensions', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  console.log('Cleared non-Cohere job feature vectors:', {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
    expectedDimensions: COHERE_EMBEDDING_DIMENSIONS,
    remainingDimensions: dimensions
  });
};

run()
  .catch(error => {
    console.error('Failed to clear invalid job feature vectors:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => undefined);
  });
