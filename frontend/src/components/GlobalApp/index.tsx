"use client";

// import "./antd.css";
import { connectStomp, disconnectStomp, getStompClient } from "@/hooks/useStompClient";
import { useEffect, useState } from "react";
import { SupabaseUser } from "@/types/datatypes";
import { useRouter } from "next/navigation";
import globalStore from "@/store";
import { validateJWT } from "@/utils/api";
import { deleteMessages, getMessages } from "@/utils/messaging/messages";
import { handlersCombined } from "@/hooks/stompUtils";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  // const pathname = usePathname();

  useEffect(() => {
    const helper = async () => {
      const jwt = await globalStore.getItem<string>("jwt-token");
      if (!jwt) return router.push("/auth");

      const valid = await validateJWT(jwt);
      if (!valid) return router.push("/auth");

      const u = await globalStore.getItem<SupabaseUser>("lumiroom-user");
      if (!u) return router.push("/auth");

      setUser(u);
      const redisMessages = await getMessages(u.id)
      console.log(redisMessages)
      const client = getStompClient()
      console.log("in providers")
      redisMessages.map(async it => await handlersCombined(it, u, client!))
      await deleteMessages(u.id)
      setLoading(false);
    };
    helper();
  }, []);

  useEffect(() => {
    if (!user) return;
    console.log(user)
    connectStomp(user);
    return () => disconnectStomp();
  }, [user]);

  if (loading) return <div>Loading...</div>;
  if (!user) {
    console.log("no user")
    return <div>Loading user...</div>;
  }

  return (
    <>
      {children}
    </>
  );
}
