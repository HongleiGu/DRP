'use client';

import { Button, Input } from 'antd';
import { useEffect, useRef, useState } from 'react';

export default function Television() {
  const playerRef = useRef<HTMLDivElement>(null);
  const ytPlayer = useRef<any>(null);
  const [timeInput, setTimeInput] = useState<string>("");

  useEffect(() => {
    // 1. 加载 YouTube API 脚本
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);

    // 2. 定义全局回调
    (window as any).onYouTubeIframeAPIReady = () => {
      ytPlayer.current = new (window as any).YT.Player('yt-player', {
        height: '480',
        width: '853',
        videoId: 'loWA5o1RdTY',
        events: {
          onReady: (event: any) => {
            console.log('Player ready');
          },
          onStateChange: (event: any) => {
            console.log('State changed', event.data);
          },
        },
      });
    };

    return () => {
      if (ytPlayer.current) {
        ytPlayer.current.destroy();
      }
    };
  }, []);

  const handlePlay = () => {
    ytPlayer.current?.playVideo();
  };

  const handlePause = () => {
    ytPlayer.current?.pauseVideo();
  };

  const handleSeek = () => {
    const seconds = parseFloat(timeInput);
    if (!isNaN(seconds)) {
      ytPlayer.current?.seekTo(seconds, true);
    }
  };

  return (
    <div>
      <div id="yt-player" ref={playerRef}></div>

      <div style={{ marginTop: '1rem' }}>
        <Button onClick={handlePlay}>Play</Button>
        <Button onClick={handlePause}>Pause</Button>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <Input
          type="number"
          placeholder="seconds..."
          value={timeInput}
          onChange={(e) => setTimeInput(e.target.value)}
        />
        <Button onClick={handleSeek}>Jump</Button>
      </div>
    </div>
  );
}
