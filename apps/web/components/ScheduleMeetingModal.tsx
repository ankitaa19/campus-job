import React, { useState } from 'react';
import { X, Calendar, Clock, ChevronDown } from 'lucide-react';

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  onSchedule: (data: {
    name: string;
    email: string;
    phone: string;
    date: string;
    startTime: string;
    duration: string;
    meetingLink: string;
  }) => void;
}

const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({
  isOpen,
  onClose,
  leadName,
  leadEmail,
  leadPhone,
  onSchedule
}) => {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('30 mins');
  const [meetingLink, setMeetingLink] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!date || !startTime || !meetingLink) {
      alert('Please fill in all required fields');
      return;
    }

    onSchedule({
      name: leadName,
      email: leadEmail,
      phone: leadPhone,
      date,
      startTime,
      duration,
      meetingLink
    });

    // Reset form
    setDate('');
    setStartTime('');
    setDuration('30 mins');
    setMeetingLink('');
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
          <div className="flex items-start justify-between p-6 border-b border-gray-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-gray-700" />
                <h2 className="text-xl font-semibold text-gray-900">Schedule Meet</h2>
              </div>
              <p className="text-sm text-gray-500">
                Schedule a meeting with lead for admission enquiry.
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Banner */}
          <div className="px-6 pt-6">
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 border border-blue-200">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-blue-900">When would you like to schedule the meet?</p>
                <p className="text-xs text-blue-700">Choose the date, time and duration for the meet with lead.</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Name and Email Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={leadName}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-lg text-sm bg-gray-50 text-gray-600 border-none cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={leadEmail}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-lg text-sm bg-gray-50 text-gray-600 border-none cursor-not-allowed"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={leadPhone}
                readOnly
                className="w-full px-4 py-2.5 rounded-lg text-sm bg-gray-50 text-gray-600 border-none cursor-not-allowed"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="dd-mm-yyyy"
                  className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border-none rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Start Time and Duration Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                <div className="relative">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="--:--"
                    className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border-none rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                <div className="relative">
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full appearance-none px-4 py-2.5 rounded-lg text-sm bg-gray-50 text-gray-700 border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="30 mins">30 mins</option>
                    <option value="45 mins">45 mins</option>
                    <option value="1 hour">1 hour</option>
                    <option value="1.5 hours">1.5 hours</option>
                    <option value="2 hours">2 hours</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Meeting Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Link</label>
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="http://meet.google.com/jnc-ussefgsr-tksqvbs"
                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
              Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleMeetingModal;
