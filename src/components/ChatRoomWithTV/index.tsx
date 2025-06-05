import { useEffect, useState } from "react";
import { PlayList, VideoElement } from "../PlayList";
import { addVideoToPlaylist, getPlaylist, removeVideoFromPlaylist } from "@/utils/api";
import { Button, Layout, message} from "antd";
// import { Content } from "antd/es/layout/layout";
import Television from "../Television";
import ChatPanel from "../ChatPanel";
import { supabase } from "@/lib/supabase";

const { Content } = Layout;

export default function ChatRoom({ chatroomId }: { chatroomId: string }) {
  const [playlistVisible, setPlaylistVisible] = useState<boolean>(false);
  const [videos, setVideos] = useState<VideoElement[]>([]);
  const [chatPanelVisible, setChatPanelVisible] = useState(true);
  let theReceiver: any = null;

  // Load playlist
  useEffect(() => {
    const loadPlaylist = async () => {
      try {
        const vs = await getPlaylist(chatroomId);
        setVideos(vs);
      } catch (err) {
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

  const addReceiver = (receiver: any) => {
    theReceiver = receiver;
  };

  const handleSend = (theMessage: string) => {
    if (theReceiver) {
      theReceiver({
        chat_message: theMessage,
        created_at: new Date().toISOString()
      });
    }
  };

  const addVideo = async (video: VideoElement) => {
    const newVideos = [...videos, video];
    setVideos(newVideos);
    await addVideoToPlaylist(chatroomId, video);
  };

  const removeVideo = async (index: number) => {
    const newVideos = videos.filter((_, i) => i !== index);
    const deleted = videos.filter((_, i) => i === index)[0];
    setVideos(newVideos);
    await removeVideoFromPlaylist(chatroomId, deleted.vid);
  };

  return (
    <Layout style={{ height: '100vh', position: 'relative' }}>
      
      {/* Left Chat Panel */}
      {chatPanelVisible && (
        <ChatPanel
          chatroomId={chatroomId}
          onSend={handleSend}
        />
      )}

      {/* Right Game Panel */}
      <Layout style={{ height: '100vh', marginLeft: chatPanelVisible ? 300 : 0 }}>
        <Content style={{ 
          height: '100%', 
          position: 'relative', 
          overflow: 'hidden',
          backgroundColor: '#fff'
        }}>
          <Television 
            sendMessage={handleSend} 
            addReceiver={addReceiver}
            playList={videos}
          />
        </Content>
      </Layout>

      {/* Chat Panel Toggle Button */}
      <Button 
        type="primary" 
        shape="circle" 
        size="large"
        style={{ position: 'fixed', top: 20, left: chatPanelVisible ? 320 : 20, zIndex: 1000 }}
        onClick={() => setChatPanelVisible(!chatPanelVisible)}
      >
        {chatPanelVisible ? '<' : '>'}
      </Button>

      {/* Playlist Floating Button */}
      <PlayList 
        chatroomId={chatroomId}
        visible={playlistVisible}
        setVisible={setPlaylistVisible}
        videos={videos}
        addVideos={addVideo}
        removeVideo={removeVideo} 
        setVideos={setVideos}
      />
    </Layout>
  );
}