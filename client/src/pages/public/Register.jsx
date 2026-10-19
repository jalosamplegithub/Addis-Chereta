import { useState } from 'react'
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, UserRound, X } from 'lucide-react'
import './Register.css'

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const uiLanguages = [
  { code: 'en', label: 'English' },
  { code: 'om', label: 'Afaan Oromoo' },
  { code: 'am', label: 'አማርኛ' },
]
const registrationText = {
  en: { back: 'Back to home', kicker: 'JOIN THE MARKETPLACE', title: 'Create your account', intro: "Register to discover tenders and participate in Ethiopia's public marketplace.", personal: 'Personal Information', account: 'Account Information', first: 'First name', last: 'Last name', legal: 'Legal name', legalHelp: 'If you are a company enter company name, otherwise enter your full legal name.', email: 'Email address', phone: 'Phone number', gender: 'Gender', select: 'Select', male: 'Male', female: 'Female', prefer: 'Prefer not to say', username: 'Username', password: 'Password', confirm: 'Confirm password', reenter: 'Re-enter password', passwordHelp: 'Password must be at least 6 characters.', preferred: 'Preferred language', terms: 'By creating an account, you agree to our', termsLink: 'Terms', privacy: 'Privacy Policy', create: 'Create account', creating: 'Creating account…', already: 'Already registered?', signIn: 'Sign in' },
  om: { back: 'Gara fuula jalqabaatti deebi’i', kicker: 'GABAA KEESSATTI MAKAMI', title: 'Herrega kee uumi', intro: 'Caalbaasii argachuuf galmaa’i; gabaa mootummaa Itoophiyaa keessatti hirmaadhu.', personal: 'Odeeffannoo dhuunfaa', account: 'Odeeffannoo herregaa', first: 'Maqaa', last: 'Maqaa abbaa', legal: 'Maqaa seeraa', legalHelp: 'Dhaabbata yoo taate maqaa dhaabbatichaa galchi; yoo hin taane maqaa seeraa guutuu kee galchi.', email: 'Teessoo imeelii', phone: 'Lakkoofsa bilbilaa', gender: 'Saala', select: 'Filadhu', male: 'Dhiira', female: 'Dubartii', prefer: 'Hin ibsu', username: 'Maqaa fayyadamaa', password: 'Jecha iccitii', confirm: 'Jecha iccitii mirkaneessi', reenter: 'Jecha iccitii irra deebi’i', passwordHelp: 'Jechi iccitii yoo xiqqaate arfiilee 6 qabaachuu qaba.', preferred: 'Afaan filatamaa', terms: 'Herrega uumuudhaan, kana irratti waliigalta:', termsLink: 'Ulaagaalee', privacy: 'Imaammata iccitii', create: 'Herrega uumi', creating: 'Herregni uumamaa jira…', already: 'Dura galmooftee?', signIn: 'Seeni' },
  am: { back: 'ወደ መነሻ ገጽ ተመለስ', kicker: 'የገበያው አባል ይሁኑ', title: 'መለያዎን ይፍጠሩ', intro: 'ጨረታዎችን ለማግኘትና በኢትዮጵያ የመንግሥት ገበያ ለመሳተፍ ይመዝገቡ።', personal: 'የግል መረጃ', account: 'የመለያ መረጃ', first: 'የመጀመሪያ ስም', last: 'የአባት ስም', legal: 'ሕጋዊ ስም', legalHelp: 'ድርጅት ከሆኑ የድርጅቱን ስም፣ ካልሆነ ሙሉ ሕጋዊ ስምዎን ያስገቡ።', email: 'የኢሜይል አድራሻ', phone: 'ስልክ ቁጥር', gender: 'ጾታ', select: 'ይምረጡ', male: 'ወንድ', female: 'ሴት', prefer: 'መግለጽ አልፈልግም', username: 'የተጠቃሚ ስም', password: 'የይለፍ ቃል', confirm: 'የይለፍ ቃሉን ያረጋግጡ', reenter: 'የይለፍ ቃሉን እንደገና ያስገቡ', passwordHelp: 'የይለፍ ቃሉ ቢያንስ 6 ቁምፊዎች ሊኖሩት ይገባል።', preferred: 'ተመራጭ ቋንቋ', terms: 'መለያ በመፍጠር በሚከተሉት ይስማማሉ፦', termsLink: 'ውሎች', privacy: 'የግላዊነት መመሪያ', create: 'መለያ ይፍጠሩ', creating: 'መለያ በመፍጠር ላይ…', already: 'አስቀድመው ተመዝግበዋል?', signIn: 'ይግቡ' },
}

export default function Register() {
  const [uiLanguage, setUiLanguage] = useState(() => {
    const savedLanguage = window.localStorage.getItem('addis-chereta-language')
    return uiLanguages.find(({ code, label }) => code === savedLanguage || label === savedLanguage)?.code || 'en'
  })
  const text = registrationText[uiLanguage] || registrationText.en
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [preferredLanguage, setPreferredLanguage] = useState(uiLanguage)
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
      setSuccess('Your account has been created. You can now sign in.')
    } catch (requestError) {
      setError(requestError.message || 'Could not connect to the registration service. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="register-page" lang={uiLanguage}>
      <div className="register-topbar">
        <a className="register-brand" href="/" aria-label="Back to Addis Chereta home"><span>✳</span><b>ADDIS CHERETA</b></a>
        <a href="/" className="register-back"><ArrowLeft size={15} /> {text.back}</a>
      </div>

      <form className="register-form" onSubmit={handleSubmit}>
        <div className="register-avatar"><UserRound size={47} strokeWidth={1.4} /></div>
        <p className="register-kicker">{text.kicker}</p>
        <h1>{text.title}</h1>
        <p className="register-intro">{text.intro}</p>


        <div className="register-columns">
          <section className="register-section" aria-labelledby="personal-heading">
            <h2 id="personal-heading">{text.personal}</h2>
            <label className="register-field"><span>{text.first}</span><input name="firstName" autoComplete="given-name" placeholder={text.first} required maxLength={80} /></label>
            <label className="register-field"><span>{text.last}</span><input name="lastName" autoComplete="family-name" placeholder={text.last} required maxLength={80} /></label>
            <div className="legal-name-field"><p>{text.legalHelp}</p><label className="register-field"><span>{text.legal}</span><input name="legalName" autoComplete="organization" placeholder={text.legal} required maxLength={180} /></label></div>
            <label className="register-field"><span>{text.email}</span><input name="email" type="email" autoComplete="email" placeholder={text.email} required maxLength={254} /></label>
            <div className="personal-bottom-fields">
              <label className="register-field"><span>{text.phone}</span><input name="phone" type="tel" autoComplete="tel" placeholder={`${text.phone} (0912345678)`} required maxLength={30} /></label>
              <label className="register-field gender-field"><span>{text.gender}</span><select name="gender" defaultValue="" required><option value="" disabled>{text.select}</option><option value="male">{text.male}</option><option value="female">{text.female}</option><option value="prefer_not_to_say">{text.prefer}</option></select></label>
            </div>
          </section>

          <section className="register-section account-section" aria-labelledby="account-heading">
            <h2 id="account-heading">{text.account}</h2>
            <label className="register-field"><span>{text.username}</span><input name="username" autoComplete="username" placeholder={text.username} required minLength={3} maxLength={50} pattern="[A-Za-z0-9._-]+" title="Use letters, numbers, dots, underscores or hyphens." /></label>
            <label className="register-field password-field"><span>{text.password}</span><span className="password-input-wrap"><input name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder={text.password} required minLength={6} maxLength={72} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></span><small>{text.passwordHelp}</small></label>
            <label className="register-field password-field confirm-field"><span>{text.confirm}</span><span className="password-input-wrap"><input name="confirmPassword" type={showConfirmation ? 'text' : 'password'} autoComplete="new-password" placeholder={text.reenter} required minLength={6} maxLength={72} /><button type="button" onClick={() => setShowConfirmation(!showConfirmation)} aria-label={showConfirmation ? 'Hide confirmation password' : 'Show password'}>{showConfirmation ? <EyeOff size={19} /> : <Eye size={19} />}</button></span></label>
            <fieldset className="language-fieldset"><legend>{text.preferred}</legend><div className="language-choices">
              <label><input type="radio" name="preferredLanguage" value="en" checked={preferredLanguage === 'en'} onChange={() => { setPreferredLanguage('en'); setUiLanguage('en'); window.localStorage.setItem('addis-chereta-language', 'English') }} /><span>English</span></label>
              <label><input type="radio" name="preferredLanguage" value="om" checked={preferredLanguage === 'om'} onChange={() => { setPreferredLanguage('om'); setUiLanguage('om'); window.localStorage.setItem('addis-chereta-language', 'Afaan Oromoo') }} /><span lang="om">Afaan Oromoo</span></label>
              <label><input type="radio" name="preferredLanguage" value="am" checked={preferredLanguage === 'am'} onChange={() => { setPreferredLanguage('am'); setUiLanguage('am'); window.localStorage.setItem('addis-chereta-language', 'አማርኛ') }} /><span lang="am">አማርኛ</span></label>
            </div></fieldset>
          </section>
        </div>

        <div className="register-submit-row"><p>{text.terms} <a href="#terms">{text.termsLink}</a> and <a href="#privacy">{text.privacy}</a>.</p><button type="submit" disabled={submitting}>{submitting ? text.creating : text.create}</button></div>
        <p className="register-signin">{text.already} <a href="/login">{text.signIn}</a></p>
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
