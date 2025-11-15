import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

// Componente principal da página de assistir série
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
      }
    } catch (error) {
      console.error('Erro ao alternar favoritos:', error)
    }
  }

  const getPlayerUrl = () => {
    if (selectedPlayer === 'superflix') {
      return `${STREAM_BASE_URL}/serie/${id}/${season}/${episode}#noEpList#noLink#transparent#noBackground`
    } else {
      return `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`
    }
  }
  
  // Função para fechar popups com animação
  const closePopup = (setter) => {
    const element = document.querySelector('.info-popup-content.active, .player-selector-bubble.active');
    if (element) {
        element.classList.add('closing');
        setTimeout(() => {
            setter(false);
            element.classList.remove('closing');
        }, 400); 
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
        <h3> <i className="fas fa-exclamation-triangle"></i> Ocorreu um erro </h3>
        <p>{error}</p>
        <Link href="/" className="clear-search-btn" style={{marginTop: '1rem'}}>
          <i className="fas fa-home"></i> Voltar para Home 
        </Link>
      </div>
    )
  }

  if (!tvShow) return null

  const currentEpisode = seasonDetails?.episodes?.find(ep => ep.episode_number === episode)

  return (
    <>
      <Head>
        <title>{tvShow.name} T{season} E{episode} | Yoshikawa Player</title>
        <meta name="description" content={`Assistir ${tvShow.name} - Temporada ${season}, Episódio ${episode}.`} />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      
      <Header />

      <main className="streaming-container">
        <div className="player-container">
          <div className="player-wrapper">
            <iframe 
              src={getPlayerUrl()} 
              allowFullScreen
              frameBorder="0"
              scrolling="no"
              allow="autoplay; encrypted-media; picture-in-picture"
            ></iframe>
          </div>
        </div>

        <div className="content-info-streaming">
          <h1 className="content-title-streaming">
            {tvShow.name} - T{season} E{episode}
          </h1>
          <p className="content-description-streaming">
            {currentEpisode?.overview || tvShow.overview || 'Descrição indisponível.'}
          </p>
        </div>

        <div className="episode-selector-container">
          <select 
            className="season-select" 
            value={season} 
            onChange={(e) => handleSeasonChange(parseInt(e.target.value))}
          >
            {tvShow.seasons && tvShow.seasons
              .filter(s => s.season_number > 0)
              .sort((a, b) => a.season_number - b.season_number)
              .map(s => (
                <option key={s.id} value={s.season_number}>
                  Temporada {s.season_number}
                </option>
              ))
            }
          </select>
          
          <div className="episodes-list">
            {seasonDetails && seasonDetails.episodes && seasonDetails.episodes.map(ep => (
              <button
                key={ep.id}
                className={`episode-button ${ep.episode_number === episode ? 'active' : ''}`}
                onClick={() => handleEpisodeChange(ep.episode_number)}
              >
                E{ep.episode_number}
              </button>
            ))}
          </div>
        </div>

      </main>

      {/* POPUP DE INFORMAÇÕES (INFO) */}
      <div 
        className={`info-popup-overlay ${showInfoPopup ? 'active' : ''}`} 
        onClick={handleInfoOverlayClick}
      >
        <div className={`info-popup-content ${showInfoPopup ? 'active' : ''}`}>
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
                <span><i className="fas fa-users"></i> {tvShow.popularity ? tvShow.popularity.toFixed(0) : 'N/A'}</span>
              </div>
              <p className="info-description">{tvShow.overview}</p>
              
              <button 
                className={`favorite-btn info-favorite-btn ${isFavorite ? 'active' : ''}`} 
                onClick={toggleFavorite}
              >
                <i className={isFavorite ? 'fas fa-heart' : 'far fa-heart'}></i> 
                {isFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
              </button>
            </div>
            
            <button className="info-popup-close-btn" onClick={() => closePopup(setShowInfoPopup)}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="info-genres">
            {tvShow.genres && tvShow.genres.map(genre => (
              <span key={genre.id} className="genre-tag">{genre.name}</span>
            ))}
          </div>
        </div>
      </div>
      
      {/* POPUP DE SELEÇÃO DE PLAYER */}
      <div 
        className={`player-selector-overlay ${showPlayerSelector ? 'active' : ''}`}
        onClick={handleSelectorOverlayClick}
      >
        <div className={`player-selector-bubble ${showPlayerSelector ? 'active' : ''}`}>
          <h3>Selecionar Player</h3>
          
          <div 
            className={`player-option-bubble ${selectedPlayer === 'vidsrc' ? 'active' : ''}`}
            onClick={() => { setSelectedPlayer('vidsrc'); closePopup(setShowPlayerSelector); }}
          >
            <div className="option-main-line">
                <i className="fas fa-server"></i>
                <span className="option-name">Player 1 (VidSrc)</span>
                <span className="player-tag-sub">LEG</span>
            </div>
            <div className="option-details">Conteúdo rápido e com legendas (Pode ter anúncios).</div>
          </div>
          
          <div 
            className={`player-option-bubble ${selectedPlayer === 'superflix' ? 'active' : ''}`}
            onClick={() => { setSelectedPlayer('superflix'); closePopup(setShowPlayerSelector); }}
          >
            <div className="option-main-line">
                <i className="fas fa-rocket"></i>
                <span className="option-name">Player 2 (SuperFlix)</span>
                <span className="player-tag-dub">DUB</span>
            </div>
            <div className="option-details">Foco em conteúdo dublado e qualidade.</div>
          </div>

          <button className="close-selector-btn" onClick={() => closePopup(setShowPlayerSelector)}>
            <i className="fas fa-times"></i> Fechar
          </button>

        </div>
      </div>

      <BottomNav
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        onShowInfo={() => setShowInfoPopup(true)}
        onShowSelector={() => setShowPlayerSelector(true)} // Adicionado o seletor de player
      />
    </>
  )
}

// Componentes reutilizáveis
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

const BottomNav = ({ isFavorite, onToggleFavorite, onShowInfo, onShowSelector }) => (
  // FIX: Adicionado 'reproduction-mode' para exibir os ícones corretamente no modo compacto
  <div className="bottom-nav-container reproduction-mode"> 
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

      {/* NOVO: Botão de player selector */}
      <button className="nav-item" onClick={onShowSelector}> 
        <i className="fas fa-video"></i> 
        <span>Player</span>
      </button>

    </div>
  </div>
)
