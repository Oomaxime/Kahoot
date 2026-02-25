import { useState } from 'react'
import { motion } from 'motion/react'

interface JoinScreenProps {
  onJoin: (code: string, name: string) => void
  error?: string
}

function JoinScreen({ onJoin, error }: JoinScreenProps) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || !name.trim() || loading) return
    setLoading(true)
    await onJoin(code.toUpperCase(), name.trim())
    setLoading(false)
  }

  return (
    <motion.form
      className="join-form"
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
    >
      <h1>Join Quiz</h1>
      <p className="subtitle">Enter the room code and your name</p>

      {error && (
        <motion.div
          className="error-message"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          {error}
        </motion.div>
      )}

      <div className="form-group">
        <label htmlFor="code">Room Code</label>
        <input
          id="code"
          type="text"
          className="code-input"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
          placeholder="ABCDEF"
          maxLength={6}
          autoFocus
          autoComplete="off"
          autoCapitalize="characters"
        />
      </div>

      <div className="form-group">
        <label htmlFor="name">Your Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value.slice(0, 20))}
          placeholder="Player 1"
          maxLength={20}
          autoComplete="off"
        />
      </div>

      <motion.button
        type="submit"
        className="btn-primary"
        disabled={!code.trim() || !name.trim() || loading}
        whileTap={!loading ? { scale: 0.97, x: 3, y: 3 } : {}}
      >
        {loading ? 'Joining…' : 'Join →'}
      </motion.button>
    </motion.form>
  )
}

export default JoinScreen
