"use client";
import { Input, Avatar, Typography, List, Button, Popover } from "antd";
// import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import { Message, MessageScope, Room, SupabaseUser } from "@/types/datatypes";
import '@/app/antd.css';
import { PROJECT_NAME, STORAGE_PATH } from "@/utils/utils";
import globalStore from "@/store";
import path from "path";
import { createFile, existsFile } from "@/utils/electronApi";
import { parseJsonlToTypedObjects, replaceJsonlById } from "@/utils/json";
import { useStompClient } from "@/hooks/useStompClient";
import { getMessages } from "@/utils/messages";

const { Text } = Typography;

export function ChatsPage() {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  // const router = useRouter();
  const [searchText, setSearchText] = useState<string>("");
  const [groupChats, setGroupChats] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [user, setUser] = useState<SupabaseUser>(null!)

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const helper = async () => {
      const u = JSON.parse(await globalStore.getItem('lumiroom-user') ?? "{}") as SupabaseUser
      setUser(u)
      if (!u || !u.id) {
        window.location.href = "/auth"
      }
    }
    helper()
  }, [isMounted])

  useStompClient({
    userId: user ? user.id : null,
    onMessage: async (msg: Message) => {
      console.log("📬 Got message in component:", msg);
      const receivedRoomId: string = msg.chat_room_id
      const targetRoomEntry: Room = groupChats.filter((it: Room) => it.id === receivedRoomId)[0]
      console.log(targetRoomEntry)
      const alteredRoomEntry: Room = {
        ...targetRoomEntry,
        unread: Number(targetRoomEntry.unread) + 1, // BUG: unsure why but the unread is a number but behaves like a string, 3 + 1 = 31
        last_message: msg.chat_message,
        created_at: Date.now().toLocaleString()
      }
      const filePath = path.join(STORAGE_PATH, user.id, `groups.jsonl`);
      setGroupChats(
        groupChats.map(it => 
          it.id === alteredRoomEntry.id ? alteredRoomEntry : it
        )
      )
      
      await replaceJsonlById(filePath, alteredRoomEntry)
    }
  })

  const fetchGroups = async () => {
    try {
      // file path should be ./storage/{userId}/groups.jsonl
      const filePath = path.join(STORAGE_PATH, user.id,  "groups.jsonl");
      if (!(await existsFile(filePath))) {
        await createFile(filePath)
      }
      const groups = await parseJsonlToTypedObjects<Room>(filePath)
      // const groups = await getGroups(user.id);
      return groups;
    } catch (error) {
      console.error("Failed to fetch groups:", error);
      return []
    }
  };

  // merge the local groups with those from redis
  // TODO: currently the room creation logic is unhandled
  const fetchFromRedis = async (localGroups: Room[]) => {
    try {
      const messages = await getMessages(user.id); // assumes user.id is present

      console.log("redis data", messages)

      // Group messages by room
      const messagesByRoom: Record<string, Message[]> = {};

      for (const msg of messages) {
        const roomKey = msg.metadata?.scope === "private" as MessageScope ? "private" : msg.chat_room_id;
        if (!messagesByRoom[roomKey]) {
          messagesByRoom[roomKey] = [];
        }
        messagesByRoom[roomKey].push(msg);
      }

      console.log("data map", messagesByRoom)

      const updatedRooms: Record<string, Room> = {};

      for (const [roomKey, msgs] of Object.entries(messagesByRoom)) {
        const localRoom = localGroups.find(g => g.id === roomKey);
        if (!localRoom) continue;

        // Find the latest message by timestamp
        const latestMsg = msgs.reduce((latest, curr) =>
          new Date(curr.created_at).getTime() > new Date(latest.created_at).getTime()
            ? curr
            : latest
        );

        updatedRooms[roomKey] = {
          ...localRoom,
          last_message: latestMsg.chat_message,
          created_at: latestMsg.created_at,
          unread: (localRoom.unread ?? 0) + msgs.length
        };
      }

      // Merge updated groups with untouched local groups
      const mergedGroups: Room[] = [
        ...localGroups.filter(g => !updatedRooms[g.id]),
        ...Object.values(updatedRooms)
      ];

      return mergedGroups;
    } catch (err) {
      console.error("❌ Failed to fetch groups from Redis:", err);
      return localGroups;
    }
  };



  useEffect(() => {
    if (!isMounted || !user?.id) return;
    const helper = async () => {
      setLoading(true);
      const localGroups: Room[] = await fetchGroups()
      const g = await fetchFromRedis(localGroups)
      console.log("merged groups", g)
      setGroupChats(g)
      setLoading(false);
    }

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

  const handleRoomClick = useCallback((chat: Room) => {
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
                    {chat.last_message}
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