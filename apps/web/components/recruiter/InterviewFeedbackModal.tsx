import React, { useState } from 'react';
import { X } from 'lucide-react';

interface InterviewFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  round: string;
  onSave: (feedback: string) => void;
}

const InterviewFeedbackModal: React.FC<InterviewFeedbackModalProps> = ({
  isOpen,
  onClose,
  candidateName,
  round,
  onSave
}) => {
  const [feedback, setFeedback] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSave(feedback);
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
              <h2 className="text-xl font-semibold text-gray-900">Interview Feedback</h2>
              <p className="text-sm text-gray-500 mt-1">
                Provide feedback for {candidateName} {round} interview
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
          <div className="p-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Detailed Feedback
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Add feedback note"
                rows={8}
                className="w-full px-4 py-3 border-none rounded-2xl text-sm resize-none focus:outline-none focus:ring-0 placeholder-[#717182]"
                style={{ 
                  backgroundColor: '#F1E3DC',
                  color: '#000000'
                }}
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
              Save Feedback
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewFeedbackModal;
