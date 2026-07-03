import Image from 'next/image';
import Link from 'next/link';
import { MapPin, GraduationCap, IndianRupee, Flame } from 'lucide-react';

interface CollegeCardProps {
  college: {
    id: number;
    name: string;
    location: string;
    image: string;
    accreditation: string;
    approvals: string;
    spotAdmission: boolean;
    annualFees: number;
    courses: string[];
  };
  onEnquireNow?: () => void;
}

export default function CollegeCard({ college, onEnquireNow }: CollegeCardProps) {
  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 h-full flex flex-col">
      {/* College Image */}
      <div className="relative h-[240px] overflow-hidden bg-gradient-to-br from-blue-50 to-sky-50 flex-shrink-0">
        <Image
          src={college.image}
          alt={college.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Badges Overlay - Top Left */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <span className="inline-flex items-center px-3 py-1.5 bg-white/95 rounded-full text-xs font-medium text-[#2463EB] shadow-sm">
            {college.accreditation}
          </span>
          <span className="inline-flex items-center px-3 py-1.5 bg-white/95 rounded-full text-xs font-medium text-[#2463EB] shadow-sm">
            {college.approvals}
          </span>
        </div>

        {/* Spot Admission - Top Right */}
        {college.spotAdmission && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/95 rounded-full shadow-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-xs font-medium text-[#8B4BFF]">Spot Admission</span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-5 bg-white flex flex-col flex-1">
        {/* College Name */}
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {college.name}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-gray-600 mb-3">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{college.location}</span>
        </div>

        {/* Fees */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <IndianRupee className="w-4 h-4 text-gray-600 flex-shrink-0" />
          <div className="flex-1">
            <span className="text-sm text-gray-600">Annual Fees: </span>
            <span className="text-sm font-semibold text-gray-900">
              ₹ {college.annualFees.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Courses */}
        <div className="flex items-start gap-1.5 mb-5">
          <GraduationCap className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <span className="text-sm text-gray-600">Courses: </span>
            <span className="text-sm font-medium text-gray-900">
              {college.courses.slice(0, 2).join(', ')}
              {college.courses.length > 2 && ` +${college.courses.length - 2} more...`}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 mt-auto">
          <Link href={`/profile/college/${college.id}`} className="flex-1">
            <button className="w-full py-2.5 bg-white border border-[#0D7FF0] text-[#0270DF] font-medium text-sm rounded-lg hover:bg-blue-50 transition-all">
              View College
            </button>
          </Link>
          <button 
            onClick={onEnquireNow}
            className="flex-1 py-2.5 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white font-medium text-sm rounded-lg hover:opacity-90 transition-all"
          >
            Enquire Now
          </button>
        </div>
      </div>
    </div>
  );
}
