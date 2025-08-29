"use client"

import ChatRoom from '@/components/ChatRoom';
import GateLoadingCSS from '@/components/GateLoading';
import GlobalApp from '@/components/GlobalApp';
import globalStore from '@/store';
import { SupabaseUser } from '@/types/datatypes';
import { checkRoom } from '@/utils/messaging/messages';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RoomPage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  // const [user, setUser] = useState<SupabaseUser>(null!)
  const [roomId, setRoomId] = useState<string>("")

  useEffect(() => {
    if (pathname !== "/togethere") return;
    const loadData = async () => {
      try {
        const u = await globalStore.getItem<SupabaseUser>('lumiroom-user')
        const roomId = await globalStore.getItem<string>('lumiroom-room')
        setIsLoading(true);

        if (!u || !u.id) {
          router.push("/");
          return
        }
        if (!roomId) {
          router.push(`/`);
          return
        }
        // setUser(u)
        setRoomId(roomId)
        if (!await checkRoom(roomId!)) {
          throw new Error("the room does not exist")
        }
      } catch (error) {
        console.error('Error loading room:', error);
        router.push(`/`);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [router, pathname]);

  if (isLoading) {
    return <GateLoadingCSS/>
  }

  return (
    <GlobalApp>
      <ChatRoom chatroomId={roomId!} />
    </GlobalApp>
  )
}