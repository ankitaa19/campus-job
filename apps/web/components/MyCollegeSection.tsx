import React, { useState } from 'react';

const ShieldIcon = () => (
  <svg width="32" height="36" viewBox="0 0 35 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 16.1501C1 10.3943 1 7.5165 1.67954 6.54834C2.35905 5.58017 5.06498 4.65393 10.4768 2.80142L11.5079 2.4485C14.329 1.48283 15.7395 1 17.2 1C18.6605 1 20.071 1.48283 22.8921 2.4485L23.9232 2.80142C29.3351 4.65393 32.041 5.58017 32.7205 6.54834C33.4 7.5165 33.4 10.3943 33.4 16.1501C33.4 17.0193 33.4 17.9621 33.4 18.9845C33.4 29.1329 25.7698 34.0579 20.9825 36.1491C19.684 36.7163 19.0347 37 17.2 37C15.3653 37 14.716 36.7163 13.4174 36.1491C8.63013 34.0579 1 29.1329 1 18.9845C1 17.9621 1 17.0193 1 16.1501Z" stroke="#1484F3" strokeWidth="2"/>
    <path d="M17.1969 21.675V27.075M19.8963 20.9507C17.3141 22.4416 14.012 21.5569 12.5211 18.9745C11.0302 16.3922 11.915 13.0902 14.4974 11.5992C15.5499 10.9915 16.7222 10.7785 17.8425 10.9143C19.4706 11.1117 20.9895 12.0457 21.8726 13.5754C22.7558 15.1052 22.8053 16.8875 22.1622 18.3963C21.7196 19.4344 20.949 20.343 19.8963 20.9507Z" stroke="#1484F3" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.33073 12.25V11.0833C9.33073 10.4645 9.0849 9.871 8.64731 9.43342C8.20973 8.99583 7.61623 8.75 6.9974 8.75H3.4974C2.87856 8.75 2.28506 8.99583 1.84748 9.43342C1.4099 9.871 1.16406 10.4645 1.16406 11.0833V12.25" stroke="white" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9.33594 1.82812C9.83629 1.95784 10.2794 2.25003 10.5958 2.65883C10.9121 3.06763 11.0837 3.56989 11.0837 4.08679C11.0837 4.60369 10.9121 5.10596 10.5958 5.51476C10.2794 5.92355 9.83629 6.21574 9.33594 6.34546" stroke="white" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12.8359 12.2523V11.0856C12.8356 10.5686 12.6635 10.0664 12.3467 9.65781C12.03 9.24921 11.5865 8.95737 11.0859 8.82812" stroke="white" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.2474 6.41667C6.53606 6.41667 7.58073 5.372 7.58073 4.08333C7.58073 2.79467 6.53606 1.75 5.2474 1.75C3.95873 1.75 2.91406 2.79467 2.91406 4.08333C2.91406 5.372 3.95873 6.41667 5.2474 6.41667Z" stroke="white" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const BuildingIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.5 12.8385V2.33854C3.5 2.02912 3.62292 1.73238 3.84171 1.51358C4.0605 1.29479 4.35725 1.17188 4.66667 1.17188H9.33333C9.64275 1.17188 9.9395 1.29479 10.1583 1.51358C10.3771 1.73238 10.5 2.02912 10.5 2.33854V12.8385H3.5Z" stroke="white" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3.4974 7H2.33073C2.02131 7 1.72456 7.12292 1.50577 7.34171C1.28698 7.5605 1.16406 7.85725 1.16406 8.16667V11.6667C1.16406 11.9761 1.28698 12.2728 1.50577 12.4916C1.72456 12.7104 2.02131 12.8333 2.33073 12.8333H3.4974" stroke="white" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.5 5.25H11.6667C11.9761 5.25 12.2728 5.37292 12.4916 5.59171C12.7104 5.8105 12.8333 6.10725 12.8333 6.41667V11.6667C12.8333 11.9761 12.7104 12.2728 12.4916 12.4916C12.2728 12.7104 11.9761 12.8333 11.6667 12.8333H10.5" stroke="white" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.83594 3.5H8.16927" stroke="white" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.83594 5.82812H8.16927" stroke="white" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.83594 8.17188H8.16927" stroke="white" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.83594 10.5H8.16927" stroke="white" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.3655 11.3837C7.6218 10.4176 7.25 9.9345 7.25 8.5C7.25 7.0655 7.6218 6.5825 8.3655 5.6163C9.8505 3.6871 12.3408 1.5 16 1.5C19.6592 1.5 22.1495 3.6871 23.6345 5.6163C24.3781 6.5825 24.75 7.0655 24.75 8.5C24.75 9.9345 24.3781 10.4176 23.6345 11.3837C22.1495 13.3129 19.6592 15.5 16 15.5C12.3408 15.5 9.8505 13.3129 8.3655 11.3837Z" stroke="#1383F3" strokeWidth="1.5"/>
    <path d="M18.625 8.5C18.625 9.9498 17.4498 11.125 16 11.125C14.5502 11.125 13.375 9.9498 13.375 8.5C13.375 7.0502 14.5502 5.875 16 5.875C17.4498 5.875 18.625 7.0502 18.625 8.5Z" stroke="#1383F3" strokeWidth="1.5"/>
  </svg>
);

const EmailIcon = () => (
  <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.8929 1.84276C17.8183 1.47695 17.6502 1.13121 17.405 0.840542C17.3552 0.779517 17.3031 0.725227 17.2461 0.670154C16.8098 0.244271 16.2029 0 15.581 0H2.35575C1.72687 0 1.13541 0.238114 0.690322 0.670393C0.633989 0.724955 0.581755 0.779789 0.530047 0.842753C0.285868 1.1322 0.118516 1.47746 0.0457529 1.84378C0.0153444 1.98764 0 2.1367 0 2.28749V11.3065C0 11.6202 0.0656516 11.9258 0.195799 12.2162C0.308429 12.4742 0.479319 12.7187 0.690182 12.9234C0.743292 12.9747 0.796051 13.022 0.852384 13.0682C1.27397 13.4072 1.8078 13.5938 2.35575 13.5938H15.581C16.1325 13.5938 16.6658 13.4065 17.0863 13.0645C17.1424 13.0203 17.1945 12.9739 17.2466 12.9234C17.4505 12.7257 17.6124 12.4985 17.7289 12.248L17.7442 12.2123C17.872 11.9273 17.9368 11.6228 17.9368 11.3065V2.28749C17.9368 2.13867 17.922 1.98862 17.8929 1.84276ZM1.21995 1.45984C1.25327 1.41249 1.29579 1.36388 1.35006 1.31078C1.61943 1.04937 1.97666 0.905513 2.35571 0.905513H15.581C15.9633 0.905513 16.3207 1.04961 16.5871 1.31129C16.6331 1.35643 16.677 1.40654 16.7153 1.45661L16.8165 1.58859L9.75735 7.56239C9.53972 7.74765 9.25953 7.84959 8.9683 7.84959C8.67995 7.84959 8.4 7.74788 8.17978 7.56263L1.12771 1.59029L1.21995 1.45984ZM0.937304 11.3861C0.933485 11.3615 0.932609 11.3343 0.932609 11.3065V2.47424L6.41069 7.11443L0.987891 11.7053L0.937304 11.3861ZM16.2867 12.5061C16.0747 12.6249 15.8305 12.6879 15.581 12.6879H2.35575C2.10607 12.6879 1.862 12.6249 1.65012 12.5061L1.42843 12.3814L7.03144 7.64022L7.6455 8.15884C8.01383 8.46934 8.48355 8.64051 8.96837 8.64051C9.45498 8.64051 9.92547 8.46934 10.2936 8.15884L10.9074 7.63999L16.5085 12.3816L16.2867 12.5061ZM17.004 11.3065C17.004 11.3338 17.0034 11.3608 16.9999 11.3848L16.9513 11.707L11.5262 7.11692L17.004 2.47649V11.3065Z" fill="#0A0A0A"/>
  </svg>
);

const PhoneIcon = () => (
  <svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.55504 0.477635C3.55504 0.477635 3.34504 0 3.02431 0C2.70868 0 2.54449 0.141499 2.43504 0.239126C2.32559 0.336754 0.494131 1.79808 0.494131 1.79808C0.494131 1.79808 -0.0385053 2.24977 0.00222199 3.09937C0.0365856 3.94898 0.207767 5.15821 1.09613 6.8426C1.97813 8.52328 4.18568 11.0913 5.58058 11.994C5.58058 11.994 6.87304 12.9567 8.07577 13.3478C8.42513 13.4547 9.12386 13.5937 9.28677 13.5937C9.45222 13.5937 9.74431 13.5937 10.0797 13.3559C10.4208 13.1155 12.3343 11.6214 12.3343 11.6214C12.3343 11.6214 12.8027 11.2105 12.2586 10.7329C11.7119 10.2552 10.0523 9.19308 9.69722 8.91379C9.34149 8.63018 8.83495 8.75499 8.61604 8.94716C8.39777 9.14056 8.00768 9.45878 7.95995 9.49894C7.88868 9.55208 7.69331 9.72447 7.4744 9.63859C7.19568 9.53169 6.05277 8.92924 4.99322 7.52167C3.94004 6.11533 3.82422 5.65562 3.66704 5.15883C3.64038 5.08539 3.64001 5.00536 3.666 4.9317C3.69198 4.85803 3.74279 4.79502 3.81022 4.75287C3.96804 4.64659 4.54904 4.17637 4.54904 4.17637C4.54904 4.17637 4.92513 3.81614 4.76795 3.39164C4.61077 2.96714 3.55504 0.477635 3.55504 0.477635Z" fill="#0A0A0A"/>
  </svg>
);

const DocumentIcon = () => (
  <svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.8027 10.75L7.38168 15.1711L5.48687 13.2763M9.77253 0.78081V5.31141C9.77253 6.47412 10.7151 7.41667 11.8778 7.41667H16.3809M9.77253 0.78081C9.41389 0.76 9.03821 0.75 8.64474 0.75C2.60759 0.75 0.75 3.10294 0.75 10.75C0.75 18.3971 2.60759 20.75 8.64474 20.75C14.6819 20.75 16.5395 18.3971 16.5395 10.75C16.5395 9.50221 16.49 8.39534 16.3809 7.41667M9.77253 0.78081L16.3809 7.41667" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface MyCollegeSectionProps {
  className?: string;
}

const MyCollegeSection: React.FC<MyCollegeSectionProps> = ({ className = '' }) => {
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  return (
    <div className={`min-h-screen bg-white ${className}`}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold font-['Poppins'] mb-2">
            My <span className="text-[#0270DF]">College !</span>
          </h1>
          <p className="text-[#717182] font-['Segoe_UI_Symbol'] text-base">
            Your college information and placement resources
          </p>
        </div>

        {/* College Info Card */}
        <div className="mb-6 rounded-2xl border border-[#2791FC] bg-white p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* College Logo */}
            <div className="w-16 h-16 rounded-lg bg-[#D9D9D9] flex-shrink-0"></div>
            
            {/* College Details */}
            <div className="flex-1">
              <h2 className="text-xl font-semibold font-['Poppins'] mb-2">ABC University</h2>
              <p className="text-[#49454F] font-['Poppins'] text-base mb-6">
                Bachelor of Science in Computer Science
              </p>
              
              {/* Student Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[#7A7A7A] font-['Poppins'] text-base mb-2">Student ID</p>
                  <p className="text-[#49454F] font-['Poppins'] font-medium text-base">STU-022-589</p>
                </div>
                <div>
                  <p className="text-[#7A7A7A] font-['Poppins'] text-base mb-2">Current Semester</p>
                  <p className="text-[#49454F] font-['Poppins'] font-medium text-base">1st Semester</p>
                </div>
              </div>
            </div>

            {/* View College Button */}
            <button className="flex items-center justify-center gap-2 px-6 py-2.5 border border-[#1383F3] rounded-lg text-[#1383F3] font-['Poppins'] font-medium text-base hover:bg-[#1383F3] hover:text-white transition-colors shadow-sm">
              <EyeIcon />
              View College
            </button>
          </div>
        </div>

        {/* Document Verification Card */}
        <div className="mb-6 rounded-2xl border border-[#2791FC] bg-white p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Icon */}
            <div className="w-16 h-16 rounded-lg bg-[#DCEDF9] flex items-center justify-center flex-shrink-0">
              <ShieldIcon />
            </div>
            
            {/* Content */}
            <div className="flex-1">
              <h3 className="text-xl font-medium font-['Poppins'] mb-2">Document Verification Status</h3>
              <p className="text-[#49454F] font-['Poppins'] text-base mb-4">0 of 3 documents verified</p>
              
              {/* Progress Section */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[#7A7A7A] font-['Poppins'] text-base">Overall progress</p>
                  <p className="text-[#7A7A7A] font-['Poppins'] text-base">25%</p>
                </div>
                <div className="w-full h-4 rounded-full bg-[rgba(237,237,248,0.86)]">
                  <div className="h-full w-[18%] rounded-full bg-[#3E9EFE]"></div>
                </div>
              </div>

              {/* Status Indicators */}
              <div className="flex flex-wrap gap-4 text-sm font-['Poppins']">
                <div className="flex items-center gap-2">
                  <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                    <circle cx="8.625" cy="8.625" r="8" stroke="#00C950" strokeWidth="1.25"/>
                    <path d="M5.22754 8.6233L7.49154 10.8873L12.0275 6.35938" stroke="#00C950" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[#0AC650]">Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                    <circle cx="8.625" cy="8.625" r="8" stroke="#ECBE19" strokeWidth="1.25"/>
                    <path d="M8.625 5.25781V11.8633L12.173 14.5859" stroke="#ECBE19" strokeWidth="1.25"/>
                  </svg>
                  <span className="text-[#ECBE19]">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                    <path fillRule="evenodd" clipRule="evenodd" d="M8.625 15.625C12.491 15.625 15.625 12.49 15.625 8.625C15.625 4.76 12.491 1.625 8.625 1.625C4.759 1.625 1.625 4.76 1.625 8.625C1.625 12.49 4.759 15.625 8.625 15.625Z" fill="#DF3C3C"/>
                  </svg>
                  <span className="text-[#DF3C3C]">Rejected</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                    <circle cx="8.625" cy="8.625" r="8" stroke="#7A7A7A" strokeWidth="1.25"/>
                    <circle cx="8.625" cy="5.125" r="0.5" fill="#7A7A7A"/>
                    <rect x="8.125" y="7.625" width="1" height="5" fill="#7A7A7A"/>
                  </svg>
                  <span className="text-[#7A7A7A]">Not Uploaded</span>
                </div>
              </div>
            </div>

            {/* Manage Documents Button */}
            <button 
              onClick={() => setShowDocumentModal(true)}
              className="flex items-center justify-center gap-2 px-6 py-2.5 border border-[#2791FC] bg-gradient-to-r from-[#2691FC] to-[#0377EB] rounded-lg text-white font-['Poppins'] font-medium text-base hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap"
            >
              <DocumentIcon />
              Manage Documents
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {/* Partner Companies */}
          <div className="rounded-[12.75px] border border-[#E9E4F2] bg-white p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[#717182] font-['Poppins'] text-base">Partner Companies</p>
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#2B7FFF] to-[#155DFC]">
                <UsersIcon />
              </div>
            </div>
            <p className="text-2xl font-semibold font-['Poppins'] mb-1">5</p>
            <p className="text-[#717182] font-['Poppins'] text-xs">This week</p>
          </div>

          {/* Job Postings */}
          <div className="rounded-[12.75px] border border-[#E9E4F2] bg-white p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[#717182] font-['Poppins'] text-base">Job Postings</p>
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#00C950] to-[#00A63E]">
                <BuildingIcon />
              </div>
            </div>
            <p className="text-2xl font-semibold font-['Poppins'] mb-1">20</p>
            <p className="text-[#717182] font-['Poppins'] text-xs">Tomorrow morning 10AM</p>
          </div>
        </div>

        {/* Bottom Section - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Partner Companies List */}
          <div className="rounded-2xl border border-[#B8BBD2] bg-white p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-medium font-['Poppins'] mb-2">Partner Companies</h3>
                <p className="text-[#717182] font-['Poppins'] text-base">Companies recruiting from your college</p>
              </div>
              <button className="text-[#0377EB] font-['Poppins'] text-base hover:underline">View All</button>
            </div>

            {/* Companies List */}
            <div className="space-y-4">
              {[
                { name: 'Tech Solutions Inc', category: 'Technology', openings: 3 },
                { name: 'Digital Innovations', category: 'Design', openings: 2 },
                { name: 'Cloud Services Pro', category: 'Technology', openings: 3 }
              ].map((company, index) => (
                <div key={index} className="flex items-center gap-4 p-4 rounded-lg bg-[#F5FAFF]">
                  <div className="w-12 h-12 rounded-full bg-[#0377EB] flex-shrink-0"></div>
                  <div className="flex-1">
                    <h4 className="text-base font-medium font-['Poppins'] mb-1">{company.name}</h4>
                    <p className="text-[#717182] font-['Poppins'] text-base">{company.category}</p>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-[#2791FC] text-white font-['Poppins'] text-xs">
                    {company.openings} Openings
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Placement Office Contact */}
          <div className="rounded-2xl border border-[#B8BBD2] bg-white p-6">
            <div className="mb-6">
              <h3 className="text-xl font-medium font-['Poppins'] mb-2">Placement Office Contact</h3>
              <p className="text-[#717182] font-['Poppins'] text-base">Reach out for guidance and support</p>
            </div>

            {/* Contact Cards */}
            <div className="space-y-4">
              {/* Placement Officer */}
              <div className="p-4 rounded-lg border border-[#E9E4F2]">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#0377EB] flex-shrink-0"></div>
                  <div>
                    <h4 className="text-base font-medium font-['Poppins'] mb-1">Dr. Rajesh Kumar</h4>
                    <p className="text-[#717182] font-['Poppins'] text-base">Placement Officer</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center gap-2">
                    <EmailIcon />
                    <span className="text-[#717182] font-['Poppins'] text-base">placement@abc.ac.in</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PhoneIcon />
                    <span className="text-[#717182] font-['Poppins'] text-base">+91 1011001101</span>
                  </div>
                </div>
              </div>

              {/* General Contact */}
              <div className="p-4 rounded-lg border border-[#E9E4F2]">
                <h4 className="text-base font-medium font-['Poppins'] mb-3">General Contact</h4>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center gap-2">
                    <EmailIcon />
                    <span className="text-[#717182] font-['Poppins'] text-base">placement@abc.ac.in</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PhoneIcon />
                    <span className="text-[#717182] font-['Poppins'] text-base">+91 1011001101</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Management Modal */}
      {showDocumentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 md:p-8">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-medium font-['Poppins'] mb-2">Application Details</h2>
                  <p className="text-[#717182] font-['Poppins'] text-base">Complete information about your job application</p>
                </div>
                <button 
                  onClick={() => setShowDocumentModal(false)}
                  className="text-[#717182] hover:text-gray-900"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M18.875 0.875L0.875 18.875M0.875021 0.875L18.875 18.875" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              {/* Document Verification Summary */}
              <div className="mb-6 rounded-2xl border border-[#2791FC] bg-white p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg bg-[#DCEDF9] flex items-center justify-center flex-shrink-0">
                    <ShieldIcon />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-medium font-['Poppins'] mb-2">Document Verification Status</h3>
                    <p className="text-[#49454F] font-['Poppins'] text-base mb-4">1 of 4 documents verified</p>
                    
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-[#7A7A7A] font-['Poppins'] text-base">Complete</p>
                      <p className="text-[#7A7A7A] font-['Poppins'] font-medium text-3xl">25%</p>
                    </div>
                    <div className="w-full h-4 rounded-full bg-[rgba(237,237,248,0.86)]">
                      <div className="h-full w-[18%] rounded-full bg-[#3E9EFE]"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Required */}
              <div className="mb-6 rounded-2xl border border-[#EFBD0B] bg-[rgba(255,184,0,0.09)] p-6">
                <div className="flex items-start gap-4">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <path d="M20.2698 0.00183459C22.0834 0.104852 23.5929 0.969699 24.5034 2.72764L39.4044 32.8087C40.8492 35.8494 38.6118 39.941 34.9406 40H4.93347C1.59205 39.9468 -1.14954 36.1526 0.487103 32.7755L15.6664 2.69524C15.9505 2.15523 16.0801 1.99904 16.3252 1.71575C17.3105 0.573415 18.388 -0.0380431 20.2698 0.00183459Z" fill="#EFBD0B"/>
                    <path d="M21.2711 27.0797H18.4896L18.1839 13.4141H21.5901L21.2711 27.0797ZM18.0908 31.2585C18.0908 30.7526 18.2545 30.3338 18.5826 30.0007C18.9116 29.6684 19.3594 29.5014 19.9269 29.5014C20.4951 29.5014 20.9429 29.6684 21.2711 30.0007C21.5992 30.3338 21.7637 30.7526 21.7637 31.2585C21.7637 31.7462 21.6034 32.1541 21.2844 32.4822C20.9645 32.8104 20.5126 32.9749 19.9269 32.9749C19.3412 32.9749 18.8892 32.8104 18.5694 32.4822C18.2503 32.1541 18.0908 31.7462 18.0908 31.2585Z" fill="#EFBD0B"/>
                  </svg>
                  <div>
                    <h3 className="text-xl font-normal font-['Poppins'] mb-2">Action Required</h3>
                    <ul className="space-y-2 text-[#49454F] font-['Poppins'] text-base">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#717182] mt-2 flex-shrink-0"></span>
                        <span>1 document (s) pending upload</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#717182] mt-2 flex-shrink-0"></span>
                        <span>1 document (s) rejected . needs to re-upload</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Documents List */}
              <div className="space-y-4 mb-6">
                {/* Verified Document */}
                <div className="relative rounded-2xl border-l-4 border-l-[#06B94E] bg-white p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[rgba(221,255,235,0.75)] flex items-center justify-center flex-shrink-0">
                      <svg width="24" height="24" viewBox="0 0 26 26" fill="none">
                        <path d="M12.875 24.875C19.475 24.875 24.875 19.475 24.875 12.875C24.875 6.275 19.475 0.875 12.875 0.875C6.275 0.875 0.875 6.275 0.875 12.875C0.875 19.475 6.275 24.875 12.875 24.875Z" stroke="#00C950" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M7.77344 12.8803L11.1694 16.2763L17.9734 9.48438" stroke="#00C950" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-medium font-['Poppins'] mb-1">Resume/CV</h4>
                      <p className="text-[#49454F] font-['Poppins'] text-base mb-3">Accepted formats: PDF,DOC(Max 5M)</p>
                      <div className="flex flex-wrap gap-3 text-base font-['Poppins']">
                        <span className="text-[#49454F]">Uploaded: 23 Oct, 2025</span>
                        <span className="text-[#06B94E]">Verified on 26 Oct, 2025</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="px-4 py-2 rounded-2xl bg-[rgba(24,204,96,0.15)] text-[#00A63E] font-['Poppins'] text-base">
                        Verified
                      </div>
                      <button className="px-4 py-2 border border-[#1383F3] rounded-lg text-[#1383F3] font-['Poppins'] font-medium text-base hover:bg-[#1383F3] hover:text-white transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pending Document */}
                <div className="relative rounded-2xl border-l-4 border-l-[#E8BC20] bg-white p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[rgba(254,249,194,0.75)] flex items-center justify-center flex-shrink-0">
                      <svg width="24" height="24" viewBox="0 0 26 26" fill="none">
                        <path d="M12.875 24.875C19.5024 24.875 24.875 19.5024 24.875 12.875C24.875 6.24758 19.5024 0.875 12.875 0.875C6.24758 0.875 0.875 6.24758 0.875 12.875C0.875 19.5024 6.24758 24.875 12.875 24.875Z" stroke="#E6B710" strokeWidth="1.75"/>
                        <path d="M12.875 3.32812V13.2364L18.1967 17.3202" stroke="#E6B710" strokeWidth="1.75"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-medium font-['Poppins'] mb-1">10th Marksheet</h4>
                      <p className="text-[#49454F] font-['Poppins'] text-base mb-3">Accepted formats: PDF,DOC(Max 5M)</p>
                      <span className="text-[#49454F] font-['Poppins'] text-base">Uploaded: 1 Nov, 2025</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="px-4 py-2 rounded-2xl bg-[#FEFBD1] text-[#984B00] font-['Poppins'] text-base">
                        Pending Review
                      </div>
                      <button className="px-4 py-2 border border-[#1383F3] rounded-lg text-[#1383F3] font-['Poppins'] font-medium text-base hover:bg-[#1383F3] hover:text-white transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>

                {/* Rejected Document */}
                <div className="relative rounded-2xl border-l-4 border-l-[#DF3C3C] bg-white p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[rgba(255,49,61,0.15)] flex items-center justify-center flex-shrink-0">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 22.5C6.201 22.5 1.5 17.7975 1.5 12C1.5 6.2025 6.201 1.5 12 1.5C17.799 1.5 22.5 6.2025 22.5 12C22.5 17.7975 17.799 22.5 12 22.5Z" fill="#DF3C3C"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-medium font-['Poppins'] mb-1">12th Marksheet</h4>
                      <p className="text-[#49454F] font-['Poppins'] text-base mb-3">Accepted formats: PDF,DOC(Max 5M)</p>
                      <div className="flex flex-wrap gap-3 items-center">
                        <span className="text-[#49454F] font-['Poppins'] text-base">Uploaded: 1 Nov, 2025</span>
                        <div className="px-3 py-1.5 rounded-2xl bg-[#FFE0E2] text-[#DF3C3C] font-['Poppins'] text-base">
                          Missing Docs
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="px-4 py-2 rounded-2xl bg-[#FFE0E2] text-[#DF3C3C] font-['Poppins'] text-base">
                        Reupload
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 border border-white bg-gradient-to-r from-[#2691FC] to-[#0377EB] rounded-lg text-white font-['Poppins'] font-medium text-base hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2">
                          <svg width="18" height="15" viewBox="0 0 18 15" fill="none">
                            <path d="M16.509 5.57172L15.0812 7.32378L15.0293 7.28142M15.0293 7.28142L13.3252 5.89273M15.0293 7.28142C15.0333 7.03296 15.0229 6.78154 14.9974 6.52819C14.6428 3.01141 11.5044 0.447939 7.98766 0.80251C5.97674 1.00526 4.2775 2.11818 3.25732 3.69159M3.93408 8.44767L2.25273 7.00908L2.23052 7.0352M2.23052 7.0352C2.22539 7.29141 2.23563 7.55081 2.26198 7.8122C2.61655 11.329 5.75488 13.8925 9.27168 13.5379C11.2826 13.3351 12.9818 12.2222 14.002 10.6488M2.23052 7.0352L0.750233 8.76867" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Re-upload
                        </button>
                        <button className="px-4 py-2 border border-[#1383F3] rounded-lg text-[#1383F3] font-['Poppins'] font-medium text-base hover:bg-[#1383F3] hover:text-white transition-colors">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Not Uploaded Document */}
                <div className="relative rounded-2xl border-l-4 border-l-[#9497B1] bg-white p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[rgba(184,187,210,0.25)] flex items-center justify-center flex-shrink-0">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M11.998 18.3542C11.7339 18.3507 11.4815 18.2443 11.2947 18.0575C11.1079 17.8707 11.0015 17.6183 10.998 17.3542V10.6875C10.998 10.4223 11.1034 10.1679 11.291 9.98043C11.4784 9.79283 11.7328 9.6875 11.998 9.6875C12.2632 9.6875 12.5176 9.79283 12.7051 9.98043C12.8927 10.1679 12.998 10.4223 12.998 10.6875V17.3542C12.9946 17.6183 12.8882 17.8707 12.7014 18.0575C12.5146 18.2443 12.2622 18.3507 11.998 18.3542Z" fill="#9497B1"/>
                        <path d="M11.998 8.32292C11.7339 8.31946 11.4815 8.213 11.2947 8.02621C11.1079 7.83941 11.0015 7.58706 10.998 7.32292V6.65625C10.998 6.39104 11.1034 6.13668 11.291 5.94914C11.4784 5.76161 11.7328 5.65625 11.998 5.65625C12.2632 5.65625 12.5176 5.76161 12.7051 5.94914C12.8927 6.13668 12.998 6.39104 12.998 6.65625V7.32292C12.9946 7.58706 12.8882 7.83941 12.7014 8.02621C12.5146 8.213 12.2622 8.31946 11.998 8.32292Z" fill="#9497B1"/>
                        <path d="M12 24C9.62667 24 7.30655 23.2963 5.33316 21.9776C3.35977 20.6591 1.82171 18.7849 0.913452 16.5923C0.00519816 14.3995 -0.232442 11.9867 0.230585 9.65893C0.693598 7.33115 1.83649 5.19296 3.51472 3.51472C5.19296 1.83649 7.33115 0.693598 9.65893 0.230585C11.9867 -0.232442 14.3995 0.00519816 16.5923 0.913452C18.7849 1.82171 20.6591 3.35977 21.9776 5.33316C23.2963 7.30655 24 9.62667 24 12C24 15.1827 22.7357 18.2348 20.4853 20.4853C18.2348 22.7357 15.1827 24 12 24ZM12 2C10.0221 2 8.0888 2.58649 6.44431 3.68531C4.79981 4.78412 3.51808 6.34591 2.76121 8.17317C2.00433 10.0004 1.80631 12.0111 2.19215 13.9509C2.578 15.8907 3.53041 17.6725 4.92893 19.0711C6.32747 20.4696 8.10929 21.422 10.0491 21.8079C11.9889 22.1937 13.9996 21.9957 15.8268 21.2388C17.6541 20.4819 19.2159 19.2001 20.3147 17.5557C21.4135 15.9112 22 13.9779 22 12C22 9.34787 20.9464 6.80431 19.0711 4.92893C17.1957 3.05357 14.6521 2 12 2Z" fill="#9497B1"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-medium font-['Poppins'] mb-1">ID Proof (College ID)</h4>
                      <p className="text-[#49454F] font-['Poppins'] text-base">Accepted formats: PDF,DOC(Max 5M)</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="px-4 py-2 rounded-2xl bg-[rgba(184,187,210,0.22)] text-[#A7ABCA] font-['Poppins'] text-base">
                        Not Uploaded
                      </div>
                      <button className="px-4 py-2 border border-white bg-gradient-to-r from-[#2691FC] to-[#0377EB] rounded-lg text-white font-['Poppins'] font-medium text-base hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2">
                        <svg width="18" height="15" viewBox="0 0 18 15" fill="none">
                          <path d="M16.509 5.57172L15.0812 7.32378L15.0293 7.28142M15.0293 7.28142L13.3252 5.89273M15.0293 7.28142C15.0333 7.03296 15.0229 6.78154 14.9974 6.52819C14.6428 3.01141 11.5044 0.447939 7.98766 0.80251C5.97674 1.00526 4.2775 2.11818 3.25732 3.69159M3.93408 8.44767L2.25273 7.00908L2.23052 7.0352M2.23052 7.0352C2.22539 7.29141 2.23563 7.55081 2.26198 7.8122C2.61655 11.329 5.75488 13.8925 9.27168 13.5379C11.2826 13.3351 12.9818 12.2222 14.002 10.6488M2.23052 7.0352L0.750233 8.76867" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Upload
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end">
                <button 
                  onClick={() => setShowDocumentModal(false)}
                  className="px-6 py-2.5 border border-[#1484F3] rounded-lg text-[#1484F3] font-['Poppins'] font-medium text-base hover:bg-[#1484F3] hover:text-white transition-colors shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCollegeSection;
