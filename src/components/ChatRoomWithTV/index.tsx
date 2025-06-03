'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Layout, Input, Button, List, Avatar, Typography, Badge, Space, message } from 'antd';
import { Message } from '@/types/datatypes';
import { insertChatHistory } from '@/utils/api';
import { addMessageToChatroom, getMessagesFromChatroom } from '@/utils/redis';
import { supabase } from '@/lib/supabase';
import { GameStateProvider } from '@/game/state/GameState';
import Television from '../Television';

const HUD = dynamic(() => import('@/components/Game/UI/Overlay/HUD'), { ssr: false });
const Game = dynamic(() => import('@/components/Game'), {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  let theReceiver: any = null;

  // 初始化聊天
  useEffect(() => {
    const loadInitialMessages = async () => {
      try {
        const data = await getMessagesFromChatroom(chatroomId);
        setMessages(data);
      } catch (err) {
        message.error('Failed to load initial messages');
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

      const presenceTrack = supabase.channel(`room:${chatroomId}`, {
        config: { presence: { key: user.id } }
      })
        .on('presence', { event: 'sync' }, () => {
          const state = presenceTrack.presenceState();
          setOnlineUsers(Object.keys(state));
        })
        .on('presence', { event: 'join' }, ({ key }) => {
          // message.info(`User ${key.slice(0, 6)} joined`);
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          // message.info(`User ${key.slice(0, 6)} left`);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceTrack.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
          }
        });

      const messageSub = supabase.channel(`messages:${chatroomId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_history',
          filter: `chat_room_id=eq.${chatroomId}`,
        }, (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.speaker !== user.id) {
            setMessages(prev => [...prev, newMsg]);
          }
          if (theReceiver) {
            theReceiver(newMsg)
          }
        })
        .subscribe();

      loadInitialMessages();

      return () => {
        presenceTrack.unsubscribe();
        messageSub.unsubscribe();
      };
    };

    setupRealtime();
  }, [chatroomId, user, router]);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addReceiver = (receiver: any) => {
    theReceiver = receiver;
  }

  const handleSend = async (theMessage: string) => {
    if (!theMessage.trim() || isSending) return;

    setIsSending(true);

    const messageObj: Message = {
      speaker: userId,
      speaker_name: nickname,
      chat_message: theMessage,
      time: new Date().toISOString(),
      is_optimistic: true,
      chat_room_id: chatroomId
    };

    try {
      await addMessageToChatroom(chatroomId, messageObj);
      setMessages((prev) => [...prev, messageObj]);
      setNewMessage('');

      setTimeout(async () => {
        try {
          await insertChatHistory({
            speaker: userId,
            chat_message: theMessage,
            speaker_name: nickname,
            chat_room_id: chatroomId
          });

          setMessages(prev =>
            prev.map(msg =>
              msg.time === messageObj.time ? { ...msg, is_optimistic: false } : msg
            )
          );
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

  return (
    <Layout style={{ height: '100vh' }}>
      {/* 左侧聊天栏 */}
      <Sider width="33.33%" theme="light" style={{ borderRight: '1px solid #f0f0f0', overflow: 'hidden' }}>
        <Header style={{ background: "#fff", padding: "16px", borderBottom: '1px solid #f0f0f0' }}>
          <Space direction="vertical">
            <Title level={5} style={{ margin: 0 }}>Chat Room: {chatroomId}</Title>
            <Text type="secondary">
              <Badge color="green" /> {onlineUsers.length} online
            </Text>
          </Space>
        </Header>

        <Content style={{ padding: '16px', overflowY: 'auto' }}>
          <List
            dataSource={messages}
            renderItem={(item) => (
              <List.Item
                style={{
                  backgroundColor: item.speaker === userId ? "#e6f7ff" : undefined,
                  opacity: item.is_optimistic ? 0.6 : 1,
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
                        {new Date(item.time).toLocaleTimeString()}
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

        <Footer style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid #f0f0f0' }}>
          <Input.Group compact style={{ display: 'flex' }}>
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
          </Input.Group>
        </Footer>
      </Sider>

      {/* 右侧游戏栏 */}
      <Layout>
        <Content style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
          <Television sendMessage={handleSend} addReceiver={addReceiver}></Television>
        </Content>
      </Layout>
    </Layout>
  );
}
