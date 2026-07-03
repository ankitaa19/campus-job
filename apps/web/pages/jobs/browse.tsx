import React from 'react';

const BrowseJobs: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Browse Jobs
        </h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">
            Job browsing functionality is under development. Please use the main jobs page for now.
          </p>
          <div className="mt-4">
            <a 
              href="/jobs" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Go to Jobs Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowseJobs;