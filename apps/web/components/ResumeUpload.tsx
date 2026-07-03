import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../utils/api';

interface ResumeAnalysis {
  [key: string]: unknown;
}

interface UseResumeUploadProps {
  onUploadSuccess: (analysis: ResumeAnalysis) => void;
  onUploadError: (error: string) => void;
  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;
}

export const useResumeUpload = ({
  onUploadSuccess,
  onUploadError,
  setIsUploading
}: UseResumeUploadProps) => {
  const handleFileSelect = async (file: File) => {
    console.log('Resume upload hook called with file:', file);
    
    if (!file) {
      console.log('No file provided to upload hook');
      return;
    }

    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    });

    // Validate file type
    if (file.type !== 'application/pdf') {
      console.log('Invalid file type:', file.type);
      onUploadError('Please select a PDF file only.');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      console.log('File too large:', file.size);
      onUploadError('File size must be less than 5MB.');
      return;
    }

    setIsUploading(true);
    console.log('Starting file upload...');
    
    try {
      const formData = new FormData();
      formData.append('resume', file);
      console.log('FormData created with file');
      
      const token = localStorage.getItem('token');
      console.log('Token available:', !!token);
      
      if (!token) {
        console.log('No authentication token found');
        onUploadError('Authentication required. Please log in again.');
        return;
      }
      
      console.log('Uploading resume file:', file.name);
      console.log('Upload URL:', `${API_BASE_URL}${API_ENDPOINTS.STUDENT_ANALYZE_RESUME}`);
      
      const response = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.STUDENT_ANALYZE_RESUME}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000 // 30 second timeout for file upload (reduced from 60s)
        }
      );

      console.log('Resume upload response:', response.data);

      if (response.data.success) {
        console.log('Upload successful, calling onUploadSuccess');
        // New AI endpoint returns analysis data instead of data
        onUploadSuccess(response.data.analysis || response.data.data);
      } else {
        console.log('Upload failed - server responded with success=false');
        onUploadError(response.data.error || 'Resume upload failed. Please try again.');
      }
    } catch (error: unknown) {
      console.error('Error uploading resume:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        console.log('Upload error response:', error.response.status, error.response.data);
        
        // Extract error message from AI endpoint response
        const errorMessage = error.response.data?.error || error.response.data?.details || 'Upload failed. Please try again.';
        
        if (error.response.status === 401) {
          onUploadError('Authentication expired. Please log in again.');
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else if (error.response.status === 400) {
          onUploadError(errorMessage.includes('PDF') ? errorMessage : 'Invalid file or request. Please ensure you\'re uploading a valid PDF file.');
        } else if (error.response.status === 413) {
          onUploadError('File too large. Please upload a smaller PDF file (max 5MB).');
        } else if (error.response.status === 500) {
          onUploadError(`Server error: ${errorMessage}`);
        } else {
          onUploadError(`Upload failed (${error.response.status}): ${errorMessage}`);
        }
      } else if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        onUploadError('Upload timeout. Please check your connection and try again.');
      } else if (axios.isAxiosError(error) && error.code === 'NETWORK_ERROR') {
        onUploadError('Network error. Please check your internet connection.');
      } else {
        onUploadError('Upload failed. Please try again.');
      }
    } finally {
      console.log('Upload process completed, setting isUploading to false');
      setIsUploading(false);
    }
  };

  return {
    handleFileSelect
  };
};

export default useResumeUpload;
