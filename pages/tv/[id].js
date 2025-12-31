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

  // --- Funções Auxiliares (Toast, Load, Favorites) ---
  const showToast = (message, type = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToast({ message, type, id: Date.now() })
    toastTimeoutRef.current = setTimeout(() => { setToast(null); toastTimeoutRef.current = null }, 3000)
  }
  const removeToast = () => { if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current); setToast(null) }

  useEffect(() => {
    if (id) { loadTvShow(id); checkIfFavorite(); }
    return () => { if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current) }
  }, [id])
  
  useEffect(() => {
    if (showVideoPlayer) removeToast()
    document.body.style.overflow = showVideoPlayer ? 'hidden' : 'auto'
    return () => { document.body.style.overflow = 'auto' }
  }, [showVideoPlayer]) 

  useEffect(() => {
    if (episodeListRef.current && seasonDetails) {
      const activeCard = episodeListRef.current.querySelector('.episode-card.active, .ep-card.active')
      if (activeCard) activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [episode, seasonDetails])

  useEffect(() => {
    if (showVideoPlayer) {
      const handleResize = () => setIsWideScreen(window.innerWidth > window.innerHeight)
      handleResize()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [showVideoPlayer])

  useEffect(() => { setShowSynopsis(false) }, [episode, season])

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
        if (firstSeason) { setSeason(firstSeason.season_number); await loadSeasonDetails(firstSeason.season_number); }
      }
    } catch (err) { setError(err.message) } finally { setLoading(false) }
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
      } else { setSeasonDetails(null) }
    } catch (err) { setSeasonDetails(null) } finally { setLoading(false) }
  }

  const checkIfFavorite = () => {
    try {
      const savedFavorites = localStorage.getItem('yoshikawaFavorites')
      const favorites = savedFavorites ? JSON.parse(savedFavorites) : []
      const isFav = favorites.some(fav => fav.id === parseInt(id) && fav.media_type === 'tv')
      setIsFavorite(isFav)
    } catch (error) { setIsFavorite(false) }
  }

  const toggleFavorite = () => {
    if (!tvShow) return
    try {
      const savedFavorites = localStorage.getItem('yoshikawaFavorites')
      const favorites = savedFavorites ? JSON.parse(savedFavorites) : []
      if (isFavorite) {
        const newFavorites = favorites.filter(fav => !(fav.id === parseInt(id) && fav.media_type === 'tv'))
        localStorage.setItem('yoshikawaFavorites', JSON.stringify(newFavorites))
        setIsFavorite(false); showToast('Removido dos favoritos', 'info')
      } else {
        const newFavorite = {
          id: parseInt(id), media_type: 'tv', title: tvShow.name, poster_path: tvShow.poster_path,
          first_air_date: tvShow.first_air_date, overview: tvShow.overview
        }
        const newFavorites = [...favorites, newFavorite]
        localStorage.setItem('yoshikawaFavorites', JSON.stringify(newFavorites))
        setIsFavorite(true); showToast('Adicionado aos favoritos!', 'success')
      }
    } catch (error) { showToast('Erro ao salvar favorito', 'info') }
  }

  const getPlayerUrl = () => {
    const fullScreenParam = '&fullScreen=false' 
    if (selectedPlayer === 'superflix') return `${STREAM_BASE_URL}/serie/${id}/${season}/${episode}#noEpList#noLink#transparent#noBackground${fullScreenParam}`
    else return `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`
  }
  
  const closePopup = (setter) => { setter(false) };
  
  const toggleVideoFormat = () => setIsWideScreen(!isWideScreen);
  
  const handleSeasonChange = async (newSeason) => {
    setShowVideoPlayer(false); setSeason(newSeason); await loadSeasonDetails(newSeason)
  }

  const handleEpisodeChange = (newEpisode) => {
    setShowVideoPlayer(false); setEpisode(newEpisode); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePlayerChange = (player) => {
    setSelectedPlayer(player); setShowPlayerSelector(false)
    showToast(`Servidor: ${player === 'superflix' ? 'SuperFlix (DUB)' : 'VidSrc (LEG)'}`, 'info')
    if (showVideoPlayer) { setShowVideoPlayer(false); setTimeout(() => setShowVideoPlayer(true), 100); }
  }

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>
  if (error) return <div className="error-screen"><p>{error}</p><Link href="/" className="btn-back">Voltar</Link></div>
  if (!tvShow) return null

  const currentEpisode = seasonDetails?.episodes?.find(ep => ep.episode_number === episode)
  const currentEpIndex = seasonDetails?.episodes?.findIndex(ep => ep.episode_number === episode)
  const prevEp = currentEpIndex > 0 ? seasonDetails?.episodes[currentEpIndex - 1] : null
  const nextEp = (currentEpIndex !== -1 && currentEpIndex < (seasonDetails?.episodes?.length - 1)) ? seasonDetails?.episodes[currentEpIndex + 1] : null
  const availableSeasons = tvShow.seasons?.filter(s => s.season_number > 0 && s.episode_count > 0) || []
  const coverImage = currentEpisode?.still_path ? `https://image.tmdb.org/t/p/original${currentEpisode.still_path}` : (tvShow.backdrop_path ? `https://image.tmdb.org/t/p/original${tvShow.backdrop_path}` : null);

  return (
    <div className="ios-page">
      <Head>
        <title>{tvShow.name} - Yoshikawa</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>

      {/* NOVO HEADER */}
      <Header />

      <main className="content-container">
        
        {/* Player Hero Section (Mantido do código original) */}
        <div className="glass-card hero-player">
             <div className="cover-wrapper" onClick={() => setShowVideoPlayer(true)}>
                {coverImage && <img src={coverImage} alt="Cover" className="cover-img" />}
                <div className="play-overlay">
                    <div className="play-circle"><i className="fas fa-play"></i></div>
                    <span className="play-text">Assistir T{season}:E{episode}</span>
                </div>
             </div>
        </div>

        {/* Info & Controls (Mantido do código original) */}
        <div className="glass-card info-section">
          <div className="info-header">
            <div className="season-control">
                <select value={season} onChange={(e) => handleSeasonChange(parseInt(e.target.value))}>
                    {availableSeasons.map(s => <option key={s.season_number} value={s.season_number}>Temporada {s.season_number}</option>)}
                </select>
                <i className="fas fa-chevron-down select-icon"></i>
            </div>
            <div className="episode-badge">EP {episode}</div>
          </div>
          
          <h1>{currentEpisode?.name || `Episódio ${episode}`}</h1>
          
          <div className={`synopsis ${showSynopsis ? 'expanded' : ''}`}>
            <p>{currentEpisode?.overview || tvShow.overview || 'Sem descrição.'}</p>
          </div>
          <button className="text-btn" onClick={() => setShowSynopsis(!showSynopsis)}>
             {showSynopsis ? 'Ler menos' : 'Ler sinopse completa'}
          </button>
        </div>

        {/* Horizontal Episode List (Mantido do código original) */}
        <div className="episode-scroller-container">
            <div className="episode-track" ref={episodeListRef}>
                {seasonDetails?.episodes?.map(ep => (
                    <div key={ep.episode_number} className={`ep-card ${ep.episode_number === episode ? 'active' : ''}`} onClick={() => handleEpisodeChange(ep.episode_number)}>
                        <div className="ep-img">
                            {ep.still_path ? <img src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} loading="lazy" /> : <div className="no-img"><i className="fas fa-tv"></i></div>}
                            {ep.episode_number === episode && <div className="now-playing"><i className="fas fa-chart-simple"></i></div>}
                        </div>
                        <div className="ep-meta">
                            <span className="ep-num">{ep.episode_number}</span>
                            <span className="ep-name">{ep.name}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Video Modal (Mantido do código original) */}
        {showVideoPlayer && (
            <div className="modal-overlay" onClick={() => closePopup(setShowVideoPlayer)}>
                <div className={`video-modal ${isWideScreen ? 'wide' : ''}`} onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <span>T{season} : E{episode}</span>
                        <div className="modal-actions">
                            <button onClick={toggleVideoFormat}><i className={`fas ${isWideScreen ? 'fa-compress' : 'fa-expand'}`}></i></button>
                            <button onClick={() => closePopup(setShowVideoPlayer)} className="close"><i className="fas fa-times"></i></button>
                        </div>
                    </div>
                    <div className="iframe-container">
                        <iframe src={getPlayerUrl()} allow="autoplay; encrypted-media; fullscreen" title="Player"></iframe>
                    </div>
                    <div className="modal-footer">
                        <button disabled={!prevEp} onClick={() => prevEp && setEpisode(prevEp.episode_number)}><i className="fas fa-backward-step"></i> Anterior</button>
                        <button disabled={!nextEp} onClick={() => nextEp && setEpisode(nextEp.episode_number)}>Próximo <i className="fas fa-forward-step"></i></button>
                    </div>
                </div>
            </div>
        )}

        {/* Player Selector Modal (Mantido do código original) */}
        {showPlayerSelector && (
            <div className="modal-overlay" onClick={() => setShowPlayerSelector(false)}>
                <div className="glass-menu-up" onClick={(e) => e.stopPropagation()}>
                    <h3>Escolha o Player</h3>
                    <div className="menu-option" onClick={() => handlePlayerChange('superflix')}>
                        <div className="icon dub"><i className="fas fa-microphone"></i></div>
                        <div className="label">SuperFlix <span>Dublado • HD</span></div>
                        {selectedPlayer === 'superflix' && <i className="fas fa-check check"></i>}
                    </div>
                    <div className="menu-option" onClick={() => handlePlayerChange('vidsrc')}>
                        <div className="icon leg"><i className="fas fa-closed-captioning"></i></div>
                        <div className="label">VidSrc <span>Legendado • Rápido</span></div>
                        {selectedPlayer === 'vidsrc' && <i className="fas fa-check check"></i>}
                    </div>
                </div>
            </div>
        )}

        {/* Info Popup (Mantido do código original) */}
        {showInfoPopup && (
            <div className="modal-overlay" onClick={() => setShowInfoPopup(false)}>
                <div className="glass-card info-popup" onClick={(e) => e.stopPropagation()}>
                    <div className="popup-top">
                        <img src={`https://image.tmdb.org/t/p/w200${tvShow.poster_path}`} />
                        <div>
                            <h2>{tvShow.name}</h2>
                            <div className="tags">
                                <span>{new Date(tvShow.first_air_date).getFullYear()}</span>
                                <span><i className="fas fa-star"></i> {tvShow.vote_average.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                    <button className="btn-full" onClick={() => setShowInfoPopup(false)}>Fechar</button>
                </div>
            </div>
        )}

        {/* Toast (Mantido do código original) */}
        {toast && !showVideoPlayer && (
            <div className={`toast type-${toast.type}`}>
                <i className="fas fa-info-circle"></i> {toast.message}
            </div>
        )}

      </main>

      {/* NOVA BOTTOM NAV */}
      <BottomNav 
        selectedPlayer={selectedPlayer} 
        onPlayerChange={() => setShowPlayerSelector(true)} 
        isFavorite={isFavorite} 
        onToggleFavorite={toggleFavorite} 
        onShowInfo={() => setShowInfoPopup(true)} 
      />

      <style jsx global>{`
        :root {
            --bg-body: #050507;
            --glass-bg: rgba(30, 30, 32, 0.70);
            --glass-border: rgba(255, 255, 255, 0.08);
            --accent: #0A84FF; /* Primary */
            --text-main: #F5F5F7;
            --text-sec: #86868b;
            
            /* Variáveis para a nova Navbar/Header */
            --primary: #0A84FF;
            --secondary: #86868b;
            --card-bg: rgba(30, 30, 32, 0.85);
            --border: rgba(255, 255, 255, 0.15);
            --text: #F5F5F7;
        }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; background: var(--bg-body); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: var(--text-main); }
        
        .ios-page { padding-bottom: 90px; min-height: 100vh; }
        .content-container { padding: 80px 20px 20px; max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }

        /* Glassmorphism Cards */
        .glass-card {
            background: var(--glass-bg);
            backdrop-filter: blur(25px) saturate(180%);
            -webkit-backdrop-filter: blur(25px) saturate(180%);
            border: 1px solid var(--glass-border);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
            transition: transform 0.2s;
        }

        /* Hero Player */
        .hero-player { aspect-ratio: 16/9; position: relative; cursor: pointer; }
        .hero-player:active { transform: scale(0.98); }
        .cover-wrapper { width: 100%; height: 100%; position: relative; }
        .cover-img { width: 100%; height: 100%; object-fit: cover; opacity: 0.6; mask-image: linear-gradient(to bottom, black 0%, transparent 120%); }
        .play-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; }
        .play-circle { width: 70px; height: 70px; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 10px 20px rgba(0,0,0,0.3); color: white; transition: all 0.3s; }
        .hero-player:hover .play-circle { background: var(--accent); border-color: var(--accent); transform: scale(1.1); }
        .play-text { font-weight: 500; font-size: 14px; color: rgba(255,255,255,0.8); letter-spacing: 0.5px; }

        /* Info Section */
        .info-section { padding: 24px; display: flex; flex-direction: column; gap: 12px; }
        .info-header { display: flex; justify-content: space-between; align-items: center; }
        .season-control { position: relative; background: rgba(0,0,0,0.3); border-radius: 12px; padding: 0; }
        .season-control select { appearance: none; background: transparent; color: var(--text-main); border: none; padding: 8px 32px 8px 16px; font-size: 14px; font-weight: 600; outline: none; }
        .select-icon { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: 10px; pointer-events: none; color: var(--text-sec); }
        .episode-badge { background: var(--accent); color: white; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        h1 { margin: 0; font-size: 22px; font-weight: 700; line-height: 1.2; letter-spacing: -0.5px; }
        .synopsis p { margin: 0; color: var(--text-sec); font-size: 14px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: all 0.3s; }
        .synopsis.expanded p { -webkit-line-clamp: unset; }
        .text-btn { background: none; border: none; color: var(--accent); padding: 0; font-size: 13px; font-weight: 500; cursor: pointer; align-self: flex-start; margin-top: -5px; }

        /* Episode Scroller */
        .episode-scroller-container { margin: 0 -20px; padding: 0 20px; }
        .episode-track { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 20px; scrollbar-width: none; }
        .episode-track::-webkit-scrollbar { display: none; }
        .ep-card { min-width: 140px; width: 140px; cursor: pointer; opacity: 0.5; transition: all 0.3s; transform: scale(0.95); }
        .ep-card.active { opacity: 1; transform: scale(1); }
        .ep-img { width: 100%; aspect-ratio: 16/9; border-radius: 12px; overflow: hidden; position: relative; border: 2px solid transparent; background: #1c1c1e; }
        .ep-card.active .ep-img { border-color: var(--accent); box-shadow: 0 0 15px rgba(10, 132, 255, 0.3); }
        .ep-img img { width: 100%; height: 100%; object-fit: cover; }
        .no-img { display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-sec); }
        .now-playing { position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; color: var(--accent); font-size: 18px; }
        .ep-meta { margin-top: 8px; display: flex; gap: 8px; align-items: baseline; }
        .ep-num { font-size: 10px; font-weight: 800; color: rgba(255,255,255,0.3); }
        .ep-name { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* Modals & Overlays */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(10px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        
        .video-modal { width: 100%; max-width: 600px; background: black; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.8); display: flex; flex-direction: column; transition: all 0.3s; }
        .video-modal.wide { max-width: 90vw; }
        .modal-header { display: flex; justify-content: space-between; padding: 15px 20px; background: #111; color: white; align-items: center; }
        .modal-header button { background: none; border: none; color: white; font-size: 16px; margin-left: 15px; cursor: pointer; }
        .iframe-container { width: 100%; aspect-ratio: 16/9; background: #000; }
        .iframe-container iframe { width: 100%; height: 100%; border: none; }
        .modal-footer { padding: 15px; background: #111; display: flex; justify-content: space-around; }
        .modal-footer button { background: #222; border: none; color: white; padding: 10px 20px; border-radius: 30px; font-size: 13px; display: flex; gap: 8px; align-items: center; cursor: pointer; }
        .modal-footer button:disabled { opacity: 0.3; }

        /* Menu Up (Selector) */
        .glass-menu-up { background: #1c1c1e; width: 100%; max-width: 320px; border-radius: 24px; padding: 20px; border: 1px solid #333; position: relative; animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .glass-menu-up h3 { margin: 0 0 15px; font-size: 14px; color: var(--text-sec); text-align: center; text-transform: uppercase; letter-spacing: 1px; }
        .menu-option { display: flex; align-items: center; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 16px; margin-bottom: 10px; cursor: pointer; transition: background 0.2s; position: relative; }
        .menu-option:active { background: rgba(255,255,255,0.1); }
        .menu-option .icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 18px; }
        .icon.dub { background: linear-gradient(135deg, #FF9500, #FF5E3A); color: white; }
        .icon.leg { background: linear-gradient(135deg, #5AC8FA, #007AFF); color: white; }
        .menu-option .label { display: flex; flex-direction: column; font-size: 15px; font-weight: 600; }
        .menu-option .label span { font-size: 12px; color: var(--text-sec); font-weight: 400; margin-top: 2px; }
        .check { margin-left: auto; color: var(--accent); }

        /* Info Popup */
        .info-popup { max-width: 350px; padding: 20px; }
        .popup-top { display: flex; gap: 15px; margin-bottom: 20px; }
        .popup-top img { width: 100px; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.5); }
        .popup-top h2 { font-size: 18px; margin: 0 0 10px; line-height: 1.3; }
        .tags span { display: inline-block; background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 6px; font-size: 12px; margin-right: 5px; margin-bottom: 5px; }
        .btn-full { width: 100%; background: rgba(255,255,255,0.1); border: none; color: white; padding: 12px; border-radius: 12px; font-weight: 600; cursor: pointer; }

        .toast { position: fixed; top: 80px; left: 50%; transform: translateX(-50%); background: rgba(50,50,50,0.9); backdrop-filter: blur(10px); padding: 12px 24px; border-radius: 30px; display: flex; align-items: center; gap: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); font-size: 14px; z-index: 2000; border: 1px solid rgba(255,255,255,0.1); }
        .toast.type-success { color: #32D74B; }
        .toast.type-info { color: white; }

        /* Loading */
        .loading-screen, .error-screen { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--bg-body); color: white; }
        .spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .btn-back { margin-top: 15px; padding: 10px 20px; background: #222; color: white; text-decoration: none; border-radius: 8px; }

        /* --- STYLES FOR NEW HEADER --- */
        .github-header {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 60px;
            background: rgba(5, 5, 7, 0.85);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-bottom: 1px solid var(--border);
            z-index: 900;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .header-content {
            width: 90%;
            max-width: 1000px;
            display: flex;
            align-items: center;
        }

        .logo-container {
            display: flex;
            align-items: center;
            gap: 12px;
            text-decoration: none;
            color: var(--text);
            transition: opacity 0.2s;
        }
        
        .logo-container:hover { opacity: 0.8; }
        .logo-image { width: 32px; height: 32px; border-radius: 8px; }
        
        .logo-text { display: flex; flex-direction: column; line-height: 1; }
        .logo-name { font-weight: 700; font-size: 16px; letter-spacing: -0.5px; }
        .beta-tag { font-size: 9px; color: var(--primary); font-weight: 800; letter-spacing: 1px; margin-top: 2px; }

        /* --- STYLES FOR NEW BOTTOM NAV --- */
        .bottom-nav-container {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 800;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            width: 100%;
            max-width: 320px;
        }

        .main-nav-bar {
            flex: 1;
            background: var(--card-bg);
            backdrop-filter: blur(30px) saturate(180%);
            -webkit-backdrop-filter: blur(30px) saturate(180%);
            border: 1px solid var(--border);
            height: 60px;
            border-radius: 30px;
            display: flex;
            align-items: center;
            justify-content: space-evenly;
            padding: 0 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        }

        .nav-item {
            background: none;
            border: none;
            color: var(--secondary);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            font-size: 18px;
            cursor: pointer;
            width: 60px;
            transition: all 0.2s;
        }

        .nav-item span { font-size: 9px; font-weight: 600; letter-spacing: 0.5px; }
        .nav-item:hover { color: var(--text); }
        .nav-item.active { color: #FF2D55; }
        .nav-item.active i { transform: scale(1.1); filter: drop-shadow(0 0 8px rgba(255,45,85,0.4)); }

        .player-circle {
            width: 60px;
            height: 60px;
            background: var(--primary);
            border-radius: 50%;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
            box-shadow: 0 10px 30px rgba(10, 132, 255, 0.4);
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            z-index: 801;
        }

        .player-circle:hover { transform: scale(1.05); box-shadow: 0 15px 40px rgba(10, 132, 255, 0.5); }
        .player-circle:active { transform: scale(0.95); }
      `}</style>
    </div>
  )
}

// NOVO HEADER (Do segundo código)
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

// NOVA BOTTOM NAV (Do segundo código)
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
