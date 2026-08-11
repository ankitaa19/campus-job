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

