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
          title="Info App"
        >
          <i className="fas fa-code" style={{ fontSize: '14px' }}></i>
        </button>

        <div className="pill-container glass-panel">
          <span key={label} className="bar-label">{label}</span>
        </div>

        <button 
          className="round-btn glass-panel" 
          title={scrolled ? "Voltar ao topo" : "Informações"}
          onClick={handleRightClick}
        >
          <i className={scrolled ? "fas fa-chevron-up" : "fas fa-shield-halved"} style={{ fontSize: '14px' }}></i>
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
            <p className="popup-title">Proteção</p>
            <p className="popup-text">Recomendamos uso de <strong>AdBlock</strong>.</p>
          </div>
        </div>
      )}

      {showTech && (
        <div 
          className={`info-popup glass-panel ${techClosing ? 'closing' : ''}`} 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="popup-icon-wrapper tech">
            <i className="fas fa-code"></i>
          </div>
          <div className="popup-content">
            <p className="popup-title">Sistema</p>
            <p className="popup-text">v3.0.0 Clean • React 18</p>
          </div>
        </div>
      )}
    </>
  )
}

export const BottomNav = ({ isFavorite, onToggleFavorite, onToggleSynopsis, onToggleContentInfo }) => {
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
        <i className="fas fa-share-nodes" style={{ fontSize: '15px' }}></i>
      </button>

      <div className="pill-container glass-panel">
         <Link href="/" className="nav-btn">
            <i className="fas fa-home"></i>
         </Link>
         <button className="nav-btn" onClick={onToggleSynopsis} title="Sinopse">
            <i className="fas fa-align-left"></i>
         </button>
         <button className="nav-btn" onClick={onToggleContentInfo} title="Dados Técnicos">
            <i className="fas fa-film"></i>
         </button>
      </div>

      <button className="round-btn glass-panel" onClick={handleFavClick} title="Favoritos">
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
          <i className={`fas ${toast.type === 'success' ? 'fa-check' : toast.type === 'error' ? 'fa-xmark' : 'fa-info'}`}></i>
        </div>
        <div className="toast-content">
          <div className="toast-title">{toast.type === 'success' ? 'Sucesso' : toast.type === 'error' ? 'Erro' : 'Info'}</div>
          <div className="toast-msg">{toast.message}</div>
        </div>
      </div>
    </div>
  )
}

// --- PÁGINA DINÂMICA ([type]/[id].js) ---

export default function WatchPage() {
  const router = useRouter()
  const { type, id } = router.query
  const carouselRef = useRef(null)
  
  // Estados de Interface
  const [scrolled, setScrolled] = useState(false)
  
  // Popups States
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [infoClosing, setInfoClosing] = useState(false)
  
  const [showTechPopup, setShowTechPopup] = useState(false)
  const [techClosing, setTechClosing] = useState(false)
  
  const [showSynopsisPopup, setShowSynopsisPopup] = useState(false)
  const [synopsisClosing, setSynopsisClosing] = useState(false)

  const [showContentTech, setShowContentTech] = useState(false)
  const [contentTechClosing, setContentTechClosing] = useState(false)

  // Player Popup States (Igual aos outros agora)
  const [showPlayer, setShowPlayer] = useState(false)
  const [playerClosing, setPlayerClosing] = useState(false)

  const [currentToast, setCurrentToast] = useState(null)
  const [toastQueue, setToastQueue] = useState([])
  
  // Dados
  const [content, setContent] = useState(null)
  const [isWideMode, setIsWideMode] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  
  // Série
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [seasonData, setSeasonData] = useState(null)

  const toastTimerRef = useRef(null)

  // --- TOAST LOGIC ---
  const showToast = (message, type = 'info') => {
    // Fecha outros popups ao mostrar toast para limpar a tela
    closeAllPopups()
    
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

  // --- FETCHING ---
  useEffect(() => {
    if (!id || !type) return

    const loadContent = async () => {
      try {
        const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR`)
        const data = await res.json()
        setContent(data)

        if (type === 'tv') {
          await fetchSeason(id, 1)
        }
        checkFavoriteStatus(data)
      } catch (error) {
        showToast('Erro de conexão', 'error')
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
      showToast('Erro ao carregar temporada', 'error')
    }
  }

  const checkFavoriteStatus = (item) => {
    try {
      const stored = localStorage.getItem('yoshikawaFavorites')
      const favorites = stored ? JSON.parse(stored) : []
      const exists = favorites.some(f => f.id === item.id && f.media_type === type)
      setIsFavorite(exists)
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
        showToast('Removido', 'info')
      } else {
        favorites = [...favorites, {
          id: content.id,
          media_type: type,
          title: content.title || content.name,
          poster_path: content.poster_path
        }]
        setIsFavorite(true)
        showToast('Salvo', 'success')
      }
      localStorage.setItem('yoshikawaFavorites', JSON.stringify(favorites))
    } catch { showToast('Erro local', 'error') }
  }

  // --- HANDLERS E LOGICA DE POPUPS UNIFICADA ---
  
  const closeAllPopups = useCallback(() => {
    // Info
    if (showInfoPopup && !infoClosing) {
      setInfoClosing(true)
      setTimeout(() => { setShowInfoPopup(false); setInfoClosing(false) }, 300)
    }
    // Tech App
    if (showTechPopup && !techClosing) {
      setTechClosing(true)
      setTimeout(() => { setShowTechPopup(false); setTechClosing(false) }, 300)
    }
    // Sinopse
    if (showSynopsisPopup && !synopsisClosing) {
      setSynopsisClosing(true)
      setTimeout(() => { setShowSynopsisPopup(false); setSynopsisClosing(false) }, 300)
    }
    // Content Tech (Novo)
    if (showContentTech && !contentTechClosing) {
      setContentTechClosing(true)
      setTimeout(() => { setShowContentTech(false); setContentTechClosing(false) }, 300)
    }
    // Player Embed
    if (showPlayer && !playerClosing) {
      setPlayerClosing(true)
      setTimeout(() => { setShowPlayer(false); setPlayerClosing(false) }, 300)
    }
    // Toast
    if (currentToast && !currentToast.closing) {
      setCurrentToast(prev => ({ ...prev, closing: true }))
    }
  }, [showInfoPopup, infoClosing, showTechPopup, techClosing, showSynopsisPopup, synopsisClosing, showContentTech, contentTechClosing, showPlayer, playerClosing, currentToast])

  // Helper para abrir um e fechar outros
  const openPopup = (setter, closerSetter, stateVal) => {
    if (stateVal) {
      // Se já ta aberto, fecha
      closerSetter(true)
      setTimeout(() => { setter(false); closerSetter(false) }, 300)
    } else {
      closeAllPopups()
      // Pequeno delay para a animação de saída dos outros não conflitar visualmente
      setTimeout(() => setter(true), 100)
    }
  }

  useEffect(() => {
    const onScroll = () => { 
      if (window.scrollY > 10) closeAllPopups()
      setScrolled(window.scrollY > 60) 
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    
    const onClick = (e) => { 
      // Se clicar fora de áreas interativas, fecha tudo
      if (!e.target.closest('.info-popup') && 
          !e.target.closest('.toast') && 
          !e.target.closest('.round-btn') && 
          !e.target.closest('.pill-container') &&
          !e.target.closest('.player-popup-container') && // Não fechar se clicar no player
          !e.target.closest('.season-selector-ui')) { // Não fechar se clicar no select
        closeAllPopups() 
      }
    }
    window.addEventListener('click', onClick)
    return () => { 
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('click', onClick) 
    }
  }, [closeAllPopups])

  // Scroll active episode
  useEffect(() => {
    if (carouselRef.current && seasonData) {
      const activeCard = carouselRef.current.querySelector('.ep-card.active')
      if (activeCard) {
        activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [episode, seasonData])

  // Player Navigation
  const handleNextEp = () => {
    const nextEp = episode + 1
    if (seasonData && seasonData.episodes && nextEp <= seasonData.episodes.length) {
      setEpisode(nextEp)
    } else {
      showToast('Fim da temporada', 'info')
    }
  }
  
  const handlePrevEp = () => {
    if (episode > 1) setEpisode(episode - 1)
  }
  
  const getEmbedUrl = () => {
    if (!content) return ''
    if (type === 'movie') return `https://superflixapi.cv/filme/${id}`
    return `https://superflixapi.cv/serie/${id}/${season}/${episode}`
  }

  const handleNativeSeasonChange = (e) => {
    const newSeason = parseInt(e.target.value)
    fetchSeason(id, newSeason)
    setEpisode(1)
  }

  // --- RENDER ---
  if (!content) return null // Sem loading text, renderiza nada até ter dados

  const currentEpisodeData = seasonData?.episodes?.find(e => e.episode_number === episode)

  return (
    <>
      <Head>
        <title>{content.title || content.name}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
          html { scroll-behavior: smooth; }
          body {
            font-family: 'Inter', sans-serif;
            background: #050505;
            color: #f5f5f7;
            min-height: 100vh;
            overflow-x: hidden;
            background-image: radial-gradient(circle at 50% 0%, #1a1a1a, #050505 80%);
            background-attachment: fixed;
          }
          button { font-family: inherit; border: none; outline: none; background: none; cursor: pointer; user-select: none; }
          
          /* --- ESTILOS GERAIS --- */
          :root {
            --pill-height: 44px;
            --pill-radius: 50px;
            --ease-elastic: cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          .glass-panel {
            background: rgba(255, 255, 255, 0.06);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          }

          .bar-container {
            position: fixed; left: 50%; transform: translateX(-50%); z-index: 1000;
            display: flex; align-items: center; justify-content: center; gap: 12px; 
            width: 90%; max-width: 520px; transition: all 0.4s ease;
          }
          .top-bar { top: 20px; }
          .bottom-bar { bottom: 20px; }
          .top-bar.scrolled-state { transform: translateX(-50%) translateY(-5px); }

          .round-btn {
            width: var(--pill-height); height: var(--pill-height); border-radius: 50%;
            display: flex; align-items: center; justify-content: center; color: rgba(255, 255, 255, 0.9);
            flex-shrink: 0; transition: transform 0.2s ease;
          }
          .round-btn:active { transform: scale(0.9); }

          .pill-container {
            height: var(--pill-height); flex: 1; border-radius: var(--pill-radius);
            display: flex; align-items: center; justify-content: center;
          }
          .nav-btn { 
            flex: 1; height: 100%; display: flex; align-items: center; justify-content: center; 
            color: rgba(255,255,255,0.4); transition: color 0.3s ease;
          }
          .nav-btn:hover { color: #fff; }
          .bar-label { font-size: 0.9rem; font-weight: 600; color: #fff; }

          /* --- POPUPS GENÉRICOS --- */
          .info-popup, .toast, .synopsis-popup {
            position: fixed;
            top: calc(20px + var(--pill-height) + 16px); 
            left: 50%;
            z-index: 960;
            min-width: 320px; max-width: 90%;
            display: flex; align-items: flex-start; gap: 14px;
            padding: 16px 18px; border-radius: 22px;
            transform-origin: top center;
            animation: popupOpen 0.3s var(--ease-elastic) forwards;
          }
          .info-popup.closing, .toast.closing, .synopsis-popup.closing { 
            animation: popupClose 0.3s ease forwards; 
          }

          @keyframes popupOpen { from { opacity: 0; transform: translateX(-50%) scale(0.8); } to { opacity: 1; transform: translateX(-50%) scale(1); } }
          @keyframes popupClose { from { opacity: 1; transform: translateX(-50%) scale(1); } to { opacity: 0; transform: translateX(-50%) scale(0.8); } }

          .popup-icon-wrapper, .toast-icon-wrapper, .synopsis-icon-wrapper { 
            width: 42px; height: 42px; min-width: 42px; border-radius: 12px; 
            display: flex; align-items: center; justify-content: center; 
          }
          .popup-icon-wrapper { background: linear-gradient(135deg, #34c759, #30d158); }
          .popup-icon-wrapper.tech { background: linear-gradient(135deg, #0a84ff, #007aff); }
          .synopsis-icon-wrapper { background: linear-gradient(135deg, #ff9500, #ff8c00); }
          .popup-icon-wrapper.content-tech { background: linear-gradient(135deg, #5856d6, #5e5ce6); }
          
          .popup-content, .toast-content, .synopsis-popup-content { flex: 1; display: flex; flex-direction: column; gap: 4px; }
          .popup-title { font-size: 0.95rem; font-weight: 600; color: #fff; }
          .popup-text { font-size: 0.8rem; color: rgba(255,255,255,0.7); }
          .synopsis-popup-content { max-height: 50vh; overflow-y: auto; }

          /* --- Toast Colors --- */
          .toast.success .toast-icon-wrapper { background: linear-gradient(135deg, #34c759, #30d158); border-radius: 50%; }
          .toast.error .toast-icon-wrapper { background: linear-gradient(135deg, #ff453a, #ff3b30); border-radius: 50%; }
          .toast.info .toast-icon-wrapper { background: linear-gradient(135deg, #0a84ff, #007aff); border-radius: 50%; }
          .toast-wrap { position: fixed; top: 90px; left: 50%; z-index: 2000; pointer-events: none; }
          
          /* --- PAGE CONTENT --- */
          .container {
            max-width: 1280px; margin: 0 auto;
            padding: 6.5rem 2rem 7rem 2rem;
          }
          .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
          .page-title { font-size: 1.5rem; font-weight: 700; color: #fff; }
          .status-dots { display: flex; gap: 8px; }
          .dot { width: 10px; height: 10px; border-radius: 50%; }
          .dot.red { background: #ff453a; } .dot.yellow { background: #ffd60a; } .dot.green { background: #30d158; }

          .player-banner-container {
            width: 100%; aspect-ratio: 16/9; border-radius: 24px; overflow: hidden; position: relative;
            background-color: #1a1a1a; border: 1px solid rgba(255,255,255,0.1);
            margin-bottom: 24px; cursor: pointer;
          }
          .play-button-static {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 64px; height: 64px; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px);
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            border: 1px solid rgba(255,255,255,0.3);
          }
          
          .details-container { border-radius: 24px; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
          .media-title { font-size: 1.1rem; font-weight: 700; color: #fff; }

          /* --- SELETOR DE TEMPORADA NATIVO --- */
          .native-select-wrapper {
            position: relative; display: inline-block;
          }
          .native-select-btn {
            background: rgba(255,255,255,0.1); padding: 10px 18px; border-radius: 12px;
            font-size: 0.9rem; color: #fff; display: inline-flex; align-items: center; gap: 10px;
            border: 1px solid rgba(255,255,255,0.1); pointer-events: none;
          }
          .hidden-select {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            opacity: 0; cursor: pointer; appearance: none; z-index: 10;
          }

          /* --- CARROSSEL --- */
          .episodes-carousel { 
            display: flex; gap: 10px; overflow-x: auto; 
            padding: 10px 20px; /* Padding extra para zoom não cortar */
            margin: 0 -20px; /* Negativo para alinhar visualmente com o container */
            scrollbar-width: none;
          }
          .episodes-carousel::-webkit-scrollbar { display: none; }
          
          .ep-card {
            min-width: 110px; height: 65px; 
            border-radius: 10px; display: flex; flex-direction: column; justify-content: flex-end;
            padding: 6px 8px; 
            border: 1px solid rgba(255,255,255,0.1); /* Borda simples e fina */
            background-size: cover; background-position: center;
            cursor: pointer; position: relative; overflow: hidden;
            transition: transform 0.2s ease;
          }
          .ep-card:hover { transform: scale(1.05); }
          .ep-card.active { border-color: #0A84FF; box-shadow: 0 0 0 1px #0A84FF; }
          .ep-card::before {
             content: ''; position: absolute; inset: 0;
             background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
          }
          .ep-card-num, .ep-card-title { position: relative; z-index: 1; color: #fff; font-size: 0.7rem; }
          .ep-card-title { font-size: 0.6rem; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

          /* --- PLAYER EMBED OVERLAY --- */
          .player-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: transparent; /* Fundo transparente */
            backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
            z-index: 2000; display: flex; align-items: center; justify-content: center;
            opacity: 0; animation: overlayIn 0.3s ease forwards;
          }
          .player-overlay.closing { animation: overlayOut 0.3s ease forwards; }

          @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes overlayOut { from { opacity: 1; } to { opacity: 0; } }

          /* Wrapper central que contém os botões E o vídeo */
          .player-center-wrapper {
             display: flex; flex-direction: column; align-items: center; gap: 20px;
             position: relative; z-index: 2001;
             width: 100%; pointer-events: none; /* Deixa clicar no blur se precisar */
          }
          .player-center-wrapper > * { pointer-events: auto; }

          .player-frame-container {
             background: #000; border-radius: 20px; overflow: hidden;
             box-shadow: 0 30px 60px rgba(0,0,0,0.8);
             transition: all 0.4s var(--ease-elastic);
          }
          .size-square { width: min(85vw, 45vh); height: min(85vw, 45vh); }
          .size-banner { width: 90vw; max-width: 900px; aspect-ratio: 16/9; height: auto; }
          
          .player-embed { width: 100%; height: 100%; border: none; }

          /* Botões Fora do Player */
          .player-top-row {
             display: flex; justify-content: space-between; width: 90vw; max-width: 900px;
          }
          .player-bottom-row {
             display: flex; justify-content: center; gap: 16px;
          }

          .player-pill {
             background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);
             padding: 8px 16px; border-radius: 30px; color: #fff; font-weight: 600; font-size: 0.9rem;
             display: flex; align-items: center; gap: 8px;
             border: 1px solid rgba(255,255,255,0.1);
          }
          .player-round-btn {
             width: 44px; height: 44px; border-radius: 50%;
             background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);
             display: flex; align-items: center; justify-content: center; color: #fff;
             border: 1px solid rgba(255,255,255,0.1); transition: transform 0.2s;
          }
          .player-round-btn:hover { background: rgba(255,255,255,0.2); transform: scale(1.1); }
          .right-group { display: flex; gap: 10px; }

          @media (max-width: 768px) {
            .container { padding-left: 1rem; padding-right: 1rem; }
            .bar-container { width: 94%; }
            .episodes-carousel { margin: 0 -16px; padding: 10px 16px; }
            .player-top-row { width: 94vw; }
            .size-square { width: 92vw; height: 92vw; }
          }
        `}</style>
      </Head>

      <div className="site-wrapper">
        
        <Header
          label={scrolled ? "Reproduzindo" : "Yoshikawa"}
          scrolled={scrolled}
          showInfo={showInfoPopup}
          toggleInfo={() => openPopup(setShowInfoPopup, setInfoClosing, showInfoPopup)}
          infoClosing={infoClosing}
          showTech={showTechPopup}
          toggleTech={() => openPopup(setShowTechPopup, setTechClosing, showTechPopup)}
          techClosing={techClosing}
        />

        <ToastContainer toast={currentToast} closeToast={manualCloseToast} />

        {/* POPUP DE SINOPSE */}
        {showSynopsisPopup && (
          <div className={`synopsis-popup glass-panel ${synopsisClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="synopsis-icon-wrapper">
              <i className="fas fa-align-left"></i>
            </div>
            <div className="synopsis-popup-content">
              <p className="popup-title">Sinopse</p>
              <p className="synopsis-popup-text">
                {type === 'tv' && currentEpisodeData?.overview 
                  ? currentEpisodeData.overview 
                  : content?.overview || "Sem sinopse."}
              </p>
            </div>
          </div>
        )}

        {/* NOVO POPUP: INFOS TÉCNICAS DO CONTEÚDO */}
        {showContentTech && (
          <div className={`synopsis-popup glass-panel ${contentTechClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="popup-icon-wrapper content-tech">
              <i className="fas fa-film"></i>
            </div>
            <div className="synopsis-popup-content">
              <p className="popup-title">Dados do Conteúdo</p>
              <div className="popup-text" style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                 <span><strong>Título Original:</strong> {content.original_title || content.original_name}</span>
                 <span><strong>Data:</strong> {content.release_date || content.first_air_date}</span>
                 <span><strong>Nota TMDB:</strong> ⭐ {content.vote_average?.toFixed(1)}</span>
                 <span><strong>ID:</strong> {id}</span>
              </div>
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
            onClick={() => openPopup(setShowPlayer, setPlayerClosing, false)}
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
              <i className="fas fa-play" style={{color:'#fff', marginLeft:'4px'}}></i>
            </div>
          </div>

          <div className="glass-panel details-container">
            <h2 className="media-title">{content.title || content.name}</h2>

            {type === 'tv' && (
              <>
                <div style={{display:'flex', alignItems:'center'}}>
                   {/* SELETOR NATIVO DISFARÇADO */}
                   <div className="native-select-wrapper season-selector-ui">
                      <select 
                        className="hidden-select" 
                        value={season} 
                        onChange={handleNativeSeasonChange}
                      >
                         {Array.from({ length: content.number_of_seasons || 1 }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num}>Temporada {num}</option>
                         ))}
                      </select>
                      <div className="native-select-btn">
                         Temporada {season} <i className="fas fa-chevron-down" style={{fontSize:'10px'}}></i>
                      </div>
                   </div>
                </div>

                <div className="episodes-carousel" ref={carouselRef}>
                  {seasonData?.episodes?.map(ep => (
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
                  ))}
                </div>
              </>
            )}
          </div>
        </main>

        <BottomNav 
          isFavorite={isFavorite} 
          onToggleFavorite={toggleFavorite} 
          onToggleSynopsis={() => openPopup(setShowSynopsisPopup, setSynopsisClosing, showSynopsisPopup)}
          onToggleContentInfo={() => openPopup(setShowContentTech, setContentTechClosing, showContentTech)}
        />
      </div>

      {/* PLAYER POPUP OVERLAY */}
      {showPlayer && (
        <div className={`player-overlay ${playerClosing ? 'closing' : ''}`}>
           <div className="player-center-wrapper">
              
              {/* Controles Superiores (Fora do vídeo) */}
              <div className="player-top-row">
                 <div className="player-pill">
                    {type === 'movie' ? 'FILME' : `S${season}:E${episode}`}
                 </div>
                 <div className="right-group">
                    <button className="player-round-btn" onClick={() => setIsWideMode(!isWideMode)}>
                       <i className={isWideMode ? "fas fa-compress" : "fas fa-expand"}></i>
                    </button>
                    <button className="player-round-btn" onClick={() => openPopup(setShowPlayer, setPlayerClosing, true)}>
                       <i className="fas fa-xmark"></i>
                    </button>
                 </div>
              </div>

              {/* Iframe Container */}
              <div className={`player-frame-container ${isWideMode ? 'size-banner' : 'size-square'}`}>
                 <iframe 
                    src={getEmbedUrl()} 
                    className="player-embed" 
                    allowFullScreen 
                    scrolling="no"
                    title="Player"
                 ></iframe>
              </div>

              {/* Controles Inferiores (Apenas Séries) */}
              {type === 'tv' && (
                 <div className="player-bottom-row">
                    <button className="player-pill" onClick={handlePrevEp} disabled={episode === 1} style={{opacity: episode===1 ? 0.5 : 1}}>
                       <i className="fas fa-backward-step"></i> Ant
                    </button>
                    <button className="player-pill" onClick={handleNextEp}>
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
