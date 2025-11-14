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

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'releases':
        return 'Últimos Lançamentos'
      case 'recommendations':
        return 'Populares e Recomendações'
      case 'favorites':
        return 'Meus Favoritos'
      default:
        return 'Últimos Lançamentos'
    }
  }

  const ContentGrid = ({ items, title }) => (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
      </div>
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
              
              {/* VAMOS ADICIONAR O NOVO WRAPPER DE TEXTO AQUI */}
              <div className="floating-text-wrapper">
                  <div className="content-title-card">{item.title || item.name}</div>
                  <div className="content-year">
                      {item.release_date ? new Date(item.release_date).getFullYear() : 
                       item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A'}
                  </div>
              </div>
              
              {/* O content-info-card ORIGINAL foi esvaziado no CSS para permitir o efeito flutuante */}
              {/* Ele precisa ser mantido ou a lógica de posicionamento pode quebrar se outros elementos usarem o mesmo nome */}
              <div className="content-info-card">
                  {/* Conteúdo movido para .floating-text-wrapper */}
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

      <Header onSearch={handleSearch} />

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
            <ContentGrid items={getActiveItems()} title={getSectionTitle()} />
          </div>
        )}
      </main>

      {/* Container Flutuante de Navegação (ORIGINAL) */}
      {searchResults.length === 0 && (
        <div className="floating-nav-container">
          <button 
            className={`nav-tab ${activeSection === 'releases' ? 'active' : ''}`}
            onClick={() => setActiveSection('releases')}
          >
            <i className="fas fa-film"></i>
            <span>Lançamentos</span>
          </button>
          <button 
            className={`nav-tab ${activeSection === 'recommendations' ? 'active' : ''}`}
            onClick={() => setActiveSection('recommendations')}
          >
            <i className="fas fa-fire"></i>
            <span>Populares</span>
          </button>
          <button 
            className={`nav-tab ${activeSection === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveSection('favorites')}
          >
            <i className="fas fa-heart"></i>
            <span>Favoritos</span>
          </button>
        </div>
      )}

      <Footer />
    </>
  )
}

const Header = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    onSearch(searchQuery)
  }

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
        
        <div className="header-right">
          <form onSubmit={handleSearchSubmit} className="search-container">
            <input 
              type="text" 
              className="search-input" 
              placeholder="Buscar filmes e séries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search-button">
              <i className="fas fa-search"></i>
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}

const Footer = () => (
  <footer>
    <div className="footer-content">
      <p>© 2025 Yoshikawa Bot · Todos os direitos reservados.</p>
      <div className="footer-links">
        <a href="https://yoshikawa-bot.github.io/termos/" className="footer-link" target="_blank" rel="noopener noreferrer">
          Termos de Uso
        </a>
        <a href="https://wa.me/18589258076" className="footer-link" target="_blank" rel="noopener noreferrer">
          Suporte
        </a>
      </div>
    </div>
  </footer>
)
