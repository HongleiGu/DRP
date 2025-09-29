"use client";

// import "./antd.css";
import { useEffect, useState } from "react";
import { SupabaseUser } from "@/types/datatypes";
import { useRouter } from "next/navigation";
import globalStore from "@/store";
import { validateJWT } from "@/utils/api";
import { deleteMessages, getMessages } from "@/utils/messaging/messages";
import { handlersCombined } from "@/hooks/stompUtils";
import { messageSubscription, getMessageWebsocket, setMessageWebsocket} from "@/hooks/StompService";

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
      redisMessages.map(async it => await handlersCombined(it, u))
      await deleteMessages(u.id)
      setLoading(false);
      setMessageWebsocket();
      const messageWebsocket = getMessageWebsocket();
      if (!messageWebsocket) {
        throw new Error("No message websocket found");
      }
      messageWebsocket.connect(u, null, messageSubscription)
    };
    helper();
    return () => {
      getMessageWebsocket()?.disconnect();
    }
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!user) {
    return <div>Loading user...</div>;
  }

  return (
    <>
      {children}
    </>
  );
}
