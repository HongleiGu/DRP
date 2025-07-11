import { createClient } from '@redis/client';

if (!process.env.REDIS_URL) {
  console.log("redis env url is missing")
}

export const redis =  await createClient({ url: process.env.REDIS_URL }).connect()

redis.on('error', (err) => console.error('Redis Client Error', err));
redis.on('connect', () => console.log('Redis client connecting...'));
redis.on('ready', () => console.log('Redis client connected and ready'));
redis.on('end', () => console.log('Redis client disconnected'));
