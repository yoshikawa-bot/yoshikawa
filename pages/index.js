import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  const [releases, setReleases] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [calendar, setCalendar] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [favoritesMenuOpen, setFavoritesMenuOpen] = useState(false)

  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const DEFAULT_POSTER = 'https://yoshikawa-bot.github.io/cache/images/6e595b38.jpg'

  useEffect(() => {
    loadHomeContent()
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
      
      // Calendário
      setCalendar((tvData.results || []).slice(0, 15).map(item => ({
        ...item,
        media_type: 'tv'
      })))

    } catch (error) {
      console.error('Erro ao carregar conteúdo:', error)
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

  const toggleFavoritesMenu = () => {
    setFavoritesMenuOpen(!favoritesMenuOpen)
  }

  const closeFavoritesMenu = () => {
    setFavoritesMenuOpen(false)
  }

  const ContentGrid = ({ items, title }) => (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
      </div>
      <div className="content-grid">
        {items.map(item => (
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
        ))}
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

      <Header onSearch={handleSearch} onToggleFavorites={toggleFavoritesMenu} />

      <FavoritesMenu 
        isOpen={favoritesMenuOpen} 
        onClose={closeFavoritesMenu} 
      />

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
            <ContentGrid items={releases} title="Últimos Lançamentos" />
            <ContentGrid items={recommendations} title="Populares e Recomendações" />
            <ContentGrid items={calendar} title="Calendário de Lançamentos" />
          </div>
        )}
      </main>

      <Footer />
    </>
  )
}

const Header = ({ onSearch, onToggleFavorites }) => {
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

          <button 
            className="favorite-btn" 
            id="headerFavoriteBtn"
            onClick={onToggleFavorites}
            title="Meus Favoritos"
          >
            <i className="fas fa-plus"></i>
          </button>
        </div>
      </div>
    </header>
  )
}

const FavoritesMenu = ({ isOpen, onClose }) => {
  const [favorites, setFavorites] = useState([])

  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = () => {
    const savedFavorites = localStorage.getItem('yoshikawa_favorites')
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }
  }

  const removeFavorite = (id, type) => {
    const updatedFavorites = favorites.filter(fav => !(fav.id == id && fav.type === type))
    setFavorites(updatedFavorites)
    localStorage.setItem('yoshikawa_favorites', JSON.stringify(updatedFavorites))
  }

  const clearFavorites = () => {
    if (confirm('Tem certeza que deseja limpar todos os favoritos?')) {
      setFavorites([])
      localStorage.setItem('yoshikawa_favorites', JSON.stringify([]))
    }
  }

  const exportFavorites = () => {
    if (favorites.length === 0) {
      alert('Não há favoritos para exportar')
      return
    }
    
    const dataStr = JSON.stringify(favorites, null, 2)
    const dataBlob = new Blob([dataStr], {type: 'application/json'})
    
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'yoshikawa_favorites.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div 
        className={`menu-overlay ${isOpen ? 'active' : ''}`} 
        onClick={onClose}
      ></div>
      
      <div className={`favorites-menu ${isOpen ? 'open' : ''}`}>
        <div className="favorites-header">
          <h3>Meus Favoritos</h3>
          <button className="remove-favorite" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="favorites-actions">
          <button className="favorites-action-btn" onClick={exportFavorites}>
            <i className="fas fa-download"></i> Exportar
          </button>
          <button className="favorites-action-btn" onClick={clearFavorites}>
            <i className="fas fa-trash"></i> Limpar
          </button>
        </div>
        
        <div className="favorites-list">
          {favorites.length === 0 ? (
            <div className="no-favorites">
              <i className="fas fa-heart-broken" style={{fontSize: '2rem', marginBottom: '0.5rem'}}></i>
              <p>Nenhum favorito adicionado</p>
            </div>
          ) : (
            favorites.map(fav => (
              <div key={`${fav.type}-${fav.id}`} className="favorite-item">
                <img 
                  src={fav.poster} 
                  alt={fav.title}
                  className="favorite-poster" 
                />
                <div className="favorite-info">
                  <div className="favorite-title">{fav.title}</div>
                  <div className="favorite-meta">
                    {fav.type === 'movie' ? 'Filme' : 'Série'} | {fav.year}
                  </div>
                </div>
                <button 
                  className="remove-favorite" 
                  onClick={() => removeFavorite(fav.id, fav.type)}
                  title="Remover"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
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
