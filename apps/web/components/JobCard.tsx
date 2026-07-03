import { useState } from "react";
import { Briefcase, MapPin, Clock, IndianRupee, CheckCircle, Calendar } from "lucide-react";
import { useRouter } from "next/router";

interface Location {
  city: string;
  state: string;
  country: string;
  workMode: string;
}

interface Requirement {
  skill: string;
  level: string;
  mandatory: boolean;
}

interface Job {
  _id: string;
  title: string;
  company: string;
  locations: Array<Location>;
  description: string;
  type?: string;
  salary: string | { min: number; max: number; currency: string };
  benefits?: string[];
  experienceLevel: string;
  skills?: Requirement[]; // Optional field
  applicationDeadline: string;
  postedAt: string;
  isUrgent: boolean;
}

export default function JobCard({ job }: { job: Job }) {
  const [isModalOpen, setModalOpen] = useState(false);
  const router = useRouter();
  
  const jobLocation = job.locations?.[0];
  const formattedLocation = jobLocation 
    ? `${jobLocation.city || ''}, ${jobLocation.state || ''}, ${jobLocation.country || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',')
    : 'Location not specified';
  const isUrgent = job.isUrgent;

  const handleApplyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/jobs/${job._id}`);
  };

  const handleViewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleModal();
  };

  // Check if job.skills is defined and an array
  const renderSkills = Array.isArray(job.skills)
    ? job.skills.map((req, index) => (
        <span
          key={index}
          className={`inline-block text-xs px-2 py-1 rounded-full ${req.mandatory ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'} mr-2`}>
          {req.skill} ({req.level})
        </span>
      ))
    : null;

  const formattedPostedDate = new Date(job.postedAt).toLocaleDateString();

  // Toggle modal visibility
  const toggleModal = () => setModalOpen(!isModalOpen);

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 hover:shadow-xl transition duration-300 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">{job.title}</h3>
          <p className="text-sm text-gray-500">{job.company}</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
          {job.type || 'Full-time'}
        </span>
      </div>

      {/* Location and work mode */}
      <div className="flex items-center gap-4 text-sm text-gray-600 w-full">
        <MapPin size={16} /> {formattedLocation} 
        <span className="text-xs text-gray-500">{jobLocation?.workMode || 'On-site'}</span>
      </div>

      {/* Salary & Benefits */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <IndianRupee size={16} /> 
        <span>
          {typeof job.salary === 'object' && job.salary ? 
            `${job.salary.currency || '₹'} ${job.salary.min?.toLocaleString() || '0'} - ${job.salary.max?.toLocaleString() || '0'}` : 
            (job.salary as string) || 'Salary not disclosed'
          }
        </span>
        <span className="text-xs text-gray-500">{job.benefits?.join(", ") || 'No benefits listed'}</span>
      </div>

      {/* Posted Date & Urgency */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <Clock size={16} /> Posted {formattedPostedDate}
        {isUrgent && (
          <span className="flex items-center gap-1 text-red-500 text-sm">
            <CheckCircle size={16} /> Urgent
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-gray-700 line-clamp-3">{job.description}</p>

      {/* Skills */}
      <div className="flex flex-wrap gap-2 mt-2">
        {renderSkills}
      </div>

      {/* Application Deadline */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
        <Calendar size={16} />
        <span>Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}</span>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-2">
        <button 
          onClick={handleApplyClick}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700"
        >
          Apply Now
        </button>
        <button 
          onClick={handleViewClick} 
          className="text-sm text-gray-400 hover:text-gray-700">
          View
        </button>
      </div>

      {/* Modal for Viewing Job Details */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-3xl w-full">
            <button onClick={toggleModal} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700">
              Close
            </button>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">{job.title} - {job.company}</h2>
            <p className="text-sm text-gray-500 mb-2">Posted: {formattedPostedDate}</p>
            <p className="text-sm text-gray-500 mb-2">Location: {formattedLocation} ({jobLocation.workMode})</p>
            <p className="text-sm text-gray-500 mb-4">
              Salary: {
                typeof job.salary === 'object' && job.salary ? 
                  `${job.salary.currency} ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}` : 
                  (job.salary as string) || 'Not disclosed'
              }
            </p>
            <p className="text-gray-700 mb-4">{job.description}</p>
            <p className="font-semibold text-gray-800 mb-2">Required Skills:</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {renderSkills}
            </div>
            <p className="font-semibold text-gray-800">Benefits:</p>
            <ul className="list-disc pl-5 text-gray-700 mb-4">
              {job.benefits.map((benefit, index) => (
                <li key={index}>{benefit}</li>
              ))}
            </ul>
            <p className="text-xs text-gray-500">Application Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}
