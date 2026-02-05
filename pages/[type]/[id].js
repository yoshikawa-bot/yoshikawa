import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
const DEFAULT_BACKDROP = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'
const DEFAULT_POSTER = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'

// --- COMPONENTES AUXILIARES (VISUAL IDÊNTICO À HOME) ---

export const Header = ({ label, scrolled, showInfo, toggleInfo, infoClosing, showTech, toggleTech, techClosing }) => {
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
      <header className={`bar-container top-bar ${scrolled ? 'scrolled-state' : ''}`}>
        <button 
          className="round-btn glass-panel" 
          onClick={(e) => { e.stopPropagation(); toggleTech() }}
          title="Info Técnica"
        >
          <i className="fas fa-microchip" style={{ fontSize: '14px' }}></i>
        </button>

        <div className="pill-container glass-panel">
          <span key={label} className="bar-label">{label}</span>
        </div>

        <button 
          className="round-btn glass-panel" 
          title={scrolled ? "Voltar ao topo" : "Informações"}
          onClick={handleRightClick}
        >
          <i className={scrolled ? "fas fa-chevron-up" : "fas fa-info-circle"} style={{ fontSize: '14px' }}></i>
        </button>
      </header>

      {showInfo && (
        <div 
          className={`info-popup glass-panel ${infoClosing ? 'closing' : ''}`} 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="popup-icon-wrapper">
            <i className="fas fa-shield-halved"></i>
          </div>
          <div className="popup-content">
            <p className="popup-title">Proteção Recomendada</p>
            <p className="popup-text">Use <strong>Brave</strong> ou <strong>AdBlock</strong> para melhor experiência</p>
          </div>
        </div>
      )}

      {showTech && (
        <div 
          className={`info-popup glass-panel ${techClosing ? 'closing' : ''}`} 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="popup-icon-wrapper tech">
            <i className="fas fa-microchip"></i>
          </div>
          <div className="popup-content">
            <p className="popup-title">Informações Técnicas</p>
            <p className="popup-text">v2.6.0 Slim • React 18 • TMDB API</p>
          </div>
        </div>
      )}
    </>
  )
}

export const BottomNav = ({ isFavorite, onToggleFavorite }) => {
  const [animating, setAnimating] = useState(false)

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Yoshikawa Player', url: window.location.href }) } 
      catch (err) { console.log('Share canceled') }
    } else { alert('Compartilhar não suportado') }
  }

  const handleFavClick = () => {
    setAnimating(true)
    onToggleFavorite()
    setTimeout(() => setAnimating(false), 400)
  }

  return (
    <div className="bar-container bottom-bar">
      <button className="round-btn glass-panel" onClick={handleShare} title="Compartilhar">
        <i className="fas fa-arrow-up-from-bracket" style={{ fontSize: '15px', transform: 'translateY(-1px)' }}></i>
      </button>

      <div className={`pill-container glass-panel`}>
         <Link href="/" className={`nav-btn`}>
            <i className="fas fa-home"></i>
         </Link>
      </div>

      <button className="round-btn glass-panel" onClick={handleFavClick}>
        <i 
          className={`${isFavorite ? 'fas fa-heart' : 'far fa-heart'} ${animating ? 'heart-pulse' : ''}`}
          style={{ fontSize: '16px', color: isFavorite ? '#ff3b30' : '#fff' }}
        ></i>
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

// --- PÁGINA DINÂMICA DE REPRODUÇÃO ---

export default function WatchPage() {
  const router = useRouter()
  const { type, id } = router.query 
  
  // Estados de Interface
  const [scrolled, setScrolled] = useState(false)
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [infoClosing, setInfoClosing] = useState(false)
  const [showTechPopup, setShowTechPopup] = useState(false)
  const [techClosing, setTechClosing] = useState(false)
  
  // Toast Logic
  const [currentToast, setCurrentToast] = useState(null)
  const [toastQueue, setToastQueue] = useState([])
  const toastTimerRef = useRef(null)
  
  // Estados do Player e Conteúdo
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isWideMode, setIsWideMode] = useState(false)
  const [showSynopsis, setShowSynopsis] = useState(false)
  
  // Lógica de Série
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [seasonData, setSeasonData] = useState(null)
  const [showSeasonSelector, setShowSeasonSelector] = useState(false)
  
  // Favoritos
  const [favorites, setFavorites] = useState([])

  // Refs
  const episodesRef = useRef(null)

  // --- TOAST SYSTEM (IDÊNTICO À HOME) ---
  const showToast = (message, type = 'info') => {
    if (showInfoPopup || showTechPopup) closeAllPopups()
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

  // --- FAVORITES LOGIC ---
  useEffect(() => {
    try {
      const stored = localStorage.getItem('yoshikawaFavorites')
      setFavorites(stored ? JSON.parse(stored) : [])
    } catch { setFavorites([]) }
  }, [])

  const isFavorite = content ? favorites.some(f => f.id === content.id && f.media_type === type) : false

  const toggleFavorite = () => {
    if (!content) return
    setFavorites(prev => {
      const exists = prev.some(f => f.id === content.id && f.media_type === type)
      let updated
      if (exists) {
        updated = prev.filter(f => !(f.id === content.id && f.media_type === type))
        showToast('Removido dos favoritos', 'info')
      } else {
        updated = [...prev, {
          id: content.id,
          media_type: type,
          title: content.title || content.name,
          poster_path: content.poster_path
        }]
        showToast('Adicionado aos favoritos', 'success')
      }
      localStorage.setItem('yoshikawaFavorites', JSON.stringify(updated))
      return updated
    })
  }

  // --- FETCH DATA ---
  useEffect(() => {
    if (!id || !type) return

    const loadContent = async () => {
      setLoading(true)
      try {
        const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR`)
        const data = await res.json()
        setContent(data)
        if (type === 'tv') await fetchSeason(id, 1)
      } catch (error) { console.error(error) } 
      finally { setLoading(false) }
    }
    loadContent()
  }, [id, type])

  const fetchSeason = async (tvId, seasonNum) => {
      try {
        const res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNum}?api_key=${TMDB_API_KEY}&language=pt-BR`)
        const data = await res.json()
        setSeasonData(data)
        setSeason(seasonNum)
        setEpisode(1) // Reset para ep 1 ao mudar temporada
      } catch (err) { console.error(err) }
  }

  // --- AUTO SCROLL EPISODES ---
  useEffect(() => {
    if (seasonData && episodesRef.current) {
        const activeCard = episodesRef.current.querySelector(`.ep-card[data-ep="${episode}"]`)
        if (activeCard) {
            activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
        }
    }
  }, [episode, seasonData])

  // --- POPUP HANDLERS ---
  const closeAllPopups = useCallback(() => {
    if (showInfoPopup && !infoClosing) {
      setInfoClosing(true); setTimeout(() => { setShowInfoPopup(false); setInfoClosing(false) }, 400)
    }
    if (showTechPopup && !techClosing) {
      setTechClosing(true); setTimeout(() => { setShowTechPopup(false); setTechClosing(false) }, 400)
    }
    setShowSeasonSelector(false)
  }, [showInfoPopup, infoClosing, showTechPopup, techClosing])

  const toggleInfoPopup = () => { if (showInfoPopup) { setInfoClosing(true); setTimeout(() => { setShowInfoPopup(false); setInfoClosing(false) }, 400) } else { closeAllPopups(); setShowInfoPopup(true) } }
  const toggleTechPopup = () => { if (showTechPopup) { setTechClosing(true); setTimeout(() => { setShowTechPopup(false); setTechClosing(false) }, 400) } else { closeAllPopups(); setShowTechPopup(true) } }

  useEffect(() => {
    const onScroll = () => { if (window.scrollY > 10) closeAllPopups(); setScrolled(window.scrollY > 60) }
    window.addEventListener('scroll', onScroll, { passive: true })
    const onClick = (e) => { 
        if (!e.target.closest('.info-popup') && !e.target.closest('.season-selector-popup') && !e.target.closest('.toast') && !e.target.closest('.round-btn') && !e.target.closest('.pill-container')) {
          closeAllPopups() 
        }
    }
    window.addEventListener('click', onClick)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('click', onClick) }
  }, [closeAllPopups])

  // --- PLAYER & NAVIGATION ---
  const handleNextEp = () => {
      const nextEp = episode + 1
      if (seasonData && seasonData.episodes && nextEp <= seasonData.episodes.length) setEpisode(nextEp)
      else showToast('Fim da temporada', 'info')
  }
  const handlePrevEp = () => setEpisode(prev => prev > 1 ? prev - 1 : 1)
  
  const getEmbedUrl = () => {
    if (!content) return ''
    // Mapping: TMDB uses 'movie'/'tv', SuperFlix uses 'filme'/'serie'
    const embedType = type === 'movie' ? 'filme' : 'serie'
    
    // SuperFlix Documentation:
    // Filme: /filme/ID
    // Serie: /serie/ID/SEASON/EPISODE
    if (embedType === 'filme') {
        return `https://superflixapi.cv/filme/${id}`
    } else {
        return `https://superflixapi.cv/serie/${id}/${season}/${episode}`
    }
  }

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>
  if (!content) return null

  // Gera lista de temporadas baseada no total de temporadas
  const seasonsList = Array.from({ length: content.number_of_seasons || 1 }, (_, i) => i + 1)

  return (
    <>
      <Head>
        <title>{content.title || content.name} - Reproduzindo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style>{`
          /* --- CSS BASE IDÊNTICO À HOME --- */
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
          html { scroll-behavior: smooth; }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #050505; color: #f5f5f7; line-height: 1.6; font-size: 16px;
            min-height: 100vh; overflow-y: auto; overflow-x: hidden;
            background-image: radial-gradient(circle at 50% 0%, #1a1a1a, #050505 80%);
            background-attachment: fixed;
          }
          a { color: inherit; text-decoration: none; }
          button { font-family: inherit; border: none; outline: none; background: none; cursor: pointer; user-select: none; }
          img { max-width: 100%; height: auto; display: block; }
          :root {
            --pill-height: 44px; --pill-radius: 50px; --pill-max-width: 520px;
            --ios-blue: #0A84FF; --ease-elastic: cubic-bezier(0.34, 1.56, 0.64, 1);
            --ease-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }

          /* GLASS & UTILS */
          .glass-panel {
            position: relative; background: rgba(255, 255, 255, 0.06);
            backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1); border-radius: inherit;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); overflow: hidden;
            transition: transform 0.3s var(--ease-elastic), background 0.3s ease, border-color 0.3s ease;
          }
          .spinner { width: 24px; height: 24px; border: 2px solid rgba(255,255,255,0.1); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
          .loading-screen { display: flex; align-items: center; justify-content: center; height: 100vh; }

          /* NAV BARS */
          .bar-container {
            position: fixed; left: 50%; transform: translateX(-50%); z-index: 1000;
            display: flex; align-items: center; justify-content: center; gap: 12px; 
            width: 90%; max-width: var(--pill-max-width); transition: all 0.4s var(--ease-smooth);
          }
          .top-bar { top: 20px; } 
          .bottom-bar { bottom: 20px; }
          .top-bar.scrolled-state { transform: translateX(-50%) translateY(-5px); }

          .round-btn { width: var(--pill-height); height: var(--pill-height); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: rgba(255, 255, 255, 0.9); flex-shrink: 0; transition: all 0.3s var(--ease-elastic); }
          .round-btn:hover { transform: scale(1.08); background: rgba(255, 255, 255, 0.12); border-color: rgba(255, 255, 255, 0.2); }
          .round-btn:active { transform: scale(0.92); }
          .pill-container { height: var(--pill-height); flex: 1; border-radius: var(--pill-radius); display: flex; align-items: center; justify-content: center; transition: all 0.4s var(--ease-elastic); }
          .nav-btn { flex: 1; display: flex; align-items: center; justify-content: center; height: 100%; color: rgba(255,255,255,0.4); }
          .nav-btn:hover i { transform: scale(1.2); color: #fff; }
          .bar-label { font-size: 0.9rem; font-weight: 600; color: #fff; animation: labelFadeIn 0.4s var(--ease-elastic) forwards; }
          @keyframes labelFadeIn { from { opacity: 0; transform: translateY(12px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
          
          .heart-pulse { animation: heartZoom 0.5s var(--ease-elastic); }
          @keyframes heartZoom { 0% { transform: scale(1); } 50% { transform: scale(1.6); } 100% { transform: scale(1); } }

          /* POPUPS & TOASTS (EXATO) */
          .info-popup, .toast {
            position: fixed; top: calc(20px + var(--pill-height) + 16px); left: 50%; z-index: 960;
            min-width: 320px; max-width: 90%; display: flex; align-items: flex-start; gap: 14px;
            padding: 16px 18px; border-radius: 22px; transform: translateX(-50%) translateY(-50%) scale(0.3);
            transform-origin: top center; opacity: 0; animation: popupZoomIn 0.5s var(--ease-elastic) forwards;
            box-shadow: 0 20px 60px rgba(0,0,0,0.6);
          }
          .info-popup { z-index: 950; pointer-events: none; }
          .toast { z-index: 960; pointer-events: auto; align-items: center; } 
          .info-popup.closing, .toast.closing { animation: popupZoomOut 0.4s cubic-bezier(0.55, 0.055, 0.675, 0.19) forwards; }
          @keyframes popupZoomIn { 0% { opacity: 0; transform: translateX(-50%) translateY(-50%) scale(0.3); } 100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); pointer-events: auto; } }
          @keyframes popupZoomOut { 0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); } 100% { opacity: 0; transform: translateX(-50%) translateY(-30%) scale(0.5); pointer-events: none; } }
          
          .popup-icon-wrapper, .toast-icon-wrapper { width: 42px; height: 42px; min-width: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; animation: iconPop 0.6s var(--ease-elastic) 0.1s backwards; }
          .popup-icon-wrapper { background: linear-gradient(135deg, #34c759 0%, #30d158 100%); box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3); }
          .popup-icon-wrapper.tech { background: linear-gradient(135deg, #0a84ff 0%, #007aff 100%); box-shadow: 0 4px 12px rgba(10, 132, 255, 0.3); }
          .toast.success .toast-icon-wrapper { background: linear-gradient(135deg, #34c759 0%, #30d158 100%); box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3); }
          .toast.info .toast-icon-wrapper { background: linear-gradient(135deg, #0a84ff 0%, #007aff 100%); box-shadow: 0 4px 12px rgba(10, 132, 255, 0.3); }
          .toast.error .toast-icon-wrapper { background: linear-gradient(135deg, #ff453a 0%, #ff3b30 100%); box-shadow: 0 4px 12px rgba(255, 69, 58, 0.3); }
          .toast-icon-wrapper { border-radius: 50%; }
          .popup-icon-wrapper i, .toast-icon-wrapper i { font-size: 20px; color: #fff; }
          .popup-content, .toast-content { flex: 1; display: flex; flex-direction: column; gap: 4px; opacity: 0; animation: contentFade 0.4s ease 0.2s forwards; }
          @keyframes contentFade { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }
          .popup-title, .toast-title { font-size: 0.95rem; font-weight: 600; color: #fff; margin: 0; line-height: 1.3; }
          .popup-text, .toast-msg { font-size: 0.8rem; color: rgba(255, 255, 255, 0.7); margin: 0; line-height: 1.4; }

          /* --- PAGE LAYOUT & HEADER (IDÊNTICO À HOME) --- */
          .container { max-width: 1280px; margin: 0 auto; padding-top: 6.5rem; padding-bottom: 7rem; padding-left: 2rem; padding-right: 2rem; }
          .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; animation: headerFadeIn 0.8s var(--ease-elastic) forwards; }
          @keyframes headerFadeIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
          .page-title { font-size: 1.5rem; font-weight: 700; color: #fff; text-shadow: 0 4px 20px rgba(0,0,0,0.5); }
          
          .status-dots { display: flex; align-items: center; gap: 8px; }
          .dot { width: 10px; height: 10px; border-radius: 50%; animation: dotPulse 2s ease-in-out infinite; }
          .dot.red { background: linear-gradient(135deg, #ff453a, #ff3b30); box-shadow: 0 2px 8px rgba(255, 69, 58, 0.4); }
          .dot.yellow { background: linear-gradient(135deg, #ffd60a, #ffcc00); box-shadow: 0 2px 8px rgba(255, 204, 0, 0.4); animation-delay: 0.3s; }
          .dot.green { background: linear-gradient(135deg, #34c759, #30d158); box-shadow: 0 2px 8px rgba(52, 199, 89, 0.4); animation-delay: 0.6s; }
          @keyframes dotPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.6; } }

          /* --- CONTENT SPECIFIC --- */
          .site-wrapper { transition: filter 0.4s ease; width: 100%; min-height: 100vh; }
          .site-wrapper.blurred { filter: blur(10px) brightness(0.6); pointer-events: none; }

          .player-banner-container {
            width: 100%; aspect-ratio: 16/9; border-radius: 24px; overflow: hidden; position: relative;
            background-color: #1a1a1a; border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 20px 40px rgba(0,0,0,0.4); margin-bottom: 24px; cursor: pointer;
            animation: cardEntrance 0.7s var(--ease-elastic) backwards;
          }
          @keyframes cardEntrance { from { opacity: 0; transform: translateY(40px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
          
          .banner-image { width: 100%; height: 100%; object-fit: cover; transition: transform 0.8s var(--ease-elastic); }
          .player-banner-container:hover .banner-image { transform: scale(1.05); }
          .play-button-static {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 64px; height: 64px; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px);
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            border: 1px solid rgba(255,255,255,0.3); transition: transform 0.3s var(--ease-elastic);
          }
          .player-banner-container:hover .play-button-static { transform: translate(-50%, -50%) scale(1.1); background: rgba(0,0,0,0.7); }
          .play-button-static i { color: #fff; font-size: 24px; margin-left: 4px; }

          .details-container { border-radius: 24px; padding: 24px; display: flex; flex-direction: column; gap: 16px; animation: cardEntrance 0.7s var(--ease-elastic) 0.1s backwards; }
          .media-title { font-size: 1.4rem; font-weight: 700; color: #fff; line-height: 1.2; }
          .episode-title { font-size: 1.1rem; font-weight: 500; color: rgba(255,255,255,0.8); }

          /* SEASON SELECTOR */
          .season-wrapper { position: relative; align-self: flex-start; }
          .season-btn {
            background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 12px;
            font-size: 0.9rem; color: #fff; display: inline-flex; align-items: center; gap: 8px;
            transition: background 0.2s; 
          }
          .season-btn:hover { background: rgba(255,255,255,0.2); }
          
          .season-selector-popup {
            position: absolute; top: calc(100% + 8px); left: 0; background: #1c1c1e;
            border: 1px solid rgba(255,255,255,0.15); border-radius: 12px;
            width: 180px; max-height: 250px; overflow-y: auto; z-index: 50;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5); display: flex; flex-direction: column;
            animation: fadeIn 0.2s ease;
          }
          .season-option { padding: 10px 16px; color: rgba(255,255,255,0.7); cursor: pointer; transition: background 0.2s; font-size: 0.9rem; text-align: left; }
          .season-option:hover { background: rgba(255,255,255,0.1); color: #fff; }
          .season-option.active { color: var(--ios-blue); font-weight: 600; background: rgba(10, 132, 255, 0.1); }

          /* EPISODES CAROUSEL (COM IMAGENS) */
          .episodes-carousel { display: flex; gap: 12px; overflow-x: auto; padding: 4px 0 12px 0; scrollbar-width: none; }
          .episodes-carousel::-webkit-scrollbar { display: none; }
          
          .ep-card {
            min-width: 160px; max-width: 160px; display: flex; flex-direction: column; gap: 8px;
            cursor: pointer; transition: transform 0.2s ease;
          }
          .ep-card:hover { transform: translateY(-4px); }
          
          .ep-img-wrap {
            position: relative; width: 100%; aspect-ratio: 16/9; border-radius: 12px; overflow: hidden;
            border: 2px solid transparent; transition: border-color 0.3s ease;
          }
          .ep-card.active .ep-img-wrap { border-color: var(--ios-blue); box-shadow: 0 0 15px rgba(10, 132, 255, 0.4); }
          .ep-img { width: 100%; height: 100%; object-fit: cover; background: #222; }
          .ep-progress { position: absolute; bottom: 0; left: 0; height: 3px; background: var(--ios-blue); width: 0%; transition: width 0.3s; }
          .ep-card.active .ep-progress { width: 100%; }
          
          .ep-info { display: flex; flex-direction: column; }
          .ep-num { font-size: 0.75rem; font-weight: 700; color: rgba(255,255,255,0.5); }
          .ep-name { font-size: 0.85rem; color: #fff; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
          .ep-card.active .ep-num { color: var(--ios-blue); }

          .synopsis-btn { align-self: flex-start; color: var(--ios-blue); font-size: 0.9rem; font-weight: 600; margin-top: 8px; display: flex; align-items: center; gap: 8px; }
          .synopsis-icon { transition: transform 0.3s var(--ease-elastic); font-size: 12px; }
          .synopsis-btn:hover { opacity: 0.8; }
          .synopsis-text { font-size: 0.9rem; color: rgba(255,255,255,0.7); line-height: 1.6; margin-top: 8px; animation: fadeIn 0.3s ease; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

          /* --- PLAYER POPUP (NOVO ESTILO) --- */
          .player-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.6); z-index: 2000;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            animation: overlayFadeIn 0.4s var(--ease-smooth);
          }
          @keyframes overlayFadeIn { from { opacity: 0; } to { opacity: 1; } }
          
          .player-popup-container {
            position: relative; background: #000;
            box-shadow: 0 0 50px rgba(0,0,0,0.8);
            border-radius: 30px; /* Borda bem arredondada */
            overflow: hidden;
            transition: all 0.5s var(--ease-elastic);
            border: 1px solid rgba(255,255,255,0.1);
          }
          
          /* Ajuste de tamanho levemente menor */
          .popup-size-square { width: min(85vw, 45vh); height: min(85vw, 45vh); aspect-ratio: 1/1; }
          .popup-size-banner { width: 85vw; max-width: 900px; aspect-ratio: 16/9; }
          
          .player-embed { width: 100%; height: 100%; border: none; }

          .player-header-controls {
            position: absolute; top: -50px; left: 10px; right: 10px;
            display: flex; justify-content: space-between; align-items: center;
          }
          .ep-indicator { font-size: 1.2rem; font-weight: 700; color: #fff; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
          .right-controls { display: flex; gap: 12px; }
          .control-btn {
            width: 40px; height: 40px; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);
            border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; transition: background 0.3s;
          }
          .control-btn:hover { background: rgba(255,255,255,0.25); }

          .player-bottom-controls {
            position: absolute; bottom: -60px; left: 0; right: 0;
            display: flex; justify-content: center; gap: 24px;
          }
          .nav-ep-btn {
            background: rgba(255,255,255,0.1); padding: 10px 24px; border-radius: 50px;
            color: #fff; font-weight: 600; display: flex; align-items: center; gap: 8px;
            transition: transform 0.2s;
          }
          .nav-ep-btn:active { transform: scale(0.95); }

          @media (max-width: 768px) {
            .container { padding-left: 1rem; padding-right: 1rem; }
            .bar-container { width: 94%; }
            .player-banner-container { border-radius: 16px; }
            .details-container { padding: 16px; }
            .media-title { font-size: 1.2rem; }
            .popup-size-square { width: 90vw; height: 90vw; }
            .info-popup, .toast { min-width: 280px; padding: 14px 16px; }
            .popup-icon-wrapper, .toast-icon-wrapper { width: 38px; height: 38px; min-width: 38px; }
            .popup-icon-wrapper i, .toast-icon-wrapper i { font-size: 18px; }
            .page-title { font-size: 1.3rem; }
            .dot { width: 8px; height: 8px; }
            .status-dots { gap: 6px; }
          }
        `}</style>
      </Head>

      <div className={`site-wrapper ${isPlaying ? 'blurred' : ''}`}>
        
        <Header
          label={scrolled ? "Reproduzindo" : "Yoshikawa"}
          scrolled={scrolled}
          showInfo={showInfoPopup}
          toggleInfo={toggleInfoPopup}
          infoClosing={infoClosing}
          showTech={showTechPopup}
          toggleTech={toggleTechPopup}
          techClosing={techClosing}
        />

        <ToastContainer toast={currentToast} closeToast={() => setCurrentToast(prev => ({...prev, closing: true}))} />

        <main className="container">
          <div className="page-header">
            <h1 className="page-title">Reproduzindo</h1>
            <div className="status-dots">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>
          </div>

          <div className="player-banner-container" onClick={() => setIsPlaying(true)}>
            <img 
              src={content.backdrop_path ? `https://image.tmdb.org/t/p/original${content.backdrop_path}` : DEFAULT_BACKDROP} 
              className="banner-image" 
              alt="Capa" 
            />
            <div className="play-button-static">
              <i className="fas fa-play"></i>
            </div>
          </div>

          <div className="glass-panel details-container">
            <div className="text-left">
              <h2 className="media-title">{content.title || content.name}</h2>
              {type === 'tv' && (
                <h3 className="episode-title">
                  T{season}:E{episode} {seasonData?.episodes ? `- ${seasonData.episodes.find(e => e.episode_number === episode)?.name || ''}` : ''}
                </h3>
              )}
            </div>

            {type === 'tv' && (
              <>
                <div className="season-wrapper">
                  <button className="season-btn" onClick={() => setShowSeasonSelector(!showSeasonSelector)}>
                    Temporada {season} <i className="fas fa-chevron-down" style={{fontSize: '10px'}}></i>
                  </button>
                  {showSeasonSelector && (
                    <div className="season-selector-popup glass-panel">
                      {seasonsList.map(s => (
                        <div 
                          key={s} 
                          className={`season-option ${s === season ? 'active' : ''}`}
                          onClick={() => { fetchSeason(id, s); setShowSeasonSelector(false); }}
                        >
                          Temporada {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="episodes-carousel" ref={episodesRef}>
                  {seasonData && seasonData.episodes ? seasonData.episodes.map(ep => (
                    <div 
                      key={ep.id} 
                      className={`ep-card ${ep.episode_number === episode ? 'active' : ''}`}
                      data-ep={ep.episode_number}
                      onClick={() => setEpisode(ep.episode_number)}
                    >
                      <div className="ep-img-wrap">
                        <img 
                          src={ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : DEFAULT_POSTER} 
                          className="ep-img"
                          alt={`Ep ${ep.episode_number}`} 
                          loading="lazy"
                        />
                        <div className="ep-progress"></div>
                      </div>
                      <div className="ep-info">
                         <span className="ep-num">Episódio {ep.episode_number}</span>
                         <span className="ep-name">{ep.name}</span>
                      </div>
                    </div>
                  )) : (
                    <div style={{color:'#666', fontSize:'0.8rem', padding:'10px'}}>Carregando episódios...</div>
                  )}
                </div>
              </>
            )}

            <button className="synopsis-btn" onClick={() => setShowSynopsis(!showSynopsis)}>
              {showSynopsis ? 'Ocultar Sinopse' : 'Ler Sinopse'}
              <i 
                className="fas fa-chevron-down synopsis-icon" 
                style={{ transform: showSynopsis ? 'rotate(180deg)' : 'rotate(0deg)' }}
              ></i>
            </button>
            
            {showSynopsis && (
              <p className="synopsis-text">{content.overview || "Sinopse indisponível."}</p>
            )}
          </div>
        </main>

        <BottomNav 
          isFavorite={isFavorite} 
          onToggleFavorite={toggleFavorite} 
        />
      </div>

      {isPlaying && (
        <div className="player-overlay">
          <div className={`player-popup-container ${isWideMode ? 'popup-size-banner' : 'popup-size-square'}`}>
            
            <div className="player-header-controls">
              <span className="ep-indicator">
                 {type === 'tv' ? `S${season}:E${episode}` : 'Filme'}
              </span>
              <div className="right-controls">
                <button className="control-btn" onClick={() => setIsWideMode(!isWideMode)} title="Alterar Formato">
                  <i className={isWideMode ? "fas fa-compress" : "fas fa-expand"}></i>
                </button>
                <button className="control-btn" onClick={() => setIsPlaying(false)} title="Fechar">
                  <i className="fas fa-xmark"></i>
                </button>
              </div>
            </div>

            <iframe 
              src={getEmbedUrl()} 
              className="player-embed" 
              allowFullScreen 
              scrolling="no"
              title="Player"
            ></iframe>

            {type === 'tv' && (
              <div className="player-bottom-controls">
                <button className="nav-ep-btn glass-panel" onClick={handlePrevEp}>
                  <i className="fas fa-backward-step"></i> Ant
                </button>
                <button className="nav-ep-btn glass-panel" onClick={handleNextEp}>
                  Prox <i className="fas fa-forward-step"></i>
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  )
}
