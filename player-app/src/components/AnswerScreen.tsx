import { motion } from 'motion/react'
import clsx from 'clsx'
import { playClick } from '@shared-hooks/clickSound'
import type { QuestionPayload } from '@shared/index'

interface AnswerScreenProps {
  question: QuestionPayload
  remaining: number
  selectedChoices: number[]
  hasAnswered: boolean
  onAnswer: (index: number) => void
  onSubmit: () => void
}

const SYMBOLS = ['▲', '●', '■', '✦']

function AnswerScreen({ question, remaining, selectedChoices, hasAnswered, onAnswer, onSubmit }: AnswerScreenProps) {
  const timerClass = remaining <= 3 ? 'danger' : remaining <= 10 ? 'warning' : ''

  return (
    <div className="answer-screen">
      <motion.div
        className={`answer-timer ${timerClass}`}
        animate={remaining <= 3 ? { scale: [1, 1.18, 1] } : { scale: 1 }}
        transition={remaining <= 3 ? { repeat: Infinity, duration: 0.45 } : {}}
      >
        {remaining}
      </motion.div>

      <p className="answer-question">{question.text}</p>

      <div className="answer-grid">
        {question.choices.map((_, i) => {
          const isSelected = selectedChoices.includes(i)
          const isDisabled = hasAnswered && !question.isMultiple
          return (
            <motion.button
              key={i}
              className={clsx('answer-btn', isSelected && 'selected')}
              onClick={() => {
                if (isDisabled) return
                playClick()
                onAnswer(i)
              }}
              disabled={isDisabled}
              whileTap={!isDisabled ? { scale: 0.95, x: 2, y: 2 } : {}}
              initial={{ opacity: 0, scale: 0.82 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: i * 0.07,
                type: 'spring',
                stiffness: 340,
                damping: 22,
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{SYMBOLS[i]}</span>
            </motion.button>
          )
        })}
      </div>

      {question.isMultiple && !hasAnswered && (
        <motion.button
          className="btn-primary"
          style={{ marginTop: '1.25rem' }}
          onClick={() => { playClick(); onSubmit() }}
          disabled={selectedChoices.length === 0}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          whileTap={{ scale: 0.97, x: 3, y: 3 }}
        >
          Submit Answer
        </motion.button>
      )}

      {hasAnswered && (
        <motion.p
          className="answered-message"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Answer sent ✓
        </motion.p>
      )}
    </div>
  )
}

export default AnswerScreen
