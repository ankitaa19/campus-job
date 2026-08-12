import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ProviderCompany } from '../models/ProviderCompany';
import { getAtsAdapter } from '../services/ats/registry';
import {
  BrowserFailureReason,
  BrowserSubmissionError
} from '../services/ats/types';

describe('provider browser adapters', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  beforeEach(async () => {
    delete process.env.GREENHOUSE_JOB_BOARD_API_KEY;
    delete process.env.GREENHOUSE_API_KEY;
    delete process.env.LEVER_POSTINGS_API_KEY;
    for (const key in mongoose.connection.collections) {
      await mongoose.connection.collections[key].deleteMany({});
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  test.each(['workday', 'ashby', 'smartrecruiters', 'other'])(
    '%s uses a provider-aware browser adapter rather than a stub',
    async provider => {
      const adapter = getAtsAdapter(provider);
      expect(adapter.inspectApplication).toBeDefined();
      const inspection = await adapter.inspectApplication!({
        applyUrl: 'https://jobs.example.com/apply'
      });
      expect(inspection).toMatchObject({
        capability: 'unsupported',
        reasons: ['browser_automation_not_authorized']
      });
    }
  );

  test('written employer permission enables browser submission capability', async () => {
    const company = await ProviderCompany.create({
      provider: 'workday',
      companySlug: 'authorized-employer',
      companyName: 'Authorized Employer',
      sourceType: 'company_careers',
      apiRegion: 'global',
      automationPermission: 'written_permission'
    });

    const inspection = await getAtsAdapter('workday').inspectApplication!({
      providerCompanyId: company._id,
      applyUrl: 'https://authorized-employer.wd1.myworkdayjobs.com/job/123'
    });

    expect(inspection.capability).toBe('auto_apply');
  });

  test('public terms permission enables browser submission capability', async () => {
    const company = await ProviderCompany.create({
      provider: 'ashby',
      companySlug: 'terms-authorized',
      companyName: 'Terms Authorized',
      sourceType: 'company_careers',
      apiRegion: 'global',
      automationPermission: 'public_terms_allow'
    });

    const inspection = await getAtsAdapter('ashby').inspectApplication!({
      providerCompanyId: company._id,
      applyUrl: 'https://jobs.ashbyhq.com/terms-authorized/123'
    });

    expect(inspection.capability).toBe('auto_apply');
  });

  test.each<BrowserFailureReason>([
    'captcha_required',
    'login_required',
    'missing_required_custom_question',
    'submit_button_not_found',
    'resume_upload_failed',
    'provider_form_changed',
    'external_site_blocked',
    'submission_not_confirmed',
    'navigation_failed'
  ])('browser failures preserve granular reason %s and diagnostics', reason => {
    const error = new BrowserSubmissionError(
      reason,
      'Browser submission paused',
      {
        provider: 'workday',
        finalUrl: 'https://example.com/final',
        pageTitle: 'Apply',
        visibleButtonTexts: ['Next', 'Save and Continue'],
        visibleRequiredFields: [{ tag: 'input', name: 'customQuestion' }],
        pageTextSnippet: 'Application page',
        step: 'step_2'
      }
    );

    expect(error.reason).toBe(reason);
    expect(error.diagnostics.visibleButtonTexts).toContain('Next');
    expect(error.needsUser).toBe(true);
  });
});
