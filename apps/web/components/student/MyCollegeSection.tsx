import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Eye, FileText, Upload, CheckCircle, Clock, XCircle, AlertCircle,
  Phone, Mail, Building2, BriefcaseBusiness, X, Search, ChevronDown, MapPin, Globe, ExternalLink, Edit
} from "lucide-react";


interface MyCollegeSectionProps {
  studentInfo: any;
}

interface Document {
  _id: string;
  name: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  verificationDate?: string;
  status: 'Verified' | 'Pending' | 'Rejected';
  rejectionReason?: string;
  documentType: string;
  acceptedFormats: string;
  selected?: boolean;
}

interface Company {
  _id: string;
  name: string;
  type: string;
  foundedYear: number;
  employees: string;
  location: string;
  website: string;
  description: string;
  openings: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

const MyCollegeSection: React.FC<MyCollegeSectionProps> = ({ studentInfo }) => {
  const [collegeInfo, setCollegeInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [partnerCompanies, setPartnerCompanies] = useState<Company[]>([]);
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadDocumentType, setUploadDocumentType] = useState<string>('');
  
  // Editable student info
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editableStudentId, setEditableStudentId] = useState(studentInfo?.studentId || '');
  const [editableCourse, setEditableCourse] = useState(studentInfo?.course || '');
  const [editableSemester, setEditableSemester] = useState(studentInfo?.currentSemester || '');
  const [editableBatch, setEditableBatch] = useState(studentInfo?.currentBatch || '');

  // Dummy data for documents
  const dummyDocuments: Document[] = [
    {
      _id: '1',
      name: 'Resume/CV',
      fileName: 'Resume/ pdf name',
      fileSize: '2.4MB',
      uploadDate: '23 Oct, 2025',
      verificationDate: '26 Oct, 2025',
      status: 'Verified',
      documentType: 'Resume/CV',
      acceptedFormats: 'PDF, DOC (Max 5MB)'
    },
    {
      _id: '2',
      name: '10th Marksheet',
      fileName: '10th Marksheet',
      fileSize: '1.5MB',
      uploadDate: '1 Nov, 2025',
      status: 'Pending',
      documentType: '10th Marksheet',
      acceptedFormats: 'PDF, DOC (Max 5MB)'
    },
    {
      _id: '3',
      name: '12th Marksheet',
      fileName: '12th Marksheet',
      fileSize: '1.8MB',
      uploadDate: '1 Nov, 2025',
      status: 'Rejected',
      rejectionReason: 'Missing Docs',
      documentType: '12th Marksheet',
      acceptedFormats: 'PDF, DOC (Max 5MB)'
    },
    {
      _id: '4',
      name: 'ID Proof (College ID)',
      fileName: '',
      fileSize: '',
      uploadDate: '',
      status: 'Pending',
      documentType: 'ID Proof (College ID)',
      acceptedFormats: 'PDF, DOC (Max 5MB)'
    }
  ];

  // Dummy data for partner companies
  const dummyCompanies: Company[] = [
    {
      _id: '1',
      name: 'Tech Solutions Inc',
      type: 'Fintech Company',
      foundedYear: 2015,
      employees: '1-10',
      location: 'Bangalore, Karnataka',
      website: 'www.xyzcompany.com',
      description: 'Lorem ipsum kfsm demo job description software developer intern in fintech position dummy text even writing...',
      openings: 5
    },
    {
      _id: '2',
      name: 'Digital Innovations',
      type: 'Design',
      foundedYear: 2016,
      employees: '1-10',
      location: 'New Delhi, India',
      website: 'www.xyzcompany.com',
      description: 'Lorem ipsum kfsm demo job description software developer intern in fintech position dummy text even writing...',
      openings: 2
    },
    {
      _id: '3',
      name: 'Cloud Services Pro',
      type: 'Technology',
      foundedYear: 2015,
      employees: '1-10',
      location: 'Bangalore, Karnataka',
      website: 'www.xyzcompany.com',
      description: 'Lorem ipsum kfsm demo job description software developer intern in fintech position dummy text even writing...',
      openings: 5
    },
    {
      _id: '4',
      name: 'Digital Innovations',
      type: 'Design',
      foundedYear: 2016,
      employees: '1-10',
      location: 'New Delhi, India',
      website: 'www.xyzcompany.com',
      description: 'Lorem ipsum kfsm demo job description software developer intern in fintech position dummy text even writing...',
      openings: 2
    },
    {
      _id: '5',
      name: 'Cloud Services Pro',
      type: 'Technology',
      foundedYear: 2015,
      employees: '1-10',
      location: 'Bangalore, Karnataka',
      website: 'www.xyzcompany.com',
      description: 'Lorem ipsum kfsm demo job description software developer intern in fintech position dummy text even writing...',
      openings: 5
    }
  ];

  useEffect(() => {
    setEditableStudentId(studentInfo?.studentId || '');
    setEditableCourse(studentInfo?.course || '');
    setEditableSemester(studentInfo?.currentSemester || '');
    setEditableBatch(studentInfo?.currentBatch || '');
    if (studentInfo?.collegeId) {
      fetchCollegeInfo();
    } else {
      setLoading(false);
    }
    // Set dummy data
    setDocuments(dummyDocuments);
    setPartnerCompanies(dummyCompanies);
  }, [studentInfo]);

  const fetchCollegeInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.get(
        `${API_BASE_URL}/api/colleges/${studentInfo.collegeId}`,
        { headers }
      );
      
      setCollegeInfo(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching college info:', error);
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Verified':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'Pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'Rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Verified':
        return 'text-green-600';
      case 'Pending':
        return 'text-yellow-600';
      case 'Rejected':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const calculateProgress = () => {
    const verified = documents.filter(doc => doc.status === 'Verified').length;
    return Math.round((verified / documents.length) * 100);
  };

  const getProgressColor = () => {
    const progress = calculateProgress();
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-blue-500';
    return 'bg-gray-300';
  };

  if (loading) {
    return (
      <div>
        <div className="bg-white px-8 py-6 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-900">
            My <span className="text-blue-600">College !</span>
          </h1>
          <p className="text-gray-600 text-sm mt-1">Your college information and placement resources</p>
        </div>
        <div className="px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading college information...</p>
          </div>
        </div>
      </div>
    );
  }

  const displayedCompanies = showAllCompanies ? partnerCompanies : partnerCompanies.slice(0, 3);
  const verifiedCount = documents.filter(doc => doc.status === 'Verified').length;
  const pendingCount = documents.filter(doc => doc.status === 'Pending').length;
  const rejectedCount = documents.filter(doc => doc.status === 'Rejected').length;

  return (
    <div>
      {/* Header */}
      <div className="bg-white px-8 py-6 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">
          My <span className="text-blue-600">College !</span>
        </h1>
        <p className="text-gray-600 text-sm mt-1">Your college information and placement resources</p>
      </div>

<div className="bg-white px-4 lg:px-10 py-4 lg:py-8 max-w mx-auto space-y-6">
  {/* College Info Card */}
  <div className="bg-white px-6 py-5 lg:px-8 lg:py-6 rounded-2xl shadow-sm border border-[#2791FC]">
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center">
          <span className="text-3xl font-semibold text-gray-400">
            {collegeInfo?.name?.charAt(0) || "—"}
          </span>
        </div>

        <div className="flex-1">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900">
            {collegeInfo?.name || "Not provided"}
          </h2>
          {!isEditingInfo ? (
            <p className="text-gray-600 text-sm mt-1">
              {editableCourse}
            </p>
          ) : (
            <input
              type="text"
              value={editableCourse}
              onChange={(e) => setEditableCourse(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter course name"
            />
          )}

          {!isEditingInfo ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-4 text-sm">
              <div>
                <p className="text-gray-500">Student ID</p>
                <p className="font-medium text-gray-900">
                  {editableStudentId}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Current Semester</p>
                <p className="font-medium text-gray-900">
                  {editableSemester}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Batch</p>
                <p className="font-medium text-gray-900">
                  {editableBatch}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1.5">Student ID</p>
                <input
                  type="text"
                  value={editableStudentId}
                  onChange={(e) => setEditableStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <p className="text-gray-500 mb-1.5">Current Semester</p>
                <input
                  type="text"
                  value={editableSemester}
                  onChange={(e) => setEditableSemester(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <p className="text-gray-500 mb-1.5">Batch</p>
                <input
                  type="text"
                  value={editableBatch}
                  onChange={(e) => setEditableBatch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        {!isEditingInfo ? (
          <>
            <button
              onClick={() => setIsEditingInfo(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-blue-500 text-sm text-blue-600 rounded-lg hover:bg-blue-50 transition"
            >
              <Edit className="h-4 w-4" />
              Edit Info
            </button>
            <button
              onClick={() =>
                window.open(`/profile/college/${collegeInfo?._id}`, "_blank")
              }
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-blue-500 text-sm text-blue-600 rounded-lg hover:bg-blue-50 transition"
            >
              <Eye className="h-4 w-4" />
              View College
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                // Save logic here - would typically call an API
                setIsEditingInfo(false);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-sm text-white rounded-lg hover:bg-blue-700 transition"
            >
              <CheckCircle className="h-4 w-4" />
              Save
            </button>
            <button
              onClick={() => {
                // Cancel and revert changes
                setEditableStudentId(studentInfo?.studentId || '');
                setEditableCourse(studentInfo?.course || '');
                setEditableSemester(studentInfo?.currentSemester || '');
                setEditableBatch(studentInfo?.currentBatch || '');
                setIsEditingInfo(false);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              <XCircle className="h-4 w-4" />
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  </div>

  {/* Document Verification Status */}
  <div className="bg-white px-6 py-5 lg:px-8 lg:py-6 rounded-2xl shadow-sm border border-[#2791FC]">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-50 rounded-[6.75px] flex items-center justify-center">
          <FileText className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-base lg:text-lg font-semibold text-gray-900">
            Document Verification Status
          </h3>
          <p className="text-sm text-gray-600">
            {verifiedCount} of {documents.length} documents verified
          </p>
        </div>
      </div>

      <button
        onClick={() => setShowDocumentModal(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-white shadow-sm transition"
        style={{ background: "linear-gradient(to right, #2691FC, #0377EB)" }}
      >
        <Upload className="h-4 w-4" />
        Manage Documents
      </button>
    </div>

    {/* Progress Bar */}
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs sm:text-sm text-gray-600">
          Overall progress
        </span>
        <span className="text-xs sm:text-sm font-semibold text-gray-900">
          {calculateProgress()}%
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${getProgressColor()}`}
          style={{ width: `${calculateProgress()}%` }}
        />
      </div>
    </div>

    {/* Status Legend */}
    <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm">
      <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <span className="text-gray-700">Verified</span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-yellow-500" />
        <span className="text-gray-700">Pending</span>
      </div>
      <div className="flex items-center gap-2">
        <XCircle className="h-4 w-4 text-red-500" />
        <span className="text-gray-700">Rejected</span>
      </div>
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-gray-400" />
        <span className="text-gray-700">Not Uploaded</span>
      </div>
    </div>
  </div>

  {/* Small Stats Row */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {/* Partner Companies Stat */}
    <div className="bg-white px-5 py-4 rounded-2xl shadow-sm border border-gray-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">Partner Companies</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-gray-900">
              {partnerCompanies.length}
            </p>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">This week</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
          <Building2 className="h-4 w-4 text-blue-600" />
        </div>
      </div>
    </div>

    {/* Job Postings Stat */}
    <div className="bg-white px-5 py-4 rounded-2xl shadow-sm border border-gray-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">Job Postings</p>
          <p className="text-2xl font-bold text-gray-900">20</p>
          <p className="text-[11px] text-gray-500 mt-1">
            Tomorrow morning 10AM
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
          <BriefcaseBusiness className="h-4 w-4 text-green-600" />
        </div>
      </div>
    </div>
  </div>

  {/* Bottom Grid */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Partner Companies List */}
    <div className="bg-white px-6 py-5 lg:px-7 lg:py-6 rounded-2xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Partner Companies
          </h3>
          <p className="text-xs text-gray-500">
            Companies recruiting from your college
          </p>
        </div>
        <button
          onClick={() => setShowAllCompanies(true)}
          className="text-xs sm:text-sm text-[#0377EB] hover:text-blue-700 font-medium"
        >
          View All
        </button>
      </div>

      <div className="space-y-3">
        {displayedCompanies.slice(0, 3).map((company) => (
          <div
            key={company._id}
            className="flex items-center justify-between bg-[#F5FAFF] rounded-[12px] px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-xs font-semibold text-white">
                  {company.name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {company.name}
                </p>
                <p className="text-xs text-gray-500">{company.type}</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#2791FC] text-[11px] text-white font-medium">
              {company.openings} openings
            </span>
          </div>
        ))}
      </div>
    </div>

    {/* Placement Office Contact */}
    <div className="bg-white px-6 py-5 lg:px-7 lg:py-6 rounded-2xl shadow-sm border border-gray-200">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-blue-50 rounded-[6.75px] flex items-center justify-center">
          <Phone className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Placement Office Contact
          </h3>
          <p className="text-xs text-gray-500">
            Reach out for guidance and support
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Placement Officer Card */}
        <div className="flex items-center gap-3 rounded-[8px] border border-gray-100 bg-gray-50/60 px-4 py-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-semibold">DR</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">
              Dr. Rajesh Kumar
            </p>
            <p className="text-xs text-gray-500 mb-2">Placement Officer</p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                <span>placement@abc.ac.in</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" />
                <span>+91 1011001101</span>
              </div>
            </div>
          </div>
        </div>

{/* General Contact */}
<div className="flex items-center gap-3 rounded-[8px] border border-gray-100 bg-gray-50/60 px-4 py-3">
  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
    <span className="text-white text-sm font-semibold">GC</span>
  </div>

  <div className="flex-1">
    <p className="text-sm font-semibold text-gray-900">General Contact</p>

    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-600 mt-1">
      <div className="flex items-center gap-2">
        <Mail className="h-3.5 w-3.5" />
        <span>placement@abc.ac.in</span>
      </div>

      <div className="flex items-center gap-2">
        <Phone className="h-3.5 w-3.5" />
        <span>+91 1011001101</span>
      </div>
    </div>
  </div>
</div>

      </div>
    </div>
  </div>
</div>


      {/* Document Management Modal */}
      {showDocumentModal && (
        <DocumentManagementModal
          documents={documents}
          onClose={() => setShowDocumentModal(false)}
          onViewDocument={(doc) => {
            setSelectedDocument(doc);
            setShowDocumentModal(false);
          }}
          onUpload={(docType) => {
            setUploadDocumentType(docType);
            setShowUploadModal(true);
            setShowDocumentModal(false);
          }}
        />
      )}

      {/* Document Preview Modal */}
      {selectedDocument && (
        <DocumentPreviewModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onReupload={() => {
            setUploadDocumentType(selectedDocument.documentType);
            setShowUploadModal(true);
            setSelectedDocument(null);
          }}
        />
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <UploadDocumentModal
          documentType={uploadDocumentType}
          onClose={() => {
            setShowUploadModal(false);
            setUploadDocumentType('');
          }}
          onUpload={(file) => {
            console.log('Upload file:', file);
            setShowUploadModal(false);
            setUploadDocumentType('');
          }}
        />
      )}

      {/* All Partner Companies Modal */}
      {showAllCompanies && (
        <AllPartnerCompaniesModal
          companies={partnerCompanies}
          onClose={() => setShowAllCompanies(false)}
        />
      )}
    </div>
  );
};

// Document Management Modal Component
const DocumentManagementModal: React.FC<{
  documents: Document[];
  onClose: () => void;
  onViewDocument: (doc: Document) => void;
  onUpload: (docType: string) => void;
}> = ({ documents, onClose, onViewDocument, onUpload }) => {
  const [localDocuments, setLocalDocuments] = React.useState<Document[]>(documents);
  
  const verifiedCount = localDocuments.filter(doc => doc.status === 'Verified').length;
  const pendingCount = localDocuments.filter(doc => doc.status === 'Pending').length;
  const rejectedCount = localDocuments.filter(doc => doc.status === 'Rejected').length;
  const calculateProgress = () => Math.round((verifiedCount / localDocuments.length) * 100);
  
  const selectedCount = localDocuments.filter(doc => doc.selected).length;
  const allSelected = localDocuments.length > 0 && selectedCount === localDocuments.length;

  const handleSelectAll = () => {
    setLocalDocuments(localDocuments.map(doc => ({ ...doc, selected: !allSelected })));
  };

  const handleToggleDocument = (documentType: string) => {
    setLocalDocuments(localDocuments.map(doc =>
      doc.documentType === documentType ? { ...doc, selected: !doc.selected } : doc
    ));
  };

  const handleVerifySelected = () => {
    setLocalDocuments(localDocuments.map(doc =>
      doc.selected ? { ...doc, status: 'Verified', selected: false } : doc
    ));
  };

  const handleRejectSelected = () => {
    setLocalDocuments(localDocuments.map(doc =>
      doc.selected ? { ...doc, status: 'Rejected', selected: false } : doc
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Verified':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'Pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'Rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'Verified':
        return 'bg-green-50 border-green-200';
      case 'Pending':
        return 'bg-yellow-50 border-yellow-200';
      case 'Rejected':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
  <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
    {/* Header */}
    <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Document Management</h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage and verify your application documents
        </p>
      </div>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 transition"
      >
        <XCircle className="h-6 w-6" />
      </button>
    </div>

    {/* Body */}
    <div className="px-8 py-6 space-y-5">
      {/* Document Verification Status */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/60 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Document Verification Status
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">
                {verifiedCount} of {localDocuments.length} documents verified
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {calculateProgress()}%
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Complete</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="w-full h-2 rounded-full bg-blue-100">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>
      </div>
      {/* Action Required Alert */}
      {(rejectedCount > 0 || pendingCount > 0) && (
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-yellow-100 flex items-center justify-center mt-0.5">
              <AlertCircle className="h-4 w-4 text-yellow-700" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-yellow-900">
                Action Required
              </h4>
              <ul className="mt-1.5 text-xs sm:text-sm text-yellow-900 space-y-1 list-disc list-inside">
                {pendingCount > 0 && (
                  <li>
                    {pendingCount} document(s) pending verification
                  </li>
                )}
                {rejectedCount > 0 && (
                  <li>
                    {rejectedCount} document(s) rejected – needs re-upload
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Documents List */}
      <div className="space-y-4">
        {localDocuments.map((doc) => {
          const status = doc.status;
          const isVerified = status === "Verified";
          const isPending = status === "Pending";
          const isRejected = status === "Rejected";

          const leftBorder =
            isVerified
              ? "border-l-4 border-l-green-500"
              : isPending
              ? "border-l-4 border-l-yellow-400"
              : "border-l-4 border-l-red-500";

          const statusPillClasses = isVerified
            ? "bg-green-50 text-green-700"
            : isPending
            ? "bg-yellow-50 text-yellow-700"
            : "bg-red-50 text-red-600";

          return (
            <div
              key={doc._id}
              className={`rounded-2xl border border-blue-100 bg-white px-6 py-4 ${leftBorder}`}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                {/* Left section */}
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">
                    {getStatusIcon(doc.status)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">
                          {doc.name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Accepted formats: {doc.acceptedFormats}
                        </p>
                      </div>

                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium ${statusPillClasses}`}
                      >
                        {status}
                      </span>
                    </div>

                    {/* Dates / extra info */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mt-2">
                      {doc.uploadDate && (
                        <span>Uploaded: {doc.uploadDate}</span>
                      )}

                      {doc.verificationDate && isVerified && (
                        <span className="text-green-600">
                          Verified on {doc.verificationDate}
                        </span>
                      )}

                      {isRejected && doc.rejectionReason && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-50 text-[11px] text-red-600 font-medium">
                          Missing Docs
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right section – actions */}
                <div className="flex flex-wrap gap-2 md:items-end">
                  {isRejected ? (
                    <button
                      onClick={() => onUpload(doc.documentType)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
                    >
                      <Upload className="h-4 w-4" />
                      Re-upload
                    </button>
                  ) : null}
                  {(isPending || isRejected) && (
                    <button
                      onClick={() => onUpload(doc.documentType)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
                    >
                      <Upload className="h-4 w-4" />
                      {isRejected ? "Re-upload" : "Upload"}
                    </button>
                  )}
                  <button
                    onClick={() => onViewDocument(doc)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-blue-500 text-blue-600 text-sm font-medium hover:bg-blue-50 transition"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onClose}
          className="px-6 py-2 rounded-lg border border-blue-500 text-blue-600 text-sm font-medium hover:bg-blue-50 transition"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</div>
  );
};

// Document Preview Modal Component
const DocumentPreviewModal: React.FC<{
  document: Document;
  onClose: () => void;
  onReupload: () => void;
}> = ({ document, onClose, onReupload }) => {
  const isRejected = document.status === 'Rejected';
  const isPending = document.status === 'Pending';
  const isVerified = document.status === 'Verified';

  const getStatusIcon = () => {
    if (isVerified) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (isPending) return <Clock className="h-5 w-5 text-yellow-600" />;
    if (isRejected) return <XCircle className="h-5 w-5 text-red-600" />;
    return <AlertCircle className="h-5 w-5 text-gray-400" />;
  };

  const getStatusBgColor = () => {
    if (isVerified) return 'bg-green-50';
    if (isPending) return 'bg-yellow-50';
    if (isRejected) return 'bg-red-50';
    return 'bg-gray-50';
  };

  const getStatusTextColor = () => {
    if (isVerified) return 'text-green-600';
    if (isPending) return 'text-yellow-600';
    if (isRejected) return 'text-red-600';
    return 'text-gray-600';
  };

  const getStatusLabel = () => {
    if (isVerified) return 'Verified';
    if (isPending) return 'Pending Review';
    if (isRejected) return 'Reupload';
    return document.status;
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between px-8 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isRejected ? 'Document Rejected' : 'Document Preview'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{document.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-5">
          {/* Status Card */}
          <div className={`rounded-2xl ${getStatusBgColor()} border ${isVerified ? 'border-green-200' : isPending ? 'border-yellow-200' : isRejected ? 'border-red-200' : 'border-gray-200'} px-6 py-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon()}
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{document.name}</h3>
                  <p className="text-sm text-gray-600 mt-0.5">Updated: {document.uploadDate}</p>
                </div>
              </div>
              <span className={`px-4 py-1.5 rounded-lg text-sm font-medium ${getStatusBgColor()} ${getStatusTextColor()}`}>
                {getStatusLabel()}
              </span>
            </div>
          </div>

          {/* Uploaded Document */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Uploaded Document</h4>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{document.name}</p>
                  <p className="text-xs text-gray-500">{document.fileSize}</p>
                </div>
              </div>
              <button className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition">
                <Eye className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Document Information */}
          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-4">Document Information</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Document Type:</span>
                <span className="font-medium text-gray-900">PDF</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">File Name:</span>
                <span className="font-medium text-gray-900">{document.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Upload Date:</span>
                <span className="font-medium text-gray-900">{document.uploadDate}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${getStatusTextColor()}`}>
                  {document.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-blue-500 text-blue-600 text-sm font-medium hover:bg-blue-50 transition"
          >
            Close
          </button>
          {isRejected && (
            <button
              onClick={onReupload}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm font-medium"
            >
              <Upload className="h-4 w-4" />
              Re-upload
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Upload Document Modal Component
const UploadDocumentModal: React.FC<{
  documentType: string;
  onClose: () => void;
  onUpload: (file: File) => void;
}> = ({ documentType, onClose, onUpload }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Upload Document</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm text-gray-600 mb-6">Upload your {documentType}</p>

          {/* Upload Area */}
          <div className="bg-white rounded-2xl p-16 border-2 border-dashed border-gray-300 text-center mb-4">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-700 mb-2">Document Preview</h3>
            <p className="text-sm text-gray-500 mb-6">Upload document file/pdf.</p>
            
            <label className="cursor-pointer">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
              />
              <span className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                <Upload className="h-4 w-4" />
                Browse Files
              </span>
            </label>
            
            <p className="text-xs text-gray-500 mt-4">PDF, DOC Max 5MB</p>
          </div>

          {selectedFile && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
          >
            Close
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile}
            className={`px-6 py-2 rounded-lg transition flex items-center gap-2 text-sm font-medium ${
              selectedFile
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Upload className="h-4 w-4" />
            Upload
          </button>
        </div>
      </div>
    </div>
  );
};

// All Partner Companies Modal Component
const AllPartnerCompaniesModal: React.FC<{
  companies: Company[];
  onClose: () => void;
}> = ({ companies, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All Type');

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All Type' || company.type === filterType;
    return matchesSearch && matchesType;
  });

  const onViewCompany = (company: Company) => {
    console.log('View company:', company);
    // You can add navigation or modal logic here
  };

  return (
<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
  <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
    {/* Header */}
    <div className="flex items-start justify-between px-8 pt-6 pb-4">
      <div>
        <h2 className="text-xl font-semibold text-blue-600">
          All Partner Companies
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {filteredCompanies.length} companies actively recruiting from ABC University
        </p>
      </div>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 transition mt-1"
      >
        <X className="h-5 w-5" />
      </button>
    </div>

    {/* Body */}
    <div className="px-8 pb-6">
      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="flex-1 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2">
            <Search className="h-4 w-4 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search partner companies"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-2xl border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filter (simple native select styled like pill) */}
        <div className="w-full md:w-44 relative">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full h-11 pl-4 pr-9 rounded-2xl border border-gray-200 bg-white text-sm text-gray-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="All Type">All Type</option>
            <option value="Technology">Technology</option>
            <option value="Fintech Company">Fintech Company</option>
            <option value="Design">Design</option>
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </span>
        </div>
      </div>

      {/* Companies List */}
      <div className="space-y-4">
        {filteredCompanies.map((company) => (
          <div
            key={company._id}
            className="rounded-2xl border border-blue-100 border-l-4 border-l-blue-500 bg-white px-6 py-4"
          >
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Avatar + content */}
              <div className="flex items-start gap-4 flex-1">
                <div className="w-14 h-14 rounded-full bg-purple-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-semibold text-purple-700">
                    {company.name.charAt(0)}
                  </span>
                </div>

                <div className="flex-1">
                  {/* Top row: name, type, openings pill */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                        {company.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {company.type}
                      </p>
                    </div>

                    <span className="self-start px-3 py-1 rounded-full bg-blue-500 text-[11px] sm:text-xs text-white font-medium">
                      {company.openings} Openings
                    </span>
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs sm:text-sm text-gray-600 mb-2.5">
                    <span>
                      <span className="text-gray-500">Founded Year: </span>
                      {company.foundedYear}
                    </span>
                    <span>
                      <span className="text-gray-500">Employees: </span>
                      {company.employees}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {company.location}
                    </span>
                  </div>

                  {/* Website */}
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-3">
                    <span>
                      Website:{" "}
                      <span className="text-blue-600">
                        {company.website}
                      </span>
                    </span>
                  </div>

                  {/* About */}
                  <div className="mb-3">
                    <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      About the Company:
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                      {company.description}
                    </p>
                  </div>

                  {/* Button */}
                  <button
                    onClick={() => onViewCompany(company)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-blue-500 text-blue-600 text-xs sm:text-sm font-medium hover:bg-blue-50 transition"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredCompanies.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">
            No companies found for the selected filters.
          </p>
        )}
      </div>
    </div>
  </div>
</div>

  );
};

export default MyCollegeSection;
