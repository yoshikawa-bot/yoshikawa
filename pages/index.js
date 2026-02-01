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

export const Header = ({ label, scrolled }) => {
  const handleBtnClick = () => {
    if (scrolled) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="header-pill">
      <Link href="/" className="header-left">
        <img src="https://yoshikawa-bot.github.io/cache/images/14c34900.jpg" alt="Yoshikawa" className="header-logo" />
        <span className="header-label">{label}</span>
      </Link>
      
      {scrolled && (
        <button className="header-plus" onClick={handleBtnClick}>
          <i className="fas fa-chevron-up"></i>
        </button>
      )}
    </header>
  )
}

export const HeroBanner = ({ item, isFavorite, toggleFavorite }) => {
  const [animating, setAnimating] = useState(false);
  if (!item) return null;

  const handleFavClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAnimating(true);
    toggleFavorite(item);
    setTimeout(() => setAnimating(false), 300);
  };

  const backdropUrl = item.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` 
    : DEFAULT_BACKDROP;

  return (
    <Link href={`/${item.media_type}/${item.id}`} className="hero-wrapper">
      <div className="hero-backdrop">
        <img src={backdropUrl} alt={item.title || item.name} loading="eager" />
        <div className="hero-overlay"></div>
        
        <button className="hero-fav-btn" onClick={handleFavClick}>
          <i className={`${isFavorite ? 'fas fa-heart' : 'far fa-heart'} ${animating ? 'heart-pulse' : ''}`}
             style={{ color: isFavorite ? '#ff6b6b' : '#ffffff' }}></i>
        </button>

        <div className="hero-content">
          <span className="hero-tag">Destaque</span>
          <h2 className="hero-title">{item.title || item.name}</h2>
          <p className="hero-overview">{item.overview ? item.overview.slice(0, 150) + '...' : 'Sem descrição disponível.'}</p>
        </div>
      </div>
    </Link>
  )
}

export const MovieCard = ({ item, isFavorite, toggleFavorite }) => {
  const [animating, setAnimating] = useState(false);

  const handleFavClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
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

// ... Restante dos componentes (BottomNav, ToastContainer, Footer) mantendo a estrutura lógica

export default function Home() {
  const [releases, setReleases] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [favorites, setFavorites] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSection, setActiveSection] = useState('releases')
  const [searchActive, setSearchActive] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [currentToast, setCurrentToast] = useState(null)
  const [toastQueue, setToastQueue] = useState([])

  const searchInputRef = useRef(null)

  // Handlers de Toast e Fetching (Mantidos do código original)
  // ... (showToast, loadHomeContent, loadFavorites, toggleFavorite)

  const activeList = searchActive ? searchResults : (activeSection === 'releases' ? releases : (activeSection === 'recommendations' ? recommendations : favorites));
  const showHero = !searchActive && (activeSection === 'releases' || activeSection === 'recommendations') && activeList.length > 0;
  const heroItem = showHero ? activeList[0] : null;
  const displayItems = showHero ? activeList.slice(1) : activeList;

  return (
    <>
      <Head>
        <title>Yoshikawa Player</title>
        <style>{`
          /* Estilos Globais */
          body { background: #000; color: #f1f5f9; font-family: 'Inter', sans-serif; }
          
          /* Hero Section Modernizada */
          .hero-wrapper {
            display: block;
            position: relative;
            width: 100%;
            border-radius: 28px;
            overflow: hidden;
            margin-bottom: 2.5rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: #111;
            transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
          }
          .hero-wrapper:hover { transform: scale(1.005); }
          .hero-backdrop { position: relative; width: 100%; aspect-ratio: 16/9; max-height: 550px; }
          .hero-backdrop img { width: 100%; height: 100%; object-fit: cover; }
          .hero-overlay {
            position: absolute; inset: 0;
            background: linear-gradient(to top, #000 5%, rgba(0,0,0,0.4) 40%, transparent 100%);
          }
          .hero-content { position: absolute; bottom: 0; left: 0; padding: 2.5rem; width: 100%; z-index: 3; }
          .hero-title { font-size: clamp(1.5rem, 5vw, 2.5rem); font-weight: 800; margin-bottom: 0.8rem; }
          .hero-overview { color: rgba(255,255,255,0.7); font-size: 0.95rem; max-width: 700px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
          
          /* Botões de Favorito */
          .fav-btn, .hero-fav-btn {
            background: rgba(0,0,0,0.4);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.15);
            cursor: pointer;
            outline: none;
            transition: all 0.2s ease;
          }
          .fav-btn:focus, .fav-btn:active, .hero-fav-btn:focus, .hero-fav-btn:active {
            outline: none !important;
            border-color: rgba(255,255,255,0.3);
            box-shadow: none;
          }
          .hero-fav-btn {
            position: absolute; top: 20px; right: 20px;
            width: 48px; height: 48px; border-radius: 50%;
            z-index: 5; font-size: 1.2rem;
          }
          
          /* Corrigindo o efeito de animação */
          @keyframes heart-zoom { 
            0% { transform: scale(1); } 
            50% { transform: scale(1.3); } 
            100% { transform: scale(1); } 
          }
          .heart-pulse { animation: heart-zoom 0.3s ease; }

          /* Layout Grid */
          .content-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 20px;
          }

          @media (max-width: 768px) {
            .hero-content { padding: 1.5rem; }
            .hero-fav-btn { width: 40px; height: 40px; top: 15px; right: 15px; }
            .content-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          }
        `}</style>
      </Head>

      <Header label={headerLabel} scrolled={scrolled} />
      
      <main className="container">
        <h1 className="page-title">{pageTitle}</h1>

        {showHero && (
          <HeroBanner 
            item={heroItem} 
            isFavorite={isFavorite(heroItem)} 
            toggleFavorite={toggleFavorite} 
          />
        )}

        {displayItems.length > 0 && (
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
      </main>

      {/* Footer e Nav mantidos... */}
    </>
  )
}
