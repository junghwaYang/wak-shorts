// lib/youtube.ts 수정

interface YouTubeSearchResponse {
  items: Array<{
    id: {
      videoId: string;
    };
    snippet: {
      title: string;
      channelId: string;
      channelTitle: string;
      thumbnails: {
        maxres?: { url: string };
        high?: { url: string };
        medium?: { url: string };
      };
      publishedAt: string;
    };
  }>;
  nextPageToken?: string;
}

interface YouTubeVideoDetails {
  id: string;
  snippet: {
    title: string;
    channelId: string;
    channelTitle: string;
    thumbnails: {
      maxres?: { url: string };
      high?: { url: string };
      medium?: { url: string };
    };
    publishedAt: string;
  };
  contentDetails: {
    duration: string;
  };
  statistics: {
    viewCount: string;
  };
  status?: {
    embeddable: boolean;
  };
}

export interface Short {
  video_id: string;
  title: string;
  channel_id: string;
  channel_name: string;
  thumbnail_url: string;
  published_at: string;
  duration: number;
  view_count: number;
  is_embeddable: boolean;
}

/**
 * 채널의 쇼츠 비디오를 가져오는 함수
 *
 * @description 페이지네이션을 통해 충분한 수의 쇼츠를 수집하고, 70초 이하 비디오만 필터링
 * @param channelId - YouTube 채널 ID
 * @param targetShortsCount - 목표 쇼츠 개수 (기본값: 100)
 * @returns Promise<Short[]> 쇼츠 배열
 */
export async function fetchChannelShorts(
  channelId: string,
  targetShortsCount: number = 100
): Promise<Short[]> {
  try {
    console.log(`📺 채널 ${channelId} 쇼츠 검색 시작... (목표: ${targetShortsCount}개)`);

    // 정확히 3년 전 날짜 계산
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    const allVideos: YouTubeSearchResponse['items'] = [];
    let nextPageToken: string | undefined = undefined;
    let pageCount = 0;
    const maxPages = 10; // API 할당량 보호를 위한 최대 페이지 수

    // 페이지네이션을 통해 비디오 수집
    do {
      pageCount++;
      console.log(`📄 페이지 ${pageCount} 검색 중...`);

      const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
      searchUrl.searchParams.append('part', 'snippet');
      searchUrl.searchParams.append('channelId', channelId);
      searchUrl.searchParams.append('type', 'video');
      searchUrl.searchParams.append('order', 'date');
      searchUrl.searchParams.append('publishedAfter', threeYearsAgo.toISOString());
      searchUrl.searchParams.append('maxResults', '50');
      searchUrl.searchParams.append('key', process.env.YOUTUBE_API_KEY!);

      if (nextPageToken) {
        searchUrl.searchParams.append('pageToken', nextPageToken);
      }

      console.log(`🔍 검색 URL: ${searchUrl.toString()}`);

      const searchResponse = await fetch(searchUrl.toString());
      if (!searchResponse.ok) {
        throw new Error(`YouTube API 오류: ${searchResponse.status} ${searchResponse.statusText}`);
      }

      const searchData = (await searchResponse.json()) as YouTubeSearchResponse;
      console.log(`📊 페이지 ${pageCount} 결과: ${searchData.items?.length || 0}개 영상`);

      if (searchData.items && searchData.items.length > 0) {
        allVideos.push(...searchData.items);
        console.log(`📚 총 수집된 비디오: ${allVideos.length}개`);
      }

      nextPageToken = searchData.nextPageToken;
    } while (nextPageToken && pageCount < maxPages && allVideos.length < 500); // 최대 500개 비디오까지 수집

    if (allVideos.length === 0) {
      console.log(`❌ 채널 ${channelId}에서 최근 3년 내 영상을 찾을 수 없습니다.`);
      return [];
    }

    console.log(`📋 총 ${allVideos.length}개 비디오에서 세부 정보 가져오는 중...`);

    // 비디오 세부 정보를 50개씩 나누어 가져오기 (YouTube API 제한)
    const allShorts: Short[] = [];

    for (let i = 0; i < allVideos.length; i += 50) {
      const batch = allVideos.slice(i, i + 50);
      const videoIds = batch.map((item) => item.id.videoId).join(',');

      const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
      detailsUrl.searchParams.append('part', 'snippet,contentDetails,statistics,status');
      detailsUrl.searchParams.append('id', videoIds);
      detailsUrl.searchParams.append('key', process.env.YOUTUBE_API_KEY!);

      const detailsResponse = await fetch(detailsUrl.toString());
      const detailsData = (await detailsResponse.json()) as { items: YouTubeVideoDetails[] };

      console.log(
        `📊 배치 ${Math.floor(i / 50) + 1}: ${
          detailsData.items?.length || 0
        }개 비디오 세부정보 수신`
      );

      // 쇼츠 필터링 (70초 이하)
      const batchShorts = detailsData.items
        .filter((video) => {
          const duration = parseDuration(video.contentDetails.duration);
          const isShort = duration <= 70 && duration > 0; // 0초 비디오 제외
          if (isShort) {
            console.log(`🎬 쇼츠 발견: ${video.snippet.title} (${duration}초)`);
          }
          return isShort;
        })
        .map((video) => ({
          video_id: video.id,
          title: video.snippet.title,
          channel_id: video.snippet.channelId,
          channel_name: video.snippet.channelTitle,
          thumbnail_url:
            video.snippet.thumbnails.maxres?.url ||
            video.snippet.thumbnails.high?.url ||
            video.snippet.thumbnails.medium?.url ||
            'https://via.placeholder.com/480x360?text=No+Thumbnail',
          published_at: video.snippet.publishedAt,
          duration: parseDuration(video.contentDetails.duration),
          view_count: parseInt(video.statistics.viewCount || '0'),
          is_embeddable: video.status?.embeddable !== false,
        }));

      allShorts.push(...batchShorts);
      console.log(`📈 현재까지 수집된 쇼츠: ${allShorts.length}개`);

      // 목표 쇼츠 수에 도달하면 중단
      if (allShorts.length >= targetShortsCount) {
        console.log(`🎯 목표 쇼츠 수(${targetShortsCount}개)에 도달했습니다.`);
        break;
      }

      // API 호출 간격 조절 (rate limiting 방지)
      if (i + 50 < allVideos.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // 게시일 기준 내림차순 정렬 (최신순)
    allShorts.sort(
      (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );

    console.log(`✅ 채널 ${channelId}: ${allShorts.length}개 쇼츠 수집 완료`);
    console.log(`📅 수집 기간: ${threeYearsAgo.toISOString().split('T')[0]} ~ 현재`);

    return allShorts;
  } catch (error) {
    console.error(`❌ 채널 ${channelId} 쇼츠 수집 오류:`, error);
    return [];
  }
}

/**
 * ISO 8601 duration을 초로 변환하는 함수
 *
 * @description YouTube API의 duration 형식(PT1M30S)을 초 단위로 변환
 * @param duration - ISO 8601 형식의 duration 문자열
 * @returns 초 단위 시간
 *
 * @example
 * ```ts
 * parseDuration('PT1M30S') // 90
 * parseDuration('PT45S')   // 45
 * ```
 */
function parseDuration(duration: string): number {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = duration.match(regex);

  if (!matches) return 0;

  const hours = parseInt(matches[1] || '0');
  const minutes = parseInt(matches[2] || '0');
  const seconds = parseInt(matches[3] || '0');

  return hours * 3600 + minutes * 60 + seconds;
}
