"use client";
import { Input, Avatar, Typography, List, Button, FloatButton, Popover } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";

// Replace mockGroupChats with your real data as needed
const mockGroupChats = [
  {
    id: "1",
    name: "Design Team",
    lastMessage: "Can someone review the new mockups?",
    timestamp: "10:30 AM",
    unread: 3,
    avatarColor: "#1890ff",
  },
  // ...
];

const { Text } = Typography;

export function ChatsPage() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");

  const filteredChats = mockGroupChats.filter((chat) =>
    chat.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const jumpToRoomCreation = () => {
    router.push("/lobby")
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
        <Popover
          content={<p>somemthing</p>} 
          trigger="click"
          placement="bottom"
        >
          <Button onClick={jumpToRoomCreation} icon={<PlusOutlined />} />
        </Popover>
      </div>
      <List
        itemLayout="horizontal"
        dataSource={filteredChats}
        className="flex-1 overflow-auto"
        renderItem={(chat) => (
          <List.Item
            className="cursor-pointer hover:bg-gray-50 px-4 py-3 border-b"
            onClick={() => router.push(`/chat/${chat.id}`)}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  style={{ backgroundColor: chat.avatarColor }}
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
                    {chat.timestamp}
                  </Text>
                </div>
              }
              description={
                <div className="flex justify-between">
                  <Text ellipsis className="max-w-[80%] text-gray-600">
                    {chat.lastMessage}
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
