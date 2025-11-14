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
  const [selectedPlayer, setSelectedPlayer] = useState('vidsrc')
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [showPlayerSelector, setShowPlayerSelector] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const STREAM_BASE_URL = 'https://superflixapi.blog'
  const DEFAULT_POSTER = 'https://yoshikawa-bot.github.io/cache/images/6e595b38.jpg'

  useEffect(() => {
    if (id) {
      loadMovie(id)
      checkIfFavorite()
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

  const checkIfFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    const isFav = favorites.some(fav => fav.id === parseInt(id) && fav.type === 'movie')
    setIsFavorite(isFav)
  }

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    
    if (isFavorite) {
      const newFavorites = favorites.filter(fav => !(fav.id === parseInt(id) && fav.type === 'movie'))
      localStorage.setItem('favorites', JSON.stringify(newFavorites))
      setIsFavorite(false)
    } else {
      const newFavorite = {
        id: parseInt(id),
        type: 'movie',
        title: movie.title,
        poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : DEFAULT_POSTER,
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'
      }
      favorites.push(newFavorite)
      localStorage.setItem('favorites', JSON.stringify(favorites))
      setIsFavorite(true)
    }
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

      <main className="streaming-container">
        <div className="player-container">
          <div className="player-wrapper">
            <iframe 
              src={getPlayerUrl()}
              allow="autoplay; encrypted-media; picture-in-picture" 
              allowFullScreen 
              loading="lazy" 
              title={`Yoshikawa Player - ${movie.title}`}
            ></iframe>
          </div>
        </div>

        <div className="content-info-streaming">
          <h1 className="content-title-streaming">
            {movie.title}
          </h1>
          <p className="content-description-streaming">
            {movie.overview || 'Descrição não disponível.'}
          </p>
        </div>

        {/* Seletor de Player na Bolha */}
        <div className={`player-selector-bubble ${showPlayerSelector ? 'active' : ''}`}>
          <div className="player-options-bubble">
            <div 
              className="player-option-bubble"
              onClick={() => {
                setSelectedPlayer('superflix')
                setShowPlayerSelector(false)
              }}
            >
              <i className="fas fa-film"></i>
              <span>SuperFlix</span>
              <span className="player-tag-bubble player-tag-dub">DUB</span>
            </div>
            <div 
              className="player-option-bubble"
              onClick={() => {
                setSelectedPlayer('vidsrc')
                setShowPlayerSelector(false)
              }}
            >
              <i className="fas fa-bolt"></i>
              <span>VidSrc</span>
              <span className="player-tag-bubble player-tag-sub">LEG</span>
            </div>
          </div>
        </div>

        {/* Popup de Informações */}
        <div className={`info-popup-overlay ${showInfoPopup ? 'active' : ''}`}>
          <div className="info-popup-content">
            <div className="info-popup-header">
              <img 
                src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : DEFAULT_POSTER}
                alt={movie.title}
                className="info-poster"
              />
              <div className="info-details">
                <h2 className="info-title">{movie.title}</h2>
                <div className="info-meta">
                  <span><i className="fas fa-calendar"></i> {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}</span>
                  <span><i className="fas fa-clock"></i> {movie.runtime ? `${movie.runtime} min` : ''}</span>
                  <span><i className="fas fa-star"></i> {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
                </div>
                <div className="info-meta">
                  <span><i className="fas fa-tags"></i> {movie.genres ? movie.genres.map(g => g.name).join(', ') : ''}</span>
                </div>
              </div>
            </div>
            <p className="info-description">
              {movie.overview || 'Descrição não disponível.'}
            </p>
            <button 
              className="close-popup-btn"
              onClick={() => setShowInfoPopup(false)}
            >
              <i className="fas fa-times"></i>
              Fechar
            </button>
          </div>
        </div>
      </main>

      <BottomNav 
        selectedPlayer={selectedPlayer}
        onPlayerChange={() => setShowPlayerSelector(!showPlayerSelector)}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        onShowInfo={() => setShowInfoPopup(true)}
      />
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

const BottomNav = ({ selectedPlayer, onPlayerChange, isFavorite, onToggleFavorite, onShowInfo }) => (
  <div className="bottom-nav-container streaming-mode">
    <div className="main-nav-bar">
      <button className="nav-item" onClick={onPlayerChange}>
        <i className={selectedPlayer === 'superflix' ? 'fas fa-film' : 'fas fa-bolt'}></i>
      </button>
      <button className="nav-item info-circle" onClick={onShowInfo}>
        <i className="fas fa-info-circle"></i>
      </button>
      <button className={`nav-item ${isFavorite ? 'active' : ''}`} onClick={onToggleFavorite}>
        <i className={isFavorite ? 'fas fa-heart' : 'far fa-heart'}></i>
      </button>
    </div>
  </div>
)
