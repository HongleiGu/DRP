import { Message } from "@/types/datatypes";

export interface greetingMessage extends Message {
  chat_room_id: "",
  metadata: {
    scope: "personal",
    type: "greeting",
    data: null
  }
}

export interface acceptGreetingMessage extends Message {
  chat_room_id: "",
  metadata: {
    scope: "personal",
    type: "accept greeting",
    data: null
  }
}

export interface inviteMessage extends Message {
  metadata: {
    scope: "public",
    type: "invite",
    data: null
  }
}