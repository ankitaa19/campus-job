import crypto from 'crypto';

export const JOB_FRESHNESS_DAYS = 15;

const SKILL_GROUPS: Record<string, string[]> = {
  javascript: ['javascript', 'js', 'ecmascript'],
  typescript: ['typescript', 'ts'],
  react: ['react', 'reactjs', 'react.js'],
  'node.js': ['node.js', 'nodejs', 'node js', 'node'],
  'rest api': ['rest api', 'restful api', 'restful services', 'api development'],
  'machine learning': ['machine learning', 'ml', 'artificial intelligence', 'ai'],
  python: ['python'], java: ['java'], 'spring boot': ['spring boot', 'springboot'],
  mongodb: ['mongodb', 'mongo db', 'mongo'], postgresql: ['postgresql', 'postgres'],
  sql: ['sql'], aws: ['aws', 'amazon web services'], azure: ['azure'], gcp: ['gcp', 'google cloud'],
  docker: ['docker'], kubernetes: ['kubernetes', 'k8s'], redis: ['redis'],
  angular: ['angular'], vue: ['vue', 'vue.js', 'vuejs'], '.net': ['.net', 'dotnet'],
  devops: ['devops', 'ci/cd', 'continuous integration'],
  fintech: ['fintech', 'financial technology', 'payments', 'banking'],
  'data analysis': ['data analysis', 'data analytics', 'analytics'],
  communication: ['communication', 'stakeholder management'], leadership: ['leadership', 'team lead'],
  nextjs: ['nextjs', 'next.js', 'next js'], express: ['express', 'express.js', 'expressjs'], nestjs: ['nestjs', 'nest.js'],
  django: ['django'], flask: ['flask'], fastapi: ['fastapi', 'fast api'], ruby: ['ruby'], rails: ['ruby on rails', 'rails'],
  php: ['php'], laravel: ['laravel'], go: ['golang', 'go language'], rust: ['rust'], kotlin: ['kotlin'], swift: ['swift'],
  flutter: ['flutter'], 'react native': ['react native', 'react-native'], android: ['android'], ios: ['ios'],
  mysql: ['mysql'], oracle: ['oracle database', 'oracle db'], sqlite: ['sqlite'], snowflake: ['snowflake'],
  'data engineering': ['data engineering', 'data pipelines', 'etl', 'elt'], spark: ['apache spark', 'pyspark', 'spark'],
  hadoop: ['hadoop'], kafka: ['apache kafka', 'kafka'], airflow: ['apache airflow', 'airflow'], dbt: ['dbt'],
  pandas: ['pandas'], numpy: ['numpy'], tensorflow: ['tensorflow'], pytorch: ['pytorch'], scikit: ['scikit-learn', 'sklearn'],
  'generative ai': ['generative ai', 'genai', 'large language model', 'llm'], nlp: ['natural language processing', 'nlp'],
  tableau: ['tableau'], 'power bi': ['power bi', 'powerbi'], excel: ['microsoft excel', 'ms excel', 'excel'],
  git: ['git', 'github', 'gitlab'], jenkins: ['jenkins'], terraform: ['terraform'], ansible: ['ansible'], linux: ['linux', 'unix'],
  microservices: ['microservices', 'micro-services'], graphql: ['graphql'], selenium: ['selenium'], cypress: ['cypress'],
  playwright: ['playwright'], jest: ['jest'], junit: ['junit'], 'quality assurance': ['quality assurance', 'software testing', 'qa testing'],
  figma: ['figma'], 'ui/ux': ['ui/ux', 'user experience', 'user interface design'],
  'product management': ['product management', 'product manager'], agile: ['agile', 'scrum', 'kanban'], jira: ['jira'],
  sales: ['business development', 'sales', 'lead generation'], marketing: ['digital marketing', 'marketing'], seo: ['seo', 'search engine optimization'],
  'content writing': ['content writing', 'copywriting'], recruitment: ['recruitment', 'talent acquisition'],
  accounting: ['accounting', 'bookkeeping'], finance: ['financial analysis', 'corporate finance'],
  autocad: ['autocad'], matlab: ['matlab'], 'embedded systems': ['embedded systems', 'firmware'], iot: ['internet of things', 'iot'],
  cybersecurity: ['cybersecurity', 'information security', 'application security'], networking: ['computer networking', 'network administration'],
  'customer support': ['customer support', 'customer service', 'technical support'], crm: ['salesforce crm', 'customer relationship management', 'crm']
};

const TITLE_GROUPS: Record<string, string[]> = {
  'backend engineer': ['backend developer', 'backend engineer', 'api developer', 'server side developer'],
  'frontend engineer': ['frontend developer', 'frontend engineer', 'ui developer', 'react developer'],
  'software engineer': ['software developer', 'software engineer', 'application developer'],
  'full stack engineer': ['full stack developer', 'fullstack developer', 'full stack engineer'],
  'data scientist': ['data scientist', 'machine learning engineer', 'ml engineer'],
  'data analyst': ['data analyst', 'business intelligence analyst', 'bi analyst'],
  'devops engineer': ['devops engineer', 'site reliability engineer', 'sre', 'cloud engineer']
};

const normalize = (value: unknown): string => String(value || '').toLowerCase()
  .replace(/[^a-z0-9+#.\-\s]/g, ' ').replace(/\s+/g, ' ').trim();

const tokens = (value: unknown): string[] => normalize(value).split(' ').filter(token => token.length > 1);
const unique = <T>(items: T[]): T[] => Array.from(new Set(items));

export const cleanJobText = (value: unknown): string => String(value || '')
  .replace(/<br\s*\/?>/gi, '\n').replace(/<\/li>/gi, '\n').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;|&#38;/gi, '&').replace(/&quot;|&#34;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'").replace(/&lt;|&#60;/gi, '<').replace(/&gt;|&#62;/gi, '>')
  .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCodePoint(parseInt(code, 16)))
  .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
  .replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();

export const canonicalSkill = (value: unknown): string => {
  const normalized = normalize(value);
  for (const [canonical, variants] of Object.entries(SKILL_GROUPS)) {
    if (variants.some(variant => normalized === variant)) return canonical;
  }
  for (const [canonical, variants] of Object.entries(SKILL_GROUPS)) {
    if (variants.some(variant => variant.length >= 4 && normalized.includes(variant))) return canonical;
  }
  return normalized;
};

export const expandSemanticTerms = (query: string): string[] => {
  const normalized = normalize(query);
  const expanded = [normalized];
  for (const variants of [...Object.values(SKILL_GROUPS), ...Object.values(TITLE_GROUPS)]) {
    if (variants.some(variant => normalized === variant || (variant.length >= 4 && normalized.includes(variant)) || (normalized.length >= 4 && variant.includes(normalized)))) expanded.push(...variants);
  }
  return unique(expanded.filter(Boolean));
};

export const normalizeTitle = (title: string): string => {
  const normalized = normalize(title).replace(/\b(sr|jr|senior|junior|lead|principal|ii|iii)\b/g, '').replace(/\s+/g, ' ').trim();
  for (const [canonical, variants] of Object.entries(TITLE_GROUPS)) {
    if (variants.some(variant => normalized.includes(variant))) return canonical;
  }
  return normalized;
};

export const inferJobType = (
  title: string,
  description: string,
  suppliedType = ''
): 'full-time' | 'part-time' | 'internship' | 'contract' | 'freelance' => {
  const supplied = normalize(suppliedType).replace(/\s+/g, '-');
  const suppliedAliases: Record<string, 'full-time' | 'part-time' | 'internship' | 'contract' | 'freelance'> = {
    'full-time': 'full-time', fulltime: 'full-time', permanent: 'full-time',
    'part-time': 'part-time', parttime: 'part-time',
    internship: 'internship', intern: 'internship', apprenticeship: 'internship',
    contract: 'contract', temporary: 'contract', 'fixed-term': 'contract', gig: 'contract',
    freelance: 'freelance', freelancer: 'freelance'
  };
  // A provider's structured employment type is stronger evidence than words
  // appearing incidentally in a long description (for example, a manager who
  // owns an internship programme is still a full-time manager).
  if (suppliedAliases[supplied]) return suppliedAliases[supplied];
  const titleValue = normalize(title);
  if (/\b(internship|intern|apprentice|apprenticeship|trainee)\b/.test(titleValue)) return 'internship';
  if (/\b(part time|part-time)\b/.test(titleValue)) return 'part-time';
  if (/\b(freelance|freelancer|independent contractor)\b/.test(titleValue)) return 'freelance';
  if (/\b(gig|contract|fixed term|temporary|seasonal)\b/.test(titleValue)) return 'contract';
  const employmentText = normalize(description.slice(0, 5000));
  if (/\b(?:employment|job|position|worker)\s*type\s*:?\s*(?:internship|intern|apprentice)\b/.test(employmentText)) return 'internship';
  if (/\b(?:employment|job|position|worker)\s*type\s*:?\s*part[- ]?time\b/.test(employmentText)) return 'part-time';
  if (/\b(?:employment|job|position|worker)\s*type\s*:?\s*(?:freelance|independent contractor)\b/.test(employmentText)) return 'freelance';
  if (/\b(?:employment|job|position|worker)\s*type\s*:?\s*(?:contract|temporary|fixed[- ]term|seasonal)\b/.test(employmentText)) return 'contract';
  return 'full-time';
};

export const inferIndustry = (text: string): string => {
  const value = normalize(text);
  const industries: Array<[string, RegExp]> = [
    ['FinTech', /\bfintech\b|financial technology|payments? (?:platform|industry|company)|banking (?:platform|industry|sector)/],
    ['HealthTech', /\bhealthtech\b|health technology|digital health|healthcare (?:technology|industry|platform)/],
    ['EdTech', /\bedtech\b|education technology|learning platform industry/],
    ['E-commerce', /\becommerce\b|e-commerce|online (?:retail|marketplace)/],
    ['SaaS', /\bsaas\b|software as a service/],
    ['Cybersecurity', /\bcybersecurity\b|information security industry|security software/],
    ['AI/ML', /\bai\/ml\b|artificial intelligence industry|machine learning platform/]
  ];
  return industries.find(([, pattern]) => pattern.test(value))?.[0] || 'Not specified';
};

const EXPERIENCE_NUMBER_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15
};

const experienceNumber = (value: string): number => Number.isFinite(Number(value))
  ? Number(value)
  : EXPERIENCE_NUMBER_WORDS[value.toLowerCase()] ?? 0;

export interface ExperienceRequirements {
  minExperience: number;
  maxExperience?: number;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
}

export const inferExperienceRequirements = (title: string, description = '', suppliedLevel = ''): ExperienceRequirements => {
  const plain = `${title}\n${description}`.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/gi, ' ').replace(/\s+/g, ' ');
  const number = '(?:\\d{1,2}|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen)';
  const patterns = [
    new RegExp(`(?:minimum experience(?: of)?|professional experience(?: of)?|work experience(?: of)?|experience(?: of)?|experience[:\\s-]*)\\s*(${number})\\s*(?:\\+)?\\s*(?:-|–|—|to)?\\s*(${number})?\\s*(?:years?|yrs?)`, 'gi'),
    new RegExp(`(${number})\\s*(?:\\+)?\\s*(?:-|–|—|to)?\\s*(${number})?\\s*(?:years?|yrs?)(?:\\s+of)?\\s+(?:relevant\\s+|professional\\s+|work\\s+|industry\\s+)?experience`, 'gi')
  ];
  const ranges: Array<{ min: number; max?: number }> = [];
  for (const pattern of patterns) {
    for (const match of plain.matchAll(pattern)) {
      const min = experienceNumber(match[1]);
      const max = match[2] ? experienceNumber(match[2]) : undefined;
      if (min >= 0 && min <= 30 && (max == null || (max >= min && max <= 40))) ranges.push({ min, max });
    }
  }
  const minExperience = ranges.length ? Math.max(...ranges.map(range => range.min)) : 0;
  const maxCandidates = ranges.map(range => range.max).filter((value): value is number => value != null && value >= minExperience);
  const maxExperience = maxCandidates.length ? Math.max(...maxCandidates) : undefined;
  const context = `${title} ${suppliedLevel}`.toLowerCase();
  const experienceLevel: ExperienceRequirements['experienceLevel'] = /chief|c-level|vice president|\bvp\b|executive/i.test(context)
    ? 'executive'
    : /director|head|manager|lead|principal|staff|architect/i.test(context)
      ? 'lead'
      : /senior|sr\.?\b/i.test(context) || minExperience >= 5
        ? 'senior'
        : /mid|intermediate|associate/i.test(context) || minExperience >= 2
          ? 'mid'
          : 'entry';
  return { minExperience, ...(maxExperience != null ? { maxExperience } : {}), experienceLevel };
};

export const inferCertifications = (text: string): string[] => {
  const patterns = ['AWS Certified', 'Azure Certified', 'Google Cloud Certified', 'PMP', 'CFA', 'CPA', 'CCNA', 'CISSP', 'Scrum Master'];
  return patterns.filter(certification => new RegExp(certification.replace(/\s+/g, '\\s+'), 'i').test(text));
};

export const extractCanonicalSkills = (text: string, supplied: string[] = []): string[] => {
  const value = normalize(text);
  const detected = Object.entries(SKILL_GROUPS)
    .filter(([, variants]) => variants.some(variant => {
      const escaped = variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(value);
    }))
    .map(([canonical]) => canonical);
  return unique([...supplied.map(canonicalSkill), ...detected].filter(Boolean));
};

export const createFeatureVector = (text: string, dimensions = 64): number[] => {
  const vector = Array(dimensions).fill(0);
  for (const token of tokens(text)) {
    const hash = crypto.createHash('sha256').update(token).digest();
    vector[hash.readUInt16BE(0) % dimensions] += hash[2] % 2 ? 1 : -1;
  }
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map(value => Math.round((value / magnitude) * 10000) / 10000);
};

export const cosineSimilarity = (left: number[] = [], right: number[] = []): number => {
  if (!left.length || left.length !== right.length) return 0;
  const dot = left.reduce((sum, value, index) => sum + value * right[index], 0);
  const leftMagnitude = Math.sqrt(left.reduce((sum, value) => sum + value * value, 0));
  const rightMagnitude = Math.sqrt(right.reduce((sum, value) => sum + value * value, 0));
  return leftMagnitude && rightMagnitude ? Math.max(0, dot / (leftMagnitude * rightMagnitude)) : 0;
};

const jaccard = (left: string, right: string): number => {
  const a = new Set(tokens(left)); const b = new Set(tokens(right));
  if (!a.size && !b.size) return 1;
  const overlap = [...a].filter(token => b.has(token)).length;
  return overlap / (a.size + b.size - overlap || 1);
};

export const fuzzyJobSimilarity = (left: any, right: any): number => {
  const location = (job: any) => (job.locations || []).map((item: any) => `${item.city} ${item.state} ${item.country}`).join(' ');
  const company = (job: any) => normalize(job.companyName).replace(/\b(private|pvt|limited|ltd|inc|incorporated|corp|corporation|technologies|technology|solutions)\b/g, '').trim();
  const descriptionSimilarity = jaccard(String(left.description || '').slice(0, 1500), String(right.description || '').slice(0, 1500));
  const skillSimilarity = jaccard(
    extractCanonicalSkills(`${left.title || ''} ${left.description || ''}`, left.requiredSkills || []).join(' '),
    extractCanonicalSkills(`${right.title || ''} ${right.description || ''}`, right.requiredSkills || []).join(' ')
  );
  return 0.3 * jaccard(normalizeTitle(left.title), normalizeTitle(right.title))
    + 0.25 * jaccard(company(left), company(right))
    + 0.15 * jaccard(location(left), location(right))
    + 0.3 * (descriptionSimilarity * 0.6 + skillSimilarity * 0.4);
};

export const enrichJob = (job: any): Record<string, unknown> => {
  const description = cleanJobText(job.description || '');
  const suppliedSkills = [...(job.requiredSkills || []), ...(job.requirements || []).map((item: any) => item.skill).filter(Boolean)];
  const combined = `${job.title || ''} ${description} ${suppliedSkills.join(' ')}`;
  const canonicalSkills = extractCanonicalSkills(combined, suppliedSkills);
  const normalizedJobTitle = normalizeTitle(job.title || '');
  const industry = Number(job.normalizationVersion || 0) < 5
    ? inferIndustry(`${combined} ${job.department || ''}`)
    : job.industry || inferIndustry(`${combined} ${job.department || ''}`);
  const certifications = inferCertifications(combined);
  const inferredExperience = inferExperienceRequirements(job.title || '', description, job.experienceLevel || '');
  const suppliedMinimum = Number(job.minExperience || 0);
  const minExperience = inferredExperience.minExperience || (suppliedMinimum >= 0 && suppliedMinimum <= 15 ? suppliedMinimum : 0);
  const suppliedMaximum = Number(job.maxExperience);
  const maxExperience = inferredExperience.maxExperience
    ?? (Number.isFinite(suppliedMaximum) && suppliedMaximum >= minExperience && suppliedMaximum <= 40 ? suppliedMaximum : undefined);
  const oldWorkdayFalseInternship = Number(job.normalizationVersion || 0) < 5
    && job.sourceProvider === 'workday'
    && job.jobType === 'internship'
    && !/\b(internship|intern|apprentice|apprenticeship|trainee)\b/i.test(job.title || '');
  const jobType = inferJobType(job.title || '', description, oldWorkdayFalseInternship ? '' : job.jobType || '');
  const requiredSkills = unique([...(job.requiredSkills || []).map(canonicalSkill), ...canonicalSkills]).slice(0, 30);
  const existingRequirements = Array.isArray(job.requirements) ? job.requirements : [];
  const requirements = requiredSkills.map(skill => existingRequirements.find((item: any) => canonicalSkill(item.skill) === skill)
    || { skill, level: 'intermediate', mandatory: false, category: 'technical' });
  const educationRequirements = job.educationRequirements?.length ? job.educationRequirements : [
    /ph\.?d|doctorate/i.test(combined) ? { degree: 'PhD', mandatory: true } : null,
    /master'?s|m\.?tech|mba|mca|m\.?sc/i.test(combined) ? { degree: 'Master', mandatory: true } : null,
    /bachelor'?s|b\.?tech|b\.?e\.?|bca|b\.?sc/i.test(combined) ? { degree: 'Bachelor', mandatory: true } : null
  ].filter(Boolean);
  const noticeMatch = combined.match(/notice\s+period\D{0,12}(\d{1,3})\s*(day|days|month|months)/i);
  const noticePeriodDays = job.noticePeriodDays ?? (noticeMatch ? Number(noticeMatch[1]) * (/month/i.test(noticeMatch[2]) ? 30 : 1) : undefined);
  const sourceProvider = normalize(job.sourceProvider || job.provider || '');
  const atsPlatform = ['greenhouse', 'lever', 'workday', 'ashby', 'smartrecruiters'].includes(sourceProvider)
    ? sourceProvider
    : 'other';
  const location = (job.locations || [])
    .map((item: any) => [item.city, item.state, item.country].filter(Boolean).join(', '))
    .filter(Boolean)
    .join(' | ');
  const remoteType = ['remote', 'onsite', 'hybrid'].includes(String(job.workMode))
    ? job.workMode
    : (job.locations || []).some((item: any) => item?.isRemote)
      ? 'remote'
      : undefined;
  return {
    description,
    normalizedTitle: normalizedJobTitle,
    jobType,
    canonicalSkills,
    industry,
    certifications,
    requiredSkills,
    requirements,
    minExperience,
    maxExperience,
    experienceLevel: job.experienceLevel && job.experienceLevel !== 'entry' ? job.experienceLevel : inferredExperience.experienceLevel,
    educationRequirements,
    ...(noticePeriodDays != null ? { noticePeriodDays } : {}),
    seniority: job.experienceLevel && job.experienceLevel !== 'entry' ? job.experienceLevel : inferredExperience.experienceLevel,
    location,
    remoteType,
    salaryBand: job.salary,
    atsPlatform,
    atsJobId: job.atsJobId || job.sourceExternalId,
    applyUrl: job.applyUrl || job.sourceUrl,
    normalizationVersion: 5,
    dedupFingerprint: crypto.createHash('sha256').update(`${normalizedJobTitle}|${normalize(job.companyName)}|${normalize((job.locations || []).map((item: any) => item.city).join(' '))}`).digest('hex')
  };
};

export const freshnessCutoff = (): Date => new Date(Date.now() - JOB_FRESHNESS_DAYS * 24 * 60 * 60 * 1000);
