'use client';

import React, { useCallback, useState, useRef, useEffect, memo } from 'react';
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

const ShortsItem = memo(function ShortsItem({
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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showTimeInfo, setShowTimeInfo] = useState(false);

  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playButtonTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const timeInfoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playerInitializedRef = useRef(false);

  const { playerRef, player, isReady } = useYouTubePlayer({
    videoId: short.video_id,
    onReady: (ytPlayer) => {
      if (!playerInitializedRef.current) {
        playerInitializedRef.current = true;
        if (globalMuted) {
          ytPlayer.mute();
        } else {
          ytPlayer.unMute();
        }

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
    }
  }, [player, isReady, isDragging, duration]);

  useEffect(() => {
    if (isPlaying && !isDragging) {
      progressUpdateRef.current = setInterval(updateProgress, 1000); // 500ms에서 1000ms로 변경
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

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = (clickX / rect.width) * 100;

      setIsDragging(true);
      setShowTimeInfo(true);

      handleSeek(Math.max(0, Math.min(100, percentage)));

      if (timeInfoTimerRef.current) {
        clearTimeout(timeInfoTimerRef.current);
      }

      timeInfoTimerRef.current = setTimeout(() => {
        setShowTimeInfo(false);
      }, 2000);

      setTimeout(() => {
        setIsDragging(false);
      }, 100);
    },
    [handleSeek]
  );

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

  const formatTime = useCallback((seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);

    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }

    controlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  const handleScreenTap = useCallback(() => {
    if (!userInteracted) return;
    showControlsTemporarily();
  }, [userInteracted, showControlsTemporarily]);

  const activatedRef = useRef(false);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentTarget = targetRef.current;
    if (!currentTarget) return;

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !activatedRef.current) {
          activatedRef.current = true;
          onActivate();
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
    } catch (error) {
      console.error('재시작 오류:', error);
    }
  }, [player]);

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
      <div className="absolute inset-0 w-full h-full flex items-center justify-center">
        <div className="w-full h-full max-w-sm mx-auto bg-black">
          <div ref={playerRef} className="w-full h-full" />
        </div>
      </div>

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

      <div
        className={`absolute inset-0 flex flex-col justify-between p-4 transition-opacity duration-300 z-10 ${
          showControls
            ? 'bg-gradient-to-t from-black/70 via-transparent to-black/50'
            : 'bg-transparent'
        }`}>
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

        <div className="space-y-3 pb-5">
          <div
            className={`text-white transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}>
            <p className="text-base font-medium line-clamp-3 leading-relaxed">{short.title}</p>
            <p className="text-sm text-white/90 mt-2">
              조회수 {formatViewCount(short.view_count)}회
            </p>
          </div>
          <div className="flex justify-between items-center">
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

      <div className="absolute bottom-0 left-0 right-0 z-20">
        {showTimeInfo && (
          <div className="transition-all duration-300 opacity-100 translate-y-0">
            <div className="flex justify-between text-xs text-white bg-black/80 px-4 py-2 mx-4 rounded-t-lg backdrop-blur-sm">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}

        <div
          className="relative h-1 bg-black/40 cursor-pointer group"
          onClick={handleProgressClick}
          onMouseEnter={handleProgressHover}
          onMouseLeave={handleProgressLeave}>
          <div className="absolute inset-0 bg-white/30" />

          <div
            className="absolute left-0 top-0 h-full bg-white transition-all duration-200"
            style={{
              width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
            }}
          />

          <div
            className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full transition-all duration-200"
            style={{
              left: duration > 0 ? `calc(${(currentTime / duration) * 100}% - 6px)` : '-6px',
              transform: showTimeInfo ? 'translateY(-50%) scale(1.3)' : 'translateY(-50%) scale(1)',
            }}
          />
        </div>
      </div>

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
});

export default ShortsItem;
