import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Image from 'next/image';
import CompanyRegistrationNavbar from '../../components/CompanyRegistrationNavbar';
import ProtectedRoute from '../../components/ProtectedRoute';
import {
  Building,
  MapPin,
  Users,
  Upload,
  Award,
  Edit,
  Globe,
  Phone,
  Mail,
  ChevronDown,
  Plus,
  X,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface CompanyProfile {
  _id: string;
  companyName: string;
  companyMailID: string;
  hrName: string;
  hrPhoneNumber: string;
  hrMailID: string;
  companyWebsite?: string;
  pincode: string;
  city: string;
  companyAddress: string;
  industry: string;
  foundedYear: number;
  companySize: string;
  companyLogo?: string;
  companyDocuments?: string[];
  aboutCompany: string;
  socialMedia?: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
    website?: string;
  };
  approvalStatus: string;
  workLocations: string[];
  hiringSeasons: string[];
  averageHires: number;
  remoteWork: boolean;
  internshipOpportunities: boolean;
  preferredContactMethod: string;
}

interface SectionToast {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export default function CompanyProfileSetup() {
  const router = useRouter();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  
  // Section-specific toasts
  const [sectionToasts, setSectionToasts] = useState<Record<string, SectionToast>>({
    companyInfo: { show: false, message: '', type: 'success' },
    hrInfo: { show: false, message: '', type: 'success' },
    socialMedia: { show: false, message: '', type: 'success' },
  });

  // Form states
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CompanyProfile>>({});
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [newWorkLocation, setNewWorkLocation] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        router.push('/company-login');
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/recruiters/user/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setProfile(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('Error fetching company profile:', error);
      setError('Failed to load company profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
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

  const handleSocialMediaChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value
      }
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Handle file upload here
      uploadLogo(file);
    }
  };

  const uploadLogo = async (file: File) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('logo', file);

      const response = await axios.post(
        `${API_BASE_URL}/api/recruiters/upload-logo`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setFormData(prev => ({
        ...prev,
        companyLogo: response.data.logoUrl
      }));
    } catch (error) {
      console.error('Error uploading logo:', error);
    }
  };

  const addWorkLocation = () => {
    if (newWorkLocation.trim()) {
      setFormData(prev => ({
        ...prev,
        workLocations: [...(prev.workLocations || []), newWorkLocation.trim()]
      }));
      setNewWorkLocation('');
    }
  };

  const removeWorkLocation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      workLocations: prev.workLocations?.filter((_, i) => i !== index) || []
    }));
  };

  const handleHiringSeasonChange = (season: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      hiringSeasons: checked
        ? [...(prev.hiringSeasons || []), season]
        : prev.hiringSeasons?.filter(s => s !== season) || []
    }));
  };

  const updateSection = async (section: string) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      const response = await axios.put(
        `${API_BASE_URL}/api/recruiters/${userId}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setProfile(response.data);
      setEditingSection(null);
      
      // Show success toast
      setSectionToasts(prev => ({
        ...prev,
        [section]: { show: true, message: 'Updated successfully!', type: 'success' }
      }));

      // Hide toast after 3 seconds
      setTimeout(() => {
        setSectionToasts(prev => ({
          ...prev,
          [section]: { ...prev[section], show: false }
        }));
      }, 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSectionToasts(prev => ({
        ...prev,
        [section]: { show: true, message: 'Update failed!', type: 'error' }
      }));
    } finally {
      setUpdating(false);
    }
  };

  const startEditing = (section: string) => {
    setEditingSection(section);
    setFormData(profile || {});
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setFormData(profile || {});
  };

  if (loading) {
    return (
      <ProtectedRoute requireApproval={true} allowedRoles={['recruiter']}>
        <div className="min-h-screen bg-gray-50">
          <CompanyRegistrationNavbar 
            status="approved" 
            companyName={profile?.companyName}
          />
          <div className="flex justify-center items-center h-64 pt-28">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading profile...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requireApproval={true} allowedRoles={['recruiter']}>
        <div className="min-h-screen bg-gray-50">
          <CompanyRegistrationNavbar 
            status="approved" 
            companyName={profile?.companyName}
          />
          <div className="flex justify-center items-center h-64 pt-28">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <button 
                onClick={fetchProfile}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Toast Component
  const Toast = ({ sectionKey }: { sectionKey: string }) => {
    const toast = sectionToasts[sectionKey];
    if (!toast.show) return null;

    return (
      <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 ${
        toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
      }`}>
        <div className="flex items-center space-x-2">
          {toast.type === 'success' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className="flex-1">{toast.message}</span>
          <button 
            onClick={() => setSectionToasts(prev => ({
              ...prev,
              [sectionKey]: { ...prev[sectionKey], show: false }
            }))}
            className="text-white hover:text-gray-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute requireApproval={true} allowedRoles={['recruiter']}>
      <div className="min-h-screen bg-gray-50">
        <CompanyRegistrationNavbar 
          status={profile?.approvalStatus as 'pending' | 'approved' | 'rejected' || "approved"}
          companyName={profile?.companyName}
        />
        
        <div className="pt-20 pb-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Company Profile Setup</h1>
              <p className="text-gray-600">
                Let's set up your company profile to get started with your dashboard
              </p>
            </div>

            {/* Company Information Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Company Information</h2>
                      <p className="text-gray-500">Tell us about your company</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {editingSection === 'companyInfo' ? (
                      <>
                        <button
                          onClick={() => updateSection('companyInfo')}
                          disabled={updating}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {updating ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEditing('companyInfo')}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6">
                {editingSection === 'companyInfo' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Company Logo Upload */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo*</label>
                      <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
                             onClick={() => fileInputRef.current?.click()}>
                          {logoPreview || profile?.companyLogo ? (
                            <img 
                              src={logoPreview || profile?.companyLogo} 
                              alt="Company logo" 
                              className="w-full h-full object-contain rounded-lg" 
                            />
                          ) : (
                            <Upload className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            Upload Company Logo
                          </button>
                          <p className="text-xs text-gray-500 mt-1">JPEG, PNG, GIF up to 5MB</p>
                        </div>
                      </div>
                    </div>

                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName || ''}
                      onChange={handleInputChange}
                      placeholder="Company Name*"
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                      type="email"
                      name="companyMailID"
                      value={formData.companyMailID || ''}
                      onChange={handleInputChange}
                      placeholder="Company Mail ID*"
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                      type="url"
                      name="companyWebsite"
                      value={formData.companyWebsite || ''}
                      onChange={handleInputChange}
                      placeholder="Company Website"
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <select
                      name="industry"
                      value={formData.industry || ''}
                      onChange={handleInputChange}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Industry*</option>
                      <option value="technology">Technology</option>
                      <option value="finance">Finance</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="retail">Retail</option>
                      <option value="consulting">Consulting</option>
                      <option value="education">Education</option>
                      <option value="other">Other</option>
                    </select>

                    <input
                      type="number"
                      name="foundedYear"
                      value={formData.foundedYear || ''}
                      onChange={handleInputChange}
                      placeholder="Founded Year*"
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <select
                      name="companySize"
                      value={formData.companySize || ''}
                      onChange={handleInputChange}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="startup">Startup (1-10 employees)</option>
                      <option value="small">Small (11-50 employees)</option>
                      <option value="medium">Medium (51-200 employees)</option>
                      <option value="large">Large (201-1000 employees)</option>
                      <option value="enterprise">Enterprise (1000+ employees)</option>
                    </select>

                    <input
                      type="text"
                      name="city"
                      value={formData.city || ''}
                      onChange={handleInputChange}
                      placeholder="City*"
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode || ''}
                      onChange={handleInputChange}
                      placeholder="Pincode*"
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <textarea
                      name="companyAddress"
                      value={formData.companyAddress || ''}
                      onChange={handleInputChange}
                      placeholder="Company Address*"
                      rows={3}
                      className="md:col-span-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <textarea
                      name="aboutCompany"
                      value={formData.aboutCompany || ''}
                      onChange={handleInputChange}
                      placeholder="About the company*"
                      rows={4}
                      className="md:col-span-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 flex items-center space-x-4">
                      {profile?.companyLogo && (
                        <img 
                          src={profile.companyLogo} 
                          alt="Company logo" 
                          className="w-16 h-16 object-contain rounded-lg border"
                        />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold">{profile?.companyName}</h3>
                        <p className="text-gray-600">{profile?.industry}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{profile?.companyMailID}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Website</p>
                      <p className="font-medium">{profile?.companyWebsite || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Founded Year</p>
                      <p className="font-medium">{profile?.foundedYear}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Company Size</p>
                      <p className="font-medium capitalize">{profile?.companySize}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">{profile?.companyAddress}, {profile?.city} - {profile?.pincode}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500">About Company</p>
                      <p className="font-medium">{profile?.aboutCompany}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* HR Information Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">HR Information</h2>
                      <p className="text-gray-500">HR contact details</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {editingSection === 'hrInfo' ? (
                      <>
                        <button
                          onClick={() => updateSection('hrInfo')}
                          disabled={updating}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {updating ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEditing('hrInfo')}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6">
                {editingSection === 'hrInfo' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input
                      type="text"
                      name="hrName"
                      value={formData.hrName || ''}
                      onChange={handleInputChange}
                      placeholder="HR Name*"
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="tel"
                      name="hrPhoneNumber"
                      value={formData.hrPhoneNumber || ''}
                      onChange={handleInputChange}
                      placeholder="HR Phone Number*"
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="email"
                      name="hrMailID"
                      value={formData.hrMailID || ''}
                      onChange={handleInputChange}
                      placeholder="HR Mail ID*"
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      name="preferredContactMethod"
                      value={formData.preferredContactMethod || ''}
                      onChange={handleInputChange}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500">HR Name</p>
                      <p className="font-medium">{profile?.hrName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">HR Phone</p>
                      <p className="font-medium">{profile?.hrPhoneNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">HR Email</p>
                      <p className="font-medium">{profile?.hrMailID}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Preferred Contact Method</p>
                      <p className="font-medium capitalize">{profile?.preferredContactMethod || 'Email'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Social Media Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Globe className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Social Media</h2>
                      <p className="text-gray-500">Company social media profiles</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {editingSection === 'socialMedia' ? (
                      <>
                        <button
                          onClick={() => updateSection('socialMedia')}
                          disabled={updating}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {updating ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEditing('socialMedia')}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6">
                {editingSection === 'socialMedia' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input
                      type="url"
                      value={formData.socialMedia?.linkedin || ''}
                      onChange={(e) => handleSocialMediaChange('linkedin', e.target.value)}
                      placeholder="LinkedIn Profile URL"
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="url"
                      value={formData.socialMedia?.facebook || ''}
                      onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                      placeholder="Facebook Page URL"
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="url"
                      value={formData.socialMedia?.twitter || ''}
                      onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
                      placeholder="Twitter Profile URL"
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="url"
                      value={formData.socialMedia?.instagram || ''}
                      onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                      placeholder="Instagram Profile URL"
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500">LinkedIn</p>
                      <p className="font-medium">{profile?.socialMedia?.linkedin || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Facebook</p>
                      <p className="font-medium">{profile?.socialMedia?.facebook || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Twitter</p>
                      <p className="font-medium">{profile?.socialMedia?.twitter || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Instagram</p>
                      <p className="font-medium">{profile?.socialMedia?.instagram || 'Not provided'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Toast notifications */}
        {Object.keys(sectionToasts).map(sectionKey => (
          <Toast key={sectionKey} sectionKey={sectionKey} />
        ))}
      </div>
    </ProtectedRoute>
  );
}
