'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

type CronResponse = {
  status?: number;
  data?: {
    error?: string;
    responseText?: string;
    parseError?: string;
    success?: boolean;
    message?: string;
    result?: Record<string, unknown>;
    results?: Record<string, unknown>[];
    [key: string]: unknown;
  };
  error?: string;
  message?: string;
  environment?: {
    CRON_SECRET: string;
    NODE_ENV: string;
  };
};

interface Channel {
  id: number;
  channel_id: string;
  channel_name: string;
  is_active: boolean;
}

/**
 * 크론 작업 테스트 페이지
 *
 * @description 전체 크론 작업과 채널별 크론 작업을 테스트할 수 있는 페이지
 * - 전체 채널 쇼츠 수집
 * - 특정 채널 쇼츠 수집
 * - 환경 변수 확인
 * - 실시간 결과 표시
 */
export default function TestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CronResponse | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [targetCount, setTargetCount] = useState<string>('100');
  const [channelsLoading, setChannelsLoading] = useState(false);

  /**
   * 활성화된 채널 목록을 가져오는 함수
   */
  const fetchChannels = async () => {
    setChannelsLoading(true);
    try {
      const response = await fetch('/api/channels');
      if (response.ok) {
        const channelData = await response.json();
        setChannels(channelData);
      } else {
        console.error('채널 목록 가져오기 실패:', response.status);
      }
    } catch (error) {
      console.error('채널 목록 가져오기 오류:', error);
    } finally {
      setChannelsLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  /**
   * 전체 채널 크론 작업 테스트
   */
  const testAllChannelsCron = async () => {
    setLoading(true);
    try {
      const cronSecret = process.env.NEXT_PUBLIC_CRON_SECRET || 'your_cron_secret_here';

      const response = await fetch('/api/cron/fetch-shorts', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${cronSecret}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError: unknown) {
        data = {
          error: 'JSON Parse Error',
          responseText,
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
        };
      }

      setResult({
        status: response.status,
        data,
      });
    } catch (error: unknown) {
      setResult({
        error: 'Fetch Error',
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * 특정 채널 크론 작업 테스트
   */
  const testSingleChannelCron = async () => {
    if (!selectedChannel) {
      alert('채널을 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      const cronSecret = process.env.NEXT_PUBLIC_CRON_SECRET || 'your_cron_secret_here';
      const selectedChannelData = channels.find((c) => c.channel_id === selectedChannel);

      const url = new URL('/api/cron/fetch-shorts-by-channel', window.location.origin);
      url.searchParams.append('channelId', selectedChannel);
      url.searchParams.append('targetCount', targetCount);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${cronSecret}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError: unknown) {
        data = {
          error: 'JSON Parse Error',
          responseText,
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
        };
      }

      setResult({
        status: response.status,
        data: {
          ...data,
          selectedChannel: selectedChannelData?.channel_name || selectedChannel,
          targetCount: parseInt(targetCount),
        },
      });
    } catch (error: unknown) {
      setResult({
        error: 'Fetch Error',
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * 환경 변수 확인
   */
  const checkEnvironment = () => {
    setResult({
      environment: {
        CRON_SECRET: process.env.NEXT_PUBLIC_CRON_SECRET ? '설정됨' : '미설정',
        NODE_ENV: process.env.NODE_ENV,
      },
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">크론 작업 디버깅 도구</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 전체 채널 크론 작업 */}
        <div className="space-y-4 p-6 border rounded-lg">
          <h2 className="text-xl font-semibold">전체 채널 크론 작업</h2>
          <p className="text-sm text-gray-600">모든 활성화된 채널에서 쇼츠를 수집합니다.</p>

          <div className="space-y-2">
            <Button onClick={testAllChannelsCron} disabled={loading} className="w-full">
              {loading ? '실행 중...' : '전체 채널 크론 실행'}
            </Button>
          </div>
        </div>

        {/* 단일 채널 크론 작업 */}
        <div className="space-y-4 p-6 border rounded-lg">
          <h2 className="text-xl font-semibold">단일 채널 크론 작업</h2>
          <p className="text-sm text-gray-600">특정 채널에서만 쇼츠를 수집합니다.</p>

          <div className="space-y-3">
            <div>
              <label htmlFor="channel-select" className="text-sm font-medium leading-none">
                채널 선택
              </label>
              <select
                id="channel-select"
                value={selectedChannel}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setSelectedChannel(e.target.value)
                }
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2">
                <option value="">채널을 선택하세요</option>
                {channelsLoading ? (
                  <option value="" disabled>
                    로딩 중...
                  </option>
                ) : channels.length === 0 ? (
                  <option value="" disabled>
                    채널이 없습니다
                  </option>
                ) : (
                  channels.map((channel) => (
                    <option key={channel.id} value={channel.channel_id}>
                      {channel.channel_name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label htmlFor="target-count" className="text-sm font-medium leading-none">
                목표 수집량
              </label>
              <input
                id="target-count"
                type="number"
                value={targetCount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTargetCount(e.target.value)
                }
                placeholder="100"
                min="1"
                max="500"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">수집할 쇼츠 개수 (1-500개)</p>
            </div>

            <Button
              onClick={testSingleChannelCron}
              disabled={loading || !selectedChannel}
              className="w-full">
              {loading ? '실행 중...' : '선택된 채널 크론 실행'}
            </Button>
          </div>
        </div>
      </div>

      <div className="my-8 h-px bg-border"></div>

      {/* 유틸리티 버튼들 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">유틸리티</h2>
        <div className="flex gap-4">
          <Button onClick={checkEnvironment} variant="outline">
            환경변수 확인
          </Button>
          <Button onClick={fetchChannels} variant="outline" disabled={channelsLoading}>
            {channelsLoading ? '로딩 중...' : '채널 목록 새로고침'}
          </Button>
          <Button onClick={() => setResult(null)} variant="outline">
            결과 초기화
          </Button>
        </div>
      </div>

      {/* 결과 표시 */}
      {result && (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">실행 결과</h3>
            <span
              className={`px-2 py-1 rounded text-sm ${
                result.status === 200 || result.data?.success
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
              {result.status === 200 || result.data?.success ? '성공' : '실패'}
            </span>
          </div>

          <div className="bg-white rounded border p-4">
            <pre className="text-sm overflow-auto max-h-96 whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* 채널 목록 표시 */}
      {channels.length > 0 && (
        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">활성화된 채널 목록</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {channels.map((channel) => (
              <div key={channel.id} className="p-2 bg-white rounded border text-sm">
                <div className="font-medium">{channel.channel_name}</div>
                <div className="text-gray-500 text-xs">ID: {channel.channel_id}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
