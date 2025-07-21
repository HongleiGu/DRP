"use client";
import { Input, Avatar, Typography, List, Button, Popover } from "antd";
// import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import { Room, SupabaseUser } from "@/types/datatypes";
import '@/app/antd.css';
import { PROJECT_NAME, STORAGE_PATH } from "@/utils/utils";
import globalStore from "@/store";
import path from "path";
import { createFile, existsFile } from "@/utils/electronApi";
import { parseJsonlToTypedObjects } from "@/utils/json";

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

  useEffect(() => {
    if (!isMounted || !user?.id) return;
    
    const fetchGroups = async () => {
      setLoading(true);
      try {
        // TODO: add loading chatgroups from local files
        // file path should be ./storage/{userId}/groups.jsonl
        // use the json.ts helper functions
        // the idea is: on groups creation, the creator inserts a message for every other member in redis
        // with key member user id or a single fixed key group creation
        // then on enter it should do the same as message queue 
        // (if an entry for this user is found, then add to local file and delete the entry)
        const filePath = path.join(STORAGE_PATH, user.id,  "groups.jsonl");
        if (!(await existsFile(filePath))) {
          await createFile(filePath)
        }
        const groups = await parseJsonlToTypedObjects<Room>(filePath)
        // const groups = await getGroups(user.id);
        setGroupChats(groups);
      } catch (error) {
        console.error("Failed to fetch groups:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
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