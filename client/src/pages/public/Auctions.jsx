import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../../services/api.js'
import { ArrowLeft, ArrowRight, CalendarDays, FileText, ImagePlus } from 'lucide-react'
import './Auctions.css'

const apiOrigin = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')
const price = (amount) => new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 2 }).format(Number(amount || 0))

export default function Auctions() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    apiRequest('/auctions').then((result) => setItems(result.items)).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false))
  }, [])

  return <main className="public-auctions-page">
    <header className="public-auctions-header"><Link to="/" className="public-auctions-brand"><span>✳</span><b>ADDIS CHERETA<small>ETHIOPIA'S DIGITAL MARKETPLACE</small></b></Link><Link to="/login" className="public-auctions-signin">Sign in</Link></header>
    <section className="public-auctions-content"><Link className="public-auctions-back" to="/"><ArrowLeft size={15} /> Home</Link><div className="public-auctions-heading"><div><span>OPEN BIDDING</span><h1>Available auctions</h1><p>Browse published auction notices and review item details.</p></div><div className="public-auctions-total">{items.length} open {items.length === 1 ? 'auction' : 'auctions'}</div></div>
      {loading ? <div className="public-auctions-empty">Loading auctions…</div> : error ? <div className="public-auctions-empty">{error}</div> : items.length === 0 ? <div className="public-auctions-empty"><ImagePlus size={30} /><b>No open auctions right now</b><span>Published items will appear here when available.</span></div> : <div className="public-auction-grid">{items.map((item) => <article className="public-auction-card" key={item.id}>
        <span className="public-item-intent">{item.listingIntent || 'TO BE SELL'}</span>
        {item.photoUrl ? <img className="public-auction-photo" src={`${apiOrigin}${item.photoUrl}`} alt={item.title} /> : <div className="public-auction-photo public-auction-no-photo"><ImagePlus size={30} /></div>}
        <div className="public-auction-main"><h2>{item.title}</h2><p>{item.vehicleType} · YEAR / TYPE DETAILS</p><div className="public-auction-lot">Lot No. <b>{item.lotNumber}</b></div><div className="public-auction-prices"><span>Initial price<b>{price(item.initialPrice)}</b></span><span>Maximum price<b>{item.maximumPrice == null ? 'Not set' : price(item.maximumPrice)}</b></span></div><div className="public-auction-times"><span><CalendarDays size={14} /> Starts {new Date(item.startsAt).toLocaleString()}</span><span><CalendarDays size={14} /> Ends {new Date(item.endsAt).toLocaleString()}</span></div>{item.documentUrl && <a className="public-auction-doc" href={`${apiOrigin}${item.documentUrl}`} target="_blank" rel="noreferrer"><FileText size={14} /> {item.documentName || 'Auction document'}</a>}<Link className="public-auction-details" to={`/auctions/${item.id}`}>Details <ArrowRight size={15} /></Link></div>
      </article>)}</div>}
    </section>
  </main>
}
