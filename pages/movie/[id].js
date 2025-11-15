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
  const [selectedPlayer, setSelectedPlayer] = useState('superflix')
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [showPlayerSelector, setShowPlayerSelector] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const STREAM_BASE_URL = 'https://superflixapi.blog'

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
    try {
      const savedFavorites = localStorage.getItem('yoshikawaFavorites')
      const favorites = savedFavorites ? JSON.parse(savedFavorites) : []
      const isFav = favorites.some(fav => fav.id === parseInt(id) && fav.media_type === 'movie')
      setIsFavorite(isFav)
    } catch (error) {
      console.error('Erro ao verificar favoritos:', error)
      setIsFavorite(false)
    }
  }

  const toggleFavorite = () => {
    if (!movie) return
    
    try {
      const savedFavorites = localStorage.getItem('yoshikawaFavorites')
      const favorites = savedFavorites ? JSON.parse(savedFavorites) : []
      
      if (isFavorite) {
        const newFavorites = favorites.filter(fav => !(fav.id === parseInt(id) && fav.media_type === 'movie'))
        localStorage.setItem('yoshikawaFavorites', JSON.stringify(newFavorites))
        setIsFavorite(false)
      } else {
        const newFavorite = {
          id: parseInt(id),
          media_type: 'movie',
          title: movie.title,
          poster_path: movie.poster_path,
          release_date: movie.release_date,
          overview: movie.overview
        }
        const newFavorites = [...favorites, newFavorite]
        localStorage.setItem('yoshikawaFavorites', JSON.stringify(newFavorites))
        setIsFavorite(true)
      }
    } catch (error) {
      console.error('Erro ao alternar favoritos:', error)
    }
  }

  const getPlayerUrl = () => {
    const identifier = movie?.external_ids?.imdb_id || id
    if (selectedPlayer === 'superflix') {
      return `${STREAM_BASE_URL}/filme/${identifier}#noLink#transparent#noBackground`
    } else {
      return `https://vidsrc.to/embed/movie/${identifier}`
    }
  }
  
  const closePopup = (setter) => {
    const element = document.querySelector('.info-popup-overlay.active, .player-selector-bubble.active');
    if (element) {
        element.classList.add('closing');
        setTimeout(() => {
            setter(false);
            element.classList.remove('closing');
        }, 300);
    } else {
        setter(false);
    }
  };
  
  const handleInfoOverlayClick = (e) => {
    if (e.target.classList.contains('info-popup-overlay')) {
      closePopup(setShowInfoPopup);
    }
  };
  
  const handleSelectorOverlayClick = (e) => {
    if (e.target.classList.contains('player-selector-overlay')) {
      closePopup(setShowPlayerSelector);
    }
  };

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
        <Link href="/" className="clear-search-btn" style={{marginTop: '1rem'}}>
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
          
          <div className="content-meta-streaming">
            <span><i className="fas fa-calendar"></i> {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}</span>
            <span><i className="fas fa-clock"></i> {movie.runtime ? `${movie.runtime} min` : ''}</span>
            <span><i className="fas fa-tags"></i> {movie.genres ? movie.genres.map(g => g.name).join(', ') : ''}</span>
          </div>

          <p className="content-description-streaming">
            {movie.overview || 'Descrição não disponível.'}
          </p>
        </div>

        {/* Overlay para o Seletor de Player */}
        {showPlayerSelector && (
            <div className="player-selector-overlay menu-overlay active" onClick={handleSelectorOverlayClick}>
                <div 
                    className={`player-selector-bubble ${showPlayerSelector ? 'active' : ''}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="player-options-bubble">
                        <div 
                            className="player-option-bubble"
                            onClick={() => {
                                setSelectedPlayer('superflix')
                                closePopup(setShowPlayerSelector)
                            }}
                        >
                            <div className="option-main-line">
                                <i className="fas fa-film"></i>
                                <span className="option-name">SuperFlix</span>
                                <span className="player-tag-bubble player-tag-dub">DUB</span>
                            </div>
                            <span className="option-details">Lento, mas possui dublagem.</span>
                        </div>
                        <div 
                            className="player-option-bubble"
                            onClick={() => {
                                setSelectedPlayer('vidsrc')
                                closePopup(setShowPlayerSelector)
                            }}
                        >
                            <div className="option-main-line">
                                <i className="fas fa-bolt"></i>
                                <span className="option-name">VidSrc</span>
                                <span className="player-tag-bubble player-tag-sub">LEG</span>
                            </div>
                            <span className="option-details">Mais rápido, mas apenas legendado.</span>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Popup de Informações */}
        <div 
            className={`info-popup-overlay ${showInfoPopup ? 'active' : ''}`}
            onClick={handleInfoOverlayClick}
        >
          <div 
              className="info-popup-content"
              onClick={(e) => e.stopPropagation()}
          >
            <div className="info-popup-header">
              <img 
                src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://yoshikawa-bot.github.io/cache/images/6e595b38.jpg'}
                alt={movie.title}
                className="info-poster"
              />
              <div className="info-details">
                <h2 className="info-title">{movie.title}</h2>
                <div className="info-meta">
                  <span><i className="fas fa-calendar"></i> {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}</span>
                  <span><i className="fas fa-star"></i> {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
                  <span><i className="fas fa-tags"></i> {movie.genres ? movie.genres.map(g => g.name).join(', ') : ''}</span>
                </div>
                <div className="info-meta">
                  <span><i className="fas fa-clock"></i> {movie.runtime ? `${movie.runtime} minutos` : ''}</span>
                  <span><i className="fas fa-language"></i> {movie.original_language ? movie.original_language.toUpperCase() : ''}</span>
                </div>
              </div>
            </div>
            <p className="info-description">
              {movie.overview || 'Descrição não disponível.'}
            </p>
            <button 
              className="close-popup-btn"
              onClick={() => closePopup(setShowInfoPopup)}
            >
              <i className="fas fa-times"></i>
              Fechar
            </button>
          </div>
        </div>
      </main>

      <BottomNav 
        selectedPlayer={selectedPlayer}
        onPlayerChange={() => setShowPlayerSelector(true)}
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
  <div className="bottom-nav-container">
    <div className="main-nav-bar">
      <Link href="/" className="nav-item">
        <i className="fas fa-home"></i>
        <span>Início</span>
      </Link>
      
      <button className="nav-item" onClick={onShowInfo}>
        <i className="fas fa-info-circle"></i>
        <span>Info</span>
      </button>
      
      <button className={`nav-item ${isFavorite ? 'active' : ''}`} onClick={onToggleFavorite}>
        <i className={isFavorite ? 'fas fa-heart' : 'far fa-heart'}></i>
        <span>Favorito</span>
      </button>
    </div>
    
    <button className="player-circle" onClick={onPlayerChange}>
      <i className={selectedPlayer === 'superflix' ? 'fas fa-film' : 'fas fa-bolt'}></i>
    </button>
  </div>
)
