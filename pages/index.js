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
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSection, setActiveSection] = useState('releases')
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
    setTimeout(() => { removeToast(id) }, 3000)
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
      ].filter(item => item.poster_path).sort((a, b) => b.popularity - a.popularity).slice(0, 30)
      setSearchResults(allResults)
    } catch (error) {
      console.error(error)
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
      ].filter(item => item.poster_path).sort((a, b) => new Date(b.release_date || b.first_air_date) - new Date(a.release_date || a.first_air_date)).slice(0, 15)

      const allPopular = [
        ...(popularMoviesData.results || []).map(item => ({...item, media_type: 'movie'})),
        ...(popularTvData.results || []).map(item => ({...item, media_type: 'tv'}))
      ].filter(item => item.poster_path).sort(() => 0.5 - Math.random()).slice(0, 15)

      setReleases(allReleases)
      setRecommendations(allPopular)
    } catch (error) {
      console.error(error)
    }
  }

  const loadFavorites = () => {
    try {
      const savedFavorites = localStorage.getItem('yoshikawaFavorites')
      const initialFavorites = savedFavorites ? JSON.parse(savedFavorites) : []
      setFavorites(initialFavorites)
    } catch (error) {
      console.error(error)
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
          overview: item.overview
        }
        newFavorites = [...prevFavorites, favoriteItem]
        showToast('Adicionado aos favoritos!', 'success')
      }
      try { localStorage.setItem('yoshikawaFavorites', JSON.stringify(newFavorites)) } catch (error) { console.error(error) }
      return newFavorites
    })
  }
  
  const handleSearchSubmit = () => {
    if (searchInputRef.current) {
      const query = searchInputRef.current.value.trim()
      if (query) { debouncedSearch(query) } else { setSearchResults([]); showToast('Digite algo para pesquisar', 'info') }
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') { handleSearchSubmit() }
  }

  const getActiveItems = () => {
    switch (activeSection) {
      case 'releases': return releases
      case 'recommendations': return recommendations
      case 'favorites': return favorites
      default: return releases
    }
  }
  
  const getActiveSectionDetails = () => {
    switch (activeSection) {
      case 'releases': return { title: 'Lançamentos' }
      case 'recommendations': return { title: 'Populares' }
      case 'favorites': return { title: 'Favoritos' }
      default: return { title: 'Conteúdo' }
    }
  }
  
  const { title: pageTitle } = getActiveSectionDetails()

  const ContentGrid = ({ items, isFavorite, toggleFavorite, extraClass = '' }) => (
    <div className={`content-grid ${extraClass}`}>
      {items.length > 0 ? (
        items.map(item => {
          const isFav = isFavorite(item)
          return (
            <Link key={getItemKey(item)} href={`/${item.media_type}/${item.id}`} className="content-card">
              <img 
                src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : DEFAULT_POSTER} 
                alt={item.title || item.name} className="content-poster" loading="lazy"
              />
              <button 
                className={`favorite-btn ${isFav ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(item) }}
                title={isFav ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
              >
                <i className={isFav ? 'fas fa-heart' : 'far fa-heart'}></i>
              </button>
            </Link>
          )
        })
      ) : (
        <div className="no-content" style={{padding: '2rem', textAlign: 'center', color: 'var(--secondary)', width: '100%', gridColumn: '1 / -1'}}>
          {activeSection === 'favorites' ? 'Nenhum favorito adicionado ainda.' : 'Nenhum conteúdo disponível.'}
        </div>
      )}
    </div>
  )

  const LiveSearchResults = () => {
    if (!searchActive) return null
    return (
      <div className="live-search-results">
        <h1 className="page-title-home">Resultados</h1>
        {loading && (
            <div className="live-search-loading"><i className="fas fa-spinner fa-spin"></i><span> Buscando...</span></div>
        )}
        {!loading && searchResults.length > 0 ? (
            <ContentGrid items={searchResults} isFavorite={isFavorite} toggleFavorite={toggleFavorite} extraClass="live-grid" />
        ) : (!loading && searchQuery.trim() !== '' && (
            <div className="no-results-live"><i className="fas fa-ghost"></i><p>Nenhum resultado encontrado para "{searchQuery}".</p></div>
        ))}
        {!loading && searchQuery.trim() === '' && (
            <div className="no-results-live"><p>Comece a digitar para pesquisar...</p></div>
        )}
      </div>
    )
  }

  const ToastContainer = () => (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type} show`}
          style={{ animation: 'toast-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
          <div className="toast-icon"><i className={`fas ${toast.type === 'success' ? 'fa-check' : toast.type === 'error' ? 'fa-exclamation-triangle' : 'fa-info'}`}></i></div>
          <div className="toast-content">{toast.message}</div>
          <button className="toast-close" onClick={() => removeToast(toast.id)}><i className="fas fa-times"></i></button>
        </div>
      ))}
    </div>
  )

  return (
    <>
      <Head>
        <title>Yoshikawa Player</title>
        <meta name="description" content="Yoshikawa Streaming Player" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>

      <Header />
      <ToastContainer />

      <main className="container">
        {loading && !searchActive && (
          <div className="loading active"><div className="spinner"></div><p>Carregando conteúdo...</p></div>
        )}
        {searchActive ? <LiveSearchResults /> : (
            <div className="home-sections">
                <h1 className="page-title-home">{pageTitle}</h1>
                <section className="section">
                    <ContentGrid items={getActiveItems()} isFavorite={isFavorite} toggleFavorite={toggleFavorite} extraClass="main-grid" />
                </section>
            </div>
        )}
      </main>

      <div className="bottom-nav-container">
        <div className={`main-nav-bar ${searchActive ? 'search-active' : ''}`}>
          {!searchActive ? (
            <>
              <button className={`nav-item ${activeSection === 'releases' ? 'active' : ''}`} onClick={() => setActiveSection('releases')}>
                <i className="fas fa-film"></i><span>Lançamentos</span>
              </button>
              <button className={`nav-item ${activeSection === 'recommendations' ? 'active' : ''}`} onClick={() => setActiveSection('recommendations')}>
                <i className="fas fa-fire"></i><span>Populares</span>
              </button>
              <button className={`nav-item ${activeSection === 'favorites' ? 'active' : ''}`} onClick={() => setActiveSection('favorites')}>
                <i className="fas fa-heart"></i><span>Favoritos</span>
              </button>
            </>
          ) : (
            <div className="search-input-container">
              <input ref={searchInputRef} type="text" className="search-input-expanded" placeholder="Pesquisar..." value={searchQuery} onChange={handleSearchChange} onKeyPress={handleKeyPress} />
            </div>
          )}
        </div>
        <button className={`search-circle ${searchActive ? 'active' : ''}`} onClick={() => setSearchActive(!searchActive)}>
          <i className={searchActive ? "fas fa-times" : "fas fa-search"}></i>
        </button>
      </div>

      <style jsx global>{`
        /* Reset manual para garantir cor de fundo do corpo */
        :root {
            --glass-bg: rgba(20, 20, 20, 0.4);
            --glass-border: rgba(255, 255, 255, 0.15);
        }

        body {
          background-color: #000000 !important;
          color: #f1f5f9;
          font-family: 'Inter', sans-serif;
          margin: 0;
        }

        /* FORÇANDO ESTILOS DO HEADER 
           Uso de !important para sobrepor qualquer CSS externo
        */
        .header-content {
          background: var(--glass-bg) !important;
          backdrop-filter: blur(40px) !important;
          -webkit-backdrop-filter: blur(40px) !important;
          border: 2px solid var(--glass-border) !important;
          border-radius: 9999px !important;
          padding: 0.5rem 1.5rem !important;
          display: flex !important;
          align-items: center !important;
          gap: 1rem !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
        }

        /* Forçando estilos da barra de navegação inferior */
        .main-nav-bar {
          background: var(--glass-bg) !important;
          backdrop-filter: blur(40px) !important;
          -webkit-backdrop-filter: blur(40px) !important;
          border: 2px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 9999px !important; /* Pílula total */
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
        }

        .search-circle {
          background: var(--glass-bg) !important;
          backdrop-filter: blur(40px) !important;
          -webkit-backdrop-filter: blur(40px) !important;
          border: 2px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 50% !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
        }

        /* Resto dos estilos (mantidos organizados) */
        .github-header {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999; /* Z-Index altíssimo */
          width: auto;
          max-width: 90%;
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
        }

        .logo-image {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          object-fit: cover;
        }

        .logo-name {
          font-size: 1.1rem;
          font-weight: 700;
          color: white;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }

        .header-plus-btn {
          background: none;
          border: none;
          color: white;
          font-size: 1.2rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0;
          opacity: 0.8;
          transition: opacity 0.2s;
        }
        
        .header-plus-btn:hover { opacity: 1; }

        .container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 6rem 1.5rem 8rem;
          min-height: 100vh;
        }

        .content-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 1rem;
        }

        .content-card {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          background: #1a1a1a;
          aspect-ratio: 2/3;
          transition: transform 0.2s;
        }
        
        .content-card:hover { transform: scale(1.03); z-index: 2; }

        .content-poster {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .favorite-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          color: white;
          display: grid;
          place-items: center;
          cursor: pointer;
        }
        
        .favorite-btn.active { color: #ff4757; background: rgba(255, 255, 255, 0.1); }

        .bottom-nav-container {
          position: fixed;
          bottom: 25px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          max-width: 500px;
          width: 90%;
          gap: 15px;
          z-index: 9999;
        }

        .main-nav-bar {
          display: flex;
          justify-content: space-around;
          align-items: center;
          height: 65px;
          flex-grow: 1;
          padding: 0 10px;
          transition: all 0.3s ease;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          color: #94a3b8;
          background: none;
          border: none;
          cursor: pointer;
        }

        .nav-item i { font-size: 22px; margin-bottom: 2px; transition: 0.2s; }
        .nav-item.active i { color: #ff6b6b; transform: translateY(-2px); }
        .nav-item span { font-size: 10px; font-weight: 500; }

        .search-circle {
          width: 65px;
          height: 65px;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-shrink: 0;
          cursor: pointer;
          color: white;
        }
        
        .search-circle i { font-size: 24px; }
        
        .search-input-container { flex: 1; padding: 0 15px; }
        .search-input-expanded {
          width: 100%;
          background: transparent;
          border: none;
          color: white;
          font-size: 16px;
          outline: none;
        }

        .toast-container {
          position: fixed;
          bottom: 110px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10000;
          width: 90%;
          max-width: 400px;
          pointer-events: none; /* Permite clicar através do container vazio */
        }
        
        .toast {
          background: rgba(20, 20, 20, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          padding: 12px 16px;
          border-radius: 12px;
          margin-top: 10px;
          display: flex;
          align-items: center;
          gap: 12px;
          pointer-events: auto; /* Reativa cliques no toast */
        }

        .loading, .live-search-loading {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            padding: 2rem;
            color: #94a3b8;
        }
        
        .spinner {
            border: 3px solid rgba(255,255,255,0.1);
            border-top: 3px solid #ff6b6b;
            border-radius: 50%;
            width: 30px; height: 30px;
            animation: spin 1s linear infinite;
            margin-bottom: 10px;
        }
        
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        
        @media (max-width: 768px) {
            .content-grid { grid-template-columns: repeat(2, 1fr); }
            .header-content { padding: 0.4rem 1rem !important; }
        }
      `}</style>
    </>
  )
}

const Header = () => {
  return (
    <header className="github-header">
      <div className="header-content">
        <Link href="/" className="logo-container">
          <img 
            src="https://yoshikawa-bot.github.io/cache/images/14c34900.jpg" 
            alt="Yoshikawa Bot" 
            className="logo-image"
          />
          <div className="logo-text">
            <span className="logo-name">Yoshikawa</span>
          </div>
        </Link>
        <button className="header-plus-btn" title="Adicionar">
          <i className="fas fa-plus"></i>
        </button>
      </div>
    </header>
  )
}
