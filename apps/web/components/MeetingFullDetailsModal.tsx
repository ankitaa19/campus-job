import React from 'react';
import { X, Mail, Phone } from 'lucide-react';

interface MeetingFullDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: {
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
  };
  viewMode: 'college' | 'recruiter'; // college shows lead details, recruiter shows placement officer
}

const MeetingFullDetailsModal: React.FC<MeetingFullDetailsModalProps> = ({
  isOpen,
  onClose,
  meeting,
  viewMode
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-gray-400 transition hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Header */}
        <div className="border-b border-gray-200 px-8 py-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Campus Drive Full Details
          </h2>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Left Column */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">College</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-base text-gray-700">{meeting.leadName}</p>
                </div>
                <div>
                  <p className="text-base text-gray-500">Location details here</p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Drive Schedule</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-base text-gray-700">{meeting.date}</p>
                  </div>
                  <div>
                    <p className="text-base text-gray-700">{meeting.timeSlot}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Interview Mode</p>
                    <p className="text-base font-medium text-gray-900">{meeting.meetingType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Slots</p>
                    <p className="text-base font-medium text-gray-900">50 students maximum</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div>
              {viewMode === 'recruiter' ? (
                <>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Job Details</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">Backend Developer</p>
                    </div>
                    <div>
                      <p className="text-base text-gray-500">New Delhi, India</p>
                    </div>
                    <div className="flex gap-4 text-base text-gray-700">
                      <span>Full-Time</span>
                      <span>$8-12 LPA</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Placement Officer</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-base font-semibold text-gray-900">Dr. Rajesh Kumar</p>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <p className="text-base">placement@abc.ac.in</p>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <p className="text-base">+91 1011001101</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Lead Details</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-base font-semibold text-gray-900">{meeting.leadName}</p>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <p className="text-base">{meeting.email}</p>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <p className="text-base">{meeting.phone}</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Meeting Details</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Duration</p>
                        <p className="text-base font-medium text-gray-900">{meeting.duration}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Meeting Link</p>
                        <a 
                          href={meeting.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base text-blue-600 hover:underline"
                        >
                          {meeting.meetingLink}
                        </a>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingFullDetailsModal;
