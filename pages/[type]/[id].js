import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
const DEFAULT_BACKDROP = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'

export const Header = ({ 
  label, scrolled, 
  showInfo, toggleInfo, infoClosing, 
  showTech, toggleTech, techClosing,
  navHidden
}) => {
  const handleRightClick = (e) => {
    e.stopPropagation()
    if (scrolled) window.scrollTo({ top: 0, behavior: 'smooth' })
    else toggleInfo()
  }

  return (
    <>
      <header className={`bar-container top-bar ${scrolled ? 'scrolled-state' : ''} ${navHidden ? 'nav-hidden' : ''}`}>
        <button className="round-btn glass-panel" onClick={(e) => { e.stopPropagation(); toggleTech() }} title="Info Técnica">
          <i className="fas fa-microchip" style={{ fontSize: '14px' }}></i>
        </button>
        <div className="pill-container glass-panel">
          <span key={label} className="bar-label">{label}</span>
        </div>
        <button className="round-btn glass-panel" title={scrolled ? "Voltar ao topo" : "Informações"} onClick={handleRightClick}>
          <i className={scrolled ? "fas fa-chevron-up" : "fas fa-info-circle"} style={{ fontSize: '14px' }}></i>
        </button>
      </header>

      {showInfo && (
        <div className={`standard-popup glass-panel ${infoClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="popup-icon-wrapper info"><i className="fas fa-shield-halved"></i></div>
          <div className="popup-content">
            <p className="popup-title">Proteção Recomendada</p>
            <p className="popup-text">Use <strong>Brave</strong> ou <strong>AdBlock</strong></p>
          </div>
        </div>
      )}

      {showTech && (
        <div className={`standard-popup glass-panel ${techClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="popup-icon-wrapper tech"><i className="fas fa-microchip"></i></div>
          <div className="popup-content">
            <p className="popup-title">Informações Técnicas</p>
            <p className="popup-text">v2.8.0 • React 18 • TMDB API</p>
          </div>
        </div>
      )}
    </>
  )
}

export const BottomNav = ({ isFavorite, onToggleFavorite, onToggleSynopsis, onToggleData, onToggleNav, navHidden }) => {
  const [animating, setAnimating] = useState(false)
  const handleShare = async () => {
    if (navigator.share) try { await navigator.share({ title: 'Yoshikawa Player', url: window.location.href }) } catch {}
    else alert('Indisponível')
  }
  const handleFavClick = () => {
    setAnimating(true); onToggleFavorite(); setTimeout(() => setAnimating(false), 400)
  }

  return (
    <div className={`bar-container bottom-bar ${navHidden ? 'nav-hidden' : ''}`}>
      <button className="round-btn glass-panel share-btn" onClick={handleShare}><i className="fas fa-arrow-up-from-bracket"></i></button>
      <div className={`pill-container glass-panel ${navHidden ? 'hidden-pill' : ''}`}>
         <button className="nav-btn" onClick={onToggleData}><i className="fas fa-film"></i></button>
         <button className="nav-btn hide-toggle-pill-btn" onClick={onToggleNav}>
            <i className={navHidden ? "fas fa-chevron-down" : "fas fa-chevron-up"}></i>
         </button>
         <button className="nav-btn" onClick={onToggleSynopsis}><i className="fas fa-align-left"></i></button>
      </div>
      <button className={`round-btn glass-panel fav-btn ${navHidden ? 'hidden-fav' : ''}`} onClick={handleFavClick}>
        <i className={`${isFavorite ? 'fas fa-heart' : 'far fa-heart'} ${animating ? 'heart-pulse' : ''}`} style={{ color: isFavorite ? '#ff3b30' : '#ffffff' }}></i>
      </button>
    </div>
  )
}

export const ToastContainer = ({ toast, closeToast }) => {
  if (!toast) return null
  return (
    <div className="toast-wrap">
      <div className={`toast glass-panel ${toast.type} ${toast.closing ? 'closing' : ''}`} onClick={closeToast}>
        <div className="toast-icon-wrapper">
          <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : toast.type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}`}></i>
        </div>
        <div className="toast-content">
          <div className="toast-title">{toast.type === 'success' ? 'Sucesso' : toast.type === 'error' ? 'Erro' : 'Info'}</div>
          <div className="toast-msg">{toast.message}</div>
        </div>
      </div>
    </div>
  )
}

const LoadingScreen = ({ visible }) => {
  if (!visible) return null;
  return (
    <div className={`loading-overlay ${!visible ? 'fade-out' : ''}`}>
      <div className="loading-content">
        <div className="spinner-apple"><div className="spinner-ring"></div></div>
        <div className="loading-bar"><div className="loading-progress"></div></div>
        <div className="kawa-footer">SOFTWARE BY KAWA &lt;3</div>
      </div>
    </div>
  )
}

export default function WatchPage() {
  const router = useRouter()
  const { type, id } = router.query
  const carouselRef = useRef(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [navHidden, setNavHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [infoClosing, setInfoClosing] = useState(false)
  const [showTechPopup, setShowTechPopup] = useState(false)
  const [techClosing, setTechClosing] = useState(false)
  const [showSynopsisPopup, setShowSynopsisPopup] = useState(false)
  const [synopsisClosing, setSynopsisClosing] = useState(false)
  const [showDataPopup, setShowDataPopup] = useState(false)
  const [dataClosing, setDataClosing] = useState(false)
  
  const [currentToast, setCurrentToast] = useState(null)
  const [toastQueue, setToastQueue] = useState([])
  const [content, setContent] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isWideMode, setIsWideMode] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [seasonData, setSeasonData] = useState(null)
  const toastTimerRef = useRef(null)

  useEffect(() => {
    if (content) setTimeout(() => setIsLoading(false), 1000)
  }, [content])

  const showToast = (message, type = 'info') => {
    closeAllPopups()
    if (currentToast && !currentToast.closing) {
      setCurrentToast(prev => ({ ...prev, closing: true }))
      setTimeout(() => setToastQueue(prev => [...prev, { message, type, id: Date.now() }]), 200)
    } else {
      setToastQueue(prev => [...prev, { message, type, id: Date.now() }])
    }
  }

  useEffect(() => {
    if (toastQueue.length > 0) {
      if (currentToast && !currentToast.closing) {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
        setCurrentToast(prev => ({ ...prev, closing: true }))
      } else if (!currentToast) {
        const next = toastQueue[0]
        setToastQueue(prev => prev.slice(1))
        setCurrentToast({ ...next, closing: false })
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
        toastTimerRef.current = setTimeout(() => setCurrentToast(t => (t && t.id === next.id ? { ...t, closing: true } : t)), 2500)
      }
    }
  }, [toastQueue, currentToast])

  useEffect(() => {
    if (currentToast?.closing) setTimeout(() => setCurrentToast(null), 400)
  }, [currentToast])

  useEffect(() => {
    if (!id || !type) return
    const loadContent = async () => {
      try {
        const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=external_ids`)
        const data = await res.json()
        setContent(data)
        if (type === 'tv') await fetchSeason(id, 1)
        checkFavoriteStatus(data)
      } catch (e) { showToast('Erro ao carregar', 'error'); setIsLoading(false) }
    }
    loadContent()
  }, [id, type])

  const fetchSeason = async (tvId, seasonNum) => {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNum}?api_key=${TMDB_API_KEY}&language=pt-BR`)
      setSeasonData(await res.json())
      setSeason(seasonNum)
    } catch { showToast('Erro na temporada', 'error') }
  }

  const checkFavoriteStatus = (item) => {
    try {
      const favs = JSON.parse(localStorage.getItem('yoshikawaFavorites') || '[]')
      setIsFavorite(favs.some(f => f.id === item.id && f.media_type === type))
    } catch { setIsFavorite(false) }
  }

  const toggleFavorite = () => {
    if (!content) return
    try {
      let favs = JSON.parse(localStorage.getItem('yoshikawaFavorites') || '[]')
      const exists = favs.some(f => f.id === content.id && f.media_type === type)
      if (exists) {
        favs = favs.filter(f => !(f.id === content.id && f.media_type === type))
        setIsFavorite(false); showToast('Removido', 'info')
      } else {
        favs.push({ id: content.id, media_type: type, title: content.title || content.name, poster_path: content.poster_path })
        setIsFavorite(true); showToast('Adicionado', 'success')
      }
      localStorage.setItem('yoshikawaFavorites', JSON.stringify(favs))
    } catch { showToast('Erro ao salvar', 'error') }
  }

  const closeAllPopups = useCallback(() => {
    if (showInfoPopup) { setInfoClosing(true); setTimeout(() => { setShowInfoPopup(false); setInfoClosing(false) }, 400) }
    if (showTechPopup) { setTechClosing(true); setTimeout(() => { setShowTechPopup(false); setTechClosing(false) }, 400) }
    if (showSynopsisPopup) { setSynopsisClosing(true); setTimeout(() => { setShowSynopsisPopup(false); setSynopsisClosing(false) }, 400) }
    if (showDataPopup) { setDataClosing(true); setTimeout(() => { setShowDataPopup(false); setDataClosing(false) }, 400) }
    if (currentToast && !currentToast.closing) setCurrentToast(prev => ({ ...prev, closing: true }))
  }, [showInfoPopup, showTechPopup, showSynopsisPopup, showDataPopup, currentToast])

  const togglePopup = (state, setState, closeState, setCloseState) => {
    if (Object.values({showInfoPopup, showTechPopup, showSynopsisPopup, showDataPopup}).some(v=>v)) closeAllPopups()
    if (state) { setCloseState(true); setTimeout(() => { setState(false); setCloseState(false) }, 400) }
    else { setTimeout(() => setState(true), 200) }
  }

  const toggleNavVisibility = () => {
    if (!navHidden) closeAllPopups()
    setNavHidden(!navHidden)
  }

  useEffect(() => {
    const onScroll = () => { if (window.scrollY > 10) closeAllPopups(); setScrolled(window.scrollY > 60) }
    const onClick = (e) => { if (!e.target.closest('.standard-popup') && !e.target.closest('.toast') && !e.target.closest('.round-btn') && !e.target.closest('.pill-container')) closeAllPopups() }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('click', onClick)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('click', onClick) }
  }, [closeAllPopups])

  useEffect(() => {
    if (carouselRef.current) carouselRef.current.querySelector('.ep-card.active')?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [episode, seasonData])

  const handleNextEp = () => {
    if (seasonData?.episodes && episode + 1 <= seasonData.episodes.length) setEpisode(e => e + 1)
    else showToast('Fim da temporada', 'info')
  }

  const getEmbedUrl = () => {
    if (!content) return ''
    if (type === 'movie') return `https://playerflixapi.com/filme/${content.external_ids?.imdb_id || content.imdb_id}`
    return `https://playerflixapi.com/serie/${id}/${season}/${episode}`
  }

  const releaseDate = content?.release_date || content?.first_air_date || '?'
  const rating = content?.vote_average?.toFixed(1) || 'N/A'
  const genres = content?.genres?.map(g => g.name).join(', ') || ''
  const currentEpisodeData = seasonData?.episodes?.find(e => e.episode_number === episode)

  return (
    <>
      <Head>
        <title>{content ? (content.title || content.name) : 'Yoshikawa'} - Reproduzindo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
          html { scroll-behavior: smooth; }
          body { font-family: 'Inter', sans-serif; background: #050505; color: #f5f5f7; overflow-x: hidden; }
          .site-wrapper { min-height: 100vh; position: relative; padding-bottom: 20px; }
          .site-wrapper::before { content: ''; position: fixed; inset: 0; background: rgba(5, 5, 5, 0.85); pointer-events: none; z-index: 0; }
          .site-wrapper > * { position: relative; z-index: 1; }
          
          /* Loading */
          .loading-overlay { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; background: #050505; transition: all 0.8s ease; }
          .loading-overlay.fade-out { opacity: 0; visibility: hidden; pointer-events: none; }
          .loading-content { display: flex; flex-direction: column; align-items: center; gap: 24px; }
          .spinner-apple { width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; position: relative; }
          .spinner-ring { width: 100%; height: 100%; border: 2.5px solid rgba(255,255,255,0.15); border-radius: 50%; border-top-color: #fff; animation: spin 1s linear infinite; }
          .loading-bar { width: 140px; height: 2px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; }
          .loading-progress { height: 100%; background: #fff; width: 0%; animation: loadBar 3s ease infinite; }
          .kawa-footer { margin-top: 20px; font-size: 11px; opacity: 0.3; letter-spacing: 3px; font-weight: 600; }
          @keyframes spin { 100% { transform: rotate(360deg); } }
          @keyframes loadBar { 0% { width: 0%; } 50% { width: 70%; } 100% { width: 100%; } }

          /* Layout & Glass */
          .glass-panel { background: rgba(255, 255, 255, 0.06); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
          .container { max-width: 1280px; margin: 0 auto; padding: 6.5rem 2rem 7rem; }
          
          /* Nav Bars */
          .bar-container { position: fixed; left: 50%; transform: translateX(-50%); z-index: 1000; display: flex; gap: 12px; width: 90%; max-width: 520px; transition: all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); }
          .top-bar { top: 20px; } 
          .bottom-bar { bottom: 20px; }
          .top-bar.nav-hidden { opacity: 0; transform: translate(-50%, -100px); pointer-events: none; }
          
          /* Navbar Pill Refinement */
          .pill-container { height: 44px; flex: 1; border-radius: 50px; display: flex; align-items: center; justify-content: center; position: relative; transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1); overflow: hidden; }
          .bottom-bar.nav-hidden { width: auto; gap: 0; }
          .bottom-bar.nav-hidden .pill-container { width: 44px; flex: 0 0 44px; background: rgba(255,255,255,0.06); padding: 0; }
          .bottom-bar.nav-hidden .round-btn { width: 0; opacity: 0; margin: 0; padding: 0; pointer-events: none; }
          .nav-btn { flex: 1; height: 100%; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.4); transition: 0.3s; }
          .bottom-bar.nav-hidden .nav-btn:not(.hide-toggle-pill-btn) { width: 0; flex: 0; opacity: 0; padding: 0; }
          .hide-toggle-pill-btn { color: rgba(255,255,255,0.7); }
          .nav-btn:hover i { transform: scale(1.2); color: #fff; }
          .round-btn { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #eee; transition: 0.4s; }
          .round-btn:hover { transform: scale(1.1); background: rgba(255,255,255,0.15); }

          /* Popups */
          .standard-popup, .toast { position: fixed; top: 80px; left: 50%; transform: translate(-50%, -50%) scale(0.5); opacity: 0; z-index: 2000; min-width: 300px; border-radius: 20px; padding: 16px; display: flex; gap: 14px; animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; pointer-events: none; }
          .standard-popup.closing, .toast.closing { animation: popOut 0.3s ease forwards; }
          .toast { z-index: 2100; pointer-events: auto; }
          @keyframes popIn { 100% { opacity: 1; transform: translate(-50%, 0) scale(1); pointer-events: auto; } }
          @keyframes popOut { 100% { opacity: 0; transform: translate(-50%, -20px) scale(0.8); } }
          .popup-icon-wrapper { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
          .info .popup-icon-wrapper { background: linear-gradient(135deg, #34c759, #30d158); }
          .tech .popup-icon-wrapper { background: linear-gradient(135deg, #0a84ff, #007aff); }
          .popup-content { flex: 1; }
          .popup-title { font-size: 0.9rem; font-weight: 600; margin-bottom: 2px; }
          .popup-text { font-size: 0.75rem; color: #aaa; }

          /* Content */
          .player-banner-container { width: 100%; aspect-ratio: 16/9; border-radius: 24px; overflow: hidden; position: relative; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 20px 50px rgba(0,0,0,0.5); margin-bottom: 24px; cursor: pointer; transition: transform 0.4s; }
          .player-banner-container:hover { transform: scale(1.01); }
          .play-button-static { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 64px; height: 64px; background: rgba(0,0,0,0.4); backdrop-filter: blur(10px); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.3); }
          .details-container { border-radius: 24px; padding: 20px; display: flex; flex-direction: column; gap: 16px; background: rgba(255,255,255,0.02); }
          .media-title { font-size: 1.4rem; font-weight: 700; color: #fff; }
          
          /* Carousel & Cards */
          .season-controls { display: flex; margin-top: 5px; }
          .native-season-select { background: #1a1a1a; color: #fff; border: 1px solid rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 10px; outline: none; }
          .episodes-carousel { display: flex; gap: 12px; overflow-x: auto; padding: 10px 4px 20px 4px; scrollbar-width: none; }
          .ep-card { min-width: 140px; height: 80px; border-radius: 12px; position: relative; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94); background-color: #111; background-size: cover; background-position: center; overflow: visible; display: flex; align-items: center; justify-content: center; }
          
          /* Empty State Icon */
          .no-img-icon { font-size: 24px; color: rgba(255,255,255,0.2); }

          /* Card Styling */
          .ep-card.active { border-color: #fff; transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.3); }
          .ep-card-info { position: absolute; bottom: 8px; left: 8px; z-index: 2; }
          .ep-card-num-box { background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; color: #fff; border: 1px solid rgba(255,255,255,0.1); }
          
          /* Arrow Indicator */
          .ep-card::after { content: ''; position: absolute; bottom: -14px; left: 50%; transform: translateX(-50%) scale(0); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 8px solid #fff; transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); opacity: 0; }
          .ep-card.active::after { transform: translateX(-50%) scale(1); opacity: 1; bottom: -10px; }

          /* Player Overlay */
          .player-overlay { position: fixed; inset: 0; backdrop-filter: blur(25px); z-index: 2000; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.4s ease; background: rgba(0,0,0,0.4); }
          .player-wrapper-vertical { display: flex; flex-direction: column; align-items: center; width: 100%; animation: slideUp 0.5s cubic-bezier(0.2, 0.8, 0.2, 1); }
          .player-header-controls { width: min(80vw, 900px); display: flex; justify-content: space-between; margin-bottom: 15px; }
          .ep-indicator { font-weight: 700; background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); }
          .right-controls { display: flex; gap: 10px; }
          .control-btn { width: 40px; height: 40px; background: rgba(255,255,255,0.1); border-radius: 50%; color: #fff; border: 1px solid rgba(255,255,255,0.1); }
          .player-popup-container { background: #000; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 0 50px rgba(0,0,0,0.8); }
          .popup-size-square { width: min(70vw, 50vh); aspect-ratio: 1; }
          .popup-size-banner { width: min(90vw, 1000px); aspect-ratio: 16/9; }
          .player-embed { width: 100%; height: 100%; }
          .player-bottom-controls { display: flex; gap: 15px; margin-top: 20px; }
          .nav-ep-btn { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 10px 24px; border-radius: 30px; font-weight: 600; display: flex; gap: 8px; align-items: center; transition: 0.3s; }
          .nav-ep-btn:hover { background: rgba(255,255,255,0.2); transform: scale(1.05); }
          
          @media (max-width: 768px) {
             .container { padding-left: 1.5rem; padding-right: 1.5rem; }
             .popup-size-square { width: 90vw; height: 90vw; }
             .player-header-controls { width: 90vw; }
          }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        `}</style>
      </Head>

      <LoadingScreen visible={isLoading} />

      {content && (
        <div className="site-wrapper" style={{ backgroundImage: content?.backdrop_path ? `url(https://image.tmdb.org/t/p/original${content.backdrop_path})` : `url(${DEFAULT_BACKDROP})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
          
          <Header label={scrolled ? "Reproduzindo" : "Yoshikawa"} scrolled={scrolled} showInfo={showInfoPopup} toggleInfo={() => togglePopup(showInfoPopup, setShowInfoPopup, infoClosing, setInfoClosing)} infoClosing={infoClosing} showTech={showTechPopup} toggleTech={() => togglePopup(showTechPopup, setShowTechPopup, techClosing, setTechClosing)} techClosing={techClosing} navHidden={navHidden} />
          
          <ToastContainer toast={currentToast} closeToast={() => setCurrentToast({ ...currentToast, closing: true })} />

          {showSynopsisPopup && (
            <div className={`standard-popup glass-panel ${synopsisClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
              <div className="popup-icon-wrapper" style={{background:'linear-gradient(135deg, #ff9500, #ff8c00)'}}><i className="fas fa-align-left"></i></div>
              <div className="popup-content"><p className="popup-title">Sinopse</p><p className="popup-text">{type === 'tv' && currentEpisodeData?.overview ? currentEpisodeData.overview : content?.overview || "Sem sinopse."}</p></div>
            </div>
          )}

          {showDataPopup && (
            <div className={`standard-popup glass-panel ${dataClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
               <div className="popup-icon-wrapper" style={{background:'linear-gradient(135deg, #bf5af2, #a448e0)'}}><i className="fas fa-film"></i></div>
               <div className="popup-content"><p className="popup-title">Dados</p><p className="popup-text">{releaseDate}<br/>{rating} ⭐ • {genres}</p></div>
            </div>
          )}

          <main className="container">
            <div className="player-banner-container" onClick={() => setIsPlaying(true)} style={{ backgroundImage: currentEpisodeData?.still_path ? `url(https://image.tmdb.org/t/p/original${currentEpisodeData.still_path})` : content.backdrop_path ? `url(https://image.tmdb.org/t/p/original${content.backdrop_path})` : 'none', backgroundColor: '#1a1a1a' }}>
              <div className="play-button-static"><i className="fas fa-play" style={{color:'#fff', marginLeft:'4px'}}></i></div>
            </div>

            <div className="glass-panel details-container">
              <h2 className="media-title">{content.title || content.name}</h2>
              {type === 'tv' && (
                <>
                  <div className="season-controls">
                    <select className="native-season-select" value={season} onChange={(e) => { fetchSeason(id, e.target.value); setEpisode(1) }}>
                       {Array.from({ length: content?.number_of_seasons || 1 }, (_, i) => i + 1).map(num => <option key={num} value={num}>Temporada {num}</option>)}
                    </select>
                  </div>
                  <div className="episodes-carousel" ref={carouselRef}>
                    {seasonData?.episodes?.map(ep => (
                      <div key={ep.id} className={`ep-card ${ep.episode_number === episode ? 'active' : ''}`} onClick={() => setEpisode(ep.episode_number)} style={{ backgroundImage: ep.still_path ? `url(https://image.tmdb.org/t/p/w300${ep.still_path})` : 'none' }}>
                        {!ep.still_path && <i className="fas fa-image no-img-icon"></i>}
                        <div className="ep-card-info"><span className="ep-card-num-box">Ep {ep.episode_number}</span></div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </main>

          <BottomNav isFavorite={isFavorite} onToggleFavorite={toggleFavorite} onToggleSynopsis={() => togglePopup(showSynopsisPopup, setShowSynopsisPopup, synopsisClosing, setSynopsisClosing)} onToggleData={() => togglePopup(showDataPopup, setShowDataPopup, dataClosing, setDataClosing)} onToggleNav={toggleNavVisibility} navHidden={navHidden} />
        </div>
      )}

      {isPlaying && (
        <div className="player-overlay">
          <div className="player-wrapper-vertical">
            <div className="player-header-controls">
              <span className="ep-indicator">{type === 'tv' ? `S${season}:E${episode}` : 'FILME'}</span>
              <div className="right-controls">
                <button className="control-btn" onClick={() => setIsWideMode(!isWideMode)}><i className={isWideMode ? "fas fa-compress" : "fas fa-expand"}></i></button>
                <button className="control-btn" onClick={() => setIsPlaying(false)}><i className="fas fa-xmark"></i></button>
              </div>
            </div>
            <div className={`player-popup-container ${isWideMode ? 'popup-size-banner' : 'popup-size-square'}`}>
              <iframe src={getEmbedUrl()} className="player-embed" frameBorder="0" allowFullScreen allow="autoplay; encrypted-media"></iframe>
            </div>
            {type === 'tv' && (
              <div className="player-bottom-controls">
                <button className="nav-ep-btn" onClick={() => episode > 1 && setEpisode(e => e - 1)} disabled={episode === 1}><i className="fas fa-backward"></i></button>
                <button className="nav-ep-btn" onClick={handleNextEp}><i className="fas fa-forward"></i></button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
