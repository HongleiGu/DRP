"use client";
import { UserButton, useUser } from "@clerk/nextjs";
import { RedirectToSignIn } from "@clerk/nextjs";
import { LoadingSpinner } from "@/components/Lumiroom/LoadingSpinner";
import { Layout, Menu, Typography } from "antd";
import { useState } from "react";
import {
  WechatOutlined,
  ContactsOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { ChatsPage } from "@/components/HomePage/ChatsPage";
import { ContactsPage } from "@/components/HomePage/ContactsPage";
import { ProfilePage } from "@/components/HomePage/ProfilePage";

const { Header, Content } = Layout;
const { Title } = Typography;

export default function HomePage() {
  const { isLoaded, user } = useUser();
  const [activeTab, setActiveTab] = useState<"chats" | "contacts" | "profile">(
    "chats"
  );

  if (!isLoaded) return <LoadingSpinner />;
  if (!user) return <RedirectToSignIn />;

  return (
    <Layout className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header className="bg-white flex justify-between items-center px-4 py-3 shadow-sm">
        <div className="flex items-center">
          <WechatOutlined className="text-blue-500 text-2xl mr-3" />
          <Title level={4} className="m-0 text-gray-800">
            Chat App
          </Title>
        </div>
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              userButtonAvatarBox: "w-9 h-9 border-2 border-white shadow-md",
            },
          }}
        />
      </Header>

      {/* Content */}
      <Content className="flex-1 overflow-auto bg-white">
        {activeTab === "chats" && <ChatsPage />}
        {activeTab === "contacts" && <ContactsPage />}
        {activeTab === "profile" && <ProfilePage />}
      </Content>

      {/* Bottom Menu */}
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
