/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import { Button, Input, Typography, Divider, message, Popover } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { VideoElement } from './PlayList';
import { EllipsisOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const { Title } = Typography;

export default function Television({onMount, sendMessage, playList, chatPanelVisible, setChatPanelVisible, chatroomId}: any) {
  const playerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
  const ytPlayer = useRef<any>(null);
  const [timeInput, setTimeInput] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [connected, setConnected] = useState<boolean>(false);
  const [playerReady, setPlayerReady] = useState<boolean>(false);
  const [messageApi, contextHolder] = message.useMessage();

  // Initialize YouTube Player
  useEffect(() => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);

    (window as any).onYouTubeIframeAPIReady = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ytPlayer.current = new (window as any).YT.Player("yt-player", {
        videoId: "loWA5o1RdTY",
        playerVars: {
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => console.log("YouTube Player is ready"),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onStateChange: (e: any) =>
            console.log("Player state changed:", e.data),
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

    onMount(receiver);
  }, [onMount]);

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

  const chatBubbleStyle = (emoji: string, top: number, left: number) => ({
    position: 'absolute',
    top: `${top}%`,
    left: `${left}%`,
    transform: 'translate(-50%, -50%)',
    background: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '50%',
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    pointerEvents: 'auto',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    '&:hover': {
      transform: 'translate(-50%, -50%) scale(1.2)'
    }
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding: 10,
        margin: "0 auto",
      }}
    >
      {contextHolder}
      <Title level={3} style={{ flex: 0, margin: "10px" }}>
        Lumiroom Cinema
      </Title>
      <Button
      type="primary"
      onClick={() => router.push(`/lumiroom/${chatroomId}`)}
      style={{
        position: "absolute",
        top: 16,
        right: 16, // ← 改成 right 取代 left
        zIndex: 1000
      }}
    >
      Return
    </Button>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            flex: 1,
            position: "relative",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "99%",
              height: "99%",
            }}
            id="yt-player"
            ref={playerRef}
          ></div>

          {/* 🛡️ Transparent overlay to block clicks */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 10,
              backgroundColor: connected ? "transparent" : "white",
              pointerEvents: "all",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              color: "#888",
              textAlign: "center",
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!connected) {
                const context = new AudioContext();
                context.resume();
                setConnected(true);
              } else {
                messageApi.info(
                  "This is a shared screen. Please use the buttons below to control the video together 😊"
                );
              }
            }}
          >
            {!connected && "Click to connect to shared screen"}
          </div>
        </div>

        <Divider />

        <div style={{ display: 'flex', marginBottom: 16, gap: 12, alignItems: 'center' }}>
          {/* Shortened URL Input & Load Button */}
          <div style={{ flex: 3, display: 'flex', alignItems: 'center' }}>
            <Input
              placeholder="YouTube URL"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              style={{ flex: 1, marginRight: 12 }}
            />
            <Button type="primary" onClick={handleLoadVideo}>
              Load
            </Button>
          </div>

          {/* Horizontal Image Gallery with Popover */}
          <div style={{ flex: 2, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
            <div style={{ 
              display: 'flex', 
              overflowX: 'auto', 
              gap: 12,
              padding: '8px 0',
              flex: 1,
              marginRight: 12
            }}>
              {[1, 2].map((item) => (
                <div key={item} style={{ position: 'relative' }}>
                  {/* Thumbnail with chat bubble space */}
                  <div style={{ 
                    width: 120, 
                    height: 80,
                    borderRadius: 8,
                    overflow: 'hidden',
                    position: 'relative',
                    backgroundColor: '#f0f0f0'
                  }}>
                    <img 
                      src={`https://picsum.photos/120/80?random=${item}`} 
                      alt={`Thumb ${item}`}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                      }} 
                    />
                    
                    {/* Space for chat bubbles - positioned absolutely */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      pointerEvents: 'none',
                      display: 'flex',
                      flexWrap: 'wrap',
                      padding: 4
                    }}>
                      {/* Example chat bubbles */}
                      {/* <div style={chatBubbleStyle('😊', 20, 30)} /> */}
                      {/* <div style={chatBubbleStyle('👍', 60, 50)} /> */}
                    </div>
                  </div>
                  
                  {/* Timestamp */}
                  <div style={{ 
                    textAlign: 'center', 
                    fontSize: 12, 
                    marginTop: 4,
                    color: '#666'
                  }}>
                    0:45
                  </div>
                </div>
              ))}
            </div>
            
            {/* Enhanced Popover Button */}
            <Popover 
              content={
                <div style={{ padding: 12, width: 300 }}>
                  <h4 style={{ marginBottom: 8 }}>All Moments</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {[1, 2, 3, 4, 5, 6].map(item => (
                      <Image
                        key={item}
                        src={`https://picsum.photos/80/45?random=${item}`}
                        alt={`Thumb ${item}`}
                        style={{ width: 80, height: 45, borderRadius: 4 }}
                      />
                    ))}
                  </div>
                </div>
              } 
              title="Video Moments"
              trigger="click"
              placement="bottomRight"
            >
              <Button 
                type="default"
                style={{ 
                  width: 42, 
                  height: 42,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#1890ff',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }} 
              >
                <EllipsisOutlined style={{ color: 'white', fontSize: 20 }} />
              </Button>
            </Popover>
          </div>
        </div>

        <div style={{ flex: 0, display: "flex", gap: 12, marginBottom: 16 }}>
          {/* Chat Panel Toggle Button */}
          <Button onClick={() => setChatPanelVisible(!chatPanelVisible)}>
            {chatPanelVisible ? '⬅️ hide chatbox' : '➡️ show chatbox'}
          </Button>
          <Button onClick={handlePlay}>▶️ Play</Button>
          <Button onClick={handlePause}>⏸️ Pause</Button>
            <Input
              type="number"
              placeholder="Seek (sec)"
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
              style={{ width: 120 }}
            />
          <Button onClick={handleSeek}>⏩ Seek</Button>
        </div>
      </div>
    </div>
  );
}