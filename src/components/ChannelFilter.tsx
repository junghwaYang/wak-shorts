'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface Channel {
  id: number;
  channel_name: string;
  is_active: boolean;
}

export default function ChannelFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(
    searchParams.get('channel')
  );

  useEffect(() => {
    // 활성화된 채널 목록 가져오기
    const fetchChannels = async () => {
      try {
        const response = await fetch('/api/channels');
        const data = await response.json();
        setChannels(data);
      } catch (error) {
        console.error('채널 목록 조회 오류:', error);
      }
    };

    fetchChannels();
  }, []);

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
