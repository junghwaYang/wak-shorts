'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useChannels } from '@/hooks/useChannels';

/**
 * 채널 필터링 컴포넌트
 *
 * @description 활성화된 채널 목록을 버튼 형태로 표시하고 필터링 기능을 제공
 * - URL 파라미터 기반 상태 관리
 * - 선택된 채널에 따른 스타일 변경
 * - 전체 채널 보기 옵션
 *
 * @returns {JSX.Element} 채널 필터 컴포넌트
 *
 * @example
 * ```tsx
 * <ChannelFilter />
 * ```
 */
export default function ChannelFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedChannel, setSelectedChannel] = useState<string | null>(
    searchParams.get('channel')
  );

  const { channels } = useChannels();

  /**
   * 채널 선택 처리 함수
   *
   * @description 선택된 채널을 URL 파라미터에 반영하고 첫 페이지로 이동
   * @param channelName - 선택할 채널명 (null인 경우 전체 채널)
   */
  const handleChannelSelect = (channelName: string | null) => {
    setSelectedChannel(channelName);

    // URL 파라미터 업데이트
    const params = new URLSearchParams(searchParams.toString());
    if (channelName) {
      params.set('channel', channelName);
    } else {
      params.delete('channel');
    }
    params.set('page', '1'); // 채널 변경 시 첫 페이지로 이동

    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2 p-4">
      <Button
        variant={selectedChannel === null ? 'default' : 'outline'}
        onClick={() => handleChannelSelect(null)}
        className="text-sm">
        전체
      </Button>
      {channels.map((channel) => (
        <Button
          key={channel.id}
          variant={selectedChannel === channel.channel_name ? 'default' : 'outline'}
          onClick={() => handleChannelSelect(channel.channel_name)}
          className="text-sm">
          {channel.channel_name}
        </Button>
      ))}
    </div>
  );
}
