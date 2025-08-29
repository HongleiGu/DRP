import SockJS from "sockjs-client";
import { Client, IMessage, IPublishParams, StompSubscription } from "@stomp/stompjs";
import { SupabaseUser } from "@/types/datatypes";
import { defaultHandlers, StompHandler, StompHandlers } from "./stompUtils";

type StompType = "message" | "game";
type MessageExtraParams = null; // empty object
type GameExtraParams = { roomId: string }; // extra params like roomId passed by caller

export class StompService<T extends StompType = StompType> {
  private stompClient: Client | null = null;
  private currentUser: SupabaseUser | null = null;
  private handlers: StompHandlers = { ...defaultHandlers };
  public connected = false;

  private extraParams: T extends "game" ? GameExtraParams : MessageExtraParams = null!;

  private subscription: {
    id: string;
    sub: Subscription;
  } | null = null;

  constructor(private baseEndpoint: string, private type: T) {}

  public getCurrentUser() {
    return this.currentUser;
  }

  /** Set a single handler */
  public setHandler(name: keyof StompHandlers, fn: StompHandler) {
    this.handlers[name] = fn;
    this.reloadConnection();
  }

  public getHandlers() {
    return this.handlers;
  }

  /** Set multiple handlers */
  public setHandlers(newHandlers: Partial<StompHandlers>) {
    this.handlers = { ...this.handlers, ...newHandlers };
    this.reloadConnection();
  }

  /** Connect to the server */
  public connect(
    user: SupabaseUser,
    extraParams?: T extends "game" ? GameExtraParams : MessageExtraParams,
    subscription: Subscription | null = null
  ) {
    if (this.stompClient?.active || this.connected) return;
    if (!user) return;

    this.currentUser = user;
    this.extraParams = (extraParams ?? (null as T extends "game" ? GameExtraParams : MessageExtraParams));

    const query = new URLSearchParams({ userId: user.id, ...this.extraParams } as Record<string, string>).toString();
    const socket = new SockJS(`${this.baseEndpoint}?${query}`);

    this.stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
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

  /** Disconnect from server */
  public disconnect() {
    if (this.stompClient) {
      this.unsubscribe();
      this.stompClient.deactivate();
      this.stompClient = null;
      this.currentUser = null;
      this.connected = false;
    }
  }

  /** Reload connection with updated handlers */
  private reloadConnection() {
    if (this.stompClient?.active && this.currentUser) {
      // Instead of fully disconnecting, just unsubscribe/resubscribe
      if (this.subscription != null) {
        this.unsubscribe();
        console.log("subscription", this.subscription)
        this.subscribe(this.subscription.sub);
      }
    }
  }

  /** Publish to a topic */
  public publish(data: IPublishParams) {
    if (!this.stompClient?.connected) {
      console.warn("⚠️ STOMP not connected yet. Cannot publish:", data);
      return;
    }
    this.stompClient.publish(data);
  }

  /** Generic subscribe function */
  private subscribe(subscription: Subscription) {
    if (!this.stompClient?.connected) return;
    const sub: StompSubscription = this.stompClient.subscribe(subscription.endpoint, subscription.callback(this));
    this.subscription = { id: sub.id, sub: subscription };
  }

  private unsubscribe() {
    if (!this.stompClient?.connected || !this.subscription) return;
    this.stompClient.unsubscribe(this.subscription.id);
    this.subscription = null;
  }
}

// Example instances
const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "http://localhost:8080/";

export const messageWebsocket = new StompService(`${wsUrl}ws/messages`, "message");
export const gameWebsocket = new StompService(`${wsUrl}ws/game`, "game");

export interface Subscription {
  endpoint: string;
  callback: (stompService: StompService) => (msg: IMessage) => Promise<void>;
}

export const messageSubscription: Subscription = {
  endpoint: "/user/queue/messages",
  callback: (stompService: StompService) => async (msg: IMessage) => {
    const payload = JSON.parse(msg.body);
    for (const fn of Object.values(stompService.getHandlers())) {
      await fn(payload, stompService.getCurrentUser()!);
    }

    // ACK
    stompService.publish({
      destination: "/app/messages/ack",
      body: JSON.stringify({ messageId: payload.id, success: true }),
    });
  },
};
