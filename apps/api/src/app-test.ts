import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'https://dev.campuspe.com'],
    credentials: true
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'CampusPe API (Test Mode)',
        mongodb: 'DISABLED for testing'
    });
});

// Mock WABB routes for testing - load dynamically
import('./routes/wabb-resume.js').then((wabbRoutes) => {
    app.use('/api/wabb', wabbRoutes.default || wabbRoutes);
}).catch(err => {
    console.log('⚠️ WABB routes not available, creating mock endpoints');
    
    // Create mock WABB endpoints if routes can't be loaded
    app.post('/api/wabb/send-resume', async (req, res) => {
        const { phone, jobTitle } = req.body;
        
        console.log('📱 Mock WABB Resume Request:', { phone, jobTitle });
        
        // Mock the resume generation and WhatsApp sending
        const mockResponse = {
            success: true,
            message: 'Resume sent successfully via WhatsApp (MOCK)',
            data: {
                phone,
                jobTitle,
                resumeGenerated: true,
                whatsappSent: true,
                mock: true,
                timestamp: new Date().toISOString()
            }
        };
        
        res.json(mockResponse);
    });
});

// Mock user route for testing
app.get('/api/user/:identifier', (req, res) => {
    const { identifier } = req.params;
    
    // Return mock user data similar to Prem's profile
    if (identifier === '919876543210' || identifier === 'prem@campuspe.com') {
        res.json({
            success: true,
            data: {
                _id: 'mock_user_id_123',
                name: 'Prem Thakare',
                email: 'prem@campuspe.com',
                phone: '919876543210',
                profile: {
                    skills: [
                        { name: 'Search Engine Optimization (SEO)', level: 'advanced', category: 'technical' },
                        { name: 'Search Engine Marketing (SEM)', level: 'advanced', category: 'technical' },
                        { name: 'Social Media Marketing', level: 'intermediate', category: 'technical' },
                        { name: 'Content Marketing', level: 'intermediate', category: 'technical' },
                        { name: 'Google Analytics', level: 'intermediate', category: 'technical' },
                        { name: 'Google Ads', level: 'intermediate', category: 'technical' }
                    ],
                    education: [{
                        degree: 'B.Tech',
                        field: 'Computer Science and Engineering',
                        institution: 'University',
                        year: '2024'
                    }],
                    experience: [{
                        title: 'Software Development & Engineering Intern',
                        company: 'Tech Company',
                        duration: '2023-2024',
                        description: 'Worked on web application development and engineering projects.'
                    }],
                    projects: [{
                        title: 'Web Application Development',
                        description: 'Built and deployed web applications with user authentication, data management, and responsive design using modern frameworks and technologies.',
                        technologies: ['React', 'Node.js', 'MongoDB', 'Express']
                    }]
                }
            }
        });
    } else {
        res.status(404).json({
            success: false,
            error: 'User not found',
            message: `No user found with identifier: ${identifier}`
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 CampusPe API Test Server running on port ${PORT}`);
    console.log(`📋 Test Mode: MongoDB disabled for WABB testing`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
    console.log(`📱 WABB Test: http://localhost:${PORT}/api/wabb/send-resume`);
    console.log(`👤 User Test: http://localhost:${PORT}/api/user/919876543210`);
    console.log('✅ Ready for WABB integration testing!');
});

export default app;
