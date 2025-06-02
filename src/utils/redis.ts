"use server"

import { Message } from '@/types/datatypes';
// src/utils/redis.ts
import { createClient } from 'redis';

let redisClient: ReturnType<typeof createClient>;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL
    });
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    await redisClient.connect();
  }
  return redisClient;
}

export const getMessagesFromChatroom = async (chatroomId: string) => {
  const client = await getRedisClient();
  try {
    const messages = await client.lRange(`chatroom:${chatroomId}`, 0, -1);
    return messages.map(msg => JSON.parse(msg));
  } catch (error) {
    console.error('Redis error:', error);
    return [];
  }
};

export const addMessageToChatroom = async (chatroomId: string, message: Message) => {
  const client = await getRedisClient();
  try {
    await client.rPush(`chatroom:${chatroomId}`, JSON.stringify(message));
  } catch (error) {
    console.error('Redis error:', error);
  }
};