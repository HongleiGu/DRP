"use client"

// import ChatPanel from '@/components/ChatPanel/index';
import ChatRoom from '@/components/ChatRoom';
import { Message } from '@/types/datatypes';
import { getRoom } from '@/utils/api';
import { getUserId } from '@/utils/user';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';

const DEFAULT_ROOM = '00000000-0000-0000-0000-000000000001' as const;

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const [param, setParam] = useState<string>("");
  const [room, setRoom] = useState<Message[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Await both the user ID and params
        const [userId, resolvedParams] = await Promise.all([
          getUserId(),
          params
        ]);

        if (!userId) {
          redirect("/");
        }

        const roomId = resolvedParams.id;
        setParam(roomId);
        
        const roomData = await getRoom(roomId);
        setRoom(roomData);
      } catch (error) {
        console.error('Error loading room:', error);
        redirect(`/lumiroom/${DEFAULT_ROOM}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [params]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!room) {
    redirect(`/lumiroom/${DEFAULT_ROOM}`);
  }

  return <ChatRoom chatroomId={param} />;
}