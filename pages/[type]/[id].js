import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
const DEFAULT_BACKDROP = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'

// --- COMPONENTES AUXILIARES ---

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

export const BottomNav = ({ isFavorite, onToggleFavorite, onToggleSynopsis }) => {
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

      <div className="pill-container glass-panel">
         <Link href="/" className="nav-btn">
            <i className="fas fa-home"></i>
         </Link>
         <button className="nav-btn" onClick={onToggleSynopsis} title="Sinopse">
            <i className="fas fa-align-left"></i>
         </button>
      </div>

      <button className="round-btn glass-panel" onClick={handleFavClick} title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}>
        <i 
          className={`${isFavorite ? 'fas fa-heart' : 'far fa-heart'} ${animating ? 'heart-pulse' : ''}`}
          style={{ color: isFavorite ? '#ff3b30' : '#ffffff', fontSize: '15px' }}
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

// --- PÁGINA DINÂMICA DE REPRODUÇÃO ([type]/[id].js) ---

export default function WatchPage() {
  const router = useRouter()
  const { type, id } = router.query
  const carouselRef = useRef(null)
  
  // Estados de Interface
  const [scrolled, setScrolled] = useState(false)
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [infoClosing, setInfoClosing] = useState(false)
  const [showTechPopup, setShowTechPopup] = useState(false)
  const [techClosing, setTechClosing] = useState(false)
  const [showSynopsisPopup, setShowSynopsisPopup] = useState(false)
  const [synopsisClosing, setSynopsisClosing] = useState(false)
  const [currentToast, setCurrentToast] = useState(null)
  const [toastQueue, setToastQueue] = useState([])
  
  // Estados do Player e Conteúdo
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isWideMode, setIsWideMode] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  
  // Estados Específicos de Série
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [seasonData, setSeasonData] = useState(null)

  const toastTimerRef = useRef(null)

  // --- TOAST LOGIC ---
  const showToast = (message, type = 'info') => {
    if (showInfoPopup || showTechPopup) {
      closeAllPopups()
    }
    
    if (currentToast && !currentToast.closing) {
      setCurrentToast(prev => ({ ...prev, closing: true }))
      setTimeout(() => {
        setToastQueue(prev => [...prev, { message, type, id: Date.now() }])
      }, 200)
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

  const manualCloseToast = () => { 
    if (currentToast) setCurrentToast({ ...currentToast, closing: true }) 
  }

  // --- FETCHING DATA ---
  useEffect(() => {
    if (!id || !type) return

    const loadContent = async () => {
      setLoading(true)
      try {
        const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR`)
        const data = await res.json()
        setContent(data)

        if (type === 'tv') {
          await fetchSeason(id, 1)
        }

        checkFavoriteStatus(data)
      } catch (error) {
        console.error("Erro ao carregar", error)
        showToast('Erro ao carregar conteúdo', 'error')
      } finally {
        setLoading(false)
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
    } catch (err) { 
      console.error(err)
      showToast('Erro ao carregar temporada', 'error')
    }
  }

  const checkFavoriteStatus = (item) => {
    try {
      const stored = localStorage.getItem('yoshikawaFavorites')
      const favorites = stored ? JSON.parse(stored) : []
      const exists = favorites.some(f => f.id === item.id && f.media_type === type)
      setIsFavorite(exists)
    } catch {
      setIsFavorite(false)
    }
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
        favorites = [...favorites, {
          id: content.id,
          media_type: type,
          title: content.title || content.name,
          poster_path: content.poster_path
        }]
        setIsFavorite(true)
        showToast('Adicionado aos favoritos', 'success')
      }

      localStorage.setItem('yoshikawaFavorites', JSON.stringify(favorites))
    } catch {
      showToast('Erro ao salvar favorito', 'error')
    }
  }

  // --- HANDLERS ---
  const closeAllPopups = useCallback(() => {
    if (showInfoPopup && !infoClosing) {
      setInfoClosing(true)
      setTimeout(() => { setShowInfoPopup(false); setInfoClosing(false) }, 400)
    }
    if (showTechPopup && !techClosing) {
      setTechClosing(true)
      setTimeout(() => { setShowTechPopup(false); setTechClosing(false) }, 400)
    }
    if (showSynopsisPopup && !synopsisClosing) {
      setSynopsisClosing(true)
      setTimeout(() => { setShowSynopsisPopup(false); setSynopsisClosing(false) }, 400)
    }
    if (currentToast && !currentToast.closing) {
      setCurrentToast(prev => ({ ...prev, closing: true }))
    }
  }, [showInfoPopup, infoClosing, showTechPopup, techClosing, showSynopsisPopup, synopsisClosing, currentToast])

  const toggleInfoPopup = () => {
    if (showTechPopup || currentToast) {
      closeAllPopups()
      setTimeout(() => {
        if (!showInfoPopup) setShowInfoPopup(true)
      }, 200)
    } else {
      if (showInfoPopup) {
        setInfoClosing(true)
        setTimeout(() => { setShowInfoPopup(false); setInfoClosing(false) }, 400)
      } else {
        setShowInfoPopup(true)
      }
    }
  }

  const toggleTechPopup = () => {
    if (showInfoPopup || currentToast) {
      closeAllPopups()
      setTimeout(() => {
        if (!showTechPopup) setShowTechPopup(true)
      }, 200)
    } else {
      if (showTechPopup) {
        setTechClosing(true)
        setTimeout(() => { setShowTechPopup(false); setTechClosing(false) }, 400)
      } else {
        setShowTechPopup(true)
      }
    }
  }

  const toggleSynopsisPopup = () => {
    if (showInfoPopup || showTechPopup || currentToast) {
      closeAllPopups()
      setTimeout(() => {
        if (!showSynopsisPopup) setShowSynopsisPopup(true)
      }, 200)
    } else {
      if (showSynopsisPopup) {
        setSynopsisClosing(true)
        setTimeout(() => { setShowSynopsisPopup(false); setSynopsisClosing(false) }, 400)
      } else {
        setShowSynopsisPopup(true)
      }
    }
  }

  useEffect(() => {
    const onScroll = () => { 
      if (window.scrollY > 10) closeAllPopups()
      setScrolled(window.scrollY > 60) 
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    
    const onClick = (e) => { 
      if (!e.target.closest('.info-popup') && !e.target.closest('.toast') && !e.target.closest('.round-btn') && !e.target.closest('.pill-container')) {
        closeAllPopups() 
      }
    }
    window.addEventListener('click', onClick)
    
    return () => { 
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('click', onClick) 
    }
  }, [closeAllPopups])

  useEffect(() => {
    if (carouselRef.current && seasonData) {
      const activeCard = carouselRef.current.querySelector('.ep-card.active')
      if (activeCard) {
        activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [episode, seasonData])

  // Player Logic
  const handleNextEp = () => {
    const nextEp = episode + 1
    if (seasonData && seasonData.episodes && nextEp <= seasonData.episodes.length) {
      setEpisode(nextEp)
    } else {
      showToast('Fim da temporada', 'info')
    }
  }
  
  const handlePrevEp = () => {
    if (episode > 1) {
      setEpisode(episode - 1)
    }
  }
  
  const getEmbedUrl = () => {
    if (!content) return ''
    if (type === 'movie') {
      return `https://superflixapi.cv/filme/${id}`
    }
    return `https://superflixapi.cv/serie/${id}/${season}/${episode}`
  }

  const [showSeasonSelector, setShowSeasonSelector] = useState(false)
  const [selectorClosing, setSelectorClosing] = useState(false)

  const handleSeasonChange = () => {
    setShowSeasonSelector(true)
  }

  const selectSeason = (newSeason) => {
    setSelectorClosing(true)
    setTimeout(() => {
      setShowSeasonSelector(false)
      setSelectorClosing(false)
      fetchSeason(id, newSeason)
      setEpisode(1)
    }, 300)
  }

  if (loading) {
    return <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'#050505', color:'#fff'}}>Carregando...</div>
  }

  if (!content) return null

  const currentEpisodeData = seasonData?.episodes?.find(e => e.episode_number === episode)

  return (
    <>
      <Head>
        <title>{content.title || content.name} - Reproduzindo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
          html { scroll-behavior: smooth; }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #050505;
            color: #f5f5f7;
            line-height: 1.6;
            font-size: 16px;
            min-height: 100vh;
            overflow-y: auto;
            overflow-x: hidden;
            background-image: radial-gradient(circle at 50% 0%, #1a1a1a, #050505 80%);
            background-attachment: fixed;
          }
          a { color: inherit; text-decoration: none; }
          button { font-family: inherit; border: none; outline: none; background: none; cursor: pointer; user-select: none; }
          img { max-width: 100%; height: auto; display: block; }

          :root {
            --pill-height: 44px;
            --pill-radius: 50px;
            --pill-max-width: 520px;
            --ios-blue: #0A84FF;
            --ease-elastic: cubic-bezier(0.34, 1.56, 0.64, 1);
            --ease-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }

          .glass-panel {
            position: relative;
            background: rgba(255, 255, 255, 0.06);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: inherit;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            overflow: hidden;
            transition: transform 0.3s var(--ease-elastic), background 0.3s ease, border-color 0.3s ease;
          }

          .site-wrapper {
             width: 100%;
             min-height: 100vh;
          }

          .bar-container {
            position: fixed; left: 50%; transform: translateX(-50%); z-index: 1000;
            display: flex; align-items: center; justify-content: center; gap: 12px; 
            width: 90%; max-width: var(--pill-max-width); transition: all 0.4s var(--ease-smooth);
          }
          .top-bar { top: 20px; }
          .bottom-bar { bottom: 20px; }
          .top-bar.scrolled-state { transform: translateX(-50%) translateY(-5px); }

          .round-btn {
            width: var(--pill-height); height: var(--pill-height); border-radius: 50%;
            display: flex; align-items: center; justify-content: center; color: rgba(255, 255, 255, 0.9);
            flex-shrink: 0; transition: all 0.3s var(--ease-elastic);
          }
          .round-btn:hover { transform: scale(1.08); background: rgba(255, 255, 255, 0.12); border-color: rgba(255, 255, 255, 0.2); }
          .round-btn:active { transform: scale(0.92); }

          .pill-container {
            height: var(--pill-height); flex: 1; border-radius: var(--pill-radius);
            display: flex; align-items: center; justify-content: center; position: relative;
            transition: all 0.4s var(--ease-elastic);
          }
          .nav-btn { 
            flex: 1; display: flex; align-items: center; justify-content: center; 
            height: 100%; color: rgba(255,255,255,0.4); transition: all 0.3s ease;
            position: relative; z-index: 5;
          }
          .nav-btn i { font-size: 18px; transition: all 0.4s var(--ease-elastic); }
          .nav-btn:hover i { transform: scale(1.2); color: rgba(255,255,255,0.8); }
          .nav-btn:active i { transform: scale(0.9); }

          .bar-label { 
            font-size: 0.9rem; font-weight: 600; color: #fff; white-space: nowrap;
            letter-spacing: -0.01em;
            position: relative; z-index: 5;
          }

          .heart-pulse { animation: heartZoom 0.5s var(--ease-elastic); }
          @keyframes heartZoom { 
            0% { transform: scale(1); }
            50% { transform: scale(1.6); } 
            100% { transform: scale(1); }
          }

          .info-popup, .toast, .synopsis-popup {
            position: fixed;
            top: calc(20px + var(--pill-height) + 16px); 
            left: 50%;
            z-index: 960;
            min-width: 320px;
            max-width: 90%;
            display: flex; 
            align-items: center; 
            gap: 14px;
            padding: 16px 18px; 
            border-radius: 22px;
            transform: translateX(-50%) translateY(-50%) scale(0.3);
            transform-origin: top center;
            opacity: 0;
            animation: popupZoomIn 0.5s var(--ease-elastic) forwards;
            box-shadow: 0 20px 60px rgba(0,0,0,0.6);
          }
          
          .info-popup { z-index: 950; pointer-events: none; }
          .toast { z-index: 960; pointer-events: auto; } 
          .synopsis-popup { z-index: 950; pointer-events: none; }

          .info-popup.closing, .toast.closing, .synopsis-popup.closing { 
            animation: popupZoomOut 0.4s cubic-bezier(0.55, 0.055, 0.675, 0.19) forwards; 
          }

          @keyframes popupZoomIn {
            0% { opacity: 0; transform: translateX(-50%) translateY(-50%) scale(0.3); }
            100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); pointer-events: auto; }
          }
          @keyframes popupZoomOut {
            0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
            100% { opacity: 0; transform: translateX(-50%) translateY(-30%) scale(0.5); pointer-events: none; }
          }
          
          .popup-icon-wrapper, .toast-icon-wrapper, .synopsis-icon-wrapper { 
            width: 42px; height: 42px; min-width: 42px; border-radius: 12px; 
            display: flex; align-items: center; justify-content: center; 
            animation: iconPop 0.6s var(--ease-elastic) 0.1s backwards; 
          }
          .popup-icon-wrapper { 
            background: linear-gradient(135deg, #34c759 0%, #30d158 100%); 
            box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3); 
          }
          .popup-icon-wrapper.tech { 
            background: linear-gradient(135deg, #0a84ff 0%, #007aff 100%); 
            box-shadow: 0 4px 12px rgba(10, 132, 255, 0.3); 
          }

          .toast-icon-wrapper { border-radius: 50%; }
          .toast.success .toast-icon-wrapper {
            background: linear-gradient(135deg, #34c759 0%, #30d158 100%);
            box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3);
          }
          .toast.info .toast-icon-wrapper {
            background: linear-gradient(135deg, #0a84ff 0%, #007aff 100%);
            box-shadow: 0 4px 12px rgba(10, 132, 255, 0.3);
          }
          .toast.error .toast-icon-wrapper {
            background: linear-gradient(135deg, #ff453a 0%, #ff3b30 100%);
            box-shadow: 0 4px 12px rgba(255, 69, 58, 0.3);
          }

          .synopsis-icon-wrapper {
            background: linear-gradient(135deg, #ff9500 0%, #ff8c00 100%);
            box-shadow: 0 4px 12px rgba(255, 149, 0, 0.3);
          }

          .popup-icon-wrapper i, .toast-icon-wrapper i, .synopsis-icon-wrapper i { font-size: 20px; color: #fff; }
          .popup-content, .toast-content, .synopsis-popup-content { 
            flex: 1; display: flex; flex-direction: column; gap: 4px; 
            opacity: 0; animation: contentFade 0.4s ease 0.2s forwards; 
          }
          .synopsis-popup-content {
            max-height: 60vh; overflow-y: auto;
          }
          @keyframes contentFade { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }
          .popup-title, .toast-title, .synopsis-popup-title { font-size: 0.95rem; font-weight: 600; color: #fff; margin: 0; line-height: 1.3; }
          .popup-text, .toast-msg, .synopsis-popup-text { font-size: 0.8rem; color: rgba(255, 255, 255, 0.7); margin: 0; line-height: 1.4; }

          @keyframes iconPop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }

          .toast-wrap { position: fixed; top: calc(20px + var(--pill-height) + 16px); left: 50%; z-index: 960; pointer-events: none; }

          .season-selector-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5); z-index: 2100;
            display: flex; align-items: center; justify-content: center;
            animation: overlayFadeIn 0.3s ease;
          }
          .season-selector-overlay.closing { animation: fadeOut 0.3s ease forwards; }
          @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }

          .season-selector {
            background: rgba(20,20,20,0.95); backdrop-filter: blur(20px);
            border-radius: 20px; padding: 24px; max-width: 400px; width: 90%;
            border: 1px solid rgba(255,255,255,0.1);
            animation: popupZoomIn 0.4s var(--ease-elastic);
          }
          .season-selector.closing { animation: popupZoomOut 0.3s ease forwards; }

          .season-selector-title {
            font-size: 1.1rem; font-weight: 600; color: #fff; margin-bottom: 16px; text-align: center;
          }
          .season-grid {
            display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 10px;
          }
          .season-option {
            background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px; padding: 14px; text-align: center;
            color: #fff; font-weight: 600; cursor: pointer;
            transition: all 0.2s ease;
          }
          .season-option:hover { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.3); }
          .season-option.active { background: var(--ios-blue); border-color: var(--ios-blue); }

          .container {
            max-width: 1280px; margin: 0 auto;
            padding-top: 6.5rem; padding-bottom: 7rem;
            padding-left: 2rem; padding-right: 2rem;
          }
          .page-header { 
            display: flex; align-items: center; justify-content: space-between; 
            margin-bottom: 1.5rem; 
          }

          .page-title { font-size: 1.3rem; font-weight: 700; color: #fff; text-shadow: 0 4px 20px rgba(0,0,0,0.5); }
          
          .status-dots { display: flex; align-items: center; gap: 8px; }
          .dot { width: 10px; height: 10px; border-radius: 50%; animation: dotPulse 2s ease-in-out infinite; }
          .dot.red { background: linear-gradient(135deg, #ff453a, #ff3b30); box-shadow: 0 2px 8px rgba(255, 69, 58, 0.4); }
          .dot.yellow { background: linear-gradient(135deg, #ffd60a, #ffcc00); box-shadow: 0 2px 8px rgba(255, 204, 0, 0.4); animation-delay: 0.3s; }
          .dot.green { background: linear-gradient(135deg, #34c759, #30d158); box-shadow: 0 2px 8px rgba(52, 199, 89, 0.4); animation-delay: 0.6s; }
          @keyframes dotPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.6; } }

          .player-banner-container {
            width: 100%; aspect-ratio: 16/9; border-radius: 24px; overflow: hidden; position: relative;
            background-color: #1a1a1a; border: 0.5px solid rgba(255,255,255,0.08);
            box-shadow: 0 0 0 1px rgba(0,0,0,0.8) inset, 0 20px 40px rgba(0,0,0,0.4); 
            margin-bottom: 24px; cursor: pointer;
          }

          .banner-image { width: 100%; height: 100%; object-fit: cover; transition: transform 0.8s var(--ease-elastic); }
          .player-banner-container:hover .banner-image { transform: scale(1.05); }

          .play-button-static {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 64px; height: 64px; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px);
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            border: 1px solid rgba(255,255,255,0.3);
          }
          .play-button-static i { color: #fff; font-size: 24px; margin-left: 4px; }

          .details-container {
            border-radius: 24px; padding: 18px; display: flex; flex-direction: column; gap: 16px;
            border: 0.5px solid rgba(255,255,255,0.08);
            box-shadow: 0 0 0 1px rgba(0,0,0,0.8) inset;
          }

          .media-title { font-size: 1.15rem; font-weight: 700; color: #fff; line-height: 1.2; }

          .season-controls {
            display: flex; align-items: center; justify-content: space-between; margin-top: 8px;
          }

          .season-btn {
            background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 12px;
            font-size: 0.9rem; color: #fff; display: inline-flex; align-items: center; gap: 8px;
            transition: background 0.2s;
          }
          .season-btn:hover { background: rgba(255,255,255,0.2); }

          .episodes-carousel { 
            display: flex; gap: 10px; overflow-x: auto; padding: 4px 0 12px 0;
            scrollbar-width: none;
          }
          .episodes-carousel::-webkit-scrollbar { display: none; }
          
          @media (min-width: 769px) {
            .episodes-carousel {
              scrollbar-width: thin;
              scrollbar-color: rgba(255,255,255,0.2) rgba(255,255,255,0.03);
            }
            .episodes-carousel::-webkit-scrollbar { display: block; height: 6px; }
            .episodes-carousel::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); border-radius: 10px; }
            .episodes-carousel::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
            .episodes-carousel::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.4); }
          }
          
          .ep-card {
            min-width: 110px; height: 65px; background-size: cover; background-position: center;
            border-radius: 10px; display: flex; flex-direction: column; justify-content: flex-end;
            padding: 6px 8px; border: 0.5px solid rgba(255,255,255,0.08); cursor: pointer; 
            transition: all 0.2s ease; position: relative; overflow: hidden;
            box-shadow: 0 0 0 1px rgba(0,0,0,0.8) inset;
          }
          .ep-card::before {
            content: ''; position: absolute; inset: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%);
          }
          .ep-card:hover { border-color: rgba(255,255,255,0.25); transform: scale(1.05); }
          .ep-card.active { border-color: var(--ios-blue); border-width: 1.5px; box-shadow: 0 0 0 1px var(--ios-blue); }
          
          .ep-card-num { font-size: 0.75rem; font-weight: 700; color: #fff; position: relative; z-index: 1; }
          .ep-card-title { font-size: 0.65rem; color: rgba(255,255,255,0.8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; position: relative; z-index: 1; }

          .player-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            z-index: 2000; display: flex; flex-direction: column;
            align-items: center; justify-content: center;
          }
          
          .player-popup-container {
            position: relative; background: #000; border-radius: 20px; overflow: hidden;
            box-shadow: 0 0 60px rgba(0,0,0,0.9);
            transition: all 0.4s var(--ease-elastic); display: flex; align-items: center; justify-content: center;
          }
          
          .popup-size-square { width: min(70vw, 40vh); height: min(70vw, 40vh); aspect-ratio: 1/1; }
          .popup-size-banner { width: 80vw; max-width: 900px; aspect-ratio: 16/9; }
          
          .player-embed { width: 100%; height: 100%; border: none; }

          .player-header-controls {
            position: absolute; top: -55px; left: 0; right: 0;
            display: flex; justify-content: space-between; align-items: center; width: 100%;
          }
          .ep-indicator { 
            font-size: 1rem; font-weight: 700; color: #fff; 
            text-shadow: 0 2px 10px rgba(0,0,0,0.8);
            background: rgba(0,0,0,0.3); padding: 8px 16px; border-radius: 12px;
            backdrop-filter: blur(10px);
          }
          .right-controls { display: flex; gap: 10px; }
          .control-btn {
            width: 42px; height: 42px; background: rgba(0,0,0,0.3); backdrop-filter: blur(10px);
            border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; 
            transition: all 0.3s; border: 1px solid rgba(255,255,255,0.15);
          }
          .control-btn:hover { background: rgba(0,0,0,0.5); transform: scale(1.1); border-color: rgba(255,255,255,0.3); }

          .player-bottom-controls {
            position: absolute; bottom: -65px; left: 0; right: 0;
            display: flex; justify-content: center; gap: 16px;
          }
          .nav-ep-btn {
            background: rgba(0,0,0,0.3); padding: 10px 24px; border-radius: 50px;
            color: #fff; font-weight: 600; display: flex; align-items: center; gap: 8px;
            transition: all 0.3s; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.15);
          }
          .nav-ep-btn:hover { background: rgba(0,0,0,0.5); transform: scale(1.05); border-color: rgba(255,255,255,0.3); }
          .nav-ep-btn:active { transform: scale(0.95); }

          @media (max-width: 768px) {
            .container { padding-left: 1rem; padding-right: 1rem; }
            .bar-container { width: 94%; }
            .player-banner-container { border-radius: 16px; }
            .details-container { padding: 14px; }
            .media-title { font-size: 1rem; }
            .popup-size-square { width: 85vw; height: 85vw; }
            .popup-size-banner { width: 90vw; }
            .info-popup, .toast, .synopsis-popup { min-width: 280px; padding: 14px 16px; }
            .popup-icon-wrapper, .toast-icon-wrapper, .synopsis-icon-wrapper { width: 38px; height: 38px; min-width: 38px; }
            .popup-icon-wrapper i, .toast-icon-wrapper i, .synopsis-icon-wrapper i { font-size: 18px; }
            .popup-title, .toast-title, .synopsis-popup-title { font-size: 0.88rem; }
            .popup-text, .toast-msg, .synopsis-popup-text { font-size: 0.75rem; }
            .page-title { font-size: 1.2rem; }
            .dot { width: 8px; height: 8px; }
            .status-dots { gap: 6px; }
            .player-header-controls { top: -50px; }
            .ep-indicator { font-size: 0.85rem; padding: 6px 12px; }
            .control-btn { width: 38px; height: 38px; }
            .player-bottom-controls { bottom: -58px; gap: 12px; }
            .nav-ep-btn { padding: 8px 18px; font-size: 0.9rem; }
          }
        `}</style>
      </Head>

      <div className="site-wrapper">
        
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

        <ToastContainer toast={currentToast} closeToast={manualCloseToast} />

        {showSynopsisPopup && (
          <div 
            className={`synopsis-popup glass-panel ${synopsisClosing ? 'closing' : ''}`} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="synopsis-icon-wrapper">
              <i className="fas fa-align-left"></i>
            </div>
            <div className="synopsis-popup-content">
              <p className="synopsis-popup-title">Sinopse</p>
              <p className="synopsis-popup-text">
                {type === 'tv' && currentEpisodeData?.overview 
                  ? currentEpisodeData.overview 
                  : content?.overview || "Sinopse indisponível."}
              </p>
            </div>
          </div>
        )}

        <main className="container">
          <div className="page-header">
            <h1 className="page-title">Reproduzindo</h1>
            <div className="status-dots">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>
          </div>

          <div 
            className="player-banner-container" 
            onClick={() => setIsPlaying(true)}
            style={{
              backgroundImage: currentEpisodeData?.still_path 
                ? `url(https://image.tmdb.org/t/p/original${currentEpisodeData.still_path})`
                : content.backdrop_path 
                  ? `url(https://image.tmdb.org/t/p/original${content.backdrop_path})`
                  : `url(${DEFAULT_BACKDROP})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="play-button-static">
              <i className="fas fa-play"></i>
            </div>
          </div>

          <div className="glass-panel details-container">
            <div className="text-left">
              <h2 className="media-title">{content.title || content.name}</h2>
            </div>

            {type === 'tv' && (
              <>
                <div className="season-controls">
                  <button className="season-btn" onClick={handleSeasonChange}>
                    Temporada {season} <i className="fas fa-chevron-down" style={{fontSize: '10px'}}></i>
                  </button>
                </div>

                <div className="episodes-carousel" ref={carouselRef}>
                  {seasonData && seasonData.episodes ? seasonData.episodes.map(ep => (
                    <div 
                      key={ep.id} 
                      className={`ep-card ${ep.episode_number === episode ? 'active' : ''}`}
                      onClick={() => setEpisode(ep.episode_number)}
                      style={{
                        backgroundImage: ep.still_path 
                          ? `url(https://image.tmdb.org/t/p/w300${ep.still_path})`
                          : 'linear-gradient(135deg, #1a1a1a, #0a0a0a)'
                      }}
                    >
                      <span className="ep-card-num">Ep {ep.episode_number}</span>
                      <span className="ep-card-title">{ep.name}</span>
                    </div>
                  )) : (
                    <div style={{color:'#666', fontSize:'0.8rem'}}>Carregando episódios...</div>
                  )}
                </div>
              </>
            )}
          </div>
        </main>

        <BottomNav isFavorite={isFavorite} onToggleFavorite={toggleFavorite} onToggleSynopsis={toggleSynopsisPopup} />
      </div>

      {showSeasonSelector && (
        <div className={`season-selector-overlay ${selectorClosing ? 'closing' : ''}`} onClick={() => { setSelectorClosing(true); setTimeout(() => { setShowSeasonSelector(false); setSelectorClosing(false) }, 300) }}>
          <div className={`season-selector ${selectorClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
            <h3 className="season-selector-title">Escolher Temporada</h3>
            <div className="season-grid">
              {Array.from({ length: content?.number_of_seasons || 1 }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  className={`season-option ${num === season ? 'active' : ''}`}
                  onClick={() => selectSeason(num)}
                >
                  T{num}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isPlaying && (
        <div className="player-overlay">
          <div className={`player-popup-container ${isWideMode ? 'popup-size-banner' : 'popup-size-square'}`}>
            
            <div className="player-header-controls">
              <span className="ep-indicator">
                 {type === 'tv' ? `S${season}:E${episode}` : 'FILME'}
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
                <button className="nav-ep-btn glass-panel" onClick={handlePrevEp} disabled={episode === 1}>
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
