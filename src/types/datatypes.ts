export interface Message {
  id?: string;  // UUID for unique message ID
  speaker: string;  // ID of the speaker
  speaker_name: string;  // Name of the speaker
  chat_message: string;  // The actual chat message
  created_at: string;  // Timestamp when the message was created
  chat_room_id: string;  // Unique ID for the chatroom
  video_url?: string;  // URL of video (if any)
  video_time?: number;  // Timestamp of video time (if any)
}


// export interface Room {
//   id: string;
//   name?: string;
//   created_at: string;
//   creator_id: string;
// }

// not necessarily data types, but useful

// Define a type for scene callbacks
export type SceneCallbacks = {
    showInteractButtonTV?: (show: boolean) => void;
    showInteractButtonCalendar?: (show: boolean) => void;
    // Add more callback methods as needed
    // onPlayerPositionChange?: (position: Vector) => void;
    // onGameEvent?: (event: string, data: any) => void;
}

export interface TVState {
  room_id: string,
  channel: string,
  is_playing: boolean,
  time: number; // the number of seconds in the video, only updated when paused, reload, seek
}

export interface CalendarEntry {
  id?: number; // optional for inserts
  room_id: string;
  user_id: string;
  date: string;
  emoji: string;
  content: string;
  note?: string | null;
  created_at?: string;
  updated_at?: string;
  reserved_time?: string;
  video_id?: string;
  timezone?: string;
}


export interface PlayerData {
  id: string; // useless
  user_id: string;
  name: string;
  room_id: string;
  x: number;
  y: number;
  direction: Direction;
  avatarId: string
}

export type Direction = "up" | "down" | "right" | "left"

// Type for the YouTube API response
export interface YouTubeApiResponse {
  items: {
    snippet: {
      title: string;
      description: string;
      categoryId: string;
      thumbnails: {
        default: { url: string };
        medium: { url: string };
        high: { url: string };
        standard?: { url: string };
      };
      publishedAt: string;
      channelTitle: string;
    };
  }[];
  error?: {
    message: string;
    code: number;
    errors: {
      message: string;
      domain: string;
      reason: string;
    }[];
  };
}

export interface VideoInfo {
  title: string;
  description: string;
  category: string;
  thumbnails: YouTubeApiResponse['items'][0]['snippet']['thumbnails'];
  publishedAt: string;
  channelTitle: string;
}

export interface SupabaseUser {
  id: string;
  username: string;
  onboarding_complete: boolean;
  avatar_id: number;
  created_at?: string;
  email: string; // since supabase only supports email/password auth, this is required
}

export interface RoomEntry {
  id: string;
  created_at: string;
  name: string;
  creator_id: string;
  member_id: string;
  last_read_at: string;
  room_id: string;
}

export interface Room {
  id: string;
  name: string;
  last_message: string;
  unread: number;
  created_at: string;
}

export interface ElectronResponse {
  success: boolean;
  error?: string;  // Optional error message if the operation failed
  // since all operations return a string, we can use data to store the content
  data?: string;  // Optional data returned from the operation
}

// this should match the api exposed in preload.js
// and the functions in main/functions.ts
export interface ElectronApi {
  writeFile(filePath: string, content: string): Promise<ElectronResponse>;
  readFile(filePath: string): Promise<ElectronResponse>;
  createFile(filePath: string): Promise<ElectronResponse>;
  deleteFile(filePath: string): Promise<ElectronResponse>;
  getFiles(directory: string): Promise<ElectronResponse>;
  existsFile(filePath: string): Promise<ElectronResponse>;
}

export interface SignInArgs {
  email?: string
  password: string
  username?: string
}