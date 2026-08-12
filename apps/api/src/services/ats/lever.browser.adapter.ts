import { BrowserFormAdapter } from './browser-form.adapter';

export default new BrowserFormAdapter({
  provider: 'lever',
  startButtonTexts: [/apply for this job/i, /^apply$/i],
  nextButtonTexts: [/^next$/i, /^continue$/i],
  submitButtonTexts: [/submit application/i, /^submit$/i],
  successText: [/thanks for applying/i, /application submitted/i],
  successUrl: [/\/thanks(?:[/?#]|$)/i],
  customFieldSelectors: {
    fullName: ['input[name="name"]'],
    email: ['input[name="email"]'],
    phone: ['input[name="phone"]'],
    resume: ['input[name="resume"]', 'input[type="file"]'],
    coverLetter: ['textarea[name="comments"]', 'textarea[name*="additional" i]']
  }
});
