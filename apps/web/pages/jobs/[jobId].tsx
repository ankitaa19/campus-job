'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { API_BASE_URL } from '../../utils/api';
import { Briefcase, MapPin, Clock, Globe2 } from 'lucide-react';
import Image from 'next/image';

interface JobDetails {
  _id: string;
  title: string;
  companyName: string;
  companyLogo?: string;
  companyBanner?: string;
  companyAbout?: string;
  locations: Array<{
    city: string;
    state: string;
    country: string;
  }>;
  workMode: string;
  jobType: string;
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  postedAt: string;
  experienceLevel: string;
  educationQualification: string;
  compensationType: string;
  contractDuration?: string;
  paymentStructure?: string;
  numberOfOpenings: number;
  description: string;
  skills?: string[];
  benefits?: Array<{ text: string; enabled: boolean }>;
  dailyTimings?: string;
  preferredWorkingDays?: string[];
  workSchedule?: string;
  hoursPerSession?: string;
  gigType?: string;
  commitmentLevel?: string;
  internshipDuration?: string;
  certificateProvided?: string;
  conversionPossibility?: string;
  noticePeriod?: string;
  extensionPossibility?: string;
  specialRequirements?: string;
}

// Dummy job data that matches the 6 job listings
const getDummyJobData = (id: string): JobDetails | null => {
  const dummyJobs: { [key: string]: JobDetails } = {
    '1': {
      _id: '1',
      title: 'Software Developer',
      companyName: 'TechFront',
      companyLogo: '/company-logos/techfront.png',
      companyBanner: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
      companyAbout: 'Deal Jobs is Indonesia\'s largest job portal & mentoring platform. We help people easily find jobs to top Indonesian companies for internship and full-time roles. As you might have already heard about us, we are revolutionizing how Indonesian engage with employers. Many Indonesian students are talented, ambitious, but never found a better opportunity for themselves.',
      locations: [{ city: 'Karnataka', state: 'Bangalore', country: 'India' }],
      workMode: 'Remote',
      jobType: 'internship',
      salary: { min: 2000, max: 15000, currency: 'INR' },
      postedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      experienceLevel: 'Fresher',
      educationQualification: 'Graduate',
      internshipDuration: '3 months',
      certificateProvided: 'Internship Certificate',
      compensationType: 'Unpaid',
      conversionPossibility: 'Yes - Performance Based',
      numberOfOpenings: 1,
      description: `<strong>What You'll Do</strong>
• Design the systems for scale with high availability and reliability.
• Identify the chocking points in the current system; suggest; own and deliver the System enhancements as a part of Tech initiatives.
• Performance analysis and improvements.
• Collaborate with Engineering Manager, Team members, Product Manager and other stakeholders, as may be required
• Raise the bar on Engineering quality and speed.
• Show high accountability and ownership.
• Mentor and guide team members.

<strong>Who You Are</strong>
Significant Backend and (4 years) experience: designing, building and maintaining enterprise web applications and/or APIs with the following technologies:

Will be nice to have experience and knowledge also in the following two:
• Kubernetes
• Transform
• Mongo
• Familiarity with modern DevOps techniques: CI/CD, TDD, infrastructure as code (IAC), etc.
• High accountability and ownership.
• We uphold our values and set aside personal ego in the workplace. We expect the same commitment from our employees.
• High proficiency with relational databases and ability to profile and optimize queries.
• Production experience with Django Rest Framework, Restful, or other API framework.
• Experience working closely with the product team to help prioritize the best solutions to the largest problems.
• Experience designing and architecting distributed systems to meet high standards of reliability and ease of use
• Attention to detail and ability to identify ambiguities in specifications.
• Experience in tech-mentoring/motivating colleagues; understanding if they need any help from you in technical and non-technical aspects; being available for them and being a good communicator when interacting with them and helping when required.
• Able to effectively communicate ideas and concepts; within your team, across teams, and throughout the organization; even with non-technical audience, in both written and verbal forms.
• Experience designing and managing distributed systems working closely to meet high standards of reliability and ease of use
• Eagerness to work in a cross-functional team to help build end-to-end features`,
      skills: ['React', 'Node.js', 'SQL', 'MongoDB', 'HTML', 'CSS', 'Java', 'JavaScript'],
      benefits: [
        { text: 'Professional development budget', enabled: true },
        { text: 'Free Food and Snack', enabled: true },
        { text: 'International Exposure', enabled: true },
        { text: 'Health insurance', enabled: true },
        { text: 'Flexible working hours', enabled: true },
        { text: 'Casual Dress Code', enabled: true },
        { text: 'Stocks options', enabled: true }
      ]
    },
    '2': {
      _id: '2',
      title: 'Software Developer',
      companyName: 'Wiseck',
      companyLogo: '/company-logos/wiseck.png',
      companyBanner: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
      companyAbout: 'Wiseck is a leading technology company focused on delivering innovative software solutions. We pride ourselves on our collaborative culture and commitment to excellence.',
      locations: [{ city: 'New Delhi', state: 'Delhi', country: 'India' }],
      workMode: 'Remote',
      jobType: 'full-time',
      salary: { min: 40000, max: 42000, currency: 'INR' },
      postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      experienceLevel: '2 years',
      educationQualification: 'Graduate',
      compensationType: 'Paid',
      noticePeriod: 'Immediate Joiner',
      numberOfOpenings: 1,
      description: `<strong>What You'll Do</strong>
• Develop and maintain high-quality software solutions
• Collaborate with cross-functional teams to define and implement features
• Write clean, maintainable code following best practices
• Participate in code reviews and knowledge sharing sessions
• Contribute to architectural decisions and technical planning

<strong>Who You Are</strong>
• Bachelor's degree in Computer Science or related field
• 2-4 years of professional software development experience
• Strong problem-solving skills and attention to detail
• Excellent communication and teamwork abilities
• Experience with Agile development methodologies`,
      skills: ['React', 'Node.js', 'SQL', 'MongoDB', 'HTML', 'CSS', 'Java', 'JavaScript'],
      benefits: [
        { text: 'Professional development budget', enabled: true },
        { text: 'Free Food and Snack', enabled: true },
        { text: 'International Exposure', enabled: true },
        { text: 'Health insurance', enabled: true },
        { text: 'Flexible working hours', enabled: true },
        { text: 'Casual Dress Code', enabled: true },
        { text: 'Stocks options', enabled: true }
      ]
    },
    '3': {
      _id: '3',
      title: 'Software Developer',
      companyName: 'Mind Inc.',
      companyLogo: '/company-logos/mind-inc.png',
      companyBanner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
      companyAbout: 'Mind Inc. is a creative technology studio that builds innovative digital products. We offer flexible work arrangements and value work-life balance.',
      locations: [{ city: 'Mumbai', state: 'Maharashtra', country: 'India' }],
      workMode: 'Remote',
      jobType: 'freelance',
      salary: { min: 5000, max: 0, currency: 'INR' },
      postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      experienceLevel: '0-2 years',
      educationQualification: 'Graduate',
      compensationType: 'Freelance Jobs',
      numberOfOpenings: 1,
      contractDuration: 'Short Term',
      paymentStructure: 'Monthly',
      extensionPossibility: 'Yes - Performance Based',
      description: `<strong>What You'll Do</strong>
• Work on exciting freelance projects for diverse clients
• Develop custom software solutions based on project requirements
• Manage your own schedule and deliverables
• Maintain high quality standards and meet project deadlines
• Communicate effectively with clients and project stakeholders

<strong>Who You Are</strong>
• 2+ years of freelance or professional development experience
• Self-motivated and able to work independently
• Strong time management and organizational skills
• Experience with modern web technologies
• Portfolio of completed projects`,
      skills: ['React', 'Node.js', 'SQL', 'MongoDB', 'HTML', 'CSS', 'Java', 'JavaScript'],
      benefits: [
        { text: 'Professional development budget', enabled: true },
        { text: 'Free Food and Snack', enabled: true },
        { text: 'International Exposure', enabled: true },
        { text: 'Health insurance', enabled: true },
        { text: 'Flexible working hours', enabled: true },
        { text: 'Casual Dress Code', enabled: true },
        { text: 'Stocks options', enabled: true }
      ]
    },
    '4': {
      _id: '4',
      title: 'Software Developer',
      companyName: 'Demo Company',
      companyLogo: '/company-logos/demo.png',
      companyBanner: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80',
      companyAbout: 'Demo Company is a fast-growing startup focused on innovative technology solutions. We offer a collaborative environment perfect for career growth.',
      locations: [{ city: 'Uttar Pradesh', state: 'Noida', country: 'India' }],
      workMode: 'On-site',
      jobType: 'full-time',
      salary: { min: 40000, max: 42000, currency: 'INR' },
      postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      experienceLevel: '0-2 years',
      educationQualification: 'Graduate',
      compensationType: 'Full-Time',
      noticePeriod: 'Immediate Joiner',
      numberOfOpenings: 1,
      description: `<strong>What You'll Do</strong>
• Learn and grow in a supportive team environment
• Contribute to real-world projects from day one
• Participate in training and mentorship programs
• Develop skills in modern software development practices
• Work on exciting new features and products

<strong>Who You Are</strong>
• Recent graduate or early career professional
• Strong foundation in computer science fundamentals
• Eager to learn and adapt to new technologies
• Good problem-solving abilities
• Team player with excellent communication skills`,
      skills: ['React', 'Node.js', 'SQL', 'MongoDB', 'HTML', 'CSS', 'Java', 'JavaScript'],
      benefits: [
        { text: 'Professional development budget', enabled: true },
        { text: 'Free Food and Snack', enabled: true },
        { text: 'International Exposure', enabled: true },
        { text: 'Health insurance', enabled: true },
        { text: 'Flexible working hours', enabled: true },
        { text: 'Casual Dress Code', enabled: true },
        { text: 'Stocks options', enabled: true }
      ]
    },
    '5': {
      _id: '5',
      title: 'Software Developer',
      companyName: 'Fintech',
      companyLogo: '/company-logos/fintech.png',
      companyBanner: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
      companyAbout: 'Fintech is revolutionizing the financial services industry with cutting-edge technology. Join our team of innovators shaping the future of finance.',
      locations: [{ city: 'Uttar Pradesh', state: 'Noida', country: 'India' }],
      workMode: 'Remote',
      jobType: 'part-time',
      salary: { min: 8000, max: 15000, currency: 'INR' },
      postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      experienceLevel: '0-2 years',
      educationQualification: 'Graduate',
      compensationType: 'Monthly Salary',
      dailyTimings: 'Morning Shifts (9 AM - 12 PM)',
      preferredWorkingDays: ['Yes - Performance Based'],
      numberOfOpenings: 1,
      description: `<strong>What You'll Do</strong>
• Work on critical financial technology systems part-time
• Maintain high code quality and security standards
• Collaborate with full-time team members on key projects
• Flexible schedule aligned with your availability
• Contribute your expertise to important initiatives

<strong>Who You Are</strong>
• 5+ years of professional software development experience
• Experience in financial services or fintech preferred
• Strong understanding of security best practices
• Ability to work independently with minimal supervision
• Excellent time management skills`,
      skills: ['React', 'Node.js', 'SQL', 'MongoDB', 'HTML', 'CSS', 'Java', 'JavaScript'],
      benefits: [
        { text: 'Professional development budget', enabled: true },
        { text: 'Free Food and Snack', enabled: true },
        { text: 'International Exposure', enabled: true },
        { text: 'Health insurance', enabled: true },
        { text: 'Flexible working hours', enabled: true },
        { text: 'Casual Dress Code', enabled: true },
        { text: 'Stocks options', enabled: true }
      ]
    },
    '6': {
      _id: '6',
      title: 'Software Developer',
      companyName: 'Miller Group',
      companyLogo: '/company-logos/miller.png',
      companyBanner: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
      companyAbout: 'Miller Group offers flexible gig opportunities for talented developers. Work on your own terms and choose projects that match your interests.',
      locations: [{ city: 'Karnataka', state: 'Bangalore', country: 'India' }],
      workMode: 'Remote',
      jobType: 'contract',
      salary: { min: 600, max: 0, currency: 'INR' },
      postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      experienceLevel: '0-2 years',
      educationQualification: 'Gig Type',
      compensationType: 'One-time Gig',
      workSchedule: 'Morning Shifts (9 AM - 12 PM)',
      numberOfOpenings: 1,
      dailyTimings: 'Morning (9AM-PM)',
      preferredWorkingDays: ['Mon, Tue, Wed, Fri'],
      hoursPerSession: '2 hours/session',
      paymentStructure: 'Hourly Rate',
      gigType: 'Delivery & Logistics',
      commitmentLevel: 'One-time Gig',
      specialRequirements: 'Lorem ipsum dolor sit amet consecte adipisicing elit sed do eiusmod tempor incididunt ut labore ut aliqure.',
      description: `<strong>What You'll Do</strong>
• Take on flexible gig assignments as per your availability
• Deliver high-quality work on time
• Work independently on well-defined tasks
• Build your portfolio with diverse projects
• Enjoy the freedom of gig-based work

<strong>Who You Are</strong>
• Self-starter with proven track record
• Experience in relevant technologies
• Strong time management skills
• Reliable and professional
• Comfortable with remote work`,
      skills: ['React', 'Node.js', 'SQL', 'MongoDB', 'HTML', 'CSS', 'Java', 'JavaScript'],
      benefits: [
        { text: 'Professional development budget', enabled: true },
        { text: 'Free Food and Snack', enabled: true },
        { text: 'International Exposure', enabled: true },
        { text: 'Health insurance', enabled: true },
        { text: 'Flexible working hours', enabled: true },
        { text: 'Casual Dress Code', enabled: true },
        { text: 'Stocks options', enabled: true }
      ]
    }
  };

  return dummyJobs[id] || null;
};

export default function JobDetailsPage() {
  const router = useRouter();
  const { jobId } = router.query;
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    const fetchJobDetails = async () => {
      try {
        // Try to fetch from API
        const response = await axios.get(`${API_BASE_URL}/api/jobs/${jobId}`);
        setJob(response.data);
      } catch (error) {
        // Fall back to dummy data
        const dummyJob = getDummyJobData(jobId as string);
        if (dummyJob) {
          setJob(dummyJob);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId]);

  // Toggle save job
  const toggleSaveJob = () => {
    setIsSaved(!isSaved);
    // Here you can add localStorage or API call to persist the saved state
    // localStorage.setItem(`saved-job-${jobId}`, JSON.stringify(!isSaved));
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </>
    );
  }

  if (!job) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Job not found</h1>
            <button
              onClick={() => router.push('/jobs')}
              className="text-blue-600 hover:text-blue-700"
            >
              Back to Jobs
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) return `${Math.max(diffInMinutes, 1)} mins ago`;
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return `${Math.floor(diffInDays / 7)} weeks ago`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getJobTypeLabel = (type: string) => {
    switch (type) {
      case 'internship':
        return 'Internship';
      case 'full-time':
        return 'Full-Time';
      case 'part-time':
        return 'Part-Time';
      case 'freelance':
        return 'Freelance Jobs';
      case 'contract':
        return 'Gig/Flexible';
      default:
        return type;
    }
  };

  const infoFields = [
    { label: 'Experience', value: job.experienceLevel },
    { label: 'Educational Qualification', value: job.educationQualification },
    { label: 'Job Type', value: getJobTypeLabel(job.jobType) },
    { label: 'Work Mode', value: job.workMode },
    { label: 'Internship Duration', value: job.internshipDuration },
    { label: 'Certificate Provided', value: job.certificateProvided },
    { label: 'Compensation Type', value: job.compensationType },
    { label: 'Conversion Possibility', value: job.conversionPossibility },
    { label: 'Contract Duration', value: job.contractDuration },
    { label: 'Payment Structure', value: job.paymentStructure },
    { label: 'Number of Openings', value: job.numberOfOpenings ? job.numberOfOpenings.toString() : '' },
    { label: 'Daily Timings', value: job.dailyTimings },
    { label: 'Work Schedule', value: job.workSchedule },
    { label: 'Preferred Working Days', value: job.preferredWorkingDays && job.preferredWorkingDays.length > 0 ? job.preferredWorkingDays.join(', ') : '' },
    { label: 'Hours Per Session', value: job.hoursPerSession },
    { label: 'Gig Type', value: job.gigType },
    { label: 'Commitment Level', value: job.commitmentLevel },
    { label: 'Extension Possibility', value: job.extensionPossibility },
    { label: 'Notice Period', value: job.noticePeriod },
  ].filter((field) => field.value);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white">
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0d6bf2] to-[#2694f7] text-white" style={{ height: '433.85px' }}>
          <div className="absolute inset-0">
            <div className="absolute w-64 h-64 bg-white/10 rounded-full blur-3xl -right-10 top-6" />
            <div className="absolute w-40 h-40 bg-white/5 rounded-full blur-3xl left-16 -bottom-10" />
          </div>
          <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-24">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Want to join our dynamic team!</h1>
            <p className="text-white/80 max-w-2xl">Apply fast if your skills matches with our requirements.</p>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-8 relative -mt-40 z-10 pb-12">
          <div className="bg-white border border-[#1484F3] rounded-2xl shadow-md p-6 md:p-8 mb-8">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="w-full lg:w-48 h-60 relative rounded-xl overflow-hidden bg-[#f2f6ff]">
                <Image
                  src={job.companyBanner || '/3d2477bcc3a4ad8e4862577ce5caea7c9cd0c79f.png'}
                  alt={job.companyName}
                  fill
                  sizes="(min-width: 1024px) 12rem, 100vw"
                  className="object-cover"
                />
              </div>

              <div className="flex-1 min-w-0 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#e7f2ff] text-[#1484F3]">
                    {getTimeAgo(job.postedAt)}
                  </span>
                  <div className="flex gap-2">
                    <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50" aria-label="Company website">
                      <Globe2 className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
                    </button>
                    <button 
                      onClick={toggleSaveJob}
                      className={`p-2 border rounded-lg transition-colors ${
                        isSaved 
                          ? 'bg-[#1484F3] border-[#1484F3] text-white' 
                          : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                      }`}
                      aria-label="Bookmark job"
                    >
                      <svg 
                        className="w-5 h-5" 
                        fill={isSaved ? 'currentColor' : 'none'} 
                        stroke="currentColor" 
                        viewBox="0 0 24 24" 
                        strokeWidth={1.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-gray-900 mt-1">{job.title}</h2>
                  <p className="text-lg text-gray-600">{job.companyName}</p>
                  {job.companyAbout && (
                    <p className="text-gray-700 leading-relaxed">
                      {job.companyAbout}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-6 text-base text-gray-700">
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-5 h-5 text-[#1484F3]" />
                    {getJobTypeLabel(job.jobType)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-5 h-5 text-[#1484F3]" />
                    {formatDate(job.postedAt)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-[#1484F3] font-semibold">₹</span>
                    <span className="text-gray-800">
                      {job.salary.max > 0 ? `${job.salary.min.toLocaleString()} - ₹${job.salary.max.toLocaleString()}` : `${job.salary.min.toLocaleString()}/hour`}
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-5 h-5 text-[#1484F3]" />
                    {job.locations[0]?.city}, {job.locations[0]?.state}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e1ecfb] rounded-xl p-5 mb-6">
            <div className="border border-gray-200 rounded-lg inline-block">
              <button
                className="px-4 py-2 rounded-lg font-semibold bg-[#1383F3] text-white"
              >
                About
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#e1ecfb] rounded-xl p-5 mb-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {infoFields.map((field) => (
                <div key={field.label} className="space-y-1">
                  <p className="text-sm text-gray-600">{field.label}</p>
                  <p className="font-semibold text-gray-900">{field.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6 md:space-y-8">
            <div className="bg-white border border-[#e1ecfb] rounded-xl p-5 space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Job Description:</h3>
              <div
                className="prose max-w-none text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: job.description.replace(/\n/g, '<br/>') }}
              />
              {job.specialRequirements && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Special Requirements:</h4>
                  <div className="bg-[#f0f5ff] text-gray-800 rounded-lg p-4 leading-relaxed">
                    {job.specialRequirements}
                  </div>
                </div>
              )}
            </div>

            {job.skills && job.skills.length > 0 && (
              <div className="bg-white border border-[#e1ecfb] rounded-xl p-5 space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">Skills:</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {job.benefits && job.benefits.length > 0 && (
              <div className="bg-[#f7f9f6] border border-[#e1ecfb] rounded-xl p-5 space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">Benefits &amp; Perks:</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {job.benefits.map((benefit, index) => (
                    <div key={index} className="text-gray-800 border border-[#e5edfb] rounded-lg px-4 py-2 bg-white text-sm font-medium">
                      {typeof benefit === 'string' ? benefit : benefit.text}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <button className="w-full md:w-auto bg-[#1484F3] hover:bg-[#0d6edb] text-white font-semibold py-3 px-10 rounded-lg transition-colors">
                Apply Job
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
