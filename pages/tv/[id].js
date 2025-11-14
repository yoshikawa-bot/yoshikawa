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
  const [selectedPlayer, setSelectedPlayer] = useState('vidsrc')
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [showPlayerSelector, setShowPlayerSelector] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const STREAM_BASE_URL = 'https://superflixapi.blog'

  useEffect(() => {
    if (id) {
      loadTvShow(id)
      checkIfFavorite()
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

  const checkIfFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    const isFav = favorites.some(fav => fav.id === parseInt(id) && fav.type === 'tv')
    setIsFavorite(isFav)
  }

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    
    if (isFavorite) {
      const newFavorites = favorites.filter(fav => !(fav.id === parseInt(id) && fav.type === 'tv'))
      localStorage.setItem('favorites', JSON.stringify(newFavorites))
      setIsFavorite(false)
    } else {
      const newFavorite = {
        id: parseInt(id),
        type: 'tv',
        title: tvShow.name,
        poster: tvShow.poster_path ? `https://image.tmdb.org/t/p/w500${tvShow.poster_path}` : 'https://yoshikawa-bot.github.io/cache/images/6e595b38.jpg',
        year: tvShow.first_air_date ? new Date(tvShow.first_air_date).getFullYear() : 'N/A'
      }
      favorites.push(newFavorite)
      localStorage.setItem('favorites', JSON.stringify(favorites))
      setIsFavorite(true)
    }
  }

  const getPlayerUrl = () => {
    if (selectedPlayer === 'superflix') {
      return `${STREAM_BASE_URL}/serie/${id}/${season}/${episode}#noEpList#noLink#transparent#noBackground`
    } else {
      return `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`
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

  return (
    <>
      <Head>
        <title>{tvShow.name} S{season} E{episode} - Yoshikawa Player</title>
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
              title={`Yoshikawa Player - ${tvShow.name} S${season} E${episode}`}
            ></iframe>
          </div>
        </div>

        <div className="streaming-controls">
          <button 
            className="streaming-control-btn"
            onClick={() => setShowPlayerSelector(!showPlayerSelector)}
          >
            <i className="fas fa-exchange-alt"></i>
            Trocar Player
          </button>
          <button 
            className="streaming-control-btn"
            onClick={() => setShowInfoPopup(true)}
          >
            <i className="fas fa-info-circle"></i>
            Informações
          </button>
          <Link href="/" className="streaming-control-btn">
            <i className="fas fa-home"></i>
            Voltar
          </Link>
        </div>

        <div className="content-info-streaming">
          <h1 className="content-title-streaming">
            <i className="fas fa-tv"></i>
            {tvShow.name} - {currentEpisode?.name || `Episódio ${episode}`}
          </h1>
          <div className="content-meta-streaming">
            <span><i className="fas fa-layer-group"></i> Temporada {season}</span>
            <span><i className="fas fa-tv"></i> Episódio {episode}</span>
            <span><i className="fas fa-clock"></i> {currentEpisode?.runtime ? `${currentEpisode.runtime} min` : ''}</span>
          </div>
          
          <div className={`episode-selector-streaming ${tvShow ? 'active' : ''}`}>
            <div className="selector-group-streaming">
              <span className="selector-label-streaming">Temporada:</span>
              <select 
                className="selector-select-streaming" 
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
            <div className="selector-group-streaming">
              <span className="selector-label-streaming">Episódio:</span>
              <select 
                className="selector-select-streaming" 
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

          <p className="content-description-streaming">
            {currentEpisode?.overview || tvShow.overview || 'Descrição não disponível'}
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
                src={tvShow.poster_path ? `https://image.tmdb.org/t/p/w500${tvShow.poster_path}` : 'https://yoshikawa-bot.github.io/cache/images/6e595b38.jpg'}
                alt={tvShow.name}
                className="info-poster"
              />
              <div className="info-details">
                <h2 className="info-title">{tvShow.name}</h2>
                <div className="info-meta">
                  <span><i className="fas fa-calendar"></i> {tvShow.first_air_date ? new Date(tvShow.first_air_date).getFullYear() : 'N/A'}</span>
                  <span><i className="fas fa-star"></i> {tvShow.vote_average ? tvShow.vote_average.toFixed(1) : 'N/A'}</span>
                  <span><i className="fas fa-tags"></i> {tvShow.genres ? tvShow.genres.map(g => g.name).join(', ') : ''}</span>
                </div>
                <div className="info-meta">
                  <span><i className="fas fa-layer-group"></i> {tvShow.number_of_seasons} temporadas</span>
                  <span><i className="fas fa-tv"></i> {tvShow.number_of_episodes} episódios</span>
                </div>
              </div>
            </div>
            <p className="info-description">
              {tvShow.overview || 'Descrição não disponível.'}
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
        onPlayerChange={setSelectedPlayer}
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
      <button className="nav-item" onClick={() => onPlayerChange(selectedPlayer === 'superflix' ? 'vidsrc' : 'superflix')}>
        <i className={selectedPlayer === 'superflix' ? 'fas fa-film' : 'fas fa-bolt'}></i>
      </button>
      <button className="nav-item" onClick={onShowInfo}>
        <i className="fas fa-info-circle"></i>
      </button>
      <button className={`nav-item ${isFavorite ? 'active' : ''}`} onClick={onToggleFavorite}>
        <i className={isFavorite ? 'fas fa-heart' : 'far fa-heart'}></i>
      </button>
    </div>
  </div>
)
