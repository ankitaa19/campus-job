import { AtsAdapter } from './types';
import GreenhouseAdapter from './greenhouse.adapter';
import { createBrowserFormAtsAdapter } from './browser-form.adapter';

const adapters: Record<string, AtsAdapter> = {
  greenhouse: GreenhouseAdapter,
  lever: createBrowserFormAtsAdapter('lever'),
  workday: createBrowserFormAtsAdapter('workday'),
  ashby: createBrowserFormAtsAdapter('ashby'),
  smartrecruiters: createBrowserFormAtsAdapter('smartrecruiters'),
  other: createBrowserFormAtsAdapter('other')
};

export const getAtsAdapter = (platform = 'other'): AtsAdapter => adapters[platform] || adapters.other;
