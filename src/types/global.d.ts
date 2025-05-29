export {}

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      onboardingComplete?: boolean
      nickname: string, // a random attribute for testing
    }
  }
}

// src/types/next.d.ts
import { Server as NetServer, Socket } from 'net';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiRequest, NextApiResponse } from 'next';

declare module 'http' {
  interface IncomingMessage {
    socket: Socket;
  }
}

declare module 'next' {
  interface NextApiRequest {
    socket: Socket;
  }
}