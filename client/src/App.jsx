import { useEffect } from 'react'
import AuthModal from './components/AuthModal'
import Game from './pages/Game'
import { useAuthStore } from './stores/authStore'
import { useGameStore } from './stores/gameStore'

export default function App() {
  const { checkSession, isChecking } = useAuthStore()
  const loadGame = useGameStore((state) => state.loadGame)

  useEffect(() => {
    checkSession()
  }, [checkSession])

  if (isChecking) {
    return (
      <main className="session-loader">
        <span className="auth-rune">M</span>
        <p>Recuperando tu expedición...</p>
      </main>
    )
  }

  return (
    <>
      <Game />
      <AuthModal onAuthenticated={loadGame} />
    </>
  )
}
