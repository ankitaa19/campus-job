import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Users, 
  Search, 
  Filter, 
  Eye,
  MoreVertical,
  ChevronLeft,
  Building2,
  Globe,
  FileText,
  MessageSquare,
  Star,
  UserCheck,
  X
} from 'lucide-react';
import CandidateProfileModal from './CandidateProfileModal';
import SendMessageModal from './SendMessageModal';
import SendAssignmentModal, { AssignmentData } from './SendAssignmentModal';
import ScheduleInterviewModal from './ScheduleInterviewModal';
import AssignmentsSection, { Assignment } from './AssignmentsSection';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  match: number;
  status: 'Applied' | 'Shortlisted' | 'Interview' | 'Offered' | 'Hired' | 'Rejected';
  appliedDate: string;
  college?: string;
  source: 'college' | 'public';
}

interface College {
  id: string;
  name: string;
  location: string;
  type: 'Partnered' | 'Direct';
  candidates: Candidate[];
  stats: {
    total: number;
    shortlisted: number;
    interviews: number;
    avgMatch: string;
  };
}

interface JobApplicationsViewProps {
  jobId: string;
  jobTitle?: string;
  onBack: () => void;
}

const JobApplicationsView: React.FC<JobApplicationsViewProps> = ({ jobId, jobTitle = 'Software Engineer', onBack }) => {
  const [activeMainTab, setActiveMainTab] = useState<'all' | 'college' | 'public' | 'assignments'>('all');
  const [activeSubTab, setActiveSubTab] = useState<'total' | 'shortlisted' | 'interview' | 'offers' | 'hired'>('total');
  
  // Assignments state with localStorage persistence
  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`assignments-${jobId}`);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Persist assignments to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`assignments-${jobId}`, JSON.stringify(assignments));
    }
  }, [assignments, jobId]);
  
  // Mock data for colleges with their applicants
  const [colleges, setColleges] = useState<College[]>([
    {
      id: '1',
      name: 'IIT Bombay',
      location: 'Mumbai, Maharashtra',
      type: 'Partnered',
      stats: { total: 10, shortlisted: 5, interviews: 3, avgMatch: '85%' },
      candidates: [
        { id: 'c1', name: 'Rahul Sharma', email: 'rahul.sharma@iitb.ac.in', match: 92, status: 'Applied', appliedDate: '2024-01-15', source: 'college' },
        { id: 'c2', name: 'Priya Patel', email: 'priya.patel@iitb.ac.in', match: 88, status: 'Shortlisted', appliedDate: '2024-01-14', source: 'college' },
        { id: 'c3', name: 'Amit Kumar', email: 'amit.kumar@iitb.ac.in', match: 85, status: 'Interview', appliedDate: '2024-01-13', source: 'college' },
        { id: 'c4', name: 'Sneha Reddy', email: 'sneha.reddy@iitb.ac.in', match: 90, status: 'Shortlisted', appliedDate: '2024-01-12', source: 'college' },
        { id: 'c5', name: 'Vikram Singh', email: 'vikram.singh@iitb.ac.in', match: 78, status: 'Applied', appliedDate: '2024-01-11', source: 'college' },
        { id: 'c6', name: 'Anjali Gupta', email: 'anjali.gupta@iitb.ac.in', match: 87, status: 'Interview', appliedDate: '2024-01-10', source: 'college' },
        { id: 'c7', name: 'Rohan Mehta', email: 'rohan.mehta@iitb.ac.in', match: 83, status: 'Shortlisted', appliedDate: '2024-01-09', source: 'college' },
        { id: 'c8', name: 'Kavya Iyer', email: 'kavya.iyer@iitb.ac.in', match: 76, status: 'Applied', appliedDate: '2024-01-08', source: 'college' },
        { id: 'c9', name: 'Arjun Verma', email: 'arjun.verma@iitb.ac.in', match: 91, status: 'Shortlisted', appliedDate: '2024-01-07', source: 'college' },
        { id: 'c10', name: 'Meera Shah', email: 'meera.shah@iitb.ac.in', match: 84, status: 'Interview', appliedDate: '2024-01-06', source: 'college' },
      ]
    },
    {
      id: '2',
      name: 'NIT Trichy',
      location: 'Tiruchirappalli, Tamil Nadu',
      type: 'Partnered',
      stats: { total: 8, shortlisted: 4, interviews: 2, avgMatch: '82%' },
      candidates: [
        { id: 'c11', name: 'Karthik Raja', email: 'karthik@nitt.edu', match: 89, status: 'Shortlisted', appliedDate: '2024-01-15', source: 'college' },
        { id: 'c12', name: 'Divya Krishnan', email: 'divya@nitt.edu', match: 86, status: 'Applied', appliedDate: '2024-01-14', source: 'college' },
        { id: 'c13', name: 'Suresh Babu', email: 'suresh@nitt.edu', match: 80, status: 'Interview', appliedDate: '2024-01-13', source: 'college' },
        { id: 'c14', name: 'Lakshmi Menon', email: 'lakshmi@nitt.edu', match: 88, status: 'Shortlisted', appliedDate: '2024-01-12', source: 'college' },
        { id: 'c15', name: 'Rajesh Kumar', email: 'rajesh@nitt.edu', match: 75, status: 'Applied', appliedDate: '2024-01-11', source: 'college' },
        { id: 'c16', name: 'Pooja Nair', email: 'pooja@nitt.edu', match: 83, status: 'Shortlisted', appliedDate: '2024-01-10', source: 'college' },
        { id: 'c17', name: 'Vishnu Prasad', email: 'vishnu@nitt.edu', match: 79, status: 'Applied', appliedDate: '2024-01-09', source: 'college' },
        { id: 'c18', name: 'Deepa Rao', email: 'deepa@nitt.edu', match: 85, status: 'Interview', appliedDate: '2024-01-08', source: 'college' },
      ]
    },
    {
      id: '4',
      name: 'VIT Vellore',
      location: 'Vellore, Tamil Nadu',
      type: 'Partnered',
      stats: { total: 15, shortlisted: 8, interviews: 5, avgMatch: '83%' },
      candidates: [
        { id: 'c31', name: 'Akash Kumar', email: 'akash@vit.ac.in', match: 92, status: 'Shortlisted', appliedDate: '2024-01-15', source: 'college' },
        { id: 'c32', name: 'Simran Kaur', email: 'simran@vit.ac.in', match: 89, status: 'Interview', appliedDate: '2024-01-14', source: 'college' },
        { id: 'c33', name: 'Harish Reddy', email: 'harish@vit.ac.in', match: 87, status: 'Shortlisted', appliedDate: '2024-01-13', source: 'college' },
        { id: 'c34', name: 'Prerna Shah', email: 'prerna@vit.ac.in', match: 85, status: 'Applied', appliedDate: '2024-01-12', source: 'college' },
        { id: 'c35', name: 'Karan Singh', email: 'karan@vit.ac.in', match: 90, status: 'Interview', appliedDate: '2024-01-11', source: 'college' },
        { id: 'c36', name: 'Nisha Patel', email: 'nisha@vit.ac.in', match: 83, status: 'Shortlisted', appliedDate: '2024-01-10', source: 'college' },
        { id: 'c37', name: 'Yash Thakur', email: 'yash@vit.ac.in', match: 81, status: 'Applied', appliedDate: '2024-01-09', source: 'college' },
        { id: 'c38', name: 'Ritika Joshi', email: 'ritika@vit.ac.in', match: 88, status: 'Interview', appliedDate: '2024-01-08', source: 'college' },
        { id: 'c39', name: 'Gaurav Mishra', email: 'gaurav@vit.ac.in', match: 84, status: 'Shortlisted', appliedDate: '2024-01-07', source: 'college' },
        { id: 'c40', name: 'Swati Rao', email: 'swati@vit.ac.in', match: 86, status: 'Applied', appliedDate: '2024-01-06', source: 'college' },
        { id: 'c41', name: 'Abhishek Das', email: 'abhishek@vit.ac.in', match: 89, status: 'Shortlisted', appliedDate: '2024-01-05', source: 'college' },
        { id: 'c42', name: 'Pallavi Mehta', email: 'pallavi@vit.ac.in', match: 87, status: 'Interview', appliedDate: '2024-01-04', source: 'college' },
        { id: 'c43', name: 'Rohit Sharma', email: 'rohit.s@vit.ac.in', match: 82, status: 'Shortlisted', appliedDate: '2024-01-03', source: 'college' },
        { id: 'c44', name: 'Sakshi Agarwal', email: 'sakshi@vit.ac.in', match: 85, status: 'Applied', appliedDate: '2024-01-02', source: 'college' },
        { id: 'c45', name: 'Nitin Kumar', email: 'nitin@vit.ac.in', match: 88, status: 'Interview', appliedDate: '2024-01-01', source: 'college' },
      ]
    },
    {
      id: '6',
      name: 'Anna University',
      location: 'Chennai, Tamil Nadu',
      type: 'Partnered',
      stats: { total: 11, shortlisted: 5, interviews: 4, avgMatch: '84%' },
      candidates: [
        { id: 'c55', name: 'Arvind Kumar', email: 'arvind@annauniv.edu', match: 91, status: 'Shortlisted', appliedDate: '2024-01-15', source: 'college' },
        { id: 'c56', name: 'Mythili Raman', email: 'mythili@annauniv.edu', match: 88, status: 'Interview', appliedDate: '2024-01-14', source: 'college' },
        { id: 'c57', name: 'Selva Kumar', email: 'selva@annauniv.edu', match: 86, status: 'Shortlisted', appliedDate: '2024-01-13', source: 'college' },
        { id: 'c58', name: 'Priya Devi', email: 'priya.d@annauniv.edu', match: 84, status: 'Applied', appliedDate: '2024-01-12', source: 'college' },
        { id: 'c59', name: 'Murugan Raj', email: 'murugan@annauniv.edu', match: 89, status: 'Interview', appliedDate: '2024-01-11', source: 'college' },
        { id: 'c60', name: 'Kavitha Subramanian', email: 'kavitha@annauniv.edu', match: 82, status: 'Shortlisted', appliedDate: '2024-01-10', source: 'college' },
        { id: 'c61', name: 'Bala Krishna', email: 'bala@annauniv.edu', match: 80, status: 'Applied', appliedDate: '2024-01-09', source: 'college' },
        { id: 'c62', name: 'Vasanth Kumar', email: 'vasanth@annauniv.edu', match: 87, status: 'Interview', appliedDate: '2024-01-08', source: 'college' },
        { id: 'c63', name: 'Janani Ramesh', email: 'janani@annauniv.edu', match: 83, status: 'Shortlisted', appliedDate: '2024-01-07', source: 'college' },
        { id: 'c64', name: 'Saravanan Pillai', email: 'saravanan@annauniv.edu', match: 85, status: 'Applied', appliedDate: '2024-01-06', source: 'college' },
        { id: 'c65', name: 'Nandini Iyer', email: 'nandini@annauniv.edu', match: 88, status: 'Interview', appliedDate: '2024-01-05', source: 'college' },
      ]
    },
    {
      id: '8',
      name: 'PSG College of Technology',
      location: 'Coimbatore, Tamil Nadu',
      type: 'Partnered',
      stats: { total: 13, shortlisted: 7, interviews: 4, avgMatch: '86%' },
      candidates: [
        { id: 'c73', name: 'Senthil Kumar', email: 'senthil@psgtech.edu', match: 92, status: 'Shortlisted', appliedDate: '2024-01-15', source: 'college' },
        { id: 'c74', name: 'Mahalakshmi Ravi', email: 'mahalakshmi@psgtech.edu', match: 90, status: 'Interview', appliedDate: '2024-01-14', source: 'college' },
        { id: 'c75', name: 'Karthi Raja', email: 'karthi@psgtech.edu', match: 88, status: 'Shortlisted', appliedDate: '2024-01-13', source: 'college' },
        { id: 'c76', name: 'Sangeetha Mohan', email: 'sangeetha@psgtech.edu', match: 86, status: 'Applied', appliedDate: '2024-01-12', source: 'college' },
        { id: 'c77', name: 'Venkat Subramanian', email: 'venkat@psgtech.edu', match: 91, status: 'Interview', appliedDate: '2024-01-11', source: 'college' },
        { id: 'c78', name: 'Kalpana Devi', email: 'kalpana@psgtech.edu', match: 84, status: 'Shortlisted', appliedDate: '2024-01-10', source: 'college' },
        { id: 'c79', name: 'Ramesh Babu', email: 'ramesh@psgtech.edu', match: 82, status: 'Applied', appliedDate: '2024-01-09', source: 'college' },
        { id: 'c80', name: 'Indira Krishnan', email: 'indira@psgtech.edu', match: 89, status: 'Interview', appliedDate: '2024-01-08', source: 'college' },
        { id: 'c81', name: 'Mahesh Kumar', email: 'mahesh@psgtech.edu', match: 85, status: 'Shortlisted', appliedDate: '2024-01-07', source: 'college' },
        { id: 'c82', name: 'Sowmya Reddy', email: 'sowmya@psgtech.edu', match: 87, status: 'Applied', appliedDate: '2024-01-06', source: 'college' },
        { id: 'c83', name: 'Dinesh Raj', email: 'dinesh@psgtech.edu', match: 90, status: 'Shortlisted', appliedDate: '2024-01-05', source: 'college' },
        { id: 'c84', name: 'Lavanya Pillai', email: 'lavanya@psgtech.edu', match: 88, status: 'Interview', appliedDate: '2024-01-04', source: 'college' },
        { id: 'c85', name: 'Surya Prakash', email: 'surya@psgtech.edu', match: 83, status: 'Shortlisted', appliedDate: '2024-01-03', source: 'college' },
      ]
    },
    {
      id: '10',
      name: 'Jadavpur University',
      location: 'Kolkata, West Bengal',
      type: 'Partnered',
      stats: { total: 6, shortlisted: 3, interviews: 2, avgMatch: '79%' },
      candidates: [
        { id: 'c100', name: 'Saurabh Ghosh', email: 'saurabh@jadavpuruniversity.in', match: 87, status: 'Shortlisted', appliedDate: '2024-01-15', source: 'college' },
        { id: 'c101', name: 'Ritu Sen', email: 'ritu@jadavpuruniversity.in', match: 84, status: 'Interview', appliedDate: '2024-01-14', source: 'college' },
        { id: 'c102', name: 'Subrata Das', email: 'subrata@jadavpuruniversity.in', match: 82, status: 'Shortlisted', appliedDate: '2024-01-13', source: 'college' },
        { id: 'c103', name: 'Moumita Roy', email: 'moumita@jadavpuruniversity.in', match: 80, status: 'Applied', appliedDate: '2024-01-12', source: 'college' },
        { id: 'c104', name: 'Arnab Chakraborty', email: 'arnab@jadavpuruniversity.in', match: 85, status: 'Interview', appliedDate: '2024-01-11', source: 'college' },
        { id: 'c105', name: 'Shreya Banerjee', email: 'shreya@jadavpuruniversity.in', match: 78, status: 'Shortlisted', appliedDate: '2024-01-10', source: 'college' },
      ]
    }
  ]);

  const [publicCandidates, setPublicCandidates] = useState<Candidate[]>([
    {
      id: '5',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@gmail.com',
      phone: '+91 1056101010',
      match: 87,
      status: 'Offered',
      appliedDate: '24-09-2025',
      source: 'public'
    },
    {
      id: '6',
      name: 'Priya Patel',  
      email: 'priya.patel@gmail.com',
      phone: '+91 1056101010',
      match: 87,
      status: 'Hired',
      appliedDate: '10-09-2025',
      source: 'public'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [candidateToSchedule, setCandidateToSchedule] = useState<Candidate | null>(null);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);

  const handleViewApplication = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCandidate(null);
  };

  const handleViewCollegeApplicants = (college: College) => {
    setSelectedCollege(college);
  };

  const handleBackToColleges = () => {
    setSelectedCollege(null);
  };

  // Get available status options based on current status
  const getAvailableStatusOptions = (currentStatus: string) => {
    switch (currentStatus) {
      case 'Applied':
        return ['Applied', 'Shortlisted', 'Interview', 'Offered', 'Hired', 'Rejected'];
      case 'Shortlisted':
        return ['Shortlisted', 'Interview', 'Offered', 'Hired', 'Rejected'];
      case 'Interview':
        return ['Interview', 'Offered', 'Hired', 'Rejected'];
      case 'Offered':
        return ['Offered', 'Hired', 'Rejected'];
      case 'Hired':
        return ['Hired']; // No changes allowed
      case 'Rejected':
        return ['Rejected'];
      default:
        return ['Applied', 'Shortlisted', 'Interview', 'Offered', 'Hired', 'Rejected'];
    }
  };

  const handleStatusChange = (candidateId: string, newStatus: 'Applied' | 'Shortlisted' | 'Interview' | 'Offered' | 'Hired' | 'Rejected') => {
    // Find the candidate to get their details for the schedule modal
    let candidateToUpdate: Candidate | null = null;
    
    setColleges(prev => prev.map(college => ({
      ...college,
      candidates: college.candidates.map(candidate => {
        if (candidate.id === candidateId) {
          candidateToUpdate = { ...candidate, status: newStatus };
          return candidateToUpdate;
        }
        return candidate;
      })
    })));
    
    setPublicCandidates(prev => prev.map(candidate => {
      if (candidate.id === candidateId) {
        candidateToUpdate = { ...candidate, status: newStatus };
        return candidateToUpdate;
      }
      return candidate;
    }));
    
    // Update selected candidate if it's the same one
    if (selectedCandidate?.id === candidateId) {
      setSelectedCandidate(prev => prev ? { ...prev, status: newStatus } : null);
    }

    // Show schedule interview modal when status is changed to Interview
    if (newStatus === 'Interview' && candidateToUpdate) {
      setCandidateToSchedule(candidateToUpdate);
      setIsScheduleModalOpen(true);
    }
  };

  const handleSelectCandidate = (candidateId: string) => {
    const newSelected = new Set(selectedCandidates);
    if (newSelected.has(candidateId)) {
      newSelected.delete(candidateId);
    } else {
      newSelected.add(candidateId);
    }
    setSelectedCandidates(newSelected);
    setSelectAll(false);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCandidates(new Set());
      setSelectAll(false);
    } else {
      const allCandidateIds = new Set<string>();
      colleges.forEach(college => {
        college.candidates.forEach(candidate => {
          allCandidateIds.add(candidate.id);
        });
      });
      publicCandidates.forEach(candidate => {
        allCandidateIds.add(candidate.id);
      });
      setSelectedCandidates(allCandidateIds);
      setSelectAll(true);
    }
  };

  const handleSendMessage = () => {
    if (selectedCandidates.size > 0) {
      setIsMessageModalOpen(true);
    }
  };

  const handleSendAssignment = () => {
    if (selectedCandidates.size > 0) {
      setIsAssignmentModalOpen(true);
    }
  };

  const handleAssignmentSent = (data: AssignmentData) => {
    // Create assignment records for each selected candidate
    const newAssignments: Assignment[] = Array.from(selectedCandidates).map(candidateId => {
      const allCandidates = [...colleges.flatMap(c => c.candidates), ...publicCandidates];
      const candidate = allCandidates.find(c => c.id === candidateId);
      
      return {
        id: `assign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        candidateId: candidateId,
        candidateName: candidate?.name || data.candidateName,
        candidateEmail: candidate?.email || data.candidateEmail || '',
        college: candidate?.college || data.college,
        positionTitle: jobTitle, // Use the job title from props
        note: data.note,
        deadline: data.deadline,
        assignmentFile: data.assignmentFile,
        assignedAt: new Date().toISOString(),
        status: 'Sent' as const
      };
    });

    setAssignments(prev => [...newAssignments, ...prev]);
    setSelectedCandidates(new Set());
    setSelectAll(false);
  };

  const handleShortlist = () => {
    // Handle shortlist action
    console.log('Shortlisting candidates:', Array.from(selectedCandidates));
    setSelectedCandidates(new Set());
    setSelectAll(false);
  };

  const handleHire = () => {
    // Handle hire action
    console.log('Hiring candidates:', Array.from(selectedCandidates));
    setSelectedCandidates(new Set());
    setSelectAll(false);
  };

  const handleReject = () => {
    // Handle reject action
    console.log('Rejecting candidates:', Array.from(selectedCandidates));
    setSelectedCandidates(new Set());
    setSelectAll(false);
  };

  const handleScheduleInterview = (interviewData: any) => {
    console.log('Interview scheduled:', interviewData);
    // Here you can add logic to save the interview data
    setIsScheduleModalOpen(false);
    setCandidateToSchedule(null);
  };

  const handleCloseScheduleModal = () => {
    setIsScheduleModalOpen(false);
    setCandidateToSchedule(null);
  };

  // Get all candidates based on active main tab
  const getAllCandidates = (): Candidate[] => {
    if (activeMainTab === 'college') {
      return colleges.flatMap(c => c.candidates);
    } else if (activeMainTab === 'public') {
      return publicCandidates;
    } else {
      return [...colleges.flatMap(c => c.candidates), ...publicCandidates];
    }
  };

  // Get counts for each sub-tab
  const getTabCounts = () => {
    const allCandidates = getAllCandidates();
    return {
      total: allCandidates.length,
      shortlisted: allCandidates.filter(c => c.status === 'Shortlisted').length,
      interview: allCandidates.filter(c => c.status === 'Interview').length,
      offers: allCandidates.filter(c => c.status === 'Offered').length,
      hired: allCandidates.filter(c => c.status === 'Hired').length,
    };
  };

  const tabCounts = getTabCounts();

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Applied':
        return '';
      case 'Shortlisted':
        return '';
      case 'Interview':
        return '';
      case 'Offered':
        return '';
      case 'Hired':
        return '';
      case 'Rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Applied':
        return {
          backgroundColor: 'rgba(184, 187, 210, 0.25)',
          color: '#9297C0',
          border: 'none'
        };
      case 'Shortlisted':
        return {
          backgroundColor: 'rgba(24, 204, 96, 0.15)',
          color: '#00C950',
          border: 'none'
        };
      case 'Interview':
        return {
          backgroundColor: 'rgba(255, 132, 0, 0.12)',
          color: '#FF8400',
          border: 'none'
        };
      case 'Offered':
        return {
          backgroundColor: 'rgba(204, 177, 255, 0.20)',
          color: '#7F3DFF',
          border: 'none'
        };
      case 'Hired':
        return {
          backgroundColor: 'rgba(255, 51, 159, 0.15)',
          color: '#FF339F',
          border: 'none'
        };
      default:
        return {};
    }
  };

  // Render all applicants in a single table
  const renderAllApplicants = () => {
    if (activeMainTab !== 'all') return null;

    const allCandidates = [...colleges.flatMap(c => c.candidates), ...publicCandidates];
    const filteredCandidates = allCandidates.filter(c => {
      if (activeSubTab === 'total') return true; // Show all including rejected in total
      // Rejected applications only show in total tab, not in other status tabs
      if (c.status === 'Rejected') return false;
      const statusMap = {
        'shortlisted': 'Shortlisted',
        'interview': 'Interview',
        'offers': 'Offered',
        'hired': 'Hired'
      };
      return c.status === statusMap[activeSubTab];
    }).filter(c => {
      if (!searchTerm) return true;
      return c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             c.email.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input 
                    type="checkbox" 
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300" 
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Candidate</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Match</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Applied Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCandidates.map((candidate) => (
                <tr key={candidate.id} className={`hover:bg-gray-50 ${candidate.status === 'Rejected' ? 'bg-red-50 opacity-75' : ''}`}>
                  <td className="px-4 py-3">
                    <input 
                      type="checkbox" 
                      checked={selectedCandidates.has(candidate.id)}
                      onChange={() => handleSelectCandidate(candidate.id)}
                      className="rounded border-gray-300" 
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className={`font-medium ${candidate.status === 'Rejected' ? 'text-red-600 line-through' : 'text-gray-900'}`}>{candidate.name}</p>
                      <p className={`text-sm ${candidate.status === 'Rejected' ? 'text-red-500' : 'text-gray-500'}`}>{candidate.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${candidate.status === 'Rejected' ? 'text-red-600' : 'text-green-600'}`}>{candidate.match}%</span>
                  </td>
                  <td className="px-4 py-3">
                    {candidate.status === 'Hired' ? (
                      <span 
                        className="rounded-full px-3 py-1 text-xs font-medium"
                        style={getStatusStyle(candidate.status)}
                      >
                        Hired
                      </span>
                    ) : (
                      <select 
                        value={candidate.status}
                        onChange={(e) => handleStatusChange(candidate.id, e.target.value as 'Applied' | 'Shortlisted' | 'Interview' | 'Offered' | 'Hired' | 'Rejected')}
                        className="rounded-full px-3 py-1 text-xs font-medium border-none cursor-pointer"
                        style={getStatusStyle(candidate.status)}
                        disabled={candidate.status === 'Rejected'}
                      >
                        {getAvailableStatusOptions(candidate.status).map(status => (
                          <option key={status} value={status}>
                            {status === 'Offered' ? 'Offers' : status}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{candidate.appliedDate}</td>
                  <td className="px-4 py-3">
                    <button 
                              onClick={() => handleViewApplication(candidate)}
                      className="flex items-center gap-1 text-sm"
                      style={{ color: '#0A0A0A' }}
                    >
                      <Eye className="h-4 w-4" style={{ color: '#1383F3' }} />
                      View Application
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render college applicants grouped by college
  const renderCollegeApplicants = () => {
    if (activeMainTab !== 'college') return null;

    // If a specific college is selected, show its applicants
    if (selectedCollege) {
      return (
        <div>
          {/* Back Button */}
          <button
            onClick={handleBackToColleges}
            className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to College Applicants
          </button>

          {/* College Info Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <span className="text-lg font-semibold text-purple-600">
                  {selectedCollege.name.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="text-[16px]"><span className="font-bold text-gray-900">Applications from</span> <span className="font-bold" style={{ color: '#0377EB' }}>{selectedCollege.name}</span></h3>
                <p className="text-sm font-bold text-gray-500">Navigate through each stage of your recruitment pipeline</p>
              </div>
            </div>
          </div>

          {/* Applicants Table */}
          <div className="rounded-2xl bg-white shadow-sm" style={{ border: '1px solid #B8BBD2' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input 
                        type="checkbox" 
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300" 
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Candidate</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Match</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Courses</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Applied Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedCollege.candidates.filter(c => {
                    if (activeSubTab === 'total') return true;
                    if (c.status === 'Rejected') return false;
                    const statusMap = {
                      'shortlisted': 'Shortlisted',
                      'interview': 'Interview',
                      'offers': 'Offered',
                      'hired': 'Hired'
                    };
                    return c.status === statusMap[activeSubTab];
                  }).filter(c => {
                    if (!searchTerm) return true;
                    return c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           c.email.toLowerCase().includes(searchTerm.toLowerCase());
                  }).map((candidate) => (
                    <tr key={candidate.id} className={`hover:bg-gray-50 ${candidate.status === 'Rejected' ? 'bg-red-50 opacity-75' : ''}`}>
                      <td className="px-4 py-3">
                        <input 
                          type="checkbox" 
                          checked={selectedCandidates.has(candidate.id)}
                          onChange={() => handleSelectCandidate(candidate.id)}
                          className="rounded border-gray-300" 
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                            <span className="text-sm font-semibold text-purple-600">
                              {candidate.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className={`font-medium ${candidate.status === 'Rejected' ? 'text-red-600 line-through' : ''}`} style={{ color: candidate.status !== 'Rejected' ? '#0377EB' : undefined }}>{candidate.name}</p>
                            <p className={`text-sm ${candidate.status === 'Rejected' ? 'text-red-500' : 'text-gray-500'}`}>{candidate.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${candidate.status === 'Rejected' ? 'text-red-600' : 'text-green-600'}`}>{candidate.match}%</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">B.TECH CSE</div>
                        <div className="text-xs text-gray-500">2024</div>
                      </td>
                      <td className="px-4 py-3">
                        {candidate.status === 'Hired' ? (
                          <span 
                            className="rounded-full px-3 py-1 text-xs font-medium"
                            style={getStatusStyle(candidate.status)}
                          >
                            Hired
                          </span>
                        ) : (
                          <select 
                            value={candidate.status}
                            onChange={(e) => handleStatusChange(candidate.id, e.target.value as 'Applied' | 'Shortlisted' | 'Interview' | 'Offered' | 'Hired' | 'Rejected')}
                            className="rounded-full px-3 py-1 text-xs font-medium border-none cursor-pointer"
                            style={getStatusStyle(candidate.status)}
                            disabled={candidate.status === 'Rejected'}
                          >
                            {getAvailableStatusOptions(candidate.status).map(status => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{candidate.appliedDate}</td>
                      <td className="px-4 py-3">
                        <button 
        onClick={() => handleViewApplication(candidate)}
                      className="flex items-center gap-1 text-sm"
                      style={{ color: '#0A0A0A' }}
                    >
                      <Eye className="h-4 w-4" style={{ color: '#1383F3' }} />
                      View Application
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          
        </div>
      );
    }

    // Show college cards
    return (
      <div className="grid grid-cols-1 gap-5">
        {colleges.filter(college => {
          if (!searchTerm) return true;
          return college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 college.location.toLowerCase().includes(searchTerm.toLowerCase());
        }).map((college) => (
          <div 
            key={college.id} 
            className="p-6 hover:shadow-lg transition-all duration-200 border border-slate-200 hover:border-slate-300 bg-white border-l-4 border-l-blue-500 rounded-lg"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div 
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #C3A3FF 0%, #9C7CFF 100%)' }}
                >
                  {college.name.charAt(0)}
                </div>
                
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{college.name}</h3>
                    <span 
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                      style={{ backgroundColor: '#EAFFF3', color: '#00A34B' }}
                    >
                      {college.type}
                    </span>
                    <span className="text-base font-semibold text-blue-600">
                      {college.stats.total} Applicants
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    {college.location}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleViewCollegeApplicants(college)}
                className="inline-flex items-center gap-2 rounded-[12px] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
                style={{
                  background: 'linear-gradient(90deg, #2590FB 0%, #0478EB 100%)'
                }}
              >
                <Eye className="h-4 w-4" />
                View Applicants
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render public applicants
  const renderPublicApplicants = () => {
    if (activeMainTab !== 'public') return null;

    const candidates = publicCandidates.filter(c => {
      if (activeSubTab === 'total') return true; // Show all including rejected in total
      // Rejected applications only show in total tab, not in other status tabs
      if (c.status === 'Rejected') return false;
      const statusMap = {
        'shortlisted': 'Shortlisted',
        'interview': 'Interview',
        'offers': 'Offered', 
        'hired': 'Hired'
      };
      return c.status === statusMap[activeSubTab];
    }).filter(c => {
      if (!searchTerm) return true;
      return c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             c.email.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (candidates.length === 0) return null;

    return (
      <div className="mb-8 rounded-2xl bg-white shadow-sm" style={{ border: '1px solid #B8BBD2' }}>
        <div className="border-b px-6 py-4" style={{ borderColor: '#E5E7EB' }}>
          <h3 className="font-semibold text-gray-900 text-[16px]">Public Applicants</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input 
                    type="checkbox" 
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300" 
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Candidate</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Match</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Applied Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {candidates.map((candidate) => (
                <tr key={candidate.id} className={`hover:bg-gray-50 ${candidate.status === 'Rejected' ? 'bg-red-50 opacity-75' : ''}`}>
                  <td className="px-4 py-3">
                    <input 
                      type="checkbox" 
                      checked={selectedCandidates.has(candidate.id)}
                      onChange={() => handleSelectCandidate(candidate.id)}
                      className="rounded border-gray-300" 
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className={`font-medium ${candidate.status === 'Rejected' ? 'text-red-600 line-through' : 'text-gray-900'}`}>{candidate.name}</p>
                      <p className={`text-sm ${candidate.status === 'Rejected' ? 'text-red-500' : 'text-gray-500'}`}>{candidate.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${candidate.status === 'Rejected' ? 'text-red-600' : 'text-green-600'}`}>{candidate.match}%</span>
                  </td>
                  <td className="px-4 py-3">
                    {candidate.status === 'Hired' ? (
                      <span 
                        className="rounded-full px-3 py-1 text-xs font-medium"
                        style={getStatusStyle(candidate.status)}
                      >
                        Hired
                      </span>
                    ) : (
                      <select 
                        value={candidate.status}
                        onChange={(e) => handleStatusChange(candidate.id, e.target.value as 'Applied' | 'Shortlisted' | 'Interview' | 'Offered' | 'Hired' | 'Rejected')}
                        className="rounded-full px-3 py-1 text-xs font-medium border-none cursor-pointer"
                        style={getStatusStyle(candidate.status)}
                        disabled={candidate.status === 'Rejected'}
                      >
                        {getAvailableStatusOptions(candidate.status).map(status => (
                          <option key={status} value={status}>
                            {status === 'Offered' ? 'Offers' : status}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{candidate.appliedDate}</td>
                  <td className="px-4 py-3">
                    <button 
        onClick={() => handleViewApplication(candidate)}
                      className="flex items-center gap-1 text-sm"
                      style={{ color: '#0A0A0A' }}
                    >
                      <Eye className="h-4 w-4" style={{ color: '#1383F3' }} />
                      View Application
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white">
      {/* Header with back button */}
      <div className="mb-6 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Active Jobs
        </button>
      </div>

      {/* Job Header - Matching Manage Jobs Card Design */}
      <div className="mb-6 rounded-2xl bg-white shadow-sm" style={{ border: '1px solid #B8BBD2' }}>
        <div className="p-6">
          {/* Top row: Posted date and 3 dots menu */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-5 flex-1">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-purple-100">
                <span className="text-2xl font-semibold text-purple-600">S</span>
              </div>

              <div className="flex-1">
                {/* Title row */}
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <h2 className="text-[18px] font-semibold text-gray-900">Software Engineering</h2>
                  
                  <span className="inline-flex items-center rounded-md bg-purple-100 px-2.5 py-1 text-[11px] font-medium text-purple-700">
                    internship
                  </span>
                  <span className="inline-flex items-center rounded-md bg-red-100 px-2.5 py-1 text-[11px] font-medium text-red-700">
                    Application on hold
                  </span>
                  
                  <span className="text-[14px]" style={{ color: '#0377EB' }}>
                    Avg Match: <span className="font-semibold" style={{ color: '#0377EB' }}>82%</span>
                  </span>
                </div>

                {/* Meta: location • area • CTC */}
                <div className="mb-3 flex flex-wrap items-center text-[13px] text-gray-600">
                  <MapPin className="mr-1 h-3.5 w-3.5" />
                  <span>Mumbai, Maharashtra</span>
                  <span className="mx-2 inline-block h-1 w-1 rounded-full bg-gray-300" />
                  <span>Engineering</span>
                  <span className="mx-2 inline-block h-1 w-1 rounded-full bg-gray-300" />
                  <span>₹ 8–10 LPA</span>
                </div>

                {/* Posted to + applicants */}
                <div className="flex flex-wrap items-center gap-2 text-[13px]">
                  <span className="text-gray-600">Posted to:</span>
                  <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-[12px] font-medium text-blue-700">
                    8 Colleges
                  </span>
                  <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-[12px] font-medium text-amber-700">
                    Public
                  </span>

                  <span className="mx-2 inline-block h-4 w-px bg-gray-300"></span>

                  <span className="inline-flex items-center text-gray-700">
                    <Users className="mr-1 h-3.5 w-3.5 text-gray-400" />
                    <span className="font-semibold" style={{ color: '#0377EB' }}>45 applicants</span>
                  </span>

                  <span className="text-gray-500">
                    28 from Colleges • 17 from Public
                  </span>
                </div>
              </div>
            </div>

            {/* Posted date and 3 dots - top right */}
            <div className="flex shrink-0 items-start gap-3 ml-6 text-[12px] text-gray-500">
              <span>Posted: 2 days ago</span>
              <button className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Skills - at bottom */}
          <div className="flex flex-wrap items-center gap-2 pl-[84px]">
            <span className="text-[13px] text-gray-600">Top Skills:</span>
            <span className="rounded-md px-2.5 py-1 text-[13px] font-medium" style={{ backgroundColor: 'rgba(204, 177, 255, 0.2)', color: '#7F3DFF' }}>
              React
            </span>
            <span className="rounded-md px-2.5 py-1 text-[13px] font-medium" style={{ backgroundColor: 'rgba(204, 177, 255, 0.2)', color: '#7F3DFF' }}>
              Node.js
            </span>
            <span className="rounded-md px-2.5 py-1 text-[13px] font-medium" style={{ backgroundColor: 'rgba(204, 177, 255, 0.2)', color: '#7F3DFF' }}>
              SQL
            </span>
            <button className="text-[13px] font-medium text-blue-600 hover:underline">+2 more</button>
          </div>

          {/* Divider */}
          <div className="my-6" style={{ borderTop: '1px solid #C1C1C1' }}></div>

          {/* Main Navigation Tabs - Inside Card */}
          <div className="flex w-full rounded-full bg-gray-100 p-1">
            {[
              { key: 'all', label: 'All Applicants', count: tabCounts.total },
              { key: 'college', label: 'College Applicants', count: colleges.flatMap(c => c.candidates).length },
              { key: 'public', label: 'Public Applicants', count: publicCandidates.length },
            ].map(({ key, label, count }) => {
              const isActive = activeMainTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveMainTab(key as any)}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive ? "shadow-sm" : "text-gray-600 hover:text-gray-800"
                  }`}
                  style={isActive ? {
                    background: 'linear-gradient(90deg, #2590FB 0%, #0478EB 100%)',
                    color: '#FFFFFF'
                  } : {}}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sub Navigation Tabs - Outside Card */}
      {/* Only show sub-tabs when NOT on college list view OR when viewing individual college, and NOT on assignments */}
      {activeMainTab !== 'assignments' && (activeMainTab !== 'college' || selectedCollege) && (
        <div className="mb-6">
          <div className="flex w-full rounded-full bg-gray-100 p-1">
            {[
              { key: 'total', label: 'Total', count: tabCounts.total },
              { key: 'shortlisted', label: 'Shortlisted', count: tabCounts.shortlisted },
              { key: 'interview', label: 'Interview', count: tabCounts.interview },
              { key: 'offers', label: 'Offered', count: tabCounts.offers },
              { key: 'hired', label: 'Hired', count: tabCounts.hired }
            ].map(({ key, label, count }) => {
              const isActive = activeSubTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveSubTab(key as any)}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive ? "shadow-sm" : "text-gray-600 hover:text-gray-800"
                  }`}
                  style={isActive ? {
                    background: 'linear-gradient(90deg, #2590FB 0%, #0478EB 100%)',
                    color: '#FFFFFF'
                  } : {}}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      {activeMainTab !== 'assignments' && (
        <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: '#717182' }} />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={(activeMainTab === 'college' && !selectedCollege) ? "Search college..." : "Search candidate..."}
            className="w-full bg-white pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300 placeholder-[#717182]"
            style={{
              borderRadius: '10px',
              border: '1px solid #E5E7EB',
              color: '#717182'
            }}
          />
        </div>

        <button className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
          style={{
            border: '1px solid #1383F3',
            color: '#1182F2'
          }}
        >
          <Filter className="h-4 w-4" style={{ color: '#1182F2' }} />
          All Sources
        </button>
        
        <button className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
          style={{
            border: '1px solid #1383F3',
            color: '#1182F2'
          }}
        >
          <Filter className="h-4 w-4" style={{ color: '#1182F2' }} />
          All Status
        </button>
      </div>
      )}

{/* Bulk Actions Bar */}
      {activeMainTab !== 'assignments' && selectedCandidates.size > 0 && (
        <div className="mb-6 rounded-lg p-4 flex items-center justify-between" style={{ backgroundColor: 'rgba(204, 177, 255, 0.35)' }}>
          <span className="text-base font-medium" style={{ color: '#7F3DFF' }}>{selectedCandidates.size} candidate{selectedCandidates.size !== 1 ? 's' : ''} selected</span>
          <div className="flex gap-3">
            <button
              onClick={handleSendAssignment}
              className="inline-flex items-center gap-2 px-4 py-2 text-base font-medium bg-white text-gray-800 rounded-lg hover:bg-gray-50 border border-gray-200"
            >
              <FileText className="w-4 h-4" />
              Send Assignment
            </button>
            <button
              onClick={handleSendMessage}
              className="inline-flex items-center gap-2 px-4 py-2 text-base font-medium bg-white text-gray-800 rounded-lg hover:bg-gray-50 border border-gray-200"
            >
              <MessageSquare className="w-4 h-4" />
              Send Message
            </button>
            <button
              onClick={handleShortlist}
              className="inline-flex items-center gap-2 px-4 py-2 text-base font-medium bg-white text-gray-800 rounded-lg hover:bg-gray-50 border border-gray-200"
            >
              <Star className="w-4 h-4" />
              Shortlist
            </button>
            <button
              onClick={handleHire}
              className="inline-flex items-center gap-2 px-4 py-2 text-base font-medium bg-white text-gray-800 rounded-lg hover:bg-gray-50 border border-gray-200"
            >
              <UserCheck className="w-4 h-4" />
              Hire
            </button>
            <button
              onClick={handleReject}
              className="inline-flex items-center gap-2 px-4 py-2 text-base font-medium bg-white text-gray-800 rounded-lg hover:bg-gray-50 border border-gray-200"
            >
              <X className="w-4 h-4" />
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div>
        {activeMainTab === 'all' && renderAllApplicants()}
        {activeMainTab === 'college' && renderCollegeApplicants()}
        {activeMainTab === 'public' && renderPublicApplicants()}
        {activeMainTab === 'assignments' && <AssignmentsSection assignments={assignments} />}
      </div>

      {/* Overall Pagination */}
      <div className="mt-6 flex items-center justify-center">
        <nav className="flex items-center gap-1">
          <button className="h-7 w-7 rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50">‹</button>
          <button className="h-7 w-7 rounded-md border border-blue-600 bg-blue-600 text-sm font-medium text-white">1</button>
          <button className="h-7 w-7 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50">2</button>
          <button className="h-7 w-7 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50">3</button>
          <button className="h-7 w-7 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50">4</button>
          <button className="h-7 w-7 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50">5</button>
          <button className="h-7 w-7 cursor-default rounded-md border border-transparent text-gray-500">…</button>
          <button className="h-7 w-7 rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50">›</button>
        </nav>
      </div>

      {/* Candidate Profile Modal */}
      {selectedCandidate && (
        <CandidateProfileModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onStatusChange={handleStatusChange}
          candidate={selectedCandidate}
          initialStatus={selectedCandidate.status as 'Applied' | 'Shortlisted' | 'Interview' | 'Offered' | 'Hired' | 'Rejected'}
          onAssignmentSent={handleAssignmentSent}
        />
      )}

      {/* Send Message Modal */}
      <SendMessageModal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        candidateName={selectedCandidates.size === 1 ? 
          Array.from(selectedCandidates).map(id => {
            const allCandidates = [...colleges.flatMap(c => c.candidates), ...publicCandidates];
            return allCandidates.find(c => c.id === id)?.name || 'Selected Candidates';
          })[0] : 
          `${selectedCandidates.size} Selected Candidates`
        }
      />

      {/* Send Assignment Modal */}
      <SendAssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        candidateName={selectedCandidates.size === 1 ? 
          Array.from(selectedCandidates).map(id => {
            const allCandidates = [...colleges.flatMap(c => c.candidates), ...publicCandidates];
            return allCandidates.find(c => c.id === id)?.name || 'Selected Candidates';
          })[0] : 
          `${selectedCandidates.size} Selected Candidates`
        }
        candidateId={selectedCandidates.size === 1 ? Array.from(selectedCandidates)[0] : undefined}
        candidateEmail={selectedCandidates.size === 1 ? 
          Array.from(selectedCandidates).map(id => {
            const allCandidates = [...colleges.flatMap(c => c.candidates), ...publicCandidates];
            return allCandidates.find(c => c.id === id)?.email || '';
          })[0] : 
          undefined
        }
        college={selectedCandidates.size === 1 ? 
          Array.from(selectedCandidates).map(id => {
            const allCandidates = [...colleges.flatMap(c => c.candidates), ...publicCandidates];
            return allCandidates.find(c => c.id === id)?.college;
          })[0] : 
          undefined
        }
        onSend={handleAssignmentSent}
      />

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        isOpen={isScheduleModalOpen}
        onClose={handleCloseScheduleModal}
        candidateName={candidateToSchedule?.name || ''}
        jobTitle={jobTitle}
        onSchedule={handleScheduleInterview}
      />
    </div>
  );
};

export default JobApplicationsView;
