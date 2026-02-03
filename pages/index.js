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

// Hook de Debounce para busca
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
        >
          <i className="fas fa-sliders" style={{ fontSize: '14px' }}></i>
        </button>

        <div className="pill-container glass-panel">
          <span key={label} className="bar-label">{label}</span>
        </div>

        <button 
          className="round-btn glass-panel" 
          onClick={handleRightClick}
        >
          <i className={scrolled ? "fas fa-arrow-up" : "fas fa-circle-info"} style={{ fontSize: '15px' }}></i>
        </button>
      </header>

      {/* Popup de Info (Surge de trás do Header) */}
      {showInfo && (
        <div className={`popup-message top-origin glass-panel ${infoClosing ? 'closing' : ''}`}>
          <i className="fas fa-shield-halved popup-icon"></i>
          <p>Recomendado uso de <strong>AdBlock</strong>.</p>
        </div>
      )}

      {/* Popup Técnico (Surge de trás do Header) */}
      {showTech && (
        <div className={`popup-message top-origin glass-panel ${techClosing ? 'closing' : ''}`}>
          <i className="fas fa-terminal popup-icon" style={{ color: '#0A84FF' }}></i>
          <div>
            <strong>System Status</strong>
            <div style={{ fontSize: '11px', opacity: 0.7 }}>Core v3.1 • React 18</div>
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
      try { await navigator.share({ title: 'Yoshikawa Player', url: window.location.href }) } 
      catch (err) {}
    } else {
      alert('Link copiado!')
    }
  }

  return (
    <div className="bar-container bottom-bar">
      <button className="round-btn glass-panel" onClick={handleShare}>
        <i className="fas fa-arrow-up-from-bracket" style={{ fontSize: '15px', transform: 'translateY(-1px)' }}></i>
      </button>

      <div className={`pill-container glass-panel ${searchActive ? 'search-mode' : ''}`}>
        {searchActive ? (
          <div className="search-wrap">
            <i className="fas fa-magnifying-glass search-icon-input"></i>
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
              <i className="fas fa-clapperboard"></i>
            </button>
            <button className={`nav-btn ${activeSection === 'recommendations' ? 'active' : ''}`} onClick={() => setActiveSection('recommendations')}>
              <i className="fas fa-star"></i>
            </button>
            <button className={`nav-btn ${activeSection === 'favorites' ? 'active' : ''}`} onClick={() => setActiveSection('favorites')}>
              <i className="fas fa-bookmark"></i>
            </button>
          </>
        )}
      </div>

      <button className="round-btn glass-panel" onClick={() => setSearchActive(s => !s)}>
        <i className={searchActive ? 'fas fa-xmark' : 'fas fa-magnifying-glass'}></i>
      </button>
    </div>
  )
}

// --- TOAST (Notificações Inferiores) ---
export const ToastContainer = ({ toast, closeToast }) => {
  if (!toast) return null
  return (
    <div className={`popup-message bottom-origin glass-panel ${toast.closing ? 'closing' : ''} ${toast.type}`}>
      <i className={`fas ${toast.type === 'success' ? 'fa-check' : 'fa-info-circle'}`}></i>
      <span>{toast.message}</span>
    </div>
  )
}

// --- HERO (Banner Principal) ---
export const HeroFixed = ({ item, isFavorite, toggleFavorite }) => {
  if (!item) return null

  const getBackdropUrl = (i) =>
    i.backdrop_path ? `https://image.tmdb.org/t/p/original${i.backdrop_path}` :
    i.poster_path ? `https://image.tmdb.org/t/p/w1280${i.poster_path}` : DEFAULT_BACKDROP

  const favActive = isFavorite(item)

  return (
    <div className="hero-container">
      <Link href={`/${item.media_type}/${item.id}`} className="hero-link">
        <div className="hero-bg">
          <img src={getBackdropUrl(item)} alt={item.title} />
          <div className="hero-gradient"></div>
        </div>
        <div className="hero-info">
          <span className="hero-tag">Destaque</span>
          <h1>{item.title || item.name}</h1>
          <p className="hero-overview">{item.overview}</p>
        </div>
      </Link>
      <button className="hero-fav glass-panel" onClick={(e) => { e.preventDefault(); toggleFavorite(item) }}>
        <i className={favActive ? "fas fa-heart" : "far fa-heart"} style={{ color: favActive ? '#FF3B30' : '#FFF' }}></i>
      </button>
    </div>
  )
}

// --- CARD (Filmes/Séries - CSS Revertido/Clássico) ---
export const MovieCard = ({ item, isFavorite, toggleFavorite }) => {
  const [animating, setAnimating] = useState(false)
  
  const handleFav = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setAnimating(true)
    toggleFavorite(item)
    setTimeout(() => setAnimating(false), 400)
  }

  return (
    <div className="card-item">
      <Link href={`/${item.media_type}/${item.id}`} className="card-link">
        <div className="card-poster">
          <img 
            src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : DEFAULT_POSTER} 
            alt={item.title} 
            loading="lazy"
          />
          <button className="card-fav" onClick={handleFav}>
            <i 
              className={`${isFavorite ? 'fas fa-heart' : 'far fa-heart'} ${animating ? 'pulse' : ''}`}
              style={{ color: isFavorite ? '#FF3B30' : '#FFF' }}
            ></i>
          </button>
        </div>
        <div className="card-title">{item.title || item.name}</div>
      </Link>
    </div>
  )
}

// --- LAYOUT PRINCIPAL ---
export default function Home() {
  const [releases, setReleases] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [favorites, setFavorites] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [heroFeatured, setHeroFeatured] = useState(null)
  
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSection, setActiveSection] = useState('releases')
  const [searchActive, setSearchActive] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Estados de Popups (Exclusivos)
  const [showInfo, setShowInfo] = useState(false)
  const [infoClosing, setInfoClosing] = useState(false)
  
  const [showTech, setShowTech] = useState(false)
  const [techClosing, setTechClosing] = useState(false)

  const [currentToast, setCurrentToast] = useState(null)
  const [toastClosing, setToastClosing] = useState(false)

  const searchInputRef = useRef(null)
  
  // Timers Refs
  const infoTimer = useRef(null)
  const techTimer = useRef(null)
  const toastTimer = useRef(null)

  // --- CONTROLE DE POPUPS ---
  const closeAllPopups = useCallback(() => {
    if (showInfo) triggerCloseInfo()
    if (showTech) triggerCloseTech()
    if (currentToast) triggerCloseToast()
  }, [showInfo, showTech, currentToast])

  // Fecha Info
  const triggerCloseInfo = () => {
    setInfoClosing(true)
    setTimeout(() => { setShowInfo(false); setInfoClosing(false) }, 400)
    if (infoTimer.current) clearTimeout(infoTimer.current)
  }

  // Fecha Tech
  const triggerCloseTech = () => {
    setTechClosing(true)
    setTimeout(() => { setShowTech(false); setTechClosing(false) }, 400)
    if (techTimer.current) clearTimeout(techTimer.current)
  }

  // Fecha Toast
  const triggerCloseToast = () => {
    setToastClosing(true)
    setTimeout(() => { setCurrentToast(null); setToastClosing(false) }, 400)
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }

  // Abre Info (Fecha outros e inicia timer de 3s)
  const toggleInfo = () => {
    if (showInfo) {
      triggerCloseInfo()
    } else {
      if (showTech) triggerCloseTech() // Fecha tech se aberto
      setShowInfo(true)
      infoTimer.current = setTimeout(triggerCloseInfo, 3000)
    }
  }

  // Abre Tech (Fecha outros e inicia timer de 3s)
  const toggleTech = () => {
    if (showTech) {
      triggerCloseTech()
    } else {
      if (showInfo) triggerCloseInfo() // Fecha info se aberto
      setShowTech(true)
      techTimer.current = setTimeout(triggerCloseTech, 3000)
    }
  }

  // Mostra Toast (Fecha se tiver outro)
  const showToast = (message, type = 'info') => {
    if (currentToast) {
      // Se já tem um, fecha rápido e abre o próximo (simplificação para evitar fila complexa visual)
      setToastClosing(true)
      setTimeout(() => {
        setCurrentToast({ message, type })
        setToastClosing(false)
        startToastTimer()
      }, 200) // Pequeno delay
    } else {
      setCurrentToast({ message, type })
      startToastTimer()
    }
  }

  const startToastTimer = () => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(triggerCloseToast, 3000)
  }

  // Scroll Handler
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50)
      if (window.scrollY > 10) closeAllPopups()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [closeAllPopups])

  // --- DATA LOADING (Mantido igual) ---
  useEffect(() => { 
    loadHomeContent()
    loadFavorites() 
  }, [])

  useEffect(() => {
    if (searchActive && searchInputRef.current) searchInputRef.current.focus()
    if (!searchActive) { setSearchResults([]); setSearchQuery('') }
  }, [searchActive])

  const fetchTMDBPages = async (url) => {
    try {
      const r1 = await fetch(`${url}&page=1`).then(r => r.json())
      const r2 = await fetch(`${url}&page=2`).then(r => r.json())
      return [...(r1.results || []), ...(r2.results || [])]
    } catch { return [] }
  }

  const loadHomeContent = async () => {
    try {
      const [moviesNow, tvNow, moviesPop] = await Promise.all([
        fetchTMDBPages(`https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&language=pt-BR`),
        fetchTMDBPages(`https://api.themoviedb.org/3/tv/on_the_air?api_key=${TMDB_API_KEY}&language=pt-BR`),
        fetchTMDBPages(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=pt-BR`)
      ])
      
      const rel = [...moviesNow.map(i=>({...i, media_type:'movie'})), ...tvNow.map(i=>({...i, media_type:'tv'}))]
        .filter(i => i.poster_path)
        .sort((a,b) => new Date(b.release_date||b.first_air_date) - new Date(a.release_date||a.first_air_date))
        .slice(0, 40)
      
      const rec = moviesPop.map(i=>({...i, media_type:'movie'})).filter(i=>i.poster_path)

      if (rec.length > 0) setHeroFeatured(rec[0])
      setReleases(rel)
      setRecommendations(rec.slice(1))
    } catch (e) { console.error(e) }
  }

  const fetchSearch = async (q) => {
    if (!q.trim()) return
    setLoading(true)
    try {
      const res = await fetchTMDBPages(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}&language=pt-BR`)
      setSearchResults(res.filter(i=>i.poster_path && (i.media_type==='movie'||i.media_type==='tv')).sort((a,b)=>b.popularity-a.popularity))
    } catch { showToast('Erro na busca', 'error') }
    finally { setLoading(false) }
  }

  const debouncedSearch = useDebounce(fetchSearch, 500)
  const handleSearchChange = (q) => { setSearchQuery(q); if(q) debouncedSearch(q) }

  const loadFavorites = () => {
    const s = localStorage.getItem('yoshikawaFavorites')
    if (s) setFavorites(JSON.parse(s))
  }

  const isFavorite = (item) => favorites.some(f => f.id === item.id)

  const toggleFavorite = (item) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === item.id)
      let next
      if (exists) {
        next = prev.filter(f => f.id !== item.id)
        showToast('Removido dos favoritos')
      } else {
        next = [...prev, item]
        showToast('Adicionado aos favoritos', 'success')
      }
      localStorage.setItem('yoshikawaFavorites', JSON.stringify(next))
      return next
    })
  }

  const activeList = searchActive ? searchResults : (activeSection === 'releases' ? releases : (activeSection === 'recommendations' ? recommendations : favorites))
  const headerLabel = scrolled ? (searchActive ? 'Busca' : SECTION_TITLES[activeSection]) : 'Yoshikawa'

  return (
    <>
      <Head>
        <title>Yoshikawa Player</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style>{`
          :root {
            --glass-bg: rgba(22, 22, 24, 0.7);
            --glass-border: rgba(255, 255, 255, 0.1);
            --ios-ease: cubic-bezier(0.32, 0.72, 0, 1);
            --primary: #0A84FF;
          }
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
          body { background: #000; color: #fff; font-family: 'Inter', sans-serif; padding-bottom: 100px; }
          
          /* GLASS STYLES */
          .glass-panel {
            background: var(--glass-bg);
            backdrop-filter: blur(25px) saturate(180%);
            -webkit-backdrop-filter: blur(25px) saturate(180%);
            border: 1px solid var(--glass-border);
            box-shadow: 0 4px 30px rgba(0,0,0,0.3);
          }

          /* BARS */
          .bar-container {
            position: fixed; left: 50%; transform: translateX(-50%);
            z-index: 1000; /* Z-Index Alto para ficar na frente de tudo */
            display: flex; gap: 12px; width: 92%; max-width: 600px;
          }
          .top-bar { top: 16px; }
          .bottom-bar { bottom: 20px; }

          .round-btn {
            width: 48px; height: 48px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            color: #fff; cursor: pointer; transition: 0.2s;
          }
          .round-btn:active { transform: scale(0.9); background: rgba(255,255,255,0.15); }

          .pill-container {
            flex: 1; height: 48px; border-radius: 50px;
            display: flex; align-items: center; justify-content: center;
          }

          .bar-label { font-weight: 600; font-size: 15px; }

          .nav-btn {
            flex: 1; height: 100%; display: flex; align-items: center; justify-content: center;
            color: rgba(255,255,255,0.4); font-size: 18px; transition: 0.3s; background: none; border: none;
          }
          .nav-btn.active { color: #fff; }
          
          /* SEARCH */
          .search-wrap { display: flex; align-items: center; gap: 8px; width: 100%; padding: 0 16px; }
          .search-wrap input { background: transparent; border: none; color: #fff; font-size: 16px; width: 100%; outline: none; }
          .search-icon-input { color: rgba(255,255,255,0.5); }

          /* POPUPS & TOASTS (Animação de "Trás" da Navbar) */
          .popup-message {
            position: fixed; left: 50%; 
            /* Z-Index menor que as barras (1000) para surgir de "baixo" delas visualmente */
            z-index: 900; 
            padding: 12px 24px; border-radius: 50px;
            display: flex; align-items: center; gap: 10px;
            font-size: 13px; color: #fff;
            pointer-events: none; /* Para não bloquear clique enquanto anima, depois ativa se necessário */
          }

          /* Configuração para Popups do Topo (Info/Tech) */
          .top-origin {
            top: 70px; /* Logo abaixo da Top Bar (16px + 48px + margem) */
            transform-origin: top center;
            animation: slideOutTop 0.4s var(--ios-ease) forwards;
          }
          .top-origin.closing { animation: slideInTop 0.4s var(--ios-ease) forwards; }

          /* Configuração para Popups do Fundo (Toasts) */
          .bottom-origin {
            bottom: 80px; /* Logo acima da Bottom Nav (20px + 48px + margem) */
            transform-origin: bottom center;
            animation: slideOutBottom 0.4s var(--ios-ease) forwards;
          }
          .bottom-origin.closing { animation: slideInBottom 0.4s var(--ios-ease) forwards; }

          /* Animações Keyframes - "Surgir de trás" */
          /* Do Topo: Começa "dentro" do header (negativo Y) e opaco */
          @keyframes slideOutTop {
            from { opacity: 0; transform: translateX(-50%) translateY(-30px) scale(0.85); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          }
          /* Retorno ao Topo */
          @keyframes slideInTop {
            from { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
            to   { opacity: 0; transform: translateX(-50%) translateY(-30px) scale(0.85); }
          }

          /* Do Fundo: Começa "dentro" da navbar (positivo Y) e opaco */
          @keyframes slideOutBottom {
            from { opacity: 0; transform: translateX(-50%) translateY(30px) scale(0.85); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          }
          /* Retorno ao Fundo */
          @keyframes slideInBottom {
            from { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
            to   { opacity: 0; transform: translateX(-50%) translateY(30px) scale(0.85); }
          }

          /* HERO */
          .hero-container { margin: 80px 1.5rem 2rem; position: relative; border-radius: 24px; overflow: hidden; height: 55vh; max-height: 500px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); }
          .hero-bg { width: 100%; height: 100%; position: relative; }
          .hero-bg img { width: 100%; height: 100%; object-fit: cover; }
          .hero-gradient { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); }
          .hero-info { position: absolute; bottom: 0; padding: 2rem; width: 100%; }
          .hero-tag { background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; display: inline-block; }
          .hero-info h1 { font-size: 2rem; line-height: 1.1; margin-bottom: 8px; }
          .hero-overview { font-size: 0.9rem; opacity: 0.8; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; max-width: 600px; }
          .hero-fav { position: absolute; top: 16px; right: 16px; width: 40px; height: 40px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 50; }

          /* CARDS GRID - CSS CLÁSSICO/SIMPLES REVERTIDO */
          .content-grid {
            display: grid;
            /* Grid flexível simples */
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 24px 16px;
            padding: 0 1.5rem;
          }

          .card-item {
            width: 100%;
            /* Remove qualquer position relative complexo externo */
          }

          .card-link { display: block; }

          .card-poster {
            position: relative;
            width: 100%;
            aspect-ratio: 2/3; /* Proporção padrão de poster */
            border-radius: 12px; /* Borda arredondada simples */
            overflow: hidden;
            background: #222;
          }

          .card-poster img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            transition: transform 0.3s ease;
          }
          
          /* Efeito Zoom na imagem ao passar mouse */
          .card-poster:hover img { transform: scale(1.05); }

          .card-fav {
            position: absolute; top: 6px; right: 6px;
            background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
            width: 28px; height: 28px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            border: none; cursor: pointer; color: #fff;
          }

          .card-title {
            margin-top: 8px;
            font-size: 13px;
            font-weight: 500;
            color: rgba(255,255,255,0.8);
            /* Texto cortado em 1 linha */
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }

          .pulse { animation: pulse 0.3s ease; }
          @keyframes pulse { 50% { transform: scale(1.3); } }

          .page-title { padding: 0 1.5rem; margin-bottom: 1.5rem; font-size: 1.4rem; }
          
          .empty { text-align: center; margin-top: 3rem; opacity: 0.5; }
          
          @media (max-width: 600px) {
            .content-grid { grid-template-columns: repeat(2, 1fr); gap: 16px 12px; }
            .hero-container { height: 45vh; margin-top: 70px; }
            .hero-info h1 { font-size: 1.5rem; }
          }
        `}</style>
      </Head>

      <Header 
        label={headerLabel} 
        scrolled={scrolled}
        showInfo={showInfo} toggleInfo={toggleInfo} infoClosing={infoClosing}
        showTech={showTech} toggleTech={toggleTech} techClosing={techClosing}
      />

      <ToastContainer toast={currentToast} />

      <main>
        {!searchActive && !loading && (
          <HeroFixed item={heroFeatured || releases[0]} isFavorite={isFavorite} toggleFavorite={toggleFavorite} />
        )}

        <h2 className="page-title">{scrolled ? '' : (searchActive ? (searchQuery ? `Resultados para "${searchQuery}"` : 'Buscar') : SECTION_TITLES[activeSection])}</h2>

        {loading && <div className="empty"><div className="spinner"></div></div>}

        <div className="content-grid">
          {activeList.map(item => (
            <MovieCard 
              key={getItemKey(item)} 
              item={item} 
              isFavorite={isFavorite(item)} 
              toggleFavorite={toggleFavorite} 
            />
          ))}
        </div>
        
        {activeList.length === 0 && !loading && <div className="empty">Nada por aqui.</div>}
      </main>

      <BottomNav 
        activeSection={activeSection} setActiveSection={setActiveSection}
        searchActive={searchActive} setSearchActive={setSearchActive}
        searchQuery={searchQuery} setSearchQuery={handleSearchChange}
        onSearchSubmit={(q) => handleSearchChange(q)} inputRef={searchInputRef}
      />
    </>
  )
}
