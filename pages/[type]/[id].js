import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
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
    if (scrolled) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      toggleInfo()
    }
  }

  return (
    <>
      <header className={`bar-container top-bar ${scrolled ? 'scrolled-state' : ''} ${navHidden ? 'nav-hidden' : ''}`}>
        
        <Link href="/">
          <button 
            className="round-btn glass-panel" 
            title="Voltar ao Início"
          >
            <i className="fas fa-arrow-left" style={{ fontSize: '14px' }}></i>
          </button>
        </Link>

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
          className={`standard-popup glass-panel ${infoClosing ? 'closing' : ''}`} 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="popup-icon-wrapper info">
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
          className={`standard-popup glass-panel ${techClosing ? 'closing' : ''}`} 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="popup-icon-wrapper tech">
            <i className="fas fa-microchip"></i>
          </div>
          <div className="popup-content">
            <p className="popup-title">Informações Técnicas</p>
            <p className="popup-text">v2.8.0 • React 18 • TMDB API • EmbedMovies API</p>
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
      catch (err) { console.log('Share canceled') }
    } else { alert('Compartilhar não suportado') }
  }

  const handleFavClick = () => {
    setAnimating(true)
    onToggleFavorite()
    setTimeout(() => setAnimating(false), 400)
  }

  return (
    <div className={`bar-container bottom-bar ${navHidden ? 'nav-hidden' : ''}`}>
      <button className="round-btn glass-panel" onClick={handleShare} title="Compartilhar">
        <i className="fas fa-arrow-up-from-bracket" style={{ fontSize: '15px', transform: 'translateY(-1px)' }}></i>
      </button>

      <div className={`pill-container glass-panel ${navHidden ? 'hidden-pill' : ''}`}>
         <button className="nav-btn" onClick={onToggleData} title="Dados do Título">
            <i className="fas fa-film"></i>
         </button>

         <button className="nav-btn hide-toggle-pill-btn" onClick={onToggleNav} title={navHidden ? "Mostrar Menu" : "Ocultar Menu"}>
            <i className={navHidden ? "fas fa-chevron-down" : "fas fa-chevron-up"}></i>
         </button>

         <button className="nav-btn" onClick={onToggleSynopsis} title="Sinopse">
            <i className="fas fa-align-left"></i>
         </button>
      </div>

      <button className={`round-btn glass-panel ${navHidden ? 'hidden-fav' : ''}`} onClick={handleFavClick} title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}>
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

const LoadingScreen = ({ visible }) => {
  if (!visible) return null;
  return (
    <div className={`loading-overlay ${!visible ? 'fade-out' : ''}`}>
      <div className="loading-content">
        <div className="floating-cloud">
          <i className="fas fa-cloud"></i>
        </div>
        <div className="loading-bar">
          <div className="loading-progress"></div>
        </div>
      </div>
      <div className="loading-footer">SOFTWARE BY KAWA &lt;3</div>
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
  
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, opacity: 0 })

  const toastTimerRef = useRef(null)

  useEffect(() => {
    if (content) {
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 1000) 
      return () => clearTimeout(timer)
    }
  }, [content])

  const showToast = (message, type = 'info') => {
    if (showInfoPopup || showTechPopup || showSynopsisPopup || showDataPopup) {
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

  useEffect(() => {
    if (!id || !type) return

    const loadContent = async () => {
      try {
        const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=external_ids`)
        const data = await res.json()
        setContent(data)

        if (type === 'tv') {
          await fetchSeason(id, 1)
        }

        checkFavoriteStatus(data)
      } catch (error) {
        console.error("Erro ao carregar", error)
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
    if (showDataPopup && !dataClosing) {
      setDataClosing(true)
      setTimeout(() => { setShowDataPopup(false); setDataClosing(false) }, 400)
    }
    if (currentToast && !currentToast.closing) {
      setCurrentToast(prev => ({ ...prev, closing: true }))
    }
  }, [showInfoPopup, infoClosing, showTechPopup, techClosing, showSynopsisPopup, synopsisClosing, showDataPopup, dataClosing, currentToast])

  const toggleInfoPopup = () => {
    if (showTechPopup || showSynopsisPopup || showDataPopup || currentToast) {
      closeAllPopups()
      setTimeout(() => { if (!showInfoPopup) setShowInfoPopup(true) }, 200)
    } else {
      if (showInfoPopup) {
        setInfoClosing(true)
        setTimeout(() => { setShowInfoPopup(false); setInfoClosing(false) }, 400)
      } else { setShowInfoPopup(true) }
    }
  }

  const toggleTechPopup = () => {
    if (showInfoPopup || showSynopsisPopup || showDataPopup || currentToast) {
      closeAllPopups()
      setTimeout(() => { if (!showTechPopup) setShowTechPopup(true) }, 200)
    } else {
      if (showTechPopup) {
        setTechClosing(true)
        setTimeout(() => { setShowTechPopup(false); setTechClosing(false) }, 400)
      } else { setShowTechPopup(true) }
    }
  }

  const toggleDataPopup = () => {
    if (showInfoPopup || showTechPopup || showSynopsisPopup || currentToast) {
      closeAllPopups()
      setTimeout(() => { if (!showDataPopup) setShowDataPopup(true) }, 200)
    } else {
      if (showDataPopup) {
        setDataClosing(true)
        setTimeout(() => { setShowDataPopup(false); setDataClosing(false) }, 400)
      } else { setShowDataPopup(true) }
    }
  }

  const toggleSynopsisPopup = () => {
    if (showInfoPopup || showTechPopup || showDataPopup || currentToast) {
      closeAllPopups()
      setTimeout(() => { if (!showSynopsisPopup) setShowSynopsisPopup(true) }, 200)
    } else {
      if (showSynopsisPopup) {
        setSynopsisClosing(true)
        setTimeout(() => { setShowSynopsisPopup(false); setSynopsisClosing(false) }, 400)
      } else { setShowSynopsisPopup(true) }
    }
  }

  const toggleNavVisibility = () => {
    if (!navHidden) {
      closeAllPopups()
    }
    setNavHidden(!navHidden)
  }

  useEffect(() => {
    const onScroll = () => { 
      if (window.scrollY > 10) closeAllPopups()
      setScrolled(window.scrollY > 60) 
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    
    const onClick = (e) => { 
      if (!e.target.closest('.standard-popup') && !e.target.closest('.toast') && !e.target.closest('.round-btn') && !e.target.closest('.pill-container') && !e.target.closest('.show-nav-btn')) {
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
        
        const containerRect = carouselRef.current.getBoundingClientRect()
        const cardRect = activeCard.getBoundingClientRect()
        const scrollLeft = carouselRef.current.scrollLeft
        
        const cardCenter = (cardRect.left - containerRect.left) + scrollLeft + (activeCard.offsetWidth / 2)
        
        setIndicatorStyle({
          transform: `translateX(${cardCenter}px)`,
          opacity: 1
        })
      }
    }
  }, [episode, seasonData])

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
      const imdbId = content.external_ids?.imdb_id || content.imdb_id
      if (!imdbId) {
        showToast('ID IMDB não encontrado', 'error')
        return ''
      }
      return `https://playerflixapi.com/filme/${imdbId}`
    }
    
    return `https://playerflixapi.com/serie/${id}/${season}/${episode}`
  }

  const handleNativeSeasonChange = (e) => {
    const newSeason = parseInt(e.target.value)
    fetchSeason(id, newSeason)
    setEpisode(1)
  }

  const releaseDate = content?.release_date || content?.first_air_date || 'Desconhecido'
  const rating = content?.vote_average ? content.vote_average.toFixed(1) : 'N/A'
  const genres = content?.genres ? content.genres.map(g => g.name).join(', ') : 'Gênero desconhecido'
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
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #050505;
            color: #f5f5f7;
            line-height: 1.6;
            font-size: 16px;
            min-height: 100vh;
            overflow-y: auto;
            overflow-x: hidden;
          }

          .site-wrapper {
            width: 100%;
            min-height: 100vh;
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            position: relative;
            transition: background-image 0.6s ease-out;
          }

          .site-wrapper::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(5, 5, 5, 0.4);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            pointer-events: none;
            z-index: 0;
          }

          .site-wrapper > * {
            position: relative;
            z-index: 1;
          }

          .loading-overlay {
            position: fixed; 
            top: 0; 
            left: 0; 
            width: 100%; 
            height: 100%;
            z-index: 9999;
            display: flex; 
            flex-direction: column;
            align-items: center; 
            justify-content: center;
            background: #050505;
            transition: opacity 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94), visibility 0.8s ease;
          }
          
          .loading-overlay.fade-out {
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
          }

          .loading-content {
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            gap: 24px;
            margin-bottom: 20px;
          }

          .loading-footer {
            position: absolute;
            bottom: 40px;
            font-size: 10px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.3);
            letter-spacing: 2px;
            text-transform: uppercase;
          }

          .floating-cloud {
            position: relative;
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: cloudFloat 3s ease-in-out infinite;
          }

          .floating-cloud i {
            font-size: 48px;
            color: rgba(255, 255, 255, 0.9);
            filter: drop-shadow(0 4px 12px rgba(255, 255, 255, 0.2));
          }

          @keyframes cloudFloat {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-15px);
            }
          }

          .loading-bar {
            width: 180px;
            height: 2.5px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 2px;
            overflow: hidden;
            position: relative;
          }

          .loading-progress {
            height: 100%;
            background: #ffffff;
            animation: loadingBar 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            width: 0%;
          }

          @keyframes loadingBar {
            0% { width: 0%; }
            20% { width: 15%; }
            40% { width: 35%; }
            60% { width: 65%; }
            80% { width: 85%; }
            100% { width: 100%; }
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
            --ease-fluid: cubic-bezier(0.4, 0.0, 0.2, 1);
          }

          .glass-panel {
            position: relative;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: inherit;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            overflow: hidden;
            transition: transform 0.3s var(--ease-elastic), background 0.3s ease, border-color 0.3s ease;
          }

          .glass-panel-light {
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
          }

          .bar-container {
            position: fixed; 
            left: 50%; 
            transform: translateX(-50%); 
            z-index: 1000;
            display: flex; 
            align-items: center; 
            justify-content: center; 
            gap: 12px; 
            width: 90%; 
            max-width: var(--pill-max-width);
            transition: all 0.6s var(--ease-smooth);
          }

          .top-bar { 
            top: 20px;
            opacity: 1;
            visibility: visible;
            transition: all 0.6s var(--ease-smooth);
          }

          .bottom-bar { 
            bottom: 20px;
            opacity: 1;
            visibility: visible;
            transition: all 0.6s var(--ease-smooth);
          }

          .top-bar.nav-hidden {
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transform: translateX(-50%) translateY(-100px);
            transition: all 0.6s var(--ease-smooth);
          }

          .bottom-bar.nav-hidden {
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transform: translateX(-50%) translateY(100px);
            transition: all 0.6s var(--ease-smooth);
          }

          .show-nav-btn {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            z-index: 999;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(255, 255, 255, 0.9);
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transition: all 0.6s var(--ease-smooth);
          }

          .show-nav-btn.visible {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
            transform: translateX(-50%) translateY(0);
            transition-delay: 0.3s;
          }

          .show-nav-btn:hover {
            transform: translateX(-50%) scale(1.1);
            background: rgba(0, 0, 0, 0.6);
            border-color: rgba(255, 255, 255, 0.3);
          }

          .show-nav-btn:active {
            transform: translateX(-50%) scale(0.95);
          }

          .top-bar.scrolled-state { 
            transform: translateX(-50%) translateY(-5px); 
          }

          .round-btn {
            width: var(--pill-height); 
            height: var(--pill-height); 
            border-radius: 50%;
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: rgba(255, 255, 255, 0.9);
            flex-shrink: 0; 
            transition: all 0.5s var(--ease-smooth);
          }

          .round-btn:hover { 
            transform: scale(1.08); 
            background: rgba(0, 0, 0, 0.6); 
            border-color: rgba(255, 255, 255, 0.2); 
          }

          .round-btn:active { 
            transform: scale(0.92); 
          }

          .pill-container {
            height: var(--pill-height); 
            flex: 1; 
            border-radius: var(--pill-radius);
            display: flex; 
            align-items: center; 
            justify-content: center; 
            position: relative;
            transition: all 0.6s var(--ease-fluid);
          }

          .nav-btn { 
            flex: 1; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            height: 100%; 
            color: rgba(255,255,255,0.4); 
            transition: all 0.3s ease;
            position: relative; 
            z-index: 5;
          }

          .hide-toggle-pill-btn {
            color: rgba(255, 255, 255, 0.6);
            transition: all 0.6s var(--ease-smooth);
          }

          .hide-toggle-pill-btn i {
            font-size: 18px;
            transition: all 0.3s var(--ease-smooth);
          }

          .hide-toggle-pill-btn:hover i {
            transform: scale(1.2);
            color: rgba(255, 255, 255, 0.9);
          }

          .nav-btn i { 
            font-size: 18px; 
            transition: all 0.4s var(--ease-elastic); 
          }

          .nav-btn:hover i { 
            transform: scale(1.2); 
            color: rgba(255,255,255,0.8); 
          }

          .nav-btn:active i { 
            transform: scale(0.9); 
          }

          .bar-label { 
            font-size: 0.9rem; 
            font-weight: 600; 
            color: #fff; 
            white-space: nowrap;
            letter-spacing: -0.01em;
            position: relative; 
            z-index: 5;
          }

          .heart-pulse { animation: heartZoom 0.5s var(--ease-elastic); }

          @keyframes heartZoom { 
            0% { transform: scale(1); } 
            50% { transform: scale(1.6); } 
            100% { transform: scale(1); } 
          }

          .standard-popup, .toast {
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
          
          .standard-popup { 
            z-index: 950; 
            pointer-events: none; 
          }

          .toast { 
            z-index: 960; 
            pointer-events: auto; 
          }

          .standard-popup.closing, .toast.closing { 
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
          
          .popup-icon-wrapper, .toast-icon-wrapper { 
            width: 42px; 
            height: 42px; 
            min-width: 42px; 
            border-radius: 12px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            animation: iconPop 0.6s var(--ease-elastic) 0.1s backwards; 
          }
          
          .popup-icon-wrapper.info { 
            background: linear-gradient(135deg, #34c759 0%, #30d158 100%); 
            box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3); 
          }

          .popup-icon-wrapper.tech { 
            background: linear-gradient(135deg, #0a84ff 0%, #007aff 100%); 
            box-shadow: 0 4px 12px rgba(10, 132, 255, 0.3); 
          }

          .popup-icon-wrapper.synopsis { 
            background: linear-gradient(135deg, #ff9500 0%, #ff8c00 100%); 
            box-shadow: 0 4px 12px rgba(255, 149, 0, 0.3); 
          }

          .popup-icon-wrapper.data { 
            background: linear-gradient(135deg, #bf5af2 0%, #a448e0 100%); 
            box-shadow: 0 4px 12px rgba(191, 90, 242, 0.3); 
          }

          .toast-icon-wrapper { 
            border-radius: 50%; 
          }

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

          .popup-icon-wrapper i, .toast-icon-wrapper i { 
            font-size: 20px; 
            color: #fff; 
          }

          .popup-content, .toast-content { 
            flex: 1; 
            display: flex; 
            flex-direction: column; 
            gap: 4px; 
            max-height: 60vh; 
            overflow-y: auto;
            opacity: 0; 
            animation: contentFade 0.4s ease 0.2s forwards; 
          }

          @keyframes contentFade { 
            from { opacity: 0; transform: translateX(10px); } 
            to { opacity: 1; transform: translateX(0); } 
          }
          
          .popup-title, .toast-title { 
            font-size: 0.95rem; 
            font-weight: 600; 
            color: #fff; 
            margin: 0; 
            line-height: 1.3; 
          }

          .popup-text, .toast-msg { 
            font-size: 0.8rem; 
            color: rgba(255, 255, 255, 0.7); 
            margin: 0; 
            line-height: 1.4; 
          }

          @keyframes iconPop { 
            from { transform: scale(0); opacity: 0; } 
            to { transform: scale(1); opacity: 1; } 
          }

          .toast-wrap { 
            position: fixed; 
            top: calc(20px + var(--pill-height) + 16px); 
            left: 50%; 
            z-index: 960; 
            pointer-events: none; 
          }

          .container {
            max-width: 1280px; 
            margin: 0 auto;
            padding-top: 6.5rem; 
            padding-bottom: 7rem;
            padding-left: 2rem; 
            padding-right: 2rem;
          }

          .player-banner-container {
            width: 100%; 
            aspect-ratio: 16/9; 
            border-radius: 24px; 
            overflow: hidden; 
            position: relative;
            background-color: #1a1a1a; 
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 30px 60px -10px rgba(0, 0, 0, 0.6);
            margin-bottom: 24px; 
            cursor: pointer;
          }

          .player-banner-container::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 100px;
            background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, transparent 100%);
            pointer-events: none;
            z-index: 1;
          }

          .banner-image { 
            width: 100%; 
            height: 100%; 
            object-fit: cover; 
            transition: transform 0.8s var(--ease-elastic); 
          }

          .player-banner-container:hover .banner-image { 
            transform: scale(1.05); 
          }

          .play-button-static {
            position: absolute; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%);
            width: 64px; 
            height: 64px; 
            background: rgba(0,0,0,0.5); 
            backdrop-filter: blur(8px);
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            border: 1px solid rgba(255,255,255,0.3);
            z-index: 2;
          }

          .play-button-static i { 
            color: #fff; 
            font-size: 24px; 
            margin-left: 4px; 
          }

          .details-container {
            border-radius: 24px; 
            padding: 18px; 
            display: flex; 
            flex-direction: column; 
            gap: 16px;
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: none;
            background: rgba(0, 0, 0, 0.4);
          }

          .media-title { 
            font-size: 1.15rem; 
            font-weight: 700; 
            color: #fff; 
            line-height: 1.2; 
          }

          .season-controls { 
            display: flex; 
            align-items: center; 
            margin-top: 8px; 
          }

          .native-season-select {
            appearance: none; 
            -webkit-appearance: none;
            background: rgba(0,0,0,0.4) url('data:image/svg+xml;utf8,<svg fill="white" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>') no-repeat right 8px center;
            padding: 4px 28px 4px 10px; 
            border-radius: 12px;
            font-size: 0.8rem; 
            color: #fff; 
            border: 1px solid rgba(255,255,255,0.1);
            cursor: pointer; 
            font-family: inherit; 
            outline: none; 
            transition: background 0.2s;
            backdrop-filter: blur(10px);
          }

          .native-season-select:hover { 
            background-color: rgba(0,0,0,0.6); 
          }

          .native-season-select option { 
            background: #1a1a1a; 
            color: #fff; 
          }

          .episodes-carousel { 
            display: flex; 
            gap: 10px; 
            overflow-x: auto; 
            padding: 10px 14px 25px 14px; 
            scrollbar-width: none; 
            margin: 0 -14px;
            position: relative;
          }

          .episodes-carousel::-webkit-scrollbar { 
            display: none; 
          }
          
          .ep-card {
            min-width: 110px; 
            height: 65px; 
            background-size: cover; 
            background-position: center;
            border-radius: 10px; 
            padding: 0; 
            border: 1px solid rgba(255,255,255,0.15);
            cursor: pointer; 
            transition: all 0.2s ease; 
            position: relative; 
            overflow: hidden; 
            box-shadow: none;
            background-color: #1a1a1a;
          }
          
          .ep-card-info {
             position: relative; 
             z-index: 2;
             width: 100%; 
             height: 100%;
             padding: 6px 8px;
             display: flex; 
             align-items: flex-start; 
             justify-content: flex-start;
          }

          .ep-card:hover { 
            border-color: rgba(255,255,255,0.4); 
            transform: scale(1.05); 
          }
          
          .ep-card.active { 
            border: 1px solid rgba(255,255,255,0.4);
          }
          
          .ep-card-num { 
            font-size: 0.8rem; 
            font-weight: 700; 
            color: #fff; 
            background: rgba(0,0,0,0.4);
            backdrop-filter: blur(4px);
            padding: 2px 6px;
            border-radius: 4px;
          }

          .indicator-arrow {
            position: absolute;
            bottom: 5px;
            left: 0;
            width: 16px;
            height: 16px;
            pointer-events: none;
            z-index: 10;
            transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
          }

          .indicator-arrow::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 0; 
            height: 0; 
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-bottom: 8px solid #fff;
          }

          .no-image-placeholder {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #111;
            color: rgba(255,255,255,0.2);
            font-size: 20px;
          }

          .player-overlay {
            position: fixed; 
            top: 0; 
            left: 0; 
            right: 0; 
            bottom: 0;
            backdrop-filter: blur(20px); 
            -webkit-backdrop-filter: blur(20px);
            z-index: 2000; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            animation: overlayFadeIn 0.4s var(--ease-smooth);
          }

          @keyframes overlayFadeIn {
            from {
              opacity: 0;
              backdrop-filter: blur(0px);
            }
            to {
              opacity: 1;
              backdrop-filter: blur(20px);
            }
          }

          .player-wrapper-vertical {
            display: flex; 
            flex-direction: column; 
            align-items: center;
            position: relative;
            width: auto;
            animation: playerSlideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          @keyframes playerSlideUp {
            from {
              opacity: 0;
              transform: translateY(60px) scale(0.9);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          .player-popup-container {
            position: relative; 
            background: #000; 
            border-radius: 20px; 
            overflow: hidden;
            box-shadow: 0 0 60px rgba(0,0,0,0.9), 0 20px 60px rgba(10, 132, 255, 0.15);
            border: 1.5px solid rgba(255, 255, 255, 0.2);
            transition: all 0.4s var(--ease-elastic); 
            display: flex; 
            align-items: center; 
            justify-content: center;
            animation: playerContainerPop 0.6s var(--ease-elastic) 0.1s backwards;
          }

          @keyframes playerContainerPop {
            from {
              opacity: 0;
              transform: scale(0.8);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          .popup-size-square { 
            width: min(70vw, 40vh); 
            height: min(70vw, 40vh); 
            aspect-ratio: 1/1; 
          }

          .popup-size-banner { 
            width: 80vw; 
            max-width: 900px; 
            aspect-ratio: 16/9; 
          }

          .player-embed { 
            width: 100%; 
            height: 100%; 
            border: none;
            animation: embedFadeIn 0.5s ease 0.2s backwards;
          }

          @keyframes embedFadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          
          .player-header-controls {
            width: 100%; 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            margin-bottom: 20px; 
            animation: controlsFadeIn 0.5s ease 0.15s backwards;
          }

          @keyframes controlsFadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .ep-indicator { 
            font-size: 1rem; 
            font-weight: 700; 
            color: #fff; 
            text-shadow: 0 2px 10px rgba(0,0,0,0.8);
            background: rgba(0,0,0,0.4); 
            padding: 10px 20px; 
            border-radius: 12px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            transition: all 0.3s var(--ease-smooth);
          }

          .ep-indicator:hover {
            background: rgba(0, 0, 0, 0.5);
            border-color: rgba(255, 255, 255, 0.25);
            transform: scale(1.05);
          }

          .right-controls { 
            display: flex; 
            gap: 12px; 
          }

          .control-btn {
            width: 48px; 
            height: 48px; 
            background: rgba(0, 0, 0, 0.4); 
            backdrop-filter: blur(10px);
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: rgba(255, 255, 255, 0.9); 
            transition: all 0.3s var(--ease-smooth); 
            border: 1px solid rgba(255, 255, 255, 0.15);
            cursor: pointer;
            position: relative;
            overflow: hidden;
          }

          .control-btn:hover { 
            background: rgba(0, 0, 0, 0.6); 
            transform: scale(1.1);
            border-color: rgba(255, 255, 255, 0.3);
          }

          .control-btn:active {
            transform: scale(0.95);
          }

          .control-btn i {
            font-size: 18px;
            transition: all 0.3s var(--ease-smooth);
          }

          .control-btn:hover i {
            transform: scale(1.15);
          }
          
          .player-bottom-controls {
            display: flex; 
            justify-content: center; 
            gap: 20px;
            margin-top: 20px;
            animation: controlsFadeIn 0.5s ease 0.25s backwards;
          }

          .nav-ep-btn {
            background: rgba(0, 0, 0, 0.4); 
            padding: 12px 32px; 
            border-radius: 50px;
            color: rgba(255, 255, 255, 0.9); 
            font-weight: 600; 
            font-size: 0.95rem;
            display: flex; 
            align-items: center; 
            gap: 10px;
            transition: all 0.3s var(--ease-smooth); 
            backdrop-filter: blur(10px); 
            border: 1px solid rgba(255, 255, 255, 0.15);
            cursor: pointer;
            position: relative;
            overflow: hidden;
          }

          .nav-ep-btn:hover { 
            background: rgba(0, 0, 0, 0.6); 
            transform: scale(1.08);
            border-color: rgba(255, 255, 255, 0.3);
          }

          .nav-ep-btn:active { 
            transform: scale(0.95); 
          }

          .nav-ep-btn i {
            transition: all 0.3s var(--ease-smooth);
          }

          .nav-ep-btn:hover i {
            transform: scale(1.2);
          }

          .nav-ep-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }

          .nav-ep-btn:disabled:hover {
            transform: scale(1);
            background: rgba(0, 0, 0, 0.4);
            border-color: rgba(255, 255, 255, 0.15);
          }

          @media (max-width: 768px) {
            .container { padding-left: 1rem; padding-right: 1rem; }
            .bar-container { width: 94%; }
            .player-banner-container { border-radius: 16px; }
            .details-container { padding: 14px; }
            .media-title { font-size: 1rem; }
            .popup-size-square { width: 85vw; height: 85vw; }
            .popup-size-banner { width: 90vw; }
            .standard-popup, .toast { min-width: 280px; padding: 14px 16px; }
            .popup-icon-wrapper, .toast-icon-wrapper { width: 38px; height: 38px; min-width: 38px; }
            .popup-icon-wrapper i, .toast-icon-wrapper i { font-size: 18px; }
            .popup-title, .toast-title { font-size: 0.88rem; }
            .popup-text, .toast-msg { font-size: 0.75rem; }
            
            .ep-indicator { font-size: 0.85rem; padding: 6px 12px; }
            .control-btn { width: 38px; height: 38px; }
            .nav-ep-btn { padding: 8px 18px; font-size: 0.9rem; }
          }
        `}</style>
      </Head>

      <LoadingScreen visible={isLoading} />

      {content && (
        <div 
          className="site-wrapper"
          style={{
            backgroundImage: content?.backdrop_path 
              ? `url(https://image.tmdb.org/t/p/original${content.backdrop_path})`
              : `url(${DEFAULT_BACKDROP})`,
          }}
        >
          <Header
            label={scrolled ? "Reproduzindo" : "Yoshikawa"}
            scrolled={scrolled}
            showInfo={showInfoPopup}
            toggleInfo={toggleInfoPopup}
            infoClosing={infoClosing}
            showTech={showTechPopup}
            toggleTech={toggleTechPopup}
            techClosing={techClosing}
            navHidden={navHidden}
          />

          <ToastContainer toast={currentToast} closeToast={manualCloseToast} />

          {showSynopsisPopup && (
            <div 
              className={`standard-popup glass-panel ${synopsisClosing ? 'closing' : ''}`} 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="popup-icon-wrapper synopsis">
                <i className="fas fa-align-left"></i>
              </div>
              <div className="popup-content">
                <p className="popup-title">Sinopse</p>
                <p className="popup-text">
                  {type === 'tv' && currentEpisodeData?.overview 
                    ? currentEpisodeData.overview 
                    : content?.overview || "Sinopse indisponível."}
                </p>
              </div>
            </div>
          )}

          {showDataPopup && (
            <div 
              className={`standard-popup glass-panel ${dataClosing ? 'closing' : ''}`} 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="popup-icon-wrapper data">
                <i className="fas fa-film"></i>
              </div>
              <div className="popup-content">
                <p className="popup-title">Ficha Técnica</p>
                <div className="popup-text">
                  <strong>Lançamento:</strong> {releaseDate.split('-').reverse().join('/')}<br/>
                  <strong>Avaliação:</strong> {rating} ⭐<br/>
                  <strong>Gêneros:</strong> {genres}
                </div>
              </div>
            </div>
          )}

          <main className="container">

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
                    <select 
                      className="native-season-select"
                      value={season}
                      onChange={handleNativeSeasonChange}
                    >
                       {Array.from({ length: content?.number_of_seasons || 1 }, (_, i) => i + 1).map(num => (
                          <option key={num} value={num}>Temporada {num}</option>
                       ))}
                    </select>
                  </div>

                  <div className="episodes-carousel" ref={carouselRef}>
                    <div className="indicator-arrow" style={indicatorStyle}></div>

                    {seasonData && seasonData.episodes ? seasonData.episodes.map(ep => (
                      <div 
                        key={ep.id} 
                        className={`ep-card ${ep.episode_number === episode ? 'active' : ''}`}
                        onClick={() => setEpisode(ep.episode_number)}
                        style={{
                          backgroundImage: ep.still_path 
                            ? `url(https://image.tmdb.org/t/p/w300${ep.still_path})`
                            : 'none'
                        }}
                      >
                        {!ep.still_path && (
                          <div className="no-image-placeholder">
                             <i className="fas fa-image"></i>
                          </div>
                        )}
                        <div className="ep-card-info">
                          <span className="ep-card-num">Ep {ep.episode_number}</span>
                        </div>
                      </div>
                    )) : (
                      <div style={{color:'#666', fontSize:'0.8rem', paddingLeft: '8px'}}>Carregando...</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </main>

          <BottomNav 
            isFavorite={isFavorite} 
            onToggleFavorite={toggleFavorite} 
            onToggleSynopsis={toggleSynopsisPopup} 
            onToggleData={toggleDataPopup}
            onToggleNav={toggleNavVisibility}
            navHidden={navHidden}
          />

          <button 
            className={`show-nav-btn glass-panel ${navHidden ? 'visible' : ''}`}
            onClick={toggleNavVisibility}
            title="Mostrar Navegação"
          >
            <i className="fas fa-bars"></i>
          </button>
        </div>
      )}

      {isPlaying && (
        <div className="player-overlay">
          <div className="player-wrapper-vertical">
            
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

            <div className={`player-popup-container ${isWideMode ? 'popup-size-banner' : 'popup-size-square'}`}>
              <iframe 
                src={getEmbedUrl()} 
                className="player-embed" 
                frameBorder="0"
                allowFullScreen 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="origin"
                title="Player"
              ></iframe>
            </div>

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
