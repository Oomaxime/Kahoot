import { create } from 'zustand'
import type { QuizPhase, QuestionPayload, ServerMessage } from '@shared/index'

type PlayerPhase = 'join' | 'lobby' | QuizPhase | 'feedback'

interface PlayerGameState {
  phase: PlayerPhase
  players: string[]
  currentQuestion: QuestionPayload | null
  questionIndex: number
  questionTotal: number
  remaining: number
  selectedChoices: number[]
  hasAnswered: boolean
  scoreGained: number
  totalScore: number
  feedbackType: 'correct' | 'partial' | 'wrong' | null
  rankings: { name: string; score: number }[]
  error: string | null
  applyMessage: (msg: ServerMessage) => void
  selectChoice: (index: number) => void
  submitAnswer: () => boolean
  clearError: () => void
  reset: () => void
}

const initial: Omit<PlayerGameState, 'applyMessage' | 'selectChoice' | 'submitAnswer' | 'clearError' | 'reset'> = {
  phase: 'join',
  players: [],
  currentQuestion: null,
  questionIndex: 0,
  questionTotal: 0,
  remaining: 0,
  selectedChoices: [],
  hasAnswered: false,
  scoreGained: 0,
  totalScore: 0,
  feedbackType: null,
  rankings: [],
  error: null,
}

export const usePlayerGameStore = create<PlayerGameState>()((set, get) => ({
  ...initial,

  applyMessage: (msg) => {
    switch (msg.type) {
      case 'joined':
        set({ phase: 'lobby', players: msg.players, error: null })
        break
      case 'question':
        set({
          phase: 'question',
          currentQuestion: msg.question,
          questionIndex: msg.index,
          questionTotal: msg.total,
          remaining: msg.question.timerSec,
          selectedChoices: [],
          hasAnswered: false,
          feedbackType: null,
        })
        break
      case 'tick':
        set({ remaining: msg.remaining })
        break
      case 'results':
        set({
          phase: 'feedback',
          scoreGained: msg.scoreGained ?? 0,
          totalScore: get().totalScore + (msg.scoreGained ?? 0),
          feedbackType: msg.feedbackType ?? 'wrong',
        })
        break
      case 'leaderboard':
        set({ phase: 'leaderboard', rankings: msg.rankings })
        break
      case 'ended':
        set({ phase: 'ended' })
        break
      case 'error':
        set({ error: msg.message })
        break
    }
  },

  // For single-answer: auto-lock on tap. For multiple: toggle selection.
  selectChoice: (index) => {
    const { hasAnswered, currentQuestion, selectedChoices } = get()
    if (hasAnswered || !currentQuestion) return

    if (currentQuestion.isMultiple) {
      const next = selectedChoices.includes(index)
        ? selectedChoices.filter((i) => i !== index)
        : [...selectedChoices, index]
      set({ selectedChoices: next })
    } else {
      set({ selectedChoices: [index], hasAnswered: true })
    }
  },

  // For multiple-answer: called when player taps Submit. Returns false if no choice selected.
  submitAnswer: () => {
    const { selectedChoices, hasAnswered } = get()
    if (hasAnswered || selectedChoices.length === 0) return false
    set({ hasAnswered: true })
    return true
  },

  clearError: () => set({ error: null }),
  reset: () => set(initial),
}))
