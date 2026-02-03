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

  // --- Sistema de Notificação (Igual Home) ---
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
  // ------------------------------------------

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
      showToast('Erro ao salvar favorito', 'error')
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
    const element = document.querySelector('.popup-overlay.active');
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
  
  const handleOverlayClick = (e, setter) => {
    if (e.target.classList.contains('popup-overlay')) closePopup(setter);
  };

  const toggleVideoFormat = () => setIsWideScreen(!isWideScreen);
  
  const handleSeasonChange = async (newSeason) => {
    setShowVideoPlayer(false)
    setSeason(newSeason)
    await loadSeasonDetails(newSeason)
  }

  const handleEpisodeChange = (newEpisode) => {
    setShowVideoPlayer(false)
    setEpisode(newEpisode)
    // Pequeno scroll para destacar a mudança, opcional
  }

  const handlePlayerChange = (player) => {
    setSelectedPlayer(player)
    closePopup(setShowPlayerSelector)
    showToast(`Player alterado para ${player === 'superflix' ? 'SuperFlix' : 'VidSrc'}`, 'success')
    if (showVideoPlayer) {
        setShowVideoPlayer(false)
        setTimeout(() => setShowVideoPlayer(true), 100); 
    }
  }

  if (loading) return <div className="loading-screen"><div className="spinner"></div><p>Carregando...</p></div>
  if (error) return <div className="error-screen"><h3>Erro</h3><p>{error}</p><Link href="/" className="back-link">Voltar</Link></div>
  if (!tvShow) return null

  const currentEpisode = seasonDetails?.episodes?.find(ep => ep.episode_number === episode)
  const currentEpIndex = seasonDetails?.episodes?.findIndex(ep => ep.episode_number === episode)
  const prevEp = currentEpIndex > 0 ? seasonDetails?.episodes[currentEpIndex - 1] : null
  const nextEp = (currentEpIndex !== -1 && currentEpIndex < (seasonDetails?.episodes?.length - 1)) ? seasonDetails?.episodes[currentEpIndex + 1] : null

  const availableSeasons = tvShow.seasons?.filter(s => s.season_number > 0 && s.episode_count > 0) || []

  // Imagem de fundo da página (Backdrop)
  const backdropImage = tvShow.backdrop_path ? `https://image.tmdb.org/t/p/original${tvShow.backdrop_path}` : null;
  
  // Imagem de capa do player (Still do episódio ou Backdrop)
  const coverImage = currentEpisode?.still_path 
    ? `https://image.tmdb.org/t/p/original${currentEpisode.still_path}`
    : backdropImage;

  return (
    <>
      <Head>
        <title>{tvShow.name} | Yoshikawa</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <meta name="theme-color" content="#0D1017" />
      </Head>

      {/* Background Global Imersivo */}
      <div className="global-backdrop">
        {backdropImage && <img src={backdropImage} alt="" />}
        <div className="backdrop-overlay"></div>
      </div>

      <Header />

      <main className="main-content">
        
        {/* Seção Principal: Estilo Clássico Modernizado */}
        <section className="hero-player-section">
            <div className="player-placeholder-card" onClick={() => setShowVideoPlayer(true)}>
                <div className="placeholder-image">
                    {coverImage ? <img src={coverImage} alt="Cover" /> : <div className="no-img"></div>}
                </div>
                <div className="play-overlay">
                    <div className="play-button-pulse">
                        <i className="fas fa-play"></i>
                    </div>
                    <span className="play-text">Assistir Episódio {episode}</span>
                </div>
            </div>

            <div className="info-bar">
                <div className="info-left">
                    <h1 className="show-title">{tvShow.name}</h1>
                    <div className="episode-meta">
                        <span className="season-tag">Temporada {season}</span>
                        <span className="episode-title-tag">{currentEpisode?.name || `Episódio ${episode}`}</span>
                    </div>
                </div>
                <div className="info-right">
                    <div className="season-select-container">
                        <select value={season} onChange={(e) => handleSeasonChange(parseInt(e.target.value))}>
                            {availableSeasons.map(s => <option key={s.season_number} value={s.season_number}>T{s.season_number}</option>)}
                        </select>
                        <i className="fas fa-chevron-down"></i>
                    </div>
                </div>
            </div>

            <div className="synopsis-box">
               <p className={showSynopsis ? 'expanded' : ''} onClick={() => setShowSynopsis(!showSynopsis)}>
                   {currentEpisode?.overview || tvShow.overview || 'Sinopse indisponível.'}
               </p>
               <button className="read-more-btn" onClick={() => setShowSynopsis(!showSynopsis)}>
                   {showSynopsis ? 'Ler menos' : 'Ler mais'}
               </button>
            </div>
        </section>

        {/* Lista de Episódios Horizontal (Estilo Carrossel) */}
        <section className="episodes-section">
            <h3 className="section-title">Episódios</h3>
            <div className="episodes-scroller" ref={episodeListRef}>
                {seasonDetails?.episodes?.map(ep => (
                    <div key={ep.episode_number} className={`episode-card ${ep.episode_number === episode ? 'active' : ''}`} onClick={() => handleEpisodeChange(ep.episode_number)}>
                        <div className="ep-thumb">
                            {ep.still_path ? <img src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} alt={`EP ${ep.episode_number}`} loading="lazy" /> : <div className="no-thumb"><i className="fas fa-image"></i></div>}
                            <span className="ep-num">#{ep.episode_number}</span>
                            {ep.episode_number === episode && <div className="playing-badge"><i className="fas fa-play"></i></div>}
                        </div>
                        <div className="ep-info">
                            <span className="ep-name">{ep.name}</span>
                            <span className="ep-duration">{ep.runtime ? `${ep.runtime} min` : 'N/A'}</span>
                        </div>
                    </div>
                )) || <div className="loading-eps">Carregando episódios...</div>}
            </div>
        </section>

      </main>

      {/* --- POPUPS E MODAIS (Estilo Home) --- */}

      {/* Video Player Modal */}
      {showVideoPlayer && (
            <div className="popup-overlay active video-mode" onClick={(e) => handleOverlayClick(e, setShowVideoPlayer)}>
                <div className={`video-container ${isWideScreen ? 'wide' : ''}`} onClick={(e) => e.stopPropagation()}>
                    <div className="video-header">
                        <span>T{season}:E{episode} - {currentEpisode?.name}</span>
                        <div className="video-actions">
                            <button onClick={toggleVideoFormat}><i className={`fas ${isWideScreen ? 'fa-compress' : 'fa-expand'}`}></i></button>
                            <button onClick={() => closePopup(setShowVideoPlayer)} className="close-btn"><i className="fas fa-times"></i></button>
                        </div>
                    </div>
                    
                    <div className="iframe-wrapper">
                        <iframe src={getPlayerUrl()} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen></iframe>
                    </div>
                    
                    <div className="video-footer">
                        <button className="nav-btn" disabled={!prevEp} onClick={() => prevEp && setEpisode(prevEp.episode_number)}>
                            <i className="fas fa-backward"></i> Anterior
                        </button>
                        <button className="nav-btn" disabled={!nextEp} onClick={() => nextEp && setEpisode(nextEp.episode_number)}>
                            Próximo <i className="fas fa-forward"></i>
                        </button>
                    </div>
                </div>
            </div>
      )}

      {/* Player Selector Modal */}
      {showPlayerSelector && (
            <div className="popup-overlay active" onClick={(e) => handleOverlayClick(e, setShowPlayerSelector)}>
                <div className="popup-card" onClick={(e) => e.stopPropagation()}>
                    <div className="popup-header">
                        <h3>Escolha o Player</h3>
                        <button onClick={() => closePopup(setShowPlayerSelector)}><i className="fas fa-times"></i></button>
                    </div>
                    <div className="popup-body">
                        <div className={`option-item ${selectedPlayer === 'superflix' ? 'selected' : ''}`} onClick={() => handlePlayerChange('superflix')}>
                            <div className="icon"><i className="fas fa-film"></i></div>
                            <div className="text">
                                <strong>SuperFlix</strong>
                                <span>Dublado/Legendado • Estável</span>
                            </div>
                            <div className="check"><i className="fas fa-check-circle"></i></div>
                        </div>
                        <div className={`option-item ${selectedPlayer === 'vidsrc' ? 'selected' : ''}`} onClick={() => handlePlayerChange('vidsrc')}>
                            <div className="icon"><i className="fas fa-bolt"></i></div>
                            <div className="text">
                                <strong>VidSrc</strong>
                                <span>Legendado • Rápido</span>
                            </div>
                            <div className="check"><i className="fas fa-check-circle"></i></div>
                        </div>
                    </div>
                </div>
            </div>
      )}

      {/* Info Modal */}
      {showInfoPopup && (
            <div className="popup-overlay active" onClick={(e) => handleOverlayClick(e, setShowInfoPopup)}>
              <div className="popup-card info-card" onClick={(e) => e.stopPropagation()}>
                <div className="info-header-img">
                     <img src={tvShow.backdrop_path ? `https://image.tmdb.org/t/p/w500${tvShow.backdrop_path}` : ''} />
                     <button className="close-corner" onClick={() => closePopup(setShowInfoPopup)}><i className="fas fa-times"></i></button>
                </div>
                <div className="popup-content-scroll">
                    <h2>{tvShow.name}</h2>
                    <div className="meta-row">
                      <span className="badge">{new Date(tvShow.first_air_date).getFullYear()}</span>
                      <span className="badge star"><i className="fas fa-star"></i> {tvShow.vote_average.toFixed(1)}</span>
                      <span className="badge">{tvShow.number_of_seasons} Temps</span>
                    </div>
                    <p className="overview-text">{tvShow.overview}</p>
                    <div className="genres-list">
                        {tvShow.genres?.map(g => <span key={g.id}>{g.name}</span>)}
                    </div>
                </div>
              </div>
            </div>
      )}

      {/* --- NOTIFICAÇÃO (Toast) --- */}
      {toast && !showVideoPlayer && (
        <div className={`toast-notification type-${toast.type}`}>
            <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : toast.type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}`}></i>
            <span>{toast.message}</span>
        </div>
      )}

      <BottomNav selectedPlayer={selectedPlayer} onPlayerChange={() => setShowPlayerSelector(true)} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} onShowInfo={() => setShowInfoPopup(true)} />

      <style jsx>{`
        /* --- GLOBAL & BACKGROUND --- */
        .global-backdrop {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            z-index: -1;
        }
        .global-backdrop img {
            width: 100%; height: 100%; object-fit: cover;
            filter: blur(15px) brightness(0.4);
            transform: scale(1.1);
        }
        .backdrop-overlay {
            position: absolute; inset: 0;
            background: linear-gradient(to bottom, rgba(13,16,23,0.8), #0D1017);
        }

        .main-content {
            padding: 80px 20px 100px 20px;
            max-width: 1000px;
            margin: 0 auto;
        }

        /* --- HERO PLAYER SECTION (Clássico Modernizado) --- */
        .hero-player-section {
            margin-bottom: 30px;
            animation: fadeIn 0.5s ease;
        }

        .player-placeholder-card {
            position: relative;
            width: 100%;
            aspect-ratio: 16/9;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            border: 1px solid rgba(255,255,255,0.1);
            cursor: pointer;
            group: hover;
            margin-bottom: 20px;
        }

        .placeholder-image img {
            width: 100%; height: 100%; object-fit: cover;
            transition: transform 0.5s ease;
        }
        .player-placeholder-card:hover .placeholder-image img {
            transform: scale(1.05);
        }

        .play-overlay {
            position: absolute; inset: 0;
            background: rgba(0,0,0,0.3);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 15px;
            transition: background 0.3s;
        }
        .player-placeholder-card:hover .play-overlay {
            background: rgba(0,0,0,0.5);
        }

        .play-button-pulse {
            width: 70px; height: 70px;
            background: var(--primary, #58a6ff);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 24px; color: white;
            box-shadow: 0 0 0 0 rgba(88, 166, 255, 0.7);
            animation: pulse-blue 2s infinite;
            transition: transform 0.2s;
        }
        .player-placeholder-card:hover .play-button-pulse {
            transform: scale(1.1);
        }
        .play-text {
            color: white; font-weight: 600; text-transform: uppercase;
            letter-spacing: 1px; font-size: 0.9rem;
            text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }

        @keyframes pulse-blue {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(88, 166, 255, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 15px rgba(88, 166, 255, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(88, 166, 255, 0); }
        }

        /* --- INFO BAR --- */
        .info-bar {
            display: flex; justify-content: space-between; align-items: flex-start;
            margin-bottom: 15px;
        }
        .show-title {
            font-size: 1.8rem; margin: 0 0 5px 0;
            color: white; font-weight: 700;
        }
        .episode-meta {
            display: flex; gap: 10px; align-items: center;
        }
        .season-tag {
            background: rgba(255,255,255,0.1); padding: 2px 8px;
            border-radius: 4px; font-size: 0.8rem; color: #ccc;
        }
        .episode-title-tag {
            color: var(--primary, #58a6ff); font-weight: 600; font-size: 0.9rem;
        }

        .season-select-container {
            position: relative;
        }
        .season-select-container select {
            appearance: none;
            background: #161B22; border: 1px solid #30363d;
            color: white; padding: 8px 30px 8px 15px;
            border-radius: 8px; cursor: pointer;
            font-size: 0.9rem; outline: none;
        }
        .season-select-container i {
            position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
            pointer-events: none; color: #8b949e; font-size: 0.8rem;
        }

        .synopsis-box p {
            color: #8b949e; font-size: 0.95rem; line-height: 1.5;
            display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
            overflow: hidden; margin: 0;
            transition: all 0.3s;
        }
        .synopsis-box p.expanded { -webkit-line-clamp: unset; }
        .read-more-btn {
            background: none; border: none; padding: 5px 0;
            color: var(--primary, #58a6ff); cursor: pointer; font-size: 0.85rem;
        }

        /* --- EPISODES LIST (Carrossel) --- */
        .episodes-section { margin-top: 20px; }
        .section-title { color: white; margin-bottom: 15px; font-size: 1.2rem; border-left: 4px solid var(--primary, #58a6ff); padding-left: 10px; }
        
        .episodes-scroller {
            display: flex; gap: 15px; overflow-x: auto;
            padding-bottom: 15px; scroll-behavior: smooth;
        }
        .episodes-scroller::-webkit-scrollbar { height: 6px; }
        .episodes-scroller::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
        .episodes-scroller::-webkit-scrollbar-track { background: transparent; }

        .episode-card {
            min-width: 160px; width: 160px;
            background: #161B22; border: 1px solid #30363d;
            border-radius: 12px; overflow: hidden;
            cursor: pointer; transition: all 0.2s;
        }
        .episode-card:hover { transform: translateY(-5px); border-color: #8b949e; }
        .episode-card.active { border-color: var(--primary, #58a6ff); box-shadow: 0 0 15px rgba(88, 166, 255, 0.15); }

        .ep-thumb {
            position: relative; aspect-ratio: 16/9; overflow: hidden;
        }
        .ep-thumb img { width: 100%; height: 100%; object-fit: cover; opacity: 0.7; }
        .episode-card.active .ep-thumb img { opacity: 1; }
        .ep-num {
            position: absolute; bottom: 5px; right: 5px;
            background: rgba(0,0,0,0.8); color: white;
            font-size: 0.7rem; padding: 2px 6px; border-radius: 4px;
        }
        .playing-badge {
            position: absolute; inset: 0;
            display: flex; align-items: center; justify-content: center;
            background: rgba(88, 166, 255, 0.4); color: white;
        }

        .ep-info { padding: 10px; }
        .ep-name {
            display: block; font-size: 0.85rem; color: #c9d1d9;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            margin-bottom: 4px;
        }
        .episode-card.active .ep-name { color: white; font-weight: 600; }
        .ep-duration { font-size: 0.75rem; color: #8b949e; }

        /* --- TOASTS (Igual Home) --- */
        .toast-notification {
            position: fixed; top: 90px; left: 50%; transform: translateX(-50%);
            background: rgba(22, 27, 34, 0.9); backdrop-filter: blur(10px);
            border: 1px solid #30363d;
            color: white; padding: 10px 20px;
            border-radius: 50px; z-index: 10000;
            display: flex; align-items: center; gap: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .toast-notification.type-success i { color: #2ea043; }
        .toast-notification.type-error i { color: #f85149; }
        .toast-notification.type-info i { color: #58a6ff; }
        @keyframes slideDown { from { transform: translate(-50%, -20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }

        /* --- POPUPS E MODAIS (Estilo Home) --- */
        .popup-overlay {
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.8); backdrop-filter: blur(5px);
            z-index: 9999; display: flex; align-items: center; justify-content: center;
            opacity: 0; pointer-events: none; transition: opacity 0.3s;
        }
        .popup-overlay.active { opacity: 1; pointer-events: auto; }
        .popup-overlay.closing { opacity: 0; }

        .popup-card {
            background: #161B22; border: 1px solid #30363d;
            border-radius: 12px; width: 90%; max-width: 400px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            transform: scale(0.9); transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            overflow: hidden;
        }
        .popup-overlay.active .popup-card { transform: scale(1); }
        .popup-overlay.closing .popup-card { transform: scale(0.9); }

        .popup-header {
            padding: 15px 20px; border-bottom: 1px solid #30363d;
            display: flex; justify-content: space-between; align-items: center;
        }
        .popup-header h3 { margin: 0; color: white; font-size: 1rem; }
        .popup-header button { background: none; border: none; color: #8b949e; cursor: pointer; font-size: 1.1rem; }
        
        .popup-body { padding: 10px; }
        .option-item {
            display: flex; align-items: center; gap: 15px;
            padding: 12px; border-radius: 8px; cursor: pointer;
            transition: background 0.2s; border: 1px solid transparent;
        }
        .option-item:hover { background: rgba(255,255,255,0.05); }
        .option-item.selected { background: rgba(88, 166, 255, 0.1); border-color: rgba(88, 166, 255, 0.3); }
        
        .option-item .icon { width: 32px; height: 32px; background: #21262d; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #c9d1d9; }
        .option-item .text { display: flex; flex-direction: column; flex: 1; }
        .option-item .text strong { color: white; font-size: 0.9rem; }
        .option-item .text span { color: #8b949e; font-size: 0.75rem; }
        .option-item .check { opacity: 0; color: var(--primary, #58a6ff); }
        .option-item.selected .check { opacity: 1; }

        /* Video Player Specifics */
        .video-container {
            width: 100%; max-width: 800px; background: black;
            border-radius: 12px; overflow: hidden;
            display: flex; flex-direction: column;
            box-shadow: 0 0 50px rgba(0,0,0,0.8);
        }
        .video-container.wide { max-width: 95vw; height: 85vh; }
        
        .video-header {
            padding: 10px 15px; background: #161B22; color: #c9d1d9; font-size: 0.9rem;
            display: flex; justify-content: space-between; align-items: center;
        }
        .video-actions button { background: none; border: none; color: white; margin-left: 15px; cursor: pointer; }
        
        .iframe-wrapper { flex: 1; background: black; position: relative; }
        .iframe-wrapper iframe { width: 100%; height: 100%; border: none; min-height: 400px; }
        .video-container.wide .iframe-wrapper iframe { height: 100%; }

        .video-footer {
            padding: 10px; background: #161B22; display: flex; justify-content: center; gap: 20px;
        }
        .nav-btn {
            background: #30363d; border: none; color: white;
            padding: 8px 16px; border-radius: 6px; cursor: pointer;
            display: flex; align-items: center; gap: 8px; font-size: 0.85rem;
        }
        .nav-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .nav-btn:hover:not(:disabled) { background: #58a6ff; }

        /* Info Popup Styles */
        .info-card { max-width: 500px; }
        .info-header-img { position: relative; height: 180px; }
        .info-header-img img { width: 100%; height: 100%; object-fit: cover; }
        .info-header-img::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to top, #161B22, transparent); }
        .close-corner { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.5); border: none; color: white; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; z-index: 2; }
        
        .popup-content-scroll { padding: 20px; margin-top: -40px; position: relative; z-index: 1; }
        .popup-content-scroll h2 { color: white; margin: 0 0 10px 0; font-size: 1.5rem; text-shadow: 0 2px 4px rgba(0,0,0,0.8); }
        .meta-row { display: flex; gap: 8px; margin-bottom: 15px; }
        .badge { background: #30363d; color: #c9d1d9; font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; border: 1px solid #484f58; }
        .badge.star { color: #e3b341; border-color: rgba(227, 179, 65, 0.3); }
        .overview-text { color: #8b949e; font-size: 0.9rem; line-height: 1.5; margin-bottom: 15px; }
        .genres-list { display: flex; flex-wrap: wrap; gap: 6px; }
        .genres-list span { color: var(--primary, #58a6ff); font-size: 0.8rem; background: rgba(88, 166, 255, 0.1); padding: 2px 8px; border-radius: 10px; }

        /* Loading & Error */
        .loading-screen, .error-screen {
            height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; background: #0D1017;
        }
        .spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #58a6ff; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 15px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}

// Header Padrão Home
const Header = () => (
  <header className="fixed-header">
    <div className="header-inner">
      <Link href="/" className="logo-area">
        <img src="https://yoshikawa-bot.github.io/cache/images/14c34900.jpg" alt="Logo" />
        <span>Yoshikawa</span>
      </Link>
      <div className="header-actions">
        {/* Espaço para search ou avatar se necessário */}
      </div>
    </div>
    <style jsx>{`
      .fixed-header {
        position: fixed; top: 0; left: 0; right: 0;
        height: 60px; z-index: 100;
        background: rgba(13, 16, 23, 0.7);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid rgba(255,255,255,0.05);
      }
      .header-inner {
        max-width: 1200px; margin: 0 auto; height: 100%;
        display: flex; align-items: center; justify-content: space-between;
        padding: 0 20px;
      }
      .logo-area { display: flex; align-items: center; gap: 10px; text-decoration: none; }
      .logo-area img { width: 32px; height: 32px; border-radius: 50%; }
      .logo-area span { color: white; font-weight: 700; font-size: 1.1rem; letter-spacing: -0.5px; }
    `}</style>
  </header>
)

// Navbar Flutuante Padrão Home
const BottomNav = ({ selectedPlayer, onPlayerChange, isFavorite, onToggleFavorite, onShowInfo }) => (
  <div className="bottom-dock">
    <div className="dock-container">
      <Link href="/" className="dock-item"><i className="fas fa-home"></i></Link>
      <button className="dock-item" onClick={onShowInfo}><i className="fas fa-info"></i></button>
      
      <button className="dock-center-btn" onClick={onPlayerChange}>
         <i className={selectedPlayer === 'superflix' ? 'fas fa-film' : 'fas fa-bolt'}></i>
      </button>

      <button className={`dock-item ${isFavorite ? 'active-fav' : ''}`} onClick={onToggleFavorite}>
        <i className={isFavorite ? 'fas fa-heart' : 'far fa-heart'}></i>
      </button>
      <div className="dock-item disabled"><i className="fas fa-user"></i></div>
    </div>
    <style jsx>{`
        .bottom-dock {
            position: fixed; bottom: 20px; left: 0; right: 0;
            display: flex; justify-content: center; z-index: 100;
            pointer-events: none;
        }
        .dock-container {
            pointer-events: auto;
            background: rgba(22, 27, 34, 0.85);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255,255,255,0.1);
            padding: 10px 25px; border-radius: 24px;
            display: flex; align-items: center; gap: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .dock-item {
            background: none; border: none; color: #8b949e;
            font-size: 1.2rem; cursor: pointer; transition: 0.2s;
            display: flex; align-items: center; justify-content: center;
        }
        .dock-item:hover { color: white; transform: translateY(-2px); }
        .dock-item.active-fav { color: #f85149; }
        .dock-item.disabled { opacity: 0.3; cursor: default; }
        
        .dock-center-btn {
            width: 50px; height: 50px;
            background: var(--primary, #58a6ff);
            border: none; border-radius: 50%;
            color: white; font-size: 1.2rem;
            display: flex; align-items: center; justify-content: center;
            margin: -25px 5px 0 5px;
            box-shadow: 0 5px 15px rgba(88, 166, 255, 0.4);
            cursor: pointer; transition: transform 0.2s;
        }
        .dock-center-btn:hover { transform: scale(1.1) translateY(-2px); }
    `}</style>
  </div>
)
