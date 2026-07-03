import React, { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import { Bell, Calendar as CalendarIcon, Clock, Video, MoreVertical, Eye } from 'lucide-react';
import ScheduleMeetingModal from './ScheduleMeetingModal';
import MeetingFullDetailsModal from './MeetingFullDetailsModal';

/** ───────────────────────── Types ───────────────────────── */
export type EnquiryStatus =
  | "interested"
  | "contacted"
  | "converted"
  | "closed";

export interface Enquiry {
  _id: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  courseStream?: string;
  source:
    | "website"
    | "social_media"
    | "referral"
    | "exhibition"
    | "advertisement"
    | "other";
  status: EnquiryStatus;
  date: string; // DD-MM-YYYY
  college: string;
  avatarUrl?: string;
  statusNote?: string;
  statusChangeDate?: string;
  callNotes?: Array<{ date: string; outcome: string; note: string }>;
  emailNotes?: Array<{ date: string; template: string; note?: string }>;
  generalNotes?: Array<{ date: string; note: string }>;
}

export interface Meeting {
  id: string;
  leadName: string;
  email: string;
  phone: string;
  date: string;
  timeSlot: string;
  duration: string;
  meetingType: string;
  meetingLink: string;
  timestamp: string;
  status: 'pending' | 'accepted' | 'declined';
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";

/** ─────────────────────── Utilities ─────────────────────── */
const statusSpec: Record<
  EnquiryStatus,
  { label: string; dot: string; text: string; bg: string }
> = {
  interested: { label: "Interested", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  contacted: { label: "Contacted", dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
  converted: { label: "Converted", dot: "bg-purple-600", text: "text-purple-700", bg: "bg-purple-50" },
  closed: { label: "Closed", dot: "bg-slate-400", text: "text-slate-700", bg: "bg-slate-50" },
};

const sourceSpec: Record<
  Enquiry["source"],
  { text: string; ring: string; bg: string }
> = {
  website: { text: "text-blue-700", ring: "ring-blue-200", bg: "bg-blue-50" },
  social_media: { text: "text-pink-700", ring: "ring-pink-200", bg: "bg-pink-50" },
  referral: { text: "text-emerald-700", ring: "ring-emerald-200", bg: "bg-emerald-50" },
  exhibition: { text: "text-violet-700", ring: "ring-violet-200", bg: "bg-violet-50" },
  advertisement: { text: "text-orange-700", ring: "ring-orange-200", bg: "bg-orange-50" },
  other: { text: "text-slate-700", ring: "ring-slate-200", bg: "bg-slate-50" },
};

const classNames = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

/** ───────────────────── UI Sub-components ───────────────────── */

const StatusChip: React.FC<{ status: EnquiryStatus }> = ({ status }) => {
  const s = statusSpec[status];
  return (
    <span
      className={classNames(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border border-transparent",
        s.bg,
        s.text
      )}
    >
      <span className={classNames("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
};

const Pill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
    {children}
  </span>
);

const SourceTag: React.FC<{ source: Enquiry["source"] }> = ({ source }) => {
  const s = sourceSpec[source] ?? sourceSpec.other;
  return (
    <span
      className={classNames(
        "inline-flex items-center px-2 py-[4px] rounded-md text-[11px] font-medium ring-1",
        s.text,
        s.bg,
        s.ring
      )}
      title="Lead source"
    >
      {source.replace("_", " ")}
    </span>
  );
};

/** Card for a single enquiry (pure presentational; handlers come via props) */
const EnquiryCard: React.FC<{
  item: Enquiry;
  onView?: (id: string) => void;
  onCall?: (id: string) => void;
  onChat?: (id: string) => void;
  onMore?: (id: string) => void;
  onStatusUpdate?: (id: string, status: EnquiryStatus) => void;
}> = ({ item, onView, onCall, onChat, onMore, onStatusUpdate }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const initials = useMemo(() => {
    const parts = item.name.trim().split(" ");
    return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
  }, [item.name]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const statusOptions: { value: EnquiryStatus; label: string }[] = [
    { value: "contacted", label: "Contacted" },
    { value: "interested", label: "Interested" },
    { value: "converted", label: "Converted" },
    { value: "closed", label: "Closed" }
  ];

  const handleStatusSelect = (status: EnquiryStatus) => {
    // Pass both enquiryId and newStatus to trigger the note modal
    onStatusUpdate?.(item._id, status);
    setShowDropdown(false);
  };

  return (
    <div className="bg-white rounded-[24px] border border-[#E5ECFB] px-6 py-5 shadow-[0_18px_36px_rgba(15,76,173,0.08)] transition-shadow duration-200 hover:shadow-[0_20px_40px_rgba(15,76,173,0.12)]">
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        {item.avatarUrl ? (
          <img
            src={item.avatarUrl}
            alt={item.name}
            className="h-12 w-12 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
            {initials.toUpperCase()}
          </div>
        )}

        {/* Name / Email - Left side */}
        <div className="flex-1 min-w-0 pr-2">
          {/* Name */}
          <h3
            className="text-[15px] font-semibold text-gray-900 leading-tight break-words"
          >
            {item.name}
          </h3>
          {/* Email */}
          <p
            className="mt-1 text-sm text-gray-500 leading-tight whitespace-nowrap overflow-visible"
            title={item.email}
          >
            {item.email}
          </p>
        </div>

        {/* WhatsApp icon and Status - Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* WhatsApp icon */}
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5 text-green-600"
              fill="currentColor"
            >
              <path d="M20.52 3.48A11.9 11.9 0 0012.04 0C5.44 0 .1 5.33.1 11.92c0 2.1.55 4.15 1.6 5.97L0 24l6.28-1.65a11.9 11.9 0 005.76 1.46h.01c6.59 0 11.94-5.33 11.94-11.92 0-3.19-1.24-6.19-3.47-8.41zM12.04 21.3c-1.84 0-3.64-.49-5.2-1.41l-.37-.22-3.72.98.99-3.62-.24-.37a9.57 9.57 0 01-1.49-5.06c0-5.3 4.33-9.62 9.63-9.62 2.57 0 4.99 1 6.8 2.8a9.54 9.54 0 012.83 6.82c0 5.3-4.33 9.62-9.63 9.62zm5.04-7.2c-.28-.14-1.64-.8-1.89-.89-.25-.09-.43-.14-.61.14-.18.29-.7.88-.86 1.06-.16.19-.32.21-.6.07-.28-.14-1.17-.43-2.23-1.38-.82-.73-1.38-1.64-1.55-1.92-.16-.28-.02-.43.12-.57.13-.14.28-.32.43-.49.14-.17.19-.29.28-.48.09-.19.04-.36-.02-.5-.07-.14-.61-1.47-.83-2.02-.22-.53-.45-.46-.61-.47h-.52c-.18 0-.48.07-.73.36-.25.29-.96.95-.96 2.32s.98 2.69 1.12 2.88c.14.19 1.94 2.97 4.7 4.15.66.28 1.17.45 1.57.58.66.21 1.26.18 1.74.11.53-.08 1.64-.67 1.87-1.32.23-.65.23-1.2.16-1.32-.06-.13-.26-.2-.53-.33z"/>
            </svg>
          </span>

          {/* Status pill with dynamic status */}
          <StatusChip status={item.status} />
        </div>
      </div>

      {/* Body */}
      <div className="mt-4 space-y-3">
        {/* Source row: label left, value right */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-gray-400">Source:</span>
          <SourceTag source={item.source} />
        </div>

        {/* Course row: label then pill */}
        <div>
          <span className="block text-sm text-gray-400 font-medium mb-2">Course:</span>
          <div className="inline-flex rounded-lg bg-[#F5EEFF] px-3 py-1.5">
            <span className="text-sm font-semibold text-gray-900 break-words">
              {item.courseStream ? `${item.course} - ${item.courseStream}` : item.course}
            </span>
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="h-4 w-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none">
            <path
              d="M8 7V3m8 4V3M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-medium">
            Date: {item.date}
          </span>
        </div>
      </div>

      {/* Footer actions */}
      <div className="mt-4 flex items-center justify-between gap-2">
        {/* View details button */}
        <button
          onClick={() => onView?.(item._id)}
          className="flex-1 inline-flex items-center justify-center h-9 px-4 rounded-lg text-white text-sm font-semibold
                     bg-gradient-to-b from-[#2791FC] to-[#0377EB] shadow-sm
                     hover:from-[#1f86f7] hover:to-[#036ae0] transition-colors"
        >
          View details
        </button>

        {/* Icon buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onCall?.(item._id)}
            title="Call"
            className="h-9 w-9 rounded-lg border border-[#1182F2] text-[#1182F2]
                       inline-flex items-center justify-center hover:bg-[#F0F7FF] transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 5a2 2 0 0 1 2-2h3.3a1 1 0 0 1 .95.68l1.5 4.5a1 1 0 0 1-.5 1.2l-2.26 1.13a11 11 0 0 0 5.51 5.51l1.13-2.26a1 1 0 0 1 1.2-.5l4.5 1.5a1 1 0 0 1 .68.95V19a2 2 0 0 1-2 2h-1C9.72 21 3 14.28 3 6V5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            onClick={() => onChat?.(item._id)}
            title="Email"
            className="h-9 w-9 rounded-lg border border-[#1182F2] text-[#1182F2]
                       inline-flex items-center justify-center hover:bg-[#F0F7FF] transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 6h16a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1Zm0 0l8 6 8-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              title="More"
              className="h-9 w-9 rounded-lg border border-[#1182F2] text-[#1182F2]
                         inline-flex items-center justify-center hover:bg-[#F0F7FF] transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="6" cy="12" r="1.2" />
                <circle cx="12" cy="12" r="1.2" />
                <circle cx="18" cy="12" r="1.2" />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="py-1">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleStatusSelect(option.value)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        item.status === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/** ─────────────────────── Lead Details Modal ─────────────────────── */

const LeadDetailsModal: React.FC<{ 
  enquiry: Enquiry | null; 
  onClose: () => void; 
  onStatusUpdate?: (id: string, status: EnquiryStatus) => void;
  onScheduleMeeting?: () => void;
  onNoteAdded?: (enquiryId: string, note: string) => void;
}> = ({ enquiry, onClose, onStatusUpdate, onScheduleMeeting, onNoteAdded }) => {
  const [currentStatus, setCurrentStatus] = useState<EnquiryStatus>("contacted");
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    if (enquiry) {
      setCurrentStatus(enquiry.status);
    }
  }, [enquiry]);

  const handleAddNote = async () => {
    if (!enquiry || !newNote.trim()) return;

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/admission-enquiries/${enquiry._id}/status`,
        {
          status: currentStatus,
          notes: `${enquiry.statusNote || ''}\n\n[${new Date().toLocaleDateString()}] Note: ${newNote.trim()}`
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success && onNoteAdded) {
        onNoteAdded(enquiry._id, newNote.trim());
        setNewNote("");
        setShowAddNoteModal(false);
      }
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note. Please try again.');
    }
  };

  const handleExportDetails = () => {
    if (!enquiry) return;

    const fullCourse = enquiry.courseStream 
      ? `${enquiry.course} - ${enquiry.courseStream}`
      : enquiry.course;

    const exportData = `
Lead Details - ${enquiry.name}
${'-'.repeat(50)}

Personal Information:
- Full Name: ${enquiry.name}
- Email: ${enquiry.email}
- Phone: ${enquiry.phone}

Enquiry Details:
- Course of Interest: ${fullCourse}
- Enquiry Source: ${enquiry.source}
- Enquiry Date: ${enquiry.date}
- Current Status: ${enquiry.status}

Notes & Comments:
${getAllNotes()}

Exported on: ${new Date().toLocaleString()}
    `.trim();

    const blob = new Blob([exportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lead-${enquiry.name.replace(/\s+/g, '-')}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getAllNotes = () => {
    if (!enquiry) return "No notes available for this lead yet.";
    
    let allNotes = [];
    
    // Status notes
    if (enquiry.statusNote) {
      allNotes.push(enquiry.statusNote);
    }
    
    // Call notes
    if (enquiry.callNotes && enquiry.callNotes.length > 0) {
      enquiry.callNotes.forEach(call => {
        allNotes.push(`[${call.date}] Call: ${call.outcome}${call.note ? ` - ${call.note}` : ''}`);
      });
    }
    
    // Email notes
    if (enquiry.emailNotes && enquiry.emailNotes.length > 0) {
      enquiry.emailNotes.forEach(email => {
        allNotes.push(`[${email.date}] Email: ${email.template}${email.note ? ` - ${email.note}` : ''}`);
      });
    }
    
    // General notes
    if (enquiry.generalNotes && enquiry.generalNotes.length > 0) {
      enquiry.generalNotes.forEach(note => {
        allNotes.push(`[${note.date}] Note: ${note.note}`);
      });
    }
    
    return allNotes.length > 0 ? allNotes.join('\n\n') : "No notes available for this lead yet.";
  };

  if (!enquiry) return null;

  const handleStatusChange = (newStatus: EnquiryStatus) => {
    setCurrentStatus(newStatus);
    onStatusUpdate?.(enquiry._id, newStatus);
  };

  const formatDate = (dateStr: string) => {
    // Supports formats: DD-MM-YYYY, YYYY-MM-DD, or ISO
    let date: Date;
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      const [dd, mm, yyyy] = dateStr.split('-').map(Number);
      date = new Date(yyyy, mm - 1, dd);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [yyyy, mm, dd] = dateStr.split('-').map(Number);
      date = new Date(yyyy, mm - 1, dd);
    } else {
      date = new Date(dateStr);
    }
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getNextAction = (status: EnquiryStatus) => {
    switch (status) {
      case 'contacted': return 'Send course information';
      case 'interested': return 'Schedule campus visit';
      case 'converted': return 'Welcome & onboard';
      case 'closed': return 'Archive lead';
      default: return 'Continue follow-up';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Lead Details - {enquiry.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Complete information and next steps for this enquiry lead.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Quick Actions + Status Card */}
          <div className="mb-6 rounded-xl border border-gray-200 bg-white shadow-md">
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <div>
                  <div className="text-base font-semibold text-gray-900">{enquiry.name}</div>
                  <div className="text-xs text-gray-500">Quick Actions</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    if (onScheduleMeeting) {
                      onScheduleMeeting();
                    }
                  }}
                  className="px-3.5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Schedule Meeting
                </button>
                <button 
                  onClick={() => setShowAddNoteModal(true)}
                  className="px-3.5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Note
                </button>
                <button 
                  onClick={handleExportDetails}
                  className="px-3.5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16V4m0 12l-4-4m4 4l4-4M4 20h16" />
                  </svg>
                  Export Details
                </button>
              </div>
            </div>
{/* Status + Next action — left & right aligned */}
<div className="px-6 pb-6 flex items-center justify-between">
  {/* Status on left */}
  <div className="flex items-center gap-2">
    <span className="text-sm text-gray-600">Status:</span>
    <StatusChip status={currentStatus} />
  </div>

  {/* Next suggested action on right */}
  <div className="flex items-center gap-2">
    <span className="text-sm text-gray-600">Next suggested action:</span>
    <span className="text-sm text-gray-900">
      {getNextAction(currentStatus)}
    </span>
  </div>
</div>

          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Personal Information */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
              </div>
              
              <div className="ml-7 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Full Name</label>
                  <p className="text-gray-900 font-medium">{enquiry.name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email Address
                  </label>
                  <p className="text-gray-900 font-medium">{enquiry.email}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Phone Number
                  </label>
                  <p className="text-gray-900 font-medium">{enquiry.phone}</p>
                </div>
              </div>
            </div>

            {/* Enquiry Details */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">Enquiry Details</h3>
              </div>
              
              <div className="ml-7 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Course of Interest</label>
                  <p className="text-gray-900 font-medium">
                    {enquiry.courseStream 
                      ? `${enquiry.course} - ${enquiry.courseStream}` 
                      : enquiry.course}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Enquiry Source</label>
                  <div className="mt-1">
                    <SourceTag source={enquiry.source} />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Enquiry Date
                  </label>
                  <p className="text-gray-900 font-medium">{formatDate(enquiry.date)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Current Status</label>
                  <div className="mt-1">
                    <StatusChip status={currentStatus} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes & Comments */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes & Comments</h3>
            <div className="rounded-lg p-4 min-h-[120px] bg-[#EEF4FF]">
              <div className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">
                {getAllNotes()}
              </div>
            </div>
          </div>
        </div>

        {/* Add Note Modal */}
        {showAddNoteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg bg-white rounded-lg shadow-xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Add Note</h3>
                <button
                  onClick={() => {
                    setShowAddNoteModal(false);
                    setNewNote("");
                  }}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note
                </label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Enter your note here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={4}
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      setShowAddNoteModal(false);
                      setNewNote("");
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#2791FC] to-[#0377EB] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Note
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/** ─────────────────────── Call Modal ─────────────────────── */

const CallModal: React.FC<{ 
  enquiry: Enquiry;
  onClose: () => void;
  onSave: (outcome: string, notes: string) => void;
}> = ({ enquiry, onClose, onSave }) => {
  const [selectedOutcome, setSelectedOutcome] = useState("");
  const [notes, setNotes] = useState("");

  const callOutcomes = [
    "Answered - Interested",
    "Answered - Not Interested", 
    "Answered - Needs Callback",
    "No Answer",
    "Busy",
    "Wrong Number"
  ];

  const handleSave = () => {
    if (!selectedOutcome) {
      alert("Please select a call outcome");
      return;
    }
    onSave(selectedOutcome, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 5a2 2 0 0 1 2-2h3.3a1 1 0 0 1 .95.68l1.5 4.5a1 1 0 0 1-.5 1.2l-2.26 1.13a11 11 0 0 0 5.51 5.51l1.13-2.26a1 1 0 0 1 1.2-.5l4.5 1.5a1 1 0 0 1 .68.95V19a2 2 0 0 1-2 2h-1C9.72 21 3 14.28 3 6V5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900">Add New Enquiry Lead</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4">Record the outcome of your call with this lead.</p>
          
          {/* Phone number display */}
          <div className="flex items-center gap-3 p-4 rounded-lg mb-6" style={{ backgroundColor: 'rgba(239, 247, 255, 0.9)' }}>
            <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 5a2 2 0 0 1 2-2h3.3a1 1 0 0 1 .95.68l1.5 4.5a1 1 0 0 1-.5 1.2l-2.26 1.13a11 11 0 0 0 5.51 5.51l1.13-2.26a1 1 0 0 1 1.2-.5l4.5 1.5a1 1 0 0 1 .68.95V19a2 2 0 0 1-2 2h-1C9.72 21 3 14.28 3 6V5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-gray-900 font-medium">{enquiry.phone}</span>
            <button 
              onClick={() => window.open(`tel:${enquiry.phone}`)}
              className="ml-auto px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Call Now
            </button>
          </div>
        </div>

        {/* Call Outcome */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Call Outcome
          </label>
          <div className="relative">
            <select
              value={selectedOutcome}
              onChange={(e) => setSelectedOutcome(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
            >
              <option value="">Select call outcome</option>
              {callOutcomes.map((outcome) => (
                <option key={outcome} value={outcome}>
                  {outcome}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 10l5 5 5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Call Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Call Notes
          </label>
          <div className="relative">
            <textarea
              value={notes}
              onChange={(e) => {
                if (e.target.value.length <= 50) {
                  setNotes(e.target.value);
                }
              }}
              placeholder="Add any note from the call..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-500">
              {notes.length}/50
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 inline-flex items-center justify-center px-6 py-3 text-white text-sm font-semibold rounded-lg
                       bg-gradient-to-b from-[#2791FC] to-[#0377EB] shadow-sm
                       hover:from-[#1f86f7] hover:to-[#036ae0] transition-colors"
          >
            Record Call
          </button>
        </div>
      </div>
    </div>
  );
};

/** ─────────────────────── Email Modal ─────────────────────── */

const EmailModal: React.FC<{ 
  enquiry: Enquiry; 
  onClose: () => void;
  onSend: (templateType: string, customContent?: string) => void;
}> = ({ enquiry, onClose, onSend }) => {
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [customContent, setCustomContent] = useState("");

  const emailTemplates = [
    "Welcome Email",
    "Application Process", 
    "Follow-up Email",
    "Custom Email"
  ];

  const getTemplateContent = (template: string) => {
    switch (template) {
      case "Welcome Email":
        return {
          subject: `Welcome to ${enquiry.course}`,
          body: `Dear ${enquiry.name.split(' ')[0]},\n\nThank you for your interest in our ${enquiry.course} program. We're excited about the possibility of having you join our academic community.\n\nNext Step:\n• Schedule a campus visit to see our facilities\n• Meet with our academic counselors\n• Review the curriculum and fee structure\n• Complete your application process\n\nWe'll be in touch soon to discuss your requirements in detail.\n\nBest regards,\nAdmissions Team`
        };
      case "Application Process":
        return {
          subject: `Application Process for ${enquiry.course}`,
          body: `Dear ${enquiry.name.split(' ')[0]},\n\nHere's a step-by-step guide to complete your application for ${enquiry.course}:\n\n1. Fill out the online application form\n2. Submit required documents\n3. Pay the application fee\n4. Schedule an interview\n5. Await admission decision\n\nPlease feel free to contact us if you have any questions.\n\nBest regards,\nAdmissions Team`
        };
      case "Follow-up Email":
        return {
          subject: `Following up on your ${enquiry.course} inquiry`,
          body: `Dear ${enquiry.name.split(' ')[0]},\n\nI wanted to follow up on your recent inquiry about our ${enquiry.course} program.\n\nAre you still interested in learning more about our course offerings? I'd be happy to schedule a call to discuss your academic goals and how our program can help you achieve them.\n\nPlease let me know a convenient time for you.\n\nBest regards,\nAdmissions Team`
        };
      default:
        return { subject: "", body: "" };
    }
  };

  const handleTemplateChange = (template: string) => {
    setSelectedTemplate(template);
    if (template !== "Custom Email") {
      const content = getTemplateContent(template);
      setCustomSubject(content.subject);
      setCustomContent(content.body);
    } else {
      setCustomSubject("");
      setCustomContent("");
    }
  };

  const handleSend = () => {
    if (!selectedTemplate) return;
    
    if (selectedTemplate === "Custom Email") {
      onSend(selectedTemplate, customContent);
    } else {
      onSend(selectedTemplate);
    }
    
    onClose();
  };

  const templateContent = selectedTemplate ? getTemplateContent(selectedTemplate) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6" style={{ color: '#00C950' }} viewBox="0 0 24 24" fill="none">
              <path
                d="M4 6h16a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1Zm0 0l8 6 8-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900">Lead Details - {enquiry.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">Send a personalized email to this lead.</p>
        
        {/* Email address display */}
        <div className="flex items-center gap-3 p-4 rounded-lg mb-6" style={{ backgroundColor: 'rgba(221, 255, 235, 0.35)' }}>
          <svg className="w-5 h-5" style={{ color: '#00C950' }} viewBox="0 0 24 24" fill="none">
            <path
              d="M4 6h16a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1Zm0 0l8 6 8-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-gray-900 font-medium">{enquiry.email}</span>
        </div>

        {/* Email Template Dropdown */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Template
          </label>
          <div className="relative">
            <select
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
            >
              <option value="">Select email template</option>
              {emailTemplates.map((template) => (
                <option key={template} value={template}>
                  {template}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 10l5 5 5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Template Preview */}
        {selectedTemplate && (
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Preview</h4>
            
            {/* Subject */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              {selectedTemplate === "Custom Email" ? (
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Enter email subject"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              ) : (
                <div className="text-gray-900 font-medium p-3 bg-gray-50 rounded-lg">
                  {templateContent?.subject}
                </div>
              )}
            </div>

            {/* Body */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Body</label>
              {selectedTemplate === "Custom Email" ? (
                <textarea
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  placeholder="Enter email content"
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                />
              ) : (
                <div className="text-gray-700 p-4 bg-gray-50 rounded-lg whitespace-pre-line text-sm">
                  {templateContent?.body}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!selectedTemplate || (selectedTemplate === "Custom Email" && (!customSubject || !customContent))}
            className="flex-1 inline-flex items-center justify-center px-6 py-3 text-white text-sm font-semibold rounded-lg
                       bg-gradient-to-b from-[#2791FC] to-[#0377EB] shadow-sm
                       hover:from-[#1f86f7] hover:to-[#036ae0] transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 6h16a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1Zm0 0l8 6 8-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Send Email
          </button>
        </div>
      </div>
    </div>
  );
};

/** ─────────────────────── Status Note Modal ─────────────────────── */

const StatusNoteModal: React.FC<{ 
  onClose: () => void; 
  onSave: (note: string) => void;
  statusName: string;
}> = ({ onClose, onSave, statusName }) => {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (note.trim().length === 0) {
      setError("Please enter a response before changing status");
      return;
    }
    
    if (note.trim().length > 100) {
      setError("Response cannot exceed 100 characters");
      return;
    }
    
    onSave(note.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            College Response
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            You are changing the status to <span className="font-semibold">{statusName}</span>. 
            Please provide your response to the student regarding this enquiry.
          </p>

          <div className="mb-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              College Response <span className="text-red-500">*</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setError("");
              }}
              placeholder="Enter your response to the student..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              maxLength={100}
            />
            <div className="flex items-center justify-between mt-1">
              <span className={`text-xs ${note.length > 100 ? 'text-red-500' : 'text-gray-500'}`}>
                {note.length}/100 characters
              </span>
              {error && <span className="text-xs text-red-500">{error}</span>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#2791FC] to-[#0377EB] rounded-lg hover:opacity-90 transition-opacity"
            >
              Save & Change Status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/** ─────────────────────── Add Lead Modal ─────────────────────── */

const AddLeadModal: React.FC<{ onClose: () => void; onLeadAdded: (newLead: Enquiry) => void }> = ({ onClose, onLeadAdded }) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    courseId: "",
    source: "",
    notes: ""
  });
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch courses when modal opens
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/courses`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.success) {
          setCourses(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/admission-enquiries`,
        {
          studentName: formData.name,
          email: formData.email,
          phone: formData.phone,
          courseId: formData.courseId,
          source: formData.source,
          notes: formData.notes
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        const newEnquiry = response.data.data;
        
        // Format date from ISO to DD-MM-YYYY
        const date = new Date(newEnquiry.createdAt);
        const formattedDate = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;

        // Map to component format
        const mappedEnquiry: Enquiry = {
          _id: newEnquiry._id,
          name: newEnquiry.studentName,
          email: newEnquiry.email,
          phone: newEnquiry.phone,
          course: newEnquiry.courseId?.name || 'Not specified',
          courseStream: newEnquiry.courseId?.streamType,
          source: newEnquiry.source,
          status: 'interested',
          date: formattedDate,
          college: '',
          statusNote: newEnquiry.notes,
          callNotes: [],
          emailNotes: [],
          generalNotes: []
        };

        onLeadAdded(mappedEnquiry);
        onClose();
      }
    } catch (error: any) {
      console.error('Error adding lead:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add lead. Please try again.';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-1/2 bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add New Enquiry Lead</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-sm text-gray-600 mb-6">
            Fill in the details below to add a new student enquiry to the system
          </p>

          <div className="space-y-4">
            {/* Name and Phone */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Amit Kumar"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#127BFF]/30 focus:border-[#127BFF]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone (WhatsApp no)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 9876500100"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#127BFF]/30 focus:border-[#127BFF]"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email ID
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="amit.kumar@gmail.com"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#127BFF]/30 focus:border-[#127BFF]"
                required
              />
            </div>

            {/* Course and Source */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Courses
                </label>
                <div className="relative">
                  <select
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    className="w-full appearance-none px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#127BFF]/30 focus:border-[#127BFF]"
                    required
                    disabled={loading}
                  >
                    <option value="">Select course</option>
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.streamType ? `${course.name} - ${course.streamType}` : course.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M7 10l5 5 5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source
                </label>
                <div className="relative">
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full appearance-none px-3 py-2.5 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#127BFF]/30 focus:border-[#127BFF]"
                    required
                  >
                    <option value="">Select source</option>
                    <option value="website">Website</option>
                    <option value="social_media">Social Media</option>
                    <option value="referral">Referral</option>
                    <option value="exhibition">Exhibition</option>
                    <option value="advertisement">Advertisement</option>
                    <option value="other">Other</option>
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M7 10l5 5 5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Student interested in AI/ML specialization. Prefers morning classes. Parents interested in scholarship programs..."
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#127BFF]/30 focus:border-[#127BFF] resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-[#127BFF] border border-[#127BFF] rounded-lg hover:bg-[#0f6be0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Adding...' : 'Add Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/** ─────────────────────── Page Component ─────────────────────── */

const AdmissionEnquiries: React.FC = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"leads" | "meetings">("leads");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"All Status" | EnquiryStatus>("All Status");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Enquiry | null>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callModalLead, setCallModalLead] = useState<Enquiry | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailModalLead, setEmailModalLead] = useState<Enquiry | null>(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  
  // Status Change Note Modal States
  const [showStatusNoteModal, setShowStatusNoteModal] = useState(false);
  const [statusChangeData, setStatusChangeData] = useState<{
    enquiryId: string;
    newStatus: EnquiryStatus;
  } | null>(null);
  
  // Schedule Meeting Modal States
  const [showScheduleMeetingModal, setShowScheduleMeetingModal] = useState(false);
  const [scheduleMeetingLead, setScheduleMeetingLead] = useState<Enquiry | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meetingStatuses, setMeetingStatuses] = useState<Record<string, 'pending' | 'accepted' | 'declined'>>({});

  // Meeting Full Details Modal States
  const [showMeetingDetailsModal, setShowMeetingDetailsModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close status dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };

    if (showStatusDropdown || openDropdownId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStatusDropdown, openDropdownId]);

  // Handle status update without note (for statuses other than "contacted")
  const handleStatusUpdateWithoutNote = async (enquiryId: string, newStatus: EnquiryStatus) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/admission-enquiries/${enquiryId}/status`,
        {
          status: newStatus
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        // Update the enquiry status locally
        setEnquiries(prev => prev.map(e => 
          e._id === enquiryId 
            ? { 
                ...e, 
                status: newStatus, 
                statusChangeDate: new Date().toISOString() 
              } 
            : e
        ));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  // Fetch admission enquiries from API
  useEffect(() => {
    const fetchEnquiries = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/admission-enquiries`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.success) {
          // Map API response to component format
          const mappedEnquiries: Enquiry[] = response.data.data.map((item: any) => {
            // Format date from ISO to DD-MM-YYYY
            const date = new Date(item.createdAt);
            const formattedDate = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;

            // Map API status to component status
            let mappedStatus: EnquiryStatus = 'interested';
            if (['contacted', 'converted', 'closed', 'interested'].includes(item.status)) {
              mappedStatus = item.status as EnquiryStatus;
            } else if (item.status === 'new' || item.status === 'active' || item.status === 'responded') {
              mappedStatus = 'interested';
            }

            // Extract course and stream from notes if courseId is not available
            let courseName = 'Not specified';
            let courseStream = undefined;
            
            // Check if we have courseId populated with name and streamType
            if (item.courseId?.name) {
              courseName = item.courseId.name;
              courseStream = item.courseId.streamType || item.courseId.stream;
            }
            
            // If courseId doesn't have streamType, try to parse from notes
            if (!courseStream && item.notes?.includes('Interested in:')) {
              // Parse "Interested in: B.Tech - Computer Science Engineering" format
              const match = item.notes.match(/Interested in:\s*(.+)/);
              if (match) {
                const fullCourse = match[1].trim();
                // Try to split by " - " to separate course and stream
                const parts = fullCourse.split(' - ');
                if (parts.length === 2) {
                  // If we don't have courseName yet, use the first part
                  if (courseName === 'Not specified') {
                    courseName = parts[0].trim();
                  }
                  courseStream = parts[1].trim();
                } else if (courseName === 'Not specified') {
                  // No separator found, use the whole thing as course name
                  courseName = fullCourse;
                }
              }
            }
            
            // Final fallback: if we still don't have courseName, use notes
            if (courseName === 'Not specified' && item.notes) {
              const match = item.notes.match(/Interested in:\s*(.+)/);
              if (match) {
                courseName = match[1].trim();
              }
            }

            return {
              _id: item._id,
              name: item.studentName,
              email: item.email,
              phone: item.phone,
              course: courseName,
              courseStream: courseStream,
              source: item.source,
              status: mappedStatus,
              date: formattedDate,
              college: '', // Not needed in component
              statusNote: item.notes,
              callNotes: [],
              emailNotes: [],
              generalNotes: []
            };
          });

          setEnquiries(mappedEnquiries);
        }
      } catch (error) {
        console.error('Error fetching enquiries:', error);
        // Set empty array on error instead of showing mock data
        setEnquiries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEnquiries();
  }, []);

  const statusOptions: { value: "All Status" | EnquiryStatus; label: string }[] = [
    { value: "All Status", label: "All Status" },
    { value: "contacted", label: "Contacted" },
    { value: "interested", label: "Interested" },
    { value: "converted", label: "Converted" },
    { value: "closed", label: "Closed" }
  ];

  const handleStatusSelect = (selectedStatus: "All Status" | EnquiryStatus) => {
    setStatus(selectedStatus);
    setShowStatusDropdown(false);
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return enquiries.filter((e) => {
      const matchesTerm =
        !term ||
        e.name.toLowerCase().includes(term) ||
        e.email.toLowerCase().includes(term) ||
        e.course.toLowerCase().includes(term);
      const matchesStatus =
        status === "All Status" ? true : e.status === status;
      return matchesTerm && matchesStatus;
    });
  }, [enquiries, search, status]);

  return (
    <div className="min-h-screen bg-white">
    <div className="p-6 lg:p-8 bg-white">
      {/* Page title row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Manage & Track Enquiries
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Total leads: {enquiries.length}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-lg space-x-2 bg-gradient-to-r from-[#2791FC] to-[#0377EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0f6be0] transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 6v12M6 12h12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Add New Lead
        </button>
      </div>

      {/* Tab Controls */}
      <div className="flex gap-2 mb-6">
        <div className="inline-flex rounded-full border border-gray-200 bg-gray-100 p-1">
          {/* Leads Management */}
          <button
            onClick={() => setTab("leads")}
            className={classNames(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition",
              tab === "leads"
                ? "space-x-2 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white shadow-sm ring-1 ring-[#BBD7FF]"
                : "text-gray-600 hover:text-gray-800"
            )}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path
                d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2m4-2v4m0 0V2m0 2h2m-2 0H8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Leads Management
          </button>

          {/* Upcoming Meetings */}
          <button
            onClick={() => setTab("meetings")}
            className={classNames(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition",
              tab === "meetings"
                ? "space-x-2 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white shadow-sm ring-1 ring-[#BBD7FF]"
                : "text-gray-600 hover:text-gray-800"
            )}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Upcoming Meetings ({meetings.length})
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {tab === "meetings" ? (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Meetings ({meetings.length})</h3>
            <p className="text-sm text-gray-500 mb-4">Track and manage all your student enquiries</p>
          </div>
            
          {meetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <CalendarIcon className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No meetings scheduled yet
              </h3>
              <p className="text-gray-500 text-center max-w-md">
                Schedule meetings with leads from the Leads Management tab to see them here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {meetings.map((meeting) => {
                  return (
                    <div 
                      key={meeting.id} 
                      className="flex h-full flex-col rounded-[24px] bg-white p-6"
                      style={{
                        border: '1px solid #CBD6F3',
                        boxShadow: '0px 20px 45px rgba(15, 23, 42, 0.08)'
                      }}
                    >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Enquiry Details</p>
                      <h4 className="text-lg font-semibold text-gray-900">{meeting.leadName}</h4>
                    </div>
                    <div className="flex items-start gap-3 text-xs font-medium text-gray-500">
                      <span>{meeting.timestamp}</span>
                      <div className="relative" ref={openDropdownId === meeting.id ? dropdownRef : null}>
                        <button 
                          onClick={() => setOpenDropdownId(openDropdownId === meeting.id ? null : meeting.id)}
                          className="text-gray-400 transition hover:text-gray-600"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {openDropdownId === meeting.id && (
                          <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setSelectedMeeting(meeting);
                                  setShowMeetingDetailsModal(true);
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
                  </div>                      <div className="mt-5 grid gap-4 sm:grid-cols-3">
                        {[
                          { label: 'Date', value: meeting.date },
                          { label: 'Time slot', value: meeting.timeSlot },
                          { label: 'Meeting type', value: meeting.meetingType }
                        ].map((item) => (
                          <div key={item.label}>
                            <p className="text-sm font-medium text-gray-500">{item.label}:</p>
                            <p className="mt-1 text-base font-semibold text-gray-900">{item.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 flex gap-3">
                        <button
                          onClick={() => {
                            window.open(meeting.meetingLink, '_blank');
                          }}
                          className="flex-1 rounded-[12px] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
                          style={{ background: 'linear-gradient(90deg, #2590FB 0%, #0478EB 100%)' }}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Video className="h-4 w-4" />
                            Join
                          </div>
                        </button>
                        <button
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-[12px] border px-4 py-2.5 text-sm font-semibold transition hover:bg-blue-50"
                          style={{ borderColor: '#2590FB', color: '#2590FB' }}
                        >
                          <CalendarIcon className="h-4 w-4" />
                          Reschedule
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Search and Filter Controls Container */}
          <div className="rounded-lg border border-gray-200 shadow-md mb-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
            <div className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, or course"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#127BFF]/30 focus:border-[#127BFF]"
                />
              </div>

              <div className="relative" ref={statusDropdownRef}>
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="flex items-center justify-between w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-left focus:outline-none focus:ring-2 focus:ring-[#127BFF]/30 focus:border-[#127BFF] hover:border-gray-400 transition-colors min-w-[140px]"
                >
                  <span className="text-gray-700">
                    {statusOptions.find(opt => opt.value === status)?.label || "All Status"}
                  </span>
                <svg 
                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showStatusDropdown ? 'rotate-180' : ''}`} 
                  viewBox="0 0 24 24" 
                  fill="none"
                >
                  <path
                    d="M7 10l5 5 5-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              
              {/* Custom Dropdown Menu */}
              {showStatusDropdown && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleStatusSelect(option.value)}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                        status === option.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="grid place-items-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#127BFF] border-t-transparent" />
            </div>
          ) : filtered.length ? (
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((item) => (
                <EnquiryCard
                  key={item._id}
                  item={item}
                  onView={(id) => {
                    const enquiry = filtered.find(e => e._id === id);
                    if (enquiry) setSelectedLead(enquiry);
                  }}
                  onCall={(id) => {
                    const enquiry = filtered.find(e => e._id === id);
                    if (enquiry) {
                      setCallModalLead(enquiry);
                      setShowCallModal(true);
                    }
                  }}
                  onChat={(id) => {
                    const enquiry = filtered.find(e => e._id === id);
                    if (enquiry) {
                      setEmailModalLead(enquiry);
                      setShowEmailModal(true);
                    }
                  }}
                  onMore={(id) => console.log("more", id)}
                  onStatusUpdate={(id, newStatus) => {
                    // Only show modal for "contacted" status - College Response
                    if (newStatus.toLowerCase() === 'contacted') {
                      setStatusChangeData({ enquiryId: id, newStatus });
                      setShowStatusNoteModal(true);
                    } else {
                      // For other statuses, update without note
                      handleStatusUpdateWithoutNote(id, newStatus);
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="grid place-items-center py-16">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No enquiries found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Status Note Modal */}
      {showStatusNoteModal && statusChangeData && (
        <StatusNoteModal
          statusName={statusChangeData.newStatus.charAt(0).toUpperCase() + statusChangeData.newStatus.slice(1)}
          onClose={() => {
            setShowStatusNoteModal(false);
            setStatusChangeData(null);
          }}
          onSave={async (note) => {
            try {
              // Call API to update status
              const response = await axios.put(
                `${API_BASE_URL}/api/admission-enquiries/${statusChangeData.enquiryId}/status`,
                {
                  status: statusChangeData.newStatus,
                  notes: note
                },
                {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }
                }
              );

              if (response.data.success) {
                // Update the enquiry status locally
                setEnquiries(prev => prev.map(e => 
                  e._id === statusChangeData.enquiryId 
                    ? { 
                        ...e, 
                        status: statusChangeData.newStatus, 
                        statusNote: note, 
                        statusChangeDate: new Date().toISOString() 
                      } 
                    : e
                ));
              }
            } catch (error) {
              console.error('Error updating status:', error);
              alert('Failed to update status. Please try again.');
            } finally {
              setShowStatusNoteModal(false);
              setStatusChangeData(null);
            }
          }}
        />
      )}
      
      {/* Add Lead Modal */}
      {showAddModal && (
        <AddLeadModal 
          onClose={() => setShowAddModal(false)} 
          onLeadAdded={(newLead) => {
            setEnquiries(prev => [newLead, ...prev]);
          }}
        />
      )}
      
      {/* Call Modal */}
      {showCallModal && callModalLead && (
        <CallModal 
          enquiry={callModalLead}
          onClose={() => {
            setShowCallModal(false);
            setCallModalLead(null);
          }}
          onSave={async (outcome, notes) => {
            try {
              const currentDate = new Date().toLocaleDateString();
              const callNote = `[${currentDate}] Call: ${outcome}${notes ? ` - ${notes}` : ''}`;
              
              // Update the enquiry with the new call note
              const response = await axios.put(
                `${API_BASE_URL}/api/admission-enquiries/${callModalLead._id}/status`,
                {
                  status: callModalLead.status,
                  notes: `${callModalLead.statusNote || ''}\n\n${callNote}`
                },
                {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }
                }
              );

              if (response.data.success) {
                // Update lead status based on outcome
                let newStatus: EnquiryStatus = callModalLead.status;
                if (outcome === "Answered - Interested") {
                  newStatus = "interested";
                } else if (outcome === "Answered - Not Interested") {
                  newStatus = "closed";
                } else if (outcome === "Answered - Needs Callback") {
                  newStatus = "contacted";
                }
                
                // Update local state
                setEnquiries(prev => prev.map(e => 
                  e._id === callModalLead._id ? { 
                    ...e, 
                    status: newStatus,
                    statusNote: `${e.statusNote || ''}\n\n${callNote}`,
                    callNotes: [...(e.callNotes || []), { date: currentDate, outcome, note: notes }]
                  } : e
                ));
              }
            } catch (error) {
              console.error('Error saving call notes:', error);
              alert('Failed to save call notes. Please try again.');
            } finally {
              setShowCallModal(false);
              setCallModalLead(null);
            }
          }}
        />
      )}
      
      {/* Email Modal */}
      {showEmailModal && emailModalLead && (
        <EmailModal 
          enquiry={emailModalLead}
          onClose={() => {
            setShowEmailModal(false);
            setEmailModalLead(null);
          }}
          onSend={async (templateType, customContent) => {
            try {
              const currentDate = new Date().toLocaleDateString();
              const emailNote = `[${currentDate}] Email: ${templateType}`;
              
              // Update the enquiry with the new email note
              const response = await axios.put(
                `${API_BASE_URL}/api/admission-enquiries/${emailModalLead._id}/status`,
                {
                  status: 'contacted',
                  notes: `${emailModalLead.statusNote || ''}\n\n${emailNote}`
                },
                {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }
                }
              );

              if (response.data.success) {
                // Open mailto link
                const fullCourse = emailModalLead.courseStream 
                  ? `${emailModalLead.course} - ${emailModalLead.courseStream}`
                  : emailModalLead.course;
                
                const subject = templateType === "Custom Email" ? "Custom Email" : 
                  templateType === "Welcome Email" ? `Welcome to ${fullCourse} - Next Steps` :
                  templateType === "Application Process" ? `Application Process for ${fullCourse}` :
                  `Following up on your ${fullCourse} inquiry`;
                
                const mailtoUrl = `mailto:${emailModalLead.email}?subject=${encodeURIComponent(subject)}`;
                window.open(mailtoUrl);
                
                // Update local state
                setEnquiries(prev => prev.map(e => 
                  e._id === emailModalLead._id ? { 
                    ...e, 
                    status: "contacted",
                    statusNote: `${e.statusNote || ''}\n\n${emailNote}`,
                    emailNotes: [...(e.emailNotes || []), { date: currentDate, template: templateType }]
                  } : e
                ));
              }
            } catch (error) {
              console.error('Error saving email notes:', error);
              alert('Failed to save email notes. Please try again.');
            } finally {
              setShowEmailModal(false);
              setEmailModalLead(null);
            }
          }}
        />
      )}
      
      {/* Lead Details Modal */}
      {selectedLead && (
        <LeadDetailsModal 
          enquiry={selectedLead} 
          onClose={() => setSelectedLead(null)}
          onStatusUpdate={(id, newStatus) => {
            // Store the status change data and open modal for note
            setStatusChangeData({ enquiryId: id, newStatus });
            setShowStatusNoteModal(true);
            setSelectedLead(null); // Close the lead details modal
          }}
          onScheduleMeeting={() => {
            setScheduleMeetingLead(selectedLead);
            setShowScheduleMeetingModal(true);
          }}
          onNoteAdded={(enquiryId, note) => {
            // Update the enquiry with the new note
            setEnquiries(prev => prev.map(e => 
              e._id === enquiryId ? {
                ...e,
                statusNote: `${e.statusNote || ''}\n\n[${new Date().toLocaleDateString()}] Note: ${note}`,
                generalNotes: [...(e.generalNotes || []), { date: new Date().toLocaleDateString(), note }]
              } : e
            ));
            // Update selectedLead to reflect changes
            setSelectedLead(prev => prev ? {
              ...prev,
              statusNote: `${prev.statusNote || ''}\n\n[${new Date().toLocaleDateString()}] Note: ${note}`,
              generalNotes: [...(prev.generalNotes || []), { date: new Date().toLocaleDateString(), note }]
            } : null);
          }}
        />
      )}
      
      {/* Schedule Meeting Modal */}
      {showScheduleMeetingModal && scheduleMeetingLead && (
        <ScheduleMeetingModal
          isOpen={showScheduleMeetingModal}
          onClose={() => {
            setShowScheduleMeetingModal(false);
            setScheduleMeetingLead(null);
          }}
          leadName={scheduleMeetingLead.name}
          leadEmail={scheduleMeetingLead.email}
          leadPhone={scheduleMeetingLead.phone}
          onSchedule={(data) => {
            // Create new meeting
            const meetingId = `meeting-${Date.now()}`;
            const newMeeting: Meeting = {
              id: meetingId,
              leadName: data.name,
              email: data.email,
              phone: data.phone,
              date: new Date(data.date).toLocaleDateString('en-GB', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
              }),
              timeSlot: `${data.startTime}`,
              duration: data.duration,
              meetingType: 'Gmeet',
              meetingLink: data.meetingLink,
              timestamp: new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              }),
              status: 'pending'
            };
            
            setMeetings(prev => [newMeeting, ...prev]);
            setMeetingStatuses(prev => ({ ...prev, [meetingId]: 'pending' }));
            
            // Update lead status to contacted
            setEnquiries(prev => prev.map(e => 
              e._id === scheduleMeetingLead._id ? { ...e, status: "contacted" } : e
            ));
            
            // Close the lead details modal if it's open
            setSelectedLead(null);
            
            console.log("Meeting scheduled:", newMeeting);
          }}
        />
      )}

      {/* Meeting Full Details Modal */}
      {showMeetingDetailsModal && selectedMeeting && (
        <MeetingFullDetailsModal
          isOpen={showMeetingDetailsModal}
          onClose={() => {
            setShowMeetingDetailsModal(false);
            setSelectedMeeting(null);
          }}
          meeting={selectedMeeting}
          viewMode="college" // Use 'college' for admission enquiries (shows lead details)
        />
      )}
    </div>
    </div>
  );
};

export default AdmissionEnquiries;
