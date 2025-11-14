import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

export default function TvPlayer() {
  const router = useRouter()
  const { id } = router.query
  const [tvShow, setTvShow] = useState(null)
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState([])
  const [selectedSeason, setSelectedSeason] = useState(1)
  const [selectedEpisode, setSelectedEpisode] = useState(1)

  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const DEFAULT_BACKDROP = 'https://yoshikawa-bot.github.io/cache/images/ea6ceee5.jpg'

  useEffect(() => {
    if (id) {
      loadTvShowData()
    }
    loadFavorites()
  }, [id])

  const loadTvShowData = async () => {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_API_KEY}&language=pt-BR`
      )
      const data = await response.json()
      setTvShow(data)
    } catch (error) {
      console.error('Erro ao carregar série:', error)
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
    return favorites.some(fav => fav.id === tvShow.id && fav.media_type === 'tv')
  }

  const toggleFavorite = () => {
    if (!tvShow) return

    setFavorites(prevFavorites => {
      let newFavorites
      if (isFavorite()) {
        newFavorites = prevFavorites.filter(fav => !(fav.id === tvShow.id && fav.media_type === 'tv'))
      } else {
        const favoriteItem = {
          id: tvShow.id,
          media_type: 'tv',
          title: tvShow.name,
          poster_path: tvShow.poster_path,
          first_air_date: tvShow.first_air_date,
          overview: tvShow.overview
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
        <p>Carregando série...</p>
      </div>
    )
  }

  if (!tvShow) {
    return (
      <div className="error-screen">
        <div className="error-content">
          <i className="fas fa-exclamation-triangle"></i>
          <h2>Série não encontrada</h2>
          <Link href="/" className="nav-button">
            <i className="fas fa-arrow-left"></i>
            Voltar para Home
          </Link>
        </div>
      </div>
    )
  }

  const backdropUrl = tvShow.backdrop_path 
    ? `https://image.tmdb.org/t/p/w1280${tvShow.backdrop_path}`
    : DEFAULT_BACKDROP

  return (
    <>
      <Head>
        <title>{tvShow.name} - Yoshikawa Player</title>
        <meta name="description" content={tvShow.overview} />
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
              src={`https://vidsrc.to/embed/tv/${id}/${selectedSeason}/${selectedEpisode}`}
              allowFullScreen
              title={`Assistir ${tvShow.name} - Temporada ${selectedSeason} Episódio ${selectedEpisode}`}
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
          <h1 className="content-title">{tvShow.name}</h1>
          
          <div className="content-meta">
            {tvShow.first_air_date && (
              <span>{new Date(tvShow.first_air_date).getFullYear()}</span>
            )}
            {tvShow.number_of_seasons && (
              <span>{tvShow.number_of_seasons} temporada{tvShow.number_of_seasons > 1 ? 's' : ''}</span>
            )}
            {tvShow.vote_average && (
              <span>
                <i className="fas fa-star" style={{color: 'gold', marginRight: '0.25rem'}}></i>
                {tvShow.vote_average.toFixed(1)}
              </span>
            )}
          </div>

          {tvShow.genres && tvShow.genres.length > 0 && (
            <div className="content-genres">
              {tvShow.genres.map(genre => (
                <span key={genre.id} className="genre-tag">{genre.name}</span>
              ))}
            </div>
          )}

          {tvShow.overview && (
            <div className="content-description">
              <p>{tvShow.overview}</p>
            </div>
          )}

          <div className="episode-selector active">
            <div className="selector-group">
              <label className="selector-label">Temporada:</label>
              <select 
                className="selector-select"
                value={selectedSeason}
                onChange={(e) => {
                  setSelectedSeason(parseInt(e.target.value))
                  setSelectedEpisode(1)
                }}
              >
                {Array.from({ length: tvShow.number_of_seasons || 1 }, (_, i) => i + 1).map(season => (
                  <option key={season} value={season}>
                    Temporada {season}
                  </option>
                ))}
              </select>
            </div>

            <div className="selector-group">
              <label className="selector-label">Episódio:</label>
              <select 
                className="selector-select"
                value={selectedEpisode}
                onChange={(e) => setSelectedEpisode(parseInt(e.target.value))}
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map(episode => (
                  <option key={episode} value={episode}>
                    Episódio {episode}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
