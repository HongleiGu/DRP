/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { Button, Input, Typography, Divider, message } from 'antd';
import { useEffect, useRef, useState } from 'react';

const { Title } = Typography;

export default function Television({sendMessage, addReceiver}: any) {
  const playerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ytPlayer = useRef<any>(null);

  const [timeInput, setTimeInput] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');

  const [connected, setConnected] = useState<boolean>(false);

  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).onYouTubeIframeAPIReady = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ytPlayer.current = new (window as any).YT.Player('yt-player', {
            height: '480',
            width: '853',
            videoId: 'loWA5o1RdTY',
            playerVars: {
              controls: 0,
              disablekb: 1,
              modestbranding: 1,
              rel: 0,
            },
            events: {
              onReady: () => console.log('YouTube Player is ready'),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onStateChange: (e: any) => console.log('Player state changed:', e.data),
            },
          });
    };

    return () => {
      ytPlayer.current?.destroy();
    };
  }, []);

  addReceiver((msg: any) => {
    console.log("add",msg)
    const message: string = msg.chat_message;
    if (message.startsWith("/play")) {
      const seconds = message.split(" ")[1]
      const id = message.split(" ")[2]
      if (extractVideoId(ytPlayer.current?.getVideoUrl()) != id) {
        ytPlayer.current?.loadVideoById(id, seconds)
      } else {
        ytPlayer.current?.seekTo(seconds)
      }
      ytPlayer.current?.playVideo();
    } else if (message.startsWith("/seek")) {
      const seconds = message.split(" ")[1]
      ytPlayer.current?.seekTo(seconds)
    } else if (message.startsWith("/load")) {
      const videoId = message.split(" ")[1]
      if (videoId && ytPlayer.current?.loadVideoById) {
        ytPlayer.current.loadVideoById(videoId);
      } else {
        alert('Invalid YouTube URL');
      }
    } else if (message == "/pause") {
      ytPlayer.current?.pauseVideo();
    }
  })

  const handlePlay = () => {
    sendMessage(`/play ${ytPlayer.current?.getCurrentTime()} ${extractVideoId(ytPlayer.current?.getVideoUrl())}`)
    // ytPlayer.current?.playVideo();
  }
  const handlePause = () => {
    sendMessage("/pause")
    // ytPlayer.current?.pauseVideo();
  }
  const handleSeek = () => {
    const seconds = parseFloat(timeInput);
    sendMessage(`/seek ${seconds}`)
  };

  const extractVideoId = (videoId: string): string => {
    if (videoId.startsWith("http")) {
      const url = new URL(videoId)
      console.log(url)
      if (url.origin == "https://www.youtube.com") {
        return url.searchParams.get("v") as string
      } else {
        return url.pathname.substring(1)
      }
    } else {
      return videoId
    }
  };

  const handleLoadVideo = () => {
    const videoId = extractVideoId(videoUrl);
    sendMessage(`/load ${videoId}`)
  };

  return (
    <div style={{ padding: 32, maxWidth: 1000, margin: '0 auto' }}>
      <Title level={3}>Lumiroom Cinema</Title>

      <div
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 24,
        }}
      >
        <div id="yt-player" ref={playerRef}></div>

        {/* 🛡️ Transparent overlay to block clicks */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 10,
            backgroundColor: connected ? 'transparent' : 'white',
            pointerEvents: 'all',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            color: '#888',
            textAlign: 'center',
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!connected) {
              const context = new AudioContext();
              context.resume();
              setConnected(true);
            } else {
              message.info('This is a shared screen. Please use the buttons below to control the video together 😊');
            }
          }}>{!connected && "Click to connect to shared screen"}</div>
      </div>

      <Divider />

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <Input
          placeholder="Enter YouTube video URL"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          style={{ flex: 1, marginRight: 12 }}
        />
        <Button type="primary" onClick={handleLoadVideo}>
          Load Video
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Button onClick={handlePlay}>▶ Play</Button>
        <Button onClick={handlePause}>⏸ Pause</Button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Input
          type="number"
          placeholder="Seek (sec)"
          value={timeInput}
          onChange={(e) => setTimeInput(e.target.value)}
          style={{ width: 120 }}
        />
        <Button onClick={handleSeek}>Seek</Button>
      </div>
    </div>
  );
}
