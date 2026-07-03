import React, { useState } from 'react';
import { X, Calendar, Clock, ChevronDown } from 'lucide-react';

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  companyName?: string;
  jobTitle?: string;
  onSchedule: (interviewData: any) => void;
  isReschedule?: boolean;
  existingData?: {
    title?: string;
    interviewRound?: string;
    interviewType?: string;
    interviewMode?: string;
    videoCallLink?: string;
    date?: string;
    time?: string;
    duration?: string;
  };
}

const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  isOpen,
  onClose,
  candidateName,
  companyName = "Infosys",
  jobTitle = "Software Engineer",
  onSchedule,
  isReschedule = false,
  existingData
}) => {
  const [title, setTitle] = useState(existingData?.title || `${jobTitle} Interview`);
  const [interviewRound, setInterviewRound] = useState(existingData?.interviewRound || 'Round 1');
  const [interviewType, setInterviewType] = useState(existingData?.interviewType || 'Online');
  const [interviewMode, setInterviewMode] = useState(existingData?.interviewMode || 'Google Meet');
  const [videoCallLink, setVideoCallLink] = useState(existingData?.videoCallLink || '');
  const [date, setDate] = useState(existingData?.date || '');
  const [time, setTime] = useState(existingData?.time || '');
  const [duration, setDuration] = useState(existingData?.duration || '2 hours');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const modalTitle = isReschedule ? 'Reschedule Interview' : 'Schedule Interview';
  const buttonText = isReschedule ? 'Save Changes' : 'Schedule Interview';

  if (!isOpen) return null;

  const handleSchedule = () => {
    // Validation: Check if all required fields are filled
    if (!date || !time) {
      alert('Please fill in all required fields: Date and Time');
      return;
    }

    if (interviewType === 'Online' && !videoCallLink) {
      alert('Please provide a video call link for online interviews');
      return;
    }

    if (interviewType === 'Offline' && !location) {
      alert('Please provide a location for offline interviews');
      return;
    }

    const interviewData = {
      title,
      interviewRound,
      interviewType,
      interviewMode: interviewType === 'Online' ? interviewMode : undefined,
      videoCallLink: interviewType === 'Online' ? videoCallLink : undefined,
      location: interviewType === 'Offline' ? location : undefined,
      date,
      time,
      duration,
      notes,
      candidateName,
      companyName,
      jobTitle
    };
    
    onSchedule(interviewData);
    onClose();
  };

  const handleCancel = () => {
    // Reset form
    setInterviewRound('Round 1');
    setInterviewType('Online');
    setInterviewMode('Google Meet');
    setVideoCallLink('');
    setDate('');
    setTime('');
    setDuration('2 hours');
    setLocation('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between p-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-gray-700" />
                <h2 className="text-xl font-semibold text-gray-900">{modalTitle}</h2>
              </div>
              <p className="text-sm text-gray-500">
                {isReschedule ? `Reschedule an interview with ${candidateName}` : `Schedule an interview with ${candidateName}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="border-t border-gray-200"></div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* To Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To:</label>
              <div className="rounded-lg bg-purple-50 px-4 py-2.5 text-sm font-medium text-purple-700">
                {candidateName}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Add Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a title"
                className="w-full px-4 py-2.5 rounded-lg text-sm bg-gray-50 text-gray-700 border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Interview Type and Mode Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interview Type</label>
                <div className="relative">
                  <select
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value)}
                    className="w-full appearance-none px-4 py-2.5 rounded-lg text-sm bg-gray-50 text-gray-700 border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interview Mode</label>
                <div className="relative">
                  <select
                    value={interviewMode}
                    onChange={(e) => setInterviewMode(e.target.value)}
                    className="w-full appearance-none px-4 py-2.5 rounded-lg text-sm bg-gray-50 text-gray-700 border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Google Meet">Google Meet</option>
                    <option value="Zoom">Zoom</option>
                    <option value="Microsoft Teams">Microsoft Teams</option>
                    <option value="Phone Call">Phone Call</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Share Video Call Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share Video Call Link
              </label>
              <input
                type="url"
                value={videoCallLink}
                onChange={(e) => setVideoCallLink(e.target.value)}
                placeholder="e.g., http://meet.google.com/dwr-dwr-thr"
                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Date and Time Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="dd/mm/yyyy"
                    className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border-none rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="--:-- --"
                    className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border-none rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Duration and Interview Round Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                <div className="relative">
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full appearance-none px-4 py-2.5 rounded-lg text-sm bg-gray-50 text-gray-700 border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="30 minutes">30 minutes</option>
                    <option value="1 hour">1 hour</option>
                    <option value="2 hours">2 hours</option>
                    <option value="3 hours">3 hours</option>
                    <option value="Half day">Half day</option>
                    <option value="Full day">Full day</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interview Round</label>
                <div className="relative">
                  <select
                    value={interviewRound}
                    onChange={(e) => setInterviewRound(e.target.value)}
                    className="w-full appearance-none px-4 py-2.5 rounded-lg text-sm bg-gray-50 text-gray-700 border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Round 1">Round 1</option>
                    <option value="Round 2">Round 2</option>
                    <option value="Round 3">Round 3</option>
                    <option value="Round 4">Round 4</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200"></div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6">
            <button
              onClick={handleCancel}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSchedule}
              className="px-6 py-2.5 text-sm font-medium text-white rounded-lg transition-colors"
              style={{ background: 'linear-gradient(90deg, #2590FB 0%, #0478EB 100%)' }}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleInterviewModal;
