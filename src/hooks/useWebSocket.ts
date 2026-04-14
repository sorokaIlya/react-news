import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { wsStore } from '../stores/WebSocketStore';
import type {
  PostDetailResponse,
  PostsResponse,
  CommentsResponse,
  WsLikeUpdated,
  WsCommentAdded,
} from '../api/types';

export function useWebSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    wsStore.connect();

    const unsubLike = wsStore.onLikeUpdated((event: WsLikeUpdated) => {
      // Update post detail cache
      queryClient.setQueryData<PostDetailResponse>(
        ['post', event.postId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: {
              ...old.data,
              post: { ...old.data.post, likesCount: event.likesCount },
            },
          };
        },
      );

      // Update feed caches
      queryClient.setQueriesData<{
        pages: PostsResponse[];
        pageParams: unknown[];
      }>({ queryKey: ['posts'] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: {
              ...page.data,
              posts: page.data.posts.map((p) =>
                p.id === event.postId
                  ? { ...p, likesCount: event.likesCount }
                  : p,
              ),
            },
          })),
        };
      });
    });

    const unsubComment = wsStore.onCommentAdded((event: WsCommentAdded) => {
      // Prepend new comment to the comments cache
      queryClient.setQueriesData<{
        pages: CommentsResponse[];
        pageParams: unknown[];
      }>({ queryKey: ['comments', event.postId] }, (old) => {
        if (!old) return old;
        const firstPage = old.pages[0];
        if (!firstPage) return old;
        // Avoid duplicates
        const exists = old.pages.some((page) =>
          page.data.comments.some((c) => c.id === event.comment.id),
        );
        if (exists) return old;
        return {
          ...old,
          pages: [
            {
              ...firstPage,
              data: {
                ...firstPage.data,
                comments: [event.comment, ...firstPage.data.comments],
              },
            },
            ...old.pages.slice(1),
          ],
        };
      });

      // Increment commentsCount in post caches
      queryClient.setQueryData<PostDetailResponse>(
        ['post', event.postId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: {
              ...old.data,
              post: {
                ...old.data.post,
                commentsCount: old.data.post.commentsCount + 1,
              },
            },
          };
        },
      );
    });

    return () => {
      unsubLike();
      unsubComment();
      wsStore.disconnect();
    };
  }, [queryClient]);
}
