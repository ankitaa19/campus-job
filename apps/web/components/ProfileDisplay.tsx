import React from 'react';
import { StudentProfile, CollegeProfile, RecruiterProfile } from '../types/profiles';

interface ProfileDisplayProps {
  profile: StudentProfile | CollegeProfile | RecruiterProfile;
  type: 'student' | 'college' | 'recruiter';
  isOwnProfile?: boolean;
  onEdit?: () => void;
  onContact?: () => void;
}

const ProfileDisplay: React.FC<ProfileDisplayProps> = ({ 
  profile, 
  type, 
  isOwnProfile = false, 
  onEdit, 
  onContact 
}) => {
  const renderStudentProfile = (student: StudentProfile) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {student.firstName?.[0]}{student.lastName?.[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {student.firstName} {student.lastName}
              </h1>
              <p className="text-gray-600">{student.email}</p>
              {student.phoneNumber && (
                <p className="text-gray-600">{student.phoneNumber}</p>
              )}
            </div>
          </div>
          <div className="flex space-x-3">
            {!isOwnProfile && onContact && (
              <button
                onClick={onContact}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Contact
              </button>
            )}
            {isOwnProfile && onEdit && (
              <button
                onClick={onEdit}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
        
        {/* Bio */}
        {student.bio && (
          <div className="mt-4">
            <p className="text-gray-700">{student.bio}</p>
          </div>
        )}
        
        {/* Social Links */}
        <div className="mt-4 flex space-x-4">
          {student.linkedinUrl && (
            <a
              href={student.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              LinkedIn
            </a>
          )}
          {student.githubUrl && (
            <a
              href={student.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-800"
            >
              GitHub
            </a>
          )}
          {student.portfolioUrl && (
            <a
              href={student.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-800"
            >
              Portfolio
            </a>
          )}
        </div>
      </div>

      {/* Education */}
      {student.education && student.education.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Education</h2>
          <div className="space-y-4">
            {student.education.map((edu, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-900">{edu.degree} in {edu.field}</h3>
                <p className="text-gray-600">{edu.institution || edu.college}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  {edu.year && <span>{edu.year}</span>}
                  {edu.cgpa && <span>CGPA: {edu.cgpa}</span>}
                  {edu.percentage && <span>Percentage: {edu.percentage}%</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {student.experience && student.experience.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Experience</h2>
          <div className="space-y-4">
            {student.experience.map((exp, index) => (
              <div key={index} className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-gray-900">{exp.title || exp.position}</h3>
                <p className="text-gray-600">{exp.company}</p>
                {exp.location && <p className="text-sm text-gray-500">{exp.location}</p>}
                <p className="text-sm text-gray-500">
                  {exp.startDate} - {exp.isCurrentJob ? 'Present' : exp.endDate}
                </p>
                {exp.description && (
                  <p className="text-gray-700 mt-2">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {student.skills && student.skills.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {student.skills.map((skill, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
              >
                {typeof skill === 'string' ? skill : skill.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {student.projects && student.projects.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Projects</h2>
          <div className="space-y-4">
            {student.projects.map((project, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900">{project.name || project.title}</h3>
                {project.description && (
                  <p className="text-gray-600 mt-2">{project.description}</p>
                )}
                {project.technologies && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {project.technologies.map((tech, techIndex) => (
                      <span key={techIndex} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                  >
                    View Project →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderCollegeProfile = (college: CollegeProfile) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            {college.logo ? (
              <img src={college.logo} alt={college.name} className="w-16 h-16 rounded-lg object-cover" />
            ) : (
              <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                {college.name?.[0]}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {college.name || college.collegeInfo?.name}
              </h1>
              <p className="text-gray-600">{college.email}</p>
              {college.website && (
                <a 
                  href={college.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  {college.website}
                </a>
              )}
            </div>
          </div>
          <div className="flex space-x-3">
            {!isOwnProfile && onContact && (
              <button
                onClick={onContact}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Contact College
              </button>
            )}
            {isOwnProfile && onEdit && (
              <button
                onClick={onEdit}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
        
        {/* Description */}
        {(college.description || college.collegeInfo?.description) && (
          <div className="mt-4">
            <p className="text-gray-700">{college.description || college.collegeInfo?.description}</p>
          </div>
        )}
      </div>

      {/* Statistics */}
      {college.stats && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">College Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{college.stats.totalStudents}</p>
              <p className="text-sm text-gray-600">Total Students</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{college.stats.placementRate}%</p>
              <p className="text-sm text-gray-600">Placement Rate</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{college.stats.averagePackage}L</p>
              <p className="text-sm text-gray-600">Avg Package</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{college.stats.recruitingCompanies}</p>
              <p className="text-sm text-gray-600">Recruiters</p>
            </div>
          </div>
        </div>
      )}

      {/* Programs */}
      {college.programs && college.programs.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Academic Programs</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {college.programs.map((program, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900">{program.name}</h3>
                {program.description && (
                  <p className="text-gray-600 text-sm mt-2">{program.description}</p>
                )}
                <div className="flex items-center justify-between mt-2">
                  {program.duration && (
                    <span className="text-sm text-gray-500">Duration: {program.duration}</span>
                  )}
                  {program.seats && (
                    <span className="text-sm text-gray-500">Seats: {program.seats}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderRecruiterProfile = (recruiter: RecruiterProfile) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            {recruiter.companyInfo.logo ? (
              <img src={recruiter.companyInfo.logo} alt={recruiter.companyInfo.name} className="w-16 h-16 rounded-lg object-cover" />
            ) : (
              <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                {recruiter.companyInfo.name?.[0]}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {recruiter.companyInfo.name}
              </h1>
              <p className="text-gray-600">{recruiter.companyInfo.industry}</p>
              <p className="text-sm text-gray-500">
                {recruiter.recruiterProfile.firstName} {recruiter.recruiterProfile.lastName} - {recruiter.recruiterProfile.designation}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            {!isOwnProfile && onContact && (
              <button
                onClick={onContact}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Contact Company
              </button>
            )}
            {isOwnProfile && onEdit && (
              <button
                onClick={onEdit}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
        
        {/* Company Description */}
        {recruiter.companyInfo.description && (
          <div className="mt-4">
            <p className="text-gray-700">{recruiter.companyInfo.description}</p>
          </div>
        )}
      </div>

      {/* Company Stats */}
      {recruiter.stats && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Company Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{recruiter.stats.activeJobs}</p>
              <p className="text-sm text-gray-600">Active Jobs</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{recruiter.stats.totalApplications}</p>
              <p className="text-sm text-gray-600">Applications</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{recruiter.stats.selectedCandidates}</p>
              <p className="text-sm text-gray-600">Selected</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{recruiter.stats.companyProfileCompleteness}%</p>
              <p className="text-sm text-gray-600">Profile Complete</p>
            </div>
          </div>
        </div>
      )}

      {/* Company Details */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Company Details</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Industry</h3>
            <p className="text-gray-600">{recruiter.companyInfo.industry}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Company Size</h3>
            <p className="text-gray-600 capitalize">{recruiter.companyInfo.size}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Founded</h3>
            <p className="text-gray-600">{recruiter.companyInfo.foundedYear || 'Not specified'}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Headquarters</h3>
            <p className="text-gray-600">
              {recruiter.companyInfo.headquarters.city}, {recruiter.companyInfo.headquarters.state}
            </p>
          </div>
          {recruiter.companyInfo.website && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Website</h3>
              <a 
                href={recruiter.companyInfo.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                {recruiter.companyInfo.website}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {type === 'student' && renderStudentProfile(profile as StudentProfile)}
      {type === 'college' && renderCollegeProfile(profile as CollegeProfile)}
      {type === 'recruiter' && renderRecruiterProfile(profile as RecruiterProfile)}
    </div>
  );
};

export default ProfileDisplay;
