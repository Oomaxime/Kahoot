// Auth

export interface AuthResponse {
  token: string
}

export interface HostAuthPayload {
  role: 'host'
  username: string
}

export interface PlayerAuthPayload {
  role: 'player'
  name: string
  playerId: string
}

export type AuthPayload = HostAuthPayload | PlayerAuthPayload

// Quiz

export interface QuizQuestion {
  id: string
  text: string
  choices: string[]
  correctIndexes: number[]
  timerSec: number
}

export type QuestionPayload = Omit<QuizQuestion, 'correctIndexes'> & { isMultiple: boolean }

export type QuizPhase = 'lobby' | 'question' | 'results' | 'leaderboard' | 'ended'

// WebSocket messages

export type ClientMessage =
  | { type: 'join'; quizCode: string; name: string }
  | { type: 'answer'; questionId: string; choiceIndexes: number[] }
  | { type: 'host:create'; title: string; questions: QuizQuestion[] }
  | { type: 'host:start' }
  | { type: 'host:next' }
  | { type: 'host:end' }

export type ServerMessage =
  | { type: 'sync'; phase: QuizPhase; data: { roomCode: string } }
  | { type: 'joined'; playerId: string; players: string[] }
  | { type: 'question'; question: QuestionPayload; index: number; total: number }
  | { type: 'tick'; remaining: number }
  | {
      type: 'results'
      correctIndexes: number[]
      distribution: number[]
      scores: Record<string, number>
      scoreGained?: number
      feedbackType?: 'correct' | 'partial' | 'wrong'
    }
  | { type: 'leaderboard'; rankings: { name: string; score: number }[] }
  | { type: 'ended' }
  | { type: 'error'; message: string }
