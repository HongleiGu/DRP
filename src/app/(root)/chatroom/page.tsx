// so the design is, when the user logins enter and confirms entering the app, this is the page they should join
// room id == chat id ==(in the furture)== call id
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Button, Input, Typography, Card, Layout, Space, Divider, message } from 'antd';
import { createRoom, getRoom } from '@/utils/api';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const uuidSchema = z.string().uuid({ message: 'Invalid format' });

export default function LumiroomPage() {
  const router = useRouter();
  const [value, setValue] = useState('');
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
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: '#001529',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
        }}
      >
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 500 }}>✨ Lumiroom Lobby</Text>
      </Header>

      <Content
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '48px 16px',
          backgroundColor: '#f0f2f5',
        }}
      >
        <Card
          title={<Title level={3} style={{ marginBottom: 0 }}>Enter or Create a Lumiroom</Title>}
          style={{
            width: '100%',
            maxWidth: 480,
            borderRadius: 16,
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          }}
          headStyle={{ textAlign: 'center' }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Input
                placeholder="🔑 Enter Lumiroom ID"
                value={value}
                onChange={handleInputChange}
                size="large"
                style={{ borderRadius: 8 }}
              />
              {error && <Text type="danger">{error}</Text>}
              <Button
                type="primary"
                block
                style={{ marginTop: 12, borderRadius: 8 }}
                onClick={handleJoinChatRoom}
                loading={joinLoading}
                disabled={!!error || value.length === 0}
                size="large"
              >
                🚪 Join Lumiroom
              </Button>
            </div>

            <Divider plain>OR</Divider>

            <Button
              type="default"
              block
              onClick={handleCreateChatRoom}
              loading={createLoading}
              size="large"
              style={{ borderRadius: 8 }}
            >
              ✨ Create New Lumiroom
            </Button>
          </Space>
        </Card>
      </Content>
    </Layout>
  );
}