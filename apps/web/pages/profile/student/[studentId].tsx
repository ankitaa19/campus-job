import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../../components/Navbar';
import { StudentProfile } from '../../../types/profiles';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
const statCardColors: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600',
  yellow: 'bg-yellow-50 text-yellow-600'
};

const StudentProfilePage = () => {
  const router = useRouter();
  const { studentId } = router.query;
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (studentId) {
      fetchStudentProfile();
    }
  }, [studentId]);

  const fetchStudentProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_BASE_URL}/api/students/${studentId}`, { headers });
      setStudent(response.data);
    } catch (error) {
      console.error('Error fetching student profile:', error);
      setError('Failed to load student profile');
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    emoji,
    label,
    value,
    trend,
    color = 'blue'
  }: {
    emoji: string;
    label: string;
    value: string | number;
    trend?: string;
    color?: keyof typeof statCardColors;
  }) => (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-xl ${statCardColors[color] ?? statCardColors.blue} group-hover:scale-110 transition-transform duration-300`}>
            <span className="text-2xl">{emoji}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
        {trend && (
          <div className="text-right">
            <span className="text-sm text-green-600 font-medium">{trend}</span>
          </div>
        )}
      </div>
    </div>
  );

  const TabButton = ({
    id,
    label,
    isActive,
    onClick
  }: {
    id: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`relative px-6 py-3 rounded-full font-medium transition-all duration-300 ${
        isActive
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:-translate-y-0.5'
      }`}
    >
      {label}
      {isActive && (
        <span className="absolute left-1/2 -bottom-1 h-1 w-1/2 -translate-x-1/2 rounded-full bg-blue-300" />
      )}
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-lg text-gray-600">Loading student profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="mb-4 text-red-500 text-6xl">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
              <p className="text-gray-600 mb-6">{error || 'The student profile you are looking for does not exist.'}</p>
              <button
                onClick={() => router.back()}
                className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-green-900 via-green-800 to-teal-900 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/30 to-teal-600/30"></div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-green-300/20 rounded-full animate-bounce delay-300"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-teal-300/20 rounded-full animate-pulse delay-700"></div>
        </div>

     <div className="relative container mx-auto px-4 py-16 fade-in-up">
          <div className="flex flex-col lg:flex-row items-center space-y-8 lg:space-y-0 lg:space-x-12">
            {/* Student Profile Picture */}
            <div className="flex-shrink-0">
              <div className="relative group">
                <div className="w-40 h-40 rounded-3xl bg-white p-4 shadow-2xl group-hover:scale-105 transition-transform duration-300">
                  {student.profilePicture ? (
                    <img
                      src={student.profilePicture}
                      alt={`${student.firstName} ${student.lastName}`}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-green-100 to-teal-100 rounded-2xl flex items-center justify-center">
                      <span className="text-4xl font-bold text-green-600">
                        {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Status Badge */}
                <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-2 shadow-lg">
                  <span className="text-white text-sm">👨‍🎓</span>
                </div>
              </div>
            </div>

            {/* Student Information */}
            <div className="flex-1 text-center lg:text-left">
              <div className="space-y-4">
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2 leading-tight">
                    {student.firstName} {student.lastName}
                  </h1>
                  <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-4">
                    <span className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                      Student
                    </span>
                    {student.currentSemester && (
                      <span className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                        Semester {student.currentSemester}
                      </span>
                    )}
                    {student.graduationYear && (
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                        Class of {student.graduationYear}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-white/90">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🏫</span>
                    <span className="text-sm font-medium">
                      {typeof student.collegeId === 'object' && student.collegeId?.name 
                        ? student.collegeId.name 
                        : 'College Name'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">📧</span>
                    <span className="text-sm font-medium">{student.email}</span>
                  </div>
                  {student.linkedinUrl && (
                    <a
                      href={student.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 hover:text-white transition-colors"
                    >
                      <span className="text-lg">💼</span>
                      <span className="text-sm font-medium">LinkedIn</span>
                    </a>
                  )}
                </div>

                {student.bio && (
                  <p className="text-lg text-white/90 leading-relaxed max-w-2xl">
                    {student.bio}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="relative container mx-auto px-4 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 fade-in-up">
            <StatCard
              emoji="🎓"
              label="Experience"
              value={student.profile?.experience?.length || 0}
            />
            <StatCard
              emoji="💼"
              label="Projects"
              value={student.profile?.projects?.length || 0}
            />
            <StatCard
              emoji="🏆"
              label="Skills"
              value={student.profile?.skills?.length || 0}
            />
            <StatCard
              emoji="⭐"
              label="Status"
              value={student.isVerified ? "Verified" : "Pending"}
            />
          </div>
        </div>
      </div>

      {/* Tabbed Content */}
      <div className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <TabButton 
                id="overview"
                label="Overview" 
                isActive={activeTab === 'overview'} 
                onClick={() => setActiveTab('overview')} 
              />
              <TabButton 
                id="education"
                label="Education" 
                isActive={activeTab === 'education'} 
                onClick={() => setActiveTab('education')} 
              />
              <TabButton 
                id="experience"
                label="Experience" 
                isActive={activeTab === 'experience'} 
                onClick={() => setActiveTab('experience')} 
              />
              <TabButton 
                id="projects"
                label="Projects" 
                isActive={activeTab === 'projects'} 
                onClick={() => setActiveTab('projects')} 
              />
              <TabButton 
                id="skills"
                label="Skills & Links" 
                isActive={activeTab === 'skills'} 
                onClick={() => setActiveTab('skills')} 
              />
            </nav>
          </div>

          <div className="py-8">
            {activeTab === 'overview' && (
              <div className="space-y-6 fade-in-up">
                {student.profile?.bio ? (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
                    <p className="text-gray-600 leading-relaxed">{student.profile.bio}</p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
                    <p className="text-gray-500 italic">No bio available</p>
                  </div>
                )}

                {student.collegeId && typeof student.collegeId === 'object' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">College Information</h3>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <p className="font-medium text-gray-900">{student.collegeId.name}</p>
                      {student.collegeId.address && (
                        <p className="text-sm text-gray-600 mt-1">
                          {student.collegeId.address.city}, {student.collegeId.address.state}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Since</h3>
                  <p className="text-gray-600">
                    {new Date(student.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'education' && (
              <div className="fade-in-up">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Education History</h3>
                {student.profile?.education && student.profile.education.length > 0 ? (
                  <div className="space-y-6">
                    {student.profile.education.map((edu: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-6 border-l-4 border-blue-500">
                        <h4 className="font-semibold text-gray-900 text-lg">{edu.degree || edu.course}</h4>
                        <p className="text-gray-700 font-medium">{edu.institution || edu.college}</p>
                        <div className="flex items-center space-x-6 mt-2 text-sm text-gray-600">
                          {edu.year && <span className="font-medium">Year: {edu.year}</span>}
                          {edu.cgpa && <span className="font-medium">CGPA: {edu.cgpa}</span>}
                          {edu.percentage && <span className="font-medium">Percentage: {edu.percentage}%</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🎓</div>
                    <p className="text-gray-500">No education information available</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'experience' && (
              <div className="fade-in-up">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Work Experience</h3>
                {student.profile?.experience && student.profile.experience.length > 0 ? (
                  <div className="space-y-6">
                    {student.profile.experience.map((exp: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-6 border-l-4 border-green-500">
                        <h4 className="font-semibold text-gray-900 text-lg">{exp.position || exp.title}</h4>
                        <p className="text-gray-700 font-medium">{exp.company}</p>
                        <p className="text-sm text-gray-600 mt-1">{exp.duration || `${exp.startDate} - ${exp.endDate}`}</p>
                        {exp.description && (
                          <p className="text-gray-600 mt-3 leading-relaxed">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">💼</div>
                    <p className="text-gray-500">No work experience available</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="fade-in-up">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Projects Portfolio</h3>
                {student.profile?.projects && student.profile.projects.length > 0 ? (
                  <div className="grid gap-6">
                    {student.profile.projects.map((project: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                        <h4 className="font-semibold text-gray-900 text-lg mb-2">{project.title || project.name}</h4>
                        {project.description && (
                          <p className="text-gray-600 mb-4 leading-relaxed">{project.description}</p>
                        )}
                        {project.technologies && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {project.technologies.map((tech: string, techIndex: number) => (
                              <span key={techIndex} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
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
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Project
                            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">💻</div>
                    <p className="text-gray-500">No projects available</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="space-y-8 fade-in-up">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Technical Skills</h3>
                  {student.profile?.skills && student.profile.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {student.profile.skills.map((skill: string, index: number) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No skills listed</p>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Links & Resources</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {student.profile?.linkedinUrl && (
                      <a
                        href={student.profile.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-2xl">💼</span>
                        <div>
                          <p className="font-medium text-gray-900">LinkedIn Profile</p>
                          <p className="text-sm text-gray-600">Professional Network</p>
                        </div>
                      </a>
                    )}
                    {student.profile?.githubUrl && (
                      <a
                        href={student.profile.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-2xl">💻</span>
                        <div>
                          <p className="font-medium text-gray-900">GitHub Profile</p>
                          <p className="text-sm text-gray-600">Code Repository</p>
                        </div>
                      </a>
                    )}
                    {student.profile?.portfolioUrl && (
                      <a
                        href={student.profile.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-2xl">🌐</span>
                        <div>
                          <p className="font-medium text-gray-900">Portfolio Website</p>
                          <p className="text-sm text-gray-600">Personal Showcase</p>
                        </div>
                      </a>
                    )}
                    {student.resume && (
                      <a
                        href={`${API_BASE_URL}/uploads/resumes/${student.resume.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-2xl">📄</span>
                        <div>
                          <p className="font-medium text-gray-900">Resume</p>
                          <p className="text-sm text-gray-600">Download PDF</p>
                        </div>
                      </a>
                    )}
                  </div>
                </div>

                {student.profile?.achievements && student.profile.achievements.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Achievements & Awards</h3>
                    <div className="space-y-3">
                      {student.profile.achievements.map((achievement: string, index: number) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                          <span className="text-yellow-500 text-xl">🏆</span>
                          <p className="text-gray-700">{achievement}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="bg-gray-50 border-t">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
            
            <div className="flex space-x-3">
              <a
                href={`mailto:${student.email}`}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Send Email
              </a>
              {student.phoneNumber && (
                <a
                  href={`tel:${student.phoneNumber}`}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Call
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  }

export default StudentProfilePage;
