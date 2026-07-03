import React, { useState } from 'react';
import { X, Calendar, Clock, ChevronDown, CheckCircle } from 'lucide-react';

interface ProceedToNextRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  currentRound: string;
  onSchedule: (data: any) => void;
}

const ProceedToNextRoundModal: React.FC<ProceedToNextRoundModalProps> = ({
  isOpen,
  onClose,
  candidateName,
  currentRound,
  onSchedule
}) => {
  const [interviewType, setInterviewType] = useState<'Online' | 'Offline'>('Online');
  const [interviewMode, setInterviewMode] = useState('Google Meet');
  const [videoLink, setVideoLink] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('2 hours');
  const [location, setLocation] = useState('');
  const [round, setRound] = useState('1st round');

  if (!isOpen) return null;

  const handleSubmit = () => {
    const nextRoundNumber = parseInt(currentRound.replace(/\D/g, '')) + 1;
    onSchedule({
      interviewType,
      interviewMode: interviewType === 'Online' ? interviewMode : undefined,
      videoLink: interviewType === 'Online' ? videoLink : undefined,
      location: interviewType === 'Offline' ? location : undefined,
      date,
      time,
      duration,
      round: `Round ${nextRoundNumber}`
    });
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
                <h2 className="text-xl font-semibold text-gray-900">Proceed to Next Round</h2>
              </div>
              <p className="text-sm text-gray-500">Schedule round 2 for {candidateName}</p>
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
            {/* Success Banner */}
            <div className="rounded-lg p-3 flex items-center gap-2" style={{ backgroundColor: 'rgba(221, 255, 235, 0.6)', border: '1px solid #1E7948' }}>
              <CheckCircle className="h-5 w-5 flex-shrink-0" style={{ color: '#1E7948' }} />
              <span className="text-sm font-medium" style={{ color: '#1E7948' }}>Round 1 completed</span>
            </div>

            {/* Interview Type & Mode/Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Type
                </label>
                <div className="relative">
                  <select
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value as 'Online' | 'Offline')}
                    className="w-full appearance-none px-4 py-2.5 bg-gray-50 border-none rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {interviewType === 'Online' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Mode
                  </label>
                  <div className="relative">
                    <select
                      value={interviewMode}
                      onChange={(e) => setInterviewMode(e.target.value)}
                      className="w-full appearance-none px-4 py-2.5 bg-gray-50 border-none rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Google Meet">Google Meet</option>
                      <option value="Zoom">Zoom</option>
                      <option value="Microsoft Teams">Microsoft Teams</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      placeholder="dd-mm-yyyy"
                      className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-lg text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>

            {/* Video Call Link (Online only) */}
            {interviewType === 'Online' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share Video Call Link
                </label>
                <input
                  type="text"
                  value={videoLink}
                  onChange={(e) => setVideoLink(e.target.value)}
                  placeholder="e.g., http://meet.google.com/dwr-dwr-thr"
                  className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-lg text-sm text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Date & Time OR Time & Duration */}
            <div className="grid grid-cols-2 gap-4">
              {interviewType === 'Online' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      placeholder="dd-mm-yyyy"
                      className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-lg text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="--:--"
                    className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-lg text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Duration & Interview Round */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration
                </label>
                <div className="relative">
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full appearance-none px-4 py-2.5 bg-gray-50 border-none rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="30 minutes">30 minutes</option>
                    <option value="1 hour">1 hour</option>
                    <option value="1.5 hours">1.5 hours</option>
                    <option value="2 hours">2 hours</option>
                    <option value="3 hours">3 hours</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Round
                </label>
                <div className="relative">
                  <select
                    value={round}
                    onChange={(e) => setRound(e.target.value)}
                    className="w-full appearance-none px-4 py-2.5 bg-gray-50 border-none rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1st round">1st round</option>
                    <option value="2nd round">2nd round</option>
                    <option value="3rd round">3rd round</option>
                    <option value="4th round">4th round</option>
                    <option value="Final round">Final round</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Location (Offline only) */}
            {interviewType === 'Offline' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter interview location"
                  className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-lg text-sm text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          <div className="border-t border-gray-200"></div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 text-sm font-medium text-white rounded-lg transition-colors"
              style={{ background: 'linear-gradient(90deg, #2590FB 0%, #0478EB 100%)' }}
            >
              Schedule Round 2
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProceedToNextRoundModal;
