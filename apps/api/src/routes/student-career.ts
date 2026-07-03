import express from 'express';
import {
    updateStudentProfile,
    getStudentJobMatches,
    triggerStudentJobAlerts,
    analyzeStudentProfile
} from '../controllers/student-career';

const router = express.Router();

// Route to update student profile and trigger job matching
router.put('/:id/profile', updateStudentProfile);

// Route to get job matches for a student
router.get('/:id/job-matches', getStudentJobMatches);

// Route to trigger manual job alerts for a student
router.post('/:id/trigger-alerts', triggerStudentJobAlerts);

// Route to analyze student profile with AI
router.get('/:id/analyze', analyzeStudentProfile);

export default router;
