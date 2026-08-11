import { IApplication } from '../../models/Application';

export interface TailoredMaterials {
  resumeText: string;
  coverLetterText: string;
}

export interface AtsSubmissionReceipt {
  status: 'submitted' | 'confirmed' | 'failed';
  provider: string;
  rawResponse?: Record<string, unknown>;
  submittedFields: Record<string, unknown>;
}

export interface AtsSubmitContext {
  application: IApplication;
  job: any;
  user: any;
  student: any;
  materials: TailoredMaterials;
}

export interface AtsAdapter {
  submitApplication(context: AtsSubmitContext): Promise<AtsSubmissionReceipt>;
}

