import { WS_URL } from '../config';
import type { WsEvent, WsLikeUpdated, WsCommentAdded } from '../api/types';
const RECONNECT_DELAY = 3000;

type Listener<T> = (event: T) => void;
type Unsubscribe = () => void;

export class RealtimeService {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;
  private token: string;

  private likeListeners = new Set<Listener<WsLikeUpdated>>();
  private commentListeners = new Set<Listener<WsCommentAdded>>();

  constructor(token: string) {
    this.token = token;
  }

  connect() {
    if (this.ws || this.disposed) return;

    this.ws = new WebSocket(`${WS_URL}?token=${this.token}`);

    this.ws.onmessage = (event) => {
      try {
        const data: WsEvent = JSON.parse(event.data);
        this.dispatch(data);
      } catch {
        // ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      this.ws = null;
      if (!this.disposed) this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  disconnect() {
    this.disposed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  onLikeUpdated(listener: Listener<WsLikeUpdated>): Unsubscribe {
    this.likeListeners.add(listener);
    return () => this.likeListeners.delete(listener);
  }

  onCommentAdded(listener: Listener<WsCommentAdded>): Unsubscribe {
    this.commentListeners.add(listener);
    return () => this.commentListeners.delete(listener);
  }

  private dispatch(event: WsEvent) {
    switch (event.type) {
      case 'like_updated':
        this.likeListeners.forEach((fn) => fn(event));
        break;
      case 'comment_added':
        this.commentListeners.forEach((fn) => fn(event));
        break;
    }
  }

  private scheduleReconnect() {
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, RECONNECT_DELAY);
  }
}
