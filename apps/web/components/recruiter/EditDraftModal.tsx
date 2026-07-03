import React, { useState } from 'react';
import { X, Calendar, MapPin, Briefcase, Users } from 'lucide-react';

interface EditDraftModalProps {
  jobId: string;
  jobTitle: string;
  jobType: string;
  currentStartDate: string;
  currentDuration: string;
  currentWorkMode: string;
  currentStipend: string;
  currentNumberOfOpenings: number;
  isOpen: boolean;
  onClose: () => void;
  onSave: (jobId: string, updates: {
    startDate?: string;
    duration?: string;
    workMode?: string;
    stipend?: string;
    numberOfOpenings?: number;
  }) => void;
}

const EditDraftModal: React.FC<EditDraftModalProps> = ({
  jobId,
  jobTitle,
  jobType,
  currentStartDate,
  currentDuration,
  currentWorkMode,
  currentStipend,
  currentNumberOfOpenings,
  isOpen,
  onClose,
  onSave,
}) => {
  const [startDate, setStartDate] = useState(currentStartDate);
  const [duration, setDuration] = useState(currentDuration);
  const [workMode, setWorkMode] = useState(currentWorkMode);
  const [stipend, setStipend] = useState(currentStipend);
  const [numberOfOpenings, setNumberOfOpenings] = useState(currentNumberOfOpenings);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(jobId, {
      startDate,
      duration,
      workMode,
      stipend,
      numberOfOpenings,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Edit Draft Job</h2>
            <p className="text-sm text-gray-600 mt-1">{jobTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-gray-500" />
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              {jobType}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-2" />
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration
            </label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g., 3 months, 6 months"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline h-4 w-4 mr-2" />
              Work Mode
            </label>
            <select
              value={workMode}
              onChange={(e) => setWorkMode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stipend/Salary
            </label>
            <input
              type="text"
              value={stipend}
              onChange={(e) => setStipend(e.target.value)}
              placeholder="e.g., ₹10,000-15,000/month"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="inline h-4 w-4 mr-2" />
              Number of Openings
            </label>
            <input
              type="number"
              min="1"
              value={numberOfOpenings}
              onChange={(e) => setNumberOfOpenings(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditDraftModal;
