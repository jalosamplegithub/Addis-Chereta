import { useState } from 'react'
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, UserRound, X } from 'lucide-react'
import './Register.css'

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [preferredLanguage, setPreferredLanguage] = useState('en')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const formElement = event.currentTarget
    setError('')
    setSuccess('')

      const form = new FormData(formElement)
    const password = form.get('password')
    if (password !== form.get('confirmPassword')) {
      setError('The passwords do not match.')
      return
    }

    const payload = {
      firstName: form.get('firstName'),
      lastName: form.get('lastName'),
      legalName: form.get('legalName'),
      email: form.get('email'),
      phone: form.get('phone'),
      gender: form.get('gender'),
      username: form.get('username'),
      password,
      preferredLanguage,
    }

    setSubmitting(true)
    try {
      const response = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Registration failed. Please check your details and try again.')
      formElement.reset()
      setPreferredLanguage('en')
      setSuccess('Your account has been created. You can now sign in.')
    } catch (requestError) {
      setError(requestError.message || 'Could not connect to the registration service. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="register-page">
      <div className="register-topbar">
        <a className="register-brand" href="/" aria-label="Back to Addis Chereta home"><span>✳</span><b>ADDIS CHERETA</b></a>
        <a href="/" className="register-back"><ArrowLeft size={15} /> Back to home</a>
      </div>

      <form className="register-form" onSubmit={handleSubmit}>
        <div className="register-avatar"><UserRound size={47} strokeWidth={1.4} /></div>
        <p className="register-kicker">JOIN THE MARKETPLACE</p>
        <h1>Create your account</h1>
        <p className="register-intro">Register to discover tenders and participate in Ethiopia's public marketplace.</p>


        <div className="register-columns">
          <section className="register-section" aria-labelledby="personal-heading">
            <h2 id="personal-heading">Personal Information</h2>
            <label className="register-field"><span>First name</span><input name="firstName" autoComplete="given-name" placeholder="First Name" required maxLength={80} /></label>
            <label className="register-field"><span>Last name</span><input name="lastName" autoComplete="family-name" placeholder="Last Name" required maxLength={80} /></label>
            <div className="legal-name-field"><p>If you are a company enter company name, otherwise enter your full legal name.</p><label className="register-field"><span>Legal name</span><input name="legalName" autoComplete="organization" placeholder="Legal name" required maxLength={180} /></label></div>
            <label className="register-field"><span>Email address</span><input name="email" type="email" autoComplete="email" placeholder="Email" required maxLength={254} /></label>
            <div className="personal-bottom-fields">
              <label className="register-field"><span>Phone number</span><input name="phone" type="tel" autoComplete="tel" placeholder="Phone eg. 0912345678" required maxLength={30} /></label>
              <label className="register-field gender-field"><span>Gender</span><select name="gender" defaultValue="" required><option value="" disabled>Select</option><option value="male">Male</option><option value="female">Female</option><option value="prefer_not_to_say">Prefer not to say</option></select></label>
            </div>
          </section>

          <section className="register-section account-section" aria-labelledby="account-heading">
            <h2 id="account-heading">Account Information</h2>
            <label className="register-field"><span>Username</span><input name="username" autoComplete="username" placeholder="Username" required minLength={3} maxLength={50} pattern="[A-Za-z0-9._-]+" title="Use letters, numbers, dots, underscores or hyphens." /></label>
            <label className="register-field password-field"><span>Password</span><span className="password-input-wrap"><input name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Password" required minLength={6} maxLength={72} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></span><small>Password must be at least 6 characters.</small></label>
            <label className="register-field password-field confirm-field"><span>Confirm password</span><span className="password-input-wrap"><input name="confirmPassword" type={showConfirmation ? 'text' : 'password'} autoComplete="new-password" placeholder="Re-enter password" required minLength={6} maxLength={72} /><button type="button" onClick={() => setShowConfirmation(!showConfirmation)} aria-label={showConfirmation ? 'Hide confirmation password' : 'Show confirmation password'}>{showConfirmation ? <EyeOff size={19} /> : <Eye size={19} />}</button></span></label>
            <fieldset className="language-fieldset"><legend>Preferred language</legend><div className="language-choices">
              <label><input type="radio" name="preferredLanguage" value="en" checked={preferredLanguage === 'en'} onChange={(event) => setPreferredLanguage(event.target.value)} /><span>English</span></label>
              <label><input type="radio" name="preferredLanguage" value="am" checked={preferredLanguage === 'am'} onChange={(event) => setPreferredLanguage(event.target.value)} /><span lang="am">አማርኛ</span></label>
              <label><input type="radio" name="preferredLanguage" value="om" checked={preferredLanguage === 'om'} onChange={(event) => setPreferredLanguage(event.target.value)} /><span lang="om">Afaan Oromoo</span></label>
            </div></fieldset>
          </section>
        </div>

        <div className="register-submit-row"><p>By creating an account, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</p><button type="submit" disabled={submitting}>{submitting ? 'Creating account…' : 'Create account'}</button></div>
        <p className="register-signin">Already registered? <a href="/login">Sign in</a></p>
      </form>
      <footer className="register-footer">© 2026 Addis Chereta <span>•</span> Ethiopia's public procurement marketplace</footer>
      {(success || error) && <div className="registration-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) { setSuccess(''); setError('') } }}>
        <section className={`registration-success-modal ${error ? 'is-error' : 'is-success'}`} role={error ? 'alertdialog' : 'dialog'} aria-modal="true" aria-labelledby="registration-success-title" aria-describedby="registration-success-message">
          <button className="registration-modal-close" type="button" onClick={() => { setSuccess(''); setError('') }} aria-label="Close message"><X size={20} /></button>
          <span className="registration-success-icon">{error ? <AlertCircle size={42} strokeWidth={1.7} /> : <CheckCircle2 size={42} strokeWidth={1.7} />}</span>
          <p className="registration-modal-kicker">{error ? 'REGISTRATION NOTICE' : 'WELCOME TO ADDIS CHERETA'}</p>
          <h2 id="registration-success-title">{success ? 'Registration successful!' : error.toLowerCase().includes('already exists') ? 'Account already exists' : 'Registration could not be completed'}</h2>
          <p id="registration-success-message">{success || error}</p>
          {success || error.toLowerCase().includes('already exists')
            ? <a className="registration-modal-action" href="/login">Continue to sign in <ArrowRight size={16} /></a>
            : <button className="registration-modal-action" type="button" onClick={() => setError('')}>Try again <ArrowRight size={16} /></button>}
          <button className="registration-modal-secondary" type="button" onClick={() => { setSuccess(''); setError('') }}>Close</button>
        </section>
      </div>}
    </main>
  )
}
