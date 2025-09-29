// websocketManager.ts
import SockJS from "sockjs-client";
import { Client, IMessage, IPublishParams, StompSubscription } from "@stomp/stompjs";
import { Message, SupabaseUser } from "@/types/datatypes";
import { defaultHandlers, StompHandler, StompHandlers } from "./stompUtils";
import { isCapacitor, isElectron } from "@/utils/env";

// ----------------------------
// Types
// ----------------------------
type StompType = "message" | "game";
type MessageExtraParams = null;
type GameExtraParams = { roomId: string };

export interface Subscription {
  endpoint: string;
  callback: (stompService: StompService) => (msg: IMessage) => Promise<void>;
}

// ----------------------------
// StompService
// ----------------------------
export class StompService<T extends StompType = StompType> {
  private stompClient: Client | null = null;
  private currentUser: SupabaseUser | null = null;
  private handlers: StompHandlers = { ...defaultHandlers };
  public connected = false;

  private extraParams: T extends "game" ? GameExtraParams : MessageExtraParams = null!;
  private subscription: { id: string; sub: Subscription } | null = null;

  constructor(private baseEndpoint: string, private type: T) {}

  public getCurrentUser() {
    return this.currentUser;
  }

  public setHandler(name: keyof StompHandlers, fn: StompHandler) {
    this.handlers[name] = fn;
    this.reloadConnection();
  }

  public getHandlers() {
    return this.handlers;
  }

  public setHandlers(newHandlers: Partial<StompHandlers>) {
    this.handlers = { ...this.handlers, ...newHandlers };
    this.reloadConnection();
  }

  /** Connect to server */
  public connect(
    user: SupabaseUser,
    extraParams?: T extends "game" ? GameExtraParams : MessageExtraParams,
    subscription: Subscription | null = null
  ) {
    if (this.stompClient?.active || this.connected) return;
    if (!user) return;

    this.currentUser = user;
    this.extraParams = (extraParams ??
      (null as T extends "game" ? GameExtraParams : MessageExtraParams));

    const query = new URLSearchParams({
      userId: user.id,
      ...this.extraParams,
    } as Record<string, string>).toString();

    const socket = new SockJS(`${this.baseEndpoint}?${query}`);

    this.stompClient = new Client({
      webSocketFactory: () => socket,
      heartbeatIncoming: 10000, // expect server heartbeat every 10s
      heartbeatOutgoing: 10000, // send client heartbeat every 10s
      reconnectDelay: 5000, // auto reconnect every 5s
      debug: (str) => console.log(`[STOMP] ${str}`),
      onConnect: () => {
        console.log(`✅ STOMP connected (${this.type})`);
        this.connected = true;
        if (subscription) {
          this.subscribe(subscription);
        } else if (this.subscription) {
          this.subscribe(this.subscription.sub);
        }
      },
      onStompError: (frame) => {
        console.error("❌ Stomp error:", frame.headers["message"]);
      },
      onDisconnect: () => {
        this.connected = false;
      },
    });

    this.stompClient.activate();
  }

  /** Disconnect safely */
  public disconnect() {
    if (this.stompClient) {
      this.unsubscribe();
      this.stompClient.deactivate();
      this.stompClient = null;
      this.currentUser = null;
      this.connected = false;
      console.log("🔌 Disconnected");
    }
  }

  private reloadConnection() {
    if (this.stompClient?.active && this.currentUser && this.subscription) {
      this.unsubscribe();
      this.subscribe(this.subscription.sub);
    }
  }

  public publish(data: IPublishParams) {
    if (!this.stompClient?.connected) {
      console.warn("⚠️ STOMP not connected yet. Cannot publish:", data);
      return;
    }
    this.stompClient.publish(data);
  }

  private subscribe(subscription: Subscription) {
    if (!this.stompClient?.connected) return;
    console.log("📩 Subscribing to", subscription.endpoint);
    const sub: StompSubscription = this.stompClient.subscribe(
      subscription.endpoint,
      subscription.callback(this)
    );
    this.subscription = { id: sub.id, sub: subscription };
  }

  private unsubscribe() {
    if (!this.stompClient?.connected || !this.subscription) return;
    this.stompClient.unsubscribe(this.subscription.id);
  }
}

// ----------------------------
// Singleton Management
// ----------------------------
const wsUrl =
  (isElectron()
    ? process.env.NEXT_PUBLIC_WEBSOCKET_URL_PC
    : process.env.NEXT_PUBLIC_WEBSOCKET_URL_ANDROID) || "http://localhost:8080/";

let messageWebsocket: StompService<"message"> | null = null;
let gameWebsocket: StompService<"game"> | null = null;

// user id in in the connect method
export function setMessageWebsocket() {
  messageWebsocket = new StompService<"message">(`${wsUrl}ws/messages`, "message");
}

export function getMessageWebsocket() {
  return messageWebsocket;
}

export function setGameWebsocket() {
  gameWebsocket = new StompService<"game">(`${wsUrl}ws/game`, "game");
}

export function getGameWebsocket() {
  return gameWebsocket;
}

export function resetMessageWebsocket() {
  messageWebsocket?.disconnect();
  messageWebsocket = null;
}

export function resetGameWebsocket() {
  gameWebsocket?.disconnect();
  gameWebsocket = null;
}

export function resetWebsockets() {
  resetGameWebsocket();
  resetMessageWebsocket();
}

// ----------------------------
// Example Subscription
// ----------------------------
export const messageSubscription: Subscription = {
  endpoint: "/user/queue/messages",
  callback: (stompService: StompService) => async (msg: IMessage) => {
    const payload: Message = JSON.parse(msg.body);
    const handlers = stompService.getHandlers()
    for (const [name, fn] of Object.entries(handlers)) {
      console.log("Executing handler:", name);
      await fn(payload, stompService.getCurrentUser()!);
    }
    console.log("📨 message received + callback executed");
    console.log("payload:", payload,payload.id)

    stompService.publish({
      destination: "/app/message/ack",
      // why is payload.id null in the server side
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message_id: payload.id, success: true }),
    });
  },
};


import { setupBrowserLifecycle } from "@/utils/wsLifeCycle/browser";
import { setupElectronLifecycle } from "@/utils/wsLifeCycle/electron";
import { setupCapacitorLifecycle } from "@/utils/wsLifeCycle/capcitor";

export function setupWebsocketLifecycle() {
  // ---------- Browser ----------
  if (typeof window !== "undefined" && !isElectron() && !isCapacitor()) {
    setupBrowserLifecycle();
  }

  // ---------- Electron ----------
  if (typeof window !== "undefined" && isElectron()) {
    setupElectronLifecycle(resetWebsockets);
  }

  // ---------- Capacitor ----------
  if (typeof window !== "undefined" && isCapacitor()) {
    setupCapacitorLifecycle(resetWebsockets);
  }
}



// ----------------------------
// Usage Helpers
// ----------------------------
export function connectUser(user: SupabaseUser) {
  setMessageWebsocket();
  const ws = getMessageWebsocket();
  ws?.connect(user, null, messageSubscription);
}

export function disconnectUser() {
  resetMessageWebsocket();
}
