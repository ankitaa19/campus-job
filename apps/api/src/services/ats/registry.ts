import { AtsAdapter } from './types';
import GreenhouseAdapter from './greenhouse.adapter';
import { createStubAtsAdapter } from './stub.adapter';

const adapters: Record<string, AtsAdapter> = {
  greenhouse: GreenhouseAdapter,
  lever: createStubAtsAdapter('lever'),
  workday: createStubAtsAdapter('workday'),
  ashby: createStubAtsAdapter('ashby'),
  smartrecruiters: createStubAtsAdapter('smartrecruiters'),
  other: createStubAtsAdapter('other')
};

export const getAtsAdapter = (platform = 'other'): AtsAdapter => adapters[platform] || adapters.other;

