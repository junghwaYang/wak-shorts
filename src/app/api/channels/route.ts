import { getActiveChannels } from '@/lib/database';

export async function GET() {
  try {
    const channels = await getActiveChannels();
    return Response.json(channels);
  } catch (error) {
    console.error('채널 목록 조회 오류:', error);
    return Response.json({ error: 'Failed to fetch channels' }, { status: 500 });
  }
}
