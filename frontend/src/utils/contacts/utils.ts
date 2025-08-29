import { SupabaseUser, Room } from "@/types/datatypes";
import { Message } from "@/types/datatypes";
import path from "path";
import { createRoom, addContacts, getContacts, deleteUserFromRoom } from "../api";
import { deleteAllJsonlByProperty, appendJsonl, deleteJsonlById } from "../json";
import { sendAcceptGreetings } from "../messaging/templates";
import { STORAGE_PATH, formatDate } from "../utils";
import { getAllGroupsFilePath, getContactsFilePath } from "../fileService/commonFilePaths";

export const acceptGreeting = async (currentUser: SupabaseUser, target: SupabaseUser, msg: Message | null, renderfunc: (target: SupabaseUser) => void) => {
  const filePath = path.join(STORAGE_PATH, currentUser.id, "contacts.jsonl");
  const pendingFilePath = path.join(STORAGE_PATH, currentUser.id, "pending.jsonl");

  // set the pending list
  // setPendingList(pendingList.filter(it => it.currentUser.id !== target.id));
  renderfunc(target)

  // although its a 1-to-1 contact, we still treat it as a room for simplicity
  const a = await createRoom([target, currentUser], currentUser.id, `${target.username} and ${currentUser.username}`, "personal", msg)
  await addContacts(target.id, currentUser.id, a.id)
  await addContacts(currentUser.id, target.id, a.id)
  sendAcceptGreetings(currentUser.id, currentUser.username, target.id, a.id);
  await deleteAllJsonlByProperty(pendingFilePath, "user.id", target.id);
  await appendJsonl(filePath, target);

  const group: Room = {
    id: a.id,
    name: a.name,
    last_message: msg,
    unread: 1,
    created_at: formatDate(),
    creator_id: currentUser.id,
    type: "personal",
    members: [target, currentUser]
  };
  await appendJsonl(path.join(STORAGE_PATH, currentUser.id, "groups.jsonl"), group);
};

export const deleteContact = async (currentUser: SupabaseUser, target: SupabaseUser, renderfunc: (target: SupabaseUser) => void = () => {}) => {
  const contactsFilePath = getContactsFilePath(currentUser.id)
  const groupFilePath = getAllGroupsFilePath(currentUser.id)

  // first remove it from the contact list in the interface
  // setContactList(contactsList.filter(it => it.id != target.id))
  renderfunc(target)

  // get the roomId
  const room = await getContacts(target.id, currentUser.id)

  // remove the entry from psql
  await deleteUserFromRoom(target.id, room.id)

  // remove what is in the contacts.jsonl and group.jsonl

  await deleteJsonlById(groupFilePath, room.id)
  await deleteAllJsonlByProperty(contactsFilePath, "user.id", target.id)
}