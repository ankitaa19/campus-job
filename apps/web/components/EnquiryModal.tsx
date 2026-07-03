import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Course-Stream Mapping
const COURSE_STREAM_MAPPING: { [key: string]: string[] } = {
  'B.Tech': ['Computer Science Engineering', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering'],
  'M.Tech': ['Computer Science Engineering', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering'],
  'MBA': ['Finance', 'Marketing', 'Human Resources', 'Operations Management', 'International Business', 'Information Technology'],
  'BBA': ['Finance', 'Marketing', 'Human Resources', 'Operations Management', 'International Business', 'Information Technology'],
  'MCA': ['Software Engineering', 'Data Science', 'Cyber Security', 'Cloud Computing', 'AI & ML', 'Mobile Application Development'],
  'BCA': ['Software Engineering', 'Data Science', 'Cyber Security', 'Cloud Computing', 'AI & ML', 'Web Development'],
  'B.Sc': ['Computer Science', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Biotechnology'],
  'M.Sc': ['Computer Science', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Biotechnology'],
  'B.Com': ['Accounting', 'Finance', 'Banking', 'Taxation', 'E-Commerce', 'Business Management'],
  'M.Com': ['Accounting', 'Finance', 'Banking', 'Taxation', 'E-Commerce', 'Business Management'],
  'BA': ['English', 'History', 'Political Science', 'Economics', 'Psychology', 'Sociology'],
  'MA': ['English', 'History', 'Political Science', 'Economics', 'Psychology', 'Sociology'],
};

interface Course {
  _id?: string;
  name: string;
  type?: string;
  streamType?: string;
}

interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  collegeId: string;
  courses: Course[];
}

export default function EnquiryModal({ isOpen, onClose, collegeId, courses }: EnquiryModalProps) {
  const [enquiryForm, setEnquiryForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    courseType: ''
  });
  const [enquirySubmitting, setEnquirySubmitting] = useState(false);
  const [enquirySuccess, setEnquirySuccess] = useState(false);

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnquirySubmitting(true);

    try {
      // Parse the selected course (format: "courseName - streamType")
      const [courseName, streamType] = enquiryForm.courseType.split(' - ');
      
      // Find the selected course by matching both name and stream
      const selectedCourse = courses.find(c => 
        c.name === courseName && c.streamType === streamType
      );
      
      const response = await axios.post(`${API_BASE_URL}/api/admission-enquiries/public`, {
        collegeId: collegeId,
        courseId: selectedCourse?._id || null,
        studentName: enquiryForm.fullName,
        email: enquiryForm.email,
        phone: enquiryForm.phone,
        courseType: courseName,
        stream: streamType,
        source: 'website'
      });

      if (response.data.success) {
        setEnquirySuccess(true);
        setTimeout(() => {
          onClose();
          setEnquirySuccess(false);
          setEnquiryForm({ fullName: '', email: '', phone: '', courseType: '' });
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error submitting enquiry:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit enquiry. Please try again.';
      alert(errorMessage);
    } finally {
      setEnquirySubmitting(false);
    }
  };

  const handleClose = () => {
    setEnquiryForm({ fullName: '', email: '', phone: '', courseType: '' });
    setEnquirySuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-8 py-6 flex items-center justify-between z-10">
          <h2 className="text-3xl font-bold text-gray-900">Get In Touch With College</h2>
          <button 
            onClick={handleClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleEnquirySubmit} className="p-8">
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Full Name */}
            <div>
              <label className="block text-base font-semibold text-gray-900 mb-2">
                Full Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Please enter your name"
                value={enquiryForm.fullName}
                onChange={(e) => setEnquiryForm({ ...enquiryForm, fullName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-base font-semibold text-gray-900 mb-2">
                Phone Number<span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="Please enter your number"
                value={enquiryForm.phone}
                onChange={(e) => setEnquiryForm({ ...enquiryForm, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Email ID */}
            <div>
              <label className="block text-base font-semibold text-gray-900 mb-2">
                Email ID<span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="Please enter your email"
                value={enquiryForm.email}
                onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Select Course */}
            <div>
              <label className="block text-base font-semibold text-gray-900 mb-2">
                Select Course<span className="text-red-500">*</span>
              </label>
              <select
                required
                value={enquiryForm.courseType}
                onChange={(e) => setEnquiryForm({ ...enquiryForm, courseType: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
              >
                <option value="">Select course</option>
                {courses && courses.map((course, index) => {
                  // Create combined display name: "CourseName - StreamType"
                  const displayName = course.streamType 
                    ? `${course.name} - ${course.streamType}`
                    : course.name;
                  
                  return (
                    <option key={course._id || index} value={displayName}>
                      {displayName}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8">
            <button
              type="submit"
              disabled={enquirySubmitting}
              className="w-full py-4 rounded-lg bg-gradient-to-r from-[#2791FC] to-[#0377EB] hover:from-[#2791FC]/90 hover:to-[#0377EB]/90 text-white font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enquirySubmitting ? 'Submitting...' : enquirySuccess ? '✓ Enquiry Submitted!' : 'Enquire Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
