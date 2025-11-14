import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function TVShow() {
  const router = useRouter()
  const { id } = router.query
  const [tvShow, setTvShow] = useState(null)
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [seasonDetails, setSeasonDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const STREAM_BASE_URL = 'https://superflixapi.blog'
  const DEFAULT_POSTER = 'https://yoshikawa-bot.github.io/cache/images/6e595b38.jpg'

  useEffect(() => {
    if (id) {
      loadTvShow(id)
    }
  }, [id])

  useEffect(() => {
    if (tvShow && season) {
      loadSeasonDetails(season)
    }
  }, [tvShow, season])

  const loadTvShow = async (tvId) => {
    try {
      setLoading(true)
      const tvUrl = `https://api.themoviedb.org/3/tv/${tvId}?api_key=${TMDB_API_KEY}&language=pt-BR`
      const tvResponse = await fetch(tvUrl)
      
      if (!tvResponse.ok) throw new Error('Série não encontrada')
      
      const tvData = await tvResponse.json()
      setTvShow(tvData)
      
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadSeasonDetails = async (seasonNumber) => {
    try {
      const seasonUrl = `https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=pt-BR`
      const seasonResponse = await fetch(seasonUrl)
      
      if (seasonResponse.ok) {
        const seasonData = await seasonResponse.json()
        setSeasonDetails(seasonData)
      }
    } catch (err) {
      console.error('Erro ao carregar temporada:', err)
    }
  }

  const handleSeasonChange = (newSeason) => {
    setSeason(newSeason)
    setEpisode(1)
  }

  const handleEpisodeChange = (newEpisode) => {
    setEpisode(newEpisode)
  }

  if (loading) {
    return (
      <div className="loading active">
        <div className="spinner"></div>
        <p>Carregando série...</p>
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

  if (!tvShow) return null

  const currentEpisode = seasonDetails?.episodes?.find(ep => ep.episode_number === episode)
  const playerUrl = `${STREAM_BASE_URL}/serie/${id}/${season}/${episode}#noEpList#noLink#transparent#noBackground`

  return (
    <>
      <Head>
        <title>{tvShow.name} S{season} E{episode} - Yoshikawa Player</title>
      </Head>

      <Header />

      <main className="container">
        <div className="player-wrapper">
          <iframe 
            src={playerUrl}
            allow="autoplay; encrypted-media; picture-in-picture" 
            allowFullScreen 
            loading="lazy" 
            title={`Yoshikawa Player - ${tvShow.name} S${season} E${episode}`}
          ></iframe>
        </div>

        <div className="content-info">
          <h1 className="content-title">
            {tvShow.name} - {currentEpisode?.name || `Episódio ${episode}`}
          </h1>
          <div className="content-meta">
            <span><i className="fas fa-layer-group"></i> Temporada {season}</span>
            <span><i className="fas fa-tv"></i> Episódio {episode}</span>
            <span><i className="fas fa-clock"></i> {currentEpisode?.runtime ? `${currentEpisode.runtime} min` : ''}</span>
          </div>
          
          <div className="episode-selector active">
            <div className="selector-group">
              <span className="selector-label">Temporada:</span>
              <select 
                className="selector-select" 
                value={season}
                onChange={(e) => handleSeasonChange(parseInt(e.target.value))}
              >
                {tvShow.seasons
                  .filter(s => s.season_number > 0 && s.episode_count > 0)
                  .map(season => (
                    <option key={season.season_number} value={season.season_number}>
                      T{season.season_number}
                    </option>
                  ))
                }
              </select>
            </div>
            <div className="selector-group">
              <span className="selector-label">Episódio:</span>
              <select 
                className="selector-select" 
                value={episode}
                onChange={(e) => handleEpisodeChange(parseInt(e.target.value))}
              >
                {seasonDetails?.episodes?.map(ep => (
                  <option key={ep.episode_number} value={ep.episode_number}>
                    E{ep.episode_number}: {ep.name || 'Sem título'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Link href="/" className="nav-button secondary">
            <i className="fas fa-arrow-left"></i>
            Voltar para Home
          </Link>

          <h3 style={{marginTop: '1rem', marginBottom: '0.5rem'}}>Sinopse</h3>
          <p className="content-description">
            {currentEpisode?.overview || tvShow.overview || 'Descrição não disponível'}
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