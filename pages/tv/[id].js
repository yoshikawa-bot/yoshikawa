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
  const [toasts, setToasts] = useState([])

  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const STREAM_BASE_URL = 'https://superflixapi.blog'

  // Sistema de Toast Notifications
  const showToast = (message, type = 'info') => {
    const id = Date.now()
    const toast = { id, message, type }
    setToasts(prev => [...prev, toast])
    
    setTimeout(() => {
      removeToast(id)
    }, 3000)
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  useEffect(() => {
    if (id) {
      loadTvShow(id)
      checkIfFavorite()
      
      // Mostrar notificação sobre troca de servidor sempre que a página for aberta
      setTimeout(() => {
        showToast('Use o botão circular do canto direito para alterar o provedor de conteúdo', 'info')
      }, 1000)
    }
  }, [id])

  const loadTvShow = async (tvId) => {
    try {
      setLoading(true)
      const tvUrl = `https://api.themoviedb.org/3/tv/${tvId}?api_key=${TMDB_API_KEY}&language=pt-BR`
      const tvResponse = await fetch(tvUrl)
      
      if (!tvResponse.ok) throw new Error('Série não encontrada')
      
      const tvData = await tvResponse.json()
      setTvShow(tvData)
      
      // Carregar detalhes da primeira temporada automaticamente
      if (tvData.seasons && tvData.seasons.length > 0) {
        const firstSeason = tvData.seasons.find(s => s.season_number > 0) || tvData.seasons[0]
        if (firstSeason) {
          setSeason(firstSeason.season_number)
          await loadSeasonDetails(firstSeason.season_number)
        }
      }
      
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadSeasonDetails = async (seasonNumber) => {
    try {
      setLoading(true)
      const seasonUrl = `https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=pt-BR`
      const seasonResponse = await fetch(seasonUrl)
      
      if (seasonResponse.ok) {
        const seasonData = await seasonResponse.json()
        setSeasonDetails(seasonData)
        
        // Resetar para o primeiro episódio quando mudar de temporada
        if (seasonData.episodes && seasonData.episodes.length > 0) {
          setEpisode(1)
        }
      } else {
        console.error('Erro ao carregar temporada')
        setSeasonDetails(null)
      }
    } catch (err) {
      console.error('Erro ao carregar temporada:', err)
      setSeasonDetails(null)
    } finally {
      setLoading(false)
    }
  }

  const checkIfFavorite = () => {
    try {
      const savedFavorites = localStorage.getItem('yoshikawaFavorites')
      const favorites = savedFavorites ? JSON.parse(savedFavorites) : []
      const isFav = favorites.some(fav => fav.id === parseInt(id) && fav.media_type === 'tv')
      setIsFavorite(isFav)
    } catch (error) {
      console.error('Erro ao verificar favoritos:', error)
      setIsFavorite(false)
    }
  }

  const toggleFavorite = () => {
    if (!tvShow) return
    
    try {
      const savedFavorites = localStorage.getItem('yoshikawaFavorites')
      const favorites = savedFavorites ? JSON.parse(savedFavorites) : []
      
      if (isFavorite) {
        const newFavorites = favorites.filter(fav => !(fav.id === parseInt(id) && fav.media_type === 'tv'))
        localStorage.setItem('yoshikawaFavorites', JSON.stringify(newFavorites))
        setIsFavorite(false)
        showToast('Removido dos favoritos', 'info')
      } else {
        const newFavorite = {
          id: parseInt(id),
          media_type: 'tv',
          title: tvShow.name,
          poster_path: tvShow.poster_path,
          first_air_date: tvShow.first_air_date,
          overview: tvShow.overview
        }
        const newFavorites = [...favorites, newFavorite]
        localStorage.setItem('yoshikawaFavorites', JSON.stringify(newFavorites))
        setIsFavorite(true)
        showToast('Adicionado aos favoritos!', 'success')
      }
    } catch (error) {
      console.error('Erro ao alternar favoritos:', error)
      showToast('Erro ao salvar favorito', 'info')
    }
  }

  const getPlayerUrl = () => {
    if (selectedPlayer === 'superflix') {
      return `${STREAM_BASE_URL}/serie/${id}/${season}/${episode}#noEpList#noLink#transparent#noBackground`
    } else {
      return `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`
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
  
  const handleSeasonChange = async (newSeason) => {
    setSeason(newSeason)
    await loadSeasonDetails(newSeason)
  }

  const handleEpisodeChange = (newEpisode) => {
    setEpisode(newEpisode)
  }

  const handlePlayerChange = (player) => {
    setSelectedPlayer(player)
    closePopup(setShowPlayerSelector)
    showToast(`Servidor alterado para ${player === 'superflix' ? 'SuperFlix (DUB)' : 'VidSrc (LEG)'}`, 'info')
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
        <Link href="/" className="clear-search-btn" style={{marginTop: '1rem'}}>
          <i className="fas fa-home"></i>
          Voltar para Home
        </Link>
      </div>
    )
  }

  if (!tvShow) return null

  const currentEpisode = seasonDetails?.episodes?.find(ep => ep.episode_number === episode)
  const availableSeasons = tvShow.seasons?.filter(s => s.season_number > 0 && s.episode_count > 0) || []

  const ToastContainer = () => (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type} show`}>
          <div className="toast-icon">
            <i className={`fas ${
              toast.type === 'success' ? 'fa-check' : 
              toast.type === 'error' ? 'fa-exclamation-triangle' : 
              'fa-info'
            }`}></i>
          </div>
          <div className="toast-content">{toast.message}</div>
          <button 
            className="toast-close"
            onClick={() => removeToast(toast.id)}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      ))}
    </div>
  )

  return (
    <>
      <Head>
        <title>{tvShow.name} S{season} E{episode} - Yoshikawa Player</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
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

        <div className="content-info-streaming">
          <h1 className="content-title-streaming">
            {tvShow.name} - {currentEpisode?.name || `Episódio ${episode}`}
          </h1>
          
          <div className={`episode-selector-streaming ${tvShow ? 'active' : ''}`}>
            <div className="selector-group-streaming">
              <span className="selector-label-streaming">Temporada:</span>
              <select 
                className="selector-select-streaming" 
                value={season}
                onChange={(e) => handleSeasonChange(parseInt(e.target.value))}
              >
                {availableSeasons.map(season => (
                  <option key={season.season_number} value={season.season_number}>
                    TP {season.season_number}
                  </option>
                ))}
              </select>
            </div>
            <div className="selector-group-streaming">
              <span className="selector-label-streaming">Episódio:</span>
              <select 
                className="selector-select-streaming" 
                value={episode}
                onChange={(e) => handleEpisodeChange(parseInt(e.target.value))}
                disabled={!seasonDetails?.episodes || seasonDetails.episodes.length === 0}
              >
                {seasonDetails?.episodes?.map(ep => (
                  <option key={ep.episode_number} value={ep.episode_number}>
                    EP {ep.episode_number}
                  </option>
                )) || <option value={1}>Carregando...</option>}
              </select>
            </div>
          </div>

          <p className="content-description-streaming">
            {currentEpisode?.overview || tvShow.overview || 'Descrição não disponível'}
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
                            onClick={() => handlePlayerChange('superflix')}
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
                            onClick={() => handlePlayerChange('vidsrc')}
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
              onClick={() => closePopup(setShowInfoPopup)}
            >
              <i className="fas fa-times"></i>
              Fechar
            </button>
          </div>
        </div>
      </main>

      <ToastContainer />

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
          src="https://yoshikawa-bot.github.io/cache/images/14c34900.jpg" 
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
