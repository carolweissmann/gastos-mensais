import { useState } from 'react'

interface LoginProps {
  onLogin: (name: string) => void
}

export function Login({ onLogin }: LoginProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)

  function handleSubmit() {
    if (!name && isRegister) return
    if (!email || !password) return
    onLogin(isRegister ? name : email.split('@')[0])
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: '390px',
      margin: '0 auto',
      minHeight: '100vh',
      background: '#C1E8FF',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#021024' }}>
          💰 Meus Gastos
        </h1>
        <p style={{ color: '#5483B3', marginTop: '8px' }}>
          {isRegister ? 'Crie sua conta' : 'Entre na sua conta'}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {isRegister && (
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#5483B3', display: 'block', marginBottom: '6px' }}>
              Nome
            </label>
            <input
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '1px solid #7DA0CA',
                borderRadius: '12px',
                fontSize: '16px',
                outline: 'none',
                background: 'white',
                color: '#021024',
              }}
            />
          </div>
        )}

        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#5483B3', display: 'block', marginBottom: '6px' }}>
            Email
          </label>
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1px solid #7DA0CA',
              borderRadius: '12px',
              fontSize: '16px',
              outline: 'none',
              background: 'white',
              color: '#021024',
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#5483B3', display: 'block', marginBottom: '6px' }}>
            Senha
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1px solid #7DA0CA',
              borderRadius: '12px',
              fontSize: '16px',
              outline: 'none',
              background: 'white',
              color: '#021024',
            }}
          />
        </div>

        <button
          onClick={handleSubmit}
          style={{
            width: '100%',
            padding: '16px',
            background: '#052659',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            marginTop: '8px',
          }}
        >
          {isRegister ? 'Criar conta' : 'Entrar'}
        </button>

        <button
          onClick={() => setIsRegister(!isRegister)}
          style={{
            background: 'none',
            border: 'none',
            color: '#5483B3',
            fontSize: '14px',
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          {isRegister ? 'Já tem conta? Entrar' : 'Não tem conta? Criar'}
        </button>
      </div>
    </div>
  )
}