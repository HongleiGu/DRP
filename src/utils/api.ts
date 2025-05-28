"use server"

import { User, auth } from '@clerk/nextjs/server'
// import { PoolClient } from '@neondatabase/serverless'
import { supabase } from './sql'
import { Message } from '@/types/datatypes';
import { convertKeysToCamelCase } from './utils';

export async function registerUser(
  userId: string,
  user: User,
  formData: CustomJwtSessionClaims
) {
  const insertData = {
    user_id: userId,
    username: user.username,
    first_name: user.firstName,
    last_name: user.lastName,
    email: user.primaryEmailAddress?.emailAddress ?? null,
    onboard_complete: formData.metadata.onboardingComplete || false
  };

  console.log(insertData)

  try {
    const { error } = await supabase
      .from('users')
      .insert(insertData) // should not add array
      // .select()  // Improves error details

    if (error) {
      // Enhanced error logging
      console.error("SUPABASE ERROR DETAILS:", error);
      
      throw new Error("Database insert failed");
    }

    // return data;
  } catch (e: any) {
    console.error("UNEXPECTED ERROR:", e);
    throw new Error(e.message || "Registration failed");
  }
}

export async function createChatRoom() {
  try {
    const { userId } = await auth()
    console.log(userId)
    // Execute the INSERT query with RETURNING clause
    const { data, error } = await supabase
      .from('chat_rooms')
      .insert({ owner_id: userId })
      .select('chat_room_id') // Only return chat_room_id
      .single(); // Get single record

    if (error) throw error;
    
    // console.log(data)
    return data.chat_room_id;
  } catch (error) {
    console.error('Error creating chatroom:', error);
    return null;
  }
}

export async function getChatRoom(chatroomId:string) {
  try {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq(`chat_room_id`, chatroomId)
      .single() // uniqueness is guaranteed by the psql unique constriant
    if (error) throw error;
    return data
  } catch (error) {
    console.error('Error getting chatroom:', error);
    return null;
  }
}

export async function insertChatHistory(message: Message): Promise<void> {
  try {
    const {error} = await supabase
      .from('chat_history')
      .insert(message)
    if (error) throw error;
  } catch (error) {
    console.error('Error updating chat history', error)
  }
}

// utils/db.ts
export async function getChatHistory(
  chatroomId: string, 
  before: number,  // Starting index for pagination
  limit: number   // Number of messages to retrieve
): Promise<Message[]> {
  try {
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('chatroom_id', chatroomId)
      .range(before, before + limit - 1)
      .order('created_at', { ascending: true }); // Or your preferred order

    if (error) throw error;
    
    return data.map(it => convertKeysToCamelCase(it) as Message);
  } catch (error) {
    console.error('Error getting chat history');
    throw error;
  }
}