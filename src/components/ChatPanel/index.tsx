import { supabase } from "@/lib/supabase";
import { getMessages, insertChatHistory } from "@/utils/api";
import { useUser } from "@clerk/nextjs";
import { message, Badge, List, Avatar, Input, Button, Popover } from "antd";
import { Message } from "@/types/datatypes";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import EmojiGrid from "../EmojiGrids";

// Independent ChatPanel component
interface ChatPanelProps {
  chatroomId: string;
  onSend?: (msg: string) => void;
}

export default function ChatPanel({ chatroomId, onSend }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const router = useRouter();

  // Memoize messages to prevent unnecessary re-renders
  const memoizedMessages = useMemo(() => messages, [messages]);

  // Initialize user data
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

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      const messageData = await getMessages(chatroomId);
      setMessages(messageData);
    };

    if (userId) {
      loadMessages();
    }
  }, [chatroomId, userId]);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!userId) return;

    // Presence tracking
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

    // Message subscription
    const messageSub = supabase.channel(`messages:${chatroomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_history',
        filter: `chat_room_id=eq.${chatroomId}`,
      }, (payload) => {
        if (payload.new.speaker !== userId) {
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);
        }
      })
      .subscribe();

    return () => {
      presenceTrack.unsubscribe();
      messageSub.unsubscribe();
    };
  }, [chatroomId, userId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [memoizedMessages]);

  const handleSend = useCallback(async (theMessage: string) => {
    if (!theMessage.trim() || isSending || !userId || !nickname) return;

    setIsSending(true);

    const messageObj: Message = {
      speaker: userId,
      speaker_name: nickname,
      chat_message: theMessage,
      created_at: new Date().toISOString(),
      chat_room_id: chatroomId
    };

    try {
      // Optimistically update UI
      setMessages(prev => [...prev, messageObj]);
      setNewMessage('');

      // Notify parent if needed
      if (onSend) {
        onSend(theMessage);
      }

      // Persist to database
      await insertChatHistory(messageObj);
    } catch {
      message.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  }, [isSending, userId, nickname, chatroomId, onSend]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    handleSend(emoji);
  }, [handleSend]);

  return (
    <div 
      className="flex flex-col h-full bg-white border-r" 
      style={{ width: 300, position: 'fixed', left: 0, top: 0, bottom: 0 }}
    >
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Chat Room</h3>
          <Badge status="success" text={`${onlineUsers.length} online`} />
        </div>
      </div>

      <div className="flex flex-col h-full">
        {/* Messages container with scroll */}
        <div className="flex-grow overflow-y-auto p-4" style={{ height: 'calc(100% - 64px)' }}>
          <List
            itemLayout="horizontal"
            dataSource={memoizedMessages}
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
        </div>

        {/* Fixed input at bottom */}
        <div className="bg-white border-t p-4" style={{ position: 'sticky', bottom: 0 }}>
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
              trigger="click"
              placement="topRight"
            >
              <Button className="text-xl">😊</Button>
            </Popover>
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
      </div>
    </div>
  );
};