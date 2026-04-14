import { makeAutoObservable, runInAction } from 'mobx';
import type { ApiClient } from '@/shared/api';
import type { Post } from '@/shared/api';

export class PostDetailStore {
  post: Post | null = null;
  isLoading = false;
  isLiking = false;
  error: string | null = null;

  private currentId: string | null = null;

  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
    makeAutoObservable(this, { api: false } as any, { autoBind: true });
  }

  async load(id: string) {
    if (this.currentId === id && this.post) return;
    this.currentId = id;
    this.post = null;
    this.isLoading = true;
    this.error = null;

    try {
      const res = await this.api.getPost(id);
      runInAction(() => {
        if (this.currentId === id) {
          this.post = res.data.post;
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

  async toggleLike() {
    if (!this.post || this.isLiking) return;
    this.isLiking = true;

    const prev = { isLiked: this.post.isLiked, likesCount: this.post.likesCount };
    this.post.isLiked = !this.post.isLiked;
    this.post.likesCount += this.post.isLiked ? 1 : -1;

    try {
      const res = await this.api.toggleLike(this.post.id);
      runInAction(() => {
        if (this.post) {
          this.post.isLiked = res.data.isLiked;
          this.post.likesCount = res.data.likesCount;
        }
      });
      return { postId: this.post!.id, ...res.data };
    } catch {
      runInAction(() => {
        if (this.post) {
          this.post.isLiked = prev.isLiked;
          this.post.likesCount = prev.likesCount;
        }
      });
      return null;
    } finally {
      runInAction(() => {
        this.isLiking = false;
      });
    }
  }

  updateLikes(likesCount: number) {
    if (this.post) this.post.likesCount = likesCount;
  }

  updateCommentsCount(delta: number) {
    if (this.post) this.post.commentsCount += delta;
  }

  reset() {
    this.post = null;
    this.currentId = null;
    this.isLoading = false;
    this.error = null;
  }
}
