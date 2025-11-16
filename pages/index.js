import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

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

  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const DEFAULT_POSTER = 'https://yoshikawa-bot.github.io/cache/images/6e595b38.jpg'

  const getItemKey = (item) => `${item.media_type}-${item.id}`

  // Sistema de Toast Notifications
  const showToast = (message, type = 'info') => {
    const id = Date.now()
    const toast = { id, message, type }
    setToasts(prev => [...prev, toast])
    
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
        showToast('Erro ao salvar favoritos', 'info')
      }

      return newFavorites
    })
  }

  const handleSearch = async (query) => {
    if (!query.trim()) return
    
    setLoading(true)
    setSearchQuery(query)
    setSearchActive(false)

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
      
      if (allResults.length === 0) {
        showToast('Nenhum resultado encontrado', 'info')
      }
    } catch (error) {
      console.error('Erro na busca:', error)
      showToast('Erro na busca', 'info')
    } finally {
      setLoading(false)
    }
  }

  const clearSearchResults = () => {
    setSearchResults([])
    setSearchQuery('')
    showToast('Busca limpa', 'info')
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

  const ContentGrid = ({ items, isFavorite, toggleFavorite }) => (
    <section className="section">
      <div className="content-grid">
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
                
                <div className="content-info-card">
                </div>
              </Link>
            )
          })
        ) : (
          <div className="no-content" style={{padding: '2rem', textAlign: 'center', color: 'var(--secondary)', width: '100%'}}>
            {activeSection === 'favorites' ? 'Nenhum favorito adicionado ainda.' : 'Nenhum conteúdo disponível.'}
          </div>
        )}
      </div>
    </section>
  )

  const SearchResults = () => (
    <div className="search-results-section active">
      <div className="search-results-header">
        <h2 className="page-title-home">Resultados para "{searchQuery}"</h2>
        <button 
          className="clear-search-btn"
          onClick={clearSearchResults}
          title="Voltar para a página inicial"
        >
          <i className="fas fa-times"></i>
          <span>Limpar</span>
        </button>
      </div>
      <div className="content-grid">
        {searchResults.map(item => {
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
              />
              
              <button 
                className={`favorite-btn ${isFav ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault() 
                  e.stopPropagation() 
                  toggleFavorite(item)
                }}
                title={isFav ? "Removido dos Favoritos" : "Adicionar aos Favoritos"}
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
              
              <div className="content-info-card">
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )

  const ToastContainer = () => (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type} show`}>
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

      <main className="container">
        {loading && (
          <div className="loading active">
            <div className="spinner"></div>
            <p>Carregando conteúdo...</p>
          </div>
        )}

        {searchResults.length > 0 ? (
          <SearchResults />
        ) : (
          <div className="home-sections">
            <h1 className="page-title-home">{pageTitle}</h1>
            <ContentGrid 
                items={getActiveItems()} 
                isFavorite={isFavorite} 
                toggleFavorite={toggleFavorite} 
            />
          </div>
        )}
      </main>

      <ToastContainer />

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
                type="text"
                className="search-input-expanded" 
                placeholder="Pesquisar..."
                autoFocus
                defaultValue={searchQuery}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(e.target.value)
                  }
                }}
              />
              <button 
                className="close-search-expanded"
                onClick={() => {
                  setSearchActive(false)
                  if (searchResults.length > 0) {
                    clearSearchResults()
                  }
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          )}
        </div>
        
        <button 
          className={`search-circle ${searchActive ? 'active' : ''}`}
          onClick={() => setSearchActive(true)}
        >
          <i className="fas fa-search"></i>
        </button>
      </div>
    </>
  )
}

const Header = () => {
  return (
    <header className="github-header">
      <div className="header-content">
        <Link href="/" className="logo-container">
          <img 
            src="https://yoshikawa-bot.github.io/cache/images/47126171.jpg" 
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
