import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { Post, PostsResponse, TierFilter } from '@/transport/api';
import { networkConfig } from '@/shared/config';
import { queryKeys } from '@/read-model/query';
import { useStores } from '@/composition';

type UsePostsOptions = {
  refetchInterval?: number | false;
};

/**
 * Paginated feed query. Returns a flat list of posts ready for FlatList,
 * plus the loading/refresh/load-more flags that the screen needs.
 */
export function usePosts(tier: TierFilter, options: UsePostsOptions = {}) {
  const { apiClient } = useStores();
  const { refetchInterval = false } = options;

  const query = useInfiniteQuery<
    PostsResponse,
    Error,
    { pages: PostsResponse[]; pageParams: (string | undefined)[] },
    ReturnType<typeof queryKeys.posts.list>,
    string | undefined
  >({
    queryKey: queryKeys.posts.list(tier),
    queryFn: ({ pageParam }) =>
      apiClient.getPosts({
        limit: networkConfig.feedPageSize,
        cursor: pageParam,
        tier,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.data.hasMore && lastPage.data.nextCursor ? lastPage.data.nextCursor : undefined,
    refetchInterval,
  });

  const posts = useMemo<Post[]>(
    () => query.data?.pages.flatMap((page) => page.data.posts) ?? [],
    [query.data],
  );

  return {
    posts,
    isLoading: query.isPending,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    isLoadingMore: query.isFetchingNextPage,
    error: query.error,
    refresh: query.refetch,
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) {
        query.fetchNextPage();
      }
    },
  };
}
