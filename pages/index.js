import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import LiquidGlass from 'liquid-glass-react' // Importação da biblioteca

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
  // Ref para o container principal para o efeito de mouse do LiquidGlass
  const mainContainerRef = useRef(null)
  
  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const DEFAULT_POSTER = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'

  const getItemKey = (item) => `${item.media_type}-${item.id}`

  // Sistema de Toast Notifications
  const showToast = (message, type = 'info') => {
    const id = Date.now()
    const toast = { id, message, type }
    setToasts([toast]) // Mantém apenas um por vez
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (searchInputRef.current && searchInputRef.current.value.trim()) {
        debouncedSearch(searchInputRef.current.value.trim())
      }
    }
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
      case 'releases': return { title: 'Lançamentos', icon: 'fas fa-film' }
      case 'recommendations': return { title: 'Populares', icon: 'fas fa-fire' }
      case 'favorites': return { title: 'Favoritos', icon: 'fas fa-heart' }
      default: return { title: 'Conteúdo', icon: 'fas fa-tv' }
    }
  }
  
  const { title: pageTitle, icon: pageIcon } = getActiveSectionDetails()

  // --- Componentes Internos ---

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
          className={`toast-wrapper show`}
          style={{ animation: 'toast-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards', marginBottom: '10px' }}
        >
          {/* LiquidGlass aplicado nas notificações */}
          <LiquidGlass
            blurAmount={0.2}
            saturation={120}
            elasticity={0.2}
            cornerRadius={12}
            style={{overflow: 'hidden'}}
          >
            <div className={`toast-content-inner toast-${toast.type}`}>
                <div className="toast-icon">
                    <i className={`fas ${
                    toast.type === 'success' ? 'fa-check' : 
                    toast.type === 'error' ? 'fa-exclamation-triangle' : 
                    'fa-info'
                    }`}></i>
                </div>
                <div className="toast-message">{toast.message}</div>
                <button className="toast-close" onClick={() => removeToast(toast.id)}>
                    <i className="fas fa-times"></i>
                </button>
            </div>
          </LiquidGlass>
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

      {/* Header com LiquidGlass */}
      <Header containerRef={mainContainerRef} />
      
      <ToastContainer />

      {/* Referência adicionada ao main para o efeito de mouse */}
      <main className="container" ref={mainContainerRef}>
        
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
        {/* Navbar com LiquidGlass */}
        <div className={`main-nav-bar-wrapper ${searchActive ? 'search-active' : ''}`}>
           <LiquidGlass
             mouseContainer={mainContainerRef}
             blurAmount={0.25}
             saturation={140}
             elasticity={0.3}
             cornerRadius={40}
             padding="0"
             style={{ width: '100%', height: '100%' }}
           >
              <div className="main-nav-bar-content">
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
           </LiquidGlass>
        </div>
        
        {/* Botão Círculo com LiquidGlass */}
        <div className="search-circle-wrapper">
            <LiquidGlass
                mouseContainer={mainContainerRef}
                blurAmount={0.2}
                saturation={150}
                elasticity={0.4}
                cornerRadius={100} // Círculo perfeito
                style={{ width: '70px', height: '70px' }}
                onClick={() => setSearchActive(!searchActive)}
            >
                <div className={`search-circle-content ${searchActive ? 'active' : ''}`}>
                    <i className={searchActive ? "fas fa-times" : "fas fa-search"}></i>
                </div>
            </LiquidGlass>
        </div>
      </div>

      <style jsx global>{`
        /* Animação para notificação (Toast) */
        @keyframes toast-slide-up {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        /* Ajustes para o Liquid Glass funcionar bem */
        .main-nav-bar-wrapper {
            height: 70px;
            flex-grow: 1;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            border-radius: 40px;
            /* Removemos background aqui pois o LiquidGlass assume */
        }
        .main-nav-bar-content {
            display: flex;
            justify-content: space-around;
            align-items: center;
            width: 100%;
            height: 100%;
            padding: 0 10px;
        }

        .search-circle-wrapper {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .search-circle-content {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            color: var(--text);
            font-size: 24px;
        }

        .toast-content-inner {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            gap: 12px;
            width: 100%;
        }
        .toast-message {
            flex: 1;
            font-size: 14px;
            color: white;
            font-weight: 500;
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
           aspect-ratio: 2/3; 
           object-fit: cover;
           display: block;
           border-radius: 12px;
        }

        @media (max-width: 768px) {
            .content-grid {
                grid-template-columns: repeat(2, 1fr) !important;
            }
        }

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

        .container {
            padding: 0 16px 100px 16px;
            width: 100%;
        }

        .search-input-expanded {
            width: 100%;
            background: transparent;
            border: none;
            color: white;
            font-size: 16px;
            outline: none;
        }
      `}</style>
    </>
  )
}

// Header atualizado com LiquidGlass
const Header = ({ containerRef }) => {
  return (
    <header className="github-header-wrapper" style={{position: 'sticky', top: 0, zIndex: 100}}>
      <LiquidGlass
         mouseContainer={containerRef}
         blurAmount={0.2}
         saturation={110}
         elasticity={0.1}
         cornerRadius={0}
         style={{ width: '100%', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="header-content" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', maxWidth: '1280px', margin: '0 auto' }}>
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
      </LiquidGlass>
    </header>
  )
}
