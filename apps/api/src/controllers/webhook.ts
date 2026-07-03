import { Request, Response } from 'express';
import { sendWhatsAppMessage, verifyWhatsAppOTP } from '../services/whatsapp';
import { User } from '../models/User';
import { Student } from '../models/Student';
import { College } from '../models/College';
import { Recruiter } from '../models/Recruiter';
import { Job } from '../models/Job';
import { Application } from '../models/Application';
import { OTPVerification } from '../models/OTPVerification';

const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
const WABB_WEBHOOK_TOKEN = process.env.WABB_WEBHOOK_TOKEN;

// Handle WABB.in webhook automation - OTP verification flow
const handleWABBWebhook = async (req: Request, res: Response) => {
    try {
        const { Phone, Name, OTP, UserType, Purpose, Timestamp, Action } = req.body;

        // Verify webhook token if configured
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (WABB_WEBHOOK_TOKEN && token !== WABB_WEBHOOK_TOKEN) {
            return res.status(401).json({ error: 'Unauthorized webhook request' });
        }

        console.log('WABB Webhook received:', req.body);

        // Normalize phone number to 10 digits
        const normalizedPhone = normalizePhoneNumber(Phone);
        console.log(`Phone normalized: ${Phone} -> ${normalizedPhone}`);

        // Handle different webhook purposes
        switch (Purpose) {
            case 'verification':
                // This is triggered when we send OTP data to WABB
                // WABB will automatically send the OTP message to WhatsApp
                console.log(`OTP ${OTP} sent to ${normalizedPhone} via WABB automation`);
                break;

            case 'otp_response':
                // This is triggered when user responds with OTP via WhatsApp
                if (Action === 'verify_otp' && OTP) {
                    await handleOTPVerificationResponse(normalizedPhone, OTP);
                }
                break;

            case 'user_message':
                // Handle general user messages
                await handleIncomingUserMessage(normalizedPhone, req.body.Message || '', Name);
                break;

            default:
                console.log('Unknown webhook purpose:', Purpose);
        }

        res.status(200).json({ status: 'success', message: 'Webhook processed' });

    } catch (error) {
        console.error('WABB Webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Normalize phone number to 10 digits
function normalizePhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) return '';
    
    // Remove all non-digit characters
    const digitsOnly = phoneNumber.replace(/[^\d]/g, '');
    
    // If the number starts with country code (91 for India), remove it
    if (digitsOnly.startsWith('91') && digitsOnly.length === 12) {
        return digitsOnly.slice(2);
    }
    
    // If the number starts with +91, it should already be handled above
    // If the number starts with 0, remove the leading 0
    if (digitsOnly.startsWith('0') && digitsOnly.length === 11) {
        return digitsOnly.slice(1);
    }
    
    // Return the last 10 digits if the number is longer than 10
    if (digitsOnly.length > 10) {
        return digitsOnly.slice(-10);
    }
    
    // Return as is if already 10 digits or less
    return digitsOnly;
}

// Handle OTP verification response from WhatsApp
async function handleOTPVerificationResponse(phoneNumber: string, otpCode: string) {
    try {
        // Normalize phone number
        const normalizedPhone = normalizePhoneNumber(phoneNumber);
        
        // Find the most recent unverified OTP for this phone number
        const otpRecord = await OTPVerification.findOne({
            $or: [
                { phoneNumber: normalizedPhone },
                { whatsappNumber: normalizedPhone },
                { phoneNumber: phoneNumber }, // Also check original format
                { whatsappNumber: phoneNumber }
            ],
            isVerified: false,
            otpExpiry: { $gt: new Date() }
        }).sort({ createdAt: -1 });

        if (!otpRecord) {
            await sendWhatsAppMessage(normalizedPhone, 
                "❌ No valid OTP found or OTP has expired.\n\nPlease request a new OTP from the registration page.\n\n- CampusPe Team"
            );
            return;
        }

        // Verify the OTP
        const verificationResult = await verifyWhatsAppOTP(otpRecord._id.toString(), otpCode);

        if (verificationResult.success) {
            // Send success message with next steps
            const successMessage = `✅ Phone number verified successfully!\n\nYou can now complete your registration at:\nhttps://campuspe.com/register/student\n\nUse verification ID: ${otpRecord._id}\n\n- CampusPe Team`;
            await sendWhatsAppMessage(normalizedPhone, successMessage);
        } else {
            await sendWhatsAppMessage(normalizedPhone, `❌ ${verificationResult.message}\n\n- CampusPe Team`);
        }

    } catch (error) {
        console.error('OTP verification response error:', error);
        const normalizedPhone = normalizePhoneNumber(phoneNumber);
        await sendWhatsAppMessage(normalizedPhone, 
            "❌ Verification error. Please try again or contact support.\n\n- CampusPe Team"
        );
    }
}

// Handle incoming user messages (for general chat)
async function handleIncomingUserMessage(phoneNumber: string, message: string, userName?: string) {
    try {
        // Normalize phone number
        const normalizedPhone = normalizePhoneNumber(phoneNumber);
        const messageBody = message.toLowerCase();

        // Check if user is sending an OTP (6-digit number)
        const otpMatch = messageBody.match(/\b\d{6}\b/);
        if (otpMatch) {
            await handleOTPVerificationResponse(normalizedPhone, otpMatch[0]);
            return;
        }

        // Check if this is a resume-related message
        if (messageBody.includes('resume') || messageBody.includes('cv') || 
            messageBody.includes('job') || messageBody.includes('@') ||
            messageBody.includes('start')) {
            
            // Import and use the enhanced WhatsApp Resume Flow
            const { WhatsAppResumeFlow } = await import('../services/whatsapp-resume-flow');
            await WhatsAppResumeFlow.handleIncomingMessage(normalizedPhone, message, userName);
            return;
        }

        // Find user by phone number (check both normalized and original)
        const user = await User.findOne({
            $or: [
                { phone: normalizedPhone },
                { whatsappNumber: normalizedPhone },
                { phone: phoneNumber },
                { whatsappNumber: phoneNumber }
            ]
        }).populate('role');

        if (!user) {
            // New user - send welcome message with resume option
            await sendWhatsAppMessage(normalizedPhone, 
                `👋 Welcome to CampusPe!\n\nI'm your AI assistant. I can help you with:\n\n📄 **Resume Building** - Type "resume" to create tailored resumes\n💼 **Job Search** - Type "jobs" to find opportunities\n🎓 **Profile Help** - Type "profile" for account assistance\n\n🚀 **Quick Start:** Type "resume" to create a job-specific resume!\n\n🔗 Visit CampusPe.com to create your account`
            );
            return;
        }

        // Route message based on user type and content
        await routeMessage(user, messageBody, 'text', phoneNumber);

    } catch (error) {
        console.error('Error handling user message:', error);
        await sendWhatsAppMessage(phoneNumber, 
            "Sorry, I encountered an error processing your message. Please try again.\n\n- CampusPe Team"
        );
    }
}

// WhatsApp helper functions
const sendProfileInfo = async (phoneNumber: string, student: any) => {
    const message = `📊 Your Profile:\n\nName: ${student.firstName || 'N/A'}\nSkills: ${student.skills?.map((s: any) => s.name).join(', ') || 'None'}\nExperience: ${student.experience?.length || 0} entries`;
    await sendWhatsAppMessage(phoneNumber, message);
};

const sendStudentMenu = async (phoneNumber: string, name: string) => {
    const message = `Hello ${name}! 👋\n\nWhat would you like to do?\n1. View Profile\n2. Search Jobs\n3. View Applications\n4. Help`;
    await sendWhatsAppMessage(phoneNumber, message);
};

const sendCandidatesSummary = async (phoneNumber: string, recruiter: any) => {
    const message = `📈 Candidates Summary:\n\nActive applications: 0\nPending reviews: 0\nShortlisted: 0`;
    await sendWhatsAppMessage(phoneNumber, message);
};

const sendJobPostingInstructions = async (phoneNumber: string) => {
    const message = `📝 To post a job:\n1. Visit our portal\n2. Fill job details\n3. Set requirements\n4. Publish`;
    await sendWhatsAppMessage(phoneNumber, message);
};

const sendRecruiterDashboard = async (phoneNumber: string, recruiter: any) => {
    const message = `🏢 Recruiter Dashboard:\n\nCompany: ${recruiter.companyName || 'N/A'}\nActive Jobs: 0\nApplications: 0`;
    await sendWhatsAppMessage(phoneNumber, message);
};

const sendStudentsSummary = async (phoneNumber: string, college: any) => {
    const message = `🎓 Students Summary:\n\nTotal students: 0\nPlaced: 0\nActive applications: 0`;
    await sendWhatsAppMessage(phoneNumber, message);
};

const sendPlacementStats = async (phoneNumber: string, college: any) => {
    const message = `📊 Placement Statistics:\n\nPlacement rate: 0%\nAverage package: ₹0\nTop recruiter: N/A`;
    await sendWhatsAppMessage(phoneNumber, message);
};

const sendVerificationInstructions = async (phoneNumber: string) => {
    const message = `✅ Verification Instructions:\n1. Submit documents\n2. Wait for review\n3. Get verified status`;
    await sendWhatsAppMessage(phoneNumber, message);
};

// Webhook verification for WhatsApp
const verifyWebhook = (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
        console.log('WhatsApp webhook verified');
        res.status(200).send(challenge);
    } else {
        console.log('WhatsApp webhook verification failed');
        res.status(403).send('Forbidden');
    }
};

// Handle incoming WhatsApp messages
const handleWebhook = async (req: Request, res: Response) => {
    try {
        const body = req.body;

        if (body.object === 'whatsapp_business_account') {
            body.entry?.forEach(async (entry: any) => {
                const changes = entry.changes;
                
                changes?.forEach(async (change: any) => {
                    if (change.field === 'messages') {
                        const value = change.value;
                        
                        if (value.messages) {
                            for (const message of value.messages) {
                                await processIncomingMessage(message, value.contacts?.[0]);
                            }
                        }
                    }
                });
            });
        }

        res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
        console.error('Webhook handling error:', error);
        res.status(500).send('Internal Server Error');
    }
};

// Process incoming WhatsApp messages
async function processIncomingMessage(message: any, contact: any) {
    try {
        const phoneNumber = message.from;
        const messageBody = message.text?.body?.toLowerCase() || '';
        const messageType = message.type;

        // Find user by phone number
        const user = await User.findOne({
            $or: [
                { phone: phoneNumber },
                { whatsappNumber: phoneNumber }
            ]
        }).populate('role');

        if (!user) {
            await sendWelcomeMessage(phoneNumber, contact?.profile?.name || 'User');
            return;
        }

        // Route message based on user type and content
        await routeMessage(user, messageBody, messageType, phoneNumber);

    } catch (error) {
        console.error('Error processing message:', error);
    }
}

// Send welcome message to new users
async function sendWelcomeMessage(phoneNumber: string, userName: string) {
    const welcomeMessage = `
🎓 Welcome to CampusPe Platform, ${userName}!

I'm your career assistant. Here's how I can help you:

📋 *For Students:*
• Type "jobs" - View latest job opportunities
• Type "applications" - Check your application status
• Type "profile" - Update your profile

🏢 *For Recruiters:*
• Type "post job" - Post new job opportunities
• Type "candidates" - View potential candidates
• Type "dashboard" - Access your dashboard

🎓 *For Colleges:*
• Type "students" - Manage student profiles
• Type "placements" - View placement statistics
• Type "verify" - Verify student credentials

💡 *Quick Actions:*
• Type "help" - Get help
• Type "contact" - Contact support

To get started, please register at: https://campuspe.com

How can I assist you today?
    `;

    await sendWhatsAppMessage(phoneNumber, welcomeMessage.trim());
}

// Route messages based on user type and content
async function routeMessage(user: any, messageBody: string, messageType: string, phoneNumber: string) {
    const userRole = user.role;

    // Common commands for all users
    if (messageBody.includes('help')) {
        await sendHelpMessage(phoneNumber, userRole);
        return;
    }

    if (messageBody.includes('contact') || messageBody.includes('support')) {
        await sendContactInfo(phoneNumber);
        return;
    }

    // Role-specific routing
    switch (userRole) {
        case 'student':
            await handleStudentMessage(user, messageBody, phoneNumber);
            break;
        case 'recruiter':
            await handleRecruiterMessage(user, messageBody, phoneNumber);
            break;
        case 'college':
            await handleCollegeMessage(user, messageBody, phoneNumber);
            break;
        default:
            await sendWhatsAppMessage(phoneNumber, "I'm sorry, I couldn't understand your message. Type 'help' for assistance.");
    }
}

// Handle student messages
async function handleStudentMessage(user: any, messageBody: string, phoneNumber: string) {
   try {
        const student = await Student.findOne({ userId: user._id }).populate('collegeId');

        if (messageBody.includes('jobs') || messageBody.includes('opportunities')) {
            await sendLatestJobs(phoneNumber, student);
        } else if (messageBody.includes('applications') || messageBody.includes('status')) {
            await sendApplicationStatus(phoneNumber, student);
        } else if (messageBody.includes('profile')) {
            await sendProfileInfo(phoneNumber, student);
        } else {
            await sendStudentMenu(phoneNumber, student?.firstName || 'Student');
        }
    } catch (error) {
        console.error('Error handling student message:', error);
        await sendWhatsAppMessage(phoneNumber, "Sorry, I encountered an error. Please try again later.");
    }
}

// Handle recruiter messages
async function handleRecruiterMessage(user: any, messageBody: string, phoneNumber: string) {
    try {
        const recruiter = await Recruiter.findOne({ userId: user._id });

        if (messageBody.includes('candidates') || messageBody.includes('students')) {
            await sendCandidatesSummary(phoneNumber, recruiter);
        } else if (messageBody.includes('post') && messageBody.includes('job')) {
            await sendJobPostingInstructions(phoneNumber);
        } else if (messageBody.includes('dashboard') || messageBody.includes('analytics')) {
            await sendRecruiterDashboard(phoneNumber, recruiter);
        } else {
            await sendRecruiterMenu(phoneNumber, recruiter?.recruiterProfile?.firstName || 'Recruiter');
        }
    } catch (error) {
        console.error('Error handling recruiter message:', error);
        await sendWhatsAppMessage(phoneNumber, "Sorry, I encountered an error. Please try again later.");
    }
}

// Handle college messages
async function handleCollegeMessage(user: any, messageBody: string, phoneNumber: string) {
    try {
        const college = await College.findOne({ userId: user._id });

        if (messageBody.includes('students') || messageBody.includes('manage')) {
            await sendStudentsSummary(phoneNumber, college);
        } else if (messageBody.includes('placements') || messageBody.includes('statistics')) {
            await sendPlacementStats(phoneNumber, college);
        } else if (messageBody.includes('verify')) {
            await sendVerificationInstructions(phoneNumber);
        } else {
            await sendCollegeMenu(phoneNumber, college?.name || 'College');
        }
    } catch (error) {
        console.error('Error handling college message:', error);
        await sendWhatsAppMessage(phoneNumber, "Sorry, I encountered an error. Please try again later.");
    }
}

// Send help message based on user role
async function sendHelpMessage(phoneNumber: string, userRole: string) {
    let helpMessage = '';

    switch (userRole) {
        case 'student':
            helpMessage = `
🎓 *Student Help Menu*

📋 Available Commands:
• "jobs" - View latest job opportunities
• "applications" - Check application status
• "profile" - View/update profile
• "help" - Show this menu
• "contact" - Contact support

🔍 Quick Tips:
• Keep your profile updated
• Apply to relevant jobs quickly
• Check application status regularly

Need more help? Visit: https://campuspe.com/help
            `;
            break;
        case 'recruiter':
            helpMessage = `
🏢 *Recruiter Help Menu*

📋 Available Commands:
• "candidates" - View potential candidates
• "post job" - Instructions to post jobs
• "dashboard" - View your dashboard
• "help" - Show this menu
• "contact" - Contact support

🔍 Quick Tips:
• Post detailed job descriptions
• Review candidate profiles thoroughly
• Provide timely feedback to applicants

Need more help? Visit: https://campuspe.com/help
            `;
            break;
        case 'college':
            helpMessage = `
🎓 *College Help Menu*

📋 Available Commands:
• "students" - Manage student profiles
• "placements" - View placement statistics
• "verify" - Student verification process
• "help" - Show this menu
• "contact" - Contact support

🔍 Quick Tips:
• Keep student data updated
• Monitor placement activities
• Assist students with profile verification

Need more help? Visit: https://campuspe.com/help
            `;
            break;
        default:
            helpMessage = `
💡 *General Help*

Please register at https://campuspe.com to access role-specific features.

For immediate assistance, contact our support team.
            `;
    }

    await sendWhatsAppMessage(phoneNumber, helpMessage.trim());
}

// Send contact information
async function sendContactInfo(phoneNumber: string) {
    const contactMessage = `
📞 *Contact Support*

🕐 Available 24/7

📧 Email: support@campuspe.com
📱 WhatsApp: You're already here!
🌐 Website: https://campuspe.com
💬 Live Chat: Available on our website

What can we help you with today?
    `;

    await sendWhatsAppMessage(phoneNumber, contactMessage.trim());
}

// Send latest jobs to students
async function sendLatestJobs(phoneNumber: string, student: any) {
    try {
        const jobs = await Job.find({ status: 'active' })
            .limit(5)
            .sort({ createdAt: -1 })
            .select('title companyName salary locations requirements applicationDeadline');

        if (jobs.length === 0) {
            await sendWhatsAppMessage(phoneNumber, "No active job opportunities at the moment. We'll notify you when new jobs are posted!");
            return;
        }

        let jobsMessage = "🚀 *Latest Job Opportunities*\n\n";

        jobs.forEach((job, index) => {
            jobsMessage += `${index + 1}. *${job.title}*\n`;
            jobsMessage += `🏢 ${job.companyName}\n`;
            if (job.salary?.min) {
                jobsMessage += `💰 ₹${job.salary.min}${job.salary.max ? ` - ₹${job.salary.max}` : '+'}\n`;
            }
            jobsMessage += `📍 ${job.locations?.[0]?.city || 'Multiple locations'}\n`;
            jobsMessage += `⏰ Apply by: ${new Date(job.applicationDeadline).toLocaleDateString()}\n\n`;
        });

        jobsMessage += "🔗 View and apply: https://campuspe.com/jobs\n";
        jobsMessage += "💡 Type 'applications' to check your application status";

        await sendWhatsAppMessage(phoneNumber, jobsMessage);
    } catch (error) {
        console.error('Error sending jobs:', error);
        await sendWhatsAppMessage(phoneNumber, "Sorry, I couldn't fetch job listings right now. Please try again later.");
    }
}

// Send application status to students
async function sendApplicationStatus(phoneNumber: string, student: any) {
    try {
        const applications = await Application.find({ studentId: student._id })
            .populate('jobId', 'title companyName')
            .sort({ createdAt: -1 })
            .limit(5);

        if (applications.length === 0) {
            await sendWhatsAppMessage(phoneNumber, "You haven't applied to any jobs yet. Type 'jobs' to see available opportunities!");
            return;
        }

        let statusMessage = "📋 *Your Application Status*\n\n";

        applications.forEach((app, index) => {
            const job = app.jobId as any;
            statusMessage += `${index + 1}. *${job.title}* at ${job.companyName}\n`;
            statusMessage += `📊 Status: ${app.currentStatus.toUpperCase()}\n`;
            statusMessage += `📅 Applied: ${new Date(app.appliedAt).toLocaleDateString()}\n\n`;
        });

        statusMessage += "🔗 View details: https://campuspe.com/dashboard";

        await sendWhatsAppMessage(phoneNumber, statusMessage);
    } catch (error) {
        console.error('Error sending application status:', error);
        await sendWhatsAppMessage(phoneNumber, "Sorry, I couldn't fetch your application status right now. Please try again later.");
    }
}

// Send recruiter menu
async function sendRecruiterMenu(phoneNumber: string, firstName: string) {
    const menuMessage = `
🏢 Hello ${firstName}! How can I assist you today?

📋 *Quick Actions:*
• Type "candidates" - View potential candidates
• Type "post job" - Get job posting instructions
• Type "dashboard" - View your analytics

💡 *Need Help?*
• Type "help" - Get detailed help
• Type "contact" - Contact support

🔗 Access your dashboard: https://campuspe.com/dashboard/recruiter
    `;

    await sendWhatsAppMessage(phoneNumber, menuMessage.trim());
}

// Send college menu
async function sendCollegeMenu(phoneNumber: string, collegeName: string) {
    const menuMessage = `
🎓 Hello ${collegeName}! How can I help you today?

📋 *Quick Actions:*
• Type "students" - Manage student profiles
• Type "placements" - View placement statistics
• Type "verify" - Student verification help

💡 *Need Help?*
• Type "help" - Get detailed help
• Type "contact" - Contact support

🔗 Access your dashboard: https://campuspe.com/dashboard/college
    `;

    await sendWhatsAppMessage(phoneNumber, menuMessage.trim());
}

// Export all functions
export {
    handleWABBWebhook,
    verifyWebhook,
    handleWebhook
};
