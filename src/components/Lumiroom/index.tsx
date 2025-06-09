/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

'use client'

import { useEffect, useRef, useState } from 'react'
import { Engine, DisplayMode, Color, FadeInOut, Loader } from 'excalibur'
import { initializeGame } from './engine'
import { Resources } from '@/game/config/resources'
import { Alert, Button } from 'antd';
import { CalendarOutlined, YoutubeOutlined } from '@ant-design/icons';
import { useParams, useRouter } from 'next/navigation'
import MarkdownCalendar from '../Calendar'

export default function Game({sendMessage, addReceiver, chatroomId, chatPanelVisible,
  setChatPanelVisible}: any) {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showButtonTV, setShowButtonTV] = useState(false);
  const [showButtonCalendar, setShowButtonCalendar] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const gameRef = useRef<Engine | null>(null);
  const params = useParams<{ id: string }>()

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
    initializeGame(game, sceneCallbacks);

    const loader = new Loader();
    for (const resource of Object.values(Resources)) {
        loader.addResource(resource);
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
      {showButtonCalendar && (
        <Button
          type="primary"
          icon={<CalendarOutlined />}
          onClick={handleCalendarButtonClick}
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
      <Alert message="Use WASD or Arrow keys to move" type="info" />
    </div>
      <MarkdownCalendar isOpen={isCalendarOpen} roomId={chatroomId} onClose={() => setIsCalendarOpen(false)}/>
  </div>
)
}