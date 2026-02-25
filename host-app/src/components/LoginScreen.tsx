import { useState } from 'react'
import { motion } from 'motion/react'

interface LoginScreenProps {
  onLogin: (username: string) => void
  error?: string
}

function LoginScreen({ onLogin, error }: LoginScreenProps) {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || loading) return
    setLoading(true)
    await onLogin(username.trim())
    setLoading(false)
  }

  return (
    <motion.div
      className="login-screen"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
    >
      <motion.h1
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        Quiz Host
      </motion.h1>
      <p className="subtitle">Create and host your quiz</p>

      {error && (
        <motion.div
          className="error-message"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ textAlign: 'left' }}>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Enter your username"
            autoFocus
            autoComplete="off"
          />
        </div>
        <motion.button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%' }}
          disabled={!username.trim() || loading}
          whileTap={{ scale: 0.97, x: 3, y: 3 }}
        >
          {loading ? 'Connecting…' : 'Get Started →'}
        </motion.button>
      </form>
    </motion.div>
  )
}

export default LoginScreen
