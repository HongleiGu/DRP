// components/ProtectedContent.tsx
"use client";
import { UserButton, useUser } from "@clerk/nextjs";
import { RedirectToSignIn } from "@clerk/nextjs";
import { LoadingSpinner } from "@/components/Lumiroom/LoadingSpinner";
import { Layout, Input, Avatar, Typography, List, Button, FloatButton } from "antd";
import { 
  UserOutlined, 
  SearchOutlined, 
  PlusOutlined,
  WechatOutlined,
  EditOutlined
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { PROJECT_NAME_CAPITALIZED } from "@/utils/utils";
import { useState } from "react";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

// Mock data for group chats
const mockGroupChats = [
  {
    id: "1",
    name: "Design Team",
    lastMessage: "Can someone review the new mockups?",
    timestamp: "10:30 AM",
    unread: 3,
    avatarColor: "#1890ff"
  },
  {
    id: "2",
    name: "Project Alpha",
    lastMessage: "Meeting moved to 3 PM tomorrow",
    timestamp: "Yesterday",
    unread: 0,
    avatarColor: "#52c41a"
  },
  {
    id: "3",
    name: "Family Group",
    lastMessage: "Mom sent a photo",
    timestamp: "Yesterday",
    unread: 12,
    avatarColor: "#f5222d"
  },
  {
    id: "4",
    name: "College Friends",
    lastMessage: "Who's joining the reunion?",
    timestamp: "Mon",
    unread: 0,
    avatarColor: "#faad14"
  },
  {
    id: "5",
    name: "Client Discussions",
    lastMessage: "I'll send the proposal by EOD",
    timestamp: "Sun",
    unread: 0,
    avatarColor: "#722ed1"
  },
];

export default function ProtectedContent() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const [searchText, setSearchText] = useState("");

  if (!isLoaded) return <LoadingSpinner />;
  if (!user) return <RedirectToSignIn />;

  const filteredChats = mockGroupChats.filter(chat => 
    chat.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Layout className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header className="bg-white flex justify-between items-center px-4 py-3 shadow-sm">
        <div className="flex items-center">
          <WechatOutlined className="text-blue-500 text-2xl mr-3" />
          <Title level={4} className="m-0 text-gray-800">{PROJECT_NAME_CAPITALIZED}</Title>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            type="text" 
            icon={<EditOutlined className="text-gray-600" />} 
            className="flex items-center"
          />
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                userButtonAvatarBox: "w-9 h-9 border-2 border-white shadow-md"
              }
            }}
          />
        </div>
      </Header>

      {/* Search Bar */}
      <div className="bg-white px-4 py-3 border-b">
        <Input
          placeholder="Search chats"
          prefix={<SearchOutlined className="text-gray-400" />}
          className="rounded-lg bg-gray-100 border-0 hover:bg-gray-200 focus:bg-white"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {/* Chat List */}
      <Content className="overflow-auto">
        <List
          itemLayout="horizontal"
          dataSource={filteredChats}
          className="bg-white"
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
                    <Text strong className="text-gray-800">{chat.name}</Text>
                    <Text type="secondary" className="text-xs">{chat.timestamp}</Text>
                  </div>
                }
                description={
                  <div className="flex justify-between">
                    <Text 
                      ellipsis 
                      className="max-w-[80%] text-gray-600"
                    >
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
      </Content>

      {/* New Chat Button */}
      <FloatButton 
        icon={<PlusOutlined />}
        type="primary"
        className="right-8 bottom-8 shadow-lg"
        tooltip="New Chat"
        onClick={() => router.push("/lobby")}
      />
    </Layout>
  );
}