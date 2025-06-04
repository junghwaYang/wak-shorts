import { useInfiniteQuery, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { ShortsResponse } from '@/types';
import { fetchShorts } from '@/utils/api';
import { QUERY_KEYS, CACHE_TIME, PAGINATION } from '@/constants';

interface UseShortsOptions {
  selectedChannel: string | null;
}

/**
 * Shorts 데이터를 관리하는 커스텀 훅
 *
 * @description 무한 스크롤, 캐싱, 채널별 필터링을 지원하는 Shorts 데이터 관리 훅
 * @param options - 옵션 객체
 * @param options.selectedChannel - 선택된 채널명 (null인 경우 전체 채널)
 *
 * @returns {Object} Shorts 관련 상태와 액션들
 * @returns {Short[]} shorts - 로드된 Shorts 배열
 * @returns {boolean} isLoading - 로딩 상태
 * @returns {string} status - 쿼리 상태 ('pending' | 'error' | 'success')
 * @returns {boolean} hasNextPage - 다음 페이지 존재 여부
 * @returns {boolean} isFetchingNextPage - 다음 페이지 로딩 상태
 * @returns {Function} fetchNextPage - 다음 페이지 로드 함수
 * @returns {Function} handleChannelChange - 채널 변경 처리 함수
 * @returns {Function} prefetchNextPage - 다음 페이지 프리로드 함수
 *
 * @example
 * ```tsx
 * const {
 *   shorts,
 *   isLoading,
 *   handleChannelChange
 * } = useShorts({ selectedChannel: 'channelName' });
 * ```
 */
export function useShorts({ selectedChannel }: UseShortsOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, refetch } =
    useInfiniteQuery<ShortsResponse, Error, InfiniteData<ShortsResponse>, [string, string]>({
      queryKey: [QUERY_KEYS.SHORTS, selectedChannel ?? 'all'],
      queryFn: async ({ pageParam = 1 }) => {
        const page = typeof pageParam === 'number' ? pageParam : Number(pageParam);
        return fetchShorts({
          page: page.toString(),
          limit: PAGINATION.DEFAULT_PAGE_SIZE.toString(),
          ...(selectedChannel && { channel: selectedChannel }),
        }) as Promise<ShortsResponse>;
      },
      getNextPageParam: (lastPage: ShortsResponse) => {
        if (!lastPage.hasMore) return undefined;
        return lastPage.page + 1;
      },
      initialPageParam: 1,
      staleTime: CACHE_TIME.STALE_TIME_30_MIN,
      gcTime: CACHE_TIME.GC_TIME_24_HOUR,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    });

  /**
   * 채널 변경을 처리하는 함수
   *
   * @description 캐시된 데이터가 있으면 즉시 사용하고, 없으면 새로 로드
   * @param channelName - 변경할 채널명 (null인 경우 전체 채널)
   */
  const handleChannelChange = useCallback(
    async (channelName: string | null) => {
      setIsLoading(true);
      try {
        const queryKey = [QUERY_KEYS.SHORTS, channelName ?? 'all'];
        const cachedData = queryClient.getQueryData(queryKey);

        if (!cachedData) {
          await refetch();
        }
      } finally {
        setIsLoading(false);
      }
    },
    [refetch, queryClient]
  );

  /**
   * 다음 페이지를 미리 로드하는 함수
   *
   * @description 사용자 경험 향상을 위해 다음 페이지 데이터를 미리 캐시에 저장
   */
  const prefetchNextPage = useCallback(() => {
    if (data?.pages && data.pages.length > 0 && hasNextPage && !isFetchingNextPage) {
      const nextPage = data.pages.length + 1;
      queryClient.prefetchInfiniteQuery({
        queryKey: [QUERY_KEYS.SHORTS, selectedChannel ?? 'all'],
        queryFn: async () => {
          return fetchShorts({
            page: nextPage.toString(),
            limit: PAGINATION.DEFAULT_PAGE_SIZE.toString(),
            ...(selectedChannel && { channel: selectedChannel }),
          }) as Promise<ShortsResponse>;
        },
        initialPageParam: nextPage,
      });
    }
  }, [data?.pages, hasNextPage, isFetchingNextPage, selectedChannel, queryClient]);

  const shorts = data?.pages.flatMap((page) => page.data) ?? [];

  return {
    shorts,
    isLoading,
    status,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    handleChannelChange,
    prefetchNextPage,
  };
}
