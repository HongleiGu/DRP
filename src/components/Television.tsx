/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { Button, Input, Typography, Divider, message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { VideoElement } from './PlayList';

const { Title } = Typography;

export default function Television({sendMessage, addReceiver, playList}: any) {
  const playerRef = useRef<HTMLDivElement>(null);
  const ytPlayer = useRef<any>(null);
  const [timeInput, setTimeInput] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [connected, setConnected] = useState<boolean>(false);
  const [playerReady, setPlayerReady] = useState<boolean>(false);
  const [messageApi, contextHolder] = message.useMessage();

  // Initialize YouTube Player
  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);

    (window as any).onYouTubeIframeAPIReady = () => {
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
          onReady: (event: any) => {
            console.log('YouTube Player is ready');
            setPlayerReady(true);
          },
          onStateChange: (e: any) => console.log('Player state changed:', e.data),
        },
      });
    };

    return () => {
      ytPlayer.current?.destroy();
    };
  }, []);

  // Load playlist when player is ready and playList changes
  useEffect(() => {
    if (playerReady && ytPlayer.current && playList && playList.length > 0) {
      try {
        // Extract video IDs from the playlist
        console.log(playList)
        const videoIds = playList.map((video: VideoElement) => video.vid);
        
        // Use cuePlaylist instead of loadPlaylist for better UX
        ytPlayer.current.cuePlaylist(videoIds);
        
        console.log('Playlist loaded:', videoIds);
      } catch (error) {
        console.error('Error loading playlist:', error);
      }
    }
  }, [playerReady, playList]);

  // Setup message receiver
  useEffect(() => {
    const receiver = (msg: any) => {
      const messageText: string = msg.chat_message;
      if (messageText.startsWith("/play")) {
        const seconds = messageText.split(" ")[1];
        const id = messageText.split(" ")[2];
        if (extractVideoId(ytPlayer.current?.getVideoUrl()) !== id) {
          ytPlayer.current?.loadVideoById(id, seconds);
        } else {
          ytPlayer.current?.seekTo(seconds);
          ytPlayer.current?.pauseVideo();
        }
        ytPlayer.current?.playVideo();
      } else if (messageText.startsWith("/seek")) {
        const seconds = messageText.split(" ")[1];
        ytPlayer.current?.seekTo(seconds);
      } else if (messageText.startsWith("/load")) {
        const videoId = messageText.split(" ")[1];
        if (videoId && ytPlayer.current?.loadVideoById) {
          ytPlayer.current.loadVideoById(videoId);
        }
      } else if (messageText === "/pause") {
        ytPlayer.current?.pauseVideo();
      }
    };

    addReceiver(receiver);
  }, [addReceiver]);

  const handlePlay = () => {
    if (ytPlayer.current) {
      sendMessage(`/play ${ytPlayer.current.getCurrentTime()} ${extractVideoId(ytPlayer.current.getVideoUrl())}`);
    }
  };

  const handlePause = () => {
    sendMessage("/pause");
  };

  const handleSeek = () => {
    const seconds = parseFloat(timeInput);
    if (!isNaN(seconds)) {
      sendMessage(`/seek ${seconds}`);
    }
  };

  const extractVideoId = (videoUrl: string): string => {
    if (!videoUrl) return '';
    try {
      const url = new URL(videoUrl);
      if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
        return url.searchParams.get("v") || url.pathname.split('/').pop() || '';
      }
      return '';
    } catch (e) {
      return '';
    }
  };

  const handleLoadVideo = () => {
    const videoId = extractVideoId(videoUrl);
    if (videoId) {
      sendMessage(`/load ${videoId}`);
    } else {
      messageApi.warning('Invalid YouTube URL');
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 1000, margin: '0 auto' }}>
      <Title level={3}>Lumiroom Cinema</Title>
      {contextHolder}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <div id="yt-player" ref={playerRef}></div>
        
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
              messageApi.info('This is a shared screen. Please use the buttons below to control the video together 😊');
            }
          }}
        >
          {!connected && "Click to connect to shared screen"}
        </div>
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