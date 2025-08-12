"use client" 
import { Direction, Group, Message, PlayerData, SupabaseUser } from '@/types/datatypes';
import globalStore from '@/store';
import { BASE_URL, fetchJson, formatDate } from './utils';

export async function createRoom(
  users: SupabaseUser[],
  creator_id: string,
  groupName: string = 'groupchat',
  last_message: Message | null = null
): Promise<Group> {
  const user = await globalStore.getItem('lumiroom-user') as SupabaseUser
  if (!user) {
    throw new Error('You must be signed in to create a room');
  }
  const roomId = await fetchJson<string>(`${BASE_URL}/api/message?userId=${encodeURIComponent(creator_id)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_name: groupName,
        creator_id,
      }),
    });
  await fetchJson<string>(`${BASE_URL}/api/message/insertUserToRoomBatched`, {
    method: 'POST',
    headers: {'Content-Type': 'application.json'},
    body: JSON.stringify({
      user_ids: users.map(it => it.id),
      room_id: roomId,
    })
  })

  return {
    id: roomId,
    name: groupName,
    last_message: last_message,
    unread: last_message === null ? 0 : 1,
    created_at: formatDate(),
    creator_id: creator_id,
    members: users
  } as Group
}

export async function getPlayers(roomId: string): Promise<PlayerData[]> {
  return await fetchJson<PlayerData[]>(`${BASE_URL}/api/game/getPlayers`, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_id: roomId
      }),
  })
}

export async function resetPlayerToDefault(userId: string, roomId: string, name: string | null = null, avatarId: string | null = null): Promise<void> {
  await fetchJson<string>(`${BASE_URL}/api/game/updatePlayerPosition`, {
    method: 'POST',
    headers: {'Content-Type': 'application.json'},
    body: JSON.stringify({
      id: "",
      user_id: userId,
      name: name,
      room_id: roomId,
      x: 200,
      y: 300,
      direction: "down" as Direction,
      avatarId: avatarId
    } as PlayerData)
  })
}

export async function updatePlayerPosition(userId: string, roomId: string, {x,y,direction}: {
  x: number;
  y: number;
  direction: Direction
}) {
  // 
  await fetchJson<string>(`${BASE_URL}/api/game/updatePlayerPosition`, {
    method: 'POST',
    headers: {'Content-Type': 'application.json'},
    body: JSON.stringify({
      id: "",
      user_id: userId,
      name: "",
      room_id: roomId,
      x: x,
      y: y,
      direction: direction,
      avatarId: ""
    } as PlayerData)
  })
}