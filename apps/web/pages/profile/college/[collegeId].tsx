import { useState, useEffect, useRef, useMemo, type MouseEvent } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Image from 'next/image';
import Navbar from '../../../components/Navbar';
import CollegeRegistrationNavbar from '../../../components/CollegeRegistrationNavbar';
import Footer from '../../../components/Footer';
import EnquiryModal from '../../../components/EnquiryModal';
import { MapPin, Phone, Mail, Globe, Calendar, Building2, Users, Award, BookOpen, Camera, GraduationCap, Medal, Video, ChevronRight, Clock, BadgeCheck, Flame, Star, Zap, Download, X, MessageCircle, Eye, Coffee, Monitor, Dumbbell, Bed, Trophy, Pencil, Wifi, Pause, Play } from 'lucide-react';


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// WhatsApp Icon Component
const WhatsAppIcon = ({ size = 44, className = "" }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M24 0C10.745 0 0 10.745 0 24c0 4.233 1.097 8.214 3.015 11.675L0.051 47.52l12.207-3.202C15.639 46.297 19.674 48 24 48c13.255 0 24-10.745 24-24S37.255 0 24 0zm0 43.956c-3.913 0-7.579-1.131-10.664-3.081l-0.764-0.454-7.929 2.079 2.116-7.735-0.498-0.791C4.244 31.021 3.044 27.629 3.044 24c0-11.571 9.385-20.956 20.956-20.956S44.956 12.429 44.956 24 35.571 44.956 24 44.956z"
      fill="#25D366"
    />
    <path
      d="M35.372 28.088c-0.629-0.314-3.721-1.837-4.298-2.047-0.577-0.21-0.996-0.314-1.416 0.314-0.419 0.629-1.626 2.047-1.993 2.466-0.367 0.419-0.734 0.472-1.363 0.157-0.629-0.314-2.655-0.978-5.055-3.118-1.869-1.666-3.131-3.724-3.498-4.353-0.367-0.629-0.039-0.969 0.275-1.283 0.283-0.283 0.629-0.734 0.944-1.101 0.314-0.367 0.419-0.629 0.629-1.048 0.21-0.419 0.105-0.786-0.052-1.101-0.157-0.314-1.416-3.407-1.94-4.665-0.511-1.225-1.029-1.059-1.416-1.078-0.367-0.018-0.786-0.022-1.205-0.022s-1.101 0.157-1.678 0.786c-0.577 0.629-2.204 2.152-2.204 5.245s2.257 6.085 2.571 6.504c0.314 0.419 4.429 6.765 10.733 9.487 1.499 0.647 2.669 1.034 3.581 1.323 1.506 0.479 2.877 0.411 3.961 0.249 1.209-0.18 3.721-1.521 4.245-2.989 0.524-1.468 0.524-2.726 0.367-2.989-0.157-0.262-0.577-0.419-1.205-0.734z"
      fill="#25D366"
    />
  </svg>
);

// Social Media Icon Components
const FacebookIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971H15.83c-1.49 0-1.955.931-1.955 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" fill="#1484F3"/>
  </svg>
);

const InstagramIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" fill="#1484F3"/>
  </svg>
);

const TwitterIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" fill="#1484F3"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#1484F3"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="#1484F3"/>
  </svg>
);

interface College {
  _id: string;
  name: string;
  shortName?: string;
  website?: string;
  logo?: string;
  banner?: string;
  previewVideoId?: string;
  establishedYear: number;
  recognizedBy: string;
  collegeType?: string;
  affiliation: string;
  aboutCollege?: string;
  campusDescription?: string;
  facilities?: Facility[];
  achievements?: Achievement[];
  alumni?: Alumni[];
  virtualTours?: VirtualTour[];
  naacRating?: string; // NAAC accreditation rating (A++, A+, A, B++, B+, B, C)
  nirfRanking?: {
    category?: string;
    rank?: number;
    year?: number;
  };
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

interface Facility {
  _id?: string;
  name: string;
  icon: string;
  description?: string;
  isActive: boolean;
}

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
  videoFile?: string;
  locationName?: string;
  thumbnailUrl?: string;
  duration?: number;
  isPreview?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Brochure {
  _id?: string;
  name: string;
  size: number;
  url: string;
  cdnUrl: string;
  uploadedAt?: string;
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
  streamType?: string;
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
  createdAt?: string;
  updatedAt?: string;
}

const CollegePublicPage = () => {
  const router = useRouter();
  const { collegeId } = router.query;
  const [loading, setLoading] = useState(true);
  const [college, setCollege] = useState<College | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [virtualTours, setVirtualTours] = useState<VirtualTour[]>([]);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<VirtualTour | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [videoThumbnails, setVideoThumbnails] = useState<Record<string, string>>({});
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  
  // Pagination states for each section
  const [galleryPage, setGalleryPage] = useState(1);
  const [achievementsPage, setAchievementsPage] = useState(1);
  const [alumniPage, setAlumniPage] = useState(1);
  const [virtualTourPage, setVirtualTourPage] = useState(1);
  const [coursesPage, setCoursesPage] = useState(1);
  
  // State to track expanded offer sections for each course card
  const [expandedOffers, setExpandedOffers] = useState<{ [key: string]: boolean }>({});
  const [expandedScholarships, setExpandedScholarships] = useState<{ [key: string]: boolean }>({});
  
  const ITEMS_PER_PAGE = 12;
  const COURSES_PER_PAGE = 8;

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        setUserRole(payload.role || null);
        
        // Fetch user info based on role
        if (payload.role === 'student') {
          fetchStudentInfo(token);
        } else if (payload.role === 'college') {
          fetchCollegeInfo(token);
        } else if (payload.role === 'employer') {
          fetchEmployerInfo(token);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  const fetchStudentInfo = async (token: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/students/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success || response.data.data) {
        const studentData = response.data.data || response.data;
        setUserName(`${studentData.firstName || 'Student'} ${studentData.lastName || ''}`);
      }
    } catch (error) {
      console.error('Error fetching student info:', error);
    }
  };

  const fetchCollegeInfo = async (token: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/colleges/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data) {
        setUserName(response.data.name || 'College');
      }
    } catch (error) {
      console.error('Error fetching college info:', error);
    }
  };

  const fetchEmployerInfo = async (token: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/recruiters/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data) {
        setUserName(response.data.companyInfo?.name || 'Company');
      }
    } catch (error) {
      console.error('Error fetching employer info:', error);
    }
  };

  // Build thumbnail URL for supported platforms (YouTube/Vimeo)
  const buildThumbnailFromUrl = (url: string): string | null => {
    const trimmed = url.trim();
    // YouTube standard links
    const ytShort = trimmed.match(/^https?:\/\/youtu\.be\/([\w-]{11})/);
    const ytLong = trimmed.match(/(?:v=|\/embed\/|\/shorts\/)([\w-]{11})/);
    const ytId = ytShort?.[1] || ytLong?.[1];
    if (ytId) {
      return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    }
    return null; // Vimeo handled asynchronously
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
              console.warn('Vimeo thumbnail fetch failed:', err);
            }
          }
        }
      }
    };
    if (virtualTours && virtualTours.length > 0) {
      resolveThumbnails();
    }
  }, [virtualTours]);

  useEffect(() => {
    if (collegeId) {
      fetchCollegeProfile();
    }
  }, [collegeId]);

  const fetchCollegeProfile = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/colleges/${collegeId}`);
      const collegeData = response.data;
      
      // Map selectedFacilities to facilities array if needed
      if (collegeData.selectedFacilities && collegeData.selectedFacilities.length > 0) {
        collegeData.facilities = collegeData.selectedFacilities.map((facilityId: string) => ({
          name: facilityId,
          icon: facilityId,
          isActive: true
        }));
      }
      
      setCollege(collegeData);
      
      // Set virtual tours from college data directly
      if (collegeData.virtualTours && collegeData.virtualTours.length > 0) {
        setVirtualTours(collegeData.virtualTours);
      }
      
      // Fetch courses for this college
      await fetchCourses();
    } catch (error) {
      console.error('Error fetching college profile:', error);
      setError('Failed to load college profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      // Fetch all active courses for this college using the college/:collegeId endpoint
      const response = await axios.get(`${API_BASE_URL}/api/courses/college/${collegeId}`);
      setCourses(response.data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    }
  };

  const fetchVirtualTours = async () => {
    // Virtual tours are already fetched with college data
    // This function is kept for compatibility
    return;
  };

  const getImageSrc = (url: string) => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    const base = API_BASE_URL?.replace(/\/$/, '') || '';
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${base}${path}`;
  };

  const isDirectVideoUrl = (url?: string) => {
    if (!url) return false;
    return /\.(mp4|webm|ogg|mov|m3u8)(?:\?.*)?$/i.test(url.trim());
  };

  const isYouTubeUrl = (url?: string) => {
    if (!url) return false;
    return /youtu\.be|youtube\.com/i.test(url);
  };

  const isVimeoUrl = (url?: string) => {
    if (!url) return false;
    return /vimeo\.com/i.test(url);
  };
  
  // Convert YouTube URL to embed format
  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    
    // Already an embed URL
    if (url.includes('youtube.com/embed/')) {
      return url;
    }
    
    // Standard YouTube URL (youtube.com/watch?v=VIDEO_ID)
    const standardMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
    if (standardMatch) {
      return `https://www.youtube.com/embed/${standardMatch[1]}`;
    }
    
    // Short YouTube URL (youtu.be/VIDEO_ID)
    const shortMatch = url.match(/youtu\.be\/([^?]+)/);
    if (shortMatch) {
      return `https://www.youtube.com/embed/${shortMatch[1]}`;
    }
    
    // Return original URL if it doesn't match YouTube patterns (might be another video platform)
    return url;
  };
  
  // Check if URL is a valid YouTube or video platform URL
  const isValidVideoUrl = (url: string) => {
    if (!url) return false;
    return url.includes('youtube.com') || 
           url.includes('youtu.be') || 
           url.includes('vimeo.com') ||
           url.includes('dailymotion.com');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'campus', label: 'Campus', icon: Camera },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'gallery', label: 'Gallery', icon: Camera },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'alumni', label: 'Alumni', icon: Users },
    { id: 'virtual-tour', label: 'Virtual Tour', icon: Video },
  ];

  // Facility icon mapping with SVG icons (matching setup.tsx)
  const getFacilityIcon = (name: string) => {
    const normalizedName = name.toLowerCase().trim();
    
 const iconMap: { [key: string]: JSX.Element } = {
      'cafeteria': <Coffee className="w-8 h-8" />,
      'computer-lab': <Monitor className="w-8 h-8" />,
      'computer lab': <Monitor className="w-8 h-8" />,
      'gym': <Dumbbell className="w-8 h-8" />,
      'hostel': <Bed className="w-8 h-8" />,
      'library': <BookOpen className="w-8 h-8" />,
      'sports': <Trophy className="w-8 h-8" />,
      'sports-complex': <Trophy className="w-8 h-8" />,
      'sports complex': <Trophy className="w-8 h-8" />,
      'stationery': <Pencil className="w-8 h-8" />,
      'wifi-campus': <Wifi className="w-8 h-8" />,
      'wifi campus': <Wifi className="w-8 h-8" />,
      'auditorium': <Building2 className="w-8 h-8" />,
      'laboratory': <Award className="w-8 h-8" />,
      'lab': <Award className="w-8 h-8" />,
    };
    
    return iconMap[normalizedName] || <MapPin className="w-8 h-8" />;
  };
  
  // Format facility name for display
  const formatFacilityName = (name: string) => {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const calculateEnrollmentPercentage = (numberOfSeats: number | string, spotSeats?: number | string) => {
    const total = typeof numberOfSeats === 'string' ? parseInt(numberOfSeats) : numberOfSeats;
    const spots = spotSeats ? (typeof spotSeats === 'string' ? parseInt(spotSeats) : spotSeats) : 0;
    const enrolled = total - spots;
    return total > 0 ? Math.round((enrolled / total) * 100) : 0;
  };

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

  const openImageModal = (imageUrl: string, index: number) => {
    setSelectedImage(imageUrl);
    setCurrentImageIndex(index);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!college?.gallery) return;
    let newIndex = currentImageIndex;
    if (direction === 'prev') {
      newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : college.gallery.length - 1;
    } else {
      newIndex = currentImageIndex < college.gallery.length - 1 ? currentImageIndex + 1 : 0;
    }
    setCurrentImageIndex(newIndex);
    setSelectedImage(college.gallery[newIndex]);
  };

  const getVideoSrc = (tour: VirtualTour) => {
    if (tour.videoFile) {
      return getImageSrc(tour.videoFile);
    }
    if (tour.videoUrl) {
      const trimmedUrl = tour.videoUrl.trim();
      // Convert YouTube links to embed format with API support
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = trimmedUrl.match(youtubeRegex);
      if (match && match[1]) {
        const originParam = typeof window !== 'undefined' ? `&origin=${encodeURIComponent(window.location.origin)}` : '';
        return `https://www.youtube.com/embed/${match[1]}?autoplay=1&loop=1&mute=1&playlist=${match[1]}&enablejsapi=1&controls=0&rel=0${originParam}`;
      }

      // Vimeo embeds
      const vimeoMatch = trimmedUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      if (vimeoMatch && vimeoMatch[1]) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&loop=1&muted=1&background=1`;
      }

      return trimmedUrl;
    }
    return '';
  };

  const previewVideo = useMemo(() => {
    return college?.virtualTours?.find(tour => tour.isPreview) || null;
  }, [college?.virtualTours]);

  const hasPreviewVideo = Boolean(previewVideo);
  const previewVideoUrl = previewVideo?.videoUrl?.trim() || '';
  const previewUsesNativeVideo = Boolean(
    previewVideo && (previewVideo.videoFile || isDirectVideoUrl(previewVideo.videoUrl))
  );
  const previewNativeSrc = previewUsesNativeVideo
    ? (previewVideo?.videoFile ? getVideoSrc(previewVideo) : previewVideoUrl)
    : '';
  const previewEmbedSrc = !previewUsesNativeVideo && previewVideo ? getVideoSrc(previewVideo) : '';
  const previewIframeProvider = !previewUsesNativeVideo && previewVideoUrl
    ? (isYouTubeUrl(previewVideoUrl) ? 'youtube' : isVimeoUrl(previewVideoUrl) ? 'vimeo' : 'other')
    : null;

  useEffect(() => {
    setIsVideoPaused(false);
  }, [previewVideo?._id, previewUsesNativeVideo, previewVideoUrl]);

  const toggleVideoPlayPause = () => {
    if (!previewVideo) return;

    if (previewUsesNativeVideo && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsVideoPaused(false);
      } else {
        videoRef.current.pause();
        setIsVideoPaused(true);
      }
      return;
    }

    if (!previewUsesNativeVideo && iframeRef.current && previewVideoUrl) {
      const iframeWindow = iframeRef.current.contentWindow;
      if (!iframeWindow) return;

      if (previewIframeProvider === 'youtube') {
        setIsVideoPaused(prev => {
          const command = prev ? 'playVideo' : 'pauseVideo';
          iframeWindow.postMessage(
            JSON.stringify({
              event: 'command',
              func: command,
              args: [],
            }),
            '*'
          );
          return !prev;
        });
        return;
      }

      if (previewIframeProvider === 'vimeo') {
        setIsVideoPaused(prev => {
          const method = prev ? 'play' : 'pause';
          iframeWindow.postMessage(
            JSON.stringify({
              method,
            }),
            '*'
          );
          return !prev;
        });
      }
    }
  };

  const handleHeroMediaClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!hasPreviewVideo) return;
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select, [data-prevent-video-toggle]')) {
      return;
    }
    toggleVideoPlayPause();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {isLoggedIn ? (
          <CollegeRegistrationNavbar 
            status="approved" 
            collegeName={userName}
            userRole={userRole as 'student' | 'college' | 'employer'}
          />
        ) : (
          <Navbar />
        )}
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading college information...</p>
        </div>
      </div>
    );
  }

  if (error || !college) {
    return (
      <div className="min-h-screen bg-white">
        {isLoggedIn ? (
          <CollegeRegistrationNavbar 
            status="approved" 
            collegeName={userName}
            userRole={userRole as 'student' | 'college' | 'employer'}
          />
        ) : (
          <Navbar />
        )}
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ {error || 'College not found'}</div>
          <button
            onClick={() => router.push('/search-colleges')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {isLoggedIn ? (
        <CollegeRegistrationNavbar 
          status="approved" 
          collegeName={userName}
          userRole={userRole as 'student' | 'college' | 'employer'}
        />
      ) : (
        <Navbar />
      )}

      {/* Hero Section */}
      <div
        className="relative w-screen h-[calc(100vh-72px)] overflow-hidden bg-gray-900"
        onClickCapture={hasPreviewVideo ? handleHeroMediaClick : undefined}
      >
        {/* Show preview video if available, otherwise show banner image */}
        {hasPreviewVideo ? (
          <>
            {previewUsesNativeVideo ? (
              <video
                ref={videoRef}
                src={previewNativeSrc}
                className="w-full h-full object-cover opacity-90"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <iframe
                ref={iframeRef}
                src={previewEmbedSrc}
                className="w-full h-full object-cover opacity-90"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                style={{ border: 'none' }}
                title={previewVideo?.title || college.name}
              />
            )}

            {/* Pause/Play Button */}
            <button
              onClick={toggleVideoPlayPause}
              className="absolute top-12 right-12 w-11 h-11 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/10 transition-colors z-20"
              aria-label={isVideoPaused ? 'Play video' : 'Pause video'}
            >
              {isVideoPaused ? (
                <Play className="w-5 h-5 text-white fill-white" />
              ) : (
                <div className="flex gap-1">
                  <div className="w-1 h-4 bg-white"></div>
                  <div className="w-1 h-4 bg-white"></div>
                </div>
              )}
            </button>
          </>
        ) : (
          <Image
            src={college.banner ? getImageSrc(college.banner) : "https://images.unsplash.com/photo-1562774053-701939374585?w=1920&auto=format&fit=crop"}
            alt={college.name}
            fill
            className="object-cover opacity-90"
            priority
          />
        )}
        
        {/* Overlay content */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
        
        {/* College Info Card */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full px-12">
          <div className="bg-white/10 backdrop-blur-[25px] border-2 border-white rounded-[32px] p-8">
            <div className="flex items-center justify-between flex-wrap gap-6">
              {/* Left side - Badges */}
              <div className="flex items-center gap-4 flex-wrap">
                {college.recognizedBy && (
                  <div className="bg-white rounded-[30px] px-6 py-3">
                    <span className="text-[#1484F3] font-medium text-base">
                      {college.recognizedBy.split(',').map((recognition, index) => {
                        // Extract short forms from recognition strings
                        const getShortForm = (text: string) => {
                          const upperText = text.trim().toUpperCase();
                          if (upperText.includes('UGC')) return 'UGC';
                          if (upperText.includes('MCI')) return 'MCI';
                          if (upperText.includes('AICTE')) return 'AICTE';
                          if (upperText.includes('NAAC')) return 'NAAC';
                          if (upperText.includes('NBA')) return 'NBA';
                          if (upperText.includes('NCTE')) return 'NCTE';
                          if (upperText.includes('COA')) return 'COA';
                          if (upperText.includes('BCI')) return 'BCI';
                          if (upperText.includes('PCI')) return 'PCI';
                          if (upperText.includes('INC')) return 'INC';
                          // If no match, return first 3-4 characters or original if short
                          return text.trim().length <= 6 ? text.trim() : text.trim().substring(0, 4);
                        };
                        
                        return getShortForm(recognition);
                      }).join(', ')}
                    </span>
                  </div>
                )}
                {college.naacRating && (
                  <div className="bg-white rounded-[30px] px-6 py-3">
                    <span className="text-[#1484F3] font-medium text-base">NAAC {college.naacRating}</span>
                  </div>
                )}
                {college.affiliation && (
                  <div className="bg-white rounded-[30px] px-6 py-3">
                    <span className="text-[#1484F3] font-medium text-base">{college.affiliation}</span>
                  </div>
                )}
                {courses.some(c => c.specialOffers?.spotAdmission?.enabled) && (
                  <div className="bg-white rounded-[30px] px-6 py-3 flex items-center gap-2">
                    <Flame className="w-6 h-6" style={{ stroke: '#CAD2F9', fill: '#FF4141' }} />
                    <span className="text-[#7F3DFF] font-medium text-base">Spot Admission</span>
                  </div>
                )}
              </div>

              {/* Right side - Action Buttons */}
              <div className="flex items-center gap-4">
                {college.brochures && college.brochures.length > 0 && (
                  <a
                    href={college.brochures[0].cdnUrl || college.brochures[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-12 py-3 rounded-md border border-white hover:bg-white/10 transition-colors"
                  >
                    <Download className="w-5 h-5 text-white" />
                    <span className="text-white font-medium">Brochure</span>
                  </a>
                )}
                <button 
                  onClick={() => setShowEnquiryModal(true)}
                  className="px-8 py-3 rounded-md bg-[#1484F3] hover:bg-[#1484F3]/90 transition-colors"
                >
                  <span className="text-white font-medium">Enquire Now</span>
                </button>
                {college.primaryContact?.phone && (
                  <a
                    href={`https://wa.me/${college.primaryContact.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-opacity hover:opacity-80"
                  >
                    <WhatsAppIcon size={44} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* College Name and Location - Top Left */}
        <div className="absolute top-6 left-22 px-12 flex items-center gap-6">
          {college.logo && (
            <div className="w-20 h-20 bg-white rounded-xl overflow-hidden">
              <Image src={getImageSrc(college.logo)} alt={college.name} width={80} height={80} className="object-cover w-full h-full" />
            </div>
          )}
          <div>
            <h1 className="text-white text-2xl font-semibold mb-2">{college.name}</h1>
            <div className="flex items-center gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="text-base">{college.address.city}, {college.address.state}</span>
              </div>
              <div className="h-8 w-px bg-white/50"></div>
              <span className="text-base">{college.establishedYear}</span>
              <div className="h-8 w-px bg-white/50"></div>
              <span className="text-base">{college.collegeType || 'Private'}</span>
              {college.nirfRanking && college.nirfRanking.rank && college.nirfRanking.year && (
                <>
                  <div className="h-8 w-px bg-white/50"></div>
                  <span className="text-base">
                    NIRF #{college.nirfRanking.rank} {college.nirfRanking.category && `(${college.nirfRanking.category})`} {college.nirfRanking.year}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

{/* Scroll Down Indicator */}
<div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/80 cursor-pointer animate-bounce"
     onClick={() => window.scrollTo({ top: window.innerHeight - 72, behavior: 'smooth' })}>
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
</div>
      </div>

   {/* Tab Navigation */}
<div className="w-full mx-auto px-12 mt-6">
  <div className="bg-white/10 backdrop-blur-[25px] border-2 border-[#1484F3] rounded-[32px] p-2 flex items-center justify-center shadow-sm">
    <div className="grid grid-cols-7 w-full">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center justify-center gap-2 py-3 text-base font-medium transition-all duration-200 rounded-[28px] ${
              isActive
                ? 'bg-[#1484F3] text-white shadow-md'
                : 'text-gray-800 hover:text-[#1484F3] hover:bg-white/30'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  </div>
</div>



      {/* Main Content */}
      <div className="mx-auto px-12 py-12">
        {/* About Section */}
        {activeTab === 'overview' && (
          <div className="space-y-16">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">About {college.name}</h2>
              <div className="space-y-4 text-base text-gray-900 leading-relaxed">
                {college.aboutCollege ? (
                  college.aboutCollege.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No description available for this college.</p>
                )}
              </div>
            </section>

            {/* Campus Facilities */}
            {college.facilities && college.facilities.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Campus Facilities</h2>
                  {college.campusDescription && college.facilities.length > 6 && (
                    <button onClick={() => setActiveTab('campus')} className="text-base text-gray-900 hover:text-blue-600">View All</button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {college.facilities.slice(0, 10).map((facility, index) => (
                    <div
                      key={facility._id || index}
                      className="relative p-4 rounded-xl bg-white border-2 border-gray-200 shadow-sm hover:shadow-md transition-all duration-150"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 mb-3 flex items-center justify-center text-gray-700">
                          {getFacilityIcon(facility.name || facility.icon)}
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-full max-w-[110px] truncate mx-auto">
                          {formatFacilityName(facility.name || facility.icon)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Popular Courses */}
            {courses && courses.length > 0 && (
              <section>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Popular Courses</h2>
                  <p className="text-base text-gray-900">Checkout the most visited programs by the students.</p>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div></div>
                  {courses.length > 4 && (
                    <button onClick={() => setActiveTab('courses')} className="text-base text-gray-900 hover:text-blue-600">View All</button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {courses.slice(0, 4).map((course, index) => {
                    const totalSeats = typeof course.numberOfSeats === 'string' ? parseInt(course.numberOfSeats) : (course.numberOfSeats || 0);
                    const spotSeats = course.specialOffers?.spotAdmission?.seats ? 
                      (typeof course.specialOffers.spotAdmission.seats === 'string' ? parseInt(course.specialOffers.spotAdmission.seats) : course.specialOffers.spotAdmission.seats) : 0;
                    const availableSeats = totalSeats > 0 ? (spotSeats || totalSeats) : 0;
                    const enrolledSeats = totalSeats - availableSeats;
                    const enrollmentPercent = totalSeats > 0 ? Math.round((enrolledSeats / totalSeats) * 100) : 0;
                    
                    const totalFee = course.totalFee || course.fees?.tuition || 0;
                    const semesterFee = course.semesterFee || course.fees?.other || 0;
                    
                    const hasSpotAdmission = course.specialOffers?.spotAdmission?.enabled && course.specialOffers?.spotAdmission?.fee;
                    const hasScholarship = course.specialOffers?.meritScholarship?.enabled && course.specialOffers?.meritScholarship?.percent;
                    const hasEarlyBird = course.specialOffers?.earlyBird?.enabled && course.specialOffers?.earlyBird?.discount;
                    const hasAnyOffer = hasSpotAdmission || hasEarlyBird || hasScholarship;
                    
                    return (
                    <div key={course._id || index} className="bg-white border border-[#B8BBD2] rounded-xl overflow-hidden hover:shadow-xl transition-shadow h-[566px] flex flex-col">
                      <div className="p-4 flex flex-col h-full">
                        {/* Header - Fixed Height */}
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
                                <Clock className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{course.duration || '24 months'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <BadgeCheck className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{course.accreditation ? course.accreditation.toUpperCase().replace('-', ' ') : 'UGC APPROVED'}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Top Right Badges - Fixed Height */}
                          <div className="flex flex-col items-end gap-2 flex-shrink-0 w-[100px]">
                            {hasAnyOffer ? (
                              <div className="text-xs font-medium flex items-center gap-1 px-2 py-0.5 rounded-lg bg-green-50 text-green-600 whitespace-nowrap">
                                <span className="w-2 h-2 rounded-full bg-[#00A34B] flex-shrink-0"></span>
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
                            <span className="text-gray-900 font-semibold text-sm">{enrolledSeats}/{totalSeats}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${enrollmentPercent}%` }}
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
                            <div className="text-base font-semibold text-gray-900 truncate">{formatCurrency(totalFee)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-gray-500 text-xs mb-0.5">Semester Fee</div>
                            <div className="text-base font-semibold text-gray-900 truncate">{formatCurrency(semesterFee)}</div>
                          </div>
                        </div>

                        {/* Active Offer - Always show but grayed out when not enabled */}
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
                              <>Spot Price: {formatCurrency(course.specialOffers?.spotAdmission?.fee || 0)} ({spotSeats} left)</>
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

                        {/* Scholarship Available - Always show but grayed out when not enabled */}
                        <div className={`rounded-lg p-3 mb-4 flex flex-col ${hasScholarship ? 'bg-[#7DBEFF] bg-opacity-10 border border-[#0377EB]' : 'bg-gray-100 border border-gray-200'} ${!expandedScholarships[course._id || index] ? 'h-[68px] justify-center' : ''}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <Star className={`w-4 h-4 flex-shrink-0 ${hasScholarship ? 'text-blue-600' : 'text-gray-400'}`} />
                            <span className={`font-semibold text-xs ${hasScholarship ? 'text-[#0377EB]' : 'text-gray-400'} line-clamp-1`}>
                              {hasScholarship ? 'Scholarship Available' : 'No Scholarship Configured'}
                            </span>
                          </div>
                          <div className={`font-medium text-xs ${hasScholarship ? 'text-[#0377EB]' : 'text-gray-400'} ${!expandedScholarships[course._id || index] ? 'line-clamp-2' : ''}`}>
                            {hasScholarship ? (
                              <>Up to {course.specialOffers?.meritScholarship?.percent}% off for students with {course.specialOffers?.meritScholarship?.criteria || '85%+ marks'}</>
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
                            onClick={() => setSelectedCourse(course)}
                            className="flex-1 px-4 py-2.5 text-base font-medium text-[#1383F3] border border-[#1383F3] rounded-md hover:bg-[#1383F3]/5 transition-colors">
                            View Details
                          </button>
                          <button 
                            onClick={() => setShowEnquiryModal(true)}
                            className="flex-1 px-4 py-2.5 text-base font-medium text-white bg-gradient-to-b from-[#2590FB] to-[#0478EB] rounded-md hover:from-[#2590FB]/90 hover:to-[#0478EB]/90 transition-colors">
                            Enroll Now
                          </button>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Gallery */}
            {college.gallery && college.gallery.length > 0 && (
              <section>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Gallery</h2>
                  <p className="text-base text-gray-900">Visuals from the activities that happens across the campus.</p>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div></div>
                  {college.gallery.length > 4 && (
                    <button onClick={() => setActiveTab('gallery')} className="text-base text-gray-900 hover:text-blue-600">View All</button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-6">
                  {college.gallery.slice(0, 4).map((image, index) => (
                    <div 
                      key={index} 
                      className="relative aspect-[3/2] rounded-lg border border-[#B8BBD2] overflow-hidden bg-gray-200 cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => openImageModal(image, index)}
                    >
                      <Image
                        src={getImageSrc(image)}
                        alt={`Gallery image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Achievements */}
            {college.achievements && college.achievements.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Achievements</h2>
                <div className="flex items-center justify-between mb-4">
                  <div></div>
                  {college.achievements.length > 4 && (
                    <button onClick={() => setActiveTab('achievements')} className="text-base text-gray-900 hover:text-blue-600">View All</button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-6">
                  {college.achievements.slice(0, 4).map((achievement, index) => (
                    <div 
                      key={achievement._id || index} 
                      className="bg-white border border-[#B8BBD2] rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setSelectedAchievement(achievement)}
                    >
                      {achievement.photo && (
                        <div className="relative aspect-[3/2] bg-gray-200">
                          <Image
                            src={getImageSrc(achievement.photo)}
                            alt={achievement.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="text-base font-semibold text-[#49454F] mb-2 line-clamp-2">{achievement.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {achievement.description || 'Achievement details'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
{/* Alumni */}
{college.alumni && college.alumni.length > 0 && (
  <section>
    <div className="mb-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Alumni</h2>
      <p className="text-base text-gray-900">
        Take a look at the esteemed Alumni of this college.
      </p>
    </div>

    <div className="flex items-center justify-between mb-4">
      <div></div>
      {college.alumni.length > 4 && (
        <button
          onClick={() => setActiveTab('alumni')}
          className="text-base text-gray-900 hover:text-blue-600"
        >
          View All
        </button>
      )}
    </div>

    <div className="grid grid-cols-4 gap-6">
      {college.alumni.slice(0, 4).map((alumnus, index) => (
        <div
          key={alumnus._id || index}
          className="bg-white border border-[#B8BBD2] rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setSelectedAlumni(alumnus)}
        >
          <div className="relative aspect-[3/2] bg-gray-200">
            {alumnus.image ? (
              <Image
                src={getImageSrc(alumnus.image)}
                alt={alumnus.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-500 to-purple-600">
                <Users className="w-16 h-16 text-white opacity-50" />
              </div>
            )}

            {/* Overlay with name + company */}
            {alumnus.name && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
                <p className="text-sm font-semibold truncate">{alumnus.name}</p>
                {alumnus.company && (
                  <p className="text-xs opacity-90 truncate">{alumnus.company}</p>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </section>
)}


            {/* Virtual Tour */}
            {virtualTours && virtualTours.length > 0 && (
              <section>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Virtual Tour</h2>
                  <p className="text-base text-gray-900">Experience the life at {college.name}</p>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div></div>
                  {virtualTours.length > 4 && (
                    <button onClick={() => setActiveTab('virtual-tour')} className="text-base text-gray-900 hover:text-blue-600">View All</button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-6">
                  {virtualTours.slice(0, 4).map((tour, index) => (
                    <div 
                      key={tour._id || index} 
                      className="relative aspect-[3/2] rounded-lg overflow-hidden bg-gray-200 group cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setSelectedVideo(tour)}
                    >
                      {tour.thumbnailUrl ? (
                        <Image
                          src={getImageSrc(tour.thumbnailUrl)}
                          alt={tour.title}
                          fill
                          className="object-cover"
                        />
                      ) : videoThumbnails[tour._id || ''] ? (
                        <img
                          src={videoThumbnails[tour._id || '']}
                          alt={tour.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : tour.videoFile ? (
                        <video
                          src={getImageSrc(tour.videoFile)}
                          className="absolute inset-0 w-full h-full object-cover"
                          muted
                          preload="metadata"
                          onLoadedMetadata={(e) => {
                            const video = e.target as HTMLVideoElement;
                            try { video.currentTime = 1; } catch {}
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                          <Video className="w-12 h-12 text-white opacity-40" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                        <div className="w-16 h-16 rounded-full bg-white/95 shadow-lg flex items-center justify-center">
                          <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-blue-600 border-b-[12px] border-b-transparent ml-1"></div>
                        </div>
                      </div>
                      {tour.title && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
                          <p className="text-sm font-medium truncate">{tour.title}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Other tab contents */}
        {activeTab === 'campus' && (
          <div className="space-y-8 pb-72">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Campus Description</h2>
              <div className="text-base text-gray-900 leading-relaxed space-y-4">
                {college.campusDescription ? (
                  college.campusDescription.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No campus description available.</p>
                )}
              </div>
            </section>

            {/* All Facilities */}
            {college.facilities && college.facilities.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">All Campus Facilities</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {college.facilities.map((facility, index) => (
                    <div
                      key={facility._id || index}
                      className="relative p-4 rounded-xl bg-white border-2 border-gray-200 shadow-sm hover:shadow-md transition-all duration-150"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 mb-3 flex items-center justify-center text-gray-700">
                          {getFacilityIcon(facility.name || facility.icon)}
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-full max-w-[110px] truncate mx-auto">
                          {formatFacilityName(facility.name || facility.icon)}
                        </span>
                        {facility.description && (
                          <p className="text-xs text-gray-600 mt-2 line-clamp-2">{facility.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">All Courses</h2>
            {courses && courses.length > 0 ? (
              <>
                <div className="grid grid-cols-4 gap-6 min-h-[1200px]">
                  {(() => {
                    const startIdx = (coursesPage - 1) * COURSES_PER_PAGE;
                    const endIdx = startIdx + COURSES_PER_PAGE;
                    const itemsToShow = courses.slice(startIdx, endIdx);
                    const emptySlots = COURSES_PER_PAGE - itemsToShow.length;
                    
                    return (
                      <>
                        {itemsToShow.map((course, index) => {
                  const totalSeats = typeof course.numberOfSeats === 'string' ? parseInt(course.numberOfSeats) : (course.numberOfSeats || 0);
                  const spotSeats = course.specialOffers?.spotAdmission?.seats ? 
                    (typeof course.specialOffers.spotAdmission.seats === 'string' ? parseInt(course.specialOffers.spotAdmission.seats) : course.specialOffers.spotAdmission.seats) : 0;
                  const availableSeats = totalSeats > 0 ? (spotSeats || totalSeats) : 0;
                  const enrolledSeats = totalSeats - availableSeats;
                  const enrollmentPercent = totalSeats > 0 ? Math.round((enrolledSeats / totalSeats) * 100) : 0;
                  
                  const totalFee = course.totalFee || course.fees?.tuition || 0;
                  const semesterFee = course.semesterFee || course.fees?.other || 0;
                  
                  const hasSpotAdmission = course.specialOffers?.spotAdmission?.enabled && course.specialOffers?.spotAdmission?.fee;
                  const hasScholarship = course.specialOffers?.meritScholarship?.enabled && course.specialOffers?.meritScholarship?.percent;
                  const hasEarlyBird = course.specialOffers?.earlyBird?.enabled && course.specialOffers?.earlyBird?.discount;
                  const hasAnyOffer = hasSpotAdmission || hasEarlyBird || hasScholarship;
                  
                  return (
                    <div key={course._id || (startIdx + index)} className="bg-white border border-[#B8BBD2] rounded-xl overflow-hidden hover:shadow-xl transition-shadow h-[566px] flex flex-col">
                      <div className="p-4 flex flex-col h-full">
                        {/* Header - Fixed Height */}
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
                                <Clock className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{course.duration || '24 months'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <BadgeCheck className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{course.accreditation ? course.accreditation.toUpperCase().replace('-', ' ') : 'UGC APPROVED'}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Top Right Badges - Fixed Height */}
                          <div className="flex flex-col items-end gap-2 flex-shrink-0 w-[100px]">
                            {hasAnyOffer ? (
                              <div className="text-xs font-medium flex items-center gap-1 px-2 py-0.5 rounded-lg bg-green-50 text-green-600 whitespace-nowrap">
                                <span className="w-2 h-2 rounded-full bg-[#00A34B] flex-shrink-0"></span>
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
                            <span className="text-gray-900 font-semibold text-sm">{enrolledSeats}/{totalSeats}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${enrollmentPercent}%` }}
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
                            <div className="text-base font-semibold text-gray-900 truncate">{formatCurrency(totalFee)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-gray-500 text-xs mb-0.5">Semester Fee</div>
                            <div className="text-base font-semibold text-gray-900 truncate">{formatCurrency(semesterFee)}</div>
                          </div>
                        </div>

                        {/* Active Offer - Always show but grayed out when not enabled */}
                        <div className={`rounded-lg p-3 mb-3 flex flex-col ${hasSpotAdmission ? 'bg-[#FFC383] bg-opacity-10 border border-[#FF8400]' : 'bg-gray-100 border border-gray-200'} ${!expandedOffers[(course._id || (startIdx + index))] ? 'h-[68px] justify-center' : ''}`}>
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
                          <div className={`font-medium text-sm ${hasSpotAdmission ? 'text-[#FF8400]' : 'text-gray-400'} ${!expandedOffers[(course._id || (startIdx + index))] ? 'line-clamp-1' : ''}`}>
                            {hasSpotAdmission ? (
                              <>Spot Price: {formatCurrency(course.specialOffers?.spotAdmission?.fee || 0)} ({spotSeats} left)</>
                            ) : (
                              'Not available at this time'
                            )}
                          </div>
                          {(hasSpotAdmission || !hasSpotAdmission) && (course.specialOffers?.spotAdmission?.fee || !hasSpotAdmission) && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setExpandedOffers(prev => ({ ...prev, [(course._id || (startIdx + index))]: !prev[(course._id || (startIdx + index))] })); }}
                              className={`text-xs ${hasSpotAdmission ? 'text-[#C66803]' : 'text-gray-400'} hover:underline mt-1 text-left`}
                            >
                              {expandedOffers[(course._id || (startIdx + index))] ? 'View Less' : 'View More'}
                            </button>
                          )}
                        </div>

                        {/* Scholarship Available - Always show but grayed out when not enabled */}
                        <div className={`rounded-lg p-3 mb-4 flex flex-col ${hasScholarship ? 'bg-[#7DBEFF] bg-opacity-10 border border-[#0377EB]' : 'bg-gray-100 border border-gray-200'} ${!expandedScholarships[(course._id || (startIdx + index))] ? 'h-[68px] justify-center' : ''}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <Star className={`w-4 h-4 flex-shrink-0 ${hasScholarship ? 'text-blue-600' : 'text-gray-400'}`} />
                            <span className={`font-semibold text-xs ${hasScholarship ? 'text-[#0377EB]' : 'text-gray-400'} line-clamp-1`}>
                              {hasScholarship ? 'Scholarship Available' : 'No Scholarship Configured'}
                            </span>
                          </div>
                          <div className={`font-medium text-xs ${hasScholarship ? 'text-[#0377EB]' : 'text-gray-400'} ${!expandedScholarships[(course._id || (startIdx + index))] ? 'line-clamp-2' : ''}`}>
                            {hasScholarship ? (
                              <>Up to {course.specialOffers?.meritScholarship?.percent}% off for students with {course.specialOffers?.meritScholarship?.criteria || '85%+ marks'}</>
                            ) : (
                              'Not available at this time'
                            )}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setExpandedScholarships(prev => ({ ...prev, [(course._id || (startIdx + index))]: !prev[(course._id || (startIdx + index))] })); }}
                            className={`text-xs ${hasScholarship ? 'text-[#0377EB]' : 'text-gray-400'} hover:underline mt-1 text-left`}
                          >
                            {expandedScholarships[(course._id || (startIdx + index))] ? 'View Less' : 'View More'}
                          </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4 mt-auto">
                          <button 
                            onClick={() => setSelectedCourse(course)}
                            className="flex-1 px-4 py-2.5 text-base font-medium text-[#1383F3] border border-[#1383F3] rounded-md hover:bg-[#1383F3]/5 transition-colors">
                            View Details
                          </button>
                          <button 
                            onClick={() => setShowEnquiryModal(true)}
                            className="flex-1 px-4 py-2.5 text-base font-medium text-white bg-gradient-to-b from-[#2590FB] to-[#0478EB] rounded-md hover:from-[#2590FB]/90 hover:to-[#0478EB]/90 transition-colors">
                            Enroll Now
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                        {Array.from({ length: emptySlots }).map((_, index) => (
                          <div
                            key={`empty-${index}`}
                            className="bg-white rounded-xl"
                          >
                            <div className="p-6 min-h-[600px]" />
                          </div>
                        ))}
                      </>
                    );
                  })()}
                </div>
                
                {/* Pagination */}
                {courses.length > COURSES_PER_PAGE && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setCoursesPage(prev => Math.max(1, prev - 1))}
                      disabled={coursesPage === 1}
                      className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <div className="flex gap-2">
                      {Array.from({ length: Math.ceil(courses.length / COURSES_PER_PAGE) }).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCoursesPage(idx + 1)}
                          className={`w-10 h-10 rounded-lg ${
                            coursesPage === idx + 1
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setCoursesPage(prev => Math.min(Math.ceil(courses.length / COURSES_PER_PAGE), prev + 1))}
                      disabled={coursesPage === Math.ceil(courses.length / COURSES_PER_PAGE)}
                      className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">No courses available at this time.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Photo Gallery</h2>
            {college.gallery && college.gallery.length > 0 ? (
              <>
                <div className="grid grid-cols-4 gap-6 min-h-[600px]">
                  {(() => {
                    const startIdx = (galleryPage - 1) * ITEMS_PER_PAGE;
                    const endIdx = startIdx + ITEMS_PER_PAGE;
                    const itemsToShow = college.gallery.slice(startIdx, endIdx);
                    const emptySlots = ITEMS_PER_PAGE - itemsToShow.length;
                    
                    return (
                      <>
                        {itemsToShow.map((image, index) => (
                          <div
                            key={startIdx + index}
                            className="relative aspect-[3/2] cursor-pointer overflow-hidden rounded-lg border border-[#B8BBD2] bg-gray-200 hover:shadow-lg transition-shadow"
                            onClick={() => openImageModal(image, startIdx + index)}
                          >
                            <Image
                              src={getImageSrc(image)}
                              alt={`Gallery image ${startIdx + index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                        {Array.from({ length: emptySlots }).map((_, index) => (
                          <div
                            key={`empty-${index}`}
                            className="relative aspect-[3/2] rounded-lg"
                          />
                        ))}
                      </>
                    );
                  })()}
                </div>
                
                {/* Pagination */}
                {college.gallery.length > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setGalleryPage(prev => Math.max(1, prev - 1))}
                      disabled={galleryPage === 1}
                      className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <div className="flex gap-2">
                      {Array.from({ length: Math.ceil(college.gallery.length / ITEMS_PER_PAGE) }).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setGalleryPage(idx + 1)}
                          className={`w-10 h-10 rounded-lg ${
                            galleryPage === idx + 1
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setGalleryPage(prev => Math.min(Math.ceil(college.gallery.length / ITEMS_PER_PAGE), prev + 1))}
                      disabled={galleryPage === Math.ceil(college.gallery.length / ITEMS_PER_PAGE)}
                      className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <Camera className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">No gallery images available.</p>
              </div>
            )}
          </div>
        )}

{activeTab === 'achievements' && (
  <div className="space-y-8">
    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
      College Achievements
    </h2>

    {college.achievements && college.achievements.length > 0 ? (
      <>
        <div className="grid grid-cols-4 gap-6 min-h-[900px]">
          {(() => {
            const startIdx = (achievementsPage - 1) * ITEMS_PER_PAGE;
            const endIdx = startIdx + ITEMS_PER_PAGE;
            const itemsToShow = college.achievements.slice(startIdx, endIdx);
            const emptySlots = ITEMS_PER_PAGE - itemsToShow.length;
            
            return (
              <>
                {itemsToShow.map((achievement, index) => (
                  <div
                    key={achievement._id || (startIdx + index)}
                    className="bg-white border border-[#B8BBD2] rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedAchievement(achievement)}
                  >
                    {/* Image area — consistent size */}
                    <div className="relative aspect-[3/2] bg-gray-200">
                      {achievement.photo ? (
                        <Image
                          src={getImageSrc(achievement.photo)}
                          alt={achievement.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-500 to-purple-600">
                          <Award className="w-12 h-12 text-white opacity-60" />
                        </div>
                      )}
                    </div>

                    {/* Text area with Read more */}
                    <div className="p-4">
                      <h3 className="text-base font-semibold text-[#49454F] mb-2 line-clamp-2">
                        {achievement.title}
                      </h3>

                      <p className="text-sm text-gray-600 line-clamp-3">
                        {achievement.description
                          ? `${achievement.description.slice(0, 80)}${
                              achievement.description.length > 80 ? '...' : ''
                            }`
                          : 'Achievement details'}
                      </p>

                      {/* Read More CTA */}
                      {achievement.description && achievement.description.length > 80 && (
                        <button
                          onClick={() => setSelectedAchievement(achievement)}
                          className="mt-2 text-sm font-medium text-blue-600 hover:underline"
                        >
                          Read more →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {Array.from({ length: emptySlots }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="rounded-lg aspect-[3/2] flex items-center justify-center"
                  >
                    <div className="relative aspect-[3/2] w-full" />
                  </div>
                ))}
              </>
            );
          })()}
        </div>
        
        {/* Pagination */}
        {college.achievements.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setAchievementsPage(prev => Math.max(1, prev - 1))}
              disabled={achievementsPage === 1}
              className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <div className="flex gap-2">
              {Array.from({ length: Math.ceil(college.achievements.length / ITEMS_PER_PAGE) }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setAchievementsPage(idx + 1)}
                  className={`w-10 h-10 rounded-lg ${
                    achievementsPage === idx + 1
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setAchievementsPage(prev => Math.min(Math.ceil(college.achievements.length / ITEMS_PER_PAGE), prev + 1))}
              disabled={achievementsPage === Math.ceil(college.achievements.length / ITEMS_PER_PAGE)}
              className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </>
    ) : (
      <div className="text-center py-20">
        <Award className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-600">No achievements available.</p>
      </div>
    )}
  </div>
)}


        {activeTab === 'alumni' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Alumni</h2>
            {college.alumni && college.alumni.length > 0 ? (
              <>
                <div className="grid grid-cols-4 gap-6 min-h-[600px]">
                  {(() => {
                    const startIdx = (alumniPage - 1) * ITEMS_PER_PAGE;
                    const endIdx = startIdx + ITEMS_PER_PAGE;
                    const itemsToShow = college.alumni.slice(startIdx, endIdx);
                    const emptySlots = ITEMS_PER_PAGE - itemsToShow.length;
                    
                    return (
                      <>
                        {itemsToShow.map((alumnus, index) => (
                          <div
                            key={alumnus._id || (startIdx + index)}
                            className="bg-white border border-[#B8BBD2] rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => setSelectedAlumni(alumnus)}
                          >
                            <div className="relative aspect-[3/2] bg-gray-200">
                              {alumnus.image ? (
                                <Image
                                  src={getImageSrc(alumnus.image)}
                                  alt={alumnus.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="relative aspect-[3/2] flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                                  <Users className="w-16 h-16 text-white opacity-50" />
                                </div>
                              )}
                              {/* Overlay with name + company */}
                              {alumnus.name && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
                                  <p className="text-sm font-semibold truncate">{alumnus.name}</p>
                                  {alumnus.company && (
                                    <p className="text-xs opacity-90 truncate">{alumnus.company}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {Array.from({ length: emptySlots }).map((_, index) => (
                          <div
                            key={`empty-${index}`}
                            className="bg-white rounded-lg overflow-hidden"
                          >
                            <div className="relative aspect-[3/2]" />
                          </div>
                        ))}
                      </>
                    );
                  })()}
                </div>
                
                {/* Pagination */}
                {college.alumni.length > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setAlumniPage(prev => Math.max(1, prev - 1))}
                      disabled={alumniPage === 1}
                      className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <div className="flex gap-2">
                      {Array.from({ length: Math.ceil(college.alumni.length / ITEMS_PER_PAGE) }).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setAlumniPage(idx + 1)}
                          className={`w-10 h-10 rounded-lg ${
                            alumniPage === idx + 1
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setAlumniPage(prev => Math.min(Math.ceil(college.alumni.length / ITEMS_PER_PAGE), prev + 1))}
                      disabled={alumniPage === Math.ceil(college.alumni.length / ITEMS_PER_PAGE)}
                      className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">No alumni profiles available.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'virtual-tour' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Virtual Campus Tour</h2>
            {virtualTours && virtualTours.length > 0 ? (
              <>
                <div className="grid grid-cols-4 gap-6 min-h-[600px]">
                  {(() => {
                    const startIdx = (virtualTourPage - 1) * ITEMS_PER_PAGE;
                    const endIdx = startIdx + ITEMS_PER_PAGE;
                    const itemsToShow = virtualTours.slice(startIdx, endIdx);
                    const emptySlots = ITEMS_PER_PAGE - itemsToShow.length;
                    
                    return (
                      <>
                        {itemsToShow.map((tour, index) => (
                          <div
                            key={tour._id || (startIdx + index)}
                            className="relative aspect-[3/2] rounded-lg overflow-hidden bg-gray-200 group cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => setSelectedVideo(tour)}
                          >
                            {tour.thumbnailUrl ? (
                              <Image
                                src={getImageSrc(tour.thumbnailUrl)}
                                alt={tour.title}
                                fill
                                className="object-cover"
                              />
                            ) : videoThumbnails[tour._id || ''] ? (
                              <img
                                src={videoThumbnails[tour._id || '']}
                                alt={tour.title}
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                            ) : tour.videoFile ? (
                              <video
                                src={getImageSrc(tour.videoFile)}
                                className="absolute inset-0 w-full h-full object-cover"
                                muted
                                preload="metadata"
                                onLoadedMetadata={(e) => {
                                  const video = e.target as HTMLVideoElement;
                                  try { video.currentTime = 1; } catch {}
                                }}
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                                <Video className="w-12 h-12 text-white opacity-40" />
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                              <div className="w-16 h-16 rounded-full bg-white/95 shadow-lg flex items-center justify-center">
                                <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-blue-600 border-b-[12px] border-b-transparent ml-1"></div>
                              </div>
                            </div>
                            {tour.title && (
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
                                <p className="text-sm font-medium truncate">{tour.title}</p>
                              </div>
                            )}
                          </div>
                        ))}
                        {Array.from({ length: emptySlots }).map((_, index) => (
                          <div
                            key={`empty-${index}`}
                            className="relative aspect-[3/2] rounded-lg"
                          />
                        ))}
                      </>
                    );
                  })()}
                </div>
                
                {/* Pagination */}
                {virtualTours.length > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setVirtualTourPage(prev => Math.max(1, prev - 1))}
                      disabled={virtualTourPage === 1}
                      className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <div className="flex gap-2">
                      {Array.from({ length: Math.ceil(virtualTours.length / ITEMS_PER_PAGE) }).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setVirtualTourPage(idx + 1)}
                          className={`w-10 h-10 rounded-lg ${
                            virtualTourPage === idx + 1
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setVirtualTourPage(prev => Math.min(Math.ceil(virtualTours.length / ITEMS_PER_PAGE), prev + 1))}
                      disabled={virtualTourPage === Math.ceil(virtualTours.length / ITEMS_PER_PAGE)}
                      className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <Video className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">No virtual tours available.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="relative max-w-[1720px] mx-auto px-6 mb-20">
        <div className="relative rounded-[80px] overflow-hidden bg-[#1484F3] p-20">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-5xl font-bold text-white mb-6">Book A Session With The College</h2>
            <p className="text-xl text-white/90 mb-8">
              Have queries regarding colleges? Why spend time in searching when CampusPe can do it for you? Register with CampusPe today
            </p>
            <button 
              onClick={() => setShowEnquiryModal(true)}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
              Enquire Now
            </button>
          </div>
          <div className="absolute right-20 bottom-0 top-0 flex flex-col justify-center">
            <div className="text-white">
              <h3 className="text-2xl font-semibold mb-4">Address</h3>
              <p className="text-white/90 max-w-sm mb-8">
                {college.address.street}, {college.address.city}, {college.address.state} {college.address.zipCode}
              </p>
              <p className="text-white/90 max-w-sm mb-8">
                Phone: {college.primaryContact?.phone || 'N/A'} | Email: {college.primaryContact?.email || 'N/A'}
              </p>
              {college.socialMedia && (
                <div>
                  <h3 className="text-2xl font-semibold mb-4">Connect on Social Media</h3>
                  <div className="flex gap-4">
                    {college.socialMedia.facebook && (
                      <a href={college.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-[#FFFFFF] hover:bg-[#FFFFFF]/90 flex items-center justify-center transition-colors">
                        <FacebookIcon />
                      </a>
                    )}
                    {college.socialMedia.instagram && (
                      <a href={college.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-[#FFFFFF] hover:bg-[#FFFFFF]/90 flex items-center justify-center transition-colors">
                        <InstagramIcon />
                      </a>
                    )}
                    {college.socialMedia.twitter && (
                      <a href={college.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-[#FFFFFF] hover:bg-[#FFFFFF]/90 flex items-center justify-center transition-colors">
                        <TwitterIcon />
                      </a>
                    )}
                    {college.socialMedia.website && (
                      <a href={college.socialMedia.website} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-[#FFFFFF] hover:bg-[#FFFFFF]/90 flex items-center justify-center transition-colors">
                        <YouTubeIcon />
                      </a>
                    )}
                    {college.socialMedia.linkedin && (
                      <a href={college.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-[#FFFFFF] hover:bg-[#FFFFFF]/90 flex items-center justify-center transition-colors">
                        <LinkedInIcon />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <button
            className="absolute left-4 text-white hover:text-gray-300"
            onClick={(e) => { e.stopPropagation(); navigateImage('prev'); }}
          >
            <ChevronRight className="w-12 h-12 rotate-180" />
          </button>
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full" onClick={(e) => e.stopPropagation()}>
            <Image
              src={getImageSrc(selectedImage)}
              alt="Gallery image"
              fill
              className="object-contain"
            />
          </div>
          <button
            className="absolute right-4 text-white hover:text-gray-300"
            onClick={(e) => { e.stopPropagation(); navigateImage('next'); }}
          >
            <ChevronRight className="w-12 h-12" />
          </button>
        </div>
      )}

      {/* Achievement Modal */}
      {selectedAchievement && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedAchievement(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-2xl font-semibold">Achievement Details</h3>
              <button onClick={() => setSelectedAchievement(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            {selectedAchievement.photo && (
              <div className="relative aspect-video w-full">
                <Image src={getImageSrc(selectedAchievement.photo)} alt={selectedAchievement.title} fill className="object-cover" />
              </div>
            )}
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-2xl font-bold">{selectedAchievement.title}</h2>
                {selectedAchievement.year && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">{selectedAchievement.year}</span>
                )}
              </div>
              <p className="text-gray-700 text-lg leading-relaxed">{selectedAchievement.description || 'No description available.'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Alumni Modal */}
      {selectedAlumni && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedAlumni(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-2xl font-semibold">Alumni Details</h3>
              <button onClick={() => setSelectedAlumni(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            {selectedAlumni.image && (
              <div className="relative aspect-video w-full">
                <Image src={getImageSrc(selectedAlumni.image)} alt={selectedAlumni.name} fill className="object-cover" />
              </div>
            )}
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-2xl font-bold">{selectedAlumni.name}</h2>
                {selectedAlumni.graduationYear && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Class of {selectedAlumni.graduationYear}</span>
                )}
              </div>
              {selectedAlumni.company && (
                <p className="text-lg font-medium text-blue-600 mb-3">{selectedAlumni.company}</p>
              )}
              {selectedAlumni.qualification && (
                <p className="text-gray-700 mb-3"><span className="font-medium">Qualification:</span> {selectedAlumni.qualification}</p>
              )}
              {selectedAlumni.email && (
                <p className="text-gray-700 mb-3"><span className="font-medium">Email:</span> {selectedAlumni.email}</p>
              )}
              {selectedAlumni.about && (
                <div className="mt-4">
                  <p className="text-gray-700 text-lg leading-relaxed">{selectedAlumni.about}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedVideo(null)}>
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            onClick={() => setSelectedVideo(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <div className="relative max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="aspect-video w-full">
              {selectedVideo.videoUrl && isValidVideoUrl(selectedVideo.videoUrl) ? (
                <iframe
                  src={getYouTubeEmbedUrl(selectedVideo.videoUrl)}
                  className="w-full h-full rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : selectedVideo.videoFile ? (
                <video
                  src={getImageSrc(selectedVideo.videoFile)}
                  controls
                  autoPlay
                  className="w-full h-full rounded-lg bg-black"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-lg text-white">
                  <div className="text-center">
                    <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No video available</p>
                  </div>
                </div>
              )}
            </div>
            {selectedVideo.title && (
              <div className="mt-4 px-2">
                <h3 className="text-white font-semibold text-xl mb-2">{selectedVideo.title}</h3>
                {selectedVideo.description && (
                  <p className="text-white/90 text-base leading-relaxed whitespace-pre-wrap">{selectedVideo.description}</p>
                )}
                {selectedVideo.locationName && (
                  <div className="flex items-center gap-2 mt-3 text-white/70 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedVideo.locationName}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Course Details Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900 mb-1">
                  {selectedCourse.name}
                </h2>
                {selectedCourse.streamType && (
                  <p className="text-2xl font-medium text-[#0A0A0A] opacity-50 mb-2">{selectedCourse.streamType}</p>
                )}
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <span className="font-medium">{selectedCourse.code || 'BCA'}</span>
                  <span>•</span>
                  <span>{selectedCourse.category ? selectedCourse.category.charAt(0).toUpperCase() + selectedCourse.category.slice(1) : 'Undergraduate'}</span>
                  <span>•</span>
                  <span>{selectedCourse.duration} months</span>
                  <span>•</span>
                  <span>{selectedCourse.accreditation ? selectedCourse.accreditation.split('-').map((w: string) => w.charAt(0).toUpperCase()+w.slice(1)).join(' ') : 'UGC Approved'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                  Active
                </span>
                <button onClick={() => setSelectedCourse(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
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
                      <div className="text-gray-900">{selectedCourse.description || 'Comprehensive program covering programming, web development, and software engineering.'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Eligibility:</div>
                      <div className="text-gray-900">{selectedCourse.eligibilityCriteria || '12th pass with minimum 50% marks'}</div>
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
                    {(() => {
                      const seats = typeof selectedCourse.numberOfSeats === 'string' ? parseInt(selectedCourse.numberOfSeats) : (selectedCourse.numberOfSeats || 0);
                      const spotSeats = selectedCourse.specialOffers?.spotAdmission?.seats ? 
                        (typeof selectedCourse.specialOffers.spotAdmission.seats === 'string' ? parseInt(selectedCourse.specialOffers.spotAdmission.seats) : selectedCourse.specialOffers.spotAdmission.seats) : 0;
                      const availableSeats = seats > 0 ? (spotSeats || seats) : 0;
                      const enrolled = seats - availableSeats;
                      const fillPct = seats > 0 ? Math.min(100, Math.round((enrolled / seats) * 100)) : 0;
                      
                      return (
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
                      );
                    })()}
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
                      <div className="text-sm font-semibold text-gray-900">₹ {selectedCourse.totalFee ? (typeof selectedCourse.totalFee === 'number' ? selectedCourse.totalFee.toLocaleString() : parseInt(selectedCourse.totalFee).toLocaleString()) : '200000'}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-600">Per Semester Fee:</div>
                      <div className="text-sm font-semibold text-gray-900">₹ {selectedCourse.semesterFee ? (typeof selectedCourse.semesterFee === 'number' ? selectedCourse.semesterFee.toLocaleString() : parseInt(selectedCourse.semesterFee).toLocaleString()) : '50000'}</div>
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
                    {selectedCourse.specialOffers?.earlyBird?.enabled && (
                      <span className="ml-auto inline-flex items-center px-3 py-1 bg-gradient-to-r from-pink-500 to-red-500 text-white text-sm font-medium rounded-full">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M13 9h8L11 24v-9H4l9-15v9z"/>
                        </svg>
                        {selectedCourse.specialOffers?.earlyBird?.discount}% OFF
                      </span>
                    )}
                  </h3>
                  <div className="space-y-2 text-sm">
                    {selectedCourse.specialOffers?.earlyBird?.enabled && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Early Bird Discount</span>
                        <span className="text-gray-600">Valid Until: {selectedCourse.specialOffers?.earlyBird?.validUntil ? new Date(selectedCourse.specialOffers.earlyBird.validUntil).toLocaleDateString('en-GB') : '-'}</span>
                      </div>
                    )}
                    {selectedCourse.specialOffers?.spotAdmission?.enabled && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Spot Admission</span>
                        <span className="text-gray-900">₹ {(selectedCourse.specialOffers?.spotAdmission?.fee || 0).toLocaleString('en-IN')} • Seats {selectedCourse.specialOffers?.spotAdmission?.seats || 0}</span>
                      </div>
                    )}
                    {!selectedCourse.specialOffers?.earlyBird?.enabled && !selectedCourse.specialOffers?.spotAdmission?.enabled && (
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
                  {selectedCourse.specialOffers?.meritScholarship?.enabled ? (
                    <div className="space-y-3 text-sm">
                      <div className="text-gray-700">Merit Scholarship: <span className="text-gray-900">Available for students with {selectedCourse.specialOffers?.meritScholarship?.criteria}</span></div>
                      <div>
                        <span className="inline-block px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-full">{selectedCourse.specialOffers?.meritScholarship?.percent}% OFF</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500">No scholarship available</div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedCourse(null)}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enquiry Modal */}
      {college && (
        <EnquiryModal
          isOpen={showEnquiryModal}
          onClose={() => setShowEnquiryModal(false)}
          collegeId={college._id}
          courses={courses}
        />
      )}

      <Footer />
    </div>
  );
};

export default CollegePublicPage;
