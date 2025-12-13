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
  
  const [selectedPlayer, setSelectedPlayer] = useState('superflix')
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [showPlayerSelector, setShowPlayerSelector] = useState(false)
  const [showVideoPlayer, setShowVideoPlayer] = useState(false)
  const [isWideScreen, setIsWideScreen] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [toast, setToast] = useState(null)
  const toastTimeoutRef = useRef(null)
  const [showSynopsis, setShowSynopsis] = useState(false)
  const episodeListRef = useRef(null)

  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const STREAM_BASE_URL = 'https://superflixapi.blog'

  const showToast = (message, type = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToast({ message, type, id: Date.now() })
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null)
      toastTimeoutRef.current = null
    }, 3000)
  }

  const removeToast = () => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToast(null)
  }

  useEffect(() => {
    if (id) {
      loadTvShow(id)
      checkIfFavorite()
    }
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    }
  }, [id])
  
  useEffect(() => {
    if (showVideoPlayer) removeToast()
    document.body.style.overflow = showVideoPlayer ? 'hidden' : 'auto'
    return () => { document.body.style.overflow = 'auto' }
  }, [showVideoPlayer]) 

  useEffect(() => {
    if (episodeListRef.current && seasonDetails) {
      const activeCard = episodeListRef.current.querySelector('.episode-card.active')
      if (activeCard) {
        activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [episode, seasonDetails])

  useEffect(() => {
    if (showVideoPlayer) {
      const handleResize = () => {
        setIsWideScreen(window.innerWidth > window.innerHeight)
      }
      handleResize()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [showVideoPlayer])

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
    const fullScreenParam = '&fullScreen=false' 
    if (selectedPlayer === 'superflix') {
      return `${STREAM_BASE_URL}/serie/${id}/${season}/${episode}#noEpList#noLink#transparent#noBackground${fullScreenParam}`
    } else {
      return `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`
    }
  }
  
  const closePopup = (setter) => {
    const element = document.querySelector('.info-popup-overlay.active, .player-selector-bubble.active, .video-overlay-wrapper.active');
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
    if (e.target.classList.contains('info-popup-overlay')) closePopup(setShowInfoPopup);
  };
  
  const handleSelectorOverlayClick = (e) => {
    if (e.target.classList.contains('player-selector-overlay')) closePopup(setShowPlayerSelector);
  };

  const handleVideoOverlayClick = (e) => { e.stopPropagation(); }
  
  const toggleVideoFormat = () => setIsWideScreen(!isWideScreen);
  
  const handleSeasonChange = async (newSeason) => {
    setShowVideoPlayer(false)
    setSeason(newSeason)
    await loadSeasonDetails(newSeason)
  }

  const handleEpisodeChange = (newEpisode) => {
    setShowVideoPlayer(false)
    setEpisode(newEpisode)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePlayerChange = (player) => {
    setSelectedPlayer(player)
    closePopup(setShowPlayerSelector)
    showToast(`Servidor alterado para ${player === 'superflix' ? 'SuperFlix (DUB)' : 'VidSrc (LEG)'}`, 'info')
    if (showVideoPlayer) {
        setShowVideoPlayer(false)
        setTimeout(() => setShowVideoPlayer(true), 100); 
    }
  }

  if (loading) return <div className="loading active"><div className="spinner"></div><p>Carregando...</p></div>
  if (error) return <div className="error-message active"><h3>Erro</h3><p>{error}</p><Link href="/">Voltar</Link></div>
  if (!tvShow) return null

  // Lógica para determinar Próximo e Anterior
  const currentEpisode = seasonDetails?.episodes?.find(ep => ep.episode_number === episode)
  const currentEpIndex = seasonDetails?.episodes?.findIndex(ep => ep.episode_number === episode)
  const prevEp = currentEpIndex > 0 ? seasonDetails?.episodes[currentEpIndex - 1] : null
  const nextEp = (currentEpIndex !== -1 && currentEpIndex < (seasonDetails?.episodes?.length - 1)) ? seasonDetails?.episodes[currentEpIndex + 1] : null

  const availableSeasons = tvShow.seasons?.filter(s => s.season_number > 0 && s.episode_count > 0) || []

  const coverImage = currentEpisode?.still_path 
    ? `https://image.tmdb.org/t/p/original${currentEpisode.still_path}`
    : (tvShow.backdrop_path ? `https://image.tmdb.org/t/p/original${tvShow.backdrop_path}` : null);

  const SingleToast = ({ showVideoPlayer }) => {
    if (!toast || showVideoPlayer) return null;
    return (
      <div className="toast-container">
        <div key={toast.id} className={`toast toast-${toast.type} show`} style={{ animation: 'toast-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
            <div className="toast-icon">
                <i className={`fas ${toast.type === 'success' ? 'fa-check' : toast.type === 'error' ? 'fa-exclamation-triangle' : 'fa-info'}`}></i>
            </div>
            <div className="toast-content">{toast.message}</div>
            <button className="toast-close" onClick={removeToast}><i className="fas fa-times"></i></button>
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
        
        <div className="player-container">
          <div className="player-wrapper">
             <div className="episode-cover-placeholder" onClick={() => setShowVideoPlayer(true)}>
                {coverImage ? <img src={coverImage} alt="Episode Cover" className="cover-img" /> : <div className="cover-fallback"></div>}
                <div className="play-btn-circle-thin">
                    <i className="fas fa-play"></i>
                </div>
             </div>
          </div>
        </div>

        <div className="content-info-streaming">
          <div className="meta-header-row">
            <span className="episode-label-simple">Episódio {episode}</span>
            <div className="season-selector-wrapper">
                <select className="modern-season-select" value={season} onChange={(e) => handleSeasonChange(parseInt(e.target.value))}>
                    {availableSeasons.map(s => <option key={s.season_number} value={s.season_number}>Temporada {s.season_number}</option>)}
                </select>
            </div>
          </div>
          
          <h1 className="clean-episode-title">{currentEpisode?.name || `Episódio ${episode}`}</h1>

          <div className="synopsis-wrapper">
            {showSynopsis && (
                <p className="content-description-streaming fade-in">
                    {currentEpisode?.overview || tvShow.overview || 'Sinopse não disponível.'}
                </p>
            )}
            <button className="synopsis-toggle-btn" onClick={() => setShowSynopsis(!showSynopsis)}>
                {showSynopsis ? <span><i className="fas fa-chevron-up"></i> Ocultar Sinopse</span> : <span><i className="fas fa-align-left"></i> Ler Sinopse</span>}
            </button>
          </div>

          <div className="episodes-list-container">
            <div className="episodes-scroller" ref={episodeListRef}>
                {seasonDetails?.episodes?.map(ep => (
                    <div key={ep.episode_number} className={`episode-card ${ep.episode_number === episode ? 'active' : ''}`} onClick={() => handleEpisodeChange(ep.episode_number)}>
                        <div className="episode-thumbnail">
                            {ep.still_path ? <img src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} alt={`Episódio ${ep.episode_number}`} loading="lazy" /> : <div className="no-thumbnail"><i className="fas fa-play"></i></div>}
                            <div className="episode-number-badge">{ep.episode_number}</div>
                            {ep.episode_number === episode && <div className="playing-indicator">Selecionado</div>}
                        </div>
                        <div className="episode-info-mini"><span className="ep-title">{ep.name}</span></div>
                    </div>
                )) || <div className="loading-eps">Carregando...</div>}
            </div>
          </div>
        </div>

        {showVideoPlayer && (
            <div className="video-overlay-wrapper active" onClick={handleVideoOverlayClick}>
                <div className={`video-player-group ${isWideScreen ? 'widescreen' : 'square'}`} onClick={(e) => e.stopPropagation()}>
                    <div className="video-controls-toolbar">
                        <button className="toolbar-btn" onClick={toggleVideoFormat}><i className={`fas ${isWideScreen ? 'fa-compress' : 'fa-expand'}`}></i></button>
                        <button className="toolbar-btn close-btn" onClick={() => closePopup(setShowVideoPlayer)}><i className="fas fa-times"></i></button>
                    </div>
                    <div className="video-floating-container">
                        <iframe key={episode} src={getPlayerUrl()} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen title={`Player`}></iframe>
                    </div>
                    
                    {/* Botões de Navegação no Popup */}
                    <div className="player-navigation-bar">
                        <button 
                            className={`nav-control-btn ${!prevEp ? 'disabled' : ''}`} 
                            onClick={() => prevEp && setEpisode(prevEp.episode_number)}
                            disabled={!prevEp}
                        >
                            <i className="fas fa-step-backward"></i>
                        </button>
                        
                        <button 
                            className={`nav-control-btn ${!nextEp ? 'disabled' : ''}`} 
                            onClick={() => nextEp && setEpisode(nextEp.episode_number)}
                            disabled={!nextEp}
                        >
                            <i className="fas fa-step-forward"></i>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {showPlayerSelector && (
            <div className="player-selector-overlay menu-overlay active" onClick={handleSelectorOverlayClick}>
                <div className={`player-selector-bubble ${showPlayerSelector ? 'active' : ''}`} onClick={(e) => e.stopPropagation()}>
                    <div className="player-options-bubble">
                        <div className="player-option-bubble" onClick={() => handlePlayerChange('superflix')}>
                            <div className="option-main-line"><i className="fas fa-film"></i><span className="option-name">SuperFlix</span><span className="player-tag-bubble player-tag-dub">DUB</span></div>
                            <span className="option-details">Lento, mas possui dublagem.</span>
                        </div>
                        <div className="player-option-bubble" onClick={() => handlePlayerChange('vidsrc')}>
                            <div className="option-main-line"><i className="fas fa-bolt"></i><span className="option-name">VidSrc</span><span className="player-tag-bubble player-tag-sub">LEG</span></div>
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
                  <img src={tvShow.poster_path ? `https://image.tmdb.org/t/p/w500${tvShow.poster_path}` : ''} className="info-poster" />
                  <div className="info-details">
                    <h2 className="info-title">{tvShow.name}</h2>
                    <div className="info-meta">
                      <span><i className="fas fa-calendar"></i> {tvShow.first_air_date ? new Date(tvShow.first_air_date).getFullYear() : 'N/A'}</span>
                      <span><i className="fas fa-star"></i> {tvShow.vote_average ? tvShow.vote_average.toFixed(1) : 'N/A'}</span>
                      <span><i className="fas fa-tags"></i> {tvShow.genres ? tvShow.genres.map(g => g.name).slice(0, 2).join(', ') : ''}</span>
                    </div>
                    <div className="info-meta">
                        <span><i className="fas fa-tv"></i> {tvShow.number_of_seasons} Temporadas</span>
                        <span><i className="fas fa-language"></i> {tvShow.original_language?.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
                <button className="close-popup-btn" onClick={() => closePopup(setShowInfoPopup)}><i className="fas fa-times"></i> Fechar</button>
              </div>
            </div>
        )}
      </main>

      <SingleToast showVideoPlayer={showVideoPlayer} />
      <BottomNav selectedPlayer={selectedPlayer} onPlayerChange={() => setShowPlayerSelector(true)} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} onShowInfo={() => setShowInfoPopup(true)} />

      <style jsx>{`
        .episode-cover-placeholder {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
        }

        .cover-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0.6;
            transition: opacity 0.3s, transform 0.3s;
        }
        
        .episode-cover-placeholder:hover .cover-img {
            opacity: 0.4;
            transform: scale(1.02);
        }

        .play-btn-circle-thin {
            position: absolute;
            z-index: 2;
            width: 65px;
            height: 65px;
            border: 1px solid rgba(255, 255, 255, 0.6);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 1.4rem;
            background: rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(2px);
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            padding-left: 4px;
        }

        .episode-cover-placeholder:hover .play-btn-circle-thin {
            transform: scale(1.1);
            background: rgba(0, 0, 0, 0.3);
            border-color: #fff;
        }

        .video-overlay-wrapper {
            position: fixed;
            inset: 0;
            background: transparent;
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
            padding: 20px;
        }

        .video-overlay-wrapper.closing { animation: fadeOut 0.3s ease forwards; }

        .video-player-group {
            display: flex;
            flex-direction: column;
            gap: 10px;
            position: relative;
            transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .video-player-group.square { width: min(90vw, 90vh); max-width: 600px; }
        .video-player-group.square .video-floating-container { aspect-ratio: 1 / 1; }
        .video-player-group.widescreen { width: 90vw; max-width: 1200px; }
        .video-player-group.widescreen .video-floating-container { aspect-ratio: 16 / 9; max-height: 80vh; }

        .video-floating-container {
            width: 100%;
            background: #000;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
            border-radius: 24px;
            overflow: hidden;
            position: relative;
            transition: aspect-ratio 0.4s ease;
        }

        .video-floating-container iframe { width: 100%; height: 100%; border: none; }
        .video-controls-toolbar { display: flex; justify-content: flex-end; gap: 12px; padding-right: 8px; }
        
        /* Nav Buttons Styling */
        .player-navigation-bar {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            margin-top: 5px;
        }

        .nav-control-btn {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            font-size: 1.2rem;
            cursor: pointer;
            backdrop-filter: blur(5px);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }

        .nav-control-btn:hover:not(.disabled) {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(1.1);
            border-color: #fff;
        }

        .nav-control-btn.disabled {
            opacity: 0.3;
            cursor: not-allowed;
            background: transparent;
            border-color: rgba(255, 255, 255, 0.05);
        }

        .toolbar-btn {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            font-size: 1.1rem;
            cursor: pointer;
            backdrop-filter: blur(5px);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }

        .toolbar-btn:hover { background: rgba(255, 255, 255, 0.25); transform: scale(1.1); }
        .toolbar-btn.close-btn:hover { background: var(--primary); border-color: var(--primary); }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }

        .toast-container {
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 999;
            width: 100%;
            max-width: 350px;
            padding: 0 10px;
            pointer-events: none;
        }
        
        .toast {
            background: var(--card-bg);
            border: 1px solid var(--border);
            color: var(--text);
            border-radius: 12px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            padding: 10px 15px;
            max-width: 100%;
            pointer-events: auto;
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
        }

        .clean-episode-title {
            font-size: 1.3rem;
            color: var(--text);
            margin: 0 0 0.8rem 0;
            font-weight: 600;
            line-height: 1.3;
        }

        .synopsis-wrapper { margin-bottom: 1.2rem; }
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
            font-weight: 500;
        }
        
        .content-description-streaming {
            margin-bottom: 0.8rem;
            font-size: 0.9rem;
            line-height: 1.5;
            color: var(--text);
            opacity: 0.9;
        }

        .fade-in { animation: fadeIn 0.2s ease-in; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .episodes-scroller {
            display: flex;
            gap: 10px;
            overflow-x: auto;
            padding-bottom: 8px;
            scrollbar-width: none;
        }
        
        .episodes-scroller::-webkit-scrollbar { display: none; }
        .episode-card { min-width: 130px; width: 130px; cursor: pointer; opacity: 0.6; transition: opacity 0.2s; }
        .episode-card.active { opacity: 1; }
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
        .episode-card.active .episode-thumbnail { border-color: var(--primary); }
        .episode-thumbnail img { width: 100%; height: 100%; object-fit: cover; }
        .episode-number-badge { position: absolute; top: 4px; left: 4px; background: rgba(0,0,0,0.7); color: white; padding: 1px 5px; font-size: 0.7rem; border-radius: 4px; font-weight: 600; }
        .playing-indicator { position: absolute; bottom: 0; left: 0; right: 0; background: var(--primary); color: white; font-size: 0.65rem; text-align: center; padding: 2px 0; font-weight: 600; }
        .ep-title { font-size: 0.8rem; color: var(--secondary); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.2; }
        .episode-card.active .ep-title { color: var(--text); font-weight: 600; }
      `}</style>
    </>
  )
}

const Header = () => (
  <header className="github-header">
    <div className="header-content">
      <Link href="/" className="logo-container">
        <img src="https://yoshikawa-bot.github.io/cache/images/14c34900.jpg" alt="Yoshikawa Bot" className="logo-image" />
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
