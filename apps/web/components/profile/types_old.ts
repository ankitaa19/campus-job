// Types for profile setup components
export interface CollegeProfile {
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

export interface Brochure {
  _id?: string;
  name: string;
  size: number;
  url: string;
  cdnUrl: string;
  uploadedAt?: string;
}

export interface Facility {
  _id?: string;
  name: string;
  icon: string;
  description?: string;
  isActive: boolean;
}

export interface Course {
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
  eligibilityCriteria?: string;
  fees?: {
    tuition: number;
    hostel?: number;
    other?: number;
  };
  seats?: {
    total: number;
    reserved?: {
      sc: number;
      st: number;
      obc: number;
    };
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  imageUrl?: string;
}

export interface Alumni {
  id: string;
  name: string;
  graduationYear: string;
  course: string;
  currentPosition: string;
  company?: string;
  imageUrl?: string;
  linkedinUrl?: string;
  description?: string;
}

export interface VirtualTour {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
}

export interface FormErrors {
  [key: string]: string;
}

export interface CommonProps {
  formatDate: (date: string) => string;
  getImageSrc: (url: string) => string;
}
