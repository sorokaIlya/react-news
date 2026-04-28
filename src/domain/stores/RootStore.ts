import { PostCacheService } from '@/read-model/posts';

import { PostStore } from './PostStore';
import { RealtimeStatusStore } from './RealtimeStatusStore';
import { SessionStore } from './SessionStore';
import { UiStore } from './UiStore';
import { ApiClient } from '@/transport/api';

/**
 * Composition root for domain stores. Server snapshots live in the
 * read-model layer.
 */
export class RootStore {
  readonly apiClient: ApiClient;
  readonly session: SessionStore;
  readonly ui: UiStore;
  readonly posts: PostStore;
  readonly realtimeStatus: RealtimeStatusStore;

  constructor() {
    this.session = new SessionStore();
    this.apiClient = new ApiClient(() => this.session.getToken);
    this.ui = new UiStore();
    this.posts = new PostStore(this.apiClient, new PostCacheService());
    this.realtimeStatus = new RealtimeStatusStore();
  }
}
