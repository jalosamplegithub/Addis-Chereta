import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Users, UserCheck, RefreshCw, Pencil, Trash2, X, ChevronDown, Plus, UserRound, Gavel, ShieldCheck, LogOut, Clock3, ImagePlus, BriefcaseBusiness, LayoutDashboard, Settings } from 'lucide-react'
import { apiRequest } from '../../services/api.js'
import './Dashboard.css'
import './DashboardRoles.css'
import './DashboardAccount.css'
import './DashboardAccountMenu.css'
import './DashboardTenders.css'

const apiOrigin = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')

const roles = [
  ['bidder', 'Bidder'],
  ['procurement', 'Procurement Officer'],
  ['finance', 'Finance Officer'],
  ['evaluator', 'Evaluator'],
  ['auditor', 'Auditor'],
  ['admin', 'System Administrator'],
]
const roleNames = Object.fromEntries(roles)
const emptyCounts = { total: 0, active: 0, roles: {} }
const emptyForm = { firstName: '', lastName: '', legalName: '', email: '', phone: '', username: '', role: 'bidder' }
const emptyNewForm = { ...emptyForm, gender: 'prefer_not_to_say', password: '', preferredLanguage: 'en', organizationName: '' }

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [tenders, setTenders] = useState([])
  const [tenderCounts, setTenderCounts] = useState({ total: 0, withBids: 0, withoutBids: 0 })
  const [tenderFilter, setTenderFilter] = useState('all')
  const [tenderLoading, setTenderLoading] = useState(true)
  const [tenderError, setTenderError] = useState('')
  const [showTenderActivity, setShowTenderActivity] = useState(false)
  const [tenderClockNow, setTenderClockNow] = useState(Date.now())
  const [counts, setCounts] = useState(emptyCounts)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [newAccountOpen, setNewAccountOpen] = useState(false)
  const [newForm, setNewForm] = useState(emptyNewForm)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(window.localStorage.getItem('addis-chereta-user') || 'null') } catch { return null }
  })

  async function loadUsers() {
    setError('')
    try {
      const result = await apiRequest('/admin/users')
      setUsers(result.users || [])
      setCounts(result.counts || emptyCounts)
    } catch (loadError) { setError(loadError.message) } finally { setLoading(false) }
  }

  const loadTenders = useCallback(async () => {
    setTenderError('')
    try {
      const result = await apiRequest('/admin/tenders')
      setTenders(result.tenders || [])
      setTenderCounts(result.counts || { total: 0, withBids: 0, withoutBids: 0 })
    } catch (loadError) { setTenderError(loadError.message) } finally { setTenderLoading(false) }
  }, [])

  useEffect(() => { loadUsers() }, [])

  useEffect(() => {
    if (!showTenderActivity) return undefined
    loadTenders()
    const timer = window.setInterval(() => setTenderClockNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [showTenderActivity, loadTenders])

  const filteredUsers = users.filter((user) => {
    const text = `${user.first_name} ${user.last_name} ${user.legal_name} ${user.email} ${user.username}`.toLowerCase()
    return (roleFilter === 'all' || user.role === roleFilter) && text.includes(search.trim().toLowerCase())
  })
  const filteredTenders = tenders.filter((tender) => tenderFilter === 'all' || (tenderFilter === 'with-bids' ? tender.hasBids : !tender.hasBids))

  function startEditing(user) {
    setEditing(user.id)
    setForm({ firstName: user.first_name, lastName: user.last_name, legalName: user.legal_name, email: user.email, phone: user.phone, username: user.username, role: user.role })
    setError('')
  }

  async function saveUser(event) {
    event.preventDefault()
    setSaving(true); setError(''); setNotice('')
    try {
      const result = await apiRequest(`/admin/users/${editing}`, { method: 'PATCH', body: JSON.stringify(form) })
      if (String(editing) === String(currentUser?.id)) {
        const updatedCurrentUser = { ...currentUser, firstName: result.user.first_name, lastName: result.user.last_name, legalName: result.user.legal_name, email: result.user.email, username: result.user.username }
        window.localStorage.setItem('addis-chereta-user', JSON.stringify(updatedCurrentUser))
        setCurrentUser(updatedCurrentUser)
      }
      setEditing(null)
      await loadUsers()
      setNotice(result.message || 'Account updated successfully.')
    } catch (saveError) { setError(saveError.message) } finally { setSaving(false) }
  }

  async function createAccount(event) {
    event.preventDefault()
    setSaving(true); setError(''); setNotice('')
    try {
      await apiRequest('/admin/users', { method: 'POST', body: JSON.stringify(newForm) })
      setNewAccountOpen(false)
      setNewForm(emptyNewForm)
      setNotice('The account was created successfully.')
      await loadUsers()
    } catch (createError) { setError(createError.message) } finally { setSaving(false) }
  }

  function openMyProfile() {
    const account = users.find((user) => String(user.id) === String(currentUser?.id))
    setAccountMenuOpen(false)
    if (account) startEditing(account)
    else setError('Your administrator profile could not be found in the account list. Refresh and try again.')
  }

  function scrollTo(id) {
    setAccountMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function openTenderActivity() {
    setAccountMenuOpen(false)
    setShowTenderActivity(true)
    window.setTimeout(() => document.getElementById('admin-tenders')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  async function toggleAccount(user) {
    if (user.is_active && !window.confirm(`Deactivate ${user.username}'s account? Their sign-in will be disabled, and their bids and procurement history will be kept.`)) return
    setError(''); setNotice('')
    try {
      const result = await apiRequest(`/admin/users/${user.id}${user.is_active ? '' : '/activate'}`, { method: user.is_active ? 'DELETE' : 'PATCH' })
      await loadUsers()
      setNotice(result.message || (user.is_active ? 'Account deactivated successfully.' : 'Account reactivated successfully.'))
    } catch (actionError) { setError(actionError.message) }
  }

  function logout() {
    window.localStorage.removeItem('addis-chereta-token')
    window.localStorage.removeItem('addis-chereta-user')
    navigate('/')
  }

  return (
    <main className="admin-workspace">
      <header className="admin-topbar"><Link to="/"><ArrowLeft size={15} /> Back to Homepage</Link><div className="admin-account-menu"><button className="admin-account-trigger" onClick={() => setAccountMenuOpen(!accountMenuOpen)} aria-expanded={accountMenuOpen}><span className="admin-avatar"><UserRound size={18} /></span><span>Hello, {currentUser?.firstName || currentUser?.username || 'Administrator'}</span><ChevronDown size={16} /></button>{accountMenuOpen && <nav className="admin-account-dropdown"><div className="admin-dropdown-header"><span className="admin-avatar"><UserRound size={20} /></span><span><b>{currentUser?.firstName || 'System'} {currentUser?.lastName || 'Administrator'}</b><small>System Administrator</small></span></div><div className="admin-menu-group"><p>MY ACCOUNT</p><button onClick={openMyProfile}><UserRound size={16} /><span>My Profile</span></button><div className="admin-menu-role"><BriefcaseBusiness size={16} /><span>Role: System Administrator</span></div><button onClick={openMyProfile}><Settings size={16} /><span>Account Settings</span></button></div><div className="admin-menu-group"><p>ADMIN WORKSPACE</p><button onClick={() => scrollTo('admin-top')}><LayoutDashboard size={16} /><span>Admin Dashboard</span></button><button onClick={() => scrollTo('admin-accounts')}><Users size={16} /><span>Manage Accounts</span></button><button onClick={() => scrollTo('admin-roles')}><ShieldCheck size={16} /><span>Roles &amp; Permissions</span></button><button onClick={openTenderActivity}><Gavel size={16} /><span>Tender &amp; Bid Activity</span></button></div><div className="admin-menu-logout"><button onClick={logout}><LogOut size={16} /><span>Logout</span></button></div></nav>}</div></header>
      <section className="admin-content" id="admin-top">
        <p className="admin-eyebrow">SYSTEM CONTROL</p>
        <h1>Administrator dashboard</h1>
        <div className="admin-intro-row"><p className="admin-intro">Manage accounts, assign participant roles, and monitor account status.</p><button type="button" className="admin-open-tenders" onClick={() => showTenderActivity ? setShowTenderActivity(false) : openTenderActivity()}><Gavel size={15} /> {showTenderActivity ? 'Hide Tender Activity' : 'Tender & Bid Activity'}</button></div>

        <div className="admin-stat-grid">
          <article><span className="admin-stat-icon"><Users size={18} /></span><div><small>All accounts</small><strong>{counts.total}</strong></div></article>
          <article><span className="admin-stat-icon green"><UserCheck size={18} /></span><div><small>Active accounts</small><strong>{counts.active}</strong></div></article>
        </div>

        <section id="admin-roles" className="admin-role-note admin-role-picker" aria-label="Accounts by role"><div className="admin-role-picker-heading"><div><h2>Accounts by role</h2><p>Select a role to view those accounts.</p></div><button type="button" onClick={() => setRoleFilter('all')} className={roleFilter === 'all' ? 'selected' : ''}>All accounts <b>{counts.total}</b></button></div><div className="admin-role-grid">{roles.map(([key, label]) => <button type="button" key={key} onClick={() => setRoleFilter(key)} className={roleFilter === key ? 'selected' : ''}><span>{label}</span><b>{counts.roles[key] || 0}</b><small>View {label.toLowerCase()} accounts</small></button>)}</div></section>

        {showTenderActivity && <section className="admin-tender-section" id="admin-tenders">
          <div className="admin-section-heading"><div><h2>Tender &amp; bid activity</h2><p>See which tenders have bids and which have received none.</p></div><button className="admin-refresh" onClick={loadTenders} aria-label="Refresh tenders"><RefreshCw size={15} /> Refresh</button></div>
          <div className="admin-tender-summary"><button className={tenderFilter === 'all' ? 'selected' : ''} onClick={() => setTenderFilter('all')}><span>All tenders</span><b>{tenderCounts.total}</b></button><button className={tenderFilter === 'with-bids' ? 'selected' : ''} onClick={() => setTenderFilter('with-bids')}><span>With bids</span><b>{tenderCounts.withBids}</b></button><button className={tenderFilter === 'without-bids' ? 'selected' : ''} onClick={() => setTenderFilter('without-bids')}><span>No bids yet</span><b>{tenderCounts.withoutBids}</b></button></div>
          {tenderError && <div className="admin-error" role="alert">{tenderError}</div>}
          <section className="admin-user-panel admin-tender-panel">
            {tenderLoading ? <div className="admin-empty">Loading tenders…</div> : filteredTenders.length === 0 ? <div className="admin-empty">No tenders in this category.</div> : <div className="admin-table-wrap"><table className="admin-table admin-tender-table"><thead><tr><th>Tender</th><th>Procurement account</th><th>Listing status</th><th>Countdown</th><th>Bid activity</th><th>Bidder participation</th></tr></thead><tbody>{filteredTenders.map((tender) => { const startsAt = new Date(tender.starts_at).getTime(); const endsAt = new Date(tender.ends_at).getTime(); const active = tender.status === 'published' && tenderClockNow >= startsAt && tenderClockNow < endsAt; const upcoming = tender.status === 'published' && tenderClockNow < startsAt; const remaining = Math.max(0, Math.floor(((upcoming ? startsAt : endsAt) - tenderClockNow) / 1000)); const days = Math.floor(remaining / 86400); const hours = Math.floor((remaining % 86400) / 3600); const minutes = Math.floor((remaining % 3600) / 60); const seconds = remaining % 60; const countdown = tender.status === 'closed' || tender.status === 'cancelled' || tenderClockNow >= endsAt ? 'Auction ended' : tender.status !== 'published' ? 'Not public' : `${upcoming ? 'Starts in ' : ''}${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s${active ? ' remaining' : ''}`; return <tr key={tender.id}><td><div className="admin-tender-summary-cell">{tender.photo_path ? <img src={`${apiOrigin}${tender.photo_path}`} alt={tender.title} /> : <span className="admin-tender-photo-placeholder"><ImagePlus size={17} /></span>}<div><b>{tender.title}</b><small>Lot {tender.lot_number} · {tender.vehicle_type}</small></div></div></td><td><b>{tender.organization_name}</b><small>@{tender.procurement_username}</small></td><td><span className={`admin-status tender-status-${tender.status}`}>{tender.status}</span></td><td><span className={`admin-tender-countdown ${active ? 'is-counting' : ''}`}><Clock3 size={12} />{countdown}</span></td><td><span className={`admin-bid-state ${tender.hasBids ? 'has-bids' : 'no-bids'}`}><Gavel size={13} />{tender.hasBids ? `${tender.bid_count} bid${tender.bid_count === 1 ? '' : 's'} received` : 'No bids yet'}</span></td><td>{tender.participants?.length ? <div className="admin-bidder-list">{tender.participants.map((participant) => <span key={`${tender.id}-${participant.username}`}><b>{participant.username}<em className={participant.hasBid ? 'participant-bid' : 'participant-no-bid'}>{participant.hasBid ? 'Bid submitted' : 'No bid'}</em></b><small>{participant.email}{participant.isActive ? '' : ' · inactive account'}</small></span>)}</div> : <span className="admin-muted">No bidder accounts</span>}</td></tr>})}</tbody></table></div>}
            <footer className="admin-table-footer">Showing {filteredTenders.length} of {tenders.length} tenders</footer>
          </section>
        </section>}

        <div className="admin-section-heading" id="admin-accounts"><div><h2>{roleFilter === 'all' ? 'All accounts' : `${roleNames[roleFilter]} accounts`}</h2><p>Update account details, assign a role, or deactivate access.</p></div><div className="admin-heading-actions"><button className="admin-create-button" onClick={() => { setError(''); setNewForm(emptyNewForm); setNewAccountOpen(true) }}><Plus size={15} /> Register Account</button><button className="admin-refresh" onClick={loadUsers} aria-label="Refresh accounts"><RefreshCw size={15} /> Refresh</button></div></div>
        {notice && <div className="admin-success" role="status">{notice}</div>}
        {error && <div className="admin-error" role="alert">{error}</div>}
        <section className="admin-user-panel">
          <div className="admin-filters">
            <label className="admin-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, username, or email" /></label>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} aria-label="Filter by role"><option value="all">All roles</option>{roles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          </div>
          {loading ? <div className="admin-empty">Loading accounts…</div> : filteredUsers.length === 0 ? <div className="admin-empty">No accounts match this search.</div> : (
            <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Account</th><th>Contact</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>
              {filteredUsers.map((user) => <tr key={user.id}>
                <td><b>{user.first_name} {user.last_name}</b><small>@{user.username}</small></td>
                <td><span>{user.email}</span><small>{user.phone}</small></td>
                <td><span className={`admin-role role-${user.role}`}>{roleNames[user.role] || user.role}</span></td>
                <td><span className={`admin-status ${user.is_active ? 'is-active' : ''}`}>{user.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td><div className="admin-actions"><button onClick={() => startEditing(user)} aria-label={`Edit ${user.username}`} title="Edit account"><Pencil size={15} /></button><button className={user.is_active ? 'deactivate' : 'activate'} onClick={() => toggleAccount(user)} disabled={String(user.id) === String(currentUser?.id)} aria-label={`${user.is_active ? 'Deactivate' : 'Reactivate'} ${user.username}`} title={user.is_active ? 'Deactivate account' : 'Reactivate account'}>{user.is_active ? <Trash2 size={15} /> : <RefreshCw size={15} />}</button></div></td>
              </tr>)}
            </tbody></table></div>
          )}
          <footer className="admin-table-footer">Showing {filteredUsers.length} of {users.length} accounts</footer>
        </section>
      </section>

      {editing !== null && <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(null) }}><section className="admin-edit-modal" role="dialog" aria-modal="true" aria-labelledby="admin-edit-title"><header><div><small>ACCOUNT MANAGEMENT</small><h2 id="admin-edit-title">Edit user account</h2></div><button type="button" onClick={() => setEditing(null)} aria-label="Close"><X size={19} /></button></header><form onSubmit={saveUser}><div className="admin-edit-grid">{[['firstName','First name'],['lastName','Last name'],['legalName','Organization / legal name'],['email','Email'],['phone','Phone'],['username','Username']].map(([key,label]) => <label key={key}><span>{label}</span><input value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} required maxLength={key === 'legalName' ? 180 : key === 'email' ? 254 : key === 'phone' ? 30 : key === 'username' ? 50 : 80} /></label>)}<label className="admin-role-select"><span>Assign role</span><select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>{roles.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label></div><footer><button type="button" className="admin-cancel" onClick={() => setEditing(null)}>Cancel</button><button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save account'}</button></footer></form></section></div>}
      {newAccountOpen && <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setNewAccountOpen(false) }}><section className="admin-edit-modal admin-create-modal" role="dialog" aria-modal="true" aria-labelledby="admin-create-title"><header><div><small>ACCOUNT MANAGEMENT</small><h2 id="admin-create-title">Register an account</h2></div><button type="button" onClick={() => setNewAccountOpen(false)} aria-label="Close"><X size={19} /></button></header><form onSubmit={createAccount}><div className="admin-edit-grid">{[['firstName','First name'],['lastName','Last name'],['legalName','Organization / legal name'],['email','Email'],['phone','Phone'],['username','Username']].map(([key,label]) => <label key={key}><span>{label}</span><input value={newForm[key]} onChange={(event) => setNewForm({ ...newForm, [key]: event.target.value })} required maxLength={key === 'legalName' ? 180 : key === 'email' ? 254 : key === 'phone' ? 30 : key === 'username' ? 50 : 80} /></label>)}<label><span>Initial password</span><input type="password" autoComplete="new-password" minLength={6} maxLength={72} value={newForm.password} onChange={(event) => setNewForm({ ...newForm, password: event.target.value })} required /></label><label><span>Gender</span><select value={newForm.gender} onChange={(event) => setNewForm({ ...newForm, gender: event.target.value })}><option value="prefer_not_to_say">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option></select></label><label><span>Preferred language</span><select value={newForm.preferredLanguage} onChange={(event) => setNewForm({ ...newForm, preferredLanguage: event.target.value })}><option value="en">English</option><option value="am">Amharic</option><option value="om">Afaan Oromoo</option></select></label><label><span>Account role</span><select value={newForm.role} onChange={(event) => setNewForm({ ...newForm, role: event.target.value })}>{roles.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>{newForm.role === 'procurement' && <label className="admin-role-select"><span>Organization name</span><input value={newForm.organizationName} onChange={(event) => setNewForm({ ...newForm, organizationName: event.target.value })} maxLength={180} placeholder="Defaults to the legal name" /></label>}</div>{error && <div className="admin-error admin-modal-error" role="alert">{error}</div>}<footer><button type="button" className="admin-cancel" onClick={() => setNewAccountOpen(false)}>Cancel</button><button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create account'}</button></footer></form></section></div>}
    </main>
  )
}
