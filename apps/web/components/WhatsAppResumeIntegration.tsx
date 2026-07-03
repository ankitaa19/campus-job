import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';

interface WhatsAppIntegrationProps {
  resumeId?: string;
  userEmail?: string;
  userPhone?: string;
}

interface WhatsAppStats {
  conversations: {
    active: number;
    completedToday: number;
  };
  resumes: {
    totalGenerated: number;
    generatedToday: number;
    successfulDeliveries: number;
    failedDeliveries: number;
  };
}

const WhatsAppResumeIntegration: React.FC<WhatsAppIntegrationProps> = ({
  userEmail,
  userPhone
}) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<WhatsAppStats | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);

  // Fetch WhatsApp stats on component mount
  useEffect(() => {
    fetchWhatsAppStats();
  }, []);

  const fetchWhatsAppStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/whatsapp-admin/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch WhatsApp stats:', error);
    }
  };

  const handleWhatsAppFlow = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // Send instructions to user's WhatsApp
      const response = await axios.post(
        `${API_BASE_URL}/api/whatsapp-admin/test-message`,
        {
          phoneNumber: userPhone,
          message: `🎯 *CampusPe AI Resume Builder*\n\nHi! You can now create tailored resumes directly through WhatsApp!\n\n🚀 *How to start:*\n1. Send "resume" to this number\n2. Share your email: ${userEmail}\n3. Paste the job description\n4. Get your tailored resume in 60 seconds!\n\n💡 *Or visit:* CampusPe.com\n\n🤖 Try it now by typing "resume"!`,
          serviceType: 'general'
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setMessage('WhatsApp instructions sent successfully! Check your WhatsApp.');
      } else {
        setError('Failed to send WhatsApp instructions');
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to send WhatsApp instructions');
    } finally {
      setLoading(false);
    }
  };

  const handleTestResumeFlow = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/whatsapp-admin/test-resume-flow`,
        {
          phoneNumber: userPhone,
          email: userEmail,
          jobDescription: "Looking for a software developer with React, Node.js experience. Must have 2+ years experience in full-stack development, API integration, and database management. Strong problem-solving skills required."
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setMessage('Test resume flow initiated! Check your WhatsApp for the generated resume.');
      } else {
        setError('Failed to initiate test resume flow');
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to test resume flow');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white text-xl">📱</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              WhatsApp Resume Builder
            </h3>
            <p className="text-sm text-gray-600">
              Create resumes directly through WhatsApp
            </p>
          </div>
        </div>
        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
          AI Powered
        </span>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-green-600">
              {stats.conversations.active}
            </div>
            <div className="text-xs text-gray-500">Active Chats</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-blue-600">
              {stats.resumes.generatedToday}
            </div>
            <div className="text-xs text-gray-500">Today</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-purple-600">
              {stats.resumes.totalGenerated}
            </div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-green-600">
              {Math.round((stats.resumes.successfulDeliveries / (stats.resumes.successfulDeliveries + stats.resumes.failedDeliveries || 1)) * 100)}%
            </div>
            <div className="text-xs text-gray-500">Success Rate</div>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="bg-white bg-opacity-60 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-gray-800 mb-3">🚀 WhatsApp Features:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center text-sm text-gray-700">
            <span className="text-green-500 mr-2">✓</span>
            Conversational AI interface
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <span className="text-green-500 mr-2">✓</span>
            Step-by-step guidance
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <span className="text-green-500 mr-2">✓</span>
            Instant PDF delivery
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <span className="text-green-500 mr-2">✓</span>
            Job-specific tailoring
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-gray-800 mb-3">📋 How it works:</h4>
        <div className="space-y-2">
          <div className="flex items-start text-sm">
            <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">1</span>
            <span className="text-gray-700">User sends &ldquo;resume&rdquo; to WhatsApp</span>
          </div>
          <div className="flex items-start text-sm">
            <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">2</span>
            <span className="text-gray-700">AI asks for email and job description</span>
          </div>
          <div className="flex items-start text-sm">
            <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">3</span>
            <span className="text-gray-700">AI analyzes job and fetches user profile</span>
          </div>
          <div className="flex items-start text-sm">
            <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">4</span>
            <span className="text-gray-700">Tailored resume delivered in 60 seconds</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {userPhone && (
          <button
            onClick={handleWhatsAppFlow}
            disabled={loading}
            className="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending Instructions...
              </>
            ) : (
              <>
                <span className="mr-2">📱</span>
                Send WhatsApp Instructions
              </>
            )}
          </button>
        )}

        {userPhone && userEmail && (
          <button
            onClick={handleTestResumeFlow}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Testing Flow...
              </>
            ) : (
              <>
                <span className="mr-2">🧪</span>
                Test Resume Generation
              </>
            )}
          </button>
        )}

        <button
          onClick={() => setShowQRCode(!showQRCode)}
          className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
        >
          <span className="mr-2">📲</span>
          {showQRCode ? 'Hide QR Code' : 'Show WhatsApp QR Code'}
        </button>
      </div>

      {/* QR Code Section */}
      {showQRCode && (
        <div className="mt-6 bg-white rounded-lg p-4 text-center">
          <h5 className="font-medium text-gray-800 mb-3">Scan to Chat on WhatsApp</h5>
          <div className="bg-gray-100 rounded-lg p-8 mb-3">
            {/* You can integrate a QR code generator here */}
            <div className="text-6xl">📱</div>
            <p className="text-sm text-gray-500 mt-2">
              QR Code would appear here<br/>
              (Integrate with WhatsApp Business API)
            </p>
          </div>
          <p className="text-xs text-gray-500">
            Or send a message directly to: +1-XXX-XXX-XXXX
          </p>
        </div>
      )}

      {/* Success/Error Messages */}
      {message && (
        <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <span className="mr-2">✅</span>
            {message}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <span className="mr-2">❌</span>
            {error}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Powered by WABB.in • Claude AI • CampusPe Platform
        </p>
      </div>
    </div>
  );
};

export default WhatsAppResumeIntegration;
