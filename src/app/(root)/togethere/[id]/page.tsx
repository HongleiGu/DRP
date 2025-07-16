"use client"

import ChatRoom from '@/components/ChatRoom';
import GateLoadingCSS from '@/components/GateLoading';
import { useGlobalStore } from '@/store';
// import { PlayList } from '@/components/PlayList';
import { RoomEntry } from '@/types/datatypes';
import { getRoom } from '@/utils/api';
import { PROJECT_NAME } from '@/utils/utils';
import { redirect } from 'next/navigation';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const DEFAULT_ROOM = '00000000-0000-0000-0000-000000000001' as const;

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const [param, setParam] = useState<string>("");
  const [room, setRoom] = useState<RoomEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user } = useGlobalStore.getState();

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Await both the user ID and params
        const resolvedParams = await params

        if (!user || !user.id) {
          router.push("/");
        }

        const roomId = resolvedParams.id;
        setParam(roomId);
        
        const roomData = await getRoom(roomId);
        setRoom(roomData);
      } catch (error) {
        console.error('Error loading room:', error);
        router.push(`/${PROJECT_NAME}/${DEFAULT_ROOM}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [params, router, user]);

  if (isLoading) {
    return <GateLoadingCSS/>
  }

  if (!room) {
    redirect(`/${PROJECT_NAME}/${DEFAULT_ROOM}`);
  }

  return (
    <>
      <ChatRoom chatroomId={param} />;
    </>
  )
}