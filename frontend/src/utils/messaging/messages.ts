import { Message } from '@/types/datatypes';
import { BASE_URL, fetchJson } from '../utils';

/**
 * Sends a chat message to the API.
 */
export async function sendMessage(message: Message, userId: string): Promise<string> {
  return fetchJson<string>(`${BASE_URL}api/message?userId=${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
}

/**
 * Sends a chat message to the API.
 */
export async function sendMessageToRoom(message: Message, roomId: string): Promise<string> {
  return fetchJson<string>(`${BASE_URL}api/message?roomId=${roomId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
}

/**
 * GET /getMessage?userId={userId}&roomId={chatRoomId}
 */
export async function getMessage(userId: string, chatRoomId: string): Promise<Message[]> {
  if (!chatRoomId) throw new Error('Invalid chat room ID');

  return fetchJson<Message[]>(`${BASE_URL}api/message/getMessage?userId=${userId}&roomId=${chatRoomId}`);
}

/**
 * GET /getMessages?userId={userId}
 */
export async function getMessages(userId: string): Promise<Message[]> {
  if (!userId) throw new Error('Invalid user ID');

  return fetchJson<Message[]>(`${BASE_URL}api/message/getMessages?userId=${userId}`);
}

/**
 * DELETE /deleteMessage?userId={userId}&roomId={chatRoomId}
 */
export async function deleteMessage(userId: string, chatRoomId: string): Promise<string> {
  if (!chatRoomId || !userId) throw new Error('Missing chat room or user ID');

  return fetchJson<string>(`${BASE_URL}api/message/deleteMessage?userId=${userId}&roomId=${chatRoomId}`, {
    method: 'DELETE',
  });
}

/**
 * DELETE /deleteMessage?userId={userId}
 */
export async function deleteMessages(userId: string): Promise<string> {
  if (!userId) throw new Error('Missing user ID');

  return fetchJson<string>(`${BASE_URL}api/message/deleteMessages?userId=${userId}`, {
    method: 'DELETE',
  });
}

export async function checkRoom(roomId: string): Promise<boolean> {
  return fetchJson<boolean>(`${BASE_URL}api/message/checkRoom?roomId=${roomId}`, {
    method: 'GET',
  })
}

