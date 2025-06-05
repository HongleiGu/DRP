/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Layout, Input, Button, List, Avatar, Typography, Badge, Space, message } from 'antd';
import { Message } from '@/types/datatypes';
import { addVideoToPlaylist, getMessages, getPlaylist,  insertChatHistory, removeVideoFromPlaylist } from '@/utils/api';
import { supabase } from '@/lib/supabase';
import Television from '../Television';
import { PlayList, VideoElement } from '../PlayList';

const HUD = dynamic(() => import('@/components/Lumiroom/UI/Overlay/HUD'), { ssr: false });
const Game = dynamic(() => import('@/components/Lumiroom'), {
  ssr: false,
  loading: () => <div className="text-center p-8">Loading game...</div>,
});

const { Header, Content, Footer, Sider } = Layout;
const { Title, Text } = Typography;

export default function ChatRoom({ chatroomId }: { chatroomId: string }) {
  const [userId, setUserId] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [playlistVisible, setPlaylistVisible] = useState<boolean>(false);
  const [videos, setVideos] = useState<VideoElement[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  let theReceiver: any = null;

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load messages
        const messageData = await getMessages(chatroomId);
        setMessages(messageData);
        
        // Load playlist
        const vs = await getPlaylist(chatroomId)
        setVideos(vs);
      } catch (err) {
        message.error('Failed to load initial data');
      }
    };

    const setupRealtime = async () => {
      if (!user?.id) {
        message.error("User invalid");
        router.push("/");
        return;
      }

      setUserId(user.id);

      if (user.publicMetadata?.nickname) {
        setNickname(user.publicMetadata.nickname as string);
      } else {
        message.warning("Nickname not set");
        router.push("/onboarding");
        return;
      }

      // Presence tracking
      const presenceTrack = supabase.channel(`room:${chatroomId}`, {
        config: { presence: { key: user.id } }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = presenceTrack.presenceState();
        setOnlineUsers(Object.keys(state));
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        message.info(`User ${key.slice(0, 6)} joined`);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        message.info(`User ${key.slice(0, 6)} left`);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceTrack.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

      // Message subscription
      const messageSub = supabase.channel(`messages:${chatroomId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_history',
          filter: `chat_room_id=eq.${chatroomId}`,
        }, (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.speaker !== user.id) {
            if (!newMsg.chat_message.startsWith("/")) {
              setMessages(prev => [...prev, newMsg]);
            }
          }
          if (theReceiver) {
            theReceiver(newMsg);
          }
        })
        .subscribe();

      // Playlist subscription
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

      loadInitialData();

      return () => {
        messageSub.unsubscribe();
        playlistSub.unsubscribe();
      };
    };

    setupRealtime();
  }, [chatroomId, user, router, theReceiver]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addReceiver = (receiver: any) => {
    theReceiver = receiver;
  };

  const handleSend = async (theMessage: string) => {
    if (!theMessage.trim() || isSending) return;

    setIsSending(true);

    const messageObj: Message = {
      speaker: userId,
      speaker_name: nickname,
      chat_message: theMessage,
      created_at: new Date().toISOString(),
      chat_room_id: chatroomId
    };

    try {
      setMessages((prev) => {
        if (messageObj.chat_message.startsWith("/")) {
          return prev;
        }
        return [...prev, messageObj];
      });
      setNewMessage('');

      setTimeout(async () => {
        try {
          await insertChatHistory(messageObj);
        } catch {
          message.warning('Saved locally but failed to persist');
        }
      }, 0);
    } catch (err) {
      message.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const addVideo = async (video: VideoElement) => {
    const newVideos = [...videos, video];
    setVideos(newVideos);
    await addVideoToPlaylist(chatroomId, video);
  };

  const removeVideo = async (index: number) => {
    const newVideos = videos.filter((_, i) => i !== index);
    const deleted = videos.filter((_, i) => i === index)[0]
    setVideos(newVideos);
    await removeVideoFromPlaylist(chatroomId, deleted.vid);
  };

  return (
    <Layout style={{ height: '100vh', position: 'relative' }}>
      {/* Left Chat Panel */}
      <Sider 
        width="33.33%" 
        theme="light" 
        style={{ 
          borderRight: '1px solid #f0f0f0', 
          overflow: 'hidden',
          height: '100vh',
          position: 'relative'
        }}
      >
        <Header style={{ 
          background: "#fff", 
          padding: "16px", 
          borderBottom: '1px solid #f0f0f0',
          position: 'sticky',
          top: 0,
          zIndex: 1
        }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Title level={5} style={{ margin: 0 }}>Chat Room: {chatroomId}</Title>
            <Text type="secondary">
              <Badge color="green" /> {onlineUsers.length} online
            </Text>
          </Space>
        </Header>

        <Content style={{ 
          padding: '16px', 
          overflowY: 'auto',
          height: 'calc(100vh - 120px)'
        }}>
          <List
            dataSource={messages}
            renderItem={(item) => (
              <List.Item
                style={{
                  backgroundColor: item.speaker === userId ? "#e6f7ff" : undefined,
                  borderRadius: 8,
                  marginBottom: 8,
                  padding: 12,
                }}
              >
                <List.Item.Meta
                  avatar={<Avatar>{item.speaker_name?.charAt(0)}</Avatar>}
                  title={
                    <Space>
                      <Text strong>{item.speaker_name}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(item.created_at).toLocaleTimeString()}
                      </Text>
                    </Space>
                  }
                  description={item.chat_message}
                />
              </List.Item>
            )}
          />
          <div ref={messagesEndRef} />
        </Content>

        <Footer style={{ 
          padding: '12px 16px', 
          background: '#fff', 
          borderTop: '1px solid #f0f0f0',
          position: 'sticky',
          bottom: 0
        }}>
          <Space.Compact style={{ display: 'flex' }}>
            <Input
              style={{ flex: 1 }}
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onPressEnter={() => handleSend(newMessage)}
              disabled={isSending}
            />
            <Button
              type="primary"
              onClick={() => handleSend(newMessage)}
              disabled={!newMessage.trim() || isSending}
              loading={isSending}
            >
              Send
            </Button>
          </Space.Compact>
        </Footer>
      </Sider>

      {/* Right Game Panel */}
      <Layout style={{ height: '100vh' }}>
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
