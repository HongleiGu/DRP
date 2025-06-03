'use client'

import { useEffect, useRef, useState } from 'react'
import { Engine, DisplayMode, Color, FadeInOut, Loader } from 'excalibur'
import { initializeGame } from './engine'
import { Resources } from '@/game/config/resources'
import { Button } from 'antd';
import { YoutubeOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation'

export default function Game() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showButton, setShowButton] = useState(false);
  const gameRef = useRef<Engine | null>(null);

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
    router.push("/television")
  };

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />
      
      {/* External DOM Button - positioned in bottom right */}
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
          }}
        >
          Open Television Page
        </Button>
      )}
    </div>
  )
}