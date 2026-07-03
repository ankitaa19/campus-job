// Type definitions for CampusPe API

export interface ResumeData {
    personalInfo: {
        name: string;
        email: string;
        phone: string;
        address?: string;
    };
    education: Array<{
        degree: string;
        institution: string;
        year: string;
        grade?: string;
    }>;
    experience: Array<{
        title: string;
        company: string;
        duration: string;
        description: string;
    }>;
    skills: string[];
    projects?: Array<{
        name: string;
        description: string;
        technologies: string[];
    }>;
    certifications?: string[];
    languages?: string[];
}

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}

export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface SearchFilters {
    location?: string;
    jobType?: string;
    experienceLevel?: string;
    salary?: {
        min: number;
        max: number;
    };
}
