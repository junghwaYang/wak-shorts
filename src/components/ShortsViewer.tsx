'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useInfiniteQuery, useQueryClient, InfiniteData } from '@tanstack/react-query';
import Image from 'next/image';
import ShortsItem from './ShortsItem';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Short {
  id: number;
  video_id: string;
  title: string;
  channel_name: string;
  thumbnail_url: string;
  view_count: number;
  published_at: string;
}

interface Channel {
  id: number;
  channel_name: string;
  is_active: boolean;
}

interface ShortsResponse {
  data: Short[];
  page: number;
  hasMore: boolean;
}

export default function ShortsViewer() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [globalMuted, setGlobalMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  // 채널 목록 가져오기
  const { data: channelsData } = useInfiniteQuery<Channel[], Error, InfiniteData<Channel[]>>({
    queryKey: ['channels'],
    queryFn: async () => {
      const response = await fetch('/api/channels');
      if (!response.ok) throw new Error('Failed to fetch channels');
      return response.json();
    },
    getNextPageParam: () => undefined,
    initialPageParam: 1,
    staleTime: 1000 * 60 * 60, // 1시간 동안 캐시 유지
    gcTime: 1000 * 60 * 60 * 24, // 24시간 동안 캐시 보관
  });

  useEffect(() => {
    if (channelsData?.pages[0]) {
      setChannels(channelsData.pages[0]);
    }
  }, [channelsData]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, refetch } =
    useInfiniteQuery<ShortsResponse, Error, InfiniteData<ShortsResponse>, [string, string]>({
      queryKey: ['shorts', selectedChannel ?? 'all'],
      queryFn: async ({ pageParam = 1 }) => {
        const page = typeof pageParam === 'number' ? pageParam : Number(pageParam);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '3',
        });
        if (selectedChannel) {
          params.append('channel', selectedChannel);
        }
        const response = await fetch(`/api/shorts?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch shorts');
        return response.json() as Promise<ShortsResponse>;
      },
      getNextPageParam: (lastPage: ShortsResponse) => {
        if (!lastPage.hasMore) return undefined;
        return lastPage.page + 1;
      },
      initialPageParam: 1,
      staleTime: 1000 * 60 * 30, // 30분 동안 캐시 유지
      gcTime: 1000 * 60 * 60 * 24, // 24시간 동안 캐시 보관
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    });

  const handleChannelSelect = useCallback(
    async (channelName: string | null) => {
      setIsLoading(true);
      setSelectedChannel(channelName);
      setShowChannelDropdown(false);
      setActiveIndex(0);
      try {
        // 채널 변경 시 캐시된 데이터가 있으면 즉시 사용하고, 없으면 새로 로드
        const queryKey = ['shorts', channelName ?? 'all'];
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

  // 현재 보이는 영상이 마지막에서 3번째일 때 다음 페이지 미리 로드
  useEffect(() => {
    if (data?.pages && data.pages.length > 0) {
      const totalShorts = data.pages.flatMap((page) => page.data).length;

      // 현재 활성화된 영상이 마지막에서 3번째일 때 다음 페이지 로드
      if (activeIndex >= totalShorts - 3 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }
  }, [activeIndex, data?.pages, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 다음 페이지 프리로드
  useEffect(() => {
    if (data?.pages && data.pages.length > 0 && hasNextPage && !isFetchingNextPage) {
      const nextPage = data.pages.length + 1;
      queryClient.prefetchInfiniteQuery({
        queryKey: ['shorts', selectedChannel ?? 'all'],
        queryFn: async () => {
          const params = new URLSearchParams({
            page: nextPage.toString(),
            limit: '3',
          });
          if (selectedChannel) {
            params.append('channel', selectedChannel);
          }
          const response = await fetch(`/api/shorts?${params.toString()}`);
          if (!response.ok) throw new Error('Failed to fetch shorts');
          return response.json();
        },
        initialPageParam: nextPage,
      });
    }
  }, [data?.pages, hasNextPage, isFetchingNextPage, selectedChannel, queryClient]);

  const handleActivate = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const handleStartInteraction = useCallback(() => {
    setUserInteracted(true);
    setGlobalMuted(false);
  }, []);

  const handleGlobalMuteToggle = useCallback(() => {
    setGlobalMuted((prev) => !prev);
  }, []);

  const shorts = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  if (status === 'pending' || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <p>쇼츠를 불러오는 중 오류가 발생했습니다.</p>
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-black">
      {/* 상단 프로필 버튼과 드롭다운 */}
      <div className="absolute top-4 left-4 z-50">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              setShowChannelDropdown(!showChannelDropdown);
            }}>
            <User className="w-5 h-5 text-white" />
          </Button>

          {/* 채널 드롭다운 */}
          {showChannelDropdown && (
            <div
              className="absolute top-full left-0 mt-2 w-48 rounded-md shadow-lg bg-white/10 backdrop-blur-sm border border-white/20"
              onClick={(e) => e.stopPropagation()}>
              <div className="py-1 max-h-[300px] overflow-y-auto">
                <button
                  className={cn(
                    'w-full px-4 py-2 text-left text-sm text-white hover:bg-white/20',
                    selectedChannel === null && 'bg-white/20'
                  )}
                  onClick={() => handleChannelSelect(null)}>
                  전체 채널
                </button>
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm text-white hover:bg-white/20',
                      selectedChannel === channel.channel_name && 'bg-white/20'
                    )}
                    onClick={() => handleChannelSelect(channel.channel_name)}>
                    {channel.channel_name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 처음 사용자 상호작용 유도 */}
      {!userInteracted && shorts.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-40">
          <div className="text-center text-white p-8">
            <div className="mb-6">
              <Image
                src="/shorts-wak.svg"
                alt="Shorts Wak Logo"
                width={64}
                height={64}
                className="mx-auto mb-4"
                priority
              />
            </div>
            <h2 className="text-2xl font-bold mb-4">Shorts Wak</h2>
            <p className="text-lg text-gray-300 mb-2 font-semibold">
              위아래로 스크롤해서 다음 영상을 시청하세요
            </p>
            <p className="text-sm text-gray-400 mb-2">시작하면 자동으로 소리가 재생됩니다</p>
            <p className="text-xs text-gray-500 mb-8">스크롤하면 다음 영상이 자동으로 로드됩니다</p>
            <Button
              onClick={handleStartInteraction}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-bold">
              시작하기
            </Button>
          </div>
        </div>
      )}

      {/* 쇼츠 목록 */}
      <div className="h-full overflow-y-auto snap-y snap-mandatory">
        {shorts.map((short, index) => (
          <ShortsItem
            key={short.id}
            short={short}
            isActive={index === activeIndex}
            onActivate={() => handleActivate(index)}
            userInteracted={userInteracted}
            globalMuted={globalMuted}
            onGlobalMuteToggle={handleGlobalMuteToggle}
          />
        ))}
      </div>
    </div>
  );
}
