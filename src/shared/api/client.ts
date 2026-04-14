import axios, { AxiosInstance, AxiosError } from 'axios';
import "react-native-get-random-values";
import { v4 as uuidv4 } from 'uuid';
import type {
  PostsResponse,
  PostDetailResponse,
  LikeResponse,
  CommentsResponse,
  CommentCreatedResponse,
  TierFilter,
} from './types';

const BASE_URL = 'https://k8s.mectest.ru/test-app';

export class ApiClient {
  private http: AxiosInstance;
  private token: string;

  constructor() {
    this.token = uuidv4();

    this.http = axios.create({
      baseURL: BASE_URL,
      timeout: 15_000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.http.interceptors.request.use((config) => {
      config.headers.Authorization = `Bearer ${this.token}`;
      return config;
    });

    this.http.interceptors.response.use(
      (response) => {
        const body = response.data;
        if (body && body.ok === false) {
          const message = body.error?.message ?? 'Unknown API error';
          return Promise.reject(new ApiError(message, body.error?.code));
        }
        return response;
      },
      (error: AxiosError<{ ok: boolean; error?: { code: string; message: string } }>) => {
        if (error.response?.data?.error) {
          const { code, message } = error.response.data.error;
          return Promise.reject(new ApiError(message, code, error.response.status));
        }
        const message = error.message || 'Network error';
        return Promise.reject(new ApiError(message, 'NETWORK_ERROR'));
      },
    );
  }

  getToken(): string {
    return this.token;
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

    const { data } = await this.http.get<PostsResponse>('/posts', { params: query });
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

    const { data } = await this.http.get<CommentsResponse>(
      `/posts/${params.postId}/comments`,
      { params: query },
    );
    return data;
  }

  async addComment(postId: string, text: string): Promise<CommentCreatedResponse> {
    const { data } = await this.http.post<CommentCreatedResponse>(
      `/posts/${postId}/comments`,
      { text },
    );
    return data;
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
