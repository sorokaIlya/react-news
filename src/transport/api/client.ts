import axios, { AxiosError, AxiosInstance } from 'axios';

import { API_URL, networkConfig } from '@/shared/config';

import type {
  CommentCreatedResponse,
  CommentsResponse,
  LikeResponse,
  PostDetailResponse,
  PostsResponse,
  TierFilter,
} from './types';

/** Shape of every error envelope the backend returns on failure. */
interface ApiErrorPayload {
  ok: false;
  error: { code: string; message: string };
}

/** Generic success envelope used by every endpoint that returns data. */
interface ApiSuccess<T> {
  ok: true;
  data: T;
}

type TokenGetter = () => string;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private readonly http: AxiosInstance;

  constructor(public getToken: TokenGetter) {
    this.http = axios.create({
      baseURL: API_URL,
      timeout: networkConfig.requestTimeoutMs,
      headers: { 'Content-Type': 'application/json' },
    });

    this.http.interceptors.request.use((config) => {
      const token = this.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.http.interceptors.response.use(
      (response) => {
        // Some backends return 200 + { ok: false }. Treat those as errors.
        const body = response.data as ApiSuccess<unknown> | ApiErrorPayload;
        console.log(body);
        debugger;
        if (body && body.ok === false) {
          return Promise.reject(
            new ApiError(body.error?.message ?? 'Unknown API error', body.error?.code),
          );
        }
        return response;
      },
      (error: AxiosError<ApiErrorPayload>) => {
        if (error.response?.data?.error) {
          const { code, message } = error.response.data.error;
          return Promise.reject(new ApiError(message, code, error.response.status));
        }
        return Promise.reject(new ApiError(error.message || 'Network error', 'NETWORK_ERROR'));
      },
    );
  }

  /**
   * SessionStore stays the only owner of the token string. The transport keeps
   * only a getter so requests always see the latest value after rotation.
   */
  setTokenGetter(getToken: TokenGetter): void {
    this.getToken = getToken;
  }

  // ---- Posts ----

  async getPosts(params: {
    limit?: number;
    cursor?: string;
    tier?: TierFilter;
  }): Promise<PostsResponse> {
    const query: Record<string, string | number> = {};
    if (params.limit) query.limit = params.limit;
    if (params.cursor) query.cursor = params.cursor;
    if (params.tier && params.tier !== 'all') query.tier = params.tier;

    const { data } = await this.http.get<PostsResponse>('/posts', {
      params: query,
    });
    return data;
  }

  async getPost(id: string): Promise<PostDetailResponse> {
    const { data } = await this.http.get<PostDetailResponse>(`/posts/${id}`);
    return data;
  }

  async toggleLike(id: string): Promise<LikeResponse> {
    const { data } = await this.http.post<LikeResponse>(`/posts/${id}/like`);
    return data;
  }

  // ---- Comments ----

  async getComments(params: {
    postId: string;
    limit?: number;
    cursor?: string;
  }): Promise<CommentsResponse> {
    const query: Record<string, string | number> = {};
    if (params.limit) query.limit = params.limit;
    if (params.cursor) query.cursor = params.cursor;

    const { data } = await this.http.get<CommentsResponse>(`/posts/${params.postId}/comments`, {
      params: query,
    });
    return data;
  }

  async addComment(postId: string, text: string): Promise<CommentCreatedResponse> {
    const { data } = await this.http.post<CommentCreatedResponse>(`/posts/${postId}/comments`, {
      text,
    });
    return data;
  }
}
