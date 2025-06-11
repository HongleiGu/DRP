/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

'use client'

import { useEffect, useRef, useState } from 'react'
import { Engine, DisplayMode, Color, FadeInOut, Loader } from 'excalibur'
import { initializeGame } from './engine'
import { Resources } from '@/game/config/resources'
import { Alert, Button, Card } from 'antd';
import { CalendarOutlined, YoutubeOutlined } from '@ant-design/icons';
import { useParams, useRouter } from 'next/navigation'
import MarkdownCalendar from '../Calendar'
import { useUser } from "@clerk/nextjs";
import { resetPlayerToDefault } from '@/utils/api'


export default function Game({sendMessage, addReceiver, chatroomId, chatPanelVisible,
  setChatPanelVisible}: any) {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showButtonTV, setShowButtonTV] = useState(false);
  const [showButtonCalendar, setShowButtonCalendar] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const gameRef = useRef<Engine | null>(null);
  // const params = useParams<{ id: string }>()
  const {user} = useUser();

  useEffect(() => {
    if (!canvasRef.current) return

    const game = new Engine({
      resolution: { width: 256, height: 256 },
      suppressPlayButton: true,
      canvasElement: canvasRef.current,
      displayMode: DisplayMode.FitContainerAndFill,
      pixelArt: true,
      pixelRatio: 4,
    })
    
    gameRef.current = game;

    // Create callbacks object
    const sceneCallbacks = {
        showInteractButtonTV: setShowButtonTV,
        showInteractButtonCalendar: setShowButtonCalendar,
        // Add more callbacks as needed:
        // onPlayerPositionChange: handlePositionChange,
    };

    // Initialize game with callbacks
    console.log("inited room", chatroomId)
    initializeGame(game, sceneCallbacks, user?.id ?? "unknown", user?.publicMetadata.nickname as string ?? "Player", chatroomId, user?.publicMetadata.avatarId as string);

    const loader = new Loader();
    for (const resource of Object.values(Resources)) {
        if (Array.isArray(resource)) {
          for (const res of resource) {
            loader.addResource(res);
          }
        } else {
          loader.addResource(resource);
        }
    }

    const inTransition = new FadeInOut({
      duration: 1000,
      direction: 'in',
      color: Color.ExcaliburBlue
    });

    game.start('overworld', {loader, inTransition}).then(() => {
      console.log('Game started successfully')
    }).catch((err) => {
      console.error('Game failed to start:', err)
    })

    return () => {
      game.stop()
      gameRef.current = null;
    }
  }, [])

  useEffect(() => {
    const helper = async () => {
      if (!user?.id) {
        alert("you have not logged in yet")
        router.push("/")
        return
      }
      if (!user?.publicMetadata.nickname) {
        alert("you are not onboard yet")
        router.push("/onboarding")
        return
      }
      await resetPlayerToDefault(user?.id, user?.publicMetadata.nickname as string, chatroomId, user?.publicMetadata.avatarId as string)
    }
    helper()
  }, [])

  const handleTVButtonClick = () => {
    router.push(`/television/${chatroomId}`)
  };

  const handleCalendarButtonClick = () => {
    // router.push(`/television/${chatroomId}`)
    setIsCalendarOpen(true)
  };

  return (
  <div className="relative w-full h-full">
    <canvas ref={canvasRef} className="w-full h-full" />

    {showButtonCalendar && (
  <div
    style={{
      position: "absolute",
      top: "20%",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 20,
      width: "14%", // 屏幕大约1/7
      minWidth: 180,
    }}
  >
    <Card
      size="small"
      style={{
        backgroundColor: "#fffbe6",
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
        📅 Calendar
      </div>
      <div style={{ fontSize: 12, marginBottom: 12, color: "#555" }}>
        Do you want to check today's schedule?
      </div>
      <div style={{ display: "flex", justifyContent: "space-around" }}>
        <Button
          size="small"
          type="primary"
          onClick={handleCalendarButtonClick}
        >
          Enter
        </Button>
        <Button size="small" onClick={() => setShowButtonCalendar(false)}>
          Skip
        </Button>
      </div>
    </Card>
  </div>
)}


    {/* Buttons container - positioned bottom right */}
    <div
      style={{
        position: "absolute",
        top: 60,
        right: 16, 
        display: 'flex',
        flexDirection: 'column',
        gap: '12px', // spacing between buttons
        zIndex: 10,
        width: 120
      }}
    >
      <Button 
        onClick={() => setChatPanelVisible(!chatPanelVisible)}
        block
      >
        {chatPanelVisible ? 'Hide Chat' : 'Show Chat'}
      </Button>
      {showButtonTV && (
        <Button
          type="primary"
          icon={<YoutubeOutlined />}
          onClick={handleTVButtonClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            borderRadius: '8px',
            padding: '10px 20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          Television
        </Button>
      )}
      {/* <Button
        type="default"
        onClick={handleButtonClickChat}
        style={{
          display: 'flex',
          alignItems: 'center',
          borderRadius: '8px',
          padding: '10px 20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        Open Chatroom
      </Button> */}
      <Alert message="Use WASD or arrow keys to move" type="info" showIcon />
    </div>
      <MarkdownCalendar isOpen={isCalendarOpen} roomId={chatroomId} onClose={() => setIsCalendarOpen(false)}/>
  </div>
)
}