'use client';

import { useEffect } from 'react';

interface YTPlayer {
  Player: new (
    elementId: string | HTMLElement,
    options: {
      videoId?: string;
      playerVars?: {
        autoplay?: 0 | 1;
        controls?: 0 | 1;
        modestbranding?: 0 | 1;
        rel?: 0 | 1;
        showinfo?: 0 | 1;
        [key: string]: string | number | boolean | undefined;
      };
      events?: {
        onReady?: (event: { target: YTPlayer }) => void;
        onStateChange?: (event: { target: YTPlayer; data: number }) => void;
        onError?: (event: { target: YTPlayer; data: number }) => void;
      };
    }
  ) => YTPlayer;
  PlayerState: {
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
    UNSTARTED: number;
  };
  ready: (callback: () => void) => void;
}

declare global {
  interface Window {
    YT: YTPlayer;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function YouTubeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // YouTube IFrame API 로드
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  return <>{children}</>;
}
