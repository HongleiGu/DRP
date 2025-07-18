import { Message } from '@/types/datatypes';

const BASE_URL = process.env.SPRINGBOOT_URL || 'http://localhost:8080/api/message';

/**
 * POST /api/message/addMessage
 */
export async function addMessage(messageData: Message): Promise<void> {
  console.log(messageData)
  console.log(!messageData, !messageData.chat_room_id, !messageData.chat_message)
  console.log(!messageData || !messageData.chat_room_id || !messageData.chat_message)
  if (!messageData || !messageData.chat_room_id || !messageData.chat_message) {
    throw new Error('Invalid message data');
  }

  const res = await fetch(`${BASE_URL}/addMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messageData),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to add message: ${errorText}`);
  }
}

/**
 * GET /api/message/getMessage?chatRoomId={chatRoomId}
 */
export async function getMessages(chatRoomId: string): Promise<Message[]> {
  if (!chatRoomId) {
    throw new Error('Invalid chat room ID');
  }

  const res = await fetch(`${BASE_URL}/getMessage?chatRoomId=${chatRoomId}`);

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

  const res = await fetch(`${BASE_URL}/deleteMessage?chatRoomId${chatRoomId}&messageId=${messageId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to delete message: ${errorText}`);
  }

  const message = await res.text(); // Assumes backend returns plain string in body
  return message;
}
