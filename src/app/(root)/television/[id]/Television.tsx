/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { getChannel, updateChannel } from "@/utils/api";
import { Button, Input, Typography, Divider } from "antd";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TVState } from "@/types/datatypes";

const { Title } = Typography;
export default function Television() {
  const playerRef = useRef<HTMLDivElement>(null);
  const params = useParams<{ id: string }>();
  const ytPlayer = useRef<any>(null);
  const currentVideoId = useRef(""); // Track loaded video

  const [timeInput, setTimeInput] = useState<string>("");
  const [videoId, setVideoId] = useState<string>("");
  const shouldSync = useRef<boolean>(true);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stateRef = useRef<TVState>({
    channel: "",
    is_playing: false,
    room_id: params.id as string,
    time: 0,
  } as TVState);

  // Realtime updates
  useEffect(() => {
    if (!params.id) return;

    const channel = supabase
      .channel(`tv-room:${params.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tv_channel",
          filter: `room_id=eq.${params.id}`,
        },
        (payload) => {
          const newState = payload.new as TVState;
          stateRef.current = newState;
          const newVideoId = newState.channel;
          setVideoId(newVideoId);

          if (newVideoId !== currentVideoId.current) {
            shouldSync.current = false; // Disable sync for this update
            manualLoadVideo(newVideoId);
            currentVideoId.current = newVideoId;
          }

          // Cancel any pending sync re-enable
          if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current);
          }
          
          shouldSync.current = false; // Prevent recursive sync
          syncPlayerState(newState);
          
          // Re-enable syncing after cooldown
          syncTimeoutRef.current = setTimeout(() => {
            shouldSync.current = true;
          }, 500);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [params.id]);

  // Sync player with state from server
  const syncPlayerState = (newState: TVState) => {
    if (!ytPlayer.current) return;

    const YT = (window as any).YT;
    const playerState = ytPlayer.current.getPlayerState();

    // Sync play/pause state
    if (newState.is_playing && playerState !== YT.PlayerState.PLAYING) {
      ytPlayer.current.playVideo();
    } else if (!newState.is_playing && playerState !== YT.PlayerState.PAUSED) {
      ytPlayer.current.pauseVideo();
    }

    // Sync video time if difference is significant
    const currentTime = ytPlayer.current.getCurrentTime();
    if (Math.abs(currentTime - newState.time) > 1) {
      ytPlayer.current.seekTo(newState.time, true);
    }
  };

  // Player initialization
  useEffect(() => {
    const helper = async () => {
      const tvstate = await getChannel(params.id);
      stateRef.current = tvstate;
      setVideoId(tvstate.channel);
      currentVideoId.current = tvstate.channel;

      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);

      (window as any).onYouTubeIframeAPIReady = () => {
        ytPlayer.current = new (window as any).YT.Player("yt-player", {
          height: "480",
          width: "853",
          videoId: tvstate.channel || "",
          events: {
            onReady: () => {
              // Set initial state
              if (tvstate.is_playing) {
                ytPlayer.current.playVideo();
              } else {
                ytPlayer.current.pauseVideo();
              }
            },
            onStateChange: handlePlayerStateChange,
          },
        });
      };
    };

    helper();

    return () => {
      ytPlayer.current?.destroy();
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [params.id]);

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

  const handlePlayerStateChange = (event: any) => {
    // Skip if sync is disabled
    if (!shouldSync.current) return;
    
    const YT = (window as any).YT;
    const currentTime = ytPlayer.current.getCurrentTime().toFixed(0);
    
    // Disable sync during state processing
    shouldSync.current = false;
    
    try {
      switch (event.data) {
        case YT.PlayerState.PLAYING:
          updateChannel({
            ...stateRef.current,
            is_playing: true,
            time: currentTime
          });
          break;
          
        case YT.PlayerState.PAUSED:
          updateChannel({
            ...stateRef.current,
            is_playing: false,
            time: currentTime
          });
          break;
          
        case YT.PlayerState.ENDED:
          // Loop video when ended
          ytPlayer.current.seekTo(0, true);
          ytPlayer.current.playVideo();
          updateChannel({
            ...stateRef.current,
            time: 0,
            is_playing: true
          });
          break;
          
        case YT.PlayerState.BUFFERING:
        case YT.PlayerState.CUED:
          // Update time but maintain play state
          updateChannel({
            ...stateRef.current,
            time: currentTime
          });
          break;
      }
    } finally {
      // Re-enable sync after cooldown
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        shouldSync.current = true;
      }, 500);
    }
  };

  const handleLoadVideo = async () => {
    if (!videoId) return;

    let video = ""
    if (videoId.startsWith("http")) {
      const url = new URL(videoId)
      if (url.origin === "https://www.youtube.com") {
        video = url.searchParams.get("v") as string
      } else {
        video = url.pathname.substring(1)
      }
    } else {
      video = videoId
    }

    if (ytPlayer.current) {
      // Disable sync during video load
      shouldSync.current = false;
      
      ytPlayer.current.loadVideoById(video);
      currentVideoId.current = video;
      
      // Update database directly
      await updateChannel({
        ...stateRef.current,
        channel: video,
        time: 0,
        is_playing: true
      });
      
      // Re-enable sync after cooldown
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        shouldSync.current = true;
      }, 500);
    }
  };

  const manualLoadVideo = (vid: string) => {
    if (ytPlayer.current) {
      shouldSync.current = false;
      ytPlayer.current.loadVideoById(vid);
      currentVideoId.current = vid;
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 1000, margin: "0 auto" }}>
      <Title level={3}>Lumiroom Cinema</Title>

      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <div id="yt-player" ref={playerRef}></div>
      </div>

      <Divider />

      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <Input
          placeholder="Enter YouTube video link"
          value={videoId}
          onChange={(e) => setVideoId(e.target.value)}
          onFocus={(e) => e.target.select()}
          style={{ flex: 1, marginRight: 12 }}
        />
        <Button type="primary" onClick={handleLoadVideo}>
          Load Video
        </Button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Button onClick={handlePlay}>▶ Play</Button>
        <Button onClick={handlePause}>⏸ Pause</Button>
        <Input
          type="number"
          placeholder="Seek (sec)"
          value={timeInput}
          onChange={(e) => setTimeInput(e.target.value)}
          onFocus={(e) => e.target.select()}
          style={{ width: 120 }}
        />
        <Button onClick={handleSeek}>Seek</Button>
      </div>
    </div>
  );
}