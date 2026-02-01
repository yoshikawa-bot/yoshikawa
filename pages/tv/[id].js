import { useRouter } from 'next/router'
import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'

// Reutilizando os componentes exportáveis com o novo design
import { Header, BottomNav, ToastContainer } from './pages/index' // Supondo que estejam no mesmo arquivo ou exportados

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
  const [toasts, setToasts] = useState([])
  const [showSynopsis, setShowSynopsis] = useState(false)
  const episodeListRef = useRef(null)

  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const STREAM_BASE_URL = 'https://superflixapi.blog'

  const showToast = (message, type = 'info') => {
    const id = Date.now()
    setToasts([{ id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }

  // Efeitos de carregamento e favoritos
  useEffect(() => {
    if (id) {
      loadTvShow(id)
      checkIfFavorite()
    }
  }, [id])

  const loadTvShow = async (tvId) => {
    try {
      setLoading(true)
      const tvResponse = await fetch(`https://api.themoviedb.org/3/tv/${tvId}?api_key=${TMDB_API_KEY}&language=pt-BR`)
      if (!tvResponse.ok) throw new Error('Série não encontrada')
      const tvData = await tvResponse.json()
      setTvShow(tvData)
      
      const firstSeason = tvData.seasons?.find(s => s.season_number > 0) || tvData.seasons?.[0]
      if (firstSeason) {
        setSeason(firstSeason.season_number)
        await loadSeasonDetails(tvId, firstSeason.season_number)
      }
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  const loadSeasonDetails = async (tvId, seasonNumber) => {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=pt-BR`)
      if (res.ok) setSeasonDetails(await res.json())
    } catch (err) { setSeasonDetails(null) }
  }

  const checkIfFavorite = () => {
    const favs = JSON.parse(localStorage.getItem('yoshikawaFavorites') || '[]')
    setIsFavorite(favs.some(f => f.id === parseInt(id) && f.media_type === 'tv'))
  }

  const toggleFavorite = () => {
    let favs = JSON.parse(localStorage.getItem('yoshikawaFavorites') || '[]')
    if (isFavorite) {
      favs = favs.filter(f => !(f.id === parseInt(id) && f.media_type === 'tv'))
      showToast('Removido dos favoritos', 'info')
    } else {
      favs.push({ id: parseInt(id), media_type: 'tv', title: tvShow.name, poster_path: tvShow.poster_path })
      showToast('Adicionado!', 'success')
    }
    localStorage.setItem('yoshikawaFavorites', JSON.stringify(favs))
    setIsFavorite(!isFavorite)
  }

  const getPlayerUrl = () => {
    return selectedPlayer === 'superflix' 
      ? `${STREAM_BASE_URL}/serie/${id}/${season}/${episode}#noEpList#transparent`
      : `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`
  }

  if (loading) return <div className="empty-state"><div className="spinner"></div></div>
  
  const currentEpisode = seasonDetails?.episodes?.find(ep => ep.episode_number === episode)
  const coverImage = currentEpisode?.still_path 
    ? `https://image.tmdb.org/t/p/original${currentEpisode.still_path}`
    : `https://image.tmdb.org/t/p/original${tvShow.backdrop_path}`

  return (
    <>
      <Head>
        <title>{tvShow.name} - Yoshikawa</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style>{`
          /* Copiar estilos globais do design anterior (Variáveis, Body, etc) */
          :root {
            --pill-height: 62px;
            --pill-bg: rgba(35, 35, 35, 0.65);
            --pill-border: 1px solid rgba(255, 255, 255, 0.15);
            --pill-blur: blur(20px);
          }
          body { background: #000; color: #fff; font-family: 'Inter', sans-serif; }

          .streaming-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 100px 20px 120px;
          }

          .player-wrapper {
            position: relative;
            width: 100%;
            aspect-ratio: 16/9;
            border-radius: 24px;
            overflow: hidden;
            border: var(--pill-border);
            background: #111;
            margin-bottom: 25px;
            cursor: pointer;
          }

          .cover-img { width: 100%; height: 100%; object-fit: cover; opacity: 0.5; }
          .play-btn-circle-thin {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 70px; height: 70px; border-radius: 50%;
            border: 1px solid #fff; display: flex; align-items: center; justify-content: center;
            font-size: 24px; background: rgba(0,0,0,0.3); backdrop-filter: blur(4px);
          }

          .meta-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
          .modern-season-select {
            background: var(--pill-bg); color: #fff; border: var(--pill-border);
            padding: 8px 15px; border-radius: 12px; backdrop-filter: var(--pill-blur);
          }

          .episodes-scroller {
            display: flex; gap: 15px; overflow-x: auto; padding: 10px 0;
            scrollbar-width: none;
          }
          
          .episode-card {
            min-width: 160px; flex-shrink: 0; cursor: pointer;
          }
          
          .episode-thumbnail {
            position: relative; width: 100%; aspect-ratio: 16/9;
            border-radius: 15px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);
            margin-bottom: 8px;
          }

          .episode-card.active .episode-thumbnail { border: 2px solid #fff; }

          .video-overlay-wrapper {
            position: fixed; inset: 0; background: #000; z-index: 2000;
            display: flex; align-items: center; justify-content: center;
          }
          .video-floating-container { width: 95vw; max-width: 1100px; aspect-ratio: 16/9; }
          .close-video { position: fixed; top: 20px; right: 20px; font-size: 30px; color: #fff; cursor: pointer; z-index: 2001; }

          /* Toast Animation (Saindo de trás da navbar) */
          .toast-wrap {
            position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
            z-index: 990; display: flex; flex-direction: column; gap: 8px;
          }
          .toast {
            background: var(--pill-bg); backdrop-filter: var(--pill-blur);
            border: var(--pill-border); padding: 12px 24px; border-radius: 30px;
            animation: toast-pop-up 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }
          @keyframes toast-pop-up {
            from { opacity: 0; transform: translateY(40px) scale(0.8); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>
      </Head>

      <Header label={tvShow.name} />

      <ToastContainer toasts={toasts} removeToast={(id) => setToasts(p => p.filter(t => t.id !== id))} />

      <main className="streaming-container">
        <div className="player-wrapper" onClick={() => setShowVideoPlayer(true)}>
          <img src={coverImage} className="cover-img" />
          <div className="play-btn-circle-thin"><i className="fas fa-play"></i></div>
        </div>

        <div className="meta-header-row">
          <span style={{ color: '#aaa' }}>Temporada {season} • Episódio {episode}</span>
          <select className="modern-season-select" value={season} onChange={(e) => handleSeasonChange(parseInt(e.target.value))}>
            {tvShow.seasons?.filter(s => s.season_number > 0).map(s => (
              <option key={s.season_number} value={s.season_number}>Temporada {s.season_number}</option>
            ))}
          </select>
        </div>

        <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>{currentEpisode?.name || `Episódio ${episode}`}</h1>

        <div className="episodes-scroller" ref={episodeListRef}>
          {seasonDetails?.episodes?.map(ep => (
            <div key={ep.episode_number} className={`episode-card ${ep.episode_number === episode ? 'active' : ''}`} onClick={() => setEpisode(ep.episode_number)}>
              <div className="episode-thumbnail">
                <img src={ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : coverImage} style={{width:'100%', height:'100%', objectFit:'cover'}} />
              </div>
              <span className="card-title" style={{fontSize: '13px', color: ep.episode_number === episode ? '#fff' : '#aaa'}}>
                {ep.episode_number}. {ep.name}
              </span>
            </div>
          ))}
        </div>

        {showVideoPlayer && (
          <div className="video-overlay-wrapper">
            <i className="fas fa-times close-video" onClick={() => setShowVideoPlayer(false)}></i>
            <div className="video-floating-container">
              <iframe src={getPlayerUrl()} width="100%" height="100%" frameBorder="0" allowFullScreen></iframe>
            </div>
          </div>
        )}
      </main>

      {/* Navbar customizada para Streaming */}
      <div className="bottom-nav">
        <div className="nav-pill">
            <Link href="/" className="nav-btn"><i className="fas fa-home"></i></Link>
            <button className="nav-btn" onClick={() => setShowInfoPopup(true)}><i className="fas fa-info-circle"></i></button>
            <button className="nav-btn" onClick={toggleFavorite}>
                <i className={isFavorite ? 'fas fa-heart' : 'far fa-heart'} style={{ color: isFavorite ? '#dc2626' : 'inherit' }}></i>
            </button>
        </div>
        <button className="search-circle" onClick={() => setShowPlayerSelector(true)}>
          <i className={selectedPlayer === 'superflix' ? 'fas fa-film' : 'fas fa-bolt'}></i>
        </button>
      </div>

      {/* Seletor de Player com o novo design */}
      {showPlayerSelector && (
        <div className="video-overlay-wrapper" style={{background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)'}} onClick={() => setShowPlayerSelector(false)}>
            <div className="nav-pill" style={{flexDirection: 'column', height: 'auto', padding: '20px', gap: '15px'}} onClick={e => e.stopPropagation()}>
                <button className="nav-btn" style={{width: '100%'}} onClick={() => {setSelectedPlayer('superflix'); setShowPlayerSelector(false)}}>SuperFlix (DUB)</button>
                <button className="nav-btn" style={{width: '100%'}} onClick={() => {setSelectedPlayer('vidsrc'); setShowPlayerSelector(false)}}>VidSrc (LEG)</button>
            </div>
        </div>
      )}
    </>
  )
}
