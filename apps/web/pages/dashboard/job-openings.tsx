import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Home,
  Users,
  Book,
  Building2,
  Briefcase,
  BarChart2,
  CalendarCheck,
  CreditCard,
  MessageSquare,
  Settings,
  LogOut,
  Star,
  MapPin,
  Clock,
  Calendar,
  User,
  Eye,
  Share2,
  ChevronLeft,
  ChevronRight,
  Building
} from 'lucide-react';

interface JobData {
  companyName: string;
  companyLogo?: string;
  companyIndustry: string;
  partnershipStatus: string;
  connectedDate: string;
  stats: {
    activeJobs: number;
    avgPackage: string;
    pastPlacements: number;
  };
  jobs: JobListing[];
}

interface JobListing {
  id: string;
  title: string;
  location: string;
  type: 'remote' | 'on-site' | 'hybrid';
  schedule: string;
  salary: string;
  workDays: string;
  experience: string;
  eligibility: string[];
  skillsRequired: string[];
  description: string;
  deadline: string;
  daysLeft?: number;
  isUrgent?: boolean;
  isNew?: boolean;
  instantHiring?: boolean;
}

interface Company {
  id: string;
  name: string;
  logo?: string;
  industry: string;
  location: string;
  activeJobs: number;
  status: 'hiring-now' | 'on-hold';
}

const JobOpeningsPage: React.FC = () => {
  const router = useRouter();
  const { companyId } = router.query;
  
  const [activeTab, setActiveTab] = useState('connections');

  // Mock data matching the Figma design
  const jobData: JobData = {
    companyName: 'Infosys',
    companyIndustry: 'IT Services',
    partnershipStatus: '⭐⭐⭐⭐⭐ Partner',
    connectedDate: '10/04/2024',
    stats: {
      activeJobs: 4,
      avgPackage: '6 LPA',
      pastPlacements: 25
    },
    jobs: [
      {
        id: '1',
        title: 'Software Engineer',
        location: 'Remote',
        type: 'remote',
        schedule: 'Full time',
        salary: '₹50-55k',
        workDays: 'Mon-Fri',
        experience: 'Fresher',
        eligibility: ['CSE, IT, CGPA 7+'],
        skillsRequired: ['React', 'Node.js', 'MongoDB'],
        description: 'Mollit in laborum tempor Lorem incididunt irure. Aute eu ex ad sunt. Pariatur sint culpa do incididunt eiusmod eiusmod culpa. laborum tempor Lorem incididunt.',
        deadline: '30-10-2025',
        daysLeft: 5,
        isUrgent: true,
        isNew: true,
        instantHiring: true
      },
      {
        id: '2',
        title: 'Product Designer',
        location: 'On-site',
        type: 'on-site',
        schedule: 'Full time',
        salary: '₹50-55k',
        workDays: 'Mon-Fri',
        experience: 'Fresher',
        eligibility: ['CSE, IT, CGPA 7+'],
        skillsRequired: ['User Research', 'Problem Solving', 'Wireframe', 'Prototyping'],
        description: 'Mollit in laborum tempor Lorem incididunt irure. Aute eu ex ad sunt. Pariatur sint culpa do incididunt eiusmod eiusmod culpa. laborum tempor Lorem incididunt.',
        deadline: '30-10-2025',
        instantHiring: true
      },
      {
        id: '3',
        title: 'Senior UX/UI Designer',
        location: 'On-site',
        type: 'on-site',
        schedule: 'Full time',
        salary: '₹50-55k',
        workDays: 'Mon-Fri',
        experience: 'Fresher',
        eligibility: ['CSE, IT, CGPA 7+'],
        skillsRequired: ['User Research', 'Problem Solving', 'Wireframe', 'Prototyping'],
        description: 'Mollit in laborum tempor Lorem incididunt irure. Aute eu ex ad sunt. Pariatur sint culpa do incididunt eiusmod eiusmod culpa. laborum tempor Lorem incididunt.',
        deadline: '30-10-2025',
        instantHiring: true
      }
    ]
  };

  const otherCompanies: Company[] = [
    {
      id: 'cognizant',
      name: 'Cognizant',
      industry: 'IT Services',
      location: 'Chennai, India',
      activeJobs: 1,
      status: 'hiring-now'
    },
    {
      id: 'startup-xyz',
      name: 'Startup XYZ',
      industry: 'IT Services', 
      location: 'Bengaluru',
      activeJobs: 0,
      status: 'on-hold'
    }
  ];

  const sidebarItems = [
    { id: 'overview', icon: Home, label: 'Dashboard', active: false },
    { id: 'students', icon: Users, label: 'Admission Enquiries', active: false },
    { id: 'courses', icon: Book, label: 'Courses', active: false },
    { id: 'placements', icon: Building2, label: 'Connect Companies', active: false },
    { id: 'connections', icon: Briefcase, label: 'Hiring Companies', active: true },
    { id: 'database', icon: BarChart2, label: 'Student Database', active: false },
    { id: 'interviews', icon: CalendarCheck, label: 'Interviews', active: false },
    { id: 'fees', icon: CreditCard, label: 'Collect Fees', active: false },
    { id: 'communications', icon: MessageSquare, label: 'Communications', active: false },
    { id: 'settings', icon: Settings, label: 'User Management', active: false }
  ];

  const getCompanyLogo = (name: string) => {
    if (name === 'Infosys') {
      return (
        <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
          <Building className="w-8 h-8 text-blue-600" />
        </div>
      );
    }
    return (
      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
        <Building className="w-8 h-8 text-gray-600" />
      </div>
    );
  };

  const getSkillBadgeColor = (index: number) => {
    const colors = [
      'bg-purple-100 text-purple-700',
      'bg-blue-100 text-blue-700', 
      'bg-green-100 text-green-700',
      'bg-orange-100 text-orange-700'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="w-full h-20 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <div className="flex items-center">
          <img src="/logo1.svg" alt="CampusPe" className="h-8" />
        </div>
        
        <div className="flex items-center gap-12">
          <nav className="flex items-center gap-8">
            <a href="#" className="text-gray-600 hover:text-blue-600 font-medium">Post a Job</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 font-medium">Collect Fees</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 font-medium">Connect with companies</a>
          </nav>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-sm">🔔</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white">3</span>
              </div>
            </div>
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">B</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <nav className="space-y-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    item.active
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Today's Summary */}
            <div className="mt-8 p-4 bg-blue-50 rounded-xl">
              <h3 className="font-medium text-gray-900 mb-4">Today's Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Enquiries</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs">234</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Interviews</span>
                  <span className="px-2 py-1 bg-orange-100 text-orange-600 rounded text-xs">24</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Job Invitations</span>
                  <span className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs">18</span>
                </div>
              </div>
            </div>

            {/* Logout */}
            <div className="mt-8 border-t border-gray-200 pt-6">
              <button className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              <span className="text-blue-600">Infosys Job</span> - Details
            </h1>
            <p className="text-gray-600">View complete job details, interview scheduling, and candidate management</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Active Jobs */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-600">Active Jobs</h3>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{jobData.stats.activeJobs}</div>
            </div>

            {/* Avg Package */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-600">Avg Package</h3>
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Star className="w-4 h-4 text-orange-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{jobData.stats.avgPackage}</div>
            </div>

            {/* Past Placements */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-600">Past Placements</h3>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{jobData.stats.pastPlacements}</div>
            </div>
          </div>

          {/* Partnership Badge */}
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-100 border border-yellow-300 text-yellow-700">
              <Star className="w-4 h-4 mr-2 fill-current" />
              {jobData.partnershipStatus}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="bg-white rounded-2xl border border-orange-400 shadow-sm">
            {/* Company Header */}
            <div className="p-8 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-6">
                  {getCompanyLogo(jobData.companyName)}
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-medium text-gray-900">{jobData.companyName}</h2>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        Hiring Now
                      </span>
                      <div className="flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                        <span className="mr-1">⚡</span>
                        Active Jobs: 3
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-gray-600 text-sm">
                      <span>{jobData.companyIndustry}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>Multiple Locations</span>
                      </div>
                      <span>•</span>
                      <span>Connected: {jobData.connectedDate}</span>
                    </div>
                  </div>
                </div>
                
                <button className="flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg border border-purple-200 hover:bg-purple-200 transition-colors">
                  <Building className="w-4 h-4 mr-2" />
                  Company Profile
                  <ChevronRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>

            {/* Job Listings */}
            <div className="p-8 space-y-6">
              {jobData.jobs.map((job, index) => (
                <div key={job.id} className="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                  {/* Job Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Briefcase className="w-8 h-8 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-medium text-gray-900">{job.title}</h3>
                          {job.isNew && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                              New post
                            </span>
                          )}
                          {job.instantHiring && (
                            <div className="flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                              <span className="mr-1">⚡</span>
                              Instant Hiring
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-6 text-gray-600 text-sm">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{job.schedule}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>₹</span>
                            <span>{job.salary}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{job.workDays}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {job.isUrgent && job.daysLeft && (
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs">
                          {job.daysLeft} days left
                        </span>
                        <div className="w-6 h-6 text-red-500">⚠️</div>
                      </div>
                    )}
                  </div>

                  {/* Job Details */}
                  <div className="space-y-4 mb-6">
                    {/* Eligibility */}
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-900">Eligibility:</span>
                      <span className="text-gray-600">{job.eligibility.join(', ')}</span>
                    </div>

                    {/* Skills Required */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-900">Skills Required:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {job.skillsRequired.map((skill, skillIndex) => (
                          <span
                            key={skillIndex}
                            className={`px-3 py-1 rounded-lg text-sm font-medium ${getSkillBadgeColor(skillIndex)}`}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Experience */}
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-900">Experience:</span>
                      <span className="text-gray-600">{job.experience}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 mb-6 leading-relaxed">{job.description}</p>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    <button className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                      View full details
                    </button>
                    <button className="flex items-center px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share with Students
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Other Companies */}
            <div className="p-8 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-6">
                {otherCompanies.map((company) => (
                  <div key={company.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                      {company.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{company.name}</h4>
                      <p className="text-sm text-gray-600">{company.industry}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        <span>{company.location}</span>
                      </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {/* Pagination */}
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <button className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center">
                      1
                    </button>
                    <button className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 text-gray-400">
                      2
                    </button>
                    <button className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 text-gray-400">
                      3
                    </button>
                    <button className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 text-gray-400">
                      4
                    </button>
                    <button className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 text-gray-400">
                      5
                    </button>
                    <button className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default JobOpeningsPage;
