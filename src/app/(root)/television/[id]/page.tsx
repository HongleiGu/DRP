/* eslint-disable @typescript-eslint/no-explicit-any */


'use client';


// note, this page allows the use of explicit any as youtube need it

import { getChannel, updateChannel } from '@/utils/api';
import { Button, Input, Typography, Divider, message } from 'antd';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

const { Title } = Typography;

export default function Television() {
  const playerRef = useRef<HTMLDivElement>(null);
  const params = useParams<{id: string}>();
  const ytPlayer = useRef<any>(null);
  const currentVideoId = useRef(''); // Track loaded video

  const [timeInput, setTimeInput] = useState<string>('');
  const [videoId, setVideoId] = useState<string>('');

  // Realtime updates
  useEffect(() => {
    console.log(params.id)
    if (!params.id) return;

    const channel = supabase
      .channel(`tv-room:${params.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'tv_channel',
        filter: `room_id=eq.${params.id}`
      }, (payload) => {
        const newVideoId = payload.new.channel;
        setVideoId(newVideoId);
        manualLoadVideo(newVideoId)
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Player initialization
  useEffect(() => {
    const helper = async () => {
      const vid = await getChannel(params.id);
      setVideoId(vid);
      currentVideoId.current = vid;

      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);

      
      (window as any).onYouTubeIframeAPIReady = () => {
        
        ytPlayer.current = new (window as any).YT.Player('yt-player', {
          height: '480',
          width: '853',
          videoId: vid || '',
          playerVars: {
            controls: 0,
            disablekb: 1,
            modestbranding: 1,
            rel: 0,
          },
          events: {
            onReady: () => console.log('YouTube Player ready'),
          },
        });
      };
    };

    helper();

    return () => {
      ytPlayer.current?.destroy();
    };
  }, [params.id]);

  const handlePlay = () => ytPlayer.current?.playVideo();
  const handlePause = () => ytPlayer.current?.pauseVideo();
  
  const handleSeek = () => {
    const seconds = parseFloat(timeInput);
    if (!isNaN(seconds)) {
      ytPlayer.current?.seekTo(seconds, true);
    }
  };

  const handleLoadVideo = async () => {
    if (videoId && videoId !== currentVideoId.current && ytPlayer.current) {
      currentVideoId.current = videoId;
      ytPlayer.current.loadVideoById(videoId);
    } else {
      return
    }
    console.log("updating", videoId)
    await updateChannel(params.id, videoId); // Triggers realtime update
    // Local load handled by useEffect
  };

  const manualLoadVideo = (vid: string) => {
    ytPlayer.current.loadVideoById(vid);
  }

  return (
    <div style={{ padding: 32, maxWidth: 1000, margin: '0 auto' }}>
      <Title level={3}>Lumiroom Cinema</Title>

      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <div id="yt-player" ref={playerRef}></div>
        
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '1000px',
            height: '480px',
            zIndex: 10,
            backgroundColor: 'transparent',
            pointerEvents: 'all',
          }}
          onClick={(e) => {
            e.preventDefault();
            message.info('Shared screen - use controls below');
          }}
        />
      </div>

      <Divider />

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
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