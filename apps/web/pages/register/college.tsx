import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import CollegeRegistrationNavbar from '../../components/CollegeRegistrationNavbar';
import Footer from '../../components/Footer';
import { API_BASE_URL, API_ENDPOINTS } from '../../utils/api';
import { 
  validateStep1, 
  validateStep2, 
  validateStep3,
  validateEstablishmentYear,
  validateWebsite,
  validateEmail,
  validatePhoneNumber,
  ValidationResult
} from '../../utils/collegeValidation';
import axios from 'axios';

// Step-wise state management
type Step = 1 | 2 | 3 | 4;

interface CollegeFormData {
  // Step 1: Account Creation
  collegeName: string;
  email: string;
  password: string;
  agreeTerms: boolean;
  
  // Email Verification
  emailOtp: string;
  
  // Step 2: College Information
  logoFile: File | null;
  logoUrl: string;
  establishedYear: string;
  recognizedBy: string;
  recognizedByOther: string;
  collegeType: string;
  website: string;
  affiliatedTo: string;
  affiliatedUniversityName: string;
  aboutCollege: string;
  departments: string[]; // Added departments field
  
  // Step 3: Contact Information
  address: string;
  location: string;
  landmark: string;
  pincode: string;
  city: string;
  state: string;
  coordinatorName: string;
  coordinatorDesignation: string;
  coordinatorDesignationOther: string;
  coordinatorNumber: string;
  coordinatorEmail: string;
  mobile: string;
  whatsappOptIn: boolean;
  
  // Mobile Verification
  mobileOtp: string;
}

interface FieldError {
  field: string;
  message: string;
  timestamp: number;
}

export default function CollegeRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  
  // Search states for dropdowns
  const [recognizedBySearch, setRecognizedBySearch] = useState('');
  const [affiliatedToSearch, setAffiliatedToSearch] = useState('');
  const [coordinatorDesignationSearch, setCoordinatorDesignationSearch] = useState('');
  const [collegeTypeSearch, setCollegeTypeSearch] = useState('');
  const [designationSearch, setDesignationSearch] = useState('');
  
  // Dropdown visibility states
  const [showCollegeTypeDropdown, setShowCollegeTypeDropdown] = useState(false);
  const [showAffiliatedDropdown, setShowAffiliatedDropdown] = useState(false);
  const [showDesignationDropdown, setShowDesignationDropdown] = useState(false);
  
  // Location states
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [hasRequestedLocation, setHasRequestedLocation] = useState(false);
  const [pincodeValidated, setPincodeValidated] = useState(false);
  
  // OTP states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpModalType, setOtpModalType] = useState<'email' | 'mobile'>('email');
  const [emailOtpId, setEmailOtpId] = useState('');
  const [mobileOtpId, setMobileOtpId] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [logoPreview, setLogoPreview] = useState<string>('');
  
  const otpInputRefs = useRef<HTMLInputElement[]>([]);

  const [formData, setFormData] = useState<CollegeFormData>({
    // Step 1
    collegeName: '',
    email: '',
    password: '',
    agreeTerms: false,
    emailOtp: '',
    
    // Step 2
    logoFile: null,
    logoUrl: '',
    establishedYear: '',
    recognizedBy: '',
    recognizedByOther: '',
    collegeType: '',
    website: '',
    affiliatedTo: '',
    affiliatedUniversityName: '',
    aboutCollege: '',
    departments: ['General'], // Default to General department
    
    // Step 3
    address: '',
    location: '',
    landmark: '',
    pincode: '',
    city: '',
    state: '',
    coordinatorName: '',
    coordinatorDesignation: '',
    coordinatorDesignationOther: '',
    coordinatorNumber: '',
    coordinatorEmail: '',
    mobile: '',
    whatsappOptIn: true,
    
    mobileOtp: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Debug password changes
      if (name === 'password') {
        console.log('🔍 Password being updated:', value);
      }
      
      // Clear existing field error when user starts typing
      setFieldErrors(prev => prev.filter(error => error.field !== name));
      setError('');
      
      // Real-time validation for specific fields
      if (name === 'establishedYear' && value) {
        const validation = validateEstablishmentYear(value);
        if (!validation.isValid) {
          showFieldError(name, validation.message || '');
        }
      }
      
      if (name === 'website' && value) {
        const validation = validateWebsite(value);
        if (!validation.isValid) {
          showFieldError(name, validation.message || '');
        }
      }
      
      if (name === 'coordinatorEmail' && value) {
        const validation = validateEmail(value);
        if (!validation.isValid) {
          showFieldError(name, validation.message || '');
        }
      }
      
      if ((name === 'coordinatorNumber' || name === 'mobile') && value) {
        const validation = validatePhoneNumber(value);
        if (!validation.isValid) {
          showFieldError(name, validation.message || '');
        } else if (value.replace(/\D/g, '').length === 10) {
          // Check uniqueness only when phone number is complete
          checkPhoneUniqueness(value.replace(/\D/g, ''), name);
        }
      }
      
      // Auto-validate pincode when it's 6 digits
      if (name === 'pincode' && value.length === 6 && /^\d+$/.test(value)) {
        validatePincode(value);
      }
      
      // Prevent editing city/state if pincode is validated
      if ((name === 'city' || name === 'state') && pincodeValidated) {
        return; // Don't update these fields if pincode is validated
      }
    }
  };

  // Function to show field-specific errors with auto-hide after 3 seconds
  const showFieldError = (field: string, message: string) => {
    const newError: FieldError = {
      field,
      message,
      timestamp: Date.now()
    };
    
    setFieldErrors(prev => [
      ...prev.filter(error => error.field !== field),
      newError
    ]);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setFieldErrors(prev => prev.filter(error => error.timestamp !== newError.timestamp));
    }, 3000);
  };

  // Function to check if a field has an error
  const hasFieldError = (field: string) => {
    return fieldErrors.some(error => error.field === field);
  };

  // Function to get field error message
  const getFieldError = (field: string) => {
    const error = fieldErrors.find(error => error.field === field);
    return error ? error.message : '';
  };

  // Handle step from URL parameter and pre-filled data
  useEffect(() => {
    if (router.isReady && router.query.step) {
      const stepParam = parseInt(router.query.step as string);
      if (stepParam >= 1 && stepParam <= 4) {
        setStep(stepParam as Step);
      }

      // Handle verified data from registration modal
      if (router.query.verified_name && router.query.verified_email) {
        console.log('🔍 Verified data from modal:', {
          name: router.query.verified_name,
          email: router.query.verified_email,
          password: router.query.verified_password ? '[PRESENT]' : '[MISSING]'
        });
        
        setFormData(prev => ({
          ...prev,
          collegeName: decodeURIComponent(router.query.verified_name as string),
          email: decodeURIComponent(router.query.verified_email as string),
          password: router.query.verified_password ? decodeURIComponent(router.query.verified_password as string) : prev.password
        }));
        // Move to step 2 if coming from verification (unless step is already specified)
        if (!router.query.step) {
          setStep(2);
        }
      }
    }
  }, [router.isReady, router.query.step, router.query.verified_name, router.query.verified_email, router.query.verified_password]);

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

  // Auto-request location when step 3 loads
  useEffect(() => {
    if (step === 3 && !hasRequestedLocation) {
      setHasRequestedLocation(true);
      requestLocation();
    }
  }, [step, hasRequestedLocation]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
        userType: 'college'
      });

      if (response.data.otpId) {
        setEmailOtpId(response.data.otpId);
        setSuccess('OTP sent to your email successfully!');
        setOtpTimer(120); // 2 minutes
        setOtpModalType('email');
        setShowOtpModal(true); // Show email OTP modal
      }
    } catch (error: any) {
      console.error('OTP send error:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const sendMobileOTP = async () => {
    if (!formData.mobile) {
      setError('Please enter your mobile number');
      return;
    }

    if (!formData.collegeName) {
      setError('Please enter your college name');
      return;
    }

    // Validate phone number format
    const phoneValidation = validatePhoneNumber(formData.mobile);
    if (!phoneValidation.isValid) {
      setError(phoneValidation.message || 'Please enter a valid mobile number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // First check if phone number is unique
      const phoneExists = await checkPhoneUniqueness(formData.mobile.replace(/\D/g, ''), 'mobile');
      
      if (phoneExists === false) {
        // Phone number already exists, error will be shown by checkPhoneUniqueness
        setLoading(false);
        return;
      }

      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      console.log('📱 Sending WhatsApp OTP via URL parameters:', {
        phone: formData.mobile,
        name: formData.collegeName,
        otp: otp
      });
      
      // Send OTP via WhatsApp webhook using URL parameters
      const webhookUrl = `https://api.wabb.in/api/v1/webhooks-automation/catch/220/FQavVMJ9VP7G/?Phone=${encodeURIComponent(formData.mobile)}&Name=${encodeURIComponent(formData.collegeName)}&OTP=${encodeURIComponent(otp)}`;
      
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
        // Store the OTP temporarily (in real app, this should be stored securely on backend)
        localStorage.setItem('tempMobileOtp', otp);
        localStorage.setItem('tempMobileOtpExpiry', (Date.now() + 10 * 60 * 1000).toString()); // 10 minutes
        
        console.log('✅ OTP stored:', {
          otp: otp,
          expiry: new Date(Date.now() + 10 * 60 * 1000).toISOString()
        });
        
        setMobileOtpId('webhook-' + Date.now()); // Use timestamp as OTP ID
        setOtpModalType('mobile');
        setShowOtpModal(true);
        setOtpTimer(120);
        setSuccess('OTP sent to your WhatsApp number!');
      } else {
        const errorText = await webhookResponse.text();
        console.error('❌ Webhook error:', errorText);
        throw new Error(`Failed to send WhatsApp OTP: ${errorText}`);
      }
    } catch (error: any) {
      console.error('WhatsApp OTP send error:', error);
      setError('Failed to send WhatsApp OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  const verifyEmailOTP = async () => {
    if (!formData.emailOtp || formData.emailOtp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.VERIFY_OTP}`, {
        otpId: emailOtpId,
        otp: formData.emailOtp,
        userType: 'college',
        method: 'email'
      });

      if (response.data.verified) {
        setSuccess('Email verified successfully!');
        setShowOtpModal(false);
        setStep(2); // Move to next step
      } else {
        setError('Invalid OTP. Please try again.');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

    // Function to send WhatsApp notification
  const sendWhatsAppNotification = async (message: string) => {
    try {
      await fetch('https://api.wabb.in/api/v1/webhooks-automation/catch/220/FQavVMJ9VP7G/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          timestamp: new Date().toISOString(),
          type: 'college_registration'
        }),
      });
    } catch (error) {
      console.error('WhatsApp notification failed:', error);
    }
  };

  // Function to validate pincode and auto-fill city/state
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
            city: postOffice.District || '',
            state: postOffice.State || ''
          }));
          
          setPincodeValidated(true);
          
          // Clear any pincode errors
          setFieldErrors(prev => prev.filter(error => error.field !== 'pincode'));
          
          return true;
        } else {
          showFieldError('pincode', 'Invalid pincode. Please check and try again.');
          setPincodeValidated(false);
          return false;
        }
      } catch (error) {
        console.error('Error validating pincode:', error);
        showFieldError('pincode', 'Error validating pincode. Please try again.');
        setPincodeValidated(false);
        return false;
      }
    }
    return false;
  };

  // Function to request location with permission prompt
  const requestLocation = () => {
    if (!navigator.geolocation) {
      console.log('Geolocation is not supported by this browser.');
      showFieldError('location', 'Geolocation is not supported by your browser.');
      return;
    }

    setIsLoadingLocation(true);
    
    // Show user that we're requesting location access
    showFieldError('location', 'Requesting location access... Please allow location permission.');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Clear the location request message
          setFieldErrors(prev => prev.filter(error => error.field !== 'location'));
          
          // Use a simpler reverse geocoding API
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
          const data = await response.json();
          
          if (data.address) {
            const address = data.address;
            
            setFormData(prev => ({
              ...prev,
              location: `${latitude}, ${longitude}`,
              address: data.display_name || '',
              city: address.city || address.town || address.village || address.suburb || '',
              state: address.state || '',
              pincode: address.postcode || ''
            }));
            
            // Show success message
            showFieldError('location', '✅ Location detected successfully!');
            setTimeout(() => {
              setFieldErrors(prev => prev.filter(error => error.field !== 'location'));
            }, 3000);
            
            // Validate pincode if we got one
            if (address.postcode) {
              validatePincode(address.postcode);
            }
          }
        } catch (error) {
          console.error('Error getting location details:', error);
          showFieldError('location', 'Error getting location details. You can enter the address manually.');
        }
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsLoadingLocation(false);
        
        let errorMessage = 'Unable to get your location. ';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location access denied. Please enable location permission and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
            break;
        }
        
        showFieldError('location', errorMessage);
        
        // Clear error after 5 seconds
        setTimeout(() => {
          setFieldErrors(prev => prev.filter(error => error.field !== 'location'));
        }, 5000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Function to check phone number uniqueness
  const checkPhoneUniqueness = async (phoneNumber: string, fieldName: string) => {
    if (!phoneNumber || phoneNumber.length !== 10) return;
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/check-phone-uniqueness`, {
        phoneNumber: phoneNumber,
        userType: 'college'
      });
      
      if (!response.data.isUnique) {
        showFieldError(fieldName, 'This phone number is already registered. Please use a different number.');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking phone uniqueness:', error);
      // Don't block registration if API fails, but log the error
      return true;
    }
  };

  const submitRegistration = async () => {
    setLoading(true);
    setError('');

    // Validate password before submission
    if (!formData.password || formData.password.trim() === '') {
      setError('Password is required for registration. Please go back to Step 1 and enter your password.');
      setLoading(false);
      return;
    }

    try {
      let logoUrl = '';
      
      // First, register the college
      console.log('🔍 Frontend Debug - Password in formData:', formData.password);
      console.log('🔍 Frontend Debug - Full formData:', { 
        email: formData.email, 
        password: formData.password,
        collegeName: formData.collegeName 
      });
      
      const registrationData = {
        email: formData.email,
        password: formData.password,
        role: 'college',
        phoneNumber: formData.mobile,
        whatsappNumber: formData.mobile,
        otpId: emailOtpId,
        profileData: {
          collegeName: formData.collegeName,
          collegeType: formData.collegeType,
          establishedYear: formData.establishedYear ? Number(formData.establishedYear) : undefined,
          recognizedBy: formData.recognizedBy === 'Other' ? formData.recognizedByOther : formData.recognizedBy,
          website: formData.website,
          affiliation: formData.affiliatedTo === 'Other' ? formData.affiliatedUniversityName : formData.affiliatedTo,
          affiliatedTo: formData.affiliatedTo === 'Other' ? formData.affiliatedUniversityName : formData.affiliatedTo,
          affiliatedUniversityName: formData.affiliatedUniversityName,
          aboutCollege: formData.aboutCollege,
          
          // Address fields (direct fields)
          street: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.pincode, // Backend expects zipCode, not pincode
          landmark: formData.landmark,
          location: formData.location,
          
          // Primary contact fields (direct fields as API expects)
          contactName: formData.coordinatorName,
          contactDesignation: formData.coordinatorDesignation === 'Other' ? formData.coordinatorDesignationOther : formData.coordinatorDesignation,
          contactEmail: formData.coordinatorEmail,
          contactPhone: formData.coordinatorNumber,
          
          // Also include coordinator fields for backward compatibility
          coordinatorName: formData.coordinatorName,
          coordinatorDesignation: formData.coordinatorDesignation === 'Other' ? formData.coordinatorDesignationOther : formData.coordinatorDesignation,
          coordinatorEmail: formData.coordinatorEmail,
          coordinatorNumber: formData.coordinatorNumber,
          mobile: formData.mobile,
          departments: formData.departments, // Include departments for backend
          
          logo: logoUrl
        }
      };

      console.log('Registration data:', registrationData);

      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.REGISTER}`, registrationData);

      console.log('Registration response:', response.data);

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Decode token to get userId and store in localStorage for consistency
        const token = response.data.token;
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
          ).join(''));
          const payload = JSON.parse(jsonPayload);
          const userId = payload.userId;
          localStorage.setItem('userId', userId);
          console.log('Stored userId in localStorage after college registration:', userId);
        } catch (tokenError) {
          console.error('Error decoding token for userId:', tokenError);
        }
        
        // Upload logo if provided
        if (formData.logoFile) {
          try {
            const logoFormData = new FormData();
            logoFormData.append('logo', formData.logoFile);
            
            const logoResponse = await axios.post(
              `${API_BASE_URL}/api/files/college/logo`,
              logoFormData,
              {
                headers: {
                  'Authorization': `Bearer ${response.data.token}`,
                  'Content-Type': 'multipart/form-data'
                }
              }
            );
            
            console.log('Logo uploaded successfully:', logoResponse.data);
          } catch (logoError: any) {
            console.error('Logo upload failed:', logoError);
            // Don't fail registration if logo upload fails
          }
        }
        
        // Send WhatsApp notification
        await sendWhatsAppNotification(`New college registration: ${formData.collegeName} (${formData.email})`);
        
        setStep(4); // Move to verification success page
        setSuccess('Registration successful! Your account is under review.');
      }
    } catch (error: any) {
      console.error('Registration error:', error.response?.data);
      setError(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
      setShowOtpModal(false);
    }
  };

  const verifyMobileOTP = async () => {
    if (!formData.mobileOtp || formData.mobileOtp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get stored OTP and check expiry
      const storedOtp = localStorage.getItem('tempMobileOtp');
      const otpExpiry = localStorage.getItem('tempMobileOtpExpiry');
      
      console.log('🔍 Verifying OTP:', {
        enteredOtp: formData.mobileOtp,
        storedOtp: storedOtp,
        expiry: otpExpiry ? new Date(parseInt(otpExpiry)).toISOString() : 'none',
        isExpired: otpExpiry ? Date.now() > parseInt(otpExpiry) : 'no expiry'
      });
      
      if (!storedOtp || !otpExpiry || Date.now() > parseInt(otpExpiry)) {
        setError('OTP has expired. Please request a new one.');
        localStorage.removeItem('tempMobileOtp');
        localStorage.removeItem('tempMobileOtpExpiry');
        setLoading(false);
        return;
      }
      
      if (formData.mobileOtp === storedOtp) {
        console.log('✅ OTP verification successful!');
        setSuccess('Mobile number verified successfully!');
        
        // Clean up stored OTP
        localStorage.removeItem('tempMobileOtp');
        localStorage.removeItem('tempMobileOtpExpiry');
        
        await submitRegistration();
      } else {
        console.log('❌ OTP mismatch');
        setError('Invalid OTP. Please try again.');
      }
    } catch (error: any) {
      console.error('Mobile OTP verification error:', error);
      setError('OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    setError('');
    
    if (step === 1) {
      const validation = validateStep1(formData);
      if (!validation.isValid) {
        setError(validation.message || 'Please fix the errors and try again');
        return;
      }
      sendEmailOTP();
      return;
    }
    
    if (step === 2) {
      const validation = validateStep2(formData);
      if (!validation.isValid) {
        setError(validation.message || 'Please fix the errors and try again');
        return;
      }
    }
    
    if (step === 3) {
      // Step 3 validation for contact information
      const validation = validateStep3(formData);
      if (!validation.isValid) {
        setError(validation.message || 'Please fix the errors and try again');
        return;
      }
      sendMobileOTP();
      return;
    }
    
    setStep((prev) => (prev + 1) as Step);
  };

  const prevStep = () => {
    if (step > 1) setStep((prev) => (prev - 1) as Step);
  };

  if (step === 4) {
    // Auto redirect to verification progress page
    router.push('/approval-status?type=college');
    return null;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F7FF' }}>
      <CollegeRegistrationNavbar 
        currentStep={step}
        registrationStatus={step === 1 ? 'college_info' : step === 2 ? 'college_info' : 'contact_info'}
        collegeName={formData.collegeName}
      />
      
      <div className="max-w-screen-2xl mx-auto px-6 py-4">
        {/* Step 1: Create Account */}
        {step === 1 && (
          <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#F5F7FF' }}>
            <div className="flex bg-white rounded-2xl shadow-xl overflow-hidden max-w-5xl w-full">
              {/* Left Side - Illustration */}
              <div className="w-1/2 bg-gradient-to-br from-blue-50 to-blue-100 p-12 flex flex-col justify-center">
                <div className="text-center mb-8">
                  <div className="relative mb-8">
                    <div className="w-80 h-80 mx-auto relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-full"></div>
                      <div className="absolute inset-8 bg-gradient-to-br from-yellow-400 to-orange-300 rounded-full flex items-center justify-center">
                        <div className="text-center text-white">
                          <div className="text-2xl mb-2">💼</div>
                          <div className="text-sm font-medium">Best college fresh talents</div>
                        </div>
                      </div>
                      {/* Chat bubbles */}
                      <div className="absolute top-12 right-8 bg-blue-500 rounded-full p-3">
                        <div className="text-white text-sm">👥</div>
                      </div>
                      <div className="absolute top-24 right-4 bg-red-500 rounded-full p-2">
                        <div className="text-white text-xs">❤</div>
                      </div>
                      <div className="absolute bottom-16 left-8 bg-purple-500 rounded-full p-3">
                        <div className="text-white text-sm">💬</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">
                    Hire interns & <span className="text-blue-600">fresh</span><br />
                    <span className="text-blue-600">graduates</span>
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    Connect with job-ready students from verified<br />
                    colleges—faster, smarter.
                  </p>
                </div>
                
                {/* Pagination dots */}
                <div className="flex justify-center mt-8 space-x-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                </div>
              </div>
              
              {/* Right Side - Form */}
              <div className="w-1/2 p-12">
                <div className="flex justify-between items-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-800">
                    Create an <span className="text-blue-600">Account !!</span>
                  </h1>
                  <button
                    onClick={() => router.push('/')}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
                
                {/* Account Type Tabs */}
                <div className="flex bg-gray-100 rounded-lg p-1 mb-8">
                  <button 
                    onClick={() => router.push('/register/student')}
                    className="flex-1 py-2 px-4 text-sm text-gray-600 rounded-lg transition-colors"
                  >
                    Student
                  </button>
                  <button className="flex-1 py-2 px-4 text-sm bg-white text-blue-600 rounded-lg shadow-sm font-medium">
                    College
                  </button>
                  <button 
                    onClick={() => router.push('/register/company')}
                    className="flex-1 py-2 px-4 text-sm text-gray-600 rounded-lg transition-colors"
                  >
                    Company
                  </button>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                  </div>
                )}
                
                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                    {success}
                  </div>
                )}
                
                <form className="space-y-6">
                  <div>
                    <input
                      name="collegeName"
                      type="text"
                      placeholder="College Name"
                      className="w-full h-12 px-4 border border-gray-200 rounded-full bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      value={formData.collegeName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <input
                      name="email"
                      type="email"
                      placeholder="College email Id"
                      className="w-full h-12 px-4 border border-gray-200 rounded-full bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      className="w-full min-h-[180px] px-4 py-3 border border-gray-200 rounded-full bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      👁
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input
                      name="agreeTerms"
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      checked={formData.agreeTerms}
                      onChange={handleInputChange}
                      required
                    />
                    <label className="text-sm text-gray-600">
                      I have read and agree with all terms and conditions.
                    </label>
                  </div>
                  
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {loading ? 'Sending OTP...' : 'Sign up'}
                  </button>
                  
                  <p className="text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => router.push('/login')}
                      className="text-blue-600 hover:underline"
                    >
                      Login
                    </button>
                  </p>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: College Information */}
        {step === 2 && (
          <div className="max-w-screen-2xl mx-auto px-6">
            {/* Header outside the white box */}
            <div className="mb-6 text-center">
              <h2 className="text-[28px] sm:text-[28px] font-bold text-gray-900 tracking-tight mb-2">College information</h2>
              <p className="text-gray-600 text-base sm:text-[24] leading-relaxed">
                Please share a few basic details about your institution. This helps us to verify your college and present it to students and recruiters with trust and credibility.
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
                    {formData.logoFile ? 'Change Logo' : 'Upload College Logo*'}
                  </label>

                  <div></div> {/* Empty column to balance center alignment */}
              </div>

              </div>

              <div className="grid md:grid-cols-2 gap-5 md:gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">College name*</label>
                  <input
                    name="collegeName"
                    type="text"
                    placeholder="Enter your college name"
                    className="w-full h-12 px-4 border border-gray-200 rounded-full bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    value={formData.collegeName}
                    onChange={handleInputChange}
                    required
                    readOnly={!!router.query.verified_name}
                    style={router.query.verified_name ? { backgroundColor: '#f9f9f9', cursor: 'not-allowed' } : {}}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">College establish year*</label>
                  <input
                    name="establishedYear"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Enter establishment year (e.g. 1985)"
                    className={`w-full h-12 px-4 border rounded-full bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-4 ${
                      hasFieldError('establishedYear')
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                    }`}
                    value={formData.establishedYear}
                    onChange={(e) => {
                      // Only allow digits and limit to 4 characters for year
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setFormData(prev => ({ ...prev, establishedYear: value }));
                      
                      // Clear existing field error when user starts typing
                      setFieldErrors(prev => prev.filter(error => error.field !== 'establishedYear'));
                      setError('');
                      
                      // Real-time validation for establishment year
                      if (value) {
                        const validation = validateEstablishmentYear(value);
                        if (!validation.isValid) {
                          showFieldError('establishedYear', validation.message || '');
                        }
                      }
                    }}
                    required
                  />
                  {getFieldError('establishedYear') && (
                    <p className="text-red-500 text-sm mt-1 font-medium">
                      {getFieldError('establishedYear')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">College email*</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="admin@college.edu"
                    className="w-full h-12 px-4 border border-gray-200 rounded-full bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    readOnly={!!router.query.verified_email}
                    style={router.query.verified_email ? { backgroundColor: '#f9f9f9', cursor: 'not-allowed' } : {}}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Recognized by*</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter recognized by"
                      className="w-full h-12 px-4 border border-gray-200 rounded-full bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      value={recognizedBySearch}
                      onChange={(e) => setRecognizedBySearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          const value = recognizedBySearch.trim();
                          if (value) {
                            const current = formData.recognizedByOther ? formData.recognizedByOther.split(',').map(s => s.trim()).filter(s => s) : [];
                            if (!current.includes(value)) {
                              setFormData(prev => ({ 
                                ...prev, 
                                recognizedBy: 'Other',
                                recognizedByOther: [...current, value].join(', ')
                              }));
                            }
                            setRecognizedBySearch('');
                          }
                        }
                      }}
                    />
                    
                    {/* Dropdown suggestions */}
                    {recognizedBySearch && (
                      <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl mt-1 shadow-[0_10px_30px_rgba(2,32,71,0.08)]">
                        {['UGC', 'AICTE', 'MCI', 'DCI', 'BCI', 'NCTE', 'ICAR']
                          .filter(option => option.toLowerCase().includes(recognizedBySearch.toLowerCase()))
                          .map(option => (
                            <div
                              key={option}
                              className="px-4 py-2 rounded-xl hover:bg-blue-50 cursor-pointer"
                              onClick={() => {
                                const current = formData.recognizedByOther ? formData.recognizedByOther.split(',').map(s => s.trim()).filter(s => s) : [];
                                if (!current.includes(option)) {
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    recognizedBy: 'Other',
                                    recognizedByOther: [...current, option].join(', ')
                                  }));
                                }
                                setRecognizedBySearch('');
                              }}
                            >
                              {option}
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                  
                  {/* Selected tags */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.recognizedByOther && formData.recognizedByOther.split(',').map(tag => tag.trim()).filter(tag => tag).map((tag, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-sm flex items-center">
                        {tag}
                        <button
                          type="button"
                          onClick={() => {
                            const current = formData.recognizedByOther.split(',').map(s => s.trim()).filter(s => s);
                            const updated = current.filter(t => t !== tag);
                            setFormData(prev => ({ 
                              ...prev, 
                              recognizedByOther: updated.join(', '),
                              recognizedBy: updated.length > 0 ? 'Other' : ''
                            }));
                          }}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

<div>
  <label className="block text-sm font-medium text-gray-800 mb-2">Select your college type*</label>
  <div className="relative">
    <input
      type="text"
      placeholder="Enter or select college type"
      className="w-full h-12 px-4 pr-10 border border-gray-200 rounded-full bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      value={formData.collegeType || collegeTypeSearch}
      onChange={(e) => {
        const value = e.target.value;
        setCollegeTypeSearch(value);
        setFormData(prev => ({
          ...prev,
          collegeType: value
        }));
        setShowCollegeTypeDropdown(true);
      }}
      onFocus={() => setShowCollegeTypeDropdown(true)}
      onBlur={() => setTimeout(() => setShowCollegeTypeDropdown(false), 200)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          const value = collegeTypeSearch.trim();
          if (value) {
            setFormData(prev => ({
              ...prev,
              collegeType: value
            }));
            setCollegeTypeSearch('');
            setShowCollegeTypeDropdown(false);
          }
        }
      }}
      required
    />

    {/* Dropdown arrow */}
    <div 
      className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
      onClick={() => setShowCollegeTypeDropdown(!showCollegeTypeDropdown)}
    >
      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>

    {/* Dropdown suggestions - show when typing OR when dropdown is open */}
    {(showCollegeTypeDropdown || collegeTypeSearch) && (
      <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl mt-1 shadow-[0_10px_30px_rgba(2,32,71,0.08)] max-h-60 overflow-y-auto">
        {[
          'Private College',
          'Aided College',
          'Autonomous College',
          'Deemed University',
          'State University',
          'Central University'
        ]
          .filter(option =>
            !collegeTypeSearch || option.toLowerCase().includes(collegeTypeSearch.toLowerCase())
          )
          .map(option => (
            <div
              key={option}
              className="px-4 py-2 rounded-xl hover:bg-blue-50 cursor-pointer"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  collegeType: option
                }));
                setCollegeTypeSearch('');
                setShowCollegeTypeDropdown(false);
              }}
            >
              {option}
            </div>
          ))}
      </div>
    )}
  </div>
</div>


                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">College Website</label>
                  <input
                    name="website"
                    type="url"
                    placeholder="Enter your college URL link"
                    className={`w-full h-12 px-4 border rounded-full bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-4 ${
                      hasFieldError('website')
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                    }`}
                    value={formData.website}
                    onChange={handleInputChange}
                    required
                  />
                  {getFieldError('website') && (
                    <p className="text-red-500 text-sm mt-1 font-medium">
                      {getFieldError('website')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Affiliated University Name*</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter affiliated university name"
                      className="w-full h-12 px-4 pr-10 border border-gray-200 rounded-full bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      value={formData.affiliatedUniversityName || affiliatedToSearch}
                      onChange={(e) => {
                        const value = e.target.value;
                        setAffiliatedToSearch(value);
                        setFormData(prev => ({
                          ...prev,
                          affiliatedUniversityName: value,
                          affiliatedTo: value // Keep for backend compatibility
                        }));
                        setShowAffiliatedDropdown(true);
                      }}
                      onFocus={() => setShowAffiliatedDropdown(true)}
                      onBlur={() => setTimeout(() => setShowAffiliatedDropdown(false), 200)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          const value = affiliatedToSearch.trim();
                          if (value) {
                            setFormData(prev => ({
                              ...prev,
                              affiliatedUniversityName: value,
                              affiliatedTo: value,
                            }));
                            setAffiliatedToSearch('');
                            setShowAffiliatedDropdown(false);
                          }
                        }
                      }}
                      required
                    />

                    {/* Dropdown arrow */}
                    <div 
                      className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                      onClick={() => setShowAffiliatedDropdown(!showAffiliatedDropdown)}
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    
                    {/* Dropdown suggestions - show when typing OR when dropdown is open */}
                    {(showAffiliatedDropdown || affiliatedToSearch) && (
                      <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl mt-1 shadow-[0_10px_30px_rgba(2,32,71,0.08)] max-h-60 overflow-y-auto">
                        {[
                          'Visvesvaraya Technological University',
                          'Banglore Central University',
                          'Banglore University',
                          'Gulbarga University',
                          'Karnataka University',
                          'Mysore University',
                        ]
                          .filter(option =>
                            !affiliatedToSearch || option.toLowerCase().includes(affiliatedToSearch.toLowerCase())
                          )
                          .map(option => (
                            <div
                              key={option}
                              className="px-4 py-2 rounded-xl hover:bg-blue-50 cursor-pointer"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  affiliatedUniversityName: option,
                                  affiliatedTo: option,
                                }));
                                setAffiliatedToSearch('');
                                setShowAffiliatedDropdown(false);
                              }}
                            >
                              {option}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-800 mb-2">About the college*</label>
                <textarea
                  name="aboutCollege"
                  rows={6}
                  placeholder="Enter about your college (minimum 50 characters)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  value={formData.aboutCollege}
                  onChange={handleInputChange}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-gray-500">
                    {formData.aboutCollege.length} characters 
                    {formData.aboutCollege.length < 50 && (
                      <span className="text-red-500"> (minimum 50 required)</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={nextStep}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium shadow-sm transition-colors aspect-[4.5/1] w-44 flex items-center justify-center text-sm"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Contact Information */}
        {(step as Step) === 3 && (
          <div className="max-w-screen-2xl mx-auto px-6">
            {/* Header outside the white box */}
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-3">Contact information</h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                One more step! Share your contact details to verify your college and connect with recruiters.
              </p>
            </div>

            {/* White content box */}
           <div className="bg-white rounded-2xl border border-gray-100 w-full p-6 sm:p-8 lg:p-10 shadow-[0_10px_30px_rgba(2,32,71,0.08)]">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">College address*</label>
                  <textarea
                    name="address"
                    rows={4}
                    placeholder="123, ABC Institute of Technology, Outer Ring Road, Bengaluru, Karnataka - 560037"
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-5 md:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">Location*</label>
                    <div className="relative">
                      <input
                        name="location"
                        type="text"
                        placeholder="Search location"
                        className="w-full h-12 px-4 pr-12 border border-gray-200 rounded-full bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        value={formData.location}
                        onChange={handleInputChange}
                        required
                      />
                      <button
                        type="button"
                        onClick={requestLocation}
                        disabled={isLoadingLocation}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600 hover:text-blue-700 disabled:opacity-50"
                        title="Get current location"
                      >
                        {isLoadingLocation ? (
                          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {getFieldError('location') && (
                      <p className={`text-sm mt-1 font-medium ${getFieldError('location')?.includes('✅') ? 'text-green-600' : 'text-blue-600'}`}>
                        {getFieldError('location')}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">Landmark*</label>
                    <input
                      name="landmark"
                      type="text"
                      placeholder="Enter your nearest landmark"
                      className="w-full h-12 px-4 border border-gray-200 rounded-full bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      value={formData.landmark}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">Pincode*</label>
                    <input
                      name="pincode"
                      type="text"
                      placeholder="Enter six digit pincode"
                      className={`w-full h-12 px-4 border rounded-full bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-4 ${
                        hasFieldError('pincode')
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                      }`}
                      value={formData.pincode}
                      onChange={handleInputChange}
                      required
                    />
                    {getFieldError('pincode') && (
                      <p className="text-red-500 text-sm mt-1 font-medium">
                        {getFieldError('pincode')}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">City*</label>
                    <input
                      name="city"
                      type="text"
                      placeholder="City will auto-fill from pincode"
                      className={`w-full h-12 px-4 border rounded-full text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-4 ${
                        pincodeValidated 
                          ? 'bg-gray-100 border-gray-300 cursor-not-allowed text-gray-600'
                          : 'bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                      }`}
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      readOnly={pincodeValidated}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">State*</label>
                  <div className="relative">
                    <select
                      name="state"
                      className={`w-full h-12 px-4 pr-10 border rounded-full text-gray-900 shadow-sm focus:outline-none focus:ring-4 appearance-none cursor-pointer ${
                        pincodeValidated 
                          ? 'bg-gray-100 border-gray-300 cursor-not-allowed text-gray-600'
                          : 'bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                      }`}
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                      disabled={pincodeValidated}
                    >
                      <option value="">Select your state</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Telangana">Telangana</option>
                      <option value="Gujarat">Gujarat</option>
                    </select>
                    {/* Custom dropdown arrow */}
                    {!pincodeValidated && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-6 mt-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6">Contact Information</h3>
                  
                  <div className="grid md:grid-cols-2 gap-5 md:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">Co-ordinator name*</label>
                      <input
                        name="coordinatorName"
                        type="text"
                        placeholder="Please enter co-ordinator name"
                        className="w-full h-12 px-4 border border-gray-200 rounded-full bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        value={formData.coordinatorName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

<div>
  <label className="block text-sm font-medium text-gray-800 mb-2">Co-ordinator designation*</label>
  <div className="relative">
    <input
      type="text"
      placeholder="Enter or select designation"
      className="w-full h-12 px-4 pr-10 border border-gray-200 rounded-full bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      value={formData.coordinatorDesignation || designationSearch}
      onChange={(e) => {
        const value = e.target.value;
        setDesignationSearch(value);
        setFormData(prev => ({
          ...prev,
          coordinatorDesignation: value,
          coordinatorDesignationOther: ''
        }));
        setShowDesignationDropdown(true);
      }}
      onFocus={() => setShowDesignationDropdown(true)}
      onBlur={() => setTimeout(() => setShowDesignationDropdown(false), 200)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          const value = designationSearch.trim();
          if (value) {
            setFormData(prev => ({
              ...prev,
              coordinatorDesignation: value,
              coordinatorDesignationOther: value,
            }));
            setDesignationSearch('');
            setShowDesignationDropdown(false);
          }
        }
      }}
      required
    />

    {/* Dropdown arrow */}
    <div 
      className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
      onClick={() => setShowDesignationDropdown(!showDesignationDropdown)}
    >
      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>

    {/* Dropdown suggestions - show when typing OR when dropdown is open */}
    {(showDesignationDropdown || designationSearch) && (
      <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl mt-1 shadow-[0_10px_30px_rgba(2,32,71,0.08)] max-h-60 overflow-y-auto">
        {[
          'Principal',
          'Vice Principal',
          'Dean',
          'Admission Officer',
          'Admin Head',
          'Training Placement Officer',
        ]
          .filter(option =>
            !designationSearch || option.toLowerCase().includes(designationSearch.toLowerCase())
          )
          .map(option => (
            <div
              key={option}
              className="px-4 py-2 rounded-xl hover:bg-blue-50 cursor-pointer"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  coordinatorDesignation: option,
                  coordinatorDesignationOther: '',
                }));
                setDesignationSearch('');
                setShowDesignationDropdown(false);
              }}
            >
              {option}
            </div>
          ))}
      </div>
    )}
  </div>
</div>

                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">Co-ordinator number*</label>
                      <input
                        name="coordinatorNumber"
                        type="tel"
                        placeholder="Enter co-ordinator number"
                        maxLength={10}
                        pattern="[0-9]*"
                        inputMode="numeric"
                        className={`w-full h-12 px-4 border rounded-full bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-4 ${
                          hasFieldError('coordinatorNumber')
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                            : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                        }`}
                        value={formData.coordinatorNumber}
                        onChange={(e) => {
                          // Only allow digits and limit to 10 characters
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setFormData(prev => ({ ...prev, coordinatorNumber: value }));
                          
                          // Clear existing field error when user starts typing
                          setFieldErrors(prev => prev.filter(error => error.field !== 'coordinatorNumber'));
                          setError('');
                          
                          // Validate phone number
                          if (value) {
                            const validation = validatePhoneNumber(value);
                            if (!validation.isValid) {
                              showFieldError('coordinatorNumber', validation.message || '');
                            } else if (value.length === 10) {
                              // Check uniqueness only when phone number is complete
                              checkPhoneUniqueness(value, 'coordinatorNumber');
                            }
                          }
                        }}
                        required
                      />
                      {getFieldError('coordinatorNumber') && (
                        <p className="text-red-500 text-sm mt-1 font-medium">
                          {getFieldError('coordinatorNumber')}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">Co-ordinator email*</label>
                      <input
                        name="coordinatorEmail"
                        type="email"
                        placeholder="Please enter co-ordinator email"
                        className={`w-full h-12 px-4 border rounded-full bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-4 ${
                          hasFieldError('coordinatorEmail')
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                            : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                        }`}
                        value={formData.coordinatorEmail}
                        onChange={handleInputChange}
                        required
                      />
                      {getFieldError('coordinatorEmail') && (
                        <p className="text-red-500 text-sm mt-1 font-medium">
                          {getFieldError('coordinatorEmail')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-800 mb-2">Mobile*</label>
                    <div className="flex gap-2">
                      <input
                        name="mobile"
                        type="tel"
                        placeholder="9876543210"
                        maxLength={10}
                        pattern="[0-9]*"
                        inputMode="numeric"
                        className={`flex-1 h-12 px-4 border rounded-full focus:outline-none focus:ring-4 ${
                          hasFieldError('mobile')
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                            : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                        }`}
                        value={formData.mobile}
                        onChange={(e) => {
                          // Only allow digits and limit to 10 characters
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setFormData(prev => ({ ...prev, mobile: value }));
                          
                          // Clear existing field error when user starts typing
                          setFieldErrors(prev => prev.filter(error => error.field !== 'mobile'));
                          setError('');
                          
                          // Validate phone number
                          if (value) {
                            const validation = validatePhoneNumber(value);
                            if (!validation.isValid) {
                              showFieldError('mobile', validation.message || '');
                            } else if (value.length === 10) {
                              // Check uniqueness only when phone number is complete
                              checkPhoneUniqueness(value, 'mobile');
                            }
                          }
                        }}
                        required
                      />
                      <button
                        type="button"
                        onClick={sendMobileOTP}
                        disabled={loading || !formData.mobile || formData.mobile.replace(/\D/g, '').length !== 10}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-medium disabled:opacity-50 transition-colors aspect-[4.5/1] w-44 flex items-center justify-center"
                      >
                        {loading ? 'Sending...' : 'Get OTP'}
                      </button>
                    </div>
                    {getFieldError('mobile') && (
                      <p className="text-red-500 text-sm mt-1 font-medium">
                        {getFieldError('mobile')}
                      </p>
                    )}
                  </div>

<div className="mt-4 flex items-center gap-3">
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      name="whatsappOptIn"
      type="checkbox"
      className="sr-only peer"
      checked={formData.whatsappOptIn}
      onChange={handleInputChange}
    />
    <div
      className={`relative w-16 h-7 rounded-full flex items-center transition-colors duration-300 ${
        formData.whatsappOptIn ? 'bg-gray-500' : 'bg-green-500'
      }`}
    >
      {/* ON text (right aligned) */}
      <span
        className={`absolute right-2 text-xs font-bold transition-opacity duration-300 ${
          formData.whatsappOptIn ? 'text-white opacity-100' : 'opacity-0'
        }`}
      >
        ON
      </span>

      {/* OFF text (left aligned) */}
      <span
        className={`absolute left-2 text-xs font-bold transition-opacity duration-300 ${
          formData.whatsappOptIn ? 'opacity-0' : 'text-white opacity-100'
        }`}
      >
        OFF
      </span>

      {/* Knob */}
      <div
        className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
          formData.whatsappOptIn ? 'translate-x-0 left-0.5' : 'translate-x-9'
        }`}
      ></div>
    </div>
  </label>

  <span className="text-sm leading-6 text-gray-600">
    Get instant alert on WhatsApp for recruiter invites and placement updates. You can turn off this anytime.
  </span>
</div>

                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8">
                <button
                  onClick={prevStep}
                  className="border border-gray-300 text-gray-700 px-8 py-3 rounded-full hover:bg-gray-50 font-medium transition-colors aspect-[4.5/1] w-44"
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-medium shadow-sm transition-colors aspect-[4.5/1] w-44"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {otpModalType === 'email' ? 'Verification code' : 'Verify your number'}
              </h2>
              <button
                onClick={() => setShowOtpModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <p className="text-gray-600 text-center mb-8">
              {otpModalType === 'email' 
                ? 'Enter the 6 digits code that we have send through your email' 
                : 'Enter 6-digits code we sent to your mobile number'
              }
            </p>
            
            <div className="flex justify-center space-x-3 mb-8">
              {Array.from({ length: otpModalType === 'email' ? 6 : 6 }).map((_, index) => (
                <input
                  key={index}
                  ref={el => {
                    if (el) otpInputRefs.current[index] = el;
                  }}
                  type="text"
                  maxLength={1}
                  className="w-12 h-12 border border-gray-200 rounded-xl text-center text-lg font-semibold shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  value={
                    otpModalType === 'email' 
                      ? formData.emailOtp[index] || '' 
                      : formData.mobileOtp[index] || ''
                  }
                  onChange={(e) => handleOtpInput(index, e.target.value, otpModalType)}
                />
              ))}
            </div>
            
            <button
              onClick={otpModalType === 'email' ? verifyEmailOTP : verifyMobileOTP}
              disabled={
                loading || 
                (otpModalType === 'email' ? formData.emailOtp.length !== 6 : formData.mobileOtp.length !== 6)
              }
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium disabled:opacity-50 transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            
            <p className="text-center text-sm text-gray-600 mt-4">
              Did not receive code?{' '}
              {otpTimer > 0 ? (
                <span className="text-blue-600">Resend in {formatTime(otpTimer)}</span>
              ) : (
                <button
                  onClick={otpModalType === 'email' ? sendEmailOTP : sendMobileOTP}
                  className="text-blue-600 hover:underline"
                >
                  Resend
                </button>
              )}
            </p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
