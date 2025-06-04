import { useInfiniteQuery, InfiniteData } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Channel } from '@/types';
import { fetchChannels } from '@/utils/api';
import { QUERY_KEYS, CACHE_TIME } from '@/constants';

/**
 * 채널 목록을 관리하는 커스텀 훅
 *
 * @description 활성화된 채널 목록을 가져오고 캐싱하는 훅
 *
 * @returns {Object} 채널 관련 상태
 * @returns {Channel[]} channels - 활성화된 채널 목록
 *
 * @example
 * ```tsx
 * const { channels } = useChannels();
 * ```
 */
export function useChannels() {
  const [channels, setChannels] = useState<Channel[]>([]);

  const { data: channelsData } = useInfiniteQuery<Channel[], Error, InfiniteData<Channel[]>>({
    queryKey: [QUERY_KEYS.CHANNELS],
    queryFn: async () => {
      return fetchChannels() as Promise<Channel[]>;
    },
    getNextPageParam: () => undefined,
    initialPageParam: 1,
    staleTime: CACHE_TIME.STALE_TIME_1_HOUR,
    gcTime: CACHE_TIME.GC_TIME_24_HOUR,
  });

  useEffect(() => {
    if (channelsData?.pages[0]) {
      setChannels(channelsData.pages[0]);
    }
  }, [channelsData]);

  return {
    channels,
  };
}
