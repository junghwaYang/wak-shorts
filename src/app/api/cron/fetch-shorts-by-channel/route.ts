// app/api/cron/fetch-shorts-by-channel/route.ts
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
  result: ChannelResult;
  timestamp: string;
}

/**
 * 특정 채널의 쇼츠를 수집하는 API 엔드포인트
 *
 * @description 단일 채널에 대해서만 쇼츠 수집을 실행
 * @param request - 채널 ID 또는 채널명을 쿼리 파라미터로 받음
 * @returns 수집 결과
 */
export async function GET(request: NextRequest) {
  // Vercel Cron 인증
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  console.log('Auth Header:', authHeader);
  console.log('Expected Auth:', expectedAuth);

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
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');
    const channelName = searchParams.get('channelName');
    const targetCount = parseInt(searchParams.get('targetCount') || '100');

    if (!channelId && !channelName) {
      return Response.json(
        { error: 'channelId 또는 channelName 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log(`🚀 단일 채널 쇼츠 수집 시작...`);
    console.log(`📺 대상: ${channelName || channelId}`);
    console.log(`🎯 목표 수집량: ${targetCount}개`);

    // 활성 채널 목록에서 대상 채널 찾기
    const channels = await getActiveChannels();
    let targetChannel;

    if (channelId) {
      targetChannel = channels.find((c) => c.channel_id === channelId);
    } else if (channelName) {
      targetChannel = channels.find((c) => c.channel_name === channelName);
    }

    if (!targetChannel) {
      return Response.json(
        {
          error: `채널을 찾을 수 없습니다: ${channelName || channelId}`,
          availableChannels: channels.map((c) => ({
            name: c.channel_name,
            id: c.channel_id,
          })),
        },
        { status: 404 }
      );
    }

    console.log(`✅ 채널 발견: ${targetChannel.channel_name} (${targetChannel.channel_id})`);

    let result: ChannelResult;

    try {
      const shorts = await fetchChannelShorts(targetChannel.channel_id, targetCount);

      if (shorts.length > 0) {
        console.log(`💾 ${shorts.length}개 쇼츠 저장 중...`);
        await saveShorts(shorts);

        result = {
          channel: targetChannel.channel_name,
          collected: shorts.length,
          titles: shorts.map((s) => s.title).slice(0, 5), // 처음 5개 제목
        };

        console.log(`✅ ${targetChannel.channel_name}: ${shorts.length}개 쇼츠 수집 완료`);
      } else {
        console.log(`⚠️ 새로운 쇼츠 없음`);
        result = {
          channel: targetChannel.channel_name,
          collected: 0,
          message: '새로운 쇼츠가 없습니다.',
        };
      }
    } catch (error) {
      console.error(`❌ ${targetChannel.channel_name} 처리 오류:`, error);
      result = {
        channel: targetChannel.channel_name,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      };
    }

    const response: ApiResponse = {
      success: !result.error,
      message: result.error
        ? `${targetChannel.channel_name} 수집 중 오류가 발생했습니다.`
        : `${targetChannel.channel_name}에서 ${result.collected || 0}개의 쇼츠가 수집되었습니다.`,
      result,
      timestamp: new Date().toISOString(),
    };

    return Response.json(response);
  } catch (error) {
    console.error('채널별 크론 작업 오류:', error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
