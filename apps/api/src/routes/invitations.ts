import express from 'express';
import {
  createJobInvitations,
  getJobInvitations,
  getCollegeInvitations,
  acceptInvitation,
  declineInvitation,
  proposeCounterDates,
  respondToCounterProposal,
  getInvitationById,
  updateInvitation,
  getInvitationHistory,
  debugCreateInvitation,
  resendInvitation
} from '../controllers/invitations';
import authMiddleware from '../middleware/auth';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = express.Router();

// Debug endpoint
router.get('/debug', authMiddleware, debugCreateInvitation);

// Get all invitations for current user (General endpoint)
router.get(
  '/invitations',
  authMiddleware,
  getCollegeInvitations
);

// Create a single invitation (Recruiters only) - for frontend compatibility
router.post(
  '/invitations',
  authMiddleware,
  // roleMiddleware(['recruiter']), // Temporarily disabled for testing
  createJobInvitations
);

// Create invitations for a job (Recruiters only)
router.post(
  '/jobs/:jobId/invitations',
  authMiddleware,
  // roleMiddleware(['recruiter']), // Temporarily disabled for testing
  createJobInvitations
);

// Get all invitations for a job (Recruiters only)
router.get(
  '/jobs/:jobId/invitations',
  authMiddleware,
  roleMiddleware(['recruiter']),
  getJobInvitations
);

// Get invitations for current college user (TPO/College admins only)
router.get(
  '/colleges/invitations',
  authMiddleware,
  roleMiddleware(['tpo', 'college_admin', 'college']),
  getCollegeInvitations
);

// Get invitations for a specific college (TPO/College admins only)
router.get(
  '/colleges/:collegeId/invitations',
  authMiddleware,
  roleMiddleware(['tpo', 'college_admin', 'college']),
  getCollegeInvitations
);

// Get specific invitation details
router.get(
  '/invitations/:invitationId',
  authMiddleware,
  getInvitationById
);

// Accept invitation (TPO/College admins only) - College endpoint
router.post(
  '/colleges/invitations/:invitationId/accept',
  authMiddleware,
  roleMiddleware(['tpo', 'college_admin', 'college']),
  acceptInvitation
);

// Decline invitation (TPO/College admins only) - College endpoint
router.post(
  '/colleges/invitations/:invitationId/decline',
  authMiddleware,
  roleMiddleware(['tpo', 'college_admin', 'college']),
  declineInvitation
);

// Accept invitation (TPO/College admins only) - General endpoint
router.post(
  '/invitations/:invitationId/accept',
  authMiddleware,
  roleMiddleware(['tpo', 'college_admin', 'college']),
  acceptInvitation
);

// Decline invitation (TPO/College admins only) - General endpoint
router.post(
  '/invitations/:invitationId/decline',
  authMiddleware,
  roleMiddleware(['tpo', 'college_admin', 'college']),
  declineInvitation
);

// Propose counter dates (TPO/College admins only)
router.post(
  '/invitations/:invitationId/counter',
  authMiddleware,
  roleMiddleware(['tpo', 'college_admin', 'college']),
  proposeCounterDates
);

// Respond to counter proposal (Recruiters only)
router.post(
  '/invitations/:invitationId/counter-response',
  authMiddleware,
  roleMiddleware(['recruiter']),
  respondToCounterProposal
);

// Update invitation (Admin access for override scenarios)
router.put(
  '/invitations/:invitationId',
  authMiddleware,
  roleMiddleware(['admin']),
  updateInvitation
);

// Get invitation history/timeline
router.get(
  '/invitations/:invitationId/history',
  authMiddleware,
  getInvitationHistory
);

// Resend invitation (Recruiters only)
router.post(
  '/invitations/:invitationId/resend',
  authMiddleware,
  // roleMiddleware(['recruiter']), // Temporarily disabled for debugging
  resendInvitation
);

export default router;
