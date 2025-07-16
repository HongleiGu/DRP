// game/state/GameState.ts
'use client' // Ensure this is a Client Component

import { createContext, useContext, useEffect, useState } from 'react'

export interface GameState {
  score: number
  lives: number
  level: number
}

interface GameStateContextValue {
  state: GameState
}

const GameStateContext = createContext<GameStateContextValue>({
  state: { score: 0, lives: 3, level: 1 }
})

export const GameStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState>({ 
    score: 0, 
    lives: 3, 
    level: 1 
  })

  useEffect(() => {
    // Dynamically import `gameEvents` ONLY on the client
    import('../events/GameEvents').then(({ gameEvents, UPDATE_SCORE, UPDATE_LIVES, UPDATE_LEVEL }) => {
      const handleScoreUpdate = (data: { score: number }) => 
        setState(prev => ({ ...prev, score: data.score }))
        
      const handleLivesUpdate = (data: { lives: number }) => 
        setState(prev => ({ ...prev, lives: data.lives }))
        
      const handleLevelUpdate = (data: { level: number }) => 
        setState(prev => ({ ...prev, level: data.level }))

      // Set up event listeners
      gameEvents.on(UPDATE_SCORE, handleScoreUpdate)
      gameEvents.on(UPDATE_LIVES, handleLivesUpdate)
      gameEvents.on(UPDATE_LEVEL, handleLevelUpdate)

      return () => {
        // Clean up event listeners
        gameEvents.off(UPDATE_SCORE, handleScoreUpdate)
        gameEvents.off(UPDATE_LIVES, handleLivesUpdate)
        gameEvents.off(UPDATE_LEVEL, handleLevelUpdate)
      }
    })
  }, [])

  return (
    <GameStateContext.Provider value={{ state }}>
      {children}
    </GameStateContext.Provider>
  )
}

export const useGameState = () => useContext(GameStateContext)