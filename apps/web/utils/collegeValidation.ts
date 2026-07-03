// Validation utilitie// W// Validation utilities for college registration

export interface ValidationResult {
  isValid: boolean;
  message: string;
}

// Email validation
export const validateEmail = (email: string): ValidationResult => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email || !email.trim()) {
    return { isValid: false, message: 'Email is required' };
  }
  
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }
  
  return { isValid: true, message: '' };
};

// Website validation
export const validateWebsite = (website: string): ValidationResult => {
  if (!website || !website.trim()) {
    return { isValid: false, message: 'Website URL is required' }; // Website is now required
  }
  
  // Remove any whitespace
  const cleanWebsite = website.trim();
  
  // Add protocol if missing
  const websiteWithProtocol = cleanWebsite.startsWith('http://') || cleanWebsite.startsWith('https://') 
    ? cleanWebsite 
    : `https://${cleanWebsite}`;
  
  // Enhanced URL regex pattern
  const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
  
  if (!urlRegex.test(websiteWithProtocol)) {
    return { isValid: false, message: 'Please enter a valid website URL (e.g., www.college.edu or https://college.edu)' };
  }
  
  // Extract domain for additional validation
  try {
    const url = new URL(websiteWithProtocol);
    const domain = url.hostname;
    
    // Check if domain ends with symbols like !, @, #, $, etc.
    if (/[!@#$%^&*()+={}[\]|\\:";'<>?,/]$/.test(domain)) {
      return { isValid: false, message: 'Domain cannot end with symbols like !, @, #, etc.' };
    }
    
    // Check if domain ends with hyphen
    if (domain.endsWith('-')) {
      return { isValid: false, message: 'Domain cannot end with a hyphen' };
    }
    
    // Check if domain starts with hyphen
    if (domain.startsWith('-')) {
      return { isValid: false, message: 'Domain cannot start with a hyphen' };
    }
    
  } catch (error) {
    return { isValid: false, message: 'Please enter a valid website URL (e.g., www.college.edu or https://college.edu)' };
  }
  
  return { isValid: true, message: '' };
};

// Establishment year validation - Enhanced to prevent future dates
export const validateEstablishmentYear = (year: number | string): ValidationResult => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
  
  const yearNum = typeof year === 'string' ? parseInt(year, 10) : year;
  
  if (!year || isNaN(yearNum)) {
    return { isValid: false, message: 'Establishment year is required' };
  }
  
  if (yearNum < 1800) {
    return { isValid: false, message: 'Please enter a valid establishment year (1800 or later)' };
  }
  
  // Only prevent future years, current year is allowed
  if (yearNum > currentYear) {
    return { isValid: false, message: `Establishment year cannot be in the future. Current year is ${currentYear}` };
  }
  
  return { isValid: true, message: '' };
};

// Phone number validation
export const validatePhoneNumber = (phone: string): ValidationResult => {
  if (!phone || !phone.trim()) {
    return { isValid: false, message: 'Phone number is required' };
  }
  
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check if exactly 10 digits
  if (cleanPhone.length !== 10) {
    return { isValid: false, message: 'Phone number must be exactly 10 digits' };
  }
  
  // Check if starts with valid digit (not 0 or 1)
  if (cleanPhone.charAt(0) === '0' || cleanPhone.charAt(0) === '1') {
    return { isValid: false, message: 'Phone number must start with digits 2-9' };
  }
  
  return { isValid: true, message: '' };
};

// Multi-step validation functions
export const validateStep1 = (formData: any): ValidationResult => {
  if (!formData.collegeName?.trim()) {
    return { isValid: false, message: 'College name is required' };
  }
  
  if (!formData.establishedYear) {
    return { isValid: false, message: 'Establishment year is required' };
  }
  
  const yearValidation = validateEstablishmentYear(formData.establishedYear);
  if (!yearValidation.isValid) {
    return yearValidation;
  }
  
  if (!formData.collegeType?.trim()) {
    return { isValid: false, message: 'College type is required' };
  }
  
  if (!formData.affiliatedTo?.trim()) {
    return { isValid: false, message: 'Affiliation is required' };
  }
  
  // Website is now required and validated
  if (!formData.website?.trim()) {
    return { isValid: false, message: 'College website is required' };
  }
  
  const websiteValidation = validateWebsite(formData.website);
  if (!websiteValidation.isValid) {
    return websiteValidation;
  }
  
  return { isValid: true, message: '' };
};

export const validateStep2 = (formData: any): ValidationResult => {
  // Step 2 is College Information - validate college details, not coordinator details
  if (!formData.collegeName?.trim()) {
    return { isValid: false, message: 'College name is required' };
  }
  
  if (!formData.email?.trim()) {
    return { isValid: false, message: 'College email is required' };
  }
  
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) {
    return emailValidation;
  }
  
  if (!formData.establishedYear?.toString()?.trim()) {
    return { isValid: false, message: 'Establishment year is required' };
  }
  
  const yearValidation = validateEstablishmentYear(formData.establishedYear);
  if (!yearValidation.isValid) {
    return yearValidation;
  }
  
  if (!formData.collegeType?.trim()) {
    return { isValid: false, message: 'College type is required' };
  }
  
  if (!formData.recognizedBy?.trim() && !formData.recognizedByOther?.trim()) {
    return { isValid: false, message: 'Recognized by is required' };
  }
  
  if (!formData.affiliatedTo?.trim()) {
    return { isValid: false, message: 'Affiliated to is required' };
  }
  
  if (formData.affiliatedTo === 'Other' && !formData.affiliatedUniversityName?.trim()) {
    return { isValid: false, message: 'Affiliated university name is required' };
  }
  
  if (formData.website?.trim()) {
    const websiteValidation = validateWebsite(formData.website);
    if (!websiteValidation.isValid) {
      return websiteValidation;
    }
  }
  
  if (!formData.aboutCollege?.trim()) {
    return { isValid: false, message: 'About college is required' };
  }
  
  if (formData.aboutCollege.length < 50) {
    return { isValid: false, message: 'About college must be at least 50 characters' };
  }
  
  if (!formData.logoFile) {
    return { isValid: false, message: 'College logo is required' };
  }
  
  return { isValid: true, message: '' };
};

export const validateStep3 = (formData: any): ValidationResult => {
  // Step 3 is Contact Information - validate coordinator and address details
  if (!formData.coordinatorName?.trim()) {
    return { isValid: false, message: 'Coordinator name is required' };
  }
  
  if (!formData.coordinatorEmail?.trim()) {
    return { isValid: false, message: 'Coordinator email is required' };
  }
  
  const emailValidation = validateEmail(formData.coordinatorEmail);
  if (!emailValidation.isValid) {
    return emailValidation;
  }
  
  if (!formData.coordinatorNumber?.trim()) {
    return { isValid: false, message: 'Coordinator phone number is required' };
  }
  
  const phoneValidation = validatePhoneNumber(formData.coordinatorNumber);
  if (!phoneValidation.isValid) {
    return phoneValidation;
  }
  
  if (!formData.address?.trim()) {
    return { isValid: false, message: 'Address is required' };
  }
  
  if (!formData.city?.trim()) {
    return { isValid: false, message: 'City is required' };
  }
  
  if (!formData.state?.trim()) {
    return { isValid: false, message: 'State is required' };
  }
  
  if (!formData.pincode?.trim()) {
    return { isValid: false, message: 'Pincode is required' };
  }
  
  if (!formData.mobile?.trim()) {
    return { isValid: false, message: 'Mobile number is required' };
  }
  
  const mobileValidation = validatePhoneNumber(formData.mobile);
  if (!mobileValidation.isValid) {
    return mobileValidation;
  }
  
  return { isValid: true, message: '' };
};