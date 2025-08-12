"use client"

import ChatRoom from '@/components/ChatRoom';
import GateLoadingCSS from '@/components/GateLoading';
import globalStore from '@/store';
import { SupabaseUser } from '@/types/datatypes';
import { checkRoom } from '@/utils/messages';
import { useEffect, useState } from 'react';

export default function RoomPage() {
  const [isLoading, setIsLoading] = useState(true);
  // const router = useRouter();
  // const [user, setUser] = useState<SupabaseUser>(null!)
  const [roomId, setRoomId] = useState<string>("")

  useEffect(() => {
    const loadData = async () => {
      try {
        const u = await globalStore.getItem<SupabaseUser>('lumiroom-user')
        const roomId = await globalStore.getItem<string>('lumiroom-room')
        console.log(u, roomId)
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
        // setUser(u)
        setRoomId(roomId)
        
        if (await checkRoom(roomId!)) {
          throw new Error("the room does not exist")
        }
      } catch (error) {
        console.error('Error loading room:', error);
        // router.push(`/`);
        window.location.href = "/"
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return <GateLoadingCSS/>
  }

  return (
    <>
      <ChatRoom chatroomId={roomId!} />;
    </>
  )
}