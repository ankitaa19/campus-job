import React, { useState } from 'react';
import Head from 'next/head';
import WabbResumeIntegration from '../components/WabbResumeIntegration';

const WabbIntegrationTestPage: React.FC = () => {
  const [showIntegration, setShowIntegration] = useState(true);

  return (
    <>
      <Head>
        <title>WABB Resume Integration Test - CampusPe</title>
        <meta name="description" content="Test the WABB.in resume integration endpoint" />
      </Head>

      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              WABB Resume Integration
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Test the automated resume generation and WhatsApp sharing endpoint 
              designed for integration with WABB.in and other external platforms.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* API Documentation */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📚 API Documentation</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Endpoint</h3>
                  <div className="bg-gray-100 p-3 rounded-md font-mono text-sm">
                    POST /api/wabb/generate-and-share
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Request Body</h3>
                  <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
{`{
  "name": "John Doe",          // Optional: User's full name
  "email": "john@example.com", // Required: Email to find CampusPe profile
  "phone": "+919156621088",    // Required: WhatsApp number with country code
  "jobDescription": "..."      // Required: Complete job description for AI analysis
}`}
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Success Response</h3>
                  <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
{`{
  "success": true,
  "message": "Resume generated and automatically shared via WhatsApp",
  "data": {
    "resumeId": "resume_uuid",
    "fileName": "AI_Resume_JobTitle.pdf",
    "fileSize": 51234,
    "downloadUrl": "https://...",
    "sharedViaWhatsApp": true,
    "metadata": {
      "generatedAt": "2025-08-19T...",
      "email": "john@example.com",
      "phone": "919156621088",
      "autoShared": true
    }
  }
}`}
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Features</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✅</span>
                      Automatic AI-powered resume generation
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✅</span>
                      Job description analysis and tailoring
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✅</span>
                      Automatic WhatsApp sharing
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✅</span>
                      Real-time status updates via WhatsApp
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✅</span>
                      Download URL for additional integrations
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✅</span>
                      Error handling with user notifications
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Integration Flow</h3>
                  <div className="bg-blue-50 p-4 rounded-md">
                    <ol className="space-y-2 text-sm">
                      <li><strong>1.</strong> External platform sends POST request with user info + job description</li>
                      <li><strong>2.</strong> System sends WhatsApp acknowledgment to user</li>
                      <li><strong>3.</strong> AI analyzes job requirements and fetches user profile</li>
                      <li><strong>4.</strong> Resume is generated and tailored automatically</li>
                      <li><strong>5.</strong> Resume is automatically shared via WhatsApp</li>
                      <li><strong>6.</strong> Success confirmation sent to user via WhatsApp</li>
                      <li><strong>7.</strong> Response returned to external platform with download URL</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Test Interface */}
            {showIntegration && (
              <WabbResumeIntegration onClose={() => setShowIntegration(false)} />
            )}

            {!showIntegration && (
              <div className="text-center">
                <button
                  onClick={() => setShowIntegration(true)}
                  className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition-colors"
                >
                  🧪 Open Test Interface
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default WabbIntegrationTestPage;
