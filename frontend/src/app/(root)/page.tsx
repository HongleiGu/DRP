"use client";

import { usePathname, useRouter} from "next/navigation";
import { useEffect, useState } from "react";
import { Layout, Popover, Button, Avatar } from "antd";
import {
  LogoutOutlined,
  LoginOutlined,
} from "@ant-design/icons";
import "@/app/globals.css";
import "@/app/antd.css";
import Image from "next/image";

import ChatsPage from "@/components/HomePage/ChatsPage";
import ContactsPage from "@/components/HomePage/ContactsPage";
import ProfilePage from "@/components/HomePage/ProfilePage";
import globalStore from "@/store";
import { signOut } from "@/utils/user";
import { LoadingSpinner } from "@/components/Lumiroom/LoadingSpinner";
import { SupabaseUser } from "@/types/datatypes";
// import { validateJWT } from "@/utils/api";
import LobbyPage from "@/components/HomePage/LobbyPage";
import GlobalApp from "@/components/GlobalApp";

const { Header, Content } = Layout;

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SupabaseUser>(null!);
  // const router = useRouter();
  const [activeTab, setActiveTab] = useState<"chats" | "contacts" | "profile" | "lobby" >(
    "chats"
  );

  useEffect(() => {
    if (pathname !== "/") return;

    const helper = async () => {
      // this is already checked in layout, no need to do this here.
      const u = await globalStore.getItem<SupabaseUser>('lumiroom-user');

      if (!u) {
        console.log("No user found, redirecting...");
        router.push("/auth");
        return;
      }

      setUser(u);

    };

    helper();
  }, [router, pathname]);


  if (!user) {
    return <LoadingSpinner />;
  }

  const popoverContent = (
    <div className="flex flex-col gap-2">
      {user ? (
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
      ) : (
        <Button
          type="text"
          icon={<LoginOutlined />}
          onClick={() => 
            {
              router.push("/auth")
            }
          }
        >
          Sign in
        </Button>
      )}
    </div>
  );

  return (
    <GlobalApp>
    <Layout className="min-h-screen bg-gray-50 flex flex-col">
      <Header className="bg-white flex justify-between items-center px-4 py-3 shadow-sm">
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
        {activeTab === "chats" && <ChatsPage user={user} setTab={setActiveTab}/>}
        {activeTab === "contacts" && <ContactsPage user={user}/>}
        {activeTab === "profile" && <ProfilePage user={user}/>}
        {activeTab === "lobby" && <LobbyPage user={user}/>}
      </Content>

      <div className="fixed bottom-0 w-full bg-white shadow-inner z-50">
        <div className="flex justify-around items-center">
          <button
            className={`flex flex-col items-center py-2 flex-1 ${
              activeTab === "chats" ? "text-blue-500" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("chats")}
          >
            <Image src="/icon/白猫.svg" alt="Logo" width={20} height={20}/>
            <span className="text-sm">Chats</span>
          </button>
          <button
            className={`flex flex-col items-center py-2 flex-1 ${
              activeTab === "contacts" ? "text-blue-500" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("contacts")}
          >
            <Image src="/icon/三花猫.svg" alt="Logo" width={20} height={20}/>
            <span className="text-sm">Contacts</span>
          </button>
          <button
            className={`flex flex-col items-center py-2 flex-1 ${
              activeTab === "profile" ? "text-blue-500" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("profile")}
          >
            <Image src="/icon/橘猫.svg" alt="Logo" width={20} height={20}/>
            <span className="text-sm">Me</span>
          </button>
          <button
            className={`flex flex-col items-center py-2 flex-1 ${
              activeTab === "profile" ? "text-blue-500" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("lobby")}
          >
            <Image src="/icon/蓝猫.svg" alt="Logo" width={20} height={20}/>
            <span className="text-sm">Lobby</span>
          </button>
        </div>
      </div>
    </Layout>
    </GlobalApp>
  );
}
