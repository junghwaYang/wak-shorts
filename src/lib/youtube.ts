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

export async function fetchChannelShorts(channelId: string): Promise<Short[]> {
  try {
    console.log(`📺 채널 ${channelId} 쇼츠 검색 시작...`);

    // 최근 1년 내 영상만 검색
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 360);

    const searchUrl =
      `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&` +
      `channelId=${channelId}&` +
      `type=video&` +
      `order=date&` +
      `publishedAfter=${oneWeekAgo.toISOString()}&` +
      `maxResults=50&` + // 더 많이 가져와서 필터링
      `key=${process.env.YOUTUBE_API_KEY}`;

    console.log(`🔍 검색 URL: ${searchUrl}`);

    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      throw new Error(`YouTube API 오류: ${searchResponse.status}`);
    }

    const searchData = (await searchResponse.json()) as YouTubeSearchResponse;
    console.log(`📊 검색 결과: ${searchData.items?.length || 0}개 영상 발견`);

    if (!searchData.items || searchData.items.length === 0) {
      console.log(`❌ 채널 ${channelId}에서 최근 영상을 찾을 수 없습니다.`);
      return [];
    }

    // 비디오 세부 정보 가져오기
    const videoIds = searchData.items.map((item) => item.id.videoId).join(',');

    const detailsUrl =
      `https://www.googleapis.com/youtube/v3/videos?` +
      `part=snippet,contentDetails,statistics&` +
      `id=${videoIds}&` +
      `key=${process.env.YOUTUBE_API_KEY}`;

    const detailsResponse = await fetch(detailsUrl);
    const detailsData = (await detailsResponse.json()) as { items: YouTubeVideoDetails[] };

    console.log(`📋 비디오 세부정보: ${detailsData.items?.length || 0}개`);

    // 쇼츠 필터링 (70초 이하)
    const shorts = detailsData.items
      .filter((video) => {
        const duration = parseDuration(video.contentDetails.duration);
        const isShort = duration <= 70;
        console.log(`🎬 ${video.snippet.title}: ${duration}초 ${isShort ? '(쇼츠)' : '(일반)'}`);
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

    console.log(`✅ 채널 ${channelId}: ${shorts.length}개 쇼츠 수집 완료`);
    return shorts;
  } catch (error) {
    console.error(`❌ 채널 ${channelId} 쇼츠 수집 오류:`, error);
    return [];
  }
}

// ISO 8601 duration을 초로 변환
function parseDuration(duration: string): number {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = duration.match(regex);

  if (!matches) return 0;

  const hours = parseInt(matches[1] || '0');
  const minutes = parseInt(matches[2] || '0');
  const seconds = parseInt(matches[3] || '0');

  return hours * 3600 + minutes * 60 + seconds;
}
