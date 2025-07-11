// app/api/messages/getMessages/route.ts
import { redis } from '@/lib/redis';  // Ensure correct path
import { Message } from '@/types/datatypes';

export async function GET(req: Request, { params }: { params: { chatRoomId: string } }) {
  // Extract chatRoomId from query parameters
  const url = new URL(req.url);
  const chatRoomId = url.searchParams.get('chatRoomId');

  if (!chatRoomId) {
    return new Response(JSON.stringify({ message: 'Invalid chat room ID' }), { status: 400 });
  }

  const key = `chat:${chatRoomId}`;

  try {
    const rawMessages = await redis.zRange(key, 0, -1);  // Fetch all messages sorted by time
    const messages: Message[] = rawMessages.map((m) => JSON.parse(m));  // Parse JSON messages

    return new Response(JSON.stringify({ messages }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), { status: 500 });
  }
}
