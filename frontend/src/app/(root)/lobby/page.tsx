'use client';

import { useEffect, useState } from 'react';
import { Layout, Typography, Card, Input, Button, List, Checkbox, Space, Divider, message, Spin } from 'antd';
import { createRoom } from '@/utils/api';
import { SupabaseUser } from '@/types/datatypes';
import globalStore from '@/store';
import { PROJECT_NAME, STORAGE_PATH } from '@/utils/utils';
import path from 'path';
import fileService from '@/utils/fileService';
import { parseJsonlToTypedObjects } from '@/utils/json';
// import { useRouter } from 'next/navigation';
// import { useGlobalStore } from '@/store';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function CreateRoomPage() {
  const [selectedUserIds, setSelectedUserIds] = useState<SupabaseUser[]>([]);
  const [groupName, setGroupName] = useState('');
  const [contactsList, setContactList] = useState<SupabaseUser[]>([]);
  const [contactsLoading, setContactsLoading] = useState<boolean>(true);
  const [creatingLoading, setCreatingLoading] = useState<boolean>(false);
  // const router = useRouter();
  const [user, setUser] = useState<SupabaseUser>(null!);

  const handleCheckboxChange = (userId: SupabaseUser, checked: boolean) => {
    setSelectedUserIds((prev) =>
      checked ? [...prev, userId] : prev.filter((id) => id !== userId)
    );
  };

  useEffect(() => {
    const fetchContacts = async () => {
      const u = await globalStore.getItem<SupabaseUser>('lumiroom-user')
      if (!u) {
        message.error('Please log in to create a room');
        window.location.href = "/"
        // router.push('/');
        return;
      }
      setUser(u);
      setContactsLoading(true);
      try {
        console.log(u)
        const filePath = path.join(STORAGE_PATH, u.id, "contacts.jsonl");
        if (!(await fileService.existsFile(filePath))) await fileService.createFile(filePath);
        const all = await parseJsonlToTypedObjects<SupabaseUser>(filePath);
        setContactList(all);
      } catch (err) {
        message.error('Failed to load contacts');
        console.error(err);
      } finally {
        setContactsLoading(false);
      }
    };
    fetchContacts();
  }, []);

  const handleCreateRoom = async () => {
    setCreatingLoading(true);
    try {
      const roomId = await createRoom([user, ...selectedUserIds], user?.id ?? "", groupName);
      await globalStore.setItem('lumiroom-room', roomId)
      // router.push(`/togethere/${roomId}`);
      window.location.href = `/${PROJECT_NAME}`
    } catch (err) {
      message.error('Failed to create room');
      console.error(err);
    } finally {
      setCreatingLoading(false);
    }
  };

  if (!user?.id) {
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
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: 500 }}>✨ Create a New Group</Text>
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
            title={<Title level={3} style={{ marginBottom: 0 }}>Please Login First</Title>}
            style={{
              width: '100%',
              maxWidth: 500,
              borderRadius: 16,
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            }}
            styles={{ header: { textAlign: 'center' } }}
          />
        </Content>
      </Layout>
    );
  }

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
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 500 }}>✨ Create a New Group</Text>
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
          title={<Title level={3} style={{ marginBottom: 0 }}>Create Your Chat Group</Title>}
          style={{
            width: '100%',
            maxWidth: 500,
            borderRadius: 16,
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          }}
          styles={{ header: { textAlign: 'center' } }}
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Text strong>Select members to add:</Text>
              {contactsLoading ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <Spin />
                </div>
              ) : (
                <List
                  bordered
                  dataSource={contactsList}
                  style={{
                    height: 240,
                    overflow: 'auto',
                    marginTop: 8,
                    borderRadius: 8,
                  }}
                  renderItem={(contact) => (
                    <List.Item style={{ padding: '8px 12px' }}>
                      <Checkbox
                        checked={selectedUserIds.includes(contact)}
                        onChange={(e) => handleCheckboxChange(contact, e.target.checked)}
                      >
                        {contact.username as string}
                      </Checkbox>
                    </List.Item>
                  )}
                />
              )}
            </div>

            <Divider />

            <div>
              <Text strong>Group Name:</Text>
              <Input
                placeholder="Enter a name for your group"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                size="large"
                style={{ borderRadius: 8, marginTop: 8 }}
              />
            </div>

            <Button
              type="primary"
              block
              size="large"
              style={{ borderRadius: 8 }}
              loading={creatingLoading}
              disabled={selectedUserIds.length === 0 || groupName.trim() === ''}
              onClick={handleCreateRoom}
            >
              🚀 Create Group
            </Button>
          </Space>
        </Card>
      </Content>
    </Layout>
  );
}
