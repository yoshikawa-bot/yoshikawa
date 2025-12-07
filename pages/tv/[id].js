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
  const [selectedPlayer, setSelectedPlayer] = useState('vidsrc')
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [showPlayerSelector, setShowPlayerSelector] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [toasts, setToasts] = useState([])
  
  // Estado para controlar a sinopse (Expandida ou não)
  const [showSynopsis, setShowSynopsis] = useState(false)
  
  const episodeListRef = useRef(null)

  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const STREAM_BASE_URL = 'https://superflixapi.blog'

  const showToast = (message, type = 'info') => {
    const id = Date.now()
    const toast = { id, message, type }
    setToasts(prev => [...prev, toast])
    setTimeout(() => removeToast(id), 3000)
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  useEffect(() => {
    if (id) {
      loadTvShow(id)
      checkIfFavorite()
      setTimeout(() => {
        showToast('Use o botão circular para trocar o player', 'info')
      }, 1000)
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

  // Resetar a sinopse quando mudar de episódio
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

  const ToastContainer = () => (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type} show`}>
            <div className="toast-content">{toast.message}</div>
        </div>
      ))}
    </div>
  )

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

          {/* Sinopse Retrátil (Toggle) */}
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
                                    <i className="fas fa-play"></i>
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

        {/* OVERLAYS (Player Selector & Info) */}
        {showPlayerSelector && (
            <div className="player-selector-overlay menu-overlay active" onClick={handleSelectorOverlayClick}>
                <div className={`player-selector-bubble ${showPlayerSelector ? 'active' : ''}`} onClick={(e) => e.stopPropagation()}>
                    <div className="player-options-bubble">
                        <div className="player-option-bubble" onClick={() => handlePlayerChange('superflix')}>
                            <div className="option-main-line">
                                <i className="fas fa-film"></i> <span>SuperFlix</span> <span className="player-tag-bubble player-tag-dub">DUB</span>
                            </div>
                        </div>
                        <div className="player-option-bubble" onClick={() => handlePlayerChange('vidsrc')}>
                            <div className="option-main-line">
                                <i className="fas fa-bolt"></i> <span>VidSrc</span> <span className="player-tag-bubble player-tag-sub">LEG</span>
                            </div>
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

      <ToastContainer />
      <BottomNav 
        selectedPlayer={selectedPlayer}
        onPlayerChange={() => setShowPlayerSelector(true)}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        onShowInfo={() => setShowInfoPopup(true)}
      />

      <style jsx>{`
        /* HEADER E META INFO */
        .meta-header-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            flex-wrap: wrap;
            gap: 10px;
        }

        .episode-label-simple {
            color: var(--primary); /* Usando a cor primária do tema */
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 700;
            text-shadow: 0 0 10px rgba(255, 107, 107, 0.3);
        }

        /* SELETOR DE TEMPORADA - ESTILO GLASS */
        .season-selector-wrapper select {
            appearance: none;
            background: var(--card-bg);
            color: var(--text);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 6px 16px;
            font-size: 0.9rem;
            outline: none;
            cursor: pointer;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            font-family: 'Inter', sans-serif;
        }

        .season-selector-wrapper select:hover {
            border-color: var(--primary);
            background: rgba(255, 255, 255, 0.1);
        }
        
        .season-selector-wrapper select:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.2);
        }

        .season-selector-wrapper select option {
            background: #1a1a1a; /* Fallback escuro para options */
            color: var(--text);
        }

        /* TÍTULO E SINOPSE */
        .clean-episode-title {
            font-size: 1.4rem;
            color: var(--text);
            margin: 0 0 1rem 0;
            font-weight: 600;
            line-height: 1.3;
        }

        .synopsis-wrapper {
            margin-bottom: 2rem;
            background: rgba(0,0,0,0.1);
            border-radius: 12px;
            padding: 10px;
            border: 1px solid transparent;
        }

        .synopsis-toggle-btn {
            background: none;
            border: none;
            color: var(--secondary);
            font-size: 0.85rem;
            cursor: pointer;
            padding: 5px 0;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: color 0.3s;
            font-weight: 500;
        }
        
        .synopsis-toggle-btn:hover {
            color: var(--primary);
        }

        .content-description-streaming {
            margin-bottom: 0.8rem;
            font-size: 0.95rem;
            line-height: 1.6;
            color: var(--text);
            opacity: 0.9;
        }

        .fade-in {
            animation: fadeIn 0.4s ease-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* LISTA DE EPISÓDIOS (SCROLLER) */
        .episodes-list-container {
            width: 100%;
            margin-top: 1rem;
        }

        .episodes-scroller {
            display: flex;
            gap: 15px;
            overflow-x: auto;
            padding: 10px 5px 20px 5px;
            
            /* Estilização da barra de rolagem */
            scrollbar-width: thin;
            scrollbar-color: var(--primary) transparent;
        }

        .episodes-scroller::-webkit-scrollbar {
            height: 6px;
        }
        .episodes-scroller::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
        }
        .episodes-scroller::-webkit-scrollbar-thumb {
            background: var(--primary);
            border-radius: 10px;
        }

        /* CARD DO EPISÓDIO */
        .episode-card {
            min-width: 160px;
            width: 160px;
            cursor: pointer;
            opacity: 0.7;
            transition: all 0.3s ease;
            position: relative;
        }

        .episode-card:hover {
            opacity: 1;
            transform: translateY(-5px);
        }

        .episode-card.active {
            opacity: 1;
            transform: scale(1.02);
        }

        .episode-thumbnail {
            position: relative;
            width: 100%;
            aspect-ratio: 16/9;
            border-radius: 12px;
            overflow: hidden;
            background: var(--card-bg);
            margin-bottom: 8px;
            border: 2px solid var(--border);
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
        }

        /* Borda e Brilho quando ativo */
        .episode-card.active .episode-thumbnail {
            border-color: var(--primary);
            box-shadow: 0 0 15px rgba(255, 107, 107, 0.4);
        }

        .episode-thumbnail img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.5s ease;
        }

        .episode-card:hover .episode-thumbnail img {
            transform: scale(1.1);
        }

        .no-thumbnail {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--card-bg);
            color: var(--secondary);
            backdrop-filter: blur(5px);
        }

        /* BADGES */
        .episode-number-badge {
            position: absolute;
            top: 6px;
            left: 6px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 2px 6px;
            font-size: 0.75rem;
            border-radius: 6px;
            backdrop-filter: blur(4px);
            font-weight: 600;
            border: 1px solid rgba(255,255,255,0.1);
        }

        .playing-indicator {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--primary);
            font-size: 1.5rem;
            backdrop-filter: blur(2px);
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 0.8; }
            50% { opacity: 1; text-shadow: 0 0 10px var(--primary); }
            100% { opacity: 0.8; }
        }

        .episode-info-mini {
            padding: 0 2px;
        }

        .ep-title {
            font-size: 0.85rem;
            color: var(--secondary);
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            line-height: 1.3;
            transition: color 0.3s;
        }

        .episode-card.active .ep-title {
            color: var(--primary);
            font-weight: 600;
        }
        
        .episode-card:hover .ep-title {
            color: var(--text);
        }

        /* Responsividade */
        @media (max-width: 768px) {
            .clean-episode-title {
                font-size: 1.2rem;
            }
            
            .episode-card {
                min-width: 140px;
                width: 140px;
            }
            
            .meta-header-row {
                margin-bottom: 0.5rem;
            }
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
