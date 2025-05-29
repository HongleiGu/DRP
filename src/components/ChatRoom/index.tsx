// components/ChatRoom.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Input, Button, List, Avatar, message } from 'antd';
import { io, Socket } from 'socket.io-client';
import { Message } from '@/types/datatypes';
import { insertChatHistory } from '@/utils/api';
import { addMessageToChatroom, getMessagesFromChatroom } from '@/utils/redis';
import { getUserId } from '@/utils/user';

export default function ChatRoom({ chatroomId }: { chatroomId: string }) {
  const [userId, setUserId] = useState<string>("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadInitialMessages = async () => {
      try {
        const data = await getMessagesFromChatroom(chatroomId);
        setMessages(data);
      } catch (error) {
        console.error('Failed to load messages:', error);
        message.error('Failed to load initial messages');
      }
    };
    loadInitialMessages();
  }, [chatroomId]);

  // Initialize socket connection
  useEffect(() => {
    const initSocket = async () => {
      const id = await getUserId();
      setUserId(id);
      
      const newSocket = io({
        path: '/api/socket/io',
      });

      setSocket(newSocket);

      // Join room on connection
      newSocket.on('connect', () => {
        newSocket.emit('join', chatroomId);
      });

      // Listen for messages
      newSocket.on('receive-message', (msg: Message) => {
        // Skip if this is our own optimistic message
        if (!msg.isOptimistic) {
          setMessages((prev) => [...prev, msg]);
        }
      });

      // Listen for user connections
      newSocket.on('user-connected', (userId: string) => {
        setUsers((prev) => [...prev, userId]);
        message.info(`User ${userId.substring(0, 6)} joined`);
      });

      // Listen for user disconnections
      newSocket.on('user-disconnected', (userId: string) => {
        setUsers((prev) => prev.filter(id => id !== userId));
        message.info(`User ${userId.substring(0, 6)} left`);
      });

      // Clean up on unmount
      return () => {
        newSocket.disconnect();
      };
    };

    initSocket();
  }, [chatroomId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !socket || isSending) return;

    setIsSending(true);
    
    // Create message object with optimistic flag
    const messageObj: Message = {
      speaker: userId,
      chat_message: newMessage,
      time: new Date().toISOString(),
      isOptimistic: true  // Mark as optimistic
    };

    try {
      // 1. Add to Redis immediately (fast operation)
      await addMessageToChatroom(chatroomId, messageObj);
      
      // 2. Add to local messages immediately (optimistic UI)
      setMessages((prev) => [...prev, messageObj]);
      setNewMessage('');

      // 3. Send message to server via socket
      socket.emit('send-message', {
        chatroomId,
        chat_message: newMessage,
      });

      // 4. Queue PostgreSQL insertion in the background
      setTimeout(async () => {
        try {
          await insertChatHistory({
            speaker: userId,
            chat_message: newMessage,
            isOptimistic: false // this is not stored anyway
          });
          
          // Update message to remove optimistic flag
          setMessages(prev => prev.map(msg => 
            msg === messageObj ? {...msg, isOptimistic: false} : msg
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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white shadow">
        <h1 className="text-xl font-bold">Chat Room: {chatroomId}</h1>
        <p className="text-sm text-gray-500">
          {users.length} user{users.length !== 1 ? 's' : ''} online
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <List
          dataSource={messages}
          renderItem={(item) => (
            <List.Item 
              className={item.speaker === userId ? 'bg-blue-50' : ''}
              style={item.isOptimistic ? { opacity: 0.7 } : {}}
            >
              <List.Item.Meta
                avatar={<Avatar>{item.speaker.charAt(0)}</Avatar>}
                title={item.speaker}
                description={item.chat_message}
              />
              <div className="flex flex-col items-end">
                {item.time && (
                  <div className="text-xs text-gray-400">
                    {new Date(item.time).toLocaleTimeString()}
                  </div>
                )}
                {item.isOptimistic && (
                  <div className="text-xs text-yellow-500">Sending...</div>
                )}
              </div>
            </List.Item>
          )}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-white border-t flex">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onPressEnter={handleSend}
          disabled={isSending}
        />
        <Button
          type="primary"
          onClick={handleSend}
          className="ml-2"
          disabled={!newMessage.trim() || isSending}
          loading={isSending}
        >
          Send
        </Button>
      </div>
    </div>
  );
}