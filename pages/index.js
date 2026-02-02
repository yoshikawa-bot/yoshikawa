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
export const Header = ({ label, scrolled, showInfo, toggleInfo, infoClosing, toggleTech, showTech }) => {
  
  const handleTopBtn = (e) => {
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
        {/* Botão Esquerdo: Caneta (Tech Info) */}
        <button className="header-btn-left" onClick={(e) => { e.stopPropagation(); toggleTech(); }}>
          <i className="fas fa-pen-nib"></i>
        </button>

        {/* Texto Centralizado Absolutamente */}
        <div className="header-center">
          <span className="header-label">{label}</span>
        </div>

        {/* Botão Direito: Topo ou Info */}
        <button 
          className="header-btn-right" 
          title={scrolled ? "Voltar ao topo" : "Informações"}
          onClick={handleTopBtn}
        >
          <i className={scrolled ? "fas fa-chevron-up" : "fas fa-plus"}></i>
        </button>
      </header>

      {/* Popup de Aviso (AdBlock) */}
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

      {/* Popup Técnico (Caneta) */}
      {showTech && (
        <div className="tech-overlay" onClick={toggleTech}>
          <div className="tech-popup" onClick={(e) => e.stopPropagation()}>
            <div className="tech-header">
              <h3>System Status</h3>
              <button onClick={toggleTech}><i className="fas fa-times"></i></button>
            </div>
            <div className="tech-grid">
              <div className="tech-item">
                <small>Framework</small>
                <span>Next.js / React 18</span>
              </div>
              <div className="tech-item">
                <small>Rendering</small>
                <span>Client Side (CSR)</span>
              </div>
              <div className="tech-item">
                <small>API Latency</small>
                <span className="tech-good">~45ms</span>
              </div>
              <div className="tech-item">
                <small>Memory Heap</small>
                <span>Stable</span>
              </div>
              <div className="tech-item full">
                <small>Version Hash</small>
                <span className="tech-mono">a1b2-c3d4-yoshikawa-v2</span>
              </div>
            </div>
            <div className="tech-footer">
               Yoshikawa Dev Systems &copy;
            </div>
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

// ─── HERO STACK (INFINITE DECK) ─────────────────────────────────
export const HeroCarousel = ({ items, isFavorite, toggleFavorite }) => {
  // We only use the first 2 items to simulate the infinite stack
  const cards = items.slice(0, 2)

  const [frontIndex, setFrontIndex] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [exitDir, setExitDir] = useState(null) // 'left' | 'right'
  const [entering, setEntering] = useState(false)

  const touchStartX = useRef(null)
  const mouseStartX = useRef(null)
  const containerRef = useRef(null)

  if (cards.length < 2) return null

  const backIndex = frontIndex === 0 ? 1 : 0
  const frontCard = cards[frontIndex]
  const backCard = cards[backIndex]

  const getBackdropUrl = (item) =>
    item.backdrop_path
      ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
      : item.poster_path
        ? `https://image.tmdb.org/t/p/w1280${item.poster_path}`
        : DEFAULT_BACKDROP

  const triggerSwap = (dir) => {
    setExitDir(dir)
  }

  const handleExitEnd = () => {
    // 1. O card da frente saiu.
    // 2. Definimos que estamos entrando no novo estado.
    setEntering(true)
    // 3. Trocamos os índices (o de trás vira frente).
    setFrontIndex(backIndex)
    // 4. Resetamos estados de animação
    setExitDir(null)
    setDragX(0)
    
    // Pequeno delay para remover a classe de "entrando" e permitir nova interação
    setTimeout(() => setEntering(false), 400)
  }

  // ── TOUCH ──
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    setIsDragging(true)
  }
  const onTouchMove = (e) => {
    if (touchStartX.current === null) return
    setDragX(e.touches[0].clientX - touchStartX.current)
  }
  const onTouchEnd = () => {
    if (touchStartX.current === null) return
    const diff = dragX
    if (Math.abs(diff) > 80) { // Threshold um pouco maior para evitar acidentes
      triggerSwap(diff > 0 ? 'right' : 'left')
    } else {
      setDragX(0)
    }
    touchStartX.current = null
    setIsDragging(false)
  }

  // ── MOUSE ──
  const onMouseDown = (e) => {
    e.preventDefault()
    mouseStartX.current = e.clientX
    setIsDragging(true)
    setDragX(0)
  }
  const onMouseMove = (e) => {
    if (mouseStartX.current === null) return
    setDragX(e.clientX - mouseStartX.current)
  }
  const onMouseUp = () => {
    if (mouseStartX.current === null) return
    if (Math.abs(dragX) > 100) {
      triggerSwap(dragX > 0 ? 'right' : 'left')
    } else {
      setDragX(0)
    }
    mouseStartX.current = null
    setIsDragging(false)
  }
  const onMouseLeave = () => {
    if (mouseStartX.current !== null) {
      setDragX(0)
      mouseStartX.current = null
      setIsDragging(false)
    }
  }

  // ── Estilos Computados ──

  // Card da FRENTE
  const getFrontStyle = () => {
    if (exitDir) {
      // Animação de saída: Vai para o lado e rotaciona
      const px = exitDir === 'right' ? '120%' : '-120%'
      return {
        transform: `translateX(${px}) rotate(${exitDir === 'right' ? '15deg' : '-15deg'})`,
        transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.4s ease',
        opacity: 0, // Desaparece enquanto sai para suavizar o "reset"
        zIndex: 3,
        pointerEvents: 'none'
      }
    }
    // Interação de arraste
    const rot = (dragX / 300) * 10 
    return {
      transform: `translateX(${dragX}px) rotate(${rot}deg)`,
      // Se não estiver arrastando, volta pro centro com uma mola suave
      transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
      zIndex: 3,
      cursor: isDragging ? 'grabbing' : 'grab'
    }
  }

  // Card de TRÁS
  const getBackStyle = () => {
    if (entering) {
      // O card de trás assume a posição da frente
      return {
        transform: 'scale(1) translateY(0)',
        opacity: 1,
        transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
        zIndex: 2
      }
    }
    // Estado de repouso atrás (Passando um pouco em baixo)
    // Conforme arrasta o da frente, o de trás começa a subir
    const progress = Math.min(Math.abs(dragX) / 200, 1) 
    
    // Escala: 0.94 -> 1.0
    const scale = 0.94 + (progress * 0.06) 
    // Y: 18px (visível em baixo) -> 0px
    const y = 18 - (progress * 18)
    const opacity = 0.8 + (progress * 0.2) // Fica mais brilhante ao subir

    return {
      transform: `scale(${scale}) translateY(${y}px)`,
      opacity: opacity,
      transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
      zIndex: 1
    }
  }

  const renderCard = (item, style, onAnimEnd, extraClass = '') => {
    const favActive = isFavorite(item)
    const handleFav = (e) => {
      e.preventDefault(); e.stopPropagation();
      toggleFavorite(item)
    }
    return (
      <div
        className={`hero-stack-card ${extraClass}`}
        style={style}
        onAnimationEnd={onAnimEnd}
      >
        <Link href={`/${item.media_type}/${item.id}`} className="hero-wrapper">
          <div className="hero-backdrop">
            <img src={getBackdropUrl(item)} alt={item.title || item.name} draggable="false" />
            <div className="hero-overlay"></div>
            <div className="hero-content">
              <span className="hero-tag">Destaque</span>
              <h2 className="hero-title">{item.title || item.name}</h2>
              <p className="hero-overview">{item.overview ? item.overview.slice(0, 85) + '...' : ''}</p>
            </div>
          </div>
        </Link>
        <button className="hero-fav-btn" onClick={handleFav}>
          <i className={`${favActive ? 'fas fa-heart' : 'far fa-heart'}`} style={{ color: favActive ? '#ff6b6b' : '#fff' }}></i>
        </button>
      </div>
    )
  }

  return (
    <div
      className="hero-carousel"
      ref={containerRef}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseLeave}
    >
      {/* Back card */}
      {renderCard(backCard, getBackStyle(), null, 'hero-back')}
      {/* Front card */}
      {renderCard(frontCard, getFrontStyle(), exitDir ? handleExitEnd : null, `hero-front ${exitDir ? `exit-${exitDir}` : ''}`)}
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
        <img
          src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : DEFAULT_POSTER}
          alt={item.title || item.name}
          className="content-poster"
          loading="lazy"
        />
        <button className="fav-btn" onClick={handleFavClick}>
          <i className={`${isFavorite ? 'fas fa-heart' : 'far fa-heart'} ${animating ? 'heart-pulse' : ''}`}
             style={{ color: isFavorite ? '#ff6b6b' : '#ffffff' }}></i>
        </button>
      </div>
      <span className="card-title">{item.title || item.name}</span>
    </Link>
  )
}

// ─── BOTTOM NAV ─────────────────────────────────────────────────
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
  
  // Popup States
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [infoClosing, setInfoClosing] = useState(false)
  const [showTech, setShowTech] = useState(false)

  const searchInputRef = useRef(null)
  const toastTimerRef = useRef(null)

  // ── Toast Logic ──
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
  const manualCloseToast = () => { if (currentToast) setCurrentToast({ ...currentToast, closing: true }) }

  // ── Info Popup ──
  const closeInfoPopup = useCallback(() => {
    if (showInfoPopup && !infoClosing) {
      setInfoClosing(true)
      setTimeout(() => { setShowInfoPopup(false); setInfoClosing(false) }, 300)
    }
  }, [showInfoPopup, infoClosing])
  const toggleInfo = () => { showInfoPopup ? closeInfoPopup() : setShowInfoPopup(true) }

  // ── Tech Popup ──
  const toggleTech = () => setShowTech(prev => !prev)

  useEffect(() => {
    const onScroll = () => { 
      if (window.scrollY > 10) closeInfoPopup(); 
      setScrolled(window.scrollY > 60) 
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    const onClick = (e) => { 
      if (!e.target.closest('.info-popup') && !e.target.closest('.header-plus') && !e.target.closest('.tech-popup') && !e.target.closest('.header-btn-left')) {
        closeInfoPopup();
      }
    }
    window.addEventListener('click', onClick)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('click', onClick) }
  }, [closeInfoPopup])

  // ── Data ──
  useEffect(() => { loadHomeContent(); loadFavorites() }, [])
  useEffect(() => {
    if (searchActive && searchInputRef.current) searchInputRef.current.focus()
    if (!searchActive) { setSearchResults([]); setSearchQuery('') }
  }, [searchActive])

  const fetchTMDBPages = async (endpoint) => {
    try {
      const [p1, p2] = await Promise.all([fetch(`${endpoint}&page=1`), fetch(`${endpoint}&page=2`)])
      const d1 = await p1.json(); const d2 = await p2.json()
      return [...(d1.results || []), ...(d2.results || [])]
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
      setSearchResults([
        ...m.map(i => ({ ...i, media_type: 'movie' })),
        ...t.map(i => ({ ...i, media_type: 'tv' }))
      ].filter(i => i.poster_path).sort((a, b) => b.popularity - a.popularity).slice(0, 40))
    } catch { showToast('Erro na busca', 'error'); setSearchResults([]) }
    finally { setLoading(false) }
  }

  const debouncedSearch = useDebounce(fetchSearchResults, 300)
  const handleSearchChange = (q) => {
    setSearchQuery(q)
    if (!q.trim()) { setSearchResults([]); setLoading(false); return }
    setLoading(true); debouncedSearch(q)
  }

  const loadHomeContent = async () => {
    try {
      const [mNow, tNow, mPop, tPop] = await Promise.all([
        fetchTMDBPages(`https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&language=pt-BR`),
        fetchTMDBPages(`https://api.themoviedb.org/3/tv/on_the_air?api_key=${TMDB_API_KEY}&language=pt-BR`),
        fetchTMDBPages(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=pt-BR`),
        fetchTMDBPages(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&language=pt-BR`)
      ])
      setReleases([
        ...mNow.map(i => ({ ...i, media_type: 'movie' })),
        ...tNow.map(i => ({ ...i, media_type: 'tv' }))
      ].filter(i => i.poster_path).sort((a, b) => new Date(b.release_date || b.first_air_date) - new Date(a.release_date || a.first_air_date)).slice(0, 36))
      setRecommendations([
        ...mPop.map(i => ({ ...i, media_type: 'movie' })),
        ...tPop.map(i => ({ ...i, media_type: 'tv' }))
      ].filter(i => i.poster_path).sort(() => 0.5 - Math.random()).slice(0, 36))
    } catch (err) { console.error(err) }
  }

  const loadFavorites = () => {
    try { const s = localStorage.getItem('yoshikawaFavorites'); setFavorites(s ? JSON.parse(s) : []) }
    catch { setFavorites([]) }
  }

  const isFavorite = (item) => favorites.some(f => f.id === item.id && f.media_type === item.media_type)

  const toggleFavorite = (item) => {
    setFavorites(prev => {
      const was = prev.some(f => f.id === item.id && f.media_type === item.media_type)
      let next
      if (was) { next = prev.filter(f => !(f.id === item.id && f.media_type === item.media_type)); showToast('Removido dos favoritos', 'info') }
      else { next = [...prev, { id: item.id, media_type: item.media_type, title: item.title || item.name, poster_path: item.poster_path }]; showToast('Adicionado aos favoritos!', 'success') }
      try { localStorage.setItem('yoshikawaFavorites', JSON.stringify(next)) } catch { showToast('Erro ao salvar', 'error') }
      return next
    })
  }

  const activeList = searchActive ? searchResults : (activeSection === 'releases' ? releases : (activeSection === 'recommendations' ? recommendations : favorites))
  const showHero = !searchActive && (activeSection === 'releases' || activeSection === 'recommendations') && activeList.length > 2
  const heroItems = showHero ? activeList.slice(0, 2) : []
  const displayItems = showHero ? activeList.slice(2) : activeList
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
            font-family: 'Inter', Arial, sans-serif;
            background: #000;
            color: #f1f5f9;
            line-height: 1.6;
            font-size: 16px;
            min-height: 100vh;
            overflow-x: hidden;
            /* Prevent scrolling when swiping hero if possible */
            overscroll-behavior-y: none; 
          }
          button { font-family: inherit; }
          img { max-width: 100%; height: auto; display: block; }

          :root {
            --pill-height: 60px;
            --pill-radius: 40px;
            --pill-bg: rgba(35, 35, 35, 0.7);
            --pill-border: 1px solid rgba(255, 255, 255, 0.12);
            --pill-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            --pill-blur: blur(24px);
            --pill-max-width: 680px;
            --primary: #ff6b6b;
          }

          /* ═══ HEADER ═══ */
          .header-pill {
            position: fixed; top: 18px; left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
            display: flex; align-items: center; justify-content: space-between;
            height: var(--pill-height);
            width: 90%; max-width: var(--pill-max-width);
            padding: 0 8px;
            border-radius: var(--pill-radius);
            border: var(--pill-border);
            background: var(--pill-bg);
            backdrop-filter: var(--pill-blur);
            -webkit-backdrop-filter: var(--pill-blur);
            box-shadow: var(--pill-shadow);
          }
          
          /* Botões laterais */
          .header-btn-left, .header-btn-right {
            width: 44px; height: 44px;
            border-radius: 50%; border: none; background: transparent;
            color: rgba(255,255,255,0.6); font-size: 1.1rem;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all 0.2s;
            z-index: 2; /* Acima do texto centralizado */
          }
          .header-btn-left:hover, .header-btn-right:hover { color: #fff; background: rgba(255,255,255,0.1); }
          
          /* Texto Centralizado Absoluto */
          .header-center {
            position: absolute; left: 50%; top: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none; /* Deixa cliques passarem se necessário, mas está longe dos botões */
            display: flex; align-items: center; justify-content: center;
            width: 100%;
          }
          .header-label {
            font-size: 1rem; font-weight: 600; color: #f0f6fc;
            text-align: center; white-space: nowrap;
          }

          /* ═══ TECH POPUP (Novo) ═══ */
          .tech-overlay {
            position: fixed; inset: 0; z-index: 2000;
            background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
            display: flex; align-items: center; justify-content: center;
            animation: fadeIn 0.2s ease;
          }
          .tech-popup {
            width: 90%; max-width: 380px;
            background: #18181b; border: 1px solid rgba(255,255,255,0.1);
            border-radius: 24px; padding: 20px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .tech-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px; }
          .tech-header h3 { font-size: 1.1rem; font-weight: 600; color: #fff; }
          .tech-header button { background: none; border: none; color: #71717a; font-size: 1.2rem; cursor: pointer; }
          .tech-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .tech-item { background: #27272a; padding: 12px; border-radius: 12px; display: flex; flex-direction: column; gap: 4px; }
          .tech-item.full { grid-column: span 2; }
          .tech-item small { color: #a1a1aa; font-size: 0.7rem; text-transform: uppercase; font-weight: 600; }
          .tech-item span { color: #e4e4e7; font-size: 0.9rem; font-weight: 500; }
          .tech-good { color: #4ade80 !important; }
          .tech-mono { font-family: monospace; letter-spacing: -0.5px; opacity: 0.8; }
          .tech-footer { margin-top: 16px; text-align: center; color: #52525b; font-size: 0.75rem; }
          
          @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
          @keyframes scaleIn { from { transform: scale(0.9); opacity:0; } to { transform: scale(1); opacity:1; } }

          /* ═══ INFO POPUP (Adblock) ═══ */
          .info-popup {
            position: fixed; top: 18px; left: 50%; transform: translateX(-50%) translateY(0) scale(0.9);
            z-index: 900; width: 90%; max-width: 420px;
            opacity: 0; display: flex; align-items: flex-start; gap: 12px;
            padding: 1.1rem 1.3rem; border-radius: 22px;
            border: var(--pill-border); background-color: rgba(20, 20, 20, 0.95);
            backdrop-filter: var(--pill-blur); box-shadow: var(--pill-shadow);
            animation: popup-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            pointer-events: none;
          }
          .info-popup.closing { animation: popup-slide-out 0.3s cubic-bezier(0.7, 0, 0.84, 0) forwards; }
          @keyframes popup-slide-in {
            0%   { opacity: 0; transform: translate(-50%, 0) scale(0.9); }
            100% { opacity: 1; transform: translate(-50%, calc(var(--pill-height) + 12px)) scale(1); pointer-events: auto; }
          }
          @keyframes popup-slide-out {
            0%   { opacity: 1; transform: translate(-50%, calc(var(--pill-height) + 12px)) scale(1); }
            100% { opacity: 0; transform: translate(-50%, 0) scale(0.9); pointer-events: none; }
          }
          .info-icon { color: #f59e0b; font-size: 1.2rem; flex-shrink: 0; margin-top: 2px; }
          .info-text { font-size: 0.9rem; color: #d4d4d8; }
          .info-text strong { color: #fff; }

          /* ═══ CONTAINER ═══ */
          .container {
            max-width: 1280px; margin: 0 auto;
            padding-top: calc(var(--pill-height) + 24px + 1.8rem);
            padding-bottom: 8rem;
            padding-left: 1.5rem; padding-right: 1.5rem;
          }
          .page-title {
            font-size: 1.5rem; font-weight: 700; margin-bottom: 1.2rem;
            color: #fff; letter-spacing: -0.02em;
          }
          .page-title-below { margin-top: 0; }

          /* ─── HERO STACK ─── */
          .hero-carousel {
            width: 100%; position: relative;
            margin-bottom: 2.5rem;
            /* Height definida pela proporção */
            padding-bottom: 24px; /* Espaço para o card de trás aparecer em baixo */
            user-select: none;
            perspective: 1000px;
          }
          .hero-carousel::before {
            content: ''; display: block;
            aspect-ratio: 16 / 9; max-height: 520px;
            width: 100%;
          }

          .hero-stack-card {
            position: absolute; top: 0; left: 0; right: 0;
            height: 100%;
            will-change: transform;
            transform-origin: center bottom;
          }

          .hero-wrapper {
            display: block; width: 100%; height: 100%;
            position: relative; border-radius: 24px; overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 10px 40px -10px rgba(0,0,0,0.7);
          }
          
          /* Ajuste para o efeito de "passar por baixo" */
          .hero-back .hero-wrapper {
             /* Filtro escurece levemente o card de trás */
             filter: brightness(0.6); 
             transition: filter 0.4s ease;
          }

          .hero-backdrop { width: 100%; height: 100%; position: relative; }
          .hero-backdrop img { width: 100%; height: 100%; object-fit: cover; }
          .hero-overlay {
            position: absolute; inset: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, transparent 100%);
          }
          .hero-content {
            position: absolute; bottom: 0; left: 0; width: 100%; padding: 2rem; z-index: 2;
          }
          .hero-tag {
            display: inline-block; background: var(--primary); color: #fff;
            padding: 4px 10px; border-radius: 8px; font-size: 0.7rem;
            font-weight: 700; text-transform: uppercase; margin-bottom: 10px;
          }
          .hero-title {
            font-size: 2rem; font-weight: 800; color: #fff;
            margin-bottom: 0.5rem; line-height: 1.1;
            text-shadow: 0 2px 10px rgba(0,0,0,0.5);
          }
          .hero-overview {
            color: rgba(255, 255, 255, 0.8); font-size: 0.85rem;
            max-width: 600px; line-height: 1.5;
            display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
          }

          .hero-fav-btn {
            position: absolute; top: 16px; right: 16px; z-index: 10;
            width: 42px; height: 42px; border-radius: 50%;
            border: none; background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: transform 0.2s, background 0.2s;
          }
          .hero-fav-btn:active { transform: scale(0.9); }
          .hero-fav-btn i { font-size: 18px; }

          /* ═══ CARDS GRID ═══ */
          .content-grid {
            display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 20px 14px; width: 100%;
          }
          .card-wrapper { display: flex; flex-direction: column; width: 100%; text-decoration: none; }
          .card-poster-frame {
            position: relative; border-radius: 16px; overflow: hidden;
            aspect-ratio: 2/3; background: #1e1e1e;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          }
          .content-poster { width: 100%; height: 100%; object-fit: cover; transition: opacity 0.3s; }
          .card-title {
            margin-top: 8px; font-size: 0.85rem; font-weight: 500;
            color: #e2e8f0; line-height: 1.3;
            display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
          }
          .fav-btn {
            position: absolute; top: 6px; right: 6px; width: 28px; height: 28px;
            border-radius: 50%; background: rgba(0,0,0,0.5); border: none;
            backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center;
            cursor: pointer;
          }
          .fav-btn i { font-size: 12px; }
          @keyframes heart-zoom { 0% { transform: scale(1); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
          .heart-pulse { animation: heart-zoom 0.3s ease-in-out; }

          /* ═══ BOTTOM NAV ═══ */
          .bottom-nav {
            position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
            display: flex; align-items: center; gap: 10px; z-index: 1000;
            width: 90%; max-width: var(--pill-max-width);
          }
          .nav-pill {
            flex: 1; display: flex; align-items: center; justify-content: space-between;
            height: var(--pill-height); padding: 0 1rem;
            border-radius: var(--pill-radius); border: var(--pill-border);
            background: var(--pill-bg); backdrop-filter: var(--pill-blur);
            box-shadow: var(--pill-shadow);
          }
          .nav-btn {
            flex: 1; background: none; border: none; cursor: pointer; height: 100%;
            color: rgba(255,255,255,0.4); display: flex; align-items: center; justify-content: center;
          }
          .nav-btn i { font-size: 1.3rem; transition: transform 0.2s, color 0.2s; }
          .nav-btn.active { color: #fff; }
          .nav-btn.active i { transform: scale(1.1); filter: drop-shadow(0 0 8px rgba(255,255,255,0.4)); }

          .search-circle {
            width: var(--pill-height); height: var(--pill-height);
            border-radius: 50%; border: var(--pill-border);
            background: var(--pill-bg); backdrop-filter: var(--pill-blur);
            box-shadow: var(--pill-shadow); display: flex; align-items: center; justify-content: center;
            cursor: pointer; color: rgba(255,255,255,0.8);
          }
          .search-wrap { width: 100%; padding: 0 8px; }
          .search-wrap input {
            width: 100%; background: transparent; border: none; outline: none;
            color: #fff; font-size: 1rem;
          }

          /* ═══ TOAST & STATES ═══ */
          .toast-wrap {
            position: fixed; bottom: calc(24px + var(--pill-height) + 10px);
            left: 50%; transform: translateX(-50%); z-index: 1100;
            width: auto; pointer-events: none;
          }
          .toast {
            pointer-events: auto; display: flex; align-items: center; gap: 10px;
            padding: 10px 20px; border-radius: 30px;
            background: rgba(20, 20, 20, 0.9); border: 1px solid rgba(255,255,255,0.1);
            backdrop-filter: blur(16px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            animation: toast-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }
          .toast.closing { animation: toast-out 0.3s forwards; }
          @keyframes toast-in { from { opacity:0; transform:translateY(20px) scale(0.9); } to { opacity:1; transform:translateY(0) scale(1); } }
          @keyframes toast-out { to { opacity:0; transform:translateY(20px) scale(0.9); } }
          
          .toast-icon { width: 20px; height: 20px; border-radius: 50%; display:flex; align-items:center; justify-content:center; font-size:10px; }
          .toast.success .toast-icon { background:#10b981; color:#000; }
          .toast.error   .toast-icon { background:#ef4444; color:#fff; }
          .toast.info    .toast-icon { background:#3b82f6; color:#fff; }
          .toast-msg { font-size: 0.85rem; font-weight: 500; }

          .empty-state {
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            min-height: 40vh; color: #64748b; text-align: center;
          }
          .spinner {
            width: 30px; height: 30px; border: 3px solid rgba(255,255,255,0.1);
            border-top-color: var(--primary); border-radius: 50%;
            animation: spin 0.8s linear infinite; margin-bottom: 12px;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          .footer-credits { 
            text-align: center; padding: 3rem 0; opacity: 0.4; font-size: 0.8rem;
          }

          /* ═══ MEDIA QUERIES ═══ */
          @media (max-width: 768px) {
            .hero-carousel::before { aspect-ratio: 16/10; max-height: unset; }
            .hero-title { font-size: 1.5rem; }
            .container { padding-left: 1rem; padding-right: 1rem; }
            .content-grid { grid-template-columns: repeat(3, 1fr); gap: 12px 8px; }
          }
          @media (max-width: 480px) {
            .hero-carousel::before { aspect-ratio: 3/4; } /* Vertical card for mobile */
            .hero-content { padding: 1.5rem; background: linear-gradient(to top, rgba(0,0,0,0.9) 20%, transparent); }
            .hero-title { font-size: 1.6rem; }
            .content-grid { grid-template-columns: repeat(2, 1fr); }
            :root { --pill-height: 56px; }
            .header-pill, .bottom-nav { width: 94%; }
          }
        `}</style>
      </Head>

      <Header
        label={headerLabel}
        scrolled={scrolled}
        showInfo={showInfoPopup}
        toggleInfo={toggleInfo}
        infoClosing={infoClosing}
        toggleTech={toggleTech}
        showTech={showTech}
      />

      <ToastContainer toast={currentToast} closeToast={manualCloseToast} />

      <main className="container">
        {!loading && showHero && (
          <HeroCarousel items={heroItems} isFavorite={isFavorite} toggleFavorite={toggleFavorite} />
        )}

        <h1 className={`page-title ${showHero ? 'page-title-below' : ''}`}>{pageTitle}</h1>

        {loading && (searchActive || releases.length === 0) && (
          <div className="empty-state">
            <div className="spinner"></div>
          </div>
        )}

        {searchActive && !loading && searchResults.length === 0 && searchQuery.trim() && (
          <div className="empty-state"><i className="fas fa-ghost" style={{fontSize: '2rem', marginBottom: '10px'}}></i><p>Nada encontrado.</p></div>
        )}

        {displayItems.length > 0 && !loading && (
          <div className="content-grid">
            {displayItems.map(item => (
              <MovieCard key={getItemKey(item)} item={item} isFavorite={isFavorite(item)} toggleFavorite={toggleFavorite} />
            ))}
          </div>
        )}

        {!searchActive && activeSection === 'favorites' && favorites.length === 0 && !loading && (
          <div className="empty-state"><i className="far fa-heart" style={{fontSize: '2rem', marginBottom: '10px'}}></i><p>Lista vazia.</p></div>
        )}

        <Footer />
      </main>

      <BottomNav
        activeSection={activeSection} setActiveSection={setActiveSection}
        searchActive={searchActive} setSearchActive={setSearchActive}
        searchQuery={searchQuery} setSearchQuery={handleSearchChange}
        onSearchSubmit={debouncedSearch} inputRef={searchInputRef}
      />
    </>
  )
}
