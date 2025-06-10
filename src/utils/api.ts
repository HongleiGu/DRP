"use server"


import { CalendarEntry, Direction, Message, PlayerData, TVState } from '@/types/datatypes';
import { supabase } from '@/lib/supabase';
import { currentUser, User } from '@clerk/nextjs/server';
import { VideoElement } from '@/components/PlayList';

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

// Get all videos for a chatroom
export async function getPlaylist(chatroomId: string): Promise<VideoElement[]> {
  const { data, error } = await supabase
    .from('playlists')
    .select('name, vid')
    .eq('chatroom_id', chatroomId)

  if (error) {
    console.error('Error fetching playlist:', {
      message: error.message,
      code: error.code,
      details: error.details
    });
    throw error;
  }
  
  return data || [];
}

// Add a video to playlist
export async function addVideoToPlaylist(
  chatroomId: string, 
  video: VideoElement
): Promise<void> {
  const { error } = await supabase
    .from('playlists')
    .insert({
      chatroom_id: chatroomId,
      vid: video.vid,
      name: video.name
    });

  if (error) {
    console.error('Error adding video:', {
      message: error.message,
      code: error.code,
      details: error.details
    });
    throw error;
  }
}

// Remove a video from playlist
export async function removeVideoFromPlaylist(
  chatroomId: string, 
  vid: string
): Promise<void> {
  const { error } = await supabase
    .from('playlists')
    .delete()
    .match({ chatroom_id: chatroomId, vid });

  if (error) {
    console.error('Error removing video:', {
      message: error.message,
      code: error.code,
      details: error.details
    });
    throw error;
  }
}

export async function getCalendarEntries(
  roomId: string
): Promise<Record<string, CalendarEntry>> {
  try {
    const { data, error } = await supabase
      .from('calendar_entries')
      .select('*')
      .eq('room_id', roomId)
      .order('date', { ascending: true });

    if (error) throw error;

    const entriesObj = data.reduce((acc, entry) => ({
      ...acc,
      [entry.date]: entry
    }), {} as Record<string, CalendarEntry>);
  
    // setEntries(entriesObj);
    return entriesObj
  } catch (error) {
    console.error('Error fetching entries:', error);
    throw error
    // message.error('Failed to load calendar entries');
  }
};

export async function getPlayers(roomId: string): Promise<PlayerData[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('room_id', roomId);

  if (error) {
    console.error("Failed to fetch players:", error.message);
    throw error
  }
  console.log("all players", data, roomId)
  return data.map(it => it as PlayerData)
}


// excalibur vectors cannot do .x on the server
export async function updateSupabasePlayerState(userId: string, x: number, y: number, direction: Direction): Promise<void> {
  const {error} = await supabase
    .from('players')
    .update({user_id: userId, x: x.toFixed(0), y: y.toFixed(0), direction: direction})
    .eq('user_id', userId)
  if (error) {
    console.error("Failed to update players:", error.message);
    throw error
  }
};