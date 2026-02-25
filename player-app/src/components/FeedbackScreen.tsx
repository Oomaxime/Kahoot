import { motion } from 'motion/react'

interface FeedbackScreenProps {
  feedbackType: 'correct' | 'partial' | 'wrong'
  scoreGained: number
  totalScore: number
}

const CONFIG = {
  correct:  { emoji: '✓', text: 'Correct!',  cssClass: 'correct'   },
  partial:  { emoji: '~', text: 'Partial!',  cssClass: 'partial'   },
  wrong:    { emoji: '✗', text: 'Wrong!',    cssClass: 'incorrect' },
}

function FeedbackScreen({ feedbackType, scoreGained, totalScore }: FeedbackScreenProps) {
  const { emoji, text, cssClass } = CONFIG[feedbackType]

  return (
    <motion.div
      className="phase-container feedback-container"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
    >
      <div className={`feedback ${cssClass}`}>
        <motion.span
          className="feedback-icon"
          initial={{ scale: 0, rotate: -40 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 16, delay: 0.08 }}
        >
          {emoji}
        </motion.span>

        <motion.p
          className="feedback-text"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        >
          {text}
        </motion.p>

        {scoreGained > 0 && (
          <motion.p
            className="feedback-gained"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 16, delay: 0.28 }}
          >
            +{scoreGained.toLocaleString()}
          </motion.p>
        )}

        <motion.p
          className="feedback-score"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Total: {totalScore.toLocaleString()} pts
        </motion.p>
      </div>
    </motion.div>
  )
}

export default FeedbackScreen
