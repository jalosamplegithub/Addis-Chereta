import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiRequest } from '../../services/api.js'
import { ArrowLeft, CalendarDays, FileText, ImagePlus } from 'lucide-react'
import './Auctions.css'

const apiOrigin = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')
const price = (amount) => new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 2 }).format(Number(amount || 0))

export default function AuctionDetails() {
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { apiRequest(`/auctions/${id}`).then((result) => setItem(result.item)).catch((requestError) => setError(requestError.message)) }, [id])
  return <main className="public-auctions-page"><header className="public-auctions-header"><Link to="/" className="public-auctions-brand"><span>✳</span><b>ADDIS CHERETA<small>ETHIOPIA'S DIGITAL MARKETPLACE</small></b></Link><Link to="/login" className="public-auctions-signin">Sign in</Link></header><section className="public-auctions-content"><Link className="public-auctions-back" to="/auctions"><ArrowLeft size={15} /> All auctions</Link>{error ? <div className="public-auctions-empty">{error}</div> : !item ? <div className="public-auctions-empty">Loading auction…</div> : <article className="public-auction-detail">{item.photoUrl ? <img src={`${apiOrigin}${item.photoUrl}`} alt={item.title} /> : <div className="public-auction-no-photo"><ImagePlus size={38} /></div>}<div className="public-auction-detail-content"><span className="public-detail-kicker">LOT {item.lotNumber}</span><h1>{item.title}</h1><h2>{item.vehicleType}</h2><p>{item.description}</p><div className="public-detail-prices"><span>Initial price<b>{price(item.initialPrice)}</b></span><span>Minimum increment<b>{price(item.minimumIncrement)}</b></span>{item.maximumPrice && <span>Maximum price<b>{price(item.maximumPrice)}</b></span>}</div><p className="public-detail-time"><CalendarDays size={16} /> Opens: {new Date(item.startsAt).toLocaleString()}</p><p className="public-detail-time"><CalendarDays size={16} /> Closes: {new Date(item.endsAt).toLocaleString()}</p>{item.documentUrl && <a className="public-auction-doc" href={`${apiOrigin}${item.documentUrl}`} target="_blank" rel="noreferrer"><FileText size={15} /> {item.documentName || 'Auction document'}</a>}<Link className="public-detail-login" to="/login">Sign in to participate</Link></div></article>}</section></main>
}
