import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import CollegeRegistrationNavbar from '../../components/CollegeRegistrationNavbar';
import CollegeInvitationManager from '../../components/CollegeInvitationManager';
import CollegeConnectionManager from '../../components/CollegeConnectionManager';
import CollegeJobManager from '../../components/CollegeJobManager';
import ProtectedRoute from '../../components/ProtectedRoute';
import MonthlyPerformanceCard from '../../components/MonthlyPerformanceCard';
import AdmissionEnquiries from '../../components/AdmissionEnquiries';
import InvitationsConnections from '../../components/InvitationsConnections';
import CompanyDetailsView from '../../components/CompanyDetailsView';
import InterviewManagement from '@/components/InterviewManagement';
import StudentDatabase from '../../components/StudentDatabase';
import Communications from '../../components/Communications';
import { Company, CompanyJob } from '../../utils/companyData';
import {
  Home,
  Users,
  Briefcase,
  Building2,
  Server,
  Book,
  BarChart2,
  Mic,
  Tag,
  CalendarCheck,
  CreditCard,
  MessageSquare,
  Activity,
  Settings2,
  UserCog,
} from 'lucide-react';

interface Course {
  _id?: string;
  name: string;
  code?: string;
  description?: string;
  duration: string;
  type: 'undergraduate' | 'postgraduate' | 'diploma' | 'certificate';
  category: 'undergraduate' | 'postgraduate' | 'diploma' | 'certificate';
  studyMode: 'full-time' | 'part-time' | 'distance-education';
  accreditation?: 'ugc-approved' | 'aicte-approved' | 'university-affiliated';
  department: string;
  streamType?: string; // New field for stream/specialization
  eligibilityCriteria?: string;
  fees?: {
    tuition: number;
    other: number;
    currency: string;
  };
  totalFee?: number | string;
  semesterFee?: number | string;
  numberOfSeats?: number | string;
  specialOffers?: {
    spotAdmission?: {
      enabled: boolean;
      fee?: number | string;
      seats?: number | string;
    };
    earlyBird?: {
      enabled: boolean;
      discount?: number | string;
      validUntil?: string;
    };
    meritScholarship?: {
      enabled: boolean;
      percent?: number | string;
      criteria?: string;
    };
  };
  admissionDates?: {
    startDate?: string;
    deadline?: string;
  };
  isActive?: boolean;
  collegeId?: string;
  enrolledStudents?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Comprehensive Stream mapping system
const COURSE_STREAM_MAPPING: { [key: string]: string[] } = {
  // Engineering & Technology
  'Engineering': [
    'Computer Science Engineering',
    'Information Technology',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
    'Chemical Engineering',
    'Aerospace Engineering',
    'Biotechnology Engineering',
    'Industrial Engineering'
  ],
  'B.Tech': [
    'Computer Science Engineering',
    'Information Technology',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
    'Chemical Engineering',
    'Aerospace Engineering',
    'Biotechnology Engineering',
    'Industrial Engineering'
  ],
  'M.Tech': [
    'Computer Science Engineering',
    'Information Technology',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
    'Chemical Engineering',
    'Aerospace Engineering',
    'Biotechnology Engineering',
    'Industrial Engineering'
  ],
  'B.E.': [
    'Computer Science Engineering',
    'Information Technology',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
    'Chemical Engineering',
    'Aerospace Engineering',
    'Biotechnology Engineering',
    'Industrial Engineering'
  ],
  'M.E.': [
    'Computer Science Engineering',
    'Information Technology',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
    'Chemical Engineering',
    'Aerospace Engineering',
    'Biotechnology Engineering',
    'Industrial Engineering'
  ],
  'Technology': [
    'Computer Science Engineering',
    'Information Technology',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
    'Chemical Engineering',
    'Aerospace Engineering',
    'Biotechnology Engineering',
    'Industrial Engineering'
  ],

  // Medical & Health Sciences
  'Medical': [
    'MBBS (Bachelor of Medicine)',
    'BDS (Bachelor of Dental Surgery)',
    'Pharmacy (B.Pharm/M.Pharm)',
    'Nursing (B.Sc/M.Sc Nursing)',
    'Physiotherapy',
    'Ayurveda (BAMS)',
    'Homeopathy (BHMS)',
    'Veterinary Science',
    'Medical Laboratory Technology',
    'Radiology & Imaging'
  ],
  'Medicine': [
    'MBBS (Bachelor of Medicine)',
    'BDS (Bachelor of Dental Surgery)',
    'Pharmacy (B.Pharm/M.Pharm)',
    'Nursing (B.Sc/M.Sc Nursing)',
    'Physiotherapy',
    'Ayurveda (BAMS)',
    'Homeopathy (BHMS)',
    'Veterinary Science',
    'Medical Laboratory Technology',
    'Radiology & Imaging'
  ],
  'MBBS': [
    'General Medicine',
    'Pediatrics',
    'Surgery',
    'Orthopedics',
    'Gynecology',
    'Cardiology',
    'Neurology',
    'Dermatology',
    'Psychiatry',
    'Radiology'
  ],
  'BDS': [
    'Oral Surgery',
    'Orthodontics',
    'Periodontics',
    'Prosthodontics',
    'Pedodontics',
    'Oral Medicine',
    'Oral Pathology',
    'Conservative Dentistry',
    'Endodontics',
    'Implantology'
  ],
  'Pharmacy': [
    'Pharmaceutical Sciences',
    'Clinical Pharmacy',
    'Hospital Pharmacy',
    'Industrial Pharmacy',
    'Pharmaceutical Chemistry',
    'Pharmacology',
    'Pharmaceutics',
    'Pharmaceutical Analysis',
    'Drug Regulatory Affairs',
    'Pharmaceutical Marketing'
  ],
  'Nursing': [
    'Medical Surgical Nursing',
    'Pediatric Nursing',
    'Psychiatric Nursing',
    'Community Health Nursing',
    'Obstetric & Gynecological Nursing',
    'Critical Care Nursing',
    'Oncology Nursing',
    'Geriatric Nursing',
    'Emergency Nursing',
    'Operating Room Nursing'
  ],
  'Health': [
    'Public Health',
    'Health Administration',
    'Health Informatics',
    'Occupational Health',
    'Environmental Health',
    'Health Education',
    'Epidemiology',
    'Biostatistics',
    'Health Policy',
    'Community Health'
  ],

  // Management & Business
  'Management': [
    'Marketing Management',
    'Finance Management',
    'Human Resource Management',
    'Operations Management',
    'International Business',
    'Entrepreneurship',
    'Business Analytics',
    'Supply Chain Management',
    'Project Management',
    'Digital Marketing'
  ],
  'Business': [
    'Marketing Management',
    'Finance Management',
    'Human Resource Management',
    'Operations Management',
    'International Business',
    'Entrepreneurship',
    'Business Analytics',
    'Supply Chain Management',
    'Project Management',
    'Digital Marketing'
  ],
  'MBA': [
    'Marketing Management',
    'Finance Management',
    'Human Resource Management',
    'Operations Management',
    'International Business',
    'Entrepreneurship',
    'Business Analytics',
    'Supply Chain Management',
    'Project Management',
    'Digital Marketing'
  ],
  'BBA': [
    'Marketing Management',
    'Finance Management',
    'Human Resource Management',
    'Operations Management',
    'International Business',
    'Entrepreneurship',
    'Business Analytics',
    'Supply Chain Management',
    'Project Management',
    'Digital Marketing'
  ],

  // Commerce & Economics
  'Commerce': [
    'Accounting & Finance',
    'Banking & Insurance',
    'Taxation',
    'Business Economics',
    'International Trade',
    'Financial Markets',
    'Corporate Finance',
    'Cost Accounting',
    'Auditing',
    'Business Law'
  ],
  'B.Com': [
    'Accounting & Finance',
    'Banking & Insurance',
    'Taxation',
    'Business Economics',
    'International Trade',
    'Financial Markets',
    'Corporate Finance',
    'Cost Accounting',
    'Auditing',
    'Business Law'
  ],
  'M.Com': [
    'Accounting & Finance',
    'Banking & Insurance',
    'Taxation',
    'Business Economics',
    'International Trade',
    'Financial Markets',
    'Corporate Finance',
    'Cost Accounting',
    'Auditing',
    'Business Law'
  ],
  'Economics': [
    'Microeconomics',
    'Macroeconomics',
    'International Economics',
    'Development Economics',
    'Financial Economics',
    'Public Economics',
    'Industrial Economics',
    'Agricultural Economics',
    'Environmental Economics',
    'Econometrics'
  ],
  'Finance': [
    'Corporate Finance',
    'Investment Banking',
    'Financial Planning',
    'Risk Management',
    'Insurance',
    'Portfolio Management',
    'Financial Analysis',
    'International Finance',
    'Banking',
    'Capital Markets'
  ],
  'Accounting': [
    'Financial Accounting',
    'Management Accounting',
    'Cost Accounting',
    'Tax Accounting',
    'Forensic Accounting',
    'Internal Auditing',
    'External Auditing',
    'Government Accounting',
    'Non-profit Accounting',
    'International Accounting'
  ],

  // Arts & Humanities
  'Arts': [
    'English Literature',
    'History',
    'Political Science',
    'Psychology',
    'Sociology',
    'Philosophy',
    'Languages (Hindi/Regional)',
    'Mass Communication',
    'Journalism',
    'Fine Arts'
  ],
  'B.A.': [
    'English Literature',
    'History',
    'Political Science',
    'Psychology',
    'Sociology',
    'Philosophy',
    'Languages (Hindi/Regional)',
    'Mass Communication',
    'Journalism',
    'Fine Arts'
  ],
  'M.A.': [
    'English Literature',
    'History',
    'Political Science',
    'Psychology',
    'Sociology',
    'Philosophy',
    'Languages (Hindi/Regional)',
    'Mass Communication',
    'Journalism',
    'Fine Arts'
  ],
  'Literature': [
    'English Literature',
    'Hindi Literature',
    'Regional Literature',
    'Comparative Literature',
    'World Literature',
    'Modern Literature',
    'Classical Literature',
    'Children Literature',
    'Poetry',
    'Drama'
  ],
  'History': [
    'Ancient History',
    'Medieval History',
    'Modern History',
    'World History',
    'Indian History',
    'Art History',
    'Cultural History',
    'Social History',
    'Political History',
    'Economic History'
  ],
  'Philosophy': [
    'Ethics',
    'Metaphysics',
    'Logic',
    'Political Philosophy',
    'Philosophy of Mind',
    'Philosophy of Religion',
    'Eastern Philosophy',
    'Western Philosophy',
    'Applied Philosophy',
    'Contemporary Philosophy'
  ],
  'Languages': [
    'English',
    'Hindi',
    'Sanskrit',
    'Urdu',
    'Bengali',
    'Tamil',
    'Telugu',
    'Marathi',
    'Gujarati',
    'Regional Languages'
  ],

  // Science & Research
  'Science': [
    'Physics',
    'Chemistry',
    'Mathematics',
    'Biology/Life Sciences',
    'Biotechnology',
    'Microbiology',
    'Environmental Science',
    'Statistics',
    'Computer Science',
    'Data Science'
  ],
  'B.Sc': [
    'Physics',
    'Chemistry',
    'Mathematics',
    'Biology/Life Sciences',
    'Biotechnology',
    'Microbiology',
    'Environmental Science',
    'Statistics',
    'Computer Science',
    'Data Science'
  ],
  'M.Sc': [
    'Physics',
    'Chemistry',
    'Mathematics',
    'Biology/Life Sciences',
    'Biotechnology',
    'Microbiology',
    'Environmental Science',
    'Statistics',
    'Computer Science',
    'Data Science'
  ],
  'Physics': [
    'Theoretical Physics',
    'Applied Physics',
    'Nuclear Physics',
    'Particle Physics',
    'Astrophysics',
    'Condensed Matter Physics',
    'Quantum Physics',
    'Optics',
    'Electronics',
    'Biophysics'
  ],
  'Chemistry': [
    'Organic Chemistry',
    'Inorganic Chemistry',
    'Physical Chemistry',
    'Analytical Chemistry',
    'Biochemistry',
    'Industrial Chemistry',
    'Pharmaceutical Chemistry',
    'Environmental Chemistry',
    'Polymer Chemistry',
    'Medicinal Chemistry'
  ],
  'Biology': [
    'Botany',
    'Zoology',
    'Microbiology',
    'Biotechnology',
    'Genetics',
    'Ecology',
    'Marine Biology',
    'Molecular Biology',
    'Cell Biology',
    'Biochemistry'
  ],
  'Mathematics': [
    'Pure Mathematics',
    'Applied Mathematics',
    'Statistics',
    'Actuarial Science',
    'Mathematical Modeling',
    'Computational Mathematics',
    'Operations Research',
    'Cryptography',
    'Financial Mathematics',
    'Data Analysis'
  ],

  // Law & Legal Studies
  'Law': [
    'Corporate Law',
    'Criminal Law',
    'Civil Law',
    'Constitutional Law',
    'International Law',
    'Intellectual Property Law',
    'Environmental Law',
    'Tax Law',
    'Human Rights Law',
    'Cyber Law'
  ],
  'LLB': [
    'Corporate Law',
    'Criminal Law',
    'Civil Law',
    'Constitutional Law',
    'International Law',
    'Intellectual Property Law',
    'Environmental Law',
    'Tax Law',
    'Human Rights Law',
    'Cyber Law'
  ],
  'LLM': [
    'Corporate Law',
    'Criminal Law',
    'Civil Law',
    'Constitutional Law',
    'International Law',
    'Intellectual Property Law',
    'Environmental Law',
    'Tax Law',
    'Human Rights Law',
    'Cyber Law'
  ],
  'Legal': [
    'Corporate Law',
    'Criminal Law',
    'Civil Law',
    'Constitutional Law',
    'International Law',
    'Intellectual Property Law',
    'Environmental Law',
    'Tax Law',
    'Human Rights Law',
    'Cyber Law'
  ],
  'Jurisprudence': [
    'Legal Theory',
    'Legal Philosophy',
    'Comparative Law',
    'Legal History',
    'Legal Research',
    'Legal Writing',
    'Court Practice',
    'Legal Ethics',
    'Judicial Process',
    'Legal System'
  ],

  // Architecture & Design
  'Architecture': [
    'Architecture (B.Arch)',
    'Interior Design',
    'Urban Planning',
    'Landscape Architecture',
    'Industrial Design',
    'Fashion Design',
    'Graphic Design',
    'Product Design',
    'Structural Design',
    'Sustainable Architecture'
  ],
  'Design': [
    'Architecture (B.Arch)',
    'Interior Design',
    'Urban Planning',
    'Landscape Architecture',
    'Industrial Design',
    'Fashion Design',
    'Graphic Design',
    'Product Design',
    'Structural Design',
    'Sustainable Architecture'
  ],
  'B.Arch': [
    'Architectural Design',
    'Urban Planning',
    'Landscape Architecture',
    'Interior Architecture',
    'Sustainable Architecture',
    'Building Technology',
    'Architectural History',
    'Construction Management',
    'Building Services',
    'Architectural Conservation'
  ],
  'Planning': [
    'Urban Planning',
    'Regional Planning',
    'Rural Planning',
    'Transportation Planning',
    'Environmental Planning',
    'Housing Planning',
    'Infrastructure Planning',
    'Land Use Planning',
    'Economic Planning',
    'Social Planning'
  ],

  // Agriculture & Food Sciences
  'Agriculture': [
    'Agriculture Science',
    'Horticulture',
    'Food Technology',
    'Dairy Technology',
    'Agricultural Engineering',
    'Forestry',
    'Fisheries Science',
    'Soil Science',
    'Plant Pathology',
    'Agricultural Economics'
  ],
  'Farming': [
    'Crop Production',
    'Animal Husbandry',
    'Organic Farming',
    'Sustainable Agriculture',
    'Precision Agriculture',
    'Farm Management',
    'Agricultural Marketing',
    'Seed Technology',
    'Irrigation Management',
    'Post Harvest Technology'
  ],
  'Food': [
    'Food Technology',
    'Food Science',
    'Food Processing',
    'Food Safety',
    'Food Quality Control',
    'Nutrition',
    'Food Microbiology',
    'Food Chemistry',
    'Food Engineering',
    'Food Packaging'
  ],
  'B.Sc Agriculture': [
    'Agriculture Science',
    'Horticulture',
    'Food Technology',
    'Dairy Technology',
    'Agricultural Engineering',
    'Forestry',
    'Fisheries Science',
    'Soil Science',
    'Plant Pathology',
    'Agricultural Economics'
  ],

  // Education & Training
  'Education': [
    'Primary Education (B.Ed)',
    'Secondary Education (M.Ed)',
    'Special Education',
    'Educational Psychology',
    'Curriculum Development',
    'Educational Technology',
    'Physical Education',
    'Early Childhood Education',
    'Adult Education',
    'Educational Administration'
  ],
  'B.Ed': [
    'Mathematics Education',
    'Science Education',
    'English Education',
    'Social Studies Education',
    'Hindi Education',
    'Physical Education',
    'Arts Education',
    'Special Education',
    'Elementary Education',
    'Secondary Education'
  ],
  'M.Ed': [
    'Educational Administration',
    'Curriculum & Instruction',
    'Educational Psychology',
    'Educational Technology',
    'Special Education',
    'Educational Research',
    'Teacher Education',
    'Educational Planning',
    'Educational Evaluation',
    'Comparative Education'
  ],
  'Teaching': [
    'Primary Teaching',
    'Secondary Teaching',
    'Higher Education Teaching',
    'Special Education Teaching',
    'Adult Education Teaching',
    'Vocational Teaching',
    'Distance Education Teaching',
    'Online Teaching',
    'Curriculum Teaching',
    'Subject Specialization Teaching'
  ],
  'Pedagogy': [
    'Teaching Methods',
    'Learning Psychology',
    'Classroom Management',
    'Assessment & Evaluation',
    'Educational Research',
    'Instructional Design',
    'Educational Philosophy',
    'Child Development',
    'Learning Disabilities',
    'Educational Leadership'
  ]
};



const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Course Details Modal Component - matching the profile setup style
const CourseDetailsModal = ({ course, onClose, onEdit }: { course: Course; onClose: () => void; onEdit: () => void }) => {
  const [enrollmentData, setEnrollmentData] = useState<any>(null);
  const [loadingEnrollment, setLoadingEnrollment] = useState(true);

  // Fetch enrollment data when modal opens
  useEffect(() => {
    const fetchEnrollmentData = async () => {
      if (!course?._id) return;
      
      try {
        setLoadingEnrollment(true);
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get(
          `${API_BASE_URL}/api/admission-enquiries/course/${course._id}/enrollment`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data.success) {
          setEnrollmentData(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching enrollment data:', error);
        // Use fallback data if API fails
        setEnrollmentData({
          enrolledStudents: course.enrolledStudents || 0,
          totalSeats: course.numberOfSeats || 0,
          fillPercentage: 0
        });
      } finally {
        setLoadingEnrollment(false);
      }
    };

    fetchEnrollmentData();
  }, [course?._id]);

  if (!course) return null;

  // Helpers and computed values for details UI
  const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  const humanize = (s?: string) => s ? s.split('-').map(w => cap(w)).join(' ') : '';
  const toNum = (v: any) => (v === '' || v === undefined || v === null) ? undefined : Number(v);
  const money = (v: any) => (toNum(v) ?? 0).toLocaleString('en-IN');
  
  // Use real enrollment data from API or fallback
  const seats = enrollmentData?.totalSeats || toNum(course.numberOfSeats) || 0;
  const enrolled = enrollmentData?.enrolledStudents || 0;
  const fillPct = enrollmentData?.fillPercentage || (seats > 0 ? Math.min(100, Math.round((enrolled / seats) * 100)) : 0);
  
  const earlyEnabled = !!course.specialOffers?.earlyBird?.enabled;
  const earlyDiscount = toNum(course.specialOffers?.earlyBird?.discount) ?? 0;
  const earlyUntil = course.specialOffers?.earlyBird?.validUntil ? new Date(course.specialOffers.earlyBird.validUntil as any).toLocaleDateString('en-GB') : '';
  const spotEnabled = !!course.specialOffers?.spotAdmission?.enabled;
  const spotFee = toNum(course.specialOffers?.spotAdmission?.fee) ?? 0;
  const spotSeats = toNum(course.specialOffers?.spotAdmission?.seats) ?? 0;
  const meritEnabled = !!course.specialOffers?.meritScholarship?.enabled;
  const meritPercent = toNum(course.specialOffers?.meritScholarship?.percent) ?? 0;
  const meritCriteria = course.specialOffers?.meritScholarship?.criteria || '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-gray-900 mb-1">
              {course.name}
            </h2>
            {/* Show stream type below course name */}
            {course.streamType && (
              <p className="text-2xl font-medium text-[#0A0A0A] opacity-50 mb-2">{course.streamType}</p>
            )}
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <span className="font-medium">{course.code || 'BCA'}</span>
              <span>•</span>
              <span>{course.category ? course.category.charAt(0).toUpperCase() + course.category.slice(1) : 'Undergraduate'}</span>
              <span>•</span>
              <span>{course.duration} months</span>
              <span>•</span>
              <span>{course.accreditation ? course.accreditation.split('-').map(w => w.charAt(0).toUpperCase()+w.slice(1)).join(' ') : 'UGC Approved'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 ml-4">
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
              Active
            </span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
          </div>
        </div>

        {/* Two Column Layout with 5 Containers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="flex flex-col space-y-6">
            {/* Container 1: Course Information */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Course Information
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Description:</div>
                  <div className="text-gray-900">{course.description || 'Comprehensive program covering programming, web development, and software engineering.'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Eligibility:</div>
                  <div className="text-gray-900">{course.eligibilityCriteria || '12th pass with minimum 50% marks'}</div>
                </div>
              </div>
            </div>

            {/* Container 2: Enrollment Status */}
            <div className="bg-gray-50 rounded-2xl p-6 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Enrollment Status
              </h3>
              <div className="space-y-4">
                {loadingEnrollment ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Current Intake Progress</div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div className="bg-blue-500 h-3 rounded-full" style={{width: `${fillPct}%`}}></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{enrolled}/{seats}</span>
                      </div>
                      <div className="text-sm text-blue-600 mt-1">{fillPct}% filled</div>
                    </div>
                    
                    {/* Divider line */}
                    <hr className="border-gray-300" />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Total Seats</div>
                        <div className="text-lg font-semibold text-gray-900">{seats}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Enrolled Students</div>
                        <div className="text-lg font-semibold text-gray-900">{enrolled}</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col space-y-6">
            {/* Container 3: Fee Structure */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-5 h-5 mr-2 text-gray-600 flex items-center justify-center font-bold text-lg">₹</div>
                Fee Structure
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-600">Total Course Fee:</div>
                  <div className="text-sm font-semibold text-gray-900">₹ {course.totalFee ? money(course.totalFee) : '2,00,000'}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-600">Per Semester Fee:</div>
                  <div className="text-sm font-semibold text-gray-900">₹ {course.semesterFee ? money(course.semesterFee) : '50,000'}</div>
                </div>
              </div>
            </div>

            {/* Container 4: Active Offers */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a1.994 1.994 0 01-1.414.586H7a4 4 0 01-4-4V7a4 4 0 014-4z" />
                </svg>
                Active Offers
                {(earlyEnabled || spotEnabled) && (
                  <span className="ml-auto inline-flex items-center px-3 py-1 bg-gradient-to-r from-pink-500 to-red-500 text-white text-sm font-medium rounded-full">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13 9h8L11 24v-9H4l9-15v9z"/>
                    </svg>
                    {earlyEnabled ? `${earlyDiscount}% OFF` : 'Special Offer'}
                  </span>
                )}
              </h3>
              <div className="space-y-2 text-sm">
                {earlyEnabled && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Early Bird Discount</span>
                    <span className="text-gray-600">Valid Until: {earlyUntil || '-'}</span>
                  </div>
                )}
                {spotEnabled && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Spot Admission</span>
                    <span className="text-gray-900">₹ {money(spotFee)} • {spotSeats} Seats</span>
                  </div>
                )}
                {!earlyEnabled && !spotEnabled && (
                  <div className="text-gray-500">No active offers</div>
                )}
              </div>
            </div>

            {/* Container 5: Scholarship Available */}
            <div className="bg-gray-50 rounded-2xl p-6 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Scholarship Available
              </h3>
              {meritEnabled ? (
                <div className="space-y-3 text-sm">
                  <div className="text-gray-700">Merit Scholarship: <span className="text-gray-900">Available for students with {meritCriteria || '85%+ marks'}</span></div>
                  
                  <div>
                    <span className="inline-block px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-full">{meritPercent}% OFF</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="text-gray-700">Merit Scholarship: <span className="text-gray-900">Available for students with high academic performance</span></div>
                  <div>
                    <span className="inline-block px-4 py-2 bg-gray-400 text-white text-sm font-medium rounded-full">Not Active</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end mt-6">
          <button
            onClick={onEdit}
            className="flex items-center px-4 py-2 text-[#0270DF] border border-blue-600 rounded-lg hover:bg-blue-50 text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        </div>
      </div>
    </div>
  );
};

// Course Edit Modal Component - 2 Step Form (matching profile setup)
const CourseEditModal = ({ course, onSave, onClose, saving }: { course: Course | null; onSave: (data: any) => void; onClose: () => void; saving: boolean }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: course?.name || '',
    code: course?.code?.split('-').pop() || '', // Remove college prefix
    description: course?.description || '',
    duration: course?.duration || '',
    type: course?.type || 'undergraduate',
    category: course?.category || 'undergraduate',
    studyMode: course?.studyMode || 'full-time',
    accreditation: course?.accreditation || '',
    department: course?.department || 'General',
    streamType: course?.streamType || '', // New field for stream type
    eligibilityCriteria: course?.eligibilityCriteria || '',
    totalFee: course?.totalFee || '',
    semesterFee: course?.semesterFee || '',
    numberOfSeats: course?.numberOfSeats || '',
    specialOffers: {
      spotAdmission: {
        enabled: course?.specialOffers?.spotAdmission?.enabled || false,
        fee: (course?.specialOffers?.spotAdmission?.fee as any) || '',
        seats: (course?.specialOffers?.spotAdmission?.seats as any) || ''
      },
      earlyBird: {
        enabled: course?.specialOffers?.earlyBird?.enabled || false,
        discount: (course?.specialOffers?.earlyBird?.discount as any) || '',
        validUntil: course?.specialOffers?.earlyBird?.validUntil ? new Date(course.specialOffers.earlyBird.validUntil as any).toISOString().slice(0,10) : ''
      },
      meritScholarship: {
        enabled: course?.specialOffers?.meritScholarship?.enabled || false,
        percent: (course?.specialOffers?.meritScholarship?.percent as any) || '',
        criteria: course?.specialOffers?.meritScholarship?.criteria || ''
      }
    },
    admissionDates: {
      startDate: course?.admissionDates?.startDate ? new Date(course.admissionDates.startDate as any).toISOString().slice(0,10) : '',
      deadline: course?.admissionDates?.deadline ? new Date(course.admissionDates.deadline as any).toISOString().slice(0,10) : ''
    }
  });

  // Get available course names from mapping
  const availableCourseNames = Object.keys(COURSE_STREAM_MAPPING);

  // Update form data when course prop changes
  React.useEffect(() => {
    if (course) {
      setFormData({
        name: course.name || '',
        code: course.code?.split('-').pop() || '',
        description: course.description || '',
        duration: course.duration || '',
        type: course.type || 'undergraduate',
        category: course.category || 'undergraduate',
        studyMode: course.studyMode || 'full-time',
        accreditation: course.accreditation || '',
        department: course.department || 'General',
        streamType: course.streamType || '', // Include stream type
        eligibilityCriteria: course.eligibilityCriteria || '',
        totalFee: course.totalFee || '',
        semesterFee: course.semesterFee || '',
        numberOfSeats: course.numberOfSeats || '',
        specialOffers: {
          spotAdmission: {
            enabled: course?.specialOffers?.spotAdmission?.enabled || false,
            fee: (course?.specialOffers?.spotAdmission?.fee as any) || '',
            seats: (course?.specialOffers?.spotAdmission?.seats as any) || ''
          },
          earlyBird: {
            enabled: course?.specialOffers?.earlyBird?.enabled || false,
            discount: (course?.specialOffers?.earlyBird?.discount as any) || '',
            validUntil: course?.specialOffers?.earlyBird?.validUntil ? new Date(course.specialOffers.earlyBird.validUntil as any).toISOString().slice(0,10) : ''
          },
          meritScholarship: {
            enabled: course?.specialOffers?.meritScholarship?.enabled || false,
            percent: (course?.specialOffers?.meritScholarship?.percent as any) || '',
            criteria: course?.specialOffers?.meritScholarship?.criteria || ''
          }
        },
        admissionDates: {
          startDate: course?.admissionDates?.startDate ? new Date(course.admissionDates.startDate as any).toISOString().slice(0,10) : '',
          deadline: course?.admissionDates?.deadline ? new Date(course.admissionDates.deadline as any).toISOString().slice(0,10) : ''
        }
      });
    }
  }, [course]);

  const handleNext = () => {
    if (currentStep === 1 && formData.name && formData.duration && formData.category) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 1) {
      handleNext();
    } else if (formData.name && formData.duration && formData.category) {
      onSave({
        ...formData,
        department: formData.department || 'General' // Provide default department
      });
    }
  };

  if (!course) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-1/2 max-1/2 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit Course</h2>
              <p className="text-sm text-gray-600">Update course information</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Step {currentStep} of 2</span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {currentStep === 1 ? (
            // Step 1: Basic Course Information
            <>
              {/* Course Name - Dropdown selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Course Name</label>
                <select
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                >
                  <option value="">Select Course</option>
                  {availableCourseNames.map((courseName) => (
                    <option key={courseName} value={courseName}>
                      {courseName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stream Type - Text input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Stream Type</label>
                <input
                  type="text"
                  value={formData.streamType}
                  onChange={(e) => setFormData({...formData, streamType: e.target.value})}
                  placeholder="Enter stream name (e.g., Computer Science Engineering)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                />
              </div>

              {/* Course Duration and Course Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Course Duration(months)</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    placeholder="24"
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Course Type</label>
                  <select
                    value={formData.studyMode}
                    onChange={(e) => setFormData({...formData, studyMode: e.target.value as any})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="full-time">Full-Time</option>
                    <option value="part-time">Part-Time</option>
                    <option value="distance-education">Distance Education</option>
                  </select>
                </div>
              </div>

              {/* Course Code and Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Course Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="XYZ"
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as any, type: e.target.value as any})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="undergraduate">Undergraduate</option>
                    <option value="postgraduate">Postgraduate</option>
                    <option value="diploma">Diploma</option>
                    <option value="certificate">Certificate</option>
                  </select>
                </div>
              </div>

              {/* Total Fee and Semester Fee */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Fee (₹)</label>
                  <input
                    type="number"
                    value={formData.totalFee}
                    onChange={(e) => setFormData({...formData, totalFee: e.target.value})}
                    placeholder="200000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Semester Fee (₹)</label>
                  <input
                    type="number"
                    value={formData.semesterFee}
                    onChange={(e) => setFormData({...formData, semesterFee: e.target.value})}
                    placeholder="50000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* Total Seats and Accreditation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Seats</label>
                  <input
                    type="number"
                    value={formData.numberOfSeats}
                    onChange={(e) => setFormData({...formData, numberOfSeats: e.target.value})}
                    placeholder="50"
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Accreditation</label>
                  <select
                    value={formData.accreditation}
                    onChange={(e) => setFormData({...formData, accreditation: e.target.value as any})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Accreditation</option>
                    <option value="ugc-approved">UGC Approved</option>
                    <option value="aicte-approved">AICTE Approved</option>
                    <option value="university-affiliated">University Affiliated</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Eligibility</label>
                <input
                  type="text"
                  value={formData.eligibilityCriteria}
                  onChange={(e) => setFormData({...formData, eligibilityCriteria: e.target.value})}
                  placeholder="12th pass with minimum 50% marks"
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Lorem ipsum demo text emmit kirin and demo xyz"
                  className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                />
              </div>

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formData.name || !formData.duration || !formData.category}
                  className={`px-6 py-3 rounded-lg font-medium ${
                    !formData.name || !formData.duration || !formData.category
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white'
                  }`}
                >
                  Continue
                </button>
              </div>
            </>
          ) : (
            // Step 2: Special Offers & Advanced Options
            <>
              <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">Special Offers & Advance Options</h3>
                <p className="text-sm text-gray-600 mb-4 text-center">Configure admission offers and course details</p>

                {/* Top toggles */}
                <div className="flex items-center gap-6 mb-4 justify-center">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!formData.specialOffers.spotAdmission.enabled}
                      onChange={(e) => setFormData({
                        ...formData,
                        specialOffers: {
                          ...formData.specialOffers,
                          spotAdmission: {
                            ...formData.specialOffers.spotAdmission,
                            enabled: e.target.checked
                          }
                        }
                      })}
                    />
                    <span className="text-sm">Enable Spot Admission</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!formData.specialOffers.earlyBird.enabled}
                      onChange={(e) => setFormData({
                        ...formData,
                        specialOffers: {
                          ...formData.specialOffers,
                          earlyBird: {
                            ...formData.specialOffers.earlyBird,
                            enabled: e.target.checked
                          }
                        }
                      })}
                    />
                    <span className="text-sm">Early Bird Discount</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!formData.specialOffers.meritScholarship.enabled}
                      onChange={(e) => setFormData({
                        ...formData,
                        specialOffers: {
                          ...formData.specialOffers,
                          meritScholarship: {
                            ...formData.specialOffers.meritScholarship,
                            enabled: e.target.checked
                          }
                        }
                      })}
                    />
                    <span className="text-sm">Merit Scholarship</span>
                  </label>
                </div>

                {/* Spot Admission section */}
                {formData.specialOffers.spotAdmission.enabled && (
                  <div className="py-4 border-t">
                    <div className="flex items-center gap-2 mb-4">
                      <input
                        type="checkbox"
                        checked={formData.specialOffers.spotAdmission.enabled}
                        onChange={(e) => setFormData({
                          ...formData,
                          specialOffers: {
                            ...formData.specialOffers,
                            spotAdmission: {
                              ...formData.specialOffers.spotAdmission,
                              enabled: e.target.checked
                            }
                          }
                        })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <h4 className="text-sm font-medium text-gray-900">Enable Spot Admission</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Spot Fee (₹)</label>
                        <input
                          type="number"
                          value={formData.specialOffers.spotAdmission.fee as any}
                          onChange={(e) => setFormData({
                            ...formData,
                            specialOffers: {
                              ...formData.specialOffers,
                              spotAdmission: {
                                ...formData.specialOffers.spotAdmission,
                                fee: e.target.value
                              }
                            }
                          })}
                          placeholder="25000"
                          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Spot Seat</label>
                        <input
                          type="number"
                          value={formData.specialOffers.spotAdmission.seats as any}
                          onChange={(e) => setFormData({
                            ...formData,
                            specialOffers: {
                              ...formData.specialOffers,
                              spotAdmission: {
                                ...formData.specialOffers.spotAdmission,
                                seats: e.target.value
                              }
                            }
                          })}
                          placeholder="10"
                          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Early Bird section */}
                {formData.specialOffers.earlyBird.enabled && (
                  <div className="py-4 border-t">
                    <div className="flex items-center gap-2 mb-4">
                      <input
                        type="checkbox"
                        checked={formData.specialOffers.earlyBird.enabled}
                        onChange={(e) => setFormData({
                          ...formData,
                          specialOffers: {
                            ...formData.specialOffers,
                            earlyBird: {
                              ...formData.specialOffers.earlyBird,
                              enabled: e.target.checked
                            }
                          }
                        })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <h4 className="text-sm font-medium text-gray-900">Early Bird Discount</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Discount(%)</label>
                        <input
                          type="number"
                          value={formData.specialOffers.earlyBird.discount as any}
                          onChange={(e) => setFormData({
                            ...formData,
                            specialOffers: {
                              ...formData.specialOffers,
                              earlyBird: {
                                ...formData.specialOffers.earlyBird,
                                discount: e.target.value
                              }
                            }
                          })}
                          placeholder="15"
                          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Valid Until</label>
                        <input
                          type="date"
                          value={(formData.specialOffers.earlyBird.validUntil as any) || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            specialOffers: {
                              ...formData.specialOffers,
                              earlyBird: {
                                ...formData.specialOffers.earlyBird,
                                validUntil: e.target.value
                              }
                            }
                          })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Merit Scholarship section */}
                {formData.specialOffers.meritScholarship.enabled && (
                  <div className="py-4 border-t">
                    <div className="flex items-center gap-2 mb-4">
                      <input
                        type="checkbox"
                        checked={formData.specialOffers.meritScholarship.enabled}
                        onChange={(e) => setFormData({
                          ...formData,
                          specialOffers: {
                            ...formData.specialOffers,
                            meritScholarship: {
                              ...formData.specialOffers.meritScholarship,
                              enabled: e.target.checked
                            }
                          }
                        })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <h4 className="text-sm font-medium text-gray-900">Merit Scholarship</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Scholarship % (up to)</label>
                        <input
                          type="number"
                          value={formData.specialOffers.meritScholarship.percent as any}
                          onChange={(e) => setFormData({
                            ...formData,
                            specialOffers: {
                              ...formData.specialOffers,
                              meritScholarship: {
                                ...formData.specialOffers.meritScholarship,
                                percent: e.target.value
                              }
                            }
                          })}
                          placeholder="50"
                          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Criteria</label>
                        <input
                          type="text"
                          value={formData.specialOffers.meritScholarship.criteria}
                          onChange={(e) => setFormData({
                            ...formData,
                            specialOffers: {
                              ...formData.specialOffers,
                              meritScholarship: {
                                ...formData.specialOffers.meritScholarship,
                                criteria: e.target.value
                              }
                            }
                          })}
                          placeholder="90% and above in 12th"
                          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Admission dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 border-t pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Admission Start Date</label>
                    <input
                      type="date"
                      value={formData.admissionDates.startDate || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        admissionDates: {
                          ...formData.admissionDates,
                          startDate: e.target.value
                        }
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Admission Deadline</label>
                    <input
                      type="date"
                      value={formData.admissionDates.deadline || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        admissionDates: {
                          ...formData.admissionDates,
                          deadline: e.target.value
                        }
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={saving || !formData.name || !formData.duration || !formData.category}
                  className={`px-6 py-3 rounded-lg font-medium ${
                    saving || !formData.name || !formData.duration || !formData.category
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white'
                  }`}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

// Type Definitions
interface CollegeInfo {
  _id: string;
  name: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  website?: string;
  contactPerson: string;
  phoneNumber?: string;
  establishedYear?: number;
  collegeType: string;
  affiliation?: string;
  description?: string;
  logo?: string;
  isVerified: boolean;
  verificationStatus: string;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'reverify' | 'deactivated';
  createdAt: string;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  year?: string;
  enrollmentNumber?: string;
  skills: string[];
  cgpa?: number;
  resumeUrl?: string;
  isActive: boolean;
  lastLoginDate?: string;
  createdAt: string;
}

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'internship';
  description: string;
  requirements: string[];
  salary?: string;
  isActive: boolean;
  applicationDeadline?: string;
  createdAt: string;
}

interface PlacementData {
  _id: string;
  studentId: string;
  studentName: string;
  company: string;
  position: string;
  package: number;
  placementDate: string;
  placementType: 'campus' | 'off-campus';
  status: 'placed' | 'offer-letter' | 'joining-pending';
}

interface CampusEvent {
  _id: string;
  title: string;
  description: string;
  eventType: 'placement' | 'seminar' | 'workshop' | 'company-visit';
  date: string;
  time: string;
  venue: string;
  organizer: string;
  maxParticipants?: number;
  registeredCount: number;
  isActive: boolean;
}

interface Stats {
  totalStudents: number;
  activeStudents: number;
  totalPlacements: number;
  averagePackage: number;
  topPackage: number;
  placementPercentage: number;
  activeJobs: number;
  upcomingEvents: number;
}

interface Connection {
  _id: string;
  requester: {
    _id: string;
    name: string;
    email: string;
    userType: 'college' | 'recruiter' | 'student';
    profile?: {
      firstName: string;
      lastName: string;
      designation: string;
    };
    companyInfo?: any;
  };
  target: {
    _id: string;
    name: string;
    email: string;
    userType: 'college' | 'recruiter' | 'student';
    profile?: {
      firstName: string;
      lastName: string;
      designation: string;
    };
    companyInfo?: any;
  };
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  createdAt: string;
}

interface RecruiterInvitation {
  _id: string;
  jobTitle: string;
  companyName: string;
  companyId: string;
  recruitmentStartDate: string;
  recruitmentEndDate: string;
  status: 'pending' | 'accepted' | 'declined' | 'negotiating';
  receivedDate: string;
  description?: string;
  salary?: string;
  location?: string;
  deadline?: string;
  urgency?: 'high' | 'medium' | 'low';
  eligibilityCriteria: {
    minimumCGPA: number;
    allowedCourses: string[];
    graduationYears: number[];
  };
  campusVisitWindow: {
    startDate: string;
    endDate: string;
  };
  maxStudentsPerCollege: number;
  invitationMessage: string;
}



// Courses Management Component
  const CoursesManagement = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [enrollmentData, setEnrollmentData] = useState<{ [courseId: string]: any }>({});
    const [loadingEnrollment, setLoadingEnrollment] = useState(true);
    const [showCourseDetailsModal, setShowCourseDetailsModal] = useState(false);
    const [showCourseEditModal, setShowCourseEditModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [savingCourse, setSavingCourse] = useState(false);  // Load courses from API
  const loadCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/courses/my-college`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCourses(response.data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle view details
  const handleViewDetails = (course: Course) => {
    setSelectedCourse(course);
    setShowCourseDetailsModal(true);
  };

  // Handle edit course - open edit modal
  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setShowCourseEditModal(true);
  };

  // Handle save course
  const handleSaveCourse = async (courseData: any) => {
    try {
      setSavingCourse(true);
      const token = localStorage.getItem('token');
      
      // Validate required fields BEFORE sending to API
      const validationErrors: string[] = [];
      
      if (!courseData.name || courseData.name.trim() === '') {
        validationErrors.push('Course name is required');
      }
      if (!courseData.duration || courseData.duration.trim() === '') {
        validationErrors.push('Duration is required');
      }
      if (!courseData.type || courseData.type.trim() === '') {
        validationErrors.push('Course type is required');
      }
      if (!courseData.department || courseData.department.trim() === '') {
        validationErrors.push('Department is required');
      }

      // Validate enum values
      const validTypes = ['undergraduate', 'postgraduate', 'diploma', 'certificate'];
      if (courseData.type && !validTypes.includes(courseData.type.toLowerCase())) {
        validationErrors.push(`Invalid course type. Must be one of: ${validTypes.join(', ')}`);
      }

      if (validationErrors.length > 0) {
        console.error('❌ Validation Errors:', validationErrors);
        alert('Please fix the following errors:\n\n' + validationErrors.join('\n'));
        setSavingCourse(false);
        return;
      }
      
      // Normalize data to match API requirements
      const normalizedData = {
        ...courseData,
        name: courseData.name.trim(),
        type: courseData.type.toLowerCase(),
        category: (courseData.category || courseData.type).toLowerCase(),
        studyMode: (courseData.studyMode || 'full-time').toLowerCase().replace(' ', '-'),
        accreditation: courseData.accreditation ? courseData.accreditation.toLowerCase().replace(' ', '-') : undefined,
        department: courseData.department.trim()
      };
      
      console.log('✅ Sending course data:', normalizedData);
      
      if (editingCourse && editingCourse._id) {
        // Update existing course
        await axios.put(
          `${API_BASE_URL}/api/courses/${editingCourse._id}`,
          normalizedData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Create new course
        await axios.post(
          `${API_BASE_URL}/api/courses`,
          normalizedData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      // Reload courses
      await loadCourses();
      
      // Close modal
      setShowCourseEditModal(false);
      setEditingCourse(null);
      
    } catch (error) {
      console.error('❌ Error saving course:', error);
      if (axios.isAxiosError(error)) {
        console.error('📊 Response status:', error.response?.status);
        console.error('📋 Response data:', error.response?.data);
        console.error('📤 Request data:', error.config?.data);
        
        const errorMessage = error.response?.data?.message || 'Unknown error occurred';
        const statusCode = error.response?.status;
        
        if (statusCode === 400) {
          alert(`❌ Validation Error (400):\n\n${errorMessage}\n\nPlease check:\n- All required fields are filled\n- Course type is valid (undergraduate/postgraduate/diploma/certificate)\n- Study mode is valid (full-time/part-time/distance-education)`);
        } else if (statusCode === 401) {
          alert('Your session has expired. Please login again.');
        } else {
          alert(`Error saving course (${statusCode}):\n\n${errorMessage}`);
        }
      } else {
        alert('Error saving course. Please try again.');
      }
    } finally {
      setSavingCourse(false);
    }
  };

  // Fetch enrollment data for all courses
  const fetchAllEnrollmentData = async () => {
    if (!courses || courses.length === 0) {
      setLoadingEnrollment(false);
      return;
    }

    try {
      setLoadingEnrollment(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setLoadingEnrollment(false);
        return;
      }

      const enrollmentPromises = courses.map(async (course: Course) => {
        try {
          const response = await axios.get(
            `${API_BASE_URL}/api/admission-enquiries/course/${course._id}/enrollment`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          return {
            courseId: course._id,
            data: response.data
          };
        } catch (error) {
          console.error(`Error fetching enrollment for course ${course._id}:`, error);
          return {
            courseId: course._id,
            data: { enrolledCount: 0, totalSeats: course.numberOfSeats || 0, progressPercent: 0 }
          };
        }
      });

      const enrollmentResults = await Promise.all(enrollmentPromises);
      const enrollmentMap: { [courseId: string]: any } = {};
      
      enrollmentResults.forEach(result => {
        if (result.courseId) {
          enrollmentMap[result.courseId] = result.data;
        }
      });

      setEnrollmentData(enrollmentMap);
    } catch (error) {
      console.error('Error fetching enrollment data:', error);
    } finally {
      setLoadingEnrollment(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (courses.length > 0) {
      fetchAllEnrollmentData();
    }
  }, [courses]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'undergraduate': return 'bg-blue-100 text-blue-800';
      case 'postgraduate': return 'bg-purple-100 text-purple-800';
      case 'diploma': return 'bg-green-100 text-green-800';
      case 'certificate': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDurationColor = (duration: string) => {
    if (duration.includes('1') || duration.includes('6 months')) return 'bg-orange-100 text-orange-800';
    if (duration.includes('2')) return 'bg-blue-100 text-blue-800';
    if (duration.includes('3')) return 'bg-green-100 text-green-800';
    if (duration.includes('4')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
         
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            Total Courses: {courses.length}
          </span>
          <button
            onClick={() => window.location.href = '/profile/setup?tab=courses'}
            className="inline-flex items-center px-4 py-2 bg-blue-600 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Course
          </button>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Book className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray\-900 mb-2">No courses added yet</h3>
          <p className="text-gray-500 mb-6">
            Add your first course from the Profile Setup page to see it here.
          </p>
          <button
            onClick={() => window.location.href = '/profile/setup?tab=courses'}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Profile Setup
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const enrollment = enrollmentData[course._id!] || { enrolledCount: 0, totalSeats: course.numberOfSeats || 0, progressPercent: 0 };
            const totalSeats = enrollment.totalSeats || parseInt(course.numberOfSeats?.toString() || '60');
            const enrolledStudents = enrollment.enrolledCount || 0;
            const availableSeats = Math.max(0, totalSeats - enrolledStudents);
            const progressPercent = totalSeats > 0 ? Math.min(100, Math.round((enrolledStudents / totalSeats) * 100)) : 0;
            
            // Check if any offers are enabled
            const hasSpotAdmission = course.specialOffers?.spotAdmission?.enabled && course.specialOffers?.spotAdmission?.fee && course.specialOffers?.spotAdmission?.seats;
            const hasEarlyBird = course.specialOffers?.earlyBird?.enabled && course.specialOffers?.earlyBird?.discount;
            const hasScholarship = course.specialOffers?.meritScholarship?.enabled && course.specialOffers?.meritScholarship?.percent;
            const hasAnyOffer = hasSpotAdmission || hasEarlyBird || hasScholarship;
            
            return (
              <div key={course._id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm min-h-[500px] flex flex-col">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 leading-tight pr-2">
                      {course.name}
                    </h3>
                    {/* Show stream type below course name */}
                    {course.streamType && (
                      <p className="text-lg font-medium text-[#0A0A0A] opacity-50 mb-2">{course.streamType}</p>
                    )}
                    
                    {/* Course Info Pills */}
                    <div className="mb-3">
                      <span className="inline-block px-3 py-1 bg-[#CCB1FF] bg-opacity-20 border border-[#9264E9] text-[#9264E9] text-sm font-medium rounded-full">
                        {course.type === 'undergraduate' ? 'Undergraduate' : course.type === 'postgraduate' ? 'Postgraduate' : 'Undergraduate'}
                      </span>
                    </div>
                    
                    {/* Time and Approval Info */}
                    <div className="flex items-center gap-4 text-gray-500 text-sm">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{course.duration || '24 months'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>UGC Approved</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Top Right Badges - Always show but grayed out when not active */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className={`text-sm font-medium flex items-center gap-1 px-2 py-1 rounded-lg ${hasAnyOffer ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-100'}`}>
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                      </svg>
                      {hasAnyOffer ? 'Filling Fast' : 'No Rush'}
                    </div>
                    <div className={`text-sm font-medium px-3 py-1 rounded-full ${hasEarlyBird ? 'bg-gradient-to-r from-[#E37601] to-[#FFAB50] text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {hasEarlyBird ? `${course.specialOffers?.earlyBird?.discount}% OFF` : 'No Discount'}
                    </div>
                  </div>
                </div>

                {/* Enrollment Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 font-medium text-sm">Enrollment</span>
                    <span className="text-gray-900 font-semibold text-sm">{enrolledStudents}/{totalSeats}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Seat Information */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-gray-500 text-xs font-medium mb-1">Total Seat</div>
                    <div className="text-xl font-medium text-gray-900">{totalSeats}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-500 text-xs font-medium mb-1">Available Seat</div>
                    <div className="text-xl font-medium text-gray-900">{availableSeats}</div>
                  </div>
                </div>

                {/* Fee Information */}
<div className="grid grid-cols-2 gap-4 mb-4">
  <div>
    <div className="text-gray-500 text-xs font-medium mb-1">Total Fee</div>
    <div className="text-xl font-medium text-gray-900">
      ₹{course.totalFee
        ? typeof course.totalFee === 'number'
          ? course.totalFee.toLocaleString('en-IN')
          : '3,50,000'
        : '3,50,000'}
    </div>
  </div>
  <div className="text-right">
    <div className="text-gray-500 text-xs font-medium mb-1">Semester Fee</div>
    <div className="text-xl font-medium text-gray-900">
      ₹{course.semesterFee
        ? typeof course.semesterFee === 'number'
          ? course.semesterFee.toLocaleString('en-IN')
          : '58,000'
        : '58,000'}
    </div>
  </div>
</div>


                {/* Active Offer - Always show but grayed out when not enabled */}
                <div className={`rounded-lg p-3 mb-3 ${hasSpotAdmission ? 'bg-[#FFC383] bg-opacity-10 border border-[#FF8400]' : 'bg-gray-100 border border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-4 h-4 ${hasSpotAdmission ? 'text-orange-600' : 'text-gray-400'}`}>
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 9h8L11 24v-9H4l9-15v9z"/>
                      </svg>
                    </div>
                    <span className={`font-semibold text-sm ${hasSpotAdmission ? 'text-[#C66803]' : 'text-gray-400'}`}>
                      {hasSpotAdmission ? 'Active Offer' : 'No Active Offer'}
                    </span>
                  </div>
                  <div className={`font-medium text-sm ${hasSpotAdmission ? 'text-[#FF8400]' : 'text-gray-400'}`}>
                    {hasSpotAdmission ? (
                      <>
                        Spot Price: ₹{course.specialOffers?.spotAdmission?.fee ? (typeof course.specialOffers.spotAdmission.fee === 'number' ? (course.specialOffers.spotAdmission.fee / 1000) + ',000' : course.specialOffers.spotAdmission.fee) : '35,000'} 
                        ({course.specialOffers?.spotAdmission?.seats || 3} left)
                      </>
                    ) : (
                      'Configure spot admission offer in course settings'
                    )}
                  </div>
                </div>

                {/* Scholarship Available - Always show but grayed out when not enabled */}
                <div className={`rounded-lg p-3 mb-4 ${hasScholarship ? 'bg-[#7DBEFF] bg-opacity-10 border border-[#0377EB]' : 'bg-gray-100 border border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <svg className={`w-4 h-4 ${hasScholarship ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <span className={`font-semibold text-sm ${hasScholarship ? 'text-[#0377EB]' : 'text-gray-400'}`}>
                      {hasScholarship ? 'Scholarship Available' : 'No Scholarship Configured'}
                    </span>
                  </div>
                  <div className={`font-medium text-sm ${hasScholarship ? 'text-[#0377EB]' : 'text-gray-400'}`}>
                    {hasScholarship ? (
                      <>Up to {course.specialOffers?.meritScholarship?.percent || 25}% off for students with {course.specialOffers?.meritScholarship?.criteria || '85%+ marks'}</>
                    ) : (
                      'Configure merit scholarship in course settings'
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-auto">
                  <button
                    onClick={() => handleViewDetails(course)}
                    className="flex-1 flex items-center justify-center gap-2 space-x-2 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View details
                  </button>
                  <button
                    onClick={() => handleEditCourse(course)}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Course Details Modal */}
      {showCourseDetailsModal && selectedCourse && (
        <CourseDetailsModal 
          course={selectedCourse}
          onClose={() => {
            setShowCourseDetailsModal(false);
            setSelectedCourse(null);
          }}
          onEdit={() => {
            // Close the view details modal first
            setShowCourseDetailsModal(false);
            // Then open the edit modal with the same course
            setEditingCourse(selectedCourse);
            setShowCourseEditModal(true);
          }}
        />
      )}

      {/* Course Edit Modal */}
      {showCourseEditModal && (
        <CourseEditModal
          course={editingCourse}
          onSave={handleSaveCourse}
          onClose={() => setShowCourseEditModal(false)}
          saving={savingCourse}
        />
      )}
    </div>
  );
};

const CollegeDashboard = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Handle tab query parameter for navigation
  useEffect(() => {
    const tab = router.query.tab as string;
    if (tab) {
      setActiveTab(tab);
    }
  }, [router.query.tab]);

  // State
  const [collegeInfo, setCollegeInfo] = useState<CollegeInfo | null>(null);
  const [selectedViewCompany, setSelectedViewCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    activeStudents: 0,
    totalPlacements: 0,
    averagePackage: 0,
    topPackage: 0,
    placementPercentage: 0,
    activeJobs: 0,
    upcomingEvents: 0,
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [placements, setPlacements] = useState<PlacementData[]>([]);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [invitations, setInvitations] = useState<RecruiterInvitation[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [availableJobs, setAvailableJobs] = useState<CompanyJob[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollmentData, setEnrollmentData] = useState<{ [courseId: string]: any }>({});
  
  // State to track expanded offer sections for each course card
  const [expandedOffers, setExpandedOffers] = useState<{ [key: string]: boolean }>({});
  const [expandedScholarships, setExpandedScholarships] = useState<{ [key: string]: boolean }>({});

  // Course search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Form states
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editingEvent, setEditingEvent] = useState<CampusEvent | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState<any>({});
  // Course modal states
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showCourseDetailsModal, setShowCourseDetailsModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);
  const [savingCourse, setSavingCourse] = useState(false);

  // Category options for course filtering
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'undergraduate', label: 'Undergraduate' },
    { value: 'postgraduate', label: 'Postgraduate' },
    { value: 'diploma', label: 'Diploma' },
    { value: 'certification', label: 'Certification' },
  ];

  // Filter courses based on search and category
  const filteredCourses = courses.filter(course => {
    const matchesSearch = searchTerm === '' || 
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      course.type === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Handle category selection
  const handleCategorySelect = (value: string) => {
    setSelectedCategory(value);
    setShowCategoryDropdown(false);
  };

  // Helper function to render title with colored words
  const renderColoredTitle = (title: string) => {
    // Special handling for "Welcome back" header
    if (title.startsWith('Welcome back,')) {
      const parts = title.match(/^(Welcome back,)\s(.+)$/);
      if (parts) {
        return (
          <>
            <span style={{ color: '#0270DF' }}>{parts[1]}</span>{' '}
            <span style={{ color: '#0A0A0A' }}>{parts[2]}</span>
          </>
        );
      }
    }
    
    // Default handling for other titles
    const words = title.split(' ');
    if (words.length >= 2) {
      return (
        <>
          <span style={{ color: '#0270DF' }}>{words[0]}</span>{' '}
          <span style={{ color: '#0A0A0A' }}>{words.slice(1).join(' ')}</span>
        </>
      );
    }
    return <span style={{ color: '#0270DF' }}>{title}</span>;
  };

  // Function to get dynamic page header based on active tab
  const getPageHeader = (tab: string) => {
    switch (tab) {
      case 'overview':
        return {
          title: `Welcome back, ${collegeInfo?.name || 'XYZ College'}!`,
          subtitle: 'Dashboard. Overview'
        };
      case 'students':
        return {
          title: 'Admission Enquiries',
          subtitle: 'Manage your college operations efficiently'
        };
      case 'connections':
        return {
          title: 'Company Partnerships',
          subtitle: 'Manage recruiting partners and build industry relationships'
        };
      case 'database':
        return null;
      case 'placements':
        return {
          title: 'Connect Companies',
          subtitle: 'Manage recruitment invitations and company partnerships'
        };
      case 'courses':
        return {
          title: 'Course Management',
          subtitle: 'Manage academic programs and enrollment offers'
        };
      case 'interviews':
        return {
          title: 'Interview Scheduling',
          subtitle: 'Coordinate campus recruitment interviews'
        };
      case 'fees':
        return {
          title: 'Fee Management',
          subtitle: 'Handle student payments and financial records'
        };
      case 'communications':
        return {
          title: 'Communications Hub',
          subtitle: 'Manage notifications and announcements'
        };
      default:
        return {
          title: `Welcome back, ${collegeInfo?.name || 'XYZ College'}!`,
          subtitle: 'Dashboard. Overview'
        };
    }
  };

useEffect(() => {
    const initializeDashboard = async () => {
      // Handle tab from URL query parameter first
      const { tab } = router.query;
      const targetTab = (tab && typeof tab === 'string') ? tab : 'overview';
      
      if (targetTab !== activeTab) {
        setActiveTab(targetTab);
      }
      
      // Load dashboard data with the correct active tab
      await loadDashboardDataWithTab(targetTab);
    };
    
    // Only run when router is ready and query is available
    if (router.isReady) {
      initializeDashboard();
    }
  }, [router.isReady, router.query]);

  // Fetch enrollment data when courses change
  useEffect(() => {
    if (courses.length > 0) {
      fetchAllEnrollmentData();
    }
  }, [courses]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCategoryDropdown) {
        setShowCategoryDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCategoryDropdown]);

  // Load tab data when activeTab changes (for manual tab switching)
  useEffect(() => {
    if (collegeInfo && activeTab) {
      loadTabData(activeTab, collegeInfo._id);
    }
  }, [activeTab, collegeInfo]);

  const loadDashboardData = async () => {
    return loadDashboardDataWithTab(activeTab);
  };

  const loadDashboardDataWithTab = async (targetTab: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found, redirecting to login');
        router.push('/login');
        return;
      }
      // Extract userId from JWT token
      let userId;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.userId;
        
        if (!userId) {
          console.log('No userId in token, redirecting to login');
          router.push('/login');
          return;
        }
      } catch (tokenError) {
        console.log('Invalid token format, redirecting to login');
        router.push('/login');
        return;
      }

      // Load college info
      const collegeResponse = await axios.get(
        `${API_BASE_URL}/api/colleges/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setCollegeInfo(collegeResponse.data);

      // Load stats
      const statsResponse = await axios.get(
        `${API_BASE_URL}/api/colleges/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setStats(statsResponse.data);

      // Load other data based on active tab
      await loadTabData(targetTab, collegeResponse.data._id);

    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      // If unauthorized, redirect to login
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        router.push('/login');
        return;
      }
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async (tab: string, collegeId: string) => {
    const token = localStorage.getItem('token');
    
    try {
      switch (tab) {
        case 'students':
        case 'database':
          const studentsResponse = await axios.get(
            `${API_BASE_URL}/api/colleges/${collegeId}/students`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setStudents(studentsResponse.data);
          break;
          
        case 'jobs':
          const jobsResponse = await axios.get(
            `${API_BASE_URL}/api/colleges/${collegeId}/jobs`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setJobs(jobsResponse.data);
          break;
          
        case 'placements':
          // Load invitations for the new Connect Companies tab
          try {
            const invitationsResponse = await axios.get(
              `${API_BASE_URL}/api/colleges/${collegeId}/invitations`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setInvitations(Array.isArray(invitationsResponse.data) ? invitationsResponse.data : []);
          } catch (error) {
            console.log('Invitations API not available yet, using mock data');
            setInvitations([]);
          }
          
          // Load available companies and jobs
          try {
            const companiesResponse = await axios.get(
              `${API_BASE_URL}/api/companies/available`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setCompanies(Array.isArray(companiesResponse.data) ? companiesResponse.data : []);
            
            const jobsResponse = await axios.get(
              `${API_BASE_URL}/api/jobs/available`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setAvailableJobs(Array.isArray(jobsResponse.data) ? jobsResponse.data : []);
          } catch (error) {
            console.log('Companies/Jobs API not available yet');
            setCompanies([]);
            setAvailableJobs([]);
          }
          
          // Still load placements for backward compatibility
          try {
            const placementsResponse = await axios.get(
              `${API_BASE_URL}/api/colleges/${collegeId}/placements`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setPlacements(placementsResponse.data);
          } catch (error) {
            console.log('Placements API error:', error);
            setPlacements([]);
          }
          break;
          
        case 'events':

        case 'interviews':
          const eventsResponse = await axios.get(
            `${API_BASE_URL}/api/colleges/${collegeId}/events`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setEvents(eventsResponse.data);
          break;

        case 'courses':
          try {
            console.log('Loading courses data...');
            const coursesResponse = await axios.get(
              `${API_BASE_URL}/api/courses/my-college`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('Courses loaded:', coursesResponse.data);
            setCourses(coursesResponse.data || []);
          } catch (error) {
            console.error('Error loading courses:', error);
            setCourses([]);
          }
          break;
          
          
        case 'connections':
          const connectionsResponse = await axios.get(
            `${API_BASE_URL}/api/connections/college/${collegeId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setConnections(connectionsResponse.data);
          break;
          
        case 'fees':
        case 'communications':
        case 'overview':
        default:
          // These tabs don't require additional data loading
          break;
      }
    } catch (err) {
      console.error(`Error loading ${tab} data:`, err);
    }
  };

    // Fetch enrollment data for all courses
  const fetchAllEnrollmentData = async () => {
    if (!courses || courses.length === 0) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const enrollmentPromises = courses.map(async (course: Course) => {
        try {
          const response = await axios.get(
            `${API_BASE_URL}/api/admission-enquiries/course/${course._id}/enrollment`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          return {
            courseId: course._id,
            data: response.data
          };
        } catch (error) {
          console.error(`Error fetching enrollment for course ${course._id}:`, error);
          return {
            courseId: course._id,
            data: { enrolledCount: 0, totalSeats: course.numberOfSeats || 0, progressPercent: 0 }
          };
        }
      });

      const enrollmentResults = await Promise.all(enrollmentPromises);
      const enrollmentMap: { [courseId: string]: any } = {};
      
      enrollmentResults.forEach(result => {
        if (result.courseId) {
          enrollmentMap[result.courseId] = result.data;
        }
      });

      setEnrollmentData(enrollmentMap);
    } catch (error) {
      console.error('Error fetching enrollment data:', error);
    }
  };

  // Tab change handler
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/dashboard/college?tab=${tab}`, undefined, { shallow: true });
    
    if (collegeInfo) {
      loadTabData(tab, collegeInfo._id);
    }
  };

  const refreshData = () => {
    loadDashboardData();
  };

  // Course management functions
  const handleSaveCourse = async (courseData: any) => {
    try {
      setSavingCourse(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      if (editingCourse && editingCourse._id) {
        // Update existing course
        await axios.put(
          `${API_BASE_URL}/api/courses/${editingCourse._id}`,
          courseData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Create new course
        await axios.post(
          `${API_BASE_URL}/api/courses`,
          courseData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // Reload courses
      if (collegeInfo) {
        await loadTabData('courses', collegeInfo._id);
      }
      
      setShowCourseModal(false);
      setEditingCourse(null);
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Failed to save course. Please try again.');
    } finally {
      setSavingCourse(false);
    }
  };

  // Handle invitation responses
  const handleInvitationResponse = async (invitationId: string, action: 'accepted' | 'declined', message?: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/invitations/${invitationId}/${action}`,
        { message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh data
      if (collegeInfo) {
        loadTabData('placements', collegeInfo._id);
      }
    } catch (error) {
      console.error(`Error ${action} invitation:`, error);
      alert(`Failed to ${action} invitation. Please try again.`);
    }
  };

  // Send connection request to company
  const sendConnectionRequest = async (companyId: string, message?: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/connections/request`,
        { 
          targetId: companyId,
          targetType: 'company',
          message: message || 'We would like to connect with your company for placement opportunities.'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Connection request sent successfully!');
      // Refresh data
      if (collegeInfo) {
        loadTabData('placements', collegeInfo._id);
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
      alert('Failed to send connection request. Please try again.');
    }
  };

  // Request invitation for specific job
  const requestJobInvitation = async (jobId: string, companyId: string, message?: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/invitations/request`,
        { 
          jobId,
          companyId,
          message: message || 'We are interested in this job opportunity for our students.'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Job invitation request sent successfully!');
      // Refresh data
      if (collegeInfo) {
        loadTabData('placements', collegeInfo._id);
      }
    } catch (error) {
      console.error('Error requesting job invitation:', error);
      alert('Failed to request job invitation. Please try again.');
    }
  };

  // Utility functions for invitations
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'pending': case 'negotiating': return 'text-yellow-600 bg-yellow-100';
      case 'declined': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const calculateDaysLeft = (deadline?: string) => {
    if (!deadline) return null;
    const days = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
          <button
            onClick={loadDashboardData}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="p-6 lg:p-8 bg-white">
            {/* Main Stats Cards */}
            <div className="flex flex-wrap gap-5 mb-8">
              {/* Total Enquiries Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 flex-1 min-w-[320px]">
                <div className="flex justify-between items-start mb-6">
                  <div className= "flex items-center justify-between space-x-2 text-center">
                    <h3 className="text-base font-medium text-black mb-1">Total Enquiries</h3>
                    <span className="bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                      12 New
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 text-base mb-8">
                  Process new student enquiries<br />and follow-ups
                </p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-3xl font-semibold text-blue-600 mb-1 text-center">24</p>
                    <p className="text-sm text-gray-600 text-center">This week</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-semibold text-blue-600 mb-1 text-center">156</p>
                    <p className="text-sm text-gray-600 text-center">Total</p>
                  </div>
                </div>
              </div>

              {/* Interviews Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 flex-1 min-w-[320px]">
                <div className="flex justify-between items-start mb-6">
                  
                  <div className= "flex items-center justify-between space-x-2 text-center">
                    <h3 className="text-base font-medium text-black mb-1">Interviews</h3>
                    <span className="bg-yellow-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                      8 Pending
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 text-base mb-8">
                  Schedule and track student<br />interviews
                </p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-3xl font-semibold text-blue-600 mb-1 text-center">24</p>
                    <p className="text-sm text-gray-600 text-center">This week</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-semibold text-blue-600 mb-1 text-center">156</p>
                    <p className="text-sm text-gray-600 text-center">Total</p>
                  </div>
                </div>
              </div>

              {/* Job Invitations Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 flex-1 min-w-[320px]">
                <div className="flex justify-between items-start mb-6">
                  <div className= "flex items-center justify-between space-x-2 text-center">
                    <h3 className="text-base font-medium text-black mb-1">Job Invitations</h3>
                    <span className="bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                      5 Active
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 text-base mb-8">
                  Schedule and track student<br />interviews
                </p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-3xl font-semibold text-blue-600 mb-1 text-center">24</p>
                    <p className="text-sm text-gray-600 text-center">This week</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-semibold text-blue-600 mb-1 text-center">156</p>
                    <p className="text-sm text-gray-600 text-center">Total</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Performance Chart */}
              <MonthlyPerformanceCard />

          {/* Bottom Status Cards */}
<div className="flex flex-wrap gap-5">
  {/* Enquiries Status */}
  <div className="bg-white rounded-xl border border-gray-200 p-6 flex-1 min-w-[320px] flex flex-col">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
        </svg>
      </div>
      <h3 className="text-base font-medium text-black">Enquiries Status</h3>
    </div>
    
    <div className="space-y-4 mb-6 flex-1">
      {[
        { label: 'New', count: 1, color: 'bg-blue-500' },
        { label: 'Contacted', count: 3, color: 'bg-yellow-500' },
        { label: 'Interested', count: 2, color: 'bg-green-500' },
        { label: 'Converted', count: 1, color: 'bg-purple-500' },
        { label: 'Closed', count: 1, color: 'bg-red-500' }
      ].map((item) => (
        <div key={item.label} className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
            <span className="text-gray-600">{item.label}</span>
          </div>
          <div className="w-6 h-6 border border-gray-300 rounded-full flex items-center justify-center text-sm text-gray-600">
            {item.count}
          </div>
        </div>
      ))}
    </div>
    
    <div className="border-t border-gray-200 pt-4">
      <div className="flex justify-between items-center">
        <span className="font-medium text-black">Total</span>
        <div className="w-7 h-7 bg-blue-100 border border-blue-300 rounded-full flex items-center justify-center text-sm text-blue-600">
          8
        </div>
      </div>
    </div>
  </div>

  {/* Interview Status */}
  <div className="bg-white rounded-xl border border-gray-200 p-6 flex-1 min-w-[320px] flex flex-col">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      </div>
      <h3 className="text-base font-medium text-black">Interview  Status</h3>
    </div>
    
    <div className="space-y-4 mb-6 flex-1">
      {[
        { label: 'Schedule', count: 8, color: 'bg-yellow-500' },
        { label: 'In Progress', count: 5, color: 'bg-blue-500' },
        { label: 'Completed', count: 11, color: 'bg-green-500' }
      ].map((item) => (
        <div key={item.label} className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
            <span className="text-gray-600">{item.label}</span>
          </div>
          <div className="w-6 h-6 border border-gray-300 rounded-full flex items-center justify-center text-sm text-gray-600">
            {item.count}
          </div>
        </div>
      ))}
    </div>
    
    <div className="border-t border-gray-200 pt-4">
      <div className="flex justify-between items-center">
        <span className="font-medium text-black">Total</span>
        <div className="w-7 h-7 bg-orange-100 border border-orange-300 rounded-full flex items-center justify-center text-sm text-orange-600">
          24
        </div>
      </div>
    </div>
  </div>

  {/* Job Offer Status */}
  <div className="bg-white rounded-xl border border-gray-200 p-6 flex-1 min-w-[320px] flex flex-col">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
          <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
        </svg>
      </div>
      <h3 className="text-base font-medium text-black">Job Offer Status</h3>
    </div>
    
    <div className="space-y-4 mb-6 flex-1">
      {[
        { label: 'Pending', count: 7, color: 'bg-yellow-500' },
        { label: 'Accepted', count: 8, color: 'bg-green-500' },
        { label: 'Declined', count: 3, color: 'bg-red-500' }
      ].map((item) => (
        <div key={item.label} className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
            <span className="text-gray-600">{item.label}</span>
          </div>
          <div className="w-6 h-6 border border-gray-300 rounded-full flex items-center justify-center text-sm text-gray-600">
            {item.count}
          </div>
        </div>
      ))}
    </div>
    
    <div className="border-t border-gray-200 pt-4">
      <div className="flex justify-between items-center">
        <span className="font-medium text-black">Total</span>
        <div className="w-7 h-7 bg-green-100 border border-green-400 rounded-full flex items-center justify-center text-sm text-green-600">
          18
        </div>
      </div>
    </div>
  </div>
</div>

          </div>
        );
      
      case 'students':
        return <AdmissionEnquiries />;

      case 'connections':
        return (
          <div className="p-6">
            {selectedViewCompany ? (
              <CompanyDetailsView 
                company={selectedViewCompany}
                onBack={() => setSelectedViewCompany(null)}
              />
            ) : (
              <CollegeConnectionManager onViewCompany={(company) => setSelectedViewCompany(company)} />
            )}
          </div>
        );

      case 'database':
        return <StudentDatabase />;

      case 'courses':
        return (
          <div className="min-h-screen bg-white">
            <div className="max-w-screen mx-auto space-y-8 p-6 lg:p-8 bg-white">
            

{/* KPI Dashboard Overview */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
  {/* Total Courses */}
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-gray-600 font-medium">Total Courses</h3>
      <div className="w-7 h-7 bg-gradient-to-r from-[#00C950] to-[#00A63E] rounded-lg flex items-center justify-center">
        <Users className="w-4 h-4 text-white" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="text-2xl font-semibold text-gray-900">{courses.length}</div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600">{courses.length === 0 ? 'No courses' : 'Academic Programs'}</span>
      </div>
    </div>
  </div>

  {/* Active Programs */}
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-gray-600 font-medium">Active Programs</h3>
      <div className="w-7 h-7 bg-gradient-to-r from-[#FF8400] to-[#E57701] rounded-lg flex items-center justify-center">
        <Briefcase className="w-4 h-4 text-white" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="text-2xl font-semibold text-gray-900">
        {courses.filter(course => course.numberOfSeats && parseInt(course.numberOfSeats.toString()) > 0).length}
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600">Currently Running</span>
      </div>
    </div>
  </div>

  {/* Active Offers */}
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-gray-600 font-medium">Active Offers</h3>
      <div className="w-7 h-7 bg-gradient-to-r from-[#008EFF] to-[#0573CB] rounded-lg flex items-center justify-center">
        <Tag className="w-4 h-4 text-white" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="text-2xl font-semibold text-gray-900">
        {courses.filter(course => 
          course.specialOffers?.spotAdmission?.enabled || 
          course.specialOffers?.earlyBird?.enabled || 
          course.specialOffers?.meritScholarship?.enabled
        ).length}
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600">Special Discounts</span>
      </div>
    </div>
  </div>
</div>


              {/* Search and Filter Controls Container */}
              <div className="rounded-lg border border-gray-200 shadow-md mb-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
                <div className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name, email, or course"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#127BFF]/30 focus:border-[#127BFF]"
                    />
                  </div>

                  <div className="relative">
                    <button 
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      className="flex items-center justify-between w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-left focus:outline-none focus:ring-2 focus:ring-[#127BFF]/30 focus:border-[#127BFF] hover:border-gray-400 transition-colors min-w-[140px]"
                    >
                      <span className="text-gray-700">
                        {categoryOptions.find(opt => opt.value === selectedCategory)?.label || "All Categories"}
                      </span>
                      <svg className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showCategoryDropdown ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none">
                        <path
                          d="M7 10l5 5 5-5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    
                    {/* Custom Dropdown Menu */}
                    {showCategoryDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                        {categoryOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleCategorySelect(option.value)}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                              selectedCategory === option.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Course Cards Grid */}
              {filteredCourses.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No courses added yet</h3>
                  <p className="text-gray-500 mb-6">
                    Add your first course to get started with course management.
                  </p>
                  <button
                    onClick={() => window.location.href = '/profile/setup?tab=courses'}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Course
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map((course, index) => {
                    const enrollment = enrollmentData[course._id!] || { enrolledCount: 0, totalSeats: course.numberOfSeats || 0, progressPercent: 0 };
                    const totalSeats = enrollment.totalSeats || parseInt(course.numberOfSeats?.toString() || '60');
                    const enrolledStudents = enrollment.enrolledCount || 0;
                    const availableSeats = Math.max(0, totalSeats - enrolledStudents);
                    const progressPercent = totalSeats > 0 ? Math.min(100, Math.round((enrolledStudents / totalSeats) * 100)) : 0;
                    
                    // Check if any offers are enabled
                    const hasSpotAdmission = course.specialOffers?.spotAdmission?.enabled && course.specialOffers?.spotAdmission?.fee && course.specialOffers?.spotAdmission?.seats;
                    const hasEarlyBird = course.specialOffers?.earlyBird?.enabled && course.specialOffers?.earlyBird?.discount;
                    const hasScholarship = course.specialOffers?.meritScholarship?.enabled && course.specialOffers?.meritScholarship?.percent;
                    const hasAnyOffer = hasSpotAdmission || hasEarlyBird || hasScholarship;
                    
                    return (
                      <div key={course._id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm h-[582px] flex flex-col">
                        {/* Header Section - Fixed Height */}
                        <div className="h-[120px] flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-gray-900 mb-1 leading-tight pr-2 line-clamp-1 h-[24px]">
                              {course.name}
                            </h3>
                            {/* Show stream type below course name - Fixed Height */}
                            <div className="h-[24px] mb-2">
                              {course.streamType && (
                                <p className="text-sm text-gray-500 line-clamp-1">{course.streamType}</p>
                              )}
                            </div>
                            
                            {/* Course Info Pills - Fixed Height */}
                            <div className="h-[28px] mb-2">
                              <span className="inline-block px-3 py-1 bg-[#CCB1FF] bg-opacity-20 border border-[#9264E9] text-[#9264E9] text-xs font-medium rounded-full">
                                {course.type === 'undergraduate' ? 'Undergraduate' : course.type === 'postgraduate' ? 'Postgraduate' : 'Undergraduate'}
                              </span>
                            </div>
                            
                            {/* Time and Approval Info - Fixed Height */}
                            <div className="flex items-center gap-3 text-gray-500 text-xs h-[20px]">
                              <div className="flex items-center gap-1">
                                <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="truncate">{course.duration || '24 months'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="truncate">UGC APPROVED</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Top Right Badges - Fixed Height */}
                          <div className="flex flex-col items-end gap-2 flex-shrink-0 w-[100px]">
                            {hasAnyOffer ? (
                              <div className="text-xs font-medium flex items-center gap-1 px-2 py-0.5 rounded-lg bg-green-50 text-green-600 whitespace-nowrap">
                                <svg className="w-3 h-3 fill-current flex-shrink-0" viewBox="0 0 20 20">
                                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                                </svg>
                                <span className="text-xs">Filling Fast</span>
                              </div>
                            ) : <div className="h-[24px]"></div>}
                            {hasEarlyBird ? (
                              <div className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-[#E37601] to-[#FFAB50] text-white whitespace-nowrap">
                                🔥 {course.specialOffers?.earlyBird?.discount}% OFF
                              </div>
                            ) : <div className="h-[24px]"></div>}
                          </div>
                        </div>

                        {/* Enrollment Progress - Fixed Height */}
                        <div className="h-[60px] mb-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-gray-500 text-xs">Enrollment</span>
                            <span className="text-gray-900 font-semibold text-sm">{enrolledStudents}/{totalSeats}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${progressPercent}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Seat Information - Fixed Height */}
                        <div className="grid grid-cols-2 gap-4 h-[50px] mb-3">
                          <div>
                            <div className="text-gray-500 text-xs mb-0.5">Total Seat</div>
                            <div className="text-2xl font-semibold text-gray-900">{totalSeats}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-gray-500 text-xs mb-0.5">Available Seat</div>
                            <div className="text-2xl font-semibold text-gray-900">{availableSeats}</div>
                          </div>
                        </div>

                        {/* Fee Information - Fixed Height */}
                        <div className="grid grid-cols-2 gap-4 h-[50px] mb-3">
                          <div>
                            <div className="text-gray-500 text-xs mb-0.5">Total Fee</div>
                            <div className="text-base font-semibold text-gray-900 truncate">
                              ₹{course.totalFee ? (typeof course.totalFee === 'number' ? course.totalFee.toLocaleString('en-IN') : course.totalFee) : '2,00,000'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-gray-500 text-xs mb-0.5">Semester Fee</div>
                            <div className="text-base font-semibold text-gray-900 truncate">
                              ₹{course.semesterFee ? (typeof course.semesterFee === 'number' ? course.semesterFee.toLocaleString('en-IN') : course.semesterFee) : '33,333'}
                            </div>
                          </div>
                        </div>

                        {/* Active Offer - Dynamic Height with View More */}
                        <div className={`rounded-lg p-3 mb-3 flex flex-col ${hasSpotAdmission ? 'bg-[#FFC383] bg-opacity-10 border border-[#FF8400]' : 'bg-gray-100 border border-gray-200'} ${!expandedOffers[course._id || index] ? 'h-[68px] justify-center' : ''}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-4 h-4 flex-shrink-0 ${hasSpotAdmission ? 'text-orange-600' : 'text-gray-400'}`}>
                              <svg fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13 9h8L11 24v-9H4l9-15v9z"/>
                              </svg>
                            </div>
                            <span className={`font-semibold text-sm ${hasSpotAdmission ? 'text-[#C66803]' : 'text-gray-400'} line-clamp-1`}>
                              {hasSpotAdmission ? 'Active Offer' : 'No Active Offer'}
                            </span>
                          </div>
                          <div className={`font-medium text-sm ${hasSpotAdmission ? 'text-[#FF8400]' : 'text-gray-400'} ${!expandedOffers[course._id || index] ? 'line-clamp-1' : ''}`}>
                            {hasSpotAdmission ? (
                              <>Spot Price: ₹{course.specialOffers?.spotAdmission?.fee ? (typeof course.specialOffers.spotAdmission.fee === 'number' ? course.specialOffers.spotAdmission.fee.toLocaleString('en-IN') : course.specialOffers.spotAdmission.fee) : '50,000'} ({course.specialOffers?.spotAdmission?.seats || 20} left)</>
                            ) : (
                              'Configure spot admission offer in course settings'
                            )}
                          </div>
                          {(hasSpotAdmission || !hasSpotAdmission) && (course.specialOffers?.spotAdmission?.fee || !hasSpotAdmission) && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setExpandedOffers(prev => ({ ...prev, [course._id || index]: !prev[course._id || index] })); }}
                              className={`text-xs ${hasSpotAdmission ? 'text-[#C66803]' : 'text-gray-400'} hover:underline mt-1 text-left`}
                            >
                              {expandedOffers[course._id || index] ? 'View Less' : 'View More'}
                            </button>
                          )}
                        </div>

                        {/* Scholarship Available - Dynamic Height with View More */}
                        <div className={`rounded-lg p-3 mb-4 flex flex-col ${hasScholarship ? 'bg-[#7DBEFF] bg-opacity-10 border border-[#0377EB]' : 'bg-gray-100 border border-gray-200'} ${!expandedScholarships[course._id || index] ? 'h-[68px] justify-center' : ''}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <svg className={`w-4 h-4 flex-shrink-0 ${hasScholarship ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                            <span className={`font-semibold text-xs ${hasScholarship ? 'text-[#0377EB]' : 'text-gray-400'} line-clamp-1`}>
                              {hasScholarship ? 'Scholarship Available' : 'No Scholarship Configured'}
                            </span>
                          </div>
                          <div className={`font-medium text-xs ${hasScholarship ? 'text-[#0377EB]' : 'text-gray-400'} ${!expandedScholarships[course._id || index] ? 'line-clamp-2' : ''}`}>
                            {hasScholarship ? (
                              <>Up to {course.specialOffers?.meritScholarship?.percent || 25}% off for students with {course.specialOffers?.meritScholarship?.criteria || '85%+ marks'}</>
                            ) : (
                              'Not available at this time'
                            )}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setExpandedScholarships(prev => ({ ...prev, [course._id || index]: !prev[course._id || index] })); }}
                            className={`text-xs ${hasScholarship ? 'text-[#0377EB]' : 'text-gray-400'} hover:underline mt-1 text-left`}
                          >
                            {expandedScholarships[course._id || index] ? 'View Less' : 'View More'}
                          </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4 mt-auto">
                          <button
                            onClick={() => { 
                              setViewingCourse(course); 
                              setShowCourseDetailsModal(true); 
                            }}
                            className="flex-1 px-4 py-2.5 text-base font-medium text-[#1383F3] border border-[#1383F3] rounded-md hover:bg-[#1383F3]/5 transition-colors"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => { 
                              setEditingCourse(course); 
                              setShowCourseModal(true); 
                            }}
                            className="flex-1 px-4 py-2.5 text-base font-medium text-white bg-gradient-to-b from-[#2590FB] to-[#0478EB] rounded-md hover:from-[#2590FB]/90 hover:to-[#0478EB]/90 transition-colors"
                          >
                            Edit Course
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );

      case 'fees':
        return (
          <div className="p-6 sm:p-10 bg-white min-h-screen">
  <div className="max-w-2xl mx-auto text-center py-16">
    {/* Icon Circle */}
    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-100 to-orange-300 flex items-center justify-center shadow-inner">
      <CreditCard className="w-12 h-12 text-orange-600" />
    </div>

    {/* Heading */}
    <h2 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">Pay Fees</h2>

    {/* Tag: Coming Soon */}
    <div className="inline-flex items-center px-4 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium mb-5 shadow-sm">
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      Coming Soon
    </div>

    {/* Description */}
    <p className="text-lg text-gray-600 mb-8">
      We're working hard to bring you a seamless fee payment experience.
    </p>

    {/* Upcoming Features */}
    <div className="text-left bg-gray-50 rounded-xl p-6 sm:p-8 mb-8 border border-gray-100 shadow-sm">
      <h3 className="text-xl font-semibold text-gray-900 mb-5">Upcoming Features:</h3>
      <ul className="space-y-4 text-gray-700">
        {[
          "Online fee payment gateway",
          "Installment payment plans",
          "Automated fee reminders",
          "Digital receipt generation",
        ].map((feature, idx) => (
          <li key={idx} className="flex items-start">
            <svg
              className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>

    {/* Footer Note */}
    <div className="text-sm text-gray-500">
      Stay tuned for updates. We'll notify you when this feature becomes available.
    </div>
  </div>
</div>

        );

      case 'communications':
        return <Communications />;

      case 'interviews':
        return (
          <InterviewManagement
            onScheduleInterview={() => console.log('Schedule interview clicked')}
          />
        );


      case 'placements':
        return (
          <InvitationsConnections
            onInvitationResponse={handleInvitationResponse}
            onConnectionRequest={sendConnectionRequest}
            onJobInvitationRequest={requestJobInvitation}
          />
        );

      default:
        return (
          <div className="p-6">
            <p className="text-gray-600">Content for {activeTab} will be implemented here.</p>
          </div>
        );
    }
  };

  // Course Details Modal Component - copied from profile setup
  const CourseDetailsModal = ({ course, onClose, onEdit }: { course: Course; onClose: () => void; onEdit: () => void }) => {
    const [courseEnrollmentData, setCourseEnrollmentData] = useState<any>(null);
    const [loadingCourseEnrollment, setLoadingCourseEnrollment] = useState(true);

    // Fetch enrollment data when modal opens
    useEffect(() => {
      const fetchEnrollmentData = async () => {
        if (!course?._id) return;
        
        try {
          setLoadingCourseEnrollment(true);
          const token = localStorage.getItem('token');
          if (!token) return;

          const response = await axios.get(
            `${API_BASE_URL}/api/admission-enquiries/course/${course._id}/enrollment`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );

          if (response.data.success) {
            setCourseEnrollmentData(response.data.data);
          }
        } catch (error) {
          console.error('Error fetching enrollment data:', error);
          // Use fallback data if API fails
          setCourseEnrollmentData({
            enrolledStudents: course.enrolledStudents || 0,
            totalSeats: course.numberOfSeats || 0,
            fillPercentage: 0
          });
        } finally {
          setLoadingCourseEnrollment(false);
        }
      };

      fetchEnrollmentData();
    }, [course?._id]);

    if (!course) return null;

    // Helpers and computed values for details UI
    const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
    const toNum = (v: any) => (v === '' || v === undefined || v === null) ? undefined : Number(v);
    const money = (v: any) => (toNum(v) ?? 0).toLocaleString('en-IN');
    
    // Use real enrollment data from API or fallback
    const seats = courseEnrollmentData?.totalSeats || toNum(course.numberOfSeats) || 0;
    const enrolled = courseEnrollmentData?.enrolledStudents || 0;
    const fillPct = courseEnrollmentData?.fillPercentage || (seats > 0 ? Math.min(100, Math.round((enrolled / seats) * 100)) : 0);
    
    const earlyEnabled = !!course.specialOffers?.earlyBird?.enabled;
    const earlyDiscount = toNum(course.specialOffers?.earlyBird?.discount) ?? 0;
    const earlyUntil = course.specialOffers?.earlyBird?.validUntil ? new Date(course.specialOffers.earlyBird.validUntil as any).toLocaleDateString('en-GB') : '';
    const spotEnabled = !!course.specialOffers?.spotAdmission?.enabled;
    const spotFee = toNum(course.specialOffers?.spotAdmission?.fee) ?? 0;
    const spotSeats = toNum(course.specialOffers?.spotAdmission?.seats) ?? 0;
    const meritEnabled = !!course.specialOffers?.meritScholarship?.enabled;
    const meritPercent = toNum(course.specialOffers?.meritScholarship?.percent) ?? 0;
    const meritCriteria = course.specialOffers?.meritScholarship?.criteria || '';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-gray-900 mb-1">
                {course.name}
              </h2>
              {/* Show stream type below course name */}
              {course.streamType && (
                <p className="text-2xl font-medium text-[#0A0A0A] opacity-50 mb-2">{course.streamType}</p>
              )}
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <span className="font-medium">{course.code || 'BCA'}</span>
                <span>•</span>
                <span>{course.category ? course.category.charAt(0).toUpperCase() + course.category.slice(1) : 'Undergraduate'}</span>
                <span>•</span>
                <span>{course.duration} months</span>
                <span>•</span>
                <span>{course.accreditation ? course.accreditation.split('-').map(w => w.charAt(0).toUpperCase()+w.slice(1)).join(' ') : 'UGC Approved'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 ml-4">
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                Active
              </span>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
          </div>

          {/* Two Column Layout with 5 Containers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="flex flex-col space-y-6">
              {/* Container 1: Course Information */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Course Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Description:</div>
                    <div className="text-gray-900">{course.description || 'Comprehensive program covering programming, web development, and software engineering.'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Eligibility:</div>
                    <div className="text-gray-900">{course.eligibilityCriteria || '12th pass with minimum 50% marks'}</div>
                  </div>
                </div>
              </div>

              {/* Container 2: Enrollment Status */}
              <div className="bg-gray-50 rounded-2xl p-6 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Enrollment Status
                </h3>
                <div className="space-y-4">
                  {loadingCourseEnrollment ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="text-sm text-gray-600 mb-2">Current Intake Progress</div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-3">
                            <div className="bg-blue-500 h-3 rounded-full" style={{width: `${fillPct}%`}}></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{enrolled}/{seats}</span>
                        </div>
                        <div className="text-sm text-blue-600 mt-1">{fillPct}% filled</div>
                      </div>
                      
                      {/* Divider line */}
                      <hr className="border-gray-300" />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Total Seats</div>
                          <div className="text-lg font-semibold text-gray-900">{seats}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Enrolled Students</div>
                          <div className="text-lg font-semibold text-gray-900">{enrolled}</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col space-y-6">
              {/* Container 3: Fee Structure */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-5 h-5 mr-2 text-gray-600 flex items-center justify-center font-bold text-lg">₹</div>
                  Fee Structure
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-600">Total Course Fee:</div>
                    <div className="text-sm font-semibold text-gray-900">₹ {course.totalFee ? (typeof course.totalFee === 'number' ? course.totalFee.toLocaleString() : parseInt(course.totalFee).toLocaleString()) : '200000'}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-600">Per Semester Fee:</div>
                    <div className="text-sm font-semibold text-gray-900">₹ {course.semesterFee ? (typeof course.semesterFee === 'number' ? course.semesterFee.toLocaleString() : parseInt(course.semesterFee).toLocaleString()) : '50000'}</div>
                  </div>
                </div>
              </div>

              {/* Container 4: Active Offers */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a1.994 1.994 0 01-1.414.586H7a4 4 0 01-4-4V7a4 4 0 014-4z" />
                  </svg>
                  Active Offers
                  {(earlyEnabled || spotEnabled) && (
                    <span className="ml-auto inline-flex items-center px-3 py-1 bg-gradient-to-r from-pink-500 to-red-500 text-white text-sm font-medium rounded-full">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M13 9h8L11 24v-9H4l9-15v9z"/>
                      </svg>
                      {earlyDiscount}% OFF
                    </span>
                  )}
                </h3>
                <div className="space-y-2 text-sm">
                  {earlyEnabled && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Early Bird Discount</span>
                      <span className="text-gray-600">Valid Until: {earlyUntil || '-'}</span>
                    </div>
                  )}
                  {spotEnabled && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Spot Admission</span>
                      <span className="text-gray-900">₹ {money(spotFee)} • Seats {spotSeats}</span>
                    </div>
                  )}
                  {!earlyEnabled && !spotEnabled && (
                    <div className="text-gray-500">No active offers</div>
                  )}
                </div>
              </div>

              {/* Container 5: Scholarship Available */}
              <div className="bg-gray-50 rounded-2xl p-6 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Scholarship Available
                </h3>
                {meritEnabled ? (
                  <div className="space-y-3 text-sm">
                    <div className="text-gray-700">Merit Scholarship: <span className="text-gray-900">Available for students with {meritCriteria}</span></div>
                    
                    <div>
                      <span className="inline-block px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-full">{meritPercent}% OFF</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm">
                    <div className="text-gray-500">No scholarship configured</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex justify-end mt-6">
            <button
              onClick={onEdit}
              className="flex items-center px-4 py-2 text-[#0270DF] border border-blue-600 rounded-lg hover:bg-blue-50 text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white flex flex-col">
      {/* Full Width Navbar */}
      <CollegeRegistrationNavbar 
        collegeName={collegeInfo?.name} 
        status={collegeInfo?.approvalStatus as 'pending' | 'approved' | 'rejected'}
        userRole="college"
      />

      <div className="flex flex-1 w-full overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 flex-none bg-white border-r border-gray-200">
            {/* Navigation Items */}
            <div className="px-3 py-6">
              <nav className="space-y-2">
              <button
                onClick={() => handleTabChange('overview')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  activeTab === 'overview'
                    ? 'bg-[#0270DF] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Home className="mr-3 h-5 w-5" />
                Dashboard
              </button>

              <button
                onClick={() => handleTabChange('students')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  activeTab === 'students'
                    ? 'bg-[#0270DF] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Users className="mr-3 h-5 w-5" />
                Admission Enquiries
              </button>

              <button
                onClick={() => handleTabChange('placements')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  activeTab === 'placements'
                    ? 'bg-[#0270DF] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Building2 className="mr-3 h-5 w-5" />
                Connect Companies
              </button>

              <button
                onClick={() => handleTabChange('connections')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  activeTab === 'connections'
                    ? 'bg-[#0270DF] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Briefcase className="mr-3 h-5 w-5" />
                Hiring Companies
              </button>

              <button
                onClick={() => handleTabChange('database')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  activeTab === 'database'
                    ? 'bg-[#0270DF] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Server className="mr-3 h-5 w-5" />
                Student Database
              </button>

              <button
                onClick={() => handleTabChange('courses')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  activeTab === 'courses'
                    ? 'bg-[#0270DF] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Book className="mr-3 h-5 w-5" />
                Courses
              </button>

              <button
                onClick={() => handleTabChange('interviews')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  activeTab === 'interviews'
                    ? 'bg-[#0270DF] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <CalendarCheck className="mr-3 h-5 w-5" />
                Interviews
              </button>

              <button
                onClick={() => handleTabChange('fees')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  activeTab === 'fees'
                    ? 'bg-[#0270DF] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <CreditCard className="mr-3 h-5 w-5" />
                Collect Fees
              </button>

              <button 
                onClick={() => handleTabChange('communications')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  activeTab === 'communications'
                    ? 'bg-[#0270DF] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <MessageSquare className="mr-3 h-5 w-5" />
                Communications
              </button>
              </nav>

              {/* Today's Summary */}
              <div className="mt-6">
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="text-lg font-medium text-black mb-4">Today's Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Enquiries</span>
                      <span className="bg-blue-100 border border-blue-300 text-blue-600 text-sm px-2 py-1 rounded-lg">234</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Interviews</span>
                      <span className="bg-orange-100 border border-orange-300 text-orange-600 text-sm px-2 py-1 rounded-lg">24</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Job Invitations</span>
                      <span className="bg-green-100 border border-green-400 text-green-600 text-sm px-2 py-1 rounded-lg">18</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          {/* Logout */}
          <div className="px-3 pb-4 border-t border-gray-200">
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                router.push('/login');
              }}
              className="w-full flex items-center px-4 py-3 mt-4 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50"
            >
              <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </aside> 

{/* Main Content */}
        <main className="flex-1 min-w-0 overflow-x-hidden">
           {/* Page Header - Hide for interviews tab, database tab, and when viewing company details */}
{activeTab !== 'interviews' && activeTab !== 'database' && !(activeTab === 'connections' && selectedViewCompany) && getPageHeader(activeTab) && (
            <div className="bg-white px-8 py-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-semibold">
                    {renderColoredTitle(getPageHeader(activeTab).title)}
                  </h1>
                  <p className="text-gray-600 text-sm mt-1">{getPageHeader(activeTab).subtitle}</p>
                </div>
                <div className="flex items-center space-x-4">
                  {/* Global Search Bar */}
                  {/* <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search anything..."
                      className="block w-80 pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      onChange={(e) => {
                        // Global search functionality will be implemented here
                        console.log('Global search:', e.target.value);
                      }}
                    />
                  </div> */}
 {activeTab === 'courses' ? (
                    <button 
                      onClick={() => window.location.href = '/profile/setup?tab=courses'}
                      className="flex items-center space-x-2 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white px-4 py-2 rounded-md text-sm hover:from-[#0377EB] hover:to-[#2791FC] transition-all"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Add Course</span>
                    </button>
                  ) : activeTab === 'database' ? null : (
                    <button 
                      onClick={refreshData}
                      className="flex items-center space-x-2 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white px-4 py-2 rounded-md text-sm hover:from-[#0377EB] hover:to-[#2791FC] transition-all"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Refresh</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 bg-white">
            {renderTabContent()}
          </div>
        </main>
      </div>

      {/* Course Details Modal */}
      {showCourseDetailsModal && viewingCourse && (
        <CourseDetailsModal 
          course={viewingCourse} 
          onClose={() => {
            setShowCourseDetailsModal(false);
            setViewingCourse(null);
          }}
          onEdit={() => {
            setEditingCourse(viewingCourse);
            setShowCourseDetailsModal(false);
            setViewingCourse(null);
            setShowCourseModal(true);
          }}
        />
      )}

      {/* Course Edit/Add Modal - Full editing experience */}
      {showCourseModal && (
        <CourseEditModal
          course={editingCourse}
          onSave={async (courseData) => {
            try {
              const token = localStorage.getItem('token');
              if (editingCourse && editingCourse._id) {
                // Update existing course
                await axios.put(
                  `${API_BASE_URL}/api/courses/${editingCourse._id}`,
                  courseData,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
              } else {
                // Create new course
                await axios.post(
                  `${API_BASE_URL}/api/courses`,
                  courseData,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
              }
              
              // Reload courses data
              if (collegeInfo) {
                await loadTabData('courses', collegeInfo._id);
              }
              
              setShowCourseModal(false);
              setEditingCourse(null);
            } catch (error) {
              console.error('Error saving course:', error);
              alert('Failed to save course. Please try again.');
            }
          }}
          onClose={() => {
            setShowCourseModal(false);
            setEditingCourse(null);
          }}
          saving={false}
        />
      )}
    </div>
  );
};

// Wrap the component with ProtectedRoute
export default function CollegeDashboardPage() {
  return (
    <ProtectedRoute requireApproval={true} allowedRoles={['college']}>
      <CollegeDashboard />
    </ProtectedRoute>
  );
}
