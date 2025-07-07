"use client";
import { Input, Avatar, Typography, List, Button, Popover } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import { Room } from "@/types/datatypes";
import { useUser } from "@clerk/nextjs";
import { getGroups } from "@/utils/api";

const { Text } = Typography;

export function ChatsPage() {
  const router = useRouter();
  const { user } = useUser();
  const [searchText, setSearchText] = useState("");
  const [groupChats, setGroupChats] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      return;
    }
    const helper = async () => {
      setLoading(true);
      const g = await getGroups(user?.id);
      setGroupChats(g);
      setLoading(false);
    };
    helper();
  }, [user?.id]);

  const filteredChats = groupChats.filter((chat) =>
    chat.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const jumpToRoomCreation = () => {
    router.push("/lobby");
  };

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
            onClick={() => router.push(`/togethere/${chat.id}`)}
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
