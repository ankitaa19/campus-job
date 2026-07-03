import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Image from 'next/image';
import CollegeRegistrationNavbar from '../../components/CollegeRegistrationNavbar';
import ProtectedRoute from '../../components/ProtectedRoute';
import {
  Home,
  MapPin,
  Book,
  Image as ImageIcon,
  Award,
  Edit,
  Users,
  Video,
  ChevronDown,
  Coffee,
  Monitor,
  Dumbbell,
  Bed,
  Trophy,
  BookOpen,
  Pencil,
  Wifi,
  X,
  Trash2,
} from "lucide-react";



const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface CollegeProfile {
  _id: string;
  name: string;
  shortName?: string;
  website?: string;
  logo?: string;
  banner?: string;
  establishedYear: number;
  recognizedBy: string;
  collegeType?: string;
  affiliation: string;
  aboutCollege?: string;
  userEmail?: string;
  campusDescription?: string;
  naacRating?: string;
  nirfRanking?: {
    category?: string;
    rank?: number | string;
    year?: number | string;
  };
  facilities?: Facility[];
  achievements?: Achievement[];
  alumni?: Alumni[];
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    district: string;
  };
  primaryContact: {
    name: string;
    designation: string;
    email: string;
    phone: string;
  };
  placementContact?: {
    name: string;
    designation: string;
    email: string;
    phone: string;
  };
  socialMedia?: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
    pinterest?: string;
    website?: string;
  };
  gallery?: string[];
  brochures?: Brochure[];
  approvalStatus: string;
}

interface Brochure {
  _id?: string;
  name: string;
  size: number;
  url: string;
  cdnUrl: string;
  uploadedAt?: string;
}

interface Facility {
  _id?: string;
  name: string;
  icon: string;
  description?: string;
  isActive: boolean;
}

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
      validUntil?: string; // ISO date string
    };
    meritScholarship?: {
      enabled: boolean;
      percent?: number | string;
      criteria?: string;
    };
  };
  admissionDates?: {
    startDate?: string; // ISO date string
    deadline?: string; // ISO date string
  };
  isActive?: boolean;
  collegeId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Stream mapping system (same as dashboard)
const COURSE_STREAM_MAPPING: { [key: string]: string[] } = {
  // Engineering & Technology
  'B.Tech': ['Computer Science Engineering', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Chemical Engineering', 'Aerospace Engineering', 'Biotechnology Engineering', 'Automobile Engineering'],
  'M.Tech': ['Computer Science Engineering', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Chemical Engineering', 'Aerospace Engineering', 'Biotechnology Engineering', 'Automobile Engineering'],
  'B.E': ['Computer Science Engineering', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Chemical Engineering', 'Aerospace Engineering', 'Biotechnology Engineering', 'Automobile Engineering'],
  'M.E': ['Computer Science Engineering', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Chemical Engineering', 'Aerospace Engineering', 'Biotechnology Engineering', 'Automobile Engineering'],
  'Diploma': ['Computer Science Engineering', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Chemical Engineering', 'Aerospace Engineering', 'Biotechnology Engineering', 'Automobile Engineering'],
  'Engineering': ['Computer Science Engineering', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Chemical Engineering', 'Aerospace Engineering', 'Biotechnology Engineering', 'Automobile Engineering'],
  
  // Medical & Health Sciences
  'MBBS': ['General Medicine', 'Surgery', 'Pediatrics', 'Gynecology', 'Orthopedics', 'Cardiology', 'Neurology', 'Psychiatry', 'Dermatology', 'Radiology'],
  'BDS': ['General Dentistry', 'Oral Surgery', 'Orthodontics', 'Periodontics', 'Endodontics', 'Prosthodontics', 'Pedodontics', 'Oral Pathology', 'Oral Medicine', 'Public Health Dentistry'],
  'BAMS': ['General Ayurveda', 'Panchakarma', 'Kayachikitsa', 'Shalya Tantra', 'Shalakya Tantra', 'Prasuti Tantra', 'Kaumarabhritya', 'Agada Tantra', 'Rasayana', 'Swasthvritta'],
  'BHMS': ['General Homeopathy', 'Materia Medica', 'Organon of Medicine', 'Repertory', 'Case Taking', 'Chronic Diseases', 'Acute Diseases', 'Pediatric Homeopathy', 'Geriatric Homeopathy', 'Clinical Homeopathy'],
  'BUMS': ['General Unani', 'Ilmul Advia', 'Tahaffuzi wa Samaji Tib', 'Ilmul Amraz', 'Jarahat', 'Qabalat wa Amraze Niswan', 'Ilmul Atfal', 'Moalijat', 'Amraze Jild wa Zohrawiya', 'Kulliyat'],
  'Pharmacy': ['Pharmaceutics', 'Pharmacology', 'Pharmaceutical Chemistry', 'Pharmacognosy', 'Clinical Pharmacy', 'Hospital Pharmacy', 'Industrial Pharmacy', 'Regulatory Affairs', 'Quality Assurance', 'Drug Development'],
  'Physiotherapy': ['Musculoskeletal Physiotherapy', 'Neurological Physiotherapy', 'Cardiopulmonary Physiotherapy', 'Sports Physiotherapy', 'Pediatric Physiotherapy', 'Geriatric Physiotherapy', 'Women\'s Health', 'Community Physiotherapy', 'Electrotherapy', 'Exercise Therapy'],
  'Nursing': ['General Nursing', 'Medical-Surgical Nursing', 'Psychiatric Nursing', 'Community Health Nursing', 'Pediatric Nursing', 'Obstetric & Gynecological Nursing', 'Critical Care Nursing', 'Emergency Nursing', 'Oncology Nursing', 'Cardiac Nursing'],
  'Medical': ['General Medicine', 'Surgery', 'Pediatrics', 'Gynecology', 'Orthopedics', 'Cardiology', 'Neurology', 'Psychiatry', 'Dermatology', 'Radiology'],
  
  // Management & Business
  'MBA': ['Finance', 'Marketing', 'Human Resources', 'Operations Management', 'International Business', 'Information Technology', 'Healthcare Management', 'Retail Management', 'Banking & Insurance', 'Entrepreneurship'],
  'BBA': ['Finance', 'Marketing', 'Human Resources', 'Operations Management', 'International Business', 'Information Technology', 'Healthcare Management', 'Retail Management', 'Banking & Insurance', 'Entrepreneurship'],
  'PGDM': ['Finance', 'Marketing', 'Human Resources', 'Operations Management', 'International Business', 'Information Technology', 'Healthcare Management', 'Retail Management', 'Banking & Insurance', 'Entrepreneurship'],
  'Management': ['Finance', 'Marketing', 'Human Resources', 'Operations Management', 'International Business', 'Information Technology', 'Healthcare Management', 'Retail Management', 'Banking & Insurance', 'Entrepreneurship'],
  'Hotel Management': ['Food & Beverage Management', 'Front Office Operations', 'Housekeeping Management', 'Event Management', 'Culinary Arts', 'Tourism Management', 'Resort Management', 'Restaurant Management', 'Hospitality Marketing', 'Hotel Operations'],
  
  // Commerce & Economics
  'B.Com': ['Accounting & Finance', 'Banking & Insurance', 'Taxation', 'Corporate Secretaryship', 'Business Economics', 'International Business', 'E-Commerce', 'Financial Markets', 'Cost Accounting', 'Auditing'],
  'M.Com': ['Accounting & Finance', 'Banking & Insurance', 'Taxation', 'Corporate Secretaryship', 'Business Economics', 'International Business', 'E-Commerce', 'Financial Markets', 'Cost Accounting', 'Auditing'],
  'CA': ['Financial Accounting', 'Cost Accounting', 'Management Accounting', 'Auditing', 'Taxation', 'Corporate Law', 'Financial Management', 'Strategic Financial Management', 'Information Systems', 'Ethics'],
  'CS': ['Corporate Law', 'Securities Law', 'Economic & Commercial Laws', 'Tax Laws', 'Labour & Industrial Laws', 'Foreign Exchange Management', 'Insurance Law', 'Intellectual Property Rights', 'Competition Law', 'Banking Law'],
  'CMA': ['Financial Accounting', 'Cost Accounting', 'Management Accounting', 'Corporate Finance', 'Strategic Cost Management', 'Performance Management', 'Risk Management', 'Internal Audit', 'Corporate Laws', 'Indirect Tax'],
  'Commerce': ['Accounting & Finance', 'Banking & Insurance', 'Taxation', 'Corporate Secretaryship', 'Business Economics', 'International Business', 'E-Commerce', 'Financial Markets', 'Cost Accounting', 'Auditing'],
  
  // Arts & Humanities
  'BA': ['English Literature', 'History', 'Political Science', 'Psychology', 'Sociology', 'Philosophy', 'Economics', 'Geography', 'Hindi Literature', 'Foreign Languages'],
  'MA': ['English Literature', 'History', 'Political Science', 'Psychology', 'Sociology', 'Philosophy', 'Economics', 'Geography', 'Hindi Literature', 'Foreign Languages'],
  'Arts': ['English Literature', 'History', 'Political Science', 'Psychology', 'Sociology', 'Philosophy', 'Economics', 'Geography', 'Hindi Literature', 'Foreign Languages'],
  'Fine Arts': ['Painting', 'Sculpture', 'Applied Arts', 'Graphic Design', 'Interior Design', 'Fashion Design', 'Animation', 'Photography', 'Textile Design', 'Ceramic Arts'],
  'Mass Communication': ['Journalism', 'Radio & TV Production', 'Advertising', 'Public Relations', 'Digital Media', 'Print Media', 'Electronic Media', 'Documentary Making', 'News Reporting', 'Media Management'],
  
  // Science & Technology
  'BSc': ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'Statistics', 'Environmental Science', 'Geology', 'Botany', 'Zoology'],
  'MSc': ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'Statistics', 'Environmental Science', 'Geology', 'Botany', 'Zoology'],
  'Science': ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'Statistics', 'Environmental Science', 'Geology', 'Botany', 'Zoology'],
  'BCA': ['Software Development', 'Web Development', 'Database Management', 'Network Administration', 'System Analysis', 'Mobile App Development', 'Cyber Security', 'Artificial Intelligence', 'Data Science', 'Cloud Computing'],
  'MCA': ['Software Development', 'Web Development', 'Database Management', 'Network Administration', 'System Analysis', 'Mobile App Development', 'Cyber Security', 'Artificial Intelligence', 'Data Science', 'Cloud Computing'],
  
  // Law
  'LLB': ['Constitutional Law', 'Criminal Law', 'Civil Law', 'Corporate Law', 'International Law', 'Cyber Law', 'Environmental Law', 'Labour Law', 'Intellectual Property Law', 'Human Rights Law'],
  'LLM': ['Constitutional Law', 'Criminal Law', 'Civil Law', 'Corporate Law', 'International Law', 'Cyber Law', 'Environmental Law', 'Labour Law', 'Intellectual Property Law', 'Human Rights Law'],
  'BA LLB': ['Constitutional Law', 'Criminal Law', 'Civil Law', 'Corporate Law', 'International Law', 'Cyber Law', 'Environmental Law', 'Labour Law', 'Intellectual Property Law', 'Human Rights Law'],
  'BBA LLB': ['Constitutional Law', 'Criminal Law', 'Civil Law', 'Corporate Law', 'International Law', 'Cyber Law', 'Environmental Law', 'Labour Law', 'Intellectual Property Law', 'Human Rights Law'],
  'B.Com LLB': ['Constitutional Law', 'Criminal Law', 'Civil Law', 'Corporate Law', 'International Law', 'Cyber Law', 'Environmental Law', 'Labour Law', 'Intellectual Property Law', 'Human Rights Law'],
  'Law': ['Constitutional Law', 'Criminal Law', 'Civil Law', 'Corporate Law', 'International Law', 'Cyber Law', 'Environmental Law', 'Labour Law', 'Intellectual Property Law', 'Human Rights Law'],
  
  // Architecture & Design
  'B.Arch': ['Architectural Design', 'Urban Planning', 'Landscape Architecture', 'Interior Architecture', 'Sustainable Design', 'Conservation Architecture', 'Housing Design', 'Commercial Architecture', 'Institutional Architecture', 'Industrial Architecture'],
  'M.Arch': ['Architectural Design', 'Urban Planning', 'Landscape Architecture', 'Interior Architecture', 'Sustainable Design', 'Conservation Architecture', 'Housing Design', 'Commercial Architecture', 'Institutional Architecture', 'Industrial Architecture'],
  'Architecture': ['Architectural Design', 'Urban Planning', 'Landscape Architecture', 'Interior Architecture', 'Sustainable Design', 'Conservation Architecture', 'Housing Design', 'Commercial Architecture', 'Institutional Architecture', 'Industrial Architecture'],
  'Interior Design': ['Residential Design', 'Commercial Design', 'Hospitality Design', 'Retail Design', 'Office Design', 'Exhibition Design', 'Sustainable Interior Design', 'Furniture Design', 'Lighting Design', 'Space Planning'],
  
  // Agriculture & Food Technology
  'Agriculture': ['Agronomy', 'Horticulture', 'Plant Pathology', 'Entomology', 'Soil Science', 'Agricultural Engineering', 'Animal Husbandry', 'Dairy Science', 'Food Technology', 'Agricultural Economics'],
  'B.Sc Agriculture': ['Agronomy', 'Horticulture', 'Plant Pathology', 'Entomology', 'Soil Science', 'Agricultural Engineering', 'Animal Husbandry', 'Dairy Science', 'Food Technology', 'Agricultural Economics'],
  'Horticulture': ['Fruit Science', 'Vegetable Science', 'Floriculture', 'Landscaping', 'Post Harvest Technology', 'Plant Breeding', 'Nursery Management', 'Greenhouse Technology', 'Organic Farming', 'Medicinal Plants'],
  'Food Technology': ['Food Processing', 'Food Preservation', 'Food Quality Control', 'Dairy Technology', 'Beverage Technology', 'Bakery Technology', 'Meat Technology', 'Food Packaging', 'Food Safety', 'Nutrition'],
  
  // Education
  'B.Ed': ['Elementary Education', 'Secondary Education', 'Special Education', 'Physical Education', 'Educational Psychology', 'Curriculum Development', 'Educational Technology', 'Teacher Training', 'Educational Administration', 'Guidance & Counseling'],
  'M.Ed': ['Elementary Education', 'Secondary Education', 'Special Education', 'Physical Education', 'Educational Psychology', 'Curriculum Development', 'Educational Technology', 'Teacher Training', 'Educational Administration', 'Guidance & Counseling'],
  'D.Ed': ['Elementary Education', 'Pre-Primary Education', 'Primary Education', 'Child Psychology', 'Teaching Methods', 'Educational Technology', 'Classroom Management', 'Assessment & Evaluation', 'Educational Philosophy', 'Community Education'],
  'Education': ['Elementary Education', 'Secondary Education', 'Special Education', 'Physical Education', 'Educational Psychology', 'Curriculum Development', 'Educational Technology', 'Teacher Training', 'Educational Administration', 'Guidance & Counseling']
};



interface Achievement {
  _id?: string;
  title: string;
  year: number;
  description?: string;
  photo?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Alumni {
  _id?: string;
  name: string;
  email?: string;
  company?: string;
  qualification?: string;
  graduationYear?: number;
  image?: string;
  about?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface VirtualTour {
  _id?: string;
  title: string;
  description?: string;
  videoUrl?: string;
  videoFile?: string; // For uploaded video files
  locationName?: string;
  thumbnailUrl?: string;
  duration?: number; // Video duration in seconds
  isPreview?: boolean; // Whether this video is set as banner preview
  createdAt?: string;
  updatedAt?: string;
}

const ProfileSetup = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [college, setCollege] = useState<CollegeProfile | null>(null);
  const [formData, setFormData] = useState<CollegeProfile | null>(null);
  const [showSocialMediaModal, setShowSocialMediaModal] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [recognizedBySearch, setRecognizedBySearch] = useState('');
  
  // Upload states for better UX
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  // Facilities state
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [savingFacilities, setSavingFacilities] = useState(false);
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [showFacilitySelector, setShowFacilitySelector] = useState(false);
  
  // Achievements state
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [viewingAchievement, setViewingAchievement] = useState<Achievement | null>(null);
  const [showAchievementViewModal, setShowAchievementViewModal] = useState(false);
  const [savingAchievement, setSavingAchievement] = useState(false);
  const [showFacilityAddModal, setShowFacilityAddModal] = useState(false);
  const [campusDescription, setCampusDescription] = useState('');
  const [isEditingCampusDescription, setIsEditingCampusDescription] = useState(false);
  
  // Alumni state
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [showAlumniModal, setShowAlumniModal] = useState(false);
  const [editingAlumni, setEditingAlumni] = useState<Alumni | null>(null);
  const [viewingAlumni, setViewingAlumni] = useState<Alumni | null>(null);
  const [showAlumniViewModal, setShowAlumniViewModal] = useState(false);
  const [savingAlumni, setSavingAlumni] = useState(false);
  const [alumniImagePreview, setAlumniImagePreview] = useState<string | null>(null);
  const [selectedAlumniImageFile, setSelectedAlumniImageFile] = useState<File | null>(null);
  const [alumniImageUploadStatus, setAlumniImageUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  
  // Virtual Tour state
  const [virtualTours, setVirtualTours] = useState<VirtualTour[]>([]);
  const [showVirtualTourModal, setShowVirtualTourModal] = useState(false);
  const [editingVirtualTour, setEditingVirtualTour] = useState<VirtualTour | null>(null);
  const [savingVirtualTour, setSavingVirtualTour] = useState(false);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoUploadStatus, setVideoUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [playingVideo, setPlayingVideo] = useState<VirtualTour | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  // Derived thumbnails for URL-based videos (e.g., YouTube/Vimeo)
  const [videoThumbnails, setVideoThumbnails] = useState<Record<string, string>>({});
  
  // Video details editing state
  const [isEditingVideoDetails, setIsEditingVideoDetails] = useState(false);
  const [editedVideoDetails, setEditedVideoDetails] = useState<Partial<VirtualTour>>({});

  // Build thumbnail URL for supported platforms
  const buildThumbnailFromUrl = (url: string): string | null => {
    const trimmed = url.trim();
    // YouTube standard links
    const ytShort = trimmed.match(/^https?:\/\/youtu\.be\/([\w-]{11})/);
    const ytLong = trimmed.match(/(?:v=|\/embed\/|\/shorts\/)([\w-]{11})/);
    const ytId = ytShort?.[1] || ytLong?.[1];
    if (ytId) {
      return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    }
    return null; // Vimeo handled asynchronously below
  };

  // Resolve thumbnails for URL-based videos (YouTube immediate, Vimeo via oEmbed)
  useEffect(() => {
    const resolveThumbnails = async () => {
      for (const tour of virtualTours) {
        const id = tour._id || '';
        if (!id) continue;
        if (videoThumbnails[id]) continue; // already resolved
        if (tour.thumbnailUrl) {
          setVideoThumbnails(prev => ({ ...prev, [id]: tour.thumbnailUrl! }));
          continue;
        }
        if (tour.videoUrl && !tour.videoFile) {
          const ytThumb = buildThumbnailFromUrl(tour.videoUrl);
          if (ytThumb) {
            setVideoThumbnails(prev => ({ ...prev, [id]: ytThumb }));
            continue;
          }
          // Try Vimeo oEmbed
          if (/vimeo\.com/.test(tour.videoUrl)) {
            try {
              const resp = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(tour.videoUrl)}`);
              if (resp.ok) {
                const data = await resp.json();
                if (data.thumbnail_url) {
                  setVideoThumbnails(prev => ({ ...prev, [id]: data.thumbnail_url }));
                }
              }
            } catch (err) {
              // Ignore fetch errors; fallback visuals will render
              console.warn('Vimeo thumbnail fetch failed:', err);
            }
          }
        }
      }
    };
    if (virtualTours && virtualTours.length > 0) {
      resolveThumbnails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [virtualTours]);
  
  // Brochure state
  const [brochureUploadStatus, setBrochureUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [showOtherDetailsModal, setShowOtherDetailsModal] = useState(false);
  
  // Edit modal states
  const [showBasicInfoModal, setShowBasicInfoModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  
  // Form validation states
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  
  // Pin code lookup states
  const [loadingPinCodeData, setLoadingPinCodeData] = useState(false);
  
  // Dropdown options
  const [collegeTypeOptions] = useState([
    'Private',
    'Government', 
    'Semi-Government',
    'Autonomous',
    'Deemed University',
    'Central University',
    'State University'
  ]);
  
  const [recognizedByOptions] = useState([
    'UGC (University Grants Commission)',
    'AICTE (All India Council for Technical Education)', 
    'NCTE (National Council for Teacher Education)',
    'MCI (Medical Council of India)',
    'DCI (Dental Council of India)',
    'BCI (Bar Council of India)',
    'ICAR (Indian Council of Agricultural Research)',
    'COA (Council of Architecture)',
    'PCI (Pharmacy Council of India)',
    'INC (Indian Nursing Council)',
    'Other'
  ]);

  const [nirfCategoryOptions] = useState([
    'Overall',
    'University',
    'College',
    'Engineering',
    'Management',
    'Pharmacy',
    'Medical',
    'Law',
    'Architecture & Planning',
    'Dental',
    'Agriculture & Allied Sectors',
    'Innovation'
  ]);

  const [naacRatingOptions] = useState([
    'A++',
    'A+',
    'A',
    'B++',
    'B+',
    'B',
    'C',
    'D'
  ]);
  
  // Section-specific toast notification states
  const [sectionToasts, setSectionToasts] = useState<{
    [section: string]: {
      show: boolean;
      message: string;
      type: 'success' | 'error';
    }
  }>({});
  
  // Change tracking states
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalFormData, setOriginalFormData] = useState<CollegeProfile | null>(null);
  
  // Courses state
  const [courses, setCourses] = useState<Course[]>([]);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showCourseDetailsModal, setShowCourseDetailsModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);
  
  const [socialMediaData, setSocialMediaData] = useState({
    linkedin: '',
    facebook: '',
    twitter: '',
    instagram: '',
    pinterest: '',
    website: ''
  });

  // Gallery state
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [showAddImageModal, setShowAddImageModal] = useState(false);
  const [showFullImageModal, setShowFullImageModal] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string>('');

  // Confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    type: 'delete' | 'remove';
    onConfirm: () => void;
  } | null>(null);

  // Normalize image URL - handles both local and CDN URLs
  const getImageSrc = (url: string) => {
    if (!url) return '';
    
    // If it's already a full URL (CDN or external), return as is
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    
    // For relative paths, prepend the API base URL
    const base = API_BASE_URL?.replace(/\/$/, '') || '';
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${base}${path}`;
  };

  // Format currency in Indian numbering system
  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseInt(amount) : amount;
    if (num === 0) return '₹0';
    
    // Format in Indian numbering system (lakhs)
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
    
    return formatted;
  };

  // Available facilities for selection
  const availableFacilities = [
    { id: 'cafeteria', name: 'Cafeteria', icon: <Coffee className="w-8 h-8" /> },
    { id: 'computer-lab', name: 'Computer Lab', icon: <Monitor className="w-8 h-8" /> },
    { id: 'gym', name: 'Gym', icon: <Dumbbell className="w-8 h-8" /> },
    { id: 'hostel', name: 'Hostel', icon: <Bed className="w-8 h-8" /> },
    { id: 'sports', name: 'Sports', icon: <Trophy className="w-8 h-8" /> },
    { id: 'library', name: 'Library', icon: <BookOpen className="w-8 h-8" /> },
    { id: 'stationery', name: 'Stationery', icon: <Pencil className="w-8 h-8" /> },
    { id: 'wifi-campus', name: 'Wifi Campus', icon: <Wifi className="w-8 h-8" /> }
  ];

  // Toggle facility selection
  const toggleFacility = (facilityId: string) => {
    setSelectedFacilities(prev => 
      prev.includes(facilityId) 
        ? prev.filter(id => id !== facilityId)
        : [...prev, facilityId]
    );
  };

  // Save selected facilities
  const saveFacilities = async (selectedList: string[] = selectedFacilities) => {
    setSavingFacilities(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to continue');
        return;
      }

      await axios.put(
        `${API_BASE_URL}/api/colleges/facilities`,
        { facilities: selectedList },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ensure state reflects latest saved list
      setSelectedFacilities(selectedList);
      showToastMessage('Facilities updated successfully!');
    } catch (error) {
      console.error('Error saving facilities:', error);
      showToastMessage('Error saving facilities. Please try again.', 'error');
    } finally {
      setSavingFacilities(false);
    }
  };

  // Social Media Icon Components
  const LinkedinIcon = () => (
    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    </div>
  );

  const FacebookIcon = () => (
    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    </div>
  );

  const TwitterIcon = () => (
    <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center">
      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
      </svg>
    </div>
  );

  const InstagramIcon = () => (
    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    </div>
  );

  const PinterestIcon = () => (
    <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.719-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.887 2.748.099.12.112.225.085.347-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.758-1.378l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z"/>
      </svg>
    </div>
  );

  const WebsiteIcon = () => (
    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    </div>
  );

  // Load college profile data
  useEffect(() => {
    loadCollegeProfile();
    loadFacilities();
    loadCourses();
  }, []);

  // Handle URL parameters for editing courses
  useEffect(() => {
    if (router.isReady) {
      const { editCourse, tab } = router.query;
      
      // If redirected from dashboard to edit a course
      if (tab === 'courses') {
        setActiveTab('courses');
      }
      
      if (editCourse && courses.length > 0) {
        const courseToEdit = courses.find(course => course._id === editCourse);
        if (courseToEdit) {
          setEditingCourse(courseToEdit);
          setShowCourseModal(true);
        }
      }
    }
  }, [router.isReady, router.query, courses]);

  const loadFacilities = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(
        `${API_BASE_URL}/api/colleges/facilities`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFacilities(response.data.facilities || []);
      setSelectedFacilities(response.data.selectedFacilities || []);
      setCampusDescription(response.data.campusDescription || '');
    } catch (error) {
      console.error('Error loading facilities:', error);
    }
  };

  const loadCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(
        `${API_BASE_URL}/api/courses/my-college`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCourses(response.data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = (error.response?.data as any)?.message;
        if (status === 401 && message && message.toLowerCase().includes('token')) {
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          router.push('/login');
          return;
        }
      }
    }
  };

  // Close dropdowns when clicking outside
  const loadCollegeProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      if (!token || !userId) {
        router.push('/login');
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/colleges/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCollege(response.data);
      
      console.log('Loaded college data:', response.data); // Debug log
      console.log('Address data from server:', response.data.address); // Debug log
      console.log('District from server:', response.data.address?.district); // Debug log
      
      // Ensure address object exists with all required fields
      const addressData = response.data.address || {};
      const formDataWithAddress = {
        ...response.data,
        address: {
          street: addressData.street || '',
          zipCode: addressData.zipCode || '',
          city: addressData.city || '',
          state: addressData.state || '',
          district: addressData.district || ''
        }
      };
      
      console.log('FormData with address:', formDataWithAddress.address); // Debug log
      console.log('District in formData:', formDataWithAddress.address.district); // Debug log
      
      setFormData(formDataWithAddress);
      setOriginalFormData(JSON.parse(JSON.stringify(formDataWithAddress))); // Deep copy for comparison
      setHasUnsavedChanges(false);
      
      // Data is already set in formData through setFormData above
      // No additional initialization needed for recognizedBy since it's stored as comma-separated string
      
      // Initialize social media data
      if (response.data.socialMedia) {
        setSocialMediaData({
          linkedin: response.data.socialMedia.linkedin || '',
          facebook: response.data.socialMedia.facebook || '',
          twitter: response.data.socialMedia.twitter || '',
          instagram: response.data.socialMedia.instagram || '',
          pinterest: response.data.socialMedia.pinterest || '',
          website: response.data.socialMedia.website || ''
        });
      }
      
      // Initialize gallery images
      if (response.data.gallery) {
        setGalleryImages(response.data.gallery);
      }
      
      // Initialize achievements
      if (response.data.achievements) {
        setAchievements(response.data.achievements);
      }
      
      // Initialize alumni
      if (response.data.alumni) {
        setAlumni(response.data.alumni);
      }
      
      // Initialize virtual tours
      if (response.data.virtualTours) {
        setVirtualTours(response.data.virtualTours);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading college profile:', error);
      setLoading(false);
    }
  };

  // Helper function to show confirmation modal
  const showConfirmation = (title: string, message: string, type: 'delete' | 'remove', onConfirm: () => void) => {
    setConfirmAction({ title, message, type, onConfirm });
    setShowConfirmModal(true);
  };

  // Helper function to handle social media changes with tracking
  const handleSocialMediaChange = (field: string, value: string) => {
    const updatedSocialMedia = { ...socialMediaData, [field]: value };
    setSocialMediaData(updatedSocialMedia);
    
    // Check if there are unsaved changes
    if (originalFormData) {
      const originalSocialMedia = originalFormData.socialMedia || {};
      const hasChanges = JSON.stringify(updatedSocialMedia) !== JSON.stringify(originalSocialMedia) ||
                        JSON.stringify(formData) !== JSON.stringify(originalFormData);
      setHasUnsavedChanges(hasChanges);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (!formData) return;
    
    console.log(`Updating field: ${field}, value: ${value}`); // Debug log
    
    let updatedFormData;
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      // Ensure the parent object exists before updating the child
      const parentObject = (formData as any)[parent] || {};
      updatedFormData = {
        ...formData,
        [parent]: {
          ...parentObject,
          [child]: value
        }
      };
      
      console.log(`Updated ${parent}.${child}:`, updatedFormData[parent]); // Debug log
    } else {
      updatedFormData = {
        ...formData,
        [field]: value
      };
    }
    
    setFormData(updatedFormData);
    
    // Check if there are unsaved changes
    if (originalFormData) {
      const hasChanges = JSON.stringify(updatedFormData) !== JSON.stringify(originalFormData);
      setHasUnsavedChanges(hasChanges);
    }
  };

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setBannerPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append('banner', file);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/colleges/upload-banner`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Update the college data with new banner URL
      if (response.data.bannerUrl) {
        setCollege(prev => prev ? { ...prev, banner: response.data.bannerUrl } : prev);
        setFormData(prev => prev ? { ...prev, banner: response.data.bannerUrl } : prev);
        setBannerPreview(null);
        
        showToastMessage('Banner uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading banner:', error);
      setBannerPreview(null);
      showToastMessage('Error uploading banner. Please try again.', 'error');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (5MB limit for logo)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/colleges/upload-logo`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Update the college data with new logo URL
      if (response.data.logoUrl) {
        setCollege(prev => prev ? { ...prev, logo: response.data.logoUrl } : prev);
        setFormData(prev => prev ? { ...prev, logo: response.data.logoUrl } : prev);
        setLogoPreview(null);
        
        showToastMessage('Logo uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      setLogoPreview(null);
      showToastMessage('Error uploading logo. Please try again.', 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Gallery functions
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setSelectedImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = async () => {
    if (!selectedImageFile) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedImageFile);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/colleges/upload-gallery-image`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.imageUrl) {
        setGalleryImages(prev => [...prev, response.data.imageUrl]);
        setShowAddImageModal(false);
        setSelectedImageFile(null);
        setImagePreview(null);
        
        showToastMessage('Image uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showToastMessage('Error uploading image. Please try again.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    showConfirmation(
      'Delete Image',
      'Are you sure you want to delete this image? This action cannot be undone.',
      'delete',
      () => confirmDeleteImage(imageUrl)
    );
  };

  const confirmDeleteImage = async (imageUrl: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_BASE_URL}/api/colleges/gallery-image`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { imageUrl: imageUrl }
        }
      );

      setGalleryImages(prev => prev.filter(url => url !== imageUrl));
      setShowConfirmModal(false);
      setConfirmAction(null);
      
      showToastMessage('Image deleted successfully!');
    } catch (error) {
      console.error('Error deleting image:', error);
      showToastMessage('Error deleting image. Please try again.', 'error');
    }
  };

  const openFullImage = (imageUrl: string) => {
    const index = galleryImages.findIndex(url => url === imageUrl);
    setCurrentImageIndex(index);
    setFullImageUrl(getImageSrc(imageUrl));
    setShowFullImageModal(true);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    let newIndex = currentImageIndex;
    if (direction === 'prev') {
      newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : galleryImages.length - 1;
    } else {
      newIndex = currentImageIndex < galleryImages.length - 1 ? currentImageIndex + 1 : 0;
    }
    setCurrentImageIndex(newIndex);
    setFullImageUrl(getImageSrc(galleryImages[newIndex]));
  };

  const openAddImageModal = () => {
    setSelectedImageFile(null);
    setImagePreview(null);
    setShowAddImageModal(true);
  };

  const handleSave = async () => {
    if (!formData) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      // Save all form data including basic info, contact details, address, about, and social media
      const completeFormData = {
        ...formData,
        socialMedia: socialMediaData
      };

      await axios.put(
        `${API_BASE_URL}/api/colleges/user/${userId}`,
        completeFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCollege(completeFormData);
      setOriginalFormData(JSON.parse(JSON.stringify(completeFormData))); // Update original data
      setHasUnsavedChanges(false);
      showToastMessage('All profile details saved successfully!', 'success', 'general');
    } catch (error) {
      console.error('Error saving profile:', error);
      showToastMessage('Error saving profile. Please try again.', 'error', 'general');
    } finally {
      setSaving(false);
    }
  };

  const handleAboutSave = async () => {
    if (!formData) return;

    // Validate word limits
    const wordCount = formData.aboutCollege?.trim().split(/\s+/).filter(word => word.length > 0).length || 0;
    
    if (!formData.aboutCollege || wordCount < 50) {
      alert('About section must be at least 50 words long.');
      return;
    }

    if (wordCount > 300) {
      alert('About section must not exceed 300 words.');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      console.log('Saving about section:', formData.aboutCollege);

      const response = await axios.put(
        `${API_BASE_URL}/api/colleges/user/${userId}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('About section saved successfully:', response.data);

      setCollege(formData);
      setIsEditingAbout(false);
      
      // Show success message using centralized toast
      showToastMessage('About section updated successfully!', 'success', 'about');
      
    } catch (error) {
      console.error('Error saving about section:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
      showToastMessage('Error saving about section. Please try again.', 'error', 'about');
    } finally {
      setSaving(false);
    }
  };

  const handleSocialMediaSave = async () => {
    if (!formData) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      const updatedFormData = {
        ...formData,
        socialMedia: socialMediaData
      };

      console.log('Saving social media data:', socialMediaData);
      console.log('Full form data being sent:', updatedFormData);

      const response = await axios.put(
        `${API_BASE_URL}/api/colleges/user/${userId}`,
        updatedFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Backend response:', response.data);

      setFormData(updatedFormData);
      setCollege(updatedFormData);
      setShowSocialMediaModal(false);
      
      // Show success message using centralized toast
      showToastMessage('Social media links updated successfully!', 'success', 'socialMedia');
      
    } catch (error) {
      console.error('Error saving social media links:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
      showToastMessage('Error saving social media links. Please try again.', 'error', 'socialMedia');
    } finally {
      setSaving(false);
    }
  };

  const openSocialMediaModal = () => {
    // Initialize modal data with current values
    if (formData?.socialMedia) {
      setSocialMediaData({
        linkedin: formData.socialMedia.linkedin || '',
        facebook: formData.socialMedia.facebook || '',
        twitter: formData.socialMedia.twitter || '',
        instagram: formData.socialMedia.instagram || '',
        pinterest: formData.socialMedia.pinterest || '',
        website: formData.socialMedia.website || ''
      });
    }
    setShowSocialMediaModal(true);
  };

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const validateWebsite = (website: string): boolean => {
    if (!website) return true; // Optional field
    try {
      new URL(website);
      return true;
    } catch {
      return false;
    }
  };

  const validatePinCode = (pinCode: string): boolean => {
    // Remove any spaces or special characters
    const cleanPinCode = pinCode.replace(/\s+/g, '').replace(/[^0-9]/g, '');
    
    // Indian pin codes are 6 digits, first digit cannot be 0
    const pinCodeRegex = /^[1-9][0-9]{5}$/;
    const isValid = pinCodeRegex.test(cleanPinCode);
    
    console.log(`Validating pin code: "${pinCode}" -> cleaned: "${cleanPinCode}" -> valid: ${isValid}`);
    
    return isValid;
  };

  // Enhanced pin code lookup function with robust error handling
  const fetchLocationFromPinCode = async (pinCode: string) => {
    // Clean the pin code first
    const cleanPinCode = pinCode.replace(/\s+/g, '').replace(/[^0-9]/g, '');
    
    if (!validatePinCode(cleanPinCode)) {
      console.log('Invalid pin code format:', pinCode, '-> cleaned:', cleanPinCode);
      return;
    }
    
    setLoadingPinCodeData(true);
    console.log('Fetching location for pin code:', cleanPinCode);
    
    try {
      // Primary API - PostalPinCode.in
      const response = await axios.get(`https://api.postalpincode.in/pincode/${cleanPinCode}`, {
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API Response:', response.data);
      
      const data = response.data;
      
      // Check if response is valid
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid response format');
      }
      
      const firstResult = data[0];
      console.log('First result:', firstResult);
      
      // Check if the API returned success
      if (firstResult.Status === 'Success' && firstResult.PostOffice && firstResult.PostOffice.length > 0) {
        // Try to find the best post office entry
        let bestPostOffice = firstResult.PostOffice[0];
        
        // Look for a post office entry with the most complete data
        for (const postOffice of firstResult.PostOffice) {
          if (postOffice.District && postOffice.State && (postOffice.Block || postOffice.Name)) {
            bestPostOffice = postOffice;
            break;
          }
        }
        
        console.log('Selected post office:', bestPostOffice);
        
        const locationData = {
          city: bestPostOffice.Block || bestPostOffice.Name || bestPostOffice.Division || 'Unknown',
          state: bestPostOffice.State || 'Unknown',
          district: bestPostOffice.District || bestPostOffice.Block || bestPostOffice.Name || 'Unknown'
        };
        
        console.log('Parsed location data:', locationData);
        
        // Validate we have minimum required data
        if (locationData.state === 'Unknown' && locationData.district === 'Unknown') {
          throw new Error('Insufficient location data in response');
        }
        
        const updatedAddress = {
          ...formData?.address,
          zipCode: cleanPinCode,
          city: locationData.city,
          state: locationData.state,
          district: locationData.district
        };
        
        console.log('Updated address:', updatedAddress);
        
        handleInputChange('address', updatedAddress);
        showToastMessage('Location details auto-filled from pin code!', 'success');
        
      } else if (firstResult.Status === 'Error') {
        console.error('API returned error:', firstResult.Message);
        showToastMessage(`Pin code not found: ${firstResult.Message || 'Invalid pin code'}`, 'error');
      } else {
        console.error('No post office data found for pin code:', cleanPinCode);
        showToastMessage('No location data found for this pin code. Please enter details manually.', 'error');
      }
      
    } catch (error: any) {
      console.error('Error fetching location data:', error);
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        showToastMessage('Request timed out. Please check your internet connection and try again.', 'error');
      } else if (error.response) {
        showToastMessage(`Server error: ${error.response.status}. Please try again later.`, 'error');
      } else if (error.request) {
        showToastMessage('Network error. Please check your internet connection.', 'error');
      } else {
        showToastMessage('Unable to fetch location details. Please enter manually.', 'error');
      }
    } finally {
      setLoadingPinCodeData(false);
    }
  };

  // Toast notification function - Enhanced for section-specific toasts
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const showToastMessage = (message: string, type: 'success' | 'error' = 'success', section?: string) => {
    // Clear any existing timeout
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    
    // If no section specified, use a general toast
    if (!section) {
      section = 'general';
    }
    
    // Hide all currently showing toasts first
    setSectionToasts(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        updated[key] = { ...updated[key], show: false };
      });
      return updated;
    });
    
    // Small delay to ensure smooth transition
    setTimeout(() => {
      setSectionToasts(prev => ({
        ...prev,
        [section!]: {
          show: true,
          message,
          type
        }
      }));
      
      // Set new timeout to hide toast after 3 seconds
      toastTimeoutRef.current = setTimeout(() => {
        setSectionToasts(prev => ({
          ...prev,
          [section!]: { ...prev[section!], show: false }
        }));
      }, 3000);
    }, 10);
  };

  // Enhanced save functions for individual sections
  const handleBasicInfoSave = async () => {
    const errors: {[key: string]: string} = {};
    
    // Validation
    if (!formData?.name?.trim()) {
      errors.name = 'College name is required';
    }
    if (!formData?.establishedYear) {
      errors.establishedYear = 'Established year is required';
    }
    if (!formData?.recognizedBy?.trim()) {
      errors.recognizedBy = 'At least one recognition is required';
    }
    if (!formData?.collegeType?.trim()) {
      errors.collegeType = 'College type is required';
    }
    if (!formData?.affiliation?.trim()) {
      errors.affiliation = 'Affiliation is required';
    }
    
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      const updatePayload = {
        establishedYear: formData.establishedYear,
        recognizedBy: formData.recognizedBy,
        collegeType: formData.collegeType,
        affiliation: formData.affiliation,
        naacRating: formData.naacRating,
        nirfRanking: formData.nirfRanking
      };
      
      console.log('=== FRONTEND SAVE DEBUG ===');
      console.log('Update payload:', JSON.stringify(updatePayload, null, 2));
      console.log('NAAC Rating:', updatePayload.naacRating);
      console.log('NIRF Ranking:', updatePayload.nirfRanking);
      console.log('===========================');
      
      await axios.put(
        `${API_BASE_URL}/api/colleges/user/${userId}`,
        updatePayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowBasicInfoModal(false);
      
      // Show success message using centralized toast
      showToastMessage('Basic Information updated successfully!', 'success', 'basicInfo');
      
      await loadCollegeProfile();
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving basic info:', error);
      showToastMessage('Error updating basic information. Please try again.', 'error', 'basicInfo');
    } finally {
      setSaving(false);
    }
  };

  const handleContactSave = async () => {
    const errors: {[key: string]: string} = {};
    
    // Validation
    if (formData?.placementContact?.email && !validateEmail(formData.placementContact.email)) {
      errors.placementEmail = 'Invalid email format';
    }
    if (formData?.placementContact?.phone && !validatePhone(formData.placementContact.phone)) {
      errors.placementPhone = 'Invalid phone number format';
    }
    if (formData?.primaryContact?.email && !validateEmail(formData.primaryContact.email)) {
      errors.primaryEmail = 'Invalid email format';
    }
    if (formData?.primaryContact?.phone && !validatePhone(formData.primaryContact.phone)) {
      errors.primaryPhone = 'Invalid phone number format';
    }
    
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      await axios.put(
        `${API_BASE_URL}/api/colleges/user/${userId}`,
        {
          primaryContact: formData?.primaryContact,
          placementContact: formData?.placementContact
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowContactModal(false);
      
      // Show success message using centralized toast
      showToastMessage('Contact details updated successfully!', 'success', 'contactDetails');
      
      await loadCollegeProfile();
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving contact details:', error);
      showToastMessage('Error updating contact details. Please try again.', 'error', 'contactDetails');
    } finally {
      setSaving(false);
    }
  };

  const handleAddressSave = async () => {
    const errors: {[key: string]: string} = {};
    
    console.log('Current formData.address:', formData?.address); // Debug log
    
    // Validation
    if (!formData?.address?.street?.trim()) {
      errors.street = 'Address is required';
    }
    if (!formData?.address?.zipCode?.trim()) {
      errors.zipCode = 'Pin code is required';
    } else if (!validatePinCode(formData.address.zipCode)) {
      errors.zipCode = 'Invalid pin code format';
    }
    if (!formData?.address?.city?.trim()) {
      errors.city = 'City is required';
    }
    if (!formData?.address?.state?.trim()) {
      errors.state = 'State is required';
    }
    if (!formData?.address?.district?.trim()) {
      errors.district = 'District is required';
    }
    
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      console.log('Validation errors:', errors); // Debug log
      return;
    }
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      // Make sure all address fields including district are included
      const addressData = {
        street: formData.address.street,
        zipCode: formData.address.zipCode,
        city: formData.address.city,
        state: formData.address.state,
        district: formData.address.district
      };
      
      console.log('Saving address data:', addressData); // Debug log
      
      const response = await axios.put(
        `${API_BASE_URL}/api/colleges/user/${userId}`,
        { address: addressData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Address save response:', response.data); // Debug log
      
      // Update formData with the saved address data to ensure UI reflects the saved state
      setFormData(prev => prev ? {
        ...prev,
        address: {
          ...prev.address,
          ...addressData
        }
      } : prev);
      
      setShowAddressModal(false);
      
      // Show success message using centralized toast
      showToastMessage('Address updated successfully!', 'success', 'address');
      
      await loadCollegeProfile(); // Reload to ensure consistency
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving address:', error);
      showToastMessage('Error updating address. Please try again.', 'error', 'address');
    } finally {
      setSaving(false);
    }
  };

  // Facility Management Functions
  const handleSaveFacility = async (facilityData: Omit<Facility, '_id' | 'isActive'>) => {
    try {
      const token = localStorage.getItem('token');
      
      if (editingFacility && editingFacility._id) {
        // Update existing facility
        await axios.put(
          `${API_BASE_URL}/api/colleges/facilities/${editingFacility._id}`,
          facilityData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showToastMessage('Facility updated successfully!');
      } else {
        // Add new facility
        await axios.post(
          `${API_BASE_URL}/api/colleges/facilities`,
          facilityData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showToastMessage('Facility added successfully!');
      }
      
      setShowFacilityModal(false);
      setEditingFacility(null);
      loadFacilities();
    } catch (error) {
      console.error('Error saving facility:', error);
      alert('Error saving facility. Please try again.');
    }
  };

  const handleDeleteFacility = async (facilityId: string) => {
    showConfirmation(
      'Delete Facility',
      'Are you sure you want to delete this facility? This action cannot be undone.',
      'delete',
      () => confirmDeleteFacility(facilityId)
    );
  };

  const confirmDeleteFacility = async (facilityId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_BASE_URL}/api/colleges/facilities/${facilityId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showToastMessage('Facility deleted successfully!');
      loadFacilities();
      setShowConfirmModal(false);
      setConfirmAction(null);
    } catch (error) {
      console.error('Error deleting facility:', error);
      showToastMessage('Error deleting facility. Please try again.', 'error');
    }
  };

  const handleSaveCampusDescription = async () => {
    // Validate word limits
    const wordCount = campusDescription?.trim().split(/\s+/).filter(word => word.length > 0).length || 0;
    
    if (!campusDescription || wordCount < 50) {
      alert('Campus description must be at least 50 words long.');
      return;
    }

    if (wordCount > 300) {
      alert('Campus description must not exceed 300 words.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/colleges/campus-description`,
        { campusDescription },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setIsEditingCampusDescription(false);
      showToastMessage('Campus description updated successfully!');
    } catch (error) {
      console.error('Error saving campus description:', error);
      showToastMessage('Error saving campus description. Please try again.', 'error');
    }
  };

  // Course Management Functions
  const handleSaveCourse = async (courseData: Omit<Course, '_id' | 'isActive'>) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      console.log('Debug: Token exists:', !!token);
      console.log('Debug: UserId exists:', !!userId);
      console.log('Debug: Token preview:', token?.substring(0, 20) + '...');
      
      if (!token) {
        alert('Authentication token not found. Please login again.');
        return;
      }

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

      const validStudyModes = ['full-time', 'part-time', 'distance-education'];
      if (courseData.studyMode && !validStudyModes.includes(courseData.studyMode.toLowerCase().replace(' ', '-'))) {
        validationErrors.push(`Invalid study mode. Must be one of: ${validStudyModes.join(', ')}`);
      }

      const validAccreditations = ['ugc-approved', 'aicte-approved', 'university-affiliated', ''];
      if (courseData.accreditation && !validAccreditations.includes(courseData.accreditation.toLowerCase().replace(' ', '-'))) {
        validationErrors.push(`Invalid accreditation. Must be one of: ${validAccreditations.filter(a => a).join(', ')}`);
      }

      if (validationErrors.length > 0) {
        console.error('❌ Validation Errors:', validationErrors);
        alert('Please fix the following errors:\n\n' + validationErrors.join('\n'));
        return;
      }
      
      const apiCourseData = {
        name: courseData.name.trim(),
        code: courseData.code?.split('-').pop(), // Remove college prefix if present
        description: courseData.description?.trim() || '',
        duration: courseData.duration.trim(),
        type: courseData.type.toLowerCase(),
        category: (courseData.category || courseData.type).toLowerCase(),
        studyMode: (courseData.studyMode || 'full-time').toLowerCase().replace(' ', '-'),
        accreditation: courseData.accreditation ? courseData.accreditation.toLowerCase().replace(' ', '-') : undefined,
        department: courseData.department?.trim() || 'General',
        streamType: courseData.streamType?.trim() || undefined, // Include stream type
        eligibilityCriteria: courseData.eligibilityCriteria?.trim() || '',
        totalFee: courseData.totalFee ? (typeof courseData.totalFee === 'string' ? parseInt(courseData.totalFee) : courseData.totalFee) : 0,
        semesterFee: courseData.semesterFee ? (typeof courseData.semesterFee === 'string' ? parseInt(courseData.semesterFee) : courseData.semesterFee) : 0,
        numberOfSeats: courseData.numberOfSeats ? (typeof courseData.numberOfSeats === 'string' ? parseInt(courseData.numberOfSeats) : courseData.numberOfSeats) : 0,
        fees: {
          tuition: courseData.totalFee ? (typeof courseData.totalFee === 'string' ? parseInt(courseData.totalFee) : courseData.totalFee) : 0,
          other: courseData.semesterFee ? (typeof courseData.semesterFee === 'string' ? parseInt(courseData.semesterFee) : courseData.semesterFee) : 0,
          currency: 'INR'
        },
        specialOffers: courseData.specialOffers ? {
          spotAdmission: {
            enabled: !!courseData.specialOffers?.spotAdmission?.enabled,
            fee: courseData.specialOffers?.spotAdmission?.fee ? (typeof courseData.specialOffers.spotAdmission.fee === 'string' ? parseInt(courseData.specialOffers.spotAdmission.fee) : courseData.specialOffers.spotAdmission.fee) : 0,
            seats: courseData.specialOffers?.spotAdmission?.seats ? (typeof courseData.specialOffers.spotAdmission.seats === 'string' ? parseInt(courseData.specialOffers.spotAdmission.seats) : courseData.specialOffers.spotAdmission.seats) : 0,
          },
          earlyBird: {
            enabled: !!courseData.specialOffers?.earlyBird?.enabled,
            discount: courseData.specialOffers?.earlyBird?.discount ? (typeof courseData.specialOffers.earlyBird.discount === 'string' ? parseInt(courseData.specialOffers.earlyBird.discount) : courseData.specialOffers.earlyBird.discount) : 0,
            validUntil: courseData.specialOffers?.earlyBird?.validUntil || undefined
          },
          meritScholarship: {
            enabled: !!courseData.specialOffers?.meritScholarship?.enabled,
            percent: courseData.specialOffers?.meritScholarship?.percent ? (typeof courseData.specialOffers.meritScholarship.percent === 'string' ? parseInt(courseData.specialOffers.meritScholarship.percent) : courseData.specialOffers.meritScholarship.percent) : 0,
            criteria: courseData.specialOffers?.meritScholarship?.criteria
          }
        } : undefined,
        admissionDates: courseData.admissionDates ? {
          startDate: courseData.admissionDates?.startDate || undefined,
          deadline: courseData.admissionDates?.deadline || undefined
        } : undefined
      };
      
      console.log('✅ Validated API Course Data:', apiCourseData);
      
      if (editingCourse && editingCourse._id) {
        // Update existing course
        console.log('Debug: Updating course with ID:', editingCourse._id);
        await axios.put(
          `${API_BASE_URL}/api/courses/${editingCourse._id}`,
          apiCourseData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showToastMessage('Course updated successfully!');
      } else {
        // Add new course
        console.log('Debug: Creating new course');
        const response = await axios.post(
          `${API_BASE_URL}/api/courses`,
          apiCourseData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Debug: Course creation response:', response.data);
        showToastMessage('Course added successfully!');
      }
      
      setShowCourseModal(false);
      setEditingCourse(null);
      loadCourses();
    } catch (error) {
      console.error('❌ Error saving course:', error);
      if (axios.isAxiosError(error)) {
        console.error('📊 Response status:', error.response?.status);
        console.error('📋 Response data:', error.response?.data);
        console.error('📋 Full error message:', JSON.stringify(error.response?.data, null, 2));
        console.error('📤 Request data:', error.config?.data);
        console.error('🔑 Request headers:', error.config?.headers);
        
        // Detailed error message
        const errorMessage = error.response?.data?.message || 'Unknown error occurred';
        const errorDetails = error.response?.data?.errors ? '\n\nDetails:\n' + error.response.data.errors.join('\n') : '';
        const statusCode = error.response?.status;
        
        if (statusCode === 400) {
          if (errorMessage.includes('Course code already exists')) {
            alert(`❌ Course Code Already Exists!\n\n${errorMessage}\n\nThe course code you entered is already in use.\n\nPlease try one of these:\n• Use a different course code\n• Leave the code field empty to auto-generate a unique code\n• Edit the existing course instead`);
          } else if (errorMessage.includes('domain code not set')) {
            alert(`❌ College Setup Incomplete!\n\n${errorMessage}\n\nYour college profile is missing a domain code.\n\nPlease:\n1. Go to Profile Settings\n2. Set a unique Domain Code (e.g., MIT, IIT, etc.)\n3. Save your profile\n4. Then try creating courses again`);
          } else {
            alert(`❌ Validation Error (400):\n\n${errorMessage}${errorDetails}\n\nPlease check:\n- All required fields are filled\n- Course type is valid (undergraduate/postgraduate/diploma/certificate)\n- Study mode is valid (full-time/part-time/distance-education)`);
          }
        } else if (statusCode === 401) {
          alert('Your session has expired. Please login again.');
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          router.push('/login');
        } else {
          alert(`Error saving course (${statusCode}):\n\n${errorMessage}`);
        }
      } else {
        alert('Error saving course. Please try again.');
      }
    }
  };

  // Delete Course Function
  const handleDeleteCourse = async (courseId: string) => {
    showConfirmation(
      'Confirm Delete',
      'Are you sure you want to delete this course? This action cannot be undone and will affect all enrolled students.',
      'delete',
      () => confirmDeleteCourse(courseId)
    );
  };

  const confirmDeleteCourse = async (courseId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Authentication token not found. Please login again.');
        return;
      }

      await axios.delete(
        `${API_BASE_URL}/api/courses/${courseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showToastMessage('Course deleted successfully!');
      loadCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 'Failed to delete course';
        alert(`Error: ${errorMessage}`);
      } else {
        alert('Error deleting course. Please try again.');
      }
    }
  };


  // Achievement Management Functions
  const handleSaveAchievement = async (achievementData: Omit<Achievement, '_id'>) => {
    try {
      setSavingAchievement(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Authentication token not found. Please login again.');
        return;
      }
      
      if (editingAchievement && editingAchievement._id) {
        // Update existing achievement
        await axios.put(
          `${API_BASE_URL}/api/colleges/achievements/${editingAchievement._id}`,
          achievementData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showToastMessage('Achievement updated successfully!');
      } else {
        // Add new achievement
        await axios.post(
          `${API_BASE_URL}/api/colleges/achievements`,
          achievementData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showToastMessage('Achievement added successfully!');
      }
      
      setShowAchievementModal(false);
      setEditingAchievement(null);
      loadCollegeProfile();
    } catch (error) {
      console.error('Error saving achievement:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        alert('Your session has expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        router.push('/login');
        return;
      }
      alert('Error saving achievement. Please try again.');
    } finally {
      setSavingAchievement(false);
    }
  };

  const handleDeleteAchievement = async (achievementId: string) => {
    showConfirmation(
      'Confirm Delete',
      'Are you sure you want to delete this achievement? This action cannot be undone.',
      'delete',
      () => confirmDeleteAchievement(achievementId)
    );
  };

  const confirmDeleteAchievement = async (achievementId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_BASE_URL}/api/colleges/achievements/${achievementId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showToastMessage('Achievement deleted successfully!', 'success', 'achievements');
      loadCollegeProfile();
    } catch (error) {
      console.error('Error deleting achievement:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        showToastMessage('Your session has expired. Please login again.', 'error');
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        router.push('/login');
        return;
      }
      showToastMessage('Error deleting achievement. Please try again.', 'error');
    }
  };

  // Alumni Management Functions
  const handleSaveAlumni = async (alumniData: Omit<Alumni, '_id'>) => {
    try {
      setSavingAlumni(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Authentication token not found. Please login again.');
        return;
      }
      
      if (editingAlumni && editingAlumni._id) {
        // Update existing alumni
        await axios.put(
          `${API_BASE_URL}/api/colleges/alumni/${editingAlumni._id}`,
          alumniData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showToastMessage('Alumni updated successfully!');
      } else {
        // Add new alumni
        await axios.post(
          `${API_BASE_URL}/api/colleges/alumni`,
          alumniData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showToastMessage('Alumni added successfully!', 'success', 'alumni');
      }
      
      setShowAlumniModal(false);
      setEditingAlumni(null);
      setAlumniImagePreview(null);
      setSelectedAlumniImageFile(null);
      setAlumniImageUploadStatus('idle');
      loadCollegeProfile();
    } catch (error) {
      console.error('Error saving alumni:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        alert('Your session has expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        router.push('/login');
        return;
      }
      alert('Error saving alumni. Please try again.');
    } finally {
      setSavingAlumni(false);
    }
  };

  const deleteAlumni = async (alumniId: string) => {
    showConfirmation(
      'Confirm Delete',
      'Are you sure you want to delete this alumni? This action cannot be undone.',
      'delete',
      () => confirmDeleteAlumni(alumniId)
    );
  };

  const confirmDeleteAlumni = async (alumniId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_BASE_URL}/api/colleges/alumni/${alumniId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showToastMessage('Alumni deleted successfully!', 'success', 'alumni');
      loadCollegeProfile();
    } catch (error) {
      console.error('Error deleting alumni:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        showToastMessage('Your session has expired. Please login again.', 'error');
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        router.push('/login');
        return;
      }
      showToastMessage('Error deleting alumni. Please try again.', 'error');
    }
  };

  // Virtual Tour functions
  const handleSaveVirtualTour = async (tourData: Omit<VirtualTour, '_id'>, setAsPreview?: boolean) => {
    try {
      setSavingVirtualTour(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Authentication required. Please login again.');
        return;
      }

      let savedTourId: string | null = null;

      if (editingVirtualTour?._id) {
        // Update existing virtual tour
        const response = await axios.put(
          `${API_BASE_URL}/api/colleges/virtual-tours/${editingVirtualTour._id}`,
          tourData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        savedTourId = editingVirtualTour._id;
        showToastMessage('Virtual tour updated successfully!');
      } else {
        // Add new virtual tour
        const response = await axios.post(
          `${API_BASE_URL}/api/colleges/virtual-tours`,
          tourData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        savedTourId = response.data.tour?._id;
        showToastMessage('Virtual tour added successfully!');
      }

      // If setAsPreview is true and we have a tour ID, toggle preview
      if (setAsPreview && savedTourId) {
        await handleTogglePreviewVideo(savedTourId);
      }
      
      setShowVirtualTourModal(false);
      setEditingVirtualTour(null);
      setSelectedVideoFile(null);
      setVideoUploadStatus('idle');
      loadCollegeProfile();
      showToastMessage('Virtual tour saved successfully!', 'success', 'virtualTour');
    } catch (error) {
      console.error('Error saving virtual tour:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        alert('Your session has expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        router.push('/login');
        return;
      }
      alert('Error saving virtual tour. Please try again.');
    } finally {
      setSavingVirtualTour(false);
    }
  };

  const handleDeleteVirtualTour = async (tourId: string) => {
    showConfirmation(
      'Confirm Delete',
      'Are you sure you want to delete this virtual tour? This action cannot be undone.',
      'delete',
      () => confirmDeleteVirtualTour(tourId)
    );
  };

  const confirmDeleteVirtualTour = async (tourId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToastMessage('Authentication required. Please login again.', 'error');
        return;
      }

      await axios.delete(
        `${API_BASE_URL}/api/colleges/virtual-tours/${tourId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showToastMessage('Virtual tour deleted successfully!', 'success', 'virtualTour');
      loadCollegeProfile();
    } catch (error) {
      console.error('Error deleting virtual tour:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        showToastMessage('Your session has expired. Please login again.', 'error');
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        router.push('/login');
        return;
      }
      showToastMessage('Error deleting virtual tour. Please try again.', 'error');
    }
  };

  const handleTogglePreviewVideo = async (tourId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToastMessage('Authentication required. Please login again.', 'error');
        return;
      }

      const response = await axios.put(
        `${API_BASE_URL}/api/colleges/virtual-tours/${tourId}/toggle-preview`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const { isPreview, message } = response.data;
      showToastMessage(message, 'success', 'virtualTour');
      
      // Update local state
      setVirtualTours(prev => prev.map(tour => ({
        ...tour,
        isPreview: tour._id === tourId ? isPreview : false
      })));
      
      // Reload to update the banner display
      loadCollegeProfile();
    } catch (error) {
      console.error('Error toggling preview video:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        showToastMessage('Your session has expired. Please login again.', 'error');
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        router.push('/login');
        return;
      }
      showToastMessage('Error updating preview video. Please try again.', 'error');
    }
  };

  // Save video details function
  const handleSaveVideoDetails = async () => {
    if (!playingVideo || !playingVideo._id) return;
    
    try {
      setSavingVirtualTour(true);
      const token = localStorage.getItem('token');
      
      const updatedData = {
        ...playingVideo,
        ...editedVideoDetails
      };
      
      await axios.put(
        `${API_BASE_URL}/api/colleges/virtual-tours/${playingVideo._id}`,
        updatedData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setVirtualTours(prev => prev.map(tour => 
        tour._id === playingVideo._id ? updatedData : tour
      ));
      setPlayingVideo(updatedData);
      setIsEditingVideoDetails(false);
      setEditedVideoDetails({});
      
      showToastMessage('Video details updated successfully!');
    } catch (error) {
      console.error('Error updating video details:', error);
      showToastMessage('Error updating video details. Please try again.', 'error');
    } finally {
      setSavingVirtualTour(false);
    }
  };

  const handleVideoUpload = async (file: File): Promise<string | null> => {
    try {
      setVideoUploadStatus('uploading');
      const token = localStorage.getItem('token');
      
      if (!token) {
        setVideoUploadStatus('error');
        return null;
      }

      const formData = new FormData();
      formData.append('video', file);

      const response = await axios.post(
        `${API_BASE_URL}/api/colleges/upload-virtual-tour-video`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              console.log('Upload Progress:', progress + '%');
            }
          }
        }
      );

      setVideoUploadStatus('success');
      return response.data.url;
    } catch (error) {
      console.error('Error uploading video:', error);
      setVideoUploadStatus('error');
      return null;
    }
  };

  const handleCleanupVirtualTours = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please log in to clean up virtual tours');
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/colleges/cleanup-virtual-tours`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      if (response.data.success) {
        alert(`Successfully cleaned up ${response.data.removed} invalid virtual tours`);
        // Refresh the page to reload clean data
        window.location.reload();
      }
    } catch (error) {
      console.error('Error cleaning up virtual tours:', error);
      alert('Error cleaning up virtual tours');
    }
  };

  // Brochure upload handler
  const handleBrochureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!allowedTypes.includes(file.type)) {
        alert(`${file.name}: Only PDF, DOC, and DOCX files are allowed`);
        return false;
      }
      
      if (file.size > maxSize) {
        alert(`${file.name}: File size must be less than 10MB`);
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    // Check total file limit
    const currentBrochures = formData?.brochures || [];
    if (currentBrochures.length + validFiles.length > 3) {
      alert('You can only upload up to 3 brochure files');
      return;
    }

    setBrochureUploadStatus('uploading');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to upload brochures');
        setBrochureUploadStatus('error');
        return;
      }

      const uploadedBrochures = [];

      for (const file of validFiles) {
        const formDataToSend = new FormData();
        formDataToSend.append('brochure', file);

        const response = await axios.post(
          `${API_BASE_URL}/api/colleges/upload-brochure`,
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        if (response.data.success) {
          uploadedBrochures.push({
            name: file.name,
            size: file.size,
            url: response.data.url,
            cdnUrl: response.data.cdnUrl
          });
        }
      }

      if (uploadedBrochures.length > 0) {
        const updatedBrochures = [...currentBrochures, ...uploadedBrochures];
        setFormData(prev => prev ? { ...prev, brochures: updatedBrochures } : null);
        setBrochureUploadStatus('success');
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => setBrochureUploadStatus('idle'), 3000);
      } else {
        setBrochureUploadStatus('error');
      }
    } catch (error) {
      console.error('Error uploading brochures:', error);
      setBrochureUploadStatus('error');
      alert('Failed to upload brochures. Please try again.');
    }

    // Clear file input
    event.target.value = '';
  };

  // Remove brochure handler
  const handleRemoveBrochure = async (index: number) => {
    if (!formData?.brochures) return;

    const brochureToRemove = formData.brochures[index];
    
    try {
      const token = localStorage.getItem('token');
      if (token && brochureToRemove.cdnUrl) {
        // Optional: Call API to delete from BunnyCDN
        await axios.delete(
          `${API_BASE_URL}/api/colleges/delete-brochure`,
          {
            headers: { Authorization: `Bearer ${token}` },
            data: { url: brochureToRemove.cdnUrl }
          }
        );
      }
    } catch (error) {
      console.error('Error deleting brochure from CDN:', error);
      // Continue with local removal even if CDN deletion fails
    }

    const updatedBrochures = formData.brochures.filter((_, i) => i !== index);
    setFormData(prev => prev ? { ...prev, brochures: updatedBrochures } : null);
  };

  const handleAlumniImageUpload = async (file: File): Promise<string | null> => {
    try {
      setAlumniImageUploadStatus('uploading');
      const token = localStorage.getItem('token');
      
      if (!token) {
        setAlumniImageUploadStatus('error');
        return null;
      }

      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(
        `${API_BASE_URL}/api/colleges/upload-alumni-image`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setAlumniImageUploadStatus('success');
      return response.data.imageUrl;
    } catch (error) {
      console.error('Error uploading alumni image:', error);
      setAlumniImageUploadStatus('error');
      return null;
    }
  };

const TabButton = ({
  id,
  label,
  icon,
  isActive,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
}) => (
  <button
    onClick={() => setActiveTab(id)}
className={`w-full flex items-center justify-center gap-2 py-3 text-lg font-medium transition-colors ${
      isActive
        ? "bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white px-4 py-2 rounded-md text-lg shadow-lg"
        : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
    }`}
  >
    {icon}
    {label}
  </button>
);

  if (loading) {
    return (
      <ProtectedRoute requireApproval={true} allowedRoles={['college']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!college || !formData) {
    return (
      <ProtectedRoute requireApproval={true} allowedRoles={['college']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600">Error loading profile data</p>
            <button 
              onClick={() => router.push('/dashboard/college')}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white rounded-lg hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Section-specific toast component
  const renderSectionToast = (sectionKey: string) => {
    const toast = sectionToasts[sectionKey];
    if (!toast || !toast.show) return null;

    return (
      <div className="mt-3 transition-all duration-300 ease-in-out">
        <div className={`${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2`}>
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
   <ProtectedRoute requireApproval={true} allowedRoles={['college']}>
  <div className="min-h-screen bg-gray-50">
    <CollegeRegistrationNavbar 
      collegeName={college?.name} 
      status={college?.approvalStatus as 'pending' | 'approved' | 'rejected'} 
    />

    {/* College Profile Setup Header */}
    <div className="bg-[#F9FAFB] border-b border-gray-200">
      <div className="max-w-screen mx-auto px-8 py-4">
        <h1 className="text-xl font-semibold text-gray-900">
          College <span className="text-[#0270DF]">Profile Setup</span>
        </h1>
      </div>
    </div>

    {/* Banner Section - Full Width */}
    <div className="relative h-80 bg-gradient-to-r from-blue-100 to-blue-200 overflow-hidden w-full">
      {bannerPreview ? (
        <div className="relative w-full h-full">
          <img 
            src={bannerPreview} 
            alt="Banner Preview" 
            className="w-full h-full object-cover"
          />
          {uploadingBanner && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p>Uploading banner...</p>
              </div>
            </div>
          )}
        </div>
      ) : college?.banner ? (
        <div className="relative w-full h-full">
          <img 
            src={getImageSrc(college.banner)} 
            alt="College Banner" 
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Banner image failed to load:', college.banner);
              e.currentTarget.style.display = 'none';
            }}
            onLoad={() => {
              console.log('Banner image loaded successfully:', college.banner);
            }}
          />
        </div>
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto text-blue-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-[#0270DF] font-medium">Upload College Banner</p>
          </div>
        </div>
      )}

      {/* Banner Upload Button */}
      <div className="absolute bottom-4 right-6">
        <label className="cursor-pointer">
          <div className={`w-10 h-10 flex items-center justify-center rounded-full shadow-md transition-colors ${uploadingBanner ? 'bg-gray-500 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-900'}`}>
            {uploadingBanner ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" 
                   fill="none" 
                   viewBox="0 0 24 24" 
                   strokeWidth={2} 
                   stroke="white" 
                   className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" 
                  d="M3 7h2l2-3h10l2 3h2a2 2 0 012 2v9a2 2 0 01-2 2H3a2 2 0 01-2-2V9a2 2 0 012-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" 
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </div>
          <input 
            type="file" 
            className="hidden" 
            accept="image/*"
            onChange={handleBannerUpload}
            disabled={uploadingBanner}
          />
        </label>
      </div>
    </div>


    {/* Header Section */}
    <div className="bg-[#F9FAFB] relative">
      <div className="max-w-screen mx-auto px-8 py-6">
        <div className="flex items-center space-x-6">
          {/* Logo in flow, pulled up over banner */}
          <div className="relative -mt-16">
            <div className="relative w-28 h-28 bg-white rounded-xl flex items-center justify-center shadow-lg border-4 border-white overflow-hidden">
              {logoPreview ? (
                <div className="relative w-full h-full">
                  <img 
                    src={logoPreview} 
                    alt="Logo Preview" 
                    className="w-full h-full object-cover opacity-75" 
                  />
                  {uploadingLogo && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
              ) : college?.logo ? (
                <img 
                  src={getImageSrc(college.logo)} 
                  alt="College Logo" 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    console.error('Logo image failed to load:', college.logo);
                    e.currentTarget.style.display = 'none';
                  }}
                  onLoad={() => {
                    console.log('Logo image loaded successfully:', college.logo);
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                  </svg>
                </div>
              )}
              
            </div>
            {/* Edit icon - Positioned at corner vertex */}
              <div className={`absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-xl border-2 border-white transition-colors ${uploadingLogo ? 'bg-gray-500 cursor-not-allowed' : 'bg-black hover:bg-gray-800'}`}>
                <label className={uploadingLogo ? 'cursor-not-allowed' : 'cursor-pointer'}>
                  {uploadingLogo ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  )}
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleLogoUpload} 
                    disabled={uploadingLogo}
                  />
                </label>
              </div>
          </div>

          {/* College Details - beside logo */}
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-900">{college.name}</h1>
          </div>
        </div>

        {/* Navigation Tabs */}
<div className="mt-6 border-b border-gray-100">
  <div className="grid grid-cols-7 divide-x divide-gray-100">
    <TabButton
      id="overview"
      label="Overview"
      icon={<Home className="h-4 w-4" />}
      isActive={activeTab === "overview"}
    />
    <TabButton
      id="campus"
      label="Campus"
      icon={<MapPin className="h-4 w-4" />}
      isActive={activeTab === "campus"}
    />
    <TabButton
      id="courses"
      label="Courses"
      icon={<Book className="h-4 w-4" />}
      isActive={activeTab === "courses"}
    />
    <TabButton
      id="gallery"
      label="Gallery"
      icon={<ImageIcon className="h-4 w-4" />}
      isActive={activeTab === "gallery"}
    />
    <TabButton
      id="achievements"
      label="Achievements"
      icon={<Award className="h-4 w-4" />}
      isActive={activeTab === "achievements"}
    />
    <TabButton
      id="alumni"
      label="Alumni"
      icon={<Users className="h-4 w-4" />}
      isActive={activeTab === "alumni"}
    />
    <TabButton
      id="virtual-tour"
      label="Virtual Tour"
      icon={<Video className="h-4 w-4" />}
      isActive={activeTab === "virtual-tour"}
    />
  </div>
</div>

      </div>
    </div>

    {/* Content Area */}
    <div className="max-w-screen mx-auto px-8 py-4">
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
  <div className="bg-white rounded-xl p-4 shadow-sm">
    {/* Header */}
    <div className="flex items-center justify-between mb-3">
        <h3 className="text-[22px] md:text-2xl font-semibold text-[#0270DF]">Basic Information</h3>
          <button      
          onClick={() => {
            setFormErrors({});
            setShowBasicInfoModal(true);
          }}                    
          className="flex items-center text-[#0270DF] text-sm hover:text-blue-700 border border-blue-600 px-3 py-1 rounded"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
            Edit
          </button>
        </div>                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">College name</div>
                    <div className="text-gray-900 font-medium">{formData.name}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Established year</div>
                    <div className="text-gray-900 font-medium">{formData.establishedYear}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Recognized by</div>
                    <div className="text-gray-900 font-medium">
                      {formData.recognizedBy && formData.recognizedBy.trim()
                        ? formData.recognizedBy
                        : 'Not specified'
                      }
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">College type</div>
                    <div className="text-gray-900 font-medium">{formData.collegeType || 'Private'}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Affiliated to</div>
                    <div className="text-gray-900 font-medium">{formData.affiliation}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">College email</div>
                    <div className="text-gray-900 font-medium">{formData.userEmail || formData.primaryContact.email}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">NAAC Rating</div>
                    <div className="text-gray-900 font-medium">{formData.naacRating || 'Not specified'}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">NIRF Ranking</div>
                    <div className="text-gray-900 font-medium">
                      {formData.nirfRanking?.rank && formData.nirfRanking?.category 
                        ? `Rank ${formData.nirfRanking.rank} (${formData.nirfRanking.category}${formData.nirfRanking.year ? `, ${formData.nirfRanking.year}` : ''})` 
                        : 'Not specified'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Basic Information Toast */}
              {renderSectionToast('basicInfo')}

              {/* Contact details (read-only, below Basic Information) */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[22px] md:text-2xl font-semibold text-[#0270DF]">Contact details</h3>
                  <button 
                    onClick={() => {
                      setFormErrors({});
                      setShowContactModal(true);
                    }}
                    className="flex items-center text-[#0270DF] text-sm hover:text-blue-700 border border-blue-600 px-3 py-1 rounded"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  {/* First Row - Admission Coordinator Details (Primary contact who registered first) */}
                  <div>
                    <div className="text-gray-600 mb-1">Admission co-ordinator name</div>
                    <div className="font-medium text-gray-900">{formData.primaryContact?.name || ''}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">Admission co-ordinator email</div>
                    <div className="font-medium text-gray-900">{formData.primaryContact?.email || ''}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">Admission co-ordinator number</div>
                    <div className="font-medium text-gray-900">{formData.primaryContact?.phone || ''}</div>
                  </div>

                  {/* Second Row - Placement Coordinator Details (Secondary contact) */}
                  <div>
                    <div className="text-gray-600 mb-1">Placement co-ordinator name</div>
                    <div className="font-medium text-gray-900">{formData.placementContact?.name || ''}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">Placement co-ordinator number</div>
                    <div className="font-medium text-gray-900">{formData.placementContact?.phone || ''}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">Placement co-ordinator email</div>
                    <div className="font-medium text-gray-900">{formData.placementContact?.email || ''}</div>
                  </div>
                </div>
              </div>
              
              {/* Contact Details Toast */}
              {renderSectionToast('contactDetails')}

              {/* About */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[22px] md:text-2xl font-semibold text-[#0270DF]">About</h3>
                  {!isEditingAbout ? (
                    <button 
                      onClick={() => setIsEditingAbout(true)}
                      className="flex items-center text-[#0270DF] text-sm hover:text-blue-700 border border-blue-600 px-3 py-1 rounded"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setIsEditingAbout(false)}
                        className="text-gray-600 text-sm hover:text-gray-700 border border-gray-600 px-3 py-1 rounded"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleAboutSave}
                        disabled={saving || !formData?.aboutCollege || formData.aboutCollege.trim().split(/\s+/).length < 50 || formData.aboutCollege.trim().split(/\s+/).length > 500}
                        className={`flex items-center text-sm px-3 py-1 rounded ${
                          saving || !formData?.aboutCollege || formData.aboutCollege.trim().split(/\s+/).length < 50 || formData.aboutCollege.trim().split(/\s+/).length > 500
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white hover:from-[#1e7ef0] hover:to-[#0366d6]'
                        }`}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  )}
                </div>                <div>
                  {isEditingAbout ? (
                    <div>
                      <textarea
                        value={formData.aboutCollege || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          const wordCount = value.trim().split(/\s+/).filter(word => word.length > 0).length;
                          if (wordCount <= 300) {
                            handleInputChange('aboutCollege', value);
                          }
                        }}
                        placeholder="Describe your college, its mission, vision, facilities, achievements, and what makes it unique... (Min 50, Max 300 words)"
                        className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-40 resize-none ${
                          formData.aboutCollege && formData.aboutCollege.trim().split(/\s+/).filter(word => word.length > 0).length < 50 
                            ? 'border-red-300 focus:border-red-500' 
                            : 'border-gray-300'
                        }`}
                        autoFocus
                      />
                      <div className="flex justify-between items-center mt-2">
                        <div className={`text-sm ${
                          !formData.aboutCollege || formData.aboutCollege.trim().split(/\s+/).filter(word => word.length > 0).length < 50 
                            ? 'text-red-500' 
                            : formData.aboutCollege.trim().split(/\s+/).filter(word => word.length > 0).length <= 300 
                              ? 'text-green-600' 
                              : 'text-red-500'
                        }`}>
                          {formData.aboutCollege ? formData.aboutCollege.trim().split(/\s+/).filter(word => word.length > 0).length : 0}/300 words
                          {formData.aboutCollege && formData.aboutCollege.trim().split(/\s+/).filter(word => word.length > 0).length < 50 && (
                            <span className="text-red-500 ml-2">Minimum 50 words required</span>
                          )}
                          {formData.aboutCollege && formData.aboutCollege.trim().split(/\s+/).filter(word => word.length > 0).length >= 50 && formData.aboutCollege.trim().split(/\s+/).filter(word => word.length > 0).length <= 300 && (
                            <span className="text-green-600 ml-2">✓ Valid length</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="min-h-[100px] p-3 bg-gray-50 rounded-lg">
                      {formData.aboutCollege ? (
                        <p className="text-gray-700 whitespace-pre-wrap">{formData.aboutCollege}</p>
                      ) : (
                        <p className="text-gray-500 italic">Click "Edit" to add information about your college...</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* About Section Toast */}
              {renderSectionToast('about')}

              {/* Address */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[22px] md:text-2xl font-semibold text-[#0270DF]">College Address</h3>
                  <button 
                    onClick={() => {
                      setFormErrors({});
                      setShowAddressModal(true);
                    }}
                    className="flex items-center text-[#0270DF] text-sm hover:text-blue-700 border border-blue-600 px-3 py-1 rounded"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    Edit
                  </button>
                </div>                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-2">
                    <div className="text-sm text-gray-600 mb-1">Detailed address</div>
                    <div className="text-gray-900 font-medium">{formData?.address?.street || 'Not specified'}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Pin Code</div>
                    <div className="text-gray-900 font-medium">{formData?.address?.zipCode || 'Not specified'}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">State</div>
                    <div className="text-gray-900 font-medium">{formData?.address?.state || 'Not specified'}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">City</div>
                    <div className="text-gray-900 font-medium">{formData?.address?.city || 'Not specified'}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">District</div>
                    <div className="text-gray-900 font-medium">{formData?.address?.district || 'Not specified'}</div>
                  </div>
                </div>
              </div>
              
              {/* Address Section Toast */}
              {renderSectionToast('address')}

              {/* Other details */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[22px] md:text-2xl font-semibold text-[#0270DF]">Other details</h3>
                  <button 
                    onClick={() => setShowOtherDetailsModal(true)}
                    className="flex items-center text-[#0270DF] text-sm hover:text-blue-700 border border-blue-600 px-3 py-1 rounded"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-2">College brochure</div>
                  <div className="text-sm text-gray-500 mb-4">Max limit 10 MB ( Can Upload upto 3 files )</div>
                  
                  {/* Display uploaded brochures in simple format */}
                  {formData?.brochures && formData.brochures.length > 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 inline-block">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-green-700 font-medium">Uploaded</div>
                          <div className="text-sm text-green-600">{formData.brochures.length} file(s) uploaded</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">No brochure uploaded</div>
                  )}
                </div>
              </div>
              
              {/* Other Details Toast */}
              {renderSectionToast('otherDetails')}

              {/* Social Media Links */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[22px] md:text-2xl font-semibold text-[#0270DF]">Social Media Links</h3>
                  <button 
                    onClick={openSocialMediaModal}
                    className="flex items-center text-[#0270DF] text-sm hover:text-blue-700 border border-blue-600 px-3 py-1 rounded"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                </div>

                {/* Display Social Media Links */}
                <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                  {formData?.socialMedia?.linkedin && (
                    <div className="flex items-center space-x-2">
                      <LinkedinIcon />
                      <span className="text-sm text-gray-600 border border-gray-300 rounded-full px-2 py-2 w-full">{formData.socialMedia.linkedin}</span>
                    </div>
                  )}
                  {formData?.socialMedia?.facebook && (
                    <div className="flex items-center space-x-2">
                      <FacebookIcon />
                      <span className="text-sm text-gray-600 border border-gray-300 rounded-full px-2 py-2 w-full">{formData.socialMedia.facebook}</span>
                    </div>
                  )}
                  {formData?.socialMedia?.twitter && (
                    <div className="flex items-center space-x-2">
                      <TwitterIcon />
                      <span className="text-sm text-gray-600 border border-gray-300 rounded-full px-2 py-2 w-full">{formData.socialMedia.twitter}</span>
                    </div>
                  )}
                  {formData?.socialMedia?.instagram && (
                    <div className="flex items-center space-x-2">
                      <InstagramIcon />
                      <span className="text-sm text-gray-600 border border-gray-300 rounded-full px-2 py-2 w-full">{formData.socialMedia.instagram}</span>
                    </div>
                  )}
                  {formData?.socialMedia?.pinterest && (
                    <div className="flex items-center space-x-2">
                      <PinterestIcon />
                      <span className="text-sm text-gray-600 border border-gray-300 rounded-full px-2 py-2 w-full">{formData.socialMedia.pinterest}</span>
                    </div>
                  )}
                  {formData?.socialMedia?.website && (
                    <div className="flex items-center space-x-2">
                      <WebsiteIcon />
                      <span className="text-sm text-gray-600 border border-gray-300 rounded-full px-2 py-2 w-full">{formData.socialMedia.website}</span>
                    </div>
                  )}
                </div>

                {(!formData?.socialMedia || 
                  (!formData.socialMedia.linkedin && 
                   !formData.socialMedia.facebook && 
                   !formData.socialMedia.twitter && 
                   !formData.socialMedia.instagram && 
                   !formData.socialMedia.pinterest && 
                   !formData.socialMedia.website)) && (
                  <div className="text-sm text-gray-500">
                    No social media links added
                  </div>
                )}
              </div>
              
              {/* Social Media Toast */}
              {renderSectionToast('socialMedia')}

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving || !hasUnsavedChanges}
              className={`${
                saving || !hasUnsavedChanges
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white hover:from-[#0377EB] hover:to-[#2791FC]'
              }`}
              title={!hasUnsavedChanges ? '' : ''}
            >
              {saving ? 'Saving...' : hasUnsavedChanges ? '' : ''}
            </button>
          </div>
          
          {/* General Toast for Save Button */}
          {renderSectionToast('general')}
        </div>
      )}

      {/* Campus Tab */}
      {activeTab === 'campus' && (
        <CampusTab 
          campusDescription={campusDescription}
          setCampusDescription={setCampusDescription}
          isEditingCampusDescription={isEditingCampusDescription}
          setIsEditingCampusDescription={setIsEditingCampusDescription}
          handleSaveCampusDescription={handleSaveCampusDescription}
          saving={saving}
          availableFacilities={availableFacilities}
          selectedFacilities={selectedFacilities}
          toggleFacility={toggleFacility}
          saveFacilities={saveFacilities}
          savingFacilities={savingFacilities}
          showFacilitySelector={showFacilitySelector}
          setShowFacilitySelector={setShowFacilitySelector}
          showFacilityAddModal={showFacilityAddModal}
          setShowFacilityAddModal={setShowFacilityAddModal}
          setEditingFacility={setEditingFacility}
          setShowFacilityModal={setShowFacilityModal}
        />
      )}

      {/* Courses Tab */}
        {activeTab === 'courses' && (
          <CoursesTab 
            courses={courses}
            setShowCourseModal={setShowCourseModal}
            setEditingCourse={setEditingCourse}
            setViewingCourse={setViewingCourse}
            setShowCourseDetailsModal={setShowCourseDetailsModal}
            handleDeleteCourse={handleDeleteCourse}
            formatCurrency={formatCurrency}
          />
        )}      {/* Other tabs can be added here */}
      {activeTab === 'gallery' && (
  <div className="bg-white rounded-xl p-4 shadow-sm">
    {/* Header */}
    <div className="flex items-center justify-between mb-6 md:mb-7">
      <div>
        <h2 className="text-[22px] md:text-2xl font-semibold text-[#0270DF]">Gallery</h2>
        <p className="text-gray-600 mt-1">Upload images to showcase your campus and activities</p>
              </div>
              <button
                onClick={openAddImageModal}
        className="hidden sm:inline-flex items-center gap-2 space-x-2 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white px-4 py-2 rounded-lg hover:from-[#0377EB] hover:to-[#2791FC] transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
          <path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="text-sm font-medium">Upload Images</span>
              </button>
            </div>

            {/* Gallery Grid */}
            {galleryImages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {galleryImages.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <div className="relative overflow-hidden rounded-lg aspect-square">
                      <img
                        src={getImageSrc(imageUrl)}
                        alt={`Gallery image ${index + 1}`}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                        onClick={() => openFullImage(imageUrl)}
                      />
                      
                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(imageUrl);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Add Image Placeholder */}
                <div
                  onClick={openAddImageModal}
                  className="border-2 border-dashed border-gray-300 rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors group"
                >
                  <div className="w-12 h-12 mb-3 flex items-center justify-center text-gray-400 group-hover:text-blue-500">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-500 group-hover:text-[#0270DF]">Add Image</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-[#0270DF] mb-2">No images yet</h3>
                <p className="text-gray-500 mb-6">Upload your first image to get started</p>
                <button
                  onClick={openAddImageModal}
                  className="bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Upload Image
                </button>
              </div>
            )}
          </div>
      )}

{activeTab === 'achievements' && (
  <div className="bg-white rounded-xl p-4 shadow-sm">
    {/* Header */}
    <div className="flex items-center justify-between mb-6 md:mb-7">
      <div>
        <h2 className="text-[22px] md:text-2xl font-semibold text-[#0270DF]">Achievements</h2>
        <p className="text-gray-600 mt-1">Showcase your college's milestones and recognitions</p>
      </div>
      <button
        onClick={() => setShowAchievementModal(true)}
        className="hidden sm:inline-flex items-center gap-2 space-x-2 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white px-4 py-2 rounded-lg hover:from-[#0377EB] hover:to-[#2791FC] transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
          <path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="text-sm font-medium">Add Achievements</span>
      </button>
    </div>

    {/* Grid */}
    {achievements && achievements.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {achievements.map((achievement) => (
          <div
            key={achievement._id}
            onClick={() => {
              setViewingAchievement(achievement);
              setShowAchievementViewModal(true);
            }}
            className="group bg-white border border-[#B8BBD2] rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
          >
            {/* Image area — consistent size */}
            <div className="relative aspect-[3/2] bg-gray-200">
              {achievement.photo ? (
                <img
                  src={getImageSrc(achievement.photo)}
                  alt={achievement.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                  <Award className="w-12 h-12 text-white opacity-60" />
                </div>
              )}
            </div>

            {/* Text area with Read more */}
            <div className="p-4">
              <h3 className="text-base font-semibold text-[#49454F] mb-2 line-clamp-2">
                {achievement.title}
              </h3>

              <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                {achievement.description
                  ? `${achievement.description.slice(0, 80)}${
                      achievement.description.length > 80 ? '...' : ''
                    }`
                  : 'Achievement details'}
              </p>

              {/* Read More CTA */}
              {achievement.description && achievement.description.length > 80 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingAchievement(achievement);
                    setShowAchievementViewModal(true);
                  }}
                  className="mt-2 text-sm font-medium text-blue-600 hover:underline"
                >
                  Read more →
                </button>
              )}

              {/* Edit/Delete buttons */}
              <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingAchievement(achievement);
                    setShowAchievementModal(true);
                  }}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAchievement(achievement._id);
                  }}
                  className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      /* Empty state */
      <div className="text-center py-16">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <svg className="h-8 w-8 text-[#1677FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">You have no achievements</h3>
        <p className="text-gray-500 mb-6">Please add achievements to highlight your milestones.</p>
        <button
          onClick={() => setShowAchievementModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#2791FC] to-[#0377EB] px-6 py-3 text-white shadow-sm hover:from-[#0377EB] hover:to-[#2791FC] transition-colors font-medium"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Add Your First Achievement
        </button>
      </div>
    )}
  </div>
)}


{activeTab === 'alumni' && (
  <div className="bg-white rounded-xl p-4 shadow-sm">
    {/* Header */}
    <div className="flex items-center justify-between mb-6 md:mb-7">
      <div>
        <h2 className="text-[22px] md:text-2xl font-semibold text-[#0270DF]">Notable Alumni</h2>
        <p className="text-gray-600 mt-1">Showcase your successful graduates</p>
      </div>

      <button
        onClick={() => {
          setEditingAlumni(null);
          setAlumniImagePreview(null);
          setSelectedAlumniImageFile(null);
          setAlumniImageUploadStatus('idle');
          setShowAlumniModal(true);
        }}
        className="hidden sm:inline-flex items-center gap-2 space-x-2 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white px-4 py-2 rounded-lg hover:from-[#0377EB] hover:to-[#2791FC] transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
          <path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="text-sm font-medium">Add Alumni</span>
      </button>
    </div>

    {alumni.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {alumni.map((alumnus, index) => (
          <div
            key={alumnus._id || index}
            onClick={() => {
              setViewingAlumni(alumnus);
              setShowAlumniViewModal(true);
            }}
            className="group bg-white border border-[#B8BBD2] rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
          >
            {alumnus.image ? (
              <div className="relative aspect-[3/2] bg-gray-200">
                <img
                  src={getImageSrc(alumnus.image)}
                  alt={alumnus.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="relative aspect-[3/2] flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                <Users className="w-16 h-16 text-white opacity-50" />
              </div>
            )}
            <div className="p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-1">{alumnus.name}</h3>
              {alumnus.graduationYear && (
                <p className="text-sm text-gray-500 mb-2">Class of {alumnus.graduationYear}</p>
              )}
              {alumnus.company && (
                <p className="text-sm text-[#1484F3] font-medium line-clamp-1 mb-3">{alumnus.company}</p>
              )}

              {/* Edit/Delete buttons */}
              <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingAlumni(alumnus);
                    setAlumniImagePreview(alumnus.image ? getImageSrc(alumnus.image) : null);
                    setSelectedAlumniImageFile(null);
                    setAlumniImageUploadStatus('idle');
                    setShowAlumniModal(true);
                  }}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAlumni(alumnus._id!);
                  }}
                  className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#1677FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">You have no alumni</h3>
        <p className="text-gray-500 mb-6">Please add alumni to start attracting students!</p>
        <button
          onClick={() => {
            setEditingAlumni(null);
            setAlumniImagePreview(null);
            setSelectedAlumniImageFile(null);
            setAlumniImageUploadStatus('idle');
            setShowAlumniModal(true);
          }}
          className="bg-gradient-to-r from-[#2791FC] to-[#0377EB] hover:from-[#0377EB] hover:to-[#2791FC] text-white px-8 py-3 rounded-lg shadow-sm transition-colors font-medium"
        >
          Add Alumni
        </button>
      </div>
    )}
  </div>
)}


{activeTab === 'virtual-tour' && (
  <div className="bg-white rounded-xl p-4 shadow-sm">
    {/* Header */}
    <div className="flex items-center justify-between mb-6 md:mb-7">
      <div>
        <h2 className="text-[22px] md:text-2xl font-semibold text-[#0270DF]">Virtual Tour</h2>
        <p className="text-gray-600 mt-1">
          Create a virtual tour of your campus by adding key locations. You can upload images
          or embed 360° videos for each location.
        </p>
      </div>

      {/* Add video CTA (top-right) */}
      <button
        onClick={() => {
          setEditingVirtualTour(null);
          setSelectedVideoFile(null);
          setVideoUploadStatus('idle');
          setShowVirtualTourModal(true);
        }}
        className="hidden sm:inline-flex items-center gap-2 space-x-2 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white px-4 py-2 rounded-lg hover:from-[#0377EB] hover:to-[#2791FC] transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
          <path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="text-sm font-medium">Add Videos</span>
      </button>
    </div>

{virtualTours.length > 0 ? (
<div className="flex gap-6 items-start">
        {/* Left Panel — Location Cards with Thumbnails */}
        <div className="w-1/2 space-y-4 pr-3">
          {virtualTours.map((tour, index) => {
            const selected = playingVideo && playingVideo._id === tour._id;
            return (
              <div
                key={tour._id || index}
                className={[
                  "relative h-60 bg-white rounded-xl border overflow-hidden cursor-pointer transition-all",
                  "hover:shadow-md",
                  selected ? "border-[#0F6BE0] ring-2 ring-[#0F6BE0]/20" : "border-gray-200",
                ].join(" ")}
                onClick={() => {
                  setPlayingVideo(tour);
                  setShowVideoPlayer(true);
                  // Reset editing state when selecting a new video
                  setIsEditingVideoDetails(false);
                  setEditedVideoDetails({});
                }}
              >
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteVirtualTour(tour._id!);
                  }}
                  className="absolute top-2 right-2 z-10 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                  title="Delete"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
                    <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Set as Banner button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTogglePreviewVideo(tour._id!);
                  }}
                  className={`absolute top-2 right-10 z-10 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    tour.isPreview 
                      ? 'bg-green-500 text-white hover:bg-green-600' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                  title={tour.isPreview ? 'Remove from banner' : 'Set as banner'}
                >
                  {tour.isPreview ? (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Banner
                    </span>
                  ) : (
                    'Set as Banner'
                  )}
                </button>

                {/* Set as Preview Video button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTogglePreviewVideo(tour._id!);
                  }}
                  className={`absolute top-2 right-10 z-10 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    tour.isPreview
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                  title={tour.isPreview ? "Remove from banner" : "Set as banner video"}
                >
                  {tour.isPreview ? (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Banner
                    </span>
                  ) : (
                    'Set as Banner'
                  )}
                </button>

                <div className="flex">
                  {/* Video Thumbnail */}
                  <div className="relative w-60 h-60 bg-gray-100 flex-shrink-0">
                    {/* Preferred order: explicit thumbnail -> derived thumbnail -> video poster frame */}
                    {tour.thumbnailUrl ? (
                      <img
                        src={tour.thumbnailUrl}
                        alt={tour.title}
                        className="w-full h-full object-cover rounded-l-xl"
                      />
                    ) : (videoThumbnails[tour._id || ''] ? (
                      <img
                        src={videoThumbnails[tour._id || '']}
                        alt={tour.title}
                        className="w-full h-full object-cover rounded-l-xl"
                      />
                    ) : tour.videoFile ? (
                      <video
                        src={tour.videoFile}
                        className="w-full h-full object-cover rounded-l-xl"
                        muted
                        preload="metadata"
                        onLoadedMetadata={(e) => {
                          // Set currentTime to 1 second to get a better thumbnail
                          const video = e.target as HTMLVideoElement;
                          try { video.currentTime = 1; } catch {}
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 rounded-l-xl bg-gray-200">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                    ))}

                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-l-xl hover:bg-black/30 transition-colors">
                      <div className="rounded-full bg-white/95 p-2 shadow-lg">
                        <svg className="w-4 h-4 text-[#0270DF]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>

{/* Content (title + desc + bottom link with green dot) */}
<div className="flex-1 p-3 flex flex-col">
  {/* Top: title + description */}
  <div>
    <h3 className="font-medium text-[#0270DF] text-xl">{tour.title}</h3>
    {tour.description && (
      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{tour.description}</p>
    )}
  </div>

  {/* Bottom: green dot + visible link */}
  {tour.videoUrl && (
    <div className="mt-auto pt-2">
      <a
        href={tour.videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        title={tour.videoUrl}
        className="group inline-flex items-center gap-2 text-xl text-[#0270DF]"
      >
        <span className="truncate">{tour.videoUrl}</span>
        <span className="bottom-2 right-2 inline-block h-2 w-2 rounded-full bg-green-500"/>
      </a>
    </div>
  )}
</div>
                </div>
              </div>
            );
          })}
        </div>

{/* Right Panel — Video Player and Editor (fixed) */}
{/* Right Panel — Video Player and Editor (page scroll version) */}
<div className="flex-1 min-w-0 flex flex-col">
  {showVideoPlayer && playingVideo ? (
    <div className="flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Video with fixed height */}
      <div className="relative shrink-0 bg-black h-[320px] md:h-[360px] lg:h-[400px]">
        {(() => {
          // Prefer uploaded video file if present
          if (playingVideo?.videoFile) {
            return (
              <video
                src={playingVideo.videoFile}
                className="absolute inset-0 w-full h-full object-contain"
                controls
                autoPlay
                preload="metadata"
                controlsList="nodownload"
              />
            );
          }

          // If only a URL is provided, embed when possible (YouTube/Vimeo), else try as direct video
          if (playingVideo?.videoUrl) {
            const url = playingVideo.videoUrl.trim();

            // YouTube detection and embed
            const ytMatchShort = url.match(/^https?:\/\/youtu\.be\/([\w-]{11})/);
            const ytMatchLong = url.match(/[?&]v=([\w-]{11})/);
            const ytId = ytMatchShort?.[1] || ytMatchLong?.[1];
            if (ytId) {
              const embed = `https://www.youtube.com/embed/${ytId}`;
              return (
                <iframe
                  src={embed}
                  className="absolute inset-0 w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  title={playingVideo.title}
                />
              );
            }

            // Vimeo detection and embed
            const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
            const vimeoId = vimeoMatch?.[1];
            if (vimeoId) {
              const embed = `https://player.vimeo.com/video/${vimeoId}`;
              return (
                <iframe
                  src={embed}
                  className="absolute inset-0 w-full h-full"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title={playingVideo.title}
                />
              );
            }

            // If the URL looks like a direct video, try playing with HTML5 video
            if (/\.(mp4|webm|ogg|mov|m3u8)(?:\?.*)?$/i.test(url)) {
              return (
                <video
                  src={url}
                  className="absolute inset-0 w-full h-full object-contain"
                  controls
                  autoPlay
                  preload="metadata"
                />
              );
            }

            // Fallback to iframe for other platforms
            return (
              <iframe
                src={url}
                className="absolute inset-0 w-full h-full"
                frameBorder="0"
                allowFullScreen
                title={playingVideo.title}
              />
            );
          }

          // No source available
          return (
          <div className="absolute inset-0 w-full h-full bg-gray-900 flex items-center justify-center">
            <div className="text-center text-white">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p>No video available</p>
            </div>
          </div>
          );
        })()}

        {/* small overlay */}
{(playingVideo?.videoFile || playingVideo?.videoUrl) && (
  <button
    type="button"
    aria-label="Close"
    onClick={() => {
      setShowVideoPlayer(false);
      setPlayingVideo(null);
    }}
    className="absolute top-2 right-2 z-20 p-2 rounded-full bg-transparent text-white/90 
               hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40"
  >
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <path d="M6 18L18 6M6 6l12 12"
            stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </button>
)}

      </div>

      {/* Info / Form (no inner scroll) */}
      <div className="p-6 bg-white">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-[#0270DF]">
            {playingVideo.title || 'Untitled'}
          </h3>

          {!isEditingVideoDetails ? (
            <button
              onClick={() => {
                setIsEditingVideoDetails(true);
                setEditedVideoDetails({
                  title: playingVideo.title || '',
                  description: playingVideo.description || '',
                  videoUrl: playingVideo.videoUrl || ''
                });
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white transition"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
            </div>
          )}
        </div>

        {/* Fields */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location Name</label>
            <input
              type="text"
              value={isEditingVideoDetails ? (editedVideoDetails.title || '') : (playingVideo.title || '')}
              onChange={(e) => isEditingVideoDetails && setEditedVideoDetails((prev) => ({ ...prev, title: e.target.value }))}
              readOnly={!isEditingVideoDetails}
              className={`w-full px-4 py-3 rounded-full border ${
                isEditingVideoDetails
                  ? 'border-blue-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  : 'border-gray-200 bg-gray-50 text-gray-900'
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              rows={4}
              value={isEditingVideoDetails ? (editedVideoDetails.description || '') : (playingVideo.description || '')}
              onChange={(e) => isEditingVideoDetails && setEditedVideoDetails((prev) => ({ ...prev, description: e.target.value }))}
              readOnly={!isEditingVideoDetails}
              className={`w-full px-4 py-3 rounded-lg border resize-none ${
                isEditingVideoDetails
                  ? 'border-blue-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  : 'border-gray-200 bg-gray-50 text-gray-700'
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">360° Video URL (Optional*)</label>
            <input
              type="url"
              placeholder="http://example.com/tour/library"
              value={isEditingVideoDetails ? (editedVideoDetails.videoUrl || '') : (playingVideo.videoUrl || '')}
              onChange={(e) => isEditingVideoDetails && setEditedVideoDetails((prev) => ({ ...prev, videoUrl: e.target.value }))}
              readOnly={!isEditingVideoDetails}
              className={`w-full px-4 py-3 rounded-full border ${
                isEditingVideoDetails
                  ? 'border-blue-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  : 'border-gray-200 bg-gray-50 text-gray-900'
              }`}
            />
            <p className="mt-2 text-xs text-gray-500">Enter a YouTube or other video URL for a 360° tour experience</p>
          </div>
        </div>

        {/* Footer Save */}
        <div className="mt-8 flex gap-4 justify-end">
                        <button
                onClick={() => { setIsEditingVideoDetails(false); setEditedVideoDetails({}); }}
                className="px-3 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>

          <button
            onClick={handleSaveVideoDetails}
            disabled={!isEditingVideoDetails || savingVirtualTour}
            className={`px-6 py-2.5 rounded-lg font-medium transition ${
              !isEditingVideoDetails || savingVirtualTour
                ? 'space-x-2 bg-gray-400 text-white cursor-not-allowed'
                : 'space-x-2 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white hover:from-[#0377EB] hover:to-[#2791FC]'
            }`}
          >
            {savingVirtualTour ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  ) : (
    /* Empty state */
    <div className="h-[875px] flex flex-col items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#0270DF]" viewBox="0 0 24 24" fill="none">
            <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h4 className="text-lg font-medium text-gray-700 mb-2">Upload a video</h4>
        <p className="text-gray-500 mb-4">Choose a file from your gallery</p>
        <button
          onClick={() => {
            setEditingVirtualTour(null);
            setSelectedVideoFile(null);
            setVideoUploadStatus('idle');
            setShowVirtualTourModal(true);
          }}
          className="inline-flex items-center gap-2 space-x-2 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white px-6 py-3 rounded-lg hover:from-[#0377EB] hover:to-[#2791FC] transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l3 3m0 0l3-3m-3 3V9" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Upload Video
        </button>
      </div>
    </div>
  )}
</div>
</div>
    ) : (
      /* Empty state */
      <div className="text-center py-16 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#0270DF]" viewBox="0 0 24 24" fill="none">
            <path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">You have no videos</h3>
        <p className="text-gray-500 mb-6">Please add videos to real-time environment to students!</p>
        <button
          onClick={() => {
            setEditingVirtualTour(null);
            setSelectedVideoFile(null);
            setVideoUploadStatus('idle');
            setShowVirtualTourModal(true);
          }}
          className="bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white px-6 py-3 rounded-lg hover:from-[#0377EB] hover:to-[#2791FC] transition-colors"
        >
          Add Videos
        </button>
      </div>
    )}

    {/* Mobile Add Video Button */}
    <div className="sm:hidden mt-6">
      <button
        onClick={() => {
          setEditingVirtualTour(null);
          setSelectedVideoFile(null);
          setVideoUploadStatus('idle');
          setShowVirtualTourModal(true);
        }}
        className="w-full bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white px-4 py-3 rounded-lg hover:from-[#0377EB] hover:to-[#2791FC] transition-colors"
      >
        Add Videos
      </button>
    </div>
  </div>
)}


        {/* Add Image Modal */}
        {showAddImageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Add Image:</h2>
                <button
                  onClick={() => setShowAddImageModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload photo*</label>
                  
                  {/* Image Preview */}
                  {imagePreview ? (
                    <div className="mb-4">
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => {
                            setImagePreview(null);
                            setSelectedImageFile(null);
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-sm text-green-600 mt-2">{galleryImages.length + 1}/5 image uploaded successful</p>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <div className="w-12 h-12 mx-auto mb-4 text-gray-400">
                        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-gray-600 mb-2">{galleryImages.length}/5 image uploaded</p>
                    </div>
                  )}

                  {/* File Input */}
                  <div className="flex justify-end mt-4">
                    <label className="cursor-pointer">
                      <div className="bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white px-4 py-2 rounded-lg transition-colors">
                        Browse
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageSelect}
                      />
                    </label>
                  </div>
                </div>

                {/* Upload Button */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowAddImageModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImageUpload}
                    disabled={!selectedImageFile || uploadingImage}
                    className="bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white px-6 py-2 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {uploadingImage ? 'Uploading...' : 'Add Image'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Image Modal */}
        {showFullImageModal && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black bg-opacity-60"></div>
            <div className="relative h-full w-full flex items-center justify-center p-6">
              <div className="relative w-[90vw] max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4">
                  <h3 className="text-[#0270DF] font-semibold">Gallery</h3>
                  <button
                    onClick={() => setShowFullImageModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label="Close"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Body with image and controls */}
                <div className="relative px-6 pb-6 pt-2">
                  <div className="relative bg-gray-50 rounded-xl overflow-hidden min-h-[60vh] flex items-center justify-center">
                    <img
                      src={fullImageUrl}
                      className="w-full max-h-[65vh] object-contain"
                    />

                    {/* Center counter e.g., 1/5 */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                      {currentImageIndex + 1}/{galleryImages.length}
                    </div>

                    {/* Prev */}
                    {galleryImages.length > 1 && (
                      <button
                        onClick={() => navigateImage('prev')}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center shadow"
                        aria-label="Previous image"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    )}
                    {/* Next */}
                    {galleryImages.length > 1 && (
                      <button
                        onClick={() => navigateImage('next')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center shadow"
                        aria-label="Next image"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Image</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this image? This action cannot be undone.</p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setImageToDelete('');
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmDeleteImage(imageToDelete)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Social Media Modal */}
        {showSocialMediaModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-1/2 max-1/2 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[#0270DF]">Add your social media links</h2>
                <button
                  onClick={() => setShowSocialMediaModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* LinkedIn */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                  <input
                    type="url"
                    value={socialMediaData.linkedin}
                    onChange={(e) => handleSocialMediaChange('linkedin', e.target.value)}
                    placeholder="http://linkedin.com/demo"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Facebook */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
                  <input
                    type="url"
                    value={socialMediaData.facebook}
                    onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                    placeholder="http://facebook.com/demo"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Instagram */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                  <input
                    type="url"
                    value={socialMediaData.instagram}
                    onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                    placeholder="http://instagram.com/demo"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Twitter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
                  <input
                    type="url"
                    value={socialMediaData.twitter}
                    onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
                    placeholder="http://twitter.com/demo"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Pinterest */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pinterest</label>
                  <input
                    type="url"
                    value={socialMediaData.pinterest}
                    onChange={(e) => handleSocialMediaChange('pinterest', e.target.value)}
                    placeholder="http://pinterest.com/demo"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    type="url"
                    value={socialMediaData.website}
                    onChange={(e) => handleSocialMediaChange('website', e.target.value)}
                    placeholder="http://www.abcgdemo.com/xyz"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={handleSocialMediaSave}
                  disabled={saving}
                  className={`flex items-center px-6 py-3 rounded-lg font-medium ${
                    saving
                      ? 'bg-gray-400 text-white cursor-not-allowed cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Other Details Modal */}
        {showOtherDetailsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-1/2 max-1/2 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[#0270DF]">Other Details</h2>
                <button
                  onClick={() => setShowOtherDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">College brochure</label>
                <p className="text-sm text-gray-500 mb-4">Max limit 10 MB ( You can upload upto 3 files)</p>
                
                {/* Uploaded Brochures List */}
                {formData?.brochures && formData.brochures.length > 0 ? (
                  <div className="space-y-3">
                    {formData.brochures.map((brochure: any, index: number) => (
                      <div key={index} className="border-2 border-green-300 bg-green-50 rounded-lg p-6 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-3 relative">
                            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6" />
                            </svg>
                            <div className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full px-1">
                              PDF
                            </div>
                          </div>
                          <h4 className="text-green-700 font-medium text-lg mb-2">Uploaded</h4>
                          <p className="text-sm text-green-600">{brochure.name}</p>
                          <p className="text-xs text-green-500">{(brochure.size / 1024 / 1024).toFixed(1)} MB</p>
                          
                          <div className="flex items-center gap-3 mt-4">
                            <a
                              href={brochure.cdnUrl || brochure.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-700 text-sm underline"
                            >
                              View
                            </a>
                            <button
                              onClick={() => handleRemoveBrochure(index)}
                              className="text-red-500 hover:text-red-700 text-sm"
                              title="Remove brochure"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Add more files if less than 3 */}
                    {formData.brochures.length < 3 && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-[#0270DF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                          <p className="text-gray-600 mb-2">Upload more files</p>
                          <p className="text-sm text-gray-500 mb-4">
                            {formData.brochures.length}/3 files uploaded
                          </p>
                          <label className="cursor-pointer">
                            <div className="bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white px-4 py-2 rounded-lg hover:from-[#0377EB] hover:to-[#2791FC] transition-colors">
                              Choose Files
                            </div>
                            <input
                              type="file"
                              multiple
                              accept=".pdf,.doc,.docx"
                              onChange={handleBrochureUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Empty state - no brochures uploaded */
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-[#0270DF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-gray-600 mb-2">Upload files here</p>
                      <p className="text-sm text-gray-500 mb-4">0/3 files uploaded</p>
                      <label className="cursor-pointer">
                        <div className="bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white px-6 py-2 rounded-lg hover:from-[#0377EB] hover:to-[#2791FC] transition-colors">
                          Choose Files
                        </div>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx"
                          onChange={handleBrochureUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-400 mt-2">Supported: PDF, DOC, DOCX</p>
                    </div>
                  </div>
                )}

                {/* Upload Status */}
                {brochureUploadStatus === 'uploading' && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm text-blue-600">Uploading brochures...</span>
                    </div>
                  </div>
                )}
                {brochureUploadStatus === 'success' && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <span className="text-sm text-green-600">✓ Brochures uploaded successfully</span>
                  </div>
                )}
                {brochureUploadStatus === 'error' && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg">
                    <span className="text-sm text-red-600">✗ Failed to upload brochures</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowOtherDetailsModal(false)}
                  className="bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white px-6 py-3 rounded-lg hover:from-[#0377EB] hover:to-[#2791FC] transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Facility Modal */}
        {showFacilityModal && (
          <FacilityModal 
            facility={editingFacility}
            onSave={handleSaveFacility}
            onClose={() => {
              setShowFacilityModal(false);
              setEditingFacility(null);
            }}
            saving={saving}
          />
        )}

        {/* Course Modal */}
        {showCourseModal && (
          <CourseModal 
            course={editingCourse}
            onSave={handleSaveCourse}
            onClose={() => {
              setShowCourseModal(false);
              setEditingCourse(null);
            }}
            saving={saving}
          />
        )}

        {showCourseDetailsModal && (
          <CourseDetailsModal 
            course={viewingCourse}
            onClose={() => {
              setShowCourseDetailsModal(false);
              setViewingCourse(null);
            }}
            onEdit={() => {
              setEditingCourse(viewingCourse);
              setShowCourseDetailsModal(false);
              setShowCourseModal(true);
            }}
          />
        )}

        {/* Achievement Modal */}
        {showAchievementModal && (
          <AchievementModal 
            achievement={editingAchievement}
            onSave={handleSaveAchievement}
            onDelete={handleDeleteAchievement}
            onClose={() => {
              setShowAchievementModal(false);
              setEditingAchievement(null);
            }}
            saving={savingAchievement}
          />
        )}

        {/* Achievement View Modal */}
        {showAchievementViewModal && viewingAchievement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white px-6 py-4 flex items-center justify-between border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">Achievement Details</h2>
                <button
                  onClick={() => {
                    setShowAchievementViewModal(false);
                    setViewingAchievement(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-0">
                {/* Image - Full Width */}
                {viewingAchievement.photo ? (
                  <div className="w-full">
                    <img
                      src={getImageSrc(viewingAchievement.photo)}
                      alt={viewingAchievement.title}
                      className="w-full h-[400px] object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-[400px] bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                    <svg className="w-20 h-20 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}

                {/* Text Content */}
                <div className="p-6">
                  {/* Title and Year */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-2xl font-semibold text-gray-900 flex-1">
                      {viewingAchievement.title}
                    </h3>
                    {viewingAchievement.year && (
                      <span className="text-base font-medium text-white bg-[#1677FF] px-4 py-1.5 rounded ml-4">
                        {viewingAchievement.year}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {viewingAchievement.description && (
                    <div>
                      <p className="text-gray-700 leading-relaxed text-base">
                        {viewingAchievement.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alumni Modal */}
        {showAlumniModal && (
          <AlumniModal 
            alumni={editingAlumni}
            onSave={handleSaveAlumni}
            onDelete={deleteAlumni}
            onClose={() => {
              setShowAlumniModal(false);
              setEditingAlumni(null);
              setAlumniImagePreview(null);
              setSelectedAlumniImageFile(null);
              setAlumniImageUploadStatus('idle');
            }}
            saving={savingAlumni}
            imagePreview={alumniImagePreview}
            setImagePreview={setAlumniImagePreview}
            selectedImageFile={selectedAlumniImageFile}
            setSelectedImageFile={setSelectedAlumniImageFile}
            imageUploadStatus={alumniImageUploadStatus}
            onImageUpload={handleAlumniImageUpload}
            getImageSrc={getImageSrc}
          />
        )}

        {/* Alumni View Modal */}
        {showAlumniViewModal && viewingAlumni && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white px-6 py-5 flex items-center justify-between border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">Alumni Details</h2>
                <button
                  onClick={() => {
                    setShowAlumniViewModal(false);
                    setViewingAlumni(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content - Side by Side Layout */}
              <div className="flex p-6 gap-6">
                {/* Left Side - Image */}
                <div className="flex-shrink-0">
                  {viewingAlumni.image ? (
                    <div className="w-44 h-52 rounded-xl overflow-hidden">
                      <img
                        src={getImageSrc(viewingAlumni.image)}
                        alt={viewingAlumni.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-44 h-52 bg-gray-100 rounded-xl flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5Z"/>
                      </svg>
                    </div>
                  )}
                </div>

                {/* Right Side - Content */}
                <div className="flex-1 min-w-0">
                  {/* Name */}
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    {viewingAlumni.name}
                  </h3>

                  {/* Email - if available */}
                  {viewingAlumni.email && (
                    <p className="text-gray-500 text-base mb-3">
                      {viewingAlumni.email}
                    </p>
                  )}

                  {/* Current Position - Blue text, larger */}
                  {viewingAlumni.qualification && (
                    <p className="text-[#1677FF] text-lg mb-4">
                      {viewingAlumni.qualification}
                    </p>
                  )}

                  {/* Degree and Year */}
                  <div className="mb-4 space-y-1">
                    <p className="text-gray-900 text-base">
                      <span className="font-medium">Qualification:</span>{' '}
                      <span>Bachelor of Commerce (B.Com)</span>
                    </p>
                    <p className="text-gray-900 text-base">
                      <span className="font-medium">Graduation Year:</span>{' '}
                      <span>{viewingAlumni.graduationYear || 'N/A'}</span>
                    </p>
                  </div>

                  {/* About Section */}
                  {viewingAlumni.about && (
                    <div>
                      <h4 className="text-base font-semibold text-gray-900 mb-2">About</h4>
                      <p className="text-gray-700 leading-relaxed text-base">
                        {viewingAlumni.about}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Virtual Tour Modal */}
        {showVirtualTourModal && (
          <VirtualTourModal 
            isOpen={showVirtualTourModal}
            virtualTour={editingVirtualTour}
            onSave={handleSaveVirtualTour}
            onClose={() => {
              setShowVirtualTourModal(false);
              setEditingVirtualTour(null);
              setSelectedVideoFile(null);
              setVideoUploadStatus('idle');
            }}
            saving={savingVirtualTour}
            onVideoUpload={handleVideoUpload}
            selectedVideoFile={selectedVideoFile}
            setSelectedVideoFile={setSelectedVideoFile}
            videoUploadStatus={videoUploadStatus}
          />
        )}

        {/* Basic Information Modal */}
        {showBasicInfoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-[#0270DF]">Edit Basic Information</h3>
                <button
                  onClick={() => {
                    setFormErrors({});
                    setShowBasicInfoModal(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">College Name</label>
                  <input
                    type="text"
                    value={formData?.name || ''}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    title="College name cannot be edited"
                  />
                  <p className="text-xs text-gray-500 mt-1">College name cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Established Year</label>
                  <input
                    type="number"
                    value={formData?.establishedYear || ''}
                    onChange={(e) => handleInputChange('establishedYear', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {formErrors.establishedYear && <p className="text-red-500 text-xs mt-1">{formErrors.establishedYear}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recognized By</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter recognized by"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={recognizedBySearch}
                      onChange={(e) => setRecognizedBySearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          const value = recognizedBySearch.trim();
                          if (value) {
                            const current = formData?.recognizedBy ? formData.recognizedBy.split(',').map(s => s.trim()).filter(s => s) : [];
                            if (!current.includes(value)) {
                              handleInputChange('recognizedBy', [...current, value].join(', '));
                            }
                            setRecognizedBySearch('');
                          }
                        }
                      }}
                    />
                    
                    {/* Dropdown suggestions */}
                    {recognizedBySearch && (
                      <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-lg">
                        {recognizedByOptions
                          .filter(option => option.toLowerCase().includes(recognizedBySearch.toLowerCase()))
                          .map(option => (
                            <div
                              key={option}
                              className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                              onClick={() => {
                                const current = formData?.recognizedBy ? formData.recognizedBy.split(',').map(s => s.trim()).filter(s => s) : [];
                                if (!current.includes(option)) {
                                  handleInputChange('recognizedBy', [...current, option].join(', '));
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
                    {formData?.recognizedBy && formData.recognizedBy.split(',').map(tag => tag.trim()).filter(tag => tag).map((tag, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-sm flex items-center">
                        {tag}
                        <button
                          type="button"
                          onClick={() => {
                            const current = formData.recognizedBy.split(',').map(s => s.trim()).filter(s => s);
                            const updated = current.filter(t => t !== tag);
                            handleInputChange('recognizedBy', updated.join(', '));
                          }}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  {formErrors.recognizedBy && <p className="text-red-500 text-xs mt-1">{formErrors.recognizedBy}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">College Type</label>
                  <div className="relative">
                    <select
                      value={formData?.collegeType || ''}
                      onChange={(e) => handleInputChange('collegeType', e.target.value)}
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                    >
                      <option value="">Select Type</option>
                      {collegeTypeOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                  {formErrors.collegeType && <p className="text-red-500 text-xs mt-1">{formErrors.collegeType}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Affiliated To</label>
                  <input
                    type="text"
                    value={formData?.affiliation || ''}
                    onChange={(e) => handleInputChange('affiliation', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., University of Mumbai"
                  />
                  {formErrors.affiliation && <p className="text-red-500 text-xs mt-1">{formErrors.affiliation}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">College Email</label>
                  <input
                    type="email"
                    value={formData?.userEmail || ''}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    title="College email cannot be edited"
                  />
                  <p className="text-xs text-gray-500 mt-1">College email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">NAAC Rating</label>
                  <div className="relative">
                    <select
                      value={formData?.naacRating || ''}
                      onChange={(e) => handleInputChange('naacRating', e.target.value)}
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                    >
                      <option value="">Select NAAC Rating</option>
                      {naacRatingOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* NIRF Ranking Section */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">NIRF Ranking (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <div className="relative">
                      <select
                        value={formData?.nirfRanking?.category || ''}
                        onChange={(e) => handleInputChange('nirfRanking', { ...formData?.nirfRanking, category: e.target.value })}
                        className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                      >
                        <option value="">Select Category</option>
                        {nirfCategoryOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rank</label>
                    <input
                      type="number"
                      min="1"
                      value={formData?.nirfRanking?.rank || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const rank = value ? parseInt(value) : undefined;
                        handleInputChange('nirfRanking', { ...formData?.nirfRanking, rank });
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                    <input
                      type="number"
                      min="2015"
                      max={new Date().getFullYear()}
                      value={formData?.nirfRanking?.year || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const year = value ? parseInt(value) : undefined;
                        handleInputChange('nirfRanking', { ...formData?.nirfRanking, year });
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 2024"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={() => setShowBasicInfoModal(false)}
                  className="mr-4 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBasicInfoSave}
                  disabled={saving}
                  className={`flex items-center px-6 py-3 rounded-lg font-medium ${
                    saving
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contact Details Modal */}
        {showContactModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-[#0270DF]">Edit Contact Details</h3>
                <button
                  onClick={() => {
                    setFormErrors({});
                    setShowContactModal(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Row 1: Admission Coordinator Name and Email (horizontally) - First priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Admission Coordinator Name</label>
                    <input
                      type="text"
                      value={formData?.primaryContact?.name || ''}
                      onChange={(e) => handleInputChange('primaryContact', {...formData?.primaryContact, name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Ms. Priya Sharma"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Admission Coordinator Email</label>
                    <input
                      type="email"
                      value={formData?.primaryContact?.email || ''}
                      onChange={(e) => handleInputChange('primaryContact', {...formData?.primaryContact, email: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="admission@college.edu"
                    />
                    {formErrors.primaryEmail && <p className="text-red-500 text-xs mt-1">{formErrors.primaryEmail}</p>}
                  </div>
                </div>

                {/* Row 2: Admission Coordinator Phone (full width, read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admission Coordinator Phone</label>
                  <input
                    type="tel"
                    value={formData?.primaryContact?.phone || ''}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    placeholder="Phone number (not editable)"
                  />
                  <p className="text-xs text-gray-500 mt-1">This field cannot be edited</p>
                </div>

                {/* Row 3: Placement Coordinator Name and Phone (horizontally) - Second priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Placement Coordinator Name</label>
                    <input
                      type="text"
                      value={formData?.placementContact?.name || ''}
                      onChange={(e) => handleInputChange('placementContact', {...formData?.placementContact, name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Dr. Rajesh Kumar"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Placement Coordinator Phone</label>
                    <input
                      type="tel"
                      value={formData?.placementContact?.phone || ''}
                      onChange={(e) => handleInputChange('placementContact', {...formData?.placementContact, phone: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., +91 9876543210"
                    />
                    {formErrors.placementPhone && <p className="text-red-500 text-xs mt-1">{formErrors.placementPhone}</p>}
                  </div>
                </div>

                {/* Row 4: Placement Coordinator Email (full width) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Placement Coordinator Email</label>
                  <input
                    type="email"
                    value={formData?.placementContact?.email || ''}
                    onChange={(e) => handleInputChange('placementContact', {...formData?.placementContact, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="placement@college.edu"
                  />
                  {formErrors.placementEmail && <p className="text-red-500 text-xs mt-1">{formErrors.placementEmail}</p>}
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={() => setShowContactModal(false)}
                  className="mr-4 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleContactSave}
                  disabled={saving}
                  className={`flex items-center px-6 py-3 rounded-lg font-medium ${
                    saving
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Address Modal */}
        {showAddressModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-[#0270DF]">Edit Address</h3>
                <button
                  onClick={() => {
                    setFormErrors({});
                    setLoadingPinCodeData(false);
                    setShowAddressModal(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Address</label>
                  <textarea
                    value={formData?.address?.street || ''}
                    onChange={(e) => handleInputChange('address.street', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your complete address"
                  />
                  {formErrors.street && <p className="text-red-500 text-xs mt-1">{formErrors.street}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pin Code</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData?.address?.zipCode || ''}
                      onChange={(e) => {
                        const pinCode = e.target.value;
                        handleInputChange('address.zipCode', pinCode);
                        
                        // Clean the pin code and check if it's valid length
                        const cleanPinCode = pinCode.replace(/\s+/g, '').replace(/[^0-9]/g, '');
                        
                        // Trigger fetch when we have 6 digits
                        if (cleanPinCode.length === 6) {
                          console.log('Pin code reached 6 digits, triggering fetch...');
                          fetchLocationFromPinCode(cleanPinCode);
                        }
                      }}
                      onBlur={(e) => {
                        // Also try to fetch on blur in case user enters pin code differently
                        const pinCode = e.target.value;
                        const cleanPinCode = pinCode.replace(/\s+/g, '').replace(/[^0-9]/g, '');
                        if (cleanPinCode.length === 6 && validatePinCode(cleanPinCode)) {
                          console.log('Pin code validation on blur, triggering fetch...');
                          fetchLocationFromPinCode(cleanPinCode);
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter 6-digit pin code (e.g., 110001)"
                      maxLength={7}
                    />
                    {loadingPinCodeData && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                  </div>
                  {formErrors.zipCode && <p className="text-red-500 text-xs mt-1">{formErrors.zipCode}</p>}
                  <p className="text-xs text-gray-500 mt-1">City, state and district will be auto-filled after entering pin code</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    value={formData?.address?.state || ''}
                    onChange={(e) => handleInputChange('address.state', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="State name"
                  />
                  {formErrors.state && <p className="text-red-500 text-xs mt-1">{formErrors.state}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={formData?.address?.city || ''}
                    onChange={(e) => handleInputChange('address.city', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="City name"
                  />
                  {formErrors.city && <p className="text-red-500 text-xs mt-1">{formErrors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                  <input
                    type="text"
                    value={formData?.address?.district || ''}
                    onChange={(e) => handleInputChange('address.district', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="District name"
                  />
                  {formErrors.district && <p className="text-red-500 text-xs mt-1">{formErrors.district}</p>}
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="mr-4 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddressSave}
                  disabled={saving}
                  className={`flex items-center px-6 py-3 rounded-lg font-medium ${
                    saving
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{confirmAction.title}</h3>
            <p className="text-gray-600 mb-6">
              {confirmAction.message}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction && confirmAction.onConfirm) {
                    confirmAction.onConfirm();
                  }
                  setShowConfirmModal(false);
                  setConfirmAction(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {confirmAction.type === 'delete' ? 'Delete' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
   </ProtectedRoute>
  );
};

// Campus Tab Component
// Campus Tab Component
const CampusTab = ({ 
  campusDescription, 
  setCampusDescription, 
  isEditingCampusDescription, 
  setIsEditingCampusDescription,
  handleSaveCampusDescription,
  saving,
  availableFacilities,
  selectedFacilities,
  toggleFacility,
  saveFacilities,
  savingFacilities,
  showFacilitySelector,
  setShowFacilitySelector,
  showFacilityAddModal,
  setShowFacilityAddModal,
  setEditingFacility,
  setShowFacilityModal
}: any) => (
  <div className="bg-white rounded-xl p-4 shadow-sm">
    {/* Header */}
    <div className="flex items-center justify-between mb-6 md:mb-7">
      <div>
        <h2 className="text-[22px] md:text-2xl font-semibold text-[#0270DF]">Campus</h2>
        <p className="text-sm text-gray-600 mt-1">Showcase your campus environment and facilities</p>
      </div>
      <button 
        onClick={() => setIsEditingCampusDescription(!isEditingCampusDescription)}
        className="text-[#0270DF] text-sm hover:text-blue-700 border border-blue-600 px-3 py-1 rounded flex items-center"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit
      </button>
    </div>

    {/* Campus Description */}
    <div className="">
      <h3 className="text-sm font-semibold text-gray-800 mb-2">Campus Description</h3>

      {isEditingCampusDescription ? (
        <div>
          <textarea
            value={campusDescription}
            onChange={(e) => {
              const value = e.target.value;
              const wordCount = value.trim().split(/\s+/).filter(word => word.length > 0).length;
              if (wordCount <= 300) {
                setCampusDescription(value);
              }
            }}
            placeholder="Describe your campus environment, location, and unique features... (Min 50, Max 300 words)"
            className={`w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-56 bg-white ${
              campusDescription && campusDescription.trim().split(/\s+/).filter(word => word.length > 0).length < 50 
                ? 'border-red-300 focus:border-red-500' 
                : 'border-gray-400'
            }`}
          />
          <div className="flex justify-between items-center mt-2">
            <div className={`text-sm ${
              !campusDescription || campusDescription.trim().split(/\s+/).filter(word => word.length > 0).length < 50 
                ? 'text-red-500' 
                : campusDescription.trim().split(/\s+/).filter(word => word.length > 0).length <= 300 
                  ? 'text-green-600' 
                  : 'text-red-500'
            }`}>
              {campusDescription ? campusDescription.trim().split(/\s+/).filter(word => word.length > 0).length : 0}/300 words
              {campusDescription && campusDescription.trim().split(/\s+/).filter(word => word.length > 0).length < 50 && (
                <span className="text-red-500 ml-2">Minimum 50 words required</span>
              )}
              {campusDescription && campusDescription.trim().split(/\s+/).filter(word => word.length > 0).length >= 50 && campusDescription.trim().split(/\s+/).filter(word => word.length > 0).length <= 300 && (
                <span className="text-green-600 ml-2">✓ Valid length</span>
              )}
            </div>
          </div>
          <div className="flex justify-end mt-4 space-x-3">
            <button
              onClick={() => setIsEditingCampusDescription(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCampusDescription}
              disabled={saving || !campusDescription || campusDescription.trim().split(/\s+/).filter(word => word.length > 0).length < 50 || campusDescription.trim().split(/\s+/).filter(word => word.length > 0).length > 300}
              className={`px-4 py-2 rounded-lg font-medium ${
                saving || !campusDescription || campusDescription.trim().split(/\s+/).filter(word => word.length > 0).length < 50 || campusDescription.trim().split(/\s+/).filter(word => word.length > 0).length > 300
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white hover:from-[#1e7ef0] hover:to-[#0366d6]'
              }`}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg min-h-[180px] border border-gray-300">
          <p className="text-gray-600">
            {campusDescription || 'Describe your campus environment, location, and unique features...'}
          </p>
        </div>
      )}
    </div>

    {/* College Facilities - Two states: Clean view and Facility selector */}
    {!showFacilitySelector ? (
      /* Clean College Facilities View (Reference Image 1) */
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Campus Facilities</h3>

        {selectedFacilities.length > 0 ? (
          /* Show selected facilities in clean view */
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {availableFacilities
              .filter((facility: any) => selectedFacilities.includes(facility.id))
              .map((facility: any) => (
                <div
                  key={facility.id}
                  className="p-4 rounded-xl bg-white border border-gray-300 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 mb-3 flex items-center justify-center text-gray-600">
                      {facility.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-full max-w-[110px] truncate mx-auto">
                      {facility.name}
                    </span>
                  </div>
                </div>
              ))}
            {/* Add New Facility tile */}
            <div
              onClick={() => {
                setShowFacilityAddModal(true);
              }}
              className="p-6 rounded-xl border-2 border-dashed border-gray-300 bg-white hover:bg-gray-50 cursor-pointer transition-colors flex flex-col items-center justify-center text-center"
            >
              <div className="w-10 h-10 mb-3 flex items-center justify-center text-indigo-900">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-700">Add New Facility</span>
            </div>
          </div>
        ) : (
          /* Empty state: single add tile */
          <div
            onClick={() => setShowFacilityAddModal(true)}
            className="p-10 rounded-xl border-2 border-dashed border-gray-300 bg-white hover:bg-gray-50 cursor-pointer transition-colors flex flex-col items-center justify-center text-center max-w-sm"
          >
            <div className="w-12 h-12 mb-3 flex items-center justify-center text-indigo-900">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="text-base font-semibold text-gray-700">Add New Facility</span>
          </div>
        )}
       
      </div>
    ) : (
      /* Facility Selector View (Reference Image 2 & 3) */
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-gray-800">Campus Facilities</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {availableFacilities.map((facility: any) => (
            <div
              key={facility.id}
              className={`relative p-4 rounded-xl cursor-pointer transition-all duration-150 bg-white border-2 shadow-sm hover:shadow-md ${
                selectedFacilities.includes(facility.id)
                  ? 'border-transparent ring-2 ring-blue-500 ring-offset-2'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => toggleFacility(facility.id)}
            >
              <div className="absolute top-2 right-2">
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedFacilities.includes(facility.id)
                      ? 'bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white border-blue-600'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedFacilities.includes(facility.id) && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-center text-center pt-2">
                <div className="w-12 h-12 mb-3 flex items-center justify-center text-gray-600">
                  {facility.icon}
                </div>
                <span className="text-sm font-medium text-gray-900 w-full max-w-[110px] truncate mx-auto">
                  {facility.name}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Save aligned right to match reference */}
        <div className="mt-6 flex space-x-3 justify-end">
                      <button
              onClick={() => setShowFacilitySelector(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          <button
            onClick={() => {
              saveFacilities();
              setShowFacilitySelector(false);
            }}
            disabled={savingFacilities}
            className={`px-6 py-2 rounded-lg font-medium ${
              savingFacilities
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white'
            }`}
          >
            {savingFacilities ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    )}

    {/* Add Facilities Modal (same look/feel as Social Media modal) */}
    {showFacilityAddModal && (
      <FacilityAddModal
        availableFacilities={availableFacilities}
        initialSelected={selectedFacilities}
        onClose={() => setShowFacilityAddModal(false)}
        onSave={async (list: string[]) => {
          await saveFacilities(list);
          setShowFacilityAddModal(false);
        }}
        saving={savingFacilities}
      />
    )}
  </div>
);

// Add Facilities Modal (select from the 8 predefined cards)
const FacilityAddModal = ({
  availableFacilities,
  initialSelected,
  onClose,
  onSave,
  saving
}: any) => {
  const [tempSelected, setTempSelected] = useState<string[]>(initialSelected || []);

  useEffect(() => {
    setTempSelected(initialSelected || []);
  }, [initialSelected]);

  const toggle = (id: string) => {
    setTempSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Select Facilities</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {availableFacilities.map((facility: any) => (
            <div
              key={facility.id}
              className={`relative p-4 rounded-xl cursor-pointer transition-all duration-150 bg-white border-2 shadow-sm hover:shadow-md ${
                tempSelected.includes(facility.id)
                  ? 'border-transparent ring-2 ring-blue-500 ring-offset-2'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => toggle(facility.id)}
            >
              <div className="absolute top-2 right-2">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  tempSelected.includes(facility.id) ? 'bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white border-blue-600' : 'border-gray-300'
                }`}>
                  {tempSelected.includes(facility.id) && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center text-center pt-2">
                <div className="w-12 h-12 mb-3 flex items-center justify-center text-gray-600">
                  {facility.icon}
                </div>
                <span className="text-sm font-medium text-gray-900 w-full max-w-[110px] truncate mx-auto">
                  {facility.name}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6 space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => onSave(tempSelected)}
            disabled={saving}
            className={`px-6 py-2 rounded-lg font-medium ${saving ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white'}`}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};


// Courses Tab Component
const CoursesTab = ({ courses, setShowCourseModal, setEditingCourse, setViewingCourse, setShowCourseDetailsModal, handleDeleteCourse, formatCurrency }: any) => {
  const [enrollmentData, setEnrollmentData] = useState<{ [courseId: string]: any }>({});
  const [loadingEnrollment, setLoadingEnrollment] = useState(true);

  // Fetch enrollment data for all courses
  useEffect(() => {
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

        // Fetch enrollment data for each course
        const enrollmentPromises = courses.map(async (course: Course) => {
          try {
            const response = await axios.get(
              `${API_BASE_URL}/api/admission-enquiries/course/${course._id}/enrollment`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (response.data.success) {
              return { courseId: course._id, data: response.data.data };
            }
            return { courseId: course._id, data: null };
          } catch (error) {
            console.error(`Error fetching enrollment for course ${course._id}:`, error);
            return { courseId: course._id, data: null };
          }
        });

        const results = await Promise.all(enrollmentPromises);
        
        // Convert array to object for easy lookup
        const enrollmentMap = results.reduce((acc, result) => {
          if (result.data) {
            acc[result.courseId] = result.data;
          } else {
            // Fallback data for courses without API data
            const course = courses.find((c: Course) => c._id === result.courseId);
            acc[result.courseId] = {
              enrolledStudents: course?.enrolledStudents || 0,
              totalSeats: course?.numberOfSeats || 0,
              fillPercentage: 0
            };
          }
          return acc;
        }, {});

        setEnrollmentData(enrollmentMap);
      } catch (error) {
        console.error('Error fetching enrollment data:', error);
      } finally {
        setLoadingEnrollment(false);
      }
    };

    fetchAllEnrollmentData();
  }, [courses]);

  return (
  <div className="bg-white rounded-xl p-4 shadow-sm">
    {/* Header */}
    <div className="flex items-center justify-between mb-6 md:mb-7">
      <div>
        <h2 className="text-[22px] md:text-2xl font-semibold text-[#0270DF]">Courses & Programs</h2>
        <p className="text-sm text-gray-600">Manage your courses and programs offered</p>
      </div>
        <button 
          onClick={() => {
            setEditingCourse(null);
            setShowCourseModal(true);
          }}
        className="hidden sm:inline-flex items-center gap-2 space-x-2 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white px-4 py-2 rounded-lg hover:from-[#0377EB] hover:to-[#2791FC] transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
          <path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="text-sm font-medium">
          Add Courses</span>
        </button>
      </div>

      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course: Course) => {
            const totalSeats = enrollmentData[course._id]?.totalSeats || parseInt(course.numberOfSeats?.toString() || '60');
            const enrolledStudents = enrollmentData[course._id]?.enrolledStudents || 0;
            const availableSeats = Math.max(0, totalSeats - enrolledStudents);
            const progressPercent = enrollmentData[course._id]?.fillPercentage || (totalSeats > 0 ? Math.min(100, Math.round((enrolledStudents / totalSeats) * 100)) : 0);
            
            // Check if any offers are enabled
            const hasSpotAdmission = course.specialOffers?.spotAdmission?.enabled && course.specialOffers?.spotAdmission?.fee && course.specialOffers?.spotAdmission?.seats;
            const hasEarlyBird = course.specialOffers?.earlyBird?.enabled && course.specialOffers?.earlyBird?.discount;
            const hasScholarship = course.specialOffers?.meritScholarship?.enabled && course.specialOffers?.meritScholarship?.percent;
            const hasAnyOffer = hasSpotAdmission || hasEarlyBird || hasScholarship;
            
            return (
              <div key={course._id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm min-h-[500px] flex flex-col">
                {/* Header Section Course */}
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
                    {loadingEnrollment ? (
                      <div className="animate-pulse bg-gray-300 h-2 rounded-full w-1/2"></div>
                    ) : (
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    )}
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
                </div>                {/* Fee Information */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-gray-500 text-xs font-medium mb-1">Total Fee</div>
                    <div className="text-xl font-medium text-gray-900">
                      {formatCurrency(course.totalFee || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-right text-gray-500 text-xs font-medium mb-1">Semester Fee</div>
                    <div className="text-right text-xl font-medium text-gray-900">
                      {formatCurrency(course.semesterFee || 0)}
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

                {/* Remove the "No Active Offers" section since we now show grayed sections */}

                {/* Action Buttons */}
                <div className="flex gap-3 mt-auto">
                  <button
                    onClick={() => { setViewingCourse(course); setShowCourseDetailsModal(true); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View details
                  </button>
                  <button
                    onClick={() => { setEditingCourse(course); setShowCourseModal(true); }}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course._id)}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl text-gray-300 mb-4"></div>
          <h4 className="text-lg font-medium text-gray-600 mb-2">No course available.</h4>
          <p className="text-gray-500 mb-4">Please add courses to start attracting students!</p>
          <button 
            onClick={() => {
              setEditingCourse(null);
              setShowCourseModal(true);
            }}
            className="px-6 py-2 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white rounded-lg"
          >
            Add First Course
          </button>
        </div>
      )}
  </div>
  );
};

// Facility Modal Component
const FacilityModal = ({ facility, onSave, onClose, saving }: any) => {
  const [formData, setFormData] = useState({
    name: facility?.name || '',
    icon: facility?.icon || '',
    description: facility?.description || ''
  });

  const facilityIcons = [
    '☕', '💻', '�️‍♂️', '🏠', '⚽', '📚', '📝', '📶', '🏥', '�️',
    '🎭', '🔬', '🎵', '🎨', '🍽️', '�‍♂️', '�', '🏐', '🏀', '🎯',
    '🚗', '🚌', '🏪', '🏭', '📡', '🛠️', '�', '�', '�️', '⛺'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.icon) {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-1/2 max-1/2 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Add Facility</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Facility Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Facility Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Library, Gym, Cafeteria"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Icon Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
              <div className="grid grid-cols-10 gap-3 mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                {facilityIcons.map((icon, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setFormData({...formData, icon})}
                    className={`w-12 h-12 flex items-center justify-center text-2xl border-2 rounded-lg hover:bg-blue-50 transition-all ${
                      formData.icon === icon 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({...formData, icon: e.target.value})}
                placeholder="Or enter custom emoji/icon"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Brief description of the facility"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end mt-8 space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !formData.name || !formData.icon}
              className={`px-6 py-3 rounded-lg font-medium ${
                saving || !formData.name || !formData.icon
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white'
              }`}
            >
              {saving ? 'Saving...' : 'Add Facility'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Course Modal Component - 2 Step Form
const CourseModal = ({ course, onSave, onClose, saving }: any) => {
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

  const formatAccreditationValue = (value: string) => {
    switch (value) {
      case 'ugc-approved': return 'UGC Approved';
      case 'aicte-approved': return 'AICTE Approved';
      case 'university-affiliated': return 'University Affiliated';
      default: return value;
    }
  };

  const formatStudyModeValue = (value: string) => {
    switch (value) {
      case 'full-time': return 'Full-Time';
      case 'part-time': return 'Part-Time';
      case 'distance-education': return 'Distance Education';
      default: return value;
    }
  };

  const formatCategoryValue = (value: string) => {
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-1/2 max-1/2 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="">
            
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Add New Course</h2>
              <p className="text-sm text-gray-600">Create a new academic application</p>
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
                <div className="relative">
                  <select
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                    required
                  >
                    <option value="">Select Course</option>
                    {availableCourseNames.map((courseName) => (
                      <option key={courseName} value={courseName}>
                        {courseName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
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
                  <div className="relative">
                    <select
                      value={formData.studyMode}
                      onChange={(e) => setFormData({...formData, studyMode: e.target.value as any})}
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                    >
                      <option value="full-time">Full-Time</option>
                      <option value="part-time">Part-Time</option>
                      <option value="distance-education">Distance Education</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
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
                  <div className="relative">
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value as any, type: e.target.value as any})}
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                    >
                      <option value="undergraduate">Undergraduate</option>
                      <option value="postgraduate">Postgraduate</option>
                      <option value="diploma">Diploma</option>
                      <option value="certificate">Certificate</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
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
                  <label className="text-right block text-sm font-medium text-gray-700 mb-2">Semester Fee (₹)</label>
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
                  <div className="relative">
                    <select
                      value={formData.accreditation}
                      onChange={(e) => setFormData({...formData, accreditation: e.target.value as any})}
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                    >
                      <option value="">Select Accreditation</option>
                      <option value="ugc-approved">UGC Approved</option>
                      <option value="aicte-approved">AICTE Approved</option>
                      <option value="university-affiliated">University Affiliated</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
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
                  onChange={(e) => {
                    const value = e.target.value;
                    const wordCount = value.trim().split(/\s+/).filter(word => word.length > 0).length;
                    if (wordCount <= 500) {
                      setFormData({...formData, description: value});
                    }
                  }}
                  placeholder="Add course notes and description... (Max 500 words)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">Maximum 500 words</p>
                  <span className={`text-xs ${
                    formData.description.trim().split(/\s+/).filter(word => word.length > 0).length >= 500 ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {formData.description ? formData.description.trim().split(/\s+/).filter(word => word.length > 0).length : 0}/500 words
                  </span>
                </div>
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
              {/* Step 2 starts directly with Special Offers section (no fees/department here) */}

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
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className={`px-6 py-3 rounded-lg font-medium ${
                      saving
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white'
                    }`}
                  >
                    {saving ? 'Saving...' : course ? 'Update Course' : 'Add Course'}
                  </button>
                </div>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

// Course Details Modal Component
const CourseDetailsModal = ({ course, onClose, onEdit }: any) => {
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
                <span className="ml-auto inline-flex items-center px-3 py-1 bg-gradient-to-r from-pink-500 to-red-500 text-white text-sm font-medium rounded-full">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 9h8L11 24v-9H4l9-15v9z"/>
                  </svg>
                  20% OFF
                </span>
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
                  <div className="text-gray-700">Merit Scholarship: <span className="text-gray-900">Available for students with {meritCriteria && (<div className="text-gray-900">{meritCriteria}</div>)}</span></div>
                  
                  <div>
                    <span className="inline-block px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-full">{meritPercent}% OFF</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="text-gray-700">Merit Scholarship: <span className="text-gray-900">Available for students with {meritCriteria && (<div className="text-gray-900">{meritCriteria}</div>)}</span></div>
                  <div>
                    <span className="inline-block px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-full"></span>
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

// Achievement Modal Component
const AchievementModal = ({ achievement, onSave, onDelete, onClose, saving }: any) => {
  const [formData, setFormData] = useState({
    title: achievement?.title || '',
    year: achievement?.year || new Date().getFullYear(),
    description: achievement?.description || '',
    photo: achievement?.photo || ''
  });

  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, GIF, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }

    setUploading(true);
    
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please login again.');
        return;
      }

      console.log('Uploading file:', file.name, 'Size:', file.size);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/colleges/upload/achievement-photo`,
        uploadFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          },
          timeout: 30000 // 30 second timeout
        }
      );
      
      console.log('Upload response:', response.data);
      
      if (response.data.success && response.data.url) {
        setFormData(prev => ({
          ...prev,
          photo: response.data.url
        }));
        console.log('Photo uploaded successfully:', response.data.url);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          alert('Session expired. Please login again.');
        } else if (error.response?.status === 413) {
          alert('File too large. Please choose a smaller image.');
        } else if (error.code === 'ECONNABORTED') {
          alert('Upload timeout. Please try again with a smaller image.');
        } else {
          alert(`Upload failed: ${error.response?.data?.message || error.message || 'Unknown error'}`);
        }
      } else {
        alert('Error uploading photo. Please check your connection and try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter achievement title');
      return;
    }
    if (!formData.year || formData.year < 1950 || formData.year > new Date().getFullYear()) {
      alert('Please select a valid year');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-1/2 max-1/2 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {achievement ? 'Edit Achievement' : 'Add New Achievements'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Achievement title"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year
            </label>
            <div className="relative">
              <select
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                required
              >
                <option value="">Select Year</option>
                {Array.from({ length: new Date().getFullYear() - 1949 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => {
                const value = e.target.value;
                const wordCount = value.trim().split(/\s+/).filter(word => word.length > 0).length;
                if (wordCount <= 500) {
                  setFormData(prev => ({ ...prev, description: value }));
                }
              }}
              placeholder="Brief description of achievement... (Max 500 words)"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">Maximum 500 words</p>
              <span className={`text-xs ${
                formData.description.trim().split(/\s+/).filter(word => word.length > 0).length >= 500 ? 'text-red-500' : 'text-gray-500'
              }`}>
                {formData.description ? formData.description.trim().split(/\s+/).filter(word => word.length > 0).length : 0}/500 words
              </span>
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo
            </label>
            
            {formData.photo ? (
              <div className="mb-3">
                <img
                  src={formData.photo}
                  alt="Achievement"
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, photo: '' }))}
                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                >
                  Remove Photo
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="mt-2">
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-600">
                        {uploading ? 'Uploading...' : 'Choose file'}
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        Supported: *.JPG/PNG (Max 2 MB)
                      </span>
                    </label>
                    <input
                      id="photo-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploading}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-between pt-4">
            <div>
              {achievement && (
                <button
                  type="button"
                  onClick={() => {
                    if (achievement._id) {
                      onDelete(achievement._id);
                      onClose();
                    }
                  }}
                  className="px-6 py-3 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Delete Achievement
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || uploading}
                className={`px-6 py-3 rounded-lg font-medium ${
                  saving || uploading
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white'
                }`}
              >
                {saving ? 'Saving...' : achievement ? 'Update Achievement' : 'Add Achievement'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Alumni Modal Component
const AlumniModal = ({ 
  alumni, 
  onSave, 
  onDelete, 
  onClose, 
  saving, 
  imagePreview, 
  setImagePreview, 
  selectedImageFile, 
  setSelectedImageFile, 
  imageUploadStatus, 
  onImageUpload,
  getImageSrc 
}: any) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    qualification: '',
    graduationYear: new Date().getFullYear(),
    about: '',
    image: ''
  });

  useEffect(() => {
    if (alumni) {
      setFormData({
        name: alumni.name || '',
        email: alumni.email || '',
        company: alumni.company || '',
        qualification: alumni.qualification || '',
        graduationYear: alumni.graduationYear || new Date().getFullYear(),
        about: alumni.about || '',
        image: alumni.image || ''
      });
    }
  }, [alumni]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let imageUrl = formData.image;
    
    // Upload image if a new file is selected
    if (selectedImageFile) {
      const uploadedUrl = await onImageUpload(selectedImageFile);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }
    
    onSave({
      ...formData,
      image: imageUrl
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setSelectedImageFile(null);
    setFormData(prev => ({ ...prev, image: '' }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 w-1/2 max-1/2 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {alumni ? 'Edit Alumni' : 'Add Alumni'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alumni Name*
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter alumni name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter mail id"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Enter company name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Qualification
              </label>
              <input
                type="text"
                value={formData.qualification}
                onChange={(e) => setFormData(prev => ({ ...prev, qualification: e.target.value }))}
                placeholder="Enter qualification"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Graduation Year
              </label>
              <div className="relative">
                <select
                  value={formData.graduationYear}
                  onChange={(e) => setFormData(prev => ({ ...prev, graduationYear: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                >
                  {Array.from({ length: 50 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alumni Image
            </label>
            
            {/* Image Upload */}
            <div className="mb-4 relative">
              {imagePreview ? (
                <div className="relative w-full h-56 rounded-lg overflow-hidden border">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <label className="w-full h-56 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors">
                  <div className="text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-gray-500 text-base font-medium">Choose file</p>
                    <p className="text-gray-400 text-sm">No file chosen</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Upload Status */}
            {imageUploadStatus === 'uploading' && (
              <p className="text-sm text-[#0270DF] flex items-center">
                <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </p>
            )}
            {imageUploadStatus === 'success' && (
              <p className="text-sm text-green-600">✓ Uploaded successfully</p>
            )}
            {imageUploadStatus === 'error' && (
              <p className="text-sm text-red-600">✗ Upload failed</p>
            )}
            
            <p className="text-xs text-gray-500 mt-1">Supported file *.JPEG/PNG (Max 2 MB)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              About Alumni
            </label>
            <textarea
              value={formData.about}
              onChange={(e) => {
                const value = e.target.value;
                const wordCount = value.trim().split(/\s+/).filter(word => word.length > 0).length;
                if (wordCount <= 500) {
                  setFormData(prev => ({ ...prev, about: value }));
                }
              }}
              placeholder="Write about your alumni... (Max 500 words)"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">Maximum 500 words</p>
              <span className={`text-xs ${
                formData.about.trim().split(/\s+/).filter(word => word.length > 0).length >= 500 ? 'text-red-500' : 'text-gray-500'
              }`}>
                {formData.about ? formData.about.trim().split(/\s+/).filter(word => word.length > 0).length : 0}/500 words
              </span>
            </div>
          </div>

          <div className="flex justify-between pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !formData.name.trim()}
        className="hidden sm:inline-flex items-center gap-2 space-x-2 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white px-4 py-2 rounded-lg hover:from-[#0377EB] hover:to-[#2791FC] transition-colors"
      >
              {saving && (

        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
          <path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
              )}
              {alumni ? 'Update Alumni' : 'Add Alumni'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Virtual Tour Modal Component
const VirtualTourModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  virtualTour, 
  saving,
  onVideoUpload,
  selectedVideoFile,
  setSelectedVideoFile,
  videoUploadStatus 
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<VirtualTour, '_id'>, setAsPreview?: boolean) => void;
  virtualTour?: VirtualTour | null;
  saving: boolean;
  onVideoUpload: (file: File) => Promise<string | null>;
  selectedVideoFile: File | null;
  setSelectedVideoFile: (file: File | null) => void;
  videoUploadStatus: 'idle' | 'uploading' | 'success' | 'error';
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    locationName: ''
  });
  const [setAsPreview, setSetAsPreview] = useState(false);

  useEffect(() => {
    if (virtualTour) {
      setFormData({
        title: virtualTour.title || '',
        description: virtualTour.description || '',
        videoUrl: virtualTour.videoUrl || '',
        locationName: virtualTour.locationName || ''
      });
      setSetAsPreview(virtualTour.isPreview || false);
    } else {
      setFormData({
        title: '',
        description: '',
        videoUrl: '',
        locationName: ''
      });
      setSetAsPreview(false);
    }
  }, [virtualTour]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Supported video MIME types
      const supportedFormats = [
        'video/mp4',
        'video/avi', 
        'video/mov',
        'video/quicktime',
        'video/wmv',
        'video/x-ms-wmv',
        'video/x-flv',
        'video/webm',
        'video/x-matroska',
        'video/3gpp',
        'video/x-m4v',
        'video/mpeg',
        'video/mp2t',
        'video/x-msvideo'
      ];

      // Validate file type
      if (!supportedFormats.includes(file.type)) {
        alert('Unsupported video format. Please select: MP4, AVI, MOV, WMV, FLV, WebM, MKV, 3GP, M4V, MPG, or MPEG files.');
        event.target.value = ''; // Clear the input
        return;
      }
      
      // Validate file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        alert('Video file size must be less than 100MB');
        event.target.value = ''; // Clear the input
        return;
      }

      setSelectedVideoFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate video URL if provided
    if (formData.videoUrl && formData.videoUrl.trim()) {
      try {
        const url = new URL(formData.videoUrl);
        // Check for valid video platforms or domains
        const validDomains = ['youtube.com', 'youtu.be', 'vimeo.com', 'dailymotion.com', 'wistia.com', 'jwplayer.com'];
        const isValidDomain = validDomains.some(domain => 
          url.hostname.includes(domain) || url.hostname.endsWith(domain)
        );
        
        // Allow any HTTPS URL for now, but warn about unknown domains
        if (!url.protocol.startsWith('http')) {
          alert('Please enter a valid HTTP or HTTPS URL');
          return;
        }
        
        // Prevent obviously invalid domains
        if (url.hostname.includes('coundownbreaker') || url.hostname.includes('localhost') || url.hostname === 'example.com') {
          alert('Please enter a valid video URL from a supported platform');
          return;
        }
      } catch (error) {
        alert('Please enter a valid video URL');
        return;
      }
    }
    
    let uploadedVideoUrl = '';
    
    // Upload video if a new file is selected
    if (selectedVideoFile) {
      const uploadedUrl = await onVideoUpload(selectedVideoFile);
      if (uploadedUrl) {
        uploadedVideoUrl = uploadedUrl;
      }
    }
    
    onSave({
      ...formData,
      videoFile: uploadedVideoUrl, // Store the full URL for uploaded videos
      videoUrl: formData.videoUrl ? formData.videoUrl.trim() : '' // Clean external URL
    }, setAsPreview);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {virtualTour ? 'Edit Virtual Tour' : 'Add Videos:'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video Title*
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter video title"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video URL (Optional*)
              </label>
              <input
                type="url"
                value={formData.videoUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Enter a valid video URL from YouTube, Vimeo, or other platforms</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Name
              </label>
              <input
                type="text"
                value={formData.locationName}
                onChange={(e) => setFormData(prev => ({ ...prev, locationName: e.target.value }))}
                placeholder="Enter location name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 500) {
                  setFormData(prev => ({ ...prev, description: value }));
                }
              }}
              placeholder="Write description... (Max 500 characters)"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">Maximum 500 characters</p>
              <span className={`text-xs ${
                formData.description.length >= 500 ? 'text-red-500' : 'text-gray-500'
              }`}>
                {formData.description.length}/500 characters
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Video
            </label>
            
            <div className="mb-4 relative">
              <label className="w-full h-56 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-500 text-base font-medium">Upload video</p>
                  {selectedVideoFile ? (
                    <p className="text-[#0270DF] text-sm mt-1">{selectedVideoFile.name}</p>
                  ) : (
                    <div className="mt-1">
                      <p className="text-gray-400 text-sm">No video selected</p>
                      <p className="text-gray-400 text-xs mt-1">
                        Supported: MP4, AVI, MOV, WMV, FLV, WebM, MKV, 3GP, M4V, MPG, MPEG
                      </p>
                      <p className="text-gray-400 text-xs">Max size: 100MB</p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="video/mp4,video/avi,video/mov,video/wmv,video/flv,video/webm,video/mkv,video/3gp,video/m4v,video/mpg,video/mpeg"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Upload Status */}
            {videoUploadStatus === 'uploading' && (
              <p className="text-sm text-yellow-600 flex items-center">
                <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </p>
            )}
            {videoUploadStatus === 'success' && (
              <p className="text-sm text-green-600">✓ Uploaded successfully</p>
            )}
            {videoUploadStatus === 'error' && (
              <p className="text-sm text-red-600">✗ Upload failed</p>
            )}
            
            <div className="flex items-center mt-4">
              <input 
                type="checkbox" 
                id="makePreview" 
                checked={setAsPreview}
                onChange={(e) => setSetAsPreview(e.target.checked)}
                className="mr-2 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" 
              />
              <label htmlFor="makePreview" className="text-sm font-medium text-gray-700 cursor-pointer">
                Set as preview video (Banner)
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-6">This video will autoplay on your college profile page</p>
          </div>

          <div className="flex justify-between pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !formData.title.trim()}
              className="px-8 py-3 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
            >
              {saving && (
                <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              Add Video
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Video Player Component
const VideoPlayer = ({ 
  video, 
  onClose 
}: {
  video: VirtualTour;
  onClose: () => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const playbackSpeeds = [0.5, 1, 1.25, 1.5, 2];

  // Select best playable source; prefer uploaded file, then embeddable URL
  const getVideoEmbedInfo = () => {
    // Prefer uploaded file if present
    if (video.videoFile && video.videoFile.trim()) {
      const fileUrl = video.videoFile.startsWith('http')
        ? video.videoFile
        : `${process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5001'}/uploads/virtual-tours/${video.videoFile}`;
      return { kind: 'video' as const, src: fileUrl };
    }

    // Otherwise fall back to external URL
    const url = (video.videoUrl || '').trim();
    if (!url) return { kind: 'none' as const, src: '' };

    // YouTube
    const ytMatchShort = url.match(/^https?:\/\/youtu\.be\/([\w-]{11})/);
    const ytMatchLong = url.match(/[?&]v=([\w-]{11})/);
    const ytId = ytMatchShort?.[1] || ytMatchLong?.[1];
    if (ytId) {
      return { kind: 'iframe' as const, src: `https://www.youtube.com/embed/${ytId}` };
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    const vimeoId = vimeoMatch?.[1];
    if (vimeoId) {
      return { kind: 'iframe' as const, src: `https://player.vimeo.com/video/${vimeoId}` };
    }

    // Direct video link
    if (/\.(mp4|webm|ogg|mov|m3u8)(?:\?.*)?$/i.test(url)) {
      return { kind: 'video' as const, src: url };
    }

    // Fallback to iframe for other platforms
    if (url.includes('coundownbreaker') || url.includes('example.com')) {
      return { kind: 'none' as const, src: '' };
    }
    return { kind: 'iframe' as const, src: url };
  };

  const togglePlay = () => {
    if (videoRef.current && !videoError) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch((error) => {
          console.error('Play error:', error);
          setVideoError('Unable to play video');
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
      setVideoError(null);
    }
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.error('Video error:', e);
    const { src: videoSrc, kind } = getVideoEmbedInfo();
    console.log('Failed video source:', videoSrc);
    
    // Provide specific error messages based on the video source
    let errorMessage = 'Unable to load video.';
    
    if (videoSrc.includes('coundownbreaker') || videoSrc.includes('localhost')) {
      errorMessage = 'Invalid test URL detected. Please use a valid video URL or upload a video file.';
    } else if (videoSrc.startsWith('http://localhost:5001/uploads/')) {
      errorMessage = 'Uploaded video file not found. Please try uploading the video again.';
    } else if (kind === 'iframe') {
      errorMessage = 'Unable to display embedded video. Please check the URL.';
    } else {
      errorMessage = 'Unable to load video. Please check the video file or URL format.';
    }
    
    setVideoError(errorMessage);
    setIsLoading(false);
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setVideoError(null);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      setVolume(vol);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col">

      {/* Video Player */}
      <div className="flex-1 relative bg-black">
        
        {getVideoEmbedInfo().src ? (
          <>
            {videoError ? (
              <div className="h-full flex items-center justify-center text-white">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-400 mb-2">{videoError}</p>
                  <p className="text-gray-400 text-sm mb-4">Video source: {getVideoEmbedInfo().src}</p>
                  {getVideoEmbedInfo().src.includes('coundownbreaker') && (
                    <div className="mt-4">
                      <p className="text-yellow-400 text-sm mb-2">This appears to be test data.</p>
                      <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white rounded-lg transition-colors"
                      >
                        Close & Edit Video
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {getVideoEmbedInfo().kind === 'iframe' ? (
                  <iframe
                    src={getVideoEmbedInfo().src}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    title={video.title}
                  />
                ) : (
                  <video
                    ref={videoRef}
                    src={getVideoEmbedInfo().src}
                    className="w-full h-full object-contain"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onLoadStart={handleLoadStart}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onError={handleVideoError}
                    controls
                  />
                )}
                
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="text-center text-white">
                      <svg className="animate-spin w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p>Loading video...</p>
                    </div>
                  </div>
                )}
            
            {/* Video Controls (HTML5 video only) */}
            {getVideoEmbedInfo().kind === 'video' && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              {/* Progress Bar */}
              <div className="mb-3">
                <input
                  type="range"
                  min={0}
                  max={duration}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              {/* Control Buttons */}
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-4">
                  {/* Play/Pause Button */}
                  <button
                    onClick={togglePlay}
                    className="hover:text-blue-400 transition-colors"
                  >
                    {isPlaying ? (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                      </svg>
                    ) : (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </button>

                  {/* Time Display */}
                  <span className="text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>

                  {/* Playback Speed */}
                  <div className="relative">
                    <select
                      value={playbackRate}
                      onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                      className="bg-black bg-opacity-50 text-white text-sm rounded px-2 py-1 border border-gray-600"
                    >
                      {playbackSpeeds.map(speed => (
                        <option key={speed} value={speed} className="bg-black text-white">
                          {speed}x
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Volume Control */}
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-20 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
            )}
              </>
            )}
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p>No video available</p>
            </div>
          </div>
        )}
      </div>

      {/* Video Details */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <h4 className="font-medium text-gray-900 mb-2">Description</h4>
        <p className="text-gray-600 text-sm">{video.description || 'No description available'}</p>
        
        {video.videoUrl && (
          <div className="mt-3">
            <h4 className="font-medium text-gray-900 mb-1">360° Video URL (optional)</h4>
            <p className="text-[#0270DF] text-sm break-all">{video.videoUrl}</p>
            <p className="text-xs text-gray-500 mt-1">Enter a YouTube or other video URL for a 360° tour experience</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSetup;
