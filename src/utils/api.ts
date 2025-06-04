"use server"


import { Message, TVState } from '@/types/datatypes';
import { supabase } from '@/lib/supabase';
import { currentUser, User } from '@clerk/nextjs/server';

const DEFAULT_VIDEO = "loWA5o1RdTY"

export const insertChatHistory = async (message: Message) => {
  console.log("insertChatHistory")
  const { data, error } = await supabase
    .from('chat_history')
    .insert(message)
    .select();
  if (error) throw error;
  return data;
};

export const getRoom = async (roomId: string) => {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)

  if (error) throw error;
  return data;
};

export async function createRoom(): Promise<string> {
  const roomId = await createChatRoom()
  await createTVRoom(roomId)
  return roomId;
}

export const createChatRoom = async (roomName?: string): Promise<string> => {
  // Get Clerk user instead of Supabase session
  const user = await currentUser();
  
  if (!user) {
    throw new Error('You must be signed in to create a room');
  }

  const { data, error } = await supabase
    .from('rooms')
    .insert({
      name: roomName || null,
      created_by: user.id  // Track who created the room
    })
    .select('*')
    .single();

  if (error) {
    console.error('Detailed Supabase error:', {
      message: error.message,
      code: error.code,
      details: error.details
    });
    throw error;
  }

  // we need psql to generate room_id without conflict
  return data.id as string;
};

export async function createTVRoom(roomId: string): Promise<void> {
  const { error } = await supabase
    .from('tv_channel')
    .insert({
      room_id: roomId,
      channel: DEFAULT_VIDEO,
      is_playing: false,
      time: 0
    } as TVState)

  if (error) {
    console.error('Detailed Supabase error:', {
      message: error.message,
      code: error.code,
      details: error.details
    });
    throw error;
  }
}

export async function registerUser(userId: string, user: User, formData: CustomJwtSessionClaims) {
  console.log(userId, user, formData)
}

export async function getChannel(roomId: string): Promise<TVState> {
  try {
    const {data, error} = await supabase
      .from('tv_channel')
      .select('*')
      .eq('room_id', roomId)
      .single()
    console.log("data", data)
    if (error) {
      console.error('Detailed Supabase error:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
      throw error;
    }
    return data as TVState
  } catch (error) {
    console.log("error getting channel")
    throw error;
  }
}

export async function updateChannel(state: TVState): Promise<void> {
  console.log("updating channel", state.room_id, state.channel)
  try {
    const {error} = await supabase
      .from('tv_channel')
      .update(state)
      .eq('room_id', state.room_id)
    if (error) {
      console.error('Detailed Supabase error:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
      throw error;
    }
  } catch (error) {
    console.log("error updating channel")
    throw error;
  }
}

export async function getMessages(roomId: string): Promise<Message[]> {
  console.log("fetch messages from room", roomId)
const { data, error } = await supabase
  .from('chat_history')
  .select('*')
  .eq('chat_room_id', roomId)
  .not('chat_message', 'ilike', '/%');

  if (error) {
    console.error('Detailed Supabase error:', {
      message: error.message,
      code: error.code,
      details: error.details
    });
    throw error;
  }
  return data.map(it => {
    return it as Message
  })
}