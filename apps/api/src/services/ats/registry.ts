import { AtsAdapter } from './types';
import GreenhouseAdapter from './greenhouse.adapter';
import LeverAdapter from './lever.adapter';
import AshbyBrowserAdapter from './ashby.browser.adapter';
import WorkdayBrowserAdapter from './workday.browser.adapter';
import SmartRecruitersBrowserAdapter from './smartrecruiters.browser.adapter';
import GenericBrowserAdapter from './generic.browser.adapter';

const adapters: Record<string, AtsAdapter> = {
  greenhouse: GreenhouseAdapter,
  lever: LeverAdapter,
  workday: WorkdayBrowserAdapter,
  ashby: AshbyBrowserAdapter,
  smartrecruiters: SmartRecruitersBrowserAdapter,
  other: GenericBrowserAdapter
};

export const getAtsAdapter = (platform = 'other'): AtsAdapter => adapters[platform] || adapters.other;

