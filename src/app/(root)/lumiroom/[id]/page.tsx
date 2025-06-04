<<<<<<< HEAD
// app/page.tsx
// currently this does not fetch data from supabase, so that it uses predefined layout
'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { GameStateProvider } from '@/game/state/GameState'
// import { HUD } from '../components/Game/UI/Overlay/HUD'
// const HUD = dynamic(() => import('@/components/Lumiroom/UI/Overlay/HUD'), { ssr: false })

const Game = dynamic(() => import('@/components/Lumiroom'), {
  ssr: false,
  loading: () => <div className="text-center p-8">Loading game...</div>
})

export default function Home() {
  return (
    <main className="relative w-full h-screen overflow-hidden">
      <GameStateProvider>
        <Suspense fallback={<div className="text-center p-8">Initializing game engine...</div>}>
          <Game />
        </Suspense>
      </GameStateProvider>
    </main>
  )
=======
"use client"

import ChatRoom from '@/components/ChatRoom/index';
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
>>>>>>> 00c35588a9775a810d97696e0bcf2f82a7c6910e
}