import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../../services/api.js'
import { ArrowLeft, Download, FileText } from 'lucide-react'
import './WorkspacePages.css'

const apiOrigin = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')

export default function Documents() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => { apiRequest('/procurement/auctions').then((result) => setItems(result.items.filter((item) => item.documentUrl))).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false)) }, [])
  return <main className="procurement-workspace-page"><header className="workspace-page-header"><Link to="/procurement/dashboard" className="workspace-back"><ArrowLeft size={16} /> Dashboard</Link><span>AUCTION DOCUMENTS</span></header><section className="workspace-page-content"><span className="workspace-eyebrow">PROCUREMENT WORKSPACE</span><h1>Auction documents</h1><p className="workspace-intro">View and download documents attached to your auction notices. Upload or replace documents from Manage Auctions.</p><div className="workspace-toolbar"><b>{items.length} {items.length === 1 ? 'document' : 'documents'}</b><Link to="/procurement/dashboard#auction-items">Manage auctions</Link></div>{error ? <div className="workspace-empty">{error}</div> : loading ? <div className="workspace-empty">Loading documents…</div> : items.length === 0 ? <div className="workspace-empty"><FileText size={28} /><b>No auction documents uploaded</b><span>Add documents when creating or editing an auction.</span></div> : <div className="workspace-document-list">{items.map((item) => <article className="workspace-document" key={item.id}><span className="workspace-document-icon"><FileText size={20} /></span><span className="workspace-document-copy"><b>{item.documentName || 'Auction document'}</b><small>{item.title} · Lot {item.lotNumber}</small></span><a href={`${apiOrigin}${item.documentUrl}`} target="_blank" rel="noreferrer" aria-label={`Download ${item.documentName || 'auction document'}`}><Download size={16} /> Open</a></article>)}</div>}</section></main>
}
