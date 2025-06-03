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

// not necessarily data types, but useful

// Define a type for scene callbacks
export type SceneCallbacks = {
    showInteractButton?: (show: boolean) => void;
    // Add more callback methods as needed
    // onPlayerPositionChange?: (position: Vector) => void;
    // onGameEvent?: (event: string, data: any) => void;
}