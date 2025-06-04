'use client';

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, ExternalLink, RotateCcw } from 'lucide-react';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { Button } from '@/components/ui/button';

interface Short {
  id: number;
  video_id: string;
  title: string;
  channel_name: string;
  thumbnail_url: string;
  view_count: number;
  published_at: string;
}

interface ShortsItemProps {
  short: Short;
  isActive: boolean;
  onActivate: () => void;
  userInteracted: boolean;
  globalMuted: boolean;
  onGlobalMuteToggle: () => void;
}

export default function ShortsItem({
  short,
  isActive,
  onActivate,
  userInteracted,
  globalMuted,
  onGlobalMuteToggle,
}: ShortsItemProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showControls, setShowControls] = useState(false);
  // const [showPlayButton, setShowPlayButton] = useState(false);

  // 영상 진행률 관련 상태
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showTimeInfo, setShowTimeInfo] = useState(false);

  // 컨트롤 자동 숨김을 위한 타이머 ref
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playButtonTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const timeInfoTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { playerRef, player, isReady } = useYouTubePlayer({
    videoId: short.video_id,

    onReady: (ytPlayer) => {
      // 플레이어 준비 시 전역 음소거 상태 적용
      if (globalMuted) {
        ytPlayer.mute();
      } else {
        ytPlayer.unMute();
      }

      // 영상 길이 정보 가져오기
      try {
        const videoDuration = ytPlayer.getDuration();
        if (videoDuration && videoDuration > 0) {
          setDuration(videoDuration);
        }
      } catch (error) {
        console.warn('Duration fetch error:', error);
      }

      if (isActive && userInteracted) {
        ytPlayer.playVideo();
      }
    },
    onStateChange: (event) => {
      if (event.data === window.YT.PlayerState.PLAYING) {
        setIsPlaying(true);
        setShowError(false);
        updateProgress();
      } else if (event.data === window.YT.PlayerState.PAUSED) {
        setIsPlaying(false);
      } else if (event.data === window.YT.PlayerState.UNSTARTED) {
        setIsPlaying(false);
        setCurrentTime(0);
      } else if (event.data === window.YT.PlayerState.ENDED) {
        setIsPlaying(false);
        setCurrentTime(duration);
      }
    },
  });

  // 영상 진행률 업데이트
  const updateProgress = useCallback(() => {
    if (!player || !isReady || isDragging) return;

    try {
      const current = player.getCurrentTime();
      const total = player.getDuration();

      if (typeof current === 'number' && typeof total === 'number') {
        setCurrentTime(current);
        if (duration === 0 || Math.abs(duration - total) > 0.1) {
          setDuration(total);
        }
      }
    } catch (error: unknown) {
      console.log('Progress update error:', error);
      // 조용히 무시 (플레이어가 준비되지 않았을 수 있음)
    }
  }, [player, isReady, isDragging, duration]);

  // 진행률 자동 업데이트
  useEffect(() => {
    if (isPlaying && !isDragging) {
      progressUpdateRef.current = setInterval(updateProgress, 500);
    } else {
      if (progressUpdateRef.current) {
        clearInterval(progressUpdateRef.current);
      }
    }

    return () => {
      if (progressUpdateRef.current) {
        clearInterval(progressUpdateRef.current);
      }
    };
  }, [isPlaying, isDragging, updateProgress]);

  // 시크 기능
  const handleSeek = useCallback(
    (percentage: number) => {
      if (!player || !isReady || duration === 0) return;

      try {
        const seekTime = (percentage / 100) * duration;
        player.seekTo(seekTime, true);
        setCurrentTime(seekTime);
      } catch (error) {
        console.error('Seek error:', error);
      }
    },
    [player, isReady, duration]
  );

  // 진행 바 클릭 핸들러
  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = (clickX / rect.width) * 100;

      setIsDragging(true);
      setShowTimeInfo(true);

      handleSeek(Math.max(0, Math.min(100, percentage)));

      // 시간 정보 표시
      if (timeInfoTimerRef.current) {
        clearTimeout(timeInfoTimerRef.current);
      }

      timeInfoTimerRef.current = setTimeout(() => {
        setShowTimeInfo(false);
      }, 2000);

      // 드래깅 상태 해제
      setTimeout(() => {
        setIsDragging(false);
      }, 100);
    },
    [handleSeek]
  );

  // 진행 바 호버 핸들러
  const handleProgressHover = useCallback(() => {
    setShowTimeInfo(true);

    if (timeInfoTimerRef.current) {
      clearTimeout(timeInfoTimerRef.current);
    }
  }, []);

  const handleProgressLeave = useCallback(() => {
    if (!isDragging) {
      timeInfoTimerRef.current = setTimeout(() => {
        setShowTimeInfo(false);
      }, 1000);
    }
  }, [isDragging]);

  // 시간 포맷팅
  const formatTime = useCallback((seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // 컨트롤 표시/숨김 관리
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);

    // 기존 타이머 제거
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }

    // 3초 후 컨트롤 숨김
    controlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  // 재생 버튼 잠깐 표시
  // const showPlayButtonTemporarily = useCallback(() => {
  //   setShowPlayButton(true);

  //   // 기존 타이머 제거
  //   if (playButtonTimerRef.current) {
  //     clearTimeout(playButtonTimerRef.current);
  //   }

  //   // 1초 후 버튼 숨김
  //   playButtonTimerRef.current = setTimeout(() => {
  //     setShowPlayButton(false);
  //   }, 1000);
  // }, []);

  // 화면 탭 핸들러
  const handleScreenTap = useCallback(() => {
    if (!userInteracted) return;
    showControlsTemporarily();
  }, [userInteracted, showControlsTemporarily]);

  // 중복 호출 방지를 위한 ref
  const activatedRef = useRef(false);
  const targetRef = useRef<HTMLDivElement>(null);

  // 네이티브 IntersectionObserver 사용
  useEffect(() => {
    const currentTarget = targetRef.current;
    if (!currentTarget) return;

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !activatedRef.current) {
          activatedRef.current = true;
          onActivate();
          // 잠시 후 다시 활성화 가능하도록 설정
          setTimeout(() => {
            activatedRef.current = false;
          }, 1000);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.7,
      rootMargin: '0px',
    });

    observer.observe(currentTarget);

    return () => {
      observer.unobserve(currentTarget);
      observer.disconnect();
    };
  }, [onActivate]);

  // 활성화 상태 변경 시 재생/정지 처리
  useEffect(() => {
    if (!player || !isReady) return;

    const timer = setTimeout(() => {
      try {
        if (isActive && userInteracted) {
          player.playVideo();
        } else {
          player.pauseVideo();
        }
      } catch (error) {
        console.error('Player control error:', error);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isActive, userInteracted, player, isReady]);

  // 전역 음소거 상태 변경 시 처리
  useEffect(() => {
    if (!player || !isReady) return;

    try {
      if (globalMuted) {
        player.mute();
      } else {
        player.unMute();
      }
    } catch (error) {
      console.error('Mute control error:', error);
    }
  }, [globalMuted, player, isReady]);

  const handlePlayPause = useCallback(() => {
    if (!player) return;

    try {
      if (isPlaying) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
      // 재생/정지 시 버튼 잠깐 표시
      // showPlayButtonTemporarily();
    } catch (error) {
      console.error('재생 오류:', error);
      setShowError(true);
    }
  }, [player, isPlaying]);

  const handleRestart = useCallback(() => {
    if (!player) return;

    try {
      player.seekTo(0, true);
      player.playVideo();
      // showPlayButtonTemporarily();
    } catch (error) {
      console.error('재시작 오류:', error);
    }
  }, [player]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
      if (playButtonTimerRef.current) {
        clearTimeout(playButtonTimerRef.current);
      }
      if (progressUpdateRef.current) {
        clearInterval(progressUpdateRef.current);
      }
      if (timeInfoTimerRef.current) {
        clearTimeout(timeInfoTimerRef.current);
      }
    };
  }, []);

  const formatViewCount = useCallback((count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  }, []);

  const getTimeAgo = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return `${diffInHours}시간 전`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}일 전`;
    }
  }, []);

  return (
    <div
      ref={targetRef}
      className="relative w-full h-screen snap-start flex-shrink-0 bg-black overflow-hidden"
      onClick={handleScreenTap}>
      {/* YouTube Player Container */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center">
        <div className="w-full h-full max-w-sm mx-auto bg-black">
          <div ref={playerRef} className="w-full h-full" />
        </div>
      </div>

      {/* 에러 상태 표시 */}
      {showError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-center text-white p-6 max-w-sm">
            <div className="mb-6 text-4xl">⚠️</div>
            <p className="mb-6 text-lg">재생할 수 없는 영상입니다</p>
            <Button
              onClick={() => window.open(`https://youtube.com/watch?v=${short.video_id}`, '_blank')}
              variant="outline"
              size="lg"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20">
              YouTube에서 보기
            </Button>
          </div>
        </div>
      )}

      {/* 오버레이 컨트롤 */}
      <div
        className={`absolute inset-0 flex flex-col justify-between p-4 transition-opacity duration-300 z-10 ${
          showControls
            ? 'bg-gradient-to-t from-black/70 via-transparent to-black/50'
            : 'bg-transparent'
        }`}>
        {/* 상단 정보 */}
        <div
          className={`flex justify-between items-start pt-safe transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}>
          <div className="text-white flex-1">
            <h3 className="font-bold text-base">{short.channel_name}</h3>
            <p className="text-sm text-white/90 mt-1">{getTimeAgo(short.published_at)}</p>
          </div>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              window.open(`https://youtube.com/watch?v=${short.video_id}`, '_blank');
            }}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 ml-2">
            <ExternalLink size={24} />
          </Button>
        </div>

        {/* 중앙 재생 컨트롤 (조건부 표시) */}
        {/* {(showPlayButton || !isPlaying) && (
          <div className="flex justify-center items-center flex-1 pointer-events-none">
            <div
              className={`transition-all duration-300 ${
                showPlayButton || !isPlaying ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayPause();
                }}
                variant="ghost"
                size="icon"
                className="bg-black/60 hover:bg-black/80 text-white rounded-full w-20 h-20 transition-all duration-200 pointer-events-auto">
                {isPlaying ? <Pause size={40} /> : <Play size={40} />}
              </Button>
            </div>
          </div>
        )} */}

        {/* 하단 정보 및 컨트롤 */}
        <div className="space-y-3 pb-5">
          {' '}
          {/* pb-16으로 진행 바 공간 확보 */}
          {/* 영상 정보 - 조건부 표시 */}
          <div
            className={`text-white transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}>
            <p className="text-base font-medium line-clamp-3 leading-relaxed">{short.title}</p>
            <p className="text-sm text-white/90 mt-2">
              조회수 {formatViewCount(short.view_count)}회
            </p>
          </div>
          {/* 컨트롤 버튼들 */}
          <div className="flex justify-between items-center">
            {/* 항상 보이는 기본 컨트롤 */}
            <div className="flex space-x-3">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayPause();
                }}
                variant="ghost"
                size="icon"
                className="bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 transition-all duration-200">
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </Button>

              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onGlobalMuteToggle();
                }}
                variant="ghost"
                size="icon"
                className="bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 transition-all duration-200">
                {globalMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </Button>
            </div>

            {/* 추가 컨트롤 - 조건부 표시 */}
            <div
              className={`flex space-x-3 transition-all duration-300 ${
                showControls ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
              }`}>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRestart();
                }}
                variant="ghost"
                size="icon"
                className="bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 transition-all duration-200">
                <RotateCcw size={20} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 유튜브 쇼츠 스타일 진행 바 - 맨 하단 고정 */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        {/* 시간 정보 - 진행 바 위에 표시 */}
        {showTimeInfo && (
          <div className="transition-all duration-300 opacity-100 translate-y-0">
            <div className="flex justify-between text-xs text-white bg-black/80 px-4 py-2 mx-4 rounded-t-lg backdrop-blur-sm">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}

        {/* 진행 바 컨테이너 */}
        <div
          className="relative h-1 bg-black/40 cursor-pointer group"
          onClick={handleProgressClick}
          onMouseEnter={handleProgressHover}
          onMouseLeave={handleProgressLeave}>
          {/* 전체 진행률 배경 */}
          <div className="absolute inset-0 bg-white/30" />

          {/* 현재 진행률 */}
          <div
            className="absolute left-0 top-0 h-full bg-white transition-all duration-200"
            style={{
              width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
            }}
          />

          {/* 진행률 끝 원형 핸들 (항상 표시) */}
          <div
            className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full transition-all duration-200"
            style={{
              left: duration > 0 ? `calc(${(currentTime / duration) * 100}% - 6px)` : '-6px',
              transform: showTimeInfo ? 'translateY(-50%) scale(1.3)' : 'translateY(-50%) scale(1)',
            }}
          />
        </div>
      </div>

      {/* 로딩 인디케이터 */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-sm">영상 로딩 중...</p>
          </div>
        </div>
      )}
    </div>
  );
}
