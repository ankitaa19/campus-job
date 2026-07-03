import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

/**
 * Proxy route to serve generated resumes from API service
 * This allows the web app to serve PDF files that are stored in the API service
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { resumeId } = req.query;

  if (!resumeId || typeof resumeId !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: 'Resume ID is required' 
    });
  }

  try {
    // Determine the API base URL based on environment
    const apiBaseUrl = process.env.API_BASE_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net'
        : 'http://localhost:5001'
      );

    console.log('📄 Serving resume:', resumeId);
    console.log('📡 API URL:', apiBaseUrl);

    // First try to get the resume file directly from the API uploads
    const fileUrl = `${apiBaseUrl}/uploads/generated-resumes/${resumeId}.pdf`;
    
    console.log('🔍 Fetching file from:', fileUrl);

    const response = await axios.get(fileUrl, {
      responseType: 'stream',
      timeout: 30000,
      validateStatus: (status) => status < 500 // Allow 404s to be handled
    });

    if (response.status === 200) {
      // Set appropriate headers for PDF serving
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${resumeId}.pdf"`);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      
      // Stream the PDF data
      response.data.pipe(res);
      
      console.log('✅ Resume served successfully:', resumeId);
    } else {
      console.log('❌ Resume not found:', resumeId, 'Status:', response.status);
      res.status(404).json({ 
        success: false, 
        message: 'Resume not found' 
      });
    }
    
  } catch (error: any) {
    console.error('❌ Error serving resume:', error.message);
    
    if (error.response?.status === 404) {
      res.status(404).json({ 
        success: false, 
        message: 'Resume not found' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to serve resume',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}
