"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Badge, Button, Input, List, Popover, message, Card } from "antd";
import EmojiGrid from "../EmojiGrids";
import { Message, MessageScope, MessageType, Room, SupabaseUser } from "@/types/datatypes";
import { deleteMessage, getMessage, sendMessageToRoom } from "@/utils/messaging/messages";
import { PROJECT_NAME, STORAGE_PATH } from "@/utils/utils";
import InfiniteScroll from "react-infinite-scroll-component";
import { v4 as uuidv4 } from 'uuid';
import { LumiAvatar } from "../LumiAvatar";
import fileService from "@/utils/fileService";
import path from "path"
import { appendJsonl, parseJsonlToTypedObjects, replaceJsonlById } from "@/utils/json";
import globalStore from "@/store";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import GroupManagementPanel from "./GroupManagementPanel";
import { messageWebsocket } from "@/hooks/StompService";
import { getRoom } from "@/utils/api";
import { getAllGroupsFilePath } from "@/utils/fileService/commonFilePaths";

interface ChatPanelProps {
  chatroomId: string;
}

export default function ChatPanel({
  chatroomId,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [onlineUsers] = useState<string[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [emojiPopoverOpen, setEmojiPopoverOpen] = useState(false);
  const [room, setRoom] = useState<Room>(null!);
  // const pathname = usePathname();
  const [user, setUser] = useState<SupabaseUser>(null!)
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [, contextHolder] = message.useMessage();
  const pathname = usePathname();
  const [openGroupManagement, setOpenGroupManagement] = useState<boolean>(false);
  // const [msgChannel, setMsgChannel] = useState<RealtimeChannel>(null!); // use websocket instead of supabase
  
  
  const memoizedMessages = useMemo(() => messages, [messages]);

  const loadMessages = useCallback(async () => {
    const messages = await getMessage(userId, chatroomId)
    // const messages = messageData.map((msg) => JSON.parse(msg));
    // setMessages(messages);
    setMessages((prev) => [...prev, ...messages]);


    // // Delete the messages after they are loaded
    // for (const msg of messages) {
    //   if (msg.id) await deleteMessage(chatroomId, msg.id)
    //   // await redis.lRem(chatroomId, 0, JSON.stringify(msg));
    // }
    await deleteMessage(userId, chatroomId)
  }, [chatroomId, userId]);

  const loadLocalMessages = useCallback(async () => {
    const messages = await parseJsonlToTypedObjects<Message>(path.join(STORAGE_PATH, userId, chatroomId + ".jsonl"))

    // since we dont want chat messages of two chatrooms be mixed up
    // and we are safe to assume that all the messages are stored in local, including the recieved ones from redis
    // so instead of append, we replace the whole message list with the messages we load from local

    setMessages(messages)

  }, [chatroomId, userId])

  // setup websocket
  messageWebsocket.setHandler("onRender", async (msg) => {
    console.log("received message", msg, chatroomId)
    if (msg.metadata.scope == "personal") {
      // TODO: handle personal msg
      return
    }
    if (msg.chat_room_id !== chatroomId) return; // Ignore other rooms

    // Append message and save locally
    setMessages((prev) => [...prev, msg]);
  })

  useEffect(() => {
    if (pathname !== `/${PROJECT_NAME}`) return;
    const helper = async () => {
      const u = await globalStore.getItem<SupabaseUser>('lumiroom-user')

      if (!u || !u?.id) {
        message.error("User invalid");
        router.push("/");
        return;
      }

      setUserId(u.id);

      // if (u.username) {
      setUsername(u.username);
      // } else {
      //   message.warning("Username not set");
      //   router.push("/onboarding");
      // }
      setUser(u)
    }
    helper()
  }, [router, pathname]);

  // Load messages from the Redis queue and local
  useEffect(() => {
    const helper = async () => {
      if (userId) {
        // loadLocalMessage is destructive, need to preserve order here
        await loadLocalMessages()
        await loadMessages();
        // the rooms should be processed at the end, we dont want to block message loading
        // just in case if fetching is slow

        // rememeber the api also fetches the members, the member is not []
        const r = await getRoom(chatroomId);
        // update the members just incase there are some changes in the server side
        // the data is the latest server status, so we can just overwrite
        replaceJsonlById(getAllGroupsFilePath(user.id), r)
        setRoom(r);
      }
    }
    helper()
  }, [chatroomId, loadMessages, loadLocalMessages, user, userId]);

  const send = useCallback(
    async (theMessage: Message) => {
      if (!message || isSending || !userId || !username) return;
      setIsSending(true);
      try {
        setMessages((prev) => [...prev, theMessage]);
        setNewMessage("");
        // broadcastMessage(chatroomId, theMessage)
        // write to local files
        // If the storagePath/{roomId}.jsonl file does not exist, create it
        const filePath = path.join(STORAGE_PATH, userId, chatroomId + ".jsonl");
        if (!(await fileService.existsFile(filePath))) {
          await fileService.createFile(filePath)
        }
        // Append the message to the file
        appendJsonl(filePath, theMessage)

        // send the message through springboot api
        sendMessageToRoom(theMessage, chatroomId)

      } catch (err) {
        console.error(err)
        message.error("Failed to send message");
      } finally {
        setIsSending(false);
      }
    },
    [isSending, userId, username, chatroomId]
  )

  const handleSend = useCallback(
    async (theMessage: string) => {
      if (!theMessage.trim() || isSending || !userId || !username) return;

      const messageObj: Message = {
        id: uuidv4(),
        speaker: userId,
        speaker_name: username,
        chat_message: theMessage,
        created_at: new Date().toISOString(),
        chat_room_id: chatroomId,
        metadata: {
          scope: "public" as MessageScope,
          type: "message" as MessageType,
          data: null
        }
      };
      
      await send(messageObj)
    },
    [isSending, userId, username, chatroomId, send]
  );

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      handleSend(emoji);
      setEmojiPopoverOpen(false);
    },
    [handleSend]
  );

  const footer = (
    <div className="bg-white pl-2 flex">
      <div className="flex items-center space-x-2 w-full">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={isSending}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSend(newMessage);
            }
          }}
        />
        <Popover
          content={<EmojiGrid onSelect={handleEmojiSelect} />}
          open={emojiPopoverOpen}
          trigger="click"
          placement="topRight"
          zIndex={101}
        />
        <Button
          className="text-xl"
          onClick={() => setEmojiPopoverOpen(!emojiPopoverOpen)}
        >
          😊
        </Button>
        <Button
          type="primary"
          onClick={() => handleSend(newMessage)}
          disabled={!newMessage.trim()}
        >
          Send
        </Button>
      </div>
    </div>
  );

  return (
    <Card
      title="Chat Room"
      extra={
        <>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Badge status="success" />
            <span>
              {onlineUsers.length}{" "}
              {onlineUsers.length === 1 ? "player" : "players"} online
            </span>
            <Button onClick={() => setOpenGroupManagement(true)} icon="..." />
          </span>
        </>
      }
      style={{ flex: 1 }}
      styles={{
        body: {
          padding: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {contextHolder}
      <div
        className="relative flex flex-col h-full"
        id="scrollableDiv"
        style={{ overflowY: "auto", height: "calc(100vh - 100px)" }}
      >
        <InfiniteScroll
          dataLength={memoizedMessages.length}
          next={() => {}}
          hasMore={false}
          loader={undefined}
          scrollableTarget="scrollableDiv"
        >
          <List
            itemLayout="horizontal"
            dataSource={memoizedMessages}
            className="overflow-y-auto"
            renderItem={(msg) => {
              return (
                <List.Item
                  style={{ margin: "8px" }}
                  className={msg.speaker === userId ? "bg-blue-50" : ""}
                >
                  <List.Item.Meta
                    avatar={
                      <LumiAvatar
                        avatarId={
                          (() => {
                            if (!room) return 0
                            console.log("finding avatars", room.members, msg.speaker)
                          return room.members.find(
                            (member) => member.id === msg.speaker
                          )?.avatar_id ?? 0})()
                        }
                      />
                    }
                    title={
                      <span className="font-semibold">{msg.speaker_name}</span>
                    }
                    description={msg.chat_message}
                  />
                </List.Item>
              );
            }}
          />
          <div ref={messagesEndRef} />
        </InfiniteScroll>
        {/* Group Management Panel */}
        <GroupManagementPanel
          visible={openGroupManagement}
          onClose={() => setOpenGroupManagement(false)}
          chatroomId={chatroomId}
          currentUser={user}
        />
      </div>
      {footer}
    </Card>
  );
}