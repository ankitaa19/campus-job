export type ApplicationCapability = 'auto_apply' | 'needs_you' | 'unsupported';

const KNOWN_STUBBED_PLATFORMS = new Set(['workday', 'ashby', 'smartrecruiters']);

export const classifyApplicationCapability = (job: {
  allowDirectApplications?: boolean;
  atsPlatform?: string;
  sourceProvider?: string;
  sourceCompanySlug?: string;
  greenhouseBoardToken?: string;
  atsJobId?: string;
  sourceExternalId?: string;
}): ApplicationCapability => {
  if (job.allowDirectApplications === false) return 'unsupported';

  const platform = String(job.atsPlatform || job.sourceProvider || 'other').trim().toLowerCase();
  if (platform === 'greenhouse') {
    const boardToken = String(job.sourceCompanySlug || job.greenhouseBoardToken || '').trim();
    const jobPostId = String(job.atsJobId || job.sourceExternalId || '').trim();
    return boardToken && jobPostId ? 'auto_apply' : 'needs_you';
  }
  if (platform === 'lever') {
    const site = String(job.sourceCompanySlug || '').trim();
    const postingId = String(job.atsJobId || job.sourceExternalId || '').trim();
    return process.env.LEVER_POSTINGS_API_KEY && site && postingId ? 'auto_apply' : 'needs_you';
  }
  if (KNOWN_STUBBED_PLATFORMS.has(platform)) return 'needs_you';
  return 'unsupported';
};

export const withApplicationCapability = <T extends Record<string, any>>(job: T): T & { applicationCapability: ApplicationCapability } => ({
  ...job,
  applicationCapability: classifyApplicationCapability(job)
});
