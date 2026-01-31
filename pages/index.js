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
        return { title: 'Lançamentos' }
      case 'recommendations':
        return { title: 'Populares' }
      case 'favorites':
        return { title: 'Favoritos' }
      default:
        return { title: 'Conteúdo' }
    }
  }
  
  const { title: pageTitle } = getActiveSectionDetails()

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
            <div className="live-search-loading">
                <i className="fas fa-spinner fa-spin"></i>
                <span> Buscando...</span>
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
          style={{ animation: 'toast-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
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
                <h1 className="page-title-home">{pageTitle}</h1>
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
          --primary: #ff6b6b;
          --primary-dark: #e05555;
          --secondary: #94a3b8;
          --accent: #4dabf7;
          --accent-dark: #339af0;
          
          --dark: #f1f5f9;
          --light: #0f172a;
          --border: rgba(255, 255, 255, 0.15);
          --card-bg: rgba(30, 30, 30, 0.95);
          --text: #f1f5f9;
          --bg: transparent;
          --header-bg: rgba(20, 20, 20, 0.95);
          --header-border: rgba(255, 255, 255, 0.15);
          --header-text: #f0f6fc;
          --success: #10b981;
          --error: #ef4444;
          --overlay-bg: rgba(0, 0, 0, 0.5);
          --highlight: rgba(255, 255, 255, 0.15);
          
          --popup-bg: rgba(40, 40, 40, 0.95);
          --popup-border: rgba(255, 255, 255, 0.3);
          --option-bg: rgba(0, 0, 0, 0.3);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', Arial, sans-serif;
          background: #000000;
          color: var(--text);
          line-height: 1.6;
          font-size: 16px;
          min-height: 100vh;
          position: relative;
          overflow-y: auto;
        }

        .github-header {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100;
          width: auto;
          max-width: 90%;
        }

        .header-content {
          background: rgba(20, 20, 20, 0.4);
          backdrop-filter: blur(60px);
          -webkit-backdrop-filter: blur(60px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 40px;
          height: 70px;
          padding: 0 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-shrink: 0;
          text-decoration: none;
        }

        .logo-image {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .logo-text {
          display: flex;
          align-items: center;
          gap: 0;
        }

        .logo-name {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--header-text);
        }

        .beta-tag {
          display: none;
        }

        .header-plus-btn {
          background: none;
          border: none;
          color: var(--text);
          font-size: 1.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: transform 0.2s;
        }

        .header-plus-btn:hover {
          transform: scale(1.1);
        }

        .header-right {
          display: none;
        }

        .container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 5rem 1.5rem 1.5rem;
          min-height: calc(100vh - 80px);
        }

        .home-sections {
          display: block;
          width: 100%;
          max-width: 1280px;
          margin: auto;
          padding-bottom: 7rem;
        }

        .section {
          margin-bottom: 2rem;
        }

        .page-title-home {
            font-size: 1.6rem;
            font-weight: 700;
            color: var(--text);
            margin-bottom: 1.5rem;
            padding-top: 1rem;
        }

        .content-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 1.5rem;
          width: 100%;
        }

        .content-card {
          background-color: rgba(30, 30, 30, 1);
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.3s ease;
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.15);
          position: relative;
          text-decoration: none;
          color: inherit;
          aspect-ratio: 2/3;
        }

        .content-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
        }

        .content-poster {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          border-radius: 20px;
        }

        .favorite-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(20, 20, 20, 0.4);
          backdrop-filter: blur(60px);
          -webkit-backdrop-filter: blur(60px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 50%;
          width: 32px;
          height: 32px;
          color: white;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: all 0.3s ease;
          z-index: 10;
        }

        .favorite-btn:hover {
          background: rgba(255, 107, 107, 0.4);
          backdrop-filter: blur(60px);
          -webkit-backdrop-filter: blur(60px);
          transform: scale(1.1);
        }

        .favorite-btn.active {
          background: rgba(255, 107, 107, 0.6);
          backdrop-filter: blur(60px);
          -webkit-backdrop-filter: blur(60px);
          color: white;
        }

        .favorite-btn.active i {
          animation: heart-pop 0.5s;
        }

        @keyframes heart-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }

        .bottom-nav-container {
          position: fixed;
          bottom: 25px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          max-width: 600px;
          width: 90%;
          gap: 15px;
          z-index: 1000;
        }

        .main-nav-bar {
          background: rgba(20, 20, 20, 0.4);
          backdrop-filter: blur(60px);
          -webkit-backdrop-filter: blur(60px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 40px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: space-around;
          align-items: center;
          height: 70px;
          flex-grow: 1;
          padding: 0 10px;
          position: relative;
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .main-nav-bar.search-active {
          justify-content: flex-start;
          padding: 0;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          color: var(--secondary);
          font-size: 12px;
          font-weight: 500;
          padding: 5px 0;
          transition: all 0.3s ease;
          cursor: pointer;
          border: none;
          background: none;
          position: relative;
          height: 100%;
          justify-content: center;
          opacity: 1;
          transform: scale(1);
          text-decoration: none;
        }

        .main-nav-bar.search-active .nav-item {
          opacity: 0;
          transform: scale(0.8);
          pointer-events: none;
          flex: 0;
          width: 0;
          min-width: 0;
        }

        .nav-item span {
          display: none;
        }

        .nav-item i {
          font-size: 26px;
          margin-bottom: 0;
          transition: color 0.3s ease, transform 0.3s ease;
          color: var(--text);
        }

        .nav-item:hover i {
            transform: scale(1.1);
            color: var(--primary);
        }

        .nav-item:active i {
          transform: scale(0.95);
        }

        .nav-item.active i {
          color: var(--primary);
          transform: none;
        }

        .search-circle {
          background: rgba(20, 20, 20, 0.4);
          backdrop-filter: blur(60px);
          -webkit-backdrop-filter: blur(60px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 50%;
          width: 70px;
          height: 70px;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
          flex-shrink: 0;
          cursor: pointer;
          color: var(--text);
          transition: none;
          position: relative;
          opacity: 1;
          z-index: 1;
        }

        .search-circle i {
          font-size: 32px;
          z-index: 1;
        }

        .search-input-container {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
          height: 100%;
          padding: 0 15px;
        }

        .search-input-expanded {
          background: transparent;
          border: none;
          color: var(--text);
          font-size: 16px;
          width: 100%;
          padding: 0;
          outline: none;
          font-family: 'Inter', sans-serif;
        }

        .search-input-expanded::placeholder {
          color: var(--text);
          opacity: 0.7;
        }

        .loading {
          display: none;
          justify-content: center;
          align-items: center;
          padding: 3rem;
          color: var(--secondary);
          flex-direction: column;
        }

        .loading.active {
          display: flex;
        }

        .spinner {
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-top: 3px solid var(--primary);
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .toast-container {
          position: fixed;
          bottom: 120px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 400px;
          width: 90%;
        }

        .toast {
          background: rgba(20, 20, 20, 0.4);
          backdrop-filter: blur(60px);
          -webkit-backdrop-filter: blur(60px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 12px 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          gap: 12px;
          transform: translateY(100px);
          opacity: 0;
          transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          max-width: 400px;
        }

        .toast.show {
          transform: translateY(0);
          opacity: 1;
        }

        .toast-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 14px;
        }

        .toast-success .toast-icon {
          background: var(--success);
          color: white;
        }

        .toast-info .toast-icon {
          background: var(--accent);
          color: white;
        }

        .toast-content {
          flex: 1;
          font-size: 14px;
          line-height: 1.4;
          color: var(--text);
        }

        .toast-close {
          background: none;
          border: none;
          color: var(--secondary);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .toast-close:hover {
          color: var(--text);
          background: rgba(255, 255, 255, 0.1);
        }

        .toast-close:active {
          transform: scale(0.95);
        }

        .live-search-results {
            position: static;
            width: 100%;
            height: auto;
            background-color: transparent;
            padding: 0;
            margin-bottom: 20px;
        }
        
        .live-search-loading, .no-results-live {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 50vh;
            color: var(--secondary);
            font-size: 1rem;
            flex-direction: column;
            text-align: center;
            width: 100%;
        }
        
        .live-search-loading i, .no-results-live i {
            margin-bottom: 10px;
            font-size: 2rem;
        }

        @media (max-width: 768px) {
          .github-header {
            top: 15px;
            max-width: 95%;
          }

          .header-content {
            height: 65px;
            padding: 0 20px;
            border-radius: 35px;
          }

          .logo-image {
            width: 26px;
            height: 26px;
          }

          .logo-name {
            font-size: 1rem;
          }

          .header-plus-btn {
            font-size: 1.3rem;
          }

          .container {
            padding: 4.5rem 1rem 1rem;
          }

          .bottom-nav-container {
            bottom: 20px;
            max-width: 95%;
            width: 95%;
            gap: 10px;
          }
          
          .main-nav-bar {
            height: 65px;
            border-radius: 35px;
            border: 1px solid rgba(255, 255, 255, 0.15);
          }
          
          .nav-item i {
            font-size: 24px;
          }
          
          .search-circle {
            width: 65px;
            height: 65px;
            border: 1px solid rgba(255, 255, 255, 0.15);
          }
          
          .search-circle i {
            font-size: 28px;
          }

          .content-grid {
              grid-template-columns: repeat(2, 1fr) !important;
          }

          .toast-container {
            bottom: 110px;
            max-width: 350px;
          }
          
          .toast {
            max-width: 350px;
            padding: 10px 14px;
          }
          
          .toast-content {
            font-size: 13px;
          }
        }

        @media (max-width: 480px) {
          .header-content {
            height: 60px;
            padding: 0 15px;
            border-radius: 35px;
          }

          .logo-image {
            width: 24px;
            height: 24px;
          }

          .logo-name {
            font-size: 0.95rem;
          }

          .header-plus-btn {
            font-size: 1.2rem;
          }

          .bottom-nav-container {
            gap: 8px;
          }
          
          .main-nav-bar {
            height: 60px;
            padding: 0 8px;
          }
          
          .nav-item i {
            font-size: 22px;
          }
          
          .search-circle {
            width: 60px;
            height: 60px;
          }
          
          .search-circle i {
            font-size: 26px;
          }

          .toast-container {
            bottom: 100px;
            max-width: 300px;
          }
          
          .toast {
            max-width: 300px;
            padding: 8px 12px;
          }
          
          .toast-content {
            font-size: 12px;
          }
          
          .toast-icon {
            width: 20px;
            height: 20px;
            font-size: 12px;
          }
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        button {
          font-family: inherit;
        }

        img {
          max-width: 100%;
          height: auto;
        }

        @keyframes toast-slide-up {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
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
