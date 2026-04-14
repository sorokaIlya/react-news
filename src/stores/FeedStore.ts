import { makeAutoObservable, runInAction } from 'mobx';
import type { ApiClient } from '@/shared/api';
import { Post, TierFilter } from '@/shared/api';


export class FeedStore {
  posts: Post[] = [];
  tier: TierFilter = 'all';
  nextCursor: string | null = null;
  hasMore = true;
  isLoading = false;
  isRefreshing = false;
  isLoadingMore = false;
  error: string | null = null;

  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
    makeAutoObservable(this, undefined, { autoBind: true });
  }

  setTier(tier: TierFilter) {
    if (this.tier === tier) return;
    this.tier = tier;
    this.reset();
    this.loadPosts();
  }

  async loadPosts() {
    if (this.isLoading) return;
    this.isLoading = true;
    this.error = null;

    try {
      const res = await this.api.getPosts({ limit: 10, tier: this.tier });
      runInAction(() => {
        this.posts = res.data.posts;
        this.nextCursor = res.data.nextCursor;
        this.hasMore = res.data.hasMore;
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

  async refresh() {
    this.isRefreshing = true;
    this.error = null;

    try {
      const res = await this.api.getPosts({ limit: 10, tier: this.tier });
      runInAction(() => {
        this.posts = res.data.posts;
        this.nextCursor = res.data.nextCursor;
        this.hasMore = res.data.hasMore;
      });
    } catch (e: any) {
      runInAction(() => {
        this.error = e.message ?? 'Ошибка загрузки';
      });
    } finally {
      runInAction(() => {
        this.isRefreshing = false;
      });
    }
  }

  async loadMore() {
    if (this.isLoadingMore || !this.hasMore || !this.nextCursor) return;
    this.isLoadingMore = true;

    try {
      const res = await this.api.getPosts({
        limit: 10,
        cursor: this.nextCursor,
        tier: this.tier,
      });
      runInAction(() => {
        this.posts = [...this.posts, ...res.data.posts];
        this.nextCursor = res.data.nextCursor;
        this.hasMore = res.data.hasMore;
      });
    } catch {
      // silent — user can retry by scrolling again
    } finally {
      runInAction(() => {
        this.isLoadingMore = false;
      });
    }
  }

  updatePostLikes(postId: string, likesCount: number) {
    const post = this.posts.find((p) => p.id === postId);
    if (post) post.likesCount = likesCount;
  }

  applyLikeToggle(postId: string, isLiked: boolean, likesCount: number) {
    const post = this.posts.find((p) => p.id === postId);
    if (post) {
      post.isLiked = isLiked;
      post.likesCount = likesCount;
    }
  }

  private reset() {
    this.posts = [];
    this.nextCursor = null;
    this.hasMore = true;
    this.error = null;
  }
}
