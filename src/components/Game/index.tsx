'use client'

import { useEffect, useRef } from 'react'
import { Engine, DisplayMode, Color, FadeInOut, Loader } from 'excalibur'
import { initializeGame } from './engine'
import { Resources } from '@/game/config/resources'

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // 1. Create game instance
    const game = new Engine({
      resolution: { width: 256, height: 256 },
      suppressPlayButton: true,
      canvasElement: canvasRef.current,
      displayMode: DisplayMode.FitContainerAndFill,
      pixelArt: true,
      pixelRatio: 4,
    })

    // 2. Initialize game systems
    initializeGame(game)

    // 3. Set up transition
    const inTransition = new FadeInOut({
      duration: 1000,
      direction: 'in',
      color: Color.ExcaliburBlue
    })

    // 4. Use the ENGINE'S loader (not standalone loader)

    const loader = new Loader();
    for (const resource of Object.values(Resources)) {
        loader.addResource(resource);
    }

    // 5. Start with the engine's loader
    game.start('overworld', {loader, inTransition}).then(() => {
      console.log('Game started successfully')
    }).catch((err) => {
      console.error('Game failed to start:', err)
    })

    return () => {
      game.stop()
    }
  }, [])

  return <canvas ref={canvasRef} className="w-full h-full" />
}