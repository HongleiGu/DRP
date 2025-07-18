"use client"

import ChatRoomWithTV from '@/components/ChatRoomWithTV';
import GateLoadingCSS from '@/components/GateLoading';
import globalStore from '@/store';
// import { useGlobalStore } from '@/store';
// import { PlayList } from '@/components/PlayList';
import { RoomEntry, SupabaseUser } from '@/types/datatypes';
import { getRoom } from '@/utils/api';
// import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RoomPage() {
  const [room, setRoom] = useState<RoomEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // const router = useRouter();
  const [user, setUser] = useState<SupabaseUser>(null!)
  const [roomId, setRoomId] = useState<string>("")

  useEffect(() => {
    const loadData = async () => {
      try {
        const u = JSON.parse(await globalStore.getItem('lumiroom-user') ?? "{}") as SupabaseUser
        const roomId = await globalStore.getItem('lumiroom-room')
        setIsLoading(true);

        if (!u || !u.id) {
          window.location.href = "/"
          // router.push("/");
          return
        }
        if (!roomId) {
          window.location.href = "/"
          // router.push(`/`);
          return
        }
        setUser(u)
        setRoomId(roomId)
        
        const roomData = await getRoom(roomId!);
        setRoom(roomData);
      } catch (error) {
        console.error('Error loading room:', error);
        // router.push(`/`);
        window.location.href = "/"
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  if (isLoading) {
    return <GateLoadingCSS/>
  }

  if (!room) {
    // router.push(`/`);
    window.location.href = "/"
  }

  return (
    <>
      <ChatRoomWithTV chatroomId={roomId!} />;
    </>
  )
}