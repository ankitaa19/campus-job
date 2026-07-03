import { X, Mail, Phone, Building2, GraduationCap, Briefcase, MapPin, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ScheduleInterviewModal from './ScheduleInterviewModal';
import SendAssignmentModal, { AssignmentData } from './SendAssignmentModal';

type Status = "Applied" | "Shortlisted" | "Interview" | "Offered" | "Hired" | "Rejected";
type ActionValue =
  | "APPLICATION_RECEIVED"
  | "SHORTLIST"
  | "SEND_ASSIGNMENT"
  | "SCHEDULE_INTERVIEW"
  | "RESCHEDULE_INTERVIEW"
  | "SEND_OFFER"
  | "HIRE";

interface Candidate {
  id: string;
  name: string;
  college?: string; // Made optional to match JobApplicationsView
  email: string;
  phone?: string;
  match: number; // 0-100
  appliedDate: string; // e.g., "Oct 15, 2025"
  resumeUrl?: string; // URL to the PDF resume
}

interface Props {
  candidate: Candidate;
  isOpen: boolean;
  onClose: () => void;
  initialStatus?: Status;
  onStatusChange?: (id: string, newStatus: Status) => void;
  onAction?: (id: string, action: ActionValue) => void;
  onAssignmentSent?: (data: AssignmentData) => void;
}

const statusPill = (s: Status) => {
  switch (s) {
    case "Applied":
      return "bg-violet-50 text-violet-700 ring-1 ring-violet-100";
    case "Shortlisted":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
    case "Interview":
      return "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100";
    case "Offered":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-100";
    case "Hired":
      return "bg-green-50 text-green-700 ring-1 ring-green-100";
    case "Rejected":
      return "bg-rose-50 text-rose-700 ring-1 ring-rose-100";
  }
};

const matchTone = (m: number) => (m >= 85 ? "text-emerald-600" : m >= 70 ? "text-amber-600" : "text-rose-600");

export default function CandidateProfileModal({
  candidate,
  isOpen,
  onClose,
  initialStatus = "Applied",
  onStatusChange,
  onAction,
  onAssignmentSent
}: Props) {
  const [activeTab, setActiveTab] = useState<"profile" | "resume">("profile");
  const [candidateStatus, setCandidateStatus] = useState<Status>(initialStatus);
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const actionDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => setCandidateStatus(initialStatus), [initialStatus]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (
        actionDropdownRef.current &&
        !actionDropdownRef.current.contains(e.target as Node)
      ) {
        setShowActionDropdown(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // ---- ACTIONS per spec ----
  const availableActions = useMemo(() => {
    if (candidateStatus === "Rejected") {
      return [
        { label: "Application Received", value: "APPLICATION_RECEIVED" as ActionValue },
        { label: "Shortlist", value: "SHORTLIST" as ActionValue },
      ];
    }
    if (candidateStatus === "Hired") return []; // disabled button anyway

    // Base set for "other status"
    const base = [
      { label: "Send Assignment", value: "SEND_ASSIGNMENT" as ActionValue },
      { label: "Schedule Interview", value: "SCHEDULE_INTERVIEW" as ActionValue },
      { label: "Send Offer", value: "SEND_OFFER" as ActionValue },
      { label: "Hire", value: "HIRE" as ActionValue },
    ];

    if (candidateStatus === "Applied") {
      // Add Shortlist for Applied
      return [{ label: "Shortlist", value: "SHORTLIST" as ActionValue }, ...base];
    }

    if (candidateStatus === "Shortlisted") {
      // No Shortlist in dropdown
      return base;
    }

    if (candidateStatus === "Interview") {
      // Replace Schedule with Reschedule; remove Shortlist
      return [
        { label: "Reschedule Interview", value: "RESCHEDULE_INTERVIEW" as ActionValue },
        { label: "Send Assignment", value: "SEND_ASSIGNMENT" as ActionValue },
        { label: "Send Offer", value: "SEND_OFFER" as ActionValue },
        { label: "Hire", value: "HIRE" as ActionValue },
      ];
    }

    if (candidateStatus === "Offered") {
      // Reasonable set after offer
      return [
        { label: "Send Assignment", value: "SEND_ASSIGNMENT" as ActionValue },
        { label: "Send Offer", value: "SEND_OFFER" as ActionValue },
        { label: "Hire", value: "HIRE" as ActionValue },
      ];
    }

    return base;
  }, [candidateStatus]);

  const handleActionSelect = (value: ActionValue) => {
    setShowActionDropdown(false);
    if (value === "APPLICATION_RECEIVED") {
      setCandidateStatus("Applied");
      onStatusChange?.(candidate.id, "Applied");
    }
    if (value === "SHORTLIST") {
      setCandidateStatus("Shortlisted");
      onStatusChange?.(candidate.id, "Shortlisted");
    }
    if (value === "HIRE") {
      setCandidateStatus("Hired");
      onStatusChange?.(candidate.id, "Hired");
    }
    if (value === "SCHEDULE_INTERVIEW" || value === "RESCHEDULE_INTERVIEW") {
      // Only show modal, don't change status until interview is actually scheduled
      setShowInterviewModal(true);
    }
    if (value === "SEND_ASSIGNMENT") {
      setShowAssignmentModal(true);
    }
    if (value === "SEND_OFFER") {
      setCandidateStatus("Offered");
      onStatusChange?.(candidate.id, "Offered");
    }
    onAction?.(candidate.id, value);
  };

  // Handler for when interview is actually scheduled
  const handleInterviewScheduled = () => {
    setCandidateStatus("Interview");
    onStatusChange?.(candidate.id, "Interview");
    setShowInterviewModal(false);
  };

  // Handler for when assignment is sent
  const handleAssignmentSent = (data: AssignmentData) => {
    onAssignmentSent?.(data);
    setShowAssignmentModal(false);
  };

  if (!isOpen) return null;

  const disableReject = candidateStatus === "Rejected";
  const disableSelectAction = candidateStatus === "Hired" || availableActions.length === 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className={`relative w-full max-w-5xl rounded-xl bg-white shadow-2xl ring-1 ring-gray-200`}>
          {/* Header */}
          <div className={`flex items-start justify-between border-b border-gray-200 p-6 ${candidateStatus === "Rejected" ? "bg-rose-50" : ""}`}>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold">
                {candidate.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 leading-6">{candidate.name}</h2>
                <p className="text-sm text-gray-500">{candidate.college || "College not specified"}</p>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Current Status</p>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusPill(candidateStatus)}`}>
                  {candidateStatus}
                </span>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Match Score</p>
                <p className={`text-lg font-bold ${matchTone(candidate.match)}`}>
                  {candidate.match}% <span className="text-sm font-normal text-gray-600">Excellent Fit</span>
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Applied Date</p>
                <p className="text-sm font-medium text-gray-900">{candidate.appliedDate}</p>
              </div>

              <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex px-6">
              <button
                onClick={() => setActiveTab("profile")}
                className={`-mb-px border-b-2 px-1 py-4 text-sm font-medium ${
                  activeTab === "profile"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                Profile Overview
              </button>
              <button
                onClick={() => setActiveTab("resume")}
                className={`ml-8 -mb-px border-b-2 px-1 py-4 text-sm font-medium ${
                  activeTab === "resume"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                Resume Document
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === "profile" && (
              <div className="space-y-6">
                {/* Contact Information */}
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <h3 className="text-base font-semibold text-gray-900">Contact Information</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 p-4 md:grid-cols-3">
                    <InfoItem
                      icon={<Building2 className="h-5 w-5 text-blue-600" />}
                      title="College"
                      value={candidate.college || "Not specified"}
                      bubbleClass="bg-blue-100"
                    />
                    <InfoItem
                      icon={<Mail className="h-5 w-5 text-pink-600" />}
                      title="Email"
                      value={candidate.email}
                      bubbleClass="bg-pink-100"
                    />
                    <InfoItem
                      icon={<Phone className="h-5 w-5 text-purple-600" />}
                      title="Phone"
                      value={candidate.phone || "+91 1066100110"}
                      bubbleClass="bg-purple-100"
                    />
                  </div>
                </section>

                {/* Education */}
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-gray-400" />
                    <h3 className="text-base font-semibold text-gray-900">Education</h3>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                        <GraduationCap className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{candidate.college || "College not specified"}</p>
                        <p className="text-sm text-gray-500">B.Tech CSE, 2024</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Skills & Expertise */}
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-5 w-5 rounded bg-gray-400" />
                    <h3 className="text-base font-semibold text-gray-900">Skills &amp; Expertise</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["React", "Node.js", "TypeScript", "MongoDB", "AWS"].map((s) => (
                      <span 
                        key={s} 
                        className="rounded-md px-3 py-1 text-sm"
                        style={{
                          backgroundColor: 'rgba(204, 177, 255, 0.20)',
                          color: '#7F3DFF'
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </section>

                {/* Experience */}
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                    <h3 className="text-base font-semibold text-gray-900">Experience</h3>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                        <Briefcase className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Software Engineer</p>
                            <p className="text-sm text-gray-500">Full Stack Developer</p>
                          </div>
                          <p className="text-sm text-gray-500">Jan 2025 – June 2025</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Preferences */}
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <h3 className="text-base font-semibold text-gray-900">Preferences</h3>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                        <MapPin className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Location</p>
                        <p className="font-medium text-gray-900">Remote</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === "resume" && (
              <div className="rounded-lg border border-gray-200 p-4">
                {candidate.resumeUrl ? (
                  <div className="h-96 w-full">
                    <iframe
                      src={candidate.resumeUrl}
                      className="h-full w-full rounded border"
                      title={`${candidate.name}'s Resume`}
                    />
                  </div>
                ) : (
                  <div className="flex h-96 items-center justify-center rounded border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <div className="mx-auto h-12 w-12 text-gray-400">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="mt-2 text-sm font-medium text-gray-900">No resume available</p>
                      <p className="text-xs text-gray-500">Resume document not uploaded</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end border-t border-gray-200 p-6">
            <div className="flex items-center gap-3">
              {/* Reject Button */}
              <button
                disabled={disableReject}
                onClick={() => {
                  setCandidateStatus("Rejected");
                  onStatusChange?.(candidate.id, "Rejected");
                }}
                className={`rounded-md px-4 py-2 text-sm font-medium ring-1 ring-inset transition ${
                  disableReject
                    ? "bg-gray-50 text-gray-400 ring-gray-200 cursor-not-allowed"
                    : "bg-white ring-gray-300 hover:bg-gray-50"
                }`}
                style={!disableReject ? {
                  border: '1px solid #EC1B1B',
                  color: '#EC1B1B'
                } : {}}
              >
                Reject
              </button>

              {/* Select Action */}
              <div className="relative" ref={actionDropdownRef}>
                <button
                  disabled={disableSelectAction}
                  onClick={() => setShowActionDropdown((s) => !s)}
                  className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium ${
                    disableSelectAction
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "text-white"
                  }`}
                  style={!disableSelectAction ? {
                    background: 'linear-gradient(90deg, #2490FB 0%, #0478EB 100%)'
                  } : {}}
                >
                  Select Action
                  <ChevronDown className={`h-4 w-4 transition-transform ${showActionDropdown ? "rotate-180" : ""}`} />
                </button>

                {showActionDropdown && !disableSelectAction && (
                  <div className="absolute right-0 bottom-full mb-2 min-w-[220px] rounded-lg border border-gray-200 bg-white shadow-xl z-[60]">
                    <div className="py-1">
                      {availableActions.map((a) => (
                        <button
                          key={a.value}
                          onClick={() => handleActionSelect(a.value)}
                          className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          <span>{a.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        isOpen={showInterviewModal}
        onClose={() => setShowInterviewModal(false)}
        candidateName={candidate.name}
        onSchedule={(interviewData) => {
          console.log('Interview scheduled:', interviewData);
          handleInterviewScheduled();
        }}
      />

      {/* Send Assignment Modal */}
      <SendAssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        candidateName={candidate.name}
        candidateId={candidate.id}
        candidateEmail={candidate.email}
        college={candidate.college}
        onSend={(data) => {
          handleAssignmentSent(data);
        }}
      />
    </div>
  );
}

function InfoItem({
  icon,
  title,
  value,
  bubbleClass,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  bubbleClass?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${bubbleClass || "bg-gray-100"}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500">{title}</p>
        <p className="font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}
