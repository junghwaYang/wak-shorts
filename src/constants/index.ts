// API 관련 상수
export const API_ROUTES = {
  SHORTS: '/api/shorts',
  CHANNELS: '/api/channels',
} as const;

// 쿼리 키 상수
export const QUERY_KEYS = {
  SHORTS: 'shorts',
  CHANNELS: 'channels',
} as const;

// 캐시 관련 상수
export const CACHE_TIME = {
  STALE_TIME_5_MIN: 1000 * 60 * 5,
  STALE_TIME_30_MIN: 1000 * 60 * 30,
  STALE_TIME_1_HOUR: 1000 * 60 * 60,
  GC_TIME_30_MIN: 1000 * 60 * 30,
  GC_TIME_24_HOUR: 1000 * 60 * 60 * 24,
} as const;

// 페이지네이션 상수
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 3,
  PRELOAD_THRESHOLD: 3,
} as const;

// UI 관련 상수
export const UI_TIMINGS = {
  CONTROLS_HIDE_DELAY: 3000,
  TIME_INFO_HIDE_DELAY: 2000,
  PROGRESS_UPDATE_INTERVAL: 1000,
} as const;
