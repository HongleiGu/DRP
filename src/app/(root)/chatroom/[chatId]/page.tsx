// pages/chatroom/[id].tsx
'use client';

import ChatRoom from '@/components/ChatRoom';
import { useParams } from 'next/navigation';

export default function Page() {
  const params = useParams();
  const chatId = params.chatId as string;

  console.log(chatId)

  return (
    <div className="h-screen">
      <ChatRoom chatroomId={chatId} />
    </div>
  );
}