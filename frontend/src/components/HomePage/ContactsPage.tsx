"use client";

import { useStompClient } from "@/hooks/useStompClient";
import { Message, Group, SupabaseUser } from "@/types/datatypes";
import fileService from "@/utils/fileService";
import {
  appendJsonl,
  deleteJsonlById,
  parseJsonlToTypedObjects,
} from "@/utils/json";
import { formatDate, STORAGE_PATH } from "@/utils/utils";
import { PlusOutlined } from "@ant-design/icons";
import { Avatar, Button, Card, Empty, List, Modal, Spin, Typography, Input } from "antd";
import path from "path";
import { useEffect, useState } from "react";
import { debounce } from "lodash";
import { findUserByIdentifierBlur } from "@/utils/user";

const { Title, Text } = Typography;
const PENDING_KEY = "__pending__";

export default function ContactsPage({ user }: { user: SupabaseUser }) {
  const [contactsList, setContactList] = useState<SupabaseUser[]>([]);
  const [searchList, setSearchList] = useState<SupabaseUser[]>([]);
  const [pendingList, setPendingList] = useState<
    { user: SupabaseUser; last_msg: Message | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const fetchContacts = async () => {
      if (!user?.id) return;

      const filePath = path.join(STORAGE_PATH, user.id, "contacts.jsonl");
      const pendingFilePath = path.join(STORAGE_PATH, user.id, "pending.jsonl");

      if (!(await fileService.existsFile(filePath))) await fileService.createFile(filePath);
      if (!(await fileService.existsFile(pendingFilePath))) await fileService.createFile(pendingFilePath);

      const all = await parseJsonlToTypedObjects<SupabaseUser>(filePath);
      const pending = await parseJsonlToTypedObjects<{ user: SupabaseUser; last_msg: Message }>(pendingFilePath);

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
      members: [user, u],
    };
    await appendJsonl(path.join(STORAGE_PATH, user.id, "groups.jsonl"), group);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = debounce(async (query: string) => {
    console.log("Searching for:", query);
    const users = await findUserByIdentifierBlur(query);
    setSearchList(users);
  }, 300); // Debounce to handle search efficiently

  const renderContactList = (func: null | (() => Promise<void>), values: SupabaseUser[]) => {
    const items = [
      ...values.map((c) => ({ key: c.id, user: c, label: c.username })),
      { key: PENDING_KEY, label: "Pending Requests" },
    ];

    return (
      <List
        dataSource={items}
        itemLayout="horizontal"
        renderItem={(item: { key: string; user?: SupabaseUser; label: string }) => {
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
                <>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        src={item.user.avatar_id ? `/sprites/avatar-${item.user.avatar_id}.png` : undefined}
                      >
                        {item.user.username?.charAt(0)?.toUpperCase() ?? "?"}
                      </Avatar>
                    }
                    title={<Text>{item.user.username}</Text>}
                  />
                  {func && <Button onClick={func} />}
                </>
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
                    src={user.avatar_id ? `/sprites/avatar-${user.avatar_id}.png` : undefined}
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
    const contactEntry = contactsList.find((c) => c.id === selectedId);
    const contact = contactEntry;
    if (!contact) {
      return <Empty description="Select a contact to view details" />;
    }

    return (
      <Card title={contact.username} className="w-full h-full" bodyStyle={{ padding: 24 }}>
        <div className="flex flex-col items-center gap-4">
          <Avatar
            size={96}
            src={contact.avatar_id ? `/sprites/avatar-${contact.avatar_id}.png` : undefined}
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

  const searchContactPanel = (
    <Modal open={modalOpen} title="Add New Contact" onCancel={() => setModalOpen(false)} footer={null}>
      <div className="flex gap-4">
        {/* Search input */}
        <Input
          placeholder="Search Contacts"
          value={searchQuery}
          onChange={handleSearchChange}
          onBlur={() => handleSearch(searchQuery)}
          allowClear
        />

        {/* Render contacts list based on the search query */}
        <div className="flex-1">
          {loading ? (
            <Spin size="large" />
          ) : (
            renderContactList(null, searchList)
          )}
        </div>
      </div>
    </Modal>
  );

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
        <div className="flex items-center justify-between mb-4">
          <Title level={4} className="m-0">Contacts</Title>
          <Button type="primary" icon={<PlusOutlined />} shape="circle" size="large" onClick={() => {setModalOpen(true)}}/>
        </div>
        {renderContactList(null, contactsList)}
      </Card>

      {/* Right Panel */}
      <div className="flex-1">
        {selectedId === PENDING_KEY ? renderPendingPanel() : renderContactDetail()}
      </div>
      {searchContactPanel}
    </div>
  );
}
