import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface FilterProps {
  filters: {
    courses: string[];
    feeRange: { min: number; max: number };
    locations: string[];
    affiliations: string[];
    institutionTypes: string[];
    category?: string;
  };
  onFilterChange: (filters: any) => void;
}

export default function CollegeFilters({ filters, onFilterChange }: FilterProps) {
  const [selectedCourses, setSelectedCourses] = useState<string[]>(filters.courses || []);
  const [selectedLocations, setSelectedLocations] = useState<string[]>(filters.locations || []);
  const [selectedAffiliations, setSelectedAffiliations] = useState<string[]>(filters.affiliations || []);
  const [selectedInstitutionTypes, setSelectedInstitutionTypes] = useState<string[]>(filters.institutionTypes || []);
  const [feeMin, setFeeMin] = useState(filters.feeRange?.min || 0);
  const [feeMax, setFeeMax] = useState(filters.feeRange?.max || 500000);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [affiliationSearchQuery, setAffiliationSearchQuery] = useState('');

  // Sync with external filter changes (e.g., from URL params)
  useEffect(() => {
    setSelectedCourses(filters.courses || []);
    setSelectedLocations(filters.locations || []);
    setSelectedAffiliations(filters.affiliations || []);
    setSelectedInstitutionTypes(filters.institutionTypes || []);
    setFeeMin(filters.feeRange?.min || 0);
    setFeeMax(filters.feeRange?.max || 500000);
  }, [filters]);

  // Course-Stream Mapping (matching backend structure)
  const COURSE_STREAM_MAPPING: { [key: string]: string[] } = {
    'B.Tech': ['Computer Science Engineering', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering'],
    'M.Tech': ['Computer Science Engineering', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering'],
    'MBA': ['Finance', 'Marketing', 'Human Resources', 'Operations Management', 'International Business', 'Information Technology'],
    'BBA': ['Finance', 'Marketing', 'Human Resources', 'Operations Management', 'International Business', 'Information Technology'],
    'MCA': ['Software Engineering', 'Data Science', 'Cyber Security', 'Cloud Computing', 'AI & ML', 'Mobile Application Development'],
    'BCA': ['Software Engineering', 'Data Science', 'Cyber Security', 'Cloud Computing', 'AI & ML', 'Web Development'],
    'B.Sc': ['Computer Science', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Biotechnology'],
    'M.Sc': ['Computer Science', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Biotechnology'],
    'B.Com': ['Accounting', 'Finance', 'Banking', 'Taxation', 'E-Commerce', 'Business Management'],
    'M.Com': ['Accounting', 'Finance', 'Banking', 'Taxation', 'E-Commerce', 'Business Management'],
    'BA': ['English', 'History', 'Political Science', 'Economics', 'Psychology', 'Sociology'],
    'MA': ['English', 'History', 'Political Science', 'Economics', 'Psychology', 'Sociology'],
  };

  // Generate course-stream combinations for filter display
  const courses: string[] = [];
  Object.entries(COURSE_STREAM_MAPPING).forEach(([courseName, streams]) => {
    streams.forEach(stream => {
      courses.push(`${courseName} - ${stream}`);
    });
  });

  const locations = [
    'Bangalore Urban, Karnataka',
    'Mumbai, Maharashtra',
    'Delhi, Delhi',
    'Pune, Maharashtra',
    'Pilani, Rajasthan',
    'Vellore, Tamil Nadu',
    'Tiruchirappalli, Tamil Nadu',
    'Noida, Uttar Pradesh',
    'Bidar, Karnataka',
    'Pehowa, Haryana',
    'Dhuri, Punjab',
  ];

  const affiliations = [
    'Visvesvaraya Technological University',
    'Banglore Central University',
    'Banglore University',
    'Gulbarga University',
    'Karnataka University',
    'Mysore University',
  ];

  const institutionTypes = [
    'All',
    'Private',
    'Government',
    'Semi-Government',
    'Autonomous',
    'Deemed University',
    'Central University',
    'State University'
  ];

  // Filtered lists based on search
  const filteredCourses = courses.filter(course => 
    course.toLowerCase().includes(courseSearchQuery.toLowerCase())
  );

  const filteredLocations = locations.filter(location =>
    location.toLowerCase().includes(locationSearchQuery.toLowerCase())
  );

  const filteredAffiliations = affiliations.filter(affiliation =>
    affiliation.toLowerCase().includes(affiliationSearchQuery.toLowerCase())
  );

  const handleCourseToggle = (course: string) => {
    const updated = selectedCourses.includes(course)
      ? selectedCourses.filter((c) => c !== course)
      : [...selectedCourses, course];
    setSelectedCourses(updated);
    onFilterChange({ ...filters, courses: updated });
  };

  const handleLocationToggle = (location: string) => {
    const updated = selectedLocations.includes(location)
      ? selectedLocations.filter((l) => l !== location)
      : [...selectedLocations, location];
    setSelectedLocations(updated);
    onFilterChange({ ...filters, locations: updated });
  };

  const handleAffiliationToggle = (affiliation: string) => {
    const updated = selectedAffiliations.includes(affiliation)
      ? selectedAffiliations.filter((a) => a !== affiliation)
      : [...selectedAffiliations, affiliation];
    setSelectedAffiliations(updated);
    onFilterChange({ ...filters, affiliations: updated });
  };

  const handleInstitutionTypeToggle = (type: string) => {
    let updated: string[];
    
    if (type === 'All') {
      updated = selectedInstitutionTypes.includes('All') ? [] : ['All'];
    } else {
      updated = selectedInstitutionTypes.filter(t => t !== 'All');
      updated = updated.includes(type)
        ? updated.filter((t) => t !== type)
        : [...updated, type];
    }
    
    setSelectedInstitutionTypes(updated);
    onFilterChange({ ...filters, institutionTypes: updated });
  };

  const handleFeeChange = (max: number) => {
    setFeeMax(max);
    onFilterChange({ ...filters, feeRange: { min: feeMin, max } });
  };

  const handleResetAll = () => {
    setSelectedCourses([]);
    setSelectedLocations([]);
    setSelectedAffiliations([]);
    setSelectedInstitutionTypes([]);
    setFeeMin(0);
    setFeeMax(500000);
    setCourseSearchQuery('');
    setLocationSearchQuery('');
    setAffiliationSearchQuery('');
    onFilterChange({
      courses: [],
      feeRange: { min: 0, max: 500000 },
      locations: [],
      affiliations: [],
      institutionTypes: [],
      category: '',
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 sticky top-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Filter By</h3>
        <button
          onClick={handleResetAll}
          className="text-sm text-[#2463EB] hover:text-[#1d4fb8] font-medium"
        >
          Reset All
        </button>
      </div>

      <div className="space-y-6">
        {/* Active Filters Display */}
        {(selectedCourses.length > 0 || selectedLocations.length > 0 || selectedAffiliations.length > 0 || selectedInstitutionTypes.length > 0) && (
          <div className="pb-4 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Active Filters:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedCourses.map((course) => (
                <span key={course} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-[#2463EB] text-xs rounded-full">
                  {course.length > 30 ? course.substring(0, 30) + '...' : course}
                  <button onClick={() => handleCourseToggle(course)} className="hover:text-[#1d4fb8]">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {selectedLocations.map((location) => (
                <span key={location} className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                  {location}
                  <button onClick={() => handleLocationToggle(location)} className="hover:text-green-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {selectedInstitutionTypes.filter(t => t !== 'All').map((type) => (
                <span key={type} className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full">
                  {type}
                  <button onClick={() => handleInstitutionTypeToggle(type)} className="hover:text-indigo-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Courses Filter */}
        <div>
          <h4 className="text-base font-medium text-gray-900 mb-3">
            Courses {selectedCourses.length > 0 && <span className="text-[#2463EB]">({selectedCourses.length})</span>}
          </h4>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by course..."
              value={courseSearchQuery}
              onChange={(e) => setCourseSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2463EB]"
            />
          </div>
          <div className="space-y-3 max-h-40 overflow-y-auto">
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <label key={course} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedCourses.includes(course)}
                    onChange={() => handleCourseToggle(course)}
                    className="mt-1 w-4 h-4 text-[#2463EB] border-gray-300 rounded focus:ring-[#2463EB]"
                  />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900">
                    {course}
                  </span>
                </label>
              ))
            ) : (
              <p className="text-sm text-gray-400 italic">No courses found</p>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200" />

        {/* Course Fees Filter */}
        <div>
          <h4 className="text-base font-medium text-[#2463EB] mb-3">Course Fees</h4>
          <div className="flex items-center justify-between text-sm text-[#2463EB] mb-2">
            <span>₹{feeMin.toLocaleString()}</span>
            <span>₹{feeMax.toLocaleString()}</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="500000"
              step="10000"
              value={feeMax}
              onChange={(e) => handleFeeChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#2463EB]"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">Maximum annual fees: ₹{feeMax.toLocaleString()}</p>
        </div>

        <div className="border-t border-gray-200" />

        {/* Location Filter */}
        <div>
          <h4 className="text-base font-medium text-gray-900 mb-3">
            Location {selectedLocations.length > 0 && <span className="text-[#2463EB]">({selectedLocations.length})</span>}
          </h4>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by location..."
              value={locationSearchQuery}
              onChange={(e) => setLocationSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2463EB]"
            />
          </div>
          <div className="space-y-3 max-h-40 overflow-y-auto">
            {filteredLocations.length > 0 ? (
              filteredLocations.map((location) => (
                <label key={location} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedLocations.includes(location)}
                    onChange={() => handleLocationToggle(location)}
                    className="mt-1 w-4 h-4 text-[#2463EB] border-gray-300 rounded focus:ring-[#2463EB]"
                  />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900">
                    {location}
                  </span>
                </label>
              ))
            ) : (
              <p className="text-sm text-gray-400 italic">No locations found</p>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200" />

        {/* Affiliated to Filter */}
        <div>
          <h4 className="text-base font-medium text-gray-900 mb-3">
            Affiliated to {selectedAffiliations.length > 0 && <span className="text-[#2463EB]">({selectedAffiliations.length})</span>}
          </h4>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by affiliation..."
              value={affiliationSearchQuery}
              onChange={(e) => setAffiliationSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2463EB]"
            />
          </div>
          <div className="space-y-3 max-h-40 overflow-y-auto">
            {filteredAffiliations.length > 0 ? (
              filteredAffiliations.map((affiliation) => (
                <label key={affiliation} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedAffiliations.includes(affiliation)}
                    onChange={() => handleAffiliationToggle(affiliation)}
                    className="mt-1 w-4 h-4 text-[#2463EB] border-gray-300 rounded focus:ring-[#2463EB]"
                  />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900">
                    {affiliation}
                  </span>
                </label>
              ))
            ) : (
              <p className="text-sm text-gray-400 italic">No affiliations found</p>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200" />

        {/* Types of Institution Filter */}
        <div>
          <h4 className="text-base font-medium text-gray-900 mb-3">
            Types of Institution
          </h4>
          <div className="space-y-3">
            {institutionTypes.map((type) => (
              <label key={type} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedInstitutionTypes.includes(type)}
                  onChange={() => handleInstitutionTypeToggle(type)}
                  className="w-4 h-4 text-[#2463EB] border-gray-300 rounded focus:ring-[#2463EB]"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900">
                  {type}
                </span>
                {type === 'All' && selectedInstitutionTypes.includes('All') && (
                  <svg className="w-3 h-3 text-white" viewBox="0 0 9 7" fill="currentColor">
                    <path d="M8.98551 1.11594L7.86956 0L3.10145 4.7663L1.11594 2.78261L0 3.89855L3.10145 7L8.98551 1.11594Z" />
                  </svg>
                )}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
