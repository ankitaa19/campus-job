import React, { useState } from 'react';
import ManageJobsSection from './ManageJobsSection';
import JobApplicationsView from './JobApplicationsView';

interface JobsWrapperProps {
  onCreateJob?: () => void;
  onPostSimilarJob?: (jobData: any) => void;
}

const JobsWrapper: React.FC<JobsWrapperProps> = ({ onCreateJob, onPostSimilarJob }) => {
  const [currentView, setCurrentView] = useState<'list' | 'applications'>('list');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJobTitle, setSelectedJobTitle] = useState<string>('Software Engineer');

  const handleViewApplications = (jobId: string, jobTitle: string) => {
    setSelectedJobId(jobId);
    setSelectedJobTitle(jobTitle);
    setCurrentView('applications');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedJobId(null);
    setSelectedJobTitle('Software Engineer');
  };

  if (currentView === 'applications' && selectedJobId) {
    return (
      <JobApplicationsView 
        jobId={selectedJobId}
        jobTitle={selectedJobTitle}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <ManageJobsSection 
      onCreateJob={onCreateJob}
      onViewJob={handleViewApplications}
      onPostSimilarJob={onPostSimilarJob}
    />
  );
};

export default JobsWrapper;
