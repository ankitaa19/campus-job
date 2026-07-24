export interface CollegeSeed {
  id: string;
  name: string;
  location: string;
  image: string;
  accreditation: string;
  approvalBadges: string[];
  courses: string[];
  annualFees: number;
  category: string;
  institutionType: string;
  affiliation: string;
  averagePackage: string;
  placementRate: number;
  establishedYear: number;
}

export const COLLEGE_SEEDS: CollegeSeed[] = [
  {
    id: 'seed-iit-bombay', name: 'Indian Institute of Technology Bombay', location: 'Mumbai, Maharashtra',
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=400&q=80',
    accreditation: 'NAAC A+', approvalBadges: ['UGC', 'AICTE'], courses: ['B.Tech', 'M.Tech', 'MBA', 'Phd', 'Data Science'],
    annualFees: 220000, category: 'engineering', institutionType: 'Government', affiliation: 'Autonomous', averagePackage: '₹14 LPA', placementRate: 97, establishedYear: 1958,
  },
  {
    id: 'seed-iit-delhi', name: 'Indian Institute of Technology Delhi', location: 'New Delhi, Delhi',
    image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=400&q=80',
    accreditation: 'NAAC A+', approvalBadges: ['UGC', 'AICTE'], courses: ['B.Tech', 'M.Tech', 'MBA', 'Phd', 'Design'],
    annualFees: 230000, category: 'engineering', institutionType: 'Government', affiliation: 'Autonomous', averagePackage: '₹15 LPA', placementRate: 96, establishedYear: 1961,
  },
  {
    id: 'seed-bits-pilani', name: 'Birla Institute of Technology and Science', location: 'Pilani, Rajasthan',
    image: 'https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?auto=format&fit=crop&w=400&q=80',
    accreditation: 'NAAC A', approvalBadges: ['UGC', 'AICTE'], courses: ['B.E.', 'M.E.', 'M.Sc.', 'MBA', 'Phd'],
    annualFees: 485000, category: 'engineering', institutionType: 'Private', affiliation: 'Deemed University', averagePackage: '₹13 LPA', placementRate: 94, establishedYear: 1964,
  },
  {
    id: 'seed-vjti', name: 'Veermata Jijabai Technological Institute', location: 'Mumbai, Maharashtra',
    image: 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?auto=format&fit=crop&w=400&q=80',
    accreditation: 'NAAC A+', approvalBadges: ['UGC', 'AICTE'], courses: ['B.Tech', 'M.Tech', 'MCA', 'Phd'],
    annualFees: 85000, category: 'engineering', institutionType: 'Government', affiliation: 'University of Mumbai', averagePackage: '₹9 LPA', placementRate: 89, establishedYear: 1887,
  },
  {
    id: 'seed-mit-manipal', name: 'Manipal Institute of Technology', location: 'Manipal, Karnataka',
    image: 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?auto=format&fit=crop&w=400&q=80',
    accreditation: 'NAAC A+', approvalBadges: ['UGC', 'AICTE'], courses: ['B.Tech', 'M.Tech', 'MCA', 'MBA', 'Phd'],
    annualFees: 410000, category: 'engineering', institutionType: 'Private', affiliation: 'MAHE', averagePackage: '₹10 LPA', placementRate: 91, establishedYear: 1957,
  },
  {
    id: 'seed-coep', name: 'College of Engineering Pune', location: 'Pune, Maharashtra',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=400&q=80',
    accreditation: 'NAAC A+', approvalBadges: ['UGC', 'AICTE'], courses: ['B.Tech', 'M.Tech', 'M.Plan', 'MBA', 'Phd'],
    annualFees: 120000, category: 'engineering', institutionType: 'Government', affiliation: 'COEP Technological University', averagePackage: '₹11 LPA', placementRate: 93, establishedYear: 1854,
  },
];
