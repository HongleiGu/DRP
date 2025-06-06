/* eslint-disable @typescript-eslint/no-explicit-any */

"use client"
import { useEffect, useRef, useState } from "react";
import { VideoElement } from "../PlayList";
import { getPlaylist } from "@/utils/api";
import { Layout, message} from "antd";
// import { Content } from "antd/es/layout/layout";
import Television from "../Television";
import ChatPanel from "../ChatPanel";
import { supabase } from "@/lib/supabase";

// const { Content } = Layout;

export default function ChatRoom({ chatroomId }: { chatroomId: string }) {
  const sendMessage = useRef<((msg: any) => void) | null>(null);
  const receiveMessage = useRef<((msg: any) => void) | null>(null);
  // const [playlistVisible, setPlaylistVisible] = useState<boolean>(false);
  const [videos, setVideos] = useState<VideoElement[]>([]);
  const [chatPanelVisible, setChatPanelVisible] = useState(true);
  // const theReceiver: any = null;

  // Load playlist
  useEffect(() => {
    const loadPlaylist = async () => {
      try {
        const vs = await getPlaylist(chatroomId);
        setVideos(vs);
      } catch {
        message.error('Failed to load playlist');
      }
    };

    // Setup playlist subscription
    const playlistSub = supabase.channel(`playlist:${chatroomId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'playlists',
        filter: `chatroom_id=eq.${chatroomId}`,
      }, (payload) => {
        const newPlaylist = payload.new as { videos: VideoElement[] };
        setVideos(newPlaylist.videos);
      })
      .subscribe();

    loadPlaylist();

    return () => {
      playlistSub.unsubscribe();
    };
  }, [chatroomId]);

  // const addReceiver = (receiver: any) => {
  //   theReceiver = receiver;
  // };

  // const handleSend = (theMessage: string) => {
  //   if (theReceiver) {
  //     theReceiver({
  //       chat_message: theMessage,
  //       created_at: new Date().toISOString()
  //     });
  //   }
  // };

  // const addVideo = async (video: VideoElement) => {
  //   const newVideos = [...videos, video];
  //   setVideos(newVideos);
  //   await addVideoToPlaylist(chatroomId, video);
  // };

  // const removeVideo = async (index: number) => {
  //   const newVideos = videos.filter((_, i) => i !== index);
  //   const deleted = videos.filter((_, i) => i === index)[0];
  //   setVideos(newVideos);
  //   await removeVideoFromPlaylist(chatroomId, deleted.vid);
  // };

  return (
    <div style={{ display: "flex", flexDirection: "row", height: '100vh', width: '100vw', position: 'fixed' }}>

      {/* Left Chat Panel */}
      {chatPanelVisible && (
        <div style={{
          flex: 3,
          display: "flex"
        }}>
          <ChatPanel
            chatroomId={chatroomId}
            onMount={(sendFn) => (sendMessage.current = sendFn)}
            receiveMessage={(msg) => receiveMessage.current?.(msg)}
          />
        </div>
      )}

      {/* Right Game Panel */}
      <div style={{
          flex: 7,
          backgroundColor: '#fff',
          display: "flex"
      }}>
          <Television
            onMount={(receiveFn: any) => (receiveMessage.current = receiveFn)}
            sendMessage={(msg: any) => sendMessage.current?.(msg)}
            playList={videos}
            chatPanelVisible={chatPanelVisible}
            setChatPanelVisible={setChatPanelVisible}
            chatroomId={chatroomId}
          />
      </div>

      {/* Playlist Floating Button
      <PlayList
        chatroomId={chatroomId}
        visible={playlistVisible}
        setVisible={setPlaylistVisible}
        videos={videos}
        addVideos={addVideo}
        removeVideo={removeVideo}
        setVideos={setVideos}
      /> */}
    </div>
  );
}