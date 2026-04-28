import type { TierFilter } from '@/transport/api';

/**
 * Centralised query keys. Defining them in one place lets us update them
 * type-safely and from realtime handlers without spreading magic strings.
 */
export const queryKeys = {
  all: ['mecenate'] as const,

  posts: {
    all: ['mecenate', 'posts'] as const,
    list: (tier: TierFilter) => ['mecenate', 'posts', 'list', tier] as const,
    detail: (id: string) => ['mecenate', 'posts', 'detail', id] as const,
  },

  comments: {
    all: ['mecenate', 'comments'] as const,
    list: (postId: string) => ['mecenate', 'comments', 'list', postId] as const,
  },
} as const;
