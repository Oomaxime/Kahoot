import { randomUUID } from 'crypto'
import WebSocket from 'ws'
import type { QuizQuestion, QuizPhase, ServerMessage, QuestionPayload } from '../../packages/shared-types'
import { send, broadcast } from './utils'

interface Player {
  readonly id: string
  readonly name: string
  readonly ws: WebSocket
}

type FeedbackType = 'correct' | 'partial' | 'wrong'

export class QuizRoom {
  readonly id: string
  readonly code: string

  phase: QuizPhase = 'lobby'
  hostWs: WebSocket | null = null
  title = ''
  questions: QuizQuestion[] = []

  private readonly players = new Map<string, Player>()
  private readonly scores = new Map<string, number>()
  private answers = new Map<string, number[]>()
  private currentQuestionIndex = -1
  private remaining = 0
  private timerId: ReturnType<typeof setInterval> | null = null

  constructor(id: string, code: string) {
    this.id = id
    this.code = code
  }

  addPlayer(name: string, ws: WebSocket): string {
    const id = randomUUID()
    this.players.set(id, { id, name, ws })
    this.scores.set(id, 0)

    const playerNames = [...this.players.values()].map(p => p.name)
    this.broadcastToAll({ type: 'joined', playerId: id, players: playerNames })

    return id
  }

  start(): void {
    if (this.phase !== 'lobby') return
    if (this.players.size < 1) return
    this.nextQuestion()
  }

  nextQuestion(): void {
    this.clearTimer()
    this.currentQuestionIndex++

    if (this.currentQuestionIndex >= this.questions.length) {
      this.broadcastLeaderboard()
      return
    }

    this.answers.clear()
    this.phase = 'question'
    this.remaining = this.currentQuestion.timerSec

    this.broadcastQuestion()
    this.timerId = setInterval(() => this.tick(), 1000)
  }

  handleAnswer(playerId: string, choiceIndexes: number[]): void {
    if (this.phase !== 'question') return
    if (this.answers.has(playerId)) return

    this.answers.set(playerId, choiceIndexes)

    const isCorrect = this.isExactMatch(choiceIndexes, this.currentQuestion.correctIndexes)
    if (isCorrect) {
      const bonus = Math.round(500 * (this.remaining / this.currentQuestion.timerSec))
      const current = this.scores.get(playerId) ?? 0
      this.scores.set(playerId, current + 1000 + bonus)
    }

    if (this.answers.size === this.players.size) {
      this.timeUp()
    }
  }

  broadcastLeaderboard(): void {
    const rankings = [...this.players.entries()]
      .map(([id, player]) => ({ name: player.name, score: this.scores.get(id) ?? 0 }))
      .sort((a, b) => b.score - a.score)

    this.phase = 'leaderboard'
    this.broadcastToAll({ type: 'leaderboard', rankings })
  }

  end(): void {
    this.clearTimer()
    this.phase = 'ended'
    this.broadcastToAll({ type: 'ended' })
  }

  private get currentQuestion(): QuizQuestion {
    return this.questions[this.currentQuestionIndex]
  }

  private tick(): void {
    this.remaining--
    this.broadcastToAll({ type: 'tick', remaining: this.remaining })
    if (this.remaining <= 0) this.timeUp()
  }

  private timeUp(): void {
    this.clearTimer()
    this.phase = 'results'
    this.broadcastResults()
  }

  private broadcastToAll(message: ServerMessage): void {
    if (this.hostWs) send(this.hostWs, message)
    broadcast(this.getPlayerWsList(), message)
  }

  private broadcastQuestion(): void {
    const { correctIndexes, ...rest } = this.currentQuestion
    const payload: QuestionPayload = { ...rest, isMultiple: correctIndexes.length > 1 }

    this.broadcastToAll({
      type: 'question',
      question: payload,
      index: this.currentQuestionIndex,
      total: this.questions.length,
    })
  }

  private broadcastResults(): void {
    const question = this.currentQuestion
    const distribution = this.buildDistribution(question.choices.length)
    const scores = this.buildScoresRecord()

    const baseResult = { correctIndexes: question.correctIndexes, distribution, scores }

    if (this.hostWs) {
      send(this.hostWs, { type: 'results', ...baseResult })
    }

    for (const [id, player] of this.players) {
      const { feedbackType, scoreGained } = this.computeFeedback(id, question)
      send(player.ws, { type: 'results', ...baseResult, scoreGained, feedbackType })
    }
  }

  private buildDistribution(choiceCount: number): number[] {
    const distribution = new Array<number>(choiceCount).fill(0)
    for (const indexes of this.answers.values()) {
      for (const idx of indexes) {
        if (idx >= 0 && idx < choiceCount) distribution[idx]++
      }
    }
    return distribution
  }

  private buildScoresRecord(): Record<string, number> {
    const record: Record<string, number> = {}
    for (const [id, player] of this.players) {
      record[player.name] = this.scores.get(id) ?? 0
    }
    return record
  }

  private computeFeedback(
    playerId: string,
    question: QuizQuestion,
  ): { feedbackType: FeedbackType; scoreGained: number } {
    const playerAnswers = this.answers.get(playerId)
    if (!playerAnswers) return { feedbackType: 'wrong', scoreGained: 0 }

    if (this.isExactMatch(playerAnswers, question.correctIndexes)) {
      const bonus = Math.round(500 * (this.remaining / question.timerSec))
      return { feedbackType: 'correct', scoreGained: 1000 + bonus }
    }

    const hasPartial = playerAnswers.some(i => question.correctIndexes.includes(i))
    return { feedbackType: hasPartial ? 'partial' : 'wrong', scoreGained: 0 }
  }

  private isExactMatch(given: number[], expected: number[]): boolean {
    if (given.length !== expected.length) return false
    const a = [...given].sort()
    const b = [...expected].sort()
    return a.every((v, i) => v === b[i])
  }

  private getPlayerWsList(): WebSocket[] {
    return [...this.players.values()].map(p => p.ws)
  }

  private clearTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }
  }
}