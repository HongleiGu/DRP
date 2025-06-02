export interface Message {
  id?: string;
  speaker: string;
  speaker_name: string;
  chat_message: string;
  time: string;
  is_optimistic?: boolean;
  chat_room_id: string;
}

export interface Room {
  id: string;
  name?: string;
  created_at: string;
}