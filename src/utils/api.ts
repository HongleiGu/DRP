"use server"


import { CalendarEntry, Direction, Message, PlayerData, Room, RoomEntry, SupabaseUser, TVState } from '@/types/datatypes';
import { supabase } from '@/lib/supabase';
import { currentUser, User } from '@clerk/nextjs/server';
import { VideoElement } from '@/components/PlayList';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_VIDEO = "loWA5o1RdTY"

export const insertChatHistory = async (message: Message) => {
  const { data, error } = await supabase
    .from('chat_history')
    .insert(message)
    .select();
  if (error) throw error;
  return data;
};

export const getRoom = async (roomId: string): Promise<RoomEntry[]> => {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('room_id', roomId)

  if (error) throw error;
  return data;
};

export async function createRoom(
  users: string[],
  creator_id: string,
  roomName: string = 'groupchat'
): Promise<string> {
  const roomId = await createChatRoom(users, creator_id, roomName)
  await createTVRoom(roomId)
  return roomId;
}

export const createChatRoom = async (
  users: string[],
  creator_id: string,
  roomName: string = 'groupchat'
): Promise<string> => {
  const user = await currentUser();
  if (!user) {
    throw new Error('You must be signed in to create a room');
  }

  // Generate a UUID for the room ID; all inserts will use this
  const room_id = uuidv4();

  // Build rows for all members
  const rows = users.map((memberId) => ({
    name: roomName,
    creator_id,
    member_id: memberId,
    last_read_at: new Date().toISOString(), // same timestamp for all rows
    room_id
  }));

  const { error } = await supabase
    .from('rooms')
    .insert(rows);

  if (error) {
    console.error('Detailed Supabase error:', {
      message: error.message,
      code: error.code,
      details: error.details,
    });
    throw error;
  }

  return room_id; // return the shared room id
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

export async function registerUser(user: SupabaseUser) {
  const { error } = await supabase
    .from('users')
    .insert(user)
  if (error) {
    console.error('Error registering user', {
      message: error.message,
      code: error.code,
      details: error.details
    });
    throw error;
  }
}

export async function getChannel(roomId: string): Promise<TVState> {
  try {
    const {data, error} = await supabase
      .from('tv_channel')
      .select('*')
      .eq('room_id', roomId)
      .single()
    // console.log("data", data)
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

export async function updateChannel(state: Partial<TVState>): Promise<void> {
  // console.log("updating channel", state.room_id, state.channel)
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

// Example structure for getCalendarEntries
export async function getCalendarEntries(roomId: string): Promise<CalendarEntry[]> {
  const { data, error } = await supabase
    .from('calendar_entries')
    .select('*')
    .eq('room_id', roomId);
  if (error) throw error;
  return data || [];
}

export async function getPlayers(roomId: string): Promise<PlayerData[]> {
  // console.log(roomId)
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('room_id', roomId);

  if (error) {
    console.error("Failed to fetch players:", error.message);
    throw error
  }
  // console.log("all players", data, roomId)
  return data.map(it => it as PlayerData)
}


export async function updateSupabasePlayerState(
  userId: string,
  x: number,
  y: number,
  name: string,
  direction: Direction,
  room_id: string
): Promise<void> {
  const { error } = await supabase
    .from('players')
    .upsert(
      {
        user_id: userId,
        room_id: room_id,
        x: Math.round(x),
        y: Math.round(y),
        name: name,
        direction: direction
      },
      { onConflict: 'user_id, room_id' }  // Specify conflict resolution
    );

  if (error) {
    console.error("Failed to update player state:", error.message);
    throw error;
  }
}

export async function resetPlayerToDefault(userId: string, name: string, roomId: string, avatarId: string): Promise<void> {
  const {error} = await supabase
    .from('players')
    .upsert({
      user_id: userId,
      name: name,
      room_id: roomId,
      x: 200,
      y: 300,
      direction: "down" as Direction,
      avatarId: avatarId,
    } as PlayerData,
    {
      onConflict: 'user_id, room_id'
    }
  )
  if (error) {
    console.error("Failed to reset players:", error.message);
    throw error
  }
}

export async function updatePlayerPosition(userId: string, position: {
  x: number;
  y: number;
  direction: Direction
}) {
  const { error } = await supabase
    .from("players")
    .update({
      x: position.x,
      y: position.y,
      direction: position.direction
    })
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to update player position:", error.message);
  }
}

// export const updateChannelPlayback = async (roomId: string, isPlaying: boolean) => {
//   return supabase
//     .from('tv_channel')
//     .update({ is_playing: isPlaying })
//     .eq('room_id', roomId);
// };

// export const updateChannelTime = async (roomId: string, time: number) => {
//   return supabase
//     .from('tv_channel')
//     .update({ time })
//     .eq('room_id', roomId);
// };

// export const updateChannelState = async (
//   roomId: string,
//   data: Partial<TVState>
// ) => {
//   return supabase
//     .from('tv_channel')
//     .update(data)
//     .eq('room_id', roomId);
// };

export const getContacts = async (user_id: string): Promise<SupabaseUser[]> => {
  // Query where user is in other_user_id
  const { data: contacts1, error: error1 } = await supabase
    .from('contacts')
    .select('user_id')
    .eq('other_user_id', user_id);

  if (error1) throw new Error(`Error getting contacts: ${error1.message}`);

  // Query where user is in user_id
  const { data: contacts2, error: error2 } = await supabase
    .from('contacts')
    .select('other_user_id')
    .eq('user_id', user_id);

  if (error2) throw new Error(`Error getting contacts: ${error2.message}`);


  // Extract IDs and merge results
  const connectedUserIds = [
    ...(contacts1?.map(c => c.user_id) || []),
    ...(contacts2?.map(c => c.other_user_id) || []),
  ];

  // Step 2: Query users table for info on connectedUserIds
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*') // Adjust fields you want here
    .in('id', connectedUserIds);

  if (usersError) throw usersError;

  return users.map(it => it as SupabaseUser);
}

export const getGroups = async (userId: string) => {
  const {data: groups, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("member_id", userId)
  if (error) {
    throw new Error (`Error fetching groups ${error.message}`)
  }
  
  return groups.map(it => it as RoomEntry).map(it => ({
    id: it.room_id,
    name: it.name,
    last_message: "testing last message",
    unread: 1,
    created_at: it.created_at
  } as Room))
}