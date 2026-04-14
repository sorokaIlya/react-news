import { makeAutoObservable, runInAction } from 'mobx';
import type { ApiClient } from '../api/client';
import type { Comment } from '../api/types';

export class CommentsStore {
  comments: Comment[] = [];
  nextCursor: string | null = null;
  hasMore = true;
  isLoading = false;
  isLoadingMore = false;
  isSending = false;
  error: string | null = null;

  private currentPostId: string | null = null;

  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
    makeAutoObservable(this, { api: false } as any, { autoBind: true });
  }

  async load(postId: string) {
    this.currentPostId = postId;
    this.comments = [];
    this.nextCursor = null;
    this.hasMore = true;
    this.isLoading = true;
    this.error = null;

    try {
      const res = await this.api.getComments({ postId, limit: 20 });
      runInAction(() => {
        if (this.currentPostId === postId) {
          this.comments = res.data.comments;
          this.nextCursor = res.data.nextCursor;
          this.hasMore = res.data.hasMore;
        }
      });
    } catch (e: any) {
      runInAction(() => {
        this.error = e.message ?? 'Ошибка загрузки';
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async loadMore() {
    if (
      this.isLoadingMore ||
      !this.hasMore ||
      !this.nextCursor ||
      !this.currentPostId
    )
      return;
    this.isLoadingMore = true;

    try {
      const res = await this.api.getComments({
        postId: this.currentPostId,
        limit: 20,
        cursor: this.nextCursor,
      });
      runInAction(() => {
        this.comments = [...this.comments, ...res.data.comments];
        this.nextCursor = res.data.nextCursor;
        this.hasMore = res.data.hasMore;
      });
    } catch {
      // silent
    } finally {
      runInAction(() => {
        this.isLoadingMore = false;
      });
    }
  }

  async send(text: string): Promise<boolean> {
    if (!this.currentPostId || this.isSending) return false;
    this.isSending = true;

    try {
      const res = await this.api.addComment(this.currentPostId, text);
      runInAction(() => {
        if (!this.comments.some((c) => c.id === res.data.comment.id)) {
          this.comments = [res.data.comment, ...this.comments];
        }
      });
      return true;
    } catch {
      return false;
    } finally {
      runInAction(() => {
        this.isSending = false;
      });
    }
  }

  addRealtimeComment(comment: Comment) {
    if (comment.postId !== this.currentPostId) return;
    if (this.comments.some((c) => c.id === comment.id)) return;
    this.comments = [comment, ...this.comments];
  }

  reset() {
    this.comments = [];
    this.currentPostId = null;
    this.nextCursor = null;
    this.hasMore = true;
    this.error = null;
  }
}
