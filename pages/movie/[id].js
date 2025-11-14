import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function Movie() {
  const router = useRouter()
  const { id } = router.query
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [favorites, setFavorites] = useState([])

  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const STREAM_BASE_URL = 'https://superflixapi.blog'
  const DEFAULT_POSTER = 'https://yoshikawa-bot.github.io/cache/images/6e595b38.jpg'
  const DEFAULT_BACKDROP = 'https://yoshikawa-bot.github.io/cache/images/ea6ceee5.jpg'

  const PROVIDERS = [
    {
      id: 'superflix',
      name: 'SuperFlix',
      baseUrl: STREAM_BASE_URL,
      getUrl: (movie, identifier) => `${STREAM_BASE_URL}/filme/${identifier}#noLink#transparent#noBackground`
    },
    {
      id: 'vidsrc',
      name: 'VidSrc',
      baseUrl: 'https://vidsrc.to',
      getUrl: (movie, identifier) => `https://vidsrc.to/embed/movie/${identifier}`
    }
  ]

  useEffect(() => {
    if (id) {
      loadFavorites()
      // Verificar se já tem um provider selecionado
      const savedProvider = localStorage.getItem('preferredProvider')
      if (savedProvider) {
        setSelectedProvider(savedProvider)
        loadMovie(id, savedProvider)
      }
    }
  }, [id])

  const loadMovie = async (movieId, provider = null) => {
    try {
      setLoading(true)
      const movieUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=external_ids,images`
      const movieResponse = await fetch(movieUrl)
      
      if (!movieResponse.ok) throw new Error('Filme não encontrado')
      
      const movieData = await movieResponse.json()
      setMovie(movieData)
      
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
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

  const handleProviderSelect = (providerId) => {
    setSelectedProvider(providerId)
    localStorage.setItem('preferredProvider', providerId)
    if (id) {
      loadMovie(id, providerId)
    }
  }

  const isFavorite = () => {
    return movie && favorites.some(fav => fav.id === movie.id && fav.media_type === 'movie')
  }

  const toggleFavorite = () => {
    if (!movie) return

    setFavorites(prevFavorites => {
      let newFavorites
      if (isFavorite()) {
        newFavorites = prevFavorites.filter(fav => !(fav.id === movie.id && fav.media_type === 'movie'))
      } else {
        const favoriteItem = {
          id: movie.id,
          media_type: 'movie',
          title: movie.title,
          poster_path: movie.poster_path,
          release_date: movie.release_date,
          overview: movie.overview
        }
        newFavorites = [...prevFavorites, favoriteItem]
      }
      
      try {
        localStorage.setItem('yoshikawaFavorites', JSON.stringify(newFavorites))
      } catch (error) {
        console.error('Erro ao salvar favoritos:', error)
      }

      return newFavorites
    })
  }

  const getPlayerUrl = () => {
    if (!movie || !selectedProvider) return ''
    
    const provider = PROVIDERS.find(p => p.id === selectedProvider)
    const identifier = movie.external_ids?.imdb_id || id
    
    return provider ? provider.getUrl(movie, identifier) : ''
  }

  const backdropUrl = movie?.backdrop_path 
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : DEFAULT_BACKDROP

  // Tela de seleção de provider
  if (!selectedProvider && !loading && !error) {
    return (
      <>
        <Head>
          <title>Escolher Player - Yoshikawa</title>
        </Head>

        <div 
          className="provider-select-background"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.9)), url(${backdropUrl})`
          }}
        >
          <Header />

          <div className="provider-select-container">
            <div className="provider-select-card">
              <h2>Escolha o Player</h2>
              <p>Selecione qual serviço de streaming você prefere usar:</p>
              
              <div className="provider-options">
                {PROVIDERS.map(provider => (
                  <button
                    key={provider.id}
                    className="provider-option"
                    onClick={() => handleProviderSelect(provider.id)}
                  >
                    <div className="provider-info">
                      <h3>{provider.name}</h3>
                      <span>{provider.baseUrl}</span>
                    </div>
                    <i className="fas fa-chevron-right"></i>
                  </button>
                ))}
              </div>

              <div className="provider-note">
                <p><i className="fas fa-info-circle"></i> Sua escolha será salva para futuros acessos</p>
              </div>

              <Link href="/" className="nav-button secondary">
                <i className="fas fa-arrow-left"></i>
                Voltar para Home
              </Link>
            </div>
          </div>

          <Footer />
        </div>

        <style jsx>{`
          .provider-select-background {
            min-height: 100vh;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            display: flex;
            flex-direction: column;
          }

          .provider-select-container {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }

          .provider-select-card {
            background: rgba(23, 23, 23, 0.95);
            border: 1px solid #333;
            border-radius: 12px;
            padding: 2rem;
            max-width: 500px;
            width: 100%;
            text-align: center;
            backdrop-filter: blur(10px);
          }

          .provider-select-card h2 {
            color: #fff;
            margin-bottom: 0.5rem;
            font-size: 1.5rem;
          }

          .provider-select-card > p {
            color: #ccc;
            margin-bottom: 2rem;
          }

          .provider-options {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-bottom: 2rem;
          }

          .provider-option {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid #444;
            border-radius: 8px;
            padding: 1rem 1.5rem;
            color: #fff;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .provider-option:hover {
            background: rgba(255, 255, 255, 0.15);
            border-color: #666;
            transform: translateY(-2px);
          }

          .provider-info h3 {
            margin: 0 0 0.25rem 0;
            font-size: 1.1rem;
          }

          .provider-info span {
            color: #aaa;
            font-size: 0.9rem;
          }

          .provider-note {
            background: rgba(255, 193, 7, 0.1);
            border: 1px solid rgba(255, 193, 7, 0.3);
            border-radius: 6px;
            padding: 1rem;
            margin-bottom: 1.5rem;
          }

          .provider-note p {
            color: #ffc107;
            margin: 0;
            font-size: 0.9rem;
          }
        `}</style>
      </>
    )
  }

  if (loading) {
    return (
      <div className="loading active">
        <div className="spinner"></div>
        <p>Carregando filme...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-message active">
        <h3>
          <i className="fas fa-exclamation-triangle"></i>
          Ocorreu um erro
        </h3>
        <p>{error}</p>
        <Link href="/" className="nav-button" style={{marginTop: '1rem'}}>
          <i className="fas fa-home"></i>
          Voltar para Home
        </Link>
      </div>
    )
  }

  if (!movie) return null

  return (
    <>
      <Head>
        <title>{movie.title} - Yoshikawa Player</title>
      </Head>

      {/* Background dinâmico */}
      <div 
        className="streaming-background"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.9)), url(${backdropUrl})`
        }}
      ></div>

      <Header />

      <main className="container">
        <div className="player-section">
          <div className="player-wrapper">
            <iframe 
              src={getPlayerUrl()}
              allow="autoplay; encrypted-media; picture-in-picture" 
              allowFullScreen 
              loading="lazy" 
              title={`Yoshikawa Player - ${movie.title}`}
            ></iframe>
          </div>

          <div className="player-controls">
            <button 
              className={`player-favorite-btn ${isFavorite() ? 'active' : ''}`}
              onClick={toggleFavorite}
              title={isFavorite() ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
            >
              <i className={isFavorite() ? 'fas fa-heart' : 'far fa-heart'}></i>
            </button>

            <button 
              className="provider-change-btn"
              onClick={() => {
                localStorage.removeItem('preferredProvider')
                setSelectedProvider(null)
              }}
              title="Alterar Player"
            >
              <i className="fas fa-exchange-alt"></i>
            </button>
          </div>
        </div>

        <div className="content-info">
          <h1 className="content-title">{movie.title}</h1>
          <div className="content-meta">
            <span><i className="fas fa-calendar"></i> {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}</span>
            <span><i className="fas fa-clock"></i> {movie.runtime ? `${movie.runtime} min` : ''}</span>
            <span><i className="fas fa-tags"></i> {movie.genres ? movie.genres.map(g => g.name).join(', ') : ''}</span>
            {movie.vote_average && (
              <span>
                <i className="fas fa-star" style={{color: 'gold'}}></i> {movie.vote_average.toFixed(1)}
              </span>
            )}
          </div>

          <div className="current-provider">
            <span>Player atual: <strong>{PROVIDERS.find(p => p.id === selectedProvider)?.name}</strong></span>
          </div>
          
          <Link href="/" className="nav-button secondary">
            <i className="fas fa-arrow-left"></i>
            Voltar para Home
          </Link>

          <h3 style={{marginTop: '1rem', marginBottom: '0.5rem'}}>Sinopse</h3>
          <p className="content-description">
            {movie.overview || 'Descrição não disponível.'}
          </p>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .streaming-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          z-index: -1;
        }

        .player-section {
          position: relative;
          margin-bottom: 1rem;
        }

        .player-controls {
          position: absolute;
          top: 1rem;
          right: 1rem;
          display: flex;
          gap: 0.5rem;
          z-index: 10;
        }

        .player-favorite-btn, .provider-change-btn {
          background: rgba(0, 0, 0, 0.7);
          border: 1px solid #444;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .player-favorite-btn:hover, .provider-change-btn:hover {
          background: rgba(0, 0, 0, 0.9);
          border-color: #666;
          transform: scale(1.1);
        }

        .player-favorite-btn.active {
          color: #e74c3c;
          border-color: #e74c3c;
        }

        .current-provider {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid #444;
          border-radius: 6px;
          padding: 0.5rem 1rem;
          margin: 1rem 0;
          color: #ccc;
          font-size: 0.9rem;
        }

        .container {
          position: relative;
          z-index: 1;
        }

        .content-info {
          background: rgba(23, 23, 23, 0.8);
          backdrop-filter: blur(10px);
        }
      `}</style>

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #000;
          color: #fff;
          line-height: 1.6;
        }

        .loading {
          display: none;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          text-align: center;
        }

        .loading.active {
          display: flex;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #333;
          border-left: 4px solid #fff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-message {
          display: none;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          text-align: center;
          padding: 2rem;
        }

        .error-message.active {
          display: flex;
        }

        .error-message h3 {
          color: #e74c3c;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .github-header {
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid #333;
          padding: 1rem 0;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          color: inherit;
        }

        .logo-image {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
        }

        .logo-text {
          display: flex;
          flex-direction: column;
        }

        .logo-name {
          font-weight: bold;
          font-size: 1.25rem;
          color: #fff;
        }

        .beta-tag {
          font-size: 0.75rem;
          color: #ccc;
          background: #333;
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
          align-self: flex-start;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        .player-wrapper {
          position: relative;
          width: 100%;
          padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
          height: 0;
          overflow: hidden;
          border-radius: 8px;
          background: #000;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .player-wrapper iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
          border-radius: 8px;
        }

        .content-info {
          background: #1a1a1a;
          border-radius: 8px;
          padding: 2rem;
          margin-top: 2rem;
          border: 1px solid #333;
        }

        .content-title {
          font-size: 2rem;
          margin-bottom: 1rem;
          color: #fff;
        }

        .content-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.5rem;
          color: #ccc;
        }

        .content-meta span {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .content-meta i {
          color: #666;
        }

        .content-description {
          color: #ccc;
          line-height: 1.6;
          margin-top: 1rem;
        }

        .nav-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #333;
          color: #fff;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9rem;
        }

        .nav-button:hover {
          background: #444;
          transform: translateY(-2px);
        }

        .nav-button.secondary {
          background: transparent;
          border: 1px solid #444;
        }

        .nav-button.secondary:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        footer {
          background: rgba(0, 0, 0, 0.9);
          border-top: 1px solid #333;
          padding: 2rem 0;
          margin-top: 3rem;
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
          text-align: center;
          color: #ccc;
        }

        .footer-links {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-top: 1rem;
        }

        .footer-link {
          color: #999;
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .footer-link:hover {
          color: #fff;
        }
      `}</style>
    </>
  )
}

const Header = () => (
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
