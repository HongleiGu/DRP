"use server"


import { supabase } from '@/lib/supabase';
import { currentUser, User } from '@clerk/nextjs/server';


export const insertChatHistory = async (message: {
  speaker: string;
  speaker_name: string;
  chat_message: string;
  chat_room_id: string;
}) => {
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

export const createRoom = async (roomName?: string) => {
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

  // console.log(data)
  return data.id as string;
};

export async function registerUser(userId: string, user: User, formData: CustomJwtSessionClaims) {
  console.log(userId, user, formData)
}

export async function getChannel(roomId: string): Promise<string> {
  try {
    const {data, error} = await supabase
      .from('tv_channel')
      .select('channel')
      .eq('room_id', roomId)
      .single()
    if (error) {
      console.error('Detailed Supabase error:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
      throw error;
    }
    return data.channel as string
  } catch (error) {
    console.log("error getting channel")
    throw error;
  }
}

export async function updateChannel(roomId: string, videoId: string): Promise<void> {
  console.log("updating channel", roomId, videoId)
  try {
    const {error} = await supabase
      .from('tv_channel')
      .update({channel: videoId})
      .eq('room_id', roomId)
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