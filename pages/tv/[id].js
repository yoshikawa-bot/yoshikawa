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

  const currentEpisode = seasonDetails?.episodes?.find(ep => ep.episode_number === episode)
  const prevEp = seasonDetails?.episodes?.findIndex(ep => ep.episode_number === episode) > 0 ? seasonDetails?.episodes[seasonDetails?.episodes?.findIndex(ep => ep.episode_number === episode) - 1] : null
  const nextEp = (seasonDetails?.episodes?.findIndex(ep => ep.episode_number === episode) !== -1 && seasonDetails?.episodes?.findIndex(ep => ep.episode_number === episode) < (seasonDetails?.episodes?.length - 1)) ? seasonDetails?.episodes[seasonDetails?.episodes?.findIndex(ep => ep.episode_number === episode) + 1] : null

  const availableSeasons = tvShow.seasons?.filter(s => s.season_number > 0 && s.episode_count > 0) || []
  const coverImage = currentEpisode?.still_path ? `https://image.tmdb.org/t/p/original${currentEpisode.still_path}` : (tvShow.backdrop_path ? `https://image.tmdb.org/t/p/original${tvShow.backdrop_path}` : null);

  return (
    <>
      <Head>
        <title>{tvShow.name} - Yoshikawa TV+</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>

      <Header />

      <main className="streaming-container">
        {/* Player Section */}
        <div className="player-container">
          <div className="player-wrapper">
             <div className="episode-cover-placeholder" onClick={() => setShowVideoPlayer(true)}>
                {coverImage ? <img src={coverImage} alt="Cover" className="cover-img" /> : <div className="cover-fallback"></div>}
                <div className="play-btn-circle-thin"><i className="fas fa-play"></i></div>
             </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="content-info-streaming">
          <div className="meta-header-row">
            <span className="episode-label-simple">Episódio {episode}</span>
            <div className="season-selector-wrapper">
                <select className="modern-season-select" value={season} onChange={(e) => { setSeason(parseInt(e.target.value)); loadSeasonDetails(e.target.value); }}>
                    {availableSeasons.map(s => <option key={s.season_number} value={s.season_number}>Temporada {s.season_number}</option>)}
                </select>
            </div>
          </div>
          
          <h1 className="clean-episode-title">{currentEpisode?.name || `Episódio ${episode}`}</h1>

          <div className="synopsis-wrapper">
            {showSynopsis && <p className="content-description-streaming fade-in">{currentEpisode?.overview || tvShow.overview || 'Sinopse não disponível.'}</p>}
            <button className="synopsis-toggle-btn" onClick={() => setShowSynopsis(!showSynopsis)}>
                {showSynopsis ? <span><i className="fas fa-chevron-up"></i> Ocultar</span> : <span><i className="fas fa-align-left"></i> Sinopse</span>}
            </button>
          </div>

          <div className="episodes-list-container">
            <div className="episodes-scroller" ref={episodeListRef}>
                {seasonDetails?.episodes?.map(ep => (
                    <div key={ep.episode_number} className={`episode-card ${ep.episode_number === episode ? 'active' : ''}`} onClick={() => {setEpisode(ep.episode_number); setShowVideoPlayer(false);}}>
                        <div className="episode-thumbnail">
                            {ep.still_path ? <img src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} loading="lazy" /> : <div className="no-thumbnail"><i className="fas fa-play"></i></div>}
                            <div className="episode-number-badge">{ep.episode_number}</div>
                        </div>
                        <div className="episode-info-mini"><span className="ep-title">{ep.name}</span></div>
                    </div>
                ))}
            </div>
          </div>
        </div>

        {/* Video Player Modal */}
        {showVideoPlayer && (
            <div className="video-overlay-wrapper active">
                <div className={`video-player-group ${isWideScreen ? 'widescreen' : 'square'}`}>
                    <div className="video-controls-toolbar">
                        <div className="video-ep-indicator">EP {episode}</div>
                        <div className="video-controls-right">
                            <button className="toolbar-btn" onClick={() => setIsWideScreen(!isWideScreen)}><i className={`fas ${isWideScreen ? 'fa-compress' : 'fa-expand'}`}></i></button>
                            <button className="toolbar-btn close-btn" onClick={() => setShowVideoPlayer(false)}><i className="fas fa-times"></i></button>
                        </div>
                    </div>
                    <div className="video-floating-container">
                        <iframe key={episode} src={getPlayerUrl()} allowFullScreen></iframe>
                    </div>
                </div>
            </div>
        )}

        {/* Server Selector Popup */}
        {showPlayerSelector && (
            <div className="player-selector-overlay active" onClick={() => closePopup(setShowPlayerSelector)}>
                <div className="player-selector-bubble active" onClick={e => e.stopPropagation()}>
                    <div className="player-option-bubble" onClick={() => handlePlayerChange('superflix')}>
                        <div className="option-main-line"><i className="fas fa-film"></i> <span className="option-name">SuperFlix (DUB)</span></div>
                    </div>
                    <div className="player-option-bubble" onClick={() => handlePlayerChange('vidsrc')}>
                        <div className="option-main-line"><i className="fas fa-bolt"></i> <span className="option-name">VidSrc (LEG)</span></div>
                    </div>
                </div>
            </div>
        )}
      </main>

      <BottomNav 
        selectedPlayer={selectedPlayer} 
        onPlayerChange={() => setShowPlayerSelector(true)} 
        isFavorite={isFavorite} 
        onToggleFavorite={toggleFavorite} 
        onShowInfo={() => setShowInfoPopup(true)} 
      />

      <style jsx global>{`
        body { background-color: #000000 !important; color: white; margin: 0; font-family: -apple-system, system-ui, sans-serif; }
        .streaming-container { padding: 10px; padding-bottom: 100px; }
      `}</style>

      <style jsx>{`
        /* GLASS EFFECTS */
        .ios-glass {
            background: rgba(28, 28, 30, 0.7);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .episode-cover-placeholder {
            width: 100%; aspect-ratio: 16/9; background: #111; border-radius: 12px;
            overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center;
        }
        .cover-img { width: 100%; height: 100%; object-fit: cover; opacity: 0.5; }
        .play-btn-circle-thin { 
            position: absolute; width: 60px; height: 60px; border-radius: 50%;
            border: 1px solid white; display: flex; align-items: center; justify-content: center;
            background: rgba(0,0,0,0.3); backdrop-filter: blur(5px); color: white;
        }

        /* BOTTOM NAV */
        .bottom-nav-container {
            position: fixed; bottom: 0; left: 0; width: 100%;
            height: 80px; background: rgba(15, 15, 15, 0.85);
            backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
            display: flex; align-items: center; justify-content: space-around;
            padding: 0 10px; z-index: 1000; border-top: 1px solid rgba(255,255,255,0.05);
        }

        .nav-item {
            background: none; border: none; color: #8e8e93;
            display: flex; flex-direction: column; align-items: center;
            gap: 5px; cursor: pointer; position: relative; width: 60px;
        }

        /* O EFEITO DA IMAGEM (Pílula acinzentada para o item selecionado) */
        .nav-item.active .pill-highlight {
            position: absolute; top: -5px; width: 45px; height: 30px;
            background: rgba(255, 255, 255, 0.12);
            border-radius: 20px; z-index: 0;
        }
        .nav-item.active { color: #007aff; }
        .nav-item i, .nav-item span { z-index: 1; position: relative; }
        .nav-item span { font-size: 10px; font-weight: 500; }

        /* BOTAO FLUTUANTE (PLAYER CIRCLE) - MANTIDO IDENTICO */
        .player-circle {
            width: 55px; height: 55px; background: #007aff;
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            color: white; font-size: 1.5rem; border: none; cursor: pointer;
            box-shadow: 0 4px 15px rgba(0, 113, 227, 0.4); margin-bottom: 20px;
        }

        /* UTILS */
        .meta-header-row { display: flex; justify-content: space-between; align-items: center; margin: 15px 0; }
        .episode-label-simple { color: #007aff; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; }
        .clean-episode-title { font-size: 1.4rem; font-weight: 700; margin-bottom: 10px; }
        .episodes-scroller { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 10px; scrollbar-width: none; }
        .episode-card { min-width: 140px; opacity: 0.6; }
        .episode-card.active { opacity: 1; }
        .episode-thumbnail { width: 100%; aspect-ratio: 16/9; border-radius: 8px; overflow: hidden; position: relative; border: 2px solid transparent; }
        .episode-card.active .episode-thumbnail { border-color: #007aff; }
        .episode-thumbnail img { width: 100%; height: 100%; object-fit: cover; }

        .video-overlay-wrapper { position: fixed; inset: 0; background: #000; z-index: 10000; display: flex; flex-direction: column; }
        .video-floating-container { flex: 1; background: #000; }
        .video-floating-container iframe { width: 100%; height: 100%; border: none; }
        .video-controls-toolbar { padding: 15px; display: flex; justify-content: space-between; align-items: center; }
        
        .player-selector-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 11000; display: flex; align-items: center; justify-content: center; }
        .player-selector-bubble { background: #1c1c1e; border-radius: 20px; padding: 20px; width: 280px; }
        .player-option-bubble { padding: 15px; background: #2c2c2e; border-radius: 12px; margin-bottom: 10px; color: white; cursor: pointer; }
      `}</style>
    </>
  )
}

const Header = () => (
  <header className="header">
    <div className="logo">
      <img src="https://yoshikawa-bot.github.io/cache/images/14c34900.jpg" />
      <span>Yoshikawa <strong>TV+</strong></span>
    </div>
    <style jsx>{`
      .header { padding: 15px; display: flex; align-items: center; background: #000; }
      .logo { display: flex; align-items: center; gap: 10px; font-size: 1.1rem; }
      .logo img { width: 30px; height: 30px; border-radius: 50%; }
      .logo strong { color: #007aff; }
    `}</style>
  </header>
)

const BottomNav = ({ onPlayerChange, isFavorite, onToggleFavorite, onShowInfo }) => {
  const router = useRouter();
  
  return (
    <div className="bottom-nav-container">
      <Link href="/" className={`nav-item ${router.pathname === '/' ? 'active' : ''}`}>
        {router.pathname === '/' && <div className="pill-highlight"></div>}
        <i className="fas fa-home"></i>
        <span>Início</span>
      </Link>

      <button className="nav-item" onClick={onShowInfo}>
        <i className="fas fa-info-circle"></i>
        <span>Info</span>
      </button>

      {/* Botão flutuante principal que abre a seleção de player */}
      <button className="player-circle" onClick={onPlayerChange}>
        <i className="fas fa-play"></i>
      </button>

      <button className={`nav-item ${isFavorite ? 'active' : ''}`} onClick={onToggleFavorite}>
        {isFavorite && <div className="pill-highlight"></div>}
        <i className="fas fa-heart"></i>
        <span>Favorito</span>
      </button>

      <button className="nav-item" onClick={() => window.location.reload()}>
        <i className="fas fa-sync-alt"></i>
        <span>Recarregar</span>
      </button>
    </div>
  );
}
