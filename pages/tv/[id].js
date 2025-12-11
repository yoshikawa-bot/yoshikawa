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
        if (seasonData.episodes && seasonData.episodes.length > 0) setEpisode(1)
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
    showToast(`Servidor: ${player === 'superflix' ? 'SuperFlix' : 'VidSrc'}`, 'info')
    if (showVideoPlayer) {
        setShowVideoPlayer(false)
        setTimeout(() => setShowVideoPlayer(true), 100); 
    }
  }

  if (loading) return <div className="loading active"><div className="spinner"></div><p>Carregando...</p></div>
  if (error) return <div className="error-message active"><h3>Erro</h3><p>{error}</p><Link href="/">Voltar</Link></div>
  if (!tvShow) return null

  const currentEpisode = seasonDetails?.episodes?.find(ep => ep.episode_number === episode)
  const availableSeasons = tvShow.seasons?.filter(s => s.season_number > 0 && s.episode_count > 0) || []

  const coverImage = currentEpisode?.still_path 
    ? `https://image.tmdb.org/t/p/original${currentEpisode.still_path}`
    : (tvShow.backdrop_path ? `https://image.tmdb.org/t/p/original${tvShow.backdrop_path}` : null);

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
                {coverImage ? (
                    <img src={coverImage} alt="Cover" className="cover-img" />
                ) : (
                    <div className="cover-fallback"></div>
                )}
                {/* Botão Play Atualizado: Círculo Branco Fino e Menor */}
                <div className="modern-play-button">
                    <i className="fas fa-play"></i>
                </div>
             </div>
          </div>
        </div>

        <div className="content-info-streaming">
            
          <div className="meta-header-row">
            <span className="episode-label-simple">Episódio {episode}</span>
            <div className="season-selector-wrapper">
                <select 
                    className="modern-season-select"
                    value={season}
                    onChange={(e) => handleSeasonChange(parseInt(e.target.value))}
                >
                    {availableSeasons.map(s => (
                        <option key={s.season_number} value={s.season_number}>Temp. {s.season_number}</option>
                    ))}
                </select>
            </div>
          </div>
          
          <h1 className="clean-episode-title">
             {currentEpisode?.name || `Episódio ${episode}`}
          </h1>

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
                    <div 
                        key={ep.episode_number}
                        className={`episode-card ${ep.episode_number === episode ? 'active' : ''}`}
                        onClick={() => handleEpisodeChange(ep.episode_number)}
                    >
                        <div className="episode-thumbnail">
                            {ep.still_path ? <img src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} alt="Ep" loading="lazy" /> : <div className="no-thumbnail"><i className="fas fa-play"></i></div>}
                            <div className="episode-number-badge">{ep.episode_number}</div>
                        </div>
                        <div className="episode-info-mini"><span className="ep-title">{ep.name}</span></div>
                    </div>
                ))}
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
                        <iframe src={getPlayerUrl()} allow="autoplay; encrypted-media" allowFullScreen title="Player"></iframe>
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
                    {/* Infos Metadados estilo Filme (Sem Sinopse) */}
                    <div className="info-meta">
                      <span><i className="fas fa-calendar"></i> {tvShow.first_air_date ? new Date(tvShow.first_air_date).getFullYear() : 'N/A'}</span>
                      <span><i className="fas fa-star"></i> {tvShow.vote_average ? tvShow.vote_average.toFixed(1) : 'N/A'}</span>
                      <span><i className="fas fa-tv"></i> {tvShow.number_of_seasons} Temp.</span>
                    </div>
                    <div className="info-meta">
                      <span><i className="fas fa-tags"></i> {tvShow.genres ? tvShow.genres.map(g => g.name).slice(0, 2).join(', ') : ''}</span>
                    </div>
                  </div>
                </div>
                <button className="close-popup-btn" onClick={() => closePopup(setShowInfoPopup)}><i className="fas fa-times"></i> Fechar</button>
              </div>
            </div>
        )}
      </main>

      {toast && (
        <div className="toast-container">
            <div className={`toast toast-${toast.type} show`}>
                <div className="toast-content">{toast.message}</div>
            </div>
        </div>
      )}

      <BottomNav 
        selectedPlayer={selectedPlayer}
        onPlayerChange={() => setShowPlayerSelector(true)}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        onShowInfo={() => setShowInfoPopup(true)}
      />

      <style jsx>{`
        /* --- BOTÃO DE PLAY ATUALIZADO --- */
        .modern-play-button {
            position: absolute;
            z-index: 2;
            width: 54px;
            height: 54px;
            border: 1.5px solid rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            color: #fff;
            background: rgba(0, 0, 0, 0.2);
            backdrop-filter: blur(4px);
            transition: all 0.3s ease;
        }
        .episode-cover-placeholder:hover .modern-play-button {
            transform: scale(1.1);
            background: rgba(255, 255, 255, 0.1);
            border-color: #fff;
        }
        .modern-play-button i { margin-left: 4px; }

        /* --- POP-UP INFO STYLE FILMES --- */
        .info-meta {
            display: flex;
            gap: 15px;
            margin-bottom: 8px;
            font-size: 0.85rem;
            color: var(--secondary);
            flex-wrap: wrap;
        }
        .info-meta i { color: var(--primary); margin-right: 4px; }
        .info-popup-header { display: flex; gap: 20px; margin-bottom: 10px; }
        .info-poster { width: 100px; height: 150px; border-radius: 8px; object-fit: cover; }
        .info-details { flex: 1; display: flex; flex-direction: column; justify-content: center; }
        .info-title { font-size: 1.4rem; margin-bottom: 12px; font-weight: 700; color: #fff; }

        /* --- HEADER & GERAL --- */
        .streaming-container { padding: 0 16px 100px 16px; }
        .meta-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
        .clean-episode-title { font-size: 1.3rem; color: #fff; margin-bottom: 0.8rem; font-weight: 600; }
        
        /* Video Overlay */
        .video-overlay-wrapper { position: fixed; inset: 0; backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); z-index: 9999; display: flex; align-items: center; justify-content: center; }
        .video-player-group.square { width: min(90vw, 90vh); max-width: 500px; }
        .video-player-group.widescreen { width: 95vw; max-width: 1000px; }
        .video-floating-container { width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        .video-player-group.square .video-floating-container { aspect-ratio: 1/1; }
        .video-floating-container iframe { width: 100%; height: 100%; border: none; }
        
        /* Scroller */
        .episodes-scroller { display: flex; gap: 12px; overflow-x: auto; padding: 10px 0; scrollbar-width: none; }
        .episode-card { min-width: 140px; cursor: pointer; opacity: 0.7; transition: 0.3s; }
        .episode-card.active { opacity: 1; }
        .episode-thumbnail { position: relative; border-radius: 10px; overflow: hidden; aspect-ratio: 16/9; border: 2px solid transparent; }
        .episode-card.active .episode-thumbnail { border-color: var(--primary); }
        .episode-thumbnail img { width: 100%; height: 100%; object-fit: cover; }
      `}</style>
    </>
  )
}

const Header = () => (
  <header className="github-header">
    <div className="header-content">
      <Link href="/" className="logo-container">
        <img src="https://yoshikawa-bot.github.io/cache/images/14c34900.jpg" alt="Logo" className="logo-image" />
        <div className="logo-text"><span className="logo-name">Yoshikawa</span><span className="beta-tag">STREAMING</span></div>
      </Link>
    </div>
    <style jsx>{`
      .github-header { position: sticky; top: 0; z-index: 1000; background: var(--bg); border-bottom: 1px solid var(--border); padding: 10px 0; }
      .header-content { display: flex; justify-content: flex-start; align-items: center; width: 100%; padding: 0 16px; }
    `}</style>
  </header>
)

const BottomNav = ({ isFavorite, onToggleFavorite, onShowInfo }) => (
  <div className="bottom-nav-container streaming-mode">
    <div className="main-nav-bar">
      <Link href="/" className="nav-item"><i className="fas fa-home"></i><span>Início</span></Link>
      <button className="nav-item" onClick={onShowInfo}><i className="fas fa-info-circle"></i><span>Info</span></button>
      <button className={`nav-item ${isFavorite ? 'active' : ''}`} onClick={onToggleFavorite}>
        <i className={isFavorite ? 'fas fa-heart' : 'far fa-heart'}></i><span>Favorito</span>
      </button>
    </div>
  </div>
)
