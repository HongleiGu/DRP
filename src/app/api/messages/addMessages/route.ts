// src/app/api/messages/addMessages/route.ts
import { redis } from '@/lib/redis';
import { v4 as uuidv4 } from 'uuid';
import { Message } from '@/types/datatypes';

interface AddMessageRequestBody {
  messageData: Omit<Message, 'id' | 'created_at'>;
}

// POST handler
export async function POST(req: Request) {
  const { messageData }: AddMessageRequestBody = await req.json();  // Destructure the request body

  if (!messageData || !messageData.chat_room_id || !messageData.chat_message) {
    return new Response(
      JSON.stringify({ message: 'Invalid message data' }),
      { status: 400 }
    );
  }

  const id = uuidv4();
  const created_at = new Date().toISOString();
  const message: Message = { ...messageData, id, created_at };

  const key = `chat:${message.chat_room_id}`;
  const timestamp = Date.parse(created_at);

  try {
    // Add the message to the Redis sorted set
    await redis.zAdd(key, {
      score: timestamp,
      value: JSON.stringify(message),
    });

    // Publish the message to the Redis channel
    await redis.publish(`chat:${message.chat_room_id}`, JSON.stringify(message));

    return new Response(
      JSON.stringify({ message }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ message: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}
