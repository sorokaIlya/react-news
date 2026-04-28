import { queryKeys } from '@/read-model/query';
import type {
  Comment,
  CommentsResponse,
  Post,
  PostDetailResponse,
  PostsResponse,
} from '@/transport/api';
import { queryClient } from '@/read-model/query';

type InfinitePostsCache = {
  pages: PostsResponse[];
  pageParams: unknown[];
};

type InfiniteCommentsCache = {
  pages: CommentsResponse[];
  pageParams: unknown[];
};

type PostsPage = InfinitePostsCache['pages'][number];
type CommentsPage = InfiniteCommentsCache['pages'][number];
type CacheKey = readonly unknown[];

type LikeSnapshot = {
  previousDetail: PostDetailResponse | undefined;
  previousLists: Map<CacheKey, InfinitePostsCache>;
};

export type OptimisticLikeSession = {
  rollback: () => void;
};

function patchPost(post: Post, isLiked: boolean, likesCount: number): Post {
  return { ...post, isLiked, likesCount };
}

function prependComment(
  cache: InfiniteCommentsCache | undefined,
  comment: Comment,
): InfiniteCommentsCache | undefined {
  if (!cache || cache.pages.length === 0) return cache;
  if (cache.pages[0].data.comments.some((existing) => existing.id === comment.id)) {
    return cache;
  }

  const [firstPage, ...restPages] = cache.pages;
  return {
    ...cache,
    pages: [
      {
        ...firstPage,
        data: {
          ...firstPage.data,
          comments: [comment, ...firstPage.data.comments],
        },
      },
      ...restPages,
    ],
  };
}

function bumpCommentsCount(
  cache: PostDetailResponse | undefined,
  delta: number,
): PostDetailResponse | undefined {
  if (!cache) return cache;

  return {
    ...cache,
    data: {
      post: {
        ...cache.data.post,
        commentsCount: Math.max(0, cache.data.post.commentsCount + delta),
      },
    },
  };
}

/**
 * Encapsulates all React Query-specific cache operations for posts/comments.
 * Domain stores call intent-level methods and stay unaware of query keys,
 * pagination shape, snapshots, and direct QueryClient access.
 */
export class PostCacheService {
  prepareOptimisticLike = async (postId: string): Promise<OptimisticLikeSession> => {
    await queryClient.cancelQueries({ queryKey: queryKeys.posts.all });
    await queryClient.cancelQueries({ queryKey: queryKeys.posts.detail(postId) });

    const snapshot = this.captureLikeSnapshot(postId);
    this.applyOptimisticLikeToggle(postId, snapshot.previousDetail);

    for (const [key, data] of snapshot.previousLists) {
      queryClient.setQueryData<InfinitePostsCache>(key, {
        ...data,
        pages: data.pages.map((page: PostsPage) => ({
          ...page,
          data: {
            ...page.data,
            posts: page.data.posts.map((post: Post) =>
              post.id === postId
                ? patchPost(post, !post.isLiked, post.likesCount + (post.isLiked ? -1 : 1))
                : post,
            ),
          },
        })),
      });
    }

    return {
      rollback: () => {
        this.restoreLikeSnapshot(postId, snapshot);
      },
    };
  };

  applyLikeState(postId: string, isLiked: boolean, likesCount: number): void {
    queryClient.setQueryData<PostDetailResponse>(
      queryKeys.posts.detail(postId),
      (cache: PostDetailResponse | undefined) =>
        cache
          ? {
              ...cache,
              data: {
                post: patchPost(cache.data.post, isLiked, likesCount),
              },
            }
          : cache,
    );

    const lists = queryClient.getQueriesData<InfinitePostsCache>({
      queryKey: queryKeys.posts.all,
    });

    for (const [key, data] of lists) {
      if (!data || !Array.isArray(data.pages)) continue;
      queryClient.setQueryData<InfinitePostsCache>(key, {
        ...data,
        pages: data.pages.map((page: PostsPage) => ({
          ...page,
          data: {
            ...page.data,
            posts: page.data.posts.map((post: Post) =>
              post.id === postId ? patchPost(post, isLiked, likesCount) : post,
            ),
          },
        })),
      });
    }
  }

  applyLikeCount = (postId: string, likesCount: number): void => {
    queryClient.setQueryData<PostDetailResponse>(
      queryKeys.posts.detail(postId),
      (cache: PostDetailResponse | undefined) =>
        cache
          ? {
              ...cache,
              data: {
                post: {
                  ...cache.data.post,
                  likesCount,
                },
              },
            }
          : cache,
    );

    const lists = queryClient.getQueriesData<InfinitePostsCache>({
      queryKey: queryKeys.posts.all,
    });

    for (const [key, data] of lists) {
      if (!data || !Array.isArray(data.pages)) continue;
      queryClient.setQueryData<InfinitePostsCache>(key, {
        ...data,
        pages: data.pages.map((page: PostsPage) => ({
          ...page,
          data: {
            ...page.data,
            posts: page.data.posts.map((post: Post) =>
              post.id === postId ? { ...post, likesCount } : post,
            ),
          },
        })),
      });
    }
  };

  applyCommentAdded = (postId: string, comment: Comment): void => {
    const existingComments = queryClient.getQueryData<InfiniteCommentsCache>(
      queryKeys.comments.list(postId),
    );
    const alreadyPresent =
      existingComments?.pages.some((page: CommentsPage) =>
        page.data.comments.some((existing: Comment) => existing.id === comment.id),
      ) ?? false;

    if (alreadyPresent) {
      return;
    }

    queryClient.setQueryData<InfiniteCommentsCache>(
      queryKeys.comments.list(postId),
      (cache: InfiniteCommentsCache | undefined) => prependComment(cache, comment),
    );

    queryClient.setQueryData<PostDetailResponse>(
      queryKeys.posts.detail(postId),
      (cache: PostDetailResponse | undefined) => bumpCommentsCount(cache, 1),
    );

    this.bumpPostCommentsCountInLists(postId);
  };

  private captureLikeSnapshot(postId: string): LikeSnapshot {
    const previousLists = new Map<CacheKey, InfinitePostsCache>();
    const lists = queryClient.getQueriesData<InfinitePostsCache>({
      queryKey: queryKeys.posts.all,
    });

    for (const [key, data] of lists) {
      if (!data || !Array.isArray(data.pages)) continue;
      previousLists.set(key, data);
    }

    return {
      previousDetail: queryClient.getQueryData<PostDetailResponse>(queryKeys.posts.detail(postId)),
      previousLists,
    };
  }

  private applyOptimisticLikeToggle = (
    postId: string,
    previousDetail: PostDetailResponse | undefined,
  ): void => {
    if (!previousDetail) {
      return;
    }

    const currentPost = previousDetail.data.post;
    queryClient.setQueryData<PostDetailResponse>(queryKeys.posts.detail(postId), {
      ...previousDetail,
      data: {
        post: patchPost(
          currentPost,
          !currentPost.isLiked,
          currentPost.likesCount + (currentPost.isLiked ? -1 : 1),
        ),
      },
    });
  };

  private restoreLikeSnapshot(postId: string, snapshot: LikeSnapshot): void {
    if (snapshot.previousDetail) {
      queryClient.setQueryData(queryKeys.posts.detail(postId), snapshot.previousDetail);
    }

    for (const [key, previousList] of snapshot.previousLists) {
      queryClient.setQueryData<InfinitePostsCache>(key, previousList);
    }
  }
  private bumpPostCommentsCountInLists(postId: string, delta = 1): void {
    const lists = queryClient.getQueriesData<InfinitePostsCache>({
      queryKey: queryKeys.posts.all,
    });

    for (const [key, data] of lists) {
      if (!data || !Array.isArray(data.pages)) continue;

      queryClient.setQueryData<InfinitePostsCache>(key, {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          data: {
            ...page.data,
            posts: page.data.posts.map((post) =>
                post.id === postId
                    ? {
                      ...post,
                      commentsCount: Math.max(0, post.commentsCount + delta),
                    }
                    : post,
            ),
          },
        })),
      });
    }
  }
}
