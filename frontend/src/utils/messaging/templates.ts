import { SupabaseUser } from "@/types/datatypes";
import { v4 as uuidv4 } from 'uuid';
import { sendMessage, sendMessageToRoom } from "./messages";
import { GreetingMessage, AcceptGreetingMessage, DeleteContactsMessage, InviteMessage } from "./types";

export async function sendGreetings(userId: string, username: string, targetId: string): Promise<void> {
  const msg: GreetingMessage = {
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

export async function sendAcceptGreetings(userId: string, username: string, targetId: string, roomId: string): Promise<void> {
  const msg: AcceptGreetingMessage = {
    id: uuidv4(),
    speaker: userId,
    speaker_name: username,
    chat_message: `${username} has accepted your friend request.`,
    chat_room_id: "",
    created_at: new Date().toISOString(),
    metadata: {
      scope: "personal",
      type: "accept greeting",
      data: {
        room_id: roomId
      }
    }
  }
  await sendMessage(msg, targetId)
}

export async function sendDeleteMessage(userId: string, username: string, targetId: string, roomId: string): Promise<void> {
  const msg: DeleteContactsMessage = {
    id: uuidv4(),
    speaker: userId,
    speaker_name: username,
    chat_message: `${username} removed you from his/her contact`,
    chat_room_id: roomId,
    created_at: new Date().toISOString(),
    metadata: {
      scope: "personal",
      type: "delete contact",
      data: null
    }
  }
  await sendMessage(msg, targetId)
}

export async function sendInviteMessage(user: SupabaseUser, roomId: string, userIds: string[]): Promise<void> {
  const msg: InviteMessage = {
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
  // send invite to the users
  for (const i of userIds) {
    if (i == user.id) continue
    await sendMessage(msg, i);
  }

  // inform the other users in the room someone is invited
  await sendMessageToRoom(msg, roomId)
}