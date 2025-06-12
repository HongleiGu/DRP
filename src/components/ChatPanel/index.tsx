// ChatPanel.tsx
"use client"
import { supabase } from "@/lib/supabase";
import { getMessages, insertChatHistory } from "@/utils/api";
import { useUser } from "@clerk/nextjs";
import { message, Badge, List, Input, Button, Popover, Card, Space, Divider, Typography } from "antd";
import { Message, PlayerData } from "@/types/datatypes";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import EmojiGrid from "../EmojiGrids";
import InfiniteScroll from 'react-infinite-scroll-component';
// import { createPortal } from "react-dom";
// import VideoDetails from "../VideoDetails";
import { BookOutlined } from "@ant-design/icons";
import { getCurrentTime, getCurrentVideoId, getYtPlayer } from "@/utils/ytPlayerManager";
import VideoDetails from "../VideoDetails";
// import VideoDetails from "../VideoDetails";

import React from 'react';

// const { Text, Title } = Typography;

interface ChatPanelProps {
  isTV?: boolean;
  chatroomId: string;
  onMount: (fn: (msg: string) => void) => void;
  receiveMessage: (msg: Message) => void;
}

export default function ChatPanel({ isTV, chatroomId, onMount, receiveMessage }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  // const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const router = useRouter();
  const [, setIsInviteModalVisible] = useState(false);
  const [, setInvitationData] = useState<{ from: string; roomId: string; videoId: string } | null>(null);
  const [emojiPopoverOpen, setEmojiPopoverOpen] = useState(false);

  const memoizedMessages = useMemo(() => messages, [messages]);

  const [members, setMembers] = useState<PlayerData[]>([]);

  const updateMembers = async () => {
    const res = await fetch(`/api/room/${chatroomId}/players`);
    const members = (await res.json() as { players: PlayerData[] }).players
    setMembers(members)
  }

  function LumiAvatar(param: { avatarId: string }) {
    const avatarId = Number.parseInt(param.avatarId)
    return (
      <div
        style={{
          width: 48, // 16 * 2
          height: 60, // 20 * 2
          overflow: 'hidden',
          display: 'inline-block',
          paddingTop: '4px',
        }}
      >
        <img
          src={`/game/assets/character-pack-full_version/sprite_split/character_${avatarId + 1}/character_${avatarId + 1}_frame16x20.png`}
          alt="sprite-frame"
          draggable={false}
          style={{
            display: 'block',
            objectFit: 'none',
            objectPosition: '-16px 6px',
            transform: 'scale(3)',
            transformOrigin: 'top left',
            imageRendering: 'pixelated',
          }}
        />
      </div>
    );
  }

  useEffect(() => {
    if (!user?.id) {
      message.error("User invalid");
      router.push("/");
      return;
    }

    setUserId(user.id);

    if (user.publicMetadata?.nickname) {
      setNickname(user.publicMetadata.nickname as string);
    } else {
      message.warning("Nickname not set");
      router.push("/onboarding");
    }
  }, [user, router]);

  useEffect(() => {
    const loadMessages = async () => {
      const messageData = await getMessages(chatroomId);
      setMessages(messageData);
    };

    if (userId) {
      loadMessages();
    }
  }, [chatroomId, userId]);

  useEffect(() => {
    if (!userId) return;

    const presenceTrack = supabase.channel(`room:${chatroomId}`, {
      config: { presence: { key: userId } }
    })
      .on('presence', { event: 'sync' }, () => {
        const state = presenceTrack.presenceState();
        setOnlineUsers(Object.keys(state));
        updateMembers();
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceTrack.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          });
          updateMembers();
        }
      });

    const messageSub = supabase.channel(`messages:${chatroomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_history',
        filter: `chat_room_id=eq.${chatroomId}`,
      }, async (payload) => {
        if (payload.new.speaker !== userId) {
          if (payload.new.chat_message.startsWith("/alert")) {
            const a = payload.new.chat_message.split(" ")[1]
            message.info(`${a} has made a change in the calendar, please check`)
            alert(`${a} has made a change in the calendar, please check`)
          }
          if (payload.new.chat_message.startsWith("/invite")) {
            const msgUserNickName = payload.new.chat_message.split(" ")[1]
            const senderUserNickName = payload.new.chat_message.split(" ")[2]
            const videoId = payload.new.chat_message.split(" ")[3]
            if (msgUserNickName === nickname) {
              setInvitationData({ from: senderUserNickName, roomId: chatroomId, videoId: videoId })
              setIsInviteModalVisible(true)
            }
          }
          if (!payload.new.chat_message.startsWith("/")) {
            const newMsg = payload.new as Message;
            setMessages(prev => [...prev, newMsg]);
          }
        }
        updateMembers();
        receiveMessage(payload.new as Message);
      })
      .subscribe();

    return () => {
      presenceTrack.unsubscribe();
      messageSub.unsubscribe();
    };
  }, [chatroomId, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [memoizedMessages]);

  const handleSend = useCallback(async (theMessage: string) => {
    if (!theMessage.trim() || isSending || !userId || !nickname) return;
    let messageObj: Message;
    if (theMessage.startsWith("/invite")) {
      messageObj = {
        speaker: userId,
        speaker_name: nickname,
        chat_message: theMessage,
        created_at: new Date().toISOString(),
        chat_room_id: chatroomId
      }
    } else {
      messageObj = {
        speaker: userId,
        speaker_name: nickname,
        chat_message: theMessage,
        created_at: new Date().toISOString(),
        chat_room_id: chatroomId
      };
    }

    setIsSending(true);

    try {
      if (!theMessage.startsWith("/")) {
        setMessages(prev => [...prev, messageObj]);
      }
      setNewMessage('');

      await insertChatHistory(messageObj);
    } catch {
      message.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  }, [isSending, userId, nickname, chatroomId]);

  const handleTVSpecialSend = useCallback(async (theMessage: string) => {
    if (!theMessage.trim() || isSending || !userId || !nickname) return;
    if (!getYtPlayer()) return;
    let messageObj: Message;
    // const channel = await getChannel(chatroomId)
    if (theMessage.startsWith("/invite")) {
      messageObj = {
        speaker: userId,
        speaker_name: nickname,
        chat_message: theMessage,
        created_at: new Date().toISOString(),
        chat_room_id: chatroomId,
        video_url: getCurrentVideoId(),
        video_time: getCurrentTime(),
      }
    } else {
      messageObj = {
        speaker: userId,
        speaker_name: nickname,
        chat_message: theMessage,
        created_at: new Date().toISOString(),
        chat_room_id: chatroomId,
        video_url: getCurrentVideoId(),
        video_time: getCurrentTime(),
      };
    }

    setIsSending(true);

    try {
      if (!theMessage.startsWith("/")) {
        setMessages(prev => [...prev, messageObj]);
      }
      setNewMessage('');

      await insertChatHistory(messageObj);
    } catch {
      message.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  }, [isSending, userId, nickname, chatroomId]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    handleSend(emoji);
    setEmojiPopoverOpen(false);
  }, [handleSend]);

  useEffect(() => {
    onMount(handleSend);
  });

  // const handleAcceptInvite = () => {
  //   setIsInviteModalVisible(false);
  //   if (invitationData) {
  //     router.push(`/television/${chatroomId}`);
  //   }
  // };

  // const handleDeclineInvite = () => {
  //   setIsInviteModalVisible(false);
  // };

  function toTimestamp(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Function to reload the video and jump to a specific time (in seconds)
  const reloadAndJumpToSeconds = (videoId: string, seconds: number) => {
    const player = getYtPlayer(); // Get the player instance
    
    if (player) {
      // Reload the video and set the time to 'seconds'
      // player.loadVideoById(videoId); // Load the video by ID
      // player.seekTo(seconds, true);   // Jump to the specified second and start from there
      handleSend(`/play ${seconds} ${videoId}`)
    }
  };

  const starPopover = (name: string, videoId: string | undefined, videoTime: number | undefined) => {
    if (videoId && videoTime) {
      return (
      <div style={{ width: 220 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Typography.Title level={5} style={{ margin: 0 }}>{name} watching</Typography.Title>
          <VideoDetails videoId={videoId}/>
          <Divider style={{ margin: '8px 0' }} />
          <Typography.Text strong>Timestamp: {toTimestamp(videoTime)}</Typography.Text>
          <Button type="primary" block style={{ marginTop: 8 }} onClick={() => reloadAndJumpToSeconds(videoId, videoTime)}>
            Jump to Moment
          </Button>
        </Space>
      </div>
    )
    } else {
      return (
        <div style={{ width: 220 }}>
          <span>no movie data available</span>
        </div>
      )
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
          onClick={() => setEmojiPopoverOpen(!emojiPopoverOpen)}>😊</Button>
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
            Moment
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
      {onlineUsers.length} {onlineUsers.length === 1 ? "player" : "players"} online
    </span>
  </span>
}


      style={{ flex: 1 }}
      styles={{ body: { padding: 0, height: '100%', display: "flex", flexDirection: "column" } }}
    >
      <div className="relative flex flex-col h-full" id="scrollableDiv" style={{ overflowY: 'auto', height: "calc(100vh - 100px)" }}>
        <InfiniteScroll dataLength={memoizedMessages.length} next={() => {}} hasMore={false} loader={undefined} scrollableTarget="scrollableDiv">
          <List
            itemLayout="horizontal"
            dataSource={memoizedMessages}
            className="overflow-y-auto"
            renderItem={(msg) => {
  const isMomentMsg = !!(msg.video_url && msg.video_time); // 判断是否是 moment 消息

  return (
    <List.Item
      style={{ margin: "8px" }}
      className={msg.speaker === userId ? 'bg-blue-50' : ''}
      actions={isMomentMsg ? [
        <Popover
          key={msg.id}
          content={starPopover(msg.speaker_name, msg.video_url, msg.video_time)}
          title="Moment"
          trigger="click"
        >
          <BookOutlined />
        </Popover>
      ] : []}
    >
      <List.Item.Meta
        avatar={
          <LumiAvatar avatarId={members.find((member) => member.user_id === msg.speaker)?.avatarId ?? "0"} />
        }
        title={<span className="font-semibold">{msg.speaker_name}</span>}
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
    </Card>
  );
}