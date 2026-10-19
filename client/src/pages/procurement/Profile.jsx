import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../../services/api.js'
import { ArrowLeft, Building2, Camera, CheckCircle2, LockKeyhole, Save, UserRound } from 'lucide-react'
import './Profile.css'

const apiOrigin = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')
const languageNames = { en: 'English', om: 'Afaan Oromoo', am: 'አማርኛ' }
const displayDate = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(new Date(value)) : '—'

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [formKey, setFormKey] = useState(0)
  const [photoPreview, setPhotoPreview] = useState('')

  useEffect(() => () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
  }, [photoPreview])

  useEffect(() => {
    apiRequest('/procurement/profile').then((result) => setProfile(result.profile)).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false))
  }, [])

  async function saveProfile(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    const data = new FormData(event.currentTarget)
    try {
      const result = await apiRequest('/procurement/profile', { method: 'PUT', body: data })
      setProfile(result.profile)
      setPhotoPreview('')
      setFormKey((key) => key + 1)
      window.localStorage.setItem('addis-chereta-language', languageNames[result.profile.preferredLanguage] || 'English')
      const storedUser = JSON.parse(window.localStorage.getItem('addis-chereta-user') || '{}')
      window.localStorage.setItem('addis-chereta-user', JSON.stringify({ ...storedUser, firstName: result.profile.firstName, lastName: result.profile.lastName, legalName: result.profile.legalName, email: result.profile.email, username: result.profile.username, preferredLanguage: result.profile.preferredLanguage }))
      setMessage('Profile updated successfully.')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  return <main className="procurement-profile-page">
    <header className="procurement-profile-topbar"><Link to="/procurement/dashboard" className="procurement-profile-back"><ArrowLeft size={16} /> Dashboard</Link><Link to="/" className="procurement-profile-brand"><span>✳</span> ADDIS CHERETA</Link></header>
    <section className="procurement-profile-content">
      <div className="procurement-profile-heading"><span>PROCUREMENT WORKSPACE</span><h1>Profile & settings</h1><p>View and update your personal information, organization details, and account preferences.</p></div>
      {loading ? <div className="procurement-profile-loading">Loading your profile…</div> : error && !profile ? <div className="procurement-profile-alert profile-error" role="alert">{error}</div> : profile && <>
        <section className="procurement-profile-summary">
          <div className="profile-identity"><span className="profile-avatar-large">{profile.profilePhotoUrl ? <img src={`${apiOrigin}${profile.profilePhotoUrl}`} alt={`${profile.firstName} ${profile.lastName}`} /> : <UserRound size={34} />}</span><div><h2>{profile.firstName} {profile.lastName}</h2><p>{profile.jobTitle || 'Procurement Officer'} · {profile.organizationName}</p><span className="profile-role-pill">{profile.role}</span></div></div>
          <div className="profile-summary-meta"><span>Username<b>{profile.username}</b></span><span>Member since<b>{displayDate(profile.createdAt)}</b></span></div>
        </section>

        <form className="procurement-profile-form" onSubmit={saveProfile} key={formKey}>
          <section className="profile-form-section">
            <div className="profile-section-heading"><span><UserRound size={17} /></span><div><h2>Personal information</h2><p>These details are used for your procurement account.</p></div></div>
            <div className="profile-fields-grid">
              <label><span>First name</span><input name="firstName" defaultValue={profile.firstName} required maxLength={80} /></label>
              <label><span>Last name</span><input name="lastName" defaultValue={profile.lastName} required maxLength={80} /></label>
              <label className="profile-field-wide"><span>Legal name</span><input name="legalName" defaultValue={profile.legalName} required maxLength={180} /></label>
              <label><span>Email address</span><input name="email" type="email" defaultValue={profile.email} required maxLength={254} /></label>
              <label><span>Phone number</span><input name="phone" type="tel" defaultValue={profile.phone} required maxLength={30} /></label>
              <label><span>Username</span><input name="username" defaultValue={profile.username} required minLength={3} maxLength={50} pattern="[A-Za-z0-9._-]+" /></label>
              <label><span>Gender</span><select name="gender" defaultValue={profile.gender} required><option value="male">Male</option><option value="female">Female</option><option value="prefer_not_to_say">Prefer not to say</option></select></label>
              <label><span>Preferred language</span><select name="preferredLanguage" defaultValue={profile.preferredLanguage}><option value="en">English</option><option value="om">Afaan Oromoo</option><option value="am">አማርኛ</option></select></label>
            </div>
          </section>

          <section className="profile-form-section">
            <div className="profile-section-heading"><span><Building2 size={17} /></span><div><h2>Procurement organization</h2><p>Institution and department shown in your procurement workspace.</p></div></div>
            <div className="profile-fields-grid">
              <label><span>Organization name</span><input name="organizationName" defaultValue={profile.organizationName} required maxLength={180} /></label>
              <label><span>Department</span><input name="department" defaultValue={profile.department} maxLength={180} /></label>
              <label><span>Job title</span><input name="jobTitle" defaultValue={profile.jobTitle} maxLength={120} /></label>
            </div>
          </section>

          <section className="profile-form-section">
            <div className="profile-section-heading"><span><Camera size={17} /></span><div><h2>Profile photo</h2><p>Choose a JPG, PNG, or WebP image up to 10 MB.</p></div></div>
            <label className="profile-photo-picker"><span className="profile-photo-current">{photoPreview || profile.profilePhotoUrl ? <img src={photoPreview || `${apiOrigin}${profile.profilePhotoUrl}`} alt="Profile photo preview" /> : <UserRound size={24} />}</span><span><b>Choose photo</b><small>Image is cropped to fit the circular profile frame. Uploading replaces your current photo.</small></span><input name="profilePhoto" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; setPhotoPreview(file ? URL.createObjectURL(file) : '') }} /></label>
          </section>

          <section className="profile-form-section" id="account-settings">
            <div className="profile-section-heading"><span><LockKeyhole size={17} /></span><div><h2>Change password</h2><p>Leave these fields blank to keep your current password.</p></div></div>
            <div className="profile-fields-grid"><label><span>Current password</span><input name="currentPassword" type="password" autoComplete="current-password" /></label><label><span>New password</span><input name="newPassword" type="password" autoComplete="new-password" minLength={6} maxLength={72} /></label></div>
          </section>
          {error && <p className="procurement-profile-alert profile-error" role="alert">{error}</p>}{message && <p className="procurement-profile-alert profile-success" role="status"><CheckCircle2 size={16} /> {message}</p>}
          <div className="profile-save-row"><span>Account role: <b>{profile.role}</b></span><button type="submit" disabled={saving}><Save size={16} /> {saving ? 'Saving…' : 'Save profile changes'}</button></div>
        </form>
      </>}
    </section>
  </main>
}
