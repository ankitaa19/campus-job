import { AtsAdapter } from './types';
import GreenhouseAdapter from './greenhouse.adapter';
import LeverAdapter from './lever.adapter';
import { createStubAtsAdapter } from './stub.adapter';

const adapters: Record<string, AtsAdapter> = {
  greenhouse: GreenhouseAdapter,
  lever: LeverAdapter,
  workday: createStubAtsAdapter('workday'),
  ashby: createStubAtsAdapter('ashby'),
  smartrecruiters: createStubAtsAdapter('smartrecruiters'),
  other: createStubAtsAdapter('other')
};

export const getAtsAdapter = (platform = 'other'): AtsAdapter => adapters[platform] || adapters.other;

