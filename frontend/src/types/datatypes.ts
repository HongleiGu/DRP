"use client"

export type MessageScope = "public" | "personal";
export type MessageType = "message" | "invite" | "greeting" | "accept greeting";

export interface Message {
  id: string;  // UUID for unique message ID
  speaker: string;  // ID of the speaker
  speaker_name: string;  // Name of the speaker
  chat_message: string;  // The actual chat message
  created_at: string;  // Timestamp when the message was created
  chat_room_id: string;  // Unique ID for the chatroom
  metadata: {
    scope: MessageScope,
    type: MessageType,
    data: unknown // not any as eslint unhappy, this should be any data, if taking all possible and future circumstances
  }
}


// Define a type for scene callbacks
export type SceneCallbacks = {
    showInteractButtonTV?: (show: boolean) => void;
    showInteractButtonCalendar?: (show: boolean) => void;
    // Add more callback methods as needed
    // onPlayerPositionChange?: (position: Vector) => void;
    // onGameEvent?: (event: string, data: any) => void;
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

export interface SupabaseUser {
  id: string;
  username: string;
  onboarding_complete: boolean;
  avatar_id: number;
  created_at?: string;
  email: string; // since supabase only supports email/password auth, this is required
}


export interface Group {
  id: string;
  name: string;
  last_message: Message | null;
  unread: number;
  created_at: string;
  creator_id: string;
  type: "personal" | "group" // for a group, we dont allow any updates
  // members: SupabaseUser[]; // members should be fetched from backend for safety
}


export interface GroupEntry {
  id: string;
  name: string;
  created_at: string;
  creator_id: string;
  // members: SupabaseUser[]; // members should be fetched from backend for safety
}

export interface ElectronResponse {
  success: boolean;
  error?: string;  // Optional error message if the operation failed
  // since all operations return a string, we can use data to store the content
  data?: unknown;  // Optional data returned from the operation
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

// store/types.ts
export interface globalStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface Response {
  code: number;
  msg: string;
  data?: unknown; // not even certain this exists
}

export interface AuthResponse {
  user: SupabaseUser,
  token: string
}