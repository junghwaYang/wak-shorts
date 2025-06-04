import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/context/queryProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Shorts Wak',
  description: '여러 채널의 우왁굳 쇼츠를 한 곳에서 모아보세요',
};

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
