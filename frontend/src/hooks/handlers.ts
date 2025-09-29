// this file is for writing the default functions for the websocket
// if not overloaded, these functions will be used by default
// to follow the stompjs function type, all of them should take (message: IMessage) as parameter

import { Room, SupabaseUser } from "@/types/datatypes";
import { StompHandler } from "./stompUtils";
// import globalStore from "@/store";
import { STORAGE_PATH } from "@/utils/utils";
import path from "path";
import fileService from "@/utils/fileService";
import { appendJsonl, deleteJsonlById, findJsonlById, replaceJsonlById } from "@/utils/json";
import { findUserById } from "@/utils/user";
import { PendingFileFormat } from "@/types/fileFormat";
import { getAllGroupsFilePath, getContactsFilePath, getRoomFilePath, getPendingFilePath } from "@/utils/fileService/commonFilePaths";
import { getContacts, getRoom } from "@/utils/api";
import { PersonalChatMessage } from "@/utils/messaging/types";

// when getting a message, we identify the group this comes from and save it to the corresponding group
export const processPersonalMessage: StompHandler = async (msg, user) => {
  // personal messages have a roomId, we assume the rooms is certain to only contain the 2 people
  if (msg.metadata.scope === "personal" && msg.metadata.type === "message") {
    const typedMsg = msg as PersonalChatMessage
    const sender = typedMsg.chat_room_id;
    if (!sender) {
      console.warn("⚠️ Personal message without receiver, ignoring:", msg);
      return;
    }
    // for personal messages, there is no roomId on the server side
    // however, for simplicity, we will use the other user's id for the roomId (WARNING: inconsistency between the server and client)
    // then this is the same as normal messages.
    const filePath = path.join(STORAGE_PATH, user.id, sender + `.jsonl`);
    // if room not exist on local, create it
    if (!await fileService.existsFile(filePath)) {
      await fileService.createFile(filePath)
    }
    // append the message to the file
    await appendJsonl(filePath, msg);
  }
}

export const processGreetingMessage: StompHandler = async (msg, user) => {
  // greeting messages dont have a roomId, but we should save the msg entry to pending.jsonl
  if (msg.metadata.scope === "personal" && msg.metadata.type === "greeting") {
    // we find the speaker of the greeting, and look up who this person is, as we need the details of this person
    const sender: SupabaseUser | null = await findUserById(msg.speaker)
    if (!sender) {
      // if no sender, this message is invalid
      console.log("No sender found for greeting message, ignoring:", msg)
      return
    }
    const pendingEntry: PendingFileFormat = {
      user: sender,
      last_msg: msg
    }
    const filePath = path.join(STORAGE_PATH, user.id, `pending.jsonl`);
    // if pending not exist on local, create it
    if (!await fileService.existsFile(filePath)) {
      await fileService.createFile(filePath)
    }
    // append the message to the file
    await appendJsonl(filePath, pendingEntry);
  }
}

export const processInviteMessage: StompHandler = async (msg, user) => {
  // if invite, just check if the group exist, if not, create on local
  // should not assume the message is always send after a invite, as we may want the user to be able to
  // configure stop showing the group if inactive, but then if messages, we should tell the user
  // so the only different of invite and normal messages is
  // for invite, the room almost can be certain does not exist on local, for normal, check
  if (msg.metadata.scope === "public" && msg.metadata.type === "invite") {
    await processNormalAndInviteMessage(msg, user)
  }
}

export const processNormalMessage: StompHandler = async (msg, user) => {
  // normal message, just save to te corresponding group, and check if the group exists or not
  if (msg.metadata.scope === "public" && msg.metadata.type === "message") {
    await processNormalAndInviteMessage(msg, user)
  }
}

// this should not be seen as a handler, it is just because invite and normal share the same logic
export const processNormalAndInviteMessage: StompHandler = async (msg, user) => {
  const roomFilePath = getAllGroupsFilePath(user.id)
  const groupFilePath = getRoomFilePath(user.id, msg.chat_room_id)
  if (!await fileService.existsFile(roomFilePath)) {
    await fileService.createFile(roomFilePath)
  }
  if (!await fileService.existsFile(groupFilePath)) {
    await fileService.createFile(groupFilePath)
  }
  // if group not exist on local, create it
  const existingGroup = await findJsonlById<Room>(groupFilePath, msg.chat_room_id)
  if (!existingGroup) {
    // if the room does not exist in server, we restrict this request
    const groupData = await getRoom(msg.chat_room_id)
    if (groupData) {
      const group: Room = {
        id: groupData.id,
        name: groupData.name,
        unread: 1,
        created_at: groupData.created_at,
        creator_id:groupData.creator_id,
        last_message: msg,
        type: groupData.type,
        members: groupData.members
      }
      await appendJsonl(roomFilePath, group)
    } else {
      console.log("the room doesnt exist")
    }
    await appendJsonl(groupFilePath, msg) // only when the room does not exist should we append it to the local file
  } // can do {...groupData, unread: 0, last_message: msg}, but want to ensure data valid-ness
  else {
    // update unread count
    const group: Room = {
      id: existingGroup.id,
      name: existingGroup.name,
      unread: Number(existingGroup.unread) + 1,
      created_at: existingGroup.created_at,
      creator_id: existingGroup.creator_id,
      last_message: msg,
      type: existingGroup.type,
      members: existingGroup.members
    }

    await replaceJsonlById(roomFilePath, group)
  }
}

export const processAcceptGreetingMessage: StompHandler = async (msg, user) => {
  // accept greeting message, upon receiving, just save the contact and try to delete the entry in pending
  if (msg.metadata.scope == "personal" && msg.metadata.type == "accept greeting") {

    // file paths
    const contactsFilePath = getContactsFilePath(user.id)
    const pendingFilePath = getPendingFilePath(user.id)

    // if the files dont exist, create them
    if (!await fileService.existsFile(contactsFilePath)) {
      await fileService.createFile(contactsFilePath)
    }
    if (!await fileService.existsFile(pendingFilePath)) {
      await fileService.createFile(pendingFilePath)
    }

    // just a check, since we need to get the user anyway in the frontend
    const sender = await findUserById(msg.speaker);

    if (!sender) {
      console.log("the user does not exist");
      return
    }

    // save the contacts:
    await appendJsonl(contactsFilePath, sender)

    // create group (contacts are treated as rooms for simple organization)
    const room = await getContacts(user.id, msg.speaker)
    if (!room) {
      throw new Error("the room does not exist")
    }
    await appendJsonl(getAllGroupsFilePath(user.id), {
      id: room.id,
      name: room.name,
      created_at: room.created_at,
      creator_id: room.creator_id,
      type: "personal", // this marks whether contact or group chat
      unread: 1,
      last_message: msg,
      status: "created", // we need to mark the status as created
      members: [user, sender]
    } as Room)

    // might have A -> greeting B and B -> greeting -> A at the same time
    // if we are in A's perspective, then the accept greeting is sent from B
    // and we should delete B from the pending list
    await deleteJsonlById(pendingFilePath, sender.id)
  }
}

export const processDeleteMessage: StompHandler = async (msg, user) => {
  if (msg.metadata.scope == "personal" && msg.metadata.type == "delete contact") {
    // should not just remove the contact from the list
    // rather, we should remove the entry of say 1: current, 2: other
    // 1: other, 2: current may be kept, but cannot send messages unless they add again
    // but I am considering that when the user deleted a contact, remove both entries, so its easier for chat
    // but if A delete B, we should keep A in B's contact?
    // A deletes B, speaker is A, receiver is B

    // remove B from A's contact list
    const contactsFilePath = getContactsFilePath(user.id)
    await deleteJsonlById(contactsFilePath, msg.speaker)

    // the psql entry is already deleted when A deletes the contact
  }
}