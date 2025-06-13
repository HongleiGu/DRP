/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";
import "@/app/globals.css";
import {
  Button,
  Input,
  Typography,
  message,
  Popover,
  Card,
  Space,
  Slider,
  Tooltip,
  DatePicker,
  Select,
  Cascader,
} from "antd";
import { useEffect, useRef, useState } from "react";
// import { VideoElement } from './PlayList';
import {
  CaretDownOutlined,
  CaretUpOutlined,
  CopyOutlined,
  FastForwardOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SendOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { cascaderOptions, isEmoji } from "@/utils/utils";
import { setYtPlayer, getYtPlayer, clearYtPlayer, extractVideoId } from "@/utils/ytPlayerManager";

import { Message, PlayerData } from "@/types/datatypes";
import { useUser } from "@clerk/nextjs";
import { FullscreenOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

import { supabase } from "@/lib/supabase";

const { Title } = Typography;

interface TelevisionProps {
  onMount: (receiver: (msg: Message) => void) => void;
  sendMessage: (msg: string) => void;
  // playList: VideoElement[];
  chatPanelVisible: boolean;
  setChatPanelVisible: (visible: boolean) => void;
  chatroomId: string;
}

interface RenderedEmoji {
  avatarId: number;
  emoji: string;
}

export default function Television({
  onMount,
  sendMessage,
  // playList,
  chatPanelVisible,
  setChatPanelVisible,
  chatroomId,
}: TelevisionProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playerRef = useRef<HTMLDivElement>(null);
  // const ytPlayer = useRef<any>(null);
  const [timeInput, setTimeInput] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoId, setVideoId] = useState<string>("");
  const [connected, setConnected] = useState<boolean>(false);
  const [playerReady, setPlayerReady] = useState<boolean>(false);
  const [nickname, setNickname] = useState<string>("");
  const [messageApi, contextHolder] = message.useMessage();
  const [selectedTimeZone, setSelectedTimeZone] = useState<string>(dayjs.tz.guess());
  const { user } = useUser();
  const [sendEmojis, setSendEmojis] = useState<Record<string, RenderedEmoji>>({
    placeholder: {
      avatarId: 0,
      emoji: "",
    },
  });
  const router = useRouter();
  const [userId, setUserId] = useState<string>("");
  const [inputUserId, setInputUserId] = useState<string>("");
  const [controlPanelVisible, setControlPanelVisible] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(true);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [reservedTimestamp, setReservedTimestamp] = useState<number | null>(null);

  // Initialize YouTube Player
  useEffect(() => {
    if (!user?.id) {
      message.error("User invalid");
      router.push("/");
      return;
    }

    const handler = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handler);

    setUserId(user.id);
    setNickname((user.publicMetadata?.nickname ?? "") as string);
    setSendEmojis((prev) => ({
      [(user.publicMetadata?.nickname as string) ?? "Mr.Unknown"]: {
        emoji: "",
        avatarId: Number.parseInt(user.publicMetadata?.avatarId as string ?? "0"),
      },
    }));

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api?rel=0";
    document.body.appendChild(tag);

    (window as any).onYouTubeIframeAPIReady = () => {
      const player = new (window as any).YT.Player("yt-player", {
        videoId: "loWA5o1RdTY",
        playerVars: {
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => setPlayerReady(true),
          onStateChange: (event: any) => {
            const state = event.data;
            if (state === 1) setIsPlaying(true);
            else if (state === 2) setIsPlaying(false);
          },
        },
      });

      setYtPlayer(player);
    };


    return () => {
      const player = getYtPlayer();
      player?.destroy();
      clearYtPlayer();
      delete (window as any).onYouTubeIframeAPIReady;
      document.removeEventListener("fullscreenchange", handler);
    };

  }, [user, router]);

  // Update video time
  useEffect(() => {
    if (!playerReady) return;

    const intervalId = setInterval(() => {
      if (getYtPlayer()) {
        const newTime = getYtPlayer().getCurrentTime();
        const newDuration = getYtPlayer().getDuration();

        if (!isNaN(newTime)) setCurrentTime(newTime);
        if (!isNaN(newDuration)) setDuration(newDuration);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [playerReady]);

  // Setup message receiver
  useEffect(() => {
    const receiver = async (msg: Message) => {
      const messageText: string = msg.chat_message;
      console.log("check emoji", isEmoji(messageText));

      const res = await fetch(`/api/room/${msg.chat_room_id}/players`);
      const members = (await res.json() as { players: PlayerData[] }).players
      const player = members.find((member) => member.user_id == msg.speaker)

      if (isEmoji(messageText)) {
        setSendEmojis((prev) => ({
          ...prev,
          [msg.speaker_name]: {
            emoji: messageText,
            avatarId: Number.parseInt(player?.avatarId ?? "0"),
          },
        }));
      } else if (messageText.startsWith("/play")) {
        const [_, seconds, id] = messageText.split(" ");
        if (extractVideoId(getYtPlayer()?.getVideoUrl()) !== id) {
          getYtPlayer()?.loadVideoById(id, seconds);
        } else {
          getYtPlayer()?.seekTo(parseFloat(seconds));
          getYtPlayer()?.pauseVideo();
        }
        getYtPlayer()?.playVideo();
      } else if (messageText.startsWith("/seek")) {
        const seconds = messageText.split(" ")[1];
        getYtPlayer()?.seekTo(parseFloat(seconds));
      } else if (messageText.startsWith("/load")) {
        const videoId = messageText.split(" ")[1];
        if (videoId && getYtPlayer()?.loadVideoById) {
          getYtPlayer().loadVideoById(videoId);
        }
      } else if (messageText === "/pause") {
        getYtPlayer()?.pauseVideo();
      }
    };

    onMount(receiver);
  }, [onMount]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSliderSeek = (seconds: number) => {
    if (Math.abs(seconds - currentTime) > 1) {
      sendMessage(`/seek ${Math.floor(seconds)}`);
    }
  };

  const handlePlay = () => {
    if (getYtPlayer()) {
      sendMessage(
        `/play ${getYtPlayer().getCurrentTime()} ${extractVideoId(
          getYtPlayer().getVideoUrl()
        )}`
      );
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

  const handleInvite = async (username: string, timestamp: number | null) => {
    if (timestamp) {
      // Convert timestamp to a Date object
      // const date = dayjs(timestamp).format('YYYY-MM-DD'); // e.g., "2025-06-12"
      
      const { error } = await supabase.from('calendar_entries').insert({
        room_id: chatroomId,
        user_id: username,
        date: null,
        content: `Video session for ${nickname} with ID ${videoId}`,
        note: `Video session for ${nickname} with ID ${videoId}`,
        emoji: '📹',
        countdown: Math.floor(timestamp / 1000), // only this is valid, leave the rest aside
      });

      if (error) {
        console.error('Failed to insert calendar entry:', error.message);
      } else {
        console.log('Calendar entry added!');
      }
    } else {
      sendMessage(`/invite ${username} ${nickname} ${videoId}`);
    }
  };

  const handleLoadVideo = () => {
    const videoId = extractVideoId(videoUrl);
    if (videoId) {
      sendMessage(`/load ${videoId}`);
    } else {
      messageApi.warning("Invalid YouTube URL");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `http://drp-nu.vercel.app/television/${chatroomId}`
    );
    message.success("Chatroom ID copied to clipboard!");
    setCopied(true);
  };

  const popoverContent = (
    <div className="flex-1 flex flex-col" style={{ gap: "8px" }}>
      <p>Copy invitation link</p>
      <Space.Compact className="w-full">
        <Button
          icon={<CopyOutlined />}
          iconPosition="end"
          onClick={handleCopy}
        />
        {copied ? <span className="ml-4 text-green-500">Copied!</span> : null}
      </Space.Compact>

      <p>Video ID</p>
      <Input
        placeholder="Enter video ID"
        value={videoId}
        onChange={(e) => setVideoId(e.target.value)}
        addonBefore={
          <Tooltip title="Reset to extracted video ID">
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => setVideoId(extractVideoId(videoUrl))}
            />
          </Tooltip>
        }
      />

      <p>OR enter userId and we will send the invitation directly</p>
      <Space.Compact className="w-full">
        <Input
          placeholder="userId"
          value={inputUserId}
          onChange={(e) => setInputUserId(e.target.value)}
        />
        <Button
          icon={<SendOutlined />}
          iconPosition="end"
          onClick={() => handleInvite(inputUserId, reservedTimestamp)}
        />
      </Space.Compact>

      <p>you can also reserve a time</p>
      <p>Choose Time Zone</p>
      <Cascader
        options={cascaderOptions}
        placeholder="Select Time Zone"
        style={{ width: "100%" }}
        showSearch
        value={
          selectedTimeZone && selectedTimeZone.includes("/")
            ? [selectedTimeZone.split("/")[0], selectedTimeZone]
            : undefined
        }
        onChange={(value) => {
          const selected = value?.[1]; // full time zone like "America/New_York"
          if (selected) {
            setSelectedTimeZone(selected);
          }
        }}
        displayRender={(labels) => labels.join(" / ")} // e.g., America / New York
      />

      <DatePicker
        allowClear
        showTime={{ format: 'HH:mm' }}
        format="YYYY-MM-DD HH:mm"
        className="w-full"
        onChange={(value) => {
          if (value) {
            const zoned = dayjs.tz(value, selectedTimeZone);
            const timestamp = zoned.valueOf(); // milliseconds in UTC
            setReservedTimestamp(timestamp);
          } else {
            setReservedTimestamp(null);
          }
        }}
      />

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
        onClick={() => (window.location.pathname = `/lumiroom/${chatroomId}`)}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 1000,
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
              backgroundColor: connected
                ? "transparent"
                : "rgba(255, 255, 255, 0.8)",
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
                if (isPlaying) {
                  handlePause()
                } else {
                  handlePlay()
                }
                  // document.exitFullscreen();
              }
            }}
          >
            {!connected && "Click to connect to shared screen"}
            {isFullScreen && (
              <div style={{
                    width: "100%",
                    height: "100%"
              }}>
                <div
                  style={{
                    position: "fixed",
                    bottom: "10px",
                    width: "100%",
                    padding: "0 50px",
                    margin: "16px 0",
                  }}
                  className="text-black"
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >

                    <Slider
                      min={0}
                      max={duration}
                      value={currentTime}
                      step={1}
                      tooltip={{ formatter: (value) => formatTime(value || 0) }}
                      onChange={handleSliderSeek}
                      style={{ width: "100%", margin: 0 }}
                    />

                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            width: "100%",
            padding: "0 10px",
            margin: "16px 0",
          }}
          className="text-black"
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <span style={{ minWidth: 50, textAlign: "center" }}>
              {formatTime(currentTime)}
            </span>
            <Slider
              min={0}
              max={duration}
              value={currentTime}
              step={1}
              tooltip={{ formatter: (value) => formatTime(value || 0) }}
              onChange={handleSliderSeek}
              style={{ width: "100%", margin: 0 }}
            />

            <span style={{ minWidth: 50, textAlign: "center" }}>
              {formatTime(duration)}
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            // marginBottom: 16,
          }}
          className="text-black"
        >
          <div className="flex w-full align-middle justify-center">
            <Button
              icon={
                controlPanelVisible ? (
                  <CaretDownOutlined />
                ) : (
                  <CaretUpOutlined />
                )
              }
              onClick={() => setControlPanelVisible(!controlPanelVisible)}
            />
          </div>

          {controlPanelVisible ? (
            <>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 16,
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Space.Compact style={{ width: "100%", maxWidth: 500 }}>
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

                <Space.Compact style={{ width: "100%", maxWidth: 300 }}>
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

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: 12,
                  width: "100%",
                }}
              >
                <Button
                  size="large"
                  onClick={() => setChatPanelVisible(!chatPanelVisible)}
                  block
                >
                  {chatPanelVisible ? "Hide Chat" : "Show Chat"}
                </Button>

                <Button
                  type={isPlaying ? "default" : "primary"}
                  danger={isPlaying}
                  size="large"
                  onClick={isPlaying ? handlePause : handlePlay}
                  icon={
                    isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />
                  }
                  block
                >
                  {isPlaying ? "Pause" : "Play"}
                </Button>

                <Button
                  size="large"
                  icon={<FullscreenOutlined />}
                  onClick={() => {
                    const elem =
                      document.getElementById("yt-player")?.parentElement;
                    elem?.requestFullscreen();
                  }}
                  block
                >
                  Fullscreen
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
                    onClick={() => setCopied(false)}
                    block
                  >
                    Invite
                  </Button>
                </Popover>
              </div>
            </>
          ) : null}

          {/* Bottom Section: User Emojis */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              justifyContent: "center",
              // padding: 12,
              backgroundColor: "#f8f9fa",
              borderRadius: 8,
            }}
          >
            {Object.entries(sendEmojis).map(([userId, { emoji, avatarId }]) => (
              <div
                key={userId}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: 100,
                }}
              >
                <Card
                  styles={{
                    body: {
                      padding: 8,
                      fontSize: 24,
                      textAlign: "center",
                    },
                  }}
                >
                  {emoji}
                </Card>
                <div
                  style={{
                    width: 48, // 16 * 2
                    height: 60, // 20 * 2
                    overflow: 'hidden',
                    display: 'inline-block',
                    paddingTop: '4px',
                  }}
                >
                  <img
                    src={`/game/assets/character-pack-full_version/sprite_split/character_${avatarId + 1}/character_${avatarId + 1}_frame16x20.png`}
                    alt="sprite-frame"
                    draggable={false}
                    style={{
                      display: 'block',
                      objectFit: 'none',
                      objectPosition: '-16px -60px',
                      transform: 'scale(3)',
                      transformOrigin: 'top left',
                      imageRendering: 'pixelated',
                    }}
                  />
                </div>
                <div style={{ marginTop: 4, fontSize: 12 }}>{userId}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
