'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Search, MapPin, GraduationCap, IndianRupee, Building, Loader2 } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import CollegeRegistrationNavbar from '../components/CollegeRegistrationNavbar';
import Footer from '../components/Footer';
import CollegeFilters from '../components/CollegeFilters';
import CollegeCard from '../components/CollegeCard';
import EnquiryModal from '../components/EnquiryModal';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export default function SearchColleges() {
  const router = useRouter();
  const { category, course, location } = router.query;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [allColleges, setAllColleges] = useState<any[]>([]);
  const [filteredColleges, setFilteredColleges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [filters, setFilters] = useState({
    courses: [],
    feeRange: { min: 0, max: 500000 },
    locations: [],
    affiliations: [],
    institutionTypes: [],
    category: '',
  });
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<any>(null);

  const itemsPerPage = 9;
  const totalPages = Math.ceil(filteredColleges.length / itemsPerPage);
  const paginatedColleges = filteredColleges.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
        
        // Fetch student info if role is student
        if (payload.role === 'student') {
          fetchStudentInfo(token);
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
        setStudentName(`${studentData.firstName || 'Student'} ${studentData.lastName || ''}`);
      }
    } catch (error) {
      console.error('Error fetching student info:', error);
    }
  };

  // Fetch colleges from backend
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${API_BASE_URL}/api/colleges`);
        
        // Transform backend data to match frontend structure
        const colleges = response.data.map((college: any) => ({
          id: college._id,
          name: college.name,
          location: `${college.city || ''}, ${college.state || ''}`.trim().replace(/^,\s*/, ''),
          image: college.logo || college.bannerImage || 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop',
          accreditation: college.naacGrade ? `NAAC ${college.naacGrade}` : '',
          approvals: [
            college.ugcApproved && 'UGC',
            college.aicteApproved && 'AICTE',
            college.nbaApproved && 'NBA'
          ].filter(Boolean).join(', ') + (college.ugcApproved || college.aicteApproved || college.nbaApproved ? ' Approved' : ''),
          spotAdmission: college.spotAdmission || false,
          annualFees: college.averageFees || 0,
          courses: college.courses || [],
          category: college.category || 'general',
          institutionType: college.institutionType || 'Private',
          affiliation: college.affiliation || college.affiliatedUniversity || '',
          // Keep original data for detail page
          ...college
        }));
        
        setAllColleges(colleges);
        setFilteredColleges(colleges);
      } catch (err) {
        console.error('Error fetching colleges:', err);
        setError('Failed to load colleges. Please try again later.');
        setAllColleges([]);
        setFilteredColleges([]);
      } finally {
        setLoading(false);
      }
    };

    fetchColleges();
  }, []);

  // Initialize filters from URL parameters
  useEffect(() => {
    if (category || course || location) {
      const newFilters = { ...filters };
      
      if (category && typeof category === 'string') {
        newFilters.category = category;
      }
      
      if (course && typeof course === 'string') {
        newFilters.courses = [decodeURIComponent(course)];
      }
      
      if (location && typeof location === 'string') {
        newFilters.locations = [decodeURIComponent(location)];
      }
      
      setFilters(newFilters);
    }
  }, [category, course, location]);

  // Apply filters
  useEffect(() => {
    let filtered = [...allColleges];

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (college) =>
          college.name.toLowerCase().includes(query) ||
          college.location.toLowerCase().includes(query) ||
          college.courses.some((c) => c.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter((college) => college.category === filters.category);
    }

    // Courses filter
    if (filters.courses.length > 0) {
      filtered = filtered.filter((college) =>
        filters.courses.some((filterCourse) =>
          college.courses.some((collegeCourse) =>
            collegeCourse.toLowerCase().includes(filterCourse.toLowerCase())
          )
        )
      );
    }

    // Location filter
    if (filters.locations.length > 0) {
      filtered = filtered.filter((college) =>
        filters.locations.some((loc) => college.location.includes(loc))
      );
    }

    // Affiliation filter
    if (filters.affiliations.length > 0) {
      filtered = filtered.filter((college) =>
        filters.affiliations.includes(college.affiliation)
      );
    }

    // Institution type filter
    if (filters.institutionTypes.length > 0 && !filters.institutionTypes.includes('All')) {
      filtered = filtered.filter((college) =>
        filters.institutionTypes.includes(college.institutionType)
      );
    }

    // Fee range filter
    filtered = filtered.filter(
      (college) =>
        college.annualFees >= filters.feeRange.min &&
        college.annualFees <= filters.feeRange.max
    );

    setFilteredColleges(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, filters]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleSearch = () => {
    // Search is already reactive through useEffect
    console.log('Searching for:', searchQuery);
  };

  const handleEnquireNow = async (college: any) => {
    // Fetch full college details including courses
    try {
      const response = await axios.get(`${API_BASE_URL}/api/colleges/${college.id}`);
      setSelectedCollege(response.data);
      setEnquiryModalOpen(true);
    } catch (err) {
      console.error('Error fetching college details:', err);
      alert('Failed to load college details. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {isLoggedIn && userRole === 'student' ? (
        <CollegeRegistrationNavbar 
          status="approved" 
          collegeName={studentName}
          userRole="student"
        />
      ) : (
        <Navbar />
      )}
      
      {/* Hero Section with Search */}
      <section 
        className="relative pt-32 pb-24 overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom, #8DB9F0 0%, #8DB9F0 60%, #FFFFFF 100%)',
          minHeight: '398px'
        }}
      >
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-32 left-20 w-4 h-4 bg-teal-400 rounded-full opacity-80"></div>
          <div className="absolute top-48 right-32 w-3 h-3 bg-blue-500 rounded-full opacity-80"></div>
          <div className="absolute bottom-48 left-32 w-4 h-4 bg-purple-500 rounded-full opacity-80"></div>
          <div className="absolute bottom-32 right-24 w-3 h-3 bg-yellow-500 rounded-full opacity-80"></div>
          <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-green-400 rounded-full opacity-80"></div>
          <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-pink-500 rounded-full opacity-80"></div>
          <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-orange-400 rounded-full opacity-80"></div>
          <div className="absolute top-2/3 right-1/4 w-4 h-4 bg-indigo-400 rounded-full opacity-80"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24 relative">
          {/* Centered Content */}
          <div className="text-center mx-auto relative z-20 flex flex-col items-center justify-center">
            {/* Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 whitespace-nowrap inline-block">
              <span className="text-gray-900">Taking </span>
              <span className="text-[#0064C9]">Admissions</span>
              <span className="text-gray-900"> Has </span>
              <span className="text-[#0064C9]">Never Been</span>
              <span className="text-gray-900"> This Easy</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#333931] font-normal mb-8 max-w-3xl">
              Find verified colleges, explore scholarships, and apply instantly with CampusPe.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content: Filters + College Grid */}
      <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-[340px] flex-shrink-0">
            <CollegeFilters
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </aside>

          {/* College Cards Grid */}
          <div className="flex-1">
            <div className="mb-6 flex items-center gap-4">
              {/* Search Colleges with search bar */}
              <div className="flex items-center gap-4 flex-1">
                <h2 className="text-xl font-semibold text-gray-900 whitespace-nowrap">
                  Search Colleges
                </h2>
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search by course..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>
              
              {/* All Locations Dropdown */}
              <div className="relative flex-shrink-0">
                <select
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-10 bg-white cursor-pointer min-w-[160px]"
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'all') {
                      setFilters({ ...filters, locations: [] });
                    } else {
                      setFilters({ ...filters, locations: [value] });
                    }
                  }}
                  value={filters.locations.length > 0 ? filters.locations[0] : 'all'}
                >
                  <option value="all">All Locations</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                </select>
                <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* No Results Message */}
            {!loading && filteredColleges.length === 0 && (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No colleges found</h3>
                <p className="text-gray-600 mb-4">
                  {error || 'Try adjusting your filters or search query'}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilters({
                      courses: [],
                      feeRange: { min: 0, max: 500000 },
                      locations: [],
                      affiliations: [],
                      institutionTypes: [],
                      category: '',
                    });
                  }}
                  className="px-6 py-2 bg-[#2463EB] text-white rounded-lg hover:bg-[#1d4fb8] transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-12 h-12 text-[#2463EB] animate-spin mb-4" />
                <p className="text-gray-600">Loading colleges...</p>
              </div>
            )}

            {/* Grid */}
            {!loading && filteredColleges.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
                  {paginatedColleges.map((college) => (
                    <CollegeCard 
                      key={college.id} 
                      college={college}
                      onEnquireNow={() => handleEnquireNow(college)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-12">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <path
                          d="M10 12L6 8L10 4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 flex items-center justify-center rounded font-semibold transition-colors ${
                            currentPage === pageNum
                              ? 'bg-[#2463EB] text-white'
                              : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <path
                          d="M6 12L10 8L6 4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />

      {/* Enquiry Modal */}
      {selectedCollege && (
        <EnquiryModal
          isOpen={enquiryModalOpen}
          onClose={() => {
            setEnquiryModalOpen(false);
            setSelectedCollege(null);
          }}
          collegeId={selectedCollege._id}
          courses={selectedCollege.courses || []}
        />
      )}
    </div>
  );
}
