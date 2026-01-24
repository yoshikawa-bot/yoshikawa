import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'

const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null)
  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }, [callback, delay])
}

export default function Home() {
  const [releases, setReleases] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [favorites, setFavorites] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('home')
  const [searchActive, setSearchActive] = useState(false)
  const [toasts, setToasts] = useState([])

  const searchInputRef = useRef(null)
  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const DEFAULT_POSTER = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'

  const getItemKey = (item) => `${item.media_type}-${item.id}`

  const showToast = (message, type = 'info') => {
    const id = Date.now()
    const toast = { id, message, type }
    setToasts([toast])
    setTimeout(() => {
      removeToast(id)
    }, 3000)
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  useEffect(() => {
    loadHomeContent()
    loadFavorites()
  }, [])

  useEffect(() => {
    if (searchActive && searchInputRef.current) {
      searchInputRef.current.focus()
    }
    if (!searchActive) {
        setSearchResults([])
        setSearchQuery('')
    }
  }, [searchActive])
  
  const fetchSearchResults = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      setLoading(false)
      return
    }
    
    setLoading(true)
    
    try {
      const [moviesResponse, tvResponse] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR&page=1`),
        fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR&page=1`)
      ])

      const moviesData = await moviesResponse.json()
      const tvData = await tvResponse.json()

      const allResults = [
        ...(moviesData.results || []).map(item => ({ ...item, media_type: 'movie' })),
        ...(tvData.results || []).map(item => ({ ...item, media_type: 'tv' }))
      ].filter(item => item.poster_path)
       .sort((a, b) => b.popularity - a.popularity)
       .slice(0, 30)

      setSearchResults(allResults)
      
    } catch (error) {
      showToast('Erro na busca em tempo real', 'error')
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const debouncedSearch = useDebounce(fetchSearchResults, 300)

  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    if (query.trim() === '') {
        setSearchResults([])
        setLoading(false)
        return
    }
    setLoading(true)
    debouncedSearch(query)
  }

  const loadHomeContent = async () => { 
    setLoading(true)
    try {
      const [moviesResponse, tvResponse, popularMoviesResponse, popularTvResponse] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`),
        fetch(`https://api.themoviedb.org/3/tv/on_the_air?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`),
        fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`),
        fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`)
      ])

      const moviesData = await moviesResponse.json()
      const tvData = await tvResponse.json()
      const popularMoviesData = await popularMoviesResponse.json()
      const popularTvData = await popularTvResponse.json()

      const allReleases = [
        ...(moviesData.results || []).map(item => ({...item, media_type: 'movie'})),
        ...(tvData.results || []).map(item => ({...item, media_type: 'tv'}))
      ]
        .filter(item => item.poster_path)
        .sort((a, b) => new Date(b.release_date || b.first_air_date) - new Date(a.release_date || a.first_air_date))
        .slice(0, 20)

      const allPopular = [
        ...(popularMoviesData.results || []).map(item => ({...item, media_type: 'movie'})),
        ...(popularTvData.results || []).map(item => ({...item, media_type: 'tv'}))
      ]
        .filter(item => item.poster_path)
        .sort(() => 0.5 - Math.random())
        .slice(0, 20)

      setReleases(allReleases)
      setRecommendations(allPopular)

    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFavorites = () => {
    try {
      const savedFavorites = localStorage.getItem('yoshikawaFavorites')
      const initialFavorites = savedFavorites ? JSON.parse(savedFavorites) : []
      setFavorites(initialFavorites)
    } catch (error) {
      setFavorites([])
    }
  }
  
  const isFavorite = (item) => {
    return favorites.some(fav => fav.id === item.id && fav.media_type === item.media_type);
  }

  const toggleFavorite = (item) => {
    setFavorites(prevFavorites => {
      let newFavorites
      const wasFavorite = isFavorite(item)
      
      if (wasFavorite) {
        newFavorites = prevFavorites.filter(fav => getItemKey(fav) !== getItemKey(item))
        showToast('Removido dos favoritos', 'info')
      } else {
        const favoriteItem = {
          id: item.id,
          media_type: item.media_type,
          title: item.title || item.name,
          poster_path: item.poster_path,
          release_date: item.release_date,
          first_air_date: item.first_air_date,
          overview: item.overview,
          genre_ids: item.genre_ids
        }
        newFavorites = [...prevFavorites, favoriteItem]
        showToast('Adicionado aos favoritos!', 'success')
      }
      
      localStorage.setItem('yoshikawaFavorites', JSON.stringify(newFavorites))
      return newFavorites
    })
  }

  const HeroSection = ({ item }) => {
    if (!item) return null;
    return (
      <section className="hero-section">
        <div className="hero-card">
          <div 
            className="hero-bg" 
            style={{backgroundImage: `url(https://image.tmdb.org/t/p/original${item.backdrop_path || item.poster_path})`}}
          ></div>
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <span className="hero-badge">Destaque</span>
            <h2 className="hero-title">{item.title || item.name}</h2>
            <div className="hero-meta">
              <span>{item.media_type === 'movie' ? 'Filme' : 'Série'}</span>
              <span className="dot"></span>
              <span>{new Date(item.release_date || item.first_air_date).getFullYear()}</span>
            </div>
            <div className="hero-actions">
              <Link href={`/${item.media_type}/${item.id}`} className="btn-primary">
                <span className="material-symbols-outlined">play_arrow</span>
                Assistir
              </Link>
              <button className="btn-glass" onClick={() => toggleFavorite(item)}>
                <span className="material-symbols-outlined">
                    {isFavorite(item) ? 'check' : 'add'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const GenreGrid = () => (
    <section className="genre-section">
      <div className="section-header">
        <h3 className="section-title">Categorias</h3>
        <button className="view-all">Ver todas</button>
      </div>
      <div className="genre-grid">
        <div className="genre-card action">
            <div className="genre-bg-icon"><span className="material-symbols-outlined">swords</span></div>
            <div className="genre-content">
                <div className="genre-icon-circle action"><span className="material-symbols-outlined">swords</span></div>
                <span className="genre-name">Ação</span>
            </div>
        </div>
        <div className="genre-card comedy">
            <div className="genre-bg-icon"><span className="material-symbols-outlined">sentiment_very_satisfied</span></div>
            <div className="genre-content">
                <div className="genre-icon-circle comedy"><span className="material-symbols-outlined">sentiment_very_satisfied</span></div>
                <span className="genre-name">Comédia</span>
            </div>
        </div>
        <div className="genre-card romance">
            <div className="genre-bg-icon"><span className="material-symbols-outlined">favorite</span></div>
            <div className="genre-content">
                <div className="genre-icon-circle romance"><span className="material-symbols-outlined">favorite</span></div>
                <span className="genre-name">Romance</span>
            </div>
        </div>
        <div className="genre-card scifi">
            <div className="genre-bg-icon"><span className="material-symbols-outlined">rocket_launch</span></div>
            <div className="genre-content">
                <div className="genre-icon-circle scifi"><span className="material-symbols-outlined">rocket_launch</span></div>
                <span className="genre-name">Sci-Fi</span>
            </div>
        </div>
      </div>
    </section>
  )

  const HorizontalList = ({ title, items }) => (
    <section className="horizontal-section">
      <h3 className="section-title">{title}</h3>
      <div className="horizontal-scroll-container">
        {items.map(item => (
          <Link key={getItemKey(item)} href={`/${item.media_type}/${item.id}`} className="h-card">
            <div className="h-card-image-wrapper">
                <img 
                    src={item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : DEFAULT_POSTER} 
                    alt={item.title || item.name}
                    loading="lazy"
                />
                <div className="h-card-overlay">
                    <div className="play-circle">
                        <span className="material-symbols-outlined">play_arrow</span>
                    </div>
                </div>
            </div>
            <div className="h-card-info">
              <h4 className="h-card-title">{item.title || item.name}</h4>
              <p className="h-card-subtitle">
                {item.media_type === 'movie' ? 'Filme' : 'Série'} • {new Date(item.release_date || item.first_air_date).getFullYear() || 'N/A'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )

  const StandardGrid = ({ items, emptyMessage }) => (
    <div className="grid-container">
      {items.length > 0 ? items.map(item => (
        <Link key={getItemKey(item)} href={`/${item.media_type}/${item.id}`} className="grid-card">
          <div className="grid-image-wrapper">
             <img 
                src={item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : DEFAULT_POSTER} 
                alt={item.title || item.name}
                loading="lazy"
            />
            <div className="grid-overlay">
                <span className="material-symbols-outlined">play_arrow</span>
            </div>
            {isFavorite(item) && <div className="fav-badge"><span className="material-symbols-outlined">favorite</span></div>}
          </div>
          <div className="grid-info">
             <h4>{item.title || item.name}</h4>
          </div>
        </Link>
      )) : (
        <div className="empty-state">
            <span className="material-symbols-outlined">videocam_off</span>
            <p>{emptyMessage}</p>
        </div>
      )}
    </div>
  )

  const ToastContainer = () => (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type} show`}>
          <div className="toast-icon">
            <span className="material-symbols-outlined">
              {toast.type === 'success' ? 'check' : toast.type === 'error' ? 'error' : 'info'}
            </span>
          </div>
          <div className="toast-content">{toast.message}</div>
        </div>
      ))}
    </div>
  )

  return (
    <>
      <Head>
        <title>StreamHub Yoshikawa</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </Head>

      <div className="app-shell">
        <header className="app-header">
            <div className="header-left">
                <div className="avatar-container">
                    <img src="https://yoshikawa-bot.github.io/cache/images/14c34900.jpg" alt="Profile" />
                    <div className="status-dot"></div>
                </div>
                <div className="greeting">
                    <p>Bem-vindo,</p>
                    <h2>Visitante</h2>
                </div>
            </div>
            <div className="header-right">
                <button 
                    className={`icon-btn ${searchActive ? 'active' : ''}`}
                    onClick={() => setSearchActive(!searchActive)}
                >
                    <span className="material-symbols-outlined">search</span>
                </button>
                <button className="icon-btn relative">
                    <span className="material-symbols-outlined">notifications</span>
                    <span className="badge-dot"></span>
                </button>
            </div>
        </header>

        {searchActive && (
            <div className="search-bar-wrapper">
                <div className="search-input-box">
                    <span className="material-symbols-outlined">search</span>
                    <input 
                        ref={searchInputRef}
                        type="text"
                        placeholder="Buscar filmes, animes, séries..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                    {loading && <span className="material-symbols-outlined spin">refresh</span>}
                </div>
            </div>
        )}

        <main className="main-content">
            {searchActive ? (
                <div className="search-results-container">
                    <h3 className="section-title">Resultados ({searchResults.length})</h3>
                    <StandardGrid items={searchResults} emptyMessage="Digite para pesquisar..." />
                </div>
            ) : activeTab === 'favorites' ? (
                <div className="favorites-container">
                    <h3 className="section-title">Meus Favoritos</h3>
                    <StandardGrid items={favorites} emptyMessage="Você ainda não tem favoritos." />
                </div>
            ) : (
                <>
                    {loading ? (
                        <div className="loading-screen">
                            <div className="spinner"></div>
                        </div>
                    ) : (
                        <>
                            <HeroSection item={releases[0]} />
                            <GenreGrid />
                            <HorizontalList title="Populares" items={recommendations} />
                            <HorizontalList title="Novos Lançamentos" items={releases.slice(1)} />
                        </>
                    )}
                </>
            )}
        </main>

        <nav className="bottom-nav">
            <div className="nav-inner">
                <button 
                    className={`nav-item ${!searchActive && activeTab === 'home' ? 'active' : ''}`}
                    onClick={() => {setActiveTab('home'); setSearchActive(false);}}
                >
                    <span className="material-symbols-outlined icon">home</span>
                    <span className="label">Início</span>
                </button>
                <button className="nav-item">
                    <span className="material-symbols-outlined icon">explore</span>
                    <span className="label">Explorar</span>
                </button>
                <button 
                    className={`nav-item ${activeTab === 'favorites' ? 'active' : ''}`}
                    onClick={() => {setActiveTab('favorites'); setSearchActive(false);}}
                >
                    <span className="material-symbols-outlined icon">favorite</span>
                    <span className="label">Favoritos</span>
                </button>
                <button className="nav-item">
                    <span className="material-symbols-outlined icon">person</span>
                    <span className="label">Perfil</span>
                </button>
            </div>
        </nav>

        <ToastContainer />
      </div>

      <style jsx global>{`
        :root {
            --primary: #137fec;
            --primary-hover: #0b6ad0;
            --bg-dark: #101922;
            --surface-dark: #1c2630;
            --surface-light: rgba(255, 255, 255, 0.05);
            --text-white: #ffffff;
            --text-gray: #94a3b8;
            --border: #1e293b;
            --font-main: 'Plus Jakarta Sans', sans-serif;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-tap-highlight-color: transparent;
        }

        body {
            background-color: var(--bg-dark);
            color: var(--text-white);
            font-family: var(--font-main);
            padding-bottom: 80px; 
            overflow-x: hidden;
        }

        /* Header */
        .app-header {
            position: sticky;
            top: 0;
            z-index: 50;
            background: rgba(16, 25, 34, 0.95);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .avatar-container {
            position: relative;
            width: 40px;
            height: 40px;
        }

        .avatar-container img {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid rgba(19, 127, 236, 0.2);
        }

        .status-dot {
            position: absolute;
            bottom: 0;
            right: 0;
            width: 10px;
            height: 10px;
            background-color: #22c55e;
            border: 2px solid var(--bg-dark);
            border-radius: 50%;
        }

        .greeting p {
            font-size: 10px;
            color: var(--text-gray);
            font-weight: 500;
        }

        .greeting h2 {
            font-size: 14px;
            font-weight: 700;
            line-height: 1.1;
        }

        .header-right {
            display: flex;
            gap: 8px;
        }

        .icon-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: var(--surface-dark);
            border: none;
            color: var(--text-white);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background 0.2s;
        }

        .icon-btn:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        
        .icon-btn.active {
            background: var(--primary);
            color: white;
        }

        .icon-btn .material-symbols-outlined {
            font-size: 20px;
        }

        .badge-dot {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 8px;
            height: 8px;
            background-color: var(--primary);
            border-radius: 50%;
        }

        /* Search Bar */
        .search-bar-wrapper {
            padding: 0 16px 16px 16px;
            background: rgba(16, 25, 34, 0.95);
            position: sticky;
            top: 65px;
            z-index: 49;
        }

        .search-input-box {
            background: var(--surface-dark);
            border-radius: 12px;
            display: flex;
            align-items: center;
            padding: 0 12px;
            height: 48px;
            gap: 10px;
        }

        .search-input-box input {
            background: transparent;
            border: none;
            color: white;
            flex: 1;
            font-size: 14px;
            font-family: var(--font-main);
            outline: none;
        }

        .search-input-box .material-symbols-outlined {
            color: var(--text-gray);
        }

        .spin {
            animation: spin 1s linear infinite;
        }

        @keyframes spin { 100% { transform: rotate(360deg); } }

        /* Hero Section */
        .hero-section {
            padding: 16px 16px 24px 16px;
        }

        .hero-card {
            position: relative;
            width: 100%;
            aspect-ratio: 16/9;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        
        @media (max-width: 640px) {
            .hero-card {
                aspect-ratio: 4/5;
            }
        }

        .hero-bg {
            position: absolute;
            inset: 0;
            background-size: cover;
            background-position: center;
            transition: transform 0.5s;
        }

        .hero-card:hover .hero-bg {
            transform: scale(1.05);
        }

        .hero-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 60%, transparent 100%);
        }

        .hero-content {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
        }

        .hero-badge {
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: white;
            font-size: 10px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 6px;
            text-transform: uppercase;
        }

        .hero-title {
            font-size: 28px;
            font-weight: 800;
            line-height: 1.1;
            text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }

        .hero-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #cbd5e1;
            font-size: 13px;
            font-weight: 500;
        }

        .dot {
            width: 4px;
            height: 4px;
            background: #94a3b8;
            border-radius: 50%;
        }

        .hero-actions {
            display: flex;
            gap: 12px;
            width: 100%;
            margin-top: 8px;
        }

        .btn-primary {
            flex: 1;
            height: 48px;
            background: var(--primary);
            color: white;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-weight: 700;
            font-size: 14px;
            text-decoration: none;
            transition: background 0.2s;
        }

        .btn-primary:hover {
            background: var(--primary-hover);
        }

        .btn-glass {
            width: 48px;
            height: 48px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(4px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: white;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
        }

        /* Genre Grid */
        .section-title {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 16px;
            letter-spacing: -0.5px;
        }

        .genre-section {
            padding: 0 16px 24px 16px;
        }

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }

        .view-all {
            background: none;
            border: none;
            color: var(--primary);
            font-weight: 700;
            font-size: 12px;
            cursor: pointer;
        }

        .genre-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }

        .genre-card {
            position: relative;
            height: 90px;
            background: var(--surface-dark);
            border-radius: 12px;
            overflow: hidden;
            display: flex;
            align-items: center;
            padding: 0 16px;
            cursor: pointer;
            border: 1px solid transparent;
            transition: all 0.2s;
        }
        
        .genre-card:hover {
            border-color: rgba(19, 127, 236, 0.5);
        }

        .genre-bg-icon {
            position: absolute;
            right: -10px;
            bottom: -10px;
            opacity: 0.05;
        }
        
        .genre-bg-icon span {
            font-size: 80px;
        }

        .genre-content {
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 1;
        }

        .genre-icon-circle {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .genre-icon-circle span {
            font-size: 20px;
        }

        .genre-icon-circle.action { background: rgba(19, 127, 236, 0.15); color: var(--primary); }
        .genre-icon-circle.comedy { background: rgba(249, 115, 22, 0.15); color: #f97316; }
        .genre-icon-circle.romance { background: rgba(236, 72, 153, 0.15); color: #ec4899; }
        .genre-icon-circle.scifi { background: rgba(168, 85, 247, 0.15); color: #a855f7; }

        .genre-name {
            font-weight: 700;
            font-size: 15px;
        }

        /* Horizontal Lists */
        .horizontal-section {
            padding: 0 0 32px 16px;
        }

        .horizontal-scroll-container {
            display: flex;
            gap: 12px;
            overflow-x: auto;
            padding-bottom: 10px;
            padding-right: 16px;
            scroll-snap-type: x mandatory;
            scrollbar-width: none;
        }
        
        .horizontal-scroll-container::-webkit-scrollbar {
            display: none;
        }

        .h-card {
            min-width: 140px;
            width: 140px;
            scroll-snap-align: start;
            text-decoration: none;
            color: inherit;
        }

        .h-card-image-wrapper {
            aspect-ratio: 2/3;
            width: 100%;
            border-radius: 12px;
            overflow: hidden;
            background: var(--surface-dark);
            position: relative;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        }

        .h-card-image-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .h-card-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.2s;
        }
        
        .h-card-image-wrapper:hover .h-card-overlay {
            opacity: 1;
        }
        
        .play-circle {
            width: 40px;
            height: 40px;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(4px);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }

        .h-card-info {
            padding-top: 8px;
        }

        .h-card-title {
            font-size: 13px;
            font-weight: 700;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-bottom: 2px;
        }

        .h-card-subtitle {
            font-size: 11px;
            color: var(--text-gray);
        }
        
        /* Standard Grid (Search & Favs) */
        .search-results-container, .favorites-container {
            padding: 16px;
        }
        
        .grid-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
            gap: 12px;
        }
        
        .grid-card {
            text-decoration: none;
            color: white;
        }
        
        .grid-image-wrapper {
            position: relative;
            aspect-ratio: 2/3;
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 8px;
            background: var(--surface-dark);
        }
        
        .grid-image-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .fav-badge {
            position: absolute;
            top: 4px;
            right: 4px;
            background: rgba(0,0,0,0.6);
            border-radius: 50%;
            padding: 4px;
            display: flex;
        }
        
        .fav-badge span {
            font-size: 14px;
            color: #ef4444;
            font-variation-settings: 'FILL' 1;
        }
        
        .grid-info h4 {
            font-size: 12px;
            font-weight: 600;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        
        .empty-state {
            grid-column: 1 / -1;
            text-align: center;
            padding: 40px 0;
            color: var(--text-gray);
        }
        
        .empty-state span {
            font-size: 48px;
            margin-bottom: 12px;
            display: block;
        }

        /* Bottom Navigation */
        .bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(16, 25, 34, 0.95);
            backdrop-filter: blur(20px);
            border-top: 1px solid var(--border);
            z-index: 100;
            padding-bottom: env(safe-area-inset-bottom);
        }

        .nav-inner {
            display: flex;
            justify-content: space-around;
            height: 60px;
            align-items: center;
            max-width: 600px;
            margin: 0 auto;
        }

        .nav-item {
            background: none;
            border: none;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            color: #64748b;
            cursor: pointer;
            transition: color 0.2s;
            width: 60px;
        }

        .nav-item.active {
            color: var(--primary);
        }
        
        .nav-item .icon {
            font-size: 26px;
            transition: transform 0.2s;
        }
        
        .nav-item:hover .icon {
            transform: translateY(-2px);
        }
        
        .nav-item.active .icon {
            font-variation-settings: 'FILL' 1;
        }

        .nav-item .label {
            font-size: 10px;
            font-weight: 600;
        }
        
        /* Toast */
        .toast-container {
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 200;
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 90%;
            max-width: 400px;
        }
        
        .toast {
            background: rgba(28, 38, 48, 0.9);
            backdrop-filter: blur(10px);
            color: white;
            padding: 12px 16px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.1);
            animation: slideUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        
        @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        .toast-success .toast-icon { color: #22c55e; }
        .toast-error .toast-icon { color: #ef4444; }
        .toast-info .toast-icon { color: var(--primary); }
        
        .toast-content { font-size: 13px; font-weight: 500; }
        
        .loading-screen {
            display: flex;
            justify-content: center;
            padding-top: 50px;
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255,255,255,0.1);
            border-top: 3px solid var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
      `}</style>
    </>
  )
}
