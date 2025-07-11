// app/api/rooms/create/route.ts
import { redis } from '@/lib/redis';  // Ensure correct import path
import { Message } from '@/types/datatypes';
import { placeholderId } from '@/utils/utils';

// POST /api/rooms/create
export async function POST(req: Request) {
  const { chatRoomId }: { chatRoomId: string } = await req.json();

  if (!chatRoomId) {
    return new Response(JSON.stringify({ message: 'Chat room ID is required' }), { status: 400 });
  }

  const key = `chat:${chatRoomId}`;  // Redis key for this chatroom
  
  const placeholderMessage: Message = {
    id: placeholderId,
    speaker: 'system',
    speaker_name: 'System',
    chat_message: placeholderId,
    created_at: new Date().toISOString(),
    chat_room_id: chatRoomId,
  };

  const timestamp = Date.parse(placeholderMessage.created_at);

  try {
    // Add the placeholder message to the sorted set
    await redis.zAdd(key, {
      score: timestamp,
      value: JSON.stringify(placeholderMessage),
    });

    return new Response(JSON.stringify({ message: 'Chat room created' }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), { status: 500 });
  }
}
