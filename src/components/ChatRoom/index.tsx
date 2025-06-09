/* eslint-disable @typescript-eslint/no-explicit-any */


import { Suspense,  useRef,  useState } from "react";
// import { VideoElement } from "../PlayList";
import { Button} from "antd";
// import { Content } from "antd/es/layout/layout";
// import Television from "../Television";
import ChatPanel from "../ChatPanel";
import { GameStateProvider } from "@/game/state/GameState";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const HUD = dynamic(() => import('@/components/Lumiroom/UI/Overlay/HUD'), { ssr: false });
const Game = dynamic(() => import('@/components/Lumiroom'), {
  ssr: false,
  loading: () => <div className="text-center p-8">Loading game...</div>,
});

// const { Content } = Layout;

export default function ChatRoom({ chatroomId }: { chatroomId: string }) {
  const router = useRouter();
  const sendMessage = useRef<((msg: any) => void) | null>(null);
  const receiveMessage = useRef<((msg: any) => void) | null>(null);
  const [chatPanelVisible, setChatPanelVisible] = useState(true);
  let theReceiver: any = null;

  const addReceiver = (receiver: any) => {
    theReceiver = receiver;
  };

  const handleSend = (theMessage: string) => {
    if (theReceiver) {
      theReceiver({
        chat_message: theMessage,
        created_at: new Date().toISOString()
      });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "row", height: '100vh', width: '100vw', position: 'fixed' }}>
      
      {/* Left Chat Panel */}
      {chatPanelVisible && (
        <div style={{
          flex: 3,
          display: "flex"
        }}>
          <ChatPanel
            chatroomId={chatroomId}
            onMount={(sendFn) => (sendMessage.current = sendFn)}
            receiveMessage={(msg) => receiveMessage.current?.(msg)}
          />
        </div>
      )}

      {/* Right Game Panel */}
      <div style={{
          flex: 7,
          backgroundColor: '#fff'
      }}>
        <GameStateProvider>
          <Suspense fallback={<div className="text-center p-8">Initializing game engine...</div>}>
            <HUD />
            <Game 
              sendMessage={handleSend} 
              addReceiver={addReceiver}
              chatPanelVisible={chatPanelVisible}
              setChatPanelVisible={setChatPanelVisible}
              chatroomId={chatroomId} 
            />
          </Suspense>
        </GameStateProvider>
      </div>

      {/* Chat Panel Toggle Button */}
      <Button
        type="primary"
        onClick={() => router.push(`/lobby`)}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 1000
        }}
      >
        Go Back
      </Button>
    </div>
  );
}