import { Message } from '@/types/datatypes';

const BASE_URL = process.env.SPRINGBOOT_URL || 'http://localhost:8080/api/message';

/**
 * POST /api/message/add
 */
export async function addMessage(messageData: Message): Promise<Message> {
  if (!messageData || !messageData.chat_room_id || !messageData.chat_message) {
    throw new Error('Invalid message data');
  }

  const res = await fetch(`${BASE_URL}/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messageData),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to add message: ${errorText}`);
  }

  const response: Message = await res.json();
  return response;
}

/**
 * GET /api/message/get/{chatRoomId}
 */
export async function getMessages(chatRoomId: string): Promise<Message[]> {
  if (!chatRoomId) {
    throw new Error('Invalid chat room ID');
  }

  const res = await fetch(`${BASE_URL}/get/${chatRoomId}`);

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get messages: ${errorText}`);
  }

  const response: Message[] = await res.json();
  return response;
}

/**
 * DELETE /api/message/delete/{chatRoomId}/{messageId}
 */
export async function deleteMessage(chatRoomId: string, messageId: string): Promise<string> {
  if (!chatRoomId || !messageId) {
    throw new Error('Missing chat room or message ID');
  }

  const res = await fetch(`${BASE_URL}/delete/${chatRoomId}/${messageId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to delete message: ${errorText}`);
  }

  const message = await res.text(); // Assumes backend returns plain string in body
  return message;
}
