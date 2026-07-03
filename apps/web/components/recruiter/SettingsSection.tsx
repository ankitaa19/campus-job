import React, { useState, useEffect } from 'react';
import { ChevronRight, Upload, X, Eye, Edit2, Camera } from 'lucide-react';
import { Company } from '../../types/recruiter';
import ChangePasswordSection from './ChangePasswordSection';

interface SettingsSectionProps {
  company: Company | null;
}

interface CompanyProfile {
  companyName: string;
  foundedYear: string;
  industry: string;
  website: string;
  companyEmail: string;
  companySize: string;
  about: string;
  hrName: string;
  hrNumber: string;
  hrEmail: string;
  address: string;
  pinCode: string;
  state: string;
  district: string;
  city: string;
  documents: File[];
  linkedIn: string;
  facebook: string;
  instagram: string;
  twitter: string;
  pinterest: string;
  website2: string;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ company }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [sectionToast, setSectionToast] = useState<{ section: string; show: boolean }>({ section: '', show: false });
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string>(company?.companyInfo?.logo || '');
  const [companyCover, setCompanyCover] = useState<string>('');
  const [showLogoPreview, setShowLogoPreview] = useState(false);
  const [showCoverPreview, setShowCoverPreview] = useState(false);
  const [isEditingLogo, setIsEditingLogo] = useState(false);
  
  // Debug: Log company data to see what we're receiving
  useEffect(() => {
    console.log('Company data received:', company);
    console.log('Logo:', company?.companyInfo?.logo);
    console.log('Verification Documents:', company?.verificationDocuments);
    console.log('Submitted Documents:', company?.submittedDocuments);
  }, [company]);
  
  const [profileData, setProfileData] = useState<CompanyProfile>({
    companyName: company?.companyInfo?.name || 'ABC Company',
    foundedYear: company?.companyInfo?.foundedYear?.toString() || '2020',
    industry: company?.companyInfo?.industry || 'Technology',
    website: company?.companyInfo?.website || 'www.abccompany.com',
    companyEmail: company?.email || 'info@abccompany.com',
    companySize: company?.companyInfo?.size || '1-10',
    about: company?.companyInfo?.description || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    hrName: company?.recruiterProfile ? `${company.recruiterProfile.firstName} ${company.recruiterProfile.lastName}` : 'Lorem Ipsum',
    hrNumber: company?.phone || company?.whatsappNumber || '+91 1001001010',
    hrEmail: company?.recruiterEmail || 'lorem@gmail.com',
    address: company?.companyInfo?.headquarters?.city && company?.companyInfo?.headquarters?.state 
      ? `${company.companyInfo.headquarters.city}, ${company.companyInfo.headquarters.state}` 
      : 'New Delhi 04No',
    pinCode: '110020',
    state: company?.companyInfo?.headquarters?.state || '',
    district: '',
    city: company?.companyInfo?.headquarters?.city || '',
    documents: [],
    linkedIn: 'https://www.linkedin.com/Example',
    facebook: 'https://www.facebook.com/Example',
    instagram: 'https://www.instagram.com/Example',
    twitter: 'https://www.twitter.com/Example',
    pinterest: 'https://www.pinterest.com/Example',
    website2: 'https://www.website.com/Example'
  });

  useEffect(() => {
    if (company) {
      setProfileData(prev => ({
        ...prev,
        companyName: company.companyInfo?.name || prev.companyName,
        foundedYear: company.companyInfo?.foundedYear?.toString() || prev.foundedYear,
        industry: company.companyInfo?.industry || prev.industry,
        website: company.companyInfo?.website || prev.website,
        companyEmail: company.email || prev.companyEmail,
        companySize: company.companyInfo?.size || prev.companySize,
        about: company.companyInfo?.description || prev.about,
        hrName: company.recruiterProfile ? `${company.recruiterProfile.firstName} ${company.recruiterProfile.lastName}` : prev.hrName,
        hrNumber: company.phone || company.whatsappNumber || prev.hrNumber,
        hrEmail: company.recruiterEmail || prev.hrEmail,
        address: company.companyInfo?.headquarters?.city && company.companyInfo?.headquarters?.state 
          ? `${company.companyInfo.headquarters.city}, ${company.companyInfo.headquarters.state}` 
          : prev.address,
        state: company.companyInfo?.headquarters?.state || prev.state,
        city: company.companyInfo?.headquarters?.city || prev.city
      }));
      setCompanyLogo(company.companyInfo?.logo || '');
    }
  }, [company]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyLogo(reader.result as string);
        setIsEditingLogo(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyCover(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (section: string) => {
    setEditingSection(section);
  };

  const handleSaveSection = (section: string) => {
    setEditingSection(null);
    setSectionToast({ section, show: true });
    setTimeout(() => {
      setSectionToast({ section: '', show: false });
    }, 3000);
  };

  const handleSaveAllChanges = () => {
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setProfileData(prev => ({
        ...prev,
        documents: [...prev.documents, ...newFiles].slice(0, 3)
      }));
    }
  };

  const removeFile = (index: number) => {
    setProfileData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  // Show Change Password Section - Check this FIRST before other conditions
  if (showChangePassword) {
    console.log('Rendering ChangePasswordSection with email:', company?.recruiterEmail || company?.email);
    return (
      <ChangePasswordSection 
        userEmail={company?.recruiterEmail || company?.email || ''}
        onBack={() => setShowChangePassword(false)}
      />
    );
  }

  if (!showProfile) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              <span style={{ color: '#0270DF' }}>Settings</span>
            </h1>
            <p className="mt-2" style={{ color: '#717182' }}>Manage your account</p>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-4">
          {/* View & Edit Profile */}
          <button
            onClick={() => setShowProfile(true)}
            className="w-full flex items-center justify-between px-6 py-4 bg-white rounded-lg hover:bg-gray-50 transition-colors"
            style={{ border: '1px solid #B8BBD2' }}
          >
            <span className="text-base font-normal" style={{ color: '#000000' }}>View & edit profile</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          {/* Change Password */}
          <button 
            onClick={() => {
              console.log('Change Password button clicked');
              setShowChangePassword(true);
            }}
            className="w-full flex items-center justify-between px-6 py-4 bg-white rounded-lg hover:bg-gray-50 transition-colors"
            style={{ border: '1px solid #B8BBD2' }}
          >
            <span className="text-base font-normal" style={{ color: '#000000' }}>Change password</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-6 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          All changes saved successfully!
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Company <span className="text-blue-600">Profile Preview</span>
          </h1>
        </div>
      </div>

      {/* Profile Content */}
      <div className="space-y-6">
        {/* Logo Preview Modal */}
        {showLogoPreview && companyLogo && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowLogoPreview(false)}
          >
            <div 
              className="bg-white rounded-2xl p-6 max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Company Logo</h3>
                <button
                  onClick={() => setShowLogoPreview(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex items-center justify-center bg-gray-50 rounded-xl p-8">
                <img 
                  src={companyLogo} 
                  alt="Company logo preview"
                  className="max-w-full max-h-96 object-contain"
                />
              </div>
            </div>
          </div>
        )}

        {/* Cover Preview Modal */}
        {showCoverPreview && companyCover && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCoverPreview(false)}
          >
            <div 
              className="bg-white rounded-2xl p-6 max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Cover Photo</h3>
                <button
                  onClick={() => setShowCoverPreview(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex items-center justify-center bg-gray-50 rounded-xl p-8">
                <img 
                  src={companyCover} 
                  alt="Cover photo preview"
                  className="max-w-full max-h-96 object-cover rounded-xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* Basic Information Section with Cover Photo & Logo */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #B8BBD2' }}>
          {/* Cover Photo Section */}
          <div className="relative">
            {/* Cover Photo */}
            <div 
              className="w-full h-72 relative"
              style={{ 
                background: companyCover 
                  ? `url(${companyCover}) center/cover` 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              {!companyCover && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm opacity-75">Cover Photo</p>
                  </div>
                </div>
              )}
              
              {/* Cover Photo Edit Button */}
              <div className="absolute top-4 right-4">
                <label className="flex items-center gap-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 cursor-pointer shadow-md transition-all">
                  <Camera className="w-4 h-4" />
                  <span>{companyCover ? 'Change Cover' : 'Add Cover'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* View Cover Button (only when cover exists) */}
              {companyCover && (
                <button
                  onClick={() => setShowCoverPreview(true)}
                  className="absolute top-4 right-44 flex items-center gap-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 shadow-md transition-all"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
              )}
            </div>

            {/* Company Logo - Overlapping the cover */}
            <div className="absolute -bottom-12 left-8">
              <div className="relative group">
                {/* Logo Display with rounded square */}
                <div 
                  className="w-32 h-32 rounded-xl overflow-hidden flex items-center justify-center bg-white"
                  style={{ 
                    border: '3px solid white',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  {companyLogo ? (
                    <img 
                      src={companyLogo} 
                      alt="Company logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-gray-400 mt-2">Logo</p>
                    </div>
                  )}
                </div>

                {/* Logo Action buttons - View and Edit */}
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-md border border-gray-200">
                  {/* View Button */}
                  {companyLogo && (
                    <button
                      onClick={() => setShowLogoPreview(true)}
                      className="flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 transition-colors"
                      title="View logo"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                  )}
                  
                  {companyLogo && <span className="text-gray-300">|</span>}
                  
                  {/* Edit Button */}
                  <label className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors cursor-pointer" title="Edit logo">
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section with extra top padding for logo overlap */}
          <div className="p-6 pt-16">
            {/* Basic Information Title and Edit Button */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-[#0270DF]" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '20px' }}>Basic Information</h3>
              {editingSection !== 'basic' && (
                <button
                  onClick={() => handleEdit('basic')}
                  className="flex items-center gap-2 text-sm text-[#1484F3] px-4 py-1.5 rounded-md hover:bg-blue-50"
                  style={{ border: '1px solid #1484F3', fontFamily: 'Poppins, sans-serif' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
              )}
            </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Company name</label>
              <input
                type="text"
                value={profileData.companyName}
                disabled
                className="w-full text-sm text-gray-400 bg-gray-50 border-0 px-3 py-2 rounded-lg cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Founded year</label>
              <input
                type="text"
                value={profileData.foundedYear}
                disabled
                className="w-full text-sm text-gray-400 bg-gray-50 border-0 px-3 py-2 rounded-lg cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Industry</label>
              <input
                type="text"
                value={profileData.industry}
                onChange={(e) => setProfileData({ ...profileData, industry: e.target.value })}
                disabled={editingSection !== 'basic'}
                className="w-full text-sm text-gray-600 bg-transparent border-0 focus:outline-none disabled:cursor-default px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Website</label>
              <input
                type="text"
                value={profileData.website}
                onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                disabled={editingSection !== 'basic'}
                className="w-full text-sm text-gray-600 bg-transparent border-0 focus:outline-none disabled:cursor-default px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Company email</label>
              <input
                type="email"
                value={profileData.companyEmail}
                disabled
                className="w-full text-sm text-gray-400 bg-gray-50 border-0 px-3 py-2 rounded-lg cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Company Size</label>
              <select
                value={profileData.companySize}
                onChange={(e) => setProfileData({ ...profileData, companySize: e.target.value })}
                disabled={editingSection !== 'basic'}
                className="w-full text-sm text-gray-600 bg-transparent border-0 focus:outline-none disabled:cursor-default px-3 py-2"
              >
                <option value="startup">Startup (1-10 employees)</option>
                <option value="small">Small (11-50 employees)</option>
                <option value="medium">Medium (51-200 employees)</option>
                <option value="large">Large (201-1000 employees)</option>
                <option value="enterprise">Enterprise (1000+ employees)</option>
              </select>
            </div>
          </div>

          {editingSection === 'basic' && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleSaveSection('basic')}
                className="bg-[#1E90FF] text-white px-6 py-2 rounded-lg hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          )}

          {sectionToast.section === 'basic' && sectionToast.show && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              Basic information saved successfully!
            </div>
          )}
          </div>
          {/* End of Content Section with padding */}
        </div>
        {/* End of Basic Information Section with Cover Photo & Logo */}

        {/* About Section */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #B8BBD2' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-[#0270DF]" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '20px' }}>About</h3>
            {editingSection !== 'about' && (
              <button
                onClick={() => handleEdit('about')}
                className="flex items-center gap-2 text-sm text-[#1484F3] px-4 py-1.5 rounded-md hover:bg-blue-50"
                style={{ border: '1px solid #1484F3', fontFamily: 'Poppins, sans-serif' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
          </div>

          <textarea
            value={profileData.about}
            onChange={(e) => setProfileData({ ...profileData, about: e.target.value })}
            disabled={editingSection !== 'about'}
            rows={4}
            className="w-full text-sm text-gray-700 leading-relaxed bg-transparent border-0 focus:outline-none disabled:cursor-default resize-none"
          />

          {editingSection === 'about' && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleSaveSection('about')}
                className="bg-[#1E90FF] text-white px-6 py-2 rounded-lg hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          )}

          {sectionToast.section === 'about' && sectionToast.show && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              About section saved successfully!
            </div>
          )}
        </div>

        {/* Contact Details Section */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #B8BBD2' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-[#0270DF]" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '20px' }}>Contact details</h3>
            {editingSection !== 'contact' && (
              <button
                onClick={() => handleEdit('contact')}
                className="flex items-center gap-2 text-sm text-[#1484F3] px-4 py-1.5 rounded-md hover:bg-blue-50"
                style={{ border: '1px solid #1484F3', fontFamily: 'Poppins, sans-serif' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">HR name</label>
              <input
                type="text"
                value={profileData.hrName}
                onChange={(e) => setProfileData({ ...profileData, hrName: e.target.value })}
                disabled={editingSection !== 'contact'}
                className="w-full text-sm text-gray-600 bg-transparent border-0 focus:outline-none disabled:cursor-default"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">HR number</label>
              <input
                type="text"
                value={profileData.hrNumber}
                onChange={(e) => setProfileData({ ...profileData, hrNumber: e.target.value })}
                disabled={editingSection !== 'contact'}
                className="w-full text-sm text-gray-600 bg-transparent border-0 focus:outline-none disabled:cursor-default"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">HR email</label>
              <input
                type="email"
                value={profileData.hrEmail}
                onChange={(e) => setProfileData({ ...profileData, hrEmail: e.target.value })}
                disabled={editingSection !== 'contact'}
                className="w-full text-sm text-gray-600 bg-transparent border-0 focus:outline-none disabled:cursor-default"
              />
            </div>
          </div>

          {editingSection === 'contact' && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleSaveSection('contact')}
                className="bg-[#1E90FF] text-white px-6 py-2 rounded-lg hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          )}

          {sectionToast.section === 'contact' && sectionToast.show && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              Contact details saved successfully!
            </div>
          )}
        </div>

        {/* Address Section */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #B8BBD2' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-[#0270DF]" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '20px' }}>Address</h3>
            {editingSection !== 'address' && (
              <button
                onClick={() => handleEdit('address')}
                className="flex items-center gap-2 text-sm text-[#1484F3] px-4 py-1.5 rounded-md hover:bg-blue-50"
                style={{ border: '1px solid #1484F3', fontFamily: 'Poppins, sans-serif' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-5 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Detailed address</label>
              <input
                type="text"
                value={profileData.address}
                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                disabled={editingSection !== 'address'}
                className="w-full text-sm text-gray-600 bg-transparent border-0 focus:outline-none disabled:cursor-default"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Pin Code</label>
              <input
                type="text"
                value={profileData.pinCode}
                onChange={(e) => setProfileData({ ...profileData, pinCode: e.target.value })}
                disabled={editingSection !== 'address'}
                className="w-full text-sm text-gray-600 bg-transparent border-0 focus:outline-none disabled:cursor-default"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">State</label>
              <input
                type="text"
                value={profileData.state}
                onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                disabled={editingSection !== 'address'}
                placeholder=""
                className="w-full text-sm text-gray-600 bg-transparent border-0 focus:outline-none disabled:cursor-default"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">District</label>
              <input
                type="text"
                value={profileData.district}
                onChange={(e) => setProfileData({ ...profileData, district: e.target.value })}
                disabled={editingSection !== 'address'}
                placeholder=""
                className="w-full text-sm text-gray-600 bg-transparent border-0 focus:outline-none disabled:cursor-default"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">City</label>
              <input
                type="text"
                value={profileData.city}
                onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                disabled={editingSection !== 'address'}
                placeholder=""
                className="w-full text-sm text-gray-600 bg-transparent border-0 focus:outline-none disabled:cursor-default"
              />
            </div>
          </div>

          {editingSection === 'address' && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleSaveSection('address')}
                className="bg-[#1E90FF] text-white px-6 py-2 rounded-lg hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          )}

          {sectionToast.section === 'address' && sectionToast.show && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              Address saved successfully!
            </div>
          )}
        </div>

        {/* Other Details Section */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #B8BBD2' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-[#0270DF]" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '20px' }}>Other details</h3>
            {editingSection !== 'documents' && (
              <button
                onClick={() => handleEdit('documents')}
                className="flex items-center gap-2 text-sm text-[#1484F3] px-4 py-1.5 rounded-md hover:bg-blue-50"
                style={{ border: '1px solid #1484F3', fontFamily: 'Poppins, sans-serif' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company documents</label>
            <p className="text-xs text-gray-500 mb-4">Max limit 10 MB ( You can 2 or 3 )</p>

            <div className="grid grid-cols-3 gap-4">
              {/* Display existing documents from backend */}
              {(() => {
                // Get documents from either verificationDocuments or submittedDocuments
                const documents = company?.verificationDocuments || company?.submittedDocuments || [];
                
                if (documents.length > 0) {
                  return documents.slice(0, 3).map((doc, index) => (
                    <div key={index} className="relative">
                      <div className="border-2 border-dashed border-green-400 rounded-lg p-6 bg-green-50 relative">
                        <div className="flex flex-col items-center">
                          <svg className="w-12 h-12 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm font-medium text-green-600">Uploaded</span>
                          <a 
                            href={doc} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline mt-2"
                          >
                            View Document
                          </a>
                        </div>
                      </div>
                    </div>
                  ));
                }
                
                // Show upload placeholders if no documents
                return [0, 1, 2].map((index) => (
                  <div key={index} className="relative">
                    {profileData.documents[index] ? (
                      <div className="border-2 border-dashed border-green-400 rounded-lg p-6 bg-green-50 relative">
                        <div className="flex flex-col items-center">
                          <svg className="w-12 h-12 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm font-medium text-green-600">Uploaded</span>
                        </div>
                        {editingSection === 'documents' && (
                          <button
                            onClick={() => removeFile(index)}
                            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                          >
                            <X className="w-4 h-4 text-gray-600" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <label className={`border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 ${editingSection !== 'documents' ? 'pointer-events-none opacity-60' : ''}`}>
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Upload</span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileUpload}
                          disabled={editingSection !== 'documents'}
                        />
                      </label>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>

          {editingSection === 'documents' && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleSaveSection('documents')}
                className="bg-[#1E90FF] text-white px-6 py-2 rounded-lg hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          )}

          {sectionToast.section === 'documents' && sectionToast.show && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              Documents saved successfully!
            </div>
          )}
        </div>

        {/* Social Media Links Section */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #B8BBD2' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-[#0270DF]" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '20px' }}>Social Media Links</h3>
            {editingSection !== 'social' && (
              <button
                onClick={() => handleEdit('social')}
                className="flex items-center gap-2 text-sm text-[#1484F3] px-4 py-1.5 rounded-md hover:bg-blue-50"
                style={{ border: '1px solid #1484F3', fontFamily: 'Poppins, sans-serif' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
          </div>

          <p className="text-sm text-[#49454F] mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Added links</p>

          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {/* LinkedIn */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#0077B5] rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
              <input
                type="text"
                value={profileData.linkedIn}
                onChange={(e) => setProfileData({ ...profileData, linkedIn: e.target.value })}
                disabled={editingSection !== 'social'}
                placeholder="http://www.linkedin.com/example..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full text-sm text-gray-500 disabled:cursor-default disabled:bg-white"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              />
            </div>

            {/* Facebook */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#1877F2] rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <input
                type="text"
                value={profileData.facebook}
                onChange={(e) => setProfileData({ ...profileData, facebook: e.target.value })}
                disabled={editingSection !== 'social'}
                placeholder="http://www.facebook.com/example..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full text-sm text-gray-500 disabled:cursor-default disabled:bg-white"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              />
            </div>

            {/* Instagram */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-tr from-[#FD5949] via-[#D6249F] to-[#285AEB] rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <input
                type="text"
                value={profileData.instagram}
                onChange={(e) => setProfileData({ ...profileData, instagram: e.target.value })}
                disabled={editingSection !== 'social'}
                placeholder="http://www.instagram.com/example..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full text-sm text-gray-500 disabled:cursor-default disabled:bg-white"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              />
            </div>

            {/* Twitter */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#1DA1F2] rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </div>
              <input
                type="text"
                value={profileData.twitter}
                onChange={(e) => setProfileData({ ...profileData, twitter: e.target.value })}
                disabled={editingSection !== 'social'}
                placeholder="http://www.twitter.com/example..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full text-sm text-gray-500 disabled:cursor-default disabled:bg-white"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              />
            </div>

            {/* Pinterest */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#E60023] rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
                </svg>
              </div>
              <input
                type="text"
                value={profileData.pinterest}
                onChange={(e) => setProfileData({ ...profileData, pinterest: e.target.value })}
                disabled={editingSection !== 'social'}
                placeholder="http://www.pinterest.com/example..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full text-sm text-gray-500 disabled:cursor-default disabled:bg-white"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              />
            </div>

            {/* Website */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#4285F4] rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2c5.514 0 10 4.486 10 10s-4.486 10-10 10S2 17.514 2 12 6.486 2 12 2zm0 1.5c-1.86 0-3.541.602-4.932 1.617l1.358 1.358c1.063-.728 2.344-1.155 3.574-1.155s2.511.427 3.574 1.155l1.358-1.358C15.541 4.102 13.86 3.5 12 3.5zm-5.664 2.248C4.921 7.149 3.5 9.442 3.5 12c0 2.558 1.421 4.851 3.836 6.252l1.358-1.358C7.427 15.831 6.5 14.019 6.5 12s.927-3.831 2.194-4.894l-1.358-1.358zm11.328 0l-1.358 1.358C17.573 8.169 18.5 9.981 18.5 12s-.927 3.831-2.194 4.894l1.358 1.358C19.079 16.851 20.5 14.558 20.5 12c0-2.558-1.421-4.851-3.836-6.252zM12 8c-2.206 0-4 1.794-4 4s1.794 4 4 4 4-1.794 4-4-1.794-4-4-4z"/>
                </svg>
              </div>
              <input
                type="text"
                value={profileData.website2}
                onChange={(e) => setProfileData({ ...profileData, website2: e.target.value })}
                disabled={editingSection !== 'social'}
                placeholder="http://www.website.com/example..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full text-sm text-gray-500 disabled:cursor-default disabled:bg-white"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              />
            </div>
          </div>

          {editingSection === 'social' && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleSaveSection('social')}
                className="bg-[#1E90FF] text-white px-6 py-2 rounded-lg hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          )}

          {sectionToast.section === 'social' && sectionToast.show && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              Social media links saved successfully!
            </div>
          )}
        </div>

        {/* Bottom Action Buttons */}
        <div className="flex justify-between pt-6">
          <button
            onClick={() => setShowProfile(false)}
            className="px-8 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={handleSaveAllChanges}
            className="px-8 py-3 bg-[#1E90FF] text-white rounded-xl font-medium hover:bg-blue-600"
          >
            Update Changes
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SettingsSection;
