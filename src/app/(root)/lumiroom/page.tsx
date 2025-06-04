'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Button, Input, Typography, Card, Layout, Space, Divider, message } from 'antd';
import { createRoom, getRoom } from '@/utils/api';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const uuidSchema = z.string().uuid({
  message: "Invalid format"
});

export default function LumiroomPage() {
  const router = useRouter();
  const [value, setValue] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const validateUUID = (input: string): boolean => {
    try {
      uuidSchema.parse(input);
      setError(null);
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      }
      return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setValue(input);
    validateUUID(input);
  };

  const handleJoinChatRoom = async () => {
    if (!validateUUID(value)) return;

    setJoinLoading(true);
    try {
      const chatroom = await getRoom(value);
      if (chatroom) {
        router.push(`/lumiroom/${value}`);
      } else {
        message.error('Chatroom does not exist');
      }
    } catch {
      message.error('Failed to fetch lumiroom');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCreateChatRoom = async () => {
    setCreateLoading(true);
    try {
      const chatroomId = await createRoom();
      if (chatroomId) {
        router.push(`/lumiroom/${chatroomId}`);
      }
    } catch {
      message.error('Failed to create lumiroom');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          background: "#001529",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 18 }}>Lumiroom Lobby</Text>
      </Header>

      <Content style={{ padding: "24px", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Card
          title={<Title level={3}>Enter or Create a Lumiroom</Title>}
          style={{ width: "100%", maxWidth: 500 }}
        >
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <div>
              <Input
                placeholder="Enter Lumiroom ID"
                value={value}
                onChange={handleInputChange}
              />
              {error && <Text type="danger">{error}</Text>}
              <Button
                type="primary"
                block
                style={{ marginTop: 12 }}
                onClick={handleJoinChatRoom}
                loading={joinLoading}
                disabled={!!error || value.length === 0}
              >
                Join Lumiroom
              </Button>
            </div>

            <Divider plain>OR</Divider>

            <Button
              type="default"
              block
              onClick={handleCreateChatRoom}
              loading={createLoading}
            >
              Create New Lumiroom
            </Button>
          </Space>
        </Card>
      </Content>
    </Layout>
  );
}
