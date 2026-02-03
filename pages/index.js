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
          {/* Ícone alterado para slider/config */}
          <i className="fas fa-sliders" style={{ fontSize: '13px' }}></i>
        </button>

        <div className="pill-container glass-panel">
          <span key={label} className="bar-label">{label}</span>
        </div>

        <button 
          className="round-btn glass-panel" 
          title={scrolled ? "Voltar ao topo" : "Avisos"}
          onClick={handleRightClick}
        >
          <i className={scrolled ? "fas fa-arrow-up" : "fas fa-bell"} style={{ fontSize: '14px' }}></i>
        </button>
      </header>

      {/* Popups */}
      {showInfo && (
        <div 
          className={`info-popup glass-panel ${infoClosing ? 'closing' : ''}`} 
          onClick={(e) => e.stopPropagation()}
        >
          <i className="fas fa-shield-cat info-icon"></i>
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
          <i className="fas fa-code-branch info-icon" style={{ color: '#60a5fa' }}></i>
          <div className="info-text">
            <strong>Tech Data</strong>
            <ul style={{ listStyle: 'none', marginTop: '2px', fontSize: '0.75rem', opacity: 0.7 }}>
              <li>v2.7.0 Fluid</li>
              <li>React 18 / TMDB</li>
            </ul>
          </div>
        </div>
      )}
    </>
  )
}

// --- NAVBAR (Inferior) ---
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
      <button 
        className="round-btn glass-panel" 
        onClick={handleShare}
        title="Compartilhar"
      >
        <i className="fas fa-share-nodes" style={{ fontSize: '15px' }}></i>
      </button>

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
              <i className="fas fa-clock"></i> {/* Ícone Lançamentos atualizado */}
            </button>
            <button className={`nav-btn ${activeSection === 'recommendations' ? 'active' : ''}`} onClick={() => setActiveSection('recommendations')}>
              <i className="fas fa-fire"></i> {/* Ícone Populares atualizado */}
            </button>
            <button className={`nav-btn ${activeSection === 'favorites' ? 'active' : ''}`} onClick={() => setActiveSection('favorites')}>
              <i className="fas fa-bookmark"></i> {/* Ícone Favoritos atualizado */}
            </button>
          </>
        )}
      </div>

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
          <i className={`fas ${toast.type === 'success' ? 'fa-check' : toast.type === 'error' ? 'fa-bolt' : 'fa-info'}`}></i>
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
              <div className="hero-badge">Destaque Popular</div>
              <h2 className="hero-title">{item.title || item.name}</h2>
              <p className="hero-desc">{item.overview ? item.overview.slice(0, 100) + '...' : 'Assista agora.'}</p>
            </div>
          </div>
        </Link>
        <button 
          className="fav-btn glass-panel" 
          onClick={handleFav} 
          style={{ top: '20px', right: '20px', width: '40px', height: '40px', fontSize: '18px' }}
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
  
  // Novo estado para o Hero (sempre o #1 popular)
  const [heroFeatured, setHeroFeatured] = useState(null)
  
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
        // Sem randomização completa, vamos ordenar por popularidade para pegar o Top 1 pro Hero
        .sort((a, b) => b.popularity - a.popularity)
      
      // Definir o Hero como o Top 1 Popular
      if (recommendationsData.length > 0) {
        setHeroFeatured(recommendationsData[0])
      }

      setReleases(releasesData)
      // Randomiza o resto da lista de populares para exibição
      setRecommendations([...recommendationsData].sort(() => 0.5 - Math.random()).slice(0, 36))

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
  const displayItems = activeList

  const pageTitle = searchActive ? 'Resultados' : (SECTION_TITLES[activeSection] || 'Conteúdo')
  const headerLabel = scrolled ? (searchActive ? 'Resultados' : SECTION_TITLES[activeSection] || 'Conteúdo') : 'Yoshikawa'

  return (
    <>
      <svg style={{ display: 'none' }}>
        <filter id="liquid-glass" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="turbulence" baseFrequency="0.015" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="12" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

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
            background-image: radial-gradient(circle at 50% 0%, #1a1a1a, #050505 80%);
            background-attachment: fixed;
          }
          
          a { color: inherit; text-decoration: none; }
          button { font-family: inherit; border: none; outline: none; background: none; }
          img { max-width: 100%; height: auto; display: block; }

          :root {
            --pill-height: 44px;
            --pill-radius: 50px;
            --liquid-tint: rgba(20, 20, 20, 0.55);
            --liquid-highlight: rgba(255, 255, 255, 0.1);
            --pill-max-width: 680px;
            --ios-blue: #0A84FF;
            /* NOVA TRANSIÇÃO FLUIDA */
            --ease-fluid: cubic-bezier(0.32, 0.72, 0, 1);
          }

          /* --- GLASS & BLUR FIX --- */
          .glass-panel {
            position: relative;
            background: transparent;
            z-index: 10;
            /* CORREÇÃO CRUCIAL: Herdar bordas e cortar excesso */
            border-radius: inherit;
            overflow: hidden; 
            transform: translateZ(0); /* Força GPU e recorte no Safari */
            transition: transform 0.3s var(--ease-fluid);
          }

          .glass-panel::before {
            content: '';
            position: absolute;
            inset: 0;
            background: var(--liquid-tint);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            filter: url(#liquid-glass) saturate(140%) brightness(1.1);
            z-index: -2;
            pointer-events: none;
            /* CORREÇÃO: Herdar borda */
            border-radius: inherit;
          }

          .glass-panel::after {
            content: '';
            position: absolute;
            inset: 0;
            z-index: -1;
            /* CORREÇÃO: Herdar borda */
            border-radius: inherit;
            box-shadow: 
                inset 1px 1px 0px var(--liquid-highlight),
                inset -0.5px -0.5px 0px rgba(0,0,0,0.3);
            border: 1px solid rgba(255, 255, 255, 0.08);
            pointer-events: none;
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
            /* Importante: Definir o raio aqui para a glass-panel herdar */
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: rgba(255, 255, 255, 0.9);
            flex-shrink: 0;
          }
          
          .round-btn:hover { transform: scale(1.08); }
          .round-btn:active { transform: scale(0.92); }

          .pill-container {
            height: var(--pill-height);
            flex: 1;
            /* Importante: Raio definido aqui */
            border-radius: var(--pill-radius);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            isolation: isolate; 
          }

          .bar-label {
            font-size: 0.9rem; 
            font-weight: 600; 
            color: #fff;
            white-space: nowrap;
            letter-spacing: -0.01em;
            animation: fadeIn 0.5s var(--ease-fluid) forwards;
            position: relative; z-index: 5;
          }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

          /* --- POPUPS REFINADOS --- */
          .info-popup {
            position: fixed;
            top: calc(20px + var(--pill-height) + 8px); 
            left: 50%;
            /* Ajuste de animação fluida */
            transform-origin: top center;
            z-index: 900;
            width: auto; 
            min-width: 280px;
            opacity: 0;
            animation: popupIn 0.4s var(--ease-fluid) forwards;
            pointer-events: none;
            display: flex; 
            align-items: center; 
            gap: 12px;
            padding: 1rem 1.4rem; 
            border-radius: 24px; /* Raio maior para precisão */
          }
          
          .info-popup.closing { animation: popupOut 0.3s var(--ease-fluid) forwards; }
          
          @keyframes popupIn { 
            0% { opacity: 0; transform: translateX(-50%) scale(0.9) translateY(-10px); } 
            100% { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); pointer-events: auto; } 
          }
          @keyframes popupOut { 
            to { opacity: 0; transform: translateX(-50%) scale(0.95) translateY(-5px); } 
          }
          
          .info-icon { font-size: 1.2rem; color: var(--ios-blue); position: relative; z-index: 5; }
          .info-text { font-size: 0.85rem; color: #eee; margin: 0; position: relative; z-index: 5; }

          /* --- CONTAINER --- */
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
            margin-bottom: 1.5rem;
            color: #fff;
            letter-spacing: -0.03em;
            opacity: 0.9;
          }
          .page-title-below { margin-top: 0; }

          /* --- HERO ATUALIZADO (Full Fill) --- */
          .hero-static-container { width: 100%; position: relative; margin-bottom: 2.5rem; }
          .hero-wrapper {
            display: block; 
            width: 100%; 
            /* Aumentei a altura para garantir melhor preenchimento visual */
            height: 55vh; 
            max-height: 500px;
            min-height: 300px;
            position: relative;
            border-radius: 28px; 
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.1); 
            transform: translateZ(0);
          }
          
          .hero-backdrop { width: 100%; height: 100%; position: relative; }
          .hero-backdrop img {
            width: 100%; height: 100%; 
            /* Garante o preenchimento completo */
            object-fit: cover; 
            object-position: center top;
            transition: transform 1.5s var(--ease-fluid);
          }
          
          .hero-wrapper:hover .hero-backdrop img { transform: scale(1.03); }
          
          .hero-overlay {
            position: absolute; inset: 0;
            background: linear-gradient(to top, #050505 0%, rgba(5,5,5,0.6) 40%, transparent 100%);
          }
          
          .hero-content {
            position: absolute; bottom: 0; left: 0; width: 100%; 
            padding: 2.5rem; z-index: 2;
            display: flex; flex-direction: column; gap: 8px;
            max-width: 800px;
          }

          .hero-badge {
            background: rgba(255,255,255,0.2); backdrop-filter: blur(4px);
            padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; 
            font-weight: 600; text-transform: uppercase; align-self: flex-start;
            margin-bottom: 4px; border: 1px solid rgba(255,255,255,0.1);
          }
          
          .hero-title {
            font-size: 2.5rem; font-weight: 800; color: #fff;
            letter-spacing: -0.04em; line-height: 1.1;
            text-shadow: 0 4px 20px rgba(0,0,0,0.6);
          }
          
          .hero-desc {
             font-size: 1rem; color: rgba(255,255,255,0.8); 
             line-height: 1.5; max-width: 600px;
             display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
          }

          /* --- CARDS ATUALIZADOS (Sem Animação de Pulo) --- */
          .content-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 28px 16px; 
            width: 100%;
          }
          
          .card-wrapper { display: flex; flex-direction: column; width: 100%; position: relative; }
          
          .card-poster-frame {
            position: relative; 
            border-radius: 18px; 
            overflow: hidden;
            aspect-ratio: 2/3; 
            background: #1a1a1a;
            border: 1px solid rgba(255,255,255,0.12); 
            /* Transição apenas para a borda e brilho, removido transform */
            transition: border-color 0.3s var(--ease-fluid);
          }
          
          /* Efeito sutil ao passar o mouse */
          .card-wrapper:hover .card-poster-frame { 
            border-color: rgba(255,255,255,0.5); 
            box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
          }
          
          .content-poster { width: 100%; height: 100%; object-fit: cover; }
          
          .card-title {
            margin-top: 12px; font-size: 0.85rem; font-weight: 500;
            color: rgba(255, 255, 255, 0.8); line-height: 1.3;
            display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; 
            overflow: hidden; text-overflow: ellipsis;
            transition: color 0.2s;
          }
          .card-wrapper:hover .card-title { color: #fff; }
          
          .fav-btn {
            position: absolute; top: 10px; right: 10px; 
            width: 34px; height: 34px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; opacity: 0; transform: scale(0.9); 
            transition: all 0.3s var(--ease-fluid);
            border: none;
            z-index: 20;
          }
          .card-poster-frame:hover .fav-btn, .fav-btn:active { opacity: 1; transform: scale(1); }
          @media (hover: none) { .fav-btn { opacity: 1; transform: scale(1); background: rgba(0,0,0,0.4); } }
          
          .heart-pulse { animation: heartZoom 0.4s var(--ease-fluid); }
          @keyframes heartZoom { 50% { transform: scale(1.3); } }

          /* --- NAVBAR PILL --- */
          .nav-btn {
            flex: 1; display: flex; align-items: center; justify-content: center;
            height: 100%; color: rgba(255,255,255,0.4); 
            transition: color 0.3s var(--ease-fluid);
            position: relative; z-index: 5;
          }
          .nav-btn i { font-size: 19px; }
          .nav-btn.active { color: #fff; }
          .nav-btn:active { transform: scale(0.95); }
          
          .search-wrap { width: 100%; padding: 0 12px; position: relative; z-index: 5; }
          .search-wrap input {
            width: 100%; background: transparent; border: none; outline: none;
            color: #fff; font-size: 15px; font-family: inherit;
          }

          /* --- FLUID TOAST --- */
          .toast-wrap {
            position: fixed; 
            bottom: calc(20px + var(--pill-height) + 16px);
            left: 50%; transform: translateX(-50%); 
            z-index: 990; pointer-events: none;
          }
          
          .toast {
            pointer-events: auto;
            display: flex; align-items: center; gap: 12px;
            padding: 10px 18px; 
            border-radius: 28px;
            animation: floatUp 0.5s var(--ease-fluid) forwards;
          }
          
          .toast.closing { animation: floatDown 0.4s var(--ease-fluid) forwards; }
          @keyframes floatUp { from { opacity:0; transform:translateY(20px) scale(0.9); } to { opacity:1; transform:translateY(0) scale(1); } }
          @keyframes floatDown { to { opacity:0; transform:translateY(10px) scale(0.95); } }
          
          .toast-icon { 
              width:20px; height:20px; border-radius:50%; display:flex; 
              align-items:center; justify-content:center; font-size:10px; 
              position: relative; z-index: 5;
          }
          .toast.success .toast-icon { background: #34c759; color: #000; }
          .toast.info .toast-icon { background: #007aff; color: #fff; }
          .toast.error .toast-icon { background: #ff3b30; color: #fff; }
          .toast-msg { font-size: 13px; font-weight: 500; color: #fff; position: relative; z-index: 5; }

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
            .container { padding-left: 1.2rem; padding-right: 1.2rem; }
            .content-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 20px 12px; }
            .hero-wrapper { height: 45vh; border-radius: 24px; }
            .hero-title { font-size: 1.8rem; }
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
        {/* Renderiza o Hero com o estado fixo de Populares, se disponível, senão fallback */}
        {!loading && (
          <HeroFixed 
            item={heroFeatured || releases[0]} 
            isFavorite={isFavorite} 
            toggleFavorite={toggleFavorite} 
          />
        )}

        <h1 className={`page-title ${heroFeatured ? 'page-title-below' : ''}`}>{pageTitle}</h1>

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
