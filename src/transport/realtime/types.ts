import type { Comment } from '@/transport/api';

export interface WsLikeUpdated {
  type: 'like_updated';
  postId: string;
  likesCount: number;
}

export interface WsCommentAdded {
  type: 'comment_added';
  postId: string;
  comment: Comment;
}

export interface WsPing {
  type: 'ping';
}

export type WsEvent = WsLikeUpdated | WsCommentAdded | WsPing;
