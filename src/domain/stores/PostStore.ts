import { makeAutoObservable } from 'mobx';

import { ApiClient, Comment } from '@/transport/api';
import { PostCacheService } from '@/read-model/posts';

export class PostStore {
  private readonly likingPostIds = new Set<string>();
  private readonly submittingCommentPostIds = new Set<string>();

  constructor(
    private apiClient: ApiClient,
    private readonly cache: PostCacheService,
  ) {
    makeAutoObservable(
      this,
      {
        isLiking: false,
        isSubmittingComment: false,
      },
      { autoBind: true },
    );
  }

  isLiking(postId: string): boolean {
    return this.likingPostIds.has(postId);
  }

  isSubmittingComment(postId: string): boolean {
    return this.submittingCommentPostIds.has(postId);
  }

  async toggleLike(postId: string): Promise<void> {
    if (!postId || this.isLiking(postId)) return;

    this.likingPostIds.add(postId);
    const session = await this.cache.prepareOptimisticLike(postId);

    try {
      const response = await this.apiClient.toggleLike(postId);
      this.cache.applyLikeState(postId, response.data.isLiked, response.data.likesCount);
    } catch (error) {
      session.rollback();
      throw error;
    } finally {
      this.likingPostIds.delete(postId);
    }
  }

  async addComment(postId: string, text: string): Promise<void> {
    if (!postId || this.isSubmittingComment(postId)) return;

    this.submittingCommentPostIds.add(postId);

    try {
      const response = await this.apiClient.addComment(postId, text);
      this.cache.applyCommentAdded(postId, response.data.comment);
    } finally {
      this.submittingCommentPostIds.delete(postId);
    }
  }

  applyRealtimeLike(postId: string, likesCount: number): void {
    this.cache.applyLikeCount(postId, likesCount);
  }

  applyRealtimeComment(postId: string, comment: Comment): void {
    this.cache.applyCommentAdded(postId, comment);
  }
}
