'use client';

import { Button, Input } from 'antd';
import { useEffect, useRef, useState } from 'react';

export default function Television() {
  const playerRef = useRef<HTMLDivElement>(null);
  const ytPlayer = useRef<any>(null);

  const [timeInput, setTimeInput] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');

  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);

    (window as any).onYouTubeIframeAPIReady = () => {
      ytPlayer.current = new (window as any).YT.Player('yt-player', {
        height: '480',
        width: '853',
        videoId: 'loWA5o1RdTY', // Default video
        events: {
          onReady: () => console.log('YouTube Player is ready'),
          onStateChange: (e: any) => console.log('Player state changed:', e.data),
        },
      });
    };

    return () => {
      ytPlayer.current?.destroy();
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

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/,
      /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) return match[1];
    }
    return null;
  };

  const handleLoadVideo = () => {
    const videoId = extractVideoId(videoUrl);
    if (videoId && ytPlayer.current?.loadVideoById) {
      ytPlayer.current.loadVideoById(videoId);
    } else {
      alert('Invalid YouTube URL');
    }
  };

  return (
    <div>
      <div id="yt-player" ref={playerRef}></div>

      <div style={{ marginTop: '1rem' }}>
        <Input
          type="text"
          placeholder="Enter YouTube video URL"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          style={{ width: '400px', marginRight: '10px' }}
        />
        <Button onClick={handleLoadVideo}>Load Video</Button>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <Button onClick={handlePlay}>Play</Button>
        <Button onClick={handlePause}>Pause</Button>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <Input
          type="number"
          placeholder="Seek to (seconds)"
          value={timeInput}
          onChange={(e) => setTimeInput(e.target.value)}
          style={{ width: '100px', marginRight: '10px' }}
        />
        <Button onClick={handleSeek}>Seek</Button>
      </div>
    </div>
  );
}
