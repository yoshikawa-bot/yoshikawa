import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'

const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
const DEFAULT_POSTER = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'

const SECTION_TITLES = {
  releases: 'Lançamentos',
  recommendations: 'Populares',
  favorites: 'Favoritos'
}

const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null)
  return useCallback((...args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => callback(...args), delay)
  }, [callback, delay])
}

const getItemKey = (item) => `${item.media_type}-${item.id}`

// ─── WelcomeScreen ────────────────────────────────────────────────────────────
export const WelcomeScreen = ({ onEnter }) => {
  const [closing, setClosing] = useState(false)
  const handleEnter = () => { setClosing(true); setTimeout(onEnter, 600) }

  return (
    <div className={`welcome-overlay${closing ? ' closing' : ''}`}>
      <div className="welcome-bar-row welcome-top-row">
        <button className="esm-round-btn" type="button">
          <i className="fas fa-play" style={{ fontSize: '11px', transform: 'translateX(1px)' }} />
        </button>
        <div className="esm-pill">
          <span className="esm-pill-label">Yoshikawa Player</span>
        </div>
        <button className="esm-round-btn" type="button">
          <i className="fas fa-info-circle" style={{ fontSize: '12px' }} />
        </button>
      </div>

      <div className="welcome-content">
        <h1 className="welcome-title">Yoshikawa <em>Player</em></h1>
        <p className="welcome-subtitle">Uso Interno · Yoshikawa Bot</p>
        <div className="welcome-divider" />
        <p className="welcome-text">
          Este site é de uso interno exclusivo para usuários da{' '}
          <strong>Yoshikawa Bot</strong>. Não hospeda nem direciona nenhum
          conteúdo — utiliza apenas uma <strong>API pública de embed</strong>.
          O projeto é totalmente <strong>open source</strong> e não viola
          direitos autorais nem leis de copyright.
        </p>
        <button className="welcome-enter-btn" type="button" onClick={handleEnter}>
          Entrar
        </button>
      </div>

      <div className="welcome-bar-row welcome-bottom-row">
        <button className="esm-round-btn" type="button">
          <i className="fas fa-arrow-up-from-bracket" style={{ fontSize: '12px', transform: 'translateY(-1px)' }} />
        </button>
        <div className="esm-pill" style={{ justifyContent: 'space-around' }}>
          <button className="esm-nav-btn" type="button"><i className="fas fa-film" /></button>
          <button className="esm-nav-btn" type="button"><i className="fas fa-fire-flame-curved" /></button>
          <button className="esm-nav-btn" type="button"><i className="fas fa-heart" /></button>
        </div>
        <button className="esm-round-btn" type="button">
          <i className="fas fa-magnifying-glass" style={{ fontSize: '12px' }} />
        </button>
      </div>
    </div>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────
export const Header = ({ label, scrolled, showInfo, toggleInfo, infoClosing, showTech, toggleTech, techClosing }) => {
  const handleRightClick = (e) => {
    e.stopPropagation()
    scrolled ? window.scrollTo({ top: 0, behavior: 'smooth' }) : toggleInfo()
  }

  return (
    <>
      <header className={`bar-container top-bar${scrolled ? ' scrolled-state' : ''}`}>
        <button
          className="esm-round-btn"
          type="button"
          onClick={(e) => { e.stopPropagation(); toggleTech() }}
          title="Info Técnica"
        >
          <i className="fas fa-microchip" style={{ fontSize: '13px' }} />
        </button>
        <div className="esm-pill">
          <span key={label} className="bar-label">{label}</span>
        </div>
        <button
          className="esm-round-btn"
          type="button"
          onClick={handleRightClick}
          title={scrolled ? 'Voltar ao topo' : 'Informações'}
        >
          <i className={scrolled ? 'fas fa-chevron-up' : 'fas fa-info-circle'} style={{ fontSize: '13px' }} />
        </button>
      </header>

      {showInfo && (
        <div className={`esm-popup${infoClosing ? ' closing' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="popup-icon-box">
            <i className="fas fa-shield-halved" />
          </div>
          <div className="popup-body">
            <p className="popup-title">Proteção Recomendada</p>
            <p className="popup-desc">Use <strong>Brave</strong> ou <strong>AdBlock</strong> para melhor experiência</p>
          </div>
        </div>
      )}

      {showTech && (
        <div className={`esm-popup${techClosing ? ' closing' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="popup-icon-box">
            <i className="fas fa-microchip" />
          </div>
          <div className="popup-body">
            <p className="popup-title">Informações Técnicas</p>
            <p className="popup-desc">v2.6.0 · Next.js · TMDB API</p>
          </div>
        </div>
      )}
    </>
  )
}

// ─── BottomNav ────────────────────────────────────────────────────────────────
export const BottomNav = ({
  activeSection, setActiveSection,
  searchActive, setSearchActive,
  searchQuery, setSearchQuery,
  onSearchSubmit, inputRef
}) => {
  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Yoshikawa Player', url: window.location.href }) } catch {}
    } else {
      alert('Compartilhar não suportado neste navegador')
    }
  }

  return (
    <div className="bar-container bottom-bar">
      <button className="esm-round-btn" type="button" onClick={handleShare} title="Compartilhar">
        <i className="fas fa-arrow-up-from-bracket" style={{ fontSize: '13px', transform: 'translateY(-1px)' }} />
      </button>

      <div className={`esm-pill${searchActive ? ' search-mode' : ''}`}>
        {searchActive ? (
          <div className="search-wrap">
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar filme ou série..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onSearchSubmit(searchQuery)}
            />
          </div>
        ) : (
          <>
            <button
              className={`esm-nav-btn${activeSection === 'releases' ? ' active' : ''}`}
              type="button"
              onClick={() => setActiveSection('releases')}
            >
              <i className="fas fa-film" />
            </button>
            <button
              className={`esm-nav-btn${activeSection === 'recommendations' ? ' active' : ''}`}
              type="button"
              onClick={() => setActiveSection('recommendations')}
            >
              <i className="fas fa-fire-flame-curved" />
            </button>
            <button
              className={`esm-nav-btn${activeSection === 'favorites' ? ' active' : ''}`}
              type="button"
              onClick={() => setActiveSection('favorites')}
            >
              <i className="fas fa-heart" />
            </button>
          </>
        )}
      </div>

      <button className="esm-round-btn" type="button" onClick={() => setSearchActive(s => !s)}>
        <i
          className={searchActive ? 'fas fa-xmark' : 'fas fa-magnifying-glass'}
          style={{ fontSize: searchActive ? '17px' : '13px' }}
        />
      </button>
    </div>
  )
}

// ─── ToastContainer ───────────────────────────────────────────────────────────
export const ToastContainer = ({ toast, closeToast }) => {
  if (!toast) return null
  const icons = { success: 'fa-check', error: 'fa-exclamation', info: 'fa-info' }
  const labels = { success: 'Sucesso', error: 'Erro', info: 'Info' }
  return (
    <div className="toast-wrap">
      <div
        className={`esm-toast ${toast.type}${toast.closing ? ' closing' : ''}`}
        onClick={closeToast}
      >
        <div className="toast-icon-box">
          <i className={`fas ${icons[toast.type] || 'fa-info'}`} />
        </div>
        <div className="toast-body">
          <div className="toast-title">{labels[toast.type] || 'Info'}</div>
          <div className="toast-msg">{toast.message}</div>
        </div>
      </div>
    </div>
  )
}

// ─── MovieCard ────────────────────────────────────────────────────────────────
export const MovieCard = ({ item, isFavorite, toggleFavorite }) => {
  const [animating, setAnimating] = useState(false)

  const handleFavClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setAnimating(true)
    toggleFavorite(item)
    setTimeout(() => setAnimating(false), 400)
  }

  return (
    <Link href={`/${item.media_type}/${item.id}`} className="card-wrapper">
      <div className="card-poster-frame">
        <img
          src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : DEFAULT_POSTER}
          alt={item.title || item.name}
          className="content-poster"
          loading="lazy"
        />
        <button className="fav-btn" type="button" onClick={handleFavClick}>
          <i
            className={`${isFavorite ? 'fas fa-heart' : 'far fa-heart'}${animating ? ' heart-pulse' : ''}`}
            style={{ color: isFavorite ? 'var(--accent)' : 'var(--text-pale)', fontSize: '13px' }}
          />
        </button>
      </div>
    </Link>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
export const Footer = () => (
  <footer className="footer-bar">
    <p className="footer-text">
      Yoshikawa Player · Criado por{' '}
      <a href="https://github.com/kawa-lyansky" rel="noopener noreferrer">
        <span className="footer-credit">@kawalyansky</span>
      </a>
    </p>
    <p className="footer-sub">Next.js · TMDB API · v2.6.0</p>
  </footer>
)

// ─── Home ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [welcomed, setWelcomed] = useState(false)
  const [releases, setReleases] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [favorites, setFavorites] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSection, setActiveSection] = useState('releases')
  const [searchActive, setSearchActive] = useState(false)
  const [currentToast, setCurrentToast] = useState(null)
  const [toastQueue, setToastQueue] = useState([])
  const [scrolled, setScrolled] = useState(false)
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [infoClosing, setInfoClosing] = useState(false)
  const [showTechPopup, setShowTechPopup] = useState(false)
  const [techClosing, setTechClosing] = useState(false)
  const searchInputRef = useRef(null)
  const toastTimerRef = useRef(null)

  useEffect(() => {
    try { if (sessionStorage.getItem('yoshikawaWelcomed')) setWelcomed(true) } catch {}
  }, [])

  const handleEnter = () => {
    try { sessionStorage.setItem('yoshikawaWelcomed', '1') } catch {}
    setWelcomed(true)
  }

  const showToast = (message, type = 'info') => {
    if (showInfoPopup || showTechPopup) closeAllPopups()
    if (currentToast && !currentToast.closing) {
      setCurrentToast(prev => ({ ...prev, closing: true }))
      setTimeout(() => setToastQueue(prev => [...prev, { message, type, id: Date.now() }]), 200)
    } else {
      setToastQueue(prev => [...prev, { message, type, id: Date.now() }])
    }
  }

  useEffect(() => {
    if (toastQueue.length > 0) {
      if (currentToast && !currentToast.closing) {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
        setCurrentToast(prev => ({ ...prev, closing: true }))
      } else if (!currentToast) {
        const next = toastQueue[0]
        setToastQueue(prev => prev.slice(1))
        setCurrentToast({ ...next, closing: false })
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
        toastTimerRef.current = setTimeout(() => {
          setCurrentToast(t => (t && t.id === next.id ? { ...t, closing: true } : t))
        }, 2500)
      }
    }
  }, [toastQueue, currentToast])

  useEffect(() => {
    if (currentToast?.closing) {
      const t = setTimeout(() => setCurrentToast(null), 400)
      return () => clearTimeout(t)
    }
  }, [currentToast])

  const manualCloseToast = () => {
    if (currentToast) setCurrentToast({ ...currentToast, closing: true })
  }

  const closeAllPopups = useCallback(() => {
    if (showInfoPopup && !infoClosing) {
      setInfoClosing(true)
      setTimeout(() => { setShowInfoPopup(false); setInfoClosing(false) }, 400)
    }
    if (showTechPopup && !techClosing) {
      setTechClosing(true)
      setTimeout(() => { setShowTechPopup(false); setTechClosing(false) }, 400)
    }
    if (currentToast && !currentToast.closing) {
      setCurrentToast(prev => ({ ...prev, closing: true }))
    }
  }, [showInfoPopup, infoClosing, showTechPopup, techClosing, currentToast])

  const toggleInfoPopup = () => {
    if (showTechPopup || currentToast) {
      closeAllPopups()
      setTimeout(() => { if (!showInfoPopup) setShowInfoPopup(true) }, 200)
    } else {
      if (showInfoPopup) {
        setInfoClosing(true)
        setTimeout(() => { setShowInfoPopup(false); setInfoClosing(false) }, 400)
      } else {
        setShowInfoPopup(true)
      }
    }
  }

  const toggleTechPopup = () => {
    if (showInfoPopup || currentToast) {
      closeAllPopups()
      setTimeout(() => { if (!showTechPopup) setShowTechPopup(true) }, 200)
    } else {
      if (showTechPopup) {
        setTechClosing(true)
        setTimeout(() => { setShowTechPopup(false); setTechClosing(false) }, 400)
      } else {
        setShowTechPopup(true)
      }
    }
  }

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 10) closeAllPopups()
      setScrolled(window.scrollY > 60)
    }
    const onClick = (e) => {
      if (
        !e.target.closest('.esm-popup') &&
        !e.target.closest('.esm-toast') &&
        !e.target.closest('.esm-round-btn') &&
        !e.target.closest('.esm-pill')
      ) {
        closeAllPopups()
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('click', onClick)
    }
  }, [closeAllPopups])

  useEffect(() => { loadHomeContent(); loadFavorites() }, [])

  useEffect(() => {
    if (searchActive && searchInputRef.current) searchInputRef.current.focus()
    if (!searchActive) { setSearchResults([]); setSearchQuery('') }
  }, [searchActive])

  const fetchTMDB = async (url) => {
    try {
      const r = await fetch(url)
      if (!r.ok) throw new Error('Network error')
      const d = await r.json()
      return d.results || []
    } catch { return [] }
  }

  const fetchTMDBPages = async (endpoint) => {
    try {
      const [p1, p2] = await Promise.all([
        fetchTMDB(`${endpoint}&page=1`),
        fetchTMDB(`${endpoint}&page=2`)
      ])
      return [...p1, ...p2]
    } catch { return [] }
  }

  const fetchSearchResults = async (query) => {
    if (!query.trim()) { setSearchResults([]); setLoading(false); return }
    setLoading(true)
    try {
      const [movies, tv] = await Promise.all([
        fetchTMDBPages(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`),
        fetchTMDBPages(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`)
      ])
      const combined = [
        ...movies.map(i => ({ ...i, media_type: 'movie' })),
        ...tv.map(i => ({ ...i, media_type: 'tv' }))
      ].filter(i => i.poster_path).sort((a, b) => b.popularity - a.popularity).slice(0, 40)
      setSearchResults(combined)
    } catch {
      showToast('Erro na busca', 'error')
      setSearchResults([])
    } finally { setLoading(false) }
  }

  const debouncedSearch = useDebounce(fetchSearchResults, 300)

  const handleSearchChange = (q) => {
    setSearchQuery(q)
    if (!q.trim()) { setSearchResults([]); setLoading(false); return }
    setLoading(true)
    debouncedSearch(q)
  }

  const loadHomeContent = async () => {
    try {
      const [moviesNow, tvNow, moviesPopular, tvPopular] = await Promise.all([
        fetchTMDBPages(`https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&language=pt-BR`),
        fetchTMDBPages(`https://api.themoviedb.org/3/tv/on_the_air?api_key=${TMDB_API_KEY}&language=pt-BR`),
        fetchTMDBPages(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=pt-BR`),
        fetchTMDBPages(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&language=pt-BR`)
      ])
      setReleases(
        [...moviesNow.map(i => ({ ...i, media_type: 'movie' })), ...tvNow.map(i => ({ ...i, media_type: 'tv' }))]
          .filter(i => i.poster_path)
          .sort((a, b) => new Date(b.release_date || b.first_air_date) - new Date(a.release_date || a.first_air_date))
          .slice(0, 36)
      )
      setRecommendations(
        [...moviesPopular.map(i => ({ ...i, media_type: 'movie' })), ...tvPopular.map(i => ({ ...i, media_type: 'tv' }))]
          .filter(i => i.poster_path)
          .sort((a, b) => b.popularity - a.popularity)
          .slice(0, 36)
      )
    } catch (e) { console.error('Load error:', e) }
  }

  const loadFavorites = () => {
    try {
      const stored = localStorage.getItem('yoshikawaFavorites')
      setFavorites(stored ? JSON.parse(stored) : [])
    } catch { setFavorites([]) }
  }

  const isFavorite = (item) => favorites.some(f => f.id === item.id && f.media_type === item.media_type)

  const toggleFavorite = (item) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === item.id && f.media_type === item.media_type)
      const updated = exists
        ? prev.filter(f => !(f.id === item.id && f.media_type === item.media_type))
        : [...prev, { id: item.id, media_type: item.media_type, title: item.title || item.name, poster_path: item.poster_path }]
      showToast(exists ? 'Removido dos favoritos' : 'Adicionado aos favoritos', exists ? 'info' : 'success')
      try { localStorage.setItem('yoshikawaFavorites', JSON.stringify(updated)) } catch { showToast('Erro ao salvar favoritos', 'error') }
      return updated
    })
  }

  const displayItems = searchActive
    ? searchResults
    : activeSection === 'releases' ? releases : activeSection === 'recommendations' ? recommendations : favorites

  const headerLabel = scrolled
    ? (searchActive ? 'Resultados' : SECTION_TITLES[activeSection] || 'Conteúdo')
    : 'Yoshikawa'

  const pageTitle = searchActive ? 'Resultados' : (SECTION_TITLES[activeSection] || 'Conteúdo')

  return (
    <>
      <Head>
        <title>Yoshikawa Player</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        <style>{`
          /* ── Reset ─────────────────────────────────────────────────────────── */
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
          html { scroll-behavior: smooth; }
          a { color: inherit; text-decoration: none; }
          button { font-family: inherit; border: none; outline: none; background: none; cursor: pointer; user-select: none; }
          img { max-width: 100%; height: auto; display: block; }

          /* ── Design Tokens ──────────────────────────────────────────────────── */
          :root {
            color-scheme: dark;
            --bg:            #262624;
            --bg-raised:     #1F1E1C;
            --bg-card:       #30302E;
            --bg-card-hover: #383734;
            --text:          #FAF9F5;
            --text-muted:    #9D9A93;
            --text-dim:      rgba(232, 227, 213, 0.45);
            --text-ghost:    rgba(232, 227, 213, 0.22);
            --text-faint:    rgba(232, 227, 213, 0.38);
            --text-pale:     rgba(232, 227, 213, 0.6);
            --accent:        #DB7757;
            --accent-bg:     rgba(219, 119, 87, 0.12);
            --accent-bg-hover: rgba(219, 119, 87, 0.2);
            --border:        rgba(232, 227, 213, 0.08);
            --border-nav:    rgba(232, 227, 213, 0.1);
            --border-btn:    rgba(232, 227, 213, 0.3);
            --hover-bg:      rgba(232, 227, 213, 0.07);
            --ease-elastic:  cubic-bezier(0.34, 1.56, 0.64, 1);
            --ease-smooth:   cubic-bezier(0.25, 0.46, 0.45, 0.94);
            --pill-height:   44px;
            --pill-max-width: 520px;
          }

          /* ── Body ───────────────────────────────────────────────────────────── */
          body {
            font-family: 'DM Sans', sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.6;
            min-height: 100vh;
            overflow-y: auto;
            overflow-x: hidden;
          }

          /* ── Welcome Overlay ────────────────────────────────────────────────── */
          .welcome-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: var(--bg-raised);
            animation: overlayIn 0.4s ease forwards;
          }
          .welcome-overlay.closing { animation: overlayOut 0.6s ease forwards; }
          @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes overlayOut { from { opacity: 1; } to { opacity: 0; } }

          .welcome-bar-row {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            align-items: center;
            gap: 10px;
            width: 90%;
            max-width: var(--pill-max-width);
          }
          .welcome-top-row { top: 20px; }
          .welcome-bottom-row { bottom: 20px; }

          .welcome-content {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            text-align: right;
            gap: 12px;
            width: 90%;
            max-width: 380px;
            animation: contentIn 0.55s var(--ease-elastic) 0.12s backwards;
          }
          @keyframes contentIn {
            from { opacity: 0; transform: translateY(28px); }
            to   { opacity: 1; transform: translateY(0); }
          }

          .welcome-title {
            font-family: 'Instrument Serif', serif;
            font-size: clamp(2rem, 6vw, 2.8rem);
            font-weight: 700;
            color: var(--text);
            line-height: 1.15;
            letter-spacing: 0.01em;
          }
          .welcome-title em { font-style: italic; color: var(--accent); }

          .welcome-subtitle {
            font-size: 11px;
            color: var(--text-muted);
            letter-spacing: 0.07em;
            text-transform: uppercase;
            font-weight: 400;
          }

          .welcome-divider {
            width: 40px;
            height: 0.5px;
            background: var(--border-btn);
          }

          .welcome-text {
            font-size: 13px;
            color: var(--text-dim);
            line-height: 1.65;
            font-weight: 300;
          }
          .welcome-text strong { color: var(--text-pale); font-weight: 500; }

          .welcome-enter-btn {
            background: transparent;
            color: var(--text);
            border: 0.5px solid var(--border-btn);
            padding: 9px 26px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 400;
            font-family: 'DM Sans', sans-serif;
            cursor: pointer;
            transition: background 0.2s, border-color 0.2s;
            margin-top: 4px;
          }
          .welcome-enter-btn:hover { background: var(--hover-bg); border-color: var(--text-muted); }
          .welcome-enter-btn:active { background: var(--bg-card); }

          /* ── Shared: Round Button ───────────────────────────────────────────── */
          .esm-round-btn {
            width: var(--pill-height);
            height: var(--pill-height);
            min-width: var(--pill-height);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-card);
            border: 0.5px solid var(--border-nav);
            color: var(--text-muted);
            cursor: pointer;
            flex-shrink: 0;
            transition: background 0.2s, color 0.2s, transform 0.2s var(--ease-elastic);
          }
          .esm-round-btn:hover { background: var(--bg-card-hover); color: var(--text); transform: scale(1.06); }
          .esm-round-btn:active { transform: scale(0.94); }

          /* ── Shared: Pill ───────────────────────────────────────────────────── */
          .esm-pill {
            height: var(--pill-height);
            flex: 1;
            border-radius: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-card);
            border: 0.5px solid var(--border-nav);
            overflow: hidden;
            transition: all 0.3s var(--ease-smooth);
          }

          .esm-pill-label,
          .bar-label {
            font-family: 'Instrument Serif', serif;
            font-size: 17px;
            font-weight: 400;
            color: var(--text);
            letter-spacing: 0.01em;
            animation: labelFadeIn 0.35s var(--ease-elastic) forwards;
          }
          @keyframes labelFadeIn {
            from { opacity: 0; transform: translateY(10px) scale(0.92); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }

          /* ── Nav Buttons inside Pill ────────────────────────────────────────── */
          .esm-nav-btn {
            flex: 1;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-muted);
            cursor: pointer;
            transition: color 0.2s;
          }
          .esm-nav-btn i { font-size: 16px; transition: transform 0.3s var(--ease-elastic); }
          .esm-nav-btn:hover { color: var(--text-pale); }
          .esm-nav-btn:hover i { transform: scale(1.18); }
          .esm-nav-btn:active i { transform: scale(0.9); }
          .esm-nav-btn.active { color: var(--accent); }
          .esm-nav-btn.active i { transform: scale(1.08); }

          /* ── Floating Bar Containers ────────────────────────────────────────── */
          .bar-container {
            position: fixed;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            width: 90%;
            max-width: var(--pill-max-width);
            transition: all 0.4s var(--ease-smooth);
          }
          .top-bar { top: 20px; }
          .bottom-bar { bottom: 20px; }
          .top-bar.scrolled-state { transform: translateX(-50%) translateY(-4px); }

          /* ── Info / Tech Popup ──────────────────────────────────────────────── */
          .esm-popup {
            position: fixed;
            top: calc(20px + var(--pill-height) + 14px);
            left: 50%;
            z-index: 950;
            min-width: 300px;
            max-width: 90%;
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 14px 16px;
            border-radius: 10px;
            background: var(--bg-card);
            border: 0.5px solid var(--border-nav);
            pointer-events: none;
            opacity: 0;
            animation: popupIn 0.42s var(--ease-elastic) forwards;
          }
          .esm-popup.closing { animation: popupOut 0.32s ease forwards; }

          @keyframes popupIn {
            from { opacity: 0; transform: translate(-50%, -16px) scale(0.9); }
            to   { opacity: 1; transform: translate(-50%, 0) scale(1); }
          }
          @keyframes popupOut {
            from { opacity: 1; transform: translate(-50%, 0) scale(1); }
            to   { opacity: 0; transform: translate(-50%, -12px) scale(0.92); }
          }

          .popup-icon-box {
            width: 38px;
            height: 38px;
            min-width: 38px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--accent-bg);
            flex-shrink: 0;
          }
          .popup-icon-box i { font-size: 16px; color: var(--accent); }

          .popup-body { display: flex; flex-direction: column; gap: 3px; }
          .popup-title { font-size: 13px; font-weight: 500; color: var(--text); margin: 0; }
          .popup-desc { font-size: 12px; color: var(--text-muted); margin: 0; font-weight: 300; line-height: 1.5; }
          .popup-desc strong { color: var(--text-pale); font-weight: 500; }

          /* ── Toast ──────────────────────────────────────────────────────────── */
          .toast-wrap {
            position: fixed;
            top: calc(20px + var(--pill-height) + 14px);
            left: 50%;
            z-index: 960;
            pointer-events: none;
          }

          .esm-toast {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border-radius: 10px;
            background: var(--bg-card);
            border: 0.5px solid var(--border-nav);
            min-width: 280px;
            max-width: 90vw;
            pointer-events: auto;
            cursor: pointer;
            transform: translateX(-50%);
            animation: toastIn 0.42s var(--ease-elastic) forwards;
          }
          .esm-toast.closing { animation: toastOut 0.32s ease forwards; }

          @keyframes toastIn {
            from { opacity: 0; transform: translateX(-50%) translateY(-14px) scale(0.9); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          }
          @keyframes toastOut {
            from { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
            to   { opacity: 0; transform: translateX(-50%) translateY(-10px) scale(0.92); }
          }

          .toast-icon-box {
            width: 32px;
            height: 32px;
            min-width: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .esm-toast.success .toast-icon-box { background: var(--accent-bg); }
          .esm-toast.info    .toast-icon-box { background: var(--hover-bg); }
          .esm-toast.error   .toast-icon-box { background: rgba(192, 80, 80, 0.12); }
          .esm-toast.success .toast-icon-box i { color: var(--accent); }
          .esm-toast.info    .toast-icon-box i { color: var(--text-muted); }
          .esm-toast.error   .toast-icon-box i { color: #C06070; }
          .toast-icon-box i { font-size: 13px; }

          .toast-body { display: flex; flex-direction: column; gap: 2px; }
          .toast-title { font-size: 13px; font-weight: 500; color: var(--text); }
          .toast-msg   { font-size: 12px; color: var(--text-muted); font-weight: 300; }

          /* ── Main Container ──────────────────────────────────────────────────── */
          .container {
            max-width: 1280px;
            margin: 0 auto;
            padding-top: 6.5rem;
            padding-bottom: 7rem;
            padding-left: 2rem;
            padding-right: 2rem;
          }

          /* ── Page Header ─────────────────────────────────────────────────────── */
          .page-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.5rem;
          }

          .page-title {
            font-family: 'Instrument Serif', serif;
            font-size: 20px;
            font-weight: 400;
            color: var(--text);
            letter-spacing: 0.02em;
          }

          .status-dots { display: flex; align-items: center; gap: 7px; }
          .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            animation: dotPulse 2.5s ease-in-out infinite;
          }
          .dot.red    { background: #C06070; animation-delay: 0s; }
          .dot.yellow { background: var(--text-muted); animation-delay: 0.4s; }
          .dot.green  { background: var(--accent); animation-delay: 0.8s; }
          @keyframes dotPulse {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50%      { opacity: 1;   transform: scale(1.28); }
          }

          /* ── Content Grid ────────────────────────────────────────────────────── */
          .content-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 20px 12px;
          }

          /* ── Movie Cards ─────────────────────────────────────────────────────── */
          .card-wrapper {
            display: flex;
            flex-direction: column;
            width: 100%;
            position: relative;
            animation: cardIn 0.45s var(--ease-elastic) backwards;
          }
          @keyframes cardIn {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }

          .card-wrapper:nth-child(1)  { animation-delay: 20ms; }
          .card-wrapper:nth-child(2)  { animation-delay: 50ms; }
          .card-wrapper:nth-child(3)  { animation-delay: 80ms; }
          .card-wrapper:nth-child(4)  { animation-delay: 110ms; }
          .card-wrapper:nth-child(5)  { animation-delay: 140ms; }
          .card-wrapper:nth-child(6)  { animation-delay: 170ms; }
          .card-wrapper:nth-child(7)  { animation-delay: 200ms; }
          .card-wrapper:nth-child(8)  { animation-delay: 230ms; }
          .card-wrapper:nth-child(9)  { animation-delay: 260ms; }
          .card-wrapper:nth-child(10) { animation-delay: 290ms; }
          .card-wrapper:nth-child(11) { animation-delay: 320ms; }
          .card-wrapper:nth-child(12) { animation-delay: 350ms; }
          .card-wrapper:nth-child(13) { animation-delay: 380ms; }
          .card-wrapper:nth-child(14) { animation-delay: 410ms; }
          .card-wrapper:nth-child(15) { animation-delay: 440ms; }
          .card-wrapper:nth-child(16) { animation-delay: 470ms; }
          .card-wrapper:nth-child(17) { animation-delay: 500ms; }
          .card-wrapper:nth-child(18) { animation-delay: 530ms; }
          .card-wrapper:nth-child(19) { animation-delay: 560ms; }
          .card-wrapper:nth-child(20) { animation-delay: 590ms; }

          .card-poster-frame {
            position: relative;
            border-radius: 10px;
            overflow: hidden;
            aspect-ratio: 2/3;
            background: var(--bg-raised);
            border: 0.5px solid var(--border);
            transition: border-color 0.2s, transform 0.25s var(--ease-smooth);
          }
          .card-wrapper:hover .card-poster-frame {
            border-color: rgba(232, 227, 213, 0.22);
            transform: translateY(-5px);
          }
          .card-wrapper:active .card-poster-frame { transform: scale(0.97); }

          .content-poster {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.5s var(--ease-smooth);
          }
          .card-wrapper:hover .content-poster { transform: scale(1.06); }

          .fav-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 30px;
            height: 30px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(38, 38, 36, 0.88);
            border: 0.5px solid var(--border);
            opacity: 0;
            transform: scale(0.82);
            transition: all 0.2s var(--ease-elastic);
            z-index: 20;
            cursor: pointer;
          }
          .card-poster-frame:hover .fav-btn { opacity: 1; transform: scale(1); }
          .fav-btn:hover { background: var(--bg-card); border-color: var(--border-btn); transform: scale(1.1); }
          .fav-btn:active { transform: scale(0.9); }

          @media (hover: none) { .fav-btn { opacity: 1; transform: scale(1); } }

          .heart-pulse { animation: heartZoom 0.4s var(--ease-elastic); }
          @keyframes heartZoom {
            0%   { transform: scale(1); }
            50%  { transform: scale(1.5); }
            100% { transform: scale(1); }
          }

          /* ── Search Input ────────────────────────────────────────────────────── */
          .search-wrap {
            width: 100%;
            padding: 0 16px;
            animation: searchIn 0.3s var(--ease-elastic);
          }
          @keyframes searchIn {
            from { opacity: 0; transform: scaleX(0.9); }
            to   { opacity: 1; transform: scaleX(1); }
          }
          .search-wrap input {
            width: 100%;
            background: transparent;
            border: none;
            outline: none;
            color: var(--text);
            font-size: 14px;
            font-family: 'DM Sans', sans-serif;
            font-weight: 400;
          }
          .search-wrap input::placeholder { color: var(--text-muted); font-weight: 300; }

          /* ── Empty States ────────────────────────────────────────────────────── */
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            color: var(--text-muted);
            margin-top: 4rem;
            gap: 10px;
            font-size: 14px;
            font-weight: 300;
            animation: emptyIn 0.4s ease forwards;
          }
          .empty-state i {
            font-size: 1.8rem;
            color: var(--text-ghost);
            margin-bottom: 4px;
            animation: floatIcon 3s ease-in-out infinite;
          }
          @keyframes floatIcon {
            0%, 100% { transform: translateY(0); }
            50%      { transform: translateY(-8px); }
          }
          @keyframes emptyIn {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }

          .spinner {
            width: 22px;
            height: 22px;
            border: 1.5px solid var(--border-nav);
            border-top-color: var(--accent);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }

          /* ── Footer ─────────────────────────────────────────────────────────── */
          .footer-bar {
            margin-top: 3rem;
            padding: 2rem;
            text-align: center;
            border-top: 0.5px solid var(--border);
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .footer-text { font-size: 12px; color: var(--text-ghost); line-height: 1.9; }
          .footer-text a { color: var(--text-faint); }
          .footer-text a:hover { color: var(--text-pale); }
          .footer-credit {
            font-family: 'Instrument Serif', serif;
            font-style: italic;
            color: var(--accent);
          }
          .footer-sub { font-size: 11px; color: var(--text-ghost); font-weight: 300; }

          /* ── Responsive ──────────────────────────────────────────────────────── */
          @media (max-width: 640px) {
            .container { padding-left: 1rem; padding-right: 1rem; }
            .content-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 14px 10px; }
            .bar-container { width: 94%; gap: 8px; }
            .card-poster-frame { border-radius: 8px; }
            .esm-popup, .esm-toast { min-width: 260px; padding: 12px 14px; }
            .popup-icon-box { width: 34px; height: 34px; min-width: 34px; }
            .popup-icon-box i { font-size: 14px; }
            .toast-icon-box { width: 28px; height: 28px; min-width: 28px; }
            .page-title { font-size: 18px; }
            .dot { width: 7px; height: 7px; }
          }
        `}</style>
      </Head>

      {!welcomed && <WelcomeScreen onEnter={handleEnter} />}

      <Header
        label={headerLabel}
        scrolled={scrolled}
        showInfo={showInfoPopup}
        toggleInfo={toggleInfoPopup}
        infoClosing={infoClosing}
        showTech={showTechPopup}
        toggleTech={toggleTechPopup}
        techClosing={techClosing}
      />

      <ToastContainer toast={currentToast} closeToast={manualCloseToast} />

      <main className="container">
        <div className="page-header">
          <h1 className="page-title">{pageTitle}</h1>
          <div className="status-dots">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
          </div>
        </div>

        {loading && (searchActive || releases.length === 0) && (
          <div className="empty-state">
            <div className="spinner" />
          </div>
        )}

        {searchActive && !loading && searchResults.length === 0 && searchQuery.trim() && (
          <div className="empty-state">
            <i className="fas fa-ghost" />
            <p>Nada encontrado</p>
          </div>
        )}

        {displayItems.length > 0 && !loading && (
          <div className="content-grid" key={activeSection + (searchActive ? '-search' : '')}>
            {displayItems.map(item => (
              <MovieCard
                key={getItemKey(item)}
                item={item}
                isFavorite={isFavorite(item)}
                toggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}

        {!searchActive && activeSection === 'favorites' && favorites.length === 0 && !loading && (
          <div className="empty-state">
            <i className="far fa-folder-open" />
            <p>Lista vazia</p>
          </div>
        )}

        <Footer />
      </main>

      <BottomNav
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        searchActive={searchActive}
        setSearchActive={setSearchActive}
        searchQuery={searchQuery}
        setSearchQuery={handleSearchChange}
        onSearchSubmit={debouncedSearch}
        inputRef={searchInputRef}
      />
    </>
  )
}
