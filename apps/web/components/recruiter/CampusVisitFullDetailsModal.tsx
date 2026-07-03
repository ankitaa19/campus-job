import React from 'react';
import { X, Mail, Phone } from 'lucide-react';

interface CampusVisitFullDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  visit: any; // Accept any data structure to handle both old and new formats
  viewType: 'invitation' | 'request'; // invitation or request
}

const CampusVisitFullDetailsModal: React.FC<CampusVisitFullDetailsModalProps> = ({
  isOpen,
  onClose,
  visit,
  viewType
}) => {
  if (!isOpen) return null;

  // Format data - handle both old dummy format and new localStorage format
  const displayDate = visit.visitDate 
    ? new Date(visit.visitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : visit.date;
  
  const displayTimeSlot = visit.timeSlot;
  const interviewMode = visit.interviewMode || visit.meetingType || 'Campus Visit';
  const jobTitle = visit.jobTitle || 'Backend Developer';
  const slots = visit.maxStudents ? `${visit.maxStudents} students maximum` : (visit.slots || '50 students maximum');
  const location = visit.location || (visit.interviewMode === 'Offline' ? visit.onCampus : null) || 'New Delhi, India';
  const meetLink = visit.meetLink || null;
  
  // Placement officer details
  const placementOfficer = visit.hrContact || {
    name: 'Dr. Rajesh Kumar',
    email: 'placement@abc.ac.in',
    phone: '+91 1011001101'
  };

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
                  <p className="text-base text-gray-700">{visit.collegeName}</p>
                </div>
                <div>
                  <p className="text-base text-gray-500">{location}</p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Drive Schedule</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="text-base text-gray-700">{displayDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time Slot</p>
                    <p className="text-base text-gray-700">{displayTimeSlot}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Interview Mode</p>
                    <p className="text-base font-medium text-gray-900">{interviewMode}</p>
                  </div>
                  {meetLink && (
                    <div>
                      <p className="text-sm text-gray-500">Meeting Link</p>
                      <a 
                        href={meetLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-base font-medium text-blue-600 hover:underline"
                      >
                        {meetLink}
                      </a>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Slots</p>
                    <p className="text-base font-medium text-gray-900">{slots}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Job Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-lg font-semibold text-gray-900">{jobTitle}</p>
                </div>
                <div>
                  <p className="text-base text-gray-500">{location}</p>
                </div>
                {visit.jobType && (
                  <div className="flex gap-4 text-base text-gray-700">
                    <span>{visit.jobType}</span>
                    {visit.salary && <span>{visit.salary}</span>}
                  </div>
                )}
              </div>

              <div className="mt-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  {viewType === 'request' ? 'Placement Officer' : 'Contact Person'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-base font-semibold text-gray-900">{placementOfficer.name}</p>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-base">{placementOfficer.email}</p>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-base">{placementOfficer.phone}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampusVisitFullDetailsModal;
