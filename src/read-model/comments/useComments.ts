import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { Comment, CommentsResponse } from '@/transport/api';
import { networkConfig } from '@/shared/config';
import { queryKeys } from '@/read-model/query';
import { useStores } from '@/composition';

type UseCommentsOptions = {
  /**
   * Refetch interval (ms) for the active query, or `false` to disable.
   * Wired from `RealtimeStatusStore` when WS is in fallback mode.
   */
  refetchInterval?: number | false;
};

/**
 * Paginated comments query for a given post.
 */
export function useComments(postId: string | undefined, options: UseCommentsOptions = {}) {
  const { apiClient } = useStores();
  const { refetchInterval = false } = options;

  const query = useInfiniteQuery<
    CommentsResponse,
    Error,
    { pages: CommentsResponse[]; pageParams: (string | undefined)[] },
    ReturnType<typeof queryKeys.comments.list>,
    string | undefined
  >({
    queryKey: postId ? queryKeys.comments.list(postId) : queryKeys.comments.list('__none__'),
    queryFn: ({ pageParam }) =>
      apiClient.getComments({
        postId: postId as string,
        limit: networkConfig.commentsPageSize,
        cursor: pageParam,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.data.hasMore && lastPage.data.nextCursor ? lastPage.data.nextCursor : undefined,
    enabled: Boolean(postId),
    refetchInterval,
  });

  const comments = useMemo<Comment[]>(
    () => query.data?.pages.flatMap((page) => page.data.comments) ?? [],
    [query.data],
  );

  return {
    comments,
    isLoading: query.isPending,
    isLoadingMore: query.isFetchingNextPage,
    error: query.error,
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) {
        query.fetchNextPage();
      }
    },
  };
}
