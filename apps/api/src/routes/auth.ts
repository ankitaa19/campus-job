import express from 'express';
import { register, login, studentLogin, collegeLogin, recruiterLogin, sendOTP, verifyOTPController, forgotPassword, checkEmail, checkPhone, validateEmail, testLogin, verifyOTPAndLogin, googleSignup, verifyGoogleSignupPhone, verifyResetOTP, resetPassword } from '../controllers/auth';

const router = express.Router();

// Authentication routes
router.post('/login', login);
router.post('/student-login', studentLogin);
router.post('/college-login', collegeLogin);
router.post('/recruiter-login', recruiterLogin);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.post('/check-email', validateEmail, checkEmail);
router.post('/check-phone', checkPhone);

// OTP verification routes
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTPController);
router.post('/verify-otp-login', verifyOTPAndLogin);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', resetPassword);

// Google authentication routes
router.post('/google-signup', googleSignup);
router.post('/verify-google-phone', verifyGoogleSignupPhone);

// Test login endpoint (development only)
router.post('/test-login', testLogin);

export default router;
