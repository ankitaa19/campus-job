import React, { useState } from 'react';
import { X, Upload, ChevronDown } from 'lucide-react';

export interface AssignmentData {
  candidateId?: string;
  candidateName: string;
  candidateEmail?: string;
  college?: string;
  note: string;
  deadline: string;
  assignmentFile?: {
    name: string;
    size: number;
    url?: string;
  };
}

interface SendAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  candidateId?: string;
  candidateEmail?: string;
  college?: string;
  onSend?: (data: AssignmentData) => void;
}

const SendAssignmentModal: React.FC<SendAssignmentModalProps> = ({
  isOpen,
  onClose,
  candidateName,
  candidateId,
  candidateEmail,
  college,
  onSend
}) => {
  const [note, setNote] = useState('Thank you for your interest lorem ipsum lorem demo assignment text dummy');
  const [deadline, setDeadline] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const maxChars = 250;

  if (!isOpen) return null;

  const handleSendAssignment = () => {
    // Construct assignment data
    const assignmentData: AssignmentData = {
      candidateId,
      candidateName,
      candidateEmail,
      college,
      note,
      deadline,
      assignmentFile: uploadedFile ? {
        name: uploadedFile.name,
        size: uploadedFile.size,
        url: undefined // In real app, you'd upload file and get URL
      } : undefined
    };

    console.log('Sending assignment to:', candidateName);
    console.log('Assignment data:', assignmentData);
    
    onSend?.(assignmentData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Send Assignment</h2>
            <button 
              onClick={onClose}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Info Note */}
            <div className="rounded-md bg-purple-50 p-4">
              <p className="text-sm text-purple-700">
                <span className="font-medium">Note:</span> Assignment must be fair and relevant to the role. Students must be complete the given task and submit an respective time.
              </p>
            </div>

            {/* To Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To:
              </label>
              <p className="text-sm font-medium text-blue-600">{candidateName}</p>
            </div>

            {/* Document Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Document Preview
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <div className="flex flex-col items-center">
                  <div className="mb-4 p-3 bg-gray-100 rounded-full">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Document Preview</h3>
                  {uploadedFile ? (
                    <div className="mb-4">
                      <p className="text-sm text-green-600 font-medium">{uploadedFile.name}</p>
                      <p className="text-xs text-gray-500">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mb-4">Upload assignment file/pdf</p>
                  )}
                  <label className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white cursor-pointer" style={{ background: 'linear-gradient(to right, #2791FC, #0377EB)' }}>
                    <Upload className="h-4 w-4" />
                    Browse Files
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".pdf,.doc,.docx,.zip"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setUploadedFile(file);
                      }}
                    />
                  </label>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Max file size: 10MB. File type: JPEG/PDF only
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={note}
                onChange={(e) => {
                  if (e.target.value.length <= maxChars) {
                    setNote(e.target.value);
                  }
                }}
                rows={4}
                maxLength={maxChars}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                placeholder="Enter assignment description (max 250 characters)"
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-gray-500">
                  {note.length}/{maxChars} characters
                </span>
              </div>
            </div>

            {/* Submission Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Submission Deadline
              </label>
              <div className="relative">
                <select
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select date</option>
                  <option value="1-day">1 Day</option>
                  <option value="3-days">3 Days</option>
                  <option value="1-week">1 Week</option>
                  <option value="2-weeks">2 Weeks</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 p-6">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSendAssignment}
              className="rounded-md px-4 py-2 text-sm font-medium text-white"
              style={{ background: 'linear-gradient(to right, #2791FC, #0377EB)' }}
            >
              Send Assignment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendAssignmentModal;
