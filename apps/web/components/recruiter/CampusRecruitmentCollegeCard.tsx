import { memo } from 'react';
import { MapPin, Users } from 'lucide-react';
import { CampusRecruitmentCollege } from '../../data/campusRecruitmentColleges';

interface CampusRecruitmentCollegeCardProps {
  college: CampusRecruitmentCollege;
  selected?: boolean;
  onToggle?: (nextValue: boolean) => void;
  showCheckbox?: boolean;
}

const numberFormatter = new Intl.NumberFormat('en-IN');

const studentBadgeBase =
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold';
const educationBadgeBase =
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium';

const CampusRecruitmentCollegeCardComponent: React.FC<CampusRecruitmentCollegeCardProps> = ({
  college,
  selected = false,
  onToggle,
  showCheckbox = true,
}) => {
  const specializationVisible = college.specializations.slice(0, 3);
  const remainingSpecializations = college.specializations.length - specializationVisible.length;

  const handleCardClick = () => {
    if (onToggle) {
      onToggle(!selected);
    }
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onToggle) {
      onToggle(event.target.checked);
    }
  };

  return (
    <div
      role={onToggle ? 'button' : undefined}
      tabIndex={onToggle ? 0 : -1}
      onClick={handleCardClick}
      onKeyDown={(event) => {
        if ((event.key === 'Enter' || event.key === ' ') && onToggle) {
          event.preventDefault();
          onToggle(!selected);
        }
      }}
      className={[
        'group relative flex h-full w-full max-w-[352px] flex-col rounded-[24px] border bg-white p-6 transition-all duration-200',
        'shadow-[0px_14px_28px_rgba(29,63,130,0.08)] hover:-translate-y-1 hover:shadow-[0px_18px_32px_rgba(29,63,130,0.12)]',
        selected ? 'border-[#1484F3]' : 'border-[#DDE2F2]',
        onToggle ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1484F3]' : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between">
        {showCheckbox ? (
          <label
            className="flex items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={selected}
              onChange={handleCheckboxChange}
              className="h-4 w-4 rounded border-[1.5px] border-[#B8C2DB] text-[#1484F3] focus:ring-[#1484F3]"
            />
          </label>
        ) : (
          <span className="h-4 w-4" />
        )}

        <div className="flex items-center gap-1.5 text-[#1484F3]">
          <Users className="h-4 w-4" strokeWidth={1.5} />
          <span className="text-sm font-semibold">
            {numberFormatter.format(college.totalStudents)}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold text-[#0A0A0A]">{college.name}</h3>
        <div className="mt-1 flex items-center gap-1.5 text-sm text-[#6F7287]">
          <MapPin className="h-4 w-4 text-[#A3ADC7]" strokeWidth={1.5} />
          <span>{college.location}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {college.studentsByYear.map((entry) => (
          <span
            key={entry.label}
            className={studentBadgeBase}
            style={{ backgroundColor: '#E8DEFF', color: '#6F3FF5' }}
          >
            {entry.label}: {entry.count} students
          </span>
        ))}
      </div>

      <div className="my-4 h-px w-full bg-[#EDF1FF]" />

      <div>
        <p className="text-sm font-medium text-[#6F7287]">Affiliated to:</p>
        <p className="mt-1 text-base font-semibold text-[#0A0A0A]">{college.affiliation}</p>
      </div>

      <div className="my-4 h-px w-full bg-[#EDF1FF]" />

      <div className="flex flex-wrap gap-2">
        {college.programs.map((program) => (
          <span
            key={program}
            className={educationBadgeBase}
            style={{ backgroundColor: '#FFE8D0', color: '#FF8A00' }}
          >
            {program}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {specializationVisible.map((spec) => (
          <span
            key={spec}
            className={educationBadgeBase}
            style={{ backgroundColor: '#DCEBFF', color: '#1484F3' }}
          >
            {spec}
          </span>
        ))}
        {remainingSpecializations > 0 && (
          <span
            className={educationBadgeBase}
            style={{ backgroundColor: '#DCEBFF', color: '#1484F3' }}
          >
            +{remainingSpecializations} more
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={(event) => event.stopPropagation()}
        className="mt-6 w-full rounded-full bg-[#E7F2FF] py-3 text-sm font-semibold text-[#0B58F4] transition-colors hover:bg-[#d5e8ff]"
      >
        View Details
      </button>
    </div>
  );
};

export const CampusRecruitmentCollegeCard = memo(CampusRecruitmentCollegeCardComponent);

