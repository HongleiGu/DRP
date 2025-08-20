"use client";

import { useStompClient } from "@/hooks/useStompClient";
// import globalStore from "@/store";
import { Message, Group, SupabaseUser } from "@/types/datatypes";
import fileService from "@/utils/fileService";
import {
  appendJsonl,
  deleteJsonlById,
  parseJsonlToTypedObjects,
} from "@/utils/json";
import { formatDate, STORAGE_PATH } from "@/utils/utils";
import { Avatar, Button, Card, Empty, List, Spin, Typography } from "antd";
// import { usePathname, useRouter } from "next/navigation";
import path from "path";
import { useEffect, useState } from "react";

const { Title, Text } = Typography;
const PENDING_KEY = "__pending__";

export default function ContactsPage({user}: {user: SupabaseUser}) {
  // const [user, setUser] = useState<SupabaseUser>(null!);
  const [contactsList, setContactList] = useState<SupabaseUser[]>([]);
  const [pendingList, setPendingList] = useState<
    { user: SupabaseUser; last_msg: Message | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // const router = useRouter();
  // const pathname = usePathname();

  // useEffect(() => {
  //   if (pathname !== "/") return;
  //   const fetchUser = async () => {
  //     const u = await globalStore.getItem<SupabaseUser>("lumiroom-user");
  //     if (!u || !u.id) {
  //       router.push("/auth")
  //       return;
  //     }
  //     setUser(u);
  //   };
  //   fetchUser();
  // }, [router, pathname]);

  useEffect(() => {
    const fetchContacts = async () => {
      if (!user?.id) return;

      const filePath = path.join(STORAGE_PATH, user.id, "contacts.jsonl");
      const pendingFilePath = path.join(STORAGE_PATH, user.id, "pending.jsonl");

      if (!(await fileService.existsFile(filePath))) await fileService.createFile(filePath);
      if (!(await fileService.existsFile(pendingFilePath))) await fileService.createFile(pendingFilePath);

      const all = await parseJsonlToTypedObjects<SupabaseUser>(filePath);
      const pending = await parseJsonlToTypedObjects<{user: SupabaseUser, last_msg: Message}>(pendingFilePath);

      setContactList(all);
      setPendingList(pending);
      setLoading(false);
    };

    fetchContacts();
  }, [user]);

  useStompClient({
    userId: user ? user.id : null,
    onMessage: async (msg: Message) => {
      console.log(msg);
      if (msg.metadata.type === "greeting" && msg.metadata.scope === "personal") {
        await addToPending(msg.metadata.data as SupabaseUser, msg);
      } else {
        // handle normal messages
      }
    },
  });

  const addToPending = async (u: SupabaseUser, msg: Message) => {
    const filePath = path.join(STORAGE_PATH, user.id, `pending.jsonl`);
    if (!pendingList.find(it => it.user.id === u.id)) {
      setPendingList([...pendingList, { user: u, last_msg: msg }]);
    }
    await appendJsonl(filePath, u);
  };

  const acceptGreeting = async (u: SupabaseUser, msg: Message | null) => {
    const filePath = path.join(STORAGE_PATH, user.id, "contacts.jsonl");
    const pendingFilePath = path.join(STORAGE_PATH, user.id, "pending.jsonl");

    setPendingList(pendingList.filter(it => it.user.id !== u.id));
    await deleteJsonlById(pendingFilePath, u.id);
    await appendJsonl(filePath, u);

    const group: Group = {
      id: u.id,
      name: u.username,
      last_message: msg,
      unread: 0,
      created_at: formatDate(),
      creator_id: user.id,
      members: [user, u]
    };
    await appendJsonl(
      path.join(STORAGE_PATH, user.id, "groups.jsonl"),
      group
    );
  };

  const renderContactList = () => {
    const items = [
      ...contactsList.map(c => ({ key: c.id, user: c, label: c.username })),
      { key: PENDING_KEY, label: "Pending Requests" },
    ];

    return (
      <List
        dataSource={items}
        itemLayout="horizontal"
        renderItem={(item: {
          key: string;
          user?: SupabaseUser;
          label: string;
        }) => {
          if (item.key === PENDING_KEY) {
            return (
              <List.Item
                key={PENDING_KEY}
                className="hover:bg-gray-100 rounded-md cursor-pointer px-2"
                onClick={() => setSelectedId(PENDING_KEY)}
              >
                <List.Item.Meta
                  avatar={<Avatar style={{ backgroundColor: "#fadb14" }}>🕓</Avatar>}
                  title={<Text strong>Pending Requests</Text>}
                  description={`${pendingList.length} request(s)`}
                />
              </List.Item>
            );
          }

          return (
            <List.Item
              key={item.key}
              className="hover:bg-gray-100 rounded-md cursor-pointer px-2"
              onClick={() => setSelectedId(item.key)}
            >
              {item.user && (
                <List.Item.Meta
                  avatar={
                    <Avatar
                      src={
                        item.user.avatar_id
                          ? `/sprites/avatar-${item.user.avatar_id}.png`
                          : undefined
                      }
                    >
                      {item.user.username?.charAt(0)?.toUpperCase() ?? "?"}
                    </Avatar>
                  }
                  title={<Text>{item.user.username}</Text>}
                />
              )}
            </List.Item>
          );
        }}
      />
    );
  };

  const renderPendingPanel = () => {
    if (!pendingList || pendingList.length === 0) {
      return <Empty description="No pending requests" />;
    }

    return (
      <Card title="Pending Requests" className="w-full h-full" bodyStyle={{ padding: 24 }}>
        <List
          dataSource={pendingList}
          itemLayout="horizontal"
          renderItem={({ user, last_msg }) => (
            <List.Item
              key={user.id}
              actions={[
                <Button key="accept" type="primary" onClick={() => acceptGreeting(user, last_msg)}>
                  Accept
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    src={
                      user.avatar_id
                        ? `/sprites/avatar-${user.avatar_id}.png`
                        : undefined
                    }
                  >
                    {user.username?.charAt(0)?.toUpperCase() ?? "?"}
                  </Avatar>
                }
                title={user.username}
                description={last_msg?.chat_message}
              />
            </List.Item>
          )}
        />
      </Card>
    );
  };

  const renderContactDetail = () => {
    const contactEntry = contactsList.find(c => c.id === selectedId);
    const contact = contactEntry;
    if (!contact) {
      return <Empty description="Select a contact to view details" />;
    }

    return (
      <Card title={contact.username} className="w-full h-full" bodyStyle={{ padding: 24 }}>
        <div className="flex flex-col items-center gap-4">
          <Avatar
            size={96}
            src={
              contact.avatar_id
                ? `/sprites/avatar-${contact.avatar_id}.png`
                : undefined
            }
            style={{ backgroundColor: "#1677ff" }}
          >
            {contact.username?.charAt(0)?.toUpperCase() ?? "?"}
          </Avatar>
          <Text>Email: {contact.email || "N/A"}</Text>
          <Text>ID: {contact.id}</Text>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="flex h-screen p-4 bg-gray-100 gap-4">
      {/* Left Panel */}
      <Card
        className="w-1/3 max-w-xs flex flex-col gap-4 overflow-auto"
        style={{ borderRadius: 16 }}
        bodyStyle={{ padding: 16 }}
      >
        <Title level={4}>Contacts</Title>
        {renderContactList()}
      </Card>

      {/* Right Panel */}
      <div className="flex-1">
        {selectedId === PENDING_KEY ? renderPendingPanel() : renderContactDetail()}
      </div>
    </div>
  );
}
