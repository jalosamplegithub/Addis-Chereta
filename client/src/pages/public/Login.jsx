import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Globe2, LockKeyhole, UserRound } from 'lucide-react'
import { login } from '../../services/authService.js'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showForgotHelp, setShowForgotHelp] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login({ username, password })
      navigate('/')
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <header className="login-header">
        <Link className="login-brand" to="/" aria-label="Addis Chereta home"><span>✳</span><b>ADDIS CHERETA<small>ETHIOPIA'S DIGITAL MARKETPLACE</small></b></Link>
        <Link className="login-back" to="/"><ArrowLeft size={15} /> Back to home</Link>
      </header>

      <div className="login-layout">
        <section className="login-welcome">
          <span className="login-welcome-icon"><Globe2 size={22} /></span>
          <p className="login-eyebrow">WELCOME BACK</p>
          <h1>Your next opportunity<br />is waiting.</h1>
          <p className="login-welcome-copy">Sign in to follow tenders, manage your bids and stay connected to Ethiopia's public marketplace.</p>
          <div className="login-opportunity-note"><span className="login-note-mark">✳</span><span><b>One marketplace.</b><small>More ways to move your business forward.</small></span></div>
          <div className="login-decor decor-one" /><div className="login-decor decor-two" />
        </section>

        <section className="login-card" aria-labelledby="login-title">
          <div className="login-card-icon"><UserRound size={23} /></div>
          <p className="login-card-kicker">YOUR ACCOUNT</p>
          <h2 id="login-title">Sign in</h2>
          <p className="login-card-description">Enter your username and password to continue.</p>
          {error && <div className="login-error" role="alert">{error}</div>}

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-field"><span>Username</span><span className="login-input-wrap"><UserRound size={17} /><input name="username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" placeholder="Enter your username" required maxLength={50} /></span></label>
            <div className="login-field"><span>Password</span><span className="login-input-wrap"><LockKeyhole size={17} /><input id="login-password" name="password" value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" required maxLength={72} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></div>
            <div className="login-action-row"><button className="login-submit" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : <>Sign in <ArrowRight size={16} /></>}</button><button className="login-forgot-button" type="button" onClick={() => setShowForgotHelp(!showForgotHelp)}>Forgot password?</button></div>
            {showForgotHelp && <div className="forgot-password-help" role="status"><b>Password reset help</b><span>Automated password reset is not available yet. Please contact your account administrator for help.</span></div>}
          </form>

          <p className="login-register-prompt">Don't have an account? <Link to="/register">Create an account</Link></p>
          <div className="login-secure-note"><LockKeyhole size={13} /> Your password is checked against a secure hash.</div>
        </section>
      </div>

      <footer className="login-footer">© 2026 Addis Chereta <span>•</span> Ethiopia's public procurement marketplace</footer>
    </main>
  )
}
