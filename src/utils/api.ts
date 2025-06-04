import { QueryParams } from '@/types';
import { API_ROUTES } from '@/constants';

/**
 * URL 파라미터를 생성합니다.
 *
 * @description 객체 형태의 파라미터를 URLSearchParams 문자열로 변환
 * undefined나 null 값은 자동으로 제외됩니다.
 *
 * @param params - 파라미터 객체
 * @returns URL 쿼리 문자열
 *
 * @example
 * ```ts
 * const queryString = buildUrlParams({
 *   page: '1',
 *   limit: '10',
 *   channel: 'channelName'
 * });
 * // 결과: "page=1&limit=10&channel=channelName"
 * ```
 */
export function buildUrlParams(params: QueryParams): string {
  const urlParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      urlParams.append(key, value);
    }
  });

  return urlParams.toString();
}

/**
 * API 응답을 처리합니다.
 *
 * @description HTTP 응답을 검증하고 JSON으로 파싱
 * 에러 상황에서 의미있는 에러 메시지를 제공합니다.
 *
 * @template T - 응답 데이터의 타입
 * @param response - Fetch API Response 객체
 * @returns 파싱된 JSON 데이터
 * @throws {Error} HTTP 에러나 JSON 파싱 에러 시
 *
 * @example
 * ```ts
 * const response = await fetch('/api/data');
 * const data = await handleApiResponse<MyDataType>(response);
 * ```
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
  }

  try {
    return await response.json();
  } catch {
    throw new Error('응답을 JSON으로 파싱하는 중 오류가 발생했습니다.');
  }
}

/**
 * Shorts API 호출
 *
 * @description 쇼츠 비디오 목록을 페이지네이션과 함께 가져옵니다.
 * 채널 필터링과 페이지 크기 조절을 지원합니다.
 *
 * @param params - 쿼리 파라미터
 * @param params.page - 페이지 번호 (기본값: '1')
 * @param params.limit - 페이지당 항목 수 (기본값: '3')
 * @param params.channel - 필터링할 채널명 (선택사항)
 * @returns Promise<ShortsResponse> 쇼츠 응답 데이터
 *
 * @example
 * ```ts
 * const shorts = await fetchShorts({
 *   page: '1',
 *   limit: '10',
 *   channel: 'channelName'
 * });
 * ```
 */
export async function fetchShorts(params: QueryParams) {
  const queryString = buildUrlParams(params);
  const response = await fetch(`${API_ROUTES.SHORTS}?${queryString}`);
  return handleApiResponse(response);
}

/**
 * Channels API 호출
 *
 * @description 활성화된 채널 목록을 가져옵니다.
 * 캐싱된 데이터를 사용하여 성능을 최적화합니다.
 *
 * @returns Promise<Channel[]> 채널 목록
 *
 * @example
 * ```ts
 * const channels = await fetchChannels();
 * ```
 */
export async function fetchChannels() {
  const response = await fetch(API_ROUTES.CHANNELS);
  return handleApiResponse(response);
}
