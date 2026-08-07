import { JobProvider, ProviderName } from './types';
import { LeverProvider } from './lever.provider';
import { CareerPageProvider } from './career-page.provider';
import { GreenhouseProvider } from './greenhouse.provider';
import { AshbyProvider } from './ashby.provider';
import { HimalayasProvider } from './himalayas.provider';
import { WeWorkRemotelyProvider } from './we-work-remotely.provider';
import { SmartRecruitersProvider } from './smartrecruiters.provider';
import { WorkdayProvider } from './workday.provider';
import { SeleniumPageProvider } from './selenium-page.provider';
import { AdzunaProvider } from './adzuna.provider';

class ProviderRegistry {
  private readonly providers = new Map<ProviderName, JobProvider>();

  constructor() {
    this.register(new AdzunaProvider());
    this.register(new LeverProvider());
    this.register(new CareerPageProvider());
    this.register(new GreenhouseProvider());
    this.register(new AshbyProvider());
    this.register(new SmartRecruitersProvider());
    this.register(new WorkdayProvider());
    this.register(new SeleniumPageProvider());
    this.register(new HimalayasProvider());
    this.register(new WeWorkRemotelyProvider());
  }

  register(provider: JobProvider): void {
    this.providers.set(provider.name, provider);
  }

  get(providerName: string): JobProvider {
    const provider = this.providers.get(providerName as ProviderName);
    if (!provider) throw new Error(`Unsupported job provider: ${providerName}`);
    return provider;
  }

  list(): ProviderName[] {
    return Array.from(this.providers.keys());
  }
}

export default new ProviderRegistry();
