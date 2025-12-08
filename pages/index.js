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

  // Sistema de Toast: Substitui a notificação anterior imediatamente
  const showToast = (message, type = 'info') => {
    const id = Date.now()
    const toast = { id, message, type }
    setToasts([toast]) // Substitui o array pelo novo toast
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
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

  const ContentGrid = ({ items, isFavorite, toggleFavorite }) => (
    <section className="section-full-width">
      <div className="content-grid main-grid">
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
    </section>
  )

  const LiveSearchResults = () => {
    if (!searchActive || searchQuery.trim() === '') return null
    
    return (
      <div className="live-search-results active">
        {/* Título adicionado para igualar às outras páginas */}
        <h1 className="page-title-home"><i className="fas fa-search" style={{marginRight: '8px'}}></i>Resultados</h1>

        {loading && (
            <div className="live-search-loading">
                <i className="fas fa-spinner fa-spin"></i>
                <span> Buscando...</span>
            </div>
        )}
        
        {!loading && searchResults.length > 0 ? (
            <div className="content-grid live-grid">
                {searchResults.map(item => {
                    const isFav = isFavorite(item)
                    return (
                        <Link 
                          key={getItemKey(item)}
                          href={`/${item.media_type}/${item.id}`}
                          className="content-card"
                          onClick={() => setSearchActive(false)}
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
                })}
            </div>
        ) : (!loading && searchQuery.trim() !== '' && (
            <div className="no-results-live">
                <i className="fas fa-ghost"></i>
                <p>Nenhum resultado encontrado para "{searchQuery}".</p>
            </div>
        ))}
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

        <LiveSearchResults />

        {!searchActive && (
          <div className="home-sections">
            <h1 className="page-title-home"><i className={pageIcon} style={{marginRight: '8px'}}></i>{pageTitle}</h1>
            <ContentGrid 
                items={getActiveItems()} 
                isFavorite={isFavorite} 
                toggleFavorite={toggleFavorite} 
            />
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
              <button 
                className="close-search-expanded"
                onClick={() => {
                  setSearchActive(false)
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          )}
        </div>
        
        <button 
          className={`search-circle ${searchActive ? 'active' : ''}`}
          onClick={() => {
            if (searchActive) {
              if (searchQuery.trim()) {
                 setSearchActive(false);
              } else {
                 setSearchActive(false);
              }
            } else {
              setSearchActive(true)
            }
          }}
        >
          <i className="fas fa-search"></i>
        </button>
      </div>

      <style jsx global>{`
        /* Remove paddings globais que possam estar limitando o container */
        body {
            margin: 0;
            padding: 0;
            overflow-x: hidden;
        }

        /* Container Principal: AJUSTE PARA O ALINHAMENTO SUPERIOR */
        .container {
            /* Padding top reduzido para 10px para puxar o conteúdo para perto do cabeçalho */
            padding: 10px 10px 100px 10px !important; 
            max-width: 100vw !important;
            width: 100%;
            box-sizing: border-box;
            margin: 0;
            /* Garante que o conteúdo role abaixo do cabeçalho fixo */
            margin-top: 60px; 
        }
        
        .page-title-home {
            margin-top: 0; /* Remove margem superior adicional */
            margin-bottom: 15px;
            font-size: 1.5rem;
            color: var(--text-primary);
        }

        /* Toast Animation */
        @keyframes toast-slide-up {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        /* GRADE PRINCIPAL E DE BUSCA */
        .content-grid.main-grid,
        .content-grid.live-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
            gap: 10px;
            padding: 0;
            width: 100%;
            margin-top: 10px;
        }

        /* AJUSTE MOBILE: Fixar em 2 colunas lado a lado */
        @media (max-width: 600px) {
            .content-grid.main-grid,
            .content-grid.live-grid {
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 8px;
            }
        }

        /* Garante que a imagem preencha o card */
        .content-card {
            width: 100%;
            position: relative;
            display: block;
        }
        
        .content-poster {
            width: 100%;
            height: auto;
            display: block;
            border-radius: 8px;
            aspect-ratio: 2/3;
            object-fit: cover;
        }

        /* Popup de Busca: AJUSTE PARA O NOVO ALINHAMENTO */
        .live-search-results {
            position: fixed;
            top: 60px; /* Começa logo abaixo do cabeçalho fixo */
            left: 0;
            right: 0;
            bottom: 60px;
            z-index: 15;
            padding: 10px; /* Padding interno para o conteúdo */
            background-color: var(--background);
            overflow-y: auto;
            border-top: none;
            visibility: hidden;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
        }

        .live-search-results.active {
            visibility: visible;
            opacity: 1;
        }
        
        .live-search-loading, .no-results-live {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: var(--secondary);
            font-size: 1rem;
            flex-direction: column;
            padding-top: 50px;
            text-align: center;
        }
        
        .live-search-loading i {
            margin-right: 8px;
            font-size: 1.5rem;
        }
        
        .no-results-live i {
            font-size: 2rem;
            margin-bottom: 10px;
        }

        .header-content {
            justify-content: flex-start;
            width: auto; 
            padding-right: 0;
        }

        .main-nav-bar.search-active {
            padding: 0 10px;
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
