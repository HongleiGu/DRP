"use server"

import { Message } from '@/types/datatypes';
import { createClient } from 'redis';

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