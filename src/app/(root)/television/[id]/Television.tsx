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
  const [doSync, setDoSync] = useState<boolean>(true);
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
            setDoSync(false); // Disable sync for this update
            manualLoadVideo(newVideoId);
            currentVideoId.current = newVideoId;
          }

          // Sync player state
          setDoSync(false); // Prevent recursive sync
          syncPlayerState(newState);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
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
      console.log(tvstate);
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
              console.log("YouTube Player ready");
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
    };
  }, [params.id]);

  const handlePlay = () => {
    ytPlayer.current?.playVideo();
    stateRef.current.is_playing = true;
    setDoSync(true); // Enable sync for this action
    updateChannel(stateRef.current);
  };

  const handlePause = () => {
    ytPlayer.current?.pauseVideo();
    stateRef.current.is_playing = false;
    stateRef.current.time = ytPlayer.current?.getCurrentTime() || 0;
    setDoSync(true); // Enable sync for this action
    updateChannel(stateRef.current);
  };

  const handleSeek = () => {
    const seconds = parseFloat(timeInput);
    if (!isNaN(seconds)) {
      ytPlayer.current?.seekTo(seconds, true);
      stateRef.current.time = seconds;
      setDoSync(true); // Enable sync for this action
      updateChannel(stateRef.current);
    }
  };

  const handlePlayerStateChange = (event: any) => {
    if (!doSync) {
      // Skip processing if sync is disabled
      setDoSync(true); // Re-enable sync for next actions
      return;
    }

    const YT = (window as any).YT;
    console.log("Player state changed:", event.data, stateRef.current);

    // Update state based on player events
    switch (event.data) {
      case YT.PlayerState.PLAYING:
        stateRef.current.is_playing = true;
        stateRef.current.time = ytPlayer.current.getCurrentTime().toFixed(0);
        setDoSync(false); // Disable sync to prevent loop
        updateChannel(stateRef.current);
        break;

      case YT.PlayerState.PAUSED:
        stateRef.current.is_playing = false;
        stateRef.current.time = ytPlayer.current.getCurrentTime().toFixed(0);
        setDoSync(false); // Disable sync to prevent loop
        updateChannel(stateRef.current);
        break;

      case YT.PlayerState.CUED:
        stateRef.current.time = 0;
        stateRef.current.is_playing = false;
        setDoSync(false); // Disable sync to prevent loop
        updateChannel(stateRef.current);
        break;

      case YT.PlayerState.ENDED:
        // Loop video when ended
        setDoSync(false); // Disable sync during loop sequence
        ytPlayer.current.seekTo(0, true);
        ytPlayer.current.playVideo();
        stateRef.current.time = 0;
        stateRef.current.is_playing = true;
        updateChannel(stateRef.current);
        break;

      default:
        break;
    }
  };

  const handleLoadVideo = async () => {
    if (!videoId) return;

    if (ytPlayer.current) {
      ytPlayer.current.loadVideoById(videoId);
      currentVideoId.current = videoId;
      stateRef.current.channel = videoId;
      stateRef.current.time = 0;
      stateRef.current.is_playing = true;
      setDoSync(false); // Disable sync for initial load
      await updateChannel(stateRef.current);
    }
  };

  const manualLoadVideo = (vid: string) => {
    if (ytPlayer.current) {
      setDoSync(false); // Disable sync for this external load
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
          placeholder="Enter YouTube video ID"
          value={videoId}
          onChange={(e) => setVideoId(e.target.value)}
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
          style={{ width: 120 }}
        />
        <Button onClick={handleSeek}>Seek</Button>
      </div>
    </div>
  );
}
