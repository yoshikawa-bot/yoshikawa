import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
const DEFAULT_BACKDROP = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'

export const Header = ({ label, scrolled, showInfo, toggleInfo, infoClosing, showTech, toggleTech, techClosing, navHidden }) => {
  const handleRightClick = (e) => {
    e.stopPropagation()
    if (scrolled) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      toggleInfo()
    }
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
            <p className="popup-text">v2.7.0 Final • React 18 • TMDB API</p>
          </div>
        </div>
      )}
    </>
  )
}

export const BottomNav = ({ isFavorite, onToggleFavorite, onToggleSynopsis, onToggleData, onToggleNav, navHidden }) => {
  const [animating, setAnimating] = useState(false)

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Yoshikawa Player', url: window.location.href }) } 
      catch (err) { }
    } else { alert('Compartilhar não suportado') }
  }

  const handleFavClick = () => {
    setAnimating(true)
    onToggleFavorite()
    setTimeout(() => setAnimating(false), 400)
  }

  return (
    <div className={`bar-container bottom-bar ${navHidden ? 'nav-hidden' : ''}`}>
      <button className="round-btn glass-panel share-btn" onClick={handleShare} title="Compartilhar">
        <i className="fas fa-share-nodes" style={{ fontSize: '15px' }}></i>
      </button>

      <div className="pill-container glass-panel nav-pill">
         <div className="nav-items-wrapper">
            <button className="nav-btn" onClick={onToggleData} title="Dados"><i className="fas fa-film"></i></button>
            <button className="nav-btn" onClick={onToggleSynopsis} title="Sinopse"><i className="fas fa-align-left"></i></button>
         </div>
         <button className="nav-btn toggle-btn" onClick={onToggleNav} title={navHidden ? "Expandir" : "Ocultar"}>
            <i className={navHidden ? "fas fa-eye" : "fas fa-eye-slash"}></i>
         </button>
      </div>

      <button className="round-btn glass-panel fav-btn" onClick={handleFavClick} title={isFavorite ? "Remover" : "Favoritar"}>
        <i className={`${isFavorite ? 'fas fa-heart' : 'far fa-heart'} ${animating ? 'heart-pulse' : ''}`} style={{ color: isFavorite ? '#ff3b30' : '#ffffff', fontSize: '15px' }}></i>
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
      </div>
      <div className="dev-credit">DESENVOLVIDO POR KAWA &lt;3</div>
    </div>
  )
}

export default function WatchPage() {
  const router = useRouter()
  const { type, id } = router.query
  const carouselRef = useRef(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [navHidden, setNavHidden] = useState(false)
  const [detailsExpanded, setDetailsExpanded] = useState(false)

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
    if (content) {
      const timer = setTimeout(() => setIsLoading(false), 1000) 
      return () => clearTimeout(timer)
    }
  }, [content])

  const showToast = (message, type = 'info') => {
    if (showInfoPopup || showTechPopup || showSynopsisPopup || showDataPopup) closeAllPopups()
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
        toastTimerRef.current = setTimeout(() => {
          setCurrentToast(t => (t && t.id === next.id ? { ...t, closing: true } : t))
        }, 2500)
      }
    }
  }, [toastQueue, currentToast])

  useEffect(() => {
    if (currentToast?.closing) {
      const t = setTimeout(() => setCurrentToast(null), 400)
      return () => clearTimeout(t)
    }
  }, [currentToast])

  const manualCloseToast = () => { if (currentToast) setCurrentToast({ ...currentToast, closing: true }) }

  useEffect(() => {
    if (!id || !type) return
    const loadContent = async () => {
      try {
        const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR`)
        const data = await res.json()
        setContent(data)
        if (type === 'tv') await fetchSeason(id, 1)
        checkFavoriteStatus(data)
      } catch (error) {
        showToast('Erro ao carregar conteúdo', 'error')
        setIsLoading(false) 
      }
    }
    loadContent()
  }, [id, type])

  const fetchSeason = async (tvId, seasonNum) => {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNum}?api_key=${TMDB_API_KEY}&language=pt-BR`)
      const data = await res.json()
      setSeasonData(data)
      setSeason(seasonNum)
    } catch (err) { showToast('Erro ao carregar temporada', 'error') }
  }

  const checkFavoriteStatus = (item) => {
    try {
      const stored = localStorage.getItem('yoshikawaFavorites')
      const favorites = stored ? JSON.parse(stored) : []
      setIsFavorite(favorites.some(f => f.id === item.id && f.media_type === type))
    } catch { setIsFavorite(false) }
  }

  const toggleFavorite = () => {
    if (!content) return
    try {
      const stored = localStorage.getItem('yoshikawaFavorites')
      let favorites = stored ? JSON.parse(stored) : []
      const exists = favorites.some(f => f.id === content.id && f.media_type === type)
      if (exists) {
        favorites = favorites.filter(f => !(f.id === content.id && f.media_type === type))
        setIsFavorite(false)
        showToast('Removido dos favoritos', 'info')
      } else {
        favorites = [...favorites, { id: content.id, media_type: type, title: content.title || content.name, poster_path: content.poster_path }]
        setIsFavorite(true)
        showToast('Adicionado aos favoritos', 'success')
      }
      localStorage.setItem('yoshikawaFavorites', JSON.stringify(favorites))
    } catch { showToast('Erro ao salvar favorito', 'error') }
  }

  const closeAllPopups = useCallback(() => {
    if (showInfoPopup && !infoClosing) { setInfoClosing(true); setTimeout(() => { setShowInfoPopup(false); setInfoClosing(false) }, 400) }
    if (showTechPopup && !techClosing) { setTechClosing(true); setTimeout(() => { setShowTechPopup(false); setTechClosing(false) }, 400) }
    if (showSynopsisPopup && !synopsisClosing) { setSynopsisClosing(true); setTimeout(() => { setShowSynopsisPopup(false); setSynopsisClosing(false) }, 400) }
    if (showDataPopup && !dataClosing) { setDataClosing(true); setTimeout(() => { setShowDataPopup(false); setDataClosing(false) }, 400) }
    if (currentToast && !currentToast.closing) setCurrentToast(prev => ({ ...prev, closing: true }))
  }, [showInfoPopup, infoClosing, showTechPopup, techClosing, showSynopsisPopup, synopsisClosing, showDataPopup, dataClosing, currentToast])

  const toggleInfoPopup = () => {
    if (showTechPopup || showSynopsisPopup || showDataPopup || currentToast) { closeAllPopups(); setTimeout(() => { if (!showInfoPopup) setShowInfoPopup(true) }, 200) }
    else { if (showInfoPopup) { setInfoClosing(true); setTimeout(() => { setShowInfoPopup(false); setInfoClosing(false) }, 400) } else setShowInfoPopup(true) }
  }

  const toggleTechPopup = () => {
    if (showInfoPopup || showSynopsisPopup || showDataPopup || currentToast) { closeAllPopups(); setTimeout(() => { if (!showTechPopup) setShowTechPopup(true) }, 200) }
    else { if (showTechPopup) { setTechClosing(true); setTimeout(() => { setShowTechPopup(false); setTechClosing(false) }, 400) } else setShowTechPopup(true) }
  }

  const toggleDataPopup = () => {
    if (showInfoPopup || showTechPopup || showSynopsisPopup || currentToast) { closeAllPopups(); setTimeout(() => { if (!showDataPopup) setShowDataPopup(true) }, 200) }
    else { if (showDataPopup) { setDataClosing(true); setTimeout(() => { setShowDataPopup(false); setDataClosing(false) }, 400) } else setShowDataPopup(true) }
  }

  const toggleSynopsisPopup = () => {
    if (showInfoPopup || showTechPopup || showDataPopup || currentToast) { closeAllPopups(); setTimeout(() => { if (!showSynopsisPopup) setShowSynopsisPopup(true) }, 200) }
    else { if (showSynopsisPopup) { setSynopsisClosing(true); setTimeout(() => { setShowSynopsisPopup(false); setSynopsisClosing(false) }, 400) } else setShowSynopsisPopup(true) }
  }

  useEffect(() => {
    const onScroll = () => { if (window.scrollY > 10) closeAllPopups(); setScrolled(window.scrollY > 60) }
    window.addEventListener('scroll', onScroll, { passive: true })
    const onClick = (e) => { if (!e.target.closest('.standard-popup') && !e.target.closest('.toast') && !e.target.closest('.round-btn') && !e.target.closest('.pill-container')) closeAllPopups() }
    window.addEventListener('click', onClick)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('click', onClick) }
  }, [closeAllPopups])

  useEffect(() => {
    if (carouselRef.current && seasonData) {
      const activeCard = carouselRef.current.querySelector('.ep-card.active')
      if (activeCard) activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [episode, seasonData])

  const handleNextEp = () => {
    const nextEp = episode + 1
    if (seasonData && seasonData.episodes && nextEp <= seasonData.episodes.length) setEpisode(nextEp)
    else showToast('Fim da temporada', 'info')
  }
  
  const handlePrevEp = () => { if (episode > 1) setEpisode(episode - 1) }
  
  const getEmbedUrl = () => {
    if (!content) return ''
    return type === 'movie' ? `https://superflixapi.cv/filme/${id}` : `https://superflixapi.cv/serie/${id}/${season}/${episode}`
  }

  const handleNativeSeasonChange = (e) => {
    const newSeason = parseInt(e.target.value)
    fetchSeason(id, newSeason)
    setEpisode(1)
  }

  const releaseDate = content?.release_date || content?.first_air_date || 'Desconhecido'
  const rating = content?.vote_average ? content.vote_average.toFixed(1) : 'N/A'
  const genres = content?.genres ? content.genres.map(g => g.name).join(', ') : 'Desconhecido'
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
          body { font-family: 'Inter', sans-serif; background: #050505; color: #f5f5f7; line-height: 1.6; font-size: 16px; min-height: 100vh; overflow-x: hidden; }
          .site-wrapper { width: 100%; min-height: 100vh; background-size: cover; background-position: center; background-attachment: fixed; position: relative; }
          .site-wrapper::before { content: ''; position: fixed; inset: 0; background: rgba(5, 5, 5, 0.55); pointer-events: none; z-index: 0; }
          .site-wrapper > * { position: relative; z-index: 1; }
          .loading-overlay { position: fixed; inset: 0; z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #050505; transition: 0.8s ease; }
          .loading-overlay.fade-out { opacity: 0; visibility: hidden; pointer-events: none; }
          .loading-content { display: flex; flex-direction: column; align-items: center; gap: 24px; }
          .dev-credit { position: absolute; bottom: 30px; font-size: 0.75rem; color: rgba(255,255,255,0.3); letter-spacing: 2px; font-weight: 600; text-transform: uppercase; }
          .spinner-apple { width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; position: relative; }
          .spinner-ring { position: absolute; inset: 0; border: 2.5px solid rgba(255,255,255,0.15); border-radius: 50%; border-top-color: #fff; animation: appleSpinner 1s linear infinite; }
          @keyframes appleSpinner { to { transform: rotate(360deg); } }
          .loading-bar { width: 180px; height: 2.5px; background: rgba(255,255,255,0.15); border-radius: 2px; overflow: hidden; }
          .loading-progress { height: 100%; background: #fff; width: 0%; animation: loadingBar 3s ease infinite; }
          @keyframes loadingBar { 0% { width: 0; } 50% { width: 70%; } 100% { width: 100%; } }
          
          :root { --pill-h: 44px; --ease: cubic-bezier(0.25, 0.46, 0.45, 0.94); }
          .glass-panel { background: rgba(255,255,255,0.06); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
          
          .bar-container { position: fixed; left: 50%; transform: translateX(-50%); z-index: 1000; display: flex; align-items: center; justify-content: center; gap: 12px; width: 90%; max-width: 520px; transition: all 0.6s var(--ease); }
          .top-bar { top: 20px; } .bottom-bar { bottom: 20px; }
          .top-bar.scrolled-state { transform: translateX(-50%) translateY(-5px); }
          .top-bar.nav-hidden { opacity: 0; visibility: hidden; transform: translateX(-50%) translateY(-100px); }
          
          .round-btn { width: var(--pill-h); height: var(--pill-h); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.9); transition: 0.5s var(--ease); flex-shrink: 0; }
          .round-btn:hover { transform: scale(1.08); background: rgba(255,255,255,0.12); }
          
          .pill-container { height: var(--pill-h); border-radius: 50px; display: flex; align-items: center; position: relative; overflow: hidden; transition: width 0.6s var(--ease), flex 0.6s var(--ease); }
          .bottom-bar .pill-container { flex: 1; justify-content: center; }
          
          /* Animation Logic for Nav Hide/Show */
          .bottom-bar.nav-hidden .pill-container.nav-pill { flex: 0 0 var(--pill-h); width: var(--pill-h); }
          .bottom-bar:not(.nav-hidden) .pill-container.nav-pill { flex: 1; width: 100%; }
          
          .nav-items-wrapper { display: flex; align-items: center; justify-content: center; flex: 1; height: 100%; transition: opacity 0.4s ease 0.1s, transform 0.4s ease 0.1s; }
          .bottom-bar.nav-hidden .nav-items-wrapper { opacity: 0; transform: translateX(-20px); pointer-events: none; width: 0; position: absolute; }
          
          .nav-btn { flex: 1; height: 100%; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.4); transition: 0.3s; }
          .nav-btn:hover { color: #fff; transform: scale(1.1); }
          .toggle-btn { flex: 0 0 44px; color: rgba(255,255,255,0.6); z-index: 2; }
          .bottom-bar.nav-hidden .toggle-btn { width: 100%; }

          .bottom-bar.nav-hidden .share-btn, .bottom-bar.nav-hidden .fav-btn { width: 0; opacity: 0; margin: 0; padding: 0; overflow: hidden; transform: scale(0); }
          
          .bar-label { font-size: 0.9rem; font-weight: 600; color: #fff; padding: 0 20px; }
          .heart-pulse { animation: heartZoom 0.5s ease; }
          @keyframes heartZoom { 50% { transform: scale(1.5); } }

          .standard-popup, .toast { position: fixed; top: 80px; left: 50%; transform: translateX(-50%); width: 320px; border-radius: 22px; padding: 16px; display: flex; gap: 14px; animation: popIn 0.5s var(--ease) forwards; z-index: 960; }
          .standard-popup.closing, .toast.closing { animation: popOut 0.4s ease forwards; }
          @keyframes popIn { from { opacity: 0; transform: translateX(-50%) scale(0.8); } to { opacity: 1; transform: translateX(-50%) scale(1); } }
          @keyframes popOut { to { opacity: 0; transform: translateX(-50%) scale(0.8); } }
          
          .popup-icon-wrapper, .toast-icon-wrapper { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
          .popup-icon-wrapper.info { background: linear-gradient(135deg, #34c759, #30d158); }
          .popup-icon-wrapper.tech { background: linear-gradient(135deg, #0a84ff, #007aff); }
          .popup-icon-wrapper.synopsis { background: linear-gradient(135deg, #ff9500, #ff8c00); }
          .popup-icon-wrapper.data { background: linear-gradient(135deg, #bf5af2, #a448e0); }
          .toast.success .toast-icon-wrapper { background: #34c759; } .toast.error .toast-icon-wrapper { background: #ff453a; } .toast.info .toast-icon-wrapper { background: #0a84ff; }
          
          .popup-content, .toast-content { flex: 1; }
          .popup-title { font-weight: 600; font-size: 0.95rem; margin-bottom: 2px; }
          .popup-text, .toast-msg { font-size: 0.8rem; color: rgba(255,255,255,0.7); }

          .container { max-width: 1280px; margin: 0 auto; padding: 6.5rem 2rem 7rem; }
          .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
          .page-title { font-size: 1.3rem; font-weight: 700; }
          .status-dots { display: flex; gap: 8px; } .dot { width: 10px; height: 10px; border-radius: 50%; }
          .dot.red { background: #ff453a; } .dot.yellow { background: #ffd60a; } .dot.green { background: #30d158; }

          .player-banner-container { width: 100%; aspect-ratio: 16/9; border-radius: 24px; overflow: hidden; position: relative; background: #1a1a1a; box-shadow: 0 20px 40px rgba(0,0,0,0.4); margin-bottom: 24px; cursor: pointer; transition: 0.3s; }
          .player-banner-container:hover { transform: scale(1.01); }
          .play-button-static { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 64px; height: 64px; background: rgba(0,0,0,0.5); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.3); backdrop-filter: blur(4px); }
          .play-button-static i { margin-left: 4px; font-size: 24px; }

          .details-container { border-radius: 24px; padding: 18px; display: flex; flex-direction: column; background: rgba(255,255,255,0.03); transition: 0.4s ease; }
          .details-header { display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
          .media-title { font-size: 1.15rem; font-weight: 700; }
          .expand-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(255,255,255,0.1); transition: 0.3s; }
          .details-content { max-height: 0; overflow: hidden; transition: max-height 0.5s cubic-bezier(0, 1, 0, 1); opacity: 0; }
          .details-content.open { max-height: 500px; opacity: 1; transition: max-height 0.6s ease-in-out, opacity 0.6s ease; margin-top: 16px; }

          .native-season-select { width: 100%; background: rgba(0,0,0,0.3); color: #fff; padding: 10px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 12px; outline: none; }
          .episodes-carousel { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 5px; scrollbar-width: none; }
          .episodes-carousel::-webkit-scrollbar { display: none; }
          .ep-card { min-width: 120px; height: 70px; border-radius: 10px; position: relative; cursor: pointer; background-size: cover; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; transition: 0.2s; box-shadow: none !important; }
          .ep-card:hover { transform: scale(1.05); border-color: rgba(255,255,255,0.5); }
          .ep-card.active { border-color: #fff; border-width: 2px; }
          .ep-card-info { position: absolute; bottom: 0; width: 100%; padding: 4px 8px; background: rgba(0,0,0,0.6); font-size: 0.7rem; font-weight: 600; }

          .player-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); backdrop-filter: blur(20px); z-index: 2000; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.4s; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          .player-wrapper-vertical { width: 100%; display: flex; flex-direction: column; align-items: center; }
          .player-header-controls { width: 90%; max-width: 900px; display: flex; justify-content: space-between; margin-bottom: 20px; }
          .ep-indicator { background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 8px; font-weight: 700; }
          .right-controls { display: flex; gap: 10px; }
          .control-btn { width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; display: flex; align-items: center; justify-content: center; transition: 0.3s; }
          .control-btn:hover { background: rgba(255,255,255,0.2); transform: scale(1.1); }
          
          .player-popup-container { background: #000; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 0 50px rgba(0,0,0,0.5); transition: 0.5s ease; }
          .popup-size-square { width: min(85vw, 60vh); aspect-ratio: 1; }
          .popup-size-banner { width: 90vw; max-width: 1000px; aspect-ratio: 16/9; }
          .player-embed { width: 100%; height: 100%; }
          
          .player-bottom-controls { margin-top: 20px; display: flex; gap: 20px; }
          .nav-ep-btn { padding: 10px 24px; border-radius: 50px; background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); display: flex; gap: 8px; align-items: center; transition: 0.3s; }
          .nav-ep-btn:hover { background: rgba(255,255,255,0.2); transform: scale(1.05); }
          .nav-ep-btn:disabled { opacity: 0.5; cursor: not-allowed; }

          @media (max-width: 768px) {
            .bar-container { width: 94%; }
            .details-container { padding: 14px; }
            .popup-size-square { width: 90vw; height: 90vw; }
            .popup-size-banner { width: 100vw; border-radius: 0; border: none; }
          }
        `}</style>
      </Head>

      <LoadingScreen visible={isLoading} />

      {content && (
        <div className="site-wrapper" style={{ backgroundImage: `url(${content.backdrop_path ? `https://image.tmdb.org/t/p/original${content.backdrop_path}` : DEFAULT_BACKDROP})` }}>
          <Header label={scrolled ? "Reproduzindo" : "Yoshikawa"} scrolled={scrolled} showInfo={showInfoPopup} toggleInfo={toggleInfoPopup} infoClosing={infoClosing} showTech={showTechPopup} toggleTech={toggleTechPopup} techClosing={techClosing} navHidden={navHidden} />
          <ToastContainer toast={currentToast} closeToast={manualCloseToast} />

          {showSynopsisPopup && (
            <div className={`standard-popup glass-panel ${synopsisClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
              <div className="popup-icon-wrapper synopsis"><i className="fas fa-align-left"></i></div>
              <div className="popup-content"><p className="popup-title">Sinopse</p><p className="popup-text">{type === 'tv' && currentEpisodeData?.overview ? currentEpisodeData.overview : content?.overview || "Indisponível"}</p></div>
            </div>
          )}

          {showDataPopup && (
            <div className={`standard-popup glass-panel ${dataClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
              <div className="popup-icon-wrapper data"><i className="fas fa-film"></i></div>
              <div className="popup-content"><p className="popup-title">Ficha</p><div className="popup-text"><strong>Data:</strong> {releaseDate}<br/><strong>Nota:</strong> {rating}<br/><strong>Gênero:</strong> {genres}</div></div>
            </div>
          )}

          <main className="container">
            <div className="page-header">
              <h1 className="page-title">Assistir</h1>
              <div className="status-dots"><span className="dot red"></span><span className="dot yellow"></span><span className="dot green"></span></div>
            </div>

            <div className="player-banner-container" onClick={() => setIsPlaying(true)}
              style={{ backgroundImage: `url(${currentEpisodeData?.still_path ? `https://image.tmdb.org/t/p/original${currentEpisodeData.still_path}` : `https://image.tmdb.org/t/p/original${content.backdrop_path || DEFAULT_BACKDROP}`})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div className="play-button-static"><i className="fas fa-play"></i></div>
            </div>

            <div className="glass-panel details-container">
              <div className="details-header" onClick={() => setDetailsExpanded(!detailsExpanded)}>
                <h2 className="media-title">{content.title || content.name} {type === 'tv' && ` - S${season}:E${episode}`}</h2>
                <button className="expand-btn">
                  <i className={`fas fa-chevron-${detailsExpanded ? 'up' : 'down'}`}></i>
                </button>
              </div>

              {type === 'tv' && (
                <div className={`details-content ${detailsExpanded ? 'open' : ''}`}>
                  <select className="native-season-select" value={season} onChange={handleNativeSeasonChange}>
                     {Array.from({ length: content?.number_of_seasons || 1 }, (_, i) => i + 1).map(num => <option key={num} value={num}>Temporada {num}</option>)}
                  </select>
                  <div className="episodes-carousel" ref={carouselRef}>
                    {seasonData?.episodes?.map(ep => (
                      <div key={ep.id} className={`ep-card ${ep.episode_number === episode ? 'active' : ''}`} onClick={() => setEpisode(ep.episode_number)}
                        style={{ backgroundImage: ep.still_path ? `url(https://image.tmdb.org/t/p/w300${ep.still_path})` : 'linear-gradient(#222,#111)' }}>
                        <div className="ep-card-info">E{ep.episode_number}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </main>

          <BottomNav isFavorite={isFavorite} onToggleFavorite={toggleFavorite} onToggleSynopsis={toggleSynopsisPopup} onToggleData={toggleDataPopup} onToggleNav={() => setNavHidden(!navHidden)} navHidden={navHidden} />
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
              <iframe src={getEmbedUrl()} className="player-embed" frameBorder="0" allowFullScreen 
                referrerPolicy="no-referrer"
                sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation-by-user-activation allow-presentation"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
              </iframe>
            </div>
            {type === 'tv' && (
              <div className="player-bottom-controls">
                <button className="nav-ep-btn" onClick={handlePrevEp} disabled={episode === 1}><i className="fas fa-backward-step"></i> Ant</button>
                <button className="nav-ep-btn" onClick={handleNextEp}>Prox <i className="fas fa-forward-step"></i></button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
