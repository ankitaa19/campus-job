import axios from 'axios';
import { AtsAdapter, AtsSubmitContext, AtsSubmissionReceipt } from './types';

class GreenhouseAdapter implements AtsAdapter {
  async submitApplication(context: AtsSubmitContext): Promise<AtsSubmissionReceipt> {
    const apiKey = process.env.GREENHOUSE_JOB_BOARD_API_KEY || process.env.GREENHOUSE_API_KEY;
    if (!apiKey) throw new Error('GREENHOUSE_JOB_BOARD_API_KEY is required for Greenhouse submissions');

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

