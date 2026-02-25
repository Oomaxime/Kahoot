import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useWebSocket } from './hooks/useWebSocket'
import { useAuthStore } from './store/authStore'
import { useHostGameStore } from './store/gameStore'
import { loginHost } from '@shared-hooks/authService'
import { useMusic } from '@shared-hooks/useMusic'
import { HOST_TRACKS, MUSIC_VOLUME } from './music/tracks'
import type { QuizQuestion } from '@shared/index'

import LoginScreen from './components/LoginScreen'
import CreateQuiz from './components/CreateQuiz'
import Lobby from './components/Lobby'
import QuestionView from './components/QuestionView'
import Results from './components/Results'
import Leaderboard from './components/Leaderboard'

const WS_URL = import.meta.env.VITE_WS_URL

function App() {
  const token = useAuthStore(s => s.token)
  const setAuth = useAuthStore(s => s.setAuth)

  const phase = useHostGameStore(s => s.phase)
  const roomCode = useHostGameStore(s => s.roomCode)
  const players = useHostGameStore(s => s.players)
  const currentQuestion = useHostGameStore(s => s.currentQuestion)
  const questionIndex = useHostGameStore(s => s.questionIndex)
  const questionTotal = useHostGameStore(s => s.questionTotal)
  const remaining = useHostGameStore(s => s.remaining)
  const correctIndexes = useHostGameStore(s => s.correctIndexes)
  const distribution = useHostGameStore(s => s.distribution)
  const rankings = useHostGameStore(s => s.rankings)
  const applyMessage = useHostGameStore(s => s.applyMessage)

  const wsUrl = token ? `${WS_URL}?token=${token}` : null
  const { status, sendMessage } = useWebSocket(wsUrl, applyMessage)

  const [loginError, setLoginError] = useState<string | null>(null)

  const trackName = HOST_TRACKS[phase] ?? null
  useMusic(trackName ? `/music/${trackName}.mp3` : null, { volume: MUSIC_VOLUME })

  const handleLogin = useCallback(async (username: string) => {
    try {
      setLoginError(null)
      const { token: t, user } = await loginHost(username)
      setAuth(t, user)
    } catch {
      setLoginError('Login failed — check the server is running.')
    }
  }, [setAuth])

  const handleCreateQuiz = useCallback((title: string, questions: QuizQuestion[]) => {
    sendMessage({ type: 'host:create', title, questions })
  }, [sendMessage])

  const handleStart = useCallback(() => sendMessage({ type: 'host:start' }), [sendMessage])
  const handleNext  = useCallback(() => sendMessage({ type: 'host:next' }),  [sendMessage])
  const handleEnd   = useCallback(() => sendMessage({ type: 'host:end' }),   [sendMessage])

  const renderPhase = () => {
    if (!token) {
      return <LoginScreen onLogin={handleLogin} error={loginError ?? undefined} />
    }

    switch (phase) {
      case 'create':
        return <CreateQuiz onSubmit={handleCreateQuiz} />

      case 'lobby':
        return <Lobby quizCode={roomCode} players={players} onStart={handleStart} />

      case 'question':
        return currentQuestion ? (
          <QuestionView
            question={currentQuestion}
            index={questionIndex}
            total={questionTotal}
            remaining={remaining}
            answerCount={0}
            totalPlayers={players.length}
          />
        ) : null

      case 'results':
        return currentQuestion ? (
          <Results
            question={currentQuestion}
            correctIndexes={correctIndexes}
            distribution={distribution}
            onNext={handleNext}
          />
        ) : null

      case 'leaderboard':
        return <Leaderboard rankings={rankings} onEnd={handleEnd} />

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
        <h2>Quiz Host</h2>
        {token && (
          <span className={`status-badge status-${status}`}>
            {status === 'connected' ? 'Connected' : status === 'connecting' ? 'Connecting…' : 'Disconnected'}
          </span>
        )}
      </header>
      <main className="app-main">
        <AnimatePresence mode="wait">
          <motion.div
            key={token ? phase : 'login'}
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
