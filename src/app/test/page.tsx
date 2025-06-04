'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

type CronResponse = {
  status?: number;
  data?: {
    error?: string;
    responseText?: string;
    parseError?: string;
    [key: string]: unknown;
  };
  error?: string;
  message?: string;
  environment?: {
    CRON_SECRET: string;
    NODE_ENV: string;
  };
};

export default function TestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CronResponse | null>(null);

  const testCronJob = async () => {
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

      // 응답 상태 확인
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // 응답을 텍스트로 먼저 받아보기
      const responseText = await response.text();
      console.log('Response text:', responseText);

      // JSON 파싱 시도
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

  const checkEnvironment = () => {
    setResult({
      environment: {
        CRON_SECRET: process.env.NEXT_PUBLIC_CRON_SECRET ? '설정됨' : '미설정',
        NODE_ENV: process.env.NODE_ENV,
      },
    });
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">크론 작업 디버깅</h1>

      <div className="space-y-4">
        <Button onClick={checkEnvironment} variant="outline">
          환경변수 확인
        </Button>

        <Button onClick={testCronJob} disabled={loading}>
          {loading ? '실행 중...' : '크론 작업 테스트'}
        </Button>
      </div>

      {result && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">결과:</h3>
          <pre className="text-sm overflow-auto max-h-96">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
