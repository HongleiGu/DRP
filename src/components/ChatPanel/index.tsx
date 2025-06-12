/* eslint-disable @typescript-eslint/no-unused-vars */

// ChatPanel.tsx
"use client"
import { supabase } from "@/lib/supabase";
import { getMessages, insertChatHistory } from "@/utils/api";
import { useUser } from "@clerk/nextjs";
import { message, Badge, List, Input, Button, Popover, Modal, Card, Space, Divider, Typography } from "antd";
import { Message, PlayerData } from "@/types/datatypes";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import EmojiGrid from "../EmojiGrids";
import InfiniteScroll from 'react-infinite-scroll-component';
// import { getNicknameById } from "@/actions/onboarding";
import { createPortal } from "react-dom";
import VideoDetails from "../VideoDetails";
import { StarOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const router = useRouter();
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [invitationData, setInvitationData] = useState<{ from: string; roomId: string; videoId: string } | null>(null);
  const [emojiPopoverOpen, setEmojiPopoverOpen] = useState(false);

  const memoizedMessages = useMemo(() => messages, [messages]);

  const [members, setMembers] = useState<PlayerData[]>([]);

  const updateMembers = async () => {
    const res = await fetch(`/api/room/${chatroomId}/players`);
    const members = (await res.json() as { players: PlayerData[] }).players
    setMembers(members)
  }

  function LumiAvatar(param: {avatarId: string}) {
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
                        objectPosition: '-16px 4px',
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
        // console.log("payload", payload.new, payload.new.speaker !== userId, payload.new.chat_message.startsWith("/invite"))
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
            // const roomId = payload.new.chat_message.split(" ")[2]
            if (msgUserNickName === nickname) {
              // senderUserNickName)
              // const newMsg = payload.new as Message;
              // setMessages(prev => [...prev, newMsg]);
              setInvitationData({from: senderUserNickName, roomId: chatroomId, videoId: videoId})
              setIsInviteModalVisible(true)
              // should pop up an invite
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
      // const roomId = theMessage.split(" ")[2]
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
    // TODO
  }, []);

  const handleEmojiSelect = useCallback((emoji: string) => {
    handleSend(emoji);
    setEmojiPopoverOpen(false);
  }, [handleSend]);

  useEffect(() => {
    onMount(handleSend);
  });

  // Add modal handlers
  const handleAcceptInvite = () => {
    setIsInviteModalVisible(false);
    if (invitationData) {
      router.push(`/television/${chatroomId}`);
    }
  };

  const handleDeclineInvite = () => {
    setIsInviteModalVisible(false);
  };

  const header = (
    <div className="p-4 z-1000">
      <div className="flex" style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <h3 className="text-lg font-semibold">Chat Room</h3>
        <Badge status="success" text={`${onlineUsers.length} online`} />
      </div>
    </div>
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
          // onOpenChange={(open)=>setEmojiPopoverOpen(!open)}
          trigger="click"
          placement="topRight"
          zIndex={101}
        ></Popover>
        <Button 
          className="text-xl"
          onClick={()=>setEmojiPopoverOpen(!emojiPopoverOpen)}>😊</Button>
        <Button
          type="primary"
          onClick={() => handleSend(newMessage)}
          // loading={isSending}
          disabled={!newMessage.trim()}
        >
          Send
        </Button>
        {isTV &&(
          <Button
            type="primary"
            onClick={() => handleTVSpecialSend(newMessage)}
            // loading={isSending}
            disabled={!newMessage.trim()}
          >
            Moment
          </Button>
        )}
      </div>
    </div>
  );

  const starPopover = (
    <div style={{ width: 220 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Title level={5} style={{ margin: 0 }}>Honkai: Star Rail EP: Proi Proi</Title>
        <Divider style={{ margin: '8px 0' }} />
        <Text strong>Timestamp: 01:21</Text>
        <Button type="primary" block style={{ marginTop: 8 }}>
          Jump to Moment
        </Button>
      </Space>
    </div>
  );

  return (
    <Card
      title={header}
      style={{flex: 1}}
      styles={{body:{ padding: 0, height: '100%', display: "flex", flexDirection: "column" }}}
    >
      {emojiPopoverOpen && createPortal(<div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0)',
        zIndex: 100,
        pointerEvents: 'auto',
      }}
      onClick={()=>setEmojiPopoverOpen(false)}
    />, document.body)}
      <div className="relative flex flex-col h-full" id="scrollableDiv" style={{ overflowY: 'auto', height: "calc(100vh - 100px)" }}>
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
            renderItem={(msg) => (
              <List.Item 
              style={{margin: "8px"}} className={msg.speaker === userId ? 'bg-blue-50' : ''}
              actions={isTV?[(
              <Popover content={starPopover} title="Moment" trigger="click">
                <StarOutlined />
              </Popover>
              )] : []}
              >
                <List.Item.Meta
                  avatar={<LumiAvatar avatarId={
                    members.find((member) => member.user_id === msg.speaker)?.avatarId ?? "0"
                  }></LumiAvatar>}
                  title={<span className="font-semibold">{msg.speaker_name}</span>}
                  description={msg.chat_message}
                />
              </List.Item>
            )}
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
            <strong>{invitationData.from}</strong> has invited you to join room:
            <strong> {invitationData.roomId}</strong> {invitationData.videoId && <span>to watch</span>}
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
