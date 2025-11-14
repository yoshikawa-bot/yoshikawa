import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

export default function MoviePlayer() {
  const router = useRouter()
  const { id } = router.query
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState([])

  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const DEFAULT_BACKDROP = 'https://yoshikawa-bot.github.io/cache/images/ea6ceee5.jpg'

  useEffect(() => {
    if (id) {
      loadMovieData()
    }
    loadFavorites()
  }, [id])

  const loadMovieData = async () => {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}&language=pt-BR`
      )
      const data = await response.json()
      setMovie(data)
    } catch (error) {
      console.error('Erro ao carregar filme:', error)
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

  const isFavorite = () => {
    return favorites.some(fav => fav.id === movie.id && fav.media_type === 'movie')
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

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <div className="loading-dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
        <p>Carregando filme...</p>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="error-screen">
        <div className="error-content">
          <i className="fas fa-exclamation-triangle"></i>
          <h2>Filme não encontrado</h2>
          <Link href="/" className="nav-button">
            <i className="fas fa-arrow-left"></i>
            Voltar para Home
          </Link>
        </div>
      </div>
    )
  }

  const backdropUrl = movie.backdrop_path 
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : DEFAULT_BACKDROP

  return (
    <>
      <Head>
        <title>{movie.title} - Yoshikawa Player</title>
        <meta name="description" content={movie.overview} />
      </Head>

      {/* Background dinâmico */}
      <div 
        className="streaming-background"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.9)), url(${backdropUrl})`
        }}
      ></div>

      <header className="streaming-header">
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

      <main className="streaming-container">
        <div className="player-section">
          <div className="player-wrapper">
            <iframe
              src={`https://vidsrc.to/embed/movie/${id}`}
              allowFullScreen
              title={`Assistir ${movie.title}`}
            ></iframe>
          </div>

          <button 
            className={`player-favorite-btn ${isFavorite() ? 'active' : ''}`}
            onClick={toggleFavorite}
            title={isFavorite() ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
          >
            <i className={isFavorite() ? 'fas fa-heart' : 'far fa-heart'}></i>
          </button>
        </div>

        <div className="content-info-streaming">
          <h1 className="content-title">{movie.title}</h1>
          
          <div className="content-meta">
            {movie.release_date && (
              <span>{new Date(movie.release_date).getFullYear()}</span>
            )}
            {movie.runtime && (
              <span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}min</span>
            )}
            {movie.vote_average && (
              <span>
                <i className="fas fa-star" style={{color: 'gold', marginRight: '0.25rem'}}></i>
                {movie.vote_average.toFixed(1)}
              </span>
            )}
          </div>

          {movie.genres && movie.genres.length > 0 && (
            <div className="content-genres">
              {movie.genres.map(genre => (
                <span key={genre.id} className="genre-tag">{genre.name}</span>
              ))}
            </div>
          )}

          {movie.overview && (
            <div className="content-description">
              <p>{movie.overview}</p>
            </div>
          )}

          <div className="streaming-actions">
            <Link href="/" className="nav-button secondary">
              <i className="fas fa-arrow-left"></i>
              Voltar para Home
            </Link>
            
            <button className="nav-button" onClick={() => window.location.reload()}>
              <i className="fas fa-redo"></i>
              Recarregar Player
            </button>
          </div>
        </div>
      </main>

      <Link href="/" className="back-to-home active">
        <i className="fas fa-home"></i>
      </Link>
    </>
  )
      }
