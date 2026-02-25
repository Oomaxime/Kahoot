import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useWebSocket } from './hooks/useWebSocket'
import { useAuthStore } from './store/authStore'
import { usePlayerGameStore } from './store/gameStore'
import { loginPlayer } from '@shared-hooks/authService'
import { useMusic } from '@shared-hooks/useMusic'
import { PLAYER_TRACKS, MUSIC_VOLUME } from './music/tracks'

import JoinScreen from './components/JoinScreen'
import WaitingLobby from './components/WaitingLobby'
import AnswerScreen from './components/AnswerScreen'
import FeedbackScreen from './components/FeedbackScreen'
import ScoreScreen from './components/ScoreScreen'

const _wsEnv = import.meta.env.VITE_WS_URL
const WS_URL = _wsEnv || `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`

function App() {
  const token = useAuthStore(s => s.token)
  const user = useAuthStore(s => s.user)
  const setAuth = useAuthStore(s => s.setAuth)

  const phase = usePlayerGameStore(s => s.phase)
  const players = usePlayerGameStore(s => s.players)
  const currentQuestion = usePlayerGameStore(s => s.currentQuestion)
  const remaining = usePlayerGameStore(s => s.remaining)
  const selectedChoices = usePlayerGameStore(s => s.selectedChoices)
  const hasAnswered = usePlayerGameStore(s => s.hasAnswered)
  const scoreGained = usePlayerGameStore(s => s.scoreGained)
  const totalScore = usePlayerGameStore(s => s.totalScore)
  const feedbackType = usePlayerGameStore(s => s.feedbackType)
  const rankings = usePlayerGameStore(s => s.rankings)
  const error = usePlayerGameStore(s => s.error)
  const applyMessage = usePlayerGameStore(s => s.applyMessage)
  const selectChoice = usePlayerGameStore(s => s.selectChoice)
  const submitAnswer = usePlayerGameStore(s => s.submitAnswer)

  const [joinError, setJoinError] = useState<string | null>(null)
  const roomCodeRef = useRef<string | null>(null)

  const trackName = PLAYER_TRACKS[phase] ?? null
  useMusic(trackName ? `/music/${trackName}.mp3` : null, { volume: MUSIC_VOLUME })

  const wsUrl = token ? `${WS_URL}?token=${token}` : null
  const { status, sendMessage } = useWebSocket(wsUrl, applyMessage)

  // Send 'join' as soon as the WS connects
  useEffect(() => {
    if (status === 'connected' && user?.role === 'player' && roomCodeRef.current) {
      sendMessage({ type: 'join', quizCode: roomCodeRef.current, name: user.name })
    }
  }, [status, user, sendMessage])

  const handleJoin = useCallback(async (code: string, name: string) => {
    try {
      setJoinError(null)
      roomCodeRef.current = code
      const { token: t, user: u } = await loginPlayer(name, code)
      setAuth(t, u)
    } catch {
      roomCodeRef.current = null
      setJoinError('Invalid code or server error. Try again.')
    }
  }, [setAuth])

  const handleAnswer = useCallback((index: number) => {
    if (!currentQuestion) return
    selectChoice(index)
    if (!currentQuestion.isMultiple) {
      sendMessage({ type: 'answer', questionId: currentQuestion.id, choiceIndexes: [index] })
    }
  }, [currentQuestion, selectChoice, sendMessage])

  const handleSubmit = useCallback(() => {
    if (!currentQuestion) return
    const sent = submitAnswer()
    if (sent) {
      sendMessage({ type: 'answer', questionId: currentQuestion.id, choiceIndexes: selectedChoices })
    }
  }, [currentQuestion, submitAnswer, selectedChoices, sendMessage])

  const renderPhase = () => {
    switch (phase) {
      case 'join':
        return <JoinScreen onJoin={handleJoin} error={joinError ?? error ?? undefined} />

      case 'lobby':
        return <WaitingLobby players={players} />

      case 'question':
        return currentQuestion ? (
          <AnswerScreen
            question={currentQuestion}
            remaining={remaining}
            selectedChoices={selectedChoices}
            hasAnswered={hasAnswered}
            onAnswer={handleAnswer}
            onSubmit={handleSubmit}
          />
        ) : null

      case 'feedback':
        return (
          <FeedbackScreen
            feedbackType={feedbackType ?? 'wrong'}
            scoreGained={scoreGained}
            totalScore={totalScore}
          />
        )

      case 'leaderboard':
        return <ScoreScreen rankings={rankings} playerName={user?.role === 'player' ? user.name : ''} />

      case 'ended':
        return (
          <div className="phase-container">
            <h1>Quiz Over!</h1>
            <p className="ended-message">Thanks for playing.</p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h2>Quiz Player</h2>
        {token && (
          <span className={`status-badge status-${status}`}>
            {status === 'connected' ? 'Connected' : status === 'connecting' ? 'Connecting…' : 'Disconnected'}
          </span>
        )}
      </header>
      <main className="app-main">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.18 }}
            style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
          >
            {renderPhase()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App
