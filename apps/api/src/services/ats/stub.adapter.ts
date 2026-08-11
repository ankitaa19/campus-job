import { AtsAdapter, AtsSubmitContext, AtsSubmissionReceipt } from './types';

class StubAtsAdapter implements AtsAdapter {
  constructor(private readonly provider: string) {}

  async submitApplication(_context: AtsSubmitContext): Promise<AtsSubmissionReceipt> {
    throw new Error(`${this.provider} application submission is not implemented yet; browser automation or an official API adapter is required`);
  }
}

export const createStubAtsAdapter = (provider: string): AtsAdapter => new StubAtsAdapter(provider);

