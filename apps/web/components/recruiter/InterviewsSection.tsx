import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  Calendar,
  Clock,
  GraduationCap,
  MapPin,
  Phone,
  Search,
  Video,
  ChevronDown,
  Mail,
  Briefcase,
  ArrowRight,
  Edit3,
  X,
} from "lucide-react";
import ProceedToNextRoundModal from './ProceedToNextRoundModal';
import InterviewFeedbackModal from './InterviewFeedbackModal';
import ViewFeedbackModal from './ViewFeedbackModal';
import ScheduleInterviewModal from './ScheduleInterviewModal';

interface Interview {
  id: string;
  candidateName: string;
  email: string;
  jobTitle: string;
  interviewRound: string;
  date: string;
  time: string;
  duration?: string;
  interviewType: "Online" | "Offline";
  interviewMode?: string;
  videoCallLink?: string;
  location?: string;
  status: "Reschedule Requested" | "Scheduled" | "Completed" | "Offer";
  outcome?: "Selected" | "On Hold" | "Rejected";
  college?: string;
  rescheduleReason?: string;
  completedDate?: string;
}

type TabType = "scheduled" | "completed" | "reschedule-request" | "offer";

const STATUS_TO_TAB: Record<Interview["status"], TabType> = {
  Scheduled: "scheduled",
  Completed: "completed",
  "Reschedule Requested": "reschedule-request",
  Offer: "offer",
};

const InterviewsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("scheduled");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortByCollegeAsc, setSortByCollegeAsc] = useState(true);
  const [page, setPage] = useState(1);
  
  const [isNextRoundModalOpen, setIsNextRoundModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isViewFeedbackModalOpen, setIsViewFeedbackModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  
  const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenStatusDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const interviews: Interview[] = [
    {
      id: "1",
      candidateName: "Gaurav Kapoor",
      email: "gaurav.kapoor@demo.edu",
      jobTitle: "Software Engineer Intern",
      interviewRound: "Round 1",
      date: "Mon - Oct 20 - 2025",
      time: "10:00 AM",
      duration: "2 hrs",
      interviewType: "Online",
      interviewMode: "Google Meet",
      videoCallLink: "http://meet.google.com/dwr-dwr-thr",
      status: "Reschedule Requested",
      college: "ABC University",
      rescheduleReason: "Have a midterm exam at the same time. Would prefer afternoon slots.",
    },
    {
      id: "2",
      candidateName: "Abhishek Sharma",
      email: "abhishek.sharma@demo.edu",
      jobTitle: "Software Engineering Intern",
      interviewRound: "Round 1",
      date: "Mon - Oct 20 - 2025",
      time: "10:00 AM",
      duration: "2 hrs",
      interviewType: "Online",
      interviewMode: "Google Meet",
      videoCallLink: "http://meet.google.com/dwr-dwr-thr",
      status: "Scheduled",
      college: "ABC University",
    },
    {
      id: "3",
      candidateName: "Shivani Singh",
      email: "shivani.singh@demo.edu",
      jobTitle: "Data Analyst Intern",
      interviewRound: "Round 1",
      date: "Mon - Oct 20 - 2025",
      time: "10:00 AM",
      duration: "2 hrs",
      interviewType: "Online",
      interviewMode: "Google Meet",
      status: "Scheduled",
      college: "ABC University",
    },
    {
      id: "4",
      candidateName: "Rohan Kumar",
      email: "rohan.kumar@demo.edu",
      jobTitle: "Software Engineering Intern",
      interviewRound: "Round 1",
      date: "Mon - Oct 20 - 2025",
      time: "10:00 AM",
      duration: "2 hrs",
      interviewType: "Offline",
      location: "XYZ Street 102 Bangalore, India",
      status: "Scheduled",
      college: "ABC University",
    },
    {
      id: "5",
      candidateName: "Abhishek Sharma",
      email: "abhishek.sharma@demo.edu",
      jobTitle: "Data Analyst Intern",
      interviewRound: "Round 1",
      date: "Mon - Oct 20 - 2025",
      time: "10:00 AM",
      duration: "2 hrs",
      interviewType: "Online",
      interviewMode: "Google Meet",
      status: "Completed",
      outcome: "Selected",
      college: "ABC University",
      completedDate: "Fri, Nov 15",
    },
    {
      id: "6",
      candidateName: "Shivani Singh",
      email: "shivani.singh@demo.edu",
      jobTitle: "Data Analyst Intern",
      interviewRound: "Round 1",
      date: "Mon - Oct 20 - 2025",
      time: "10:00 AM",
      duration: "2 hrs",
      interviewType: "Online",
      interviewMode: "Google Meet",
      status: "Completed",
      outcome: "On Hold",
      college: "ABC University",
      completedDate: "Fri, Nov 15",
    },
    {
      id: "7",
      candidateName: "Abhishek Sharma",
      email: "abhishek.sharma@demo.edu",
      jobTitle: "Software Engineer Intern",
      interviewRound: "Round 1",
      date: "Mon - Oct 20 - 2025",
      time: "10:00 AM",
      duration: "2 hrs",
      interviewType: "Online",
      interviewMode: "Google Meet",
      status: "Offer",
      college: "ABC University",
    },
  ];

  const tabCounts = useMemo(() => {
    const base = { scheduled: 0, completed: 0, "reschedule-request": 0, offer: 0 } as Record<TabType, number>;
    interviews.forEach((i) => (base[STATUS_TO_TAB[i.status]] += 1));
    return base;
  }, [interviews]);

  const filtered = useMemo(() => {
    const byStatus = interviews.filter((i) => STATUS_TO_TAB[i.status] === activeTab);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter((i) =>
      [i.candidateName, i.email, i.jobTitle, i.college || ""].some((v) =>
        v.toLowerCase().includes(q)
      )
    );
  }, [interviews, activeTab, searchQuery]);

  const PAGE_SIZE = 5;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageSlice = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  return (
       <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Interview <span className="text-blue-600">Management</span>
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your candidate interviews &amp; schedules
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#717182]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search candidate or college ..."
            className="w-full rounded-[10px] bg-white py-2.5 pl-10 pr-3 text-sm text-[#717182] placeholder-[#717182] focus:outline-none focus:ring-1 focus:ring-blue-300"
            style={{ border: '1px solid rgba(113, 113, 130, 0.5)' }}
          />
        </div>

        <button
          onClick={() => setSortByCollegeAsc((s) => !s)}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
          style={{ border: '1px solid #1383F3', color: '#1182F2' }}
        >
          <GraduationCap className="h-4 w-4" style={{ color: '#1182F2' }} />
          Sort by: College
        </button>
      </div>

      <div className="flex w-full rounded-full bg-gray-100 p-1">
        {([
          ["scheduled", "Schedule", tabCounts.scheduled],
          ["completed", "Completed", tabCounts.completed],
          ["reschedule-request", "Reschedule Request", tabCounts["reschedule-request"]],
          ["offer", "Offer", tabCounts.offer],
        ] as [TabType, string, number][]).map(([key, label, count]) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key);
                setPage(1);
              }}
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

      <div className="space-y-5">
        {pageSlice.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
              <Calendar className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-gray-600">No interviews in this tab yet</p>
          </div>
        ) : (
          pageSlice.map((interview) => {
            const initials = interview.candidateName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase();

            const statusMeta = {
              "Scheduled": {
                label: "Scheduled",
                pillBg: "linear-gradient(90deg, #2590FB 0%, #0478EB 100%)",
                borderColor: "#C7D6F3"
              },
              "Completed": {
                label: "Completed",
                pillBg: "linear-gradient(90deg, #16C960 0%, #0FA44B 100%)",
                borderColor: "#C7D6F3"
              },
              "Reschedule Requested": {
                label: "Reschedule Requested",
                pillBg: "linear-gradient(90deg, #FFAE35 0%, #FF8400 100%)",
                borderColor: "#F9C892"
              },
              "Offer": {
                label: "Offer",
                pillBg: "linear-gradient(90deg, #FF58A6 0%, #F62192 100%)",
                borderColor: "#E8C6E1"
              }
            }[interview.status];

            const TypeIcon = interview.interviewType === "Online" ? Video : MapPin;
            const typeLabel =
              interview.interviewType === "Online" ? "Online Interview" : "Offline Interview";

            const showJoinMeeting =
              interview.status === "Scheduled" &&
              interview.interviewType === "Online" &&
              Boolean(interview.videoCallLink);
            const showRescheduleButton =
              interview.status === "Scheduled" || interview.status === "Reschedule Requested";
            const showCancelButton = interview.status !== "Completed";

            return (
              <article
                key={interview.id}
                className="rounded-[20px] border bg-white p-6"
                style={{
                  borderColor: statusMeta?.borderColor || "#CBD6F3",
                  boxShadow: "0px 12px 32px rgba(15, 23, 42, 0.08)"
                }}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div
                      className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-xl font-semibold text-white"
                      style={{ background: "linear-gradient(135deg, #C7A9FF 0%, #A385F5 100%)" }}
                    >
                      {initials}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {interview.candidateName}
                        </h3>
                        {interview.interviewRound && (
                          <span className="rounded-full bg-[#E3F2FD] px-2.5 py-0.5 text-xs font-medium text-[#2196F3]">
                            {interview.interviewRound}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{interview.email}</p>
                    </div>
                  </div>

                  <div
                    className="relative"
                    ref={openStatusDropdown === interview.id ? dropdownRef : null}
                  >
                    <button
                      onClick={() =>
                        setOpenStatusDropdown(
                          openStatusDropdown === interview.id ? null : interview.id
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm"
                      style={{ background: statusMeta?.pillBg }}
                    >
                      {statusMeta?.label ?? interview.status}
                      <ChevronDown className="h-4 w-4 text-white" />
                    </button>

                    {openStatusDropdown === interview.id && (
                      <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-xl">
                        <div className="border-b border-gray-100 px-4 py-2 text-xs font-semibold text-gray-500">
                          Select Status
                        </div>
                        <button
                          onClick={() => {
                            setSelectedInterview(interview);
                            setIsRescheduleModalOpen(true);
                            setOpenStatusDropdown(null);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Reschedule Interview
                        </button>
                        <button
                          onClick={() => {
                            setSelectedInterview(interview);
                            setIsFeedbackModalOpen(true);
                            setOpenStatusDropdown(null);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Completed {interview.interviewRound || "Round"}
                        </button>
                        <button
                          onClick={() => {
                            console.log("Status changed to Offer");
                            setOpenStatusDropdown(null);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Offer
                        </button>
                        <button
                          onClick={() => {
                            console.log("Status changed to Rejected");
                            setOpenStatusDropdown(null);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                        >
                          Rejected
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-[#6F7A91]" />
                    <span>{interview.jobTitle}</span>
                  </div>
                  {interview.college && (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-[#6F7A91]" />
                      <span>Student - {interview.college}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#6F7A91]" />
                    <span>{interview.date}</span>
                    <Clock className="h-4 w-4 text-[#6F7A91]" />
                    <span>{interview.time}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <TypeIcon className="h-4 w-4 text-[#6F7A91]" />
                    <span>{typeLabel}</span>
                    {interview.duration && (
                      <>

                        <Clock className="h-4 w-4 text-[#6F7A91]" />
                        <span>Duration: {interview.duration}</span>
                      </>
                    )}
                  </div>
                </div>

                {interview.status === "Reschedule Requested" && interview.rescheduleReason && (
                  <div className="mt-5 rounded-[14px] bg-[#FFF4E6] px-4 py-3 text-sm text-[#E67817]">
                    <span className="font-semibold">Reschedule Reason:</span>{" "}
                    {interview.rescheduleReason}
                  </div>
                )}

                {interview.status === "Completed" && (
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-[#E7F9EE] px-4 py-3 text-sm text-[#0A9345]">
                    <div>
                      <span className="font-semibold">Outcome:</span>{" "}
                      {interview.outcome || "On Hold"}
                      {interview.completedDate && (
                        <span className="ml-3 text-gray-600">
                          Completed on {interview.completedDate}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedInterview(interview);
                        setIsViewFeedbackModalOpen(true);
                      }}
                      className="text-sm font-semibold text-[#0A9345] hover:underline"
                    >
                      View Feedback
                    </button>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <button className="inline-flex items-center gap-2 rounded-lg border border-[#D6DAE6] bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                      <Mail className="h-4 w-4 text-[#5B6271]" />
                      Email
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-lg border border-[#D6DAE6] bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                      <Phone className="h-4 w-4 text-[#5B6271]" />
                      Call
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 md:ml-auto">
                    {interview.status === "Scheduled" && showJoinMeeting && (
                      <button
                        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm"
                        style={{
                          background: "linear-gradient(90deg, #16C960 0%, #0FA44B 100%)"
                        }}
                      >
                        <Video className="h-4 w-4 text-white" />
                        Join Meeting
                      </button>
                    )}

                    {showRescheduleButton && (
                      <button
                        onClick={() => {
                          setSelectedInterview(interview);
                          setIsRescheduleModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm"
                        style={{
                          background: "linear-gradient(90deg, #2590FB 0%, #0478EB 100%)"
                        }}
                      >
                        <Calendar className="h-4 w-4 text-white" />
                        Reschedule
                      </button>
                    )}

                    {interview.status === "Completed" && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedInterview(interview);
                            setIsFeedbackModalOpen(true);
                          }}
                          className="inline-flex items-center gap-2 rounded-lg border border-[#1484F3] bg-white px-4 py-2 text-sm font-medium text-[#1484F3] hover:bg-blue-50"
                        >
                          <Edit3 className="h-4 w-4" />
                          Edit Feedback
                        </button>
                        <button
                          onClick={() => {
                            setSelectedInterview(interview);
                            setIsNextRoundModalOpen(true);
                          }}
                          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm"
                          style={{
                            background: "linear-gradient(90deg, #2590FB 0%, #0478EB 100%)"
                          }}
                        >
                          Next Round
                          <ArrowRight className="h-4 w-4 text-white" />
                        </button>
                      </>
                    )}

                    {showCancelButton && (
                      <button
                        className="inline-flex items-center gap-2 rounded-lg border border-[#EF4444] bg-white px-4 py-2 text-sm font-medium text-[#EF4444] hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {pageSlice.length > 0 && (
        <nav className="flex items-center justify-center space-x-2 mt-6" aria-label="Pagination">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
          >
            &lt;
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1 text-sm rounded ${
                p === pageSafe ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
          >
            &gt;
          </button>
        </nav>
      )}
      
      {selectedInterview && (
        <>
          <ProceedToNextRoundModal
            isOpen={isNextRoundModalOpen}
            onClose={() => {
              setIsNextRoundModalOpen(false);
              setSelectedInterview(null);
            }}
            candidateName={selectedInterview.candidateName}
            currentRound={selectedInterview.interviewRound}
            onSchedule={(data) => {
              console.log('Next round scheduled:', data);
              setIsNextRoundModalOpen(false);
              setSelectedInterview(null);
            }}
          />

          <InterviewFeedbackModal
            isOpen={isFeedbackModalOpen}
            onClose={() => {
              setIsFeedbackModalOpen(false);
              setSelectedInterview(null);
            }}
            candidateName={selectedInterview.candidateName}
            round={selectedInterview.interviewRound}
            onSave={(feedback) => {
              console.log('Feedback saved:', feedback);
            }}
          />

          <ViewFeedbackModal
            isOpen={isViewFeedbackModalOpen}
            onClose={() => {
              setIsViewFeedbackModalOpen(false);
              setSelectedInterview(null);
            }}
            candidateName={selectedInterview.candidateName}
            round={selectedInterview.interviewRound}
            feedback="Sample feedback for this interview. The candidate performed well in technical aspects."
          />

          <ScheduleInterviewModal
            isOpen={isRescheduleModalOpen}
            onClose={() => {
              setIsRescheduleModalOpen(false);
              setSelectedInterview(null);
            }}
            candidateName={selectedInterview.candidateName}
            companyName="Infosys"
            jobTitle={selectedInterview.jobTitle}
            isReschedule={true}
            existingData={{
              title: `${selectedInterview.jobTitle} Interview`,
              interviewRound: selectedInterview.interviewRound,
              interviewType: selectedInterview.interviewType,
              interviewMode: selectedInterview.interviewMode || 'Google Meet',
              videoCallLink: selectedInterview.videoCallLink || '',
              date: selectedInterview.date,
              time: selectedInterview.time,
              duration: selectedInterview.duration || '2 hours'
            }}
            onSchedule={(data) => {
              console.log('Interview rescheduled:', data);
              setIsRescheduleModalOpen(false);
              setSelectedInterview(null);
            }}
          />
        </>
      )}
    </div>
  );
};

export default InterviewsSection;
