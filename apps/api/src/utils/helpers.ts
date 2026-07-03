// Helper utilities for CampusPe API

export const calculateMatchScore = (skills: any[], requirements: any[]): number => {
    // Simple matching algorithm - can be enhanced later
    if (!skills || !requirements || skills.length === 0 || requirements.length === 0) {
        return 0;
    }
    
    const skillNames = skills.map(skill => 
        typeof skill === 'string' ? skill.toLowerCase() : skill?.name?.toLowerCase() || ''
    );
    const reqNames = requirements.map(req => 
        typeof req === 'string' ? req.toLowerCase() : req?.toLowerCase?.() || ''
    );
    
    const matches = skillNames.filter(skill => 
        reqNames.some(req => req.includes(skill) || skill.includes(req))
    );
    
    return (matches.length / requirements.length) * 100;
};

export const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present
    if (cleaned.length === 10) {
        return `+91${cleaned}`;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
        return `+${cleaned}`;
    } else if (cleaned.length === 13 && cleaned.startsWith('+91')) {
        return cleaned;
    }
    
    return phone; // Return as-is if format is unclear
};

export const generateUniqueId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
};
