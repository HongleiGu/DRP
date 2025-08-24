// stompService.ts
import { Client } from "@stomp/stompjs";
import { Message, SupabaseUser } from "@/types/datatypes";

export type StompHandler = (
  msg: Message,
  user: SupabaseUser,
  client?: Client
) => Promise<void>;

export type StompHandlerNames = "processPersonalMessage" |
  "processGreetingMessage" |
  "processInviteMessage" |
  "processNormalMessage" |
  "processAcceptGreetingMessage" |
  "onRender"

export type StompHandlers = Record<StompHandlerNames, StompHandler>;

import {
  processPersonalMessage,
  processGreetingMessage,
  processInviteMessage,
  processNormalMessage,
  processAcceptGreetingMessage,
} from "./handlers";

export const defaultHandlers: StompHandlers = {
  processPersonalMessage,
  processGreetingMessage,
  processInviteMessage,
  processNormalMessage,
  processAcceptGreetingMessage,
  onRender: async () => {}
};
