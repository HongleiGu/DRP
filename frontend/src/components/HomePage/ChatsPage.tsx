"use client";
import { Input, Avatar, Typography, List, Button, Popover } from "antd";
// import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import { Message, Group, SupabaseUser } from "@/types/datatypes";
import '@/app/antd.css';
import { formatDate, PROJECT_NAME, STORAGE_PATH, veryOldDate } from "@/utils/utils";
import globalStore from "@/store";
import path from "path";
import fileService from "@/utils/fileService";
import { appendJsonl, appendJsonls, parseJsonlToTypedObjects, replaceJsonlById } from "@/utils/json";
import { useStompClient } from "@/hooks/useStompClient";
import { deleteMessage, getMessages } from "@/utils/messages";

const { Text } = Typography;

export function ChatsPage() {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  // const router = useRouter();
  const [searchText, setSearchText] = useState<string>("");
  const [groupChats, setGroupChats] = useState<Group[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [user, setUser] = useState<SupabaseUser>(null!)

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const helper = async () => {
      const u = await globalStore.getItem<SupabaseUser>('lumiroom-user')
      if (!u || !u.id) {
        window.location.href = "/auth"
        return;
      }
      setUser(u)
    }
    helper()
  }, [isMounted])

  // here, if the message comes from a new room, we add it the the local storage
  useStompClient({
    userId: user ? user.id : null,
    onMessage: async (msg: Message) => {
      console.log("📬 Got message in component:", msg);
      const filePath = path.join(STORAGE_PATH, user.id, `groups.jsonl`);
      // we assume the room is created
      // TODO: room creation, metadata type invite / create
      if (msg.metadata && msg.metadata.scope != "public") {
        const receivedRoomId: string = msg.speaker
        const targetRoomEntry: Group = groupChats.filter((it: Group) => it.id === receivedRoomId)[0]
        const alteredRoomEntry: Group = {
          ...targetRoomEntry,
          unread: Number(targetRoomEntry.unread) + 1, // BUG: unsure why but the unread is a number but behaves like a string, 3 + 1 = 31
          last_message: msg
        }
        setGroupChats(
          groupChats.map(it => 
            it.id === alteredRoomEntry.id ? alteredRoomEntry : it
          )
        )
        
        await replaceJsonlById(filePath, alteredRoomEntry)
      } else {
        const receivedRoomId: string = msg.chat_room_id
        const targetRoomEntry: Group = groupChats.filter((it: Group) => it.id === receivedRoomId)[0]
        const alteredRoomEntry: Group = {
          ...targetRoomEntry,
          unread: Number(targetRoomEntry.unread) + 1, // BUG: unsure why but the unread is a number but behaves like a string, 3 + 1 = 31
          last_message: msg
        }
        setGroupChats(
          groupChats.map(it => 
            it.id === alteredRoomEntry.id ? alteredRoomEntry : it
          )
        )
        
        await replaceJsonlById(filePath, alteredRoomEntry)
      }
    }
  })

  const fetchGroups = async () => {
    try {
      // file path should be ./storage/{userId}/groups.jsonl
      const filePath = path.join(STORAGE_PATH, user.id,  "groups.jsonl");
      if (!(await fileService.existsFile(filePath))) {
        await fileService.createFile(filePath)
      }
      const groups = await parseJsonlToTypedObjects<Group>(filePath)
      // const groups = await getGroups(user.id);
      return groups;
    } catch (error) {
      console.error("Failed to fetch groups:", error);
      return []
    }
  };

  // merge the local groups with those from redis
  // we can reasonably assume the messages in redis is sorted by time
  // TODO: currently the room creation logic is unhandled
  const fetchFromRedis = async (): Promise<Group[]> => {
    try {
      const returnGroupsChats = groupChats;
      const messages: Message[] = await getMessages(user.id); // assumes user.id is present
      console.log("redis data:", messages);
      const allMessages: Record<string, Message[]> = {};

      // Group messages by room
      for (const msg of messages) {
        const roomId = msg.metadata && msg.metadata.scope === "public" ? msg.chat_room_id : msg.speaker + "." + msg.speaker_name; // fallback for personal
        if (!allMessages[roomId]) {
          allMessages[roomId] = [];
        }
        allMessages[roomId].push(msg);
      }

      // Process each room
      for (const roomId of Object.keys(allMessages)) {
        const roomMessages = allMessages[roomId];
        const filePath = path.join(STORAGE_PATH, user.id, roomId + `.jsonl`);

        // Append all messages to chat history file
        await appendJsonls(filePath, roomMessages);
        const groupPath = path.join(STORAGE_PATH, user.id, `groups.jsonl`);


        // Get current group entry
        const localRoom = groupChats.find((room) => room.id === roomId);
        if (!localRoom) {
          // we now the speaker attr is a uuid, but the speaker_name may have dots, this is ugly, but maybe will just leave it there
          const firstDotIndex = roomId.indexOf('.');
          const speaker = roomId.substring(0, firstDotIndex);
          const speaker_name = roomId.substring(firstDotIndex + 1);
          const tempRoom = {
            id: speaker,
            name: speaker_name,
            last_message: null,
            unread: 0,
            created_at: formatDate(),
            creator_id: speaker,
          } as Group
          // I think no need to append as a final write
          returnGroupsChats.push(tempRoom);
          await appendJsonl(groupPath, tempRoom);
          await deleteMessage(user.id, speaker)
          continue
        }; // TODO: handle room creation logic

        // Sort messages by creation time
        const sorted = roomMessages.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        const latest = sorted[sorted.length - 1];

        // Update local group entry
        const updatedRoom: Group = {
          ...localRoom,
          last_message: latest,
          unread: localRoom.unread + sorted.length,
          created_at: latest.created_at,
        };

        await replaceJsonlById(groupPath, { ...updatedRoom, id: roomId });
        await deleteMessage(user.id, roomId)
      }

      return returnGroupsChats;
    } catch (err) {
      console.error("❌ Failed to fetch groups from Redis:", err);
      return groupChats;
    }
  };



  useEffect(() => {
    if (!isMounted || !user?.id) return;

    const helper = async () => {
      setLoading(true);

      const localGroups: Group[] = await fetchGroups();
      const redisGroups: Group[] = await fetchFromRedis(); // returns updated Rooms from Redis
      console.log("groups", localGroups, redisGroups)

      // Build map from localGroups
      const roomMap: Record<string, Group> = {};
      for (const room of localGroups) {
        roomMap[room.id] = room;
      }

      for (const redisRoom of redisGroups) {
        const existing = roomMap[redisRoom.id];

        if (!existing) {
          // Not in local, just add
          roomMap[redisRoom.id] = redisRoom;
        } else {
          // Exists — merge by latest message
          const isRedisNewer =
            new Date(redisRoom.last_message ? redisRoom.last_message.created_at : veryOldDate).getTime() >
            new Date(existing.last_message ? existing.last_message.created_at : veryOldDate).getTime();

          roomMap[redisRoom.id] = {
            ...existing,
            ...redisRoom,
            last_message: isRedisNewer ? redisRoom.last_message : existing.last_message,
            unread: existing.unread + redisRoom.unread,
          };
        }
      }

      const mergedGroups = Object.values(roomMap);
      setGroupChats(mergedGroups);
      const groupPath = path.join(STORAGE_PATH, user.id, `groups.jsonl`);
      await fileService.writeFile(groupPath, mergedGroups.map(it => JSON.stringify(it)).join("\n") + "\n")
      setLoading(false);
    };

    helper();
  }, [user, isMounted]);


  const filteredChats = groupChats.filter((chat) =>
    chat.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const jumpToRoomCreation = useCallback(() => {
    if (isMounted) {
      // router.push("/lobby");
      window.location.href = "/lobby"
    }
  }, [isMounted]);

  const handleRoomClick = useCallback((chat: Group) => {
    if (isMounted) {
      // useGlobalStore.setState({ roomId: chat.id });
      globalStore.setItem('lumiroom-room', chat.id)
      // router.push(`/togethere/`);
      window.location.href = `${PROJECT_NAME}`
    }
  }, [isMounted]);

  if (!isMounted) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 border-b flex flex-row gap-4">
          <Input
            placeholder="Search chats"
            prefix={<SearchOutlined className="text-gray-400" />}
            className="rounded-lg bg-gray-100 border-0 hover:bg-gray-200 focus:bg-white"
            disabled
          />
          <Button icon={<PlusOutlined />} disabled />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p>Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b flex flex-row gap-4">
        <Input
          placeholder="Search chats"
          prefix={<SearchOutlined className="text-gray-400" />}
          className="rounded-lg bg-gray-100 border-0 hover:bg-gray-200 focus:bg-white"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Popover content={<p>new chat</p>} trigger="click" placement="bottom">
          <Button onClick={jumpToRoomCreation} icon={<PlusOutlined />} />
        </Popover>
      </div>
      <List
        loading={loading}
        itemLayout="horizontal"
        dataSource={filteredChats}
        className="flex-1 overflow-auto"
        renderItem={(chat) => (
          <List.Item
            className="cursor-pointer hover:bg-gray-50 px-4 py-3 border-b"
            onClick={() => handleRoomClick(chat)}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  style={{ backgroundColor: "blue" }}
                  className="flex items-center justify-center"
                  size="large"
                >
                  {chat.name.charAt(0)}
                </Avatar>
              }
              title={
                <div className="flex justify-between">
                  <Text strong className="text-gray-800">
                    {chat.name}
                  </Text>
                  <Text type="secondary" className="text-xs">
                    {chat.created_at}
                  </Text>
                </div>
              }
              description={
                <div className="flex justify-between">
                  <Text ellipsis className="max-w-[80%] text-gray-600">
                    {chat.last_message ? chat.last_message.chat_message : ""}
                  </Text>
                  {chat.unread > 0 && (
                    <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {chat.unread}
                    </span>
                  )}
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
}