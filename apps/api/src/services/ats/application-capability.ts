export type ApplicationCapability = 'auto_apply' | 'needs_you' | 'unsupported';

const REAL_AUTO_APPLY_ADAPTERS = new Set(['greenhouse']);
const KNOWN_STUBBED_PLATFORMS = new Set(['lever', 'workday', 'ashby', 'smartrecruiters']);

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
  if (REAL_AUTO_APPLY_ADAPTERS.has(platform)) return 'auto_apply';
  if (KNOWN_STUBBED_PLATFORMS.has(platform)) return 'needs_you';
  return 'unsupported';
};

export const withApplicationCapability = <T extends Record<string, any>>(job: T): T & { applicationCapability: ApplicationCapability } => ({
  ...job,
  applicationCapability: classifyApplicationCapability(job)
});
