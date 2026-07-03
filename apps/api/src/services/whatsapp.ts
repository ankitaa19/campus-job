import axios from 'axios';
import { OTPVerification } from '../models/OTPVerification';

const WABB_API_URL = process.env.WABB_API_URL || 'https://api.wabb.in';
const WABB_API_KEY = process.env.WABB_API_KEY;

// Different WABB webhook URLs for different services
// WhatsApp Service Configuration with CORRECT URLs
const WABB_WEBHOOK_URLS = {
    // OTP verification webhook
    otp: process.env.WABB_WEBHOOK_URL_OTP || 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/FQavVMJ9VP7G/',
    // Job alerts webhook  
    jobs: process.env.WABB_WEBHOOK_URL_JOBS || 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/Fy4MvhulWrYT/',
    // Send resume webhook
    resume: process.env.WABB_WEBHOOK_URL_RESUME || 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/',
    // General messages and fallback webhook
    general: process.env.WABB_WEBHOOK_URL_GENERAL || 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/HJGMsTitkl8a/',
    // Forgot OTP webhook (for password reset)
    forgot: process.env.WABB_WEBHOOK_URL_FORGOT || 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/4nVuxt446PLJ/',
    // Primary fallback (use general)
    primary: process.env.WABB_WEBHOOK_URL_GENERAL || 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/HJGMsTitkl8a/',
    // Test webhook (use general)
    test: process.env.WABB_WEBHOOK_URL_GENERAL || 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/HJGMsTitkl8a/',
    // Final fallback
    fallback: 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/HJGMsTitkl8a/'
};

console.log('WABB Webhook URLs configured:', {
    otp: WABB_WEBHOOK_URLS.otp,
    jobs: WABB_WEBHOOK_URLS.jobs,
    resume: WABB_WEBHOOK_URLS.resume,
    general: WABB_WEBHOOK_URLS.general,
    env_webhook: process.env.WABB_WEBHOOK_URL,
    env_test_webhook: process.env.WABB_TEST_WEBHOOK_URL
});

// Get appropriate webhook URL for service type
const getWebhookUrl = (serviceType: 'otp' | 'jobs' | 'resume' | 'general' | 'forgot' = 'general') => {
    return WABB_WEBHOOK_URLS[serviceType] || WABB_WEBHOOK_URLS.general || WABB_WEBHOOK_URLS.otp;
};

// Send WhatsApp message via WABB.in webhook automation
export const sendWhatsAppMessage = async (to: string, message: string, serviceType: 'otp' | 'jobs' | 'resume' | 'general' | 'forgot' = 'general') => {
    try {
        console.log('🚀 WhatsApp Service Called:', {
            to: to,
            messageLength: message.length,
            serviceType: serviceType,
            timestamp: new Date().toISOString()
        });
        
        // Get the appropriate webhook URL for the service type
        const webhookUrl = getWebhookUrl(serviceType);
        
        console.log('📱 WhatsApp Service Debug:', {
            serviceType,
            requestedUrl: WABB_WEBHOOK_URLS[serviceType],
            fallbackUrl: WABB_WEBHOOK_URLS.general || WABB_WEBHOOK_URLS.fallback,
            finalUrl: webhookUrl,
            envVars: {
                WABB_WEBHOOK_URL: !!process.env.WABB_WEBHOOK_URL,
                WABB_WEBHOOK_URL_RESUME: !!process.env.WABB_WEBHOOK_URL_RESUME,
                WABB_WEBHOOK_URL_GENERAL: !!process.env.WABB_WEBHOOK_URL_GENERAL,
                WABB_API_KEY: !!process.env.WABB_API_KEY
            }
        });
        
        if (!webhookUrl) {
            console.log('❌ No webhook URL configured for WhatsApp service');
            console.log(`📱 WhatsApp message to ${to}: ${message}`);
            return { success: false, message: 'WhatsApp webhook not configured' };
        }

        // Format phone number (remove any non-digits)
        const formattedPhone = to.replace(/[^\d]/g, '');
        
        // Prepare webhook data as query parameters
        const queryParams = new URLSearchParams({
            Phone: formattedPhone,
            Message: message
        });

        // Construct URL with query parameters
        // Try multiple URL formats for better compatibility
        const urlFormats = [
            webhookUrl,
            WABB_WEBHOOK_URLS.general,
            WABB_WEBHOOK_URLS.fallback
        ];

        let lastError: any = null;

        for (const url of urlFormats) {
            try {
                console.log('Attempting WhatsApp message via WABB webhook:', {
                    url: url,
                    phone: formattedPhone,
                    serviceType: serviceType,
                    method: 'POST'
                });

                // Try POST method first (like the working generated-resume route)
                const response = await axios.post(url, {
                    phone: formattedPhone,
                    message: message
                }, {
                    timeout: 30000, // 30 second timeout
                    headers: {
                        'User-Agent': 'CampusPe-WhatsApp-Service/1.0',
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });

                console.log('WhatsApp webhook response:', {
                    status: response.status,
                    data: response.data,
                    url: url,
                    method: 'POST'
                });

                return {
                    success: true,
                    data: response.data,
                    phone: formattedPhone,
                    message: message,
                    url: url,
                    method: 'POST'
                };
            } catch (error: any) {
                console.log(`WhatsApp webhook POST failed for URL ${url}:`, {
                    error: error.message,
                    status: error.response?.status,
                    data: error.response?.data
                });
                
                // If POST fails, try GET method as fallback
                try {
                    const webhookUrlWithParams = `${url}?phone=${formattedPhone}&message=${encodeURIComponent(message)}`;
                    
                    console.log('Attempting GET fallback for WhatsApp webhook:', {
                        url: url,
                        fullUrl: webhookUrlWithParams,
                        method: 'GET'
                    });

                    const response = await axios.get(webhookUrlWithParams, {
                        timeout: 30000,
                        headers: {
                            'User-Agent': 'CampusPe-WhatsApp-Service/1.0',
                            'Accept': 'application/json'
                        }
                    });

                    console.log('WhatsApp webhook GET response:', {
                        status: response.status,
                        data: response.data,
                        url: url,
                        method: 'GET'
                    });

                    return {
                        success: true,
                        data: response.data,
                        phone: formattedPhone,
                        message: message,
                        url: url,
                        method: 'GET'
                    };
                } catch (getError: any) {
                    lastError = getError;
                    console.log(`WhatsApp webhook GET also failed for URL ${url}:`, {
                        error: getError.message,
                        status: getError.response?.status,
                        data: getError.response?.data
                    });
                    
                    // Continue to next URL format if both POST and GET fail
                    continue;
                }
            }
        }

        // If all URL formats failed, throw the last error
        throw lastError;
        
    } catch (error) {
        console.error('WhatsApp webhook send error:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to send WhatsApp message' 
        };
    }
};

// Send OTP via WhatsApp using WABB webhook automation
export const sendWhatsAppOTP = async (phoneNumber: string, userType: 'student' | 'college' | 'recruiter' = 'student', name?: string) => {
    try {
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save OTP to database
        const otpVerification = new OTPVerification({
            phoneNumber: phoneNumber,
            whatsappNumber: phoneNumber,
            userType: userType,
            otp: otp,
            otpExpiry: otpExpiry,
            isVerified: false,
            attempts: 0,
            maxAttempts: 3
        });

        const savedOTP = await otpVerification.save();

        // Send OTP via WABB webhook automation
        const otpWebhookUrl = getWebhookUrl('otp');
        if (otpWebhookUrl) {
            try {
                // Format phone number (remove any non-digits)
                const formattedPhone = phoneNumber.replace(/[^\d]/g, '');
                
                console.log('🚀 Sending OTP via WABB.in webhook:', {
                    url: otpWebhookUrl,
                    phone: formattedPhone,
                    name: name ? name : `User_${phoneNumber.slice(-4)}`
                });

                // Try multiple webhook formats for better compatibility
                const webhookAttempts = [
                    // Format 1: GET with query parameters
                    {
                        method: 'GET' as const,
                        url: otpWebhookUrl,
                        params: {
                            Phone: formattedPhone,
                            Name: name ? name : `User_${phoneNumber.slice(-4)}`,
                            OTP: otp
                        }
                    },
                    // Format 2: POST with JSON body
                    {
                        method: 'POST' as const,
                        url: otpWebhookUrl,
                        data: {
                            phone: formattedPhone,
                            name: name ? name : `User_${phoneNumber.slice(-4)}`,
                            otp: otp,
                            message: `Your CampusPe verification code is: ${otp}. This code is valid for 10 minutes.`
                        }
                    },
                    // Format 3: POST with form data
                    {
                        method: 'POST' as const,
                        url: otpWebhookUrl,
                        data: new URLSearchParams({
                            Phone: formattedPhone,
                            Name: name ? name : `User_${phoneNumber.slice(-4)}`,
                            OTP: otp
                        }),
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    }
                ];

                let lastError: any = null;
                
                for (let i = 0; i < webhookAttempts.length; i++) {
                    const attempt = webhookAttempts[i];
                    
                    try {
                        console.log(`🔄 WABB Attempt ${i + 1}/${webhookAttempts.length}: ${attempt.method}`);
                        
                        let response;
                        if (attempt.method === 'GET') {
                            const queryParams = new URLSearchParams(attempt.params as any);
                            const fullUrl = `${attempt.url}?${queryParams.toString()}`;
                            response = await axios.get(fullUrl, {
                                headers: {
                                    'User-Agent': 'CampusPe-WhatsApp-Integration',
                                    ...(attempt.headers || {})
                                },
                                timeout: 15000 // 15 seconds timeout
                            });
                        } else {
                            response = await axios.post(attempt.url, attempt.data, {
                                headers: {
                                    'User-Agent': 'CampusPe-WhatsApp-Integration',
                                    'Content-Type': 'application/json',
                                    ...(attempt.headers || {})
                                },
                                timeout: 15000 // 15 seconds timeout
                            });
                        }

                        console.log(`✅ WABB Attempt ${i + 1} success:`, {
                            status: response.status,
                            statusText: response.statusText,
                            data: response.data
                        });

                        if (response.status === 200 || response.status === 201) {
                            return {
                                success: true,
                                message: 'OTP sent successfully via WhatsApp',
                                otpId: savedOTP._id.toString(),
                                expiresIn: '10 minutes',
                                method: 'whatsapp'
                            };
                        }
                        
                    } catch (attemptError) {
                        lastError = attemptError;
                        console.log(`❌ WABB Attempt ${i + 1} failed:`, {
                            status: axios.isAxiosError(attemptError) ? attemptError.response?.status : 'unknown',
                            message: attemptError instanceof Error ? attemptError.message : 'Unknown error'
                        });
                        
                        // If we get a specific error that suggests wrong format, continue to next attempt
                        if (axios.isAxiosError(attemptError) && attemptError.response?.status === 400) {
                            continue;
                        }
                        
                        // For other errors (network, timeout, etc.), break early
                        if (!axios.isAxiosError(attemptError) || attemptError.response?.status !== 400) {
                            break;
                        }
                    }
                }

                // All attempts failed
                console.error('❌ All WABB webhook attempts failed');
                if (axios.isAxiosError(lastError)) {
                    console.error('Final WABB error details:', {
                        status: lastError.response?.status,
                        statusText: lastError.response?.statusText,
                        data: lastError.response?.data,
                        message: lastError.message
                    });
                }
                
                const errorMessage = lastError instanceof Error ? lastError.message : 'All webhook formats failed';
                return {
                    success: false,
                    message: `Failed to send OTP via WABB webhook: ${errorMessage}`,
                    details: {
                        attempts: webhookAttempts.length,
                        lastError: axios.isAxiosError(lastError) ? lastError.response?.data : lastError?.message
                    }
                };

            } catch (generalError) {
                console.error('❌ General WABB webhook error:', generalError);
                return {
                    success: false,
                    message: `WABB webhook general error: ${generalError instanceof Error ? generalError.message : 'Unknown error'}`
                };
            }
        } else {
            return {
                success: false,
                message: 'WABB webhook URL not configured'
            };
        }

    } catch (error) {
        console.error('WhatsApp OTP send error:', error);
        return {
            success: false,
            message: 'Failed to send OTP via WhatsApp'
        };
    }
};

// Verify WhatsApp OTP
export const verifyWhatsAppOTP = async (otpId: string, providedOTP: string) => {
    try {
        const otpRecord = await OTPVerification.findById(otpId);

        if (!otpRecord) {
            return {
                success: false,
                message: 'Invalid OTP ID'
            };
        }

        if (otpRecord.isVerified) {
            return {
                success: false,
                message: 'OTP has already been verified'
            };
        }

        if (otpRecord.otpExpiry < new Date()) {
            return {
                success: false,
                message: 'OTP has expired'
            };
        }

        if (otpRecord.attempts >= otpRecord.maxAttempts) {
            return {
                success: false,
                message: 'Maximum verification attempts exceeded'
            };
        }

        // Increment attempts
        otpRecord.attempts += 1;
        await otpRecord.save();

        if (otpRecord.otp !== providedOTP) {
            return {
                success: false,
                message: `Invalid OTP. ${otpRecord.maxAttempts - otpRecord.attempts} attempts remaining`
            };
        }

        // Mark as verified
        otpRecord.isVerified = true;
        otpRecord.verifiedAt = new Date();
        await otpRecord.save();

        // Send success confirmation via WhatsApp
        const successMessage = `✅ Verification successful!\n\nYour phone number has been verified for CampusPe.\n\nWelcome to the platform!\n\n- CampusPe Team`
        await sendWhatsAppMessage(otpRecord.phoneNumber!, successMessage);

        return {
            success: true,
            message: 'OTP verified successfully',
            phoneNumber: otpRecord.phoneNumber,
            userType: otpRecord.userType
        };

    } catch (error) {
        console.error('WhatsApp OTP verification error:', error);
        return {
            success: false,
            message: 'Failed to verify OTP'
        };
    }
};

// Send job match notification via WABB webhook
export const sendJobMatchNotification = async (phoneNumber: string, jobData: any) => {
    try {
        console.log(`📱 Sending job match notification to ${phoneNumber}`);
        
        // Use your specific webhook URL
        const WEBHOOK_URL = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/Fy4MvhulWrYT/';
        
        // Create query parameters
        const queryParams = new URLSearchParams({
            Number: phoneNumber
        });

        // Create the webhook URL with phone number
        const webhookUrlWithParams = `${WEBHOOK_URL}?${queryParams.toString()}`;

        // Send POST request with job data
        const response = await axios.post(webhookUrlWithParams, jobData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
        });

        console.log(`✅ Job match notification sent successfully to ${phoneNumber}`);
        console.log('Webhook response:', response.status, response.data);

        return {
            success: true,
            message: 'Job match notification sent successfully',
            data: response.data
        };

    } catch (error) {
        console.error('❌ Failed to send job match notification:', error);
        
        // If axios error, get more details
        if (axios.isAxiosError(error)) {
            console.error('Webhook error details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });
        }

        return {
            success: false,
            message: `Failed to send job match notification: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
};

// Send welcome message after successful registration
export const sendWelcomeMessageAfterRegistration = async (phoneNumber: string, name: string, userType: string) => {
    try {
        let welcomeMessage = '';

        switch (userType) {
            case 'student':
                welcomeMessage = `🎓 Welcome to CampusPe, ${name}!\n\nYour student account has been successfully created. You can now:\n\n📋 Browse job opportunities\n💼 Apply for positions\n📊 Track your applications\n🔍 Build your profile\n\nStart exploring: https://campuspe.com/dashboard/student\n\nType "help" anytime for assistance.\n\n- CampusPe Team`;
                break;
            case 'recruiter':
                welcomeMessage = `🏢 Welcome to CampusPe, ${name}!\n\nYour recruiter account has been successfully created. You can now:\n\n📝 Post job opportunities\n👥 Browse student profiles\n📊 Manage applications\n🎯 Find perfect candidates\n\nStart recruiting: https://campuspe.com/dashboard/recruiter\n\nType "help" anytime for assistance.\n\n- CampusPe Team`;
                break;
            case 'college':
                welcomeMessage = `🎓 Welcome to CampusPe, ${name}!\n\nYour college account has been successfully created. You can now:\n\n👥 Manage student profiles\n📊 View placement statistics\n✅ Verify student credentials\n📈 Track placement progress\n\nAccess dashboard: https://campuspe.com/dashboard/college\n\nType "help" anytime for assistance.\n\n- CampusPe Team`;
                break;
            default:
                welcomeMessage = `🎉 Welcome to CampusPe, ${name}!\n\nYour account has been successfully created.\n\nExplore the platform: https://campuspe.com\n\n- CampusPe Team`;
        }

        await sendWhatsAppMessage(phoneNumber, welcomeMessage);
        return { success: true };

    } catch (error) {
        console.error('Welcome message error:', error);
        return { success: false };
    }
};

// Debug function to test WABB webhook with detailed logging
export const debugWABBWebhook = async (phoneNumber: string) => {
    console.log('🧪 DEBUG: Testing WABB.in webhook integration...');
    
    const otpWebhookUrl = getWebhookUrl('otp');
    if (!otpWebhookUrl) {
        console.error('❌ WABB_WEBHOOK_URL_OTP not configured');
        return { success: false, message: 'OTP Webhook URL not configured' };
    }
    
    const formattedPhone = phoneNumber.replace(/[^\d]/g, '');
    const testOtp = '123456';
    
    const queryParams = new URLSearchParams({
        Phone: formattedPhone,
        Name: 'Debug_Test',
        OTP: testOtp
    });
    
    const webhookUrlWithParams = `${otpWebhookUrl}?${queryParams.toString()}`;
    
    console.log('📤 Sending test webhook request:');
    console.log('URL:', webhookUrlWithParams.replace(testOtp, '******'));
    console.log('Method: GET');
    console.log('Query Parameters:', {
        Phone: formattedPhone,
        Name: 'Debug_Test',
        OTP: '******'
    });
    
    try {
        const response = await axios.get(webhookUrlWithParams, {
            headers: {
                'User-Agent': 'CampusPe-Debug-Test'
            },
            timeout: 30000,
            validateStatus: () => true // Accept any status code for debugging
        });
        
        console.log('📥 Webhook response received:');
        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log('Headers:', response.headers);
        console.log('Data:', response.data);
        
        return {
            success: response.status === 200 || response.status === 201,
            status: response.status,
            data: response.data,
            message: `Webhook test completed with status ${response.status}`
        };
        
    } catch (error) {
        console.error('❌ Webhook test error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};