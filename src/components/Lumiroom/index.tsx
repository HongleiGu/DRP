/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

'use client'

import { useEffect, useRef, useState } from 'react'
import { Engine, DisplayMode, Color, FadeInOut, Loader } from 'excalibur'
import { initializeGame } from './engine'
import { Resources } from '@/game/config/resources'
import { Button } from 'antd';
import { YoutubeOutlined } from '@ant-design/icons';
import { useParams, useRouter } from 'next/navigation'

export default function Game({sendMessage, addReceiver, chatroomId}: any) {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showButton, setShowButton] = useState(false);
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
        showInteractButton: setShowButton,
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

  const handleButtonClick = () => {
    router.push(`/television/${chatroomId}`)
  };

  return (
  <div className="relative w-full h-full">
    <canvas ref={canvasRef} className="w-full h-full" />

    {/* Buttons container - positioned bottom right */}
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px', // spacing between buttons
        zIndex: 10
      }}
    >
      {showButton && (
        <Button
          type="primary"
          icon={<YoutubeOutlined />}
          onClick={handleButtonClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            borderRadius: '8px',
            padding: '10px 20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          Open Television Page
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
    </div>
  </div>
)
}