import { EmailClient } from '@azure/communication-email';
import { Types } from 'mongoose';
import { Notification } from '../models';
import { sendWhatsAppMessage } from './whatsapp';

type NotificationChannelState = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

interface PersistNotificationInput {
    recipientId: Types.ObjectId | string;
    recipientType: 'student' | 'recruiter' | 'college';
    title: string;
    message: string;
    notificationType: 'job_match' | 'application_status' | 'interview_reminder' | 'college_approval' | 'new_applicant' | 'system' | 'promotional';
    relatedJobId?: Types.ObjectId | string;
    relatedApplicationId?: Types.ObjectId | string;
    channels?: {
        platform?: boolean;
        email?: boolean;
        whatsapp?: boolean;
        push?: boolean;
    };
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    actionRequired?: boolean;
    actionUrl?: string;
    actionText?: string;
    metadata?: Record<string, unknown>;
    emailTo?: string;
    whatsappTo?: string;
}

const getEmailClient = (): { client: EmailClient | null; senderAddress: string | null } => {
    const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
    const senderAddress = process.env.AZURE_COMMUNICATION_EMAIL_FROM || null;

    if (!connectionString || !senderAddress) {
        return { client: null, senderAddress: null };
    }

    return { client: new EmailClient(connectionString), senderAddress };
};

const toObjectId = (value: Types.ObjectId | string | undefined): Types.ObjectId | undefined => {
    if (!value) return undefined;
    return value instanceof Types.ObjectId ? value : new Types.ObjectId(String(value));
};

export const recordNotification = async (input: PersistNotificationInput) => {
    const query: Record<string, unknown> = {
        recipientId: input.recipientId,
        notificationType: input.notificationType,
    };

    if (input.relatedJobId) {
        query.relatedJobId = input.relatedJobId;
    }

    if (input.relatedApplicationId) {
        query.relatedApplicationId = input.relatedApplicationId;
    }

    const notification = await Notification.findOneAndUpdate(
        query,
        {
            $setOnInsert: {
                recipientId: input.recipientId,
                recipientType: input.recipientType,
                title: input.title,
                message: input.message,
                notificationType: input.notificationType,
                relatedJobId: toObjectId(input.relatedJobId),
                relatedApplicationId: toObjectId(input.relatedApplicationId),
                channels: {
                    platform: input.channels?.platform ?? true,
                    email: input.channels?.email ?? false,
                    whatsapp: input.channels?.whatsapp ?? false,
                    push: input.channels?.push ?? false,
                },
                deliveryStatus: {
                    platform: 'sent' as NotificationChannelState,
                    email: input.channels?.email ? 'pending' : 'failed',
                    whatsapp: input.channels?.whatsapp ? 'pending' : 'failed',
                    push: input.channels?.push ? 'pending' : 'failed',
                },
                priority: input.priority || 'medium',
                isUrgent: input.priority === 'urgent',
                actionRequired: Boolean(input.actionRequired),
                actionUrl: input.actionUrl,
                actionText: input.actionText,
                metadata: input.metadata || {},
                sentAt: new Date(),
            },
        },
        { upsert: true, new: true }
    );

    return notification;
};

const sendEmail = async (to: string, subject: string, html: string): Promise<'sent' | 'failed'> => {
    const { client, senderAddress } = getEmailClient();
    if (!client || !senderAddress) return 'failed';

    try {
        const poller = await client.beginSend({
            senderAddress,
            recipients: { to: [{ address: to }] },
            content: { subject, html },
        });
        const result = await poller.pollUntilDone();
        return result.status === 'Succeeded' ? 'sent' : 'failed';
    } catch (error) {
        console.error('Email notification failed:', error);
        return 'failed';
    }
};

export const sendJobNotification = async (userId: string, jobId: string, message: string): Promise<void> => {
    try {
        await recordNotification({
            recipientId: userId,
            recipientType: 'student',
            title: 'Job Alert',
            message,
            notificationType: 'job_match',
            relatedJobId: jobId,
            channels: { platform: true },
            priority: 'high',
            actionRequired: true,
            actionUrl: `/jobs/${jobId}`,
            actionText: 'View Job',
        });
    } catch (error) {
        console.error('Error sending job notification:', error);
        throw error;
    }
};

export const sendWelcomeNotification = async (userId: string, userType: string): Promise<void> => {
    try {
        await recordNotification({
            recipientId: userId,
            recipientType: userType === 'college' ? 'college' : 'student',
            title: 'Welcome to CampusPe',
            message: `Your ${userType} account is now ready.`,
            notificationType: 'system',
            channels: { platform: true },
            priority: 'medium',
        });
    } catch (error) {
        console.error('Error sending welcome notification:', error);
        throw error;
    }
};

export const sendApplicationStatusNotification = async (
    userId: string,
    applicationId: string,
    status: string,
    jobTitle?: string,
    jobId?: string,
): Promise<void> => {
    try {
        await recordNotification({
            recipientId: userId,
            recipientType: 'student',
            title: 'Application Status Update',
            message: `Your application${jobTitle ? ` for ${jobTitle}` : ''} is now ${status}.`,
            notificationType: 'application_status',
            relatedApplicationId: applicationId,
            relatedJobId: jobId,
            channels: { platform: true },
            priority: 'high',
            actionRequired: false,
        });
    } catch (error) {
        console.error('Error sending application status notification:', error);
        throw error;
    }
};

export const sendRecruiterApplicationNotification = async (
    recruiterUserId: string,
    applicationId: string,
    jobId: string,
    jobTitle: string,
    companyName: string,
    candidateName: string,
    recruiterEmail?: string,
): Promise<void> => {
    const message = `${candidateName} submitted an application for ${jobTitle} at ${companyName}.`;

    await recordNotification({
        recipientId: recruiterUserId,
        recipientType: 'recruiter',
        title: `New applicant for ${jobTitle}`,
        message,
        notificationType: 'new_applicant',
        relatedApplicationId: applicationId,
        relatedJobId: jobId,
        channels: { platform: true, email: Boolean(recruiterEmail) },
        priority: 'high',
        actionRequired: true,
        actionUrl: `/recruiter/jobs/${jobId}/applications`,
        actionText: 'Review application',
        metadata: {
            candidateName,
            recruiterEmail: recruiterEmail || null,
        },
    });

    if (recruiterEmail) {
        await sendEmail(
            recruiterEmail,
            `New CampusPe application received for ${jobTitle}`,
            `<p>${candidateName} applied for <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p><p>Review it inside CampusPe.</p>`
        );
    }
};

export const sendJobMatchWhatsApp = async (phoneNumber: string, message: string): Promise<'sent' | 'failed'> => {
    const result = await sendWhatsAppMessage(phoneNumber, message, 'jobs');
    return result.success ? 'sent' : 'failed';
};
