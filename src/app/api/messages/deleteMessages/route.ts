import { redis } from '@/lib/redis';

export async function POST(req: Request): Promise<Response> {
  try {
    // Parse the incoming JSON request body
    const { chatRoomId, messageId } = await req.json();

    // Validate the required fields
    if (!chatRoomId || !messageId) {
      return new Response(
        JSON.stringify({ message: 'Missing chat room or message ID' }),
        { status: 400 }
      );
    }

    const key = `chat:${chatRoomId}`;

    // Fetch all messages from the sorted set
    const rawMessages = await redis.zRange(key, 0, -1);

    // Search for the message to delete by comparing message.id
    const messageToDelete = rawMessages.find(raw => {
      try {
        const msg = JSON.parse(raw);
        return msg.id === messageId;
      } catch {
        // If parsing fails, ignore that entry
        return false;
      }
    });

    if (!messageToDelete) {
      return new Response(
        JSON.stringify({ message: 'Message not found' }),
        { status: 404 }
      );
    }

    // Remove the message from the sorted set
    await redis.zRem(key, messageToDelete);

    // Publish the deletion event to notify subscribers
    await redis.publish(`chat:${chatRoomId}:delete`, messageId);

    return new Response(
      JSON.stringify({ message: 'Message deleted' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting message:', error);
    return new Response(
      JSON.stringify({ message: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}
