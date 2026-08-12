import { BrowserFormAdapter } from './browser-form.adapter';

export default new BrowserFormAdapter({
  provider: 'smartrecruiters',
  startButtonTexts: [/^apply$/i, /apply now/i, /i'm interested/i],
  nextButtonTexts: [/^next$/i, /^continue$/i, /save and continue/i],
  submitButtonTexts: [/submit application/i, /complete application/i, /^submit$/i],
  successText: [/application (has been )?submitted/i, /thank you for applying/i],
  loginText: [/sign in to smartrecruiters/i, /create (an )?account/i],
  customFieldSelectors: {
    firstName: ['input[name*="firstName" i]', 'input[autocomplete="given-name"]'],
    lastName: ['input[name*="lastName" i]', 'input[autocomplete="family-name"]'],
    email: ['input[type="email"]'],
    phone: ['input[type="tel"]'],
    resume: ['input[type="file"]'],
    coverLetter: ['textarea[name*="cover" i]', 'textarea[name*="message" i]']
  }
});
