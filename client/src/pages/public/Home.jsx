import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Bell, CalendarDays, ChevronDown, CircleHelp, Globe2, Menu, Moon, Search, Sun, X } from 'lucide-react'
import './Home.css'

const buyers = [
  { name: 'Techno Serve', type: 'Development partner', count: 6, mark: 'T', tone: 'teal' },
  { name: 'Customs Commission', type: 'Federal institution', count: 25, mark: '✺', tone: 'royal' },
  { name: 'Ethiopian Electric Power', type: 'Public enterprise', count: 6, mark: 'ϟ', tone: 'flag' },
  { name: 'Kality Customs Commission', type: 'Federal institution', count: 64, mark: '✺', tone: 'royal' },
  { name: 'Mojo Customs Commission', type: 'Federal institution', count: 25, mark: '✺', tone: 'royal' },
]

const notices = [
  { title: 'Supply and installation of office equipment', buyer: 'Ministry of Finance', date: 'Oct 28, 2026', type: 'Goods', id: 'MoF/NCB/018/2026' },
  { title: 'Construction of community health center', buyer: 'Oromia Health Bureau', date: 'Oct 25, 2026', type: 'Works', id: 'OHB/NCB/041/2026' },
  { title: 'ICT equipment and network maintenance', buyer: 'Addis Ababa University', date: 'Oct 22, 2026', type: 'Services', id: 'AAU/NCB/103/2026' },
]

export default function Home() {
  const [language, setLanguage] = useState('English')
  const [theme, setTheme] = useState(() => window.localStorage.getItem('addis-chereta-theme') || 'light')
  const [menuOpen, setMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedNotice, setSelectedNotice] = useState(0)
  const filteredBuyers = useMemo(() => buyers.filter((buyer) => `${buyer.name} ${buyer.type}`.toLowerCase().includes(search.toLowerCase())), [search])
  const notice = notices[selectedNotice]

  useEffect(() => {
    window.localStorage.setItem('addis-chereta-theme', theme)
  }, [theme])

  return (
    <main className="auction-home" id="home" data-theme={theme}>
      <section className="auction-banner">
        <div className="banner-copy">
          <div className="banner-message"><span className="banner-kicker">A BETTER WAY TO DO BUSINESS</span><h1>Every opportunity.<br /><b>One marketplace.</b></h1><p>Find public tenders, connect with buyers and bid with confidence.</p><a href="#marketplace" className="banner-button">Explore opportunities <ArrowRight size={16} /></a></div>
        </div>
        <div className="banner-visual" aria-label="Illustration of the Addis Chereta auction marketplace" role="img">
          <div className="banner-glow" /><div className="banner-circle circle-a" /><div className="banner-circle circle-b" />
          <div className="phone phone-back"><div className="phone-camera" /><div className="phone-content"><span className="phone-line" /><span className="phone-tile" /><span className="phone-tile" /><span className="phone-tile" /><span className="phone-tile" /></div></div>
          <div className="phone phone-front"><div className="phone-camera" /><div className="phone-top"><span className="mini-brand">AC</span><span>Open tenders</span><Search size={12} /></div><div className="phone-label">BROWSE BY CATEGORY</div><div className="phone-grid"><span><i>🏗</i>Construction</span><span><i>⚡</i>Energy</span><span><i>✚</i>Healthcare</span><span><i>▦</i>Technology</span><span><i>◈</i>Vehicles</span><span><i>⌂</i>Supplies</span></div><div className="phone-footer"><span>Featured tenders</span><b>View all →</b></div></div>
          <div className="banner-sticker"><span>✦</span><b>OPEN<br />BIDDING</b></div><span className="banner-orbit-dot dot-a" /><span className="banner-orbit-dot dot-b" />
        </div>
        <div className="banner-edge"><span>FAIR PROCUREMENT. REAL OPPORTUNITY.</span><span>አዲስ ጨረታ <b>•</b> ADDIS CHERETA</span></div>
      </section>

      <section className="market-area" id="marketplace">
        <div className="market-layout">
          <div className="buyer-column">
            <div className="market-title"><div><span className="section-label">DISCOVER</span><h2>Browse by buyer</h2><p>Explore active opportunities from trusted institutions.</p></div><a href="/auctions" className="all-link">All buyers <ArrowRight size={15} /></a></div>
            <label className="buyer-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search organizations" aria-label="Search organizations" />{search && <button onClick={() => setSearch('')} aria-label="Clear search"><X size={14} /></button>}</label>
            <div className="buyer-cards">{filteredBuyers.length ? filteredBuyers.map((buyer) => <a className="buyer-card" href="/auctions" key={buyer.name}><span className="card-corner">↗</span><span className={`buyer-logo ${buyer.tone}`}>{buyer.tone === 'teal' ? <><b>Techno</b><b>Serve</b><small>business solutions</small></> : <span>{buyer.mark}</span>}</span><span className="buyer-count">{buyer.count}</span><span className="buyer-name">{buyer.name}</span><span className="buyer-type">{buyer.type}</span><span className="buyer-card-link">View tenders <ArrowRight size={13} /></span></a>) : <div className="no-buyers">No organizations match “{search}”.</div>}</div>
            <div className="buyer-pagination"><span>Showing <b>{filteredBuyers.length}</b> featured organizations</span><div><button aria-label="Previous organizations">‹</button><button aria-label="Next organizations">›</button></div></div>
          </div>
          <aside className="notice-panel" aria-label="Featured tender notice">
            <div className="notice-heading"><div><span className="live-dot" /> <span>FEATURED NOTICE</span></div><button aria-label="Get notification"><Bell size={16} /></button></div>
            <div className="notice-counter">0{selectedNotice + 1}<span> / 0{notices.length}</span></div>
            <h3 className="amharic-heading">የጨረታ ማስታወቂያ</h3>
            <p className="notice-title">{notice.title}</p>
            <div className="notice-buyer">{notice.buyer} <span>•</span> {notice.id}</div>
            <div className="notice-date"><CalendarDays size={16} /><span>{notice.date}</span><span className="notice-open">OPEN</span></div>
            <div className="notice-type"><span className="type-icon">▤</span><span>Procurement category</span><b>{notice.type}</b></div>
            <div className="notice-excerpt"><span className="excerpt-icon">☷</span><p>The procuring entity invites eligible and qualified bidders to submit sealed bids for the supply and delivery of the goods described in this tender notice.</p></div>
            <a href={`/auctions/${notice.id}`} className="notice-link">Read full tender <ArrowRight size={15} /></a>
            <div className="notice-controls"><button onClick={() => setSelectedNotice((selectedNotice + notices.length - 1) % notices.length)} aria-label="Previous tender">‹</button><div>{notices.map((item, index) => <button key={item.id} className={index === selectedNotice ? 'active' : ''} onClick={() => setSelectedNotice(index)} aria-label={`Show tender ${index + 1}`} />)}</div><button onClick={() => setSelectedNotice((selectedNotice + 1) % notices.length)} aria-label="Next tender">›</button></div>
          </aside>
        </div>
      </section>

      <section className="quick-links"><a href="/auctions"><span className="quick-icon"><Search size={19} /></span><span><b>Find tenders</b><small>Search every open opportunity</small></span><ArrowRight size={16} /></a><a href="/register"><span className="quick-icon"><Globe2 size={19} /></span><span><b>Join the marketplace</b><small>Register your business to bid</small></span><ArrowRight size={16} /></a><a href="#help"><span className="quick-icon"><CircleHelp size={19} /></span><span><b>Need a hand?</b><small>Visit our help center</small></span><ArrowRight size={16} /></a></section>

      <footer className="auction-footer"><span>© 2026 Addis Chereta <i>•</i> Ethiopia's digital auction marketplace</span><div className="footer-social" aria-label="Social media"><span>Follow us</span><a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook"><span className="social-mark facebook-mark" aria-hidden="true">f</span></a><a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram"><span className="social-mark instagram-mark" aria-hidden="true">◎</span></a><a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn"><span className="social-mark linkedin-mark" aria-hidden="true">in</span></a><a href="https://www.youtube.com/" target="_blank" rel="noreferrer" aria-label="YouTube"><span className="social-mark youtube-mark" aria-hidden="true">▶</span></a></div><span className="footer-tagline">Transparent. Accessible. For everyone.</span></footer>

      <nav className="bottom-nav" aria-label="Main navigation">
        <a className="header-brand" href="#home" aria-label="Addis Chereta — Ethiopia's digital marketplace"><span className="header-brand-mark">✳</span><span className="header-brand-copy"><b>ADDIS CHERETA</b><small>ETHIOPIA'S DIGITAL MARKETPLACE</small></span></a>
        <button className="mobile-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? <X size={19} /> : <Menu size={19} />}</button>
        <div className={menuOpen ? 'bottom-nav-inner open' : 'bottom-nav-inner'}><a className="nav-active" href="#home" onClick={() => setMenuOpen(false)}>Home</a><a href="#marketplace" onClick={() => setMenuOpen(false)}>About us</a><a href="#help" onClick={() => setMenuOpen(false)}>FAQ</a><a href="/pricing" onClick={() => setMenuOpen(false)}>Pricing</a><a href="#tutorials" onClick={() => setMenuOpen(false)}>Tutorials</a></div>
        <div className="nav-right"><button className="language-button" onClick={() => setLanguage(language === 'English' ? 'አማርኛ' : 'English')}><Globe2 size={18} />{language}<ChevronDown size={12} /></button><button className="theme-button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}>{theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}</button><a href="/register" className="outline-button">Register</a><a href="/login" className="outline-button">Sign in</a></div>
      </nav>
    </main>
  )
}
