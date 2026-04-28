import { useQuery } from '@tanstack/react-query';

import type { Post, PostDetailResponse } from '@/transport/api';
import { queryKeys } from '@/read-model/query';
import { useStores } from '@/composition';

type UsePostOptions = {
  /**
   * Refetch interval (ms) for the active query, or `false` to disable.
   * Wired from `RealtimeStatusStore` when WS is in fallback mode.
   */
  refetchInterval?: number | false;
};

/**
 * Fetches a single post by id. Selecting `data.post` here means consumers
 * receive the unwrapped Post directly.
 */
export function usePost(id: string | undefined, options: UsePostOptions = {}) {
  const { apiClient } = useStores();
  const { refetchInterval = false } = options;

  return useQuery<PostDetailResponse, Error, Post>({
    queryKey: id ? queryKeys.posts.detail(id) : ['mecenate', 'posts', 'detail', '__none__'],
    queryFn: () => apiClient.getPost(id as string),
    select: (response) => response.data.post,
    enabled: Boolean(id),
    refetchInterval,
  });
}
