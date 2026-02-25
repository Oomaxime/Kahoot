import { motion } from 'motion/react'
import { playClick } from '@shared-hooks/clickSound'
import type { QuestionPayload } from '@shared/index'

interface ResultsProps {
  question: QuestionPayload
  correctIndexes: number[]
  distribution: number[]
  onNext: () => void
}

const SYMBOLS = ['▲', '●', '■', '✦']

function Results({ question, correctIndexes, distribution, onNext }: ResultsProps) {
  const maxCount = Math.max(...distribution, 1)

  return (
    <motion.div
      className="phase-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h1>Results</h1>
      <div className="results-container">
        {question.choices.map((choice, i) => {
          const isCorrect = correctIndexes.includes(i)
          const count = distribution[i] ?? 0
          const widthPct = `${Math.round((count / maxCount) * 100)}%`

          return (
            <div key={i} className="result-bar-container">
              <div className="result-bar-label">
                <span style={{ marginRight: '0.35rem', opacity: 0.6 }}>{SYMBOLS[i]}</span>
                {choice}
                {isCorrect && <span className="correct-label">✓</span>}
              </div>
              <div className="result-bar-wrapper">
                <motion.div
                  className={`result-bar ${isCorrect ? 'correct' : 'incorrect'}`}
                  initial={{ width: 0 }}
                  animate={{ width: widthPct }}
                  transition={{
                    duration: 0.75,
                    ease: [0.34, 1.56, 0.64, 1],
                    delay: i * 0.1,
                  }}
                >
                  <span className="result-bar-count">{count}</span>
                </motion.div>
              </div>
            </div>
          )
        })}

        <motion.button
          className="btn btn-primary"
          onClick={() => { playClick(); onNext() }}
          style={{ marginTop: '2rem', width: '100%' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}
          whileTap={{ scale: 0.97, x: 3, y: 3 }}
        >
          Next Question →
        </motion.button>
      </div>
    </motion.div>
  )
}

export default Results
