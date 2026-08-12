import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import axios from 'axios';
import puppeteer, { Browser, Page } from 'puppeteer';
import { ProviderCompany } from '../../models/ProviderCompany';
import {
  AtsAdapter,
  AtsApplicationSchema,
  AtsSubmitContext,
  AtsSubmissionReceipt,
  BrowserFailureDiagnostics,
  BrowserFailureReason,
  BrowserSubmissionError
} from './types';

export interface BrowserProviderSpec {
  provider: string;
  startButtonTexts?: RegExp[];
  manualEntryButtonTexts?: RegExp[];
  nextButtonTexts?: RegExp[];
  submitButtonTexts?: RegExp[];
  successText?: RegExp[];
  successUrl?: RegExp[];
  loginText?: RegExp[];
  customFieldSelectors?: Record<string, string[]>;
  beforeFill?(page: Page): Promise<void>;
}

type KnownField = 'firstName' | 'lastName' | 'fullName' | 'email' | 'phone' | 'resume' | 'coverLetter';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const normalize = (value: unknown) => String(value || '').replace(/\s+/g, ' ').trim();
const safeSlug = (value: string) => value.replace(/[^a-z0-9_-]/gi, '-').slice(0, 80);
let activeBrowserSessions = 0;
const browserWaiters: Array<() => void> = [];

const acquireBrowserSession = async () => {
  const limit = Math.max(1, Math.min(8, Number(process.env.ATS_BROWSER_MAX_CONCURRENCY || 2)));
  if (activeBrowserSessions >= limit) await new Promise<void>(resolve => browserWaiters.push(resolve));
  activeBrowserSessions += 1;
};

const releaseBrowserSession = () => {
  activeBrowserSessions = Math.max(0, activeBrowserSessions - 1);
  browserWaiters.shift()?.();
};

const DEFAULT_SELECTORS: Record<KnownField, string[]> = {
  firstName: ['input[name*="firstName" i]', 'input[id*="firstName" i]', 'input[autocomplete="given-name"]'],
  lastName: ['input[name*="lastName" i]', 'input[id*="lastName" i]', 'input[autocomplete="family-name"]'],
  fullName: ['input[name="name" i]', 'input[name*="fullName" i]', 'input[id*="fullName" i]', 'input[autocomplete="name"]'],
  email: ['input[type="email"]', 'input[name*="email" i]', 'input[autocomplete="email"]'],
  phone: ['input[type="tel"]', 'input[name*="phone" i]', 'input[autocomplete="tel"]'],
  resume: ['input[type="file"][name*="resume" i]', 'input[type="file"][id*="resume" i]', 'input[type="file"]'],
  coverLetter: ['textarea[name*="cover" i]', 'textarea[id*="cover" i]', 'textarea[name*="additional" i]']
};

/**
 * Authorized browser-form adapter with provider-specific transition labels.
 * It never bypasses CAPTCHA/login and never invents custom-question answers.
 */
export class BrowserFormAdapter implements AtsAdapter {
  constructor(protected readonly spec: BrowserProviderSpec) {}

  async inspectApplication(job: any): Promise<AtsApplicationSchema> {
    const permission = await this.getAutomationPermission(job);
    if (!permission) {
      return {
        capability: 'unsupported',
        requiredFields: [],
        reasons: ['browser_automation_not_authorized']
      };
    }
    return { capability: 'auto_apply', requiredFields: ['name', 'email', 'resume'], reasons: [] };
  }

  async submitApplication(context: AtsSubmitContext): Promise<AtsSubmissionReceipt> {
    const permission = await this.getAutomationPermission(context.job);
    if (!permission) {
      throw new BrowserSubmissionError(
        'external_site_blocked',
        'Browser submission is not authorized for this employer/source',
        { provider: this.spec.provider, finalUrl: context.job.applyUrl, step: 'authorization' }
      );
    }
    const applyUrl = String(context.job.applyUrl || context.job.sourceUrl || '').trim();
    if (!/^https:\/\//i.test(applyUrl)) {
      throw new BrowserSubmissionError(
        'navigation_failed',
        'A valid HTTPS application URL is required',
        { provider: this.spec.provider, finalUrl: applyUrl, step: 'navigation' }
      );
    }

    let browser: Browser | undefined;
    let page: Page | undefined;
    let resumePath: string | undefined;
    let step = 'launch';
    try {
      await acquireBrowserSession();
      browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 1200 });
      await page.setUserAgent(process.env.ATS_BROWSER_USER_AGENT || 'CampusPe-Authorized-Application-Agent/1.0');

      step = 'navigation';
      await page.goto(applyUrl, { waitUntil: 'networkidle2', timeout: 45_000 });
      await this.detectHumanGate(page, step);

      step = 'open_application';
      await this.clickText(page, this.spec.startButtonTexts || []);
      await this.clickText(page, this.spec.manualEntryButtonTexts || []);
      await this.spec.beforeFill?.(page);

      step = 'fill_form';
      resumePath = await this.resolveResume(context);
      await this.fillKnownFields(page, context, resumePath);

      const maxSteps = Math.max(1, Math.min(12, Number(process.env.ATS_BROWSER_MAX_STEPS || 8)));
      for (let index = 0; index < maxSteps; index += 1) {
        await this.detectHumanGate(page, `step_${index + 1}`);
        const missing = await this.requiredUnansweredFields(page);
        if (missing.length) {
          throw await this.failure(
            page,
            'missing_required_custom_question',
            `Required application fields need student input: ${missing.map(item => item.label || item.name || item.type || item.tag).slice(0, 5).join(', ')}`,
            `step_${index + 1}`
          );
        }

        step = `submit_${index + 1}`;
        const submitted = await this.clickText(page, this.spec.submitButtonTexts || []);
        if (submitted) {
          await delay(1500);
          if (await this.hasSuccessEvidence(page)) {
            return this.receipt(page, context);
          }
          // Some providers label intermediate transitions "Submit"/"Apply".
          await this.fillKnownFields(page, context, resumePath);
          continue;
        }

        step = `next_${index + 1}`;
        const advanced = await this.clickText(page, this.spec.nextButtonTexts || []);
        if (!advanced) break;
        await delay(800);
        await this.fillKnownFields(page, context, resumePath);
      }

      if (await this.hasSuccessEvidence(page)) return this.receipt(page, context);
      throw await this.failure(page, 'submit_button_not_found', 'No actionable submit button was found', step);
    } catch (error) {
      if (error instanceof BrowserSubmissionError) throw error;
      if (page) {
        const reason: BrowserFailureReason = /timeout|navigation/i.test(String((error as Error)?.message || ''))
          ? 'navigation_failed'
          : 'provider_form_changed';
        throw await this.failure(page, reason, error instanceof Error ? error.message : String(error), step);
      }
      throw new BrowserSubmissionError(
        'external_site_blocked',
        error instanceof Error ? error.message : 'Browser could not be launched',
        { provider: this.spec.provider, finalUrl: applyUrl, step }
      );
    } finally {
      if (browser) await browser.close().catch(() => undefined);
      if (resumePath?.startsWith(os.tmpdir())) fs.promises.unlink(resumePath).catch(() => undefined);
      releaseBrowserSession();
    }
  }

  protected async fillKnownFields(page: Page, context: AtsSubmitContext, resumePath: string): Promise<void> {
    const selectors = { ...DEFAULT_SELECTORS, ...(this.spec.customFieldSelectors || {}) } as Record<KnownField, string[]>;
    const firstName = normalize(context.student.firstName || String(context.user.name || '').split(' ')[0]);
    const lastName = normalize(context.student.lastName || String(context.user.name || '').split(' ').slice(1).join(' '));
    await this.fillFirst(page, selectors.firstName, firstName);
    await this.fillFirst(page, selectors.lastName, lastName);
    await this.fillFirst(page, selectors.fullName, normalize(`${firstName} ${lastName}`));
    await this.fillFirst(page, selectors.email, normalize(context.student.email || context.user.email));
    await this.fillFirst(page, selectors.phone, normalize(context.student.phoneNumber || context.user.phone));
    await this.fillFirst(page, selectors.coverLetter, context.materials.coverLetterText);

    const fileInput = await this.firstVisibleHandle(page, selectors.resume);
    if (fileInput) {
      try {
        await fileInput.uploadFile(resumePath);
      } catch (error) {
        throw await this.failure(page, 'resume_upload_failed', error instanceof Error ? error.message : String(error), 'resume_upload');
      }
    }
  }

  protected async detectHumanGate(page: Page, step: string): Promise<void> {
    const body = normalize(await page.$eval('body', element => element.innerText).catch(() => ''));
    const url = page.url();
    const captcha = /captcha|verify you are human|security challenge|cloudflare/i;
    if (captcha.test(body) || /captcha|challenge/i.test(url)) {
      throw await this.failure(page, 'captcha_required', 'A CAPTCHA or anti-bot challenge requires the student', step);
    }
    const login = this.spec.loginText || [/sign in/i, /log in/i, /create (an )?account/i];
    if (login.some(pattern => pattern.test(body)) && !/application submitted|thank you for applying/i.test(body)) {
      throw await this.failure(page, 'login_required', 'Authentication is required on the employer site', step);
    }
  }

  protected async clickText(page: Page, patterns: RegExp[]): Promise<boolean> {
    if (!patterns.length) return false;
    const handles = await page.$$('button, input[type="submit"], input[type="button"], a[role="button"], a');
    for (const handle of handles) {
      const data = await handle.evaluate((element: Element) => ({
        text: (element.textContent || (element as HTMLInputElement).value || '').trim(),
        disabled: (element as HTMLButtonElement).disabled || element.getAttribute('aria-disabled') === 'true',
        visible: Boolean((element as HTMLElement).offsetWidth || (element as HTMLElement).offsetHeight)
      }));
      if (!data.visible || data.disabled || !patterns.some(pattern => pattern.test(data.text))) continue;
      await handle.click();
      await delay(700);
      return true;
    }
    return false;
  }

  protected async fillFirst(page: Page, selectors: string[], value: string): Promise<boolean> {
    if (!value) return false;
    for (const selector of selectors) {
      const handle = await page.$(selector);
      if (!handle) continue;
      const editable = await handle.evaluate((element: Element) => {
        const input = element as HTMLInputElement;
        return !input.disabled && !input.readOnly && Boolean((element as HTMLElement).offsetWidth || (element as HTMLElement).offsetHeight);
      });
      if (!editable) continue;
      await handle.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await handle.type(value);
      return true;
    }
    return false;
  }

  protected async firstVisibleHandle(page: Page, selectors: string[]) {
    for (const selector of selectors) {
      const handles = await page.$$(selector);
      for (const handle of handles) {
        if (await handle.evaluate((element: Element) => Boolean((element as HTMLElement).offsetWidth || (element as HTMLElement).offsetHeight))) {
          return handle;
        }
      }
    }
    return undefined;
  }

  protected async requiredUnansweredFields(page: Page): Promise<BrowserFailureDiagnostics['visibleRequiredFields']> {
    return page.evaluate(() => {
      const known = /first.?name|last.?name|full.?name|email|phone|resume|cover|location/i;
      return [...document.querySelectorAll('input[required], textarea[required], select[required], [aria-required="true"]')]
        .filter(element => {
          const input = element as HTMLInputElement;
          if (!(input.offsetWidth || input.offsetHeight) || input.disabled) return false;
          const identity = `${input.name} ${input.id} ${input.type}`;
          if (known.test(identity)) return false;
          if (input.type === 'checkbox' || input.type === 'radio') return !input.checked;
          return !String(input.value || '').trim();
        })
        .map(element => {
          const input = element as HTMLInputElement;
          const escapedId = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(input.id || '') : input.id;
          const label = input.id ? document.querySelector(`label[for="${escapedId}"]`)?.textContent : input.closest('label')?.textContent;
          return {
            tag: element.tagName.toLowerCase(),
            type: input.type,
            name: input.name || input.id || undefined,
            label: (label || input.getAttribute('aria-label') || input.placeholder || '').replace(/\s+/g, ' ').trim().slice(0, 160) || undefined
          };
        })
        .slice(0, 30);
    });
  }

  protected async hasSuccessEvidence(page: Page): Promise<boolean> {
    const text = normalize(await page.$eval('body', element => element.innerText).catch(() => ''));
    return Boolean(
      (this.spec.successUrl || []).some(pattern => pattern.test(page.url()))
      || (this.spec.successText || [/application (has been )?submitted/i, /thank you for applying/i, /application received/i])
        .some(pattern => pattern.test(text))
    );
  }

  protected async receipt(page: Page, context: AtsSubmitContext): Promise<AtsSubmissionReceipt> {
    const externalApplicationId = this.externalIdFromUrl(page.url());
    return {
      status: 'confirmed',
      provider: `${this.spec.provider}_browser`,
      externalApplicationId,
      rawResponse: {
        evidence: 'confirmation_page',
        finalUrl: page.url(),
        pageTitle: await page.title(),
        confirmedAt: new Date()
      },
      submittedFields: {
        name: normalize(`${context.student.firstName || ''} ${context.student.lastName || ''}`),
        email: context.student.email || context.user.email,
        resumeAttached: true,
        coverLetterIncluded: Boolean(context.materials.coverLetterText)
      }
    };
  }

  protected externalIdFromUrl(url: string): string | undefined {
    const match = url.match(/(?:application|candidate|submission)[/=?-]([a-z0-9-]{6,})/i);
    return match?.[1];
  }

  protected async failure(
    page: Page,
    reason: BrowserFailureReason,
    message: string,
    step: string
  ): Promise<BrowserSubmissionError> {
    const diagnostics = await this.collectDiagnostics(page, step);
    return new BrowserSubmissionError(reason, message, diagnostics);
  }

  protected async collectDiagnostics(page: Page, step: string): Promise<BrowserFailureDiagnostics> {
    const visibleButtonTexts = await page.$$eval(
      'button, input[type="submit"], input[type="button"], a[role="button"]',
      elements => elements
        .filter(element => Boolean((element as HTMLElement).offsetWidth || (element as HTMLElement).offsetHeight))
        .map(element => (element.textContent || (element as HTMLInputElement).value || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 50)
    ).catch(() => [] as string[]);
    const pageText = normalize(await page.$eval('body', element => element.innerText).catch(() => ''));
    const diagnostics: BrowserFailureDiagnostics = {
      provider: this.spec.provider,
      finalUrl: page.url(),
      pageTitle: await page.title().catch(() => ''),
      visibleButtonTexts,
      visibleRequiredFields: await this.requiredUnansweredFields(page).catch(() => []),
      pageTextSnippet: pageText.slice(0, 1200),
      step
    };

    if (process.env.ATS_DEBUG_ARTIFACTS === 'true') {
      const directory = process.env.ATS_DEBUG_ARTIFACT_DIR || path.join(os.tmpdir(), 'campuspe-ats-artifacts');
      await fs.promises.mkdir(directory, { recursive: true });
      const id = `${safeSlug(this.spec.provider)}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      diagnostics.screenshotPath = path.join(directory, `${id}.png`);
      diagnostics.htmlSnapshotPath = path.join(directory, `${id}.html`);
      await page.screenshot({ path: diagnostics.screenshotPath, fullPage: true }).catch(() => undefined);
      // Strip current input values before persisting HTML to avoid saving PII.
      const sanitizedHtml = await page.evaluate(() => {
        const clone = document.documentElement.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('input, textarea').forEach(element => {
          element.removeAttribute('value');
          element.textContent = '';
        });
        return clone.outerHTML;
      }).catch(() => '');
      if (sanitizedHtml) await fs.promises.writeFile(diagnostics.htmlSnapshotPath, sanitizedHtml, 'utf8');
    }
    return diagnostics;
  }

  protected async resolveResume(context: AtsSubmitContext): Promise<string> {
    const source = normalize(context.student.resumeFile || context.application.resumeFile);
    if (source && !/^https?:\/\//i.test(source) && fs.existsSync(source)) return source;
    const target = path.join(os.tmpdir(), `campuspe-resume-${context.application._id}-${crypto.randomBytes(4).toString('hex')}.pdf`);
    if (/^https:\/\//i.test(source)) {
      try {
        const response = await axios.get(source, { responseType: 'arraybuffer', timeout: 20_000, maxContentLength: 10 * 1024 * 1024 });
        await fs.promises.writeFile(target, Buffer.from(response.data));
        return target;
      } catch (error) {
        throw new BrowserSubmissionError(
          'resume_upload_failed',
          error instanceof Error ? error.message : 'Resume download failed',
          { provider: this.spec.provider, finalUrl: context.job.applyUrl, step: 'resume_download' }
        );
      }
    }
    await fs.promises.writeFile(target.replace(/\.pdf$/, '.txt'), context.materials.resumeText, 'utf8');
    return target.replace(/\.pdf$/, '.txt');
  }

  protected async getAutomationPermission(job: any): Promise<boolean> {
    if (job.providerCompanyId) {
      const company = await ProviderCompany.findById(job.providerCompanyId).select('automationPermission').lean();
      return ['written_permission', 'public_terms_allow'].includes(String(company?.automationPermission || ''));
    }
    // Direct employer jobs may opt in explicitly without a provider record.
    return job.browserAutomationAuthorized === true;
  }
}

