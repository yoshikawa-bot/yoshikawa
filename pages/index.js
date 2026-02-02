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

// ─── HEADER ─────────────────────────────────────────────────────
export const Header = ({ label, scrolled, showInfo, toggleInfo, infoClosing, showTech, toggleTech, techClosing }) => {
  const handleBtnClick = (e) => {
    e.stopPropagation();
    if (scrolled) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toggleInfo();
    }
  };

  return (
    <>
      <header className="header-pill">
        {/* Ícone de Caneta estilo iOS */}
        <button className="header-icon-btn" onClick={(e) => { e.stopPropagation(); toggleTech(); }}>
          <i className="fa-regular fa-pen-to-square"></i>
        </button>

        {/* Nome Centralizado */}
        <div className="header-center">
          <span className="header-label">{label}</span>
        </div>

        <button 
          className="header-plus" 
          title={scrolled ? "Voltar ao topo" : "Informações"}
          onClick={handleBtnClick}
        >
          <i className={scrolled ? "fas fa-chevron-up" : "fas fa-plus"}></i>
        </button>
      </header>

      {/* Pop-up de Informações (Original) */}
      {showInfo && (
        <div className={`info-popup ${infoClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
          <i className="fas fa-shield-alt info-icon"></i>
          <p className="info-text">
            Para uma melhor experiência, utilize o navegador <strong>Brave</strong> ou instale um <strong>AdBlock</strong>.
          </p>
        </div>
      )}

      {/* Pop-up Técnico (Mesmo estilo e animação do Info) */}
      {showTech && (
        <div className={`info-popup tech-popup ${techClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
          <i className="fas fa-microchip info-icon" style={{color: '#3b82f6'}}></i>
          <div className="info-text">
            <strong>Status do Sistema:</strong><br/>
            Latência: 24ms | Render: CSR | v2.4.0
          </div>
        </div>
      )}
    </>
  )
}

// ─── TOAST ──────────────────────────────────────────────────────
export const ToastContainer = ({ toast, closeToast }) => {
  if (!toast) return null;
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

// ─── HERO (REVERTIDO PARA FIXO) ─────────────────────────────────
export const Hero = ({ item, isFavorite, toggleFavorite }) => {
  if (!item) return null;
  const favActive = isFavorite(item)
  const backdrop = item.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` 
    : item.poster_path ? `https://image.tmdb.org/t/p/w1280${item.poster_path}` : DEFAULT_BACKDROP;

  return (
    <div className="hero-container">
      <Link href={`/${item.media_type}/${item.id}`} className="hero-wrapper">
        <div className="hero-backdrop">
          <img src={backdrop} alt={item.title || item.name} />
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <span className="hero-tag">Destaque</span>
            <h2 className="hero-title">{item.title || item.name}</h2>
            <p className="hero-overview">{item.overview ? item.overview.slice(0, 90) + '...' : ''}</p>
          </div>
        </div>
      </Link>
      <button className="hero-fav-btn" onClick={(e) => { e.preventDefault(); toggleFavorite(item); }}>
        <i className={`${favActive ? 'fas fa-heart' : 'far fa-heart'}`} style={{ color: favActive ? '#ff6b6b' : '#fff' }}></i>
      </button>
    </div>
  )
}

// ─── MOVIE CARD ─────────────────────────────────────────────────
export const MovieCard = ({ item, isFavorite, toggleFavorite }) => {
  const [animating, setAnimating] = useState(false);
  const handleFavClick = (e) => {
    e.preventDefault(); e.stopPropagation();
    setAnimating(true);
    toggleFavorite(item);
    setTimeout(() => setAnimating(false), 300);
  };
  return (
    <Link href={`/${item.media_type}/${item.id}`} className="card-wrapper">
      <div className="card-poster-frame">
        <img src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : DEFAULT_POSTER} alt={item.title || item.name} className="content-poster" loading="lazy" />
        <button className="fav-btn" onClick={handleFavClick}>
          <i className={`${isFavorite ? 'fas fa-heart' : 'far fa-heart'} ${animating ? 'heart-pulse' : ''}`} style={{ color: isFavorite ? '#ff6b6b' : '#ffffff' }}></i>
        </button>
      </div>
      <span className="card-title">{item.title || item.name}</span>
    </Link>
  )
}

// ─── BOTTOM NAV ─────────────────────────────────────────────────
export const BottomNav = ({ activeSection, setActiveSection, searchActive, setSearchActive, searchQuery, setSearchQuery, onSearchSubmit, inputRef }) => (
  <div className="bottom-nav">
    <div className={`nav-pill ${searchActive ? 'search-mode' : ''}`}>
      {searchActive ? (
        <div className="search-wrap">
          <input ref={inputRef} type="text" placeholder="Pesquisar..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSearchSubmit(searchQuery)} />
        </div>
      ) : (
        <>
          <button className={`nav-btn ${activeSection === 'releases' ? 'active' : ''}`} onClick={() => setActiveSection('releases')}><i className="fas fa-film"></i></button>
          <button className={`nav-btn ${activeSection === 'recommendations' ? 'active' : ''}`} onClick={() => setActiveSection('recommendations')}><i className="fas fa-fire"></i></button>
          <button className={`nav-btn ${activeSection === 'favorites' ? 'active' : ''}`} onClick={() => setActiveSection('favorites')}><i className="fas fa-heart"></i></button>
        </>
      )}
    </div>
    <button className="search-circle" onClick={() => setSearchActive(s => !s)}><i className={searchActive ? 'fas fa-times' : 'fas fa-search'}></i></button>
  </div>
)

// ─── FOOTER ─────────────────────────────────────────────────────
export const Footer = () => (
  <footer className="footer-credits">
    <p>Desenvolvido por Kawa para os sistemas Yoshikawa</p>
    <p className="footer-sub">Todos os direitos reservados &copy; {new Date().getFullYear()}</p>
  </footer>
)

// ═══════════════════════════════════════════════════════════════
// HOME PAGE
// ═══════════════════════════════════════════════════════════════
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

  // Estados dos Pop-ups
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [infoClosing, setInfoClosing] = useState(false)
  const [showTechPopup, setShowTechPopup] = useState(false)
  const [techClosing, setTechClosing] = useState(false)

  const searchInputRef = useRef(null)
  const toastTimerRef = useRef(null)

  // Fechar Popups
  const closePopups = useCallback(() => {
    if (showInfoPopup) { setInfoClosing(true); setTimeout(() => { setShowInfoPopup(false); setInfoClosing(false) }, 300) }
    if (showTechPopup) { setTechClosing(true); setTimeout(() => { setShowTechPopup(false); setTechClosing(false) }, 300) }
  }, [showInfoPopup, showTechPopup])

  const toggleTech = () => { if(showTechPopup) closePopups(); else { closePopups(); setShowTechPopup(true); } }
  const toggleInfo = () => { if(showInfoPopup) closePopups(); else { closePopups(); setShowInfoPopup(true); } }

  useEffect(() => {
    const onScroll = () => { if (window.scrollY > 10) closePopups(); setScrolled(window.scrollY > 60) }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [closePopups])

  // Lógica de Toast
  const showToast = (message, type = 'info') => { setToastQueue(prev => [...prev, { message, type, id: Date.now() }]) }
  useEffect(() => {
    if (toastQueue.length > 0 && !currentToast) {
      const next = toastQueue[0]; setToastQueue(prev => prev.slice(1)); setCurrentToast({ ...next, closing: false })
      toastTimerRef.current = setTimeout(() => { setCurrentToast(t => (t ? { ...t, closing: true } : t)) }, 3000)
    }
  }, [toastQueue, currentToast])
  useEffect(() => { if (currentToast?.closing) { setTimeout(() => setCurrentToast(null), 400) } }, [currentToast])

  // Data Loading
  useEffect(() => { loadHomeContent(); loadFavorites() }, [])
  const loadHomeContent = async () => {
    const fetchTMDB = async (url) => { const r = await fetch(url); const d = await r.json(); return d.results || [] }
    const [mNow, tNow, mPop, tPop] = await Promise.all([
      fetchTMDB(`https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`),
      fetchTMDB(`https://api.themoviedb.org/3/tv/on_the_air?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`),
      fetchTMDB(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`),
      fetchTMDB(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`)
    ])
    setReleases([...mNow.map(i=>({...i, media_type:'movie'})), ...tNow.map(i=>({...i, media_type:'tv'}))].slice(0, 20))
    setRecommendations([...mPop.map(i=>({...i, media_type:'movie'})), ...tPop.map(i=>({...i, media_type:'tv'}))].slice(0, 20))
  }
  const loadFavorites = () => { const s = localStorage.getItem('yoshikawaFavorites'); setFavorites(s ? JSON.parse(s) : []) }
  const isFavorite = (item) => favorites.some(f => f.id === item.id && f.media_type === item.media_type)
  const toggleFavorite = (item) => {
    setFavorites(prev => {
      const was = prev.some(f => f.id === item.id && f.media_type === item.media_type);
      const next = was ? prev.filter(f => !(f.id === item.id && f.media_type === item.media_type)) : [...prev, item];
      localStorage.setItem('yoshikawaFavorites', JSON.stringify(next));
      showToast(was ? 'Removido' : 'Adicionado', was ? 'info' : 'success');
      return next;
    })
  }

  const activeList = searchActive ? searchResults : (activeSection === 'releases' ? releases : (activeSection === 'recommendations' ? recommendations : favorites))
  const displayHero = !searchActive && activeList.length > 0 && activeSection !== 'favorites';
  const headerLabel = scrolled ? (searchActive ? 'Resultados' : SECTION_TITLES[activeSection]) : 'Yoshikawa';

  return (
    <>
      <Head>
        <title>Yoshikawa Player</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; background: #000; color: #fff; overflow-x: hidden; }
          .header-pill {
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 1000;
            display: flex; align-items: center; justify-content: space-between;
            height: 62px; width: 90%; max-width: 680px; padding: 0 1rem;
            border-radius: 40px; border: 1px solid rgba(255,255,255,0.15);
            background: rgba(35,35,35,0.65); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          }
          .header-center { position: absolute; left: 50%; transform: translateX(-50%); pointer-events: none; }
          .header-label { font-size: 1rem; font-weight: 600; white-space: nowrap; }
          .header-icon-btn, .header-plus { background: none; border: none; color: rgba(255,255,255,0.5); font-size: 1.2rem; cursor: pointer; padding: 10px; transition: 0.2s; }
          .header-icon-btn:hover, .header-plus:hover { color: #fff; }
          
          .info-popup {
            position: fixed; top: 20px; left: 50%; transform: translate(-50%, 0) scale(0.9);
            z-index: 900; width: 90%; max-width: 420px; opacity: 0;
            animation: popup-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            display: flex; align-items: center; gap: 12px; padding: 1rem;
            border-radius: 20px; border: 1px solid rgba(255,255,255,0.15);
            background: rgba(28,28,28,0.9); backdrop-filter: blur(20px);
          }
          @keyframes popup-slide-in { 100% { opacity: 1; transform: translate(-50%, 72px) scale(1); } }
          .info-popup.closing { animation: popup-slide-out 0.3s forwards; }
          @keyframes popup-slide-out { 0% { opacity: 1; transform: translate(-50%, 72px) scale(1); } 100% { opacity: 0; transform: translate(-50%, 0) scale(0.9); } }
          
          .container { max-width: 1200px; margin: 0 auto; padding: 110px 20px 100px; }
          .hero-container { position: relative; margin-bottom: 2rem; border-radius: 24px; overflow: hidden; aspect-ratio: 16/9; }
          .hero-backdrop { width: 100%; height: 100%; position: relative; }
          .hero-backdrop img { width: 100%; height: 100%; object-fit: cover; }
          .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to top, #000 10%, transparent); }
          .hero-content { position: absolute; bottom: 0; padding: 2rem; }
          .hero-tag { background: #ff6b6b; padding: 4px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
          .hero-title { font-size: 2rem; margin: 10px 0; }
          .hero-overview { font-size: 0.9rem; opacity: 0.8; max-width: 80%; }
          .hero-fav-btn { position: absolute; top: 20px; right: 20px; background: rgba(0,0,0,0.5); border: none; width: 45px; height: 45px; border-radius: 50%; color: #fff; cursor: pointer; }

          .content-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 20px; }
          .card-poster-frame { position: relative; aspect-ratio: 2/3; border-radius: 15px; overflow: hidden; background: #1a1a1a; }
          .content-poster { width: 100%; height: 100%; object-fit: cover; }
          .card-title { font-size: 0.85rem; margin-top: 8px; display: block; }
          .fav-btn { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.5); border: none; width: 30px; height: 30px; border-radius: 50%; color: #fff; }

          .bottom-nav { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; width: 90%; max-width: 680px; z-index: 1000; }
          .nav-pill { flex: 1; background: rgba(35,35,35,0.65); backdrop-filter: blur(20px); height: 62px; border-radius: 40px; border: 1px solid rgba(255,255,255,0.15); display: flex; justify-content: space-around; align-items: center; }
          .nav-btn { background: none; border: none; color: rgba(255,255,255,0.4); font-size: 1.2rem; cursor: pointer; }
          .nav-btn.active { color: #fff; }
          .search-circle { width: 62px; height: 62px; border-radius: 50%; background: rgba(35,35,35,0.65); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.15); color: #fff; cursor: pointer; }
          .search-wrap input { background: none; border: none; color: #fff; width: 100%; outline: none; padding: 0 20px; }

          .toast-wrap { position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%); z-index: 2000; }
          .toast { background: rgba(35,35,35,0.9); padding: 12px 24px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; gap: 10px; animation: toast-in 0.4s; }
          @keyframes toast-in { from { transform: translateY(20px); opacity: 0; } }
          
          @media (max-width: 768px) {
            .hero-title { font-size: 1.5rem; }
            .content-grid { grid-template-columns: repeat(2, 1fr); }
          }
        `}</style>
      </Head>

      <Header 
        label={headerLabel} 
        scrolled={scrolled} 
        showInfo={showInfoPopup} toggleInfo={toggleInfo} infoClosing={infoClosing} 
        showTech={showTechPopup} toggleTech={toggleTech} techClosing={techClosing}
      />

      <ToastContainer toast={currentToast} closeToast={() => setCurrentToast(null)} />

      <main className="container">
        {displayHero && <Hero item={activeList[0]} isFavorite={isFavorite} toggleFavorite={toggleFavorite} />}
        
        <h2 style={{marginBottom: '20px', fontSize: '1.4rem'}}>{searchActive ? 'Resultados' : SECTION_TITLES[activeSection]}</h2>

        <div className="content-grid">
          {(displayHero ? activeList.slice(1) : activeList).map(item => (
            <MovieCard key={getItemKey(item)} item={item} isFavorite={isFavorite(item)} toggleFavorite={toggleFavorite} />
          ))}
        </div>
      </main>

      <BottomNav 
        activeSection={activeSection} setActiveSection={setActiveSection} 
        searchActive={searchActive} setSearchActive={setSearchActive} 
        searchQuery={searchQuery} setSearchQuery={setSearchQuery} 
        onSearchSubmit={() => {}} inputRef={searchInputRef}
      />

      <Footer />
    </>
  )
}
