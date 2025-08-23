import { SupabaseUser } from "@/types/datatypes";
import { acceptGreetingMessage, greetingMessage, inviteMessage } from "./types";
import { v4 as uuidv4 } from 'uuid';
import { sendMessage } from "./messages";

export async function sendGreetings(userId: string, username: string, targetId: string): Promise<void> {
  const msg: greetingMessage = {
    id: uuidv4(),
    speaker: userId,
    speaker_name: username,
    chat_message: `${username} has sent you a friend request.`,
    chat_room_id: "",
    created_at: new Date().toISOString(),
    metadata: {
      scope: "personal",
      type: "greeting",
      data: null
    }
  }
  await sendMessage(msg, targetId)
}

export async function sendAcceptGreetings(userId: string, username: string, targetId: string): Promise<void> {
  const msg: acceptGreetingMessage = {
    id: uuidv4(),
    speaker: userId,
    speaker_name: username,
    chat_message: `${username} has accepted your friend request.`,
    chat_room_id: "",
    created_at: new Date().toISOString(),
    metadata: {
      scope: "personal",
      type: "accept greeting",
      data: null
    }
  }
  await sendMessage(msg, targetId)
}

export async function sendInviteMessage(user: SupabaseUser, roomId: string, userIds: string[]): Promise<void> {
  const msg: inviteMessage = {
    id: uuidv4(),
    speaker: user.id!,
    speaker_name: user.username!,
    chat_message: `${user.username} has invited you to join room ${roomId}.`,
    chat_room_id: roomId,
    created_at: new Date().toISOString(),
    metadata: {
      scope: "public",
      type: "invite",
      data: null
    }
  }
  for (let i of userIds) {
    await sendMessage(msg, i);
  }
}