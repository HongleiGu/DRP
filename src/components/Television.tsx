/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";
import "@/app/global.css"
import { Button, Input, Typography, Divider, message, Popover, Card, Row, Col, Space } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { VideoElement } from './PlayList';
import { CaretDownOutlined, CaretUpOutlined, CopyOutlined, FastForwardOutlined, PauseCircleOutlined, PlayCircleOutlined, SendOutlined, ShareAltOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getRandomNumber, isEmoji } from '@/utils/utils';
import { Message } from '@/types/datatypes';
import { useUser } from '@clerk/nextjs';
import { getUserByNickname } from "@/actions/onboarding";

const { Title } = Typography;

interface TelevisionProps {
  onMount: (receiver: (msg: Message) => void) => void;
  sendMessage: (msg: string) => void;
  playList: VideoElement[];
  chatPanelVisible: boolean;
  setChatPanelVisible: (visible: boolean) => void;
  chatroomId: string
}

interface RenderedEmoji {
  avatarId: number;
  emoji: string;
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
  const [sendEmojis, setSendEmojis] = useState<Record<string, RenderedEmoji>>({});
  const router = useRouter();
  const [userId, setUserId] = useState<string>("");
  const [inputUserId, setInputUserId] = useState<string>("");
  const [controlPanelVisible, setControlPanelVisible] = useState<boolean>(true);

  // Initialize YouTube Player
  useEffect(() => {
    if (!user?.id) {
      message.error("User invalid");
      router.push("/");
      return;
    }

    // const uid = user.id;
    setUserId(user.id)
    setSendEmojis(prev => ({ ...prev, [user.publicMetadata?.nickname as string ?? "Mr.Unknown"]: {
      emoji: "",
      avatarId: getRandomNumber(0,30)
    } }));
    
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
        setSendEmojis(prev => ({ ...prev, [msg.speaker_name]: {
          emoji: messageText,
          avatarId: getRandomNumber(0,30)
        } }));
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

  useEffect(() => {
    console.log(sendEmojis)
  }, [sendEmojis])

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

  const handleInvite = async (username: string) => {
    const uId = (await getUserByNickname(username)).id
    sendMessage(`/invite ${uId} ${userId}`)
  }

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
    <div style={{ flex: "1", display: 'flex', gap: '8px'}}>
      <p>Copy invitation link</p>
      <Space.Compact className="w-full">
         <Input
          value={`http://drp-nu.vercel.app/television/${chatroomId}`}
          readOnly
          // style={{ width: 200, cursor: 'pointer' }}
          onClick={handleCopy}
        />
        <Button 
          icon={<CopyOutlined />}
          iconPosition="end"
          onClick={handleCopy}
        />
      </Space.Compact>
      <p>OR enter userId and we will send the invitation directly</p>
      <Space.Compact className="w-full">
        <Input placeholder="userId" value={inputUserId} onChange={(e) => setInputUserId(e.target.value)}/>
        <Button 
          icon={<SendOutlined />}
          iconPosition="end"
          onClick={() => handleInvite(inputUserId)}
        />
      </Space.Compact>
      {/* <Input
        value={userId}
        style={{ width: 200, cursor: 'pointer' }}
      />
      <div className="flex-row">
        <Button 
          icon={<SendOutlined />}
          iconPosition="end"
          onClick={handleCopy}
        />
      </div> */}
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
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
      onClick={() =>
        window.location.pathname = `/lumiroom/${chatroomId}`
      }
      style={{
        position: "absolute",
        top: 16,
        right: 16, // ← 改成 right 取代 left
        zIndex: 1000
      }}
    >
      Go Back
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


        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: 16,
          marginBottom: 16 
        }}>
          <div className="flex w-full align-middle justify-center">
            <Button 
              icon={controlPanelVisible ? <CaretDownOutlined /> : <CaretUpOutlined />}
              onClick={() => setControlPanelVisible(!controlPanelVisible)}
            />
          </div>
          
          {controlPanelVisible ? 
          <>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Space.Compact style={{ width: '100%', maxWidth: 500 }}>
                <Input
                  placeholder="YouTube URL"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  size="large"
                />
                <Button 
                  type="primary" 
                  size="large" 
                  onClick={handleLoadVideo}
                  style={{ minWidth: 100 }}
                >
                  Load
                </Button>
              </Space.Compact>

              <Space.Compact style={{ width: '100%', maxWidth: 300 }}>
                <Input
                  type="number"
                  placeholder="Seek (seconds)"
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  size="large"
                />
                <Button 
                  size="large" 
                  onClick={handleSeek}
                  icon={<FastForwardOutlined />}
                  style={{ minWidth: 100 }}
                >
                  Seek
                </Button>
              </Space.Compact>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 12,
              width: '100%'
            }}>
              <Button 
                size="large" 
                onClick={() => setChatPanelVisible(!chatPanelVisible)}
                block
              >
                {chatPanelVisible ? 'Hide Chat' : 'Show Chat'}
              </Button>
              
              <Button 
                type="primary" 
                size="large" 
                onClick={handlePlay}
                icon={<PlayCircleOutlined />}
                block
              >
                Play
              </Button>
              
              <Button 
                danger
                size="large" 
                onClick={handlePause}
                icon={<PauseCircleOutlined />}
                block
              >
                Pause
              </Button>
              
              <Popover 
                content={popoverContent}
                title="Invite others to join"
                trigger="click"
              >
                <Button 
                  size="large" 
                  type="dashed"
                  icon={<ShareAltOutlined />}
                  block
                >
                  Invite
                </Button>
              </Popover>
            </div> 
          </> : null
          }

          {/* Bottom Section: User Emojis */}
          <div style={{ 
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            justifyContent: 'center',
            padding: 12,
            backgroundColor: '#f8f9fa',
            borderRadius: 8
          }}>
            {Object.entries(sendEmojis).map(([userId, {emoji, avatarId}]) => (
              <div 
                key={userId} 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: 100
                }}
              >
                <Card 
                  styles={{
                    body: { 
                      padding: 8,
                      fontSize: 24,
                      textAlign: 'center'
                    }
                  }}
                >
                  {emoji}
                </Card>
                <img
                  src={`https://avatar.iran.liara.run/public/${avatarId}`}
                  alt={`${userId}`}
                  style={{ 
                    marginTop: 8,
                    borderRadius: 8,
                    border: '1px solid #f0f0f0',
                    width: 60,
                    height: 60
                  }}
                />
                <div style={{ marginTop: 4, fontSize: 12 }}>{userId}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}