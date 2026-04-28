import { makeAutoObservable } from 'mobx';

import type { TierFilter } from '@/transport/api';

export class UiStore {
  tier: TierFilter = 'all';
  constructor() {
    makeAutoObservable(this, undefined, { autoBind: true });
  }

  setTier(tier: TierFilter): void {
    if (this.tier === tier) return;
    this.tier = tier;
  }
}
