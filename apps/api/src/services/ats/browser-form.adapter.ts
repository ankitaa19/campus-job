import fs from 'fs';
import os from 'os';
import path from 'path';
import { once } from 'events';
import PDFDocument from 'pdfkit';
import puppeteer, { Browser } from 'puppeteer';
import { AtsAdapter, AtsSubmitContext, AtsSubmissionReceipt } from './types';

const SUCCESS_PATTERN = /thank|success|submitted|received|application sent|we'?ve got|we have received|will be in touch/i;
const ERROR_PATTERN = /required|invalid|captcha|robot|verification|error|failed|try again/i;

const launchBrowser = async (): Promise<Browser> => puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--no-first-run',
    '--no-zygote'
  ]
});

const compact = (value: unknown): string => String(value || '').replace(/\s+/g, ' ').trim();

class BrowserFormAtsAdapter implements AtsAdapter {
  constructor(private readonly provider: string) {}

  async submitApplication(context: AtsSubmitContext): Promise<AtsSubmissionReceipt> {
    const applyUrl = compact(context.job.applyUrl || context.job.sourceUrl);
    if (!applyUrl) throw new Error(`${this.provider} application URL is required for browser auto-apply`);

    const payload = await this.buildPayload(context);
    const resumePath = await this.createResumePdf(context);
    let browser: Browser | null = null;
    const postResponses: Array<{ url: string; status: number }> = [];

    try {
      browser = await launchBrowser();
      const page = await browser.newPage();
      page.setDefaultTimeout(Number(process.env.ATS_BROWSER_STEP_TIMEOUT_MS || 15000));
      page.on('response', response => {
        const request = response.request();
        if (request.method() === 'POST') {
          postResponses.push({ url: response.url(), status: response.status() });
        }
      });

      await page.goto(applyUrl, { waitUntil: 'networkidle2', timeout: Number(process.env.ATS_BROWSER_NAV_TIMEOUT_MS || 45000) });
      await this.openApplicationForm(page);
      await this.fillForm(page, payload);
      await this.uploadResume(page, resumePath);
      await this.submitForm(page);

      const pageText = compact(await page.evaluate(() => document.body?.innerText || ''));
      const successfulPost = postResponses.find(response => response.status >= 200 && response.status < 300);
      if (!successfulPost && !SUCCESS_PATTERN.test(pageText)) {
        const errorSnippet = pageText.match(ERROR_PATTERN)
          ? pageText.slice(0, 500)
          : 'No verifiable submission confirmation was shown after clicking submit';
        throw new Error(`browser_submission_unverified: ${errorSnippet}`);
      }

      return {
        status: 'confirmed',
        provider: this.provider,
        rawResponse: {
          method: 'browser_form',
          finalUrl: page.url(),
          postResponses,
          successTextMatched: SUCCESS_PATTERN.test(pageText),
          submittedAt: new Date()
        },
        submittedFields: {
          ...payload,
          applyUrl,
          resumeFileUploaded: true,
          provider: this.provider,
          submissionMethod: 'browser_form'
        }
      };
    } finally {
      await browser?.close().catch(() => undefined);
      fs.promises.unlink(resumePath).catch(() => undefined);
    }
  }

  private async buildPayload(context: AtsSubmitContext) {
    const student = context.student;
    const user = context.user;
    const firstName = compact(student.firstName || String(user.name || '').split(' ')[0]);
    const lastName = compact(student.lastName || String(user.name || '').split(' ').slice(1).join(' '));
    return {
      firstName,
      lastName,
      fullName: compact(`${firstName} ${lastName}`),
      email: compact(student.email || user.email),
      phone: compact(student.phoneNumber || user.phone),
      location: compact(student.locations?.[0] || student.location || student.resumeAnalysis?.extractedDetails?.contactInfo?.address),
      linkedIn: compact(student.linkedin || student.linkedIn || student.resumeAnalysis?.extractedDetails?.contactInfo?.linkedin),
      portfolio: compact(student.portfolio || student.website),
      coverLetter: context.materials.coverLetterText,
      resumeText: context.materials.resumeText
    };
  }

  private async createResumePdf(context: AtsSubmitContext): Promise<string> {
    const filePath = path.join(os.tmpdir(), `campuspe-auto-apply-${context.application._id}.pdf`);
    const doc = new PDFDocument({ margin: 48 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.fontSize(14).text(context.materials.resumeText || 'Resume', { lineGap: 4 });
    doc.end();
    await once(stream, 'finish');
    return filePath;
  }

  private async openApplicationForm(page: any): Promise<void> {
    const hasForm = await page.evaluate(() => Boolean(document.querySelector('form input, form textarea, input[type="email"], input[name*="email" i]')));
    if (hasForm) return;
    const clicked = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('a, button')) as HTMLElement[];
      const target = elements.find(element => /apply|start application|submit application/i.test(element.innerText || element.getAttribute('aria-label') || ''));
      target?.click();
      return Boolean(target);
    });
    if (clicked) {
      await page.waitForNetworkIdle({ idleTime: 1000, timeout: 10000 }).catch(() => undefined);
    }
  }

  private async fillForm(page: any, payload: Record<string, string>): Promise<void> {
    await page.evaluate((data: Record<string, string>) => {
      const visible = (element: Element) => {
        const style = window.getComputedStyle(element);
        const box = (element as HTMLElement).getBoundingClientRect();
        return style.visibility !== 'hidden' && style.display !== 'none' && box.width > 0 && box.height > 0;
      };
      const labelFor = (element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => {
        const id = element.id ? document.querySelector(`label[for="${CSS.escape(element.id)}"]`)?.textContent : '';
        const parent = element.closest('label')?.textContent || '';
        return `${id || ''} ${parent || ''} ${element.name || ''} ${element.id || ''} ${element.getAttribute('placeholder') || ''} ${element.getAttribute('aria-label') || ''}`.toLowerCase();
      };
      const setNativeValue = (element: HTMLInputElement | HTMLTextAreaElement, value: string) => {
        const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value');
        descriptor?.set?.call(element, value);
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      };

      document.querySelectorAll<HTMLInputElement>('input').forEach(input => {
        if (!visible(input) || input.disabled || input.readOnly) return;
        const type = (input.type || 'text').toLowerCase();
        const label = labelFor(input);
        if (['hidden', 'file', 'submit', 'button', 'reset', 'password'].includes(type)) return;
        if (type === 'checkbox') {
          if (input.required || /agree|consent|privacy|terms|confirm|authorize/.test(label)) input.checked = true;
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return;
        }
        if (type === 'radio') return;
        if (/first/.test(label)) return setNativeValue(input, data.firstName);
        if (/last|surname|family/.test(label)) return setNativeValue(input, data.lastName);
        if (/full.?name|name/.test(label)) return setNativeValue(input, data.fullName);
        if (/email/.test(label)) return setNativeValue(input, data.email);
        if (/phone|mobile|tel/.test(label)) return setNativeValue(input, data.phone);
        if (/linkedin/.test(label)) return setNativeValue(input, data.linkedIn);
        if (/portfolio|website|url/.test(label)) return setNativeValue(input, data.portfolio || data.linkedIn);
        if (/location|city|address/.test(label)) return setNativeValue(input, data.location);
      });

      const radioGroups = new Map<string, HTMLInputElement[]>();
      document.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach(input => {
        if (!visible(input) || input.disabled) return;
        const key = input.name || input.id;
        if (!key) return;
        radioGroups.set(key, [...(radioGroups.get(key) || []), input]);
      });
      radioGroups.forEach(inputs => {
        if (inputs.some(input => input.checked)) return;
        const required = inputs.some(input => input.required);
        if (!required) return;
        const noOption = inputs.find(input => /no|false|0/i.test(`${input.value} ${labelFor(input)}`));
        const option = noOption || inputs[0];
        option.checked = true;
        option.dispatchEvent(new Event('change', { bubbles: true }));
      });

      document.querySelectorAll<HTMLSelectElement>('select').forEach(select => {
        if (!visible(select) || select.disabled || select.value) return;
        const option = Array.from(select.options).find(item => !item.disabled && item.value);
        if (option) {
          select.value = option.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });

      document.querySelectorAll<HTMLTextAreaElement>('textarea').forEach((textarea, index) => {
        if (!visible(textarea) || textarea.disabled || textarea.readOnly || textarea.value) return;
        const label = labelFor(textarea);
        setNativeValue(textarea, /resume|summary|experience/.test(label) && index > 0 ? data.resumeText : data.coverLetter);
      });
    }, payload);
  }

  private async uploadResume(page: any, resumePath: string): Promise<void> {
    const inputs = await page.$$('input[type="file"]');
    for (const input of inputs) {
      await input.uploadFile(resumePath).catch(() => undefined);
    }
  }

  private async submitForm(page: any): Promise<void> {
    const clicked = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, input[type="submit"]')) as HTMLElement[];
      const target = elements.find(element => {
        const text = `${element.innerText || ''} ${(element as HTMLInputElement).value || ''} ${element.getAttribute('aria-label') || ''}`;
        return /submit|send application|apply now|apply$/i.test(text) && !(element as HTMLButtonElement).disabled;
      });
      target?.click();
      return Boolean(target);
    });
    if (!clicked) throw new Error('manual_completion_required: submit button was not found');
    await page.waitForNetworkIdle({ idleTime: 1500, timeout: 20000 }).catch(() => undefined);
  }
}

export const createBrowserFormAtsAdapter = (provider: string): AtsAdapter => new BrowserFormAtsAdapter(provider);
