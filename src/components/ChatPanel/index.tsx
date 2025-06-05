// ChatPanel.tsx
import { supabase } from "@/lib/supabase";
import { getMessages, insertChatHistory } from "@/utils/api";
import { useUser } from "@clerk/nextjs";
import { message, Badge, List, Avatar, Input, Button, Popover, Modal } from "antd";
import { Message } from "@/types/datatypes";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import EmojiGrid from "../EmojiGrids";
import InfiniteScroll from 'react-infinite-scroll-component';

interface ChatPanelProps {
  chatroomId: string;
  onMount: (fn: (msg: string) => void) => void;
  receiveMessage: (msg: Message) => void;
}

export default function ChatPanel({ chatroomId, onMount, receiveMessage }: ChatPanelProps) {
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
  const [invitationData, setInvitationData] = useState<{ from: string; roomId: string } | null>(null);
  const [emojiPopoverOpen, setEmojiPopoverOpen] = useState(false);

  const memoizedMessages = useMemo(() => messages, [messages]);

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
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presenceTrack.track({
          user_id: userId,
          online_at: new Date().toISOString(),
        });
      }
    });

    const messageSub = supabase.channel(`messages:${chatroomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_history',
        filter: `chat_room_id=eq.${chatroomId}`,
      }, (payload) => {
        console.log("payload", payload.new)
        if (payload.new.speaker !== userId) {
          if (payload.new.chat_message.startsWith("/invite")) {
            const msgUserId = payload.new.chat_message.split(" ")[1]
            // const roomId = payload.new.chat_message.split(" ")[2]

            if (msgUserId === userId) {
              // const newMsg = payload.new as Message;
              // setMessages(prev => [...prev, newMsg]);
              setInvitationData({from: msgUserId, roomId: chatroomId})
              setIsInviteModalVisible(true)
              // should pop up an invite
            }
          }
          if (!payload.new.chat_message.startsWith("/")) {
            const newMsg = payload.new as Message;
            setMessages(prev => [...prev, newMsg]);
          }
        }
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
    <div className="p-4 border-b z-1000">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Chat Room</h3>
        <Badge status="success" text={`${onlineUsers.length} online`} />
      </div>
    </div>
  );

  const footer = (
    <div className="bg-white border-t p-4" style={{ position: 'fixed', bottom: 0 }}>
      <div className="flex items-center space-x-2">
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
          placement="topRight"
        ></Popover>
        <Button 
          className="text-xl"
          onClick={()=>setEmojiPopoverOpen(true)}>😊</Button>
        <Button
          type="primary"
          onClick={() => handleSend(newMessage)}
          loading={isSending}
          disabled={!newMessage.trim()}
        >
          Send
        </Button>
      </div>
    </div>
  );

  return (
    <div 
      className="flex flex-col h-full bg-white border-r p-4" // ← Added p-4 padding here
      style={{ width: 300, position: 'fixed', left: 0, top: 0, bottom: 0 }}
    >
      <div className="relative flex flex-col h-full" id="scrollableDiv" style={{ overflowY: 'auto', maxHeight: 'calc(100% - 80px)' }}>
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
            header={header}
            footer={footer}
            renderItem={(msg) => (
              <List.Item className={msg.speaker === userId ? 'bg-blue-50' : ''}>
                <List.Item.Meta
                  avatar={<Avatar>{msg.speaker_name?.charAt(0) || 'U'}</Avatar>}
                  title={<span className="font-semibold">{msg.speaker_name}</span>}
                  description={msg.chat_message}
                />
              </List.Item>
            )}
          />
          <div ref={messagesEndRef} />
        </InfiniteScroll>
      </div>

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
            <strong> {invitationData.roomId}</strong>
          </p>
        )}
      </Modal>
    </div>
  );
}
