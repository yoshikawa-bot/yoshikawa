import { useRouter } from 'next/router'
import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'

// --- Componentes UI Reutilizados (Adaptados) ---

const Header = ({ label, scrolled, goBack }) => (
  <header className="header-pill">
    <button className="header-btn-left" onClick={goBack} title="Voltar">
      <i className="fas fa-arrow-left"></i>
    </button>

    <div className="header-center">
      <span className="header-label">{label}</span>
    </div>

    <div className="header-btn-right-placeholder"></div>
  </header>
)

const BottomNav = ({ selectedPlayer, togglePlayerMenu, isFavorite, toggleFavorite, showInfo }) => (
  <div className="bottom-nav">
    <div className="nav-pill">
      <Link href="/" className="nav-btn">
        <i className="fas fa-home"></i>
      </Link>
      <button className="nav-btn" onClick={showInfo}>
        <i className="fas fa-info-circle"></i>
      </button>
      <button className={`nav-btn ${isFavorite ? 'active-fav' : ''}`} onClick={toggleFavorite}>
        <i className={isFavorite ? 'fas fa-heart' : 'far fa-heart'}></i>
      </button>
    </div>
    <button className="action-circle" onClick={togglePlayerMenu}>
      <i className={selectedPlayer === 'superflix' ? 'fas fa-film' : 'fas fa-bolt'}></i>
    </button>
  </div>
)

const ToastContainer = ({ toast, closeToast }) => {
  if (!toast) return null;
  return (
    <div className="toast-wrap">
      <div className={`toast ${toast.type}`} onClick={closeToast}>
        <div className="toast-icon">
          <i className={`fas ${toast.type === 'success' ? 'fa-check' : toast.type === 'error' ? 'fa-exclamation-triangle' : 'fa-info'}`}></i>
        </div>
        <div className="toast-msg">{toast.message}</div>
      </div>
    </div>
  )
}

// --- Componente Principal ---

export default function TVShow() {
  const router = useRouter()
  const { id } = router.query
  const [tvShow, setTvShow] = useState(null)
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [seasonDetails, setSeasonDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const [selectedPlayer, setSelectedPlayer] = useState('superflix')
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [showPlayerSelector, setShowPlayerSelector] = useState(false)
  const [showVideoPlayer, setShowVideoPlayer] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  
  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)
  
  const [scrolled, setScrolled] = useState(false)
  const episodeListRef = useRef(null)

  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const STREAM_BASE_URL = 'https://superflixapi.blog'

  // --- Logic Helpers ---

  const showToastMsg = (message, type = 'info') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ message, type })
    toastTimerRef.current = setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (id) {
      loadTvShow(id)
      checkIfFavorite()
    }
  }, [id])

  useEffect(() => {
    if (showVideoPlayer) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'auto'
    return () => { document.body.style.overflow = 'auto' }
  }, [showVideoPlayer])

  useEffect(() => {
    if (episodeListRef.current && seasonDetails) {
      const activeCard = episodeListRef.current.querySelector('.episode-card.active')
      if (activeCard) activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [episode, seasonDetails])

  const loadTvShow = async (tvId) => {
    try {
      setLoading(true)
      const res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}?api_key=${TMDB_API_KEY}&language=pt-BR`)
      if (!res.ok) throw new Error('Erro ao carregar')
      const data = await res.json()
      setTvShow(data)
      
      const firstSeason = data.seasons?.find(s => s.season_number > 0) || data.seasons?.[0]
      if (firstSeason) {
        setSeason(firstSeason.season_number)
        await loadSeasonDetails(firstSeason.season_number)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadSeasonDetails = async (seasonNum) => {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/tv/${id}/season/${seasonNum}?api_key=${TMDB_API_KEY}&language=pt-BR`)
      if (res.ok) {
        const data = await res.json()
        setSeasonDetails(data)
        // Reset to ep 1 when changing seasons if not init
        if (loading) setEpisode(1) 
      }
    } catch (e) { console.error(e) }
  }

  const checkIfFavorite = () => {
    try {
      const list = JSON.parse(localStorage.getItem('yoshikawaFavorites') || '[]')
      setIsFavorite(list.some(f => f.id === parseInt(id) && f.media_type === 'tv'))
    } catch {}
  }

  const toggleFavorite = () => {
    if (!tvShow) return
    try {
      const list = JSON.parse(localStorage.getItem('yoshikawaFavorites') || '[]')
      let newList
      if (isFavorite) {
        newList = list.filter(f => !(f.id === parseInt(id) && f.media_type === 'tv'))
        showToastMsg('Removido dos favoritos', 'info')
      } else {
        newList = [...list, { id: parseInt(id), media_type: 'tv', title: tvShow.name, poster_path: tvShow.poster_path }]
        showToastMsg('Adicionado aos favoritos!', 'success')
      }
      localStorage.setItem('yoshikawaFavorites', JSON.stringify(newList))
      setIsFavorite(!isFavorite)
    } catch { showToastMsg('Erro ao salvar', 'error') }
  }

  const handleSeasonChange = async (e) => {
    const s = parseInt(e.target.value)
    setSeason(s)
    await loadSeasonDetails(s)
    setEpisode(1)
  }

  const getPlayerUrl = () => {
    return selectedPlayer === 'superflix'
      ? `${STREAM_BASE_URL}/serie/${id}/${season}/${episode}#noEpList#noLink#transparent`
      : `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`
  }

  const handlePlayerSelect = (p) => {
    setSelectedPlayer(p)
    setShowPlayerSelector(false)
    showToastMsg(`Player: ${p === 'superflix' ? 'SuperFlix (Dub)' : 'VidSrc (Leg)'}`, 'success')
  }

  // --- Renders ---

  if (loading && !tvShow) return <div className="loading-screen"><div className="spinner"></div></div>
  if (!tvShow) return null

  const currentEpData = seasonDetails?.episodes?.find(e => e.episode_number === episode)
  const backdrop = currentEpData?.still_path 
    ? `https://image.tmdb.org/t/p/original${currentEpData.still_path}`
    : (tvShow.backdrop_path ? `https://image.tmdb.org/t/p/original${tvShow.backdrop_path}` : '');

  const availableSeasons = tvShow.seasons?.filter(s => s.season_number > 0 && s.episode_count > 0) || []

  return (
    <>
      <Head>
        <title>{tvShow.name} | Yoshikawa</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>

      <Header 
        label={scrolled ? tvShow.name : 'Assistindo'} 
        scrolled={scrolled} 
        goBack={() => router.back()} 
      />

      <ToastContainer toast={toast} closeToast={() => setToast(null)} />

      <main className="container">
        
        {/* HERO / PLAYER TRIGGER */}
        <div className="hero-section">
          <div className="hero-wrapper" onClick={() => setShowVideoPlayer(true)}>
            <div className="hero-backdrop">
              {backdrop && <img src={backdrop} alt="Cover" />}
              <div className="hero-overlay"></div>
              <div className="play-icon-container">
                <i className="fas fa-play"></i>
              </div>
              <div className="hero-content">
                <span className="hero-tag">S{season} : E{episode}</span>
                <h2 className="hero-title">{currentEpData?.name || `Episódio ${episode}`}</h2>
              </div>
            </div>
          </div>
        </div>

        {/* CONTROLS & INFO */}
        <div className="meta-controls">
          <div className="title-block">
            <h1 className="show-title">{tvShow.name}</h1>
            <p className="show-overview">{currentEpData?.overview || tvShow.overview || 'Sem descrição disponível.'}</p>
          </div>
          
          <div className="season-select-wrapper">
            <select value={season} onChange={handleSeasonChange}>
              {availableSeasons.map(s => (
                <option key={s.season_number} value={s.season_number}>Temporada {s.season_number}</option>
              ))}
            </select>
            <i className="fas fa-chevron-down select-icon"></i>
          </div>
        </div>

        {/* EPISODES LIST */}
        <div className="episodes-scroller" ref={episodeListRef}>
          {seasonDetails?.episodes?.map(ep => (
            <div 
              key={ep.episode_number} 
              className={`episode-card ${ep.episode_number === episode ? 'active' : ''}`}
              onClick={() => setEpisode(ep.episode_number)}
            >
              <div className="ep-poster-frame">
                {ep.still_path ? (
                   <img src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} alt="" loading="lazy"/>
                ) : (
                   <div className="no-img"><i className="fas fa-video"></i></div>
                )}
                <div className="ep-number">{ep.episode_number}</div>
                {ep.episode_number === episode && <div className="playing-overlay"><i className="fas fa-play"></i></div>}
              </div>
              <span className="ep-title">{ep.name}</span>
            </div>
          ))}
        </div>

      </main>

      {/* VIDEO POPUP OVERLAY */}
      {showVideoPlayer && (
        <div className="video-overlay blur-bg" onClick={() => setShowVideoPlayer(false)}>
          <div className="video-container" onClick={e => e.stopPropagation()}>
            <div className="video-header">
              <span>{tvShow.name} - S{season}:E{episode}</span>
              <button onClick={() => setShowVideoPlayer(false)}><i className="fas fa-times"></i></button>
            </div>
            <div className="iframe-wrapper">
              <iframe src={getPlayerUrl()} allowFullScreen allow="autoplay; encrypted-media"></iframe>
            </div>
          </div>
        </div>
      )}

      {/* PLAYER SELECTOR POPUP */}
      {showPlayerSelector && (
        <>
          <div className="popup-backdrop" onClick={() => setShowPlayerSelector(false)}></div>
          <div className="selector-popup">
            <div className="popup-header">Fonte de Vídeo</div>
            <button className={`selector-opt ${selectedPlayer === 'superflix' ? 'active' : ''}`} onClick={() => handlePlayerSelect('superflix')}>
              <i className="fas fa-film"></i>
              <div>
                <strong>SuperFlix</strong>
                <span>Dublado (Lento)</span>
              </div>
            </button>
            <button className={`selector-opt ${selectedPlayer === 'vidsrc' ? 'active' : ''}`} onClick={() => handlePlayerSelect('vidsrc')}>
              <i className="fas fa-bolt"></i>
              <div>
                <strong>VidSrc</strong>
                <span>Legendado (Rápido)</span>
              </div>
            </button>
          </div>
        </>
      )}

      {/* INFO POPUP */}
      {showInfoPopup && (
        <>
           <div className="popup-backdrop" onClick={() => setShowInfoPopup(false)}></div>
           <div className="info-popup-card">
              <div className="info-header">
                <img src={`https://image.tmdb.org/t/p/w200${tvShow.poster_path}`} className="info-poster"/>
                <div className="info-meta-text">
                  <h3>{tvShow.name}</h3>
                  <div className="tags">
                    <span>{tvShow.first_air_date?.split('-')[0]}</span>
                    <span><i className="fas fa-star" style={{color:'#ffca28', marginRight:4}}></i>{tvShow.vote_average.toFixed(1)}</span>
                  </div>
                  <div className="genres">{tvShow.genres?.map(g => g.name).slice(0,2).join(', ')}</div>
                </div>
              </div>
              <p className="info-desc">{tvShow.overview}</p>
              <button className="close-btn" onClick={() => setShowInfoPopup(false)}>Fechar</button>
           </div>
        </>
      )}

      <BottomNav 
        selectedPlayer={selectedPlayer}
        togglePlayerMenu={() => setShowPlayerSelector(!showPlayerSelector)}
        isFavorite={isFavorite}
        toggleFavorite={toggleFavorite}
        showInfo={() => setShowInfoPopup(true)}
      />

      <style jsx>{`
        /* --- GLOBAL VARIABLES & RESET --- */
        :root {
          --pill-height: 62px;
          --pill-radius: 44px;
          --pill-bg: rgba(35, 35, 35, 0.65);
          --pill-border: 1px solid rgba(255, 255, 255, 0.15);
          --pill-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
          --pill-blur: blur(20px);
          --pill-max-width: 680px;
          --accent: #ff6b6b;
          --bg: #000;
          --text: #f1f5f9;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; -webkit-tap-highlight-color: transparent; }
        body { background: var(--bg); color: var(--text); min-height: 100vh; overflow-x: hidden; }
        button { background: none; border: none; cursor: pointer; color: inherit; }
        a { text-decoration: none; color: inherit; }

        /* --- LOADING --- */
        .loading-screen { display: flex; height: 100vh; align-items: center; justify-content: center; }
        .spinner { width: 36px; height: 36px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* --- HEADER --- */
        .header-pill {
          position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
          z-index: 100; width: 90%; max-width: var(--pill-max-width); height: var(--pill-height);
          display: flex; align-items: center; justify-content: space-between; padding: 0 0.8rem;
          border-radius: var(--pill-radius); border: var(--pill-border); background: var(--pill-bg);
          backdrop-filter: var(--pill-blur); box-shadow: var(--pill-shadow);
        }
        .header-btn-left { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; color: rgba(255,255,255,0.7); transition: 0.2s; }
        .header-btn-left:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .header-center { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); font-weight: 600; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60%; }
        .header-btn-right-placeholder { width: 44px; }

        /* --- MAIN LAYOUT --- */
        .container {
          max-width: 1000px; margin: 0 auto;
          padding: calc(var(--pill-height) + 30px) 1.5rem 8rem 1.5rem;
          animation: fade-in 0.5s ease;
        }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        /* --- HERO / PLAYER TRIGGER --- */
        .hero-section { width: 100%; margin-bottom: 2rem; }
        .hero-wrapper {
          position: relative; width: 100%; aspect-ratio: 16/9; max-height: 500px;
          border-radius: 24px; overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          cursor: pointer; transition: transform 0.2s;
        }
        .hero-wrapper:active { transform: scale(0.98); }
        .hero-backdrop { width: 100%; height: 100%; position: relative; }
        .hero-backdrop img { width: 100%; height: 100%; object-fit: cover; }
        .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.9), transparent); }
        .play-icon-container {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          width: 64px; height: 64px; border-radius: 50%;
          background: rgba(255, 107, 107, 0.9); color: white;
          display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
          box-shadow: 0 0 20px rgba(255, 107, 107, 0.4);
          transition: transform 0.2s; padding-left: 4px;
        }
        .hero-wrapper:hover .play-icon-container { transform: translate(-50%, -50%) scale(1.1); }
        .hero-content { position: absolute; bottom: 0; left: 0; padding: 1.5rem; width: 100%; }
        .hero-tag { display: inline-block; background: rgba(255,255,255,0.2); backdrop-filter: blur(4px); padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; margin-bottom: 8px; }
        .hero-title { font-size: 1.5rem; font-weight: 700; line-height: 1.2; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }

        /* --- META & SELECTOR --- */
        .meta-controls { margin-bottom: 2rem; display: flex; flex-direction: column; gap: 1rem; }
        .show-title { font-size: 1.8rem; font-weight: 700; color: #fff; margin-bottom: 0.5rem; }
        .show-overview { font-size: 0.9rem; color: #94a3b8; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        
        .season-select-wrapper { position: relative; max-width: 200px; }
        .season-select-wrapper select {
          width: 100%; appearance: none;
          background: rgba(30,30,30,0.8); border: 1px solid rgba(255,255,255,0.15);
          color: #fff; padding: 10px 16px; border-radius: 12px;
          font-size: 0.9rem; outline: none; cursor: pointer;
        }
        .select-icon { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); pointer-events: none; font-size: 0.8rem; color: #94a3b8; }

        /* --- EPISODES LIST --- */
        .episodes-scroller {
          display: flex; gap: 14px; overflow-x: auto; padding-bottom: 1rem;
          scrollbar-width: none;
        }
        .episodes-scroller::-webkit-scrollbar { display: none; }
        
        .episode-card {
          flex: 0 0 160px; cursor: pointer; display: flex; flex-direction: column; gap: 8px;
          transition: opacity 0.2s;
        }
        .episode-card:not(.active) { opacity: 0.6; }
        .episode-card:hover { opacity: 1; }
        
        .ep-poster-frame {
          position: relative; width: 100%; aspect-ratio: 16/9;
          border-radius: 12px; overflow: hidden; background: #1e1e1e;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .episode-card.active .ep-poster-frame { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.2); }
        
        .ep-poster-frame img { width: 100%; height: 100%; object-fit: cover; }
        .no-img { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.2); }
        .ep-number { position: absolute; top: 6px; left: 6px; background: rgba(0,0,0,0.6); font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
        
        .playing-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: var(--accent); font-size: 1.2rem; }
        
        .ep-title { font-size: 0.85rem; font-weight: 500; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* --- BOTTOM NAV --- */
        .bottom-nav {
          position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
          width: 90%; max-width: var(--pill-max-width); z-index: 100;
          display: flex; gap: 12px;
        }
        .nav-pill {
          flex: 1; height: var(--pill-height); background: var(--pill-bg);
          border: var(--pill-border); border-radius: var(--pill-radius);
          backdrop-filter: var(--pill-blur); box-shadow: var(--pill-shadow);
          display: flex; justify-content: space-around; align-items: center;
        }
        .nav-btn { font-size: 1.25rem; color: rgba(255,255,255,0.5); width: 100%; height: 100%; transition: 0.2s; }
        .nav-btn:hover { color: #fff; transform: scale(1.1); }
        .nav-btn.active-fav { color: var(--accent); }
        
        .action-circle {
          width: var(--pill-height); height: var(--pill-height); flex-shrink: 0;
          border-radius: 50%; background: var(--pill-bg); border: var(--pill-border);
          backdrop-filter: var(--pill-blur); box-shadow: var(--pill-shadow);
          display: flex; align-items: center; justify-content: center; font-size: 1.3rem;
          transition: 0.2s;
        }
        .action-circle:active { transform: scale(0.9); }

        /* --- POPUPS & OVERLAYS --- */
        .popup-backdrop { position: fixed; inset: 0; z-index: 200; }
        
        .video-overlay {
          position: fixed; inset: 0; z-index: 999;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          animation: fade-in 0.3s;
        }
        .video-container { width: 95%; max-width: 1100px; background: #000; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
        .video-header { display: flex; justify-content: space-between; padding: 12px 16px; background: #111; font-size: 0.9rem; color: #ccc; }
        .iframe-wrapper { position: relative; width: 100%; aspect-ratio: 16/9; }
        .iframe-wrapper iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: none; }

        .selector-popup {
          position: fixed; bottom: calc(20px + var(--pill-height) + 12px); right: 5%;
          width: 220px; background: rgba(30,30,30,0.95); border: var(--pill-border);
          backdrop-filter: blur(12px); border-radius: 20px; padding: 10px; z-index: 201;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5); transform-origin: bottom right;
          animation: pop-up 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .popup-header { font-size: 0.75rem; color: #888; text-transform: uppercase; padding: 8px 12px; letter-spacing: 1px; }
        .selector-opt {
          width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px;
          border-radius: 12px; text-align: left; transition: 0.2s;
        }
        .selector-opt:hover { background: rgba(255,255,255,0.1); }
        .selector-opt.active { background: rgba(255, 107, 107, 0.15); color: var(--accent); }
        .selector-opt i { font-size: 1.2rem; }
        .selector-opt div { display: flex; flex-direction: column; }
        .selector-opt span { font-size: 0.7rem; opacity: 0.7; }

        .info-popup-card {
          position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
          width: 90%; max-width: 400px; background: #1a1a1a; border: var(--pill-border);
          border-radius: 24px; padding: 24px; z-index: 201; box-shadow: 0 25px 50px rgba(0,0,0,0.5);
          animation: fade-up 0.3s ease;
        }
        .info-header { display: flex; gap: 16px; margin-bottom: 16px; }
        .info-poster { width: 80px; border-radius: 8px; }
        .info-meta-text h3 { margin-bottom: 6px; line-height: 1.2; }
        .tags { font-size: 0.85rem; color: #aaa; margin-bottom: 6px; }
        .genres { font-size: 0.8rem; color: var(--accent); }
        .info-desc { font-size: 0.9rem; color: #ccc; line-height: 1.5; margin-bottom: 20px; max-height: 150px; overflow-y: auto; }
        .close-btn { width: 100%; padding: 12px; background: rgba(255,255,255,0.1); border-radius: 12px; font-weight: 600; }

        .toast-wrap { position: fixed; top: 100px; left: 50%; transform: translateX(-50%); z-index: 300; pointer-events: none; }
        .toast { pointer-events: auto; display: flex; align-items: center; gap: 12px; padding: 10px 16px; background: #1a1a1a; border: 1px solid #333; border-radius: 50px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); animation: fade-in 0.3s; }
        .toast-icon { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: #fff; }
        .toast.success .toast-icon { background: #10b981; }
        .toast.info .toast-icon { background: #3b82f6; }
        .toast.error .toast-icon { background: #ef4444; }
        .toast-msg { font-size: 0.9rem; font-weight: 500; }

        @keyframes pop-up { from { opacity: 0; transform: scale(0.8) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes fade-up { from { opacity: 0; transform: translate(-50%, -40%); } to { opacity: 1; transform: translate(-50%, -50%); } }

        @media (max-width: 768px) {
          :root { --pill-height: 56px; }
          .hero-wrapper { aspect-ratio: 4/3; }
          .hero-title { font-size: 1.25rem; }
          .container { padding-left: 1rem; padding-right: 1rem; }
          .video-container { width: 100%; border-radius: 0; height: 100%; display: flex; flex-direction: column; justify-content: center; }
          .iframe-wrapper { aspect-ratio: 16/9; width: 100%; }
        }
      `}</style>
    </>
  )
}
