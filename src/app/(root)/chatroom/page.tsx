// so the design is, when the user logins enter and confirms entering the app, this is the page they should join
// room id == chat id ==(in the furture)== call id


'use client'

import { Button, Input, message } from 'antd';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';
import { createRoom, getRoom } from '@/utils/api';

const uuidSchema = z.string().uuid({
  message: "Invalid UUID format"
});

export default function Page() {
  const router = useRouter();
  const [value, setValue] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const validateUUID = (input: string): boolean => {
    try {
      uuidSchema.parse(input);
      setError(null);
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      }
      return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setValue(input);
    validateUUID(input);
  };

  const handleJoinChatRoom = async () => {
    if (!validateUUID(value)) return;
    
    setJoinLoading(true);
    try {
      const chatroom = await getRoom(value);
      if (chatroom) {
        // so the chat room should be included in the game page
        router.push(`/game/${value}`);
      } else {
        message.error('Chatroom does not exist');
      }
    } catch {
      message.error('Failed to fetch chatroom');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCreateChatRoom = async () => {
    setCreateLoading(true);
    try {
      const chatroomId = await createRoom();
      if (chatroomId) {
        // so the chat room should be included in the game page
        router.push(`/game/${chatroomId}`);
      }
    } catch {
      message.error('Failed to create room');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-xl font-bold mb-4">Enter Room ID</h1>
      
      <Input
        placeholder="Enter UUID chatroom ID"
        value={value}
        onChange={handleInputChange}
        className="mb-2"
      />
      
      {error && (
        <p className="text-red-500 text-sm mb-2">{error}</p>
      )}
      
      <Button
        onClick={handleJoinChatRoom}
        loading={joinLoading}
        disabled={!!error || value.length === 0}
        className={`w-full py-2 px-4 rounded mb-4 ${
          error || value.length === 0 
            ? 'bg-gray-300 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        Join Chatroom
      </Button>

      <div className="relative flex items-center my-4">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="flex-shrink mx-4 text-gray-400">OR</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>
      
      <Button
        onClick={handleCreateChatRoom}
        loading={createLoading}
        className="w-full py-2 px-4 rounded bg-green-500 hover:bg-green-600 text-white"
      >
        Create New Chatroom
      </Button>
    </div>
  );
}