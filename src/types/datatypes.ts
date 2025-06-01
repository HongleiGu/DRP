// since supabase use object insertion, the keys have to be the same

export interface Message {
  chat_room_id: string;
  speaker: string;
  speaker_name: string; // maybe we should claim the usernames from id, just in case the database is corrupted
  chat_message: string;
  time?: string; // this is not always needed as sql can create the by default
  is_optimistic: boolean; // load optimistically for better effect
};

// TODO refactor database structure to include chatroom Id for safer database queries


export interface PlayerPosition {
  x: number;
  y: number;
  anim: string;
  timestamp?: string;
}
