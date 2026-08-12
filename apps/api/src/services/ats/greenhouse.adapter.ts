import axios from 'axios';
import { AtsAdapter, AtsApplicationSchema, AtsSubmitContext, AtsSubmissionReceipt } from './types';
import GreenhouseBrowserAdapter from './greenhouse.browser.adapter';

class GreenhouseAdapter implements AtsAdapter {
  async inspectApplication(job: any): Promise<AtsApplicationSchema> {
    if (process.env.GREENHOUSE_JOB_BOARD_API_KEY || process.env.GREENHOUSE_API_KEY) {
      return { capability: 'auto_apply', requiredFields: ['name', 'email', 'resume'], reasons: [] };
    }
    return GreenhouseBrowserAdapter.inspectApplication!(job);
  }

  async submitApplication(context: AtsSubmitContext): Promise<AtsSubmissionReceipt> {
    const apiKey = process.env.GREENHOUSE_JOB_BOARD_API_KEY || process.env.GREENHOUSE_API_KEY;
    if (!apiKey) return GreenhouseBrowserAdapter.submitApplication(context);

    const boardToken = context.job.sourceCompanySlug || context.job.greenhouseBoardToken;
    const jobPostId = context.job.atsJobId || context.job.sourceExternalId;
    if (!boardToken || !jobPostId) throw new Error('Greenhouse board token and job post ID are required');

    const payload = this.buildPayload(context);
    const auth = Buffer.from(`${apiKey}:`).toString('base64');
    const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs/${encodeURIComponent(String(jobPostId))}`;

    const response = await axios.post(url, payload, {
      timeout: 30000,
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      validateStatus: status => status >= 200 && status < 300
    });

    return {
      status: 'confirmed',
      provider: 'greenhouse',
      externalApplicationId: response.data?.id ? String(response.data.id) : undefined,
      rawResponse: {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      },
      submittedFields: payload
    };
  }

  private buildPayload(context: AtsSubmitContext): Record<string, unknown> {
    const student = context.student;
    const user = context.user;
    const location = student.locations?.[0] || student.resumeAnalysis?.extractedDetails?.contactInfo?.address || undefined;
    return {
      first_name: student.firstName || String(user.name || '').split(' ')[0] || '',
      last_name: student.lastName || String(user.name || '').split(' ').slice(1).join(' ') || '',
      email: student.email || user.email || '',
      phone: student.phoneNumber || user.phone || '',
      ...(location ? { location } : {}),
      resume_text: context.materials.resumeText,
      cover_letter_text: context.materials.coverLetterText,
      mapped_url_token: 'campuspe'
    };
  }
}

export default new GreenhouseAdapter();

