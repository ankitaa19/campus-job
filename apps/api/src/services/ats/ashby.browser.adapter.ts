import { BrowserFormAdapter } from './browser-form.adapter';

export default new BrowserFormAdapter({
  provider: 'ashby',
  startButtonTexts: [/apply for this job/i, /^apply now$/i],
  nextButtonTexts: [/^next$/i, /^continue$/i],
  submitButtonTexts: [/submit application/i, /^submit$/i],
  successText: [/application submitted/i, /thank you for applying/i],
  successUrl: [/application-submitted/i],
  customFieldSelectors: {
    fullName: ['input[name="_systemfield_name"]', 'input[autocomplete="name"]'],
    email: ['input[name="_systemfield_email"]', 'input[type="email"]'],
    phone: ['input[name="_systemfield_phone"]', 'input[type="tel"]'],
    resume: ['input[name="_systemfield_resume"]', 'input[type="file"]'],
    coverLetter: ['textarea[name*="cover" i]', 'textarea[name*="additional" i]']
  }
});
