"use client";

import globalStore from "@/store";
// import { useGlobalStore } from "@/store";
import { SupabaseUser } from "@/types/datatypes";
import { getContacts } from "@/utils/api";
import { Avatar, Card, Empty, List, Spin, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";

const { Title, Text } = Typography;

export function ContactsPage() {
  // const { user } = useGlobalStore.getState();
  const [user, setUser] = useState<SupabaseUser>(null!)
  const [contactsList, setContactList] = useState<SupabaseUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchContacts = async () => {
      const u = JSON.parse(await globalStore.getItem('lumiroom-user') ?? "{}") as SupabaseUser
      setUser(u)
      if (!user?.id) return;
      const c = await getContacts(user.id);
      setContactList(c);
      setLoading(false);
    };
    fetchContacts();
  }, [user]);

  const renderedContacts = useMemo(() => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-48">
          <Spin size="large" />
        </div>
      );
    }

    if (contactsList.length === 0) {
      return (
        <Empty
          description={
            <Text type="secondary">
              You haven’t added any contacts yet.
            </Text>
          }
        />
      );
    }

    return (
      <List
        itemLayout="horizontal"
        dataSource={contactsList}
        style={{
          maxHeight: 400,
          overflow: "auto",
          borderRadius: 12,
        }}
        renderItem={(contact) => (
          <List.Item
            key={contact.id}
            style={{
              borderBottom: "1px solid #f0f0f0",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            className="hover:bg-gray-100 rounded-lg"
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  size="large"
                  src={
                    contact.avatar_id
                      ? `/sprites/avatar-${contact.avatar_id}.png`
                      : undefined
                  }
                  style={{
                    backgroundColor: "#1677ff",
                  }}
                >
                  {contact.username?.charAt(0)?.toUpperCase() ?? "?"}
                </Avatar>
              }
              title={
                <Text strong style={{ fontSize: 16 }}>
                  {contact.username}
                </Text>
              }
            />
          </List.Item>
        )}
      />
    );
  }, [loading, contactsList]);

  return (
    <div className="flex flex-col items-center p-6 min-h-screen bg-gray-50">
      <Card
        style={{
          width: "100%",
          maxWidth: 400,
          borderRadius: 16,
          boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
        }}
        styles={{body: { padding: 24 }}}
      >
        <Title level={3} style={{ textAlign: "center", marginBottom: 24 }}>
          Your Contacts
        </Title>

        {renderedContacts}
      </Card>
    </div>
  );
}
