import React from 'react';
import { X, MessageCircle } from 'lucide-react';

interface ViewFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName?: string;
  round?: string;
  feedback: string;
}

const ViewFeedbackModal: React.FC<ViewFeedbackModalProps> = ({
  isOpen,
  onClose,
  candidateName = 'Candidate',
  round = 'Round 1',
  feedback
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="relative w-full max-w-3xl rounded-xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between p-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Feedback</h2>
              <p className="text-sm text-gray-500 mt-1">
                Improve your changes by following feedback
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
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#EAFFF3' }}>
                  <MessageCircle className="h-6 w-6" style={{ color: '#00A34B' }} />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {feedback || 'Lorem ipsum is a dummy or placeholder text commonly used in graphic design, publishing, and web development. Its purpose is to permit a page layout to be designed.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewFeedbackModal;
