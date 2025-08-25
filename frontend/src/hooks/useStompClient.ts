// stompService.ts
import SockJS from "sockjs-client";
import { Client, IMessage } from "@stomp/stompjs";
import { Message, SupabaseUser } from "@/types/datatypes";
import { defaultHandlers, StompHandlerNames, StompHandlers } from "./stompUtils";

const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "http://localhost:8080/";

let stompClient: Client | null = null;
let currentUser: SupabaseUser | null = null;
let handlers: StompHandlers = { ...defaultHandlers };

// --- Public API for handlers ---
export function setStompHandler(name: StompHandlerNames, fn: typeof handlers[StompHandlerNames]) {
  handlers[name] = fn;
  reloadConnection();
}

export function setStompHandlers(newHandlers: Partial<StompHandlers>) {
  handlers = { ...handlers, ...newHandlers };
  reloadConnection();
}

export function resetStompHandlers() {
  handlers = { ...defaultHandlers };
  reloadConnection();
}

export function getStompHandlers() {
  return handlers;
}

export function getStompClient() {
  return stompClient;
}

// --- Connection bootstrap ---
export function connectStomp(user: SupabaseUser) {
  if (stompClient?.active) return;
  if (!user) return
  console.log(user)
  currentUser = user;

  const socket = new SockJS(`${wsUrl}ws/messages?userId=${user.id}`);
  stompClient = new Client({
    webSocketFactory: () => socket,
    reconnectDelay: 5000,
    debug: (str) => console.log(`[STOMP] ${str}`),
    onConnect: () => {
      console.log("✅ STOMP connected");

      stompClient?.subscribe("/user/queue/messages", async (msg: IMessage) => {
        try {
          const payload: Message = JSON.parse(msg.body);
          console.log("📨 Received:", payload);

          // Run through all registered handlers
          for (const fn of Object.values(handlers)) {
            await fn(payload, currentUser!, stompClient!);
          }

          // Always ACK
          stompClient?.publish({
            destination: "/app/messsages/ack",
            body: JSON.stringify({ messageId: payload.id, success: true }),
          });
        } catch (err) {
          console.error("❌ Error handling message", err);
        }
      });
    },
    onStompError: (frame) => {
      console.error("❌ Broker error:", frame.headers["message"]);
    },
  });

  stompClient.activate();
}

// --- Disconnect ---
export function disconnectStomp() {
  if (stompClient) {
    console.log("🛑 Disconnecting STOMP");
    stompClient.deactivate();
    stompClient = null;
    currentUser = null;
  }
}

// --- Hot reload (reconnect with new handlers) ---
function reloadConnection() {
  if (stompClient?.active && currentUser) {
    console.log("♻️ Reloading STOMP with updated handlers");
    disconnectStomp();
    connectStomp(currentUser);
  }
}
