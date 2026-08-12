import { IApplication } from '../../models/Application';

export interface TailoredMaterials {
  resumeText: string;
  coverLetterText: string;
}

export interface AtsSubmissionReceipt {
  status: 'submitted' | 'confirmed' | 'failed';
  provider: string;
  externalApplicationId?: string;
  rawResponse?: Record<string, unknown>;
  submittedFields: Record<string, unknown>;
}

export type BrowserFailureReason =
  | 'captcha_required'
  | 'login_required'
  | 'missing_required_custom_question'
  | 'submit_button_not_found'
  | 'resume_upload_failed'
  | 'provider_form_changed'
  | 'external_site_blocked'
  | 'submission_not_confirmed'
  | 'navigation_failed';

export interface BrowserFailureDiagnostics {
  provider: string;
  finalUrl?: string;
  pageTitle?: string;
  visibleButtonTexts?: string[];
  visibleRequiredFields?: Array<{
    tag: string;
    type?: string;
    name?: string;
    label?: string;
  }>;
  pageTextSnippet?: string;
  screenshotPath?: string;
  htmlSnapshotPath?: string;
  step?: string;
}

export class BrowserSubmissionError extends Error {
  constructor(
    public readonly reason: BrowserFailureReason,
    message: string,
    public readonly diagnostics: BrowserFailureDiagnostics,
    public readonly needsUser = true
  ) {
    super(message);
    this.name = 'BrowserSubmissionError';
  }
}

export interface AtsApplicationSchema {
  capability: 'auto_apply' | 'needs_you' | 'unsupported';
  requiredFields: string[];
  reasons: string[];
  requiresAuthentication?: boolean;
  requiresAssessment?: boolean;
  requiresCaptcha?: boolean;
}

export interface AtsSubmitContext {
  application: IApplication;
  job: any;
  user: any;
  student: any;
  materials: TailoredMaterials;
}

export interface AtsAdapter {
  inspectApplication?(job: any): Promise<AtsApplicationSchema>;
  submitApplication(context: AtsSubmitContext): Promise<AtsSubmissionReceipt>;
}

