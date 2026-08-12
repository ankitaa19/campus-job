export type ApplicationCapability = 'auto_apply' | 'needs_you' | 'unsupported';
export interface ApplicationCapabilityResult {
  capability: ApplicationCapability;
  reasons: string[];
  requiredFields: string[];
}

const KNOWN_STUBBED_PLATFORMS = new Set(['workday', 'ashby', 'smartrecruiters']);
const BROWSER_PLATFORMS = new Set(['workday', 'ashby', 'smartrecruiters', 'other']);

export const inspectApplicationCapability = (job: {
  allowDirectApplications?: boolean;
  atsPlatform?: string;
  sourceProvider?: string;
  sourceCompanySlug?: string;
  greenhouseBoardToken?: string;
  atsJobId?: string;
  sourceExternalId?: string;
  applyUrl?: string;
  browserAutomationAuthorized?: boolean;
  applicationConfiguration?: {
    requiredFields?: string[];
    requiredDocuments?: string[];
    requiresAuthentication?: boolean;
    requiresAssessment?: boolean;
    requiresCaptcha?: boolean;
    unsupportedQuestionTypes?: string[];
  };
}): ApplicationCapabilityResult => {
  if (job.allowDirectApplications === false) {
    return { capability: 'unsupported', reasons: ['direct_applications_disabled'], requiredFields: [] };
  }
  const config = job.applicationConfiguration;
  const humanReasons = [
    ...(config?.requiresAuthentication ? ['authentication_required'] : []),
    ...(config?.requiresAssessment ? ['assessment_required'] : []),
    ...(config?.requiresCaptcha ? ['captcha_required'] : []),
    ...((config?.requiredDocuments || []).length > 1 ? ['additional_documents_required'] : []),
    ...((config?.unsupportedQuestionTypes || []).length ? ['unsupported_question_type'] : [])
  ];
  const requiredFields = config?.requiredFields || [];
  if (humanReasons.length) return { capability: 'needs_you', reasons: humanReasons, requiredFields };

  const platform = String(job.atsPlatform || job.sourceProvider || 'other').trim().toLowerCase();
  if (platform === 'greenhouse') {
    const boardToken = String(job.sourceCompanySlug || job.greenhouseBoardToken || '').trim();
    const jobPostId = String(job.atsJobId || job.sourceExternalId || '').trim();
    const apiConfigured = Boolean(process.env.GREENHOUSE_JOB_BOARD_API_KEY || process.env.GREENHOUSE_API_KEY);
    const browserReady = job.browserAutomationAuthorized === true && Boolean(job.applyUrl);
    return boardToken && jobPostId && (apiConfigured || browserReady)
      ? { capability: 'auto_apply', reasons: [], requiredFields }
      : { capability: 'needs_you', reasons: [apiConfigured ? 'greenhouse_identifiers_missing' : 'greenhouse_credentials_or_browser_authorization_missing'], requiredFields };
  }
  if (platform === 'lever') {
    const site = String(job.sourceCompanySlug || '').trim();
    const postingId = String(job.atsJobId || job.sourceExternalId || '').trim();
    const authorized = Boolean(process.env.LEVER_POSTINGS_API_KEY) || (job.browserAutomationAuthorized === true && Boolean(job.applyUrl));
    return authorized && site && postingId
      ? { capability: 'auto_apply', reasons: [], requiredFields }
      : { capability: 'needs_you', reasons: ['lever_credentials_or_identifiers_missing'], requiredFields };
  }
  if (BROWSER_PLATFORMS.has(platform) && job.browserAutomationAuthorized === true && job.applyUrl) {
    return { capability: 'auto_apply', reasons: [], requiredFields };
  }
  if (KNOWN_STUBBED_PLATFORMS.has(platform)) {
    return { capability: 'needs_you', reasons: ['official_submission_adapter_unavailable'], requiredFields };
  }
  return { capability: 'unsupported', reasons: ['unsupported_provider'], requiredFields };
};

export const classifyApplicationCapability = (job: Parameters<typeof inspectApplicationCapability>[0]): ApplicationCapability =>
  inspectApplicationCapability(job).capability;

export const withApplicationCapability = <T extends Record<string, any>>(job: T): T & { applicationCapability: ApplicationCapability } => ({
  ...job,
  applicationCapability: classifyApplicationCapability(job),
  applicationCapabilityReasons: inspectApplicationCapability(job).reasons
});
