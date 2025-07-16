"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Layout, Typography, Popover, Button, Avatar } from "antd";
import {
  WechatOutlined,
  ContactsOutlined,
  UserOutlined,
  LogoutOutlined,
  LoginOutlined,
} from "@ant-design/icons";

import { ChatsPage } from "@/components/HomePage/ChatsPage";
import { ContactsPage } from "@/components/HomePage/ContactsPage";
import { ProfilePage } from "@/components/HomePage/ProfilePage";
import { useGlobalStore } from "@/store";
import { signOut } from "@/utils/user";

const { Header, Content } = Layout;
const { Title } = Typography;

export default function HomePage() {
  const { user } = useGlobalStore.getState();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"chats" | "contacts" | "profile">(
    "chats"
  );

  useEffect(() => {
    console.log("Current user:", user);
    if (!user) {
      router.push("/auth");
    }
  }, [user, router]);

  // if (isLoading) return <LoadingSpinner />;
  // if (!user) return <LoadingSpinner />; // or null while redirecting

  const popoverContent = (
    <div className="flex flex-col gap-2">
      {user ?
        <Button
          type="text"
          icon={<LogoutOutlined />}
          onClick={() => {
            signOut();
            router.push("/auth");
          }}
        >
          Sign out
        </Button>
      :
        <Button
          type="text"
          icon={<LoginOutlined />}
          onClick={() => router.push("/auth")}
        >
          Sign in
        </Button>
      }
    </div>
  );

  return (
    <Layout className="min-h-screen bg-gray-50 flex flex-col">
      <Header className="bg-white flex justify-between items-center px-4 py-3 shadow-sm">
        <div className="flex items-center">
          <WechatOutlined className="text-blue-500 text-2xl mr-3" />
          <Title level={4} className="m-0 text-gray-800">
            Chat App
          </Title>
        </div>

        <Popover
          content={popoverContent}
          trigger="click"
          placement="bottomRight"
          arrow={false}
        >
          <Button
            type="text"
            className="w-9 h-9 border-2 border-white shadow-md rounded-full flex items-center justify-center p-0"
          >
            <Avatar style={{ backgroundColor: "#1890ff" }}>
              {user?.username?.[0].toUpperCase() || "U"}
            </Avatar>
          </Button>
        </Popover>
      </Header>

      <Content className="flex-1 overflow-auto bg-white">
        {activeTab === "chats" && <ChatsPage />}
        {activeTab === "contacts" && <ContactsPage />}
        {activeTab === "profile" && <ProfilePage />}
      </Content>

      <div className="fixed bottom-0 w-full bg-white shadow-inner z-50">
        <div className="flex justify-around items-center">
          <button
            className={`flex flex-col items-center py-2 flex-1 ${
              activeTab === "chats" ? "text-blue-500" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("chats")}
          >
            <WechatOutlined className="text-xl mb-1" />
            <span className="text-sm">Chats</span>
          </button>
          <button
            className={`flex flex-col items-center py-2 flex-1 ${
              activeTab === "contacts" ? "text-blue-500" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("contacts")}
          >
            <ContactsOutlined className="text-xl mb-1" />
            <span className="text-sm">Contacts</span>
          </button>
          <button
            className={`flex flex-col items-center py-2 flex-1 ${
              activeTab === "profile" ? "text-blue-500" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("profile")}
          >
            <UserOutlined className="text-xl mb-1" />
            <span className="text-sm">Me</span>
          </button>
        </div>
      </div>
    </Layout>
  );
}
