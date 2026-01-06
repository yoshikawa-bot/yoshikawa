import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'

// Define a função debounce para limitar chamadas de API
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

  // Sistema de Toast Notifications (Modificado para não acumular)
  const showToast = (message, type = 'info') => {
    const id = Date.now()
    const toast = { id, message, type }
    
    // Substitui o array anterior pelo novo toast, garantindo apenas um por vez
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
  
  // Função central de busca
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

  // --- Funções de Carregamento de Conteúdo ---
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

  // --- Componentes ---

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

              <div className="floating-text-wrapper">
                <div className="content-title-card">{item.title || item.name}</div>
                <div className="content-year">
                  {item.release_date ? new Date(item.release_date).getFullYear() : 
                   item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A'}
                </div>
              </div>
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
        <h1 className="page-title-home"><i className="fas fa-search" style={{marginRight: '8px'}}></i>Resultados</h1>

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

        {/* Lógica de Renderização Condicional - Página Inteira */}
        {searchActive ? (
            <LiveSearchResults />
        ) : (
            <div className="home-sections">
                <h1 className="page-title-home"><i className={pageIcon} style={{marginRight: '8px'}}></i>{pageTitle}</h1>
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
              {/* Botão de fechar removido daqui */}
            </div>
          )}
        </div>
        
        {/* Botão circular que vira X quando ativo */}
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
          --card-bg: rgba(0, 0, 0, 0.25);
          --text: #f1f5f9;
          --bg: transparent;
          --header-bg: rgba(0, 0, 0, 0.25);
          --header-border: rgba(255, 255, 255, 0.15);
          --header-text: #f0f6fc;
          --success: #10b981;
          --error: #ef4444;
          --overlay-bg: rgba(0, 0, 0, 0.5);
          --highlight: rgba(255, 255, 255, 0.15);
          
          --popup-bg: rgba(255, 255, 255, 0.1);
          --popup-border: rgba(255, 255, 255, 0.3);
          --option-bg: rgba(0, 0, 0, 0.15);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', Arial, sans-serif;
          background: url('https://yoshikawa-bot.github.io/cache/images/2926e9b3.jpg') no-repeat center/cover fixed;
          color: var(--text);
          line-height: 1.6;
          font-size: 16px;
          min-height: 100vh;
          position: relative;
          overflow-y: auto;
        }

        body::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          min-height: 100vh;
          height: auto;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: -1;
        }

        .github-header {
          background-color: transparent;
          border-bottom: 1px solid var(--header-border);
          padding: 0.75rem 0;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .github-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          backdrop-filter: blur(10px);
          filter: saturate(120%) brightness(1.15);
          z-index: -1;
        }

        .github-header::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: var(--header-bg);
          z-index: -1;
        }

        .header-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          position: relative;
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-shrink: 0;
          cursor: pointer;
          text-decoration: none;
        }

        .logo-image {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          object-fit: cover;
          flex-shrink: 0;
          transition: all 0.3s;
        }

        .logo-image:hover {
          transform: scale(1.05);
        }

        .logo-text {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .logo-name {
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--header-text);
        }

        .beta-tag {
          background: var(--primary);
          color: white;
          font-size: 0.7rem;
          padding: 0.2rem 0.5rem;
          border-radius: 12px;
          font-weight: 500;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 1.5rem;
          min-height: calc(100vh - 80px);
        }

        .home-sections {
          display: block;
          width: 100%;
          max-width: 1280px;
          margin: auto;
          padding-bottom: 7rem;
        }

        .home-sections.hidden {
          display: none;
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

        .section-header {
          display: flex;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border);
        }

        .section-title {
          font-size: 1.4rem;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .section-title i {
          color: var(--primary);
          font-size: 1.2rem;
        }

        .content-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 1.5rem;
          width: 100%;
        }

        .content-row {
          display: flex;
          overflow-x: auto;
          gap: 1rem;
          padding: 0.5rem 0;
          scrollbar-width: thin;
          scrollbar-color: var(--primary) transparent;
        }

        .content-row::-webkit-scrollbar {
          height: 6px;
        }

        .content-row::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          margin: 0 10px;
        }

        .content-row::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, var(--primary), var(--accent));
          border-radius: 10px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .content-row::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, var(--primary-dark), var(--accent-dark));
        }

        .content-row {
          scrollbar-width: thin;
          scrollbar-color: var(--primary) transparent;
        }

        .content-card {
          background-color: var(--card-bg);
          border-radius: 15px;
          overflow: hidden;
          transition: all 0.3s ease;
          cursor: pointer;
          border: 1px solid var(--border);
          position: relative;
          text-decoration: none;
          color: inherit;
          backdrop-filter: blur(10px);
          aspect-ratio: 2/3;
        }

        .content-card:hover {
          transform: translateY(-5px);
          border-color: var(--primary);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
        }

        .content-poster {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .content-info-card {
          padding: 0;
          background: transparent;
          position: static;
          color: inherit;
          backdrop-filter: none;
          border: none;
          height: 0;
        }

        .content-title-card {
          font-weight: 500;
          font-size: 0.9rem;
        }

        .content-year {
          font-size: 0.8rem;
          color: var(--secondary);
        }

        .floating-text-wrapper {
            position: absolute;
            bottom: 10px;
            left: 10px;
            right: 10px;
            z-index: 5;
            color: white;
            line-height: 1.2;
            font-size: 0.95rem;
        }

        .floating-text-wrapper .content-title-card {
            display: block;
            padding: 4px 7px;
            background-color: rgba(0, 0, 0, 0.85);
            box-decoration-break: clone;
            -webkit-box-decoration-break: clone;
            font-weight: 600;
            font-size: 1rem;
            white-space: normal;
            width: fit-content;
            border-radius: 4px;
            text-shadow: none;
        }

        .floating-text-wrapper .content-year {
            display: block;
            padding: 4px 7px;
            background-color: rgba(0, 0, 0, 0.85);
            box-decoration-break: clone;
            -webkit-box-decoration-break: clone;
            font-size: 0.85rem;
            color: white;
            opacity: 0.9;
            font-weight: 500;
            margin-top: 3px;
            width: fit-content;
            border-radius: 4px;
            text-shadow: none;
        }

        .content-text-meta {
            display: none;
        }

        .content-rating {
            display: flex;
            align-items: center;
            gap: 0.2rem;
            color: gold;
            font-weight: 500;
        }

        .content-rating i {
            font-size: 0.8rem;
            color: gold;
        }

        .favorite-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.7);
          border: none;
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
          backdrop-filter: blur(5px);
        }

        .favorite-btn:not(#headerFavoriteBtn):hover {
          background: rgba(255, 107, 107, 0.9);
          transform: scale(1.1);
        }

        .favorite-btn.active:not(#headerFavoriteBtn) {
          background: var(--primary);
          color: white;
        }

        .favorite-btn.active:not(#headerFavoriteBtn) i {
          animation: heart-pop 0.5s;
        }

        @keyframes heart-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }

        .search-results-section {
          display: none;
          padding-bottom: 7rem;
        }

        .search-results-section.active {
          display: block;
        }

        .search-results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .clear-search-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 25px;
          padding: 0.5rem 1rem;
          color: var(--text);
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          font-size: 0.9rem;
        }

        .clear-search-btn:hover {
          background: var(--primary);
          border-color: var(--primary);
          transform: translateY(-2px);
        }

        .clear-search-btn:active {
          transform: translateY(0);
          background: var(--primary-dark);
        }

        /* ===== BOTTOM NAVIGATION ORIGINAL ===== */
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
          background-color: transparent;
          border: 2px solid var(--header-border);
          border-radius: 40px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: space-around;
          align-items: center;
          height: 70px;
          flex-grow: 1;
          overflow: hidden;
          padding: 0 10px;
          position: relative;
          transition: all 0.3s ease;
        }

        .main-nav-bar.search-active {
          justify-content: flex-start;
          padding: 0;
        }

        .main-nav-bar::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            backdrop-filter: blur(10px);
            filter: saturate(120%) brightness(1.15);
            z-index: -1;
        }

        .main-nav-bar::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--header-bg);
            border-radius: 40px;
            z-index: -1;
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
          transition: all 0.3s ease;
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

        .nav-item.active {
          color: initial;
        }

        .nav-item.active i {
          color: var(--primary);
          transform: none;
        }

        .bottom-nav-container.reproduction-mode .main-nav-bar {
            justify-content: space-around;
            padding: 0 10px;
            flex-grow: 1;
            width: auto;
            max-width: none;
        }

        .bottom-nav-container.reproduction-mode .nav-item {
            opacity: 1;
            transform: scale(1);
            pointer-events: auto;
            flex: 1;
            width: auto;
        }

        .bottom-nav-container.reproduction-mode .nav-item.hidden-on-repro {
            display: none;
        }

        .search-circle {
          background-color: transparent;
          border: 2px solid var(--header-border);
          backdrop-filter: blur(10px);
          filter: saturate(120%) brightness(1.15);
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
          transition: all 0.3s ease;
          position: relative;
          opacity: 1;
          transform: scale(1);
          z-index: 1;
        }

        .search-circle::after {
            content: '';
            position: absolute;
            inset: 0;
            background: var(--header-bg);
            border-radius: 50%;
            z-index: -1;
        }

        .search-circle:hover {
          background-color: var(--primary);
          color: var(--text);
          border-color: var(--primary);
        }

        .search-circle:active {
          transform: scale(0.95);
          background-color: var(--primary-dark);
        }

        .search-circle.active {
          background-color: var(--primary);
          border-color: var(--primary);
          color: white;
        }

        .search-circle i {
          font-size: 32px;
          z-index: 1;
        }

        /* O botão da lupa NÃO some mais quando a search está ativa */
        .main-nav-bar.search-active + .search-circle {
          opacity: 1;
          transform: scale(1);
          pointer-events: auto;
        }

        .bottom-nav-container.reproduction-mode .search-circle {
            opacity: 0;
            transform: scale(0);
            pointer-events: none;
        }

        /* ===== PLAYER CIRCLE (PARA PÁGINAS DE STREAMING) ===== */
        .player-circle {
          background-color: transparent;
          border: 2px solid var(--header-border);
          backdrop-filter: blur(10px);
          filter: saturate(120%) brightness(1.15);
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
          transition: all 0.3s ease;
          position: relative;
          opacity: 1;
          transform: scale(1);
          z-index: 1;
        }

        .player-circle::after {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--header-bg);
          border-radius: 50%;
          z-index: -1;
        }

        .player-circle:hover {
          background-color: var(--primary);
          color: var(--text);
          border-color: var(--primary);
        }

        .player-circle:active {
          transform: scale(0.95);
          background-color: var(--primary-dark);
        }

        .player-circle i {
          font-size: 32px;
          z-index: 2;
        }

        /* ===== NOVA BARRA DE PESQUISA ===== */
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
          padding: 0 50px 0 0;
          outline: none;
          font-family: 'Inter', sans-serif;
        }

        .search-input-expanded::placeholder {
          color: var(--text);
          opacity: 0.7;
        }

        .close-search-expanded {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          color: var(--text);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          z-index: 2;
          font-size: 1.3rem;
        }

        .close-search-expanded:hover {
          color: var(--primary);
          transform: translateY(-50%) scale(1.1);
        }

        .close-search-expanded:active {
          transform: translateY(-50%) scale(0.95);
        }

        /* Remover search container antigo */
        .search-container,
        .search-form,
        .search-input,
        .search-button,
        .close-search {
          display: none;
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

        /* ===== PÁGINAS DE STREAMING ===== */
        .streaming-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 1.5rem;
          min-height: calc(100vh - 80px);
          padding-bottom: 8rem;
        }

        .player-container {
          background: var(--card-bg);
          border-radius: 15px;
          overflow: hidden;
          margin-bottom: 1.5rem;
          border: 1px solid var(--border);
          backdrop-filter: blur(10px);
          position: relative;
        }

        .player-wrapper {
          position: relative;
          padding-bottom: 56.25%;
          height: 0;
          overflow: hidden;
          background-color: #000;
        }

        .player-wrapper iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
        }

        .content-info-streaming {
          background: var(--card-bg);
          border-radius: 15px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          border: 1px solid var(--border);
          backdrop-filter: blur(10px);
        }

        .content-title-streaming {
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: var(--text);
          line-height: 1.3;
        }

        .content-meta-streaming {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          color: var(--secondary);
          font-size: 0.9rem;
        }

        .content-meta-streaming span {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .content-description-streaming {
          color: var(--text);
          line-height: 1.6;
          margin-bottom: 1rem;
        }

        /* ===== SELETOR DE TEMPORADA/EPISÓDIO ===== */
        .episode-selector-streaming {
          display: none;
          gap: 1rem;
          margin: 1rem 0;
          align-items: center;
          flex-wrap: wrap;
        }

        .episode-selector-streaming.active {
          display: flex;
        }

        .selector-group-streaming {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .selector-label-streaming {
          color: var(--secondary);
          font-size: 0.9rem;
          white-space: nowrap;
        }

        .selector-select-streaming {
          background-color: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border);
          border-radius: 25px;
          padding: 0.5rem 0.75rem;
          color: var(--text);
          width: 140px;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          cursor: pointer;
          font-size: 0.9rem;
        }

        .selector-select-streaming:focus {
          outline: none;
          border-color: var(--primary);
        }

        /* ===== PLAYER SELECTOR BUBBLE ===== */
        .player-selector-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: var(--overlay-bg);
          z-index: 2000;
          display: none;
          justify-content: center;
          align-items: center;
          backdrop-filter: blur(5px);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .player-selector-overlay.active {
          display: flex;
          opacity: 1;
        }

        .player-selector-bubble {
          background: var(--popup-bg);
          border: 1px solid var(--popup-border);
          border-radius: 20px;
          padding: 1.5rem;
          max-width: 320px;
          width: 90%;
          backdrop-filter: blur(15px);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          transform: scale(0.8);
          opacity: 0;
          transition: all 0.3s ease;
        }

        .player-selector-bubble.active {
          transform: scale(1);
          opacity: 1;
        }

        .player-options-bubble {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .player-option-bubble {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.25rem;
          padding: 0.75rem 1rem;
          background: var(--option-bg);
          border: 1px solid var(--border);
          border-radius: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          color: var(--text);
        }

        .player-option-bubble:hover {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
          transform: translateX(5px);
        }

        .player-option-bubble:active {
          transform: translateX(5px) scale(0.98);
        }

        .option-main-line {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
        }

        .option-main-line i {
          font-size: 1.2rem;
          width: 20px;
          text-align: center;
          flex-shrink: 0;
        }

        .option-name {
          font-weight: 600;
          font-size: 1rem;
          flex-grow: 1;
        }

        .option-details {
          font-size: 0.8rem;
          color: var(--secondary);
          margin-left: 27.5px;
          text-align: left;
        }

        .player-option-bubble:hover .option-details {
          color: white;
          opacity: 0.8;
        }

        .player-tag-bubble {
          margin-left: auto;
          padding: 0.2rem 0.5rem;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          flex-shrink: 0;
        }

        .player-tag-dub {
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: white;
        }

        .player-tag-sub {
          background: linear-gradient(135deg, var(--success), var(--accent));
          color: white;
        }

        /* ===== INFO POPUP COMPACTO ===== */
        .info-popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: var(--overlay-bg);
          z-index: 2000;
          display: none;
          justify-content: center;
          align-items: center;
          padding: 1rem;
          backdrop-filter: blur(5px);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .info-popup-overlay.active {
          display: flex;
          opacity: 1;
        }

        .info-popup-content {
          background: var(--popup-bg);
          border: 1px solid var(--popup-border);
          border-radius: 20px;
          padding: 1.5rem;
          max-width: 400px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          backdrop-filter: blur(15px);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          transform: translateY(50px);
          opacity: 0;
          transition: all 0.4s ease;
        }

        .info-popup-overlay.active .info-popup-content {
          transform: translateY(0);
          opacity: 1;
        }

        .info-popup-header {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          align-items: flex-start;
        }

        .info-poster {
          width: 80px;
          height: 120px;
          object-fit: cover;
          border-radius: 8px;
          flex-shrink: 0;
        }

        .info-details {
          flex: 1;
        }

        .info-title {
          font-size: 1.2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: var(--text);
          line-height: 1.3;
        }

        .info-meta {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          margin-bottom: 0.8rem;
          color: var(--secondary);
          font-size: 0.8rem;
        }

        .info-meta span {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .info-description {
          color: var(--text);
          line-height: 1.5;
          font-size: 0.9rem;
          margin-bottom: 1.2rem;
        }

        .close-popup-btn {
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 25px;
          padding: 0.6rem 1.2rem;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .close-popup-btn:hover {
          background: var(--primary-dark);
        }

        .close-popup-btn:active {
          transform: scale(0.98);
        }

        .error-message {
          display: none;
          background: var(--card-bg);
          padding: 1.5rem;
          border-radius: 15px;
          border-left: 4px solid var(--error);
          margin-bottom: 2rem;
          text-align: center;
          backdrop-filter: blur(10px);
          border: 1px solid var(--border);
        }

        .error-message.active {
          display: block;
        }

        .error-message h3 {
          color: var(--error);
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        /* ===== TOAST NOTIFICATIONS ===== */
        .toast-container {
          position: fixed;
          bottom: 120px; /* Aumentada a distância da navbar */
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
          background: var(--popup-bg);
          border: 1px solid var(--popup-border);
          border-radius: 12px;
          padding: 12px 16px;
          backdrop-filter: blur(15px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
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

        .toast.hiding {
          transform: translateY(100px);
          opacity: 0;
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

        /* Remover as seções do tutorial antigo */
        .server-tutorial-overlay,
        .server-tutorial-content,
        .server-tutorial-icon,
        .server-tutorial-title,
        .server-tutorial-text,
        .server-tutorial-highlight,
        .server-tutorial-button {
          display: none;
        }

        /* ===== RESPONSIVIDADE ===== */
        @media (max-width: 768px) {
          .bottom-nav-container {
            bottom: 20px;
            max-width: 95%;
            width: 95%;
            gap: 10px;
          }
          
          .main-nav-bar {
            height: 65px;
            border-radius: 35px;
            border: 1px solid var(--header-border);
          }
          
          .main-nav-bar::after {
            border-radius: 35px;
          }
          
          .nav-item i {
            font-size: 24px;
          }
          
          .search-circle {
            width: 65px;
            height: 65px;
            border: 1px solid var(--header-border);
          }
          
          .search-circle i {
            font-size: 28px;
          }
          
          .player-circle {
            width: 65px;
            height: 65px;
            border: 1px solid var(--header-border);
          }
          
          .player-circle i {
            font-size: 28px;
          }
          
          .streaming-container {
            padding: 1rem;
            padding-bottom: 7rem;
          }
          
          .content-title-streaming {
            font-size: 1.2rem;
          }
          
          .info-popup-content {
            padding: 1.2rem;
            max-width: 350px;
          }
          
          .info-poster {
            width: 70px;
            height: 105px;
          }
          
          .info-title {
            font-size: 1.1rem;
          }
          
          .player-selector-bubble {
            padding: 1.2rem;
            max-width: 300px;
          }
          
          .episode-selector-streaming {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.8rem;
          }
          
          .selector-group-streaming {
            width: 100%;
            justify-content: space-between;
          }
          
          .selector-select-streaming {
            width: 120px;
          }

          .toast-container {
            bottom: 110px; /* Ajuste para mobile */
            max-width: 350px;
          }
          
          .toast {
            max-width: 350px;
            padding: 10px 14px;
          }
          
          .toast-content {
            font-size: 13px;
          }
          
          .search-input-expanded {
            font-size: 16px;
            padding: 0 45px 0 0;
          }
          
          .close-search-expanded {
            width: 35px;
            height: 35px;
            font-size: 1.2rem;
          }
        }

        @media (max-width: 480px) {
          .info-popup-content {
            padding: 1rem;
            max-width: 320px;
          }
          
          .info-popup-header {
            flex-direction: column;
            text-align: center;
            gap: 0.8rem;
          }
          
          .info-poster {
            width: 80px;
            height: 120px;
            align-self: center;
          }
          
          .info-title {
            font-size: 1rem;
          }
          
          .info-meta {
            font-size: 0.75rem;
          }
          
          .info-description {
            font-size: 0.85rem;
          }
          
          .player-selector-bubble {
            padding: 1rem;
            max-width: 280px;
          }
          
          .player-option-bubble {
            padding: 0.6rem 0.8rem;
          }
          
          .option-name {
            font-size: 0.9rem;
          }
          
          .option-details {
            font-size: 0.75rem;
            margin-left: 26px;
          }
          
          .selector-select-streaming {
            width: 110px;
            font-size: 0.85rem;
            padding: 0.4rem 0.8rem;
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
          
          .player-circle {
            width: 60px;
            height: 60px;
          }
          
          .player-circle i {
            font-size: 26px;
          }

          .toast-container {
            bottom: 100px; /* Ajuste para mobile pequeno */
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
          
          .search-input-expanded {
            font-size: 16px;
            padding: 0 40px 0 0;
          }
          
          .close-search-expanded {
            width: 32px;
            height: 32px;
            right: 8px;
            font-size: 1.1rem;
          }
          
          .search-input-container {
            padding: 0 12px;
          }
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        button {
          font-family: inherit;
        }

        select {
          font-family: inherit;
        }

        img {
          max-width: 100%;
          height: auto;
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* Animação para notificação (Toast) */
        @keyframes toast-slide-up {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

.nav-active-bubble-traveling {
            position: absolute;
            top: 50%;
            /* Posiciona no centro do primeiro terço */
            left: calc(100% / 6); 
            transform: translate(-50%, -50%);
            
            /* MENOS LARGA: Para não sair das bordas laterais */
            width: 105px; 
            
            /* MAIS ALTA: Para ultrapassar a navbar (90px > 75px da nav) */
            height: 90px;
            
            /* Pílula verticalizada */
            border-radius: 50px;
            
            /* VIDRO INCOLOR BRILHANTE */
            /* Fundo branco ultra transparente */
            background: rgba(255, 255, 255, 0.05);
            /* Borda branca fina para o "brilho" */
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-top: 1px solid rgba(255, 255, 255, 0.3); /* Topo mais brilhante */
            
            /* Sombra/Glow branco incolor */
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.05);
            
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            
            z-index: 0;
            pointer-events: none;

            /* MOVIMENTO */
            transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
            margin-left: calc(var(--active-index) * (100% / 3));
        }
          
        /* --- Padronização do Grid (Home e Busca) --- */
        .content-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
            gap: 12px;
            padding: 0;
            width: 100%;
        }

        .content-card {
           position: relative;
           display: block;
           overflow: hidden;
           border-radius: 12px;
        }

        .content-poster {
           width: 100%;
           height: auto;
           aspect-ratio: 2/3; /* Proporção exata 2:3 */
           object-fit: cover;
           display: block;
           border-radius: 12px;
        }

        /* Mobile: 2 colunas exatas */
        @media (max-width: 768px) {
            .content-grid {
                grid-template-columns: repeat(2, 1fr) !important;
            }
        }

        /* --- Estilos da Busca (Live Search) como PÁGINA NORMAL --- */
        .live-search-results {
            position: static;
            width: 100%;
            height: auto;
            background-color: transparent;
            padding: 0;
            margin-bottom: 20px;
        }

        .page-title-home {
            margin-top: 20px;
            margin-bottom: 15px;
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text);
            display: flex;
            align-items: center;
        }
        
        .live-search-loading, .no-results-live {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 50vh; /* Ocupa altura mínima para estética */
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

        /* --- Container Principal --- */
        .container {
            padding: 0 16px 100px 16px;
            width: 100%;
        }

        /* --- Header Adjustments --- */
        .header-content {
            display: flex;
            justify-content: flex-start;
            align-items: center;
            width: 100%;
            padding: 0 16px;
        }
        
        .main-nav-bar.search-active {
            padding: 0 10px;
        }

        /* Ajuste do input quando não há botão X interno */
        .search-input-expanded {
            width: 100%;
            /* Garante que o input ocupe todo o espaço disponível no container */
        }
      `}</style>
    </>
  )
}

// Header
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
            <span className="beta-tag">STREAMING</span>
          </div>
        </Link>
      </div>
    </header>
  )
      }
