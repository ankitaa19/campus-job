import React from "react";
import { Linkedin, Github, Mail, Globe, Twitter, Facebook, Instagram } from 'lucide-react';

interface SocialLink {
  placeholder: string;
  url: string;
}

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  location?: string;
  title?: string;
  summary?: string;
  socialLinks?: SocialLink[];
}

interface Education {
  degree: string;
  field: string;
  institution: string;
  startDate: string;
  endDate?: string;
  gpa?: number;
  isCompleted: boolean;
}

interface Experience {
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  description?: string;
  isCurrentJob: boolean;
}

interface Skill {
  name: string;
  level: string;
  category: string;
}

interface Project {
  name: string;
  description: string;
  technologies?: string[];
  link?: string;
}

interface Certification {
  name: string;
  organization?: string;
  year?: number;
  credentialId?: string;
}

interface TemplatePreviewProps {
  templateId: string;
  personalInfo: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
}

/* ---------------------- helpers ---------------------- */

const formatDateRange = (
  start: string,
  end?: string,
  isCurrent?: boolean
) => {
  if (!start && !end) return "";
  if (isCurrent) return `${start} - Present`;
  return `${start} - ${end || "Present"}`;
};

const firstEdu = (edus: Education[]) => edus[0];

// Helper to get icon based on link type/placeholder
const getSocialIcon = (placeholder: string, size: number = 12) => {
  const lower = placeholder.toLowerCase();
  const iconProps = { size, className: "inline-block" };
  
  if (lower.includes('linkedin')) return <Linkedin {...iconProps} />;
  if (lower.includes('github')) return <Github {...iconProps} />;
  if (lower.includes('mail') || lower.includes('email')) return <Mail {...iconProps} />;
  if (lower.includes('twitter')) return <Twitter {...iconProps} />;
  if (lower.includes('facebook')) return <Facebook {...iconProps} />;
  if (lower.includes('instagram')) return <Instagram {...iconProps} />;
  return <Globe {...iconProps} />; // Default icon for generic links
};

const SocialLinksBlock: React.FC<{ info: PersonalInfo }> = ({ info }) => {
  // Use ONLY the socialLinks array (no legacy field duplication)
  const links = (info.socialLinks || [])
    .filter(link => link.url && link.url.trim() && link.placeholder && link.placeholder.trim());
  
  if (links.length === 0) return null;
  
  return (
    <div className="space-y-0.5">
      {links.map((link, index) => (
        <a 
          key={index}
          href={link.url} 
          className="text-[11px] text-blue-600 flex items-center gap-1.5 hover:underline"
        >
          {getSocialIcon(link.placeholder, 11)}
          <span>{link.placeholder}</span>
        </a>
      ))}
    </div>
  );
};

/* ======================== MAIN SWITCH ======================== */

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  templateId,
  personalInfo,
  experience,
  education,
  skills,
  projects,
  certifications,
}) => {
  const commonProps = {
    personalInfo,
    experience,
    education,
    skills,
    projects,
    certifications,
  };

  switch (templateId) {
    // blue sidebar – Profile / Experience / Project / Achievements
    case "creative-1":
      return <Template1_LeftBlueProfile {...commonProps} />;

    // blue sidebar – Education / Skills / Lang / Social (Group 1410107367)
    case "creative-2":
      return <Template6_LeftBlueEducation {...commonProps} />;

    // right sidebar – orange block, skills etc
    case "modern-1":
    case "technical-1":
      return <Template2_RightSidebar {...commonProps} />;

    // center header – sections with thin lines
    case "modern-2":
      return <Template3_CenteredHeader {...commonProps} />;

    // header left + pink circle, grey section bars
    case "professional-1":
      return <Template4_HeaderLeftCircle {...commonProps} />;

    // grey banner header + orange circle
    case "professional-2":
    case "executive-1":
    case "executive-2":
      return <Template5_GreyBannerHeader {...commonProps} />;

    // fallback
    default:
      return <Template3_CenteredHeader {...commonProps} />;
  }
};

/* =========================================================
   TEMPLATE 1 – Left blue sidebar (Frame 1984078152)
   ========================================================= */

const Template1_LeftBlueProfile: React.FC<
  Omit<TemplatePreviewProps, "templateId">
> = ({ personalInfo, experience, education, skills, projects, certifications }) => {
  const summary = personalInfo.summary || experience[0]?.description || '';
  const jobTitle = personalInfo.title || experience[0]?.title || "Software Developer";

  return (
    <div className="bg-white px-6 py-6 min-h-[900px] text-[11px] text-gray-800">
      <div className="border border-gray-200 rounded-sm grid grid-cols-[180px,1fr]">
        {/* Sidebar */}
        <aside className="bg-[#E9F2FF] px-4 py-5 flex flex-col gap-4">
          {/* Avatar + name */}
          <div className="flex flex-col items-center gap-2">
            <div className="h-16 w-16 rounded-full bg-[#D9DFEC]" />
            <div className="text-center">
              <p className="text-[12px] font-semibold text-gray-900">
                {personalInfo.firstName} {personalInfo.lastName}
              </p>
              <p className="text-[11px] text-gray-600">
                {jobTitle}
              </p>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#4586D9]">
              Contact
            </p>
            <div className="space-y-0.5">
              {personalInfo.phone && <p>{personalInfo.phone}</p>}
              {personalInfo.email && <p>{personalInfo.email}</p>}
              {personalInfo.location && <p>{personalInfo.location}</p>}
              <SocialLinksBlock info={personalInfo} />
            </div>
          </div>

          {/* Education – brief */}
          {education.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#4586D9]">
                Education
              </p>
              {education.map((edu, i) => (
                <div key={i} className="mb-1">
                  <p className="font-semibold text-[11px]">
                    {edu.degree} {edu.field && <span>{edu.field}</span>}
                  </p>
                  <p className="text-[11px]">{edu.institution}</p>
                  <p className="text-[10px] text-gray-600">
                    {edu.startDate?.slice(0, 4)}-
                    {edu.endDate?.slice(0, 4) || "Present"}
                    {edu.gpa && ` | CGPA ${edu.gpa}`}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#4586D9]">
                Skills
              </p>
              <div className="flex flex-wrap gap-1">
                {skills.map((s, i) => (
                  <span
                    key={i}
                    className="px-2 py-[2px] bg-white border border-[#BFD4F7] rounded-sm text-[10px]"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages from certifications (if any) – optional */}
          {certifications.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#4586D9]">
                Languages
              </p>
              {certifications.map((c, i) => (
                <p key={i}>{c.name}</p>
              ))}
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="px-6 py-5 border-l border-gray-200 space-y-4">
          {/* Profile */}
          {summary && (
            <section>
              <h2 className="text-[11px] font-semibold text-[#1A73E8] mb-1 border-b border-[#BFD4F7] pb-1">
                Profile
              </h2>
              <p className="leading-relaxed">{summary}</p>
            </section>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <section>
              <h2 className="text-[11px] font-semibold text-[#1A73E8] mb-1 border-b border-[#BFD4F7] pb-1">
                Experience
              </h2>
              <div className="space-y-2">
                {experience.map((exp, i) => (
                  <div key={i}>
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold text-[11px]">
                          {exp.company}
                        </p>
                        <p className="text-[11px] text-gray-800">
                          {exp.title}
                        </p>
                      </div>
                      <p className="text-[10px] text-gray-600">
                        {formatDateRange(
                          exp.startDate,
                          exp.endDate,
                          exp.isCurrentJob
                        )}
                      </p>
                    </div>
                    {exp.description && (
                      <p className="mt-1">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Project */}
          {projects.length > 0 && (
            <section>
              <h2 className="text-[11px] font-semibold text-[#1A73E8] mb-1 border-b border-[#BFD4F7] pb-1">
                Project
              </h2>
              {projects.map((p, i) => (
                <div key={i}>
                  <div className="flex justify-between">
                    <p className="font-semibold">{p.name}</p>
                    {experience[0] && (
                      <p className="text-[10px] text-gray-600">
                        {formatDateRange(
                          experience[0].startDate,
                          experience[0].endDate,
                          experience[0].isCurrentJob
                        )}
                      </p>
                    )}
                  </div>
                  <p className="mt-1">{p.description}</p>
                  {p.link && (
                    <a
                      href={p.link}
                      className="text-blue-600 underline text-[11px]"
                    >
                      {p.link}
                    </a>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Achievements */}
          {certifications.length > 0 && (
            <section>
              <h2 className="text-[11px] font-semibold text-[#1A73E8] mb-1 border-b border-[#BFD4F7] pb-1">
                Achievements
              </h2>
              {certifications.map((c, i) => (
                <div key={i} className="mb-2">
                  <p className="font-semibold text-[11px]">
                    {c.name} {c.year && <span>{c.year}</span>}
                  </p>
                  {c.organization && (
                    <p className="text-[11px]">{c.organization}</p>
                  )}
                </div>
              ))}
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

/* =========================================================
   TEMPLATE 2 – Right sidebar (Frame 1984078158)
   ========================================================= */

const Template2_RightSidebar: React.FC<
  Omit<TemplatePreviewProps, "templateId">
> = ({ personalInfo, experience, education, skills, projects, certifications }) => {
  const summary = personalInfo.summary || experience[0]?.description || '';
  const jobTitle = personalInfo.title || experience[0]?.title || "Software Developer";

  return (
    <div className="bg-white px-6 py-6 min-h-[900px] text-[11px] text-gray-800">
      <div className="border border-gray-200 rounded-sm grid grid-cols-[2.4fr,1.1fr]">
        {/* left main */}
        <main className="px-6 py-5 space-y-4">
          {/* Name + summary */}
          <section>
            <p className="text-[13px] font-semibold text-gray-900">
              {personalInfo.firstName} {personalInfo.lastName}
            </p>
            <p className="text-[11px] text-gray-600">
              {jobTitle}
            </p>
            {summary && (
              <p className="mt-2 leading-relaxed">
                {summary}
              </p>
            )}
          </section>

          {/* Experience */}
          {experience.length > 0 && (
            <section>
              <h2 className="mt-1 mb-1 text-[12px] font-semibold text-gray-900">
                Experience
              </h2>
              <div className="h-[2px] w-20 bg-[#FDE2C1] mb-2" />
              <div className="space-y-2">
                {experience.map((exp, i) => (
                  <div key={i}>
                    <div className="flex justify-between">
                      <p className="font-semibold text-[11px] text-[#3F5C8C]">
                        {exp.company}
                      </p>
                      <p className="text-[10px] text-gray-600">
                        {formatDateRange(
                          exp.startDate,
                          exp.endDate,
                          exp.isCurrentJob
                        )}
                      </p>
                    </div>
                    <p className="text-[11px] text-gray-900">
                      {exp.title}
                    </p>
                    {exp.description && (
                      <p className="mt-1">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <section>
              <h2 className="mt-1 mb-1 text-[12px] font-semibold text-gray-900">
                Project
              </h2>
              <div className="h-[2px] w-20 bg-[#FDE2C1] mb-2" />
              {projects.map((p, i) => (
                <div key={i}>
                  <div className="flex justify-between">
                    <p className="font-semibold text-[11px] text-[#3F5C8C]">
                      {p.name}
                    </p>
                    {experience[0] && (
                      <p className="text-[10px] text-gray-600">
                        {formatDateRange(
                          experience[0].startDate,
                          experience[0].endDate,
                          experience[0].isCurrentJob
                        )}
                      </p>
                    )}
                  </div>
                  <p className="mt-1">{p.description}</p>
                  {p.link && (
                    <a
                      href={p.link}
                      className="text-blue-600 underline text-[11px]"
                    >
                      {p.link}
                    </a>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Education */}
          {education.length > 0 && (
            <section>
              <h2 className="mt-1 mb-1 text-[12px] font-semibold text-gray-900">
                Education
              </h2>
              <div className="h-[2px] w-20 bg-[#FDE2C1] mb-2" />
              {education.map((edu, i) => (
                <div key={i}>
                  <p className="font-semibold text-[11px]">
                    {edu.degree} {edu.field && `| ${edu.field}`}
                  </p>
                  <p className="text-[11px]">{edu.institution}</p>
                  <p className="text-[10px] text-gray-600">
                    {formatDateRange(
                      edu.startDate,
                      edu.endDate,
                      !edu.isCompleted
                    )}
                    {edu.gpa && ` | CGPA ${edu.gpa}`}
                  </p>
                </div>
              ))}
            </section>
          )}

          {/* Achievements */}
          {certifications.length > 0 && (
            <section>
              <h2 className="mt-1 mb-1 text-[12px] font-semibold text-gray-900">
                Achievements
              </h2>
              <div className="h-[2px] w-20 bg-[#FDE2C1] mb-2" />
              {certifications.map((c, i) => (
                <div key={i}>
                  <p className="font-semibold text-[11px]">
                    {c.name}
                  </p>
                  {c.year && (
                    <p className="text-[10px] text-gray-600">{c.year}</p>
                  )}
                  {c.organization && (
                    <p className="text-[11px]">{c.organization}</p>
                  )}
                </div>
              ))}
            </section>
          )}
        </main>

        {/* Right sidebar */}
        <aside className="px-4 py-5 border-l border-gray-200 space-y-4">
          {/* orange block */}
          <div className="h-20 w-20 bg-[#FF9F3B] rounded-sm ml-auto" />

          {/* Contact & Social Links */}
          <div>
            <p className="mb-1 text-[11px] font-semibold">Contact</p>
            <div className="space-y-0.5">
              {personalInfo.email && <p className="break-all">{personalInfo.email}</p>}
              {personalInfo.phone && <p>{personalInfo.phone}</p>}
              {personalInfo.location && <p>{personalInfo.location}</p>}
              <SocialLinksBlock info={personalInfo} />
            </div>
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-semibold">Skills</p>
              <div className="space-y-0.5">
                {skills.map((s, i) => (
                  <p key={i}>• {s.name}</p>
                ))}
              </div>
            </div>
          )}

          {/* Language (mocked from certifications) */}
          {certifications.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-semibold">Language</p>
              {certifications.slice(0, 2).map((c, i) => (
                <p key={i}>
                  • {c.name}
                  {c.organization && ` – ${c.organization}`}
                </p>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

/* =========================================================
   TEMPLATE 3 – Centered header, grey lines (Frame 1984078162)
   ========================================================= */

const Template3_CenteredHeader: React.FC<
  Omit<TemplatePreviewProps, "templateId">
> = ({ personalInfo, experience, education, skills, projects, certifications }) => {
  const summary = personalInfo.summary || experience[0]?.description || '';
  const jobTitle = personalInfo.title || experience[0]?.title || "Software Developer";

  // for skills grid: 4 columns typical
  const skillChunks: Skill[][] = [];
  for (let i = 0; i < skills.length; i += 4) {
    skillChunks.push(skills.slice(i, i + 4));
  }

  return (
    <div className="bg-white px-6 py-6 min-h-[900px] text-[11px] text-gray-800">
      <div className="border border-gray-200 rounded-sm px-8 py-6 space-y-4">
        {/* Header */}
        <header className="text-center space-y-2">
          <h1 className="text-[16px] font-semibold text-gray-900">
            {personalInfo.firstName} {personalInfo.lastName}
          </h1>
          <p className="text-[11px] text-gray-700">
            {jobTitle}
          </p>
          <div className="flex justify-center gap-6 text-[11px] text-gray-700">
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {personalInfo.phone && <span>{personalInfo.phone}</span>}
          </div>
          <div className="flex justify-center gap-4 text-[11px]">
            <SocialLinksBlock info={personalInfo} />
          </div>
        </header>

        {/* Summary */}
        {summary && (
          <section className="pt-2">
            <p className="leading-relaxed">{summary}</p>
          </section>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <section className="pt-2 border-t border-gray-200">
            <h2 className="mt-2 mb-2 text-[12px] font-semibold">
              Experience
            </h2>
            {experience.map((exp, i) => (
              <div key={i} className="mb-2">
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold text-[11px]">
                      {exp.company}
                    </p>
                    <p>{exp.title}</p>
                  </div>
                  <p className="text-[10px] text-gray-600">
                    {formatDateRange(
                      exp.startDate,
                      exp.endDate,
                      exp.isCurrentJob
                    )}
                  </p>
                </div>
                {exp.description && (
                  <p className="mt-1">{exp.description}</p>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <section className="pt-2 border-t border-gray-200">
            <h2 className="mt-2 mb-2 text-[12px] font-semibold">Projects</h2>
            {projects.map((p, i) => (
              <div key={i} className="mb-2">
                <div className="flex justify-between">
                  <p className="font-semibold text-[11px]">
                    {p.name}
                  </p>
                  {experience[0] && (
                    <p className="text-[10px] text-gray-600">
                      {formatDateRange(
                        experience[0].startDate,
                        experience[0].endDate,
                        experience[0].isCurrentJob
                      )}
                    </p>
                  )}
                </div>
                <p className="mt-1">{p.description}</p>
                {p.link && (
                  <a
                    href={p.link}
                    className="text-blue-600 underline text-[11px]"
                  >
                    {p.link}
                  </a>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <section className="pt-2 border-t border-gray-200">
            <h2 className="mt-2 mb-2 text-[12px] font-semibold">Education</h2>
            {education.map((edu, i) => (
              <div key={i} className="mb-2">
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold text-[11px]">
                      {edu.degree} {edu.field && `| ${edu.field}`}
                    </p>
                    <p className="text-[11px]">{edu.institution}</p>
                    {edu.gpa && (
                      <p className="text-[10px] text-gray-600">CGPA {edu.gpa}</p>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-600">
                    {formatDateRange(
                      edu.startDate,
                      edu.endDate,
                      !edu.isCompleted
                    )}
                  </p>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Skills – grid */}
        {skills.length > 0 && (
          <section className="pt-2 border-t border-gray-200">
            <h2 className="mt-2 mb-2 text-[12px] font-semibold">Skills</h2>
            <div className="grid grid-cols-3 gap-x-4 gap-y-1">
              {skills.map((s, i) => (
                <p key={i} className="text-[11px] whitespace-nowrap">• {s.name}</p>
              ))}
            </div>
          </section>
        )}

        {/* Language */}
        {certifications.length > 0 && (
          <section className="pt-2 border-t border-gray-200">
            <h2 className="mt-2 mb-1 text-[12px] font-semibold">Language</h2>
            {certifications.slice(0, 2).map((c, i) => (
              <p key={i}>• {c.name}</p>
            ))}
          </section>
        )}

      </div>
    </div>
  );
};

/* =========================================================
   TEMPLATE 4 – Header left, circle right, grey bars (Frame 1984078164)
   ========================================================= */

const Template4_HeaderLeftCircle: React.FC<
  Omit<TemplatePreviewProps, "templateId">
> = ({ personalInfo, experience, education, skills, projects, certifications }) => {
  const summary = personalInfo.summary || experience[0]?.description || '';
  const jobTitle = personalInfo.title || experience[0]?.title || "Software Developer";

  const skillChunks: Skill[][] = [];
  for (let i = 0; i < skills.length; i += 4) {
    skillChunks.push(skills.slice(i, i + 4));
  }

  return (
    <div className="bg-white px-6 py-6 min-h-[900px] text-[11px] text-gray-800">
      <div className="border border-gray-200 rounded-sm px-8 py-6 space-y-4">
        {/* Header row: left text, right circle */}
        <header className="flex justify-between items-start gap-6">
          <div>
            <p className="text-[14px] font-semibold text-gray-900">
              {personalInfo.firstName} {personalInfo.lastName}
            </p>
            <p className="text-[11px] text-gray-600">
              {jobTitle}
            </p>

            <div className="mt-2 space-y-1 text-[11px]">
              {personalInfo.email && (
                <p>✉ {personalInfo.email}</p>
              )}
              {personalInfo.phone && <p>☎ {personalInfo.phone}</p>}
              <SocialLinksBlock info={personalInfo} />
            </div>
          </div>
          <div className="h-16 w-16 rounded-full bg-[#FF7F8D]" />
        </header>

        {/* Profile */}
        {summary && (
          <section>
            <div className="bg-[#F3F4F6] px-3 py-1 text-[11px] font-semibold text-center text-gray-800 mb-1">
              Profile
            </div>
            <p className="leading-relaxed">{summary}</p>
          </section>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <section>
            <div className="bg-[#F3F4F6] px-3 py-1 text-[11px] font-semibold text-center text-gray-800 mb-1">
              Experience
            </div>
            {experience.map((exp, i) => (
              <div key={i} className="mb-2">
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold text-[11px] text-[#3F5C8C]">
                      {exp.company}
                    </p>
                    <p>{exp.title}</p>
                  </div>
                  <p className="text-[10px] text-gray-600">
                    {formatDateRange(
                      exp.startDate,
                      exp.endDate,
                      exp.isCurrentJob
                    )}
                  </p>
                </div>
                {exp.description && (
                  <p className="mt-1">{exp.description}</p>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Project */}
        {projects.length > 0 && (
          <section>
            <div className="bg-[#F3F4F6] px-3 py-1 text-[11px] font-semibold text-center text-gray-800 mb-1">
              Project
            </div>
            {projects.map((p, i) => (
              <div key={i} className="mb-2">
                <div className="flex justify-between">
                  <p className="font-semibold text-[11px] text-[#3F5C8C]">
                    {p.name}
                  </p>
                  {experience[0] && (
                    <p className="text-[10px] text-gray-600">
                      {formatDateRange(
                        experience[0].startDate,
                        experience[0].endDate,
                        experience[0].isCurrentJob
                      )}
                    </p>
                  )}
                </div>
                <p className="mt-1">{p.description}</p>
                {p.link && (
                  <a
                    href={p.link}
                    className="text-blue-600 underline text-[11px]"
                  >
                    {p.link}
                  </a>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <section>
            <div className="bg-[#F3F4F6] px-3 py-1 text-[11px] font-semibold text-center text-gray-800 mb-1">
              Skills
            </div>
            <div className="grid grid-cols-3 gap-x-4 gap-y-1">
              {skills.map((s, i) => (
                <p key={i} className="text-[11px] whitespace-nowrap">• {s.name}</p>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <section>
            <div className="bg-[#F3F4F6] px-3 py-1 text-[11px] font-semibold text-center text-gray-800 mb-1">
              Education
            </div>
            {education.map((edu, i) => (
              <div key={i} className="mb-2">
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold text-[11px]">
                      {edu.degree} {edu.field && `| ${edu.field}`}
                    </p>
                    <p className="text-[11px]">{edu.institution}</p>
                    {edu.gpa && (
                      <p className="text-[10px] text-gray-600">CGPA {edu.gpa}</p>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-600">
                    {formatDateRange(
                      edu.startDate,
                      edu.endDate,
                      !edu.isCompleted
                    )}
                  </p>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Achievements */}
        {certifications.length > 0 && (
          <section>
            <div className="bg-[#F3F4F6] px-3 py-1 text-[11px] font-semibold text-center text-gray-800 mb-1">
              Achievements
            </div>
            {certifications.map((c, i) => (
              <div key={i} className="mb-1">
                <p className="font-semibold text-[11px]">
                  {c.name}
                </p>
                {c.year && (
                  <p className="text-[10px] text-gray-600">{c.year}</p>
                )}
                {c.organization && (
                  <p className="text-[11px]">{c.organization}</p>
                )}
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
};

/* =========================================================
   TEMPLATE 5 – Grey banner header + circle (Frame 2147225792)
   ========================================================= */

const Template5_GreyBannerHeader: React.FC<
  Omit<TemplatePreviewProps, "templateId">
> = ({ personalInfo, experience, education, skills, projects, certifications }) => {
  const summary = personalInfo.summary || experience[0]?.description || '';
  const jobTitle = personalInfo.title || experience[0]?.title || "Software Developer";
  const skillChunks: Skill[][] = [];
  for (let i = 0; i < skills.length; i += 4) {
    skillChunks.push(skills.slice(i, i + 4));
  }

  return (
    <div className="bg-white px-6 py-6 min-h-[900px] text-[11px] text-gray-800">
      <div className="border border-gray-200 rounded-sm">
        {/* grey banner */}
        <div className="bg-[#F4F4F5] px-8 py-4 flex justify-between items-center gap-6">
          <div className="flex gap-4 items-center">
            <div className="h-16 w-16 rounded-full bg-[#FF9F3B]" />
            <div>
              <p className="text-[14px] font-semibold text-gray-900">
                {personalInfo.firstName} {personalInfo.lastName}
              </p>
              <p className="text-[11px] text-gray-600">
                {jobTitle}
              </p>
            </div>
          </div>
          <div className="space-y-1 text-[11px] text-gray-700">
            <div className="flex gap-4">
              {personalInfo.email && <p>✉ {personalInfo.email}</p>}
              {personalInfo.phone && <p>☎ {personalInfo.phone}</p>}
            </div>
            <div className="flex gap-4">
              <SocialLinksBlock info={personalInfo} />
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-4">
          {/* Profile */}
          {summary && (
            <section>
              <div className="bg-[#F3F4F6] px-3 py-1 text-[11px] font-semibold text-center text-gray-800 mb-1">
                Profile
              </div>
              <p className="leading-relaxed">{summary}</p>
            </section>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <section>
              <div className="bg-[#F3F4F6] px-3 py-1 text-[11px] font-semibold text-center text-gray-800 mb-1">
                Experience
              </div>
              {experience.map((exp, i) => (
                <div key={i} className="mb-2">
                  <div className="flex justify-between">
                    <p className="font-semibold text-[11px] text-[#3F5C8C]">
                      {exp.company}
                    </p>
                    <p className="text-[10px] text-gray-600">
                      {formatDateRange(
                        exp.startDate,
                        exp.endDate,
                        exp.isCurrentJob
                      )}
                    </p>
                  </div>
                  <p>{exp.title}</p>
                  {exp.description && (
                    <p className="mt-1">{exp.description}</p>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Project */}
          {projects.length > 0 && (
            <section>
              <div className="bg-[#F3F4F6] px-3 py-1 text-[11px] font-semibold text-center text-gray-800 mb-1">
                Project
              </div>
              {projects.map((p, i) => (
                <div key={i} className="mb-2">
                  <div className="flex justify-between">
                    <p className="font-semibold text-[11px] text-[#3F5C8C]">
                      {p.name}
                    </p>
                    {experience[0] && (
                      <p className="text-[10px] text-gray-600">
                        {formatDateRange(
                          experience[0].startDate,
                          experience[0].endDate,
                          experience[0].isCurrentJob
                        )}
                      </p>
                    )}
                  </div>
                  <p className="mt-1">{p.description}</p>
                  {p.link && (
                    <a
                      href={p.link}
                      className="text-blue-600 underline text-[11px]"
                    >
                      {p.link}
                    </a>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <section>
              <div className="bg-[#F3F4F6] px-3 py-1 text-[11px] font-semibold text-center text-gray-800 mb-1">
                Skills
              </div>
              <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                {skills.map((s, i) => (
                  <p key={i} className="text-[11px] whitespace-nowrap">• {s.name}</p>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {education.length > 0 && (
            <section>
              <div className="bg-[#F3F4F6] px-3 py-1 text-[11px] font-semibold text-center text-gray-800 mb-1">
                Education
              </div>
              {education.map((edu, i) => (
                <div key={i} className="mb-2">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold text-[11px]">
                        {edu.degree} {edu.field && `| ${edu.field}`}
                      </p>
                      <p className="text-[11px]">{edu.institution}</p>
                      {edu.gpa && (
                        <p className="text-[10px] text-gray-600">CGPA {edu.gpa}</p>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-600">
                      {formatDateRange(
                        edu.startDate,
                        edu.endDate,
                        !edu.isCompleted
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Achievements */}
          {certifications.length > 0 && (
            <section>
              <div className="bg-[#F3F4F6] px-3 py-1 text-[11px] font-semibold text-center text-gray-800 mb-1">
                Achievements
              </div>
              {certifications.map((c, i) => (
                <div key={i} className="mb-1">
                  <p className="font-semibold text-[11px]">
                    {c.name}
                  </p>
                  {c.year && (
                    <p className="text-[10px] text-gray-600">{c.year}</p>
                  )}
                  {c.organization && (
                    <p className="text-[11px]">{c.organization}</p>
                  )}
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   TEMPLATE 6 – Left blue sidebar (education) (Group 1410107367)
   ========================================================= */

const Template6_LeftBlueEducation: React.FC<
  Omit<TemplatePreviewProps, "templateId">
> = ({ personalInfo, experience, education, skills, projects, certifications }) => {
  const summary = personalInfo.summary || experience[0]?.description || '';
  const jobTitle = personalInfo.title || experience[0]?.title || "Software Developer";

  return (
    <div className="bg-white px-6 py-6 min-h-[900px] text-[11px] text-gray-800">
      <div className="border border-gray-200 rounded-sm grid grid-cols-[170px,1fr]">
        {/* Sidebar */}
        <aside className="bg-[#E9F2FF] px-4 py-5 flex flex-col gap-4">
          <div className="flex flex-col items-center gap-2">
            <div className="h-16 w-16 rounded-full bg-[#FF9F9F]" />
          </div>

          {/* Education */}
          {education.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                Education
              </p>
              {education.map((edu, i) => (
                <div key={i} className="mb-1">
                  <p className="font-semibold text-[11px]">
                    {edu.degree} {edu.field && `| ${edu.field}`}
                  </p>
                  <p className="text-[11px]">{edu.institution}</p>
                  <p className="text-[10px] text-gray-600">
                    {formatDateRange(
                      edu.startDate,
                      edu.endDate,
                      !edu.isCompleted
                    )}
                    {edu.gpa && ` | CGPA ${edu.gpa}`}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                Skills
              </p>
              <div className="space-y-0.5">
                {skills.map((s, i) => (
                  <p key={i}>{s.name}</p>
                ))}
              </div>
            </div>
          )}

          {/* Language */}
          {certifications.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                Language
              </p>
              {certifications.slice(0, 3).map((c, i) => (
                <p key={i}>{c.name}</p>
              ))}
            </div>
          )}
        </aside>

        {/* Right main */}
        <main className="px-6 py-5 space-y-4">
          {/* Header + contact */}
          <header className="space-y-1">
            <p className="text-[14px] font-semibold text-gray-900">
              {personalInfo.firstName} {personalInfo.lastName}
            </p>
            <p className="text-[11px] text-gray-600">
              {jobTitle}
            </p>
            <div className="flex flex-wrap gap-4 text-[11px] mt-1">
              {personalInfo.email && (
                <span>✉ {personalInfo.email}</span>
              )}
              {personalInfo.phone && <span>| {personalInfo.phone}</span>}
            </div>
            <div className="flex flex-wrap gap-3 text-[11px]">
              <SocialLinksBlock info={personalInfo} />
            </div>
          </header>

          {/* Summary */}
          {summary && (
            <section>
              <p className="leading-relaxed">{summary}</p>
            </section>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <section>
              <h2 className="mb-1 text-[12px] font-semibold">Experience:</h2>
              {experience.map((exp, i) => (
                <div key={i} className="mb-2">
                  <p className="font-semibold text-[11px] text-[#3F5C8C]">
                    {exp.company}
                  </p>
                  <div className="flex justify-between">
                    <p>{exp.title}</p>
                    <p className="text-[10px] text-gray-600">
                      {formatDateRange(
                        exp.startDate,
                        exp.endDate,
                        exp.isCurrentJob
                      )}
                    </p>
                  </div>
                  {exp.description && (
                    <p className="mt-1">{exp.description}</p>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <section>
              <h2 className="mb-1 text-[12px] font-semibold">Projects:</h2>
              {projects.map((p, i) => (
                <div key={i} className="mb-2">
                  <div className="flex justify-between">
                    <p className="font-semibold text-[11px]">
                      {p.name}
                    </p>
                    {experience[0] && (
                      <p className="text-[10px] text-gray-600">
                        {formatDateRange(
                          experience[0].startDate,
                          experience[0].endDate,
                          experience[0].isCurrentJob
                        )}
                      </p>
                    )}
                  </div>
                  <p className="mt-1">{p.description}</p>
                  {p.link && (
                    <a
                      href={p.link}
                      className="text-blue-600 underline text-[11px]"
                    >
                      {p.link}
                    </a>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Achievements */}
          {certifications.length > 0 && (
            <section>
              <h2 className="mb-1 text-[12px] font-semibold">
                Achievements
              </h2>
              {certifications.map((c, i) => (
                <div key={i} className="mb-1">
                  <p className="font-semibold text-[11px]">
                    {c.name}
                  </p>
                  {c.year && (
                    <p className="text-[10px] text-gray-600">{c.year}</p>
                  )}
                  {c.organization && (
                    <p className="text-[11px]">{c.organization}</p>
                  )}
                </div>
              ))}
            </section>
          )}
        </main>
      </div>
    </div>
  );
};
