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
          title="Ajustes"
        >
          {/* Ícone de Sliders (Estilo Central de Controle iOS) */}
          <i className="fas fa-sliders" style={{ fontSize: '14px' }}></i>
        </button>

        <div className="pill-container glass-panel">
          <span key={label} className="bar-label">{label}</span>
        </div>

        <button 
          className="round-btn glass-panel" 
          title={scrolled ? "Topo" : "Info"}
          onClick={handleRightClick}
        >
          {/* Ícone Info Circulo (Estilo iOS) ou Seta Topo */}
          <i className={scrolled ? "fas fa-arrow-up" : "fas fa-circle-info"} style={{ fontSize: '15px' }}></i>
        </button>
      </header>

      {/* Popups com Glass aplicado corretamente */}
      {showInfo && (
        <div 
          className={`info-popup glass-panel ${infoClosing ? 'closing' : ''}`} 
          onClick={(e) => e.stopPropagation()}
        >
          {/* Ícone Escudo/Segurança estilo Apple */}
          <i className="fas fa-shield-halved info-icon"></i>
          <p className="info-text">
            Recomendado uso de <strong>AdBlock</strong>.
          </p>
        </div>
      )}

      {showTech && (
        <div 
          className={`info-popup glass-panel ${techClosing ? 'closing' : ''}`} 
          onClick={(e) => e.stopPropagation()}
        >
          {/* Ícone Código/Terminal */}
          <i className="fas fa-terminal info-icon" style={{ color: '#0A84FF' }}></i>
          <div className="info-text">
            <strong>System Status</strong>
            <ul style={{ listStyle: 'none', marginTop: '4px', fontSize: '0.7rem', opacity: 0.6 }}>
              <li>Core: v3.0 iOS Fluid</li>
              <li>Engine: React 18</li>
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
      alert('Link copiado para a área de transferência')
    }
  }

  return (
    <div className="bar-container bottom-bar">
      <button 
        className="round-btn glass-panel" 
        onClick={handleShare}
        title="Compartilhar"
      >
        {/* Ícone Share Clássico do iOS (Quadrado com Seta) */}
        <i className="fas fa-arrow-up-from-bracket" style={{ fontSize: '15px', transform: 'translateY(-1px)' }}></i>
      </button>

      <div className={`pill-container glass-panel ${searchActive ? 'search-mode' : ''}`}>
        {searchActive ? (
          <div className="search-wrap">
            <i className="fas fa-magnifying-glass search-icon-input"></i>
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar filmes, séries..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onSearchSubmit(searchQuery)}
            />
          </div>
        ) : (
          <>
            <button className={`nav-btn ${activeSection === 'releases' ? 'active' : ''}`} onClick={() => setActiveSection('releases')}>
              {/* Clapperboard para Lançamentos */}
              <i className="fas fa-clapperboard"></i>
            </button>
            <button className={`nav-btn ${activeSection === 'recommendations' ? 'active' : ''}`} onClick={() => setActiveSection('recommendations')}>
              {/* Estrela ou Fogo para Populares/Destaques */}
              <i className="fas fa-star"></i>
            </button>
            <button className={`nav-btn ${activeSection === 'favorites' ? 'active' : ''}`} onClick={() => setActiveSection('favorites')}>
              {/* Marcador para Favoritos */}
              <i className="fas fa-bookmark"></i>
            </button>
          </>
        )}
      </div>

      <button className="round-btn glass-panel" onClick={() => setSearchActive(s => !s)}>
        <i className={searchActive ? 'fas fa-xmark' : 'fas fa-magnifying-glass'} style={{ fontSize: searchActive ? '16px' : '15px' }}></i>
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
          {/* Ícones de notificação minimalistas */}
          <i className={`fas ${toast.type === 'success' ? 'fa-check' : toast.type === 'error' ? 'fa-triangle-exclamation' : 'fa-bell'}`}></i>
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
              <div className="hero-badge">Em Alta Hoje</div>
              <h2 className="hero-title">{item.title || item.name}</h2>
              <p className="hero-desc">{item.overview}</p>
            </div>
          </div>
        </Link>
        <button 
          className="fav-btn glass-panel" 
          onClick={handleFav} 
          style={{ top: '20px', right: '20px', width: '42px', height: '42px' }}
        >
          <i
            className={`${favActive ? 'fas fa-heart' : 'far fa-heart'} ${animating ? 'heart-pulse' : ''}`}
            style={{ color: favActive ? '#FF3B30' : '#ffffff', fontSize: '18px' }}
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
            style={{ color: isFavorite ? '#FF3B30' : '#ffffff' }}
          ></i>
        </button>
      </div>
      <span className="card-title">{item.title || item.name}</span>
    </Link>
  )
}

export const Footer = () => (
  <footer className="footer-credits">
    <p>Design by Yoshikawa &copy; {new Date().getFullYear()}</p>
  </footer>
)

export default function Home() {
  const [releases, setReleases] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [favorites, setFavorites] = useState([])
  const [searchResults, setSearchResults] = useState([])
  
  // Estado para garantir que o Hero seja o #1 popular
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
        // Ordena por popularidade absoluta para definir o Hero
        .sort((a, b) => b.popularity - a.popularity)
      
      if (recommendationsData.length > 0) {
        setHeroFeatured(recommendationsData[0])
      }

      setReleases(releasesData)
      // Exibe populares aleatórios na lista, excluindo o que já está no Hero
      setRecommendations(recommendationsData.slice(1).sort(() => 0.5 - Math.random()).slice(0, 36))

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
        showToast('Salvo', 'success') 
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

  const pageTitle = searchActive ? 'Buscando' : (SECTION_TITLES[activeSection] || 'Explorar')
  const headerLabel = scrolled ? (searchActive ? 'Busca' : SECTION_TITLES[activeSection]) : 'Yoshikawa'

  return (
    <>
      <Head>
        <title>Yoshikawa Player</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #000;
            color: #f5f5f7;
            line-height: 1.6;
            font-size: 16px;
            min-height: 100vh;
            overflow-y: auto;
            overflow-x: hidden;
            /* Gradiente de fundo sutil para dar profundidade ao vidro */
            background-image: linear-gradient(to bottom, #111 0%, #000 40%);
            background-attachment: fixed;
          }
          
          a { color: inherit; text-decoration: none; }
          button { font-family: inherit; border: none; outline: none; background: none; }
          img { max-width: 100%; height: auto; display: block; }

          :root {
            --pill-height: 48px; /* Botões ligeiramente maiores estilo iOS */
            --pill-radius: 50px;
            --glass-bg: rgba(22, 22, 24, 0.65); /* Fundo base escuro semitransparente */
            --glass-border: rgba(255, 255, 255, 0.12);
            --ios-blue: #0A84FF;
            --ios-ease: cubic-bezier(0.32, 0.72, 0, 1); /* Curva suave da Apple */
          }

          /* --- REAL CSS GLASS (Sem SVG Bugado) --- */
          /* Esta classe substitui o método antigo. Usa backdrop-filter nativo */
          .glass-panel {
            position: relative;
            background: var(--glass-bg);
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            border: 1px solid var(--glass-border);
            box-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.2);
            /* Garante que o efeito fique contido no formato */
            border-radius: inherit;
            overflow: hidden; 
            z-index: 10;
            transform: translateZ(0); /* Força aceleração de hardware */
            transition: transform 0.2s var(--ios-ease), background 0.2s;
          }

          /* Efeito de brilho sutil ao topo (iluminação) */
          .glass-panel::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: inherit;
            background: linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, transparent 100%);
            pointer-events: none;
            z-index: 11;
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
            width: 92%; 
            max-width: 600px;
          }

          .top-bar { top: 16px; }
          .bottom-bar { bottom: 20px; }

          .round-btn {
            width: var(--pill-height);
            height: var(--pill-height);
            border-radius: 50%; /* Glass herda isso */
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: rgba(255, 255, 255, 0.9);
            flex-shrink: 0;
            transition: transform 0.2s var(--ios-ease);
          }
          
          .round-btn:active { transform: scale(0.92); background: rgba(255,255,255,0.1); }

          .pill-container {
            height: var(--pill-height);
            flex: 1;
            border-radius: var(--pill-radius); /* Glass herda isso */
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          }

          .bar-label {
            font-size: 0.95rem; 
            font-weight: 600; 
            color: #fff;
            letter-spacing: -0.01em;
            animation: fadeIn 0.4s var(--ios-ease) forwards;
          }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

          /* --- POPUPS & TOASTS (Correção de Glass) --- */
          .info-popup {
            position: fixed;
            top: calc(20px + var(--pill-height) + 10px); 
            left: 50%;
            transform-origin: top center;
            z-index: 900;
            width: max-content;
            max-width: 90vw;
            /* Importante: Definir raio para o glass herdar */
            border-radius: 20px; 
            display: flex; 
            align-items: center; 
            gap: 12px;
            padding: 12px 20px; 
            animation: popIn 0.35s var(--ios-ease) forwards;
          }
          
          .info-popup.closing { animation: popOut 0.2s var(--ios-ease) forwards; }
          
          @keyframes popIn { 
            0% { opacity: 0; transform: translateX(-50%) scale(0.9) translateY(-8px); } 
            100% { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); } 
          }
          @keyframes popOut { 
            to { opacity: 0; transform: translateX(-50%) scale(0.95); } 
          }

          .info-icon { font-size: 1.1rem; color: var(--ios-blue); }
          .info-text { font-size: 0.85rem; color: #fff; margin: 0; }

          /* --- HERO COMPLETO --- */
          .hero-static-container { width: 100%; margin-bottom: 2rem; }
          .hero-wrapper {
            display: block; width: 100%; 
            /* Altura fixa maior para preencher bem a tela */
            height: 60vh; max-height: 550px; min-height: 350px;
            position: relative;
            border-radius: 32px; 
            overflow: hidden;
            /* Sombra suave atrás do Hero */
            box-shadow: 0 20px 50px -20px rgba(0,0,0,0.7);
            border: 1px solid rgba(255,255,255,0.08);
          }
          
          .hero-backdrop { width: 100%; height: 100%; position: relative; }
          .hero-backdrop img {
            width: 100%; height: 100%; 
            object-fit: cover; object-position: center top;
            transition: transform 1.5s var(--ios-ease);
          }
          
          .hero-wrapper:hover .hero-backdrop img { transform: scale(1.03); }

          .hero-overlay {
            position: absolute; inset: 0;
            background: linear-gradient(to top, #000 0%, rgba(0,0,0,0.6) 50%, transparent 100%);
          }
          
          .hero-content {
            position: absolute; bottom: 0; left: 0; width: 100%; 
            padding: 2.5rem; z-index: 2;
            display: flex; flex-direction: column; gap: 6px;
          }
          
          .hero-badge {
            background: rgba(255,255,255,0.2); backdrop-filter: blur(8px);
            padding: 5px 12px; border-radius: 20px; font-size: 0.7rem; 
            font-weight: 700; text-transform: uppercase; align-self: flex-start;
            margin-bottom: 5px; color: rgba(255,255,255,0.95);
            border: 1px solid rgba(255,255,255,0.1);
          }

          .hero-title {
            font-size: 2.2rem; font-weight: 800; color: #fff;
            letter-spacing: -0.03em; line-height: 1.1;
            text-shadow: 0 4px 12px rgba(0,0,0,0.5);
          }
          
          .hero-desc {
             font-size: 0.95rem; color: rgba(255,255,255,0.75); 
             line-height: 1.5; max-width: 600px;
             display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
          }

          /* --- GRID & CARDS --- */
          .container {
            max-width: 1200px; margin: 0 auto;
            padding: 7rem 1.5rem 8rem 1.5rem;
          }
          
          .page-title {
            font-size: 1.6rem; font-weight: 700; margin-bottom: 1.5rem;
            color: #fff; letter-spacing: -0.03em;
          }
          .page-title-below { margin-top: 1rem; }

          .content-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 24px 14px; 
            width: 100%;
          }
          
          .card-wrapper { display: flex; flex-direction: column; width: 100%; position: relative; }
          
          .card-poster-frame {
            position: relative; 
            border-radius: 18px; 
            overflow: hidden;
            aspect-ratio: 2/3; 
            background: #1c1c1e;
            /* Apenas borda brilha, sem pular */
            border: 1px solid rgba(255,255,255,0.1); 
            transition: border-color 0.3s ease;
          }
          .card-wrapper:hover .card-poster-frame { border-color: rgba(255,255,255,0.4); }
          
          .content-poster { width: 100%; height: 100%; object-fit: cover; }
          
          .card-title {
            margin-top: 10px; font-size: 0.85rem; font-weight: 500;
            color: rgba(255, 255, 255, 0.7); line-height: 1.3;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            transition: color 0.2s;
          }
          .card-wrapper:hover .card-title { color: #fff; }
          
          .fav-btn {
            position: absolute; top: 8px; right: 8px; 
            width: 32px; height: 32px; border-radius: 50%;
            /* Sobrescreve background do glass para ser mais escuro no card */
            background: rgba(0,0,0,0.4) !important;
            backdrop-filter: blur(4px);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; opacity: 0; transform: scale(0.9); transition: all 0.3s var(--ios-ease);
            border: none; z-index: 20;
          }
          .card-poster-frame:hover .fav-btn, .fav-btn:active { opacity: 1; transform: scale(1); }
          @media (hover: none) { .fav-btn { opacity: 1; transform: scale(1); } }
          
          .heart-pulse { animation: heartZoom 0.4s ease; }
          @keyframes heartZoom { 50% { transform: scale(1.3); } }

          /* --- NAV ICONS & SEARCH --- */
          .nav-btn {
            flex: 1; display: flex; align-items: center; justify-content: center;
            height: 100%; color: rgba(255,255,255,0.4); 
            transition: color 0.3s ease, transform 0.2s;
          }
          .nav-btn i { font-size: 20px; } /* Ícones ligeiramente maiores */
          .nav-btn.active { color: #fff; }
          .nav-btn:active { transform: scale(0.9); }
          
          .search-wrap { 
            width: 100%; padding: 0 16px; 
            display: flex; align-items: center; gap: 10px;
          }
          .search-icon-input { color: rgba(255,255,255,0.4); font-size: 14px; }
          .search-wrap input {
            width: 100%; background: transparent; border: none; outline: none;
            color: #fff; font-size: 16px; font-family: inherit;
          }

          /* --- TOASTS FIX --- */
          .toast-wrap {
            position: fixed; 
            bottom: calc(20px + var(--pill-height) + 16px);
            left: 50%; transform: translateX(-50%); 
            z-index: 990; pointer-events: none;
            display: flex; flex-direction: column; align-items: center;
          }
          
          .toast {
            pointer-events: auto;
            display: flex; align-items: center; gap: 12px;
            padding: 12px 20px; 
            border-radius: 30px; /* Redondo completo */
            margin-top: 8px;
            animation: slideUp 0.4s var(--ios-ease) forwards;
          }
          .toast.closing { animation: fadeOut 0.3s ease forwards; }
          
          @keyframes slideUp { from { opacity:0; transform:translateY(20px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
          @keyframes fadeOut { to { opacity:0; transform:translateY(-10px); } }

          .toast-icon { 
              width: 20px; height: 20px; border-radius: 50%; 
              display: flex; align-items: center; justify-content: center; font-size: 10px; 
          }
          .toast.success .toast-icon { background: #34c759; color: #fff; }
          .toast.info .toast-icon { background: #007aff; color: #fff; }
          .toast-msg { font-size: 13px; font-weight: 500; color: #fff; }

          /* --- FOOTER & MISC --- */
          .footer-credits {
            margin-top: 4rem; padding: 2rem; text-align: center;
            color: rgba(255,255,255,0.2); font-size: 0.75rem;
          }
          .spinner {
            width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.1);
            border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          .empty-state { display: flex; flex-direction: column; align-items: center; color: #555; margin-top: 4rem; gap: 10px; }

          @media (max-width: 768px) {
            .container { padding-left: 1rem; padding-right: 1rem; }
            .content-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 16px 10px; }
            .hero-wrapper { height: 50vh; border-radius: 24px; }
            .hero-title { font-size: 1.8rem; }
            .bar-container { width: 92%; gap: 8px; }
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
            <p>Sua lista está vazia</p>
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
