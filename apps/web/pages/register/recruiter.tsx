'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../../utils/api';

interface College {
  _id: string;
  name: string;
}

export default function RecruiterRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [colleges, setColleges] = useState<College[]>([]);
  const [otpSent, setOtpSent] = useState(false);
  const [otpId, setOtpId] = useState('');
  const [sessionId, setSessionId] = useState(''); // Add sessionId for SMS OTP
  const [otpMethod, setOtpMethod] = useState('whatsapp'); // WhatsApp or SMS
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    // Basic Info
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    whatsappNumber: '',
    designation: '',
    department: '',
    linkedinUrl: '',
    
    // Company Info
    companyName: '',
    industry: '',
    website: '',
    companyDescription: '',
    companySize: 'medium',
    foundedYear: '',
    city: '',
    state: '',
    country: 'India',
    
    // Hiring Info
    preferredColleges: [] as string[],
    preferredCourses: [''],
    hiringSeasons: [] as string[],
    averageHires: 0,
    workLocations: [''],
    remoteWork: false,
    internshipOpportunities: false,
    preferredContactMethod: 'email',
    
    // OTP
    otp: ''
  });

  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}${API_ENDPOINTS.COLLEGES}`
      );
      setColleges(response.data);
    } catch (error) {
      console.error('Error fetching colleges:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleArrayInputChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).map((item: string, i: number) => 
        i === index ? value : item
      )
    }));
  };

  const addArrayField = (field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field as keyof typeof prev] as string[]), '']
    }));
  };

  const removeArrayField = (index: number, field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).filter((_, i) => i !== index)
    }));
  };

  const handleCollegeSelection = (collegeId: string) => {
    const updatedColleges = formData.preferredColleges.includes(collegeId)
      ? formData.preferredColleges.filter(id => id !== collegeId)
      : [...formData.preferredColleges, collegeId];
    
    setFormData(prev => ({ ...prev, preferredColleges: updatedColleges }));
  };

  const handleHiringSeasonSelection = (season: string) => {
    const updatedSeasons = formData.hiringSeasons.includes(season)
      ? formData.hiringSeasons.filter(s => s !== season)
      : [...formData.hiringSeasons, season];
    
    setFormData(prev => ({ ...prev, hiringSeasons: updatedSeasons }));
  };

  const sendOTP = async () => {
    if (!formData.email) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Check if email already exists
      const emailCheckResponse = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.CHECK_EMAIL}`,
        { email: formData.email }
      );
      if (!emailCheckResponse.data.available) {
        router.push('/login');
        setLoading(false);
        return;
      }

      // Check if phone number already exists
      const phoneCheckResponse = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.CHECK_PHONE}`,
        { phone: formData.phoneNumber }
      );
      if (!phoneCheckResponse.data.available) {
        router.push('/login');
        setLoading(false);
        return;
      }

      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.SEND_OTP}`, {
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        userType: 'recruiter',
        preferredMethod: otpMethod,
        firstName: formData.firstName,
        lastName: formData.lastName
      });

      setOtpId(response.data.otpId);
      setSessionId(response.data.sessionId); // Store sessionId for verification
      setOtpSent(true);
      // Removed setOtpTimer(60) since otpTimer state is not defined
      
      if (response.data.method === 'whatsapp') {
        setError(''); // Clear any previous errors
        // Show success message for WhatsApp
        alert('🔐 OTP sent to your WhatsApp! Please check your messages and enter the 6-digit code below.');
      }
      
      console.log('OTP sent successfully:', response.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send OTP');
      console.error('OTP send error:', err);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!formData.otp || !otpId) {
      setError('Please enter the OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.VERIFY_OTP}`,
        {
          otpId,
          otp: formData.otp,
          userType: 'recruiter'
        }
      );

      if (response.data.verified) {
        setStep(2);
        setError('');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('handleSubmit called');
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const registrationData = {
        email: formData.email,
        password: formData.password,
        role: 'recruiter',
        userType: 'recruiter',
        phoneNumber: formData.phoneNumber,
        whatsappNumber: formData.whatsappNumber || formData.phoneNumber,
        otpId,
        profileData: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          designation: formData.designation,
          department: formData.department,
          linkedinUrl: formData.linkedinUrl,
          companyName: formData.companyName,
          industry: formData.industry,
          website: formData.website,
          companyDescription: formData.companyDescription,
          companySize: formData.companySize,
          foundedYear: formData.foundedYear ? Number(formData.foundedYear) : undefined,
          city: formData.city,
          state: formData.state,
          country: formData.country,
        preferredColleges: formData.preferredColleges.filter(id => id && id.trim() !== '' && /^[a-fA-F0-9]{24}$/.test(id)),
          preferredCourses: formData.preferredCourses.filter(course => course.trim() !== ''),
          hiringSeasons: formData.hiringSeasons,
          averageHires: formData.averageHires,
          workLocations: formData.workLocations.filter(location => location.trim() !== ''),
          remoteWork: formData.remoteWork,
          internshipOpportunities: formData.internshipOpportunities,
          preferredContactMethod: formData.preferredContactMethod,
          whatsappNumber: formData.whatsappNumber
        }
      };

      const response = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.REGISTER}`,
        registrationData
      );

      localStorage.setItem('token', response.data.token);

      // Decode token to get userId and store in localStorage
      const token = response.data.token;
      console.log('Registration token:', token);
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      const payload = JSON.parse(jsonPayload);
      console.log('Decoded token payload:', payload);
      const userId = payload.userId;
      localStorage.setItem('userId', userId);
      console.log('Stored userId in localStorage after registration:', userId);

      router.push('/approval-status?type=recruiter');
    } catch (err: any) {
      console.error('Registration error response:', err.response?.data); // ✅ Log actual error content
      setError(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    console.log('Current step:', step, 'OTP sent:', otpSent);
    if (step === 1 && !otpSent) {
      sendOTP();
    } else if (step === 1 && otpSent) {
      verifyOTP();
    } else {
      setStep(prevStep => {
        console.log('Incrementing step from', prevStep, 'to', prevStep + 1);
        return prevStep + 1;
      });
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  return (
    <>
      <Navbar />
      <main className="pt-24 px-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center text-green-700 mb-4">Recruiter Registration</h1>
          <div className="flex justify-center mb-6">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>1</div>
              <div className={`w-16 h-1 ${step >= 2 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>2</div>
              <div className={`w-16 h-1 ${step >= 3 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>3</div>
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Personal Information & Verification</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  name="firstName"
                  type="text"
                  placeholder="First Name"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
                <input
                  name="lastName"
                  type="text"
                  placeholder="Last Name"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Work Email"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <input
                  name="phoneNumber"
                  type="tel"
                  placeholder="Phone Number"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                />
                <input
                  name="whatsappNumber"
                  type="tel"
                  placeholder="WhatsApp Number (optional)"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.whatsappNumber}
                  onChange={handleInputChange}
                />
                <input
                  name="designation"
                  type="text"
                  placeholder="Designation"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.designation}
                  onChange={handleInputChange}
                  required
                />
                <input
                  name="department"
                  type="text"
                  placeholder="Department"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.department}
                  onChange={handleInputChange}
                />
              </div>

              {otpSent && (
                <div className="mt-4">
                  <input
                    name="otp"
                    type="text"
                    placeholder="Enter OTP"
                    className="w-full border px-4 py-2 rounded-md"
                    value={formData.otp}
                    onChange={handleInputChange}
                    maxLength={6}
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    OTP sent to {formData.email}
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Company Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  name="companyName"
                  type="text"
                  placeholder="Company Name"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  required
                />
                <input
                  name="industry"
                  type="text"
                  placeholder="Industry"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.industry}
                  onChange={handleInputChange}
                  required
                />
                <input
                  name="website"
                  type="url"
                  placeholder="Company Website"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.website}
                  onChange={handleInputChange}
                />
                <select
                  name="companySize"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.companySize}
                  onChange={handleInputChange}
                  required
                >
                  <option value="startup">Startup (1-10 employees)</option>
                  <option value="small">Small (11-50 employees)</option>
                  <option value="medium">Medium (51-200 employees)</option>
                  <option value="large">Large (201-1000 employees)</option>
                  <option value="enterprise">Enterprise (1000+ employees)</option>
                </select>
                <input
                  name="foundedYear"
                  type="number"
                  placeholder="Founded Year"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.foundedYear}
                  onChange={handleInputChange}
                />
                <input
                  name="city"
                  type="text"
                  placeholder="City"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                />
                <input
                  name="state"
                  type="text"
                  placeholder="State"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                />
                <input
                  name="linkedinUrl"
                  type="url"
                  placeholder="LinkedIn Profile"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.linkedinUrl}
                  onChange={handleInputChange}
                />
              </div>
              <div className="mt-4">
                <textarea
                  name="companyDescription"
                  placeholder="Company Description"
                  rows={4}
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.companyDescription}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Hiring Preferences</h2>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Preferred Colleges</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {colleges.map(college => (
                    <label key={college._id} className="flex items-center mb-1">
                      <input
                        type="checkbox"
                        checked={formData.preferredColleges.includes(college._id)}
                        onChange={() => handleCollegeSelection(college._id)}
                        className="mr-2"
                      />
                      {college.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Preferred Courses/Streams</h3>
                {formData.preferredCourses.map((course, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Course/Stream name"
                      className="flex-1 border px-3 py-2 rounded-md"
                      value={course}
                      onChange={(e) => handleArrayInputChange(index, 'preferredCourses', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayField(index, 'preferredCourses')}
                      className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayField('preferredCourses')}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  Add Course
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Hiring Seasons</h3>
                {['summer', 'winter', 'continuous'].map(season => (
                  <label key={season} className="flex items-center mb-1">
                    <input
                      type="checkbox"
                      checked={formData.hiringSeasons.includes(season)}
                      onChange={() => handleHiringSeasonSelection(season)}
                      className="mr-2"
                    />
                    {season.charAt(0).toUpperCase() + season.slice(1)}
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <input
                  name="averageHires"
                  type="number"
                  placeholder="Average Annual Hires"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.averageHires}
                  onChange={handleInputChange}
                />
                <select
                  name="preferredContactMethod"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.preferredContactMethod}
                  onChange={handleInputChange}
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Work Locations</h3>
                {formData.workLocations.map((location, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Work location"
                      className="flex-1 border px-3 py-2 rounded-md"
                      value={location}
                      onChange={(e) => handleArrayInputChange(index, 'workLocations', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayField(index, 'workLocations')}
                      className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayField('workLocations')}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  Add Location
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center">
                  <input
                    name="remoteWork"
                    type="checkbox"
                    checked={formData.remoteWork}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Offers Remote Work
                </label>
                <label className="flex items-center">
                  <input
                    name="internshipOpportunities"
                    type="checkbox"
                    checked={formData.internshipOpportunities}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Offers Internships
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
              >
                Previous
              </button>
            )}
            
            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 ml-auto"
              >
                {loading ? 'Please wait...' : (otpSent && step === 1 ? 'Verify OTP' : 'Next')}
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 ml-auto"
              >
                {loading ? 'Registering...' : 'Complete Registration'}
              </button>
            )}
          </div>
        </form>
      </main>
      <Footer />
    </>
  );
}