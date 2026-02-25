import { useCallback } from 'react'
import { useWebSocket } from './hooks/useWebSocket'
import { useAuthStore } from './store/authStore'
import { useHostGameStore } from './store/gameStore'
import type { QuizQuestion } from '@shared/index'

const WS_URL = import.meta.env.VITE_WS_URL

function App() {
  const token = useAuthStore(s => s.token)
  const phase = useHostGameStore(s => s.phase)
  const applyMessage = useHostGameStore(s => s.applyMessage)

  const wsUrl = token ? `${WS_URL}?token=${token}` : null
  const { status, sendMessage } = useWebSocket(wsUrl, applyMessage)

  const handleCreateQuiz = useCallback((title: string, questions: QuizQuestion[]) => {
    sendMessage({ type: 'host:create', title, questions })
  }, [sendMessage])

  const handleStart = useCallback(() => sendMessage({ type: 'host:start' }), [sendMessage])
  const handleNext  = useCallback(() => sendMessage({ type: 'host:next' }),  [sendMessage])
  const handleEnd   = useCallback(() => sendMessage({ type: 'host:end' }),   [sendMessage])

  const renderPhase = () => {
    // TODO: screens
    void handleCreateQuiz
    void handleStart
    void handleNext
    void handleEnd
    void phase
    return null
  }

  return (
    <div className="app">
      <header className="app-header">
        <h2>Quiz Host</h2>
        <span className={`status-badge status-${status}`}>
          {status === 'connected' ? 'Connected' : status === 'connecting' ? 'Connecting...' : 'Disconnected'}
        </span>
      </header>
      <main className="app-main">
        {renderPhase()}
      </main>
    </div>
  )
}

export default App
