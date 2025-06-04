export interface Short {
  id: number;
  video_id: string;
  title: string;
  channel_name: string;
  thumbnail_url: string;
  view_count: number;
  published_at: string;
}

export interface Channel {
  id: number;
  channel_name: string;
  is_active: boolean;
}

export interface ShortsResponse {
  data: Short[];
  page: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface QueryParams {
  page?: string;
  limit?: string;
  channel?: string;
}
