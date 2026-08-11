import 'dotenv/config';
import { connectDB, disconnectDB } from './utils/database';
import BulkAutoApplyService from './services/bulk-auto-apply';
import { checkRedisHealth } from './services/redis-client';
import { checkOpenAIHealth } from './services/openai-client';
import { checkCohereHealth } from './services/cohere-client';
import { sanitizeForLog } from './utils/safe-logging';

let shuttingDown = false;

const shutdown = async (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`🛑 Bulk auto-apply worker received ${signal}; shutting down`);
  try {
    await BulkAutoApplyService.stopWorker();
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Bulk auto-apply worker shutdown failed:', sanitizeForLog(error));
    process.exit(1);
  }
};

const start = async () => {
  console.log('🚀 Starting CampusPe bulk auto-apply worker');
  console.log('ℹ️  Bulk auto-apply requires both the API process and this worker process. Run npm run start for API and npm run worker for queue processing.');

  await Promise.all([
    checkRedisHealth(),
    checkOpenAIHealth(),
    checkCohereHealth()
  ]);

  await connectDB();
  BulkAutoApplyService.startWorker();
  BulkAutoApplyService.startOrphanedRunReconciler();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start().catch(error => {
  console.error('❌ Bulk auto-apply worker failed to start:', sanitizeForLog(error));
  process.exit(1);
});
