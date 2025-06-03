// components/ProtectedContent.tsx
"use client";
import { UserButton, useUser } from "@clerk/nextjs";
import { RedirectToSignIn } from "@clerk/nextjs";
import { LoadingSpinner } from "@/components/Game/LoadingSpinner";
import { Layout, Card, Avatar, Typography, Space, Button, Flex } from "antd";
import { UserOutlined, MailOutlined, IdcardOutlined, SmileOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function ProtectedContent() {
  const { isLoaded, user } = useUser();
  const router = useRouter();

  if (!isLoaded) return <LoadingSpinner />;
  if (!user) return <RedirectToSignIn />;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
      style={{
        background: "#001529",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 24px",
        height: 64,
      }}
    >
      <Text style={{ color: "#fff", fontSize: 18 }}>
        {user ? `Welcome back, ${user.fullName ?? "User"}!` : "Welcome!"}
      </Text>

      <UserButton
        afterSignOutUrl="/"
        appearance={{
          elements: {
            userButtonAvatarBox: {
              borderRadius: "50%",
              border: "2px solid white",
            },
          },
        }}
      />
    </Header>

      <Content style={{ padding: "24px", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Card
          style={{ maxWidth: 600, width: "100%" }}
        >
          <Flex gap="large" align="center">
            <Avatar size={100} src={user.imageUrl} icon={<UserOutlined />} />
            <Flex vertical style={{ flex: 1 }}>
              <Title level={4}>Welcome back, {user.fullName ?? "User"}!</Title>
              <Space direction="vertical" size="small">
                <Text><MailOutlined /> <strong>Email:</strong> {user.primaryEmailAddress?.emailAddress ?? "No email"}</Text>
                <Text><IdcardOutlined /> <strong>User ID:</strong> {user.id}</Text>
                <Text><SmileOutlined /> <strong>Nickname:</strong> {user.publicMetadata?.nickname as string ?? "None"}</Text>
              </Space>
              <Flex gap="small" style={{ marginTop: "16px" }}>
                {/* <Button type="primary" onClick={() => router.push("/chatroom")}>Chatroom</Button> */}
                {/* since we were to combine the lumiroom and chat room features, hereby I only keep the lumiroom button */}
                <Button onClick={() => router.push("/chatroom")}>Lumiroom</Button>
              </Flex>
            </Flex>
          </Flex>
        </Card>
      </Content>
    </Layout>
  );
}