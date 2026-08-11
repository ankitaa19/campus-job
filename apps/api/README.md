# CampusPe API

## Bulk auto-apply worker

Bulk auto-apply uses BullMQ with one queue job per application task. Run the API and worker as separate processes:

```bash
npm run start
npm run worker
```

The API process creates runs, task rows, and queue jobs. The worker process connects to MongoDB and Redis, processes `bulk-auto-apply` jobs, and reconciles orphaned runs.
