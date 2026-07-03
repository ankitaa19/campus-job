export interface CampusRecruitmentCollege {
  id: string;
  name: string;
  location: string;
  affiliation: string;
  totalStudents: number;
  studentsByYear: Array<{
    label: string;
    count: number;
  }>;
  programs: string[];
  specializations: string[];
}

export const campusRecruitmentColleges: CampusRecruitmentCollege[] = [
  {
    id: 'iit-delhi',
    name: 'IIT Delhi',
    location: 'Delhi',
    affiliation: 'Delhi University',
    totalStudents: 1250,
    studentsByYear: [
      { label: '2024', count: 320 },
      { label: '2025', count: 345 },
    ],
    programs: ['B.Tech', 'M.Tech'],
    specializations: ['Computer Science', 'Electronics', 'Mechanical', 'Chemical Engineering'],
  },
  {
    id: 'iit-bombay',
    name: 'IIT Bombay',
    location: 'Mumbai',
    affiliation: 'Mumbai University',
    totalStudents: 1250,
    studentsByYear: [
      { label: '2024', count: 320 },
      { label: '2025', count: 345 },
    ],
    programs: ['B.Tech', 'M.Tech'],
    specializations: ['Computer Science', 'Electronics', 'Mechanical', 'Civil Engineering'],
  },
  {
    id: 'iit-kanpur',
    name: 'IIT Kanpur',
    location: 'Kanpur',
    affiliation: 'Bengaluru University',
    totalStudents: 1250,
    studentsByYear: [
      { label: '2024', count: 320 },
      { label: '2025', count: 345 },
    ],
    programs: ['B.Tech', 'M.Tech'],
    specializations: ['Computer Science', 'Electronics', 'Mechanical', 'Aerospace'],
  },
  {
    id: 'iit-madras',
    name: 'IIT Madras',
    location: 'Chennai',
    affiliation: 'Anna University',
    totalStudents: 1190,
    studentsByYear: [
      { label: '2024', count: 280 },
      { label: '2025', count: 310 },
    ],
    programs: ['B.Tech', 'M.Tech'],
    specializations: ['Computer Science', 'Electronics', 'Mechanical', 'Metallurgy'],
  },
  {
    id: 'iit-kharagpur',
    name: 'IIT Kharagpur',
    location: 'Kharagpur',
    affiliation: 'West Bengal University',
    totalStudents: 1250,
    studentsByYear: [
      { label: '2024', count: 350 },
      { label: '2025', count: 380 },
    ],
    programs: ['B.Tech', 'M.Tech'],
    specializations: ['Computer Science', 'Electronics', 'Mechanical', 'Mining'],
  },
  {
    id: 'iit-roorkee',
    name: 'IIT Roorkee',
    location: 'Roorkee',
    affiliation: 'Uttarakhand University',
    totalStudents: 1210,
    studentsByYear: [
      { label: '2024', count: 290 },
      { label: '2025', count: 320 },
    ],
    programs: ['B.Tech', 'M.Tech'],
    specializations: ['Computer Science', 'Electronics', 'Mechanical', 'Civil Engineering'],
  },
];

