'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { ChevronDown, ChevronLeft, ChevronRight, Loader2, LocateFixed, Search } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import CollegeRegistrationNavbar from '../components/CollegeRegistrationNavbar';
import Footer from '../components/Footer';
import CollegeCard from '../components/CollegeCard';
import EnquiryModal from '../components/EnquiryModal';
import { COLLEGE_SEEDS } from '../data/collegeSeeds';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
const institutionTypes = ['All Types', 'Private', 'Government', 'Aided', 'Regular', 'Evening', 'Online', 'Distance'];
const feeOptions = [
  { label: 'Course Fees', min: 0, max: 500000 },
  { label: 'Under ₹1 Lakh', min: 0, max: 100000 },
  { label: '₹1–3 Lakh', min: 100000, max: 300000 },
  { label: 'Above ₹3 Lakh', min: 300000, max: 500000 },
];

type College = {
  id: string;
  name: string;
  location: string;
  image?: string;
  accreditation?: string;
  approvalBadges: string[];
  courses: string[];
  annualFees: number;
  category: string;
  institutionType: string;
  affiliation: string;
  averagePackage?: string | number;
  placementRate?: string | number;
  establishedYear?: string | number;
  _id?: string;
  [key: string]: unknown;
};

type Filters = {
  courses: string[];
  feeRange: { min: number; max: number };
  locations: string[];
  affiliations: string[];
  institutionTypes: string[];
  category: string;
};

const blankFilters: Filters = {
  courses: [],
  feeRange: feeOptions[0],
  locations: [],
  affiliations: [],
  institutionTypes: [],
  category: '',
};

const courseName = (course: unknown) => {
  if (typeof course === 'string') return course;
  if (!course || typeof course !== 'object') return '';
  const record = course as Record<string, unknown>;
  return [record.name, record.courseName, record.title].find((value): value is string => typeof value === 'string') || '';
};

const stringValue = (value: unknown) => typeof value === 'string' ? value : '';
const numberValue = (value: unknown) => typeof value === 'number' ? value : Number(value) || 0;

const mapCollegeRecord = (college: Record<string, unknown>): College => {
  const approvalBadges = [college.ugcApproved && 'UGC', college.aicteApproved && 'AICTE', college.nbaApproved && 'NBA'].filter(Boolean) as string[];
  return {
    ...college,
    id: stringValue(college._id),
    name: stringValue(college.name) || 'Unnamed college',
    location: [stringValue(college.city), stringValue(college.state)].filter(Boolean).join(', '),
    image: stringValue(college.logo) || stringValue(college.bannerImage) || undefined,
    accreditation: college.naacGrade ? `NAAC ${stringValue(college.naacGrade)}` : '',
    approvalBadges,
    courses: (Array.isArray(college.courses) ? college.courses : []).map(courseName).filter(Boolean),
    annualFees: numberValue(college.averageFees || college.courseFees),
    category: stringValue(college.category),
    institutionType: stringValue(college.institutionType),
    affiliation: stringValue(college.affiliation) || stringValue(college.affiliatedUniversity),
    averagePackage: typeof college.averagePackage === 'string' || typeof college.averagePackage === 'number' ? college.averagePackage : undefined,
    placementRate: typeof college.placementRate === 'string' || typeof college.placementRate === 'number' ? college.placementRate : typeof college.placementPercentage === 'string' || typeof college.placementPercentage === 'number' ? college.placementPercentage : undefined,
    establishedYear: typeof college.establishedYear === 'string' || typeof college.establishedYear === 'number' ? college.establishedYear : typeof college.yearEstablished === 'string' || typeof college.yearEstablished === 'number' ? college.yearEstablished : undefined,
  };
};

const seededColleges = COLLEGE_SEEDS.map((college) => ({ ...college }));

export default function SearchColleges() {
  const router = useRouter();
  const { category, course, location } = router.query;
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [allColleges, setAllColleges] = useState<College[]>([]);
  const [filteredColleges, setFilteredColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [filters, setFilters] = useState<Filters>(blankFilters);
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const itemsPerPage = 6;

  const totalPages = Math.ceil(filteredColleges.length / itemsPerPage);
  const paginatedColleges = filteredColleges.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const affiliations = useMemo(() => Array.from(new Set(allColleges.map((college) => college.affiliation).filter(Boolean))), [allColleges]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(Boolean(token));
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      setUserRole(payload.role || null);
      if (payload.role === 'student') fetchStudentInfo(token);
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }, []);

  const fetchStudentInfo = async (token: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/students/profile`, { headers: { Authorization: `Bearer ${token}` } });
      const student = response.data.data || response.data;
      setStudentName(`${student.firstName || 'Student'} ${student.lastName || ''}`.trim());
    } catch (error) {
      console.error('Error fetching student info:', error);
    }
  };

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${API_BASE_URL}/api/colleges`);
        const records = Array.isArray(response.data) ? response.data : response.data.data || [];
        const colleges = records.map(mapCollegeRecord);
        const hasCompleteCardData = colleges.some((college) => Boolean(
          college.location && college.image && college.courses.length && college.averagePackage && college.placementRate && college.establishedYear
        ));
        setAllColleges(hasCompleteCardData ? colleges : seededColleges);
      } catch (error) {
        console.error('Error fetching colleges:', error);
        setError('Failed to load colleges. Please try again later.');
        setAllColleges(seededColleges);
      } finally {
        setLoading(false);
      }
    };
    fetchColleges();
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    setFilters((current) => ({
      ...current,
      category: typeof category === 'string' ? category : current.category,
      courses: typeof course === 'string' ? [decodeURIComponent(course)] : current.courses,
      locations: typeof location === 'string' ? [decodeURIComponent(location)] : current.locations,
    }));
    if (typeof location === 'string') setLocationQuery(decodeURIComponent(location));
  }, [router.isReady, category, course, location]);

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = allColleges.filter((college) => {
      const matchesSearch = !query || [college.name, college.location, ...college.courses].some((value) => value.toLowerCase().includes(query));
      const matchesCategory = !filters.category || college.category === filters.category;
      const matchesCourse = !filters.courses.length || filters.courses.some((filterCourse) => college.courses.some((collegeCourse) => collegeCourse.toLowerCase().includes(filterCourse.toLowerCase())));
      const matchesLocation = !filters.locations.length || filters.locations.some((filterLocation) => college.location.toLowerCase().includes(filterLocation.toLowerCase()));
      const matchesAffiliation = !filters.affiliations.length || filters.affiliations.includes(college.affiliation);
      const matchesType = !filters.institutionTypes.length || filters.institutionTypes.includes(college.institutionType);
      const matchesFees = college.annualFees >= filters.feeRange.min && college.annualFees <= filters.feeRange.max;
      return matchesSearch && matchesCategory && matchesCourse && matchesLocation && matchesAffiliation && matchesType && matchesFees;
    });
    setFilteredColleges(filtered);
    setCurrentPage(1);
  }, [allColleges, searchQuery, filters]);

  const resetFilters = () => {
    setSearchQuery('');
    setLocationQuery('');
    setFilters(blankFilters);
  };

  const handleEnquireNow = async (college: College) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/colleges/${college.id}`);
      const details = response.data.data || response.data;
      setSelectedCollege({ ...college, ...details, id: String(details?._id || college.id), _id: details?._id || college.id });
      setEnquiryModalOpen(true);
    } catch (error) {
      console.error('Error fetching college details:', error);
      alert('Failed to load college details. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {isLoggedIn && userRole === 'student' ? <CollegeRegistrationNavbar status="approved" collegeName={studentName} userRole="student" /> : <Navbar />}
      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="overflow-hidden rounded-[28px] bg-white shadow-sm">
          <header className="flex items-center justify-between bg-[#f4f5f7] px-6 py-6 md:px-10">
            <h1 className="text-xl font-semibold text-[#20242c]">Find College</h1>
            <p className="text-sm text-slate-500">Home <span className="mx-2">/</span> <span className="text-slate-900">Find college</span></p>
          </header>

          <section className="px-5 py-8 md:px-7 md:py-10">
            <div>
              <h2 className="text-3xl font-bold text-[#484848]">College Search</h2>
              <p className="mt-2 text-xl text-[#484848]">Sign up to view colleges near your location</p>
            </div>

            <div className="mt-8 rounded-2xl border border-[#d0d2d6] p-5 md:p-7">
              <label className="relative block">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#0877ed]" />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by: Courses/College name..." className="w-full rounded-lg border border-[#cbd8f3] py-3.5 pl-12 pr-4 text-sm font-medium outline-none transition focus:border-[#0877ed] focus:ring-2 focus:ring-blue-100" />
              </label>

              <div className="mt-6">
                <p className="text-sm font-semibold text-slate-900">Types of Institution</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {institutionTypes.map((type) => {
                    const isActive = type === 'All Types' ? !filters.institutionTypes.length : filters.institutionTypes.includes(type);
                    return <button key={type} type="button" onClick={() => setFilters((current) => ({ ...current, institutionTypes: type === 'All Types' ? [] : [type] }))} className={`rounded-full border px-6 py-2 text-sm transition ${isActive ? 'border-[#0877ed] bg-[#0877ed] text-white' : 'border-[#d3dcf1] bg-white text-[#4c4c4c] hover:border-[#0877ed]'}`}>{type}</button>;
                  })}
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-[1.3fr_.42fr_.42fr]">
                <label className="relative">
                  <LocateFixed className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                  <input value={locationQuery} onChange={(event) => { const value = event.target.value; setLocationQuery(value); setFilters((current) => ({ ...current, locations: value ? [value] : [] })); }} placeholder="Location" className="w-full rounded-full border border-[#d3dcf1] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#0877ed]" />
                </label>
                <label className="relative">
                  <select value={filters.affiliations[0] || ''} onChange={(event) => setFilters((current) => ({ ...current, affiliations: event.target.value ? [event.target.value] : [] }))} className="w-full appearance-none rounded-full border border-[#d3dcf1] bg-white px-5 py-2.5 pr-10 text-sm outline-none focus:border-[#0877ed]">
                    <option value="">Affiliated to</option>
                    {affiliations.map((affiliation) => <option key={affiliation} value={affiliation}>{affiliation}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2" />
                </label>
                <label className="relative">
                  <select value={feeOptions.find((option) => option.min === filters.feeRange.min && option.max === filters.feeRange.max)?.label || feeOptions[0].label} onChange={(event) => { const option = feeOptions.find((fee) => fee.label === event.target.value) || feeOptions[0]; setFilters((current) => ({ ...current, feeRange: option })); }} className="w-full appearance-none rounded-full border border-[#d3dcf1] bg-white px-5 py-2.5 pr-10 text-sm outline-none focus:border-[#0877ed]">
                    {feeOptions.map((option) => <option key={option.label}>{option.label}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2" />
                </label>
              </div>
            </div>

            {loading ? <div className="flex flex-col items-center py-24"><Loader2 className="h-10 w-10 animate-spin text-[#0877ed]" /><p className="mt-4 text-slate-600">Loading colleges...</p></div> : null}
            {!loading && !filteredColleges.length ? <div className="py-24 text-center"><Search className="mx-auto h-10 w-10 text-slate-300" /><h3 className="mt-4 text-lg font-semibold">No colleges found</h3><p className="mt-1 text-slate-500">{error || 'Try changing your search or filters.'}</p><button type="button" onClick={resetFilters} className="mt-5 rounded bg-[#0877ed] px-5 py-2.5 text-sm font-semibold text-white">Reset filters</button></div> : null}

            {!loading && filteredColleges.length ? <>
              <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-2">
                {paginatedColleges.map((college) => <CollegeCard key={college.id} college={college} onEnquireNow={() => handleEnquireNow(college)} />)}
              </div>
              {totalPages > 1 ? <nav aria-label="College search pages" className="mt-10 flex items-center justify-center gap-3">
                <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="grid h-11 w-11 place-items-center rounded-full text-[#0877ed] disabled:opacity-30"><ChevronLeft className="h-5 w-5" /></button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, index) => index + 1).map((page) => <button type="button" key={page} onClick={() => setCurrentPage(page)} className={`grid h-11 w-11 place-items-center rounded-full text-sm font-semibold ${currentPage === page ? 'bg-[#0877ed] text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{String(page).padStart(2, '0')}</button>)}
                <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="grid h-11 w-11 place-items-center rounded-full bg-[#e8f7ff] text-[#0877ed] disabled:opacity-30"><ChevronRight className="h-5 w-5" /></button>
              </nav> : null}
            </> : null}
          </section>
        </div>
      </main>
      <Footer />
      {selectedCollege ? <EnquiryModal isOpen={enquiryModalOpen} onClose={() => { setEnquiryModalOpen(false); setSelectedCollege(null); }} collegeId={selectedCollege._id || selectedCollege.id} courses={(selectedCollege.courses || []).map((name) => ({ name }))} /> : null}
    </div>
  );
}
