import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import { AtsAdapter, AtsApplicationSchema, AtsSubmitContext, AtsSubmissionReceipt } from './types';
import LeverBrowserAdapter from './lever.browser.adapter';

class LeverAdapter implements AtsAdapter {
  async inspectApplication(job: any): Promise<AtsApplicationSchema> {
    const site = String(job.sourceCompanySlug || '').trim();
    const postingId = String(job.atsJobId || job.sourceExternalId || '').trim();
    const configured = Boolean(process.env.LEVER_POSTINGS_API_KEY);
    if (!configured) return LeverBrowserAdapter.inspectApplication!(job);
    return {
      capability: configured && site && postingId ? 'auto_apply' : 'needs_you',
      requiredFields: ['name', 'email', 'resume'],
      reasons: [
        ...(!configured ? ['lever_credentials_not_configured'] : []),
        ...(!site ? ['lever_site_missing'] : []),
        ...(!postingId ? ['lever_posting_id_missing'] : [])
      ]
    };
  }

  async submitApplication(context: AtsSubmitContext): Promise<AtsSubmissionReceipt> {
    const apiKey = process.env.LEVER_POSTINGS_API_KEY;
    if (!apiKey) return LeverBrowserAdapter.submitApplication(context);
    const site = String(context.job.sourceCompanySlug || '').trim();
    const postingId = String(context.job.atsJobId || context.job.sourceExternalId || '').trim();
    if (!site || !postingId) throw new Error('Lever site and posting ID are required');

    const payload = await this.buildPayload(context);
    const region = String(context.job.apiRegion || process.env.LEVER_API_REGION || 'global').toLowerCase();
    const host = region === 'eu' ? 'api.eu.lever.co' : 'api.lever.co';
    const url = `https://${host}/v0/postings/${encodeURIComponent(site)}/${encodeURIComponent(postingId)}`;
    const response = await axios.post(url, payload.form, {
      params: { key: apiKey },
      headers: payload.form.getHeaders(),
      timeout: 30000,
      maxBodyLength: 15 * 1024 * 1024,
      validateStatus: status => status >= 200 && status < 300
    });
    const externalApplicationId = response.data?.applicationId;

    return {
      status: externalApplicationId || response.data?.ok === true ? 'confirmed' : 'submitted',
      provider: 'lever',
      externalApplicationId,
      rawResponse: { status: response.status, statusText: response.statusText, data: response.data },
      submittedFields: payload.auditFields
    };
  }

  private async buildPayload(context: AtsSubmitContext): Promise<{ form: FormData; auditFields: Record<string, unknown> }> {
    const { student, user, materials } = context;
    const name = `${student.firstName || ''} ${student.lastName || ''}`.trim() || String(user.name || '').trim();
    const email = String(student.email || user.email || '').trim();
    const form = new FormData();
    form.append('name', name);
    form.append('email', email);
    if (student.phoneNumber || user.phone) form.append('phone', student.phoneNumber || user.phone);
    form.append('comments', materials.coverLetterText);
    form.append('source', 'CampusPe');
    form.append('silent', 'false');

    const resume = String(student.resumeFile || '').trim();
    if (/^https?:\/\//i.test(resume)) {
      const response = await axios.get(resume, { responseType: 'stream', timeout: 15000 });
      form.append('resume', response.data, { filename: 'resume.pdf', contentType: response.headers['content-type'] || 'application/pdf' });
    } else if (resume && fs.existsSync(resume)) {
      form.append('resume', fs.createReadStream(resume), { filename: 'resume.pdf' });
    } else {
      form.append('resume', Buffer.from(materials.resumeText, 'utf8'), { filename: 'resume.txt', contentType: 'text/plain' });
    }

    return {
      form,
      auditFields: {
        name,
        email,
        phone: student.phoneNumber || user.phone || '',
        source: 'CampusPe',
        resumeAttached: true,
        coverLetterIncluded: Boolean(materials.coverLetterText)
      }
    };
  }
}

export default new LeverAdapter();
