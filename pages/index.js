import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'

const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
const DEFAULT_POSTER = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'
const DEFAULT_BACKDROP = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'

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

// --- HEADER (Topo) ---
// Botão Esquerdo: Caneta (Tech)
// Botão Direito: Info/Scroll
export const Header = ({ label, scrolled, showInfo, toggleInfo, infoClosing, showTech, toggleTech, techClosing }) => {
  const handleRightClick = (e) => {
    e.stopPropagation()
    if (scrolled) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      toggleInfo()
    }
  }

  return (
    <>
      <header className="bar-container top-bar">
        <button 
          className="round-btn glass-panel" 
          onClick={(e) => { e.stopPropagation(); toggleTech() }}
          title="Info Técnica"
        >
          <i className="fas fa-pen" style={{ fontSize: '13px' }}></i>
        </button>

        <div className="pill-container glass-panel">
          <span key={label} className="bar-label">{label}</span>
        </div>

        <button 
          className="round-btn glass-panel" 
          title={scrolled ? "Voltar ao topo" : "Informações"}
          onClick={handleRightClick}
        >
          <i className={scrolled ? "fas fa-chevron-up" : "fas fa-plus"} style={{ fontSize: '14px' }}></i>
        </button>
      </header>

      {/* Popups (Mantidos a lógica, ajustado visual) */}
      {showInfo && (
        <div 
          className={`info-popup glass-panel ${infoClosing ? 'closing' : ''}`} 
          onClick={(e) => e.stopPropagation()}
        >
          <i className="fas fa-shield-halved info-icon"></i>
          <p className="info-text">
            Use <strong>Brave</strong> ou <strong>AdBlock</strong>.
          </p>
        </div>
      )}

      {showTech && (
        <div 
          className={`info-popup glass-panel ${techClosing ? 'closing' : ''}`} 
          onClick={(e) => e.stopPropagation()}
        >
          <i className="fas fa-microchip info-icon" style={{ color: '#60a5fa' }}></i>
          <div className="info-text">
            <strong>Tech Data</strong>
            <ul style={{ listStyle: 'none', marginTop: '2px', fontSize: '0.75rem', opacity: 0.7 }}>
              <li>v2.6.0 Slim</li>
              <li>React 18 / TMDB</li>
            </ul>
          </div>
        </div>
      )}
    </>
  )
}

// --- NAVBAR (Inferior) ---
// Botão Esquerdo: Compartilhar (iOS)
// Botão Direito: Busca
export const BottomNav = ({
  activeSection, setActiveSection,
  searchActive, setSearchActive,
  searchQuery, setSearchQuery,
  onSearchSubmit, inputRef
}) => {
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Yoshikawa Player',
          url: window.location.href,
        })
      } catch (err) { console.log('Share canceled') }
    } else {
      alert('Compartilhar não suportado neste navegador')
    }
  }

  return (
    <div className="bar-container bottom-bar">
      {/* Botão Share Separado na Esquerda */}
      <button 
        className="round-btn glass-panel" 
        onClick={handleShare}
        title="Compartilhar"
      >
        <i className="fas fa-arrow-up-from-bracket" style={{ fontSize: '15px', transform: 'translateY(-1px)' }}></i>
      </button>

      {/* Pílula Central */}
      <div className={`pill-container glass-panel ${searchActive ? 'search-mode' : ''}`}>
        {searchActive ? (
          <div className="search-wrap">
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onSearchSubmit(searchQuery)}
            />
          </div>
        ) : (
          <>
            <button className={`nav-btn ${activeSection === 'releases' ? 'active' : ''}`} onClick={() => setActiveSection('releases')}>
              <i className="fas fa-film"></i>
            </button>
            <button className={`nav-btn ${activeSection === 'recommendations' ? 'active' : ''}`} onClick={() => setActiveSection('recommendations')}>
              <i className="fas fa-fire-flame-curved"></i>
            </button>
            <button className={`nav-btn ${activeSection === 'favorites' ? 'active' : ''}`} onClick={() => setActiveSection('favorites')}>
              <i className="fas fa-heart"></i>
            </button>
          </>
        )}
      </div>

      {/* Botão Busca Separado na Direita */}
      <button className="round-btn glass-panel" onClick={() => setSearchActive(s => !s)}>
        <i className={searchActive ? 'fas fa-xmark' : 'fas fa-magnifying-glass'} style={{ fontSize: searchActive ? '17px' : '15px' }}></i>
      </button>
    </div>
  )
}

export const ToastContainer = ({ toast, closeToast }) => {
  if (!toast) return null
  return (
    <div className="toast-wrap">
      <div className={`toast glass-panel ${toast.type} ${toast.closing ? 'closing' : ''}`} onClick={closeToast}>
        <div className="toast-icon">
          <i className={`fas ${toast.type === 'success' ? 'fa-check' : toast.type === 'error' ? 'fa-triangle-exclamation' : 'fa-info'}`}></i>
        </div>
        <div className="toast-msg">{toast.message}</div>
      </div>
    </div>
  )
}

export const HeroFixed = ({ item, isFavorite, toggleFavorite }) => {
  if (!item) return null

  const getBackdropUrl = (i) =>
    i.backdrop_path
      ? `https://image.tmdb.org/t/p/original${i.backdrop_path}`
      : i.poster_path
        ? `https://image.tmdb.org/t/p/w1280${i.poster_path}`
        : DEFAULT_BACKDROP

  const favActive = isFavorite(item)
  const [animating, setAnimating] = useState(false)

  const handleFav = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setAnimating(true)
    toggleFavorite(item)
    setTimeout(() => setAnimating(false), 400)
  }

  return (
    <div className="hero-static-container">
      <div className="hero-wrapper">
        <Link href={`/${item.media_type}/${item.id}`} style={{ display: 'block', width: '100%', height: '100%' }}>
          <div className="hero-backdrop">
            <img src={getBackdropUrl(item)} alt={item.title || item.name} draggable="false" />
            <div className="hero-overlay"></div>
            <div className="hero-content">
              {/* Removido Sinopse e Tags extras, mantendo clean */}
              <h2 className="hero-title">{item.title || item.name}</h2>
            </div>
          </div>
        </Link>
        <button 
          className="fav-btn glass-panel" 
          onClick={handleFav} 
          style={{ top: '16px', right: '16px' }}
        >
          <i
            className={`${favActive ? 'fas fa-heart' : 'far fa-heart'} ${animating ? 'heart-pulse' : ''}`}
            style={{ color: favActive ? '#ff3b30' : '#ffffff' }}
          ></i>
        </button>
      </div>
    </div>
  )
}

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
        <button className="fav-btn glass-panel" onClick={handleFavClick}>
          <i
            className={`${isFavorite ? 'fas fa-heart' : 'far fa-heart'} ${animating ? 'heart-pulse' : ''}`}
            style={{ color: isFavorite ? '#ff3b30' : '#ffffff' }}
          ></i>
        </button>
      </div>
      <span className="card-title">{item.title || item.name}</span>
    </Link>
  )
}

export const Footer = () => (
  <footer className="footer-credits">
    <p>Yoshikawa Systems &copy; {new Date().getFullYear()}</p>
  </footer>
)

export default function Home() {
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

  const showToast = (message, type = 'info') => {
    setToastQueue(prev => [...prev, { message, type, id: Date.now() }])
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

  const closePopups = useCallback(() => {
    if (showInfoPopup && !infoClosing) {
      setInfoClosing(true)
      setTimeout(() => { setShowInfoPopup(false); setInfoClosing(false) }, 300)
    }
    if (showTechPopup && !techClosing) {
      setTechClosing(true)
      setTimeout(() => { setShowTechPopup(false); setTechClosing(false) }, 300)
    }
  }, [showInfoPopup, infoClosing, showTechPopup, techClosing])

  const toggleInfoPopup = () => { 
    if (showTechPopup) closePopups()
    showInfoPopup ? closePopups() : setShowInfoPopup(true) 
  }

  const toggleTechPopup = () => {
    if (showInfoPopup) closePopups()
    showTechPopup ? closePopups() : setShowTechPopup(true)
  }

  useEffect(() => {
    const onScroll = () => { 
      if (window.scrollY > 10) closePopups()
      setScrolled(window.scrollY > 60) 
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    
    const onClick = (e) => { 
      if (!e.target.closest('.info-popup') && !e.target.closest('.round-btn') && !e.target.closest('.pill-container')) {
        closePopups() 
      }
    }
    window.addEventListener('click', onClick)
    
    return () => { 
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('click', onClick) 
    }
  }, [closePopups])

  useEffect(() => { 
    loadHomeContent()
    loadFavorites() 
  }, [])

  useEffect(() => {
    if (searchActive && searchInputRef.current) searchInputRef.current.focus()
    if (!searchActive) { 
      setSearchResults([])
      setSearchQuery('') 
    }
  }, [searchActive])

  const fetchTMDB = async (url) => {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Network error')
      const data = await response.json()
      return data.results || []
    } catch (error) {
      console.error('TMDB fetch error:', error)
      return []
    }
  }

  const fetchTMDBPages = async (endpoint) => {
    try {
      const [results1, results2] = await Promise.all([
        fetchTMDB(`${endpoint}&page=1`),
        fetchTMDB(`${endpoint}&page=2`)
      ])
      return [...results1, ...results2]
    } catch {
      return []
    }
  }

  const fetchSearchResults = async (query) => {
    if (!query.trim()) { 
      setSearchResults([])
      setLoading(false)
      return 
    }
    
    setLoading(true)
    try {
      const [movies, tv] = await Promise.all([
        fetchTMDBPages(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`),
        fetchTMDBPages(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`)
      ])
      
      const combined = [
        ...movies.map(i => ({ ...i, media_type: 'movie' })),
        ...tv.map(i => ({ ...i, media_type: 'tv' }))
      ]
        .filter(i => i.poster_path)
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 40)
      
      setSearchResults(combined)
    } catch (error) {
      showToast('Erro na busca', 'error')
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const debouncedSearch = useDebounce(fetchSearchResults, 300)
  
  const handleSearchChange = (q) => {
    setSearchQuery(q)
    if (!q.trim()) { 
      setSearchResults([])
      setLoading(false)
      return 
    }
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
      
      const releasesData = [
        ...moviesNow.map(i => ({ ...i, media_type: 'movie' })),
        ...tvNow.map(i => ({ ...i, media_type: 'tv' }))
      ]
        .filter(i => i.poster_path)
        .sort((a, b) => new Date(b.release_date || b.first_air_date) - new Date(a.release_date || a.first_air_date))
        .slice(0, 36)
      
      const recommendationsData = [
        ...moviesPopular.map(i => ({ ...i, media_type: 'movie' })),
        ...tvPopular.map(i => ({ ...i, media_type: 'tv' }))
      ]
        .filter(i => i.poster_path)
        .sort(() => 0.5 - Math.random())
        .slice(0, 36)
      
      setReleases(releasesData)
      setRecommendations(recommendationsData)
    } catch (error) {
      console.error('Load error:', error)
    }
  }

  const loadFavorites = () => {
    try { 
      const stored = localStorage.getItem('yoshikawaFavorites')
      setFavorites(stored ? JSON.parse(stored) : []) 
    } catch { 
      setFavorites([]) 
    }
  }

  const isFavorite = (item) => favorites.some(f => f.id === item.id && f.media_type === item.media_type)

  const toggleFavorite = (item) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === item.id && f.media_type === item.media_type)
      let updated
      
      if (exists) { 
        updated = prev.filter(f => !(f.id === item.id && f.media_type === item.media_type))
        showToast('Removido', 'info') 
      } else { 
        updated = [...prev, { 
          id: item.id, 
          media_type: item.media_type, 
          title: item.title || item.name, 
          poster_path: item.poster_path 
        }]
        showToast('Adicionado', 'success') 
      }
      
      try { 
        localStorage.setItem('yoshikawaFavorites', JSON.stringify(updated)) 
      } catch { 
        showToast('Erro ao salvar', 'error') 
      }
      
      return updated
    })
  }

  const activeList = searchActive ? searchResults : (activeSection === 'releases' ? releases : (activeSection === 'recommendations' ? recommendations : favorites))
  const heroItem = !searchActive && releases.length > 0 ? releases[0] : null
  const displayItems = activeList

  const pageTitle = searchActive ? 'Resultados' : (SECTION_TITLES[activeSection] || 'Conteúdo')
  const headerLabel = scrolled ? (searchActive ? 'Resultados' : SECTION_TITLES[activeSection] || 'Conteúdo') : 'Yoshikawa'

  return (
    <>
      <Head>
        <title>Yoshikawa Player</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #050505;
            color: #f5f5f7;
            line-height: 1.6;
            font-size: 16px;
            min-height: 100vh;
            overflow-y: auto;
            overflow-x: hidden;
          }
          
          a { color: inherit; text-decoration: none; }
          button { font-family: inherit; border: none; outline: none; background: none; }
          img { max-width: 100%; height: auto; display: block; }

          :root {
            --pill-height: 44px; /* Mais fino verticalmente */
            --pill-radius: 50px;
            --liquid-bg: rgba(30, 30, 30, 0.6);
            --liquid-border: rgba(255, 255, 255, 0.15);
            --liquid-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.36);
            --liquid-blur: blur(20px) saturate(180%);
            --pill-max-width: 680px;
            --ios-blue: #0A84FF;
          }

          /* --- SHARED STYLES --- */
          .glass-panel {
            background: var(--liquid-bg);
            backdrop-filter: var(--liquid-blur);
            -webkit-backdrop-filter: var(--liquid-blur);
            border: 1px solid var(--liquid-border);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          }

          .bar-container {
            position: fixed; 
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
            display: flex; 
            align-items: center; 
            justify-content: center;
            gap: 12px; 
            width: 90%; 
            max-width: var(--pill-max-width);
          }

          .top-bar { top: 20px; }
          .bottom-bar { bottom: 20px; }

          .round-btn {
            width: var(--pill-height);
            height: var(--pill-height);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: rgba(255, 255, 255, 0.9);
            flex-shrink: 0;
            z-index: 2;
          }
          
          .round-btn:hover {
            background: rgba(80, 80, 80, 0.6);
            transform: scale(1.05);
          }
          .round-btn:active { transform: scale(0.95); }

          .pill-container {
            height: var(--pill-height);
            flex: 1;
            border-radius: var(--pill-radius);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
          }

          .bar-label {
            font-size: 0.9rem; 
            font-weight: 600; 
            color: #fff;
            white-space: nowrap;
            letter-spacing: -0.01em;
            animation: fadeIn 0.4s ease forwards;
          }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

          /* --- POPUPS --- */
          .info-popup {
            position: fixed;
            top: calc(20px + var(--pill-height) + 8px); 
            left: 50%;
            transform: translateX(-50%) scale(0.95);
            z-index: 900;
            width: auto; 
            min-width: 280px;
            opacity: 0;
            animation: popupIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            pointer-events: none;
            display: flex; 
            align-items: center; 
            gap: 12px;
            padding: 0.8rem 1.2rem; 
            border-radius: 20px;
          }
          
          .info-popup.closing { animation: popupOut 0.2s ease forwards; }
          @keyframes popupIn { to { opacity: 1; transform: translateX(-50%) scale(1); pointer-events: auto; } }
          @keyframes popupOut { to { opacity: 0; transform: translateX(-50%) scale(0.95); } }
          
          .info-icon { font-size: 1.1rem; color: var(--ios-blue); }
          .info-text { font-size: 0.85rem; color: #eee; margin: 0; }

          /* --- CONTAINER & LAYOUT --- */
          .container {
            max-width: 1280px; 
            margin: 0 auto;
            padding-top: 6.5rem;
            padding-bottom: 7rem;
            padding-left: 2rem; 
            padding-right: 2rem;
          }
          
          .page-title {
            font-size: 1.5rem; 
            font-weight: 700; 
            margin-bottom: 1rem;
            color: #fff;
            letter-spacing: -0.03em;
          }
          .page-title-below { margin-top: 0; }

          /* --- HERO CLEAN --- */
          .hero-static-container { width: 100%; position: relative; margin-bottom: 2rem; }
          .hero-wrapper {
            display: block; 
            width: 100%; 
            aspect-ratio: 2.35 / 1;
            position: relative;
            border-radius: 24px; 
            overflow: hidden;
            /* Sem sombra como pedido */
            border: 1px solid rgba(255, 255, 255, 0.1); 
            transform: translateZ(0); /* Hardware accel */
          }
          
          .hero-backdrop img {
            width: 100%; height: 100%; object-fit: cover; 
            transition: transform 1s ease;
          }
          
          .hero-overlay {
            position: absolute; inset: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%);
          }
          
          .hero-content {
            position: absolute; bottom: 0; left: 0; width: 100%; 
            padding: 2rem; z-index: 2;
          }
          
          .hero-title {
            font-size: 2.2rem; font-weight: 800; color: #fff;
            letter-spacing: -0.03em; margin: 0; line-height: 1;
            text-shadow: 0 2px 10px rgba(0,0,0,0.5);
          }

          /* --- CARDS --- */
          .content-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 24px 12px; 
            width: 100%;
          }
          
          .card-wrapper { display: flex; flex-direction: column; width: 100%; position: relative; }
          
          .card-poster-frame {
            position: relative; 
            border-radius: 16px; 
            overflow: hidden;
            aspect-ratio: 2/3; 
            background: #1a1a1a;
            /* Borda fina para destaque */
            border: 1px solid rgba(255,255,255,0.18); 
            transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          }
          
          .card-wrapper:hover .card-poster-frame { transform: translateY(-4px); border-color: rgba(255,255,255,0.4); }
          .content-poster { width: 100%; height: 100%; object-fit: cover; }
          
          .card-title {
            margin-top: 10px; font-size: 0.8rem; font-weight: 500;
            color: rgba(255, 255, 255, 0.85); line-height: 1.3;
            display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; 
            overflow: hidden; text-overflow: ellipsis;
          }
          
          .fav-btn {
            position: absolute; top: 8px; right: 8px; 
            width: 32px; height: 32px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; opacity: 0; transform: scale(0.9); transition: all 0.2s;
            border: none;
          }
          .card-poster-frame:hover .fav-btn, .fav-btn:active { opacity: 1; transform: scale(1); }
          @media (hover: none) { .fav-btn { opacity: 1; transform: scale(1); background: rgba(0,0,0,0.4); } }
          
          .heart-pulse { animation: heartZoom 0.4s ease; }
          @keyframes heartZoom { 50% { transform: scale(1.4); } }

          /* --- NAVBAR PILL --- */
          .nav-btn {
            flex: 1; display: flex; align-items: center; justify-content: center;
            height: 100%; color: rgba(255,255,255,0.4); transition: color 0.3s;
          }
          .nav-btn i { font-size: 18px; }
          .nav-btn.active { color: #fff; }
          
          .search-wrap { width: 100%; padding: 0 12px; }
          .search-wrap input {
            width: 100%; background: transparent; border: none; outline: none;
            color: #fff; font-size: 15px; font-family: inherit;
          }

          /* --- FLUID THIN TOAST --- */
          .toast-wrap {
            position: fixed; 
            bottom: calc(20px + var(--pill-height) + 12px);
            left: 50%; transform: translateX(-50%); 
            z-index: 990; pointer-events: none;
          }
          
          .toast {
            pointer-events: auto;
            display: flex; align-items: center; gap: 10px;
            padding: 8px 16px; /* Mais fino */
            border-radius: 24px;
            animation: floatUp 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards;
          }
          
          .toast.closing { animation: floatDown 0.3s forwards; }
          @keyframes floatUp { from { opacity:0; transform:translateY(15px); } to { opacity:1; transform:translateY(0); } }
          @keyframes floatDown { to { opacity:0; transform:translateY(10px); } }
          
          .toast-icon { width:16px; height:16px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:9px; }
          .toast.success .toast-icon { background: #34c759; color: #000; }
          .toast.info .toast-icon { background: #007aff; color: #fff; }
          .toast-msg { font-size: 13px; font-weight: 500; color: #fff; }

          /* --- FOOTER & MISC --- */
          .footer-credits {
            margin-top: 3rem; padding: 2rem; text-align: center;
            color: rgba(255,255,255,0.2); font-size: 0.75rem;
            border-top: 1px solid rgba(255,255,255,0.05); 
          }
          .spinner {
            width: 24px; height: 24px; border: 2px solid rgba(255,255,255,0.1);
            border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          .empty-state { display: flex; flex-direction: column; align-items: center; color: #555; margin-top: 3rem; gap: 8px; }

          @media (max-width: 768px) {
            .container { padding-left: 1rem; padding-right: 1rem; }
            .content-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 16px 10px; }
            .hero-wrapper { aspect-ratio: 1.7/1; border-radius: 20px; }
            .hero-title { font-size: 1.6rem; }
            .hero-content { padding: 1.5rem; }
            .bar-container { width: 94%; gap: 8px; }
            .card-poster-frame { border-radius: 14px; }
          }
        `}</style>
      </Head>

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
        {!loading && heroItem && (
          <HeroFixed item={heroItem} isFavorite={isFavorite} toggleFavorite={toggleFavorite} />
        )}

        <h1 className={`page-title ${heroItem ? 'page-title-below' : ''}`}>{pageTitle}</h1>

        {loading && (searchActive || releases.length === 0) && (
          <div className="empty-state">
            <div className="spinner"></div>
          </div>
        )}

        {searchActive && !loading && searchResults.length === 0 && searchQuery.trim() && (
          <div className="empty-state">
            <i className="fas fa-ghost"></i>
            <p>Nada encontrado</p>
          </div>
        )}

        {displayItems.length > 0 && !loading && (
          <div className="content-grid">
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
