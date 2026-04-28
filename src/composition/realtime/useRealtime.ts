import { useEffect } from 'react';
import { reaction } from 'mobx';

import { useStores } from '@/composition/providers';
import { RealtimeService } from '@/transport/realtime';

/**
 * Connects the WebSocket once for the app lifetime, mirrors its lifecycle
 * into RealtimeStatusStore (MobX), and routes incoming events through
 * PostStore so the write-side policy stays out of the transport hook. Mount
 * this hook from a top-level provider so it survives navigation.
 *
 * If WS keeps failing, RealtimeStatusStore flips to `fallback`. From that
 * point on, read-model hooks start polling the REST API. We never invalidate
 * manually here — the read-model layer handles fetching, MobX just publishes
 * the "live vs fallback" decision.
 */
export function useRealtime(): void {
  const { posts, realtimeStatus, session } = useStores();

  useEffect(() => {
    const service = new RealtimeService(() => session.getToken, {
      onStatus: (status, error) => {
        switch (status) {
          case 'connecting':
            realtimeStatus.markConnecting();
            break;
          case 'connected':
            realtimeStatus.markConnected();
            break;
          case 'disconnected':
            realtimeStatus.markDisconnected(error);
            break;
        }
      },
      // Pull the next reconnect delay from MobX so fallback policy lives in
      // one place. The service itself stays unaware of "fallback".
      reconnectDelay: () => realtimeStatus.reconnectDelayMs,
    });

    const unsubLike = service.onLikeUpdated((event) => {
      posts.applyRealtimeLike(event.postId, event.likesCount);
    });

    const unsubComment = service.onCommentAdded((event) => {
      posts.applyRealtimeComment(event.postId, event.comment);
    });

    service.connect();
    const disposeTokenReaction = reaction(
      () => session.getToken,
      () => {
        // The current socket cannot mutate its URL, so rotate() forces a
        // reconnect and the next handshake picks up the latest session token.
        service.restart();
      },
    );

    return () => {
      disposeTokenReaction();
      unsubLike();
      unsubComment();
      service.disconnect();
      realtimeStatus.markIdle();
    };
  }, [posts, realtimeStatus, session]);
}
