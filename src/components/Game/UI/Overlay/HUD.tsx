/* eslint-disable @typescript-eslint/no-unused-vars */

// components/UI/Overlay/HUD.tsx
'use client'

import { useGameState } from "@/game/state/GameState"

export default function HUD () {
  const { state } = useGameState()
  
  return (
    <div className="fixed top-0 left-0 p-4">
      {/* <div>Score: {state.score}</div> */}
      {/* <div>Lives: {state.lives}</div> */}
    </div>
  )
}