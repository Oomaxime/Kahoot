import { motion } from 'motion/react'
import type { QuestionPayload } from '@shared/index'

interface QuestionViewProps {
  question: QuestionPayload
  index: number
  total: number
  remaining: number
  answerCount: number
  totalPlayers: number
}

const SYMBOLS = ['▲', '●', '■', '✦']

function QuestionView({ question, index, total, remaining, answerCount, totalPlayers }: QuestionViewProps) {
  const timerClass = remaining <= 3 ? 'danger' : remaining <= 10 ? 'warning' : ''

  return (
    <motion.div
      className="phase-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="question-header">
        <span>Question {index + 1} / {total}</span>
        <span>{totalPlayers} player{totalPlayers !== 1 ? 's' : ''}</span>
      </div>

      <div className="countdown">
        <motion.div
          className={`countdown-circle ${timerClass}`}
          animate={remaining <= 3 ? { scale: [1, 1.18, 1] } : { scale: 1 }}
          transition={remaining <= 3 ? { repeat: Infinity, duration: 0.45 } : {}}
        >
          {remaining}
        </motion.div>
      </div>

      <motion.p
        className="question-text"
        key={question.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {question.text}
      </motion.p>

      <div className="choices-grid">
        {question.choices.map((choice, i) => (
          <motion.div
            key={i}
            className="choice-card"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.07, type: 'spring', stiffness: 320, damping: 24 }}
          >
            <span style={{ opacity: 0.75 }}>{SYMBOLS[i]}</span>
            {choice}
          </motion.div>
        ))}
      </div>

      <p className="answer-counter">{answerCount} / {totalPlayers} answers</p>
    </motion.div>
  )
}

export default QuestionView
