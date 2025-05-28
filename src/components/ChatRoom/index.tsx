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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const helper = async () => {
      const data = await getMessagesFromChatroom(chatroomId)
      setMessages(data)
    }
    helper()
  })

  // Initialize socket connection
  useEffect(() => {
    const helper = async () => {
      setUserId(await getUserId())
    }
    helper()
    const newSocket = io({
      path: '/api/socket/io',
    });

    setSocket(newSocket);

    // Join room on connection
    newSocket.on('connect', () => {
      newSocket.emit('join', chatroomId);
    });

    // Listen for messages
    // this should not need to update to psql as it is updated on the other side when they send the msg
    newSocket.on('receive-message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
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
  }, [chatroomId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !socket) return;

    // Send message to server
    socket.emit('send-message', {
      chatroomId,
      chat_message: newMessage,
    });

    const messageObj = {
      speaker: userId,
      chat_message: newMessage
    } as Message

    // update to psql
    await insertChatHistory({
      speaker: userId,
      chat_message: newMessage
    } as Message);

    await addMessageToChatroom(chatroomId, messageObj)

    // Add to local messages immediately
    setMessages((prev) => [
      ...prev,
      messageObj
    ]);

    setNewMessage('');
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
            <List.Item className={item.speaker === 'You' ? 'bg-blue-50' : ''}>
              <List.Item.Meta
                avatar={<Avatar>{item.speaker.charAt(0)}</Avatar>}
                title={item.speaker}
                description={item.chat_message}
              />
              {item.time ? <div className="text-xs text-gray-400">
                {new Date(item.time).toLocaleTimeString()}
              </div> : null}
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
        />
        <Button
          type="primary"
          onClick={handleSend}
          className="ml-2"
          disabled={!newMessage.trim()}
        >
          Send
        </Button>
      </div>
    </div>
  );
}