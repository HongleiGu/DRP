/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import { Button, Input, Typography, Divider, message, Popover, Card, Row, Col } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { VideoElement } from './PlayList';
import { CopyOutlined, EllipsisOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { isEmoji } from '@/utils/utils';
import { Message } from '@/types/datatypes';
import { useUser } from '@clerk/nextjs';

const { Title } = Typography;

interface TelevisionProps {
  onMount: (receiver: (msg: Message) => void) => void;
  sendMessage: (msg: string) => void;
  playList: VideoElement[];
  chatPanelVisible: boolean;
  setChatPanelVisible: (visible: boolean) => void;
  chatroomId: string
}

export default function Television({
  onMount,
  sendMessage,
  playList,
  chatPanelVisible,
  setChatPanelVisible,
  chatroomId
}: TelevisionProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const ytPlayer = useRef<any>(null);
  const [timeInput, setTimeInput] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [connected, setConnected] = useState<boolean>(false);
  const [playerReady, setPlayerReady] = useState<boolean>(false);
  const [messageApi, contextHolder] = message.useMessage();
  const { user } = useUser();  
  const [sendEmojis, setSendEmojis] = useState<Record<string, string>>({});
  const router = useRouter();
  const [userId, setUserId] = useState<string>("");

  // Initialize YouTube Player
  useEffect(() => {
    if (!user?.id) {
      message.error("User invalid");
      router.push("/");
      return;
    }

    const uid = user.id;
    setUserId(user.id)
    setSendEmojis(prev => ({ ...prev, [uid]: "" }));
    
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);

    (window as any).onYouTubeIframeAPIReady = () => {
      ytPlayer.current = new (window as any).YT.Player("yt-player", {
        videoId: "loWA5o1RdTY",
        playerVars: {
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => setPlayerReady(true),
          onStateChange: (e: any) => console.log("Player state changed:", e.data),
        },
      });
    };

    return () => {
      ytPlayer.current?.destroy();
      delete (window as any).onYouTubeIframeAPIReady;
    };
  }, [user, router]);

  // Load playlist when player is ready and playList changes
  useEffect(() => {
    if (playerReady && ytPlayer.current && playList?.length > 0) {
      try {
        const videoIds = playList.map((video: VideoElement) => video.vid);
        ytPlayer.current.cuePlaylist(videoIds);
        console.log('Playlist loaded:', videoIds);
      } catch (error) {
        console.error('Error loading playlist:', error);
      }
    }
  }, [playerReady, playList]);

  // Setup message receiver
  useEffect(() => {
    const receiver = (msg: Message) => {
      const messageText: string = msg.chat_message;
      console.log("check emoji", isEmoji(messageText));
      
      if (isEmoji(messageText)) {
        setSendEmojis(prev => ({ ...prev, [userId]: "" }));
        // console.log(sendEmojis.current);
      } else if (messageText.startsWith("/play")) {
        const [_, seconds, id] = messageText.split(" ");
        if (extractVideoId(ytPlayer.current?.getVideoUrl()) !== id) {
          ytPlayer.current?.loadVideoById(id, seconds);
        } else {
          ytPlayer.current?.seekTo(parseFloat(seconds));
          ytPlayer.current?.pauseVideo();
        }
        ytPlayer.current?.playVideo();
      } else if (messageText.startsWith("/seek")) {
        const seconds = messageText.split(" ")[1];
        ytPlayer.current?.seekTo(parseFloat(seconds));
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

  const handleCopy = () => {
    navigator.clipboard.writeText(`http://drp-nu.vercel.app/television/${chatroomId}`);
    message.success('Chatroom ID copied to clipboard!');
  };

  const popoverContent = (
    <div style={{ display: 'flex', gap: '8px' }}>
      <Input
        value={`http://drp-nu.vercel.app/television/${chatroomId}`}
        readOnly
        style={{ width: 200, cursor: 'pointer' }}
        onClick={handleCopy}
      />
      <Button 
        icon={<CopyOutlined />}
        onClick={handleCopy}
      />
    </div>
  );

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

          {/* Transparent overlay to block clicks */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 10,
              backgroundColor: connected ? "transparent" : "rgba(255, 255, 255, 0.8)",
              pointerEvents: "all",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              color: "#888",
              textAlign: "center",
              transition: "background-color 0.3s ease",
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
          {/* URL Input & Load Button */}
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

          {/* Emoji display area */}
          <div style={{ 
            flex: 2, 
            display: 'flex', 
            alignItems: 'center', 
            height: 80,
            gap: 12 
          }}>
            <Popover 
      content={popoverContent}
      title="Copy Chatroom ID"
      trigger="click"
    >
      <Button type="primary">Show Chatroom ID</Button>
    </Popover>

            <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
              {Object.entries(sendEmojis).map(([userId, emoji]) => (
                <Col key={userId} span={12}>
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                    <Card style={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      right: 0, 
                      backgroundColor: 'white', 
                      zIndex: 10, 
                      padding: 8 
                    }}>
                      {emoji}
                    </Card>
                    
                    <div style={{ 
                      borderRadius: 8, 
                      overflow: 'hidden', 
                      backgroundColor: '#f0f0f0'
                    }}>
                      <Image
                        src={`https://picsum.photos/120/80?random=${userId}`}
                        alt={`User ${userId}`}
                        width={120}
                        height={80}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </div>

        <div style={{ flex: 0, display: "flex", gap: 12, marginBottom: 16 }}>
          <Button onClick={() => setChatPanelVisible(!chatPanelVisible)}>
            {chatPanelVisible ? 'Hide Chat' : 'Show Chat'}
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