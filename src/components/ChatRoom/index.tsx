/* eslint-disable @typescript-eslint/no-explicit-any */


import { Suspense,  useState } from "react";
// import { VideoElement } from "../PlayList";
import { Button, Layout} from "antd";
// import { Content } from "antd/es/layout/layout";
// import Television from "../Television";
import ChatPanel from "../ChatPanel";
import { GameStateProvider } from "@/game/state/GameState";
import dynamic from "next/dynamic";

const HUD = dynamic(() => import('@/components/Lumiroom/UI/Overlay/HUD'), { ssr: false });
const Game = dynamic(() => import('@/components/Lumiroom'), {
  ssr: false,
  loading: () => <div className="text-center p-8">Loading game...</div>,
});

const { Content } = Layout;

export default function ChatRoom({ chatroomId }: { chatroomId: string }) {
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
    <Layout style={{ height: '100vh', position: 'relative' }}>
      
      {/* Left Chat Panel */}
      {chatPanelVisible && (
        <div 
          className="flex-1 overflow-y-auto h-max-[80%]" 
        >
          <ChatPanel
            chatroomId={chatroomId}
            onSend={handleSend}
          />
        </div>
      )}

      {/* Right Game Panel */}
      <Layout style={{ height: '100vh', marginLeft: chatPanelVisible ? 300 : 0 }}>
        <Content style={{ 
          height: '100%', 
          position: 'relative', 
          overflow: 'hidden',
          backgroundColor: '#fff'
        }}>
          {/* 右侧游戏栏 */}
          <Layout>
            <Content style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
              <GameStateProvider>
                <Suspense fallback={<div className="text-center p-8">Initializing game engine...</div>}>
                  <HUD />
                  <Game sendMessage={handleSend} addReceiver={addReceiver} chatroomId={chatroomId} />
                </Suspense>
              </GameStateProvider>
            </Content>
          </Layout>
        </Content>
      </Layout>

      {/* Chat Panel Toggle Button */}
      <Button 
        type="primary" 
        shape="circle" 
        size="large"
        style={{ position: 'fixed', top: 20, left: chatPanelVisible ? 320 : 20, zIndex: 1000 }}
        onClick={() => setChatPanelVisible(!chatPanelVisible)}
      >
        {chatPanelVisible ? '<' : '>'}
      </Button>
    </Layout>
  );
}