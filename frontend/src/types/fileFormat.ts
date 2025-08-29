import { Room, Message, SupabaseUser } from "./datatypes";

export type ContactsFileFormat = SupabaseUser
export type GroupsFileFormat = Room
export type PendingFileFormat = {
  user: SupabaseUser,
  last_msg: Message | null
}