import { Message } from '@/types/datatypes';

const BASE_URL = process.env.SPRINGBOOT_URL || 'http://localhost:8080/api/message';

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { credentials: 'include', ...init });

  const response = (await res.json()) as { code: number; msg: string; data?: T };

  if (response.code !== 200) {
    throw new Error(response.msg || 'API error');
  }

  return response.data as T;
}

/**
 * Sends a chat message to the API.
 */
export async function sendMessage(message: Message, userId: string): Promise<string> {
  return fetchJson<string>(`${BASE_URL}?userId=${encodeURIComponent(userId)}`, {
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

  return fetchJson<Message[]>(`${BASE_URL}/getMessage?userId=${userId}&roomId=${chatRoomId}`);
}

/**
 * GET /getMessages?userId={userId}
 */
export async function getMessages(userId: string): Promise<Message[]> {
  if (!userId) throw new Error('Invalid user ID');

  return fetchJson<Message[]>(`${BASE_URL}/getMessages?userId=${userId}`);
}

/**
 * DELETE /deleteMessage?userId={userId}&roomId={chatRoomId}
 */
export async function deleteMessage(userId: string, chatRoomId: string): Promise<string> {
  if (!chatRoomId || !userId) throw new Error('Missing chat room or user ID');

  return fetchJson<string>(`${BASE_URL}/deleteMessage?userId=${userId}&roomId=${chatRoomId}`, {
    method: 'DELETE',
  });
}

/**
 * DELETE /deleteMessage?userId={userId}
 */
export async function deleteMessages(userId: string): Promise<string> {
  if (!userId) throw new Error('Missing user ID');

  return fetchJson<string>(`${BASE_URL}/deleteMessage?userId=${userId}`, {
    method: 'DELETE',
  });
}
