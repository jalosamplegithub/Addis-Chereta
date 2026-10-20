import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Gavel } from 'lucide-react'
import { apiRequest } from '../../services/api.js'
import './BidderBids.css'

const money = (amount) => new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 2 }).format(Number(amount || 0))

export default function BidderBids() {
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiRequest('/auctions/my-bids').then((result) => setBids(result.bids || [])).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false))
  }, [])

  return <main className="bidder-bids-page">
    <header className="bidder-bids-topbar"><Link to="/" className="bidder-bids-back"><ArrowLeft size={16} /> Home</Link><Link to="/" className="bidder-bids-brand"><span>✳</span> ADDIS CHERETA</Link></header>
    <section className="bidder-bids-content"><div className="bidder-bids-heading"><span>MY ACCOUNT</span><h1>My Bids</h1><p>Your sealed bid amounts are private to you.</p></div>
      {loading ? <div className="bidder-bids-empty">Loading your bids…</div> : error ? <div className="bidder-bids-empty is-error" role="alert">{error}</div> : bids.length === 0 ? <div className="bidder-bids-empty"><Gavel size={26} /><b>No bids submitted yet</b><span>Your submitted bids will appear here.</span><Link to="/auctions">Browse auctions</Link></div> : <div className="bidder-bids-list">{bids.map((bid) => <article className="bidder-bid-card" key={bid.id}><div className="bidder-bid-copy"><h2>{bid.title}</h2><p>{bid.vehicleType} · Lot {bid.lotNumber}</p><span><CalendarDays size={14} /> Ends {new Date(bid.endsAt).toLocaleString()}</span></div><div className="bidder-bid-amount"><small>Your sealed bid</small><b>{money(bid.amount)}</b><span className={`bidder-bid-status status-${bid.status}`}>{bid.status}</span></div><Link to={`/auctions/${bid.auctionItemId}`}>View auction</Link></article>)}</div>}
    </section>
  </main>
}
