import { useRouter } from 'next/router'
import { useState, useEffect, useRef } from 'react'
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
  
  // Padrão SuperFlix
  const [selectedPlayer, setSelectedPlayer] = useState('superflix')
  
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [showPlayerSelector, setShowPlayerSelector] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  
  // Estado para notificação única
  const [toast, setToast] = useState(null)
  const toastTimeoutRef = useRef(null)

  const [showSynopsis, setShowSynopsis] = useState(false)
  
  const episodeListRef = useRef(null)

  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const STREAM_BASE_URL = 'https://superflixapi.blog'

  const showToast = (message, type = 'info') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
    }

    // Usamos Date.now() para garantir que o componente remonte e a animação toque novamente
    setToast({ message, type, id: Date.now() })

    toastTimeoutRef.current = setTimeout(() => {
      setToast(null)
      toastTimeoutRef.current = null
    }, 3000)
  }

  const removeToast = () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
    }
    setToast(null)
  }

  useEffect(() => {
    if (id) {
      loadTvShow(id)
      checkIfFavorite()
      setTimeout(() => {
        showToast('Use o botão circular no canto inferior direito para alterar o provedor de conteúdo', 'info')
      }, 1000)
    }
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    }
  }, [id])

  useEffect(() => {
    if (episodeListRef.current && seasonDetails) {
      const activeCard = episodeListRef.current.querySelector('.episode-card.active')
      if (activeCard) {
        activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [episode, seasonDetails])

  useEffect(() => {
    setShowSynopsis(false)
  }, [episode, season])

  const loadTvShow = async (tvId) => {
    try {
      setLoading(true)
      const tvUrl = `https://api.themoviedb.org/3/tv/${tvId}?api_key=${TMDB_API_KEY}&language=pt-BR`
      const tvResponse = await fetch(tvUrl)
      if (!tvResponse.ok) throw new Error('Série não encontrada')
      const tvData = await tvResponse.json()
      setTvShow(tvData)
      
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
        if (seasonData.episodes && seasonData.episodes.length > 0) {
          setEpisode(1)
        }
      } else {
        setSeasonDetails(null)
      }
    } catch (err) {
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePlayerChange = (player) => {
    setSelectedPlayer(player)
    closePopup(setShowPlayerSelector)
    showToast(`Servidor alterado para ${player === 'superflix' ? 'SuperFlix (DUB)' : 'VidSrc (LEG)'}`, 'info')
  }

  if (loading) return <div className="loading active"><div className="spinner"></div><p>Carregando...</p></div>
  if (error) return <div className="error-message active"><h3>Erro</h3><p>{error}</p><Link href="/">Voltar</Link></div>
  if (!tvShow) return null

  const currentEpisode = seasonDetails?.episodes?.find(ep => ep.episode_number === episode)
  const availableSeasons = tvShow.seasons?.filter(s => s.season_number > 0 && s.episode_count > 0) || []

  // Componente de Notificação usando as classes globais originais
  // Apenas adicionamos style={{ animation: ... }}
  const SingleToast = () => {
    if (!toast) return null;
    return (
      <div className="toast-container">
        <div 
            key={toast.id} 
            className={`toast toast-${toast.type} show`}
            style={{ animation: 'toast-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        >
            <div className="toast-icon">
                <i className={`fas ${
                  toast.type === 'success' ? 'fa-check' : 
                  toast.type === 'error' ? 'fa-exclamation-triangle' : 
                  'fa-info'
                }`}></i>
            </div>
            <div className="toast-content">{toast.message}</div>
            <button className="toast-close" onClick={removeToast}>
                <i className="fas fa-times"></i>
            </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>{tvShow.name} - Yoshikawa</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>

      <Header />

      <main className="streaming-container">
        {/* PLAYER AREA */}
        <div className="player-container">
          <div className="player-wrapper">
            <iframe 
              src={getPlayerUrl()}
              allow="autoplay; encrypted-media; picture-in-picture" 
              allowFullScreen 
              loading="lazy" 
              title={`Player`}
            ></iframe>
          </div>
        </div>

        {/* INFO AREA */}
        <div className="content-info-streaming">
            
          {/* Linha Topo: Label "Episódio" + Seletor de Temporada */}
          <div className="meta-header-row">
            <span className="episode-label-simple">Episódio {episode}</span>
            
            <div className="season-selector-wrapper">
                <select 
                    className="modern-season-select"
                    value={season}
                    onChange={(e) => handleSeasonChange(parseInt(e.target.value))}
                >
                    {availableSeasons.map(s => (
                        <option key={s.season_number} value={s.season_number}>
                            Temporada {s.season_number}
                        </option>
                    ))}
                </select>
            </div>
          </div>
          
          {/* Título do Episódio Apenas */}
          <h1 className="clean-episode-title">
             {currentEpisode?.name || `Episódio ${episode}`}
          </h1>

          {/* Sinopse Retrátil */}
          <div className="synopsis-wrapper">
            {showSynopsis && (
                <p className="content-description-streaming fade-in">
                    {currentEpisode?.overview || tvShow.overview || 'Sinopse não disponível.'}
                </p>
            )}
            <button 
                className="synopsis-toggle-btn"
                onClick={() => setShowSynopsis(!showSynopsis)}
            >
                {showSynopsis ? (
                    <span><i className="fas fa-chevron-up"></i> Ocultar Sinopse</span>
                ) : (
                    <span><i className="fas fa-align-left"></i> Ler Sinopse</span>
                )}
            </button>
          </div>

          {/* LISTA DE EPISÓDIOS */}
          <div className="episodes-list-container">
            <div className="episodes-scroller" ref={episodeListRef}>
                {seasonDetails?.episodes?.map(ep => (
                    <div 
                        key={ep.episode_number}
                        className={`episode-card ${ep.episode_number === episode ? 'active' : ''}`}
                        onClick={() => handleEpisodeChange(ep.episode_number)}
                    >
                        <div className="episode-thumbnail">
                            {ep.still_path ? (
                                <img 
                                    src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} 
                                    alt={`Episódio ${ep.episode_number}`}
                                    loading="lazy"
                                />
                            ) : (
                                <div className="no-thumbnail"><i className="fas fa-play"></i></div>
                            )}
                            <div className="episode-number-badge">{ep.episode_number}</div>
                            {ep.episode_number === episode && (
                                <div className="playing-indicator">
                                    Reproduzindo
                                </div>
                            )}
                        </div>
                        <div className="episode-info-mini">
                            <span className="ep-title">{ep.name}</span>
                        </div>
                    </div>
                )) || <div className="loading-eps">Carregando...</div>}
            </div>
          </div>
        </div>

        {/* OVERLAYS (Player Selector - IDÊNTICO AO DE FILMES) */}
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

        {showInfoPopup && (
            <div className="info-popup-overlay active" onClick={handleInfoOverlayClick}>
              <div className="info-popup-content" onClick={(e) => e.stopPropagation()}>
                <div className="info-popup-header">
                  <img src={tvShow.poster_path ? `https://image.tmdb.org/t/p/w200${tvShow.poster_path}` : ''} className="info-poster" />
                  <div className="info-details">
                    <h2 className="info-title">{tvShow.name}</h2>
                    <p>{tvShow.overview}</p>
                  </div>
                </div>
                <button className="close-popup-btn" onClick={() => closePopup(setShowInfoPopup)}>Fechar</button>
              </div>
            </div>
        )}
      </main>

      <SingleToast />
      <BottomNav 
        selectedPlayer={selectedPlayer}
        onPlayerChange={() => setShowPlayerSelector(true)}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        onShowInfo={() => setShowInfoPopup(true)}
      />

      <style jsx>{`
        /* APENAS KEYFRAMES DA ANIMAÇÃO, SEM ESTILIZAR O TOAST EM SI */
        @keyframes toast-slide-up {
          0% { 
            opacity: 0; 
            transform: translateY(20px) scale(0.95); 
          }
          100% { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }

        .meta-header-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }

        .episode-label-simple {
            color: var(--primary); 
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 700;
        }

        .season-selector-wrapper select {
            appearance: none;
            background: var(--card-bg);
            color: var(--text);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 4px 12px;
            font-size: 0.85rem;
            outline: none;
            cursor: pointer;
            backdrop-filter: blur(5px);
            font-family: 'Inter', sans-serif;
            transition: none;
        }

        .season-selector-wrapper select:focus,
        .season-selector-wrapper select:hover {
            border-color: var(--border);
            box-shadow: none;
        }
        
        .season-selector-wrapper select option {
            background: #1a1a1a; 
            color: var(--text);
        }

        .clean-episode-title {
            font-size: 1.3rem;
            color: var(--text);
            margin: 0 0 0.8rem 0;
            font-weight: 600;
            line-height: 1.3;
        }

        .synopsis-wrapper {
            margin-bottom: 1.2rem;
        }
        
        .synopsis-toggle-btn {
            background: none;
            border: none;
            color: var(--secondary);
            font-size: 0.85rem;
            cursor: pointer;
            padding: 0;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: none;
            font-weight: 500;
        }
        
        .synopsis-toggle-btn:hover {
            color: var(--secondary);
        }

        .content-description-streaming {
            margin-bottom: 0.8rem;
            font-size: 0.9rem;
            line-height: 1.5;
            color: var(--text);
            opacity: 0.9;
        }

        .fade-in {
            animation: fadeIn 0.2s ease-in;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .episodes-list-container {
            width: 100%;
        }

        .episodes-scroller {
            display: flex;
            gap: 10px;
            overflow-x: auto;
            padding-bottom: 8px;
            scrollbar-width: none;
        }
        
        .episodes-scroller::-webkit-scrollbar {
            display: none;
        }

        .episode-card {
            min-width: 130px;
            width: 130px;
            cursor: pointer;
            opacity: 0.6;
            transition: opacity 0.2s;
        }

        .episode-card.active {
            opacity: 1;
        }

        .episode-thumbnail {
            position: relative;
            width: 100%;
            aspect-ratio: 16/9;
            border-radius: 8px;
            overflow: hidden;
            background: var(--card-bg);
            margin-bottom: 4px;
            border: 2px solid var(--border);
        }

        .episode-card.active .episode-thumbnail {
            border-color: var(--primary); 
        }

        .episode-thumbnail img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .no-thumbnail {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--card-bg);
            color: var(--secondary);
        }

        .episode-number-badge {
            position: absolute;
            top: 4px;
            left: 4px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 1px 5px;
            font-size: 0.7rem;
            border-radius: 4px;
            font-weight: 600;
        }

        .playing-indicator {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: var(--primary);
            color: white;
            font-size: 0.65rem;
            text-align: center;
            padding: 2px 0;
            font-weight: 600;
        }

        .ep-title {
            font-size: 0.8rem;
            color: var(--secondary);
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            line-height: 1.2;
        }

        .episode-card.active .ep-title {
            color: var(--text);
            font-weight: 600;
        }
      `}</style>
    </>
  )
}

const Header = () => (
  <header className="github-header">
    <div className="header-content">
      <Link href="/" className="logo-container">
        <img src="https://yoshikawa-bot.github.io/cache/images/14c34900.jpg" alt="Yoshikawa" className="logo-image" />
        <div className="logo-text"><span className="logo-name">Yoshikawa</span><span className="beta-tag">STREAMING</span></div>
      </Link>
    </div>
  </header>
)

const BottomNav = ({ selectedPlayer, onPlayerChange, isFavorite, onToggleFavorite, onShowInfo }) => (
  <div className="bottom-nav-container streaming-mode">
    <div className="main-nav-bar">
      <Link href="/" className="nav-item"><i className="fas fa-home"></i><span>Início</span></Link>
      <button className="nav-item" onClick={onShowInfo}><i className="fas fa-info-circle"></i><span>Info</span></button>
      <button className={`nav-item ${isFavorite ? 'active' : ''}`} onClick={onToggleFavorite}>
        <i className={isFavorite ? 'fas fa-heart' : 'far fa-heart'}></i><span>Favorito</span>
      </button>
    </div>
    <button className="player-circle" onClick={onPlayerChange}>
      <i className={selectedPlayer === 'superflix' ? 'fas fa-film' : 'fas fa-bolt'}></i>
    </button>
  </div>
)
