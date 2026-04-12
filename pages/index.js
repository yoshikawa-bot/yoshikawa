import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'

const TMDB_KEY = '66223dd3ad2885cf1129b181c7826287'
const FALLBACK  = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'
const LABELS    = { releases: 'Lançamentos', recommendations: 'Populares', favorites: 'Favoritos' }

function useDebounce(fn, ms) {
  const t = useRef(null)
  return useCallback((...args) => {
    clearTimeout(t.current)
    t.current = setTimeout(() => fn(...args), ms)
  }, [fn, ms])
}

function WelcomeScreen({ onEnter }) {
  const [out, setOut] = useState(false)
  const go = () => { setOut(true); setTimeout(onEnter, 460) }

  return (
    <div className={`wpage ${out ? 'wpage-out' : ''}`}>
      <div className="wpage-nav">
        <span className="wpage-logo">Yoshikawa <span className="hl">ESM</span></span>
        <span className="wpage-badge">Player</span>
      </div>
      <div className="wpage-body">
        <p className="wpage-eyebrow">Uso interno exclusivo</p>
        <h1 className="wpage-title">Yoshikawa <em>Player</em></h1>
        <p className="wpage-desc">Filmes e séries integrados ao ecossistema Yoshikawa Bot.</p>
        <div className="wpage-notice">
          <div className="wpage-notice-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p className="wpage-notice-text">
            Este site é de uso interno exclusivo para usuários da <strong>Yoshikawa Bot</strong>.
            Não hospeda nem direciona nenhum conteúdo — utiliza apenas uma <strong>API pública de embed</strong>.
            O projeto é totalmente <strong>open source</strong> e não viola direitos autorais.
          </p>
        </div>
        <div className="wpage-actions">
          <button type="button" className="wpage-btn" onClick={go}>Entrar</button>
        </div>
      </div>
    </div>
  )
}

function Notification({ notif, onDismiss }) {
  if (!notif) return null
  return (
    <div className={`notif ${notif.closing ? 'notif-out' : ''}`} onClick={onDismiss}>
      <div className="notif-icon">
        <i className={`fas ${notif.icon}`} />
      </div>
      <div className="notif-body">
        <p className="notif-title">{notif.title}</p>
        <p className="notif-msg">{notif.msg}</p>
      </div>
    </div>
  )
}

function MovieCard({ item, isFav, onFav, delay }) {
  const [pulse, setPulse] = useState(false)
  const src = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : FALLBACK

  const handleFav = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setPulse(true)
    onFav(item)
    setTimeout(() => setPulse(false), 400)
  }

  return (
    <Link href={`/${item.media_type}/${item.id}`} className="card" style={{ animationDelay: `${delay}ms` }}>
      <div className="card-frame">
        <img src={src} alt={item.title || item.name} className="card-img" loading="lazy" />
        <button type="button" className="fav-btn" onClick={handleFav}>
          <i
            className={`${isFav ? 'fas' : 'far'} fa-heart${pulse ? ' hpulse' : ''}`}
            style={{ color: isFav ? '#e84040' : 'rgba(232,227,213,0.5)' }}
          />
        </button>
      </div>
    </Link>
  )
}

export default function Home() {
  const [welcomed,       setWelcomed]       = useState(false)
  const [releases,       setReleases]       = useState([])
  const [recommendations,setRecommendations]= useState([])
  const [favorites,      setFavorites]      = useState([])
  const [searchResults,  setSearchResults]  = useState([])
  const [loading,        setLoading]        = useState(true)
  const [section,        setSection]        = useState('releases')
  const [searching,      setSearching]      = useState(false)
  const [searchQuery,    setSearchQuery]    = useState('')
  const [scrolled,       setScrolled]       = useState(false)
  const [notif,          setNotif]          = useState(null)

  const notifTimer = useRef(null)
  const notifSrc   = useRef(null)
  const inputRef   = useRef(null)

  useEffect(() => {
    try { if (sessionStorage.getItem('yw')) setWelcomed(true) } catch {}
  }, [])

  const handleEnter = () => {
    try { sessionStorage.setItem('yw', '1') } catch {}
    setWelcomed(true)
  }

  const pushNotif = useCallback(({ src, icon, title, msg, ttl = 2600 }) => {
    clearTimeout(notifTimer.current)
    notifSrc.current = src || null
    const id = Date.now()
    setNotif({ id, icon, title, msg, closing: false })
    notifTimer.current = setTimeout(() => {
      setNotif(n => n?.id === id ? { ...n, closing: true } : n)
      notifSrc.current = null
    }, ttl)
  }, [])

  const dismissNotif = useCallback(() => {
    clearTimeout(notifTimer.current)
    notifSrc.current = null
    setNotif(n => n ? { ...n, closing: true } : null)
  }, [])

  useEffect(() => {
    if (!notif?.closing) return
    const t = setTimeout(() => setNotif(null), 280)
    return () => clearTimeout(t)
  }, [notif?.closing])

  const toggleInfo = useCallback(() => {
    if (notifSrc.current === 'info' && notif && !notif.closing) { dismissNotif(); return }
    pushNotif({ src: 'info', icon: 'fa-shield-halved', title: 'Proteção Recomendada', msg: 'Use Brave ou AdBlock para melhor experiência', ttl: 4000 })
  }, [notif, pushNotif, dismissNotif])

  const toggleTech = useCallback(() => {
    if (notifSrc.current === 'tech' && notif && !notif.closing) { dismissNotif(); return }
    pushNotif({ src: 'tech', icon: 'fa-microchip', title: 'Informações Técnicas', msg: 'v2.6.0 Slim · React 18 · TMDB API', ttl: 4000 })
  }, [notif, pushNotif, dismissNotif])

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60)
      if (window.scrollY > 10) dismissNotif()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [dismissNotif])

  useEffect(() => {
    const onClick = (e) => {
      if (!e.target.closest('.notif') && !e.target.closest('.rnd-btn')) dismissNotif()
    }
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [dismissNotif])

  useEffect(() => {
    if (searching) setTimeout(() => inputRef.current?.focus(), 40)
    else { setSearchResults([]); setSearchQuery('') }
  }, [searching])

  const fetchTMDB = async (url) => {
    try {
      const r = await fetch(url)
      if (!r.ok) throw 0
      return (await r.json()).results || []
    } catch { return [] }
  }

  const fetchPages = async (ep) => {
    const [a, b] = await Promise.all([fetchTMDB(`${ep}&page=1`), fetchTMDB(`${ep}&page=2`)])
    return [...a, ...b]
  }

  useEffect(() => { loadHome(); loadFavs() }, [])

  const loadHome = async () => {
    setLoading(true)
    const base = 'https://api.themoviedb.org/3'
    const [mn, tn, mp, tp] = await Promise.all([
      fetchPages(`${base}/movie/now_playing?api_key=${TMDB_KEY}&language=pt-BR`),
      fetchPages(`${base}/tv/on_the_air?api_key=${TMDB_KEY}&language=pt-BR`),
      fetchPages(`${base}/movie/popular?api_key=${TMDB_KEY}&language=pt-BR`),
      fetchPages(`${base}/tv/popular?api_key=${TMDB_KEY}&language=pt-BR`)
    ])
    setReleases(
      [...mn.map(i => ({ ...i, media_type: 'movie' })), ...tn.map(i => ({ ...i, media_type: 'tv' }))]
        .filter(i => i.poster_path)
        .sort((a, b) => new Date(b.release_date || b.first_air_date) - new Date(a.release_date || a.first_air_date))
        .slice(0, 36)
    )
    setRecommendations(
      [...mp.map(i => ({ ...i, media_type: 'movie' })), ...tp.map(i => ({ ...i, media_type: 'tv' }))]
        .filter(i => i.poster_path)
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 36)
    )
    setLoading(false)
  }

  const loadFavs = () => {
    try { setFavorites(JSON.parse(localStorage.getItem('ywFavs') || '[]')) }
    catch { setFavorites([]) }
  }

  const isFav = (item) => favorites.some(f => f.id === item.id && f.media_type === item.media_type)

  const toggleFavorite = (item) => {
    const has = favorites.some(f => f.id === item.id && f.media_type === item.media_type)
    const next = has
      ? favorites.filter(f => !(f.id === item.id && f.media_type === item.media_type))
      : [...favorites, { id: item.id, media_type: item.media_type, title: item.title || item.name, poster_path: item.poster_path }]
    setFavorites(next)
    try { localStorage.setItem('ywFavs', JSON.stringify(next)) } catch {}
    pushNotif(has
      ? { src: 'fav', icon: 'fa-info-circle',   title: 'Removido', msg: 'Retirado dos favoritos'   }
      : { src: 'fav', icon: 'fa-check-circle',  title: 'Favorito', msg: 'Adicionado aos favoritos' }
    )
  }

  const doSearch = async (q) => {
    if (!q.trim()) { setSearchResults([]); return }
    const base = 'https://api.themoviedb.org/3'
    const [mv, tv] = await Promise.all([
      fetchPages(`${base}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}&language=pt-BR`),
      fetchPages(`${base}/search/tv?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}&language=pt-BR`)
    ])
    setSearchResults(
      [...mv.map(i => ({ ...i, media_type: 'movie' })), ...tv.map(i => ({ ...i, media_type: 'tv' }))]
        .filter(i => i.poster_path)
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 40)
    )
  }

  const debouncedSearch = useDebounce(doSearch, 300)

  const handleSearch = (q) => { setSearchQuery(q); debouncedSearch(q) }

  const handleSetSection = (s) => { if (!searching) setSection(s) }

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Yoshikawa Player', url: location.href }) } catch {}
    }
  }

  const list       = searching ? searchResults : (section === 'favorites' ? favorites : section === 'releases' ? releases : recommendations)
  const pageTitle  = searching ? 'Resultados' : LABELS[section]
  const topLabel   = scrolled  ? pageTitle : 'Yoshikawa'
  const rightIcon  = scrolled  ? 'fa-chevron-up' : 'fa-info-circle'
  const onRightBtn = (e) => { e.stopPropagation(); scrolled ? window.scrollTo({ top: 0, behavior: 'smooth' }) : toggleInfo() }

  const showLoader = loading
  const showEmpty  = !loading && list.length === 0
  const showGrid   = !loading && list.length > 0

  return (
    <>
      <Head>
        <title>Yoshikawa Player</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style>{css}</style>
      </Head>

      {!welcomed && <WelcomeScreen onEnter={handleEnter} />}

      <header className={`bar top-bar${scrolled ? ' top-lifted' : ''}`}>
        <button type="button" className="rnd-btn" onClick={(e) => { e.stopPropagation(); toggleTech() }}>
          <i className="fas fa-microchip" />
        </button>
        <div className="pill">
          <span className="pill-label" key={topLabel}>{topLabel}</span>
        </div>
        <button type="button" className="rnd-btn" onClick={onRightBtn}>
          <i className={`fas ${rightIcon}`} />
        </button>
      </header>

      {notif && <Notification key={notif.id} notif={notif} onDismiss={dismissNotif} />}

      <main className="container">
        <div className="section-header">
          <h1 className="section-title">{pageTitle}</h1>
          <div className="tdots">
            <span className="tdot tdot-r" />
            <span className="tdot tdot-y" />
            <span className="tdot tdot-g" />
          </div>
        </div>

        {showLoader && (
          <div className="empty-state">
            <div className="spinner" />
          </div>
        )}

        {showEmpty && (
          <div className="empty-state">
            {searching && searchQuery.trim() ? (
              <><i className="fas fa-ghost" /><p>Nada encontrado</p></>
            ) : section === 'favorites' ? (
              <><i className="far fa-folder-open" /><p>Lista vazia</p></>
            ) : null}
          </div>
        )}

        {showGrid && (
          <div className="grid" key={section + (searching ? '-s' : '')}>
            {list.map((item, i) => (
              <MovieCard
                key={`${item.media_type}-${item.id}`}
                item={item}
                isFav={isFav(item)}
                onFav={toggleFavorite}
                delay={Math.min(i * 26, 520)}
              />
            ))}
          </div>
        )}

        <footer className="page-footer">
          <p className="footer-text">
            Yoshikawa ESM · Desenvolvida por{' '}
            <a href="https://github.com/kawa-lyansky" rel="noopener noreferrer">
              <span className="footer-credit">@kawalyansky</span>
            </a>
            <br />
            <a href="https://kawa-lyansky.github.io/yoshikawa">Página principal</a>
            {' · '}
            <a href="https://yoshikawa-bot.github.io/termos" rel="noopener noreferrer">Termos de uso</a>
          </p>
        </footer>
      </main>

      <div className="bar bottom-bar">
        <button type="button" className="rnd-btn" onClick={handleShare}>
          <i className="fas fa-arrow-up-from-bracket" />
        </button>
        <div className="pill">
          {searching ? (
            <div className="search-inner">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                onKeyDown={e => e.key === 'Escape' && setSearching(false)}
                placeholder="Buscar..."
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
          ) : (
            <>
              <button type="button" className={`nav-btn${section === 'releases'        ? ' nav-active' : ''}`} onClick={() => handleSetSection('releases')}>
                <i className="fas fa-film" />
              </button>
              <button type="button" className={`nav-btn${section === 'recommendations' ? ' nav-active' : ''}`} onClick={() => handleSetSection('recommendations')}>
                <i className="fas fa-fire-flame-curved" />
              </button>
              <button type="button" className={`nav-btn${section === 'favorites'       ? ' nav-active' : ''}`} onClick={() => handleSetSection('favorites')}>
                <i className="fas fa-heart" />
              </button>
            </>
          )}
        </div>
        <button type="button" className="rnd-btn" onClick={() => setSearching(s => !s)}>
          <i className={`fas ${searching ? 'fa-xmark' : 'fa-magnifying-glass'}`} />
        </button>
      </div>
    </>
  )
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

  * { margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
  html { scroll-behavior:smooth; }
  body {
    font-family:'DM Sans',sans-serif;
    background:#262624;
    color:#FAF9F5;
    min-height:100vh;
    overflow-x:hidden;
  }
  a { color:inherit; text-decoration:none; }
  button { font-family:inherit; border:none; outline:none; background:none; cursor:pointer; user-select:none; }
  img { max-width:100%; height:auto; display:block; }

  .wpage {
    position:fixed;
    inset:0;
    z-index:9000;
    background:#262624;
    display:flex;
    flex-direction:column;
    overflow-y:auto;
    animation:wpIn .3s ease forwards;
  }
  .wpage.wpage-out { animation:wpOut .44s cubic-bezier(.25,.46,.45,.94) forwards; }
  @keyframes wpIn  { from{opacity:0} to{opacity:1} }
  @keyframes wpOut { from{opacity:1;transform:none} to{opacity:0;transform:translateY(-18px)} }

  .wpage-nav {
    display:flex;
    align-items:center;
    justify-content:space-between;
    padding:1.1rem 2rem;
    border-bottom:0.5px solid rgba(232,227,213,0.1);
    flex-shrink:0;
  }
  .wpage-logo {
    font-family:'Instrument Serif',serif;
    font-size:22px;
    font-weight:700;
    letter-spacing:.01em;
    color:#FAF9F5;
  }
  .hl { color:#DB7757; }
  .wpage-badge {
    font-size:10px;
    font-weight:500;
    letter-spacing:.08em;
    text-transform:uppercase;
    color:#9D9A93;
    border:0.5px solid rgba(232,227,213,0.18);
    padding:3px 10px;
    border-radius:99px;
  }

  .wpage-body {
    padding:3.5rem 2rem 3rem;
    max-width:580px;
    animation:fadeUp .45s cubic-bezier(.34,1.56,.64,1) .1s backwards;
  }

  .wpage-eyebrow {
    font-size:11px;
    font-weight:500;
    letter-spacing:.1em;
    text-transform:uppercase;
    color:#9D9A93;
    margin-bottom:12px;
  }
  .wpage-title {
    font-family:'Instrument Serif',serif;
    font-size:clamp(2rem,6vw,3.2rem);
    font-weight:700;
    line-height:1.15;
    color:#FAF9F5;
    margin-bottom:10px;
  }
  .wpage-title em { font-style:italic; color:#DB7757; }
  .wpage-desc {
    font-size:15px;
    color:#9D9A93;
    font-weight:300;
    line-height:1.7;
    margin-bottom:1.8rem;
  }
  .wpage-notice {
    display:flex;
    align-items:flex-start;
    gap:12px;
    background:#30302E;
    border-radius:8px;
    padding:1.3rem 1.4rem;
    margin-bottom:2rem;
  }
  .wpage-notice-icon {
    flex-shrink:0;
    width:18px;
    height:18px;
    margin-top:1px;
    color:#DB7757;
  }
  .wpage-notice-icon svg { width:18px; height:18px; }
  .wpage-notice-text {
    font-size:13px;
    color:#9D9A93;
    line-height:1.65;
    font-weight:300;
  }
  .wpage-notice-text strong { color:#FAF9F5; font-weight:500; }
  .wpage-actions { display:flex; }
  .wpage-btn {
    background:#FAF9F5;
    color:#1a1915;
    border:none;
    padding:10px 22px;
    border-radius:6px;
    font-size:14px;
    font-weight:500;
    font-family:'DM Sans',sans-serif;
    letter-spacing:.01em;
    transition:background .2s;
  }
  .wpage-btn:hover  { background:#d4cfc0; }
  .wpage-btn:active { transform:scale(.98); }

  .bar {
    position:fixed;
    left:50%;
    transform:translateX(-50%);
    display:flex;
    align-items:center;
    gap:10px;
    width:90%;
    max-width:520px;
    z-index:1000;
    transition:transform .3s cubic-bezier(.25,.46,.45,.94);
  }
  .top-bar    { top:20px; }
  .bottom-bar { bottom:20px; }
  .top-lifted { transform:translateX(-50%) translateY(-4px); }

  .rnd-btn {
    width:44px;
    height:44px;
    min-width:44px;
    border-radius:50%;
    display:flex;
    align-items:center;
    justify-content:center;
    background:#30302E;
    border:0.5px solid rgba(232,227,213,0.1);
    color:rgba(232,227,213,0.55);
    font-size:13px;
    transition:transform .22s cubic-bezier(.34,1.56,.64,1), color .18s;
  }
  .rnd-btn:hover  { transform:scale(1.07); color:#FAF9F5; }
  .rnd-btn:active { transform:scale(.9); }

  .pill {
    height:44px;
    flex:1;
    border-radius:50px;
    background:#30302E;
    border:0.5px solid rgba(232,227,213,0.1);
    display:flex;
    align-items:center;
    justify-content:center;
    overflow:hidden;
  }

  .pill-label {
    font-size:14px;
    font-weight:500;
    color:#FAF9F5;
    white-space:nowrap;
    letter-spacing:.01em;
    animation:lblIn .3s cubic-bezier(.34,1.56,.64,1) forwards;
  }
  @keyframes lblIn {
    from{opacity:0;transform:translateY(6px) scale(.95)}
    to{opacity:1;transform:none}
  }

  .notif {
    position:fixed;
    top:calc(20px + 44px + 10px);
    left:50%;
    z-index:950;
    width:90%;
    max-width:310px;
    display:flex;
    align-items:center;
    gap:12px;
    padding:13px 15px;
    border-radius:10px;
    background:#30302E;
    border:0.5px solid rgba(232,227,213,0.22);
    cursor:pointer;
    animation:notifIn .36s cubic-bezier(.34,1.56,.64,1) forwards;
  }
  .notif.notif-out { animation:notifOut .24s cubic-bezier(.25,.46,.45,.94) forwards; }
  @keyframes notifIn  { from{opacity:0;transform:translateX(-50%) translateY(-12px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
  @keyframes notifOut { from{opacity:1;transform:translateX(-50%) translateY(0)} to{opacity:0;transform:translateX(-50%) translateY(-10px)} }

  .notif-icon {
    width:32px;
    height:32px;
    min-width:32px;
    border-radius:7px;
    background:rgba(219,119,87,.1);
    border:0.5px solid rgba(219,119,87,.22);
    display:flex;
    align-items:center;
    justify-content:center;
    flex-shrink:0;
  }
  .notif-icon i { font-size:13px; color:#DB7757; }
  .notif-title  { font-size:13px; font-weight:500; color:#FAF9F5; margin-bottom:2px; }
  .notif-msg    { font-size:11.5px; color:#9D9A93; font-weight:300; line-height:1.45; }

  .container {
    max-width:1280px;
    margin:0 auto;
    padding:6.25rem 2rem 6.5rem;
  }

  .section-header {
    display:flex;
    align-items:center;
    justify-content:space-between;
    margin-bottom:1.4rem;
    animation:fadeUp .42s cubic-bezier(.34,1.56,.64,1) forwards;
  }
  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }

  .section-title {
    font-family:'Instrument Serif',serif;
    font-size:1.35rem;
    font-weight:400;
    letter-spacing:.01em;
    color:#FAF9F5;
  }

  .tdots { display:flex; align-items:center; gap:6px; }
  .tdot  { width:7px; height:7px; border-radius:50%; }
  .tdot-r { background:#c96060; }
  .tdot-y { background:#DB7757; }
  .tdot-g { background:#72b87a; }

  .grid {
    display:grid;
    grid-template-columns:repeat(auto-fill,minmax(140px,1fr));
    gap:18px 10px;
  }

  .card {
    display:block;
    animation:cardIn .46s cubic-bezier(.34,1.56,.64,1) both;
  }
  @keyframes cardIn {
    from{opacity:0;transform:translateY(22px) scale(.94)}
    to{opacity:1;transform:none}
  }

  .card-frame {
    position:relative;
    border-radius:11px;
    overflow:hidden;
    aspect-ratio:2/3;
    background:#30302E;
    border:0.5px solid rgba(232,227,213,0.16);
    transition:transform .32s cubic-bezier(.34,1.56,.64,1), border-color .22s ease;
  }
  .card:hover .card-frame  { transform:translateY(-5px); border-color:rgba(232,227,213,0.34); }
  .card:active .card-frame { transform:scale(.97); }

  .card-img {
    width:100%;
    height:100%;
    object-fit:cover;
    transition:transform .4s cubic-bezier(.34,1.56,.64,1);
  }
  .card:hover .card-img { transform:scale(1.06); }

  .fav-btn {
    position:absolute;
    top:7px;
    right:7px;
    width:28px;
    height:28px;
    border-radius:50%;
    display:flex;
    align-items:center;
    justify-content:center;
    background:#1a1915;
    border:0.5px solid rgba(232,227,213,0.12);
    font-size:10.5px;
    opacity:0;
    transform:scale(.82);
    transition:opacity .22s cubic-bezier(.34,1.56,.64,1), transform .22s cubic-bezier(.34,1.56,.64,1);
    z-index:5;
  }
  .card-frame:hover .fav-btn { opacity:1; transform:scale(1); }
  .fav-btn:hover  { transform:scale(1.1); }
  .fav-btn:active { transform:scale(.88); }
  @media (hover:none) { .fav-btn { opacity:1; transform:scale(1); } }

  .hpulse { animation:hp .38s cubic-bezier(.34,1.56,.64,1); }
  @keyframes hp { 0%{transform:scale(1)} 50%{transform:scale(1.65)} 100%{transform:scale(1)} }

  .nav-btn {
    flex:1;
    display:flex;
    align-items:center;
    justify-content:center;
    height:100%;
    color:rgba(232,227,213,0.35);
    font-size:17px;
    transition:color .18s;
  }
  .nav-btn:hover    { color:rgba(232,227,213,0.65); }
  .nav-btn.nav-active { color:#FAF9F5; }

  .search-inner {
    width:100%;
    padding:0 14px;
    animation:sIn .26s cubic-bezier(.34,1.56,.64,1);
  }
  @keyframes sIn { from{opacity:0;transform:scaleX(.9)} to{opacity:1;transform:scaleX(1)} }
  .search-inner input {
    width:100%;
    background:transparent;
    border:none;
    outline:none;
    color:#FAF9F5;
    font-size:14px;
    font-family:'DM Sans',sans-serif;
  }
  .search-inner input::placeholder { color:#9D9A93; }

  .empty-state {
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:10px;
    color:#9D9A93;
    margin-top:4rem;
    font-size:13px;
    font-weight:300;
    animation:fadeUp .4s cubic-bezier(.34,1.56,.64,1) forwards;
  }
  .empty-state i { font-size:1.5rem; color:rgba(232,227,213,0.22); margin-bottom:4px; }

  .spinner {
    width:20px;
    height:20px;
    border:1.5px solid rgba(232,227,213,0.14);
    border-top-color:#9D9A93;
    border-radius:50%;
    animation:spin .65s linear infinite;
  }
  @keyframes spin { to{transform:rotate(360deg)} }

  .page-footer {
    margin-top:3rem;
    padding:2rem;
    text-align:center;
    border-top:0.5px solid rgba(232,227,213,0.08);
  }
  .footer-text  { font-size:12px; color:rgba(232,227,213,0.22); line-height:1.9; }
  .footer-text a { color:rgba(232,227,213,0.38); }
  .footer-text a:hover { color:rgba(232,227,213,0.6); }
  .footer-credit { font-family:'Instrument Serif',serif; font-style:italic; color:#DB7757; }

  @media (max-width:640px) {
    .container  { padding:5.75rem 1rem 6.5rem; }
    .grid       { grid-template-columns:repeat(2,1fr)!important; gap:14px 8px; }
    .bar        { width:94%; gap:8px; }
    .card-frame { border-radius:9px; }
    .wpage-body { padding:2.5rem 1.25rem 3rem; }
    .wpage-nav  { padding:1.1rem 1.25rem; }
    .notif      { max-width:280px; }
  }
`
