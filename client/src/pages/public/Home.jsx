import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, BadgeCheck, Bell, CalendarDays, ChevronDown, CircleHelp, DollarSign, Eye, FileText, Gavel, Globe2, KeyRound, LogOut, Menu, MessageCircle, Moon, Search, ShoppingBag, Sun, Trash2, UserRound, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../../services/api'
import './Home.css'

const apiOrigin = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')

const notices = [
  { title: 'Supply and installation of office equipment', buyer: 'Ministry of Finance', date: 'Oct 28, 2026', type: 'Goods', id: 'MoF/NCB/018/2026' },
  { title: 'Construction of community health center', buyer: 'Oromia Health Bureau', date: 'Oct 25, 2026', type: 'Works', id: 'OHB/NCB/041/2026' },
  { title: 'ICT equipment and network maintenance', buyer: 'Addis Ababa University', date: 'Oct 22, 2026', type: 'Services', id: 'AAU/NCB/103/2026' },
]

const translations = {
  English: { kicker: 'A BETTER WAY TO DO BUSINESS', headline: 'Every opportunity.', headline2: 'One marketplace.', intro: 'Find public tenders, connect with buyers and bid with confidence.', explore: 'Explore opportunities', discover: 'DISCOVER', browse: 'Browse by bidders', trusted: 'Explore active opportunities from trusted institutions.', allBuyers: 'All buyers', search: 'Search organizations', view: 'View tenders', showing: 'featured organizations', featured: 'FEATURED NOTICE', open: 'OPEN', category: 'Procurement category', read: 'Read full tender', find: 'Find tenders', searchOpen: 'Search every open opportunity', join: 'Join the marketplace', registerBid: 'Register your business to bid', need: 'Need a hand?', help: 'Visit our help center', follow: 'Follow us', tagline: "Transparent. Accessible. For everyone.", home: 'Home', about: 'About us', faq: 'FAQ', pricing: 'Pricing', tutorials: 'Tutorials', register: 'Register', signIn: 'Sign in' },
  'Afaan Oromoo': { kicker: 'KARAA FOYYAA’AAN Daldaluuf', headline: 'Carraa hunda.', headline2: 'Gabaa tokko.', intro: 'Caalbaasii mootummaa barbaadi, bittoota waliin wal qunnami, ofitti amanamummaan dorgomi.', explore: 'Carraawwan qoradhu', discover: 'QORADHU', browse: 'Bittootaan ilaali', trusted: 'Carraawwan dhaabbilee amanamoo irraa qoradhu.', allBuyers: 'Bittoota hunda', search: 'Dhaabbilee barbaadi', view: 'Caalbaasii ilaali', showing: 'dhaabbilee filataman', featured: 'BEeksisa FILATAME', open: 'BANAA', category: 'Ramaddii bittaa', read: 'Beeksisa guutuu dubbisi', find: 'Caalbaasii barbaadi', searchOpen: 'Carraa banaa hunda barbaadi', join: 'Gabaa kana keessatti makami', registerBid: 'Dorgomuuf daldala kee galmeessi', need: 'Gargaarsa barbaaddaa?', help: 'Giddugala gargaarsaa daawwadhu', follow: 'Nu hordofaa', tagline: 'Ifa. Hundaaf banaa. Hundaaf.', home: 'Mana', about: 'Waa’ee keenya', faq: 'Gaaffii fi deebii', pricing: 'Gatii', tutorials: 'Qajeelfama', register: 'Galmaa’i', signIn: 'Seeni' },
  'አማርኛ': { kicker: 'ለንግድ የተሻለ መንገድ', headline: 'እያንዳንዱ ዕድል።', headline2: 'አንድ የገበያ ቦታ።', intro: 'የመንግሥት ጨረታዎችን ያግኙ፣ ከገዢዎች ጋር ይገናኙ እና በልበ ሙሉነት ይወዳደሩ።', explore: 'ዕድሎችን ይመልከቱ', discover: 'ያስሱ', browse: 'በገዢ ያስሱ', trusted: 'ከታመኑ ተቋማት የቀረቡ ንቁ ዕድሎችን ይመልከቱ።', allBuyers: 'ሁሉም ገዢዎች', search: 'ድርጅቶችን ይፈልጉ', view: 'ጨረታዎችን ይመልከቱ', showing: 'ተለይተው የቀረቡ ድርጅቶች', featured: 'ተለይቶ የቀረበ ማስታወቂያ', open: 'ክፍት', category: 'የግዥ ምድብ', read: 'ሙሉ የጨረታ ማስታወቂያውን ያንብቡ', find: 'ጨረታዎችን ያግኙ', searchOpen: 'ሁሉንም ክፍት ዕድሎች ይፈልጉ', join: 'የገበያው አባል ይሁኑ', registerBid: 'ለመወዳደር ንግድዎን ይመዝግቡ', need: 'እገዛ ይፈልጋሉ?', help: 'የእገዛ ማዕከላችንን ይጎብኙ', follow: 'ይከተሉን', tagline: 'ግልጽ። ተደራሽ። ለሁሉም።', home: 'ዋና ገጽ', about: 'ስለ እኛ', faq: 'ተደጋጋሚ ጥያቄዎች', pricing: 'ዋጋ', tutorials: 'መመሪያዎች', register: 'ይመዝገቡ', signIn: 'ይግቡ' },
}

export default function Home() {
  const languages = ['English', 'Afaan Oromoo', 'አማርኛ']
  const [language, setLanguage] = useState(() => languages.includes(window.localStorage.getItem('addis-chereta-language')) ? window.localStorage.getItem('addis-chereta-language') : 'English')
  const text = translations[language]
  const [theme, setTheme] = useState(() => window.localStorage.getItem('addis-chereta-theme') || 'light')
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [accountUser, setAccountUser] = useState(() => {
    try { return JSON.parse(window.localStorage.getItem('addis-chereta-user') || 'null') } catch { return null }
  })
  const [search, setSearch] = useState('')
  const [buyers, setBuyers] = useState([])
  const [buyersLoading, setBuyersLoading] = useState(true)
  const [buyersError, setBuyersError] = useState('')
  const [buyerPage, setBuyerPage] = useState(0)
  const [selectedNotice, setSelectedNotice] = useState(0)
  const filteredBuyers = useMemo(() => buyers.filter((buyer) => `${buyer.title} ${buyer.vehicleType} ${buyer.lotNumber}`.toLowerCase().includes(search.toLowerCase())), [buyers, search])
  const pageSize = 5
  const buyerPages = Math.max(1, Math.ceil(filteredBuyers.length / pageSize))
  const visibleBuyers = filteredBuyers.slice(buyerPage * pageSize, (buyerPage + 1) * pageSize)
  const notice = notices[selectedNotice]
  const signOut = () => {
    window.localStorage.removeItem('addis-chereta-token')
    window.localStorage.removeItem('addis-chereta-user')
    setAccountUser(null)
    setAccountMenuOpen(false)
  }

  useEffect(() => {
    let active = true
    apiRequest('/auctions/home-items').then((result) => { if (active) setBuyers(result.items || []) }).catch((requestError) => { if (active) setBuyersError(requestError.message) }).finally(() => { if (active) setBuyersLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    window.localStorage.setItem('addis-chereta-theme', theme)
  }, [theme])

  return (
    <main className="auction-home" id="home" data-theme={theme} lang={language === 'Afaan Oromoo' ? 'om' : language === 'አማርኛ' ? 'am' : 'en'}>
      <section className="auction-banner">
        <div className="banner-copy">
          <div className="banner-message"><span className="banner-kicker">{text.kicker}</span><h1>{text.headline}<br /><b>{text.headline2}</b></h1><p>{text.intro}</p><a href="#marketplace" className="banner-button">{text.explore} <ArrowRight size={16} /></a></div>
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
            <div className="market-title"><div><span className="section-label">{text.discover}</span><h2>{text.browse}</h2><p>{text.trusted}</p></div><a href="/auctions" className="all-link">{text.allBuyers} <ArrowRight size={15} /></a></div>
            <label className="buyer-search"><Search size={16} /><input value={search} onChange={(event) => { setSearch(event.target.value); setBuyerPage(0) }} placeholder="Search procurement posts" aria-label="Search procurement posts" />{search && <button onClick={() => { setSearch(''); setBuyerPage(0) }} aria-label="Clear search"><X size={14} /></button>}</label>
            <div className="buyer-cards">{buyersLoading ? <div className="no-buyers">Loading procurement posts...</div> : buyersError ? <div className="no-buyers">{buyersError}</div> : visibleBuyers.length ? visibleBuyers.map((buyer) => <a className="buyer-card" href={`/auctions/${buyer.id}`} key={buyer.id}><span className="home-item-intent">{buyer.listingIntent || 'TO BE SELL'}</span><span className="card-corner"><ArrowRight size={11} /></span><span className="buyer-logo auction-item-preview">{buyer.photoUrl ? <img src={`${apiOrigin}${buyer.photoUrl}`} alt="" /> : <span>{buyer.vehicleType}</span>}</span><span className="buyer-count">{buyer.lotNumber}</span><span className="buyer-name">{buyer.title}</span><span className="buyer-type">{buyer.vehicleType}</span><span className="buyer-card-link">View tender <ArrowRight size={13} /></span></a>) : <div className="no-buyers">{search ? `No posts match &quot;${search}&quot;.` : 'No published procurement posts yet. Publish an auction from the procurement dashboard to show it here.'}</div>}</div>
            <div className="buyer-pagination"><span>Showing <b>{visibleBuyers.length}</b> of {filteredBuyers.length} procurement posts</span><div><button onClick={() => setBuyerPage((page) => (page + buyerPages - 1) % buyerPages)} aria-label="Previous procurement posts" disabled={buyerPages <= 1}>&lt;</button><button onClick={() => setBuyerPage((page) => (page + 1) % buyerPages)} aria-label="Next procurement posts" disabled={buyerPages <= 1}>&gt;</button></div></div></div>
          <aside className="notice-panel" aria-label="Featured tender notice">
            <div className="notice-heading"><div><span className="live-dot" /> <span>{text.featured}</span></div><button aria-label="Get notification"><Bell size={16} /></button></div>
            <div className="notice-counter">0{selectedNotice + 1}<span> / 0{notices.length}</span></div>
            <h3 className="amharic-heading">የጨረታ ማስታወቂያ</h3>
            <p className="notice-title">{notice.title}</p>
            <div className="notice-buyer">{notice.buyer} <span>•</span> {notice.id}</div>
            <div className="notice-date"><CalendarDays size={16} /><span>{notice.date}</span><span className="notice-open">{text.open}</span></div>
            <div className="notice-type"><span className="type-icon">▤</span><span>Procurement category</span><b>{notice.type}</b></div>
            <div className="notice-excerpt"><span className="excerpt-icon">☷</span><p>The procuring entity invites eligible and qualified bidders to submit sealed bids for the supply and delivery of the goods described in this tender notice.</p></div>
            <a href={`/auctions/${notice.id}`} className="notice-link">{text.read} <ArrowRight size={15} /></a>
            <div className="notice-controls"><button onClick={() => setSelectedNotice((selectedNotice + notices.length - 1) % notices.length)} aria-label="Previous tender">‹</button><div>{notices.map((item, index) => <button key={item.id} className={index === selectedNotice ? 'active' : ''} onClick={() => setSelectedNotice(index)} aria-label={`Show tender ${index + 1}`} />)}</div><button onClick={() => setSelectedNotice((selectedNotice + 1) % notices.length)} aria-label="Next tender">›</button></div>
          </aside>
        </div>
      </section>

      <section className="quick-links"><a href="/auctions"><span className="quick-icon"><Search size={19} /></span><span><b>{text.find}</b><small>{text.searchOpen}</small></span><ArrowRight size={16} /></a><a href="/register"><span className="quick-icon"><Globe2 size={19} /></span><span><b>{text.join}</b><small>{text.registerBid}</small></span><ArrowRight size={16} /></a><a href="#help"><span className="quick-icon"><CircleHelp size={19} /></span><span><b>{text.need}</b><small>{text.help}</small></span><ArrowRight size={16} /></a></section>

      <footer className="auction-footer"><span>© 2026 Addis Chereta <i>•</i> Ethiopia's digital auction marketplace</span><div className="footer-social" aria-label="Social media"><span>Follow us</span><a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook"><span className="social-mark facebook-mark" aria-hidden="true">f</span></a><a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram"><span className="social-mark instagram-mark" aria-hidden="true">◎</span></a><a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn"><span className="social-mark linkedin-mark" aria-hidden="true">in</span></a><a href="https://www.youtube.com/" target="_blank" rel="noreferrer" aria-label="YouTube"><span className="social-mark youtube-mark" aria-hidden="true">▶</span></a></div><span className="footer-tagline">Transparent. Accessible. For everyone.</span></footer>

      <nav className="bottom-nav" aria-label={text.home}>
        <button className="mobile-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? <X size={19} /> : <Menu size={19} />}</button>
        <a className="header-brand" href="#home" aria-label="Addis Chereta home"><span className="header-brand-mark">✳</span><span className="header-brand-copy"><b>ADDIS CHERETA</b><small>ETHIOPIA'S DIGITAL MARKETPLACE</small></span></a>
        <div className={menuOpen ? 'bottom-nav-inner open' : 'bottom-nav-inner'}><a className="nav-active" href="#home" onClick={() => setMenuOpen(false)}>{text.home}</a><a href="#marketplace" onClick={() => setMenuOpen(false)}>{text.about}</a><a href="#help" onClick={() => setMenuOpen(false)}>{text.faq}</a><a href="#tutorials" onClick={() => setMenuOpen(false)}>{text.tutorials}</a></div>
        <div className="nav-right"><label className="language-control"><Globe2 size={18} /><select className="language-select" value={language} onChange={(event) => { setLanguage(event.target.value); window.localStorage.setItem('addis-chereta-language', event.target.value) }} aria-label="Select language">{languages.map((option) => <option key={option} value={option}>{option}</option>)}</select></label><button className="theme-button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}>{theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}</button>{accountUser?.role === 'bidder' ? <div className="home-account-wrap"><button className="home-account-trigger" aria-expanded={accountMenuOpen} onClick={() => setAccountMenuOpen((open) => !open)}><span className="home-account-avatar"><UserRound size={16} /></span><span>Hello, {accountUser.firstName || accountUser.username}</span><ChevronDown size={15} /></button>{accountMenuOpen && <div className="home-account-dropdown"><Link to="/profile" onClick={() => setAccountMenuOpen(false)}><UserRound size={15} /> My Profile</Link><span className="home-account-unavailable"><Eye size={15} /> My Watchlist <small>Coming soon</small></span><Link to="/my-bids" onClick={() => setAccountMenuOpen(false)}><Gavel size={15} /> My Bids</Link><span className="home-account-unavailable"><ShoppingBag size={15} /> My Purchases <small>Coming soon</small></span><span className="home-account-unavailable"><DollarSign size={15} /> My Balance <small>Coming soon</small></span><span className="home-account-unavailable"><FileText size={15} /> My Documents <small>Coming soon</small></span><Link to="/profile#account-settings" onClick={() => setAccountMenuOpen(false)}><KeyRound size={15} /> Change Password</Link><span className="home-account-unavailable"><MessageCircle size={15} /> Chat With Us <small>Coming soon</small></span><span className="home-account-unavailable"><BadgeCheck size={15} /> Compliance <small>Coming soon</small></span><Link className="home-account-delete" to="/profile#delete-account" onClick={() => setAccountMenuOpen(false)}><Trash2 size={15} /> Delete Account</Link><button onClick={signOut}><LogOut size={15} /> Log out</button></div>}</div> : <><a href="/register" className="outline-button">{text.register}</a><a href="/login" className="outline-button">{text.signIn}</a></>}</div>
      </nav>
    </main>
  )
}
