// Mock WhatsApp Service for Testing
// This will simulate successful WhatsApp delivery for testing purposes

interface MockWhatsAppResponse {
    success: boolean;
    data: {
        messageId: string;
        status: string;
        phone: string;
    };
    phone: string;
    message: string;
    mock: boolean;
}

const mockWhatsAppService = {
    async sendMessage(phone: string, message: string, serviceType: string = 'general'): Promise<MockWhatsAppResponse> {
        console.log('📱 MOCK WhatsApp Service - Message would be sent to:', {
            phone: phone,
            message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
            serviceType: serviceType,
            timestamp: new Date().toISOString()
        });
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
            success: true,
            data: {
                messageId: `mock_${Date.now()}`,
                status: 'sent',
                phone: phone
            },
            phone: phone,
            message: message,
            mock: true
        };
    },

    async sendOTP(phone: string, otp: string): Promise<MockWhatsAppResponse> {
        const message = `Your CampusPe verification code is: ${otp}. This code is valid for 10 minutes.`;
        return await this.sendMessage(phone, message, 'otp');
    },

    async sendJobNotification(phone: string, jobTitle: string, companyName: string): Promise<MockWhatsAppResponse> {
        const message = `🚀 New job opportunity: ${jobTitle} at ${companyName}. Check your CampusPe dashboard for details!`;
        return await this.sendMessage(phone, message, 'jobs');
    },

    async sendResumeNotification(phone: string, jobTitle: string, companyName: string, resumeUrl: string): Promise<MockWhatsAppResponse> {
        const message = `✅ Your AI-powered resume for ${jobTitle} at ${companyName} is ready! Download: ${resumeUrl}`;
        return await this.sendMessage(phone, message, 'resume');
    }
};

export default mockWhatsAppService;
