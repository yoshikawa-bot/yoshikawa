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
  
  // Estado para controlar a seção ativa e o ÍNDICE para a animação da bolha
  const [activeSection, setActiveSection] = useState('releases')
  const [activeIndex, setActiveIndex] = useState(0) // 0, 1, ou 2

  const [searchActive, setSearchActive] = useState(false)
  const [toasts, setToasts] = useState([])

  const searchInputRef = useRef(null)
  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const DEFAULT_POSTER = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'

  const navItems = ['releases', 'recommendations', 'favorites'];

  const getItemKey = (item) => `${item.media_type}-${item.id}`

  // Sistema de Toast Notifications
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
  
  // Função auxiliar para mudar a aba e atualizar o índice para a animação
  const handleTabChange = (section, index) => {
    setActiveSection(section);
    setActiveIndex(index);
  }
  
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
                <p>Nenhum resultado encontrado.</p>
            </div>
        ))}
        
        {!loading && searchQuery.trim() === '' && (
            <div className="no-results-live">
                <p>Digite para pesquisar...</p>
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
          style={{ animation: 'toast-slide-up 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}
        >
          <div className="toast-icon">
            <i className={`fas ${
              toast.type === 'success' ? 'fa-check' : 
              toast.type === 'error' ? 'fa-exclamation-triangle' : 
              'fa-info'
            }`}></i>
          </div>
          <div className="toast-content">{toast.message}</div>
        </div>
      ))}
    </div>
  )
  
  return (
    <>
      <Head>
        <title>Yoshikawa Player</title>
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
            <p>Carregando...</p>
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
              {/* A BOLHA VIAJANTE - REDIMENSIONADA E INCOLOR */}
              <div 
                className="nav-active-bubble-traveling"
                style={{ '--active-index': activeIndex }}
              ></div>

              {navItems.map((section, index) => (
                <button 
                  key={section}
                  className={`nav-item ${activeSection === section ? 'active' : ''}`}
                  onClick={() => handleTabChange(section, index)}
                >
                  <i className={`fas ${
                    section === 'releases' ? 'fa-film' : 
                    section === 'recommendations' ? 'fa-fire' : 'fa-heart'
                  }`}></i>
                  <span>
                    {section === 'releases' ? 'Lançamentos' : 
                     section === 'recommendations' ? 'Populares' : 'Favoritos'}
                  </span>
                </button>
              ))}
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
          --primary: #E90039;
          --primary-dark: #b8002e;
          --secondary: #94a3b8;
          --accent: #4dabf7;
          
          --dark: #000000;
          --card-bg: #111111;
          --text: #ffffff;
          
          /* HEADER INCOLOR */
          --header-bg: rgba(255, 255, 255, 0.01);
          --header-border: rgba(255, 255, 255, 0.08);
          
          --success: #10b981;
          --error: #ef4444;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        body {
          font-family: 'Inter', Arial, sans-serif;
          /* FUNDO CINZA SÓLIDO */
          background-color: #121212; 
          color: var(--text);
          line-height: 1.6;
          min-height: 100vh;
          overflow-y: auto;
        }

        .github-header {
          background-color: var(--header-bg);
          border-bottom: 1px solid var(--header-border);
          padding: 0.75rem 0;
          position: sticky;
          top: 0;
          z-index: 100;
          /* Blur sem cor */
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
        }

        .header-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 1.5rem;
          display: flex;
          justify-content: flex-start;
          align-items: center;
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
        }

        .logo-image {
          width: 32px;
          height: 32px;
          border-radius: 8px;
        }

        .logo-name {
          font-size: 1.2rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.5px;
        }

        .beta-tag {
          background: var(--primary);
          color: white;
          font-size: 0.65rem;
          padding: 0.2rem 0.6rem;
          border-radius: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 1.5rem;
          padding-bottom: 7rem;
        }

        .page-title-home {
            font-size: 2rem;
            font-weight: 800;
            color: #fff;
            margin-bottom: 1.5rem;
            padding-top: 1rem;
            letter-spacing: -1px;
        }

        .content-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 16px;
          width: 100%;
        }

        .content-card {
          background-color: var(--card-bg);
          border-radius: 16px;
          overflow: hidden;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
          cursor: pointer;
          border: 1px solid #222;
          position: relative;
          text-decoration: none;
          color: inherit;
        }

        .content-card:hover {
          transform: scale(1.03);
          border-color: var(--primary);
          box-shadow: 0 10px 30px rgba(233, 0, 57, 0.2);
          z-index: 2;
        }

        .content-poster {
          width: 100%;
          aspect-ratio: 2/3;
          object-fit: cover;
          display: block;
          background: #222;
        }

        .floating-text-wrapper {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 15px 12px;
            background: linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0));
            z-index: 5;
        }

        .content-title-card {
            font-weight: 600;
            font-size: 0.95rem;
            color: #fff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-shadow: 0 2px 4px rgba(0,0,0,0.8);
        }

        .content-year {
            font-size: 0.8rem;
            color: rgba(255,255,255,0.7);
            margin-top: 2px;
        }

        .favorite-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.6);
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          color: white;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10;
          backdrop-filter: blur(4px);
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .favorite-btn:hover {
            transform: scale(1.15);
        }

        .favorite-btn.active {
          background: var(--primary);
          color: white;
        }

        /* ===== BOTTOM NAVIGATION ===== */
        .bottom-nav-container {
          position: fixed;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          max-width: 500px;
          width: 90%;
          gap: 15px;
          z-index: 1000;
        }

        /* NAVBAR PRINCIPAL - VIDRO INCOLOR */
        .main-nav-bar {
          /* Fundo praticamente invisível (1% branco) para pegar apenas o blur */
          background-color: rgba(255, 255, 255, 0.01); 
          border: 1px solid rgba(255,255,255,0.08);
          
          /* Blur sem saturação (incolor) */
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          
          border-radius: 100px;
          /* Sombra branca sutil para "brilho" */
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), inset 0 0 20px rgba(255,255,255,0.02);
          
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 75px;
          flex-grow: 1;
          padding: 0 5px; 
          position: relative;
          transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
          
          /* CRUCIAL: Overflow visible para a bolha sair na vertical */
          overflow: visible; 
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          background: none;
          border: none;
          cursor: pointer;
          position: relative;
          height: 100%;
          color: #999;
          transition: color 0.3s ease;
          z-index: 2;
        }

        .nav-item i {
            font-size: 24px;
            position: relative;
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .nav-item span {
            display: none;
        }

        .nav-item.active {
            color: #fff;
        }
        
        .nav-item.active i {
            transform: scale(1.1);
        }

        /* === A BOLHA VIAJANTE (INCOLOR E ALTA) === */
        .nav-active-bubble-traveling {
            position: absolute;
            top: 50%;
            /* Posiciona no centro do primeiro terço */
            left: calc(100% / 6); 
            transform: translate(-50%, -50%);
            
            /* MENOS LARGA: Para não sair das bordas laterais */
            width: 80px; 
            
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

        /* Search Circle - INCOLOR */
        .search-circle {
          background-color: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          
          border-radius: 50%;
          width: 75px;
          height: 75px;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          flex-shrink: 0;
          cursor: pointer;
          color: white;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        .search-circle:hover {
          background-color: var(--primary);
          border-color: var(--primary);
          transform: scale(1.05);
        }

        .search-circle.active {
          background-color: var(--primary);
          border-color: var(--primary);
          transform: rotate(90deg);
        }

        .search-circle i {
            font-size: 28px;
        }

        .search-input-container {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
        }

        .search-input-expanded {
            width: 100%;
            background: transparent;
            border: none;
            color: #fff;
            font-size: 1.1rem;
            font-weight: 500;
            outline: none;
            padding: 0 10px;
        }
        
        .search-input-expanded::placeholder {
            color: rgba(255,255,255,0.4);
        }

        .main-nav-bar.search-active {
            padding: 0 20px;
        }
        
        .main-nav-bar.search-active .nav-active-bubble-traveling {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
        }

        /* Loading */
        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 50px;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* Toast Notification */
        .toast-container {
            position: fixed;
            bottom: 130px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 2000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        }

        .toast {
            background: rgba(20, 20, 20, 0.8);
            border: 1px solid rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            color: white;
            padding: 12px 20px;
            border-radius: 30px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            font-size: 0.9rem;
            font-weight: 500;
        }

        .toast-icon {
            color: var(--primary);
        }

        @media (max-width: 768px) {
            .content-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
            }
            
            .bottom-nav-container {
                bottom: 15px;
                width: 95%;
                gap: 10px;
            }

            .main-nav-bar {
                height: 65px;
            }

            .search-circle {
                width: 65px;
                height: 65px;
            }
            
            /* Ajuste Mobile da Bolha Viajante */
            .nav-active-bubble-traveling {
                width: 65px; /* Menos larga no mobile */
                height: 80px; /* Ainda mais alta que a nav (65px) */
            }
        }
      `}</style>
    </>
  )
}

// Header Simples
const Header = () => (
  <header className="github-header">
    <div className="header-content">
      <Link href="/" className="logo-container">
        <img 
          src="https://yoshikawa-bot.github.io/cache/images/14c34900.jpg" 
          alt="Yoshikawa" 
          className="logo-image"
        />
        <span className="logo-name">Yoshikawa</span>
        <span className="beta-tag">STREAMING</span>
      </Link>
    </div>
  </header>
)
