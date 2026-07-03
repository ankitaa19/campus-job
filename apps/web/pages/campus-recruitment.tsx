import React, { useMemo, useState } from 'react';
import { ChevronDown, GraduationCap } from 'lucide-react';
import { useRouter } from 'next/router';
import { campusRecruitmentColleges } from '../data/campusRecruitmentColleges';
import { CampusRecruitmentCollegeCard } from '../components/recruiter/CampusRecruitmentCollegeCard';

const graduationYearOptions = ['Batch of 2023', 'Batch of 2024', 'Batch of 2025', 'Batch of 2026'];

const FilterButton = ({ label, value }: { label: string; value: string }) => (
  <button
    type="button"
    className="flex items-center gap-3 rounded-full border border-[#D5DCF1] bg-white px-5 py-3 text-sm font-semibold text-[#0A0A0A] shadow-[0_12px_28px_rgba(29,63,130,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(29,63,130,0.12)]"
  >
    <span>{label}</span>
    <div className="flex items-center gap-2 text-xs font-semibold text-[#6F7287]">
      <span>{value}</span>
      <ChevronDown className="h-4 w-4 text-[#6F7287]" strokeWidth={1.5} />
    </div>
  </button>
);

const CampusRecruitment: React.FC = () => {
  const router = useRouter();
  const [selectedGraduationYears, setSelectedGraduationYears] = useState<string[]>([]);
  const [selectedColleges, setSelectedColleges] = useState<string[]>([]);

  const selectionSummary = useMemo(
    () => ({
      colleges: selectedColleges.length,
      years: selectedGraduationYears.length,
    }),
    [selectedColleges.length, selectedGraduationYears.length]
  );

  const handleGraduationYearChange = (year: string) => {
    setSelectedGraduationYears((prev) =>
      prev.includes(year) ? prev.filter((item) => item !== year) : [...prev, year]
    );
  };

  const handlePostJob = () => {
    router.push('/dashboard/recruiter?tab=jobs');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-12">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-10 w-10 text-[#1484F3]" strokeWidth={1.5} />
            <div>
              <h1 className="text-3xl font-bold text-[#0A0A0A]">Campus Recruitment</h1>
              <p className="mt-2 text-sm text-[#5D6B89]">
                Job will be shared directly with selected colleges for targeted campus recruitment
              </p>
            </div>
          </div>
        </header>

        <section className="mb-10 flex flex-wrap gap-4">
          <FilterButton label="Degree Level" value="All Degrees" />
          <FilterButton label="Specialization" value="All Specializations" />
        </section>

        <section className="mb-10 rounded-[28px] border border-[#C8DCFF] bg-[#F5FAFF] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#0A0A0A]">Target Graduation Years</h2>
              <p className="mt-1 text-sm text-[#5D6B89]">
                Select multiple graduation years to maximize your candidate pool
              </p>
            </div>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1484F3] shadow-[0_6px_16px_rgba(20,132,243,0.15)]">
              {selectionSummary.years} years selected
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {graduationYearOptions.map((year) => {
              const checked = selectedGraduationYears.includes(year);
              return (
                <label
                  key={year}
                  className={[
                    'flex items-center justify-between rounded-[16px] border px-4 py-3 text-sm font-medium transition',
                    checked
                      ? 'border-[#1484F3] bg-white text-[#1484F3]'
                      : 'border-transparent bg-white text-[#6F7287]',
                    'shadow-[0_8px_20px_rgba(29,63,130,0.08)] hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(29,63,130,0.12)]',
                  ].join(' ')}
                >
                  <span>{year}</span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleGraduationYearChange(year)}
                    className="h-4 w-4 rounded border-[1.5px] border-[#1484F3] text-[#1484F3] focus:ring-[#1484F3]"
                  />
                </label>
              );
            })}
          </div>
        </section>

        <section className="mb-8">
          <div className="rounded-2xl border border-[#22C55E] bg-[#F0FFF4] p-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#CFF7D6] px-4 py-2 text-sm font-semibold text-[#15803D]">
              <span>{selectionSummary.colleges} colleges</span>
              <span className="text-[#22C55E]">•</span>
              <span>{selectionSummary.years} graduation years selected</span>
            </span>
          </div>
        </section>

        <section className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {campusRecruitmentColleges.map((college) => (
            <CampusRecruitmentCollegeCard
              key={college.id}
              college={college}
              selected={selectedColleges.includes(college.id)}
              onToggle={(nextSelected) => {
                setSelectedColleges((prev) =>
                  nextSelected
                    ? [...prev, college.id]
                    : prev.filter((id) => id !== college.id)
                );
              }}
            />
          ))}
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-[#5D6B89]">
            Showing {campusRecruitmentColleges.length} colleges
          </div>
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              className="rounded-full border border-[#D4D8E4] px-8 py-3 text-sm font-semibold text-gray-700 transition hover:bg-[#F2F4FF]"
              onClick={() => router.back()}
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded-full px-10 py-3 text-sm font-semibold text-white shadow-sm transition"
              style={{ background: 'linear-gradient(90deg, #0B58F4 0%, #2590FB 100%)' }}
              onClick={handlePostJob}
            >
              Post Job
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default CampusRecruitment;

