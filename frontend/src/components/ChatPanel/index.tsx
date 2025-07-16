"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Badge, Button, Input, List, Popover, Modal, Space, Typography, message, Divider, Card } from "antd";
import { BookOutlined } from "@ant-design/icons";
import EmojiGrid from "../EmojiGrids";
import { Message, PlayerData } from "@/types/datatypes";
import { updateChannel } from "@/utils/api";
import { getCurrentTime, getCurrentVideoId, getYtPlayer } from "@/utils/ytPlayerManager";
import { addMessage, deleteMessage, getMessages } from "@/utils/messages";
// import { getMessagesFromQueue, sendMessageToQueue } from "@/lib/messages"; // Adjusted to interact with Redis
import VideoDetails from "../VideoDetails";
import { PROJECT_NAME, STORAGE_PATH } from "@/utils/utils";
// import { redis } from '@/lib/redis';
import InfiniteScroll from "react-infinite-scroll-component";
import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";
import { v4 as uuidv4 } from 'uuid';
import { LumiAvatar } from "../LumiAvatar";
import { createFile, existsFile } from "@/utils/electronApi";
import path from "path"
import { appendJsonl } from "@/utils/json";
import { useGlobalStore } from "@/store";

interface ChatPanelProps {
  isTV?: boolean;
  chatroomId: string;
  onMount: (fn: (msg: string) => void) => void;
  receiveMessage: (msg: Message) => void;
}

export default function ChatPanel({
  isTV,
  chatroomId,
  onMount,
  // receiveMessage,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [onlineUsers] = useState<string[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [invitationData] = useState<{ from: string; roomId: string; videoId: string } | null>(null);
  const [emojiPopoverOpen, setEmojiPopoverOpen] = useState(false);
  const [members] = useState<PlayerData[]>([]);
  const pathname = usePathname();
  const { user } = useGlobalStore.getState()
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [, contextHolder] = message.useMessage();
  const [msgChannel, setMsgChannel] = useState<RealtimeChannel>(null!);
  
  
  const memoizedMessages = useMemo(() => messages, [messages]);

  const loadMessages = useCallback(async () => {
    const messages = await getMessages(chatroomId)
    // const messages = messageData.map((msg) => JSON.parse(msg));
    // setMessages(messages);
    setMessages((prev) => [...prev, ...messages]);


    // Delete the messages after they are loaded
    for (const msg of messages) {
      if (msg.id) await deleteMessage(chatroomId, msg.id)
      // await redis.lRem(chatroomId, 0, JSON.stringify(msg));
    }
  }, [chatroomId]);

  useEffect(() => {
    if (!user?.id) {
      message.error("User invalid");
      router.push("/");
      return;
    }

    setUserId(user.id);

    if (user.username) {
      setUsername(user.username);
    } else {
      message.warning("Username not set");
      router.push("/onboarding");
    }
  }, [user, router]);

  // Load messages from the Redis queue
  useEffect(() => {
    if (userId) {
      loadMessages();
    }
  }, [chatroomId, loadMessages, userId]);

  // Subscribe to the Supabase real-time channel for messages
  useEffect(() => {
    const subscribeToMessages = async () => {
      const channel = supabase.channel(`messages:${chatroomId}`);
      setMsgChannel(channel);

      // Subscribe to the 'new-message' event
      channel.on('broadcast', { event: 'new-message' }, (payload) => {
        console.log(payload.payload.message, userId)
        if (((payload.payload.message) as Message).speaker !== userId) {
          console.log("Received broadcast message:", payload.message);
          // loadMessages();  // Ensure loadMessages is called to fetch updated data
          // setMessages((prev) => [...prev, payload.message]);
          loadMessages();
        }
      });

      // Subscribe to the channel
      channel.subscribe();

      // Cleanup on unmount
      return () => {
        channel.unsubscribe();
      };
    };

    subscribeToMessages();
  }, [chatroomId, loadMessages, userId]);


  const broadcastMessage = async (chatroomId: string, message: Message) => {
    console.log("Broadcasting message", message);
    if (msgChannel) {
      await msgChannel.send({
        type: 'broadcast',
        event: 'new-message',
        payload: { message: message },  // Ensure payload is being sent with the message
      });
    }
  };


  const send = useCallback(
    async (theMessage: Message) => {
      console.log(theMessage)
      if (!message || isSending || !userId || !username) return;
      setIsSending(true);
      try {
        setMessages((prev) => [...prev, theMessage]);
        setNewMessage("");
        broadcastMessage(chatroomId, theMessage)
        // write to local files
        // If the storagePath/{roomId}.jsonl file does not exist, create it
        const filePath = path.join(STORAGE_PATH, userId, chatroomId, ".jsonl");
        if (!existsFile(filePath)) {
          createFile(filePath)
        }
        // Append the message to the file
        appendJsonl(filePath, theMessage)

        // Publish the message to the Redis Pub/Sub channel
        await addMessage(theMessage);
      } catch {
        message.error("Failed to send message");
      } finally {
        setIsSending(false);
      }
    },
    [isSending, userId, username, broadcastMessage, chatroomId]
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
      };
      
      await send(messageObj)
    },
    [isSending, userId, username, chatroomId, send]
  );

  // I doubt whether we should keep television, it was all wheelhouse
  const handleTVSpecialSend = useCallback(
    async (theMessage: string) => {
      if (!theMessage.trim() || isSending || !userId || !username) return;
      if (!getYtPlayer()) return;
      const messageObj = {
        id: uuidv4(),
        speaker: userId,
        speaker_name: username,
        chat_message: theMessage,
        created_at: new Date().toISOString(),
        chat_room_id: chatroomId,
        video_url: getCurrentVideoId(),
        video_time: getCurrentTime(),
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

  useEffect(() => {
    onMount(handleSend);
  }, [onMount, handleSend]);

  const handleAcceptInvite = () => {
    setIsInviteModalVisible(false);
    if (invitationData) {
      router.push(`/television/${chatroomId}`);
    }
  };

  const handleDeclineInvite = () => {
    setIsInviteModalVisible(false);
  };

  function toTimestamp(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  const reloadAndJumpToSeconds = async (videoId: string, seconds: number) => {
    const player = getYtPlayer();
    if (player) {
      handleSend(`/play ${seconds} ${videoId}`);
      setTimeout(() => updateChannel({ channel: videoId, time: seconds, room_id: chatroomId }), 0);
    }
    if (pathname.includes(`/${PROJECT_NAME}`)) {
      router.push(pathname.replace(`/${PROJECT_NAME}`, "/television"));
    }
  };

  const starPopover = (
    name: string,
    videoId: string | undefined,
    videoTime: number | undefined
  ) => {
    if (videoId && videoTime) {
      return (
        <div style={{ width: 220 }}>
          <Space direction="vertical" style={{ width: "100%" }}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              {name} watching
            </Typography.Title>
            <VideoDetails videoId={videoId} />
            <Divider style={{ margin: "8px 0" }} />
            <Typography.Text strong>Timestamp: {toTimestamp(videoTime)}</Typography.Text>
            <Button
              type="primary"
              block
              style={{ marginTop: 8 }}
              onClick={() => reloadAndJumpToSeconds(videoId, videoTime)}
            >
              Jump to Highlight
            </Button>
          </Space>
        </div>
      );
    } else {
      return (
        <div style={{ width: 220 }}>
          <span>No movie data available</span>
        </div>
      );
    }
  };


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
        {isTV && (
          <Button
            type="primary"
            onClick={() => handleTVSpecialSend(newMessage)}
            disabled={!newMessage.trim()}
          >
            Highlight
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Card
      title="Chat Room"
      extra={
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Badge status="success" />
          <span>
            {onlineUsers.length}{" "}
            {onlineUsers.length === 1 ? "player" : "players"} online
          </span>
        </span>
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
              const isMomentMsg = !!(msg.video_url && msg.video_time); // 判断是否是 moment 消息

              return (
                <List.Item
                  style={{ margin: "8px" }}
                  className={msg.speaker === userId ? "bg-blue-50" : ""}
                  actions={
                    isMomentMsg
                      ? [
                          <Popover
                            content="Click to see the movie highlights :)"
                            trigger="hover"
                            placement="top"
                            key={msg.id}
                          >
                            <Popover
                              key={msg.id}
                              content={starPopover(
                                msg.speaker_name,
                                msg.video_url,
                                msg.video_time
                              )}
                              title="Highlight"
                              trigger="click"
                            >
                              <BookOutlined style={{ cursor: "pointer" }} />
                            </Popover>
                          </Popover>,
                        ]
                      : []
                  }
                >
                  <List.Item.Meta
                    avatar={
                      <LumiAvatar
                        avatarId={
                          members.find(
                            (member) => member.user_id === msg.speaker
                          )?.avatarId ?? "0"
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
      </div>
      {footer}

      <Modal
        title="Room Invitation"
        open={isInviteModalVisible}
        onOk={handleAcceptInvite}
        onCancel={handleDeclineInvite}
        footer={[
          <Button key="decline" onClick={handleDeclineInvite}>
            Decline
          </Button>,
          <Button key="accept" type="primary" onClick={handleAcceptInvite}>
            Accept
          </Button>
        ]}
      >
        {invitationData && (
          <p>
            <strong>{invitationData.from}</strong> has invited you to watch video
            {
              invitationData.videoId && 
                <VideoDetails videoId={invitationData.videoId}/>
            }
          </p>
        )}
      </Modal>
    </Card>
  );
}