# YouTube Shorts Clone 🎬

유튜브 쇼츠와 동일한 UX/UI를 제공하는 웹 기반 우왁굳 전용 숏폼 비디오 플레이어입니다.

## 📱 주요 기능

### 🎥 비디오 플레이어
- **세로형 풀스크린 재생**: 모바일 최적화된 세로 영상 재생
- **자동 재생**: 화면에 들어오는 영상 자동 재생
- **무한 스크롤**: 끊임없는 콘텐츠 탐색
- **스냅 스크롤**: 한 번에 하나의 영상만 보이도록 자동 정렬

### 🎮 플레이어 컨트롤
- **탭으로 재생/정지**: 화면 탭으로 간편한 재생 제어
- **전역 음소거**: 모든 영상에 적용되는 음소거 기능
- **재시작 버튼**: 영상을 처음부터 다시 재생
- **YouTube 링크**: 원본 YouTube에서 보기

### 📊 진행률 표시
- **실시간 진행률**: 유튜브 쇼츠와 동일한 하단 진행 바
- **시크 기능**: 진행 바 클릭으로 원하는 시점 이동
- **시간 정보**: 호버/클릭 시 현재 시간과 총 길이 표시
- **터치 친화적**: 큰 원형 핸들로 정확한 조작

### 🎨 UI/UX
- **유튜브 쇼츠 복제**: 완벽한 디자인 재현
- **반응형 디자인**: 모든 디바이스에서 최적화
- **부드러운 애니메이션**: 자연스러운 상호작용
- **다크 테마**: 몰입감 있는 검은색 배경

## 🛠 기술 스택

### Frontend
- **Next.js 14**: React 기반 풀스택 프레임워크
- **TypeScript**: 타입 안전성을 위한 정적 타이핑
- **Tailwind CSS**: 유틸리티 퍼스트 CSS 프레임워크
- **Lucide React**: 아이콘 라이브러리

### YouTube Integration
- **YouTube IFrame API**: 영상 재생 및 제어
- **YouTube Data API v3**: 영상 메타데이터 수집
- **Custom YouTube Hook**: 플레이어 상태 관리

### State Management
- **React Hooks**: useState, useEffect, useCallback 등
- **Intersection Observer**: 화면 진입 감지
- **Custom Hooks**: 재사용 가능한 로직 분리

## 📊 데이터 수집 과정

### 1. YouTube Shorts 데이터 수집
```javascript
// YouTube Data API v3를 사용한 쇼츠 데이터 수집
const fetchYouTubeShorts = async () => {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?` +
    `part=snippet&type=video&videoDuration=short&` +
    `maxResults=50&order=relevance&` +
    `key=${YOUTUBE_API_KEY}`
  );
  
  const data = await response.json();
  return data.items;
};
```

### 2. 수집되는 메타데이터
- **video_id**: 유튜브 영상 고유 ID
- **title**: 영상 제목
- **channel_name**: 채널명
- **thumbnail_url**: 썸네일 이미지 URL
- **view_count**: 조회수
- **published_at**: 게시일
- **duration**: 영상 길이 (60초 이하)

### 3. 데이터 필터링
```javascript
// 쇼츠 조건에 맞는 영상만 필터링
const filterShorts = (videos) => {
  return videos.filter(video => {
    const duration = video.contentDetails.duration;
    const seconds = parseDuration(duration);
    return seconds <= 60; // 60초 이하만
  });
};
```

### 4. 데이터베이스 스키마
```sql
-- 쇼츠 영상 정보 테이블
CREATE TABLE shorts (
  id SERIAL PRIMARY KEY,
  video_id VARCHAR(20) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  channel_name VARCHAR(255) NOT NULL,
  thumbnail_url TEXT NOT NULL,
  view_count INTEGER DEFAULT 0,
  published_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🚀 설치 및 실행

### 1. 저장소 클론
```bash
git clone https://github.com/junghwaYang/wak-shorts.git
cd wak-shorts
```

### 2. 의존성 설치
```bash
npm install
# 또는
yarn install
```

### 3. 환경 변수 설정
```bash
# .env.local 파일 생성
YOUTUBE_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_CRON_SECRET=...
CRON_SECRET=...
```

### 4. 개발 서버 실행
```bash
npm run dev
# 또는
yarn dev
```


## 🎯 핵심 컴포넌트

### ShortsItem.tsx
메인 쇼츠 플레이어 컴포넌트로 다음 기능을 제공:

- **YouTube 플레이어 통합**
- **터치/클릭 이벤트 처리**
- **진행률 표시 및 시크**
- **자동 재생/정지**
- **음소거 제어**

### useYouTubePlayer.tsx
YouTube IFrame API를 추상화한 커스텀 훅:

```typescript
const useYouTubePlayer = ({
  videoId,
  playerVars,
  onReady,
  onStateChange
}) => {
  // YouTube 플레이어 생성 및 관리
  // 플레이어 상태 감지
  // 재생/정지/시크 제어
};
```

## 🔧 주요 설정

### YouTube Player 매개변수
```javascript
playerVars: {
  controls: 0,        // 기본 컨트롤 숨김
  modestbranding: 1,  // YouTube 로고 최소화
  rel: 0,            // 관련 영상 숨김
  showinfo: 0,       // 제목 정보 숨김
  fs: 0,             // 전체화면 버튼 숨김
  disablekb: 1,      // 키보드 컨트롤 비활성화
  iv_load_policy: 3, // 주석 숨김
  cc_load_policy: 0, // 자막 비활성화
  playsinline: 1,    // 인라인 재생
}
```

## 🚨 주의사항

### YouTube API 할당량
- YouTube Data API v3는 일일 할당량 제한이 있습니다
- 프로덕션 환경에서는 캐싱 전략이 필요합니다

### 임베딩 제한
- 일부 YouTube 영상은 임베딩이 제한될 수 있습니다
- 에러 처리 및 대체 방안이 구현되어 있습니다

### 모바일 자동재생
- iOS Safari는 사용자 상호작용 없이 자동재생이 제한됩니다
- 첫 번째 사용자 인터랙션 후 자동재생이 활성화됩니다

## 🔮 향후 개선 사항

### 기능 추가
- [ ] 메인에서 채널 별 쇼츠 이동

### 성능 최적화
- [ ] 무한 스크롤 가상화
- [ ] 이미지 lazy loading
- [ ] 영상 프리로딩
- [ ] CDN 연동

### 데이터 분석
- [ ] 시청 시간 분석
- [ ] 사용자 행동 추적
- [ ] A/B 테스트 도구

## 📄 라이센스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🤝 기여하기

1. 저장소를 Fork합니다
2. 기능 브랜치를 생성합니다 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 Push합니다 (`git push origin feature/AmazingFeature`)
5. Pull Request를 생성합니다

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 생성해주세요.

---

**🎬 완벽한 YouTube Shorts 경험을 웹에서 만나보세요!**
