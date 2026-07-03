import React from 'react';

const ManageJobs: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Manage Jobs
        </h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">
            Job management functionality is under development. Recruiters can create jobs from the main jobs page.
          </p>
          <div className="mt-4">
            <a 
              href="/jobs/create" 
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mr-4"
            >
              Create Job
            </a>
            <a 
              href="/jobs" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              View All Jobs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageJobs;