export interface Author {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  subscribersCount: number;
  isVerified: boolean;
}

export interface Post {
  id: string;
  author: Author;
  title: string;
  body: string;
  preview: string;
  coverUrl: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  tier: 'free' | 'paid';
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  author: Author;
  text: string;
  createdAt: string;
}

export interface PostsResponse {
  ok: boolean;
  data: {
    posts: Post[];
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface PostDetailResponse {
  ok: boolean;
  data: {
    post: Post;
  };
}

export interface LikeResponse {
  ok: boolean;
  data: {
    isLiked: boolean;
    likesCount: number;
  };
}

export interface CommentsResponse {
  ok: boolean;
  data: {
    comments: Comment[];
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface CommentCreatedResponse {
  ok: boolean;
  data: {
    comment: Comment;
  };
}

export type TierFilter = 'all' | 'free' | 'paid';

// WebSocket event types
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
