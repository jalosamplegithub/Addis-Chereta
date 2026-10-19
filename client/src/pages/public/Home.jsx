import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Bell, CalendarDays, CircleHelp, Globe2, Menu, Moon, Search, Sun, X } from 'lucide-react'
import './Home.css'

const buyers = [
  { name: 'To be assigned ', type: 'Development partner', count: 6, mark: 'T', tone: 'teal' },
  { name: 'To be assigned', type: 'Federal institution', count: 25, mark: '✺', tone: 'royal' },
  { name: 'To be assigned', type: 'Public enterprise', count: 6, mark: 'ϟ', tone: 'flag' },
  { name: 'To be assigned', type: 'Federal institution', count: 64, mark: '✺', tone: 'royal' },
  { name: 'To be assigned', type: 'Federal institution', count: 25, mark: '✺', tone: 'royal' },
]

const notices = [
  { title: 'Supply and installation of office equipment', buyer: 'Ministry of Finance', date: 'Oct 28, 2026', type: 'Goods', id: 'MoF/NCB/018/2026' },
  { title: 'Construction of community health center', buyer: 'Oromia Health Bureau', date: 'Oct 25, 2026', type: 'Works', id: 'OHB/NCB/041/2026' },
  { title: 'ICT equipment and network maintenance', buyer: 'Addis Ababa University', date: 'Oct 22, 2026', type: 'Services', id: 'AAU/NCB/103/2026' },
]

const translations = {
  English: { kicker: 'A BETTER WAY TO DO BUSINESS', headline: 'Every opportunity.', headline2: 'One marketplace.', intro: 'Find public tenders, connect with buyers and bid with confidence.', explore: 'Explore opportunities', discover: 'DISCOVER', browse: 'Browse by buyer', trusted: 'Explore active opportunities from trusted institutions.', allBuyers: 'All buyers', search: 'Search organizations', view: 'View tenders', showing: 'featured organizations', featured: 'FEATURED NOTICE', open: 'OPEN', category: 'Procurement category', read: 'Read full tender', find: 'Find tenders', searchOpen: 'Search every open opportunity', join: 'Join the marketplace', registerBid: 'Register your business to bid', need: 'Need a hand?', help: 'Visit our help center', follow: 'Follow us', tagline: "Transparent. Accessible. For everyone.", home: 'Home', about: 'About us', faq: 'FAQ', pricing: 'Pricing', tutorials: 'Tutorials', register: 'Register', signIn: 'Sign in' },
  'Afaan Oromoo': { kicker: 'KARAA FOYYAA’AAN Daldaluuf', headline: 'Carraa hunda.', headline2: 'Gabaa tokko.', intro: 'Caalbaasii mootummaa barbaadi, bittoota waliin wal qunnami, ofitti amanamummaan dorgomi.', explore: 'Carraawwan qoradhu', discover: 'QORADHU', browse: 'Bittootaan ilaali', trusted: 'Carraawwan dhaabbilee amanamoo irraa qoradhu.', allBuyers: 'Bittoota hunda', search: 'Dhaabbilee barbaadi', view: 'Caalbaasii ilaali', showing: 'dhaabbilee filataman', featured: 'BEeksisa FILATAME', open: 'BANAA', category: 'Ramaddii bittaa', read: 'Beeksisa guutuu dubbisi', find: 'Caalbaasii barbaadi', searchOpen: 'Carraa banaa hunda barbaadi', join: 'Gabaa kana keessatti makami', registerBid: 'Dorgomuuf daldala kee galmeessi', need: 'Gargaarsa barbaaddaa?', help: 'Giddugala gargaarsaa daawwadhu', follow: 'Nu hordofaa', tagline: 'Ifa. Hundaaf banaa. Hundaaf.', home: 'Mana', about: 'Waa’ee keenya', faq: 'Gaaffii fi deebii', pricing: 'Gatii', tutorials: 'Qajeelfama', register: 'Galmaa’i', signIn: 'Seeni' },
  'አማርኛ': { kicker: 'ለንግድ የተሻለ መንገድ', headline: 'እያንዳንዱ ዕድል።', headline2: 'አንድ የገበያ ቦታ።', intro: 'የመንግሥት ጨረታዎችን ያግኙ፣ ከገዢዎች ጋር ይገናኙ እና በልበ ሙሉነት ይወዳደሩ።', explore: 'ዕድሎችን ይመልከቱ', discover: 'ያስሱ', browse: 'በገዢ ያስሱ', trusted: 'ከታመኑ ተቋማት የቀረቡ ንቁ ዕድሎችን ይመልከቱ።', allBuyers: 'ሁሉም ገዢዎች', search: 'ድርጅቶችን ይፈልጉ', view: 'ጨረታዎችን ይመልከቱ', showing: 'ተለይተው የቀረቡ ድርጅቶች', featured: 'ተለይቶ የቀረበ ማስታወቂያ', open: 'ክፍት', category: 'የግዥ ምድብ', read: 'ሙሉ የጨረታ ማስታወቂያውን ያንብቡ', find: 'ጨረታዎችን ያግኙ', searchOpen: 'ሁሉንም ክፍት ዕድሎች ይፈልጉ', join: 'የገበያው አባል ይሁኑ', registerBid: 'ለመወዳደር ንግድዎን ይመዝግቡ', need: 'እገዛ ይፈልጋሉ?', help: 'የእገዛ ማዕከላችንን ይጎብኙ', follow: 'ይከተሉን', tagline: 'ግልጽ። ተደራሽ። ለሁሉም።', home: 'ዋና ገጽ', about: 'ስለ እኛ', faq: 'ተደጋጋሚ ጥያቄዎች', pricing: 'ዋጋ', tutorials: 'መመሪያዎች', register: 'ይመዝገቡ', signIn: 'ይግቡ' },
}

export default function Home() {
  const languages = ['English', 'Afaan Oromoo', 'አማርኛ']
  const [language, setLanguage] = useState(() => languages.includes(window.localStorage.getItem('addis-chereta-language')) ? window.localStorage.getItem('addis-chereta-language') : 'English')
  const text = translations[language]
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
            <label className="buyer-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={text.search} aria-label={text.search} />{search && <button onClick={() => setSearch('')} aria-label="Clear search"><X size={14} /></button>}</label>
            <div className="buyer-cards">{filteredBuyers.length ? filteredBuyers.map((buyer) => <a className="buyer-card" href="/auctions" key={buyer.name}><span className="card-corner">↗</span><span className={`buyer-logo ${buyer.tone}`}>{buyer.tone === 'teal' ? <><b>Techno</b><b>Serve</b><small>business solutions</small></> : <span>{buyer.mark}</span>}</span><span className="buyer-count">{buyer.count}</span><span className="buyer-name">{buyer.name}</span><span className="buyer-type">{buyer.type}</span><span className="buyer-card-link">View tenders <ArrowRight size={13} /></span></a>) : <div className="no-buyers">No organizations match “{search}”.</div>}</div>
            <div className="buyer-pagination"><span>Showing <b>{filteredBuyers.length}</b> featured organizations</span><div><button aria-label="Previous organizations">‹</button><button aria-label="Next organizations">›</button></div></div>
          </div>
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
        <div className="nav-right"><label className="language-control"><Globe2 size={18} /><select className="language-select" value={language} onChange={(event) => { setLanguage(event.target.value); window.localStorage.setItem('addis-chereta-language', event.target.value) }} aria-label="Select language">{languages.map((option) => <option key={option} value={option}>{option}</option>)}</select></label><button className="theme-button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}>{theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}</button><a href="/register" className="outline-button">{text.register}</a><a href="/login" className="outline-button">{text.signIn}</a></div>
      </nav>
    </main>
  )
}
