import { create } from 'zustand'
import type { QuizPhase, QuestionPayload, ServerMessage } from '@shared/index'

type HostPhase = 'create' | QuizPhase

interface HostGameState {
  phase: HostPhase
  roomCode: string
  players: string[]
  currentQuestion: QuestionPayload | null
  questionIndex: number
  questionTotal: number
  remaining: number
  correctIndexes: number[]
  distribution: number[]
  scores: Record<string, number>
  rankings: { name: string; score: number }[]
  applyMessage: (msg: ServerMessage) => void
  reset: () => void
}

const initial: Omit<HostGameState, 'applyMessage' | 'reset'> = {
  phase: 'create',
  roomCode: '',
  players: [],
  currentQuestion: null,
  questionIndex: 0,
  questionTotal: 0,
  remaining: 0,
  correctIndexes: [],
  distribution: [],
  scores: {},
  rankings: [],
}

export const useHostGameStore = create<HostGameState>()((set) => ({
  ...initial,

  applyMessage: (msg) => {
    switch (msg.type) {
      case 'sync':
        set({ phase: msg.phase, roomCode: msg.data.roomCode })
        break
      case 'joined':
        set({ players: msg.players })
        break
      case 'question':
        set({
          phase: 'question',
          currentQuestion: msg.question,
          questionIndex: msg.index,
          questionTotal: msg.total,
          remaining: msg.question.timerSec,
          correctIndexes: [],
          distribution: [],
        })
        break
      case 'tick':
        set({ remaining: msg.remaining })
        break
      case 'results':
        set({
          phase: 'results',
          correctIndexes: msg.correctIndexes,
          distribution: msg.distribution,
          scores: msg.scores,
        })
        break
      case 'leaderboard':
        set({ phase: 'leaderboard', rankings: msg.rankings })
        break
      case 'ended':
        set({ phase: 'ended' })
        break
      case 'error':
        console.error('[Host]', msg.message)
        break
    }
  },

  reset: () => set(initial),
}))
