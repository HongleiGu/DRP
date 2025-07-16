// utils/messages.ts
import { redis } from '@/lib/redis';
import { v4 as uuidv4 } from 'uuid';
import { Message } from '@/types/datatypes';

export async function addMessage(messageData: Message): Promise<Message> {
  if (!messageData || !messageData.chat_room_id || !messageData.chat_message) {
    throw new Error('Invalid message data');
  }

  const id = uuidv4();
  const created_at = new Date().toISOString();
  const message: Message = { ...messageData, id, created_at };

  const key = `chat:${message.chat_room_id}`;
  const timestamp = Date.parse(created_at);

  try {
    // Add to sorted set
    await redis.zAdd(key, {
      score: timestamp,
      value: JSON.stringify(message),
    });

    // Publish to Redis pub/sub
    await redis.publish(`chat:${message.chat_room_id}`, JSON.stringify(message));

    return message;
  } catch (error) {
    console.error('Redis error:', error);
    throw new Error('Failed to add message');
  }
}

export async function getMessages(chatRoomId: string): Promise<Message[]> {
  if (!chatRoomId) {
    throw new Error('Invalid chat room ID');
  }

  const key = `chat:${chatRoomId}`;

  try {
    const rawMessages = await redis.zRange(key, 0, -1); // Fetch sorted messages
    const messages: Message[] = rawMessages.map((m: string) => JSON.parse(m));
    return messages;
  } catch (error) {
    console.error('Redis error:', error);
    throw new Error('Failed to fetch messages');
  }
}

export async function deleteMessage(chatRoomId: string, messageId: string): Promise<string> {
  if (!chatRoomId || !messageId) {
    throw new Error('Missing chat room or message ID');
  }

  const key = `chat:${chatRoomId}`;

  // Fetch all messages from the sorted set
  const rawMessages = await redis.zRange(key, 0, -1);

  // Find the message to delete
  const messageToDelete = rawMessages.find(raw => {
    try {
      const msg = JSON.parse(raw);
      return msg.id === messageId;
    } catch {
      return false;
    }
  });

  if (!messageToDelete) {
    throw new Error('Message not found');
  }

  // Remove the message from the sorted set
  await redis.zRem(key, messageToDelete);

  // Publish the deletion event to notify subscribers
  await redis.publish(`chat:${chatRoomId}:delete`, messageId);

  return 'Message deleted';
}


import { placeholderId } from '@/utils/utils';

export async function createRoom(chatRoomId: string): Promise<string> {
  if (!chatRoomId) {
    throw new Error('Chat room ID is required');
  }

  const key = `chat:${chatRoomId}`;

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
    await redis.zAdd(key, {
      score: timestamp,
      value: JSON.stringify(placeholderMessage),
    });

    return 'Chat room created';
  } catch (error) {
    console.error('Error creating chat room:', error);
    throw new Error('Internal Server Error');
  }
}
