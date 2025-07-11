// utils/api/messages.ts
export async function addMessage(messageData: { chat_room_id: string; chat_message: string }) {
  console.log("addMessage")
  const response = await fetch('/api/messages/addMessages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messageData }),
  });

  if (!response.ok) {
    throw new Error('Failed to add message');
  }

  const data = await response.json();
  return data.message;
}

// Client-side function to fetch messages
export async function getMessages(chatRoomId: string) {
  const response = await fetch(`/api/messages/getMessages?chatRoomId=${chatRoomId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }

  const data = await response.json();
  return data.messages;
}


export async function deleteMessage(chatRoomId: string, messageId: string): Promise<string> {
  const url = '/api/messages/deleteMessages'; // Updated to the POST route

  const response = await fetch(url, {
    method: 'POST',  // Use POST method instead of DELETE
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ chatRoomId, messageId }), // Send as JSON body
  });

  if (!response.ok) {
    throw new Error('Failed to delete message');
  }

  const data = await response.json();
  return data.message;
}



export async function createRoom(chatRoomId: string) {
  const response = await fetch('/api/room/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ chatRoomId }),
  });

  if (!response.ok) {
    throw new Error('Failed to create room');
  }

  const data = await response.json();
  return data.message;
}
