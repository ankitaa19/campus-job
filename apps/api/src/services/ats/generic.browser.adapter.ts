import { BrowserFormAdapter } from './browser-form.adapter';

export default new BrowserFormAdapter({
  provider: 'other',
  startButtonTexts: [/^apply$/i, /apply now/i, /apply for this (job|position)/i],
  manualEntryButtonTexts: [/apply manually/i, /autofill manually/i],
  nextButtonTexts: [/^next$/i, /^continue$/i, /save and continue/i],
  submitButtonTexts: [/submit application/i, /complete application/i, /^submit$/i],
  successText: [/application (has been )?submitted/i, /thank you for applying/i, /application received/i]
});
