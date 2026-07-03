import express from 'express';
import {
    getSystemStats,
    processAllActiveJobs,
    triggerDailyAlerts,
    getMatchingAnalytics,
    testAIAnalysis,
    getSystemConfig,
    getNotificationHistory,
    getCandidateManagement
} from '../controllers/career-admin';

const router = express.Router();

// System overview and statistics
router.get('/stats', getSystemStats);

// Get system configuration
router.get('/config', getSystemConfig);

// Get matching analytics
router.get('/analytics', getMatchingAnalytics);

// Get notification history for recruiter
router.get('/notifications/:recruiterId', getNotificationHistory);

// Get candidate management data for recruiter
router.get('/candidates/:recruiterId', getCandidateManagement);

// Process all active jobs for matching
router.post('/process-jobs', processAllActiveJobs);

// Trigger daily alerts manually
router.post('/trigger-alerts', triggerDailyAlerts);

// Test AI analysis
router.post('/test-ai', testAIAnalysis);

export default router;
