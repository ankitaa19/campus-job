import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Check, Download } from "lucide-react";
import clsx from "clsx";

type Row = { m: string; enquiries: number; interviews: number; invites: number };

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// 👇 replace with your real numbers (length 12). These are placeholders.
const FULL_YEAR_DATA: Row[] = [
  { m: "Jan", enquiries: 140, interviews: 90,  invites: 28 },
  { m: "Feb", enquiries: 180, interviews: 115, invites: 38 },
  { m: "Mar", enquiries: 200, interviews: 140, invites: 48 },
  { m: "Apr", enquiries: 170, interviews: 100, invites: 36 },
  { m: "May", enquiries: 150, interviews: 95,  invites: 30 },
  { m: "Jun", enquiries: 130, interviews: 80,  invites: 26 },
  { m: "Jul", enquiries: 160, interviews: 110, invites: 34 },
  { m: "Aug", enquiries: 190, interviews: 135, invites: 44 },
  { m: "Sep", enquiries: 210, interviews: 150, invites: 52 },
  { m: "Oct", enquiries: 0,   interviews: 0,   invites: 0  }, // ignored if future
  { m: "Nov", enquiries: 0,   interviews: 0,   invites: 0  },
  { m: "Dec", enquiries: 0,   interviews: 0,   invites: 0  },
];

// Excel export utility function
const exportToExcel = (data: Row[], selectedMonths: string[]) => {
  const filteredData = data.filter(row => selectedMonths.includes(row.m));
  
  // Create CSV content
  const headers = ['Month', 'Enquiries', 'Interviews', 'Job Invitations'];
  const csvContent = [
    headers.join(','),
    ...filteredData.map(row => [row.m, row.enquiries, row.interviews, row.invites].join(','))
  ].join('\n');
  
  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `Monthly_Performance_${new Date().getDate()}_${new Date().getMonth() + 1}_${new Date().getFullYear()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function MonthlyPerformanceCard() {
  const maxY = 240;
  const groupW = 120; // width reserved for each month group
  const padL = 60;    // SVG inner padding for Y axis labels
  const padR = 16;
  const padT = 8;
  const padB = 36;
  const barW = 18;
  const barGap = 10;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentIdx = now.getMonth(); // 0=Jan ... 11=Dec

  // State for month selection dropdown (for export only)
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [selectedMonthsForExport, setSelectedMonthsForExport] = useState<string[]>(() => {
    // Default to current year Jan to current month for export
    return MONTHS.slice(0, currentIdx + 1);
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMonthDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Only show Jan..current month (no future) - this is for chart display
  const data = useMemo<Row[]>(
    () => FULL_YEAR_DATA.slice(0, currentIdx + 1),
    [currentIdx]
  );

  // Initial scroll to show last 5 months (or all if <5)
  const scrollerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!scrollerRef.current) return;
    const visibleCount = Math.min(5, data.length);
    const startIndex = Math.max(0, data.length - visibleCount);
    scrollerRef.current.scrollLeft = startIndex * groupW;
  }, [data.length]);

  const innerH = 260 - padT - padB;
  const scaleY = (v: number) => innerH - (v / maxY) * innerH;

  const scrollBy = (dir: "left" | "right") => {
    scrollerRef.current?.scrollBy({ left: (dir === "left" ? -1 : 1) * groupW * 1.2, behavior: "smooth" });
  };

  // Handle month selection for export
  const toggleMonthForExport = (month: string) => {
    if (selectedMonthsForExport.includes(month)) {
      // Don't allow deselecting if it's the only month selected
      if (selectedMonthsForExport.length > 1) {
        setSelectedMonthsForExport(prev => prev.filter(m => m !== month));
      }
    } else {
      setSelectedMonthsForExport(prev => [...prev, month].sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b)));
    }
  };

  // Handle export
  const handleExport = () => {
    exportToExcel(data, selectedMonthsForExport);
  };

  // Handle WhatsApp share
  const handleWhatsAppShare = () => {
    const reportData = data.filter(month => selectedMonthsForExport.includes(month.m));
    
    // Create a formatted report text
    const reportText = `📊 *Monthly Performance Report*\n` +
      `📅 Period: ${exportDisplayRange}\n\n` +
      `📈 *Summary:*\n` +
      reportData.map(month => 
        `• ${month.m}: ${month.enquiries} Enquiries, ${month.interviews} Interviews, ${month.invites} Job Invitations`
      ).join('\n') + 
      `\n\n🎯 *Total Overview:*\n` +
      `• Total Enquiries: ${reportData.reduce((sum, month) => sum + month.enquiries, 0)}\n` +
      `• Total Interviews: ${reportData.reduce((sum, month) => sum + month.interviews, 0)}\n` +
      `• Total Job Invitations: ${reportData.reduce((sum, month) => sum + month.invites, 0)}\n\n` +
      `Generated on ${new Date().toLocaleDateString('en-GB')} via CampusPe Dashboard`;

    // Encode the message for WhatsApp URL
    const encodedMessage = encodeURIComponent(reportText);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    
    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank');
  };

  // Format display range for export button
  const exportDisplayRange = useMemo(() => {
    if (selectedMonthsForExport.length === 0) return `Jan–Sep ${currentYear}`;
    const sortedMonths = selectedMonthsForExport.sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b));
    if (sortedMonths.length === 1) {
      return `${sortedMonths[0]} ${currentYear}`;
    }
    return `${sortedMonths[0]}–${sortedMonths[sortedMonths.length - 1]} ${currentYear}`;
  }, [selectedMonthsForExport, currentYear]);

  // Display range for showing current chart data
  const chartDisplayRange = `Jan–${MONTHS[currentIdx]} ${currentYear}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-[22px] md:text-2xl font-semibold text-gray-900">Monthly Performance</h3>
          <p className="text-gray-600 mt-1">Enquiries, interviews, and job invitations trend</p>
        </div>

<div className="flex gap-3">
  {/* Month Selection Dropdown */}
  <div className="relative" ref={dropdownRef}>
    <button
      onClick={() => setShowMonthDropdown((p) => !p)}
      className="inline-flex items-center gap-2 border border-[#1182F2] text-[#1182F2] bg-blue-50/40 hover:bg-blue-50 text-sm px-4 py-2 rounded-lg transition-colors"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 7a1 1 0 011-1h3.5a1 1 0 011 1v1a1 1 0 01-1 1H5a1 1 0 01-1-1V7zM4 13a1 1 0 011-1h3.5a1 1 0 011 1v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-1zM11 7a1 1 0 011-1h3.5a1 1 0 011 1v1a1 1 0 01-1 1H12a1 1 0 01-1-1V7zM11 13a1 1 0 011-1h3.5a1 1 0 011 1v1a1 1 0 01-1 1H12a1 1 0 01-1-1v-1zM18 7a1 1 0 011-1h1.5a1 1 0 011 1v1a1 1 0 01-1 1H19a1 1 0 01-1-1V7zM18 13a1 1 0 011-1h1.5a1 1 0 011 1v1a1 1 0 01-1 1H19a1 1 0 01-1-1v-1z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
      {exportDisplayRange}
      <ChevronDown
        className={clsx(
          "h-4 w-4 transition-transform",
          showMonthDropdown && "rotate-180"
        )}
      />
    </button>

    {showMonthDropdown && (
      <div
        className={clsx(
          "absolute right-0 top-full z-10 mt-2 min-w-64",
          "rounded-2xl border border-gray-200 bg-white shadow-xl"
        )}
      >
        {/* “Control” header row like the screenshot */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="text-[17px] font-medium text-gray-600">
            {exportDisplayRange}
          </div>
          <ChevronDown className="h-5 w-5 -rotate-180 text-gray-700" />
        </div>

        {/* Options */}
        <div className="max-h-[22rem] overflow-y-auto py-2">
          {data.map((month) => {
            const selected = selectedMonthsForExport.includes(month.m);
            return (
              <label
                key={month.m}
                className={clsx(
                  "relative mx-3 my-1 flex cursor-pointer items-center rounded-full px-4 py-2",
                  "transition-colors",
                  selected
                    ? "bg-[#E7EEF5]"
                    : "hover:bg-gray-50"
                )}
              >
                {/* Keep your exact text span intact */}
                <span className="text-base leading-6 text-gray-700">
                  <span className="text-sm text-gray-700">
                    {month.m} {currentYear}
                  </span>
                </span>

                {/* Right-aligned checkmark when selected */}
                {selected && (
                  <Check className="absolute right-4 h-5 w-5 text-gray-500" />
                )}

                {/* Keep logic the same – visually hide the checkbox */}
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleMonthForExport(month.m)}
                  className="sr-only"
                />
              </label>
            );
          })}
        </div>

        {/* Soft bottom radius and shadow match */}
        <div className="pb-2" />
      </div>
    )}
  </div>

  {/* Export Details Button */}
  <button
    onClick={handleExport}
    className="inline-flex items-center gap-2 border border-[#1182F2] text-[#1182F2] bg-blue-50/40 hover:bg-blue-50 text-sm px-4 py-2 rounded-lg transition-colors"
  >
    <Download className="h-4 w-4" />
    Export Details
  </button>

  {/* Share Report Button */}
  <button
    onClick={handleWhatsAppShare}
    className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2791FC] to-[#0377EB] text-white px-4 py-2 rounded-md text-sm hover:from-[#0377EB] hover:to-[#2791FC]"
  >
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#25D366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
    </svg>
    Share Report
  </button>
</div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-gray-500">
          Showing: {chartDisplayRange}
        </div>
        <div className="flex gap-2">
          <button onClick={() => scrollBy("left")} className="h-9 w-9 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
            ‹
          </button>
          <button onClick={() => scrollBy("right")} className="h-9 w-9 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
            ›
          </button>
        </div>
      </div>

      {/* Horizontal scroller with snap */}
      <div
        ref={scrollerRef}
        className="overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div
          className="relative"
          style={{
            width: `${data.length * groupW + padL + padR}px`,
            height: 260,
          }}
        >
          {/* Grid + axes (spanning the whole strip) */}
          <svg
            className="absolute top-0 left-0"
            viewBox={`0 0 ${data.length * groupW + padL + padR} 260`}
            width={data.length * groupW + padL + padR}
            height={260}
          >
            {/* Y gridlines + labels */}
            {[0, 60, 120, 180, 240].map((t) => (
              <g key={t}>
                <line
                  x1={padL}
                  x2={data.length * groupW + padL}
                  y1={padT + scaleY(t)}
                  y2={padT + scaleY(t)}
                  stroke="#EAECEF"
                />
                <text
                  x={padL - 10}
                  y={padT + scaleY(t)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill="#9CA3AF"
                  fontSize={12}
                >
                  {t === 0 ? "" : t}
                </text>
              </g>
            ))}
            {/* Y axis with arrow */}
            <defs>
              <marker id="arrY" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                <path d="M0,8 L4,0 L8,8" fill="none" stroke="#D1D5DB" strokeWidth="2" />
              </marker>
              <marker id="arrX" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8" fill="none" stroke="#D1D5DB" strokeWidth="2" />
              </marker>
            </defs>
            <line x1={padL} y1={padT + innerH + 6} x2={padL} y2={padT - 8} stroke="#D1D5DB" strokeWidth="2" markerEnd="url(#arrY)" />
            {/* X axis with arrow */}
            <line x1={padL - 6} y1={padT + innerH} x2={data.length * groupW + padL + 8} y2={padT + innerH} stroke="#D1D5DB" strokeWidth="2" markerEnd="url(#arrX)" />
          </svg>

          {/* Bars per month (each month is a snap group) */}
          <div className="absolute top-0 left-0 h-full flex">
            {/* left padding block for Y axis space */}
            <div style={{ width: padL }} />
            {data.map((d) => (
              <div
                key={d.m}
                className="snap-start h-full flex flex-col items-center justify-end"
                style={{ width: groupW }}
                aria-label={d.m}
              >
                {/* Bars group as an SVG for crispness */}
                <svg width={groupW} height={260}>
                  {/* plot area */}
                  <g transform={`translate(0,0)`}>
                    {/* bars */}
                    {[
                      { v: d.enquiries, x: (groupW - (3 * barW + 2 * barGap)) / 2 + 0 * (barW + barGap), fill: "#1677FF" },
                      { v: d.interviews, x: (groupW - (3 * barW + 2 * barGap)) / 2 + 1 * (barW + barGap), fill: "#F59E0B" },
                      { v: d.invites,   x: (groupW - (3 * barW + 2 * barGap)) / 2 + 2 * (barW + barGap), fill: "#10B981" },
                    ].map((b, i) => {
                      const y = padT + scaleY(b.v);
                      const h = innerH - scaleY(b.v);
                      return <rect key={i} x={b.x} y={y} width={barW} height={h} rx={6} fill={b.fill} opacity="0.95" />;
                    })}
                    {/* month label */}
                    <text x={groupW / 2} y={padT + innerH + 24} textAnchor="middle" fill="#6B7280" fontSize={12}>
                      {d.m}
                    </text>
                  </g>
                </svg>
              </div>
            ))}
            {/* right padding block */}
            <div style={{ width: padR }} />
          </div>
        </div>
      </div>
    </div>
  );
}
