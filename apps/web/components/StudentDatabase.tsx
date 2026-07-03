import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Briefcase, 
  Trophy, 
  Plus, 
  Upload, 
  Download, 
  Search,
  ChevronDown,
  Edit,
  Eye,
  X,
  MessageCircle,
  CheckCircle,
  FileDown,
  ExternalLink,
  AlertCircle,
  Check,
  Loader2
} from 'lucide-react';
import { toast } from './ui/sonner';

interface StudentDatabaseProps {
  className?: string;
}

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  course: string;
  academicYear: string;
  status: 'Eligible' | 'Not Eligible' | 'Placed';
  authenticationStatus: 'Verified' | 'Pending' | 'Missing Docs';
  lastUpdate: string;
  email: string;
  phone: string;
  batch: string;
  skills?: string[];
  documents?: Document[];
}

interface Document {
  name: string;
  status: 'Verified' | 'Pending' | 'Rejected';
  url?: string;
  selected?: boolean;
}

interface ImportError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  errors: ImportError[];
  duplicates: number;
}

interface FilterSelectProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  options?: string[];
}

const FilterSelect: React.FC<FilterSelectProps & { 
  filterId: string; 
  openDropdown: string | null; 
  setOpenDropdown: (id: string | null) => void 
}> = ({ 
  placeholder, 
  value, 
  onChange, 
  options = [],
  filterId,
  openDropdown,
  setOpenDropdown
}) => {
  const isOpen = openDropdown === filterId;
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setOpenDropdown]);

  const handleToggle = () => {
    setOpenDropdown(isOpen ? null : filterId);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="flex items-center justify-between w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[160px] shadow-sm shadow-gray-200/50"
        style={{
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 2px 0 6px -1px rgba(0, 0, 0, 0.05)'
        }}
      >
        <span className={value && value !== placeholder ? "text-gray-900" : "text-gray-600"}>
          {value && value !== placeholder ? value : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-20"
          style={{
            boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div className="py-2">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => {
                  onChange(option === placeholder ? "" : option);
                  setOpenDropdown(null);
                }}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors duration-150 ${
                  value === option || (option === placeholder && (!value || value === placeholder))
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StudentDatabase: React.FC<StudentDatabaseProps> = ({ className = "" }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [academicYearFilter, setAcademicYearFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [authStatusFilter, setAuthStatusFilter] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'documents'>('overview');
  const [documentModal, setDocumentModal] = useState<{open: boolean, document?: string}>({open: false});
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [studentData, setStudentData] = useState<Student[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const studentsPerPage = 10;

  // Initialize student data
  useEffect(() => {
    if (studentData.length === 0) {
      setStudentData(initialStudentData);
    }
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, courseFilter, academicYearFilter, statusFilter, authStatusFilter]);

  const initialStudentData: Student[] = [
    {
      id: '1',
      name: 'Rahul Sharma',
      rollNumber: 'CSE2024001',
      course: 'Computer Science Engineering',
      academicYear: 'First Year',
      status: 'Eligible',
      authenticationStatus: 'Verified',
      lastUpdate: '24-09-2025',
      email: 'rahul.sharma@college.edu',
      phone: '9876543210',
      batch: 'Batch A',
      skills: [],
      documents: [
        { name: 'Resume', status: 'Verified' },
        { name: 'Marksheet10', status: 'Verified' },
        { name: 'Marksheet12', status: 'Verified' },
        { name: 'ID Proof', status: 'Verified' }
      ]
    },
    {
      id: '2',
      name: 'Priya Patel',
      rollNumber: 'CSE2024002',
      course: 'Computer Science Engineering',
      academicYear: 'Second Year',
      status: 'Not Eligible',
      authenticationStatus: 'Pending',
      lastUpdate: '24-09-2025',
      email: 'priya.patel@college.edu',
      phone: '9876543211',
      batch: 'Batch B',
      skills: [],
      documents: [
        { name: 'Resume', status: 'Pending' },
        { name: 'Marksheet10', status: 'Verified' },
        { name: 'Marksheet12', status: 'Pending' }
      ]
    },
    {
      id: '3',
      name: 'Vikram Singh',
      rollNumber: 'ME2024091',
      course: 'Mechanical Engineering',
      academicYear: 'Third Year',
      status: 'Eligible',
      authenticationStatus: 'Verified',
      lastUpdate: '24-09-2025',
      email: 'vikram.singh@college.edu',
      phone: '9876543699',
      batch: 'Batch D',
      skills: [],
      documents: [
        { name: 'Resume', status: 'Verified' },
        { name: 'Marksheet10', status: 'Verified' },
        { name: 'Marksheet12', status: 'Verified' }
      ]
    },
    {
      id: '4',
      name: 'Anita Kumar',
      rollNumber: 'IT2024023',
      course: 'Information Technology',
      academicYear: 'Fourth Year',
      status: 'Placed',
      authenticationStatus: 'Verified',
      lastUpdate: '23-09-2025',
      email: 'anita.kumar@college.edu',
      phone: '9876543212',
      batch: 'Batch A',
      skills: [],
      documents: [
        { name: 'Resume', status: 'Verified' },
        { name: 'Marksheet10', status: 'Verified' },
        { name: 'Marksheet12', status: 'Verified' },
        { name: 'ID Proof', status: 'Verified' }
      ]
    },
    {
      id: '5',
      name: 'Rajesh Gupta',
      rollNumber: 'CSE2024003',
      course: 'Computer Science Engineering',
      academicYear: 'Fifth Year',
      status: 'Eligible',
      authenticationStatus: 'Missing Docs',
      lastUpdate: '22-09-2025',
      email: 'rajesh.gupta@college.edu',
      phone: '9876543213',
      batch: 'Batch C',
      skills: [],
      documents: [
        { name: 'Resume', status: 'Verified' },
        { name: 'Marksheet10', status: 'Pending' },
        { name: 'Marksheet12', status: 'Pending' }
      ]
    },
    {
      id: '6',
      name: 'Deepika Sharma',
      rollNumber: 'ECE2024015',
      course: 'Electronics & Communication',
      academicYear: 'Second Year',
      status: 'Not Eligible',
      authenticationStatus: 'Pending',
      lastUpdate: '21-09-2025',
      email: 'deepika.sharma@college.edu',
      phone: '9876543214',
      batch: 'Batch B',
      skills: [],
      documents: [
        { name: 'Resume', status: 'Pending' },
        { name: 'Marksheet10', status: 'Verified' },
        { name: 'Marksheet12', status: 'Verified' }
      ]
    },
    {
      id: '7',
      name: 'Amit Verma',
      rollNumber: 'CSE2024004',
      course: 'Computer Science Engineering',
      academicYear: 'Third Year',
      status: 'Eligible',
      authenticationStatus: 'Verified',
      lastUpdate: '20-09-2025',
      email: 'amit.verma@college.edu',
      phone: '9876543215',
      batch: 'Batch A',
      skills: [],
      documents: [
        { name: 'Resume', status: 'Verified' },
        { name: 'Marksheet10', status: 'Verified' },
        { name: 'Marksheet12', status: 'Verified' },
        { name: 'ID Proof', status: 'Verified' }
      ]
    },
    {
      id: '8',
      name: 'Sneha Jain',
      rollNumber: 'IT2024024',
      course: 'Information Technology',
      academicYear: 'First Year',
      status: 'Placed',
      authenticationStatus: 'Verified',
      lastUpdate: '19-09-2025',
      email: 'sneha.jain@college.edu',
      phone: '9876543216',
      batch: 'Batch B',
      skills: [],
      documents: [
        { name: 'Resume', status: 'Verified' },
        { name: 'Marksheet10', status: 'Verified' },
        { name: 'Marksheet12', status: 'Verified' }
      ]
    },
    {
      id: '9',
      name: 'Karan Singh',
      rollNumber: 'ME2024092',
      course: 'Mechanical Engineering',
      academicYear: 'Fourth Year',
      status: 'Not Eligible',
      authenticationStatus: 'Missing Docs',
      lastUpdate: '18-09-2025',
      email: 'karan.singh@college.edu',
      phone: '9876543217',
      batch: 'Batch C',
      skills: [],
      documents: [
        { name: 'Resume', status: 'Rejected' },
        { name: 'Marksheet10', status: 'Verified' },
        { name: 'Marksheet12', status: 'Pending' }
      ]
    },
    {
      id: '10',
      name: 'Pooja Agarwal',
      rollNumber: 'CSE2024005',
      course: 'Computer Science Engineering',
      academicYear: 'Second Year',
      status: 'Eligible',
      authenticationStatus: 'Verified',
      lastUpdate: '17-09-2025',
      email: 'pooja.agarwal@college.edu',
      phone: '9876543218',
      batch: 'Batch A',
      skills: [],
      documents: [
        { name: 'Resume', status: 'Verified' },
        { name: 'Marksheet10', status: 'Verified' },
        { name: 'Marksheet12', status: 'Verified' },
        { name: 'ID Proof', status: 'Verified' }
      ]
    },
    {
      id: '11',
      name: 'Rohit Kumar',
      rollNumber: 'ECE2024016',
      course: 'Electronics & Communication',
      academicYear: 'First Year',
      status: 'Eligible',
      authenticationStatus: 'Pending',
      lastUpdate: '16-09-2025',
      email: 'rohit.kumar@college.edu',
      phone: '9876543219',
      batch: 'Batch B',
      skills: [],
      documents: [
        { name: 'Resume', status: 'Verified' },
        { name: 'Marksheet10', status: 'Pending' },
        { name: 'Marksheet12', status: 'Verified' }
      ]
    },
    {
      id: '12',
      name: 'Kavita Reddy',
      rollNumber: 'IT2024025',
      course: 'Information Technology',
      academicYear: 'Third Year',
      status: 'Not Eligible',
      authenticationStatus: 'Missing Docs',
      lastUpdate: '15-09-2025',
      email: 'kavita.reddy@college.edu',
      phone: '9876543220',
      batch: 'Batch C',
      skills: [],
      documents: [
        { name: 'Resume', status: 'Rejected' },
        { name: 'Marksheet10', status: 'Verified' },
        { name: 'Marksheet12', status: 'Rejected' }
      ]
    },
    {
      id: '13',
      name: 'Sanjay Mehta',
      rollNumber: 'CSE2024006',
      course: 'Computer Science Engineering',
      academicYear: 'Fourth Year',
      status: 'Placed',
      authenticationStatus: 'Verified',
      lastUpdate: '14-09-2025',
      email: 'sanjay.mehta@college.edu',
      phone: '9876543221',
      batch: 'Batch A',
      skills: [],
      documents: [
        { name: 'Resume', status: 'Verified' },
        { name: 'Marksheet10', status: 'Verified' },
        { name: 'Marksheet12', status: 'Verified' },
        { name: 'ID Proof', status: 'Verified' }
      ]
    },
    {
      id: '14',
      name: 'Nisha Bansal',
      rollNumber: 'ME2024093',
      course: 'Mechanical Engineering',
      academicYear: 'ME2024093',
      status: 'Eligible',
      authenticationStatus: 'Verified',
      lastUpdate: '13-09-2025',
      email: 'nisha.bansal@college.edu',
      phone: '+91 9876543222',
      batch: 'Batch D',
      skills: ['Manufacturing', 'Quality Control'],
      documents: [
        { name: 'Resume', status: 'Verified' },
        { name: 'Marksheet10', status: 'Verified' },
        { name: 'Marksheet12', status: 'Verified' }
      ]
    },
    {
      id: '15',
      name: 'Arjun Yadav',
      rollNumber: 'ECE2024017',
      course: 'Electronics & Communication',
      academicYear: 'ECE2024017',
      status: 'Not Eligible',
      authenticationStatus: 'Pending',
      lastUpdate: '12-09-2025',
      email: 'arjun.yadav@college.edu',
      phone: '+91 9876543223',
      batch: 'Batch B',
      skills: ['Signal Processing', 'Digital Communication'],
      documents: [
        { name: 'Resume', status: 'Pending' },
        { name: 'Marksheet10', status: 'Verified' },
        { name: 'Marksheet12', status: 'Pending' }
      ]
    },
    {
      id: '16',
      name: 'Meera Joshi',
      rollNumber: 'IT2024026',
      course: 'Information Technology',
      academicYear: 'IT2024026',
      status: 'Eligible',
      authenticationStatus: 'Verified',
      lastUpdate: '11-09-2025',
      email: 'meera.joshi@college.edu',
      phone: '+91 9876543224',
      batch: 'Batch A',
      skills: ['UI/UX Design', 'Figma', 'Adobe XD'],
      documents: [
        { name: 'Resume', status: 'Verified' },
        { name: 'Marksheet10', status: 'Verified' },
        { name: 'Marksheet12', status: 'Verified' },
        { name: 'ID Proof', status: 'Verified' }
      ]
    },
    {
      id: '17',
      name: 'Manish Tiwari',
      rollNumber: 'CSE2024007',
      course: 'Computer Science Engineering',
      academicYear: 'CSE2024007',
      status: 'Eligible',
      authenticationStatus: 'Missing Docs',
      lastUpdate: '10-09-2025',
      email: 'manish.tiwari@college.edu',
      phone: '+91 9876543225',
      batch: 'Batch C',
      skills: ['Blockchain', 'Solidity', 'Web3'],
      documents: [
        { name: 'Resume', status: 'Verified' },
        { name: 'Marksheet10', status: 'Pending' },
        { name: 'Marksheet12', status: 'Verified' }
      ]
    },
    {
      id: '18',
      name: 'Ritu Sharma',
      rollNumber: 'ME2024094',
      course: 'Mechanical Engineering',
      academicYear: 'ME2024094',
      status: 'Not Eligible',
      authenticationStatus: 'Pending',
      lastUpdate: '09-09-2025',
      email: 'ritu.sharma@college.edu',
      phone: '+91 9876543226',
      batch: 'Batch D',
      skills: ['Fluid Mechanics', 'Heat Transfer'],
      documents: [
        { name: 'Resume', status: 'Pending' },
        { name: 'Marksheet10', status: 'Verified' },
        { name: 'Marksheet12', status: 'Verified' }
      ]
    },
    {
      id: '19',
      name: 'Gaurav Singh',
      rollNumber: 'ECE2024018',
      course: 'Electronics & Communication',
      academicYear: 'ECE2024018',
      status: 'Eligible',
      authenticationStatus: 'Verified',
      lastUpdate: '08-09-2025',
      email: 'gaurav.singh@college.edu',
      phone: '+91 9876543227',
      batch: 'Batch B',
      skills: ['VLSI Design', 'Verilog', 'FPGA'],
      documents: [
        { name: 'Resume', status: 'Verified' },
        { name: 'Marksheet10', status: 'Verified' },
        { name: 'Marksheet12', status: 'Verified' },
        { name: 'ID Proof', status: 'Verified' }
      ]
    },
    {
      id: '20',
      name: 'Divya Agarwal',
      rollNumber: 'IT2024027',
      course: 'Information Technology',
      academicYear: 'IT2024027',
      status: 'Placed',
      authenticationStatus: 'Verified',
      lastUpdate: '07-09-2025',
      email: 'divya.agarwal@college.edu',
      phone: '9876543228',
      batch: 'Batch A',
      skills: [],
      documents: [
        { name: 'Resume', status: 'Verified' },
        { name: 'Marksheet10', status: 'Verified' },
        { name: 'Marksheet12', status: 'Verified' },
        { name: 'ID Proof', status: 'Verified' }
      ]
    },
    {
      id: '21',
      name: 'Piyush Kumar',
      rollNumber: '15009234541',
      course: 'Marketing',
      academicYear: 'Second Year',
      status: 'Not Eligible',
      authenticationStatus: 'Verified',
      lastUpdate: '06-09-2025',
      email: '2023.piyushkss@isu.ac.in',
      phone: '9876543322',
      batch: 'Batch C',
      skills: [],
      documents: [
        { name: 'Resume', status: 'Pending' },
        { name: 'Marksheet10', status: 'Pending' },
        { name: 'Marksheet12', status: 'Pending' },
        { name: 'ID Proof', status: 'Pending' }
      ]
    },
    {
      id: '22',
      name: 'Arjun Patel',
      rollNumber: 'MK2024002',
      course: 'Marketing',
      academicYear: 'Third Year',
      status: 'Eligible',
      authenticationStatus: 'Verified',
      lastUpdate: '05-09-2025',
      email: 'arjun.patel@college.edu',
      phone: '9876543330',
      batch: 'Batch B',
      skills: [],
      documents: [
        { name: 'Resume', status: 'Verified' },
        { name: 'Marksheet10', status: 'Verified' },
        { name: 'Marksheet12', status: 'Verified' },
        { name: 'ID Proof', status: 'Verified' }
      ]
    }
  ];

  // Get unique courses from student data
  const uniqueCourses = Array.from(new Set(studentData.map(student => student.course)));
  const courseOptions = ["All Courses", ...uniqueCourses];
  
  const academicYearOptions = ["Academic Year", "First Year", "Second Year", "Third Year", "Fourth Year", "Fifth Year"];
  const statusOptions = ["Status", "Eligible", "Not Eligible", "Placed"];
  const authStatusOptions = ["Authentication Status", "Verified", "Pending", "Missing Docs"];

  // Excel Template Structure
  const excelTemplate = {
    instructions: [
      '=== STUDENT IMPORT TEMPLATE ===',
      '',
      'QUICK GUIDE:',
      '1. Fill all required fields | 2. Use exact dropdown values | 3. Save as CSV',
      '',
      'REQUIRED FIELDS & FORMATS:',
      '• Academic Year: First Year | Second Year | Third Year | Fourth Year | Fifth Year',
      '• Phone: 10 digits only (e.g. 9876543210)',
      '• Status: Eligible | Not Eligible | Placed',
      '• Auth Status: Verified | Pending | Missing Docs',
      '• Doc Status: Verified | Pending | Rejected',
      '',
      'VALIDATION:',
      '• Roll numbers: Unique per course/year | Email: Must be unique',
      '• Document URLs: Optional public links | Skills: Comma-separated',
      '',
      'SAMPLE DATA:'
    ],
    headers: [
      'Name', 'Roll Number', 'Course', 'Academic Year', 'Email', 'Phone', 'Batch',
      'Status', 'Authentication Status', 'Skills (comma-separated)',
      'Resume Document Status', 'Resume Document URL',
      'Marksheet10 Document Status', 'Marksheet10 Document URL',
      'Marksheet12 Document Status', 'Marksheet12 Document URL', 
      'ID Proof Document Status', 'ID Proof Document URL'
    ],
    sampleData: [
      [
        'Prem Thakare', 'CSE2024001', 'Computer Science Engineering', 'First Year',
        '2024.premt@college.edu', '9156621088', 'Batch A',
        'Eligible', 'Verified', 'Javascript,React,Node.js,AWS',
        'Verified', 'https://drive.google.com/file/d/sample-resume-prem/view',
        'Verified', 'https://drive.google.com/file/d/sample-marksheet10-prem/view',
        'Verified', 'https://drive.google.com/file/d/sample-marksheet12-prem/view',
        'Verified', 'https://drive.google.com/file/d/sample-id-prem/view'
      ],
      [
        'Ankita Sharma', 'IT2024001', 'Information Technology', 'Third Year',
        '2024.ankitas@college.edu', '9876543211', 'Batch B',
        'Not Eligible', 'Pending', 'Java,Figma,MySQL,MongoDB',
        'Pending', 'https://drive.google.com/file/d/pending-resume-ankita/view',
        'Verified', 'https://drive.google.com/file/d/verified-marksheet10-ankita/view',
        'Rejected', '',
        'Verified', 'https://drive.google.com/file/d/verified-id-ankita/view'
      ],
      [
        'Piyush Kumar', 'MK2024001', 'Marketing', 'Second Year',
        '2024.piyushk@college.edu', '9876543322', 'Batch C',
        'Not Eligible', 'Verified', 'Digital Marketing,SEO,Content Writing',
        'Pending', '',
        'Pending', '',
        'Pending', '',
        'Pending', ''
      ],
      [
        'Rahul Verma', 'ME2024001', 'Mechanical Engineering', 'Fourth Year',
        '2024.rahulv@college.edu', '9876543333', 'Batch D',
        'Placed', 'Verified', 'AutoCAD,SolidWorks,Manufacturing',
        'Verified', 'https://drive.google.com/file/d/verified-resume-rahul/view',
        'Verified', 'https://drive.google.com/file/d/verified-marksheet10-rahul/view',
        'Verified', 'https://drive.google.com/file/d/verified-marksheet12-rahul/view',
        'Verified', 'https://drive.google.com/file/d/verified-id-rahul/view'
      ]
    ]
  };

  // Download Excel Template
  const handleDownloadTemplate = () => {
    try {
      // Create comprehensive CSV content with instructions
      const instructionsContent = excelTemplate.instructions.map(line => [line]).map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');
      
      // Add empty rows for separation
      const separatorRows = '\n\n';
      
      // Create data section
      const dataContent = [excelTemplate.headers, ...excelTemplate.sampleData].map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');
      
      // Combine all content
      const csvContent = instructionsContent + separatorRows + dataContent;
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'student_import_template_with_instructions.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success toast with concise instructions
      toast({
        title: "✅ Template Downloaded Successfully!",
        description: "Open CSV file → Read instructions → Fill data → Save → Upload",
        type: "success"
      });
    } catch (error) {
      console.error('Error downloading template:', error);
      toast({
        title: "❌ Download Failed",
        description: "Error downloading template. Please try again.",
        type: "error"
      });
    }
  };

  // Parse CSV file
  const parseCSVFile = (file: File): Promise<string[][]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const allRows = text.split('\n').map(row => {
            // Simple CSV parsing - handle quoted fields
            const fields: string[] = [];
            let currentField = '';
            let inQuotes = false;
            
            for (let i = 0; i < row.length; i++) {
              const char = row[i];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                fields.push(currentField.trim());
                currentField = '';
              } else {
                currentField += char;
              }
            }
            fields.push(currentField.trim());
            return fields;
          });
          
          // Find the header row that contains the actual column headers
          let headerRowIndex = -1;
          for (let i = 0; i < allRows.length; i++) {
            const row = allRows[i];
            if (row.length >= 10 && 
                row[0] && row[0].toLowerCase().trim() === 'name' &&
                row[1] && row[1].toLowerCase().includes('roll number') &&
                row[2] && row[2].toLowerCase().includes('course')) {
              headerRowIndex = i;
              break;
            }
          }
          
          if (headerRowIndex === -1) {
            // If we can't find the exact header, look for a row with many fields that looks like data
            for (let i = 0; i < allRows.length; i++) {
              const row = allRows[i];
              if (row.length >= 15 && row[0] && row[1] && row[2] && row[3] && row[4]) {
                // Check if this looks like a header row
                const hasHeaderKeywords = row.some(cell => 
                  cell.toLowerCase().includes('name') || 
                  cell.toLowerCase().includes('roll') ||
                  cell.toLowerCase().includes('course')
                );
                if (hasHeaderKeywords) {
                  headerRowIndex = i;
                  break;
                }
              }
            }
          }
          
          if (headerRowIndex === -1) {
            throw new Error('Could not find header row in CSV file. Please ensure the template format is correct.');
          }
          
          // Extract only the relevant rows (header + data rows)
          const relevantRows = allRows.slice(headerRowIndex)
            .filter(row => row.length > 5 && row.some(cell => cell.length > 0));
          
          resolve(relevantRows);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // Validate student data
  const validateStudentData = (data: string[], rowIndex: number): ImportError[] => {
    const errors: ImportError[] = [];
    
    // Required fields validation
    if (!data[0] || data[0].trim().length === 0) {
      errors.push({ row: rowIndex, field: 'Name', message: 'Name is required' });
    }
    
    if (!data[1] || data[1].trim().length === 0) {
      errors.push({ row: rowIndex, field: 'Roll Number', message: 'Roll Number is required' });
    } else {
      // Check for duplicate roll numbers within same course and academic year
      const rollNumber = data[1].trim();
      const course = data[2]?.trim();
      const academicYear = data[3]?.trim();
      
      const existingStudent = studentData.find(s => 
        s.rollNumber === rollNumber && 
        s.course === course && 
        s.academicYear === academicYear
      );
      
      if (existingStudent) {
        errors.push({ 
          row: rowIndex, 
          field: 'Roll Number', 
          message: `Roll Number "${rollNumber}" already exists for ${course} - ${academicYear}` 
        });
      }
    }
    
    if (!data[2] || data[2].trim().length === 0) {
      errors.push({ row: rowIndex, field: 'Course', message: 'Course is required' });
    }
    
    // Academic Year validation
    if (!data[3] || data[3].trim().length === 0) {
      errors.push({ row: rowIndex, field: 'Academic Year', message: 'Academic Year is required' });
    } else if (!['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Fifth Year'].includes(data[3].trim())) {
      errors.push({ row: rowIndex, field: 'Academic Year', message: 'Academic Year must be: First Year, Second Year, Third Year, Fourth Year, or Fifth Year' });
    }
    
    if (!data[4] || data[4].trim().length === 0) {
      errors.push({ row: rowIndex, field: 'Email', message: 'Email is required' });
    } else {
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data[4].trim())) {
        errors.push({ row: rowIndex, field: 'Email', message: 'Invalid email format' });
      }
      // Check for duplicate emails
      const existingStudent = studentData.find(s => s.email === data[4].trim());
      if (existingStudent) {
        errors.push({ row: rowIndex, field: 'Email', message: 'Email already exists' });
      }
    }
    
    if (!data[5] || data[5].trim().length === 0) {
      errors.push({ row: rowIndex, field: 'Phone', message: 'Phone is required' });
    } else {
      // Phone number validation - must be exactly 10 digits
      const phone = data[5].trim().replace(/[^\d]/g, ''); // Remove non-digits
      if (phone.length !== 10) {
        errors.push({ row: rowIndex, field: 'Phone', message: 'Phone must be exactly 10 digits' });
      }
    }
    
    // Validate status values
    if (data[7] && !['Eligible', 'Not Eligible', 'Placed'].includes(data[7].trim())) {
      errors.push({ row: rowIndex, field: 'Status', message: 'Status must be: Eligible, Not Eligible, or Placed' });
    }
    
    if (data[8] && !['Verified', 'Pending', 'Missing Docs'].includes(data[8].trim())) {
      errors.push({ row: rowIndex, field: 'Authentication Status', message: 'Authentication Status must be: Verified, Pending, or Missing Docs' });
    }
    
    // Validate document statuses
    const documentStatuses = ['Verified', 'Pending', 'Rejected'];
    const documentFields = [
      { index: 10, name: 'Resume Document Status' },
      { index: 12, name: 'Marksheet10 Document Status' },
      { index: 14, name: 'Marksheet12 Document Status' },
      { index: 16, name: 'ID Proof Document Status' }
    ];
    
    documentFields.forEach(({ index, name }) => {
      if (data[index] && !documentStatuses.includes(data[index].trim())) {
        errors.push({ row: rowIndex, field: name, message: `${name} must be: Verified, Pending, or Rejected` });
      }
    });
    
    return errors;
  };

  // Process imported data
  const processImportData = async (rows: string[][]): Promise<ImportResult> => {
    const errors: ImportError[] = [];
    const newStudents: Student[] = [];
    let duplicates = 0;
    
    // Skip header row and filter out empty rows
    const dataRows = rows.slice(1).filter(row => row.some(cell => cell && cell.trim().length > 0));
    
    // Track roll numbers within this import batch for duplicate checking
    const importBatchRollNumbers = new Map<string, number[]>();
    const importBatchEmails = new Map<string, number[]>();
    
    // First pass: collect roll numbers and emails to check for internal duplicates
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowIndex = i + 2; // +2 because we skip header and arrays are 0-indexed
      
      if (row[1] && row[2] && row[3]) { // roll number, course, academic year
        const rollKey = `${row[1].trim()}-${row[2].trim()}-${row[3].trim()}`;
        if (!importBatchRollNumbers.has(rollKey)) {
          importBatchRollNumbers.set(rollKey, []);
        }
        importBatchRollNumbers.get(rollKey)!.push(rowIndex);
      }
      
      if (row[4]) { // email
        const email = row[4].trim().toLowerCase();
        if (!importBatchEmails.has(email)) {
          importBatchEmails.set(email, []);
        }
        importBatchEmails.get(email)!.push(rowIndex);
      }
    }
    
    // Check for internal duplicates in the batch
    importBatchRollNumbers.forEach((rowIndexes, rollKey) => {
      if (rowIndexes.length > 1) {
        const [rollNumber, course, academicYear] = rollKey.split('-');
        rowIndexes.forEach(rowIdx => {
          errors.push({
            row: rowIdx,
            field: 'Roll Number',
            message: `Roll Number "${rollNumber}" appears multiple times for ${course} - ${academicYear} in this import`
          });
        });
      }
    });
    
    importBatchEmails.forEach((rowIndexes, email) => {
      if (rowIndexes.length > 1) {
        rowIndexes.forEach(rowIdx => {
          errors.push({
            row: rowIdx,
            field: 'Email',
            message: `Email "${email}" appears multiple times in this import`
          });
        });
      }
    });
    
    // Second pass: validate each row
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowIndex = i + 2; // +2 because we skip header and arrays are 0-indexed
      
      // Validate row data
      const rowErrors = validateStudentData(row, rowIndex);
      errors.push(...rowErrors);
      
      // If no errors, create student object
      if (rowErrors.length === 0) {
        const skills = row[9] ? row[9].split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
        
        // Create documents with URLs
        const documents: Document[] = [
          { 
            name: 'Resume', 
            status: (row[10]?.trim() as any) || 'Pending',
            url: row[11]?.trim() || undefined
          },
          { 
            name: 'Marksheet10', 
            status: (row[12]?.trim() as any) || 'Pending',
            url: row[13]?.trim() || undefined
          },
          { 
            name: 'Marksheet12', 
            status: (row[14]?.trim() as any) || 'Pending',
            url: row[15]?.trim() || undefined
          },
          { 
            name: 'ID Proof', 
            status: (row[16]?.trim() as any) || 'Pending',
            url: row[17]?.trim() || undefined
          }
        ];
        
        // Clean phone number - keep only digits
        const cleanPhone = row[5].trim().replace(/[^\d]/g, '');
        
        const newStudent: Student = {
          id: `imported-${Date.now()}-${i}`,
          name: row[0].trim(),
          rollNumber: row[1].trim(),
          course: row[2].trim(),
          academicYear: row[3].trim(),
          email: row[4].trim(),
          phone: cleanPhone,
          batch: row[6].trim() || 'Batch A',
          status: (row[7]?.trim() as any) || 'Not Eligible',
          authenticationStatus: (row[8]?.trim() as any) || 'Pending',
          lastUpdate: new Date().toLocaleDateString('en-GB'),
          skills,
          documents
        };
        
        newStudents.push(newStudent);
      }
    }
    
    return {
      success: errors.length === 0,
      imported: newStudents.length,
      errors,
      duplicates
    };
  };

  // Handle file import
  const handleImportStudents = async () => {
    if (!importFile) return;
    
    setIsImporting(true);
    try {
      const rows = await parseCSVFile(importFile);
      
      if (rows.length < 2) {
        setImportResult({
          success: false,
          imported: 0,
          errors: [{ 
            row: 1, 
            field: 'File', 
            message: 'File must contain header row and at least one data row. Make sure to use the downloaded template format.' 
          }],
          duplicates: 0
        });
        return;
      }
      
      // Check if header row looks correct
      const headerRow = rows[0];
      const expectedHeaders = ['Name', 'Roll Number', 'Course', 'Academic Year', 'Email'];
      const hasCorrectHeaders = expectedHeaders.every(header => 
        headerRow.some(cell => cell.toLowerCase().includes(header.toLowerCase()))
      );
      
      if (!hasCorrectHeaders) {
        setImportResult({
          success: false,
          imported: 0,
          errors: [{ 
            row: 1, 
            field: 'Headers', 
            message: 'Invalid header format. Please use the downloaded template without modifying column headers.' 
          }],
          duplicates: 0
        });
        return;
      }
      
      const result = await processImportData(rows);
      setImportResult(result);
      
      if (result.success) {
        // Add new students to existing data
        const rows_data = await parseCSVFile(importFile);
        const dataRows = rows_data.slice(1);
        const newStudents: Student[] = [];
        
        dataRows.forEach((row, i) => {
          if (row.length >= 6 && row[0].trim() && row[1].trim()) {
            const skills = row[9] ? row[9].split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
            const documents: Document[] = [
              { name: 'Resume', status: (row[10]?.trim() as any) || 'Pending' },
              { name: 'Marksheet10', status: (row[11]?.trim() as any) || 'Pending' },
              { name: 'Marksheet12', status: (row[12]?.trim() as any) || 'Pending' },
              { name: 'ID Proof', status: (row[13]?.trim() as any) || 'Pending' }
            ];
            
            const newStudent: Student = {
              id: `imported-${Date.now()}-${i}`,
              name: row[0].trim(),
              rollNumber: row[1].trim(),
              course: row[2].trim(),
              academicYear: row[3].trim() || row[1].trim(),
              email: row[4].trim(),
              phone: row[5].trim(),
              batch: row[6].trim() || 'Batch A',
              status: (row[7]?.trim() as any) || 'Not Eligible',
              authenticationStatus: (row[8]?.trim() as any) || 'Pending',
              lastUpdate: new Date().toLocaleDateString('en-GB'),
              skills,
              documents
            };
            
            newStudents.push(newStudent);
          }
        });
        
        setStudentData(prev => [...prev, ...newStudents]);
      }
    } catch (error) {
      setImportResult({
        success: false,
        imported: 0,
        errors: [{ row: 1, field: 'File', message: 'Error reading file. Please check file format.' }],
        duplicates: 0
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Filtering logic
  const filteredStudents = studentData.filter(student => {
    // Search filter
    const matchesSearch = !searchQuery || 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());

    // Course filter
    const matchesCourse = !courseFilter || 
      courseFilter === "All Courses" || 
      (courseFilter === "CSE" && student.course === "Computer Science Engineering") ||
      (courseFilter === "IT" && student.course === "Information Technology") ||
      (courseFilter === "ECE" && student.course === "Electronics & Communication") ||
      (courseFilter === "ME" && student.course === "Mechanical Engineering");

    // Academic Year filter (you may need to adjust this based on your data structure)
    const matchesAcademicYear = !academicYearFilter || 
      academicYearFilter === "Academic Year" ||
      (academicYearFilter === "First Year" && student.academicYear?.includes("2024")) ||
      (academicYearFilter === "Second Year" && student.academicYear?.includes("2023")) ||
      (academicYearFilter === "Third Year" && student.academicYear?.includes("2022")) ||
      (academicYearFilter === "Fourth Year" && student.academicYear?.includes("2021"));

    // Status filter
    const matchesStatus = !statusFilter || 
      statusFilter === "Status" || 
      student.status === statusFilter;

    // Authentication Status filter
    const matchesAuthStatus = !authStatusFilter || 
      authStatusFilter === "Authentication Status" || 
      student.authenticationStatus === authStatusFilter;

    return matchesSearch && matchesCourse && matchesAcademicYear && matchesStatus && matchesAuthStatus;
  });

  // Dynamic stats based on filtered results
  const stats = {
    totalStudents: filteredStudents.length,
    verifiedStudents: filteredStudents.filter(s => s.authenticationStatus === 'Verified').length,
    placementReady: filteredStudents.filter(s => s.status === 'Eligible').length,
    placedStudents: filteredStudents.filter(s => s.status === 'Placed').length
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const startIndex = (currentPage - 1) * studentsPerPage;
  const endIndex = startIndex + studentsPerPage;
  const currentStudents = filteredStudents.slice(startIndex, endIndex);

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === studentData.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(studentData.map(s => s.id));
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      'Eligible': 'bg-green-100 text-green-800',
      'Not Eligible': 'bg-red-100 text-red-800',
      'Placed': 'bg-purple-100 text-purple-800',
      'Verified': 'bg-green-100 text-green-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Missing Docs': 'bg-red-100 text-red-800'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  // Import Students Modal
  const ImportStudentsModal = () => {
    if (!showImportModal) return null;

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
          toast({
            title: "❌ Invalid File Type",
            description: "Please select a CSV file only",
            type: "error"
          });
          return;
        }
        setImportFile(file);
        setImportResult(null);
      }
    };

    const handleCloseModal = () => {
      setShowImportModal(false);
      setImportFile(null);
      setImportResult(null);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-black">Import Students</h2>
              <p className="text-gray-500 text-sm mt-1">
                Upload a CSV file with student data to bulk import
              </p>
            </div>
            <button onClick={handleCloseModal}>
              <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="px-6 py-4 overflow-y-auto" style={{ maxHeight: '600px' }}>
            {!importResult ? (
              <div className="space-y-6">
                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Import Instructions:</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>1. Download the template using "Download Template" button</li>
                    <li>2. Read all instructions in the downloaded CSV file</li>
                    <li>3. Fill in the template with student data using dropdown values</li>
                    <li>4. Save the file as CSV format</li>
                    <li>5. Upload the completed file below</li>
                  </ul>
                </div>

                {/* Validation Guidelines */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-900 mb-3">⚡ Validation Requirements:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-800">
                    <div>
                      <h4 className="font-medium mb-2">📋 Dropdown Fields (Exact Values Only):</h4>
                      <ul className="space-y-1">
                        <li><strong>Academic Year:</strong> First Year | Second Year | Third Year | Fourth Year | Fifth Year</li>
                        <li><strong>Status:</strong> Eligible | Not Eligible | Placed</li>
                        <li><strong>Authentication:</strong> Verified | Pending | Missing Docs</li>
                        <li><strong>Document Status:</strong> Verified | Pending | Missing</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">🔐 Validation Rules:</h4>
                      <ul className="space-y-1">
                        <li><strong>Roll Number:</strong> Must be unique per course/year</li>
                        <li><strong>Email:</strong> Must be unique and valid format</li>
                        <li><strong>Phone:</strong> Exactly 10 digits (no symbols)</li>
                        <li><strong>Document URLs:</strong> Public accessible links</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* File Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  {importFile ? (
                    <div className="space-y-3">
                      <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{importFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(importFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        onClick={() => setImportFile(null)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                        <Upload className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Choose CSV file to upload</p>
                        <p className="text-sm text-gray-500">
                          Or drag and drop your file here
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium hover:opacity-90 transition-all"
                        style={{
                          background: 'linear-gradient(to right, #2791FC, #0377EB)'
                        }}
                      >
                        <Upload className="w-4 h-4" />
                        Select File
                      </button>
                    </div>
                  )}
                </div>

                {/* Template Download Reminder */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-900">Template Format Important!</p>
                      <div className="text-sm text-yellow-800 mt-1 space-y-1">
                        <p>• Download the template and keep the instruction rows intact</p>
                        <p>• Add your data starting from the row after "SAMPLE DATA BELOW:"</p>
                        <p>• The system automatically skips instruction rows during import</p>
                        <p>• Do not modify or remove the header row with column names</p>
                      </div>
                      <button
                        onClick={() => {
                          handleDownloadTemplate();
                          handleCloseModal();
                        }}
                        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-yellow-900 hover:text-yellow-700"
                      >
                        <Download className="w-4 h-4" />
                        Download Template
                      </button>
                    </div>
                  </div>
                </div>

                {/* Common Issues */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900">Common Import Issues:</p>
                      <ul className="text-sm text-red-800 mt-1 space-y-1">
                        <li>• Make sure all required fields are filled (Name, Roll Number, Course, etc.)</li>
                        <li>• Use exact dropdown values: "First Year", "Eligible", "Verified", etc.</li>
                        <li>• Phone numbers must be exactly 10 digits</li>
                        <li>• Email addresses must be unique and valid format</li>
                        <li>• Roll numbers must be unique per course/academic year</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Import Results */}
                <div className={`border rounded-lg p-4 ${
                  importResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}>
                  <div className="flex items-start gap-3">
                    {importResult.success ? (
                      <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h3 className={`font-medium ${
                        importResult.success ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {importResult.success ? 'Import Successful!' : 'Import Failed'}
                      </h3>
                      <div className={`text-sm mt-1 space-y-1 ${
                        importResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        <p>Students imported: {importResult.imported}</p>
                        {importResult.duplicates > 0 && (
                          <p>Duplicates skipped: {importResult.duplicates}</p>
                        )}
                        {importResult.errors.length > 0 && (
                          <p>Errors found: {importResult.errors.length}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error Details */}
                {importResult.errors.length > 0 && (
                  <div className="border border-red-200 rounded-lg">
                    <div className="bg-red-50 px-4 py-2 border-b border-red-200">
                      <h4 className="font-medium text-red-900">Import Errors</h4>
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="px-4 py-2 border-b border-red-100 last:border-b-0">
                          <p className="text-sm text-red-800">
                            <span className="font-medium">Row {error.row}, {error.field}:</span> {error.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t">
            <button
              onClick={handleCloseModal}
              className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-full font-medium hover:bg-gray-50 transition-colors"
            >
              {importResult ? 'Close' : 'Cancel'}
            </button>
            {!importResult && (
              <button
                onClick={handleImportStudents}
                disabled={!importFile || isImporting}
                className="px-6 py-2.5 text-white rounded-full font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(to right, #2791FC, #0377EB)'
                }}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2 inline" />
                    Import Students
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

 const AddStudentModal = () => {
    if (!showAddStudentModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6">
          <div>
            <h2 className="text-xl font-semibold text-black">Add New Student</h2>
            <p className="text-gray-500 text-sm mt-1">
              Create a new student profile and send them login details
            </p>
          </div>
          <button onClick={() => setShowAddStudentModal(false)}>
            <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="px-6 py-4 overflow-y-auto" style={{ maxHeight: '500px' }}>
          <div className="space-y-5">
            {/* Full Name and Roll Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  placeholder="Enter name"
                  className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Roll Number</label>
                <input
                  type="text"
                  placeholder="Enter name"
                  className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Course and Batch */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Course</label>
                <div className="relative">
                  <select className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-full text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                    <option>Select course</option>
                    <option>Computer Science Engineering</option>
                    <option>Information Technology</option>
                    <option>Mechanical Engineering</option>
                    <option>Electronics & Communication</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Batch</label>
                <input
                  type="text"
                  placeholder="Enter batch"
                  className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  placeholder="Enter email"
                  className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Upload Documents */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-3">
                Upload Documents (Optional)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="flex items-center justify-center px-3 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-full hover:bg-gray-100 transition-colors">
                  <Upload className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-black font-medium text-sm">Resume</span>
                </button>
                <button className="flex items-center justify-center px-3 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-full hover:bg-gray-100 transition-colors">
                  <Upload className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-black font-medium text-sm">Marksheets</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-white-50">
          <button
            onClick={() => setShowAddStudentModal(false)}
            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-full font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            className="px-6 py-2.5 text-white rounded-full font-medium hover:opacity-90 transition-all"
            style={{
              background: 'linear-gradient(to right, #2791FC, #0377EB)'
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

  const StudentProfileModal = () => {
    if (!selectedStudent) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                <span className="text-xl font-bold text-white">
                  {selectedStudent.name.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedStudent.name}</h2>
                <p className="text-sm text-gray-500">{selectedStudent.rollNumber}</p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedStudent(null)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center bg-gray-50 rounded-full p-1 mx-6 mt-6 mb-4">
            {['overview', 'skills', 'documents'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 px-6 py-2.5 text-sm font-medium capitalize rounded-full transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="px-6 pb-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Course</h3>
                    <p className="text-base text-gray-900">{selectedStudent.course}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Academic Year & Batch</h3>
                    <p className="text-base text-gray-900">Fourth Year • {selectedStudent.batch}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Email</h3>
                    <p className="text-base text-gray-900">{selectedStudent.email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Phone</h3>
                    <p className="text-base text-gray-900">{selectedStudent.phone}</p>
                  </div>
                </div>
                
                {/* Placement Status - Editable */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Placement Status</h3>
                  <div className="relative inline-block">
                    <select
                      value={selectedStudent.status}
                      onChange={(e) => {
                        // Update student status
                        const newStatus = e.target.value as 'Eligible' | 'Not Eligible' | 'Placed';
                        const updatedStudent: Student = { ...selectedStudent, status: newStatus };
                        setSelectedStudent(updatedStudent);
                        setStudentData(prev => prev.map(s => 
                          s.id === selectedStudent.id ? updatedStudent : s
                        ));
                      }}
                      className={`appearance-none px-3 py-1.5 pr-8 rounded-full text-xs font-medium cursor-pointer border-0 ${getStatusBadge(selectedStudent.status)}`}
                      style={{ outline: 'none' }}
                    >
                      <option value="Eligible">Eligible</option>
                      <option value="Not Eligible">Not Eligible</option>
                      <option value="Placed">Placed</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                  </div>
                </div>

                {/* Authentication Status */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Authentication Status</h3>
                  <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-medium ${getStatusBadge(selectedStudent.authenticationStatus)}`}>
                    {selectedStudent.authenticationStatus}
                  </span>
                </div>

                <div className="flex gap-3 pt-4 justify-end border-t">
                  <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                    <MessageCircle className="w-4 h-4" />
                    Message Student
                  </button>
                  <button 
                    onClick={() => setActiveTab('documents')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Verify Documents
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                  <p className="text-blue-700 text-sm">
                    <strong>Note:</strong> Skills are managed by students through their portal. College can view but not edit skills directly.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudent.skills && selectedStudent.skills.length > 0 ? (
                      selectedStudent.skills.map((skill, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <>
                        <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">JavaScript</span>
                        <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">Python</span>
                        <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">React</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-3">
                {/* Document List */}
                {selectedStudent.documents?.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white hover:border-blue-100 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <input
                        type="checkbox"
                        checked={doc.selected || false}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          const updatedDocs: Document[] = selectedStudent.documents?.map((d, i) => 
                            i === index ? { ...d, selected: isChecked } : d
                          ) || [];
                          const updatedStudent: Student = { ...selectedStudent, documents: updatedDocs };
                          setSelectedStudent(updatedStudent);
                          setStudentData(prev => prev.map(s => 
                            s.id === selectedStudent.id ? updatedStudent : s
                          ));
                        }}
                        className="w-5 h-5 text-blue-500 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 flex-shrink-0 cursor-pointer"
                      />
                      <div className="flex items-center gap-3 flex-1">
                        <h4 className="font-medium text-gray-900 min-w-[140px]">{doc.name}</h4>
                        <span className={`inline-block px-3 py-1 rounded-md text-xs font-medium ${
                          doc.status === 'Verified' ? 'bg-green-100 text-green-700' :
                          doc.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {doc.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button 
                        onClick={() => setDocumentModal({open: true, document: doc.name})}
                        className="p-2 text-blue-500 border border-blue-300 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Document"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-2 text-blue-500 border border-blue-300 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Download Document"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Select All Checkbox */}
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    checked={selectedStudent.documents?.every(d => d.selected) || false}
                    onChange={(e) => {
                      const allChecked = e.target.checked;
                      const updatedDocs: Document[] = selectedStudent.documents?.map(d => 
                        ({ ...d, selected: allChecked })
                      ) || [];
                      const updatedStudent: Student = { ...selectedStudent, documents: updatedDocs };
                      setSelectedStudent(updatedStudent);
                      setStudentData(prev => prev.map(s => 
                        s.id === selectedStudent.id ? updatedStudent : s
                      ));
                    }}
                    className="w-5 h-5 text-blue-500 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-900">Select All</span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button 
                    onClick={() => {
                      // Request re-upload for all selected (checked) documents
                      const updatedDocs: Document[] = selectedStudent.documents?.map(d => 
                        d.selected ? { ...d, status: 'Rejected' as const, selected: false } : d
                      ) || [];
                      const updatedStudent: Student = { ...selectedStudent, documents: updatedDocs };
                      setSelectedStudent(updatedStudent);
                      setStudentData(prev => prev.map(s => 
                        s.id === selectedStudent.id ? updatedStudent : s
                      ));
                    }}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Request Re-upload
                  </button>
                  <button 
                    onClick={() => {
                      // Verify all selected (checked) documents
                      const updatedDocs: Document[] = selectedStudent.documents?.map(d => 
                        d.selected ? { ...d, status: 'Verified' as const, selected: false } : d
                      ) || [];
                      const updatedStudent: Student = { ...selectedStudent, documents: updatedDocs };
                      setSelectedStudent(updatedStudent);
                      setStudentData(prev => prev.map(s => 
                        s.id === selectedStudent.id ? updatedStudent : s
                      ));
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Verify All Pending
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const DocumentModal = () => {
    if (!documentModal.open) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">View Document - {documentModal.document}</h2>
            <button onClick={() => setDocumentModal({open: false})}>
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">Document preview for {selectedStudent?.name}</p>
            <div className="bg-gray-100 rounded-lg p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Document Preview</h3>
              <p className="text-gray-500 mb-4">In a real application, this would show the actual document content</p>
              <button 
                className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-all"
                style={{
                  background: 'linear-gradient(to right, #2791FC, #0377EB)'
                }}
              >
                <ExternalLink className="w-4 h-4" />
                Open in New Tab
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-3 p-6 border-t">
            <button 
              onClick={() => setDocumentModal({open: false})}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            <button 
              className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-all"
              style={{
                background: 'linear-gradient(to right, #2791FC, #0377EB)'
              }}
            >
              <FileDown className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-white ${className}`}>
      {/* Header Section */}
      <div className="bg-white px-8 py-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">
              <span style={{ color: '#0270DF' }}>Student</span> <span style={{ color: '#0A0A0A' }}>Database</span>
            </h1>
            <p className="text-gray-600 text-sm mt-1">Manage student records, verify documents and track placement readiness</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Action Buttons */}
            <button 
              onClick={() => setShowAddStudentModal(true)}
              className="inline-flex items-center px-4 py-2.5 rounded-lg text-white font-medium text-sm transition-all duration-200 hover:shadow-lg"
              style={{
                background: 'linear-gradient(to right, #2791FC, #0377EB)'
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </button>
            <button 
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center px-4 py-2.5 border-2 bg-white rounded-lg text-sm font-medium transition-colors hover:bg-gray-50" 
              style={{
                borderColor: '#1383F3',
                color: '#1182F2'
              }}
            >
              <Upload className="w-4 h-4 mr-2" style={{ color: '#1182F2' }} />
              Import Students
            </button>
            <button 
              onClick={handleDownloadTemplate}
              className="inline-flex items-center px-4 py-2.5 border-2 bg-white rounded-lg text-sm font-medium transition-colors hover:bg-gray-50"
              style={{
                borderColor: '#1383F3',
                color: '#1182F2'
              }}
            >
              <Download className="w-4 h-4 mr-2" style={{ color: '#1182F2' }} />
              Download Template
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6 p-8">
{/* KPI Student Stats */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  {/* Total Students */}
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-gray-600 font-medium">Total Students</h3>
      <div className="w-7 h-7 bg-gradient-to-r from-[#00C950] to-[#00A63E] rounded-lg flex items-center justify-center">
        <Users className="w-4 h-4 text-white" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="text-2xl font-semibold text-gray-900">{stats.totalStudents}</div>
      <div className="flex items-center gap-2 text-sm">
      </div>
    </div>
  </div>

  {/* Verified Students */}
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-gray-600 font-medium">Verified Students</h3>
      <div className="w-7 h-7 bg-gradient-to-r from-[#AD46FF] to-[#9810FA] rounded-lg flex items-center justify-center">
        <UserCheck className="w-4 h-4 text-white" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="text-2xl font-semibold text-gray-900">{stats.verifiedStudents}</div>
      <div className="flex items-center gap-2 text-sm">
      </div>
    </div>
  </div>

  {/* Placement Ready */}
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-gray-600 font-medium">Placement Ready</h3>
      <div className="w-7 h-7 bg-gradient-to-r from-[#008EFF] to-[#0573CB] rounded-lg flex items-center justify-center">
        <Briefcase className="w-4 h-4 text-white" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="text-2xl font-semibold text-gray-900">{stats.placementReady}</div>
      <div className="flex items-center gap-2 text-sm">
      </div>
    </div>
  </div>

  {/* Placed Students */}
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-gray-600 font-medium">Placed Students</h3>
      <div className="w-7 h-7 bg-gradient-to-r from-[#FF8400] to-[#E57701] rounded-lg flex items-center justify-center">
        <Trophy className="w-4 h-4 text-white" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="text-2xl font-semibold text-gray-900">{stats.placedStudents}</div>
      <div className="flex items-center gap-2 text-sm">
      </div>
    </div>
  </div>
</div>



      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm shadow-gray-200/50"
            style={{
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 2px 0 6px -1px rgba(0, 0, 0, 0.05)'
            }}
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <FilterSelect 
            placeholder="All Courses" 
            value={courseFilter} 
            onChange={setCourseFilter} 
            options={courseOptions}
            filterId="courses"
            openDropdown={openDropdown}
            setOpenDropdown={setOpenDropdown}
          />
          <FilterSelect 
            placeholder="Academic Year" 
            value={academicYearFilter} 
            onChange={setAcademicYearFilter} 
            options={academicYearOptions}
            filterId="academic-year"
            openDropdown={openDropdown}
            setOpenDropdown={setOpenDropdown}
          />
          <FilterSelect 
            placeholder="Status" 
            value={statusFilter} 
            onChange={setStatusFilter} 
            options={statusOptions}
            filterId="status"
            openDropdown={openDropdown}
            setOpenDropdown={setOpenDropdown}
          />
          <FilterSelect 
            placeholder="Authentication Status" 
            value={authStatusFilter} 
            onChange={setAuthStatusFilter} 
            options={authStatusOptions}
            filterId="auth-status"
            openDropdown={openDropdown}
            setOpenDropdown={setOpenDropdown}
          />
        </div>
      </div>

      {/* Selection Actions */}
      {selectedStudents.length > 0 && (
        <div className="rounded-lg p-4 flex items-center justify-between" style={{ backgroundColor: 'rgba(204, 177, 255, 0.35)' }}>
          <span className="text-base font-medium" style={{ color: '#7F3DFF' }}>{selectedStudents.length} students selected</span>
          <div className="flex gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2 text-base font-medium bg-white text-gray-800 rounded-lg hover:bg-gray-50 border border-gray-200">
              <CheckCircle className="w-4 h-4" />
              Verify Selected
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 text-base font-medium bg-white text-gray-800 rounded-lg hover:bg-gray-50 border border-gray-200">
              <Download className="w-4 h-4" />
              Send Message
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 text-base font-medium bg-white text-gray-800 rounded-lg hover:bg-gray-50 border border-gray-200">
              <Download className="w-4 h-4" />
              Export Selected
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 text-base font-medium bg-white text-gray-800 rounded-lg hover:bg-gray-50 border border-gray-200">
              <FileDown className="w-4 h-4" />
              Export All CSV
            </button>
          </div>
        </div>
      )}

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedStudents.length === studentData.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: '#0A0A0A'}}>Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: '#0A0A0A'}}>Course/Academic Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: '#0A0A0A'}}>Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{color: '#0A0A0A'}}>Authentication Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: '#0A0A0A'}}>Last Update</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: '#0A0A0A'}}>Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => handleSelectStudent(student.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-purple-800">
                          {student.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-blue-600">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.rollNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm text-gray-900">{student.course}</div>
                      <div className="text-sm text-gray-500">{student.academicYear}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(student.status)}`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(student.authenticationStatus)}`}>
                      {student.authenticationStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{student.lastUpdate}</td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => setSelectedStudent(student)}
                      className="hover:opacity-80"
                      style={{ color: '#1383F2' }}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div></div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                      currentPage === page 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  ›
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setImportFile(file);
            setShowImportModal(true);
          }
        }}
        className="hidden"
      />
      
      {/* Modals */}
      <ImportStudentsModal />
      <AddStudentModal />
      <StudentProfileModal />
      <DocumentModal />
      </div>
    </div>
  );
};

export default StudentDatabase;