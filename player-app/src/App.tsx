import { useCallback, useEffect } from 'react'
import { useWebSocket } from './hooks/useWebSocket'
import { useAuthStore } from './store/authStore'
import { usePlayerGameStore } from './store/gameStore'

const WS_URL = import.meta.env.VITE_WS_URL

function App() {
  const token = useAuthStore(s => s.token)
  const user = useAuthStore(s => s.user)
  const phase = usePlayerGameStore(s => s.phase)
  const applyMessage = usePlayerGameStore(s => s.applyMessage)
  const selectChoice = usePlayerGameStore(s => s.selectChoice)
  const submitAnswer = usePlayerGameStore(s => s.submitAnswer)
  const currentQuestion = usePlayerGameStore(s => s.currentQuestion)
  const selectedChoices = usePlayerGameStore(s => s.selectedChoices)

  const wsUrl = token ? `${WS_URL}?token=${token}` : null
  const { status, sendMessage } = useWebSocket(wsUrl, applyMessage)

  // Send 'join' as soon as the WS connects
  useEffect(() => {
    if (status === 'connected' && user?.role === 'player') {
      sendMessage({ type: 'join', quizCode: user.playerId, name: user.name })
    }
  }, [status, user, sendMessage])

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
    // TODO: screens
    void phase
    void handleAnswer
    void handleSubmit
    return null
  }

  return (
    <div className="app">
      <header className="app-header">
        <h2>Quiz Player</h2>
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
