import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Globe2, LockKeyhole, UserRound } from 'lucide-react'
import { login } from '../../services/authService.js'
import './Login.css'

const loginTranslations = {
  en: { back: 'Back to home', welcome: 'WELCOME BACK', headline: <>Your next opportunity<br />is waiting.</>, welcomeCopy: "Sign in to follow tenders, manage your bids and stay connected to Ethiopia's public marketplace.", one: 'One marketplace.', more: 'More ways to move your business forward.', account: 'YOUR ACCOUNT', signIn: 'Sign in', description: 'Enter your username and password to continue.', username: 'Username', password: 'Password', usernamePlaceholder: 'Enter your username', passwordPlaceholder: 'Enter your password', signingIn: 'Signing in…', forgot: 'Forgot password?', reset: 'Password reset help', resetCopy: 'Automated password reset is not available yet. Please contact your account administrator for help.', noAccount: "Don't have an account?", create: 'Create an account', secure: 'Your password is checked against a secure hash.' },
  om: { back: 'Gara fuula jalqabaatti deebi’i', welcome: 'BAGA DEEBITAN', headline: <>Carraan kee itti aanu<br />si eegaa jira.</>, welcomeCopy: 'Caalbaasii hordofuuf, dorgommii kee bulchuuf, akkasumas gabaa mootummaa Itoophiyaa waliin walitti hidhamiinsa qabaachuuf seeni.', one: 'Gabaa tokko.', more: 'Karaa daldala kee itti guddistu dabalataa.', account: 'HERREGA KEE', signIn: 'Seeni', description: 'Itti fufuuf maqaa fayyadamaa fi jecha iccitii galchi.', username: 'Maqaa fayyadamaa', password: 'Jecha iccitii', usernamePlaceholder: 'Maqaa fayyadamaa galchi', passwordPlaceholder: 'Jecha iccitii galchi', signingIn: 'Seenaa jira…', forgot: 'Jecha iccitii irraanfatte?', reset: 'Gargaarsa jecha iccitii', resetCopy: 'Amma ofumaan jecha iccitii haaromsuun hin danda’amu. Gargaarsaaf bulchaa herrega kee qunnami.', noAccount: 'Herrega hin qabduu?', create: 'Herrega uumi', secure: 'Jecha iccitii kee haashii nageenya qabuun mirkaneessina.' },
  am: { back: 'ወደ መነሻ ገጽ ተመለስ', welcome: 'እንኳን ተመለሱ', headline: <>ቀጣዩ ዕድልዎ<br />እየጠበቀዎት ነው።</>, welcomeCopy: 'ጨረታዎችን ለመከታተል፣ ጨረታዎችዎን ለማስተዳደር እና ከኢትዮጵያ የመንግሥት ገበያ ጋር ለመገናኘት ይግቡ።', one: 'አንድ የገበያ ቦታ።', more: 'ንግድዎን ወደ ፊት የሚያራምዱ ተጨማሪ መንገዶች።', account: 'የእርስዎ መለያ', signIn: 'ይግቡ', description: 'ለመቀጠል የተጠቃሚ ስምዎንና የይለፍ ቃልዎን ያስገቡ።', username: 'የተጠቃሚ ስም', password: 'የይለፍ ቃል', usernamePlaceholder: 'የተጠቃሚ ስምዎን ያስገቡ', passwordPlaceholder: 'የይለፍ ቃልዎን ያስገቡ', signingIn: 'በመግባት ላይ…', forgot: 'የይለፍ ቃል ረሱ?', reset: 'የይለፍ ቃል እገዛ', resetCopy: 'አውቶማቲክ የይለፍ ቃል ማደስ ገና አይገኝም። እገዛ ለማግኘት የመለያዎን አስተዳዳሪ ያነጋግሩ።', noAccount: 'መለያ የለዎትም?', create: 'መለያ ይፍጠሩ', secure: 'የይለፍ ቃልዎ በደህንነቱ በተጠበቀ ሃሽ ይረጋገጣል።' },
}

export default function Login() {
  const navigate = useNavigate()
  const [language] = useState(() => {
    const saved = window.localStorage.getItem('addis-chereta-language')
    return saved === 'Afaan Oromoo' || saved === 'om' ? 'om' : saved === 'አማርኛ' || saved === 'am' ? 'am' : 'en'
  })
  const text = loginTranslations[language]
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
      const user = await login({ username, password })
      navigate(user.role === 'procurement' ? '/procurement/dashboard' : '/')
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page" lang={language}>
      <header className="login-header">
        <Link className="login-brand" to="/" aria-label="Addis Chereta home"><span>✳</span><b>ADDIS CHERETA<small>ETHIOPIA'S DIGITAL MARKETPLACE</small></b></Link>
        <Link className="login-back" to="/"><ArrowLeft size={15} /> {text.back}</Link>
      </header>

      <div className="login-layout">
        <section className="login-welcome">
          <span className="login-welcome-icon"><Globe2 size={22} /></span>
          <p className="login-eyebrow">{text.welcome}</p>
          <h1>{text.headline}</h1>
          <p className="login-welcome-copy">{text.welcomeCopy}</p>
          <div className="login-opportunity-note"><span className="login-note-mark">✳</span><span><b>{text.one}</b><small>{text.more}</small></span></div>
          <div className="login-decor decor-one" /><div className="login-decor decor-two" />
        </section>

        <section className="login-card" aria-labelledby="login-title">
          <div className="login-card-icon"><UserRound size={23} /></div>
          <p className="login-card-kicker">{text.account}</p>
          <h2 id="login-title">{text.signIn}</h2>
          <p className="login-card-description">{text.description}</p>
          {error && <div className="login-error" role="alert">{error}</div>}

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-field"><span>{text.username}</span><span className="login-input-wrap"><UserRound size={17} /><input name="username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" placeholder={text.usernamePlaceholder} required maxLength={50} /></span></label>
            <div className="login-field"><span>{text.password}</span><span className="login-input-wrap"><LockKeyhole size={17} /><input id="login-password" name="password" value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder={text.passwordPlaceholder} required maxLength={72} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></div>
            <div className="login-action-row"><button className="login-submit" type="submit" disabled={submitting}>{submitting ? text.signingIn : <>{text.signIn} <ArrowRight size={16} /></>}</button><button className="login-forgot-button" type="button" onClick={() => setShowForgotHelp(!showForgotHelp)}>{text.forgot}</button></div>
            {showForgotHelp && <div className="forgot-password-help" role="status"><b>{text.reset}</b><span>{text.resetCopy}</span></div>}
          </form>

          <p className="login-register-prompt">{text.noAccount} <Link to="/register">{text.create}</Link></p>
          <div className="login-secure-note"><LockKeyhole size={13} /> {text.secure}</div>
        </section>
      </div>

      <footer className="login-footer">© 2026 Addis Chereta <span>•</span> Ethiopia's public procurement marketplace</footer>
    </main>
  )
}
