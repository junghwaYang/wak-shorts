'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Play } from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import ShortsItem from './ShortsItem';
import { Button } from '@/components/ui/button';

// interface Short {
//   id: number;
//   video_id: string;
//   title: string;
//   channel_name: string;
//   thumbnail_url: string;
//   view_count: number;
//   published_at: string;
// }

// API 함수
const fetchShortsPage = async ({ pageParam }: { pageParam: number }) => {
  const response = await fetch(`/api/shorts?page=${pageParam}&limit=3`);

  if (!response.ok) {
    throw new Error('쇼츠를 불러오는데 실패했습니다.');
  }

  return response.json();
};

export default function ShortsViewer() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);
  const [globalMuted, setGlobalMuted] = useState(true); // 전역 음소거 상태
  // const observerRef = useRef<IntersectionObserver | null>(null);

  // React Query를 사용한 무한 쿼리
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['shorts'],
    queryFn: fetchShortsPage,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000, // 5분간 fresh
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
  });

  // 모든 쇼츠 데이터를 평탄화
  const shorts = data?.pages.flatMap((page) => page.data) ?? [];

  // YouTube API 로드
  useEffect(() => {
    const loadYouTubeAPI = () => {
      if (window.YT) return Promise.resolve();

      return new Promise<void>((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        document.body.appendChild(script);

        window.onYouTubeIframeAPIReady = () => {
          resolve();
        };
      });
    };

    loadYouTubeAPI();
  }, []);

  // 무한 스크롤 처리
  useEffect(() => {
    // 현재 보고 있는 영상이 마지막에서 2번째가 되면 다음 페이지 로드
    if (
      currentIndex >= shorts.length - 2 &&
      hasNextPage &&
      !isFetchingNextPage &&
      shorts.length > 0
    ) {
      fetchNextPage();
    }
  }, [currentIndex, shorts.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleActivate = useCallback(
    (index: number) => {
      if (index !== currentIndex) {
        setCurrentIndex(index);
      }
    },
    [currentIndex]
  );

  // 사용자 상호작용 시작 (음소거 해제 포함)
  const handleStartInteraction = () => {
    setUserInteracted(true);
    setGlobalMuted(false); // 시작하기 버튼 클릭 시 자동으로 음소거 해제
  };

  // 전역 음소거 토글
  const handleGlobalMuteToggle = () => {
    setGlobalMuted(!globalMuted);
  };

  // 재시도 함수
  const handleRetry = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>첫 번째 쇼츠 준비 중...</p>
          <p className="text-sm text-gray-400 mt-2">빠른 시작을 위해 최소한만 로드합니다</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center p-6">
          <p className="text-red-400 mb-4">
            {error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}
          </p>
          <Button onClick={handleRetry} variant="outline">
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  if (shorts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center p-6">
          <p className="mb-4">사용할 수 있는 쇼츠가 없습니다.</p>
          <Button onClick={handleRetry} variant="outline">
            새로고침
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* 스크롤 컨테이너 */}
      <div className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide">
        {shorts.map((short, index) => (
          <ShortsItem
            key={`${short.id}-${short.video_id}`}
            short={short}
            isActive={index === currentIndex}
            onActivate={() => handleActivate(index)}
            userInteracted={userInteracted}
            globalMuted={globalMuted}
            onGlobalMuteToggle={handleGlobalMuteToggle}
          />
        ))}

        {/* 무한 스크롤 로딩 */}
        {isFetchingNextPage && (
          <div className="h-screen flex items-center justify-center bg-black text-white snap-start">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>다음 쇼츠 로딩 중...</p>
              <p className="text-sm text-gray-400 mt-2">{shorts.length}개 로드됨</p>
            </div>
          </div>
        )}
      </div>

      {/* 처음 사용자 상호작용 유도 */}
      {!userInteracted && shorts.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-40">
          <div className="text-center text-white p-8">
            <div className="mb-6">
              <Play size={64} className="mx-auto mb-4 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold mb-4">YouTube Shorts</h2>
            <p className="text-lg text-gray-300 mb-2">위아래로 스크롤해서 다음 영상을 시청하세요</p>
            <p className="text-sm text-gray-400 mb-2">시작하면 자동으로 소리가 재생됩니다</p>
            <p className="text-xs text-gray-500 mb-8">스크롤하면 다음 영상이 자동으로 로드됩니다</p>
            <Button
              onClick={handleStartInteraction}
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg">
              시작하기
            </Button>
          </div>
        </div>
      )}

      {/* 스크롤 힌트 */}
      {/* {userInteracted && shorts.length > 1 && currentIndex === 0 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white/60 z-30 animate-bounce">
          <div className="flex flex-col items-center">
            <div className="w-1 h-8 bg-white/40 rounded-full mb-2"></div>
            <p className="text-sm">위로 스크롤</p>
          </div>
        </div>
      )} */}

      {/* 진행 상황 표시 */}
      {/* {userInteracted && shorts.length > 0 && (
        <div className="absolute top-4 right-4 bg-black/60 text-white rounded-full px-3 py-1 text-sm z-40 backdrop-blur-sm">
          {currentIndex + 1} / {shorts.length}
          {hasNextPage ? '+' : ''}
        </div>
      )} */}
    </div>
  );
}
