import { WS_URL } from '@/shared/config';

import type { WsCommentAdded, WsEvent, WsLikeUpdated } from './types';

type Listener<T> = (event: T) => void;
type Unsubscribe = () => void;
type TokenGetter = () => string;

/** Connection lifecycle phase reported to the outside world. */
export type RealtimeServiceStatus = 'connecting' | 'connected' | 'disconnected';

export interface RealtimeServiceOptions {
  /** Called whenever the connection lifecycle changes. */
  onStatus?: (status: RealtimeServiceStatus, error?: string) => void;
  /**
   * Decides the next reconnect delay (ms) given the number of consecutive
   * failed attempts so far. Returning a number schedules a reconnect; the
   * service itself does not know about fallback policy.
   */
  reconnectDelay?: (failedAttempts: number) => number;
}

const DEFAULT_RECONNECT_DELAY_MS = 3_000;

/**
 * Plain WebSocket wrapper with automatic reconnection. Stays decoupled from
 * the cache and from the MobX status store: callers register listeners and
 * receive status callbacks, then translate those into whatever side effects
 * they want.
 */
export class RealtimeService {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;
  private failedAttempts = 0;
  private reconnectAfterClose = false;
  private readonly getToken: TokenGetter;
  private readonly options: RealtimeServiceOptions;

  private likeListeners = new Set<Listener<WsLikeUpdated>>();
  private commentListeners = new Set<Listener<WsCommentAdded>>();

  constructor(getToken: TokenGetter, options: RealtimeServiceOptions = {}) {
    this.getToken = getToken;
    this.options = options;
  }

  connect(): void {
    if (this.ws || this.disposed) return;

    this.options.onStatus?.('connecting');
    this.ws = new WebSocket(`${WS_URL}?token=${this.getToken()}`);

    this.ws.onopen = () => {
      this.failedAttempts = 0;
      this.options.onStatus?.('connected');
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(String(event.data)) as WsEvent;
        this.dispatch(data);
      } catch {
        // ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      const shouldReconnectImmediately = this.reconnectAfterClose;
      this.reconnectAfterClose = false;
      this.ws = null;
      if (this.disposed) return;
      if (shouldReconnectImmediately) {
        this.connect();
        return;
      }
      this.failedAttempts += 1;
      this.options.onStatus?.('disconnected');
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      // onerror fires before onclose for transport-level failures; we let
      // onclose perform the reconnect bookkeeping. We just trigger the
      // close so reconnection logic kicks in deterministically.
      this.ws?.close();
    };
  }

  disconnect(): void {
    this.disposed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  restart(): void {
    if (this.disposed) return;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.reconnectAfterClose = true;
      this.ws.close();
      return;
    }
    this.connect();
  }

  onLikeUpdated(listener: Listener<WsLikeUpdated>): Unsubscribe {
    this.likeListeners.add(listener);
    return () => {
      this.likeListeners.delete(listener);
    };
  }

  onCommentAdded(listener: Listener<WsCommentAdded>): Unsubscribe {
    this.commentListeners.add(listener);
    return () => {
      this.commentListeners.delete(listener);
    };
  }

  private dispatch(event: WsEvent): void {
    switch (event.type) {
      case 'like_updated':
        this.likeListeners.forEach((fn) => fn(event));
        break;
      case 'comment_added':
        this.commentListeners.forEach((fn) => fn(event));
        break;
    }
  }

  private scheduleReconnect(): void {
    const delay = this.options.reconnectDelay?.(this.failedAttempts) ?? DEFAULT_RECONNECT_DELAY_MS;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
}
