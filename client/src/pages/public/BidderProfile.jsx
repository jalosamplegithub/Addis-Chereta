import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, LockKeyhole, Save, ShieldCheck, Trash2, UserRound } from 'lucide-react'
import { apiRequest } from '../../services/api.js'
import './BidderProfile.css'

const languageNames = { en: 'English', om: 'Afaan Oromoo', am: 'አማርኛ' }
const displayDate = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(new Date(value)) : '—'

export default function BidderProfile() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [formKey, setFormKey] = useState(0)

  useEffect(() => {
    apiRequest('/auth/me').then((result) => setProfile(result.profile)).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (profile && window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [profile])

  async function saveProfile(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    const values = Object.fromEntries(new FormData(event.currentTarget).entries())
    try {
      const result = await apiRequest('/auth/me', { method: 'PUT', body: JSON.stringify(values) })
      setProfile(result.profile)
      setFormKey((key) => key + 1)
      window.localStorage.setItem('addis-chereta-language', languageNames[result.profile.preferredLanguage] || 'English')
      const storedUser = JSON.parse(window.localStorage.getItem('addis-chereta-user') || '{}')
      window.localStorage.setItem('addis-chereta-user', JSON.stringify({ ...storedUser, firstName: result.profile.firstName, lastName: result.profile.lastName, legalName: result.profile.legalName, email: result.profile.email, username: result.profile.username, preferredLanguage: result.profile.preferredLanguage }))
      setMessage('Your profile has been updated.')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteAccount(event) {
    event.preventDefault()
    if (!window.confirm('Permanently delete your account and submitted bids? This cannot be undone.')) return
    setDeleting(true)
    setError('')
    try {
      await apiRequest('/auth/me', { method: 'DELETE', body: JSON.stringify({ password: deletePassword }) })
      window.localStorage.removeItem('addis-chereta-token')
      window.localStorage.removeItem('addis-chereta-user')
      navigate('/', { replace: true })
    } catch (deleteError) {
      setError(deleteError.message)
      setDeleting(false)
    }
  }

  async function changePassword(event) {
    event.preventDefault()
    const form = event.currentTarget
    setPasswordSaving(true)
    setPasswordError('')
    setPasswordMessage('')
    const values = Object.fromEntries(new FormData(event.currentTarget).entries())
    try {
      const result = await apiRequest('/auth/me/password', { method: 'PUT', body: JSON.stringify(values) })
      form.reset()
      setPasswordMessage(result.message)
    } catch (passwordRequestError) {
      setPasswordError(passwordRequestError.message)
    } finally {
      setPasswordSaving(false)
    }
  }

  return <main className="bidder-profile-page">
    <header className="bidder-profile-topbar"><Link to="/" className="bidder-profile-back"><ArrowLeft size={16} /> Home</Link><Link to="/" className="bidder-profile-brand"><span>✳</span> ADDIS CHERETA</Link></header>
    <section className="bidder-profile-content">
      <div className="bidder-profile-heading"><span>MY ACCOUNT</span><h1>My Profile</h1><p>Edit your bidder account information and privacy settings.</p></div>
      {loading ? <div className="bidder-profile-loading">Loading your profile…</div> : !profile ? <div className="bidder-profile-alert bidder-profile-error" role="alert">{error || 'Could not load your profile.'}</div> : <>
        <section className="bidder-profile-summary"><span className="bidder-profile-avatar"><UserRound size={28} /></span><div><h2>{profile.firstName} {profile.lastName}</h2><p>@{profile.username} · Bidder</p><span><ShieldCheck size={13} /> Private to your account</span></div><small>Member since {displayDate(profile.createdAt)}</small></section>
        <form className="bidder-profile-form" onSubmit={saveProfile} key={formKey}>
          <section className="bidder-profile-panel">
            <div className="bidder-profile-panel-heading"><span><UserRound size={17} /></span><div><h2>Personal information</h2><p>Only you can view and edit these account details.</p></div></div>
            <div className="bidder-profile-fields">
              <label><span>First name</span><input name="firstName" defaultValue={profile.firstName} required maxLength={80} autoComplete="given-name" /></label>
              <label><span>Last name</span><input name="lastName" defaultValue={profile.lastName} required maxLength={80} autoComplete="family-name" /></label>
              <label className="bidder-profile-wide"><span>Legal or business name</span><input name="legalName" defaultValue={profile.legalName} required maxLength={180} autoComplete="organization" /></label>
              <label><span>Email address</span><input name="email" type="email" defaultValue={profile.email} required maxLength={254} autoComplete="email" /></label>
              <label><span>Phone number</span><input name="phone" type="tel" defaultValue={profile.phone} required maxLength={30} autoComplete="tel" /></label>
              <label><span>Username</span><input name="username" defaultValue={profile.username} required minLength={3} maxLength={50} pattern="[A-Za-z0-9._-]+" autoComplete="username" /></label>
              <label><span>Gender</span><select name="gender" defaultValue={profile.gender} required><option value="male">Male</option><option value="female">Female</option><option value="prefer_not_to_say">Prefer not to say</option></select></label>
              <label><span>Preferred language</span><select name="preferredLanguage" defaultValue={profile.preferredLanguage}><option value="en">English</option><option value="om">Afaan Oromoo</option><option value="am">አማርኛ</option></select></label>
            </div>
            {error && <p className="bidder-profile-alert bidder-profile-error" role="alert">{error}</p>}
            {message && <p className="bidder-profile-alert bidder-profile-success" role="status"><CheckCircle2 size={15} /> {message}</p>}
            <div className="bidder-profile-save"><span><LockKeyhole size={14} /> Your profile is private.</span><button type="submit" disabled={saving}><Save size={15} /> {saving ? 'Saving…' : 'Save changes'}</button></div>
          </section>
        </form>
        <form className="bidder-profile-panel bidder-password-panel" id="account-settings" onSubmit={changePassword}>
          <div className="bidder-profile-panel-heading"><span><LockKeyhole size={17} /></span><div><h2>Change password</h2><p>Confirm your current password to set a new one.</p></div></div>
          <div className="bidder-profile-fields"><label><span>Current password</span><input name="currentPassword" type="password" autoComplete="current-password" required /></label><label><span>New password</span><input name="newPassword" type="password" autoComplete="new-password" minLength={6} maxLength={72} required /></label></div>
          {passwordError && <p className="bidder-profile-alert bidder-profile-error" role="alert">{passwordError}</p>}
          {passwordMessage && <p className="bidder-profile-alert bidder-profile-success" role="status"><CheckCircle2 size={15} /> {passwordMessage}</p>}
          <div className="bidder-profile-save"><span>Use at least 6 characters.</span><button type="submit" disabled={passwordSaving}><Save size={15} /> {passwordSaving ? 'Updating…' : 'Update password'}</button></div>
        </form>
        <section className="bidder-profile-panel bidder-delete-panel" id="delete-account">
          <div className="bidder-profile-panel-heading"><span><Trash2 size={17} /></span><div><h2>Delete account</h2><p>Deleting your account permanently removes your profile and submitted bids.</p></div></div>
          <form className="bidder-delete-form" onSubmit={deleteAccount}><label><span>Confirm with your password</span><input type="password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} autoComplete="current-password" required /></label><button type="submit" disabled={deleting}>{deleting ? 'Deleting…' : 'Delete my account'}</button></form>
        </section>
      </>}
    </section>
  </main>
}
