import { useRouter } from 'next/router';
import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:5001';

function normalizeInvitation(raw) {
  if (!raw) return null;

  console.log('Normalizing invitation data:', raw); // Debug log

  // The invitation data structure from API
  const inv = raw;

  // Job info from populated jobId field
  const job = inv?.jobId || inv?.job || {};
  
  // Company info from populated recruiterId field  
  const recruiter = inv?.recruiterId || inv?.recruiter || {};
  const companyInfo = recruiter?.companyInfo || {};
  
  // College info from populated collegeId field
  const college = inv?.collegeId || inv?.college || {};

  // Profile info for contact person
  const profile = recruiter?.profile || recruiter?.user || {};

  // Student info (may not exist for college invitations)
  const student = inv?.student || null;

  // Job details
  const jobTitle = job?.title || 'Not specified';
  const jobDescription = job?.description || 'No description provided';
  const jobRequirements = job?.requirements || [];
  const companyName = job?.companyName || companyInfo?.companyName || companyInfo?.name || 'Not specified';

  // Salary information
  const salary = job?.salary || job?.compensation || null;

  // Location information
  const location = job?.location || job?.locations?.[0]?.city || 'Not specified';

  // Job type and experience
  const jobType = job?.type || 'Not specified';
  const experience = job?.experience || 'Not specified';

  // Dates
  const sentAt = inv?.sentAt || inv?.createdAt || null;
  const expiresAt = inv?.expiresAt || inv?.validTill || null;
  const respondedAt = inv?.respondedAt || inv?.updatedAt || null;

  // Proposed campus visit dates
  const proposedDates = inv?.proposedDates || inv?.campusVisitDates || [];

  // Application deadline
  const applicationDeadline = job?.applicationDeadline || inv?.applicationDeadline || null;

  // Invitation message
  const invitationMessage = inv?.invitationMessage || inv?.message || 'No message provided';

  // Negotiation history
  const negotiationHistory = inv?.negotiationHistory || [];

  // Campus visit window
  const campusVisitWindow = inv?.campusVisitWindow || null;

  // TPO response
  const tpoResponse = inv?.tpoResponse || null;

  return {
    id: inv?._id || inv?.id,
    status,
    sentAt,
    expiresAt,
    respondedAt,
    invitationMessage,
    proposedDates,
    campusVisitWindow,
    tpoResponse,
    negotiationHistory,
    job: {
      id: job?._id || job?.id,
      title: jobTitle,
      description: jobDescription,
      requirements: jobRequirements,
      companyName,
      salary,
      location,
      type: jobType,
      experience,
      applicationDeadline
    },
    company: {
      id: recruiter?._id || recruiter?.id,
      name: companyName,
      industry: companyInfo?.industry || 'Not specified',
      location: companyInfo?.location || companyInfo?.headquarters?.city || 'Not specified',
      size: companyInfo?.size || 'Not specified',
      description: companyInfo?.description || 'No description provided'
    },
    recruiter: {
      id: recruiter?._id || recruiter?.id,
      name: profile?.firstName && profile?.lastName 
        ? `${profile.firstName} ${profile.lastName}` 
        : profile?.name || 'Not specified',
      designation: profile?.designation || 'Not specified',
      email: profile?.email || recruiter?.email || 'Not provided',
      phone: profile?.phone || 'Not provided'
    },
    college: {
      id: college?._id || college?.id,
      name: college?.name || 'Not specified',
      shortName: college?.shortName || 'NULL',
      location: college?.location?.city || college?.location || 'Not specified'
    },
    student: student ? {
      id: student._id || student.id,
      name: student.name || 'Not specified',
      course: student.course || 'Not specified',
      year: student.year || 'Not specified',
      email: student.email || 'Not provided'
    } : null
  };
}



const InvitationDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchInvitation = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
          router.push('/login');
          return;
        }

        const res = await axios.get(`${API_BASE}/api/invitations/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('Raw API response:', res.data); // Debug log
        
        // Extract invitation data from API response structure
        const invitationData = res.data?.data?.invitation || res.data?.invitation || res.data;
        const normalized = normalizeInvitation(invitationData);
        if (normalized) {
          setInvitation(normalized);
        } else {
          setError('Invitation not found');
        }
      } catch (err) {
        console.error('Error fetching invitation:', err);
        setError('Failed to load invitation details');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [id, router]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Not provided';
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading invitation details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-lg">{error}</div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Invitation not found</div>
      </div>
    );
  }

  const statusBadge =
    invitation.status === 'pending'
      ? 'bg-yellow-100 text-yellow-800'
      : invitation.status === 'accepted'
      ? 'bg-green-100 text-green-800'
      : invitation.status === 'declined'
      ? 'bg-red-100 text-red-800'
      : 'bg-gray-100 text-gray-800';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Job Invitation Details</h1>
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                    invitation.status === 'pending' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : invitation.status === 'accepted'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      invitation.status === 'pending' ? 'bg-yellow-500' : 
                      invitation.status === 'accepted' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    {String(invitation.status || 'PENDING').toUpperCase()}
                  </span>
                  <span className="text-blue-100 text-sm font-medium">
                    ID: {invitation.id?.substring(0, 8)}...
                  </span>
                </div>
              </div>
              <button 
                onClick={() => router.back()}
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Job Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Job Information */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-8 py-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="bg-blue-100 p-2 rounded-lg mr-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                    </svg>
                  </div>
                  Job Information
                </h2>
              </div>
              <div className="p-8">
                <div className="mb-8">
                  <h3 className="text-3xl font-bold text-gray-900 mb-3">
                    {invitation.job?.title || 'Full Stack Developer'}
                  </h3>
                  <p className="text-xl text-blue-600 font-semibold mb-4">
                    {invitation.job?.companyName || 'Technology Innovation Ltd'}
                  </p>
                  
                  {invitation.job?.description && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01 2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Job Description
                      </h4>
                      <p className="text-gray-700 leading-relaxed text-base">
                        {invitation.job.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Job Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center mb-3">
                      <div className="bg-blue-500 p-2 rounded-lg mr-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span className="font-bold text-gray-900">Location</span>
                    </div>
                    <p className="text-gray-700 font-medium">{invitation.job?.location || 'Bengaluru, Karnataka'}</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center mb-3">
                      <div className="bg-green-500 p-2 rounded-lg mr-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                        </svg>
                      </div>
                      <span className="font-bold text-gray-900">Job Type</span>
                    </div>
                    <p className="text-gray-700 font-medium">{invitation.job?.type || 'Full-time'}</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-center mb-3">
                      <div className="bg-purple-500 p-2 rounded-lg mr-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <span className="font-bold text-gray-900">Experience</span>
                    </div>
                    <p className="text-gray-700 font-medium">{invitation.job?.experience || 'Not specified'}</p>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
                    <div className="flex items-center mb-3">
                      <div className="bg-yellow-500 p-2 rounded-lg mr-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <span className="font-bold text-gray-900">Salary</span>
                    </div>
                    <p className="text-gray-700 font-bold text-lg">
                      {invitation.job?.salary ? (
                        <>
                          {invitation.job.salary.currency || '₹'}{' '}
                          {invitation.job.salary.min ? Number(invitation.job.salary.min).toLocaleString() : '5,00,000'}
                          {' '}–{' '}
                          {invitation.job.salary.max ? Number(invitation.job.salary.max).toLocaleString() : '8,00,000'}
                          <span className="text-sm font-normal text-gray-600"> per annum</span>
                        </>
                      ) : (
                        'Not provided'
                      )}
                    </p>
                  </div>
                </div>

                {/* Application Deadline */}
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 rounded-xl p-6 mb-6">
                  <div className="flex items-center">
                    <div className="bg-red-500 p-2 rounded-lg mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 text-lg">Application Deadline:</span>
                      <p className="text-red-700 font-bold text-xl">
                        {formatDate(invitation.job?.applicationDeadline)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-8 py-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="bg-blue-100 p-2 rounded-lg mr-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h2M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  Company Information
                </h2>
              </div>
              <div className="p-8">
                <div className="flex items-start space-x-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-4">
                    <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h2M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {invitation.company?.name || 'Not specified'}
                    </h3>
                    <p className="text-lg text-gray-600 mb-4">
                      {invitation.company?.industry || 'Not specified'}
                    </p>
                    {invitation.company?.description && (
                      <p className="text-gray-700 leading-relaxed">
                        {invitation.company.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Location:</span>
                    <p className="text-gray-900 font-semibold text-lg">{invitation.company?.location || 'Not specified'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Company Size:</span>
                    <p className="text-gray-900 font-semibold text-lg">{invitation.company?.size || 'Not specified'}</p>
                  </div>
                </div>

                {/* Contact Person */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center text-lg">
                    <div className="bg-blue-500 p-2 rounded-lg mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    Contact Person
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="text-sm font-bold text-gray-700 w-24 uppercase tracking-wide">Name:</span>
                      <span className="text-gray-900 font-semibold">
                        {invitation.recruiter?.name || '—'}
                      </span>
                    </div>
                    {invitation.recruiter?.designation && (
                      <div className="flex items-center">
                        <span className="text-sm font-bold text-gray-700 w-24 uppercase tracking-wide">Role:</span>
                        <span className="text-gray-900 font-semibold">{invitation.recruiter.designation}</span>
                      </div>
                    )}
                    {invitation.recruiter?.email && (
                      <div className="flex items-center">
                        <span className="text-sm font-bold text-gray-700 w-24 uppercase tracking-wide">Email:</span>
                        <a 
                          href={`mailto:${invitation.recruiter.email}`} 
                          className="text-blue-600 hover:text-blue-800 font-semibold flex items-center"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {invitation.recruiter.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Timeline & Additional Info */}
          <div className="space-y-8">
            {/* Student Information */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-green-50 px-6 py-4 border-b">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <div className="bg-green-100 p-2 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  Student Information
                </h2>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {invitation.student?.name || 'Not specified'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Course:</span>
                    <p className="text-gray-900">{invitation.student?.course || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Year:</span>
                    <p className="text-gray-900">{invitation.student?.year || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* College Information */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-purple-50 px-6 py-4 border-b">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <div className="bg-purple-100 p-2 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h2M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  College Information
                </h2>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {invitation.college?.name || 'Not specified'}
                </h3>
                <p className="text-gray-600 font-medium">
                  {invitation.college?.location || 'Location: Not specified'}
                </p>
              </div>
            </div>

            {/* Invitation Details */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-indigo-50 px-6 py-4 border-b">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  Invitation Details
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Sent:</span>
                    <p className="text-gray-900 font-medium">{formatDate(invitation.sentAt)}</p>
                  </div>
                  
                  {invitation.respondedAt && (
                    <div>
                      <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Responded:</span>
                      <p className="text-gray-900 font-medium">{formatDate(invitation.respondedAt)}</p>
                    </div>
                  )}

                  <div>
                    <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Expires:</span>
                    <p className="text-gray-900 font-medium">{formatDate(invitation.expiresAt)}</p>
                  </div>
                </div>

                {invitation.invitationMessage && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-bold text-gray-900 mb-3">Message</h4>
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-gray-700 italic font-medium">"{invitation.invitationMessage}"</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Campus Visit Dates */}
            {invitation.proposedDates && invitation.proposedDates.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-green-50 px-6 py-4 border-b">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <div className="bg-green-100 p-2 rounded-lg mr-3">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    Proposed Campus Visit Dates
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {invitation.proposedDates.map((dateRange, index) => (
                      <div key={index} className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <p className="font-bold text-gray-900">
                          {formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)}
                        </p>
                        {dateRange.isFlexible && (
                          <span className="text-xs text-green-700 bg-green-100 px-3 py-1 rounded-full mt-2 inline-block font-semibold">
                            Flexible
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-yellow-50 px-6 py-4 border-b">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <div className="bg-yellow-100 p-2 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  Timeline
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-3 h-3 bg-blue-600 rounded-full mt-1"></div>
                    <div>
                      <p className="font-bold text-gray-900">Recruiter - Proposed</p>
                      <p className="text-sm text-gray-600">August 16, 2025 at 10:44 AM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Company Information</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  {invitation.recruiter?.companyInfo?.logo ? (
                    <img 
                      src={invitation.recruiter.companyInfo.logo} 
                      alt={invitation.recruiter.companyInfo.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-lg">
                        {invitation.recruiter?.companyInfo?.name?.charAt(0) || '🏢'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-lg text-gray-900">
                      {invitation.recruiter?.companyInfo?.name || 'Not specified'}
                    </h3>
                    <p className="text-gray-600">
                      {invitation.recruiter?.companyInfo?.industry || 'Not specified'}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Location: </span>
                    <span className="text-gray-600">{invitation.recruiter?.companyInfo?.location || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Company Size: </span>
                    <span className="text-gray-600">{invitation.recruiter?.companyInfo?.size || 'Not specified'}</span>
                  </div>
                  {invitation.recruiter?.companyInfo?.website && (
                    <div className="md:col-span-2">
                      <span className="text-sm font-medium text-gray-700">Website: </span>
                      <a 
                        href={invitation.recruiter.companyInfo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {invitation.recruiter.companyInfo.website}
                      </a>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Contact Person</h4>
                  <div className="space-y-1">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Name: </span>
                      <span className="text-gray-600">
                        {(invitation.recruiter?.profile?.firstName || '—')}{' '}
                        {(invitation.recruiter?.profile?.lastName || '')}
                      </span>
                    </div>
                    {invitation.recruiter?.profile?.designation && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Designation: </span>
                        <span className="text-gray-600">{invitation.recruiter.profile.designation}</span>
                      </div>
                    )}
                    {invitation.recruiter?.profile?.email && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Email: </span>
                        <a href={`mailto:${invitation.recruiter.profile.email}`} className="text-blue-600 hover:text-blue-800">
                          {invitation.recruiter.profile.email}
                        </a>
                      </div>
                    )}
                    {invitation.recruiter?.profile?.phone && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Phone: </span>
                        <a href={`tel:${invitation.recruiter.profile.phone}`} className="text-blue-600 hover:text-blue-800">
                          {invitation.recruiter.profile.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
};

export default InvitationDetails;
