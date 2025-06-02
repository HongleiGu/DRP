"use client"

import ChatRoom from '@/components/ChatRoom/index';
import { Message } from '@/types/datatypes';
import { getRoom } from '@/utils/api';
import { getUserId } from '@/utils/user';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';

export const DEFAULT_ROOM = '00000000-0000-0000-0000-000000000001'

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const [param, setParams] = useState<string>("")
  const [room, setRoom] = useState<Message[]>([])
  useEffect(() => {
    const helper = async () => {
      const id = await getUserId()
      if (!id || id == "") {
        redirect("/")
      }
      const a = (await params).id
      setParams(a)
      setRoom(await getRoom(a))
    }
    helper()
  }, [])

  try {
    if (!room) {
      redirect('/chatroom/00000000-0000-0000-0000-000000000001');
    }

    return <ChatRoom chatroomId={param} />;
  } catch (error) {
    console.error('Error loading room:', error);
    redirect('/chatroom/00000000-0000-0000-0000-000000000001');
  }
}