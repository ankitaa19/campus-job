import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, GraduationCap, MapPin } from 'lucide-react';

interface CollegeCardProps {
  college: {
    id: string | number;
    name: string;
    location: string;
    image?: string;
    accreditation?: string;
    approvalBadges?: string[];
    approvals?: string;
    courses?: string[];
    averagePackage?: string | number;
    placementRate?: string | number;
    establishedYear?: string | number;
  };
  onEnquireNow?: () => void;
}

const displayValue = (value?: string | number, prefix = '') => {
  if (value === undefined || value === null || value === '') return 'Not disclosed';
  return typeof value === 'number' ? `${prefix}${value.toLocaleString('en-IN')}` : value;
};

const displayPlacement = (value?: string | number) => {
  if (value === undefined || value === null || value === '') return 'Not disclosed';
  return typeof value === 'number' ? `${value}%` : value;
};

export default function CollegeCard({ college, onEnquireNow }: CollegeCardProps) {
  const approvalBadges = college.approvalBadges?.length
    ? college.approvalBadges
    : (college.approvals || '').split(',').map((item) => item.replace(' Approved', '').trim()).filter(Boolean);
  const courses = college.courses || [];

  return (
    <article className="flex min-h-[584px] flex-col overflow-hidden rounded-[30px] border border-[#aebbd1] bg-white">
      <div className="relative h-[200px] shrink-0 bg-[linear-gradient(108deg,#7056a6_0%,#d57ab8_56%,#fb87bd_100%)] px-[37px] pt-[45px] text-white">
        <div className="flex items-start gap-4">
          <div className="relative h-[86px] w-[86px] shrink-0 overflow-hidden rounded-[22px] bg-white/30">
            {college.image ? (
              <Image src={college.image} alt={college.name} fill className="object-cover" unoptimized />
            ) : null}
          </div>
          <div className="min-w-0 pt-0.5">
            <h3 className="text-[23px] font-semibold leading-[1.28]">{college.name}</h3>
            <p className="mt-3 flex items-center gap-1.5 text-[15px] text-white/95">
              <MapPin className="h-4 w-4" />
              {college.location || 'Location not disclosed'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-[37px] pb-[57px]">
        <div className="relative -mt-11 grid min-h-[112px] grid-cols-2 divide-x divide-[#cbd2dd] overflow-hidden rounded-[26px] border border-[#d7dce7] bg-white shadow-sm">
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <p className="text-sm font-medium uppercase text-slate-800">Avg Package</p>
            <p className="mt-2 text-2xl font-semibold text-[#6d7081]">{displayValue(college.averagePackage, '₹')}</p>
          </div>
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <p className="text-sm font-medium uppercase text-slate-800">Placement</p>
            <p className="mt-2 text-2xl font-semibold text-[#6d7081]">{displayPlacement(college.placementRate)}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[college.accreditation, ...approvalBadges].filter(Boolean).map((badge) => (
              <span key={badge} className="rounded-full border border-[#1484ff] px-3 py-1 text-xs font-medium text-[#0877ed]">
                {badge}
              </span>
            ))}
          </div>
          {college.establishedYear ? (
            <span className="flex items-center gap-1.5 text-sm text-[#6d7081]">
              <CalendarDays className="h-4 w-4" /> Est: {college.establishedYear}
            </span>
          ) : null}
        </div>

        <div className="mt-10">
          <p className="flex items-center gap-2 text-xl text-[#6d7081]">
            <GraduationCap className="h-5 w-5" /> Courses:
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {courses.slice(0, 4).map((course) => (
              <span key={course} className="rounded-lg bg-[#f0eafe] px-5 py-2 text-sm font-medium text-[#0877ed]">{course}</span>
            ))}
            {courses.length > 4 ? <span className="rounded-lg bg-[#f0eafe] px-5 py-2 text-sm font-medium text-[#0877ed]">+ {courses.length - 4} more</span> : null}
          </div>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-4 pt-12">
          <Link href={`/profile/college/${college.id}`} className="rounded border border-[#cbd2dd] py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            View College
          </Link>
          <button type="button" onClick={onEnquireNow} className="rounded bg-[#087ceb] py-3 text-sm font-semibold text-white transition hover:bg-[#066bd0]">
            Enquire Now
          </button>
        </div>
      </div>
    </article>
  );
}
