export interface Message {
  id?: string;
  speaker: string;
  speaker_name: string;
  chat_message: string;
  created_at: string;
  is_optimistic?: boolean;
  chat_room_id: string;
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

// Define TypeScript interfaces
export interface CalendarEntry {
  id: number;
  room_id: string;
  user_id: string;
  date: string; // YYYY-MM-DD format
  content: string;
  created_at: string;
  updated_at: string;
}

export interface PlayerData {
  id: string; // useless
  user_id: string;
  name: string;
  room_id: string;
  x: number;
  y: number;
  direction: Direction
}

export type Direction = "up" | "down" | "right" | "left"