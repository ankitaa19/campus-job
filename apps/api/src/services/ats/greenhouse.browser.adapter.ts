import { BrowserFormAdapter } from './browser-form.adapter';

export default new BrowserFormAdapter({
  provider: 'greenhouse',
  startButtonTexts: [/apply for this job/i, /^apply now$/i],
  nextButtonTexts: [/^next$/i, /^continue$/i],
  submitButtonTexts: [/submit application/i, /^submit$/i],
  successText: [/thank you for applying/i, /application (has been )?submitted/i],
  customFieldSelectors: {
    firstName: ['#first_name', 'input[name="first_name"]'],
    lastName: ['#last_name', 'input[name="last_name"]'],
    email: ['#email', 'input[name="email"]'],
    phone: ['#phone', 'input[name="phone"]'],
    resume: ['input[name="resume"]', 'input[type="file"]'],
    coverLetter: ['textarea[name="cover_letter"]', 'textarea[name*="cover" i]']
  }
});
