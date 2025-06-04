/**
 * 초를 MM:SS 형식으로 포맷팅합니다.
 *
 * @description 비디오 재생 시간이나 진행 시간을 사용자 친화적인 형태로 변환
 * 잘못된 값이나 NaN인 경우 '0:00'을 반환합니다.
 *
 * @param seconds - 변환할 초 단위 시간
 * @returns MM:SS 형식의 시간 문자열
 *
 * @example
 * ```ts
 * formatTime(125) // "2:05"
 * formatTime(45)  // "0:45"
 * formatTime(0)   // "0:00"
 * ```
 */
export function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 조회수를 읽기 쉬운 형식으로 포맷팅합니다.
 *
 * @description 큰 숫자를 K(천), M(백만) 단위로 축약하여 표시
 * 소수점 첫째 자리까지 표시합니다.
 *
 * @param count - 변환할 조회수
 * @returns 축약된 조회수 문자열
 *
 * @example
 * ```ts
 * formatViewCount(1500000) // "1.5M"
 * formatViewCount(2500)    // "2.5K"
 * formatViewCount(500)     // "500"
 * ```
 */
export function formatViewCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * 날짜를 상대적 시간으로 포맷팅합니다.
 *
 * @description 게시 날짜를 현재 시간 기준으로 상대적 시간으로 변환
 * '방금 전', 'N분 전', 'N시간 전', 'N일 전' 등의 형태로 표시합니다.
 *
 * @param dateString - ISO 날짜 문자열 또는 Date 생성자가 인식할 수 있는 형식
 * @returns 상대적 시간 문자열
 *
 * @example
 * ```ts
 * formatRelativeTime('2024-01-01T10:00:00Z') // "3일 전"
 * formatRelativeTime('2024-01-04T11:30:00Z') // "2시간 전"
 * ```
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const intervals = [
    { label: '년', seconds: 31536000 },
    { label: '개월', seconds: 2592000 },
    { label: '일', seconds: 86400 },
    { label: '시간', seconds: 3600 },
    { label: '분', seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count > 0) {
      return `${count}${interval.label} 전`;
    }
  }

  return '방금 전';
}
