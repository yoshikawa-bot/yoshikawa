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
  const [activeSection, setActiveSection] = useState('releases') // releases, recommendations, favorites
  const [showSearchOverlay, setShowSearchOverlay] = useState(false)

  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const DEFAULT_POSTER = 'https://yoshikawa-bot.github.io/cache/images/6e595b38.jpg'

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

      // Últimos lançamentos
      const allReleases = [
        ...(moviesData.results || []).map(item => ({...item, media_type: 'movie'})),
        ...(tvData.results || []).map(item => ({...item, media_type: 'tv'}))
      ]
        .filter(item => item.poster_path)
        .sort((a, b) => new Date(b.release_date || b.first_air_date) - new Date(a.release_date || a.first_air_date))
        .slice(0, 15)

      // Conteúdo popular
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
    // Carregar favoritos do localStorage
    try {
      const savedFavorites = localStorage.getItem('yoshikawaFavorites')
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites))
      }
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error)
    }
  }

  const handleSearch = async (query) => {
    if (!query.trim()) return
    
    setLoading(true)
    setSearchQuery(query)
    setShowSearchOverlay(false)

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
    } finally {
      setLoading(false)
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

  const ContentGrid = ({ items }) => (
    <section className="section">
      <div className="content-grid">
        {items.length > 0 ? (
          items.map(item => (
            <Link 
              key={`${item.media_type}-${item.id}`}
              href={`/${item.media_type}/${item.id}`}
              className="content-card"
            >
              <img 
                src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : DEFAULT_POSTER} 
                alt={item.title || item.name}
                className="content-poster"
              />
              <div className="content-info-card">
                <div className="content-title-card">{item.title || item.name}</div>
                <div className="content-year">
                  {item.release_date ? new Date(item.release_date).getFullYear() : 
                   item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A'}
                </div>
              </div>
            </Link>
          ))
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
      <div className="section-header">
        <h2 className="section-title">Resultados da Busca</h2>
        <span style={{color: 'var(--secondary)', marginLeft: 'auto'}}>{searchQuery}</span>
      </div>
      <div className="search-list">
        {searchResults.map(item => (
          <Link
            key={`${item.media_type}-${item.id}`}
            href={`/${item.media_type}/${item.id}`}
            className="search-list-item"
          >
            <img 
              src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : DEFAULT_POSTER}
              alt={item.title || item.name}
              className="search-list-poster"
            />
            <div className="search-list-info">
              <div className="search-list-title">{item.title || item.name}</div>
              <div className="search-list-meta">
                {item.media_type === 'movie' ? 'Filme' : 'Série'} | 
                {item.release_date ? new Date(item.release_date).getFullYear() : 
                 item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A'}
              </div>
              <div className="search-list-overview">
                {item.overview || 'Sinopse não disponível'}
              </div>
            </div>
          </Link>
        ))}
      </div>
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
            <ContentGrid items={getActiveItems()} />
          </div>
        )}
      </main>

      {/* Container Flutuante de Navegação - NOVO FORMATO */}
      {searchResults.length === 0 && (
        <div className="bottom-nav-container">
          <div className="main-nav-bar">
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
          </div>
          
          <button 
            className="search-circle"
            onClick={() => setShowSearchOverlay(true)}
          >
            <i className="fas fa-search"></i>
          </button>
        </div>
      )}

      {/* Overlay de Pesquisa */}
      <div className={`search-overlay ${showSearchOverlay ? 'active' : ''}`}>
        <div className="search-overlay-content">
          <div className="search-overlay-header">
            <h3 className="search-overlay-title">Buscar Conteúdo</h3>
            <button 
              className="close-search-overlay"
              onClick={() => setShowSearchOverlay(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target)
              handleSearch(formData.get('search'))
            }}
            className="overlay-search-container"
          >
            <input 
              type="text" 
              name="search"
              className="overlay-search-input" 
              placeholder="Digite o nome do filme ou série..."
              autoFocus
            />
            <button type="submit" className="overlay-search-button">
              <i className="fas fa-search"></i>
            </button>
          </form>
        </div>
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
