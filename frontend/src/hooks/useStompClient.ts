// hooks/useStompClient.ts
import { useEffect } from "react";
import SockJS from "sockjs-client";
import { Client, IMessage } from "@stomp/stompjs";
import { Message } from "@/types/datatypes";

interface UseStompClientOptions {
  userId: string | null;
  onMessage: (message: Message) => Promise<void>;
}

const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "http://localhost:8080/";

let stompClientRef: Client | null = null;

export const useStompClient = ({ userId, onMessage }: UseStompClientOptions) => {

  useEffect(() => {
    if (!userId) return;

    const socket = new SockJS(`${wsUrl}ws?userId=${userId}`);

    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: (str) => console.log(`[STOMP] ${str}`),
      onConnect: () => {
        console.log("✅ STOMP connected");

        // Subscribe to message queue
        stompClient.subscribe("/user/queue/messages", async (message: IMessage) => {
          try {
            const payload: Message = JSON.parse(message.body);
            console.log("📨 Received:", payload);
            await onMessage(payload);

            // Send ACK back over STOMP instead of fetch
            stompClient.publish({
              destination: "/app/messsages/ack", // maps to @MessageMapping("/messages/ack")
              body: JSON.stringify({
                messageId: payload.id,
                success: true, // or whatever structure your backend expects
              }),
            });

            console.log("✅ ACK sent via STOMP");
          } catch (err) {
            console.error("❌ Error handling WebSocket message", err);
          }
        });
      },
      onStompError: (frame) => {
        console.error("❌ Broker error:", frame.headers["message"]);
      },
    });

    stompClient.activate();
    stompClientRef = stompClient;

    return () => {
      stompClient.deactivate();
    };
  }, [userId, onMessage]);
};

export function getStompClient() {
  return stompClientRef;
}