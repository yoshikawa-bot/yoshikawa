import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'

// --- CONSTANTS ---
const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
const DEFAULT_POSTER = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'

const SECTION_TITLES = {
  releases: 'Lançamentos',
  recommendations: 'Populares',
  favorites: 'Favoritos'
}

// --- UTILS ---
const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null)
  return useCallback((...args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => callback(...args), delay)
  }, [callback, delay])
}

const getItemKey = (item) => `${item.media_type}-${item.id}`

// --- COMPONENTS ---

export const Header = ({ label, scrolled, showInfo, setShowInfo }) => {
  const handleBtnClick = (e) => {
    e.stopPropagation(); // Previne fechar o popup imediatamente
    if (scrolled) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setShowInfo(!showInfo);
    }
  };

  return (
    <>
      <header className="header-pill">
        <Link href="/" className="header-left">
          <img src="https://yoshikawa-bot.github.io/cache/images/14c34900.jpg" alt="Yoshikawa" className="header-logo" />
          <span className="header-label">{label}</span>
        </Link>
        
        {/* Lógica do botão: Se rolou, vira seta p/ cima. Se topo, vira Info */}
        <button 
          className="header-plus" 
          title={scrolled ? "Voltar ao topo" : "Informações"}
          onClick={handleBtnClick}
        >
          <i className={scrolled ? "fas fa-chevron-up" : "fas fa-plus"}></i>
        </button>
      </header>

      {/* Pop-up de Informação */}
      {showInfo && !scrolled && (
        <div className="info-popup" onClick={(e) => e.stopPropagation()}>
          <div className="info-content">
            <i className="fas fa-shield-alt info-icon"></i>
            <p>Para uma melhor experiência, utilize o navegador <strong>Brave</strong> ou instale um <strong>AdBlock</strong>.</p>
          </div>
        </div>
      )}
    </>
  )
}

export const ToastContainer = ({ toasts, removeToast }) => (
  <div className="toast-wrap">
    {toasts.map(t => (
      <div key={t.id} className={`toast ${t.type}`} onClick={() => removeToast(t.id)}>
        <div className="toast-icon">
          <i className={`fas ${t.type === 'success' ? 'fa-check' : t.type === 'error' ? 'fa-exclamation-triangle' : 'fa-info'}`}></i>
        </div>
        <div className="toast-msg">{t.message}</div>
      </div>
    ))}
  </div>
)

export const MovieCard = ({ item, isFavorite, toggleFavorite }) => {
  const [animating, setAnimating] = useState(false);

  const handleFavClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Ativa animação
    setAnimating(true);
    toggleFavorite(item);
    
    // Reseta animação após o tempo
    setTimeout(() => setAnimating(false), 300);
  };

  return (
    <Link href={`/${item.media_type}/${item.id}`} className="card-wrapper">
      <div className="card-poster-frame">
        <img 
          src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : DEFAULT_POSTER} 
          alt={item.title || item.name} 
          className="content-poster" 
          loading="lazy" 
        />
        <button 
          className="fav-btn" 
          onClick={handleFavClick}
        >
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
  activeSection, 
  setActiveSection, 
  searchActive, 
  setSearchActive, 
  searchQuery, 
  setSearchQuery,
  onSearchSubmit,
  inputRef 
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

// --- MAIN PAGE ---

export default function Home() {
  const [releases, setReleases] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [favorites, setFavorites] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSection, setActiveSection] = useState('releases')
  const [searchActive, setSearchActive] = useState(false)
  const [toasts, setToasts] = useState([])
  
  // States para Header/Popup
  const [scrolled, setScrolled] = useState(false)
  const [showInfoPopup, setShowInfoPopup] = useState(false)

  const searchInputRef = useRef(null)

  // Scroll Handler: Gerencia estado scrolled e fecha popup ao rolar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setShowInfoPopup(false) // Fecha popup ao rolar
      }
      setScrolled(window.scrollY > 60)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Click outside handler para fechar o popup
    const handleClickOutside = (e) => {
      // Se não clicou no popup nem no botão de abrir, fecha
      if (!e.target.closest('.info-popup') && !e.target.closest('.header-plus')) {
        setShowInfoPopup(false)
      }
    }
    window.addEventListener('click', handleClickOutside)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('click', handleClickOutside)
    }
  }, [])

  const showToast = (message, type = 'info') => {
    const id = Date.now()
    setToasts([{ id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }

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

  const fetchTMDBPages = async (endpoint) => {
    try {
      const [p1, p2] = await Promise.all([
        fetch(`${endpoint}&page=1`),
        fetch(`${endpoint}&page=2`)
      ])
      const d1 = await p1.json()
      const d2 = await p2.json()
      return [...(d1.results || []), ...(d2.results || [])]
    } catch { return [] }
  }

  const fetchSearchResults = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [moviesData, tvData] = await Promise.all([
        fetchTMDBPages(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`),
        fetchTMDBPages(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`)
      ])
      
      setSearchResults([
        ...moviesData.map(i => ({ ...i, media_type: 'movie' })),
        ...tvData.map(i => ({ ...i, media_type: 'tv' }))
      ].filter(i => i.poster_path).sort((a, b) => b.popularity - a.popularity).slice(0, 40))
    } catch (err) {
      showToast('Erro na busca', 'error')
      setSearchResults([])
    } finally {
      setLoading(false)
    }
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
      const [moviesNow, tvNow, moviesPop, tvPop] = await Promise.all([
        fetchTMDBPages(`https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&language=pt-BR`),
        fetchTMDBPages(`https://api.themoviedb.org/3/tv/on_the_air?api_key=${TMDB_API_KEY}&language=pt-BR`),
        fetchTMDBPages(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=pt-BR`),
        fetchTMDBPages(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&language=pt-BR`)
      ])

      setReleases([
        ...moviesNow.map(i => ({ ...i, media_type: 'movie' })),
        ...tvNow.map(i => ({ ...i, media_type: 'tv' }))
      ].filter(i => i.poster_path).sort((a, b) => new Date(b.release_date || b.first_air_date) - new Date(a.release_date || a.first_air_date)).slice(0, 36))

      setRecommendations([
        ...moviesPop.map(i => ({ ...i, media_type: 'movie' })),
        ...tvPop.map(i => ({ ...i, media_type: 'tv' }))
      ].filter(i => i.poster_path).sort(() => 0.5 - Math.random()).slice(0, 36))
    } catch (err) {
      console.error(err)
    }
  }

  const loadFavorites = () => {
    try {
      const s = localStorage.getItem('yoshikawaFavorites')
      setFavorites(s ? JSON.parse(s) : [])
    } catch { setFavorites([]) }
  }

  const isFavorite = (item) => favorites.some(f => f.id === item.id && f.media_type === item.media_type)

  const toggleFavorite = (item) => {
    setFavorites(prev => {
      const wasFav = prev.some(f => f.id === item.id && f.media_type === item.media_type)
      let next
      if (wasFav) {
        next = prev.filter(f => !(f.id === item.id && f.media_type === item.media_type))
        showToast('Removido dos favoritos', 'info')
      } else {
        next = [...prev, { id: item.id, media_type: item.media_type, title: item.title || item.name, poster_path: item.poster_path }]
        showToast('Adicionado aos favoritos!', 'success')
      }
      try { localStorage.setItem('yoshikawaFavorites', JSON.stringify(next)) } catch { showToast('Erro ao salvar', 'error') }
      return next
    })
  }

  const getActiveItems = () => {
    if (activeSection === 'releases') return releases
    if (activeSection === 'recommendations') return recommendations
    if (activeSection === 'favorites') return favorites
    return releases
  }

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

          /* --- HEADER --- */
          .header-pill {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            height: var(--pill-height);
            width: 90%;
            max-width: var(--pill-max-width);
            padding: 0 1.5rem;
            border-radius: var(--pill-radius);
            border: var(--pill-border);
            background: var(--pill-bg);
            backdrop-filter: var(--pill-blur);
            -webkit-backdrop-filter: var(--pill-blur);
            box-shadow: var(--pill-shadow);
          }

          .header-left {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            text-decoration: none;
            flex-shrink: 0;
          }

          .header-logo {
            width: 28px;
            height: 28px;
            border-radius: 8px;
            object-fit: cover;
            flex-shrink: 0;
          }

          .header-label {
            font-size: 1rem;
            font-weight: 600;
            color: #f0f6fc;
            white-space: nowrap;
          }

          .header-plus {
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.5);
            font-size: 1.2rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 4px;
            transition: color 0.2s;
            flex-shrink: 0;
          }
          .header-plus:hover { color: #ffffff; }

          /* --- INFO POPUP --- */
          .info-popup {
            position: fixed;
            top: calc(20px + var(--pill-height) + 10px);
            left: 50%;
            transform: translateX(-50%);
            z-index: 999;
            width: 90%;
            max-width: 400px;
            animation: popup-fade 0.3s ease-out forwards;
          }

          @keyframes popup-fade {
            from { opacity: 0; transform: translate(-50%, -10px); }
            to { opacity: 1; transform: translate(-50%, 0); }
          }

          .info-content {
            background: rgba(30, 30, 30, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            border-radius: 20px;
            padding: 1.2rem;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            color: #e2e8f0;
            font-size: 0.95rem;
            line-height: 1.5;
          }

          .info-icon {
            color: #f59e0b; /* Amber warning color */
            font-size: 1.2rem;
            margin-top: 2px;
          }

          .info-content strong {
            color: #fff;
            font-weight: 600;
          }

          /* --- CONTAINER --- */
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
            color: #f1f5f9;
            margin-bottom: 1.2rem;
          }

          /* --- CARDS --- */
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
            group: group;
          }

          .card-poster-frame {
            position: relative;
            border-radius: 20px;
            overflow: hidden;
            aspect-ratio: 2/3;
            border: 1px solid rgba(255, 255, 255, 0.13);
            background: #1e1e1e;
            transition: transform 0.25s, box-shadow 0.25s;
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
          }

          .card-title {
            margin-top: 10px;
            font-size: 13px;
            font-weight: 500;
            color: #ffffff;
            text-align: left;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          }

          /* FAVORITE BUTTON STYLES UPDATED */
          .fav-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            z-index: 2;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 1px solid rgba(255, 255, 255, 0.2);
            background: rgba(0, 0, 0, 0.5); 
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background 0.2s, border-color 0.2s;
            /* REMOVED TRANSFORM SCALE ON HOVER */
          }
          
          .fav-btn:hover { 
            border-color: rgba(255,255,255,0.4); 
            background: rgba(0,0,0,0.7);
          }

          .fav-btn i { font-size: 14px; transition: color 0.2s; }
          
          /* Keyframes for Heart Pulse */
          @keyframes heart-zoom {
            0% { transform: scale(1); }
            50% { transform: scale(1.4); }
            100% { transform: scale(1); }
          }
          
          .heart-pulse {
            animation: heart-zoom 0.3s ease-in-out;
          }

          /* --- BOTTOM NAV --- */
          .bottom-nav {
            position: fixed;
            bottom: 25px;
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
            transition: background 0.3s;
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
            color: rgba(255, 255, 255, 0.5); /* Inactive Grey */
            transition: color 0.2s;
          }
          .nav-btn i { font-size: 20px; transition: transform 0.15s; }
          .nav-btn:hover { color: #ffffff; }
          .nav-btn:hover i { transform: scale(1.1); }
          
          .nav-btn.active { color: #ffffff; } /* Active White */
          .nav-btn.active i { transform: scale(1.05); }

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
          .search-wrap input::placeholder { color: #cbd5e1; opacity: 0.6; }

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
            color: rgba(255, 255, 255, 0.7);
            transition: background 0.2s, color 0.2s;
          }
          .search-circle:hover { background: rgba(50,50,50,0.8); color: #fff; }
          .search-circle i { font-size: 22px; }

          /* --- TOASTS --- */
          .toast-wrap {
            position: fixed;
            bottom: calc(25px + var(--pill-height) + 12px);
            left: 50%;
            transform: translateX(-50%);
            z-index: 990;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
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
            animation: toast-pop-up 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            transform-origin: center bottom;
          }

          @keyframes toast-pop-up {
            from { opacity: 0; transform: translateY(60px) scale(0.6); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }

          .toast-icon {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            flex-shrink: 0;
          }
          .toast.success .toast-icon { background: #10b981; color: #fff; }
          .toast.info    .toast-icon { background: #4dabf7; color: #fff; }
          .toast.error   .toast-icon { background: #ef4444; color: #fff; }

          .toast-msg { font-size: 13px; color: #fff; font-weight: 500; }

          /* --- STATES --- */
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
          .empty-state i { font-size: 2rem; margin-bottom: 12px; }
          .spinner {
            width: 36px;
            height: 36px;
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-top-color: #ff6b6b;
            border-radius: 50%;
            animation: spin 0.7s linear infinite;
            margin-bottom: 12px;
          }
          @keyframes spin { to { transform: rotate(360deg); } }

          @media (max-width: 768px) {
            :root {
              --pill-height: 56px;
              --pill-max-width: 90vw;
            }
            .content-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 20px 10px; }
            .container { padding-left: 1.5rem; padding-right: 1.5rem; }
            .header-pill { top: 14px; width: 92%; padding: 0 1.25rem; }
            .bottom-nav { width: 92%; }
            .nav-pill { padding: 0 1rem; }
            .toast-wrap { width: 92%; }
            .toast { padding: 0 1rem; height: 44px; }
          }

          @media (max-width: 480px) {
            :root {
              --pill-height: 54px;
              --pill-max-width: 95vw;
            }
            .container { padding-left: 1rem; padding-right: 1rem; }
            .header-pill { width: 94%; }
            .bottom-nav { width: 94%; gap: 8px; }
            .toast-wrap { width: 94%; }
            .nav-pill { padding: 0 1.25rem; }
            .nav-btn i { font-size: 19px; }
            .search-circle i { font-size: 20px; }
          }
        `}</style>
      </Head>

      <Header 
        label={headerLabel} 
        scrolled={scrolled} 
        showInfo={showInfoPopup} 
        setShowInfo={setShowInfoPopup} 
      />
      
      <ToastContainer toasts={toasts} removeToast={(id) => setToasts(p => p.filter(t => t.id !== id))} />

      <main className="container">
        <h1 className="page-title">{pageTitle}</h1>

        {loading && (searchActive || releases.length === 0) && (
          <div className="empty-state">
            <div className="spinner"></div>
            <span>{searchActive ? 'Buscando...' : 'Carregando...'}</span>
          </div>
        )}

        {searchActive && !loading && searchResults.length === 0 && searchQuery.trim() && (
          <div className="empty-state">
            <i className="fas fa-ghost"></i><p>Nenhum resultado para "{searchQuery}"</p>
          </div>
        )}

        {(searchActive ? searchResults : getActiveItems()).length > 0 && !loading && (
          <div className="content-grid">
            {(searchActive ? searchResults : getActiveItems()).map(item => (
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
          <div className="empty-state"><i className="fas fa-heart"></i><p>Nenhum favorito adicionado ainda.</p></div>
        )}
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
