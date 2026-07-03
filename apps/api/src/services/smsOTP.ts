import axios from 'axios';
import { OTPVerification } from '../models/OTPVerification';

const TWOFACTOR_BASE_URL = 'https://2factor.in/API/V1';

// Get API configuration
const getSMSConfig = () => {
    const apiKey = process.env.TWOFACTOR_API_KEY;
    
    // Debug logging
    console.log('DEBUG - All env vars:', Object.keys(process.env).filter(key => key.includes('TWOFACTOR')));
    console.log('DEBUG - TWOFACTOR_API_KEY value:', apiKey);
    console.log('DEBUG - NODE_ENV:', process.env.NODE_ENV);
    
    if (!apiKey) {
        throw new Error('2Factor API key is required for SMS OTP');
    }
    
    return { apiKey };
};

// Generate 6-digit OTP
const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via SMS using 2Factor (for Students)
export const sendSMSOTP = async (phoneNumber: string): Promise<{ success: boolean; otpId?: string; message: string; sessionId?: string; otp?: string }> => {
    try {
        // Get configuration
        const { apiKey } = getSMSConfig();

        // Clean phone number (remove spaces, dashes, etc.)
        const cleanedPhoneNumber = phoneNumber.replace(/[^\d+]/g, '');

        // Prevent frequent OTP requests (within 1 minute)
        const recentOTP = await OTPVerification.findOne({ 
            phoneNumber: cleanedPhoneNumber,
            userType: 'student',
            createdAt: { $gte: new Date(Date.now() - 60 * 1000) }
        });

        if (recentOTP) {
            return {
                success: false,
                message: 'Please wait at least 1 minute before requesting a new OTP.'
            };
        }

        // Generate OTP and expiry
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        
        // Debug log for testing
        console.log(`📱 SMS OTP for ${cleanedPhoneNumber}: ${otp} (expires in 15 minutes)`);
        console.log(`🆔 OTP ID will be saved to database`);

        // Send OTP via 2Factor API (SMS endpoint, not call)
        const smsUrl = `${TWOFACTOR_BASE_URL}/${apiKey}/SMS/${cleanedPhoneNumber}/${otp}/CampusPe`;
        console.log(`🔗 2Factor SMS URL: ${smsUrl}`);
        
        const response = await axios.get(smsUrl, {
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.data.Status === 'Success') {
            // Save OTP to database
            const otpRecord = new OTPVerification({
                phoneNumber: cleanedPhoneNumber,
                userType: 'student',
                otp,
                otpExpiry,
                isVerified: false,
                attempts: 0,
                sessionId: response.data.Details // 2Factor session ID
            });

            await otpRecord.save();

            return {
                success: true,
                otpId: otpRecord._id.toString(),
                sessionId: response.data.Details,
                message: 'OTP sent successfully to your mobile number',
                otp: otp
            };
        } else {
            throw new Error(response.data.Details || 'Failed to send SMS');
        }
    } catch (error) {
        console.error('Error sending SMS OTP:', error);
        
        // Handle specific 2Factor error responses
        if (axios.isAxiosError(error) && error.response) {
            const errorData = error.response.data;
            if (errorData.Status === 'Error') {
                return {
                    success: false,
                    message: errorData.Details || 'Failed to send SMS OTP'
                };
            }
        }

        return {
            success: false,
            message: 'Failed to send SMS OTP'
        };
    }
};

// Verify SMS OTP using 2Factor verification
export const verifySMSOTP = async (otpId: string, providedOTP: string): Promise<{success: boolean, message: string}> => {
    try {
        const otpRecord = await OTPVerification.findById(otpId);

        if (!otpRecord) {
            return {
                success: false,
                message: 'Invalid OTP request'
            };
        }

        if (otpRecord.isVerified) {
            return {
                success: false,
                message: 'OTP already verified'
            };
        }

        if (new Date() > otpRecord.otpExpiry) {
            return {
                success: false,
                message: 'OTP has expired'
            };
        }

        const maxAttempts = 3;
        if (otpRecord.attempts >= maxAttempts) {
            return {
                success: false,
                message: 'Maximum attempts exceeded'
            };
        }

        // Increment attempts
        otpRecord.attempts += 1;

        // Verify OTP with 2Factor API
        if (otpRecord.sessionId) {
            try {
                // Get configuration
                const { apiKey } = getSMSConfig();
                
                const verifyResponse = await axios.post(
                    `${TWOFACTOR_BASE_URL}/${apiKey}/SMS/VERIFY/${otpRecord.sessionId}/${providedOTP}`
                );

                if (verifyResponse.data.Status === 'Success' && verifyResponse.data.Details === 'OTP Matched') {
                    // OTP is correct
                    otpRecord.isVerified = true;
                    await otpRecord.save();

                    return {
                        success: true,
                        message: 'Phone number verified successfully'
                    };
                } else {
                    await otpRecord.save();
                    return {
                        success: false,
                        message: `Invalid OTP. ${maxAttempts - otpRecord.attempts} attempts remaining`
                    };
                }
            } catch (verifyError) {
                console.error('2Factor verification error:', verifyError);
                // Fallback to local verification
            }
        }

        // Fallback: Local OTP verification if 2Factor API fails
        if (otpRecord.otp !== providedOTP) {
            await otpRecord.save();
            return {
                success: false,
                message: `Invalid OTP. ${maxAttempts - otpRecord.attempts} attempts remaining`
            };
        }

        // Local OTP is correct
        otpRecord.isVerified = true;
        await otpRecord.save();

        return {
            success: true,
            message: 'Phone number verified successfully'
        };
    } catch (error) {
        console.error('Error verifying SMS OTP:', error);
        return {
            success: false,
            message: 'Failed to verify OTP'
        };
    }
};

// Get OTP verification status for students
export const getSMSOTPStatus = async (phoneNumber: string): Promise<{isVerified: boolean, otpId?: string}> => {
    try {
        const cleanedPhoneNumber = phoneNumber.replace(/[^\d+]/g, '');
        
        const otpRecord = await OTPVerification.findOne({
            phoneNumber: cleanedPhoneNumber,
            userType: 'student',
            isVerified: true
        }).sort({ createdAt: -1 });

        return {
            isVerified: !!otpRecord,
            otpId: otpRecord?._id.toString()
        };
    } catch (error) {
        console.error('Error checking SMS OTP status:', error);
        return {
            isVerified: false
        };
    }
};
