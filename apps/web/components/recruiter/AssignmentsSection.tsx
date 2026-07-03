import React, { useMemo, useState } from 'react';
import {
  Search,
  MessageSquare,
  Eye,
  Clock,
  CheckCircle2,
  Send,
  FileText,
  Calendar,
  X,
  Download,
  ChevronDown,
  Bell,
  Briefcase
} from 'lucide-react';
import ScheduleInterviewModal from './ScheduleInterviewModal';
import SendMessageModal from './SendMessageModal';

export interface Assignment {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  college?: string;
  positionTitle?: string;
  note: string;
  deadline: string;
  assignmentFile?: {
    name: string;
    size: number;
    url?: string;
  };
  submittedFiles?: Array<{
    name: string;
    size: number;
    submittedAt: string;
    url?: string;
  }>;
  assignedAt: string;
  status: 'Sent' | 'Received' | 'Reviewed' | 'Rejected' | 'Scheduled' | 'Offered' | 'Hired';
  reviewAction?: 'Approved' | 'Rejected';
}

interface AssignmentsSectionProps {
  assignments?: Assignment[];
  onAssignmentUpdate?: (assignmentId: string, updates: Partial<Assignment>) => void;
}

const DUMMY_ASSIGNMENTS: Assignment[] = [
  {
    id: '1',
    candidateId: 'c1',
    candidateName: 'Karan Singh',
    candidateEmail: 'karan.singh@abccollege.edu',
    college: 'ABC University',
    positionTitle: 'Backend Developer',
    note: 'Complete 5 coding problems covering arrays, graphs, programming, xyz and abcde',
    deadline: '22-10-2025',
    assignmentFile: {
      name: 'Assignment_Task_T1.pdf',
      size: 3.5 * 1024 * 1024,
      url: '#'
    },
    submittedFiles: [
      {
        name: 'Report name_T1.pdf',
        size: 3.5 * 1024 * 1024,
        submittedAt: '21-10-2025',
        url: '#'
      },
      {
        name: 'Report name_T1.pdf',
        size: 3.5 * 1024 * 1024,
        submittedAt: '21-10-2025',
        url: '#'
      }
    ],
    assignedAt: '20-10-2025',
    status: 'Sent'
  },
  {
    id: '2',
    candidateId: 'c2',
    candidateName: 'Divyansh Patel',
    candidateEmail: 'divyansh.patel@abcuniversity.edu',
    college: 'ABC University',
    positionTitle: 'Backend Developer',
    note: 'Complete 5 coding problems covering arrays, graphs, programming, xyz and abcde',
    deadline: '22-10-2025',
    assignmentFile: {
      name: 'Assignment_Task_T1.pdf',
      size: 3.5 * 1024 * 1024,
      url: '#'
    },
    submittedFiles: [],
    assignedAt: '20-10-2025',
    status: 'Sent'
  },
  {
    id: '3',
    candidateId: 'c3',
    candidateName: 'Rohan Kumar',
    candidateEmail: 'rohan.kumar@abcuniversity.edu',
    college: 'ABC University',
    positionTitle: 'Backend Developer',
    note: 'Complete 5 coding problems covering arrays, graphs, programming, xyz and abcde',
    deadline: '22-10-2025',
    assignmentFile: {
      name: 'Assignment_Task_T1.pdf',
      size: 3.5 * 1024 * 1024,
      url: '#'
    },
    submittedFiles: [],
    assignedAt: '20-10-2025',
    status: 'Received'
  },
  {
    id: '4',
    candidateId: 'c4',
    candidateName: 'Raj Dokaniya',
    candidateEmail: 'raj.dokaniya@abcuniversity.edu',
    college: 'ABC University',
    positionTitle: 'Backend Developer',
    note: 'Complete 5 coding problems covering arrays, graphs, programming, xyz and abcde',
    deadline: '22-10-2025',
    assignmentFile: {
      name: 'Assignment_Task_T1.pdf',
      size: 3.5 * 1024 * 1024,
      url: '#'
    },
    submittedFiles: [
      {
        name: 'Report name_T1.pdf',
        size: 3.5 * 1024 * 1024,
        submittedAt: '21-10-2025',
        url: '#'
      },
      {
        name: 'Report name_T1.pdf',
        size: 3.5 * 1024 * 1024,
        submittedAt: '21-10-2025',
        url: '#'
      }
    ],
    assignedAt: '20-10-2025',
    status: 'Reviewed',
    reviewAction: 'Rejected'
  },
  {
    id: '5',
    candidateId: 'c5',
    candidateName: 'Aditi Sharma',
    candidateEmail: 'aditi.sharma@abcuniversity.edu',
    college: 'ABC University',
    positionTitle: 'Backend Developer',
    note: 'xyz lorem ipsum',
    deadline: '22-10-2025',
    assignmentFile: {
      name: 'Assignment_Task_T1.pdf',
      size: 3.5 * 1024 * 1024,
      url: '#'
    },
    submittedFiles: [],
    assignedAt: '20-10-2025',
    status: 'Sent'
  },
  {
    id: '6',
    candidateId: 'c6',
    candidateName: 'Priya Singh',
    candidateEmail: 'priya.singh@abcuniversity.edu',
    college: 'ABC University',
    positionTitle: 'Backend Developer',
    note: 'Complete 5 coding problems covering arrays, graphs, programming, xyz and abcde',
    deadline: '22-10-2025',
    assignmentFile: {
      name: 'Assignment_Task_T1.pdf',
      size: 3.5 * 1024 * 1024,
      url: '#'
    },
    submittedFiles: [],
    assignedAt: '20-10-2025',
    status: 'Sent'
  },
  {
    id: '7',
    candidateId: 'c7',
    candidateName: 'Saurav Patel',
    candidateEmail: 'saurav.patel@abcuniversity.edu',
    college: 'ABC University',
    positionTitle: 'Backend Developer',
    note: 'Complete 5 coding problems covering arrays, graphs, programming, xyz and abcde',
    deadline: '22-10-2025',
    assignmentFile: {
      name: 'Assignment_Task_T1.pdf',
      size: 3.5 * 1024 * 1024,
      url: '#'
    },
    submittedFiles: [],
    assignedAt: '20-10-2025',
    status: 'Sent'
  },
  {
    id: '8',
    candidateId: 'c8',
    candidateName: 'Kriti Sanon',
    candidateEmail: 'kriti.sanon@abcuniversity.edu',
    college: 'ABC University',
    positionTitle: 'Backend Developer',
    note: 'Complete 5 coding problems covering arrays, graphs, programming, xyz and abcde',
    deadline: '22-10-2025',
    assignmentFile: {
      name: 'Assignment_Task_T1.pdf',
      size: 3.5 * 1024 * 1024,
      url: '#'
    },
    submittedFiles: [],
    assignedAt: '20-10-2025',
    status: 'Sent'
  }
];

const STATUS_CONFIG: Record<
  Assignment['status'],
  { label: string; bg: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  Sent: {
    label: 'Sent',
    bg: '#E7F6EE',
    color: '#1A7B4B',
    icon: Send
  },
  Received: {
    label: 'Received',
    bg: '#E7EDFF',
    color: '#1A56DB',
    icon: CheckCircle2
  },
  Reviewed: {
    label: 'Reviewed',
    bg: '#FCE7F3',
    color: '#C02662',
    icon: CheckCircle2
  },
  Rejected: {
    label: 'Rejected',
    bg: '#FEE2E2',
    color: '#DC2626',
    icon: X
  },
  Scheduled: {
    label: 'Interview Scheduled',
    bg: '#DBEAFE',
    color: '#1E40AF',
    icon: Calendar
  },
  Offered: {
    label: 'Offer Sent',
    bg: '#FEF3C7',
    color: '#D97706',
    icon: FileText
  },
  Hired: {
    label: 'Hired',
    bg: '#D1FAE5',
    color: '#065F46',
    icon: CheckCircle2
  }
};

const getInitials = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const parseDate = (value: string) => {
  if (!value) {
    return null;
  }

  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    const [day, month, year] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDisplayDate = (value: string) => {
  const parsed = parseDate(value);

  if (!parsed) {
    return value;
  }

  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const getAvatarGradient = (status: Assignment['status']) => {
  switch (status) {
    case 'Received':
      return 'linear-gradient(135deg, #93c5fd 0%, #1d4ed8 100%)';
    case 'Reviewed':
      return 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)';
    case 'Rejected':
      return 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)';
    default:
      return 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)';
  }
};

const AssignmentsSection = ({ assignments: propAssignments, onAssignmentUpdate }: AssignmentsSectionProps) => {
  const assignments =
    propAssignments && propAssignments.length > 0 ? propAssignments : DUMMY_ASSIGNMENTS;

  const [activeTab, setActiveTab] = useState<'active' | 'sent' | 'received' | 'reviewed'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const [statusSelection, setStatusSelection] = useState<'default' | 'Reviewed' | 'Rejected'>('default');
  
  // Modal states
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isStatusChangeModalOpen, setIsStatusChangeModalOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<'Reviewed' | 'Rejected' | null>(null);

  const getTabCount = (tab: string) => {
    if (tab === 'active') {
      return assignments.filter((a) => a.status === 'Sent' || a.status === 'Received' || a.status === 'Rejected').length;
    }
    if (tab === 'sent') {
      return assignments.filter((a) => a.status === 'Sent').length;
    }
    if (tab === 'received') {
      return assignments.filter((a) => a.status === 'Received').length;
    }
    if (tab === 'reviewed') {
      return assignments.filter((a) => a.status === 'Reviewed').length;
    }
    return 0;
  };

  const filteredAssignments = useMemo(() => {
    let filtered = assignments;

    if (activeTab === 'sent') {
      filtered = filtered.filter((a) => a.status === 'Sent');
    } else if (activeTab === 'received') {
      filtered = filtered.filter((a) => a.status === 'Received');
    } else if (activeTab === 'reviewed') {
      filtered = filtered.filter((a) => a.status === 'Reviewed');
    } else if (activeTab === 'active') {
      filtered = filtered.filter((a) => a.status === 'Sent' || a.status === 'Received' || a.status === 'Rejected');
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.candidateName.toLowerCase().includes(term) ||
          a.candidateEmail.toLowerCase().includes(term) ||
          (a.college && a.college.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [activeTab, assignments, searchTerm]);

  const getStatusBadge = (status: Assignment['status']) => {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
        style={{ backgroundColor: config.bg, color: config.color }}
      >
        <Icon className="h-3.5 w-3.5" />
        {config.label}
      </span>
    );
  };

  const deriveStatusSelection = (assignment: Assignment): 'default' | 'Reviewed' | 'Rejected' => {
    if (assignment.status === 'Reviewed') {
      return 'Reviewed';
    }
    if (assignment.status === 'Rejected') {
      return 'Rejected';
    }
    return 'default';
  };

  const handleViewDetails = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setStatusSelection(deriveStatusSelection(assignment));
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedAssignment(null);
    setShowActionDropdown(false);
    setStatusSelection('default');
  };

  const handleSendReminder = (assignment?: Assignment) => {
    const target = assignment ?? selectedAssignment;
    if (!target) {
      return;
    }
    setSelectedAssignment(target);
    setIsReminderModalOpen(true);
  };

  const confirmSendReminder = () => {
    if (selectedAssignment) {
      console.log('Send reminder for assignment:', selectedAssignment.id);
      // Reminder integration hook
      setIsReminderModalOpen(false);
    }
  };

  const handleReject = () => {
    if (selectedAssignment) {
      console.log('Rejecting assignment:', selectedAssignment.id);
      onAssignmentUpdate?.(selectedAssignment.id, { 
        status: 'Rejected',
        reviewAction: 'Rejected'
      });
      handleCloseDetailModal();
    }
  };

  const handleSelectAction = (action: 'schedule' | 'offer' | 'hire' | 'reviewed') => {
    if (!selectedAssignment) return;
    
    setShowActionDropdown(false);
    
    if (action === 'reviewed') {
      handleStatusChange('Reviewed');
    } else if (action === 'schedule') {
      setIsScheduleModalOpen(true);
    } else if (action === 'offer') {
      console.log('Sending offer to:', selectedAssignment.candidateName);
      onAssignmentUpdate?.(selectedAssignment.id, { status: 'Offered' });
      // In a real app, this would trigger an offer modal/flow
      handleCloseDetailModal();
    } else if (action === 'hire') {
      console.log('Hiring candidate:', selectedAssignment.candidateName);
      onAssignmentUpdate?.(selectedAssignment.id, { status: 'Hired' });
      handleCloseDetailModal();
    }
  };

  const handleScheduleInterview = (interviewData: any) => {
    if (selectedAssignment) {
      console.log('Interview scheduled for:', selectedAssignment.candidateName, interviewData);
      onAssignmentUpdate?.(selectedAssignment.id, { status: 'Scheduled' });
      setIsScheduleModalOpen(false);
      handleCloseDetailModal();
    }
  };

  const handleSendMessage = (assignment?: Assignment) => {
    if (assignment) {
      setSelectedAssignment(assignment);
    }
    setIsMessageModalOpen(true);
  };

  const handleMessageSent = () => {
    console.log('Message sent to:', selectedAssignment?.candidateName);
    setIsMessageModalOpen(false);
  };

  const handleStatusChange = (newStatus: 'Reviewed' | 'Rejected') => {
    setPendingStatusChange(newStatus);
    setIsStatusChangeModalOpen(true);
  };

  const confirmStatusChange = () => {
    if (selectedAssignment && pendingStatusChange) {
      const updates: Partial<Assignment> = { 
        status: pendingStatusChange
      };
      
      // Only set reviewAction for Rejected status
      if (pendingStatusChange === 'Rejected') {
        updates.reviewAction = 'Rejected';
      }
      
      onAssignmentUpdate?.(selectedAssignment.id, updates);
      setStatusSelection(pendingStatusChange);
      setIsStatusChangeModalOpen(false);
      setPendingStatusChange(null);
      // Update selected assignment to reflect new status
      setSelectedAssignment({
        ...selectedAssignment,
        ...updates
      });
    }
  };

  const cancelStatusChange = () => {
    setIsStatusChangeModalOpen(false);
    setPendingStatusChange(null);
  };

  const formatFileSize = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-blue-600">Assignments</h1>
        <p className="mt-2 text-gray-600">Track and evaluate candidate assignments</p>
      </div>

      <div className="flex flex-col gap-5">
          <div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by candidate or task name..."
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-200"
            />
          </div>
        </div>
        <div className="flex w-full rounded-full bg-gray-100 p-1">
          {[
            { key: 'active', label: 'Active' },
            { key: 'sent', label: 'Sent' },
            { key: 'received', label: 'Received' },
            { key: 'reviewed', label: 'Reviewed' }
          ].map(({ key, label }) => {
            const isActive = activeTab === key;
            const count = getTabCount(key);
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition shadow-sm ${
                  isActive ? 'text-white' : 'text-gray-600 hover:text-gray-800'
                }`}
                style={isActive ? { background: 'linear-gradient(90deg, #2590FB 0%, #0478EB 100%)' } : {}}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {filteredAssignments.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
          <FileText className="mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900">No Assignments Found</h3>
          <p className="text-sm text-gray-500">
            {searchTerm
              ? 'No assignments match your search keywords.'
              : 'Send assignments to candidates to get started.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => (
            <div
              key={assignment.id}
              className="p-6 hover:shadow-lg transition-all duration-200 border border-slate-200 hover:border-slate-300 bg-white border-l-4 border-l-blue-500 rounded-lg"
            >
              <div className="flex flex-col gap-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-1 items-start gap-4">
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white shadow-sm"
                      style={{ background: getAvatarGradient(assignment.status) }}
                    >
                      {getInitials(assignment.candidateName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-3">
                        <h3 className="text-base font-semibold text-gray-900">
                          {assignment.candidateName}
                        </h3>
                        {getStatusBadge(assignment.status)}
                      </div>
                      {assignment.college && (
                        <p className="text-sm font-medium text-gray-600">{assignment.college}</p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          Assigned {formatDisplayDate(assignment.assignedAt)}
                        </span>
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          Due {formatDisplayDate(assignment.deadline)}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                        <Briefcase className="h-4 w-4 text-blue-500" />
                        <span className="font-medium text-gray-600">
                          {assignment.positionTitle
                            ? `Position: ${assignment.positionTitle}`
                            : 'Position: Not specified'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-3">
                    <div className="flex flex-wrap justify-end items-center gap-3">
                      <button 
                        onClick={() => handleSendMessage(assignment)}
                        className="inline-flex items-center gap-2 rounded-[12px] border bg-white px-4 py-2 text-sm font-semibold transition-colors hover:bg-blue-50"
                        style={{ borderColor: '#2590FB', color: '#2590FB' }}
                      >
                        <MessageSquare className="h-4 w-4" />
                        Send Message
                      </button>
                      <button
                        onClick={() => handleViewDetails(assignment)}
                        className="inline-flex items-center gap-2 rounded-[12px] px-5 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 shadow-md"
                        style={{
                          background: 'linear-gradient(90deg, #2590FB 0%, #0478EB 100%)'
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        View Assignment
                      </button>
                      {(assignment.status === 'Sent') && (
                        <button
                          onClick={() => handleSendReminder(assignment)}
                          className="inline-flex items-center gap-2 rounded-[12px] border bg-white px-4 py-2 text-sm font-semibold transition-colors hover:bg-blue-50"
                          style={{ borderColor: '#2590FB', color: '#2590FB' }}
                        >
                          <Bell className="h-4 w-4" />
                          Send Reminder
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedAssignment && isDetailModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={handleCloseDetailModal}
            />
            <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-700" />
                    <h2 className="text-lg font-semibold text-gray-900">Assignment Details</h2>
                  </div>
                  <p className="text-sm text-gray-500">
                    Assignment details and submission information
                  </p>
                </div>
                <button
                  onClick={handleCloseDetailModal}
                  className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-700">Description:</h3>
                  <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700 leading-relaxed">
                    {selectedAssignment.note}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-gray-600">Candidate</h3>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedAssignment.candidateName}
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-gray-600">College</h3>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedAssignment.college || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-gray-600">Assigned Date</h3>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDisplayDate(selectedAssignment.assignedAt)}
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-gray-600">Deadline</h3>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDisplayDate(selectedAssignment.deadline)}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-700">Status</h3>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(selectedAssignment.status)}
                  </div>
                </div>

                {selectedAssignment.assignmentFile && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-gray-700">Assignment</h3>
                    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-blue-300">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {selectedAssignment.assignmentFile.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(selectedAssignment.assignmentFile.size)}
                          </p>
                        </div>
                      </div>
                      <button className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50">
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    </div>
                  </div>
                )}

                {selectedAssignment.submittedFiles && selectedAssignment.submittedFiles.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-gray-700">Submitted Files</h3>
                    <div className="space-y-2">
                      {selectedAssignment.submittedFiles.map((file) => (
                        <div
                          key={`${file.name}-${file.submittedAt}`}
                          className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-blue-300"
                        >
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)} · Submitted{' '}
                              {formatDisplayDate(file.submittedAt)}
                            </p>
                          </div>
                          <button className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-100">
                            <Download className="h-4 w-4" />
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-b-2xl border-t border-gray-200 bg-gray-50 px-6 py-4">
                {selectedAssignment.status === 'Sent' ? (
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={handleCloseDetailModal}
                      className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => handleSendReminder()}
                      className="inline-flex items-center gap-2 rounded-lg border bg-white px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-blue-50"
                      style={{ borderColor: '#1383F3', color: '#1383F3' }}
                    >
                      <Bell className="h-4 w-4" />
                      Send Reminder
                    </button>
                  </div>
                ) : selectedAssignment.status === 'Received' || selectedAssignment.status === 'Reviewed' ? (
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => handleStatusChange('Rejected')}
                      className="rounded-lg border-2 border-red-500 bg-white px-6 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                    >
                      Reject
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowActionDropdown(!showActionDropdown)}
                        className="flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                        style={{
                          background: 'linear-gradient(90deg, #2196F3 0%, #1976D2 100%)'
                        }}
                      >
                        Select Action
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${showActionDropdown ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {showActionDropdown && (
                        <div className="absolute bottom-full right-0 z-10 mb-2 w-60 rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
                          <div className="px-4 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Select Action
                          </div>
                          {selectedAssignment.status === 'Received' && (
                            <button
                              onClick={() => handleSelectAction('reviewed')}
                              className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
                            >
                              Mark as Reviewed
                            </button>
                          )}
                          <button
                            onClick={() => handleSelectAction('schedule')}
                            className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
                          >
                            Schedule Interview
                          </button>
                          <button
                            onClick={() => handleSelectAction('offer')}
                            className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
                          >
                            Send Offer
                          </button>
                          <button
                            onClick={() => handleSelectAction('hire')}
                            className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
                          >
                            Hire
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : selectedAssignment.status === 'Rejected' ? (
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <span className="text-sm font-semibold text-red-600">
                        Assignment Rejected
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {selectedAssignment && (
        <ScheduleInterviewModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          candidateName={selectedAssignment.candidateName}
          jobTitle={selectedAssignment.positionTitle || 'Position'}
          onSchedule={handleScheduleInterview}
        />
      )}

      {/* Send Message Modal */}
      {selectedAssignment && (
        <SendMessageModal
          isOpen={isMessageModalOpen}
          onClose={() => setIsMessageModalOpen(false)}
          candidateName={selectedAssignment.candidateName}
          onMessageSent={handleMessageSent}
        />
      )}

      {/* Reminder Alert Modal */}
      {isReminderModalOpen && selectedAssignment && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setIsReminderModalOpen(false)}
            />
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">Remainder Alert</h2>
                <button
                  onClick={() => setIsReminderModalOpen(false)}
                  className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                    <Bell className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600">
                    A gentle remainder for your assignment submission please submit your assignment on respective time...
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                <button
                  onClick={() => setIsReminderModalOpen(false)}
                  className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSendReminder}
                  className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{
                    background: 'linear-gradient(90deg, #2196F3 0%, #1976D2 100%)'
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Confirmation Modal */}
      {isStatusChangeModalOpen && pendingStatusChange && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={cancelStatusChange}
            />
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">Changing Status</h2>
                <button
                  onClick={cancelStatusChange}
                  className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6">
                <p className="text-sm text-gray-600">Preview and update status</p>
                <div className="mt-6 flex flex-col items-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-50">
                    <svg className="h-10 w-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">
                    Make sure you really want to change your current assignment status
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                <button
                  onClick={cancelStatusChange}
                  className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStatusChange}
                  className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{
                    background: 'linear-gradient(90deg, #2196F3 0%, #1976D2 100%)'
                  }}
                >
                  Save Change
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentsSection;
