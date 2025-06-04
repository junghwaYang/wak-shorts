// app/api/cron/fetch-shorts/route.ts
import { NextRequest } from 'next/server';
import { fetchChannelShorts } from '@/lib/youtube';
import { saveShorts, getActiveChannels } from '@/lib/database';

interface ChannelResult {
  channel: string;
  collected?: number;
  titles?: string[];
  message?: string;
  error?: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  results: ChannelResult[];
  timestamp: string;
}

export async function GET(request: NextRequest) {
  // Vercel Cron 인증
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  console.log('Auth Header:', authHeader); // 디버깅용
  console.log('Expected Auth:', expectedAuth); // 디버깅용

  if (!process.env.CRON_SECRET) {
    return Response.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  if (authHeader !== expectedAuth) {
    return Response.json(
      {
        error: 'Unauthorized',
        received: authHeader,
        expected: expectedAuth,
      },
      { status: 401 }
    );
  }

  try {
    console.log('🚀 쇼츠 수집 크론 작업 시작...');

    const channels = await getActiveChannels();
    console.log(`📺 활성 채널 수: ${channels.length}개`);
    console.log(
      '채널 목록:',
      channels.map((c) => `${c.channel_name} (${c.channel_id})`)
    );

    let totalCollected = 0;
    const results: ChannelResult[] = [];

    for (const channel of channels) {
      console.log(`\n🔄 채널 처리 중: ${channel.channel_name}`);

      try {
        const shorts = await fetchChannelShorts(channel.channel_id);

        if (shorts.length > 0) {
          console.log(`💾 ${shorts.length}개 쇼츠 저장 중...`);
          await saveShorts(shorts);
          totalCollected += shorts.length;

          results.push({
            channel: channel.channel_name,
            collected: shorts.length,
            titles: shorts.map((s) => s.title).slice(0, 3), // 처음 3개 제목만
          });
        } else {
          console.log(`⚠️ 새로운 쇼츠 없음`);
          results.push({
            channel: channel.channel_name,
            collected: 0,
            message: '새로운 쇼츠 없음',
          });
        }

        // API 레이트 리미트 방지
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ ${channel.channel_name} 처리 오류:`, error);
        results.push({
          channel: channel.channel_name,
          error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        });
      }
    }

    console.log(`\n🎉 수집 완료: 총 ${totalCollected}개 쇼츠`);

    const response: ApiResponse = {
      success: true,
      message: `총 ${totalCollected}개의 쇼츠가 수집되었습니다.`,
      results,
      timestamp: new Date().toISOString(),
    };

    return Response.json(response);
  } catch (error) {
    console.error('크론 작업 오류:', error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
