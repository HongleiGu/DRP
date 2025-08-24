import { Group, Message, SupabaseUser } from "./datatypes";

export type ContactsFileFormat = SupabaseUser
export type GroupsFileFormat = Group
export type PendingFileFormat = {
  user: SupabaseUser,
  last_msg: Message | null
}