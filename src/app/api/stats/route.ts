import { getShortsStats } from '@/lib/database';

export async function GET() {
  try {
    const stats = await getShortsStats();
    return Response.json(stats);
  } catch (error) {
    console.error('통계 조회 오류:', error);
    return Response.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
