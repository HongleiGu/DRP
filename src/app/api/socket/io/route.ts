// app/api/socket/io/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Server } from 'socket.io';
import { addMessageToChatroom } from '@/utils/redis';
import { insertChatHistory } from '@/utils/api';
import { Message } from '@/types/datatypes';

// Global variable to store Socket.IO instance
let io: Server | null = null;

export async function GET() {
  return NextResponse.json({ status: 'Socket.IO endpoint' });
}

export async function POST(req: NextRequest) {
  try {
    const res = new NextResponse();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reqSocket = (req as any).socket;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!reqSocket.server.io) {
      console.log('Initializing Socket.IO server...');
      
      // Create Socket.IO server
      io = new Server(reqSocket.server, {
        path: '/api/socket/io',
        addTrailingSlash: false,
      });
      
      reqSocket.server.io = io;
      
      // Handle Socket.IO connections
      io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);
        
        // Handle joining a chatroom
        socket.on('join', (chatroomId: string) => {
          console.log(`Socket ${socket.id} joining room: ${chatroomId}`);
          socket.join(chatroomId);
          
          // Notify others in the room
          socket.to(chatroomId).emit('user-connected', socket.id);
        });
        
        // Handle sending messages
        socket.on('send-message', async (data: {
          chatroomId: string;
          speaker: string;
          chat_message: string;
          time?: string;
          isOptimistic: boolean
        }) => {
          try {
            const chatroomId = data.chatroomId;
            const messageObj: Message = {
              speaker: data.speaker,
              chat_message: data.chat_message,
              time: data.time || new Date().toISOString(),
              isOptimistic: data.isOptimistic
            };
            
            console.log(`New message in ${chatroomId} from ${data.speaker}`);
            
            // 1. Add to Redis immediately
            await addMessageToChatroom(chatroomId, messageObj);
            
            // 2. Broadcast to all clients in the room
            io!.to(chatroomId).emit('receive-message', messageObj);
            
            // 3. Queue for PostgreSQL persistence
            setTimeout(async () => {
              try {
                await insertChatHistory({
                  speaker: messageObj.speaker,
                  chat_message: messageObj.chat_message,
                  time: messageObj.time,
                  isOptimistic: messageObj.isOptimistic
                });
              } catch (error) {
                console.error('Error persisting to PostgreSQL:', error);
              }
            }, 0);
          } catch (error) {
            console.error('Error handling message:', error);
          }
        });
        
        // Handle disconnections
        socket.on('disconnect', () => {
          console.log(`Socket disconnected: ${socket.id}`);
          // Notify rooms that this user left
          socket.rooms.forEach(room => {
            if (room !== socket.id) { // Skip default room
              socket.to(room).emit('user-disconnected', socket.id);
            }
          });
        });
      });
    }
    
    return res;
  } catch (error) {
    console.error('Socket.IO initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize Socket.IO' },
      { status: 500 }
    );
  }
}

// Clean up when server shuts down
process.on('SIGTERM', () => {
  if (io) {
    console.log('Closing Socket.IO server...');
    io.close();
  }
});


// import { NextRequest, NextResponse } from 'next/server';
// import { Server } from 'socket.io';
// import { addMessageToChatroom, getPlayerPosition, setPlayerPosition } from '@/utils/redis';
// import { insertChatHistory, upsertPlayerPosition } from '@/utils/api';
// import { Message, PlayerPosition } from '@/types/datatypes';

// let io: Server | null = null;

// export async function GET() {
//   return NextResponse.json({ status: 'Socket.IO endpoint' });
// }

// export async function POST(req: NextRequest) {
//   try {
//     const res = new NextResponse();
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const reqSocket = (req as any).socket;
    
//     if (!reqSocket.server.io) {
//       console.log('Initializing unified Socket.IO server...');
      
//       io = new Server(reqSocket.server, {
//         path: '/api/socket/io',
//         addTrailingSlash: false,
//       });
      
//       reqSocket.server.io = io;
      
//       io.on('connection', (socket) => {
//         console.log(`Socket connected: ${socket.id}`);
        
//         // --- GAME EVENTS ---
//         socket.on('joinWorld', async () => {
//           console.log(`Player ${socket.id} joining game world`);
          
//           // Load player position from Redis
//           const position = await getPlayerPosition(socket.id);
//           if (position) {
//             socket.emit('positionLoaded', position);
//           }
          
//           // Broadcast to other players
//           socket.broadcast.emit('playerJoined', socket.id);
//         });
        
//         socket.on('playerMove', async (position: PlayerPosition) => {
//           try {
//             // Update Redis immediately
//             await setPlayerPosition(socket.id, position);
            
//             // Broadcast to other players
//             socket.broadcast.emit('playerMoved', {
//               id: socket.id,
//               ...position
//             });
            
//             // Persist to database (debounced)
//             setTimeout(async () => {
//               await upsertPlayerPosition(socket.id, position);
//             }, 5000); // Batch updates every 5 seconds
//           } catch (error) {
//             console.error('Error handling player move:', error);
//           }
//         });
        
//         // --- CHAT EVENTS ---
//         socket.on('joinChat', (chatroomId: string) => {
//           console.log(`Socket ${socket.id} joining chat: ${chatroomId}`);
//           socket.join(chatroomId);
//           socket.to(chatroomId).emit('user-connected', socket.id);
//         });
        
//         socket.on('send-message', async (data: {
//           chatroomId: string;
//           speaker: string;
//           chat_message: string;
//           time?: string;
//           isOptimistic: boolean;
//         }) => {
//           try {
//             const chatroomId = data.chatroomId;
//             const messageObj: Message = {
//               speaker: data.speaker,
//               chat_message: data.chat_message,
//               time: data.time || new Date().toISOString(),
//               isOptimistic: data.isOptimistic
//             };
            
//             // Add to Redis immediately
//             await addMessageToChatroom(chatroomId, messageObj);
            
//             // Broadcast to chatroom
//             io!.to(chatroomId).emit('receive-message', messageObj);
            
//             // Persist to database
//             setTimeout(async () => {
//               await insertChatHistory({
//                 speaker: messageObj.speaker,
//                 chat_message: messageObj.chat_message,
//                 time: messageObj.time,
//                 isOptimistic: messageObj.isOptimistic
//               });
//             }, 0);
//           } catch (error) {
//             console.error('Error handling message:', error);
//           }
//         });
        
//         // --- DISCONNECTION HANDLER ---
//         socket.on('disconnect', async () => {
//           console.log(`Socket disconnected: ${socket.id}`);
          
//           // Game cleanup
//           socket.broadcast.emit('playerLeft', socket.id);
//           await setPlayerPosition(socket.id, null); // Clear Redis position
          
//           // Chat cleanup
//           socket.rooms.forEach(room => {
//             if (room !== socket.id) {
//               socket.to(room).emit('user-disconnected', socket.id);
//             }
//           });
//         });
//       });
//     }
    
//     return res;
//   } catch (error) {
//     console.error('Socket.IO initialization error:', error);
//     return NextResponse.json(
//       { error: 'Failed to initialize Socket.IO' },
//       { status: 500 }
//     );
//   }
// }

// process.on('SIGTERM', () => {
//   if (io) {
//     console.log('Closing Socket.IO server...');
//     io.close();
//   }
// });