export interface Message {
  id?: string;
  speaker: string;
  speaker_name: string;
  chat_message: string;
  created_at: string;
  // is_optimistic?: boolean;
  chat_room_id: string;
  video_url?: string;
  video_time?: number;
}

export interface Room {
  id: string;
  name?: string;
  created_at: string;
}

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