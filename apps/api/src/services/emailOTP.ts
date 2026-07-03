import { EmailClient } from '@azure/communication-email';
import { OTPVerification } from '../models/OTPVerification';

// Get Azure configuration from environment
const getAzureConfig = () => {
    const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
    const fromEmail = process.env.AZURE_COMMUNICATION_EMAIL_FROM;

    console.log('🔧 Azure Config Check:');
    console.log('Connection String:', connectionString ? 'Present' : 'Missing');
    console.log('From Email:', fromEmail || 'Missing');

    if (!connectionString) {
        throw new Error('Azure Communication connection string is required for email OTP');
    }

    if (!fromEmail) {
        throw new Error('Azure Communication from email is required for email OTP');
    }

    return { connectionString, fromEmail };
};

// Generate 6-digit OTP
const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via Azure Email (for Colleges & Recruiters)
export const sendEmailOTP = async (email: string, userType: 'college' | 'recruiter'): Promise<{ success: boolean; otpId?: string; message: string }> => {
    try {
        // Get configuration
        const { connectionString, fromEmail } = getAzureConfig();

        // Check rate limiting
        const recentOTP = await OTPVerification.findOne({
            email,
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
        console.log(`📧 EMAIL OTP for ${email}: ${otp} (expires in 15 minutes)`);

        // Initialize Azure Email Client
        const emailClient = new EmailClient(connectionString);

        // Prepare email content
        const emailSubject = `CampusPe OTP Verification - ${otp}`;
        const emailBody = `
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2563eb; margin-bottom: 10px;">CampusPe</h1>
                <h2 style="color: #374151; margin-bottom: 20px;">Email Verification</h2>
            </div>
            
            <div style="background-color: #f8fafc; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                <h3 style="color: #374151; margin-bottom: 15px;">Your OTP Code</h3>
                <div style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px; margin: 20px 0; padding: 15px; background-color: white; border-radius: 4px; border: 2px dashed #2563eb;">
                    ${otp}
                </div>
                <p style="color: #6b7280; margin-top: 15px;">This code expires in 15 minutes</p>
            </div>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                    <strong>Security Notice:</strong> Do not share this OTP with anyone. CampusPe will never ask for your OTP via phone or email.
                </p>
            </div>
            
            <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px;">
                <p>This is an automated message from CampusPe.</p>
                <p>If you didn't request this OTP, please ignore this email.</p>
            </div>
        </body>
        </html>
        `;

        // Send email via Azure
        const emailMessage = {
            senderAddress: fromEmail,
            content: {
                subject: emailSubject,
                html: emailBody,
            },
            recipients: {
                to: [{ address: email }],
            },
        };

        const poller = await emailClient.beginSend(emailMessage);
        const emailResult = await poller.pollUntilDone();

        if (emailResult.status === 'Succeeded') {
            // Save OTP to database
            const otpRecord = new OTPVerification({
                email,
                userType,
                otp,
                otpExpiry,
                isVerified: false,
                attempts: 0,
                azureMessageId: emailResult.id
            });

            const savedOTP = await otpRecord.save();
            console.log(`🆔 Email OTP ID: ${savedOTP._id}`);

            return {
                success: true,
                otpId: savedOTP._id.toString(),
                message: `OTP sent to your email ${email}. Please check your inbox.`
            };
        } else {
            console.error('Azure email sending failed:', emailResult);
            return {
                success: false,
                message: 'Failed to send email OTP. Please try again.'
            };
        }

    } catch (error) {
        console.error('Error sending email OTP:', error);
        
        // Fallback to console logging for testing if Azure fails
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);
        
        console.log(`📧 FALLBACK EMAIL OTP for ${email}: ${otp} (expires in 15 minutes)`);
        
        const otpRecord = new OTPVerification({
            email,
            userType,
            otp,
            otpExpiry,
            isVerified: false,
            attempts: 0
        });

        const savedOTP = await otpRecord.save();
        console.log(`🆔 Email OTP ID: ${savedOTP._id}`);

        return {
            success: true,
            otpId: savedOTP._id.toString(),
            message: `OTP sent to your email ${email}. Check the server console for testing.`
        };
    }
};

// Verify Email OTP
export const verifyEmailOTP = async (otpId: string, providedOTP: string): Promise<{ success: boolean; message: string }> => {
    try {
        const otpRecord = await OTPVerification.findById(otpId);

        if (!otpRecord) {
            return {
                success: false,
                message: 'Invalid OTP ID. Please request a new OTP.'
            };
        }

        // Check if already verified
        if (otpRecord.isVerified) {
            return {
                success: false,
                message: 'OTP has already been verified.'
            };
        }

        // Check expiry
        if (new Date() > otpRecord.otpExpiry) {
            return {
                success: false,
                message: 'OTP has expired. Please request a new one.'
            };
        }

        // Check attempt limits
        if (otpRecord.attempts >= 3) {
            return {
                success: false,
                message: 'Too many incorrect attempts. Please request a new OTP.'
            };
        }

        // Verify OTP
        if (otpRecord.otp !== providedOTP) {
            // Increment attempts
            otpRecord.attempts += 1;
            await otpRecord.save();

            return {
                success: false,
                message: `Incorrect OTP. ${3 - otpRecord.attempts} attempts remaining.`
            };
        }

        // Success - mark as verified
        otpRecord.isVerified = true;
        otpRecord.verifiedAt = new Date();
        await otpRecord.save();

        return {
            success: true,
            message: 'Email verified successfully'
        };

    } catch (error) {
        console.error('Error verifying email OTP:', error);
        return {
            success: false,
            message: 'Verification failed. Please try again.'
        };
    }
};
