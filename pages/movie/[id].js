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

  const identifier = movie.external_ids?.imdb_id || id
  const playerUrl = `${STREAM_BASE_URL}/filme/${identifier}#noLink#transparent#noBackground`

  return (
    <>
      <Head>
        <title>{movie.title} - Yoshikawa Player</title>
      </Head>

      <Header />

      <main className="container">
        <div className="player-wrapper">
          <iframe 
            src={playerUrl}
            allow="autoplay; encrypted-media; picture-in-picture" 
            allowFullScreen 
            loading="lazy" 
            title={`Yoshikawa Player - ${movie.title}`}
          ></iframe>
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
      </main>

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
