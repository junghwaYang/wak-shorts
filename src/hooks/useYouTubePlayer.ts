import { useEffect, useRef, useState } from 'react';

type YouTubePlayerEvent = {
  target: YT.Player;
  data?: number;
};

interface UseYouTubePlayerProps {
  videoId: string;
  onReady?: (player: YT.Player) => void;
  onStateChange?: (event: YouTubePlayerEvent) => void;
}

export function useYouTubePlayer({ videoId, onReady, onStateChange }: UseYouTubePlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<YT.Player | null>(null);
  const [isReady, setIsReady] = useState(false);

  // 콜백 ref로 변경하여 리렌더링 방지
  const onReadyRef = useRef(onReady);
  const onStateChangeRef = useRef(onStateChange);

  // 최신 콜백 유지
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    if (!playerRef.current || !window.YT) return;

    let ytPlayer: YT.Player;

    try {
      ytPlayer = new window.YT.Player(playerRef.current, {
        height: '100%',
        width: '100%',
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          showinfo: 0,
          mute: 1,
          loop: 1,
          playlist: videoId,
          cc_load_policy: 0,
          enablejsapi: 1,
        },
        events: {
          onReady: (event: { target: YT.Player }) => {
            setIsReady(true);
            onReadyRef.current?.(event.target);
          },
          onStateChange: (event: { target: YT.Player; data: number }) => {
            onStateChangeRef.current?.(event);
          },
        },
      });

      setPlayer(ytPlayer);
    } catch (error) {
      console.error('YouTube Player 생성 오류:', error);
    }

    return () => {
      if (ytPlayer && typeof ytPlayer.destroy === 'function') {
        try {
          ytPlayer.destroy();
        } catch (error) {
          console.error('YouTube Player 정리 오류:', error);
        }
      }
    };
  }, [videoId]);
  return { playerRef, player, isReady };
}
