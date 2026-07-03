'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import CompanyRegistrationNavbar from '../../components/CompanyRegistrationNavbar';
import Footer from '../../components/Footer';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../../utils/api';

// Step-wise state management
type Step = 1 | 2 | 3 | 4;

interface College {
  _id: string;
  name: string;
}

interface CompanyFormData {
  // Step 1: Account Creation
  companyName: string;
  email: string;
  password: string;
  agreeTerms: boolean;
  
  // Email Verification
  emailOtp: string;
  
  // Step 2: Company Information
  companyMailID: string;
  hrName: string;
  hrPhoneNumber: string;
  hrMailID: string;
  companyWebsite: string;
  pincode: string;
  city: string;
  companyAddress: string;
  industry: string;
  foundedYear: string;
  companySize: string;
  companyLogo: File | null;
  logoFile: File | null;
  companyDocuments: File | null;
  companyDocumentFile: File | null;
  aboutCompany: string;
  
  // Step 3: Legacy fields for backward compatibility
  firstName: string;
  lastName: string;
  phoneNumber: string;
  whatsappNumber: string;
  designation: string;
  department: string;
  linkedinUrl: string;
  companyDescription: string;
  state: string;
  country: string;
  
  // Step 4: Hiring Preferences
  preferredColleges: string[];
  preferredCourses: string[];
  hiringSeasons: string[];
  averageHires: number;
  workLocations: string[];
  remoteWork: boolean;
  internshipOpportunities: boolean;
  preferredContactMethod: string;
  
  // Mobile Verification
  mobileOtp: string;
}

export default function CompanyRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [colleges, setColleges] = useState<College[]>([]);
  const [otpSent, setOtpSent] = useState(false);
  const [emailOtpId, setEmailOtpId] = useState('');
  const [mobileOtpId, setMobileOtpId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [otpMethod, setOtpMethod] = useState('whatsapp');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpModalType, setOtpModalType] = useState<'email' | 'mobile'>('email');
  const [otpTimer, setOtpTimer] = useState(0);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [pincodeValidated, setPincodeValidated] = useState(false);
  const [industrySearch, setIndustrySearch] = useState('');
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [hrPhoneValidated, setHrPhoneValidated] = useState(false);
  const [hrPhoneExists, setHrPhoneExists] = useState(false);
  const [hrPhoneVerified, setHrPhoneVerified] = useState(false);
  const phoneCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const otpInputRefs = useRef<HTMLInputElement[]>([]);

  const [formData, setFormData] = useState<CompanyFormData>({
    // Step 1: Account Creation
    companyName: '',
    email: '',
    password: '',
    agreeTerms: false,
    
    // Email Verification
    emailOtp: '',
    
    // Step 2: Company Information
    companyMailID: '',
    hrName: '',
    hrPhoneNumber: '',
    hrMailID: '',
    companyWebsite: '',
    pincode: '',
    city: '',
    companyAddress: '',
    industry: '',
    foundedYear: '',
    companySize: 'medium',
    companyLogo: null,
    logoFile: null,
    companyDocuments: null,
    companyDocumentFile: null,
    aboutCompany: '',
    
    // Step 3: Legacy fields
    firstName: '',
    lastName: '',
    phoneNumber: '',
    whatsappNumber: '',
    designation: '',
    department: '',
    linkedinUrl: '',
    companyDescription: '',
    state: '',
    country: 'India',
    
    // Step 4: Hiring Preferences
    preferredColleges: [] as string[],
    preferredCourses: [''],
    hiringSeasons: [] as string[],
    averageHires: 0,
    workLocations: [''],
    remoteWork: false,
    internshipOpportunities: false,
    preferredContactMethod: 'email',
    
    // Mobile Verification
    mobileOtp: ''
  });

  useEffect(() => {
    fetchColleges();
  }, []);

  // Handle step from URL parameter
  useEffect(() => {
    if (router.isReady && router.query.step) {
      const stepParam = parseInt(router.query.step as string);
      if (stepParam >= 1 && stepParam <= 4) {
        setStep(stepParam as Step);
      }
    }
  }, [router.isReady, router.query.step]);

  // Handle pre-filled verified data from registration modal
  useEffect(() => {
    if (router.isReady && (router.query.verified_name || router.query.verified_email || router.query.verified_password)) {
      setFormData(prev => ({
        ...prev,
        ...(router.query.verified_name && { 
          companyName: decodeURIComponent(router.query.verified_name as string)
        }),
        ...(router.query.verified_email && { 
          email: decodeURIComponent(router.query.verified_email as string),
          companyMailID: decodeURIComponent(router.query.verified_email as string)
        }),
        ...(router.query.verified_password && { 
          password: decodeURIComponent(router.query.verified_password as string)
        })
      }));
      
      // Set emailOtpId to indicate email is already verified from RegisterModal
      if (router.query.verified_email) {
        setEmailOtpId('verified-from-modal-' + Date.now());
      }
      
      // Clear any error states when setting up pre-filled data
      setError('');
      setSuccess('');
      setStep(2);
    }
  }, [router.isReady, router.query.verified_name, router.query.verified_email, router.query.verified_password]);

  // Clear error and success states when step changes
  useEffect(() => {
    setError('');
    setSuccess('');
  }, [step]);

  // OTP Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Cleanup phone check timeout on unmount
  useEffect(() => {
    return () => {
      if (phoneCheckTimeoutRef.current) {
        clearTimeout(phoneCheckTimeoutRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchColleges = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.COLLEGES}`);
      setColleges(response.data);
    } catch (error) {
      console.error('Error fetching colleges:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Clear errors when user starts typing
    if (error) {
      setError('');
    }
    if (success) {
      setSuccess('');
    }
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      const file = files[0];
      setFormData(prev => ({
        ...prev,
        [name]: file
      }));
      
      // Create preview for logo
      if (name === 'companyLogo') {
        const reader = new FileReader();
        reader.onload = (e) => {
          setLogoPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleCollegeSelection = (collegeId: string) => {
    setFormData(prev => ({
      ...prev,
      preferredColleges: prev.preferredColleges.includes(collegeId)
        ? prev.preferredColleges.filter(id => id !== collegeId)
        : [...prev.preferredColleges, collegeId]
    }));
  };

  const handleHiringSeasonSelection = (season: string) => {
    setFormData(prev => ({
      ...prev,
      hiringSeasons: prev.hiringSeasons.includes(season)
        ? prev.hiringSeasons.filter(s => s !== season)
        : [...prev.hiringSeasons, season]
    }));
  };

  const handleArrayInputChange = (index: number, field: keyof CompanyFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).map((item, i) => i === index ? value : item)
    }));
  };

  // Function to validate pincode and auto-fill city
  const validatePincode = async (pincode: string) => {
    if (pincode.length === 6 && /^\d+$/.test(pincode)) {
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await response.json();
        
        if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
          const postOffice = data[0].PostOffice[0];
          
          setFormData(prev => ({
            ...prev,
            pincode: pincode,
            city: postOffice.District || ''
          }));
          
          setPincodeValidated(true);
          setError('');
          
          return true;
        } else {
          setError('Invalid pincode. Please check and try again.');
          setPincodeValidated(false);
          return false;
        }
      } catch (error) {
        console.error('Error validating pincode:', error);
        setError('Error validating pincode. Please try again.');
        setPincodeValidated(false);
        return false;
      }
    }
    return false;
  };

  // Function to check HR phone number uniqueness
  const checkHRPhoneUniqueness = async (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      setHrPhoneValidated(false);
      setHrPhoneExists(false);
      return true;
    }
    
    // Clear any previous errors when checking
    setError('');
    
    try {
      // TODO: Implement phone uniqueness check when API endpoint is available
      // For now, we'll skip this check and assume phone is unique
      console.log('Phone uniqueness check skipped - API endpoint not available');
      
      setHrPhoneExists(false);
      setHrPhoneValidated(true);
      setError(''); // Clear any existing error
      return true;
      
      // Commented out until API endpoint is implemented
      /*
      const response = await axios.post(`${API_BASE_URL}/api/check-phone-uniqueness`, {
        phoneNumber: phoneNumber,
        userType: 'recruiter'
      });
      
      console.log('Phone uniqueness check response:', response.data);
      
      if (!response.data.isUnique) {
        setError('This HR phone number is already registered. Please use a different number.');
        setHrPhoneExists(true);
        setHrPhoneValidated(false);
        return false;
      } else {
        setHrPhoneExists(false);
        setHrPhoneValidated(true);
        setError(''); // Clear any existing error
        return true;
      }
      */
    } catch (error) {
      console.error('Error checking HR phone uniqueness:', error);
      // Don't block registration if API fails, but log the error
      setHrPhoneValidated(true);
      setHrPhoneExists(false);
      return true;
    }
  };

  // Function to send HR Phone OTP
  const sendHRPhoneOTP = async () => {
    // Clear any previous messages
    setError('');
    setSuccess('');

    if (!formData.hrPhoneNumber) {
      setError('Please enter HR phone number');
      return;
    }

    if (!formData.companyName) {
      setError('Please enter company name');
      return;
    }

    // Check if HR phone is already verified
    if (hrPhoneVerified) {
      console.log('HR phone already verified, proceeding to registration');
      await submitRegistration();
      return;
    }

    // Check if phone number already exists
    if (hrPhoneExists) {
      setError('This HR phone number is already registered. Please use a different number.');
      return;
    }

    // Ensure phone number is validated before sending OTP
    const cleanPhone = formData.hrPhoneNumber.replace(/\D/g, '');
    if (!hrPhoneValidated || cleanPhone.length !== 10) {
      const isUnique = await checkHRPhoneUniqueness(cleanPhone);
      if (!isUnique) {
        return; // Error message already set by checkHRPhoneUniqueness
      }
    }

    setLoading(true);

    try {
      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      console.log('📱 Sending WhatsApp OTP to HR via URL parameters:', {
        phone: formData.hrPhoneNumber,
        name: formData.companyName,
        otp: otp
      });
      
      // Send OTP via WhatsApp webhook using URL parameters
      const webhookUrl = `https://api.wabb.in/api/v1/webhooks-automation/catch/220/FQavVMJ9VP7G/?Phone=${encodeURIComponent(formData.hrPhoneNumber)}&Name=${encodeURIComponent(formData.companyName)}&OTP=${encodeURIComponent(otp)}`;
      
      console.log('📡 Webhook URL:', webhookUrl);
      
      const webhookResponse = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      console.log('📡 Webhook response:', {
        status: webhookResponse.status,
        statusText: webhookResponse.statusText,
        ok: webhookResponse.ok
      });

      if (webhookResponse.ok || webhookResponse.status === 200) {
        // Store the OTP temporarily
        localStorage.setItem('tempHRPhoneOtp', otp);
        localStorage.setItem('tempHRPhoneOtpExpiry', (Date.now() + 10 * 60 * 1000).toString()); // 10 minutes
        
        console.log('✅ OTP stored for HR phone:', {
          otp: otp,
          expiry: new Date(Date.now() + 10 * 60 * 1000).toISOString()
        });
        
        setMobileOtpId('webhook-hr-' + Date.now());
        setOtpModalType('mobile');
        setShowOtpModal(true);
        setOtpTimer(120);
        setSuccess('OTP sent to HR WhatsApp number!');
      } else {
        const errorText = await webhookResponse.text();
        console.error('❌ Webhook error:', errorText);
        throw new Error(`Failed to send WhatsApp OTP: ${errorText}`);
      }
    } catch (error: any) {
      console.error('WhatsApp OTP send error:', error);
      setError('Failed to send WhatsApp OTP to HR phone. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle OTP input
  const handleOtpInput = (index: number, value: string, type: 'email' | 'mobile') => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      if (type === 'email') {
        const newOtp = formData.emailOtp.split('');
        newOtp[index] = value;
        setFormData(prev => ({ ...prev, emailOtp: newOtp.join('') }));
      } else {
        const newOtp = formData.mobileOtp.split('');
        newOtp[index] = value;
        setFormData(prev => ({ ...prev, mobileOtp: newOtp.join('') }));
      }
      
      if (value && index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }
    }
  };

  // Function to send Email OTP
  const sendEmailOTP = async () => {
    if (!formData.email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('API_ENDPOINTS.SEND_OTP:', API_ENDPOINTS.SEND_OTP);
      console.log('Full URL:', `${API_BASE_URL}${API_ENDPOINTS.SEND_OTP}`);
      
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.SEND_OTP}`, {
        email: formData.email,
        userType: 'recruiter'
      });

      if (response.data.otpId) {
        setEmailOtpId(response.data.otpId);
        setSuccess('OTP sent to your email successfully!');
        setOtpTimer(120); // 2 minutes
        setOtpModalType('email');
        setShowOtpModal(true);
      }
    } catch (error: any) {
      console.error('OTP send error:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Function to verify Email OTP
  const verifyEmailOTP = async () => {
    if (!formData.emailOtp || formData.emailOtp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.VERIFY_OTP}`, {
        otpId: emailOtpId,
        otp: formData.emailOtp,
        userType: 'recruiter',
        method: 'email'
      });

      if (response.data.verified) {
        // Clear all error states
        setError('');
        setSuccess('Email verified successfully!');
        setShowOtpModal(false);
        
        // Small delay to show success message then clear and move to next step
        setTimeout(() => {
          setSuccess('');
          setError(''); // Ensure no errors when moving to Step 2
          setStep(2); // Move to next step
        }, 1000);
      } else {
        setError('Invalid OTP. Please try again.');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Function to verify HR Phone OTP
  const verifyHRPhoneOTP = async () => {
    if (!formData.mobileOtp || formData.mobileOtp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError(''); // Clear any previous errors
    setSuccess(''); // Clear any previous success messages

    try {
      // Get stored OTP and check expiry
      const storedOtp = localStorage.getItem('tempHRPhoneOtp');
      const otpExpiry = localStorage.getItem('tempHRPhoneOtpExpiry');
      
      console.log('🔍 Verifying HR Phone OTP:', {
        enteredOtp: formData.mobileOtp,
        storedOtp: storedOtp,
        expiry: otpExpiry ? new Date(parseInt(otpExpiry)).toISOString() : 'none',
        isExpired: otpExpiry ? Date.now() > parseInt(otpExpiry) : 'no expiry'
      });
      
      if (!storedOtp || !otpExpiry || Date.now() > parseInt(otpExpiry)) {
        setError('OTP has expired. Please request a new one.');
        localStorage.removeItem('tempHRPhoneOtp');
        localStorage.removeItem('tempHRPhoneOtpExpiry');
        setLoading(false);
        return;
      }
      
      if (formData.mobileOtp === storedOtp) {
        console.log('✅ HR Phone OTP verification successful!');
        
        // Clean up stored OTP
        localStorage.removeItem('tempHRPhoneOtp');
        localStorage.removeItem('tempHRPhoneOtpExpiry');
        
        // Mark HR phone as verified to prevent repeated OTP requests
        setHrPhoneVerified(true);
        
        // Clear ALL error states immediately
        setError('');
        
        // Show success message briefly
        setSuccess('HR phone number verified successfully!');
        
        setShowOtpModal(false);
        
        // Small delay to allow success message to show before proceeding
        setTimeout(async () => {
          try {
            setSuccess(''); // Clear success message before registration
            setError(''); // Ensure no errors are showing
            // Submit registration and go directly to approval status, skipping Step 3
            await submitRegistration();
          } catch (regError) {
            console.error('Registration error after phone verification:', regError);
            // If registration fails, show the error
            setError('Registration failed after phone verification. Please try again.');
          }
        }, 1500);
      } else {
        console.log('❌ OTP mismatch');
        setError('Invalid OTP. Please try again.');
      }
    } catch (error: any) {
      console.error('HR Phone OTP verification error:', error);
      setError('OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addArrayField = (field: keyof CompanyFormData) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), '']
    }));
  };

  const removeArrayField = (index: number, field: keyof CompanyFormData) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const sendOTP = async () => {
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.SEND_OTP}`, {
        email: formData.email,
        userType: 'recruiter'
      });
      
      setEmailOtpId(response.data.otpId);
      setOtpSent(true);
      setError('');
      
      console.log('OTP sent successfully:', response.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send OTP');
      console.error('OTP send error:', err);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!formData.emailOtp || !emailOtpId) {
      setError('Please enter the OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.VERIFY_OTP}`, {
        otpId: emailOtpId,
        otp: formData.emailOtp,
        userType: 'recruiter'
      });

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

  // Function to submit registration after Step 2 completion (skip Step 3)
  const submitRegistration = async () => {
    // Prevent multiple simultaneous registration attempts
    if (loading) {
      console.log('Registration already in progress, skipping duplicate call');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      // Comprehensive validation of all required fields (matching Step 2 validation)
      const missingFields = [];
      
      // Step 1 fields
      if (!formData.email) missingFields.push('Email');
      if (!formData.password) missingFields.push('Password');
      if (!formData.companyName) missingFields.push('Company Name');
      
      // Step 2 fields (Company Information)
      if (!formData.companyMailID) missingFields.push('Company Mail ID');
      if (!formData.hrName) missingFields.push('HR Name');
      if (!formData.hrPhoneNumber) missingFields.push('HR Phone Number');
      if (!formData.hrMailID) missingFields.push('HR Mail ID');
      if (!formData.pincode) missingFields.push('Pincode');
      if (!formData.city) missingFields.push('City');
      if (!formData.companyAddress) missingFields.push('Company Address');
      if (!formData.industry) missingFields.push('Industry');
      if (!formData.foundedYear) missingFields.push('Founded Year');
      if (!formData.companySize) missingFields.push('Company Size');
      if (!formData.aboutCompany) missingFields.push('About Company');
      if (!formData.companyDocumentFile) missingFields.push('Company Document');
      
      // Check if any fields are missing
      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        throw new Error(`Missing required fields: ${missingFields.join(', ')}. Please ensure all required fields are filled.`);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address.');
      }

      // Validate phone number
      const cleanPhone = formData.hrPhoneNumber.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        throw new Error('Please enter a valid 10-digit phone number.');
      }

      // Validate company description length
      if (formData.aboutCompany.length < 50) {
        throw new Error('Company description should be at least 50 characters.');
      }

      // Validate email OTP was completed (either in Step 1 or from RegisterModal)
      if (!emailOtpId) {
        throw new Error('Please verify your email first by completing Step 1.');
      }

      // Ensure all required fields are present and properly formatted
      const hrNameParts = formData.hrName.trim().split(' ');
      const firstName = hrNameParts[0] || '';
      const lastName = hrNameParts.slice(1).join(' ') || '';

      const registrationData = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: 'recruiter',
        userType: 'recruiter',
        phoneNumber: cleanPhone, // Use cleaned phone number
        whatsappNumber: cleanPhone,
        otpId: emailOtpId,
        profileData: {
          // Personal information
          firstName: firstName,
          lastName: lastName,
          designation: 'HR', // Default designation
          department: 'Human Resources', // Default department
          
          // Company information
          companyName: formData.companyName.trim(),
          industry: formData.industry || '',
          website: formData.companyWebsite || '',
          companyDescription: formData.aboutCompany || '',
          companySize: formData.companySize || '',
          foundedYear: formData.foundedYear ? Number(formData.foundedYear) : new Date().getFullYear(),
          
          // Location information
          city: formData.city || '',
          state: '', // Default state
          country: formData.country || 'India',
          
          // Contact information
          hrName: formData.hrName.trim(),
          hrPhoneNumber: formData.hrPhoneNumber.replace(/\D/g, ''),
          hrMailID: formData.hrMailID || formData.email,
          companyMailID: formData.companyMailID || formData.email,
          pincode: formData.pincode || '',
          companyAddress: formData.companyAddress || '',
          
          // Additional fields to prevent validation errors
          linkedinUrl: '', // Default empty
          profilePicture: '', // Default empty
          logo: '', // Default empty
          
          // Set default values for hiring preferences since we're skipping Step 3
          preferredColleges: [],
          preferredCourses: [],
          hiringSeasons: ['continuous'],
          averageHires: 5, // Default value
          workLocations: [formData.city || 'Not specified'],
          remoteWork: false,
          internshipOpportunities: false,
          preferredContactMethod: 'email',
          whatsappNumber: formData.hrPhoneNumber.replace(/\D/g, '')
        }
      };

      console.log('Sending registration data:', JSON.stringify(registrationData, null, 2));
      console.log('Registration endpoint:', `${API_BASE_URL}${API_ENDPOINTS.REGISTER}`);
      
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.REGISTER}`, registrationData);

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);

        // Decode JWT to get user ID
        const token = response.data.token;
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));
        const payload = JSON.parse(jsonPayload);
        const userId = payload.userId;
        localStorage.setItem('userId', userId);

        console.log('✅ Registration successful, redirecting to approval status');
        router.push('/approval-status?type=recruiter');
      } else {
        throw new Error('No token received from server');
      }
    } catch (err: any) {
      console.error('Registration error response:', err.response?.data);
      console.error('Registration error full:', err);
      
      // More detailed error handling
      let errorMessage = 'Registration failed';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
        
        // Handle the case where user already exists - redirect to login
        if (errorMessage.includes('User already exists')) {
          setError('This email is already registered. Redirecting to login...');
          setTimeout(() => {
            router.push('/login');
          }, 2000);
          return;
        }
      } else if (err.response?.status === 400) {
        errorMessage = 'Invalid registration data. Please check all fields and try again.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(`Registration failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitRegistration();
  };

  const nextStep = async () => {
    // Clear all error and success states when moving between steps
    setError('');
    setSuccess('');
    
    if (step === 1) {
      // Validate Step 1 form
      if (!formData.companyName || !formData.email || !formData.password || !formData.agreeTerms) {
        setError('Please fill in all required fields and agree to terms');
        return;
      }
      sendEmailOTP();
      return;
    }
    
    if (step === 2) {
      // Validate Step 2 form
      if (!formData.companyMailID || !formData.hrName || !formData.hrPhoneNumber || 
          !formData.hrMailID || !formData.pincode || !formData.city || 
          !formData.companyAddress || !formData.industry || !formData.foundedYear || 
          !formData.companySize || !formData.aboutCompany || !formData.companyDocumentFile) {
        setError('Please fill in all required fields including company document upload');
        return;
      }
      
      if (formData.aboutCompany.length < 50) {
        setError('Company description should be at least 50 characters');
        return;
      }
      
      // Check if email OTP was verified
      if (!emailOtpId) {
        setError('Please verify your email first by completing Step 1');
        return;
      }
      
      // If HR phone is already verified, complete registration directly
      // But only if we're not already in the process of registering from phone verification
      if (hrPhoneVerified && !loading) {
        console.log('HR phone already verified, completing registration...');
        await submitRegistration();
        return;
      }
      
      // Check if HR phone number exists before proceeding
      if (hrPhoneExists) {
        setError('This HR phone number is already registered. Please use a different number.');
        return;
      }
      
      // Ensure phone number is 10 digits
      if (formData.hrPhoneNumber.length !== 10) {
        setError('Please enter a valid 10-digit HR phone number');
        return;
      }
      
      sendHRPhoneOTP();
      return;
    }
    
    // Skip Step 3 (Hiring Preferences) - go directly to approval status after Step 2
    // Step 3 is removed from the flow, registration happens after HR phone verification
  };

  const prevStep = () => {
    if (step > 1) {
      // Clear error and success states when moving to previous step
      setError('');
      setSuccess('');
      setStep((step - 1) as Step);
    }
  };

  // Check if form is submitted and redirect to approval status
  if (router.query.submitted === 'true') {
    router.push('/approval-status?type=recruiter');
    return null;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F7FF' }}>
      <CompanyRegistrationNavbar 
        currentStep={step}
        registrationStatus={step === 1 ? 'company_info' : step === 2 ? 'company_info' : 'hr_info'}
        companyName={formData.companyName}
      />
      
      <div className="max-w-screen-2xl mx-auto px-6 py-4">
        {/* Step 1: Create Account */}
        {step === 1 && (
          <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#F5F7FF' }}>
            <div className="flex bg-white rounded-2xl shadow-xl overflow-hidden max-w-5xl w-full">
              {/* Left Side - Illustration */}
              <div className="w-1/2 bg-gradient-to-br from-green-50 to-green-100 p-12 flex flex-col justify-center">
                <div className="text-center">
                  <div className="relative w-80 h-80 mx-auto mb-8 flex items-center justify-center">
                    <Image
                      src="/wykfrtuwbtfwby3wi6428v4ywjer.png"
                      alt="Company registration illustration"
                      width={320}
                      height={320}
                      className="object-contain"
                    />
                  </div>
                  
                  <h1 className="text-3xl font-bold text-gray-800 mb-4">
                    Connect with <span className="text-green-600">top talent</span> across India
                  </h1>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    <span className="text-green-600">Campus recruitment made simple</span> - find the right candidates for your company.
                  </p>
                </div>
              </div>

              {/* Right Side - Form */}
              <div className="w-1/2 p-12 flex flex-col justify-center">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Company Account</h2>
                  <p className="text-gray-600">Let's get your company profile set up for campus recruitment</p>
                </div>

                <form className="space-y-6">
                  <div>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="Company Name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                      readOnly={!!router.query.verified_name}
                      style={router.query.verified_name ? { backgroundColor: '#f9f9f9', cursor: 'not-allowed' } : {}}
                    />
                  </div>

                  <div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Company Email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                      readOnly={!!router.query.verified_email}
                      style={router.query.verified_email ? { backgroundColor: '#f9f9f9', cursor: 'not-allowed' } : {}}
                    />
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  {otpSent && (
                    <div>
                      <input
                        type="text"
                        name="emailOtp"
                        value={formData.emailOtp}
                        onChange={handleInputChange}
                        placeholder="Enter Email OTP"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        maxLength={6}
                      />
                      <p className="text-sm text-gray-600 mt-2">
                        OTP sent to {formData.email}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      required
                    />
                    <label className="ml-2 text-sm text-gray-600">
                      I agree to the <a href="/terms" className="text-green-600 hover:underline">Terms & Conditions</a> and <a href="/privacy" className="text-green-600 hover:underline">Privacy Policy</a>
                    </label>
                  </div>

                  {error && <div className="text-red-500 text-sm">{error}</div>}
                  {success && <div className="text-green-500 text-sm">{success}</div>}

                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={loading || !formData.agreeTerms}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {loading ? 'Please wait...' : (otpSent ? 'Verify Email & Continue' : 'Send Verification Code')}
                  </button>
                </form>

                <div className="mt-6 text-center text-sm">
                  <span className="text-gray-600">Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => router.push('/company-login')}
                    className="text-green-600 hover:underline font-medium"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Company Information */}
        {step === 2 && (
          <div className="max-w-screen-2xl mx-auto px-6">
            {/* Header outside the white box */}
            <div className="mb-6 text-center">
              <h2 className="text-[28px] sm:text-[28px] font-bold text-gray-900 tracking-tight mb-2">Company information</h2>
              <p className="text-gray-600 text-base sm:text-[24] leading-relaxed">
                Please share a few basic details about your company. This helps us to verify your organization and present it to students and colleges with trust and credibility.
              </p>
            </div>

            {/* White content box */}
            <div className="bg-white rounded-2xl border border-gray-100 w-full p-6 sm:p-8 lg:p-10 shadow-[0_10px_30px_rgba(2,32,71,0.08)]">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              {/* Logo Upload */}
              <div className="mb-8">
                <div 
                  className="border-2 border-dashed border-blue-300 rounded-2xl bg-blue-50/70 text-center h-40 sm:h-44 flex items-center justify-center cursor-pointer hover:bg-blue-100/70 transition-colors"
                  onClick={() => document.getElementById('logoUpload')?.click()}
                >
                  {logoPreview ? (
                    <div className="mb-4">
                      <div className="w-full h-24 mx-auto overflow-hidden border-2 border-gray-200">
                        <img 
                          src={logoPreview} 
                          alt="Logo Preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLogoPreview('');
                          setFormData(prev => ({ ...prev, logoFile: null }));
                        }}
                        className="mt-2 text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                    id="logoUpload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          setError('File size should be less than 5MB');
                          return;
                        }
                        
                        // Create preview URL
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          setLogoPreview(e.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                        
                        setFormData(prev => ({ ...prev, logoFile: file }));
                        setError('');
                      }
                    }}
                  />
                </div>
                {/* Text layout with left and right positioning */}
                <div className="grid grid-cols-3 items-center w-full">
                  <span className="text-sm text-gray-500 text-left">
                    (Upload PNG/JPEG max 5Mb)
                  </span>

                  <label
                    htmlFor="logoUpload"
                    className="text-blue-600 hover:underline font-medium cursor-pointer text-center"
                  >
                    {formData.logoFile ? 'Change Logo' : 'Upload Company Logo*'}
                  </label>

                  <div></div> {/* Empty column to balance center alignment */}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5 md:gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Company Name*</label>
                  <input
                    name="companyName"
                    type="text"
                    placeholder="Enter your company name"
                    className="w-full h-12 px-4 border border-gray-200 rounded-full bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    required
                    readOnly={!!router.query.verified_name}
                    style={router.query.verified_name ? { backgroundColor: '#f9f9f9', cursor: 'not-allowed' } : {}}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Company Mail ID*</label>
                  <input
                    name="companyMailID"
                    type="email"
                    placeholder="Enter company email"
                    className="w-full h-12 px-4 border border-gray-200 rounded-full bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    value={formData.companyMailID || formData.email}
                    onChange={(e) => {
                      if (!router.query.verified_email) {
                        setFormData(prev => ({ ...prev, companyMailID: e.target.value }));
                      }
                    }}
                    required
                    readOnly={!!router.query.verified_email}
                    style={router.query.verified_email ? { backgroundColor: '#f9f9f9', cursor: 'not-allowed' } : {}}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Hr Name*</label>
                  <input
                    name="hrName"
                    type="text"
                    placeholder="Enter hr name"
                    className="w-full h-12 px-4 border border-gray-200 rounded-full bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    value={formData.hrName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Hr Phone Number*</label>
                  <div className="relative">
                    <input
                      name="hrPhoneNumber"
                      type="tel"
                      placeholder="Enter hr phone number"
                      className={`w-full h-12 px-4 pr-12 border rounded-full bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-4 ${
                        hrPhoneExists 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                          : hrPhoneValidated 
                            ? 'border-green-300 focus:border-green-500 focus:ring-green-100'
                            : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                      }`}
                      value={formData.hrPhoneNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFormData(prev => ({ ...prev, hrPhoneNumber: value }));
                        
                        // Reset validation states when user starts typing
                        setHrPhoneValidated(false);
                        setHrPhoneExists(false);
                        setError('');
                        
                        // Clear any existing timeout
                        if (phoneCheckTimeoutRef.current) {
                          clearTimeout(phoneCheckTimeoutRef.current);
                        }
                        
                        // Check uniqueness only when phone number is complete with debounce
                        if (value.length === 10) {
                          phoneCheckTimeoutRef.current = setTimeout(() => {
                            checkHRPhoneUniqueness(value);
                          }, 500); // 500ms debounce
                        }
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={sendHRPhoneOTP}
                      disabled={loading || !formData.hrPhoneNumber || formData.hrPhoneNumber.length !== 10 || hrPhoneExists}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600 hover:text-blue-700 disabled:opacity-50 text-sm font-medium"
                      title={hrPhoneExists ? "Phone number already exists" : hrPhoneVerified ? "Phone verified" : "Send OTP to HR phone"}
                    >
                      {loading ? 'Sending...' : hrPhoneExists ? 'Exists' : hrPhoneVerified ? '✓ Verified' : 'Send OTP'}
                    </button>
                  </div>
                  {hrPhoneVerified && (
                    <div className="mt-1 text-sm text-green-600 font-medium">
                      ✓ Phone number verified successfully
                    </div>
                  )}
                  {!hrPhoneVerified && hrPhoneValidated && !hrPhoneExists && formData.hrPhoneNumber.length === 10 && (
                    <div className="mt-1 text-sm text-green-600">
                      ✓ Phone number is available
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Hr Mail ID*</label>
                  <input
                    name="hrMailID"
                    type="email"
                    placeholder="sampleemail@gmail.com"
                    className="w-full h-12 px-4 border border-gray-200 rounded-full bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    value={formData.hrMailID}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Company Website</label>
                  <input
                    name="companyWebsite"
                    type="url"
                    placeholder="Enter or paste your website url"
                    className="w-full h-12 px-4 border border-gray-200 rounded-full bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    value={formData.companyWebsite}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Pincode*</label>
                  <input
                    name="pincode"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Enter pincode"
                    className="w-full h-12 px-4 border border-gray-200 rounded-full bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    value={formData.pincode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setFormData(prev => ({ ...prev, pincode: value }));
                      if (value.length === 6) {
                        validatePincode(value);
                      }
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">City*</label>
                  <input
                    name="city"
                    type="text"
                    placeholder="Enter your city"
                    className="w-full h-12 px-4 border border-gray-200 rounded-full bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    readOnly={pincodeValidated}
                    style={pincodeValidated ? { backgroundColor: '#f9f9f9', cursor: 'not-allowed' } : {}}
                  />
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-800 mb-2">Company Address*</label>
                <textarea
                  name="companyAddress"
                  rows={4}
                  placeholder="Enter hr address"
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  value={formData.companyAddress}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-5 md:gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Industry*</label>
                  <div className="relative">
                    <select
                      name="industry"
                      className="w-full h-12 px-4 pr-10 border border-gray-200 rounded-full bg-white text-gray-900 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 appearance-none"
                      value={formData.industry}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select your industry type</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Financial Services">Financial Services</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Retail">Retail</option>
                      <option value="Education">Education</option>
                      <option value="Consulting">Consulting</option>
                      <option value="Automotive">Automotive</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Media & Entertainment">Media & Entertainment</option>
                    </select>
                    {/* Dropdown arrow */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Founded Year*</label>
                  <input
                    name="foundedYear"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Enter founded year"
                    className="w-full h-12 px-4 border border-gray-200 rounded-full bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    value={formData.foundedYear}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setFormData(prev => ({ ...prev, foundedYear: value }));
                      setError('');
                    }}
                    required
                  />
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-800 mb-2">Company Size*</label>
                <div className="relative">
                  <select
                    name="companySize"
                    className="w-full h-12 px-4 pr-10 border border-gray-200 rounded-full bg-white text-gray-900 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 appearance-none"
                    value={formData.companySize}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select company size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                  {/* Dropdown arrow */}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Company Document Upload */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-800 mb-2">Company Document Upload*</label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50/70 text-center h-40 sm:h-44 flex items-center justify-center cursor-pointer hover:bg-gray-100/70 transition-colors"
                  onClick={() => document.getElementById('documentUpload')?.click()}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium">Choose a file or drag & drop it here</p>
                    <p className="text-gray-500 text-sm mt-1">JPEG, PNG, PDF, DOC formats, up to 50MB</p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="hidden"
                    id="documentUpload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 50 * 1024 * 1024) {
                          setError('File size should be less than 50MB');
                          return;
                        }
                        setFormData(prev => ({ ...prev, companyDocumentFile: file }));
                        setError('');
                      }
                    }}
                  />
                </div>
                {formData.companyDocumentFile && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-green-700 text-sm font-medium">
                        📄 {formData.companyDocumentFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, companyDocumentFile: null }))}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={() => document.getElementById('documentUpload')?.click()}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-full text-sm font-medium transition-colors"
                  >
                    Browse File
                  </button>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-800 mb-2">About the company*</label>
                <textarea
                  name="aboutCompany"
                  rows={6}
                  placeholder="Brief about your company"
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  value={formData.aboutCompany}
                  onChange={handleInputChange}
                  required
                />
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-gray-500">
                    {formData.aboutCompany.length} characters 
                    {formData.aboutCompany.length < 50 && (
                      <span className="text-red-500"> (minimum 50 required)</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={nextStep}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-full font-medium shadow-sm transition-colors aspect-[4.5/1] w-44 flex items-center justify-center text-sm"
                >
                  {loading ? 'Processing...' : hrPhoneVerified ? 'Complete Registration' : 'Continue'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Hiring Preferences */}
        {step === 3 && (
          <div className="max-w-4xl mx-auto py-8">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Hiring Preferences</h2>
                <p className="text-gray-600">Tell us about your recruitment needs</p>
              </div>

              <form className="space-y-8">
                {/* Preferred Colleges */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Preferred Colleges</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-lg p-4">
                    {colleges.map(college => (
                      <label key={college._id} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          checked={formData.preferredColleges.includes(college._id)}
                          onChange={() => handleCollegeSelection(college._id)}
                          className="mr-3 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="text-sm">{college.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Preferred Courses */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Preferred Courses/Streams</h3>
                  {formData.preferredCourses.map((course, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Course/Stream name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={course}
                        onChange={(e) => handleArrayInputChange(index, 'preferredCourses', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayField(index, 'preferredCourses')}
                        className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayField('preferredCourses')}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Add Course
                  </button>
                </div>

                {/* Hiring Seasons */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Hiring Seasons</h3>
                  <div className="space-y-2">
                    {['summer', 'winter', 'continuous'].map(season => (
                      <label key={season} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.hiringSeasons.includes(season)}
                          onChange={() => handleHiringSeasonSelection(season)}
                          className="mr-3 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="capitalize">{season}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input
                    type="number"
                    name="averageHires"
                    value={formData.averageHires}
                    onChange={handleInputChange}
                    placeholder="Average Annual Hires"
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <select
                    name="preferredContactMethod"
                    value={formData.preferredContactMethod}
                    onChange={handleInputChange}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>

                {/* Work Locations */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Work Locations</h3>
                  {formData.workLocations.map((location, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Work location"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={location}
                        onChange={(e) => handleArrayInputChange(index, 'workLocations', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayField(index, 'workLocations')}
                        className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayField('workLocations')}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Add Location
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="remoteWork"
                      checked={formData.remoteWork}
                      onChange={handleInputChange}
                      className="mr-3 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    Offers Remote Work
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="internshipOpportunities"
                      checked={formData.internshipOpportunities}
                      onChange={handleInputChange}
                      className="mr-3 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    Offers Internships
                  </label>
                </div>
              </form>

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Previous
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Complete Registration'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OTP Modal */}
        {showOtpModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {otpModalType === 'email' ? 'Verify Email' : 'Verify HR Phone'}
                </h3>
                <p className="text-gray-600">
                  {otpModalType === 'email' 
                    ? `We've sent a 6-digit code to ${formData.email}` 
                    : `We've sent a 6-digit code to ${formData.hrPhoneNumber}`
                  }
                </p>
                {otpTimer > 0 && (
                  <p className="text-blue-600 mt-2">
                    Resend code in {formatTime(otpTimer)}
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <div className="flex justify-center gap-2 mb-6">
                {Array.from({ length: 6 }, (_, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      if (el) otpInputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    value={otpModalType === 'email' ? formData.emailOtp[index] || '' : formData.mobileOtp[index] || ''}
                    onChange={(e) => handleOtpInput(index, e.target.value, otpModalType)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
                        otpInputRefs.current[index - 1]?.focus();
                      }
                    }}
                  />
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowOtpModal(false);
                    setError('');
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full font-medium py-3 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={otpModalType === 'email' ? verifyEmailOTP : verifyHRPhoneOTP}
                  disabled={loading || (otpModalType === 'email' ? formData.emailOtp.length !== 6 : formData.mobileOtp.length !== 6)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium py-3 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>

              {otpTimer === 0 && (
                <button
                  type="button"
                  onClick={otpModalType === 'email' ? sendEmailOTP : sendHRPhoneOTP}
                  disabled={loading}
                  className="w-full mt-3 text-blue-600 hover:text-blue-700 font-medium py-2 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Resend OTP'}
                </button>
              )}
            </div>
          </div>
        )}

        {error && <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg">{error}</div>}
        {success && <div className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg">{success}</div>}
      </div>
      
      <Footer />
    </div>
  );
}
