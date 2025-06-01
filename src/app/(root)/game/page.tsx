// app/page.tsx
'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { GameStateProvider } from '@/game/state/GameState'
// import { HUD } from '../components/Game/UI/Overlay/HUD'
const HUD = dynamic(() => import('@/components/Game/UI/Overlay/HUD'), { ssr: false })

const Game = dynamic(() => import('@/components/Game'), {
  ssr: false,
  loading: () => <div className="text-center p-8">Loading game...</div>
})

export default function Home() {
  return (
    <main className="relative w-full h-screen overflow-hidden">
      <GameStateProvider>
        <Suspense fallback={<div className="text-center p-8">Initializing game engine...</div>}>
          <HUD />
          <Game />
        </Suspense>
      </GameStateProvider>
    </main>
  )
}