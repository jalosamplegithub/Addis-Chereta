import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../../services/api.js'
import { ArrowLeft, ArrowRight, ClipboardList } from 'lucide-react'
import './WorkspacePages.css'

export default function Tasks() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => { apiRequest('/procurement/auctions').then((result) => setItems(result.items)).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false)) }, [])
  const tasks = useMemo(() => items.flatMap((item) => {
    const pending = []
    if (item.status === 'draft') pending.push({ id: `${item.id}-draft`, title: `Publish draft: ${item.title}`, detail: `Lot ${item.lotNumber} is still a draft. Review it and publish when ready.`, item })
    if (item.status === 'published' && !item.documentUrl) pending.push({ id: `${item.id}-document`, title: `Add auction documents: ${item.title}`, detail: `Lot ${item.lotNumber} is published without an attached document.`, item })
    const hoursRemaining = (new Date(item.endsAt).getTime() - Date.now()) / 3600000
    if (item.status === 'published' && hoursRemaining > 0 && hoursRemaining <= 48) pending.push({ id: `${item.id}-closing`, title: `Auction closing soon: ${item.title}`, detail: `Lot ${item.lotNumber} closes ${new Date(item.endsAt).toLocaleString()}.`, item })
    return pending
  }), [items])
  return <main className="procurement-workspace-page"><header className="workspace-page-header"><Link to="/procurement/dashboard" className="workspace-back"><ArrowLeft size={16} /> Dashboard</Link><span>PROCUREMENT TASKS</span></header><section className="workspace-page-content"><span className="workspace-eyebrow">PROCUREMENT WORKSPACE</span><h1>Procurement tasks</h1><p className="workspace-intro">Pending activities based on your auction drafts, document uploads, and closing dates.</p>{error ? <div className="workspace-empty">{error}</div> : loading ? <div className="workspace-empty">Loading tasks…</div> : tasks.length === 0 ? <div className="workspace-empty"><ClipboardList size={28} /><b>No pending procurement tasks</b><span>You’re up to date with the auctions you manage.</span></div> : <div className="workspace-task-list">{tasks.map((task) => <article className="workspace-task" key={task.id}><span className="workspace-task-icon"><ClipboardList size={19} /></span><div><b>{task.title}</b><p>{task.detail}</p></div><Link to="/procurement/dashboard#auction-items" aria-label={`Manage ${task.item.title}`}><ArrowRight size={16} /></Link></article>)}</div>}</section></main>
}
