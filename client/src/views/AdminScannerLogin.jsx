
import { useState } from 'react'

export default function AdminScannerLogin({
  onLogin,
  loading,
  error,
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    await onLogin({ email: email.trim(), password })
  }

  return (
    <main className="scanner-login-page">
      <form className="scanner-login-card" onSubmit={handleSubmit}>
        <div className="scanner-login-icon">▦</div>
        <p className="admin-kicker">GATHER ENTRY CONTROL</p>
        <h1>Admin sign in</h1>
        <p>Sign in to scan and verify visitor tickets.</p>

        <label htmlFor="scanner-email">Email address</label>
        <input
          id="scanner-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label htmlFor="scanner-password">Password</label>
        <input
          id="scanner-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <p className="scanner-login-error" role="alert">
            {error}
          </p>
        )}

        <button
          className="admin-primary-button"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}