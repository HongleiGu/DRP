import { Suspense, useState } from "react";
import { Button} from "antd";
import ChatPanel from "../ChatPanel";
import { GameStateProvider } from "@/game/state/GameState";
import dynamic from "next/dynamic";
// import { useRouter } from "next/navigation";

// const HUD = dynamic(() => import('@/components/Lumiroom/UI/Overlay/HUD'), { ssr: false }); // if later we need some overlay
const Game = dynamic(() => import('@/components/Lumiroom'), {
  ssr: false,
  loading: () => <div className="text-center p-8">Joining lumiroom...</div>,
});

export default function ChatRoom({ chatroomId }: { chatroomId: string }) {
  const [chatPanelVisible, setChatPanelVisible] = useState(true);

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
            {/* <HUD /> */}
            <Game 
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
        onClick={() => {
            window.location.href = "/lobby"
            // router.push(`/lobby`)
          }
        }
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