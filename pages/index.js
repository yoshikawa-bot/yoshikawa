import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'

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

export const Header = ({ label, scrolled, showInfo, toggleInfo, infoClosing, showTech, toggleTech, techClosing, isPlaying, onBack }) => {
  const handleRightClick = (e) => {
    e.stopPropagation()
    if (isPlaying) return
    if (scrolled) window.scrollTo({ top: 0, behavior: 'smooth' })
    else toggleInfo()
  }

  return (
    <>
      <header className={`bar-container top-bar ${scrolled ? 'scrolled-state' : ''}`}>
        {isPlaying ? (
          <button className="round-btn glass-panel" onClick={onBack} title="Voltar">
            <i className="fas fa-arrow-left" style={{ fontSize: '15px' }}></i>
          </button>
        ) : (
          <button className="round-btn glass-panel" onClick={(e) => { e.stopPropagation(); toggleTech() }} title="Info Técnica">
            <i className="fas fa-microchip" style={{ fontSize: '14px' }}></i>
          </button>
        )}

        <div className="pill-container glass-panel">
          <span key={label} className="bar-label">{label}</span>
        </div>

        {!isPlaying && (
          <button className="round-btn glass-panel" title={scrolled ? "Voltar ao topo" : "Informações"} onClick={handleRightClick}>
            <i className={scrolled ? "fas fa-chevron-up" : "fas fa-info-circle"} style={{ fontSize: '14px' }}></i>
          </button>
        )}
      </header>

      {showInfo && (
        <div className={`info-popup glass-panel ${infoClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="popup-icon-wrapper">
            <i className="fas fa-shield-halved"></i>
          </div>
          <div className="popup-content">
            <p className="popup-title">Proteção Recomendada</p>
            <p className="popup-text">Use <strong>Brave</strong> ou <strong>AdBlock</strong> para melhor experiência</p>
          </div>
        </div>
      )}

      {showTech && (
        <div className={`info-popup glass-panel ${techClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="popup-icon-wrapper tech">
            <i className="fas fa-microchip"></i>
          </div>
          <div className="popup-content">
            <p className="popup-title">Informações Técnicas</p>
            <p className="popup-text">v2.7.1 Player • React 18 • TMDB</p>
          </div>
        </div>
      )}
    </>
  )
}

export const BottomNav = ({ activeSection, setActiveSection, searchActive, setSearchActive, searchQuery, setSearchQuery, onSearchSubmit, inputRef, visible }) => {
  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Yoshikawa Player', url: window.location.href }) } catch (err) {}
    } else { alert('Compartilhar não suportado') }
  }

  if (!visible) return null

  return (
    <div className="bar-container bottom-bar">
      <button className="round-btn glass-panel" onClick={handleShare} title="Compartilhar">
        <i className="fas fa-arrow-up-from-bracket" style={{ fontSize: '15px', transform: 'translateY(-1px)' }}></i>
      </button>

      <div className={`pill-container glass-panel ${searchActive ? 'search-mode' : ''}`}>
        {searchActive ? (
          <div className="search-wrap">
            <input
              ref={inputRef} type="text" placeholder="Buscar..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onSearchSubmit(searchQuery)}
            />
          </div>
        ) : (
          <>
            <button className={`nav-btn ${activeSection === 'releases' ? 'active' : ''}`} onClick={() => setActiveSection('releases')}><i className="fas fa-film"></i></button>
            <button className={`nav-btn ${activeSection === 'recommendations' ? 'active' : ''}`} onClick={() => setActiveSection('recommendations')}><i className="fas fa-fire-flame-curved"></i></button>
            <button className={`nav-btn ${activeSection === 'favorites' ? 'active' : ''}`} onClick={() => setActiveSection('favorites')}><i className="fas fa-heart"></i></button>
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
        <div className="toast-icon-wrapper">
          <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : toast.type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}`}></i>
        </div>
        <div className="toast-content">
          <div className="toast-title">{toast.type === 'success' ? 'Sucesso' : toast.type === 'error' ? 'Erro' : 'Info'}</div>
          <div className="toast-msg">{toast.message}</div>
        </div>
      </div>
    </div>
  )
}

export const MovieCard = ({ item, isFavorite, toggleFavorite, onSelect }) => {
  const [animating, setAnimating] = useState(false)

  const handleFavClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setAnimating(true)
    toggleFavorite(item)
    setTimeout(() => setAnimating(false), 400)
  }

  return (
    <div className="card-wrapper" onClick={() => onSelect(item)}>
      <div className="card-poster-frame">
        <img
          src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : DEFAULT_POSTER}
          alt={item.title || item.name}
          className="content-poster"
          loading="lazy"
        />
        <button className="fav-btn glass-panel" onClick={handleFavClick}>
          <i className={`${isFavorite ? 'fas fa-heart' : 'far fa-heart'} ${animating ? 'heart-pulse' : ''}`} style={{ color: isFavorite ? '#ff3b30' : '#ffffff' }}></i>
        </button>
      </div>
      <span className="card-title">{item.title || item.name}</span>
    </div>
  )
}

export const PlayerView = ({ item }) => {
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const isSerie = item.media_type === 'tv'

  const getEmbedUrl = () => {
    const baseUrl = 'https://superflixapi.cv'
    const type = isSerie ? 'serie' : 'filme'
    const params = isSerie ? `/${season}/${episode}` : ''
    // Adiciona #noEpList e cor para combinar com o tema
    return `${baseUrl}/${type}/${item.id}${params}?#color:0A84FF&noEpList`
  }

  return (
    <div className="player-container">
      <div className="player-wrapper glass-panel">
        <iframe
          src={getEmbedUrl()}
          width="100%"
          height="100%"
          frameBorder="0"
          allowFullScreen
          title="Player"
        ></iframe>
      </div>
      
      {isSerie && (
        <div className="controls-row">
          <div className="control-group glass-panel">
            <span>Temp</span>
            <input type="number" min="1" value={season} onChange={(e) => setSeason(e.target.value)} />
          </div>
          <div className="control-group glass-panel">
            <span>Episódio</span>
            <input type="number" min="1" value={episode} onChange={(e) => setEpisode(e.target.value)} />
          </div>
        </div>
      )}
      
      <div className="player-info">
        <h2>{item.title || item.name}</h2>
        <p>{isSerie ? `Temporada ${season} • Episódio ${episode}` : 'Filme'}</p>
      </div>
    </div>
  )
}

export const Footer = () => (
  <footer className="footer-credits">
    <p className="footer-main">Yoshikawa Systems &copy; {new Date().getFullYear()}</p>
    <p className="footer-author">Criado por Kawa</p>
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
  const [selectedMedia, setSelectedMedia] = useState(null)

  const searchInputRef = useRef(null)
  const toastTimerRef = useRef(null)

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

  const manualCloseToast = () => { if (currentToast) setCurrentToast({ ...currentToast, closing: true }) }

  const closeAllPopups = useCallback(() => {
    if (showInfoPopup && !infoClosing) {
      setInfoClosing(true)
      setTimeout(() => { setShowInfoPopup(false); setInfoClosing(false) }, 400)
    }
    if (showTechPopup && !techClosing) {
      setTechClosing(true)
      setTimeout(() => { setShowTechPopup(false); setTechClosing(false) }, 400)
    }
    if (currentToast && !currentToast.closing) setCurrentToast(prev => ({ ...prev, closing: true }))
  }, [showInfoPopup, infoClosing, showTechPopup, techClosing, currentToast])

  const toggleInfoPopup = () => { 
    if (showTechPopup || currentToast) {
      closeAllPopups()
      setTimeout(() => { if (!showInfoPopup) setShowInfoPopup(true) }, 200)
    } else {
      if (showInfoPopup) { setInfoClosing(true); setTimeout(() => { setShowInfoPopup(false); setInfoClosing(false) }, 400) }
      else setShowInfoPopup(true)
    }
  }

  const toggleTechPopup = () => {
    if (showInfoPopup || currentToast) {
      closeAllPopups()
      setTimeout(() => { if (!showTechPopup) setShowTechPopup(true) }, 200)
    } else {
      if (showTechPopup) { setTechClosing(true); setTimeout(() => { setShowTechPopup(false); setTechClosing(false) }, 400) }
      else setShowTechPopup(true)
    }
  }

  useEffect(() => {
    const onScroll = () => { 
      if (window.scrollY > 10) closeAllPopups()
      setScrolled(window.scrollY > 60) 
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    const onClick = (e) => { 
      if (!e.target.closest('.info-popup') && !e.target.closest('.toast') && !e.target.closest('.round-btn') && !e.target.closest('.pill-container') && !e.target.closest('.control-group')) {
        closeAllPopups() 
      }
    }
    window.addEventListener('click', onClick)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('click', onClick) }
  }, [closeAllPopups])

  useEffect(() => { loadHomeContent(); loadFavorites() }, [])

  useEffect(() => {
    if (searchActive && searchInputRef.current) searchInputRef.current.focus()
    if (!searchActive) { setSearchResults([]); setSearchQuery('') }
  }, [searchActive])

  const fetchTMDB = async (url) => {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Erro')
      const data = await response.json()
      return data.results || []
    } catch { return [] }
  }

  const fetchTMDBPages = async (endpoint) => {
    try {
      const [r1, r2] = await Promise.all([fetchTMDB(`${endpoint}&page=1`), fetchTMDB(`${endpoint}&page=2`)])
      return [...r1, ...r2]
    } catch { return [] }
  }

  const fetchSearchResults = async (query) => {
    if (!query.trim()) { setSearchResults([]); setLoading(false); return }
    setLoading(true)
    try {
      const [m, t] = await Promise.all([
        fetchTMDBPages(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`),
        fetchTMDBPages(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`)
      ])
      const combined = [...m.map(i => ({...i, media_type: 'movie'})), ...t.map(i => ({...i, media_type: 'tv'}))].filter(i => i.poster_path).sort((a,b) => b.popularity - a.popularity).slice(0, 40)
      setSearchResults(combined)
    } catch { showToast('Erro na busca', 'error'); setSearchResults([]) } 
    finally { setLoading(false) }
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
      const [mn, tn, mp, tp] = await Promise.all([
        fetchTMDBPages(`https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&language=pt-BR`),
        fetchTMDBPages(`https://api.themoviedb.org/3/tv/on_the_air?api_key=${TMDB_API_KEY}&language=pt-BR`),
        fetchTMDBPages(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=pt-BR`),
        fetchTMDBPages(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&language=pt-BR`)
      ])
      const rel = [...mn.map(i => ({...i, media_type: 'movie'})), ...tn.map(i => ({...i, media_type: 'tv'}))].filter(i => i.poster_path).sort((a,b) => new Date(b.release_date||b.first_air_date) - new Date(a.release_date||a.first_air_date)).slice(0, 36)
      const rec = [...mp.map(i => ({...i, media_type: 'movie'})), ...tp.map(i => ({...i, media_type: 'tv'}))].filter(i => i.poster_path).sort((a,b) => b.popularity - a.popularity).slice(0, 36)
      setReleases(rel)
      setRecommendations(rec)
    } catch (e) { console.error(e) }
  }

  const loadFavorites = () => {
    try { setFavorites(JSON.parse(localStorage.getItem('yoshikawaFavorites')) || []) } catch { setFavorites([]) }
  }

  const isFavorite = (item) => favorites.some(f => f.id === item.id && f.media_type === item.media_type)

  const toggleFavorite = (item) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === item.id && f.media_type === item.media_type)
      let updated
      if (exists) { updated = prev.filter(f => !(f.id === item.id && f.media_type === item.media_type)); showToast('Removido', 'info') } 
      else { updated = [...prev, { id: item.id, media_type: item.media_type, title: item.title||item.name, poster_path: item.poster_path }]; showToast('Adicionado', 'success') }
      localStorage.setItem('yoshikawaFavorites', JSON.stringify(updated))
      return updated
    })
  }

  // CORREÇÃO AQUI: Renomeado de activeList para displayItems para bater com o JSX
  const displayItems = searchActive ? searchResults : (activeSection === 'releases' ? releases : (activeSection === 'recommendations' ? recommendations : favorites))
  
  const pageTitle = selectedMedia ? 'Reproduzindo' : (searchActive ? 'Resultados' : (SECTION_TITLES[activeSection] || 'Conteúdo'))
  const headerLabel = scrolled ? pageTitle : 'Yoshikawa'

  return (
    <>
      <Head>
        <title>Yoshikawa Player</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
          html { scroll-behavior: smooth; }
          body {
            font-family: 'Inter', sans-serif; background: #050505; color: #f5f5f7; line-height: 1.6;
            font-size: 16px; min-height: 100vh; overflow-y: auto; overflow-x: hidden;
            background-image: radial-gradient(circle at 50% 0%, #1a1a1a, #050505 80%); background-attachment: fixed;
          }
          :root {
            --pill-height: 44px; --pill-radius: 50px; --pill-max-width: 520px; --ios-blue: #0A84FF;
            --ease-elastic: cubic-bezier(0.34, 1.56, 0.64, 1); --ease-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          button { font-family: inherit; border: none; outline: none; background: none; cursor: pointer; user-select: none; }
          img { max-width: 100%; height: auto; display: block; }

          .glass-panel {
            background: rgba(255, 255, 255, 0.06); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1); border-radius: inherit; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            transition: transform 0.3s var(--ease-elastic), background 0.3s ease;
          }
          .bar-container {
            position: fixed; left: 50%; transform: translateX(-50%); z-index: 1000; display: flex; align-items: center;
            justify-content: center; gap: 12px; width: 90%; max-width: var(--pill-max-width); transition: all 0.4s var(--ease-smooth);
          }
          .top-bar { top: 20px; }
          .bottom-bar { bottom: 20px; }
          .top-bar.scrolled-state { transform: translateX(-50%) translateY(-5px); }
          
          .round-btn {
            width: var(--pill-height); height: var(--pill-height); border-radius: 50%; display: flex; align-items: center; justify-content: center;
            color: rgba(255, 255, 255, 0.9); flex-shrink: 0; transition: all 0.3s var(--ease-elastic);
          }
          .round-btn:hover { transform: scale(1.08); background: rgba(255, 255, 255, 0.12); }
          .round-btn:active { transform: scale(0.92); }

          .pill-container {
            height: var(--pill-height); flex: 1; border-radius: var(--pill-radius); display: flex; align-items: center; justify-content: center;
            position: relative; transition: all 0.4s var(--ease-elastic);
          }
          .bar-label { font-size: 0.9rem; font-weight: 600; color: #fff; white-space: nowrap; }

          .info-popup, .toast {
            position: fixed; top: calc(20px + var(--pill-height) + 16px); left: 50%; z-index: 960;
            min-width: 320px; max-width: 90%; display: flex; align-items: center; gap: 14px; padding: 16px 18px; border-radius: 22px;
            transform: translateX(-50%) translateY(-50%) scale(0.3); opacity: 0; transform-origin: top center;
            animation: popupZoomIn 0.5s var(--ease-elastic) forwards; box-shadow: 0 20px 60px rgba(0,0,0,0.6);
          }
          .info-popup.closing, .toast.closing { animation: popupZoomOut 0.4s cubic-bezier(0.55, 0.055, 0.675, 0.19) forwards; }
          
          @keyframes popupZoomIn {
            0% { opacity: 0; transform: translateX(-50%) translateY(-50%) scale(0.3); }
            100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          }
          @keyframes popupZoomOut {
            0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
            100% { opacity: 0; transform: translateX(-50%) translateY(-30%) scale(0.5); }
          }
          
          .popup-icon-wrapper, .toast-icon-wrapper {
            width: 42px; height: 42px; min-width: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
            animation: iconPop 0.6s var(--ease-elastic) 0.1s backwards;
          }
          .toast-icon-wrapper { border-radius: 50%; }
          @keyframes iconPop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }

          .popup-icon-wrapper { background: linear-gradient(135deg, #34c759, #30d158); }
          .popup-icon-wrapper.tech, .toast.info .toast-icon-wrapper { background: linear-gradient(135deg, #0a84ff, #007aff); }
          .toast.success .toast-icon-wrapper { background: linear-gradient(135deg, #34c759, #30d158); }
          .toast.error .toast-icon-wrapper { background: linear-gradient(135deg, #ff453a, #ff3b30); }
          .popup-icon-wrapper i, .toast-icon-wrapper i { font-size: 20px; color: #fff; }

          .popup-content, .toast-content { flex: 1; display: flex; flex-direction: column; gap: 4px; animation: contentFade 0.4s ease 0.2s forwards; opacity: 0; }
          @keyframes contentFade { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }
          
          .popup-title, .toast-title { font-size: 0.95rem; font-weight: 600; color: #fff; line-height: 1.3; }
          .popup-text, .toast-msg { font-size: 0.8rem; color: rgba(255, 255, 255, 0.7); line-height: 1.4; }

          .container { max-width: 1280px; margin: 0 auto; padding: 6.5rem 2rem 7rem; }
          .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
          .page-title { font-size: 1.5rem; font-weight: 700; color: #fff; letter-spacing: -0.03em; }
          
          .status-dots { display: flex; gap: 8px; }
          .dot { width: 10px; height: 10px; border-radius: 50%; animation: dotPulse 2s ease-in-out infinite; }
          .dot.red { background: linear-gradient(135deg, #ff453a, #ff3b30); }
          .dot.yellow { background: linear-gradient(135deg, #ffd60a, #ffcc00); animation-delay: 0.3s; }
          .dot.green { background: linear-gradient(135deg, #34c759, #30d158); animation-delay: 0.6s; }
          @keyframes dotPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.6; } }

          .content-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 24px 12px; width: 100%; }
          .card-wrapper { display: flex; flex-direction: column; width: 100%; position: relative; animation: cardEntrance 0.7s var(--ease-elastic) backwards; transition: transform 0.2s ease; cursor: pointer; }
          .card-wrapper:active { transform: scale(0.95); }
          
          @keyframes cardEntrance { from { opacity: 0; transform: translateY(40px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
          .card-wrapper:nth-child(n) { animation-delay: calc(30ms * var(--i, 1)); }

          .card-poster-frame { position: relative; border-radius: 16px; overflow: hidden; aspect-ratio: 2/3; background: #1a1a1a; border: 1px solid rgba(255,255,255,0.18); transition: all 0.5s var(--ease-elastic); }
          .card-wrapper:hover .card-poster-frame { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
          .content-poster { width: 100%; height: 100%; object-fit: cover; transition: transform 0.8s var(--ease-elastic); }
          .card-wrapper:hover .content-poster { transform: scale(1.12); }
          
          .card-title { margin-top: 10px; font-size: 0.8rem; font-weight: 500; color: rgba(255, 255, 255, 0.85); line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
          .card-wrapper:hover .card-title { color: #fff; transform: translateX(2px); }

          .fav-btn { position: absolute; top: 8px; right: 8px; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; opacity: 0; transform: scale(0.8); transition: all 0.4s var(--ease-elastic); background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 20; }
          .card-poster-frame:hover .fav-btn { opacity: 1; transform: scale(1); }
          .fav-btn:hover { background: rgba(255,255,255,0.2); transform: scale(1.1); }
          .heart-pulse { animation: heartZoom 0.5s var(--ease-elastic); }
          @keyframes heartZoom { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.6); } }

          .nav-btn { flex: 1; display: flex; align-items: center; justify-content: center; height: 100%; color: rgba(255,255,255,0.4); transition: all 0.3s ease; }
          .nav-btn i { font-size: 18px; transition: all 0.4s var(--ease-elastic); }
          .nav-btn:hover i { transform: scale(1.2); color: rgba(255,255,255,0.8); }
          .nav-btn.active { color: #fff; }
          .nav-btn.active i { transform: scale(1.15); }
          
          .search-wrap { width: 100%; padding: 0 16px; animation: searchExpand 0.4s var(--ease-elastic); }
          @keyframes searchExpand { from { opacity: 0; transform: scaleX(0.9); } to { opacity: 1; transform: scaleX(1); } }
          .search-wrap input { width: 100%; background: transparent; border: none; outline: none; color: #fff; font-size: 15px; }

          .player-container { animation: fadeIn 0.5s ease; display: flex; flex-direction: column; gap: 20px; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          .player-wrapper { width: 100%; aspect-ratio: 16/9; border-radius: 16px; overflow: hidden; background: #000; }
          .controls-row { display: flex; gap: 12px; margin-top: 0; }
          .control-group { flex: 1; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; height: 50px; border-radius: 12px; }
          .control-group span { font-size: 0.9rem; font-weight: 500; color: #aaa; }
          .control-group input { width: 50px; background: transparent; border: none; color: #fff; font-size: 1.1rem; text-align: right; outline: none; font-weight: 600; }
          .player-info h2 { font-size: 1.4rem; font-weight: 700; margin-bottom: 4px; }
          .player-info p { color: #aaa; font-size: 0.9rem; }

          .empty-state { display: flex; flex-direction: column; align-items: center; color: #555; margin-top: 3rem; gap: 12px; }
          .empty-state i { font-size: 2rem; opacity: 0.5; animation: floatIcon 3s ease-in-out infinite; }
          @keyframes floatIcon { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
          .spinner { width: 24px; height: 24px; border: 2px solid rgba(255,255,255,0.1); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }

          @media (max-width: 768px) {
            .container { padding-left: 1rem; padding-right: 1rem; }
            .content-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 16px 10px; }
            .bar-container { width: 94%; gap: 8px; }
            .info-popup, .toast { min-width: 280px; padding: 14px 16px; }
            .page-title { font-size: 1.3rem; }
            .fav-btn { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </Head>

      <Header
        label={headerLabel}
        scrolled={scrolled}
        showInfo={showInfoPopup} toggleInfo={toggleInfoPopup} infoClosing={infoClosing}
        showTech={showTechPopup} toggleTech={toggleTechPopup} techClosing={techClosing}
        isPlaying={!!selectedMedia}
        onBack={() => setSelectedMedia(null)}
      />

      <ToastContainer toast={currentToast} closeToast={manualCloseToast} />

      <main className="container">
        <div className="page-header">
          <h1 className="page-title">{pageTitle}</h1>
          <div className="status-dots">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
          </div>
        </div>

        {selectedMedia ? (
          <PlayerView item={selectedMedia} />
        ) : (
          <>
            {loading && (searchActive || releases.length === 0) && <div className="empty-state"><div className="spinner"></div></div>}
            
            {searchActive && !loading && searchResults.length === 0 && searchQuery.trim() && (
              <div className="empty-state"><i className="fas fa-ghost"></i><p>Nada encontrado</p></div>
            )}

            {displayItems.length > 0 && !loading && (
              <div className="content-grid">
                {displayItems.map((item, index) => (
                  <div key={getItemKey(item)} style={{'--i': index}}>
                    <MovieCard 
                      item={item} 
                      isFavorite={isFavorite(item)} 
                      toggleFavorite={toggleFavorite} 
                      onSelect={setSelectedMedia}
                    />
                  </div>
                ))}
              </div>
            )}

            {!searchActive && activeSection === 'favorites' && favorites.length === 0 && !loading && (
              <div className="empty-state"><i className="far fa-folder-open"></i><p>Lista vazia</p></div>
            )}
          </>
        )}

        <Footer />
      </main>

      <BottomNav
        visible={!selectedMedia}
        activeSection={activeSection} setActiveSection={setActiveSection}
        searchActive={searchActive} setSearchActive={setSearchActive}
        searchQuery={searchQuery} setSearchQuery={handleSearchChange}
        onSearchSubmit={debouncedSearch} inputRef={searchInputRef}
      />
    </>
  )
}
