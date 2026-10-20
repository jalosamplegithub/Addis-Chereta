import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { apiRequest } from '../../services/api.js'
import { ArrowLeft, BriefcaseBusiness, CalendarDays, ChevronDown, ClipboardList, Eye, EyeOff, FileText, Gavel, ImagePlus, LayoutDashboard, LogOut, Pencil, Plus, Settings, Trash2, UserRound, X, Clock3, RefreshCw } from 'lucide-react'
import './Dashboard.css'
import './DashboardActivity.css'

const apiOrigin = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')
const money = (value) => new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 2 }).format(Number(value || 0))
const toLocalInput = (value) => {
  const date = value ? new Date(value) : new Date(Date.now() + 60 * 60 * 1000)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}
const dateText = (value) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
const countdownText = (target, now) => {
  const seconds = Math.max(0, Math.floor((new Date(target).getTime() - now) / 1000))
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = seconds % 60
  return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(remainder).padStart(2, '0')}s`
}

export default function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const isPublicPage = location.pathname === '/procurement/public-auctions'
  const isActivityPage = location.pathname === '/procurement/activity'
  const user = JSON.parse(window.localStorage.getItem('addis-chereta-user') || '{}')
  const [items, setItems] = useState([])
  const [activityItems, setActivityItems] = useState([])
  const [activityLoading, setActivityLoading] = useState(true)
  const [activityError, setActivityError] = useState('')
  const [clockNow, setClockNow] = useState(Date.now())
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [profile, setProfile] = useState(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [visibilityId, setVisibilityId] = useState(null)
  const displayedItems = isPublicPage ? items.filter((item) => item.status === 'published') : items

  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const result = await apiRequest('/procurement/auctions')
      setItems(result.items)
      setError('')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadActivity = useCallback(async () => {
    setActivityLoading(true)
    try {
      const result = await apiRequest('/procurement/activity')
      setActivityItems(result.items || [])
      setActivityError('')
    } catch (loadError) { setActivityError(loadError.message) } finally { setActivityLoading(false) }
  }, [])

  useEffect(() => {
    loadItems()
    apiRequest('/procurement/profile').then((result) => setProfile(result.profile)).catch(() => {})
  }, [loadItems])

  useEffect(() => {
    if (!isActivityPage) return
    loadActivity()
    const timer = window.setInterval(() => setClockNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [isActivityPage, loadActivity])

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    const form = new FormData(event.currentTarget)
    const initialPrice = Number(form.get('initialPrice'))
    const maximumPrice = Number(form.get('maximumPrice'))
    if (!Number.isFinite(maximumPrice) || maximumPrice < initialPrice) {
      setError('Maximum price must be equal to or greater than the initial price.')
      setSaving(false)
      return
    }
    for (const field of ['startsAt', 'endsAt']) {
      const localDate = form.get(field)
      if (localDate) form.set(field, new Date(localDate).toISOString())
    }
    try {
      await apiRequest(editing ? `/procurement/auctions/${editing.id}` : '/procurement/auctions', {
        method: editing ? 'PUT' : 'POST',
        body: form,
      })
      setEditing(null)
      setNotice(editing ? 'Auction item updated.' : 'Auction item saved.')
      await loadItems()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteItem(item) {
    if (!window.confirm(`Delete “${item.title}” (lot ${item.lotNumber})? This also removes its uploaded files.`)) return
    setError('')
    setNotice('')
    try {
      await apiRequest(`/procurement/auctions/${item.id}`, { method: 'DELETE' })
      setNotice('Auction item deleted.')
      await loadItems()
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  async function toggleVisibility(item) {
    const isPublic = item.status !== 'published'
    setVisibilityId(item.id)
    setError('')
    setNotice('')
    try {
      const result = await apiRequest(`/procurement/auctions/${item.id}/public`, { method: 'PATCH', body: JSON.stringify({ isPublic }) })
      setNotice(result.message)
      await loadItems()
      if (isPublic) navigate('/procurement/public-auctions')
    } catch (visibilityError) {
      setError(visibilityError.message)
    } finally {
      setVisibilityId(null)
    }
  }

  function signOut() {
    window.localStorage.removeItem('addis-chereta-token')
    window.localStorage.removeItem('addis-chereta-user')
    navigate('/')
  }

  return (
    <main className="procurement-page">
      <header className="procurement-header">
        <Link to="/" className="procurement-home-link" onClick={(event) => { event.preventDefault(); signOut() }}><ArrowLeft size={14} /> Back to homepage</Link>
        <Link to="/" className="procurement-brand"><span>✳</span><span><b>ADDIS CHERETA</b><small>PROCUREMENT WORKSPACE</small></span></Link>
        <div className="procurement-profile-menu-wrap"><button className="procurement-profile-menu-trigger" aria-expanded={profileMenuOpen} aria-label="Open procurement account menu" onClick={() => setProfileMenuOpen((open) => !open)}>{profile?.profilePhotoUrl ? <img src={`${apiOrigin}${profile.profilePhotoUrl}`} alt="" /> : <span className="procurement-profile-avatar"><UserRound size={17} /></span>}<span><b>{profile?.firstName || user.legalName || 'Procurement'}</b><small>Procurement Officer</small></span><ChevronDown size={15} /></button>{profileMenuOpen && <div className="procurement-profile-menu">
          <div className="procurement-menu-header">{profile?.profilePhotoUrl ? <img src={`${apiOrigin}${profile.profilePhotoUrl}`} alt="" /> : <span className="procurement-profile-avatar"><UserRound size={17} /></span>}<span><b>{profile?.firstName} {profile?.lastName}</b><small>Procurement Officer</small></span></div>
          <div className="procurement-menu-group"><p>MY ACCOUNT</p><Link to="/procurement/profile" onClick={() => setProfileMenuOpen(false)}><UserRound size={16} /><span>My Profile</span></Link><div className="procurement-menu-role"><BriefcaseBusiness size={16} /><span>Role: Procurement Officer</span></div><Link to="/procurement/profile#account-settings" onClick={() => setProfileMenuOpen(false)}><Settings size={16} /><span>Account Settings</span></Link></div>
          <div className="procurement-menu-group"><p>PROCUREMENT WORKSPACE</p><Link to="/procurement/dashboard" onClick={() => setProfileMenuOpen(false)}><LayoutDashboard size={16} /><span>Procurement Dashboard</span></Link><Link to="/procurement/dashboard#auction-items" onClick={() => setProfileMenuOpen(false)}><Gavel size={16} /><span>Manage Auctions</span></Link><Link to="/procurement/activity" onClick={() => setProfileMenuOpen(false)}><Clock3 size={16} /><span>Bidder Activity</span></Link><Link to="/procurement/documents" onClick={() => setProfileMenuOpen(false)}><FileText size={16} /><span>Auction Documents</span></Link><Link to="/procurement/tasks" onClick={() => setProfileMenuOpen(false)}><ClipboardList size={16} /><span>Procurement Tasks</span></Link></div>
          <div className="procurement-menu-group"><p>PUBLIC LISTINGS</p><Link to="/procurement/public-auctions" onClick={() => setProfileMenuOpen(false)}><Eye size={16} /><span>Public Auctions</span></Link></div>
          <div className="procurement-menu-logout"><button onClick={signOut}><LogOut size={16} /> Logout</button></div>
        </div>}</div>
      </header>

      <section className="procurement-content">
        <div className="procurement-page-heading"><div><span className="procurement-eyebrow">PROCUREMENT</span><h1>{isActivityPage ? 'Bidder activity' : isPublicPage ? 'Public auctions' : 'Auction dashboard'}</h1><p>{isActivityPage ? 'Follow your auction items, remaining time, and bidder participation.' : isPublicPage ? 'Review and unpublish auctions currently visible to bidders.' : 'Create auction notices, upload item photos and documents, and manage your listings.'}</p></div><div className="procurement-heading-links">{isActivityPage ? <Link className="procurement-public-link" to="/procurement/dashboard">Back to dashboard</Link> : <><Link className="procurement-public-link" to="/procurement/activity"><Clock3 size={13} /> Bid activity</Link><Link className="procurement-public-link" to="/procurement/public-auctions">Public auctions</Link></>}</div></div>
        {!isActivityPage && <div className="procurement-metrics"><div><span>All your auction items</span><b>{items.length}</b></div><div><span>Published</span><b>{items.filter((item) => item.status === 'published').length}</b></div><div><span>Drafts</span><b>{items.filter((item) => item.status === 'draft').length}</b></div></div>}

        {isActivityPage && <section className="procurement-activity-section"><div className="procurement-activity-heading"><div><span className="procurement-eyebrow">LIVE MONITOR</span><h2>Your auction activity</h2><p>Bid amounts remain sealed. This view shows who has submitted a bid.</p></div><button onClick={loadActivity}><RefreshCw size={14} /> Refresh</button></div>{activityError && <div className="procurement-notice procurement-error" role="alert">{activityError}</div>}{activityLoading ? <div className="procurement-empty">Loading bidder activity…</div> : activityItems.length === 0 ? <div className="procurement-empty"><Gavel size={24} /><b>No auction items yet</b><span>Create an item and publish it to begin tracking bidder activity.</span></div> : <div className="procurement-activity-grid">{activityItems.map((item) => { const now = clockNow; const starts = new Date(item.starts_at).getTime(); const ends = new Date(item.ends_at).getTime(); const phase = item.status === 'closed' || item.status === 'cancelled' || now >= ends ? 'ended' : item.status !== 'published' ? 'unpublished' : now < starts ? 'upcoming' : 'live'; const countdown = phase === 'ended' ? 'Auction ended' : phase === 'unpublished' ? 'Not public' : phase === 'upcoming' ? `Starts in ${countdownText(item.starts_at, now)}` : `${countdownText(item.ends_at, now)} remaining`; return <article className="procurement-activity-card" key={item.id}><div className="procurement-activity-item-head">{item.photo_path ? <img src={`${apiOrigin}${item.photo_path}`} alt={item.title} /> : <div className="procurement-activity-no-photo"><ImagePlus size={22} /></div>}<div><span className="procurement-item-intent">{item.listing_intent}</span><h3>{item.title}</h3><small>{item.vehicle_type} · Lot {item.lot_number}</small></div><span className={`procurement-status status-${item.status}`}>{item.status}</span></div><div className={`procurement-activity-countdown countdown-${phase}`}><Clock3 size={16} /><span>{countdown}</span></div><div className="procurement-activity-dates"><span>Starts {dateText(item.starts_at)}</span><span>Ends {dateText(item.ends_at)}</span></div><div className="procurement-activity-bidders"><div><b>{item.bidder_count}</b><span>bidder{item.bidder_count === 1 ? '' : 's'} participated</span></div>{item.bidders?.length ? <ul>{item.bidders.map((bidder) => <li key={`${item.id}-${bidder.username}`}><span><b>{bidder.username}</b><small>{bidder.email}</small></span><time>{dateText(bidder.submittedAt)}</time></li>)}</ul> : <p>No bids submitted yet.</p>}</div></article> })}</div>}</section>}

        {!isActivityPage && (!isPublicPage || editing) && <section className="procurement-form-card" aria-labelledby="auction-form-title">
          <div className="procurement-section-heading"><div><span className="procurement-icon"><Plus size={18} /></span><span><h2 id="auction-form-title">{editing ? 'Update auction item' : 'Create auction item'}</h2><small>Fields marked * are required</small></span></div>{editing && <button className="procurement-cancel-edit" type="button" onClick={() => setEditing(null)}><X size={15} /> Cancel edit</button>}</div>
          <form className="procurement-form" onSubmit={handleSubmit} key={editing?.id || 'new'}>
            <div className="procurement-form-grid">
              <label className="procurement-field procurement-span-two"><span>Listing label *</span><input name="listingIntent" defaultValue={editing?.listingIntent || 'TO BE SELL'} placeholder="e.g. TO BE SELL or ITEM TO BE BUY" required maxLength={180} /></label>
              <label className="procurement-field procurement-span-two"><span>Auction title *</span><input name="title" defaultValue={editing?.title || ''} placeholder="e.g. Toyota Hilux 2009 (01)" required maxLength={180} /></label>
              <label className="procurement-field"><span>Vehicle or item type *</span><input name="vehicleType" defaultValue={editing?.vehicleType || ''} placeholder="e.g. Toyota Hilux" required maxLength={100} /></label>
              <label className="procurement-field"><span>Lot number *</span><input name="lotNumber" defaultValue={editing?.lotNumber || ''} placeholder="e.g. AE-5069" required maxLength={60} /></label>
              <label className="procurement-field"><span>Initial price (ETB) *</span><input name="initialPrice" type="number" min="0" step="0.01" defaultValue={editing?.initialPrice ?? ''} required /></label>
              <label className="procurement-field"><span>Maximum price (ETB) *</span><input name="maximumPrice" type="number" min={editing?.initialPrice ?? 0} step="0.01" defaultValue={editing?.maximumPrice ?? ''} placeholder="Enter the bid limit" required /></label>
              <label className="procurement-field"><span>Status *</span><select name="status" defaultValue={editing?.status || 'draft'}><option value="draft">Save as draft</option><option value="published">Publish auction</option>{editing && <><option value="closed">Close auction</option><option value="cancelled">Cancel auction</option></>}</select></label>
              <label className="procurement-field"><span>Start date and time *</span><span className="procurement-input-icon"><CalendarDays size={16} /><input name="startsAt" type="datetime-local" defaultValue={toLocalInput(editing?.startsAt)} required /></span></label>
              <label className="procurement-field"><span>End date and time *</span><span className="procurement-input-icon"><CalendarDays size={16} /><input name="endsAt" type="datetime-local" defaultValue={editing?.endsAt ? toLocalInput(editing.endsAt) : toLocalInput(Date.now() + 24 * 60 * 60 * 1000)} required /></span></label>
              <label className="procurement-field procurement-span-two"><span>Description *</span><textarea name="description" defaultValue={editing?.description || ''} rows="4" placeholder="Describe the item, condition, inspection details, and bidding requirements." required /></label>
              <label className="procurement-field"><span>Item photo {editing ? '(choose to replace)' : '*'}</span><span className="procurement-upload"><ImagePlus size={18} /><input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required={!editing} /></span><small>JPG, PNG, or WebP. Up to 10 MB.</small>{editing?.photoUrl && <a className="procurement-file-link" href={`${apiOrigin}${editing.photoUrl}`} target="_blank" rel="noreferrer">View current photo</a>}</label>
              <label className="procurement-field"><span>Auction document (optional)</span><span className="procurement-upload"><FileText size={18} /><input name="document" type="file" accept="application/pdf,.doc,.docx" /></span><small>PDF or Word document. Up to 10 MB.</small>{editing?.documentUrl && <a className="procurement-file-link" href={`${apiOrigin}${editing.documentUrl}`} target="_blank" rel="noreferrer">{editing.documentName || 'View current document'}</a>}</label>
            </div>
            {error && <p className="procurement-alert is-error" role="alert">{error}</p>}
            {notice && <p className="procurement-alert is-success" role="status">{notice}</p>}
            <div className="procurement-form-actions"><span>Publishing makes the auction notice visible to bidders.</span><button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create auction item'}</button></div>
          </form>
        </section>}

        {!isActivityPage && <section className="procurement-list-section" id="auction-items">
          <div className="procurement-list-heading"><div><div className="procurement-list-tabs"><Link className={!isPublicPage ? 'active' : ''} to="/procurement/dashboard#auction-items">Back home</Link><Link className={isPublicPage ? 'active' : ''} to="/procurement/public-auctions">Public auctions <b>{items.filter((item) => item.status === 'published').length}</b></Link></div><h2>{isPublicPage ? 'Public auctions' : 'Your auction items'}</h2><p>{isPublicPage ? 'Items visible to bidders on the public auction page.' : 'Manage drafts, published notices, and uploaded files.'}</p></div>{!isPublicPage && <button onClick={() => { setEditing(null); setNotice(''); setError('') }}><Plus size={15} /> New item</button>}</div>
          {loading ? <div className="procurement-empty">Loading auction items…</div> : displayedItems.length === 0 ? <div className="procurement-empty"><ImagePlus size={26} /><b>{isPublicPage ? 'No public auctions yet' : 'No auction items yet'}</b><span>{isPublicPage ? 'Publish an item from All items to make it visible to bidders.' : 'Complete the form above to create your first notice.'}</span></div> : <div className="procurement-items-grid">{displayedItems.map((item) => <article className="procurement-item-card" key={item.id}>
            <span className="procurement-item-intent">{item.listingIntent || 'TO BE SELL'}</span>
            {item.photoUrl ? <img className="procurement-item-photo" src={`${apiOrigin}${item.photoUrl}`} alt={item.title} /> : <div className="procurement-item-photo procurement-no-photo"><ImagePlus size={28} /></div>}
            <div className="procurement-item-body"><div className="procurement-item-title-row"><h3>{item.title}</h3><span className={`procurement-status status-${item.status}`}>{item.status}</span></div><p className="procurement-item-type">{item.vehicleType} · LOT {item.lotNumber}</p><div className="procurement-price-grid"><span>Initial price<b>{money(item.initialPrice)}</b></span><span>Maximum price<b>{item.maximumPrice == null ? 'Not set' : money(item.maximumPrice)}</b></span></div><div className="procurement-item-dates"><span>Starts {dateText(item.startsAt)}</span><span>Ends {dateText(item.endsAt)}</span></div>{item.documentUrl && <a className="procurement-file-link" href={`${apiOrigin}${item.documentUrl}`} target="_blank" rel="noreferrer"><FileText size={14} /> {item.documentName || 'Auction document'}</a>}<p className="procurement-item-description">{item.description}</p><div className="procurement-item-actions"><button className={item.status === 'published' ? 'visibility-action is-public' : 'visibility-action'} disabled={visibilityId === item.id || ["closed", "cancelled"].includes(item.status)} onClick={() => toggleVisibility(item)}>{item.status === "published" ? <><EyeOff size={14} />{visibilityId === item.id ? "Unpublishing..." : "Unpublish"}</> : <><Eye size={14} />{visibilityId === item.id ? "Publishing..." : "Make public"}</>}</button><button onClick={() => { setEditing(item); setNotice(''); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }}><Pencil size={14} /> Edit</button><button className="delete-action" onClick={() => deleteItem(item)}><Trash2 size={14} /> Delete</button></div></div>
          </article>)}</div>}
        </section>}
      </section>
    </main>
  )
}
