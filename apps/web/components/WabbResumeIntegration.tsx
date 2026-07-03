import React, { useState } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../utils/api';

interface WabbResumeProps {
  onClose?: () => void;
}

interface WabbResultData {
  resumeId?: string;
  fileName?: string;
  fileSize?: number;
  sharedViaWhatsApp?: boolean;
  downloadUrl?: string;
  metadata?: {
    generatedAt?: string;
  };
}

interface WabbResult {
  success: boolean;
  message?: string;
  data?: WabbResultData;
}

const WabbResumeIntegration: React.FC<WabbResumeProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    jobDescription: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WabbResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.WABB_GENERATE_AND_SHARE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.message || 'Failed to generate and share resume');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      jobDescription: ''
    });
    setResult(null);
    setError(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">WABB Resume Integration</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        )}
      </div>

      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">🔗 Integration Details</h3>
        <p className="text-sm text-blue-700">
          This endpoint automatically generates an AI-tailored resume and shares it via WhatsApp.
          Perfect for integration with external platforms like WABB.in flows.
        </p>
        <div className="mt-2 text-xs text-blue-600">
          <strong>Endpoint:</strong> POST {API_BASE_URL}{API_ENDPOINTS.WABB_GENERATE_AND_SHARE}
        </div>
      </div>

      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name (Optional)
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter full name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter email address"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number (with country code) *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="e.g., +919156621088"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Include country code for WhatsApp delivery
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Description *
            </label>
            <textarea
              name="jobDescription"
              value={formData.jobDescription}
              onChange={handleInputChange}
              placeholder="Paste the complete job description here..."
              required
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              The AI will analyze this to tailor the resume
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="text-red-600 text-sm">{error}</div>
              </div>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading || !formData.email || !formData.phone || !formData.jobDescription}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Generating & Sharing...
                </span>
              ) : (
                '🚀 Generate & Share Resume'
              )}
            </button>
            
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="font-semibold text-green-900 mb-2">✅ Success!</h3>
            <p className="text-green-700 text-sm">{result.message}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-semibold text-gray-900 mb-3">📊 Response Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Resume ID:</span>
                <span className="font-mono text-blue-600">{result.data?.resumeId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">File Name:</span>
                <span className="text-gray-900">{result.data?.fileName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">File Size:</span>
                <span className="text-gray-900">{Math.round(result.data?.fileSize / 1024)} KB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">WhatsApp Shared:</span>
                <span className={`font-semibold ${result.data?.sharedViaWhatsApp ? 'text-green-600' : 'text-orange-600'}`}>
                  {result.data?.sharedViaWhatsApp ? '✅ Yes' : '⚠️ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Generated At:</span>
                <span className="text-gray-900">
                  {new Date(result.data?.metadata?.generatedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {result.data?.downloadUrl && (
            <div className="p-4 bg-blue-50 rounded-md">
              <h4 className="font-semibold text-blue-900 mb-2">📥 Download Link</h4>
              <a
                href={result.data.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline text-sm break-all"
              >
                {result.data.downloadUrl}
              </a>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              onClick={resetForm}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              🔄 Test Another Resume
            </button>
            
            {onClose && (
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-yellow-50 rounded-md">
        <h4 className="font-semibold text-yellow-900 mb-2">💡 Integration Notes</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• This endpoint can be called from any external platform</li>
          <li>• User must have an existing profile on CampusPe</li>
          <li>• Resume is automatically shared to the provided WhatsApp number</li>
          <li>• Returns resume ID and download URL for additional integrations</li>
          <li>• Supports CORS for web-based integrations</li>
        </ul>
      </div>
    </div>
  );
};

export default WabbResumeIntegration;
