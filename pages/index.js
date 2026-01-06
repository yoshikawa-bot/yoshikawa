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
  const bubbleRef = useRef(null)
  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const DEFAULT_POSTER = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'

  const getItemKey = (item) => `${item.media_type}-${item.id}`

  // Sistema de Toast Notifications (Modificado para não acumular)
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
  
  // Posicionamento fluido da bolha indicadora
  useEffect(() => {
    const updateBubblePosition = () => {
      if (!bubbleRef.current) return

      const bubble = bubbleRef.current
      const activeItem = document.querySelector('.nav-item.active')
      const navBar = document.querySelector('.main-nav-bar')

      if (searchActive || !activeItem || !navBar) {
        bubble.style.opacity = '0'
        return
      }

      const navRect = navBar.getBoundingClientRect()
      const itemRect = activeItem.getBoundingClientRect()
      const navHeight = navRect.height

      // Overflow sutil: ~1-2px top/bottom, ~8-10px lateral total (não invade vizinhos)
      const overflowVertical = 4   // total extra vertical (2px cada lado)
      const overflowHorizontal = window.innerWidth > 768 ? 16 : 10  // total extra horizontal

      const bubbleWidth = itemRect.width + overflowHorizontal
      const bubbleHeight = navHeight + overflowVertical

      const left = (itemRect.left - navRect.left) + (itemRect.width / 2) - (bubbleWidth / 2)
      const top = - (overflowVertical / 2)  // centralizado com overflow simétrico

      bubble.style.width = `${bubbleWidth}px`
      bubble.style.height = `${bubbleHeight}px`
      bubble.style.left = `${left}px`
      bubble.style.top = `${top}px`
      bubble.style.opacity = '1'
    }

    updateBubblePosition()
    window.addEventListener('resize', updateBubblePosition)

    return () => window.removeEventListener('resize', updateBubblePosition)
  }, [activeSection, searchActive])

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
  
  const getActiveSectionTitle = () => {
    switch (activeSection) {
      case 'releases':
        return 'Lançamentos'
      case 'recommendations':
        return 'Populares'
      case 'favorites':
        return 'Favoritos'
      default:
        return 'Conteúdo'
    }
  }
  
  const pageTitle = getActiveSectionTitle()

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
          <div ref={bubbleRef} className="active-bubble" />
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
                onKeyDown={(e) => { if (e.key === 'Enter') debouncedSearch(searchQuery) }}
              />
            </div>
          )}
        </div>
        
        <button 
          className={`search-circle ${searchActive ? 'active' : ''}`}
          onClick={() => setSearchActive(prev => !prev)}
        >
          <i className={searchActive ? "fas fa-times" : "fas fa-search"}></i>
        </button>
      </div>

      <style jsx global>{`
        :root {
          --primary: #E90039;
          --primary-dark: #c80032;
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
          background: #000 fixed;
          color: var(--text);
          line-height: 1.6;
          font-size: 16px;
          min-height: 100vh;
          position: relative;
          overflow-y: auto;
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
          backdrop-filter: blur(16px) saturate(150%);
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

        .container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 1.5rem;
          min-height: calc(100vh - 80px);
          padding: 0 16px 100px 16px;
          width: 100%;
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
            margin-top: 20px;
            padding-top: 1rem;
        }

        .content-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 12px;
          padding: 0;
          width: 100%;
        }

        @media (max-width: 768px) {
            .content-grid {
                grid-template-columns: repeat(2, 1fr) !important;
            }
        }

        .content-card {
          background-color: var(--card-bg);
          border-radius: 15px;
          overflow: hidden;
          transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), 
                      box-shadow 0.45s ease;
          cursor: pointer;
          border: 1px solid var(--border);
          position: relative;
          text-decoration: none;
          color: inherit;
          aspect-ratio: 2/3;
        }

        .content-card:hover {
          transform: translateY(-8px);
          border-color: var(--primary);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
        }

        .content-poster {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          border-radius: 15px;
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
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          z-index: 10;
        }

        .favorite-btn:hover {
          background: rgba(233, 0, 57, 0.9);
          transform: scale(1.1);
        }

        .favorite-btn.active {
          background: var(--primary);
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

        /* Bottom Navigation */
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
          padding: 0 10px;
          position: relative;
          transition: all 0.4s ease;
        }

        .main-nav-bar::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            backdrop-filter: blur(16px) saturate(150%);
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

        .main-nav-bar.search-active {
          justify-content: flex-start;
          padding: 0;
        }

        .active-bubble {
          position: absolute;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 40px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          z-index: 0;
          pointer-events: none;
          opacity: 0;
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .active-bubble::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 40px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent 70%);
          pointer-events: none;
        }

        .active-bubble::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.12'/%3E%3C/svg%3E");
          mix-blend-mode: overlay;
          opacity: 0.3;
          pointer-events: none;
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
          z-index: 1;
        }

        .nav-item span {
          display: none;
        }

        .nav-item i {
          font-size: 26px;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          color: var(--text);
        }

        .nav-item:hover i {
            transform: scale(1.15);
            color: var(--primary);
        }

        .nav-item.active i {
          color: var(--primary);
        }

        .search-circle {
          background-color: transparent;
          border: 2px solid var(--header-border);
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
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }

        .search-circle::after {
            content: '';
            position: absolute;
            inset: 0;
            background: var(--header-bg);
            border-radius: 50%;
            backdrop-filter: blur(16px) saturate(150%);
            z-index: -1;
        }

        .search-circle:hover {
          background-color: var(--primary);
          color: white;
          border-color: var(--primary);
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
          background: var(--popup-bg);
          border: 1px solid var(--popup-border);
          border-radius: 12px;
          padding: 12px 16px;
          backdrop-filter: blur(15px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          gap: 12px;
          animation: toast-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes toast-slide-up {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
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
        }

        .toast-close:hover {
          color: var(--text);
          background: rgba(255, 255, 255, 0.1);
        }

        /* Responsividade */
        @media (max-width: 768px) {
          .bottom-nav-container {
            bottom: 20px;
            gap: 10px;
          }
          
          .main-nav-bar {
            height: 65px;
            border-radius: 35px;
          }
          
          .nav-item i {
            font-size: 24px;
          }
          
          .search-circle {
            width: 65px;
            height: 65px;
          }
          
          .search-circle i {
            font-size: 28px;
          }

          .toast-container {
            bottom: 110px;
          }
        }

        @media (max-width: 480px) {
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
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
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
            <span className="beta-tag">STREAMING</span>
          </div>
        </Link>
      </div>
    </header>
  )
}
