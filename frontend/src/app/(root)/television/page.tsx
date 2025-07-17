"use client"

import ChatRoomWithTV from '@/components/ChatRoomWithTV';
import GateLoadingCSS from '@/components/GateLoading';
import { useGlobalStore } from '@/store';
// import { PlayList } from '@/components/PlayList';
import { RoomEntry } from '@/types/datatypes';
import { getRoom } from '@/utils/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RoomPage() {
  const roomId = useGlobalStore.getState().roomId;
  const [room, setRoom] = useState<RoomEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user } = useGlobalStore.getState();

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        if (!user || !user.id) {
          router.push("/");
        }
        if (!roomId) {
          router.push(`/`);
        }
        
        const roomData = await getRoom(roomId!);
        setRoom(roomData);
      } catch (error) {
        console.error('Error loading room:', error);
        router.push(`/`);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [router, user]);

  if (isLoading) {
    return <GateLoadingCSS/>
  }

  if (!room) {
    router.push(`/`);
  }

  return (
    <>
      <ChatRoomWithTV chatroomId={roomId!} />;
    </>
  )
}