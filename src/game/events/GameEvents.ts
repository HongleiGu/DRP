"use client"

// game/events/GameEvents.ts
import { EventEmitter } from 'excalibur'

// Define strict event types
type GameEventMap = {
  updateScore: { score: number }
  updateLives: { lives: number }
  updateLevel: { level: number }
  gameOver: { reason: string }
}

// Create strongly typed event emitter
export const gameEvents = new EventEmitter<GameEventMap>()

// Event names as constants with literal types
export const UPDATE_SCORE = 'updateScore' as const
export const UPDATE_LIVES = 'updateLives' as const
export const UPDATE_LEVEL = 'updateLevel' as const
export const GAME_OVER = 'gameOver' as const