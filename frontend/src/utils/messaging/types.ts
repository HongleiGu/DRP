import { Message } from "@/types/datatypes";

// greeting message, sent when a user tries to establish connection with another user
export interface GreetingMessage extends Message {
  chat_room_id: "",
  metadata: {
    scope: "personal",
    type: "greeting",
    data: null
  }
}

// reply to the greeting
export interface AcceptGreetingMessage extends Message {
  chat_room_id: "",
  metadata: {
    scope: "personal",
    type: "accept greeting",
    data: {
      room_id: string
    }
  }
}

// group invite message
export interface InviteMessage extends Message {
  metadata: {
    scope: "public",
    type: "invite",
    data: null
  }
}

// 1-to-1 personal chat message
export interface PersonalChatMessage extends Message {
  metadata: {
    scope: "personal",
    type: "message",
    data: null // the sender is the speaker, the receiver is the user him/herself
  }
}