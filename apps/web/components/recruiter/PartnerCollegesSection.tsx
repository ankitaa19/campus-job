import { Invitation } from '../../types/recruiter';
import { Users, Briefcase, Search, Filter, MapPin, Phone, Mail, GraduationCap, Eye, MessageCircle, Calendar, MoreVertical, Edit3, Video, TrendingUp, Briefcase as BriefcaseIcon, FileText, Check, X, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import CampusVisitFullDetailsModal from './CampusVisitFullDetailsModal';
import ScheduleDriveModal from './ScheduleDriveModal';
import RespondToCampusVisitModal from './RespondToCampusVisitModal';

interface PartnerCollegesSectionProps {
  invitations: Invitation[];
  onCreateInvitation: () => void;
}

type TabType = "connected" | "campus-visits" | "campus-visit-request";
type InvitationStatus = "pending" | "accepted" | "declined";

const PartnerCollegesSection: React.FC<PartnerCollegesSectionProps> = ({
  invitations,
  onCreateInvitation,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("connected");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [invitationStatuses, setInvitationStatuses] = useState<Record<string, InvitationStatus>>({});
  const [requestStatuses, setRequestStatuses] = useState<Record<string, 'pending' | 'accepted' | 'withdrawn'>>({});
  
  // Load campus visit requests from localStorage
  const [campusVisitRequests, setCampusVisitRequests] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('campus-visit-requests');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return parsed.length > 0 ? parsed : getDefaultRequests();
        } catch (e) {
          console.error('Error parsing campus visit requests:', e);
        }
      }
    }
    return getDefaultRequests();
  });

  // Helper function for default requests
  function getDefaultRequests() {
    return [
      {
        id: '1',
        collegeName: 'ABC College',
        visitDate: '2025-11-10',
        date: 'Nov 10, 2025',
        timeSlot: '10:00 - 13:00',
        startTime: '10:00',
        endTime: '13:00',
        interviewMode: 'Offline',
        meetingType: 'Campus Visit',
        jobTitle: 'Backend Developer',
        maxStudents: 50,
        slots: '50 students maximum',
        timestamp: '20 mins ago • 10:20 AM',
        hrContact: {
          name: 'Dr. Rajesh Kumar',
          email: 'placement@abc.ac.in',
          phone: '+91 1011001101'
        }
      },
      {
        id: '2',
        collegeName: 'PQR Institute',
        visitDate: '2025-11-20',
        date: 'Nov 20, 2025',
        timeSlot: '11:00 - 14:00',
        startTime: '11:00',
        endTime: '14:00',
        interviewMode: 'Online',
        meetingType: 'Campus Visit',
        jobTitle: 'Frontend Developer',
        maxStudents: 30,
        slots: '30 students maximum',
        meetLink: 'https://meet.google.com/abc-defg-hij',
        timestamp: '1 hour ago • 9:00 AM',
        hrContact: {
          name: 'Ms. Priya Sharma',
          email: 'placement@pqr.ac.in',
          phone: '+91 9876543210'
        }
      }
    ];
  }

  // Reload requests when tab changes to campus-visit-request
  useEffect(() => {
    if (activeTab === 'campus-visit-request' && typeof window !== 'undefined') {
      const stored = localStorage.getItem('campus-visit-requests');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.length > 0) {
            setCampusVisitRequests(parsed);
          }
        } catch (e) {
          console.error('Error reloading campus visit requests:', e);
        }
      }
    }
  }, [activeTab]);
  
  // Dropdown and Modal States
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showVisitDetailsModal, setShowVisitDetailsModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [selectedViewType, setSelectedViewType] = useState<'invitation' | 'request'>('invitation');
  const [showScheduleDriveModal, setShowScheduleDriveModal] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<any>(null);
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<any>(null);
  const [modalSourceTab, setModalSourceTab] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    };

    if (openDropdownId || showFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId, showFilterDropdown]);

  const connectedColleges = [
    {
      name: 'ABC College',
      location: 'Mumbai, Maharashtra',
      statusLabel: 'Partnered',
      statusColor: '#00A63E',
      students: 8200,
      coursesCount: 5,
      courses: ['B.Tech', 'M.Tech', 'Machine Learning', '+2 more'],
      placementOfficer: {
        name: 'Ms. Karan Singh',
        phone: '+91 1001000101',
        email: 'riteshdemo@bit.edu'
      },
      avatar: 'AB',
      createdAt: new Date('2024-10-15')
    },
    {
      name: 'IIT Bombay',
      location: 'Mumbai, Maharashtra',
      statusLabel: 'Partnered',
      statusColor: '#00A63E',
      students: 12500,
      coursesCount: 7,
      courses: ['B.Tech', 'M.Tech', 'Computer Science', '+3 more'],
      placementOfficer: {
        name: 'Dr. Priya Sharma',
        phone: '+91 2202000202',
        email: 'priya@iitb.ac.in'
      },
      avatar: 'IB',
      createdAt: new Date('2025-01-20')
    },
    {
      name: 'NIT Delhi',
      location: 'Delhi, Delhi',
      statusLabel: 'Partnered',
      statusColor: '#00A63E',
      students: 9500,
      coursesCount: 6,
      courses: ['B.Tech', 'MBA', 'Data Science', '+2 more'],
      placementOfficer: {
        name: 'Mr. Rajesh Kumar',
        phone: '+91 3303000303',
        email: 'rajesh@nitd.ac.in'
      },
      avatar: 'ND',
      createdAt: new Date('2025-05-10')
    },
    {
      name: 'BITS Pilani',
      location: 'Pilani, Rajasthan',
      statusLabel: 'Partnered',
      statusColor: '#00A63E',
      students: 15000,
      coursesCount: 8,
      courses: ['B.E', 'M.Sc', 'Artificial Intelligence', '+4 more'],
      placementOfficer: {
        name: 'Dr. Anjali Mehta',
        phone: '+91 4404000404',
        email: 'anjali@bits-pilani.ac.in'
      },
      avatar: 'BP',
      createdAt: new Date('2025-08-25')
    },
  ];

  // Sort colleges based on sortOrder
  const sortedColleges = [...connectedColleges].sort((a, b) => {
    if (sortOrder === "newest") {
      return b.createdAt.getTime() - a.createdAt.getTime();
    } else {
      return a.createdAt.getTime() - b.createdAt.getTime();
    }
  });

  const campusVisitInvitations = [
    {
      id: '1',
      collegeName: 'ABC College',
      date: 'Nov 10, 2025',
      timeSlot: '10:00 - 13:00',
      meetingType: 'Offline Meeting',
      timestamp: '20 mins ago • 10:20 AM',
      venue: 'Placement Hall',
      expectedStudents: 50,
      jobRole: 'Backend Developer'
    },
    {
      id: '2',
      collegeName: 'XYZ University',
      date: 'Nov 15, 2025',
      timeSlot: '14:00 - 17:00',
      meetingType: 'Online Meeting',
      timestamp: '2 hours ago • 8:15 AM',
      venue: 'Online',
      meetingLink: 'https://meet.google.com/xyz-meeting',
      expectedStudents: 30,
      jobRole: 'Frontend Developer'
    }
  ];

  const tabCounts = {
    connected: 4,
    "campus-visits": 2,
    "campus-visit-request": campusVisitRequests.length
  };

  return (
        <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Partner <span className="text-blue-600">Colleges</span>
          </h1>
          <p className="mt-2 text-gray-600">
            Build partnerships with top colleges and universities to expand your talent pipeline
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Partnered */}
        <div className="rounded-lg bg-white p-5 shadow-sm" style={{ border: '1px solid #E5E7EB' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Partnered</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">4</p>
            </div>
            <div className="rounded-lg p-2" style={{ backgroundColor: '#EAFFF3' }}>
              <Users className="h-5 w-5" style={{ color: '#00A34B' }} />
            </div>
          </div>
        </div>

        {/* Schedule Drives */}
        <div className="rounded-lg bg-white p-5 shadow-sm" style={{ border: '1px solid #E5E7EB' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Schedule Drives</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">2</p>
              <p className="mt-1 text-xs text-gray-500">Partner Connections</p>
            </div>
            <div className="rounded-lg p-2" style={{ backgroundColor: '#FFF4E6' }}>
              <TrendingUp className="h-5 w-5" style={{ color: '#FF8C00' }} />
            </div>
          </div>
        </div>

        {/* Active Job Shared */}
        <div className="rounded-lg bg-white p-5 shadow-sm" style={{ border: '1px solid #E5E7EB' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Job Shared</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">2</p>
              <p className="mt-1 text-xs text-gray-500">Partner Connections</p>
            </div>
            <div className="rounded-lg p-2" style={{ backgroundColor: '#FFF4E6' }}>
              <BriefcaseIcon className="h-5 w-5" style={{ color: '#FF8C00' }} />
            </div>
          </div>
        </div>

        {/* Total Applications */}
        <div className="rounded-lg bg-white p-5 shadow-sm" style={{ border: '1px solid #E5E7EB' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Applications</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
              <p className="mt-1 text-xs text-gray-500">Awaiting Response</p>
            </div>
            <div className="rounded-lg p-2" style={{ backgroundColor: '#E6F2FD' }}>
              <FileText className="h-5 w-5" style={{ color: '#2590FB' }} />
            </div>
          </div>
        </div>
      </div>

           {/* Tabs */}
      <div className="flex w-full rounded-full bg-gray-100 p-1">
        {([
          ["connected", "Connected Colleges", tabCounts.connected],
          ["campus-visits", "Campus Visits Invitation", tabCounts["campus-visits"]],
          ["campus-visit-request", "Campus Visit Request", tabCounts["campus-visit-request"]],
        ] as [TabType, string, number][]).map(([key, label, count]) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
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

      {/* Search + Filter (below tabs per design) */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B8BBD2]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search colleges by name or location..."
            className="w-full rounded-[12px] bg-white py-2.5 pl-10 pr-3 text-sm text-[#313244] placeholder-[#9BA0B4] focus:outline-none"
            style={{ border: '1px solid #D1D5E0', boxShadow: '0px 4px 16px rgba(15, 23, 42, 0.06)' }}
          />
        </div>

        <div className="relative" ref={filterDropdownRef}>
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="inline-flex shrink-0 items-center gap-2 rounded-[12px] bg-white px-5 py-2.5 text-sm font-semibold transition hover:bg-blue-50"
            style={{ border: '1px solid #1383F3', color: '#1182F2', boxShadow: '0px 8px 20px rgba(19, 131, 243, 0.12)' }}
          >
            <Filter className="h-4 w-4" style={{ color: '#1182F2' }} />
            Filter
            <ChevronDown className="h-4 w-4" style={{ color: '#1182F2' }} />
          </button>

          {/* Filter Dropdown */}
          {showFilterDropdown && (
            <div 
              className="absolute right-0 mt-2 w-[180px] rounded-[12px] bg-white shadow-lg z-50"
              style={{ border: '1px solid #E5E7EB', boxShadow: '0px 8px 24px rgba(15, 23, 42, 0.12)' }}
            >
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-[#717182] border-b border-gray-100">
                  Sort By
                </div>
                <button
                  onClick={() => {
                    setSortOrder("newest");
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition ${
                    sortOrder === "newest" 
                      ? "bg-blue-50 text-[#1182F2] font-semibold" 
                      : "text-[#313244] hover:bg-gray-50"
                  }`}
                >
                  Newest
                </button>
                <button
                  onClick={() => {
                    setSortOrder("oldest");
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition ${
                    sortOrder === "oldest" 
                      ? "bg-blue-50 text-[#1182F2] font-semibold" 
                      : "text-[#313244] hover:bg-gray-50"
                  }`}
                >
                  Oldest
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cards Section - Connected Colleges Tab */}
      {activeTab === "connected" && (
        <div className="w-full space-y-5">
          <p className="text-sm text-gray-500">
            Showing {sortedColleges.length} of {sortedColleges.length} colleges
          </p>
          {sortedColleges.map((college, index) => (
            <div
              key={index}
              className="p-6 hover:shadow-lg transition-all duration-200 border border-slate-200 hover:border-slate-300 bg-white border-l-4 border-l-blue-500 rounded-lg"
            >
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex flex-1 flex-col gap-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div
                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl font-semibold text-white"
                        style={{ background: 'linear-gradient(135deg, #C3A3FF 0%, #9C7CFF 100%)' }}
                      >
                        {college.avatar}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-semibold text-gray-900">{college.name}</h3>
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                            style={{ backgroundColor: '#EAFFF3', color: '#00A34B' }}
                          >
                            <Check className="h-3.5 w-3.5" />
                            {college.statusLabel}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                          <MapPin className="h-4 w-4 text-[#1E3A8A]" />
                          {college.location}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Basic info</p>
                        <div className="mt-3 flex flex-wrap gap-6">
                          <div>
                            <p className="flex items-center gap-1 text-sm font-medium text-[#4D65D9]">
                              <Users className="h-4 w-4" />
                              Students
                            </p>
                            <p className="text-lg font-semibold text-[#0E63F4]">
                              {college.students.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="flex items-center gap-1 text-sm font-medium text-[#00A34B]">
                              <GraduationCap className="h-4 w-4" />
                              Courses
                            </p>
                            <p className="text-lg font-semibold text-[#0E63F4]">
                              {college.coursesCount} Courses
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500">Placement Officer</p>
                        <p className="mt-3 text-base font-semibold text-gray-900">
                          {college.placementOfficer.name}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm font-medium text-[#0E63F4]">
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {college.placementOfficer.phone}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {college.placementOfficer.email}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full max-w-[200px] flex-col gap-3">
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-[12px] border px-4 py-2 text-sm font-semibold transition hover:bg-blue-50"
                      style={{ borderColor: '#2590FB', color: '#2590FB' }}
                    >
                      <Eye className="h-4 w-4" />
                      View College
                    </button>
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-[12px] border px-4 py-2 text-sm font-semibold transition hover:bg-blue-50"
                      style={{ borderColor: '#2590FB', color: '#2590FB' }}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Chat
                    </button>
                    <button
                      onClick={() => {
                        // Parse location string (e.g., "Mumbai, Maharashtra")
                        const locationParts = college.location.split(',').map(s => s.trim());
                        setSelectedCollege({
                          _id: college.name,
                          name: college.name,
                          location: {
                            city: locationParts[0] || '',
                            state: locationParts[1] || '',
                            country: 'India'
                          }
                        });
                        setModalSourceTab('connected');
                        setShowScheduleDriveModal(true);
                      }}
                      className="rounded-[12px] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
                      style={{ background: 'linear-gradient(90deg, #2590FB 0%, #0478EB 100%)' }}
                    >
                      Schedule Drive
                    </button>
                  </div>
                </div>

                <div className="border-t border-dashed border-[#E4E8F7] pt-4">
                  <p className="text-sm font-medium text-gray-600">Courses Offered</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {college.courses.map((course, i) => (
                      <span
                        key={i}
                        className="rounded-full px-3 py-1 text-sm font-medium"
                        style={{ backgroundColor: 'rgba(176, 138, 255, 0.16)', color: '#7C3AED' }}
                      >
                        {course}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Campus Visits Invitation Tab */}
      {activeTab === "campus-visits" && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {campusVisitInvitations
            .filter((invitation) => invitationStatuses[invitation.id] !== "declined")
            .map((invitation) => {
              const status = invitationStatuses[invitation.id] || "pending";
              const isAccepted = status === "accepted";
              const isOnlineMeeting = invitation.meetingType?.toLowerCase().includes('online');
              
              return (
                <div 
                  key={invitation.id} 
                  className="flex h-full flex-col rounded-[24px] bg-white p-6"
                  style={{
                    border: '1px solid #CBD6F3',
                    boxShadow: '0px 20px 45px rgba(15, 23, 42, 0.08)'
                  }}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Invitation Request</p>
                      <h4 className="text-lg font-semibold text-gray-900">{invitation.collegeName}</h4>
                    </div>
                    <div className="flex items-start gap-3 text-xs font-medium text-gray-500">
                      <span>{invitation.timestamp}</span>
                      <div className="relative" ref={openDropdownId === invitation.id ? dropdownRef : null}>
                        <button 
                          onClick={() => setOpenDropdownId(openDropdownId === invitation.id ? null : invitation.id)}
                          className="text-gray-400 transition hover:text-gray-600"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {openDropdownId === invitation.id && (
                          <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setSelectedVisit(invitation);
                                  setSelectedViewType('invitation');
                                  setShowVisitDetailsModal(true);
                                  setOpenDropdownId(null);
                                }}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Eye className="h-4 w-4" />
                                View Full Details
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    {[
                      { label: 'Date', value: invitation.date },
                      { label: 'Time slot', value: invitation.timeSlot },
                      { label: 'Meeting type', value: invitation.meetingType }
                    ].map((item) => (
                      <div key={item.label}>
                        <p className="text-sm font-medium text-gray-500">{item.label}:</p>
                        <p className="mt-1 text-base font-semibold text-gray-900">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {isAccepted ? (
                    // Accepted state - Show Reschedule and conditionally Join button
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        onClick={() => {
                          setSelectedInvitation(invitation);
                          setShowRespondModal(true);
                        }}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-[12px] border px-4 py-2 text-sm font-semibold transition hover:bg-blue-50"
                        style={{ borderColor: '#2590FB', color: '#2590FB' }}
                      >
                        <Edit3 className="h-4 w-4" />
                        Reschedule
                      </button>
                      {isOnlineMeeting && (
                        <button
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-[12px] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
                          style={{ background: 'linear-gradient(90deg, #2590FB 0%, #0478EB 100%)' }}
                        >
                          <Video className="h-4 w-4 text-white" />
                          Join
                        </button>
                      )}
                    </div>
                  ) : (
                    // Pending state - Show Decline, Accept, Reschedule buttons
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        onClick={() =>
                          setInvitationStatuses((prev) => ({ ...prev, [invitation.id]: 'declined' }))
                        }
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-[12px] border px-4 py-2 text-sm font-semibold transition hover:bg-red-50"
                        style={{ borderColor: '#EC1B1B', color: '#EC1B1B' }}
                      >
                        <X className="h-4 w-4" />
                        Decline
                      </button>
                      <button
                        onClick={() =>
                          setInvitationStatuses((prev) => ({ ...prev, [invitation.id]: 'accepted' }))
                        }
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-[12px] border px-4 py-2 text-sm font-semibold transition hover:bg-green-50"
                        style={{ borderColor: '#00A63E', color: '#00A63E' }}
                      >
                        <Check className="h-4 w-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => {
                          setSelectedInvitation(invitation);
                          setShowRespondModal(true);
                        }}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-[12px] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
                        style={{ background: 'linear-gradient(90deg, #2590FB 0%, #0478EB 100%)' }}
                      >
                        <Edit3 className="h-4 w-4 text-white" />
                        Reschedule
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* Campus Visit Request Tab */}
      {activeTab === "campus-visit-request" && (
        <div className="space-y-5">
          <p className="text-sm text-gray-500">
            Showing {campusVisitRequests.filter((request) => requestStatuses[request.id] !== 'withdrawn').length} campus visit requests
          </p>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {campusVisitRequests
              .filter((request) => requestStatuses[request.id] !== 'withdrawn')
              .map((request) => {
                const status = requestStatuses[request.id] || 'pending';
                const isAccepted = status === 'accepted';
                
                // Format the data - handle both old dummy format and new localStorage format
                const displayDate = request.visitDate 
                  ? new Date(request.visitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : request.date;
                
                const displayTimeSlot = request.timeSlot;
                
                const displayMeetingType = request.interviewMode 
                  ? `${request.interviewMode} Meeting`
                  : request.meetingType || 'Campus Visit';
                
                const displayTimestamp = request.timestamp 
                  ? (typeof request.timestamp === 'string' && request.timestamp.includes('ago') 
                      ? request.timestamp 
                      : new Date(request.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }))
                  : 'Just now';
                
                const isOnlineMeeting = request.interviewMode === 'Online' || request.meetingType?.toLowerCase().includes('online');
                const jobTitle = request.jobTitle || 'Backend Developer';
                const slots = request.maxStudents || request.slots || '50 students maximum';
                
                return (
                  <div 
                    key={request.id} 
                    className="flex h-full flex-col rounded-[24px] bg-white p-6"
                    style={{
                      border: '1px solid #CBD6F3',
                      boxShadow: '0px 20px 45px rgba(15, 23, 42, 0.08)'
                    }}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Campus Visit Request</p>
                        <h4 className="text-lg font-semibold text-gray-900">{request.collegeName}</h4>
                        {request.jobTitle && (
                          <p className="mt-1 text-sm text-gray-600">Job: {request.jobTitle}</p>
                        )}
                      </div>
                      <div className="flex items-start gap-3 text-xs font-medium text-gray-500">
                        <span>{displayTimestamp}</span>
                        <div className="relative" ref={openDropdownId === request.id ? dropdownRef : null}>
                          <button 
                            onClick={() => setOpenDropdownId(openDropdownId === request.id ? null : request.id)}
                            className="text-gray-400 transition hover:text-gray-600"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>
                          
                          {/* Dropdown Menu */}
                          {openDropdownId === request.id && (
                            <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    setSelectedVisit(request);
                                    setSelectedViewType('request');
                                    setShowVisitDetailsModal(true);
                                    setOpenDropdownId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Eye className="h-4 w-4" />
                                  View Full Details
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Date:</p>
                        <p className="mt-1 text-base font-semibold text-gray-900">{displayDate}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Time slot:</p>
                        <p className="mt-1 text-base font-semibold text-gray-900">{displayTimeSlot}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Interview Mode:</p>
                        <p className="mt-1 text-base font-semibold text-gray-900">{request.interviewMode || 'Campus Visit'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Slots:</p>
                        <p className="mt-1 text-base font-semibold text-gray-900">{slots}</p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        onClick={() =>
                          setRequestStatuses((prev) => ({ ...prev, [request.id]: 'withdrawn' }))
                        }
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-[12px] border px-4 py-2 text-sm font-semibold transition hover:bg-amber-50"
                        style={{ borderColor: '#E4B200', color: '#C28500' }}
                      >
                        <X className="h-4 w-4" />
                        Withdraw
                      </button>
                      <button
                        onClick={() => {
                          const locationParts = (request.collegeName || '').split(',');
                          setSelectedCollege({
                            _id: request.id,
                            name: request.collegeName,
                            location: {
                              city: locationParts[0]?.trim() || '',
                              state: locationParts[1]?.trim() || '',
                              country: 'India'
                            }
                          });
                          setModalSourceTab('campus-visit-request');
                          setShowScheduleDriveModal(true);
                        }}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-[12px] border px-4 py-2 text-sm font-semibold transition hover:bg-blue-50"
                        style={{ borderColor: '#2590FB', color: '#2590FB' }}
                      >
                        <Edit3 className="h-4 w-4" />
                        Reschedule
                      </button>
                      {isOnlineMeeting && (
                        <button
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-[12px] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
                          style={{ background: 'linear-gradient(90deg, #2590FB 0%, #0478EB 100%)' }}
                        >
                          <Video className="h-4 w-4 text-white" />
                          Join
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Campus Visit Full Details Modal */}
      {showVisitDetailsModal && selectedVisit && (
        <CampusVisitFullDetailsModal
          isOpen={showVisitDetailsModal}
          onClose={() => {
            setShowVisitDetailsModal(false);
            setSelectedVisit(null);
          }}
          visit={selectedVisit}
          viewType={selectedViewType}
        />
      )}

      {/* Schedule Drive Modal */}
      {showScheduleDriveModal && selectedCollege && (
        <ScheduleDriveModal
          isOpen={showScheduleDriveModal}
          onClose={() => {
            setShowScheduleDriveModal(false);
            setSelectedCollege(null);
            setModalSourceTab(null);
          }}
          college={selectedCollege}
          onSuccess={() => {
            // Reload campus visit requests from localStorage
            if (typeof window !== 'undefined') {
              const stored = localStorage.getItem('campus-visit-requests');
              if (stored) {
                try {
                  const parsed = JSON.parse(stored);
                  if (parsed.length > 0) {
                    setCampusVisitRequests(parsed);
                  }
                } catch (e) {
                  console.error('Error reloading campus visit requests:', e);
                }
              }
            }
            
            // If modal was opened from Campus Visit Request tab, mark as accepted
            if (modalSourceTab === 'campus-visit-request' && selectedCollege?._id) {
              setRequestStatuses((prev) => ({ ...prev, [selectedCollege._id]: 'accepted' }));
            }
            setShowScheduleDriveModal(false);
            setSelectedCollege(null);
            setModalSourceTab(null);
            console.log('Campus drive scheduled successfully!');
          }}
        />
      )}

      {/* Respond to Campus Visit Invitation Modal */}
      {showRespondModal && selectedInvitation && (
        <RespondToCampusVisitModal
          isOpen={showRespondModal}
          onClose={() => {
            setShowRespondModal(false);
            setSelectedInvitation(null);
          }}
          invitation={selectedInvitation}
          onSuccess={() => {
            setShowRespondModal(false);
            setSelectedInvitation(null);
            setInvitationStatuses((prev) => ({ ...prev, [selectedInvitation.id]: 'accepted' }));
            console.log('Campus visit invitation accepted successfully!');
          }}
        />
      )}
    </div>
  );
};

export default PartnerCollegesSection;
