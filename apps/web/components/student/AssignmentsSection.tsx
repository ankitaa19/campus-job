import React, { useState } from 'react';
import { FileText, Download, Upload, Calendar, CheckCircle, Building, MapPin, Briefcase, Eye, X, ExternalLink } from 'lucide-react';
import JobDetailsModal from './JobDeatilsModal';

interface AssignmentsSectionProps {
  studentInfo: any;
}

interface Assignment {
  id: number;
  title: string;
  company: string;
  jobTitle: string;
  location: string;
  workMode: string;
  salary: string;
  type: string;
  assignedDate: string;
  deadline: string;
  status: 'active' | 'submitted' | 'rejected' | 'reviewed';
  submittedDate?: string;
  description: string;
  submittedLinks?: string[];
  submittedFiles?: Array<{ name: string; size: string }>;
  skills?: string[];
  jobType?: string;
}

// Generate dummy assignments data
const generateDummyAssignments = (): Assignment[] => {
  const companies = ['TechCorp Inc', 'InnovateCo', 'DataCorp Solutions', 'CloudTech Systems', 'AI Innovations'];
  const jobTitles = ['Software Developer Intern', 'Product Manager', 'Data Analyst', 'Full Stack Engineer', 'UX Designer'];
  const assignmentTitles = ['React Component Challenge', 'API Integration Task', 'Database Design Project', 'UI/UX Case Study', 'Data Analysis Assignment'];
  const locations = ['Mumbai, India', 'Bangalore, India', 'Remote', 'Pune, India', 'Hyderabad, India'];
  const workModes = ['Remote', 'Hybrid', 'On-site'];
  const salaries = ['₹ 15,000 - 25,000/month', '₹ 20,000 - 30,000/month', '₹ 10,000 - 20,000/month'];
  const types = ['Internship', 'Full-Time', 'Part-Time'];
  
  const daysAgo = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
  };

  const daysFromNow = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  };

  const assignments: Assignment[] = [];
  
  // Active assignments (4)
  for (let i = 0; i < 4; i++) {
    assignments.push({
      id: i + 1,
      title: assignmentTitles[i % assignmentTitles.length],
      company: companies[i % companies.length],
      jobTitle: jobTitles[i % jobTitles.length],
      location: locations[i % locations.length],
      workMode: workModes[i % workModes.length],
      salary: salaries[i % salaries.length],
      type: types[i % types.length],
      assignedDate: daysAgo(5 + i),
      deadline: daysFromNow(7 + i * 2),
      status: 'active',
      description: `Complete the ${assignmentTitles[i % assignmentTitles.length]} as part of your application process. This assignment will test your practical skills and problem-solving abilities.`,
      skills: ['JavaScript', 'React', 'TypeScript', 'Node.js'].slice(0, 2 + (i % 3)),
      jobType: types[i % types.length]
    });
  }

  // Submitted assignments (2)
  for (let i = 0; i < 2; i++) {
    assignments.push({
      id: 10 + i,
      title: assignmentTitles[(i + 1) % assignmentTitles.length],
      company: companies[(i + 1) % companies.length],
      jobTitle: jobTitles[(i + 1) % jobTitles.length],
      location: locations[(i + 1) % locations.length],
      workMode: workModes[(i + 1) % workModes.length],
      salary: salaries[(i + 1) % salaries.length],
      type: types[(i + 1) % types.length],
      assignedDate: daysAgo(10 + i),
      deadline: daysFromNow(5),
      status: 'submitted',
      submittedDate: daysAgo(2 + i),
      description: `Complete the ${assignmentTitles[(i + 1) % assignmentTitles.length]} as part of your application process.`,
      submittedLinks: ['https://github.com/username/repo', 'https://demo.example.com'],
      submittedFiles: [
        { name: 'Report_name_T1.pdf', size: '23.5MB' },
        { name: 'Report_name_T1.pdf', size: '23.5MB' }
      ],
      skills: ['Python', 'SQL', 'Excel'].slice(0, 2 + (i % 2)),
      jobType: types[(i + 1) % types.length]
    });
  }

  // Rejected assignment (1)
  assignments.push({
    id: 20,
    title: 'API Integration Task',
    company: 'TechCorp Inc',
    jobTitle: 'Software Developer Intern',
    location: 'Remote',
    workMode: 'Remote',
    salary: '₹ 20,000 - 30,000/month',
    type: 'Internship',
    assignedDate: daysAgo(15),
    deadline: daysAgo(5),
    status: 'rejected',
    submittedDate: daysAgo(7),
    description: 'Build a REST API integration for the company\'s existing platform.',
    submittedLinks: ['https://github.com/username/repo'],
    submittedFiles: [{ name: 'Report_name_T1.pdf', size: '23.5MB' }],
    skills: ['Node.js', 'Express', 'MongoDB'],
    jobType: 'Internship'
  });

  // Reviewed assignment (1)
  assignments.push({
    id: 21,
    title: 'React Component Challenge',
    company: 'InnovateCo',
    jobTitle: 'Product Manager',
    location: 'Bangalore, India',
    workMode: 'Hybrid',
    salary: '₹ 15,000 - 25,000/month',
    type: 'Internship',
    assignedDate: daysAgo(12),
    deadline: daysAgo(2),
    status: 'reviewed',
    submittedDate: daysAgo(4),
    description: 'Create reusable React components following best practices.',
    submittedLinks: ['https://github.com/username/repo', 'https://demo.example.com'],
    submittedFiles: [
      { name: 'Report_name_T1.pdf', size: '23.5MB' },
      { name: 'Report_name_T1.pdf', size: '23.5MB' }
    ],
    skills: ['React', 'TypeScript', 'CSS'],
    jobType: 'Internship'
  });

  return assignments;
};

const AssignmentsSection: React.FC<AssignmentsSectionProps> = ({ studentInfo }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'submitted' | 'rejected' | 'reviewed'>('active');
  const [assignments] = useState<Assignment[]>(generateDummyAssignments());
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionLinks, setSubmissionLinks] = useState<string[]>(['']);
  const [submissionFiles, setSubmissionFiles] = useState<(File | null)[]>([null, null]);

  const getTabCounts = () => {
    return {
      active: assignments.filter(a => a.status === 'active').length,
      submitted: assignments.filter(a => a.status === 'submitted').length,
      rejected: assignments.filter(a => a.status === 'rejected').length,
      reviewed: assignments.filter(a => a.status === 'reviewed').length,
    };
  };

  const tabCounts = getTabCounts();

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      active: { bg: 'rgba(39, 145, 252, 0.18)', text: '#1484F3', label: 'Shortlisted' },
      submitted: { bg: 'rgba(24, 204, 96, 0.15)', text: '#00C950', label: 'Submitted' },
      rejected: { bg: 'rgba(236, 27, 27, 0.1)', text: '#EC1B1B', label: 'Rejected' },
      reviewed: { bg: 'rgba(255, 85, 149, 0.15)', text: '#F90083', label: 'Reviewed' },
    };

    const style = statusStyles[status as keyof typeof statusStyles] || statusStyles.active;
    
    return (
      <span 
        className="px-3 py-1.5 rounded-full text-xs font-medium"
        style={{ 
          backgroundColor: style.bg,
          color: style.text 
        }}
      >
        {style.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredAssignments = assignments.filter(a => a.status === activeTab);

  const handleSubmitClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionLinks(['', '']);
    setSubmissionFiles([null, null]);
    setShowSubmitModal(true);
  };

  const handleViewDetails = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowDetailsModal(true);
  };

  const handleViewJob = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowJobModal(true);
  };

  const addLinkField = () => {
    if (submissionLinks.length < 2) {
      setSubmissionLinks([...submissionLinks, '']);
    }
  };

  const updateLink = (index: number, value: string) => {
    const newLinks = [...submissionLinks];
    newLinks[index] = value;
    setSubmissionLinks(newLinks);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (submissionFiles.length + newFiles.length <= 2) {
        setSubmissionFiles([...submissionFiles, ...newFiles]);
      }
    }
  };

  const removeFile = (index: number) => {
    setSubmissionFiles(submissionFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    // Handle submission logic here
    console.log('Submitting assignment:', { links: submissionLinks, files: submissionFiles });
    setShowSubmitModal(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white px-8 py-6 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-[#0270DF]">Assignments</h1>
        <p className="text-gray-600 text-sm mt-1">Track and submit your assignments</p>
      </div>

      <div className="px-8 py-6">
        {/* Tabs */}
        <div className="bg-[#ECECF0]/50 rounded-full p-1 w-full mb-6">
          <div className="flex w-full">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 px-6 py-3 text-sm font-medium rounded-full transition-all duration-300 ${
                activeTab === 'active'
                  ? 'text-white bg-gradient-to-r from-[#2791FC] to-[#0377EB]'
                  : 'text-[#087AED] bg-transparent'
              }`}
            >
              Active ({tabCounts.active})
            </button>
            <button
              onClick={() => setActiveTab('submitted')}
              className={`flex-1 px-6 py-3 text-sm font-medium rounded-full transition-all duration-300 ${
                activeTab === 'submitted'
                  ? 'text-white bg-gradient-to-r from-[#2791FC] to-[#0377EB]'
                  : 'text-[#087AED] bg-transparent'
              }`}
            >
              Submitted ({tabCounts.submitted})
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`flex-1 px-6 py-3 text-sm font-medium rounded-full transition-all duration-300 ${
                activeTab === 'rejected'
                  ? 'text-white bg-gradient-to-r from-[#2791FC] to-[#0377EB]'
                  : 'text-[#087AED] bg-transparent'
              }`}
            >
              Rejected ({tabCounts.rejected})
            </button>
            <button
              onClick={() => setActiveTab('reviewed')}
              className={`flex-1 px-6 py-3 text-sm font-medium rounded-full transition-all duration-300 ${
                activeTab === 'reviewed'
                  ? 'text-white bg-gradient-to-r from-[#2791FC] to-[#0377EB]'
                  : 'text-[#087AED] bg-transparent'
              }`}
            >
              Reviewed ({tabCounts.reviewed})
            </button>
          </div>
        </div>

        {/* Assignments List */}
        {filteredAssignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No assignments yet</h3>
            <p className="text-gray-600 text-center max-w-md">
              You don't have any {activeTab} assignments at the moment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-white rounded-lg border-l-4 border-blue-500 hover:!border-l-[#0879EA] border border-gray-200 hover:border-blue-300 transition p-5"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Company Logo */}
                    <div className="w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <Building className="h-8 w-8 text-purple-600" />
                    </div>

                    {/* Assignment Title, Company and Status */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                        {getStatusBadge(assignment.status)}
                      </div>
                      <p className="text-sm text-gray-600">{assignment.company} • {assignment.jobTitle}</p>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div className="text-right">
                    <div className="flex items-center justify-end text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-1.5" />
                      <span>Due: {formatDate(assignment.deadline)}</span>
                    </div>
                  </div>
                </div>

                {/* Assignment Section */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Assignment</h4>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">Assignment Task_T1.pdf</p>
                        <p className="text-xs text-gray-500">23.5MB</p>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-white rounded-lg transition">
                      <Download className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Submitted Links Section - Only for submitted/rejected/reviewed assignments */}
                {(assignment.status === 'submitted' || assignment.status === 'rejected' || assignment.status === 'reviewed') && assignment.submittedLinks && assignment.submittedLinks.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Assignment Link</h4>
                    {assignment.submittedLinks.length === 1 ? (
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <ExternalLink className="h-5 w-5 text-gray-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{assignment.submittedLinks[0]}</p>
                          </div>
                        </div>
                        <button className="p-2 hover:bg-white rounded-lg transition flex-shrink-0">
                          <Eye className="h-5 w-5 text-gray-600" />
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {assignment.submittedLinks.map((link, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <ExternalLink className="h-5 w-5 text-gray-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm truncate">{link}</p>
                              </div>
                            </div>
                            <button className="p-2 hover:bg-white rounded-lg transition flex-shrink-0">
                              <Eye className="h-5 w-5 text-gray-600" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3">
                  {assignment.status === 'active' && (
                    <button
                      onClick={() => handleSubmitClick(assignment)}
                      className="px-6 py-2.5 rounded-xl text-white transition font-medium"
                      style={{ 
                        background: 'linear-gradient(to right, #2791FC, #0473E2)' 
                      }}
                    >
                      Submit Assignment
                    </button>
                  )}
                  <button
                    onClick={() => handleViewDetails(assignment)}
                    className="px-6 py-2.5 rounded-xl border border-[#1383F3] text-[#1383F3] bg-white hover:bg-gray-50 transition flex items-center space-x-2 font-medium"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </button>
                  <button
                    onClick={() => handleViewJob(assignment)}
                    className="px-6 py-2.5 rounded-xl text-white transition font-medium"
                    style={{ 
                      background: 'linear-gradient(to right, #3A9CFF, #0F7FEE)' 
                    }}
                  >
                    View Job
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Assignment Modal */}
      {showSubmitModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center space-x-3">
                <FileText className="h-6 w-6 text-gray-700" />
                <h2 className="text-xl font-semibold text-gray-900">Submit Assignment</h2>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6">
              <p className="text-gray-600 mb-6">Submit your solution for "{selectedAssignment.title}"</p>

              {/* Assignment Info Card */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 mb-6 border border-blue-100 relative">
                {/* Status Badge - Top Right */}
                <div className="absolute top-4 right-4">
                  {getStatusBadge(selectedAssignment.status)}
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                    <Building className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1 pr-24">
                    <h3 className="font-semibold text-gray-900 mb-1">{selectedAssignment.title}</h3>
                    <p className="text-sm text-gray-700 mb-3">{selectedAssignment.company} • {selectedAssignment.jobTitle}</p>
                    <div className="flex items-center space-x-8 text-sm text-gray-700">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Assigned Date</span>
                        <span>{formatDate(selectedAssignment.assignedDate)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Deadline</span>
                        <span>{formatDate(selectedAssignment.deadline)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description from Company */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Description</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {selectedAssignment.description}
                </p>
              </div>

              {/* Assignment File Download */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Assignment</h4>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">Assignment Task_T1.pdf</p>
                      <p className="text-xs text-gray-500">23.5MB</p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <Download className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Upload Section */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Upload Your Task (Max 2 Files)</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[0, 1].map((index) => {
                    const file = submissionFiles[index];
                    const hasFile = !!file;
                    return (
                      <div
                        key={index}
                        className={`border-2 border-dashed rounded-xl p-4 transition ${
                          hasFile
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {hasFile ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-[#00C950]" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)}MB</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                // View file functionality
                                const url = URL.createObjectURL(file);
                                window.open(url, '_blank');
                              }}
                              className="p-2 hover:bg-green-100 rounded-lg transition ml-2"
                            >
                              <Eye className="h-5 w-5 text-gray-600" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <input
                              type="file"
                              id={`file-upload-${index}`}
                              accept=".pdf,.doc,.docx,.zip"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const newFiles = [...submissionFiles];
                                  newFiles[index] = e.target.files[0];
                                  setSubmissionFiles(newFiles);
                                }
                              }}
                              className="hidden"
                            />
                            <label htmlFor={`file-upload-${index}`} className="cursor-pointer">
                              <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm font-medium text-gray-700">Choose File</p>
                              <p className="text-xs text-gray-500 mt-1">No file chosen</p>
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">Accepted formats: PDF, DOC, ZIP (Max size: 10MB)</p>
              </div>

              {/* Assignment Link Section */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Assignment Link (Max 2 Links)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <input
                      type="url"
                      placeholder="https://github.com/username/repo or https://demo.example.com"
                      value={submissionLinks[0]}
                      onChange={(e) => updateLink(0, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <input
                      type="url"
                      placeholder="https://github.com/username/repo or https://demo.example.com"
                      value={submissionLinks[1] || ''}
                      onChange={(e) => {
                        const newLinks = [...submissionLinks];
                        if (newLinks.length < 2) newLinks.push('');
                        newLinks[1] = e.target.value;
                        setSubmissionLinks(newLinks);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 flex justify-end">
              <button
                onClick={handleSubmit}
                className="px-8 py-2.5 rounded-xl text-white font-medium transition"
                style={{ 
                  background: 'linear-gradient(to right, #3A9CFF, #0F7FEE)' 
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Details Modal */}
      {showDetailsModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center space-x-3">
                <Eye className="h-6 w-6 text-gray-700" />
                <h2 className="text-xl font-semibold text-gray-900">Assignment Details</h2>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6">
              <p className="text-gray-600 mb-6">Assignment details and submission information</p>

              {/* Assignment Info Card */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 mb-6 border border-blue-100 relative">
                {/* Status Badge - Top Right */}
                <div className="absolute top-4 right-4">
                  {getStatusBadge(selectedAssignment.status)}
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                    <Building className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1 pr-24">
                    <h3 className="font-semibold mb-1" style={{color: '#1a1a1a', textShadow: '0 0 1px rgba(0,0,0,0.3)'}}>{selectedAssignment.title}</h3>
                    <p className="text-sm mb-3" style={{color: '#2d2d2d', textShadow: '0 0 1px rgba(0,0,0,0.2)'}}>{selectedAssignment.company} • {selectedAssignment.jobTitle}</p>
                    <div className="flex items-center space-x-8 text-sm" style={{color: '#2d2d2d', textShadow: '0 0 1px rgba(0,0,0,0.2)'}}>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Assigned Date</span>
                        <span>{formatDate(selectedAssignment.assignedDate)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Deadline</span>
                        <span>{formatDate(selectedAssignment.deadline)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description from Company */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Description</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {selectedAssignment.description}
                </p>
              </div>

              {/* Assignment File from Company */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Assignment from Company</h4>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">Assignment Task_T1.pdf</p>
                      <p className="text-xs text-gray-500">23.5MB</p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <Download className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Submitted Files - Only show for submitted/rejected/reviewed */}
              {(selectedAssignment.status === 'submitted' || selectedAssignment.status === 'rejected' || selectedAssignment.status === 'reviewed') && selectedAssignment.submittedFiles && selectedAssignment.submittedFiles.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Submitted Files</h4>
                  <div className="space-y-2">
                    {selectedAssignment.submittedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">{file.size}</p>
                          </div>
                        </div>
                        <button className="p-2 hover:bg-green-100 rounded-lg transition">
                          <Download className="h-5 w-5 text-gray-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submitted Links - Only show for submitted/rejected/reviewed */}
              {(selectedAssignment.status === 'submitted' || selectedAssignment.status === 'rejected' || selectedAssignment.status === 'reviewed') && selectedAssignment.submittedLinks && selectedAssignment.submittedLinks.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Submitted Links</h4>
                  {selectedAssignment.submittedLinks.length === 1 ? (
                    <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <ExternalLink className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{selectedAssignment.submittedLinks[0]}</p>
                        </div>
                      </div>
                      <button className="p-2 hover:bg-blue-100 rounded-lg transition flex-shrink-0">
                        <Eye className="h-5 w-5 text-gray-600" />
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {selectedAssignment.submittedLinks.map((link, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <ExternalLink className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate">{link}</p>
                            </div>
                          </div>
                          <button className="p-2 hover:bg-blue-100 rounded-lg transition flex-shrink-0">
                            <Eye className="h-5 w-5 text-gray-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-8 py-2.5 rounded-xl text-white font-medium transition"
                style={{ 
                  background: 'linear-gradient(to right, #2791FC, #0377EB)' 
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {showJobModal && selectedAssignment && (
        <JobDetailsModal
          job={selectedAssignment as any}
          isOpen={showJobModal}
          onClose={() => setShowJobModal(false)}
        />
      )}
    </div>
  );
};

export default AssignmentsSection;
