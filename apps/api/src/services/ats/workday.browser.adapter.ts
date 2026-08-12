import { BrowserFormAdapter } from './browser-form.adapter';

export default new BrowserFormAdapter({
  provider: 'workday',
  startButtonTexts: [/^apply$/i, /apply now/i, /start your application/i],
  manualEntryButtonTexts: [/apply manually/i, /autofill manually/i, /use my last application/i],
  nextButtonTexts: [/save and continue/i, /^next$/i, /^continue$/i],
  submitButtonTexts: [/submit application/i, /^submit$/i],
  successText: [/application submitted/i, /thank you for applying/i, /application received/i],
  successUrl: [/candidate-home/i, /application\/confirmation/i],
  // Most Workday tenants require a candidate account. The base adapter pauses
  // at this gate and never attempts to defeat authentication or MFA.
  loginText: [/sign in/i, /create account/i, /candidate account/i, /email address.*password/i],
  customFieldSelectors: {
    firstName: ['input[data-automation-id="legalNameSection_firstName"]', 'input[autocomplete="given-name"]'],
    lastName: ['input[data-automation-id="legalNameSection_lastName"]', 'input[autocomplete="family-name"]'],
    email: ['input[data-automation-id="email"]', 'input[type="email"]'],
    phone: ['input[data-automation-id="phone-number"]', 'input[type="tel"]'],
    resume: ['input[data-automation-id="file-upload-input-ref"]', 'input[type="file"]'],
    coverLetter: ['textarea[data-automation-id*="cover" i]', 'textarea[name*="cover" i]']
  }
});
