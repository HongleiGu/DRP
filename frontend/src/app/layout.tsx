import type { Metadata } from 'next'
import '@ant-design/v5-patch-for-react-19';
import "@/app/globals.css"
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider, App } from 'antd'; // Import App
import "./antd.css"
import { connectStomp, disconnectStomp } from '@/hooks/useStompClient';
import { useEffect, useState } from 'react';
import { SupabaseUser } from "@/types/datatypes";
import { useRouter } from "next/navigation";
import globalStore from '@/store';
import { validateJWT } from '@/utils/api';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = ""; // get from next/navigation or props

  useEffect(() => {
    const helper = async () => {
      try {
        console.log("Helper started");
        const jwt = await globalStore.getItem<string>("jwt-token");
        if (!jwt) return router.push("/auth");

        const valid = await validateJWT(jwt);
        if (!valid) return router.push("/auth");

        const u = await globalStore.getItem<SupabaseUser>("lumiroom-user");
        if (!u) return router.push("/auth");

        setUser(u); // ✅ user loaded
      } finally {
        setLoading(false); // mark as finished
      }
    };
    helper();
  }, [router, pathname]);

  // Connect STOMP once user is loaded
  useEffect(() => {
    if (!user) return;
    connectStomp(user);
    return () => disconnectStomp();
  }, [user]);

  // Delay rendering children until user is ready
  if (loading) return <div>Loading...</div>;
  if (!user) return null; // fallback, maybe redirect handled already

  return (
    <html lang="en">
      <body className="antialiased" style={{ margin: 0 }}>
        <AntdRegistry>
          <ConfigProvider
            theme={{
              components: {
                Slider: {
                  railBg: "rgba(233, 233, 233, 1)",
                  railHoverBg: "rgba(227, 227, 227, 1)",
                },
              },
            }}
          >
            <App>{children}</App>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
