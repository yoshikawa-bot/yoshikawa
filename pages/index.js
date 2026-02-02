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

export const Header = ({ label, scrolled, showInfo, toggleInfo, infoClosing, showTech, toggleTech, techClosing }) => {
  const handleBtnClick = (e) => {
    e.stopPropagation()
    if (scrolled) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      toggleInfo()
    }
  }

  return (
    <>
      <header className="header-pill">
        <button 
          className="header-btn-left" 
          onClick={(e) => { e.stopPropagation(); toggleTech() }}
          title="Info Técnica"
        >
          <i className="fas fa-pen" style={{ fontSize: '14px' }}></i>
        </button>

        <div className="header-center">
          <span key={label} className="header-label">{label}</span>
        </div>

        <button 
          className="header-btn-right" 
          title={scrolled ? "Voltar ao topo" : "Informações"}
          onClick={handleBtnClick}
        >
          <i className={scrolled ? "fas fa-chevron-up" : "fas fa-plus"}></i>
        </button>
      </header>

      {showInfo && (
        <div 
          className={`info-popup ${infoClosing ? 'closing' : ''}`} 
          onClick={(e) => e.stopPropagation()}
        >
          <i className="fas fa-shield-alt info-icon"></i>
          <p className="info-text">
            Para uma melhor experiência, utilize o navegador <strong>Brave</strong> ou instale um <strong>AdBlock</strong>.
          </p>
        </div>
      )}

      {showTech && (
        <div 
          className={`info-popup ${techClosing ? 'closing' : ''}`} 
          onClick={(e) => e.stopPropagation()}
        >
          <i className="fas fa-code info-icon" style={{ color: '#60a5fa' }}></i>
          <div className="info-text">
            <strong>Dados Técnicos</strong>
            <ul style={{ listStyle: 'none', marginTop: '4px', fontSize: '0.8rem', opacity: 0.8 }}>
              <li>Build: v2.4.1 (Stable)</li>
              <li>Engine: Next.js / React 18</li>
              <li>Source: TMDB API Public</li>
              <li>Latency: 24ms</li>
            </ul>
          </div>
        </div>
      )}
    </>
  )
}

export const ToastContainer = ({ toast, closeToast }) => {
  if (!toast) return null
  return (
    <div className="toast-wrap">
      <div className={`toast ${toast.type} ${toast.closing ? 'closing' : ''}`} onClick={closeToast}>
        <div className="toast-icon">
          <i className={`fas ${toast.type === 'success' ? 'fa-check' : toast.type === 'error' ? 'fa-exclamation-triangle' : 'fa-info'}`}></i>
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
              <span className="hero-tag">Top do Dia</span>
              <h2 className="hero-title">{item.title || item.name}</h2>
              <p className="hero-overview">{item.overview ? item.overview.slice(0, 90) + '...' : ''}</p>
            </div>
          </div>
        </Link>
        <button 
          className="fav-btn" 
          onClick={handleFav} 
          style={{ top: '14px', right: '14px' }}
        >
          <i
            className={`${favActive ? 'fas fa-heart' : 'far fa-heart'} ${animating ? 'heart-pulse' : ''}`}
            style={{ color: favActive ? '#ff6b6b' : '#ffffff' }}
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
        <button className="fav-btn" onClick={handleFavClick}>
          <i
            className={`${isFavorite ? 'fas fa-heart' : 'far fa-heart'} ${animating ? 'heart-pulse' : ''}`}
            style={{ color: isFavorite ? '#ff6b6b' : '#ffffff' }}
          ></i>
        </button>
      </div>
      <span className="card-title">{item.title || item.name}</span>
    </Link>
  )
}

export const BottomNav = ({
  activeSection, setActiveSection,
  searchActive, setSearchActive,
  searchQuery, setSearchQuery,
  onSearchSubmit, inputRef
}) => (
  <div className="bottom-nav">
    <div className={`nav-pill ${searchActive ? 'search-mode' : ''}`}>
      {searchActive ? (
        <div className="search-wrap">
          <input
            ref={inputRef}
            type="text"
            placeholder="Pesquisar..."
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
            <i className="fas fa-fire"></i>
          </button>
          <button className={`nav-btn ${activeSection === 'favorites' ? 'active' : ''}`} onClick={() => setActiveSection('favorites')}>
            <i className="fas fa-heart"></i>
          </button>
        </>
      )}
    </div>
    <button className="search-circle" onClick={() => setSearchActive(s => !s)}>
      <i className={searchActive ? 'fas fa-times' : 'fas fa-search'}></i>
    </button>
  </div>
)

export const Footer = () => (
  <footer className="footer-credits">
    <p>Desenvolvido por Kawa para os sistemas Yoshikawa</p>
    <p className="footer-sub">Todos os direitos reservados &copy; {new Date().getFullYear()}</p>
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
        }, 3000)
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
      if (!e.target.closest('.info-popup') && !e.target.closest('.header-btn-right') && !e.target.closest('.header-btn-left')) {
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
        showToast('Removido dos favoritos', 'info') 
      } else { 
        updated = [...prev, { 
          id: item.id, 
          media_type: item.media_type, 
          title: item.title || item.name, 
          poster_path: item.poster_path 
        }]
        showToast('Adicionado aos favoritos!', 'success') 
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
  const showHero = !searchActive && (activeSection === 'releases' || activeSection === 'recommendations') && activeList.length > 0
  const heroItem = showHero ? activeList[0] : null
  const displayItems = showHero ? activeList.slice(1) : activeList

  const pageTitle = searchActive ? 'Resultados' : (SECTION_TITLES[activeSection] || 'Conteúdo')
  const headerLabel = scrolled ? (searchActive ? 'Resultados' : SECTION_TITLES[activeSection] || 'Conteúdo') : 'Yoshikawa'

  return (
    <>
      <Head>
        <title>Yoshikawa Player</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }

          body {
            font-family: 'Inter', Arial, sans-serif;
            background: #000;
            color: #f1f5f9;
            line-height: 1.6;
            font-size: 16px;
            min-height: 100vh;
            overflow-y: auto;
            overflow-x: hidden;
          }
          
          a { color: inherit; text-decoration: none; }
          button { font-family: inherit; }
          img { max-width: 100%; height: auto; }

          :root {
            --pill-height: 62px;
            --pill-radius: 44px;
            --pill-bg: rgba(35, 35, 35, 0.65);
            --pill-border: 1px solid rgba(255, 255, 255, 0.15);
            --pill-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
            --pill-blur: blur(20px);
            --pill-max-width: 680px;
          }

          .header-pill {
            position: fixed; 
            top: 20px; 
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
            display: flex; 
            align-items: center; 
            justify-content: space-between;
            height: var(--pill-height);
            width: 90%; 
            max-width: var(--pill-max-width);
            padding: 0 0.8rem;
            border-radius: var(--pill-radius);
            border: var(--pill-border);
            background: var(--pill-bg);
            backdrop-filter: var(--pill-blur);
            -webkit-backdrop-filter: var(--pill-blur);
            box-shadow: var(--pill-shadow);
            transition: background 0.3s ease, border-color 0.3s ease;
          }
          
          .header-btn-left, .header-btn-right {
            background: none; 
            border: none;
            color: rgba(255,255,255,0.5); 
            font-size: 1.2rem;
            cursor: pointer; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            width: 44px; 
            height: 44px; 
            border-radius: 50%;
            transition: color 0.2s ease, transform 0.15s ease;
            flex-shrink: 0; 
            z-index: 2;
          }
          
          .header-btn-left:hover, .header-btn-right:hover { 
            color: #fff; 
            transform: scale(1.05);
          }
          
          .header-btn-left:active, .header-btn-right:active {
            transform: scale(0.95);
          }

          .header-center {
            position: absolute; 
            left: 50%; 
            top: 50%;
            transform: translate(-50%, -50%);
            display: flex; 
            align-items: center; 
            justify-content: center;
            overflow: hidden; 
            width: 60%;
            pointer-events: none;
          }
          
          .header-label {
            font-size: 1rem; 
            font-weight: 600; 
            color: #f0f6fc;
            white-space: nowrap;
            animation: fadeInText 0.4s ease forwards;
          }
          
          @keyframes fadeInText {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .info-popup {
            position: fixed;
            top: 20px; 
            left: 50%;
            transform: translate(-50%, 0) scale(0.9);
            z-index: 900;
            width: 90%; 
            max-width: 420px;
            opacity: 0;
            animation: popup-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            pointer-events: none;
            will-change: transform, opacity;
            display: flex; 
            align-items: flex-start; 
            gap: 12px;
            padding: 1.1rem 1.3rem; 
            border-radius: 22px;
            border: var(--pill-border);
            background: var(--pill-bg);
            backdrop-filter: var(--pill-blur);
            -webkit-backdrop-filter: var(--pill-blur);
            box-shadow: var(--pill-shadow);
          }
          
          .info-popup.closing { 
            animation: popup-slide-out 0.3s cubic-bezier(0.7, 0, 0.84, 0) forwards; 
          }
          
          @keyframes popup-slide-in {
            0%   { opacity: 0; transform: translate(-50%, 0) scale(0.9); }
            100% { opacity: 1; transform: translate(-50%, calc(var(--pill-height) + 10px)) scale(1); pointer-events: auto; }
          }
          
          @keyframes popup-slide-out {
            0%   { opacity: 1; transform: translate(-50%, calc(var(--pill-height) + 10px)) scale(1); }
            100% { opacity: 0; transform: translate(-50%, 0) scale(0.9); pointer-events: none; }
          }
          
          .info-icon { 
            color: #f59e0b; 
            font-size: 1.15rem; 
            margin-top: 2px; 
            flex-shrink: 0; 
          }
          
          .info-text { 
            font-size: 0.88rem; 
            color: #cbd5e1; 
            line-height: 1.55; 
          }
          
          .info-text strong { 
            color: #fff; 
            font-weight: 600; 
          }

          .container {
            max-width: 1280px; 
            margin: 0 auto;
            padding-top: calc(var(--pill-height) + 20px + 1.8rem);
            padding-bottom: 8rem;
            padding-left: 2.5rem; 
            padding-right: 2.5rem;
          }
          
          .page-title {
            font-size: 1.6rem; 
            font-weight: 700; 
            margin-bottom: 1.2rem;
            background: linear-gradient(to right, #f1f5f9 0%, #f1f5f9 40%, #64748b 50%, #f1f5f9 60%, #f1f5f9 100%);
            background-size: 200% auto;
            background-clip: text; 
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent; 
            color: #f1f5f9;
            animation: textShimmer 3.5s linear infinite;
          }
          
          @keyframes textShimmer { 
            to { background-position: 200% center; } 
          }
          
          .page-title-below { 
            margin-top: 0; 
            margin-bottom: 1.2rem; 
          }

          .hero-static-container {
            width: 100%;
            position: relative;
            margin-bottom: 2rem;
          }

          .hero-wrapper {
            display: block; 
            width: 100%; 
            aspect-ratio: 16 / 9;
            max-height: 500px;
            text-decoration: none; 
            position: relative;
            border-radius: 24px; 
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          
          .hero-wrapper:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 40px rgba(0,0,0,0.6);
          }

          .hero-backdrop {
            width: 100%; 
            height: 100%;
            position: relative;
          }
          
          .hero-backdrop img {
            width: 100%; 
            height: 100%; 
            object-fit: cover; 
            display: block;
            transition: transform 0.3s ease;
          }
          
          .hero-wrapper:hover .hero-backdrop img {
            transform: scale(1.02);
          }
          
          .hero-overlay {
            position: absolute; 
            inset: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.9) 10%, rgba(0,0,0,0.3) 50%, transparent 100%);
          }
          
          .hero-content {
            position: absolute; 
            bottom: 0; 
            left: 0;
            width: 100%; 
            padding: 2rem; 
            z-index: 2;
          }
          
          .hero-tag {
            display: inline-block; 
            background: #ff6b6b; 
            color: #fff;
            padding: 4px 10px; 
            border-radius: 8px; 
            font-size: 0.75rem;
            font-weight: 700; 
            text-transform: uppercase; 
            margin-bottom: 8px;
            box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
          }
          
          .hero-title {
            font-size: 2rem; 
            font-weight: 800; 
            color: #fff;
            margin-bottom: 0.5rem; 
            text-shadow: 0 2px 10px rgba(0,0,0,0.5);
            line-height: 1.2;
          }
          
          .hero-overview {
            color: rgba(255, 255, 255, 0.85);
            font-size: 0.78rem;
            max-width: 600px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            line-height: 1.45;
          }

          .content-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 24px 14px; 
            width: 100%;
          }
          
          .card-wrapper { 
            display: flex; 
            flex-direction: column; 
            width: 100%; 
            cursor: pointer; 
            text-decoration: none; 
          }
          
          .card-poster-frame {
            position: relative; 
            border-radius: 20px; 
            overflow: hidden;
            aspect-ratio: 2/3; 
            border: 1px solid rgba(255,255,255,0.13);
            background: #1e1e1e;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          
          .card-wrapper:hover .card-poster-frame { 
            transform: translateY(-4px); 
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45); 
          }
          
          .content-poster { 
            width: 100%; 
            height: 100%; 
            object-fit: cover; 
            display: block; 
            transition: transform 0.3s ease;
          }
          
          .card-wrapper:hover .content-poster {
            transform: scale(1.03);
          }
          
          .card-title {
            margin-top: 10px; 
            font-size: 13px; 
            font-weight: 500;
            color: #fff; 
            text-align: left; 
            line-height: 1.4;
            height: calc(1.4em * 2);
            display: -webkit-box; 
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical; 
            overflow: hidden;
            text-overflow: ellipsis; 
            max-width: 100%;
          }
          
          .fav-btn {
            position: absolute; 
            top: 8px; 
            right: 8px; 
            z-index: 2;
            width: 32px; 
            height: 32px; 
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.2);
            background: rgba(0,0,0,0.5);
            backdrop-filter: blur(8px); 
            -webkit-backdrop-filter: blur(8px);
            display: flex; 
            align-items: center; 
            justify-content: center;
            cursor: pointer; 
            transition: border-color 0.2s ease, transform 0.15s ease, background 0.2s ease; 
            outline: none;
          }
          
          .fav-btn:hover { 
            border-color: rgba(255,255,255,0.6); 
            background: rgba(0,0,0,0.6);
            transform: scale(1.05);
          }
          
          .fav-btn:active { 
            transform: scale(0.92); 
          }
          
          .fav-btn i { 
            font-size: 14px; 
            transition: color 0.2s ease; 
          }
          
          @keyframes heart-zoom { 
            0% { transform: scale(1); } 
            50% { transform: scale(1.5); } 
            100% { transform: scale(1); } 
          }
          
          .heart-pulse { 
            animation: heart-zoom 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
          }

          .bottom-nav {
            position: fixed; 
            bottom: 20px; 
            left: 50%; 
            transform: translateX(-50%);
            display: flex; 
            align-items: center; 
            gap: 12px; 
            z-index: 1000;
            width: 90%; 
            max-width: var(--pill-max-width);
          }
          
          .nav-pill {
            display: flex; 
            align-items: center; 
            justify-content: space-between;
            height: var(--pill-height); 
            padding: 0 1.5rem;
            border-radius: var(--pill-radius); 
            border: var(--pill-border);
            background: var(--pill-bg);
            backdrop-filter: var(--pill-blur); 
            -webkit-backdrop-filter: var(--pill-blur);
            box-shadow: var(--pill-shadow);
            flex: 1; 
            transition: background 0.3s ease, border-color 0.3s ease; 
            overflow: hidden;
          }
          
          .nav-btn {
            flex: 1; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            background: none; 
            border: none; 
            cursor: pointer; 
            height: 100%;
            color: rgba(255,255,255,0.5); 
            transition: color 0.2s ease;
          }
          
          .nav-btn i { 
            font-size: 20px; 
            transition: transform 0.2s ease; 
          }
          
          .nav-btn:hover { 
            color: #fff; 
          }
          
          .nav-btn:hover i { 
            transform: scale(1.15); 
          }
          
          .nav-btn.active { 
            color: #fff; 
          }
          
          .nav-btn.active i { 
            transform: scale(1.08); 
          }

          .search-wrap { 
            width: 100%; 
            display: flex; 
            align-items: center; 
            height: 100%; 
          }
          
          .search-wrap input {
            width: 100%; 
            background: transparent; 
            border: none; 
            outline: none;
            color: #f1f5f9; 
            font-size: 15px; 
            font-family: inherit; 
            padding: 0 4px;
          }
          
          .search-wrap input::placeholder { 
            color: #cbd5e1; 
            opacity: 0.6; 
          }

          .search-circle {
            width: var(--pill-height); 
            height: var(--pill-height);
            border-radius: 50%; 
            border: var(--pill-border);
            background: var(--pill-bg);
            backdrop-filter: var(--pill-blur); 
            -webkit-backdrop-filter: var(--pill-blur);
            box-shadow: var(--pill-shadow);
            display: flex; 
            align-items: center; 
            justify-content: center;
            flex-shrink: 0; 
            cursor: pointer;
            color: rgba(255,255,255,0.7); 
            transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease;
          }
          
          .search-circle:hover { 
            background: rgba(50,50,50,0.8); 
            color: #fff;
            transform: scale(1.05);
          }
          
          .search-circle:active {
            transform: scale(0.95);
          }
          
          .search-circle i { 
            font-size: 22px; 
          }

          .toast-wrap {
            position: fixed; 
            bottom: calc(20px + var(--pill-height) + 12px);
            left: 50%; 
            transform: translateX(-50%); 
            z-index: 990;
            display: flex; 
            flex-direction: column; 
            align-items: center;
            pointer-events: none; 
            width: 90%; 
            max-width: var(--pill-max-width);
          }
          
          .toast {
            pointer-events: auto; 
            display: flex; 
            align-items: center; 
            gap: 12px;
            padding: 0 1.5rem; 
            height: 48px; 
            border-radius: 30px; 
            border: var(--pill-border);
            background: var(--pill-bg); 
            backdrop-filter: var(--pill-blur); 
            -webkit-backdrop-filter: var(--pill-blur);
            box-shadow: 0 4px 20px rgba(0,0,0,0.6); 
            white-space: nowrap;
            animation: toast-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            transform-origin: center bottom;
            cursor: pointer;
          }
          
          .toast.closing { 
            animation: toast-out 0.4s cubic-bezier(0.6, -0.28, 0.735, 0.045) forwards; 
          }
          
          @keyframes toast-in { 
            from { opacity:0; transform:translateY(60px) scale(0.6); } 
            to { opacity:1; transform:translateY(0) scale(1); } 
          }
          
          @keyframes toast-out { 
            from { opacity:1; transform:translateY(0) scale(1); } 
            to { opacity:0; transform:translateY(60px) scale(0.6); } 
          }
          
          .toast-icon { 
            width:22px; 
            height:22px; 
            border-radius:50%; 
            display:flex; 
            align-items:center; 
            justify-content:center; 
            font-size:11px; 
            flex-shrink:0; 
          }
          
          .toast.success .toast-icon { 
            background:#10b981; 
            color:#fff; 
          }
          
          .toast.info .toast-icon { 
            background:#4dabf7; 
            color:#fff; 
          }
          
          .toast.error .toast-icon { 
            background:#ef4444; 
            color:#fff; 
          }
          
          .toast-msg { 
            font-size:13px; 
            color:#fff; 
            font-weight:500; 
          }

          .footer-credits {
            margin-top: 4rem; 
            padding: 2rem 1rem; 
            text-align: center;
            color: rgba(255,255,255,0.3); 
            font-size: 0.85rem;
            border-top: 1px solid rgba(255,255,255,0.05); 
            width: 100%;
          }
          
          .footer-sub { 
            font-size: 0.75rem; 
            margin-top: 4px; 
            opacity: 0.7; 
          }
          
          .empty-state {
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center;
            min-height: 50vh; 
            color: #94a3b8; 
            text-align: center; 
            width: 100%;
          }
          
          .empty-state i { 
            font-size: 2rem; 
            margin-bottom: 12px; 
          }
          
          .spinner {
            width: 36px; 
            height: 36px;
            border: 3px solid rgba(255,255,255,0.1);
            border-top-color: #ff6b6b; 
            border-radius: 50%;
            animation: spin 0.7s linear infinite; 
            margin-bottom: 12px;
          }
          
          @keyframes spin { 
            to { transform: rotate(360deg); } 
          }

          @media (max-width: 768px) {
            :root { 
              --pill-height: 56px; 
              --pill-max-width: 90vw; 
            }
            
            .content-grid { 
              grid-template-columns: repeat(2, 1fr) !important; 
              gap: 20px 10px; 
            }
            
            .container { 
              padding-left: 1.5rem; 
              padding-right: 1.5rem; 
            }
            
            .header-pill { 
              top: 14px; 
              width: 92%; 
              padding: 0 1rem; 
            }
            
            .bottom-nav { 
              width: 92%; 
              bottom: 14px; 
            }
            
            .nav-pill { 
              padding: 0 1rem; 
            }
            
            .toast-wrap { 
              width: 92%; 
              bottom: calc(14px + var(--pill-height) + 12px); 
            }
            
            .toast { 
              padding: 0 1rem; 
              height: 44px; 
            }

            .hero-title { 
              font-size: 1.5rem; 
            }
            
            .hero-wrapper { 
              border-radius: 16px; 
              aspect-ratio: 4/3; 
            }
          }

          @media (max-width: 480px) {
            :root { 
              --pill-height: 54px; 
              --pill-max-width: 95vw; 
            }
            
            .container { 
              padding-left: 1rem; 
              padding-right: 1rem; 
            }
            
            .header-pill { 
              width: 94%; 
            }
            
            .bottom-nav { 
              width: 94%; 
              gap: 8px; 
            }
            
            .toast-wrap { 
              width: 94%; 
            }
            
            .nav-pill { 
              padding: 0 1.25rem; 
            }
            
            .nav-btn i { 
              font-size: 19px; 
            }
            
            .search-circle i { 
              font-size: 20px; 
            }
            
            .hero-wrapper { 
              aspect-ratio: 4 / 3; 
            }
            
            .hero-title { 
              font-size: 1.3rem; 
            }
            
            .hero-content { 
              padding: 1.2rem; 
            }
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
        {!loading && showHero && heroItem && (
          <HeroFixed item={heroItem} isFavorite={isFavorite} toggleFavorite={toggleFavorite} />
        )}

        <h1 className={`page-title ${showHero ? 'page-title-below' : ''}`}>{pageTitle}</h1>

        {loading && (searchActive || releases.length === 0) && (
          <div className="empty-state">
            <div className="spinner"></div>
            <span>{searchActive ? 'Buscando...' : 'Carregando...'}</span>
          </div>
        )}

        {searchActive && !loading && searchResults.length === 0 && searchQuery.trim() && (
          <div className="empty-state">
            <i className="fas fa-ghost"></i>
            <p>Nenhum resultado para "{searchQuery}"</p>
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
            <i className="fas fa-heart"></i>
            <p>Nenhum favorito adicionado ainda.</p>
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
