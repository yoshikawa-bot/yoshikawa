import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'

const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null)
  return useCallback((...args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => callback(...args), delay)
  }, [callback, delay])
}

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
  const [scrolled, setScrolled] = useState(false)

  const searchInputRef = useRef(null)
  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const DEFAULT_POSTER = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'

  const getItemKey = (item) => `${item.media_type}-${item.id}`

  const sectionTitles = {
    releases: 'Lançamentos',
    recommendations: 'Populares',
    favorites: 'Favoritos'
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
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

  const fetchSearchResults = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [moviesRes, tvRes] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR&page=1`),
        fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR&page=1`)
      ])
      const moviesData = await moviesRes.json()
      const tvData = await tvRes.json()
      setSearchResults([
        ...(moviesData.results || []).map(i => ({ ...i, media_type: 'movie' })),
        ...(tvData.results || []).map(i => ({ ...i, media_type: 'tv' }))
      ].filter(i => i.poster_path).sort((a, b) => b.popularity - a.popularity).slice(0, 30))
    } catch (err) {
      showToast('Erro na busca', 'error')
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const debouncedSearch = useDebounce(fetchSearchResults, 300)

  const handleSearchChange = (e) => {
    const q = e.target.value
    setSearchQuery(q)
    if (!q.trim()) { setSearchResults([]); setLoading(false); return }
    setLoading(true)
    debouncedSearch(q)
  }

  const loadHomeContent = async () => {
    try {
      const [r1, r2, r3, r4] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`),
        fetch(`https://api.themoviedb.org/3/tv/on_the_air?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`),
        fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`),
        fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`)
      ])
      const [d1, d2, d3, d4] = await Promise.all([r1.json(), r2.json(), r3.json(), r4.json()])

      setReleases([
        ...(d1.results || []).map(i => ({ ...i, media_type: 'movie' })),
        ...(d2.results || []).map(i => ({ ...i, media_type: 'tv' }))
      ].filter(i => i.poster_path).sort((a, b) => new Date(b.release_date || b.first_air_date) - new Date(a.release_date || a.first_air_date)).slice(0, 15))

      setRecommendations([
        ...(d3.results || []).map(i => ({ ...i, media_type: 'movie' })),
        ...(d4.results || []).map(i => ({ ...i, media_type: 'tv' }))
      ].filter(i => i.poster_path).sort(() => 0.5 - Math.random()).slice(0, 15))
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
        next = [...prev, { id: item.id, media_type: item.media_type, title: item.title || item.name, poster_path: item.poster_path, release_date: item.release_date, first_air_date: item.first_air_date, overview: item.overview }]
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

  const pageTitle = searchActive ? 'Resultados' : (sectionTitles[activeSection] || 'Conteúdo')

  const headerLabel = scrolled
    ? (searchActive ? 'Resultados' : sectionTitles[activeSection] || 'Conteúdo')
    : 'Yoshikawa'

  return (
    <>
      <Head>
        <title>Yoshikawa Player</title>
        <meta name="description" content="Yoshikawa Streaming Player" />
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
          }

          a { color: inherit; text-decoration: none; }
          button { font-family: inherit; }
          img { max-width: 100%; height: auto; }

          :root {
            --pill-height: 72px;
            --pill-radius: 44px;
            --pill-bg: rgba(20, 20, 20, 0.35);
            --pill-border: 1px solid rgba(255, 255, 255, 0.12);
            --pill-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
            --pill-blur: blur(40px);
            --pill-max-width: 680px;
          }

          .header-pill {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 100;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            height: var(--pill-height);
            width: 90%;
            max-width: var(--pill-max-width);
            padding: 0 1.75rem;
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
            width: 30px;
            height: 30px;
            border-radius: 8px;
            object-fit: cover;
            flex-shrink: 0;
          }

          .header-label {
            font-size: 1.1rem;
            font-weight: 600;
            color: #f0f6fc;
            white-space: nowrap;
            transition: opacity 0.3s;
          }

          .header-plus {
            background: none;
            border: none;
            color: #f1f5f9;
            font-size: 1.3rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 4px;
            opacity: 0.7;
            transition: opacity 0.2s;
            flex-shrink: 0;
          }
          .header-plus:hover { opacity: 1; }

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

          .content-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 14px;
            width: 100%;
          }

          .content-card {
            position: relative;
            display: block;
            border-radius: 20px;
            overflow: hidden;
            aspect-ratio: 2/3;
            border: 1px solid rgba(255, 255, 255, 0.13);
            background: #1e1e1e;
            cursor: pointer;
            text-decoration: none;
            transition: transform 0.25s, box-shadow 0.25s;
          }
          .content-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45);
          }

          .content-poster {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }

          .fav-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            z-index: 2;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            border: 1px solid rgba(255, 255, 255, 0.18);
            background: rgba(0, 0, 0, 0.35);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            color: #fff;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background 0.2s, transform 0.2s;
          }
          .fav-btn:hover { background: rgba(255, 107, 107, 0.45); transform: scale(1.08); }
          .fav-btn.active { background: rgba(255, 107, 107, 0.6); }

          .bottom-nav {
            position: fixed;
            bottom: 25px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            align-items: center;
            gap: 14px;
            z-index: 1000;
          }

          .nav-pill {
            display: flex;
            align-items: center;
            justify-content: space-around;
            height: var(--pill-height);
            padding: 0 1.75rem;
            border-radius: var(--pill-radius);
            border: var(--pill-border);
            background: var(--pill-bg);
            backdrop-filter: var(--pill-blur);
            -webkit-backdrop-filter: var(--pill-blur);
            box-shadow: var(--pill-shadow);
            width: calc(var(--pill-max-width) - 86px);
            max-width: calc(var(--pill-max-width) - 86px);
            transition: all 0.3s;
          }

          .nav-pill.search-mode {
            justify-content: flex-start;
            padding: 0 1.75rem;
          }

          .nav-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            background: none;
            border: none;
            color: #94a3b8;
            cursor: pointer;
            transition: color 0.2s;
            height: 100%;
          }
          .nav-btn i { font-size: 24px; transition: color 0.2s, transform 0.15s; color: #f1f5f9; }
          .nav-btn:hover i { color: #ff6b6b; transform: scale(1.08); }
          .nav-btn.active i { color: #ff6b6b; }

          .search-wrap {
            width: 100%;
            display: flex;
            align-items: center;
            height: 100%;
          }
          .search-wrap input {
            flex: 1;
            background: transparent;
            border: none;
            outline: none;
            color: #f1f5f9;
            font-size: 16px;
            font-family: inherit;
          }
          .search-wrap input::placeholder { color: #f1f5f9; opacity: 0.5; }

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
            color: #f1f5f9;
          }
          .search-circle i { font-size: 28px; }

          .toast-wrap {
            position: fixed;
            bottom: calc(25px + var(--pill-height) + 14px);
            left: 50%;
            transform: translateX(-50%);
            z-index: 999;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            pointer-events: none;
          }

          .toast {
            pointer-events: auto;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 0 1.75rem;
            height: 40px;
            border-radius: 28px;
            border: var(--pill-border);
            background: var(--pill-bg);
            backdrop-filter: var(--pill-blur);
            -webkit-backdrop-filter: var(--pill-blur);
            box-shadow: var(--pill-shadow);
            white-space: nowrap;
            animation: toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }

          @keyframes toast-in {
            from { opacity: 0; transform: translateY(12px) scale(0.96); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }

          .toast-icon {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            flex-shrink: 0;
          }
          .toast.success .toast-icon { background: #10b981; color: #fff; }
          .toast.info    .toast-icon { background: #4dabf7; color: #fff; }
          .toast.error   .toast-icon { background: #ef4444; color: #fff; }

          .toast-msg { flex: 1; font-size: 14px; color: #f1f5f9; }

          .toast-x {
            background: none;
            border: none;
            color: #94a3b8;
            cursor: pointer;
            font-size: 13px;
            padding: 2px;
            transition: color 0.15s;
          }
          .toast-x:hover { color: #f1f5f9; }

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
              --pill-height: 64px;
              --pill-max-width: 90vw;
            }
            .content-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px; }
            .container { padding-left: 1.5rem; padding-right: 1.5rem; }
            .header-pill { top: 14px; width: 92%; }
            .nav-pill { width: calc(var(--pill-max-width) - 78px); padding: 0 1rem; }
          }

          @media (max-width: 480px) {
            :root {
              --pill-height: 60px;
              --pill-max-width: 95vw;
            }
            .container { padding-left: 1rem; padding-right: 1rem; }
            .nav-pill { padding: 0 1.75rem; }
            .nav-btn i { font-size: 22px; }
            .search-circle i { font-size: 24px; }
            .bottom-nav { gap: 8px; }
          }

          @media (prefers-reduced-motion: reduce) {
            * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
          }
        `}</style>
      </Head>

      <header className="header-pill">
        <Link href="/" className="header-left">
          <img src="https://yoshikawa-bot.github.io/cache/images/14c34900.jpg" alt="Yoshikawa" className="header-logo" />
          <span className="header-label">{headerLabel}</span>
        </Link>
        <button className="header-plus" title="Adicionar">
          <i className="fas fa-plus"></i>
        </button>
      </header>

      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <div className="toast-icon">
              <i className={`fas ${t.type === 'success' ? 'fa-check' : t.type === 'error' ? 'fa-exclamation-triangle' : 'fa-info'}`}></i>
            </div>
            <div className="toast-msg">{t.message}</div>
            <button className="toast-x" onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}><i className="fas fa-times"></i></button>
          </div>
        ))}
      </div>

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
            {(searchActive ? searchResults : getActiveItems()).map(item => {
              const fav = isFavorite(item)
              return (
                <Link key={getItemKey(item)} href={`/${item.media_type}/${item.id}`} className="content-card">
                  <img src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : DEFAULT_POSTER} alt={item.title || item.name} className="content-poster" loading="lazy" />
                  <button className={`fav-btn ${fav ? 'active' : ''}`} onClick={e => { e.preventDefault(); e.stopPropagation(); toggleFavorite(item) }}>
                    <i className={fav ? 'fas fa-heart' : 'far fa-heart'}></i>
                  </button>
                </Link>
              )
            })}
          </div>
        )}

        {!searchActive && activeSection === 'favorites' && favorites.length === 0 && !loading && (
          <div className="empty-state"><i className="fas fa-heart"></i><p>Nenhum favorito adicionado ainda.</p></div>
        )}
      </main>

      <div className="bottom-nav">
        <div className={`nav-pill ${searchActive ? 'search-mode' : ''}`}>
          {searchActive ? (
            <div className="search-wrap">
              <input ref={searchInputRef} type="text" placeholder="Pesquisar..." value={searchQuery} onChange={handleSearchChange} onKeyDown={e => e.key === 'Enter' && searchQuery.trim() && debouncedSearch(searchQuery)} />
            </div>
          ) : (
            <>
              <button className={`nav-btn ${activeSection === 'releases' ? 'active' : ''}`} onClick={() => setActiveSection('releases')}><i className="fas fa-film"></i></button>
              <button className={`nav-btn ${activeSection === 'recommendations' ? 'active' : ''}`} onClick={() => setActiveSection('recommendations')}><i className="fas fa-fire"></i></button>
              <button className={`nav-btn ${activeSection === 'favorites' ? 'active' : ''}`} onClick={() => setActiveSection('favorites')}><i className="fas fa-heart"></i></button>
            </>
          )}
        </div>

        <button className="search-circle" onClick={() => setSearchActive(s => !s)}>
          <i className={searchActive ? 'fas fa-times' : 'fas fa-search'}></i>
        </button>
      </div>
    </>
  )
}
