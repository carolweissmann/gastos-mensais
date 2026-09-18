import { useState } from 'react'
import { Login } from './pages/Login'
import './index.css'

function App() {
  const [user, setUser] = useState<string | null>(
    localStorage.getItem('user')
  )

  function handleLogin(name: string) {
    localStorage.setItem('user', name)
    setUser(name)
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div>
      <h1>Bem-vinda, {user}! 👋</h1>
    </div>
  )
}

export default App