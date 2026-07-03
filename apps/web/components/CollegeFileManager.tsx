import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/api';
import axios from 'axios';

interface FileUploadProps {
  onLogoUploaded?: (logoUrl: string) => void;
  onDocumentUploaded?: (documentUrl: string) => void;
}

interface CollegeFiles {
  logo?: string;
  verificationDocuments: string[];
  submittedDocuments: string[];
  approvalStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  resubmissionNotes?: string;
}

interface UploadResult {
  success: boolean;
  message: string;
  logoUrl?: string;
  documentUrl?: string;
  fileName?: string;
}

const CollegeFileManager: React.FC<FileUploadProps> = ({ 
  onLogoUploaded, 
  onDocumentUploaded 
}) => {
  const [files, setFiles] = useState<CollegeFiles>({
    verificationDocuments: [],
    submittedDocuments: [],
    approvalStatus: 'pending'
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Logo upload states
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  
  // Document upload states
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  
  // Reverification states
  const [reverificationFiles, setReverificationFiles] = useState<File[]>([]);
  const [reverificationNotes, setReverificationNotes] = useState('');

  useEffect(() => {
    loadCollegeFiles();
  }, []);

  const loadCollegeFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/files/college/files`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFiles(response.data);
      if (response.data.logo) {
        setLogoPreview(response.data.logo);
      }
    } catch (error: any) {
      console.error('Failed to load college files:', error);
      setError('Failed to load files');
    }
  };

  const handleLogoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file for logo');
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo file size must be less than 5MB');
        return;
      }

      setLogoFile(file);
      setError('');

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) {
      setError('Please select a logo file');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const formData = new FormData();
      formData.append('logo', logoFile);

      const response = await axios.post<UploadResult>(
        `${API_BASE_URL}/api/files/college/logo`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.logoUrl) {
        setSuccess('Logo uploaded successfully!');
        setFiles(prev => ({ ...prev, logo: response.data.logoUrl! }));
        onLogoUploaded?.(response.data.logoUrl);
        setLogoFile(null);
      }
    } catch (error: any) {
      console.error('Logo upload failed:', error);
      setError(error.response?.data?.message || 'Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a PDF or image file');
        return;
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Document file size must be less than 10MB');
        return;
      }

      setDocumentFile(file);
      setError('');
    }
  };

  const handleDocumentUpload = async () => {
    if (!documentFile || !documentType) {
      setError('Please select a document and specify its type');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const formData = new FormData();
      formData.append('document', documentFile);
      formData.append('documentType', documentType);

      const response = await axios.post<UploadResult>(
        `${API_BASE_URL}/api/files/college/verification-document`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.documentUrl) {
        setSuccess('Document uploaded successfully!');
        setFiles(prev => ({
          ...prev,
          submittedDocuments: [...prev.submittedDocuments, response.data.documentUrl!]
        }));
        onDocumentUploaded?.(response.data.documentUrl);
        setDocumentFile(null);
        setDocumentType('');
      }
    } catch (error: any) {
      console.error('Document upload failed:', error);
      setError(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleReverificationFilesSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    // Validate files
    const validFiles = selectedFiles.filter(file => {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      return allowedTypes.includes(file.type) && file.size <= 10 * 1024 * 1024;
    });

    if (validFiles.length !== selectedFiles.length) {
      setError('Some files were excluded. Only PDF and image files under 10MB are allowed.');
    }

    setReverificationFiles(validFiles);
  };

  const handleReverificationUpload = async () => {
    if (reverificationFiles.length === 0) {
      setError('Please select files for reverification');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const formData = new FormData();
      reverificationFiles.forEach(file => {
        formData.append('documents', file);
      });
      if (reverificationNotes) {
        formData.append('notes', reverificationNotes);
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/files/college/reverification-documents`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setSuccess(`${response.data.totalUploaded} documents uploaded for reverification!`);
      await loadCollegeFiles(); // Reload to show updated status
      setReverificationFiles([]);
      setReverificationNotes('');
    } catch (error: any) {
      console.error('Reverification upload failed:', error);
      setError(error.response?.data?.message || 'Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (documentUrl: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      await axios.delete(`${API_BASE_URL}/api/files/college/document`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { documentUrl }
      });

      setSuccess('Document deleted successfully');
      await loadCollegeFiles();
    } catch (error: any) {
      console.error('Document deletion failed:', error);
      setError(error.response?.data?.message || 'Failed to delete document');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">College Files Management</h2>

      {/* Status Display */}
      <div className="mb-6 p-4 border rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Approval Status</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(files.approvalStatus)}`}>
            {files.approvalStatus.toUpperCase()}
          </span>
        </div>
        
        {files.rejectionReason && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-red-800 font-medium">Rejection Reason:</p>
            <p className="text-red-700">{files.rejectionReason}</p>
          </div>
        )}
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Logo Upload Section */}
      <div className="mb-8 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-4">College Logo</h3>
        
        {logoPreview && (
          <div className="mb-4">
            <img 
              src={logoPreview} 
              alt="College Logo" 
              className="w-32 h-32 object-contain border rounded"
            />
          </div>
        )}
        
        <div className="flex flex-col space-y-3">
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          
          <button
            onClick={handleLogoUpload}
            disabled={!logoFile || uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload Logo'}
          </button>
        </div>
      </div>

      {/* Document Upload Section */}
      <div className="mb-8 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Verification Documents</h3>
        
        <div className="flex flex-col space-y-3">
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="">Select Document Type</option>
            <option value="registration-certificate">Registration Certificate</option>
            <option value="affiliation-letter">University Affiliation Letter</option>
            <option value="accreditation-certificate">Accreditation Certificate</option>
            <option value="noc">No Objection Certificate</option>
            <option value="other">Other</option>
          </select>
          
          <input
            type="file"
            accept=".pdf,image/*"
            onChange={handleDocumentSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          
          <button
            onClick={handleDocumentUpload}
            disabled={!documentFile || !documentType || uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
      </div>

      {/* Reverification Section (shown only if rejected) */}
      {files.approvalStatus === 'rejected' && (
        <div className="mb-8 p-4 border border-red-300 rounded-lg bg-red-50">
          <h3 className="text-lg font-semibold mb-4 text-red-800">Submit Documents for Reverification</h3>
          
          <div className="flex flex-col space-y-3">
            <input
              type="file"
              multiple
              accept=".pdf,image/*"
              onChange={handleReverificationFilesSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
            />
            
            <textarea
              placeholder="Additional notes or explanations (optional)"
              value={reverificationNotes}
              onChange={(e) => setReverificationNotes(e.target.value)}
              rows={3}
              className="border border-gray-300 rounded px-3 py-2"
            />
            
            <button
              onClick={handleReverificationUpload}
              disabled={reverificationFiles.length === 0 || uploading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : `Upload ${reverificationFiles.length} Document(s) for Reverification`}
            </button>
          </div>
        </div>
      )}

      {/* Uploaded Documents List */}
      {files.submittedDocuments.length > 0 && (
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Uploaded Documents</h3>
          
          <div className="space-y-2">
            {files.submittedDocuments.map((docUrl, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <a
                  href={docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate flex-1"
                >
                  Document {index + 1}
                </a>
                
                <button
                  onClick={() => deleteDocument(docUrl)}
                  className="ml-2 px-3 py-1 text-red-600 hover:bg-red-100 rounded text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeFileManager;
