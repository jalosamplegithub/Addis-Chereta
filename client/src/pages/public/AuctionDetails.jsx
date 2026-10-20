import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiRequest } from '../../services/api.js'
import { ArrowLeft, CalendarDays, Clock3, Eye, FileText, Gavel, ImagePlus, ShieldCheck } from 'lucide-react'
import './Auctions.css'

const apiOrigin = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')
const price = (amount) => new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(amount || 0))
const remaining = (milliseconds) => {
  if (milliseconds <= 0) return 'Closed'
  const seconds = Math.floor(milliseconds / 1000)
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  return `${days}d  ${hours}h  ${minutes}m  ${rest}s`
}

export default function AuctionDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [error, setError] = useState('')
  const [now, setNow] = useState(0)
  const [showDetails, setShowDetails] = useState(false)
  const [showBidForm, setShowBidForm] = useState(false)
  const [bidAmount, setBidAmount] = useState('')
  const [bidMessage, setBidMessage] = useState('')
  const [bidError, setBidError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  let user = null
  try { user = JSON.parse(window.localStorage.getItem('addis-chereta-user') || 'null') } catch { user = null }

  useEffect(() => {
    let active = true
    apiRequest(`/auctions/${id}`).then((result) => { if (active) setItem(result.item) }).catch((requestError) => { if (active) setError(requestError.message) })
    return () => { active = false }
  }, [id])

  useEffect(() => {
    const initialTick = window.setTimeout(() => setNow(Date.now()), 0)
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => { window.clearTimeout(initialTick); window.clearInterval(timer) }
  }, [])

  const start = item ? new Date(item.startsAt).getTime() : 0
  const end = item ? new Date(item.endsAt).getTime() : 0
  const hasMaximumPrice = item?.maximumPrice != null && item.maximumPrice !== ''
  const canBid = item?.status === 'published' && hasMaximumPrice && now >= start && now < end

  async function submitBid(event) {
    event.preventDefault()
    setBidMessage('')
    setBidError('')
    const amount = Number(bidAmount)
    if (amount < Number(item.initialPrice) || amount > Number(item.maximumPrice)) {
      setBidError(`Your bid must be between ${price(item.initialPrice)} and ${price(item.maximumPrice)}.`)
      return
    }
    setSubmitting(true)
    try {
      const result = await apiRequest(`/auctions/${id}/bids`, { method: 'POST', body: JSON.stringify({ amount: bidAmount }) })
      setBidMessage(result.message)
      setBidAmount('')
      const refreshed = await apiRequest(`/auctions/${id}`)
      setItem(refreshed.item)
    } catch (requestError) {
      setBidError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  function openBidForm() {
    if (!user || !window.localStorage.getItem('addis-chereta-token')) return navigate(`/login?returnTo=${encodeURIComponent(`/auctions/${id}`)}`)
    if (user.role !== 'bidder') {
      setBidError('Sign in with a bidder account to place a bid.')
      setShowBidForm(true)
      return
    }
    if (canBid) setBidError('')
    setShowBidForm(true)
  }

  return <main className="public-auctions-page">
    <header className="public-auctions-header"><Link to="/" className="public-auctions-brand"><span>✳</span><b>ADDIS CHERETA<small>ETHIOPIA'S DIGITAL MARKETPLACE</small></b></Link><Link to="/login" className="public-auctions-signin">Sign in</Link></header>
    <section className="public-auctions-content bid-view-content">
      <Link className="public-auctions-back" to="/"><ArrowLeft size={15} /> Home</Link>
      {error ? <div className="public-auctions-empty">{error}</div> : !item ? <div className="public-auctions-empty">Loading auction…</div> : <article className="bid-view-card">
        <span className="bid-view-intent">{item.listingIntent || 'TO BE SELL'}</span>
        <div className="bid-view-heading">{item.photoUrl ? <img src={`${apiOrigin}${item.photoUrl}`} alt={item.title} /> : <div className="bid-view-no-photo"><ImagePlus size={26} /></div>}<h1>{item.title} ({item.vehicleType})</h1></div>
        <div className="bid-view-stats"><span>Bidders <b>{item.bidderCount || 0}</b></span><i /><span>Lot No. <b>{item.lotNumber}</b></span></div>
        <div className="sealed-bid-banner"><ShieldCheck size={29} /><b>SEALED BID</b></div>
        <div className="bid-view-price"><div><span>Initial Price</span><b>{price(item.initialPrice)}</b></div><div><span>Maximum Price</span><b>{item.maximumPrice == null ? 'Not set' : price(item.maximumPrice)}</b></div></div>
        <div className="bid-view-timing"><div><span>Remaining Time</span><b><Clock3 size={15} /> {remaining(end - now)}</b></div><div><span>End Date</span><b><CalendarDays size={15} /> {new Date(item.endsAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}, {new Date(item.endsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</b></div></div>
        <div className="bid-view-actions"><button className="bid-details-button" onClick={() => setShowDetails((shown) => !shown)}><Eye size={17} /><span>Details</span></button><button className="bid-now-button" onClick={openBidForm} disabled={!canBid}><Gavel size={15} />{!hasMaximumPrice ? 'Maximum Price Missing' : canBid ? 'Bid Now' : item.status !== 'published' ? 'Not Published' : now < start ? 'Bidding Not Open' : 'Bidding Closed'}</button></div>
        {showDetails && <div className="bid-extra-details"><p>{item.description}</p>{item.documentUrl && <a className="public-auction-doc" href={`${apiOrigin}${item.documentUrl}`} target="_blank" rel="noreferrer"><FileText size={14} /> {item.documentName || 'Auction document'}</a>}</div>}
        {showBidForm && <form className="bid-entry-form" onSubmit={submitBid}><label htmlFor="sealed-bid-amount">Your sealed bid (ETB)</label><div><input id="sealed-bid-amount" type="number" min={item.initialPrice} max={item.maximumPrice ?? undefined} step="0.01" value={bidAmount} onChange={(event) => setBidAmount(event.target.value)} placeholder={`${Number(item.initialPrice).toFixed(2)} – ${item.maximumPrice == null ? 'Maximum price not set' : Number(item.maximumPrice).toFixed(2)}`} required disabled={!canBid || user?.role !== 'bidder'} /><button type="submit" disabled={submitting || !canBid || user?.role !== 'bidder'}>{submitting ? 'Submitting…' : 'Submit sealed bid'}</button></div><small>Enter a bid between {price(item.initialPrice)} and {item.maximumPrice == null ? 'the maximum price set by procurement' : price(item.maximumPrice)}. Your bid is private.</small>{bidError && <p className="bid-feedback bid-error" role="alert">{bidError}</p>}{bidMessage && <p className="bid-feedback bid-success" role="status">{bidMessage}</p>}</form>}
      </article>}
    </section>
  </main>
}
