import { Message, Room } from '@/types/datatypes';
import path from 'path'
import { STORAGE_PATH } from './utils';
import { appendJsonl, deleteJsonlById } from './json';

const BASE_URL = process.env.SPRINGBOOT_URL || 'http://localhost:8080/api/message';

/**
 * Sends a chat message to the API.
 *
 * @param message - The message object to send.
 * @param userId - The user ID to attach as a query parameter.
 * @returns A promise resolving to the server's response.
 */
export async function sendMessage(message: Message, userId: string): Promise<Response> {
  const response = await fetch(`http://localhost:8080/api/message?userId=${encodeURIComponent(userId)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // JSESSIONID is assumed to be managed by the browser or manually set in cookies
    },
    body: JSON.stringify(message),
    credentials: 'include', // includes cookies like JSESSIONID
  });

  return response;
}

/**
 * GET /api/message/getMessage?userId={userId}&roomId={chatRoomId}
 * 
 * this only loads from the redis server
 */
export async function getMessage(userId: string, chatRoomId: string): Promise<Message[]> {
  if (!chatRoomId) {
    throw new Error('Invalid chat room ID');
  }

  const res = await fetch(`${BASE_URL}/getMessage?userId=${userId}&roomId=${chatRoomId}`);

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get messages: ${errorText}`);
  }

  const response: Message[] = await res.json();
  return response;
}

/**
 * GET /api/message/getMessages?userId={userId}
 * 
 * this only loads from the redis server, regardless of the room
 */
export async function getMessages(userId: string): Promise<Message[]> {
  if (!userId) {
    throw new Error('Invalid user ID');
  }

  const res = await fetch(`${BASE_URL}/getMessages?userId=${userId}`);

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get messages: ${errorText}`);
  }

  const response: Message[] = await res.json();
  return response;
}

/**
 * DELETE /api/message/deleteMessage?chatRoomId={chatRoomId}&messageId={messageId}
 */
export async function deleteMessage(chatRoomId: string, messageId: string): Promise<string> {
  if (!chatRoomId || !messageId) {
    throw new Error('Missing chat room or message ID');
  }

  const res = await fetch(`${BASE_URL}/deleteMessage?chatRoomId=${chatRoomId}&messageId=${messageId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to delete message: ${errorText}`);
  }

  const message = await res.text(); // Assumes backend returns plain string in body
  return message;
}

export async function updateGroupDetails(room: Room, userId: string) {
  const filePath = path.join(STORAGE_PATH, userId,"groups.jsonl");

  // try catch to ensure ACID
  try {
    // delete the entry first
    await deleteJsonlById(filePath, room.id)

    // add back the updated entry
    await appendJsonl(filePath, room)
  } catch (err) {
    console.error(err)
  }
}