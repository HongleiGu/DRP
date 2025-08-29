import path from "path";
import { STORAGE_PATH } from "../utils";

export function getAllGroupsFilePath(userId: string) {
  return path.join(STORAGE_PATH, userId, `groups.jsonl`);
}

export function getPendingFilePath(userId: string) {
  return path.join(STORAGE_PATH, userId, `pending.jsonl`);
}

export function getContactsFilePath(userId: string) {
  return path.join(STORAGE_PATH, userId, `contacts.jsonl`);
}

export function getRoomFilePath(userId: string, roomId: string) {
  return path.join(STORAGE_PATH, userId, roomId + `.jsonl`);
}