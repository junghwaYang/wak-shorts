import { NextRequest } from 'next/server';
import { getShorts } from '@/lib/database';
import { Short } from '@/lib/youtube';

interface ShortsResponse {
  data: Short[];
  page: number;
  limit: number;
  hasMore: boolean;
}

interface CacheEntry {
  data: ShortsResponse;
  timestamp: number;
}

// 간단한 메모리 캐시
const cache: { [key: string]: CacheEntry } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5분

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const cacheKey = `shorts_${page}_${limit}`;

    // 캐시 확인
    const cached = cache[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return Response.json(cached.data);
    }

    const offset = (page - 1) * limit;
    const shorts = await getShorts(limit, offset);

    const result: ShortsResponse = {
      data: shorts,
      page,
      limit,
      hasMore: shorts.length === limit,
    };

    // 캐시 저장
    cache[cacheKey] = { data: result, timestamp: Date.now() };

    return Response.json(result);
  } catch (error) {
    console.error('쇼츠 조회 오류:', error);
    return Response.json({ error: 'Failed to fetch shorts' }, { status: 500 });
  }
}
