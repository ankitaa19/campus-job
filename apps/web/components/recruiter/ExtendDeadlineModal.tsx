import React, { useState } from 'react';
import { X, Calendar, AlertCircle } from 'lucide-react';

interface ExtendDeadlineModalProps {
  jobId: string;
  jobTitle: string;
  currentDeadline: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (jobId: string, newDeadline: string) => void;
}

const ExtendDeadlineModal: React.FC<ExtendDeadlineModalProps> = ({
  jobId,
  jobTitle,
  currentDeadline,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [newDeadline, setNewDeadline] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (newDeadline) {
      onConfirm(jobId, newDeadline);
      onClose();
    }
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Extend Deadline</h2>
                <p className="mt-1 text-sm text-gray-600">{jobTitle}</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <div className="mb-6 flex items-start gap-3 rounded-lg bg-blue-50 p-4">
              <AlertCircle className="h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Extend application deadline
                </p>
                <p className="mt-1 text-sm text-blue-700">
                  The new deadline will be visible to all candidates. Active applicants will be notified of this change.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Current Deadline
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{currentDeadline}</span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  New Deadline <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    min={today}
                    className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  Select a date after today
                </p>
              </div>

              {newDeadline && (
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="text-sm font-medium text-green-900">
                    New deadline: {new Date(newDeadline).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!newDeadline}
                className="rounded-lg px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: 'linear-gradient(90deg, #2590FB 0%, #0478EB 100%)'
                }}
              >
                Extend Deadline
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtendDeadlineModal;
