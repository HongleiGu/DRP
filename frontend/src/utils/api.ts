"use client" 
import { Direction, Room, Message, PlayerData, SupabaseUser } from '@/types/datatypes';
import globalStore from '@/store';
import { BASE_URL, fetchJson, formatDate } from './utils';

export async function createRoom(
  users: SupabaseUser[],
  creator_id: string,
  groupName: string = 'groupchat',
  type: "public" | "personal",
  last_message: Message | null = null
): Promise<Room> {
  const user = await globalStore.getItem('lumiroom-user') as SupabaseUser
  if (!user) {
    throw new Error('You must be signed in to create a room');
  }
  // create a room and request the roomId
  const roomId = await fetchJson<string>(`${BASE_URL}api/rooms/createRoom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_name: groupName,
        creator_id,
        type
      }),
    });
  // insert the invited users in the room
  await fetchJson<string>(`${BASE_URL}api/rooms/insertUsersToRoomBatched`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      user_ids: users.map(it => it.id),
      room_id: roomId,
    })
  })

  // insert the player datas
  

  return {
    id: roomId,
    name: groupName,
    last_message: last_message,
    unread: last_message === null ? 0 : 1,
    created_at: formatDate(),
    creator_id: creator_id,
    type: type
  } as Room
}

export async function getPlayers(roomId: string): Promise<PlayerData[]> {
  return await fetchJson<PlayerData[]>(`${BASE_URL}api/game/getPlayers?roomId=${roomId}`, {
    method: "GET",
    headers: { 'Content-Type': 'application/json' }
  })
}


export async function updatePlayerPosition(userId: string, roomId: string, {x,y,direction}: {
  x: number;
  y: number;
  direction: Direction
}) {
  // 
  await fetchJson<string>(`${BASE_URL}api/game/updatePlayerData`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      id: "",
      user_id: userId,
      name: "",
      room_id: roomId,
      x: x,
      y: y,
      direction: direction,
      avatarId: 0
    } as PlayerData)
  })
}

export async function resetPlayerToDefault(userId: string, roomId: string) {
  await updatePlayerPosition(userId, roomId, {x: 200, y: 300, direction: "down"})
}

export async function validateJWT(token: string): Promise<boolean> {
  return await fetchJson<boolean>(`${BASE_URL}api/auth/validateJWT`, {
    method: "POST",
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      jwt: token
    })
  })
}

export async function getRoom(roomId: string): Promise<Room> {
  return await fetchJson<Room>(`${BASE_URL}api/rooms/getRoom?roomId=${roomId}`, {
    method: "GET",
    headers: {'Content-Type': 'application/json'},
  })
}

export async function deleteUserFromRoom(userId: string, roomId: string): Promise<string> {
  return await fetchJson<string>(`${BASE_URL}api/rooms/deleteUserFromRoom`, {
    method: "DELETE",
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      user_id: userId,
      room_id: roomId
    })
  })
}

export async function deleteRoom(roomId: string): Promise<string> {
  return await fetchJson<string>(`${BASE_URL}api/rooms/deleteUserFromRoom?roomId=${roomId}`, {
    method: "DELETE",
    headers: {'Content-Type': 'application/json'}
  })
}

export async function getContacts(firstUser: string, secondUser: string): Promise<Room> {
  return await fetchJson<Room>(`${BASE_URL}api/contacts/getContacts?firstUser=${firstUser}&secondUser=${secondUser}`, {
    method: "GET",
    headers: { 'Content-Type': 'application/json' }
  })
}

export async function addContacts(firstUser: string, secondUser: string, roomId: string): Promise<string> {
  return await fetchJson<string>(`${BASE_URL}api/contacts/addContacts`, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      first_user: firstUser,
      second_user: secondUser,
      room_id: roomId
    })
  })
}

export async function getAllRoomsofUser(userId: string) {
  return await fetchJson<Room[]>(`${BASE_URL}api/contacts/getAllRoomsofUser?userId=${userId}`, {
    method: "GET",
    headers: { 'Content-Type': 'application/json' }
  })
}

// utils/aiClient.ts
import { AIMessage, AIChatResponse } from "@/types/datatypes";

export async function* streamChat(
  messages: AIMessage[]
): AsyncGenerator<AIChatResponse, void, unknown> {
  const jwt = await globalStore.getItem<string>("jwt-token")
  if (!jwt) {
    return
  }
  const res = await fetch(`${BASE_URL}api/ai/chat`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": jwt
    },
    body: JSON.stringify({ 
      model: "qwen3:latest",
      provider: "ollama",
      messages 
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n").filter(Boolean);

    for (const part of parts) {
      try {
        const parsed: AIChatResponse = JSON.parse(part);
        yield parsed;
      } catch {
        // incomplete JSON, carry over to next buffer
        buffer = part;
        continue;
      }
    }
    buffer = "";
  }
}
