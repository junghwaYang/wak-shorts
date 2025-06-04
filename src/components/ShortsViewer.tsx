'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import ShortsItem from './ShortsItem';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useShorts } from '@/hooks/useShorts';
import { useChannels } from '@/hooks/useChannels';
import { PAGINATION } from '@/constants';

/**
 * 메인 쇼츠 뷰어 컴포넌트
 *
 * @description YouTube Shorts 스타일의 세로형 비디오 뷰어
 * - 무한 스크롤을 통한 연속 재생
 * - 채널별 필터링 기능
 * - 자동 미리로딩으로 끊김 없는 재생
 * - 사용자 상호작용 기반 음소거/재생 제어
 *
 * @returns {JSX.Element} 쇼츠 뷰어 컴포넌트
 *
 * @example
 * ```tsx
 * <ShortsViewer />
 * ```
 */
export default function ShortsViewer() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  const [globalMuted, setGlobalMuted] = useState(true);

  const { channels } = useChannels();
  const {
    shorts,
    isLoading,
    status,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    handleChannelChange,
    prefetchNextPage,
  } = useShorts({ selectedChannel });

  /**
   * 채널 선택 처리 함수
   *
   * @description 채널을 변경하고 관련 상태를 리셋
   * @param channelName - 선택된 채널명 (null인 경우 전체 채널)
   */
  const handleChannelSelect = useCallback(
    async (channelName: string | null) => {
      setSelectedChannel(channelName);
      setShowChannelDropdown(false);
      setActiveIndex(0);
      await handleChannelChange(channelName);
    },
    [handleChannelChange]
  );

  // 현재 보이는 영상이 마지막에서 3번째일 때 다음 페이지 미리 로드
  useEffect(() => {
    if (shorts.length > 0) {
      if (
        activeIndex >= shorts.length - PAGINATION.PRELOAD_THRESHOLD &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    }
  }, [activeIndex, shorts.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 다음 페이지 프리로드
  useEffect(() => {
    prefetchNextPage();
  }, [prefetchNextPage]);

  /**
   * 현재 활성 비디오 인덱스 설정
   *
   * @param index - 활성화할 비디오 인덱스
   */
  const handleActivate = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  /**
   * 사용자 상호작용 시작 처리
   *
   * @description 첫 상호작용 시 자동재생과 음소거 해제
   */
  const handleStartInteraction = useCallback(() => {
    setUserInteracted(true);
    setGlobalMuted(false);
  }, []);

  /**
   * 전역 음소거 토글
   */
  const handleGlobalMuteToggle = useCallback(() => {
    setGlobalMuted((prev) => !prev);
  }, []);

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
            <Image
              src="/shorts-wak.svg"
              alt="Shorts Wak Logo"
              width={24}
              height={24}
              className="w-5 h-5 text-white"
            />
          </Button>

          {/* 채널 드롭다운 */}
          {showChannelDropdown && (
            <div
              className="absolute top-full left-0 mt-2 w-48 rounded-md shadow-lg bg-white/10 backdrop-blur-sm border border-white/20"
              onClick={(e) => e.stopPropagation()}>
              <div className="py-1">
                <button
                  className={cn(
                    'block w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10',
                    selectedChannel === null && 'bg-white/20'
                  )}
                  onClick={() => handleChannelSelect(null)}>
                  전체
                </button>
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    className={cn(
                      'block w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10',
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

      {/* 쇼츠 목록 */}
      <div className="h-full snap-y snap-mandatory overflow-y-scroll scrollbar-hide">
        {shorts.map((short, index) => (
          <ShortsItem
            key={`${short.id}-${index}`}
            short={short}
            isActive={index === activeIndex}
            onActivate={() => handleActivate(index)}
            userInteracted={userInteracted}
            globalMuted={globalMuted}
            onGlobalMuteToggle={handleGlobalMuteToggle}
          />
        ))}
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
              위아래로 스크롤해서 <br />
              다음 영상을 시청하세요
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

      {/* 배경 클릭으로 드롭다운 닫기 */}
      {showChannelDropdown && (
        <div className="fixed inset-0 z-30" onClick={() => setShowChannelDropdown(false)} />
      )}
    </div>
  );
}
