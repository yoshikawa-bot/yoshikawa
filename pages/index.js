import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
const DEFAULT_BACKDROP = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'

// Componente Header (igual à home)
export const PlayerHeader = ({ title, scrolled, onBack, onInfo }) => {
  return (
    <header className={`bar-container top-bar ${scrolled ? 'scrolled-state' : ''}`}>
      <button 
        className="round-btn glass-panel" 
        onClick={onBack}
        title="Voltar"
      >
        <i className="fas fa-chevron-left" style={{ fontSize: '14px' }}></i>
      </button>

      <div className="pill-container glass-panel">
        <span className="bar-label">{scrolled ? title : 'Yoshikawa'}</span>
      </div>

      <button 
        className="round-btn glass-panel" 
        title="Informações"
        onClick={onInfo}
      >
        <i className="fas fa-circle-info" style={{ fontSize: '14px' }}></i>
      </button>
    </header>
  )
}

// Componente Bottom Nav (igual à home)
export const PlayerBottomNav = ({ 
  activeTab, 
  setActiveTab, 
  onTrailer, 
  onShare,
  isFavorite,
  onToggleFavorite 
}) => {
  return (
    <div className="bar-container bottom-bar">
      <button 
        className="round-btn glass-panel" 
        onClick={onShare}
        title="Compartilhar"
      >
        <i className="fas fa-arrow-up-from-bracket" style={{ fontSize: '15px' }}></i>
      </button>

      <div className="pill-container glass-panel">
        <button 
          className={`nav-btn ${activeTab === 'player' ? 'active' : ''}`}
          onClick={() => setActiveTab('player')}
        >
          <i className="fas fa-play"></i>
        </button>
        <button 
          className={`nav-btn ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          <i className="fas fa-circle-info"></i>
        </button>
        <button 
          className="nav-btn"
          onClick={onTrailer}
        >
          <i className="fab fa-youtube"></i>
        </button>
      </div>

      <button 
        className="round-btn glass-panel" 
        onClick={onToggleFavorite}
        title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      >
        <i 
          className={isFavorite ? 'fas fa-heart' : 'far fa-heart'} 
          style={{ fontSize: '15px', color: isFavorite ? '#ff3b30' : '#fff' }}
        ></i>
      </button>
    </div>
  )
}

// Toast Component (igual à home)
export const Toast = ({ message, type, onClose, closing }) => {
  if (!message) return null
  
  return (
    <div className="toast-wrap">
      <div className={`toast glass-panel ${type} ${closing ? 'closing' : ''}`} onClick={onClose}>
        <div className="toast-icon-wrapper">
          <i className={`fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}`}></i>
        </div>
        <div className="toast-content">
          <div className="toast-title">{type === 'success' ? 'Sucesso' : type === 'error' ? 'Erro' : 'Info'}</div>
          <div className="toast-msg">{message}</div>
        </div>
      </div>
    </div>
  )
}

// Player Popup Component - REDESENHADO
export const PlayerPopup = ({ 
  embedUrl, 
  onClose, 
  isVisible, 
  type, 
  season, 
  episode,
  onPrevEpisode,
  onNextEpisode,
  canGoPrev,
  canGoNext,
  onServerChange,
  currentServer,
  servers
}) => {
  if (!isVisible) return null
  
  return (
    <div className="player-overlay" onClick={onClose}>
      <div className="player-popup" onClick={(e) => e.stopPropagation()}>
        <button className="player-close-btn glass-panel" onClick={onClose}>
          <i className="fas fa-xmark"></i>
        </button>
        
        <div className="player-frame glass-panel">
          <iframe
            key={embedUrl}
            src={embedUrl}
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          ></iframe>
        </div>

        {/* Controles externos ao player */}
        <div className="player-controls">
          {/* Seletor de servidor */}
          <div className="server-selector-external">
            <span className="server-label">Servidor:</span>
            <div className="server-buttons">
              {servers.map((server, index) => (
                <button
                  key={index}
                  className={`server-btn glass-panel ${currentServer === index ? 'active' : ''}`}
                  onClick={() => onServerChange(index)}
                >
                  {server.name}
                </button>
              ))}
            </div>
          </div>

          {/* Navegação de episódios (apenas para séries) */}
          {type === 'tv' && (
            <div className="episode-nav">
              <button 
                className="ep-nav-btn glass-panel" 
                onClick={onPrevEpisode}
                disabled={!canGoPrev}
                title="Episódio anterior"
              >
                <i className="fas fa-chevron-left"></i>
                <span>Anterior</span>
              </button>
              
              <div className="current-episode glass-panel">
                <i className="fas fa-tv"></i>
                <span>T{season} E{episode}</span>
              </div>

              <button 
                className="ep-nav-btn glass-panel" 
                onClick={onNextEpisode}
                disabled={!canGoNext}
                title="Próximo episódio"
              >
                <span>Próximo</span>
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Episode Card Component
export const EpisodeCard = ({ backdrop, onPlay, season, episode, type }) => {
  return (
    <div className="episode-card-wrapper">
      <div className="episode-card glass-panel" onClick={onPlay}>
        <img 
          src={backdrop || DEFAULT_BACKDROP} 
          alt="Episode backdrop"
          className="episode-backdrop"
        />
        <div className="play-overlay">
          <button className="play-btn-large glass-panel">
            <i className="fas fa-play"></i>
          </button>
        </div>
        {type === 'tv' && (
          <div className="episode-info-badge glass-panel">
            <i className="fas fa-tv"></i>
            <span>T{season} E{episode}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PlayerPage() {
  const router = useRouter()
  const { type, id } = router.query

  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [activeTab, setActiveTab] = useState('player')
  const [scrolled, setScrolled] = useState(false)
  const [showPlayer, setShowPlayer] = useState(false)
  const [showSynopsis, setShowSynopsis] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [currentServer, setCurrentServer] = useState(0)
  
  const [toast, setToast] = useState(null)
  const [toastClosing, setToastClosing] = useState(false)
  const toastTimerRef = useRef(null)

  const [watchProgress, setWatchProgress] = useState({})

  // Servidores disponíveis
  const servers = [
    { name: 'Servidor 1', getUrl: (type, id, s, e) => type === 'movie' ? `https://vidsrc.xyz/embed/movie/${id}` : `https://vidsrc.xyz/embed/tv/${id}/${s}/${e}` },
    { name: 'Servidor 2', getUrl: (type, id, s, e) => type === 'movie' ? `https://embed.su/embed/movie/${id}` : `https://embed.su/embed/tv/${id}/${s}/${e}` },
    { name: 'Servidor 3', getUrl: (type, id, s, e) => type === 'movie' ? `https://www.2embed.cc/embed/${id}` : `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}` }
  ]

  // Toast handler
  const showToast = (message, type = 'info') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    
    if (toast) {
      setToastClosing(true)
      setTimeout(() => {
        setToast({ message, type })
        setToastClosing(false)
      }, 400)
    } else {
      setToast({ message, type })
      setToastClosing(false)
    }
    
    toastTimerRef.current = setTimeout(() => {
      setToastClosing(true)
      setTimeout(() => setToast(null), 400)
    }, 2500)
  }

  const closeToast = () => {
    setToastClosing(true)
    setTimeout(() => setToast(null), 400)
  }

  // Scroll handler
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Load TMDB data
  useEffect(() => {
    if (!id || !type) return
    
    const fetchData = async () => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=videos,external_ids`
        )
        const data = await res.json()
        setItem(data)
        setLoading(false)
      } catch (err) {
        console.error(err)
        showToast('Erro ao carregar conteúdo', 'error')
      }
    }
    
    fetchData()
  }, [id, type])

  // Load favorites and watch progress
  useEffect(() => {
    if (!item) return
    
    try {
      const favorites = JSON.parse(localStorage.getItem('yoshikawaFavorites') || '[]')
      setIsFavorite(favorites.some(f => f.id === item.id && f.media_type === type))
      
      const progress = JSON.parse(localStorage.getItem('yoshikawaProgress') || '{}')
      const key = `${type}-${id}`
      if (progress[key]) {
        setWatchProgress(progress[key])
        if (type === 'tv' && progress[key].season && progress[key].episode) {
          setSeason(progress[key].season)
          setEpisode(progress[key].episode)
        }
      }
    } catch (err) {
      console.error('Error loading data:', err)
    }
  }, [item, type, id])

  // Save watch progress
  const saveProgress = (s, e) => {
    try {
      const progress = JSON.parse(localStorage.getItem('yoshikawaProgress') || '{}')
      const key = `${type}-${id}`
      progress[key] = { season: s, episode: e, timestamp: Date.now() }
      localStorage.setItem('yoshikawaProgress', JSON.stringify(progress))
      setWatchProgress(progress[key])
    } catch (err) {
      console.error('Error saving progress:', err)
    }
  }

  // Toggle favorite
  const toggleFavorite = () => {
    try {
      const favorites = JSON.parse(localStorage.getItem('yoshikawaFavorites') || '[]')
      const exists = favorites.some(f => f.id === item.id && f.media_type === type)
      
      let updated
      if (exists) {
        updated = favorites.filter(f => !(f.id === item.id && f.media_type === type))
        showToast('Removido dos favoritos', 'info')
        setIsFavorite(false)
      } else {
        updated = [...favorites, {
          id: item.id,
          media_type: type,
          title: item.title || item.name,
          poster_path: item.poster_path
        }]
        showToast('Adicionado aos favoritos', 'success')
        setIsFavorite(true)
      }
      
      localStorage.setItem('yoshikawaFavorites', JSON.stringify(updated))
    } catch (err) {
      showToast('Erro ao salvar favorito', 'error')
    }
  }

  // Share handler
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title || item.name,
          text: item.overview?.substring(0, 100) + '...',
          url: window.location.href,
        })
      } catch (err) {
        console.log('Share canceled')
      }
    } else {
      showToast('Compartilhar não suportado', 'info')
    }
  }

  // Trailer handler
  const openTrailer = () => {
    const query = encodeURIComponent(`${item.title || item.name} trailer`)
    window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank')
  }

  // Play handler
  const handlePlay = () => {
    setShowPlayer(true)
    if (type === 'tv') {
      saveProgress(season, episode)
    }
  }

  // Get embed URL
  const getEmbedUrl = () => {
    return servers[currentServer].getUrl(type, id, season, episode)
  }

  // Episode navigation
  const handlePrevEpisode = () => {
    if (episode > 1) {
      const newEp = episode - 1
      setEpisode(newEp)
      saveProgress(season, newEp)
      showToast(`T${season} E${newEp}`, 'info')
    }
  }

  const handleNextEpisode = () => {
    const newEp = episode + 1
    setEpisode(newEp)
    saveProgress(season, newEp)
    showToast(`T${season} E${newEp}`, 'info')
  }

  // Continue watching
  const continueWatching = () => {
    if (watchProgress.season && watchProgress.episode) {
      setSeason(watchProgress.season)
      setEpisode(watchProgress.episode)
      showToast(`Continuando T${watchProgress.season} E${watchProgress.episode}`, 'info')
    }
    setShowPlayer(true)
  }

  if (loading || !item) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    )
  }

  const hasProgress = type === 'tv' && watchProgress.season && watchProgress.episode

  return (
    <>
      <Head>
        <title>{item.title || item.name} | Yoshikawa</title>
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
            transition: all 0.4s var(--ease-smooth);
          }

          .top-bar { top: 20px; }
          .bottom-bar { bottom: 20px; }
          
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
            transition: all 0.3s var(--ease-elastic);
            border: none;
            background: none;
            cursor: pointer;
          }
          
          .round-btn:hover {
            transform: scale(1.08);
            background: rgba(255, 255, 255, 0.12);
            border-color: rgba(255, 255, 255, 0.2);
          }
          
          .round-btn:active { transform: scale(0.92); }

          .pill-container {
            height: var(--pill-height);
            flex: 1;
            border-radius: var(--pill-radius);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            transition: all 0.4s var(--ease-elastic);
          }

          .bar-label {
            font-size: 0.9rem;
            font-weight: 600;
            color: #fff;
            white-space: nowrap;
            letter-spacing: -0.01em;
            animation: labelFadeIn 0.4s var(--ease-elastic) forwards;
          }
          
          @keyframes labelFadeIn {
            from { opacity: 0; transform: translateY(12px) scale(0.9); }
            to { opacity: 1; transform: translateY(0) scale(1); }
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
            border: none;
            background: none;
            cursor: pointer;
          }
          
          .nav-btn i {
            font-size: 18px;
            transition: all 0.4s var(--ease-elastic);
            transform-origin: center;
          }
          
          .nav-btn:hover i {
            transform: scale(1.2);
            color: rgba(255,255,255,0.8);
          }

          .nav-btn:active i { transform: scale(0.9); }
          .nav-btn.active { color: #fff; }
          .nav-btn.active i { transform: scale(1.15); }

          /* Toast Styles */
          .toast-wrap {
            position: fixed;
            top: calc(20px + var(--pill-height) + 16px);
            left: 50%;
            z-index: 960;
            pointer-events: none;
          }

          .toast {
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
            pointer-events: auto;
          }

          .toast.closing {
            animation: popupZoomOut 0.4s cubic-bezier(0.55, 0.055, 0.675, 0.19) forwards;
          }

          @keyframes popupZoomIn {
            0% { opacity: 0; transform: translateX(-50%) translateY(-50%) scale(0.3); }
            100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          }

          @keyframes popupZoomOut {
            0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
            100% { opacity: 0; transform: translateX(-50%) translateY(-30%) scale(0.5); }
          }

          .toast-icon-wrapper {
            width: 42px;
            height: 42px;
            min-width: 42px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: iconPop 0.6s var(--ease-elastic) 0.1s backwards;
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

          .toast-icon-wrapper i {
            font-size: 20px;
            color: #fff;
          }

          @keyframes iconPop {
            from { transform: scale(0); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }

          .toast-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 4px;
            opacity: 0;
            animation: contentFade 0.4s ease 0.2s forwards;
          }

          @keyframes contentFade {
            from { opacity: 0; transform: translateX(10px); }
            to { opacity: 1; transform: translateX(0); }
          }

          .toast-title {
            font-size: 0.95rem;
            font-weight: 600;
            color: #fff;
            margin: 0;
            line-height: 1.3;
          }

          .toast-msg {
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.7);
            margin: 0;
            line-height: 1.4;
          }

          /* Player Popup - REDESENHADO */
          .player-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.92);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            animation: overlayFadeIn 0.4s ease forwards;
          }

          @keyframes overlayFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .player-popup {
            width: 100%;
            max-width: 900px;
            position: relative;
            animation: popupSlideUp 0.5s var(--ease-elastic) forwards;
          }

          @keyframes popupSlideUp {
            from { opacity: 0; transform: translateY(50px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .player-close-btn {
            position: absolute;
            top: -50px;
            right: 0;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
            cursor: pointer;
            border: none;
            color: #fff;
            transition: all 0.3s var(--ease-elastic);
          }

          .player-close-btn:hover {
            transform: scale(1.1) rotate(90deg);
            background: rgba(255, 255, 255, 0.15);
          }

          .player-close-btn i {
            font-size: 18px;
          }

          .player-frame {
            width: 100%;
            aspect-ratio: 16/9;
            border-radius: 20px;
            overflow: hidden;
            margin-bottom: 20px;
          }

          .player-frame iframe {
            width: 100%;
            height: 100%;
            border: none;
          }

          /* Controles Externos */
          .player-controls {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .server-selector-external {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.06);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .server-label {
            font-size: 0.875rem;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.7);
            white-space: nowrap;
          }

          .server-buttons {
            display: flex;
            gap: 8px;
            flex: 1;
            flex-wrap: wrap;
          }

          .server-btn {
            flex: 1;
            min-width: 80px;
            padding: 8px 16px;
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.7);
            background: rgba(255, 255, 255, 0.05);
            border: none;
            cursor: pointer;
            transition: all 0.3s var(--ease-elastic);
          }

          .server-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            transform: translateY(-2px);
          }

          .server-btn.active {
            background: var(--ios-blue);
            color: #fff;
          }

          .episode-nav {
            display: flex;
            gap: 12px;
            align-items: center;
          }

          .ep-nav-btn {
            flex: 1;
            padding: 12px 16px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 0.875rem;
            font-weight: 600;
            color: #fff;
            background: rgba(255, 255, 255, 0.06);
            border: none;
            cursor: pointer;
            transition: all 0.3s var(--ease-elastic);
          }

          .ep-nav-btn:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.12);
            transform: translateY(-2px);
          }

          .ep-nav-btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
          }

          .ep-nav-btn i {
            font-size: 12px;
          }

          .current-episode {
            padding: 12px 20px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.875rem;
            font-weight: 600;
            color: #fff;
            background: rgba(255, 255, 255, 0.06);
            white-space: nowrap;
          }

          /* Main Content */
          .player-container {
            max-width: 1280px;
            margin: 0 auto;
            padding: 6.5rem 2rem 7rem;
            animation: fadeIn 0.8s var(--ease-elastic) forwards;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }

          /* Episode Card */
          .episode-card-wrapper {
            width: 100%;
            margin-bottom: 2rem;
          }

          .episode-card {
            width: 100%;
            aspect-ratio: 16/9;
            border-radius: 16px;
            position: relative;
            overflow: hidden;
            cursor: pointer;
            transition: all 0.4s var(--ease-elastic);
            border: 1px solid rgba(255,255,255,0.18);
          }

          .episode-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.6);
            border-color: rgba(255,255,255,0.4);
          }

          .episode-backdrop {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.8s var(--ease-elastic);
          }

          .episode-card:hover .episode-backdrop {
            transform: scale(1.1);
          }

          .play-overlay {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
          }

          .episode-card:hover .play-overlay {
            background: rgba(0, 0, 0, 0.5);
          }

          .play-btn-large {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            cursor: pointer;
            transition: all 0.4s var(--ease-elastic);
            background: rgba(255, 255, 255, 0.1);
          }

          .play-btn-large i {
            font-size: 28px;
            color: #fff;
            margin-left: 4px;
          }

          .episode-card:hover .play-btn-large {
            transform: scale(1.15);
            background: rgba(255, 255, 255, 0.15);
          }

          .episode-info-badge {
            position: absolute;
            top: 16px;
            left: 16px;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          /* Controls */
          .controls-section {
            margin-bottom: 2rem;
          }

          .controls-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 12px;
          }

          .control-select {
            height: 52px;
            border-radius: 16px;
            padding: 0 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 0.9rem;
            font-weight: 500;
            color: #fff;
            cursor: pointer;
            position: relative;
            transition: all 0.3s var(--ease-elastic);
          }

          .control-select:hover {
            transform: translateY(-2px);
            background: rgba(255, 255, 255, 0.1);
          }

          .control-select select {
            position: absolute;
            opacity: 0;
            width: 100%;
            left: 0;
            cursor: pointer;
          }

          .continue-btn {
            width: 100%;
            height: 52px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            font-size: 0.95rem;
            font-weight: 600;
            color: #fff;
            background: var(--ios-blue);
            border: none;
            cursor: pointer;
            transition: all 0.3s var(--ease-elastic);
          }

          .continue-btn:hover {
            transform: translateY(-2px);
            background: #007aff;
          }

          /* Info Section */
          .info-section {
            animation: fadeIn 0.6s ease forwards;
          }

          .info-title {
            font-size: 2rem;
            font-weight: 800;
            margin-bottom: 0.5rem;
            color: #fff;
            letter-spacing: -0.03em;
          }

          .info-meta {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 1.5rem;
            font-size: 0.85rem;
            color: var(--ios-blue);
            flex-wrap: wrap;
          }

          .info-meta span {
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .synopsis-section {
            margin-bottom: 2rem;
          }

          .synopsis-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1rem;
          }

          .synopsis-title {
            font-size: 1.2rem;
            font-weight: 700;
            color: #fff;
          }

          .synopsis-toggle {
            background: none;
            border: none;
            color: var(--ios-blue);
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            padding: 8px 16px;
            border-radius: 20px;
            transition: all 0.3s ease;
          }

          .synopsis-toggle:hover {
            background: rgba(10, 132, 255, 0.1);
          }

          .synopsis-text {
            font-size: 0.95rem;
            line-height: 1.7;
            color: rgba(255, 255, 255, 0.7);
          }

          .synopsis-text.collapsed {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .details-grid {
            display: grid;
            gap: 1.5rem;
          }

          .detail-item {
            padding: 1.5rem;
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            transition: all 0.3s ease;
          }

          .detail-item:hover {
            background: rgba(255, 255, 255, 0.05);
            transform: translateY(-2px);
          }

          .detail-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.5);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.5rem;
          }

          .detail-value {
            font-size: 0.95rem;
            color: #fff;
            line-height: 1.5;
          }

          .spinner {
            width: 30px;
            height: 30px;
            border: 3px solid rgba(255,255,255,0.1);
            border-top-color: var(--ios-blue);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .loading-screen {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          @media (max-width: 768px) {
            .player-container {
              padding: 5.5rem 1rem 7rem;
            }
            
            .info-title {
              font-size: 1.5rem;
            }
            
            .controls-grid {
              grid-template-columns: 1fr;
            }
            
            .bar-container {
              width: 94%;
              gap: 8px;
            }

            .player-popup {
              max-width: 100%;
            }

            .server-selector-external {
              flex-direction: column;
              align-items: stretch;
            }

            .server-buttons {
              flex-direction: column;
            }

            .server-btn {
              min-width: 0;
            }

            .episode-nav {
              flex-direction: column;
            }

            .ep-nav-btn {
              width: 100%;
            }
          }
        `}</style>
      </Head>

      <PlayerHeader
        title={item.title || item.name}
        scrolled={scrolled}
        onBack={() => router.back()}
        onInfo={() => setActiveTab('info')}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
          closing={toastClosing}
        />
      )}

      <PlayerPopup
        embedUrl={getEmbedUrl()}
        onClose={() => setShowPlayer(false)}
        isVisible={showPlayer}
        type={type}
        season={season}
        episode={episode}
        onPrevEpisode={handlePrevEpisode}
        onNextEpisode={handleNextEpisode}
        canGoPrev={episode > 1}
        canGoNext={true}
        onServerChange={setCurrentServer}
        currentServer={currentServer}
        servers={servers}
      />

      <main className="player-container">
        {activeTab === 'player' ? (
          <>
            <EpisodeCard
              backdrop={
                item.backdrop_path
                  ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
                  : DEFAULT_BACKDROP
              }
              onPlay={handlePlay}
              season={season}
              episode={episode}
              type={type}
            />

            {type === 'tv' && (
              <div className="controls-section">
                <div className="controls-grid">
                  <div className="control-select glass-panel">
                    <span>Temporada {season}</span>
                    <select
                      value={season}
                      onChange={(e) => {
                        setSeason(Number(e.target.value))
                        setEpisode(1)
                      }}
                    >
                      {[...Array(item.number_of_seasons || 1)].map((_, i) => (
                        <option key={i} value={i + 1}>
                          Temporada {i + 1}
                        </option>
                      ))}
                    </select>
                    <i className="fas fa-chevron-down" style={{ fontSize: '12px' }}></i>
                  </div>

                  <div className="control-select glass-panel">
                    <span>Episódio {episode}</span>
                    <select
                      value={episode}
                      onChange={(e) => setEpisode(Number(e.target.value))}
                    >
                      {[...Array(50)].map((_, i) => (
                        <option key={i} value={i + 1}>
                          Episódio {i + 1}
                        </option>
                      ))}
                    </select>
                    <i className="fas fa-play-circle" style={{ fontSize: '12px' }}></i>
                  </div>
                </div>

                {hasProgress && (
                  <button className="continue-btn" onClick={continueWatching}>
                    <i className="fas fa-rotate-right"></i>
                    Continuar T{watchProgress.season} E{watchProgress.episode}
                  </button>
                )}
              </div>
            )}

            <div className="info-section">
              <h1 className="info-title">{item.title || item.name}</h1>
              <div className="info-meta">
                <span>
                  {item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0]}
                </span>
                <span>•</span>
                <span>
                  <i className="fas fa-star"></i>
                  {item.vote_average?.toFixed(1)}
                </span>
                {type === 'tv' && (
                  <>
                    <span>•</span>
                    <span>{item.number_of_episodes} Episódios</span>
                  </>
                )}
              </div>

              <div className="synopsis-section">
                <div className="synopsis-header">
                  <h3 className="synopsis-title">Sinopse</h3>
                  <button
                    className="synopsis-toggle"
                    onClick={() => setShowSynopsis(!showSynopsis)}
                  >
                    {showSynopsis ? 'Ver menos' : 'Ver mais'}
                  </button>
                </div>
                <p className={`synopsis-text ${!showSynopsis ? 'collapsed' : ''}`}>
                  {item.overview || 'Nenhuma sinopse disponível em português.'}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="info-section">
            <h1 className="info-title">{item.title || item.name}</h1>
            <div className="info-meta">
              <span>
                {item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0]}
              </span>
              <span>•</span>
              <span>
                <i className="fas fa-star"></i>
                {item.vote_average?.toFixed(1)}
              </span>
            </div>

            <div className="details-grid">
              {item.genres && item.genres.length > 0 && (
                <div className="detail-item glass-panel">
                  <div className="detail-label">Gêneros</div>
                  <div className="detail-value">
                    {item.genres.map((g) => g.name).join(', ')}
                  </div>
                </div>
              )}

              {item.original_language && (
                <div className="detail-item glass-panel">
                  <div className="detail-label">Idioma Original</div>
                  <div className="detail-value">
                    {item.original_language.toUpperCase()}
                  </div>
                </div>
              )}

              {item.production_companies && item.production_companies.length > 0 && (
                <div className="detail-item glass-panel">
                  <div className="detail-label">Produção</div>
                  <div className="detail-value">
                    {item.production_companies.map((c) => c.name).join(', ')}
                  </div>
                </div>
              )}

              {type === 'tv' && item.created_by && item.created_by.length > 0 && (
                <div className="detail-item glass-panel">
                  <div className="detail-label">Criado por</div>
                  <div className="detail-value">
                    {item.created_by.map((c) => c.name).join(', ')}
                  </div>
                </div>
              )}

              {item.status && (
                <div className="detail-item glass-panel">
                  <div className="detail-label">Status</div>
                  <div className="detail-value">{item.status}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <PlayerBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onTrailer={openTrailer}
        onShare={handleShare}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
      />
    </>
  )
}
