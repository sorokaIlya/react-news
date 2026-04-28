import { makeAutoObservable } from 'mobx';

export type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'fallback';

/** After how many consecutive failed reconnects we switch to polling. */
export const FALLBACK_THRESHOLD = 3;

/** How often React Query refetches its data while in fallback mode. */
export const FALLBACK_POLL_INTERVAL_MS = 15_000;

/** WS reconnect cadence in fallback (kept slow so we don't spam a dead host). */
export const FALLBACK_WS_RETRY_MS = 30_000;

/** WS reconnect cadence in healthy reconnect mode. */
export const RECONNECT_DELAY_MS = 3_000;

export class RealtimeStatusStore {
  status: RealtimeStatus = 'idle';
  failedAttempts = 0;
  lastError: string | null = null;

  constructor() {
    makeAutoObservable(this, undefined, { autoBind: true });
  }

  markConnecting(): void {
    this.status = 'connecting';
    this.lastError = null;
  }

  markConnected(): void {
    this.status = 'connected';
    this.failedAttempts = 0;
    this.lastError = null;
  }

  markDisconnected(reason?: string): void {
    this.failedAttempts += 1;
    this.lastError = reason ?? null;
    this.status = this.failedAttempts >= FALLBACK_THRESHOLD ? 'fallback' : 'reconnecting';
  }

  markIdle(): void {
    this.status = 'idle';
    this.failedAttempts = 0;
    this.lastError = null;
  }

  // ---- derived ----

  get isFallback(): boolean {
    return this.status === 'fallback';
  }

  get isLive(): boolean {
    return this.status === 'connected';
  }

  get pollingIntervalMs(): number | false {
    return this.isFallback ? FALLBACK_POLL_INTERVAL_MS : false;
  }

  get reconnectDelayMs(): number {
    return this.isFallback ? FALLBACK_WS_RETRY_MS : RECONNECT_DELAY_MS;
  }
}
