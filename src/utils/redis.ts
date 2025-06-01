"use server"

import { Message, PlayerPosition } from '@/types/datatypes';
import { createClient } from 'redis';
// import { convertKeysToCamelCase } from './utils';


const redis = await createClient({ url: process.env.REDIS_URL }).connect();

const MAX_MESSAGES = 50;

export async function addMessageToChatroom(chatroomId: string, message: Message) {
    const key = `chatroom:${chatroomId}:messages`;
    
    // Add timestamp if not provided
    const fullMessage: Message = {
        ...message,
        time: message.time || new Date().toISOString()
    };
    
    await redis.rPush(key, JSON.stringify(fullMessage));
    await redis.lTrim(key, -MAX_MESSAGES, -1);
}

export async function getMessagesFromChatroom(chatroomId: string): Promise<Message[]> {
    const key = `chatroom:${chatroomId}:messages`;
    const messages = await redis.lRange(key, 0, -1);
    return messages.map(msg => JSON.parse(msg));
}


// gridworld backend functions

// Game position functions
export const setPlayerPosition = async (playerId: string, position: PlayerPosition | null) => {
  if (position) {
    await redis.hSet('player_positions', playerId, JSON.stringify(position));
  } else {
    await redis.hDel('player_positions', playerId);
  }
};

export const getPlayerPosition = async (playerId: string): Promise<PlayerPosition | null> => {
  const position = await redis.hGet('player_positions', playerId);
  return position ? JSON.parse(position) : null;
};

export const getAllPlayerPositions = async (): Promise<Record<string, PlayerPosition>> => {
  const positions = await redis.hGetAll('player_positions');
  return Object.fromEntries(
    Object.entries(positions).map(([id, pos]) => [id, JSON.parse(pos)])
  );
};