export {}

// declare global {
//   interface CustomJwtSessionClaims {
//     metadata: {
//       onboardingComplete?: boolean
//       nickname: string, // a random attribute for testing
//       avatarId: string
//     }
//   }
// }

// src/types/next.d.ts
import { Socket } from 'net';
// import { Server as SocketIOServer } from 'socket.io';
// import { NextApiRequest, NextApiResponse } from 'next';

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


// for electron api, we need the window.electronApi object
declare global {
  interface Window {
    electronApi: ElectronApi;
  }
}