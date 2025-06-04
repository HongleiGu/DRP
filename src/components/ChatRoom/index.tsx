'use client';

import { useState, useEffect, useRef } from 'react';
import { Input, Button, List, Avatar, message, Layout, Card, Typography } from 'antd';
import { Message } from '@/types/datatypes';
import { getMessages, insertChatHistory } from '@/utils/api';
// import { addMessageToChatroom, getMessagesFromChatroom } from '@/utils/redis';
// import { getUserId } from '@/utils/user';
// import { isValidUUID } from '@/utils/utils';
// import { clerkClient } from '@clerk/nextjs/server';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUser } from '@clerk/nextjs';
import { Content, Header } from 'antd/es/layout/layout';
const { Text } = Typography;

export default function ChatRoom({ chatroomId }: { chatroomId: string }) {
  const [userId, setUserId] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  // Load initial messages and setup Supabase subscription
  useEffect(() => {
    const loadInitialMessages = async () => {
      try {
        const data = await getMessages(chatroomId);
        console.log(data[0].created_at, data[0].created_at instanceof Date)
        setMessages(data);
      } catch (error) {
        console.error('Failed to load messages:', error);
        message.error('Failed to load initial messages');
      }
    };

    const setupRealtime = async () => {
      if (!user?.id) {
        alert("user invalid");
        router.push("/");
        return;
      }

      setUserId(user.id);
      
      if (user?.publicMetadata?.nickname) {
        setNickname(user.publicMetadata.nickname as string);
      } else {
        alert("your nickname is not set");
        router.push("/onboarding");
        return;
      }

      // Track user presence
      const presenceTrack = supabase.channel(`room:${chatroomId}`, {
        config: {
          presence: {
            key: user.id,
          },
        },
      })
      .on('presence', { event: 'sync' }, () => {
        const state = presenceTrack.presenceState();
        const userIds = Object.keys(state);
        setOnlineUsers(userIds);
      })
      // .on('presence', { event: 'join' }, ({ key }) => {
      //   message.info(`User ${key.substring(0, 6)} joined`);
      // })
      // .on('presence', { event: 'leave' }, ({ key }) => {
      //   message.info(`User ${key.substring(0, 6)} left`);
      // })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceTrack.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

      // Subscribe to new messages
      const messageSubscription = supabase
        .channel(`messages:${chatroomId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_history',
            filter: `chat_room_id=eq.${chatroomId}`,
          },
          (payload) => {
            console.log(payload.new)
            const newMessage = payload.new as Message;
            // Skip if this is our own optimistic message
            if (newMessage.speaker !== user.id) {
              setMessages((prev) => [...prev, newMessage]);
            }
          }
        )
        .subscribe();

      loadInitialMessages();

      return () => {
        presenceTrack.unsubscribe();
        messageSubscription.unsubscribe();
      };
    };

    setupRealtime();
  }, [chatroomId, user, router]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    
    // Create message object with optimistic flag
    const messageObj: Message = {
      speaker: userId,
      speaker_name: nickname,
      chat_message: newMessage,
      created_at: new Date(),
      is_optimistic: true, // Mark as optimistic
      chat_room_id: chatroomId
    };

    try {
      // 1. Add to Redis immediately (fast operation)
      // no supabase should be fast enough
      // await addMessageToChatroom(chatroomId, messageObj);
      
      // 2. Add to local messages immediately (optimistic UI)
      setMessages((prev) => [...prev, messageObj]);
      setNewMessage('');

      // 3. Queue PostgreSQL insertion in the background
      setTimeout(async () => {
        try {
          await insertChatHistory({
            speaker: userId,
            chat_message: newMessage,
            speaker_name: nickname,
            chat_room_id: chatroomId,
            created_at: new Date(),
          } as Message);
          
          // Update message to remove optimistic flag
          setMessages(prev => prev.map(msg => 
            msg.created_at === messageObj.created_at ? {...msg, is_optimistic: false} : msg
          ));
        } catch (psqlError) {
          console.error('Failed to persist to PostgreSQL:', psqlError);
          message.warning('Message saved temporarily but failed to persist long-term');
        }
      }, 0);
    } catch (redisError) {
      console.error('Failed to save to Redis:', redisError);
      message.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  return (
  <Layout style={{ minHeight: '100vh' }}>
    <Header
      style={{
        background: '#001529',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '12px 24px',
      }}
    >
      <Text style={{ color: '#fff', fontSize: 20, fontWeight: 500 }}>
        💬 Chat Room: {chatroomId}
      </Text>
      <Text style={{ color: '#d9d9d9', fontSize: 14 }}>
        {onlineUsers.length} user{onlineUsers.length !== 1 ? 's' : ''} online
      </Text>
    </Header>

    <Content style={{ padding: '24px', background: '#f0f2f5' }}>
      <Card
        style={{
          maxWidth: 800,
          margin: '0 auto',
          height: '70vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 12,
        }}
        styles={{
          body:{
            padding: '16px', 
            overflowY: 'auto',
            flex: 1 
          }
        }}
      >
        <List
          dataSource={messages}
          renderItem={(item) => (
            <List.Item
              style={{
                backgroundColor: item.speaker === userId ? '#e6f7ff' : 'white',
                borderRadius: 8,
                opacity: item.is_optimistic ? 0.6 : 1,
                marginBottom: 8,
                padding: 12,
              }}
            >
              <List.Item.Meta
                avatar={<Avatar>{item.speaker_name?.charAt(0)}</Avatar>}
                title={
                  <Text strong>
                    {item.speaker_name}{' '}
                    <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                      {item.created_at.toLocaleTimeString()}
                    </Text>
                  </Text>
                }
                description={item.chat_message}
              />
            </List.Item>
          )}
        />
        <div ref={messagesEndRef} />
      </Card>

      <Card
        style={{
          maxWidth: 800,
          margin: '16px auto 0',
          borderRadius: 12,
        }}
        styles={{
          body: { display: 'flex', padding: '16px' }
        }}
      >
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onPressEnter={handleSend}
          disabled={isSending}
          style={{ borderRadius: 8 }}
        />
        <Button
          type="primary"
          onClick={handleSend}
          disabled={!newMessage.trim() || isSending}
          loading={isSending}
          style={{ marginLeft: 12, borderRadius: 8 }}
        >
          Send
        </Button>
      </Card>
    </Content>
  </Layout>
);
}