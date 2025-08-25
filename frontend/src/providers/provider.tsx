"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, App } from "antd";
// import "./antd.css";
import { connectStomp, disconnectStomp, getStompClient } from "@/hooks/useStompClient";
import { useEffect, useState } from "react";
import { SupabaseUser } from "@/types/datatypes";
import { useRouter, usePathname } from "next/navigation";
import globalStore from "@/store";
import { validateJWT } from "@/utils/api";
import { getMessages } from "@/utils/messaging/messages";
import { handlersCombined } from "@/hooks/stompUtils";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const helper = async () => {
      try {
        const jwt = await globalStore.getItem<string>("jwt-token");
        if (!jwt) return router.push("/auth");

        const valid = await validateJWT(jwt);
        if (!valid) return router.push("/auth");

        const u = await globalStore.getItem<SupabaseUser>("lumiroom-user");
        if (!u) return router.push("/auth");

        setUser(u);
        const redisMessages = await getMessages(u.id)
        const client = getStompClient()
        redisMessages.map(async it => await handlersCombined(it, u, client!))
        connectStomp(u);
      } finally {
        setLoading(false);
      }
    };
    helper();
  }, [router, pathname]);

  useEffect(() => {
    if (!user) return;
    console.log(user)
    connectStomp(user);
    return () => disconnectStomp();
  }, [user]);

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return (
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
  );
}
