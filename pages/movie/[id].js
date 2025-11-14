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
  const [showPlayerSelector, setShowPlayerSelector] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const STREAM_BASE_URL = 'https://superflixapi.blog'
  const DEFAULT_POSTER = 'https://yoshikawa-bot.github.io/cache/images/6e595b38.jpg'

  useEffect(() => {
    if (id) {
      loadMovie(id)
    }
  }, [id])

  const loadMovie = async (movieId) => {
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

  const openPlayerSelector = () => {
    setShowPlayerSelector(true)
  }

  const selectPlayer = (playerType) => {
    setSelectedPlayer(playerType)
    setShowPlayerSelector(false)
  }

  const getPlayerUrl = () => {
    const identifier = movie.external_ids?.imdb_id || id
    
    if (selectedPlayer === 'superflix') {
      return `${STREAM_BASE_URL}/filme/${identifier}#noLink#transparent#noBackground`
    } else {
      return `https://vidsrc.to/embed/movie/${identifier}`
    }
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

      <Header />

      <main className="container">
        {!selectedPlayer ? (
          <div className="player-selector-overlay active">
            <div className="player-selector-content">
              <h2 className="player-selector-title">
                <i className="fas fa-play-circle"></i>
                Escolha o Player
              </h2>
              <p className="player-selector-subtitle">Selecione a melhor opção para assistir</p>
              
              <div className="player-options">
                <div className="player-option" onClick={() => selectPlayer('superflix')}>
                  <div className="player-option-header">
                    <i className="fas fa-film"></i>
                    <h3>SuperFlix</h3>
                    <span className="player-tag player-tag-dub">Dublado</span>
                  </div>
                  <div className="player-option-info">
                    <p><i className="fas fa-check"></i> Conteúdo dublado disponível</p>
                    <p><i className="fas fa-exclamation-triangle"></i> Mais anúncios</p>
                    <p><i className="fas fa-clock"></i> Carregamento mais lento</p>
                  </div>
                  <button className="player-select-btn">
                    <i className="fas fa-play"></i>
                    Usar SuperFlix
                  </button>
                </div>

                <div className="player-option" onClick={() => selectPlayer('vidsrc')}>
                  <div className="player-option-header">
                    <i className="fas fa-bolt"></i>
                    <h3>VidSrc</h3>
                    <span className="player-tag player-tag-sub">Legendado</span>
                  </div>
                  <div className="player-option-info">
                    <p><i className="fas fa-check"></i> Carregamento rápido</p>
                    <p><i className="fas fa-check"></i> Menos anúncios</p>
                    <p><i className="fas fa-closed-captioning"></i> Apenas legendado</p>
                  </div>
                  <button className="player-select-btn">
                    <i className="fas fa-play"></i>
                    Usar VidSrc
                  </button>
                </div>
              </div>

              <button 
                className="nav-button secondary"
                onClick={() => router.back()}
                style={{marginTop: '1rem'}}
              >
                <i className="fas fa-arrow-left"></i>
                Voltar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="player-wrapper">
              <iframe 
                src={getPlayerUrl()}
                allow="autoplay; encrypted-media; picture-in-picture" 
                allowFullScreen 
                loading="lazy" 
                title={`Yoshikawa Player - ${movie.title}`}
              ></iframe>
            </div>

            <div className="player-header">
              <div className="player-info">
                <span className="player-badge">
                  {selectedPlayer === 'superflix' ? (
                    <>
                      <i className="fas fa-film"></i>
                      SuperFlix
                    </>
                  ) : (
                    <>
                      <i className="fas fa-bolt"></i>
                      VidSrc
                    </>
                  )}
                </span>
                <button 
                  className="nav-button secondary small"
                  onClick={() => setSelectedPlayer(null)}
                >
                  <i className="fas fa-sync"></i>
                  Trocar Player
                </button>
              </div>
            </div>

            <div className="content-info">
              <h1 className="content-title">{movie.title}</h1>
              <div className="content-meta">
                <span><i className="fas fa-calendar"></i> {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}</span>
                <span><i className="fas fa-clock"></i> {movie.runtime ? `${movie.runtime} min` : ''}</span>
                <span><i className="fas fa-tags"></i> {movie.genres ? movie.genres.map(g => g.name).join(', ') : ''}</span>
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
          </>
        )}
      </main>

      <BottomNav />
      <Footer />
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

const BottomNav = () => (
  <div className="bottom-nav-container">
    <div className="main-nav-bar">
      <Link href="/" className="nav-item">
        <i className="fas fa-home"></i>
        <span>Home</span>
      </Link>
      <button className="nav-item" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
        <i className="fas fa-arrow-up"></i>
        <span>Topo</span>
      </button>
      <button className="nav-item" onClick={() => window.location.reload()}>
        <i className="fas fa-redo"></i>
        <span>Recarregar</span>
      </button>
    </div>
  </div>
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
