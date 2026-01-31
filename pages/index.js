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
    setTimeout(() => removeToast(id), 3000)
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
      console.error('Erro na busca:', error)
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
      ]
        .filter(item => item.poster_path)
        .sort((a, b) => new Date(b.release_date || b.first_air_date) - new Date(a.release_date || a.first_air_date))
        .slice(0, 15)

      const allPopular = [
        ...(popularMoviesData.results || []).map(item => ({...item, media_type: 'movie'})),
        ...(popularTvData.results || []).map(item => ({...item, media_type: 'tv'}))
      ]
        .filter(item => item.poster_path)
        .sort(() => 0.5 - Math.random())
        .slice(0, 15)

      setReleases(allReleases)
      setRecommendations(allPopular)

    } catch (error) {
      console.error('Erro ao carregar conteúdo:', error)
    }
  }

  const loadFavorites = () => {
    try {
      const savedFavorites = localStorage.getItem('yoshikawaFavorites')
      const initialFavorites = savedFavorites ? JSON.parse(savedFavorites) : []
      setFavorites(initialFavorites)
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error)
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
      
      try {
        localStorage.setItem('yoshikawaFavorites', JSON.stringify(newFavorites))
      } catch (error) {
        console.error('Erro ao salvar favoritos:', error)
        showToast('Erro ao salvar favoritos', 'error')
      }

      return newFavorites
    })
  }
  
  const handleSearchSubmit = () => {
    if (searchInputRef.current) {
      const query = searchInputRef.current.value.trim()
      if (query) {
        debouncedSearch(query)
      } else {
        setSearchResults([])
        showToast('Digite algo para pesquisar', 'info')
      }
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit()
    }
  }

  const getActiveItems = () => {
    switch (activeSection) {
      case 'releases':
        return releases
      case 'recommendations':
        return recommendations
      case 'favorites':
        return favorites
      default:
        return releases
    }
  }
  
  const getActiveSectionDetails = () => {
    switch (activeSection) {
      case 'releases':
        return { title: 'Lançamentos', icon: 'fas fa-film' }
      case 'recommendations':
        return { title: 'Populares', icon: 'fas fa-fire' }
      case 'favorites':
        return { title: 'Favoritos', icon: 'fas fa-heart' }
      default:
        return { title: 'Conteúdo', icon: 'fas fa-tv' }
    }
  }
  
  const { title: pageTitle, icon: pageIcon } = getActiveSectionDetails()

  const ContentGrid = ({ items, isFavorite, toggleFavorite, extraClass = '' }) => (
    <div className={`content-grid ${extraClass}`}>
      {items.length > 0 ? (
        items.map(item => {
          const isFav = isFavorite(item)
          return (
            <Link 
              key={getItemKey(item)}
              href={`/${item.media_type}/${item.id}`}
              className="content-card"
            >
              <div className="card-glass-container">
                <img 
                  src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : DEFAULT_POSTER} 
                  alt={item.title || item.name}
                  className="content-poster"
                  loading="lazy"
                />
                
                <button 
                  className={`favorite-btn ${isFav ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault() 
                    e.stopPropagation() 
                    toggleFavorite(item)
                  }}
                  title={isFav ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
                >
                  <i className={isFav ? 'fas fa-heart' : 'far fa-heart'}></i>
                </button>
              </div>
            </Link>
          )
        })
      ) : (
        <div className="no-content">
          {activeSection === 'favorites' ? 'Nenhum favorito adicionado ainda.' : 'Nenhum conteúdo disponível.'}
        </div>
      )}
    </div>
  )

  const LiveSearchResults = () => {
    if (!searchActive) return null
    
    return (
      <div className="live-search-results">
        <h1 className="page-title-home">
          <i className="fas fa-search"></i>
          Resultados
        </h1>

        {loading && (
            <div className="live-search-loading">
                <i className="fas fa-spinner fa-spin"></i>
                <span>Buscando...</span>
            </div>
        )}
        
        {!loading && searchResults.length > 0 ? (
            <ContentGrid 
                items={searchResults}
                isFavorite={isFavorite}
                toggleFavorite={toggleFavorite}
                extraClass="live-grid"
            />
        ) : (!loading && searchQuery.trim() !== '' && (
            <div className="no-results-live">
                <i className="fas fa-ghost"></i>
                <p>Nenhum resultado encontrado para "{searchQuery}".</p>
            </div>
        ))}
        
        {!loading && searchQuery.trim() === '' && (
            <div className="no-results-live">
                <p>Comece a digitar para pesquisar...</p>
            </div>
        )}
      </div>
    )
  }

  const ToastContainer = () => (
    <div className="toast-container">
      {toasts.map(toast => (
        <div 
          key={toast.id} 
          className={`toast toast-${toast.type} show`}
        >
          <div className="toast-icon">
            <i className={`fas ${
              toast.type === 'success' ? 'fa-check' : 
              toast.type === 'error' ? 'fa-exclamation-triangle' : 
              'fa-info'
            }`}></i>
          </div>
          <div className="toast-content">{toast.message}</div>
          <button 
            className="toast-close"
            onClick={() => removeToast(toast.id)}
          >
            <i className="fas fa-times"></i>
          </button>
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>

      <Header />
      
      <ToastContainer />

      <main className="container">
        
        {loading && !searchActive && (
          <div className="loading active">
            <div className="spinner"></div>
            <p>Carregando conteúdo...</p>
          </div>
        )}

        {searchActive ? (
            <LiveSearchResults />
        ) : (
            <div className="home-sections">
                <h1 className="page-title-home">
                  <i className={pageIcon}></i>
                  {pageTitle}
                </h1>
                <section className="section">
                    <ContentGrid 
                        items={getActiveItems()} 
                        isFavorite={isFavorite} 
                        toggleFavorite={toggleFavorite}
                        extraClass="main-grid"
                    />
                </section>
            </div>
        )}
      </main>

      <div className="bottom-nav-container">
        <div className={`main-nav-bar ${searchActive ? 'search-active' : ''}`}>
          {!searchActive ? (
            <>
              <button 
                className={`nav-item ${activeSection === 'releases' ? 'active' : ''}`}
                onClick={() => setActiveSection('releases')}
              >
                <i className="fas fa-film"></i>
                <span>Lançamentos</span>
              </button>
              <button 
                className={`nav-item ${activeSection === 'recommendations' ? 'active' : ''}`}
                onClick={() => setActiveSection('recommendations')}
              >
                <i className="fas fa-fire"></i>
                <span>Populares</span>
              </button>
              <button 
                className={`nav-item ${activeSection === 'favorites' ? 'active' : ''}`}
                onClick={() => setActiveSection('favorites')}
              >
                <i className="fas fa-heart"></i>
                <span>Favoritos</span>
              </button>
            </>
          ) : (
            <div className="search-input-container">
              <input 
                ref={searchInputRef}
                type="text"
                className="search-input-expanded" 
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyPress={handleKeyPress}
              />
            </div>
          )}
        </div>
        
        <button 
          className={`search-circle ${searchActive ? 'active' : ''}`}
          onClick={() => setSearchActive(!searchActive)}
        >
          <i className={searchActive ? "fas fa-times" : "fas fa-search"}></i>
        </button>
      </div>

      <style jsx global>{`
        :root {
          --primary: #007AFF;
          --primary-hover: #0051D5;
          --secondary: #8E8E93;
          --accent: #FF9F0A;
          
          --bg-primary: #000000;
          --bg-secondary: #1C1C1E;
          --text-primary: #FFFFFF;
          --text-secondary: #AEAEB2;
          
          --glass-bg: rgba(28, 28, 30, 0.72);
          --glass-border: rgba(255, 255, 255, 0.12);
          --glass-highlight: rgba(255, 255, 255, 0.08);
          
          --success: #34C759;
          --error: #FF3B30;
          
          --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
          --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
          --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
          --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.6);
          
          --radius-sm: 10px;
          --radius-md: 16px;
          --radius-lg: 20px;
          --radius-xl: 28px;
          
          --transition-fast: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          --transition-base: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          --transition-slow: 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          --transition-spring: 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', sans-serif;
          background: linear-gradient(180deg, #000000 0%, #0A0A0A 100%);
          color: var(--text-primary);
          line-height: 1.5;
          font-size: 16px;
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* LIQUID GLASS HEADER */
        .github-header {
          position: sticky;
          top: 0;
          z-index: 100;
          padding: 12px 0;
          border-bottom: 0.5px solid var(--glass-border);
        }

        .github-header::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(28, 28, 30, 0.8) 0%,
            rgba(28, 28, 30, 0.6) 100%
          );
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          z-index: -1;
        }

        .github-header::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.05) 0%,
            rgba(255, 255, 255, 0) 50%
          );
          pointer-events: none;
          z-index: -1;
        }

        .header-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          align-items: center;
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          transition: transform var(--transition-base);
        }

        .logo-container:active {
          transform: scale(0.96);
        }

        .logo-image {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          object-fit: cover;
          box-shadow: var(--shadow-sm);
        }

        .logo-text {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .logo-name {
          font-size: 17px;
          font-weight: 600;
          letter-spacing: -0.4px;
          color: var(--text-primary);
        }

        .beta-tag {
          background: linear-gradient(135deg, var(--primary), #0051D5);
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 20px;
          min-height: calc(100vh - 80px);
          padding-bottom: 140px;
        }

        .page-title-home {
          font-size: 32px;
          font-weight: 700;
          letter-spacing: -0.8px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--text-primary);
        }

        .page-title-home i {
          color: var(--primary);
        }

        /* CARDS COM LIQUID GLASS */
        .content-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 16px;
          width: 100%;
        }

        .content-card {
          position: relative;
          text-decoration: none;
          color: inherit;
          display: block;
          transition: transform var(--transition-base);
          cursor: pointer;
        }

        .content-card:active {
          transform: scale(0.96);
        }

        .card-glass-container {
          position: relative;
          border-radius: var(--radius-md);
          overflow: hidden;
          aspect-ratio: 2/3;
          background: var(--bg-secondary);
          box-shadow: var(--shadow-md);
          transition: all var(--transition-base);
        }

        .content-card:hover .card-glass-container {
          transform: translateY(-4px);
          box-shadow: var(--shadow-xl);
        }

        .card-glass-container::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.08) 0%,
            rgba(255, 255, 255, 0) 50%
          );
          opacity: 0;
          transition: opacity var(--transition-base);
          z-index: 2;
          pointer-events: none;
        }

        .content-card:hover .card-glass-container::before {
          opacity: 1;
        }

        .content-poster {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform var(--transition-slow);
        }

        .content-card:hover .content-poster {
          transform: scale(1.05);
        }

        /* FAVORITE BUTTON COM GLASS */
        .favorite-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 50%;
          background: rgba(28, 28, 30, 0.6);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 0.5px solid rgba(255, 255, 255, 0.1);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          transition: all var(--transition-base);
          box-shadow: var(--shadow-sm);
        }

        .favorite-btn:hover {
          transform: scale(1.1);
          background: rgba(28, 28, 30, 0.8);
        }

        .favorite-btn:active {
          transform: scale(0.95);
        }

        .favorite-btn.active {
          background: linear-gradient(135deg, #FF3B30, #FF6B6B);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .favorite-btn i {
          font-size: 16px;
        }

        .favorite-btn.active i {
          animation: heartPop var(--transition-spring);
        }

        @keyframes heartPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }

        /* BOTTOM NAV COM LIQUID GLASS */
        .bottom-nav-container {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 1000;
          max-width: 600px;
          width: calc(100% - 40px);
        }

        .main-nav-bar {
          flex: 1;
          height: 68px;
          border-radius: var(--radius-xl);
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 0 12px;
          position: relative;
          overflow: hidden;
          border: 0.5px solid var(--glass-border);
          box-shadow: var(--shadow-lg);
          transition: all var(--transition-base);
        }

        .main-nav-bar::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(28, 28, 30, 0.7);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          z-index: -1;
        }

        .main-nav-bar::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.08) 0%,
            rgba(255, 255, 255, 0) 50%
          );
          pointer-events: none;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          height: 100%;
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-base);
          position: relative;
        }

        .nav-item i {
          font-size: 22px;
          transition: all var(--transition-spring);
        }

        .nav-item:active {
          transform: scale(0.92);
        }

        .nav-item.active i {
          color: var(--primary);
          transform: translateY(-2px);
        }

        .nav-item::before {
          content: '';
          position: absolute;
          width: 4px;
          height: 4px;
          background: var(--primary);
          border-radius: 50%;
          bottom: 8px;
          opacity: 0;
          transform: scale(0);
          transition: all var(--transition-spring);
        }

        .nav-item.active::before {
          opacity: 1;
          transform: scale(1);
        }

        /* SEARCH CIRCLE */
        .search-circle {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          border: 0.5px solid var(--glass-border);
          background: transparent;
          color: var(--text-primary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-lg);
          transition: all var(--transition-base);
          flex-shrink: 0;
          position: relative;
        }

        .search-circle::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(28, 28, 30, 0.7);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border-radius: 50%;
          z-index: -1;
        }

        .search-circle::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.08) 0%,
            rgba(255, 255, 255, 0) 50%
          );
          border-radius: 50%;
          pointer-events: none;
        }

        .search-circle:active {
          transform: scale(0.92);
        }

        .search-circle.active {
          background: var(--primary);
        }

        .search-circle.active::before {
          background: var(--primary);
          backdrop-filter: none;
        }

        .search-circle i {
          font-size: 24px;
          z-index: 1;
        }

        /* SEARCH INPUT */
        .main-nav-bar.search-active {
          justify-content: flex-start;
          padding: 0 20px;
        }

        .main-nav-bar.search-active .nav-item {
          opacity: 0;
          transform: scale(0.8);
          pointer-events: none;
          flex: 0;
          width: 0;
        }

        .search-input-container {
          flex: 1;
          display: flex;
          align-items: center;
          height: 100%;
        }

        .search-input-expanded {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 17px;
          font-weight: 500;
          letter-spacing: -0.4px;
        }

        .search-input-expanded::placeholder {
          color: var(--text-secondary);
        }

        /* TOAST COM GLASS */
        .toast-container {
          position: fixed;
          bottom: 120px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          max-width: 400px;
          width: calc(100% - 40px);
        }

        .toast {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          border-radius: var(--radius-md);
          border: 0.5px solid var(--glass-border);
          box-shadow: var(--shadow-lg);
          animation: toastSlide var(--transition-spring);
        }

        .toast::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(28, 28, 30, 0.85);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border-radius: var(--radius-md);
          z-index: -1;
        }

        @keyframes toastSlide {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .toast-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .toast-success .toast-icon {
          background: var(--success);
        }

        .toast-info .toast-icon {
          background: var(--primary);
        }

        .toast-icon i {
          font-size: 14px;
          color: white;
        }

        .toast-content {
          flex: 1;
          font-size: 15px;
          font-weight: 500;
          letter-spacing: -0.3px;
        }

        .toast-close {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all var(--transition-fast);
        }

        .toast-close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
        }

        .toast-close:active {
          transform: scale(0.9);
        }

        /* LOADING */
        .loading {
          display: none;
          justify-content: center;
          align-items: center;
          padding: 60px;
          flex-direction: column;
          gap: 16px;
        }

        .loading.active {
          display: flex;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading p {
          color: var(--text-secondary);
          font-size: 15px;
          font-weight: 500;
        }

        /* SEARCH RESULTS */
        .live-search-results {
          width: 100%;
        }

        .live-search-loading,
        .no-results-live {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
          gap: 16px;
          color: var(--text-secondary);
        }

        .live-search-loading i,
        .no-results-live i {
          font-size: 48px;
          opacity: 0.5;
        }

        .no-content {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 20px;
          color: var(--text-secondary);
          font-size: 15px;
        }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .content-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .page-title-home {
            font-size: 28px;
          }

          .bottom-nav-container {
            bottom: 16px;
            width: calc(100% - 32px);
          }

          .main-nav-bar {
            height: 60px;
          }

          .search-circle {
            width: 60px;
            height: 60px;
          }

          .nav-item i {
            font-size: 20px;
          }

          .search-circle i {
            font-size: 22px;
          }
        }

        @media (max-width: 480px) {
          .container {
            padding: 16px;
          }

          .page-title-home {
            font-size: 24px;
            margin-bottom: 20px;
          }

          .content-grid {
            gap: 10px;
          }

          .main-nav-bar {
            height: 56px;
          }

          .search-circle {
            width: 56px;
            height: 56px;
          }
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
            <span className="beta-tag">Streaming</span>
          </div>
        </Link>
      </div>
    </header>
  )
}
