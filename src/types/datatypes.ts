export interface Message {
  speaker: string;
  chat_message: string;
  time?: string; // this is not always needed as sql can create the by default
  isOptimistic: boolean; // load optimistically for better effect
};