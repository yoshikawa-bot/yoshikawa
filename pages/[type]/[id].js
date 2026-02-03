import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
const DEFAULT_BACKDROP = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'

// APIs de embed disponíveis (com suporte a português/legendas PT-BR)
const EMBED_PROVIDERS = [
  {
    id: 'vidsrc',
    name: 'VidSrc',
    getUrl: (type, tmdbId, season, episode) => {
      if (type === 'movie') {
        return `https://vidsrc.xyz/embed/movie/${tmdbId}`
      }
      return `https://vidsrc.xyz/embed/tv/${tmdbId}/${season}/${episode}`
    }
  },
  {
    id: 'embedsu',
    name: 'EmbedSu',
    getUrl: (type, tmdbId, season, episode) => {
      if (type === 'movie') {
        return `https://embed.su/embed/movie/${tmdbId}`
      }
      return `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`
    }
  },
  {
    id: '2embed',
    name: '2Embed',
    getUrl: (type, tmdbId, season, episode) => {
      if (type === 'movie') {
        return `https://www.2embed.cc/embed/${tmdbId}`
      }
      return `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`
    }
  }
]

// Componente Header
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

// Componente Bottom Nav
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

// Toast Component
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

// Player Popup Component com seletor de servidor
export const PlayerPopup = ({ type, tmdbId, season, episode, onClose, isVisible }) => {
  const [currentProvider, setCurrentProvider] = useState(0)
  
  if (!isVisible) return null
  
  const embedUrl = EMBED_PROVIDERS[currentProvider].getUrl(type, tmdbId, season, episode)
  
  return (
    <div className="player-popup-overlay" onClick={onClose}>
      <div className="player-popup-card glass-panel" onClick={(e) => e.stopPropagation()}>
        <button className="popup-close-btn glass-panel" onClick={onClose}>
          <i className="fas fa-xmark"></i>
        </button>
        
        {/* Seletor de Servidor */}
        <div className="server-selector glass-panel">
          <span className="server-label">Servidor:</span>
          <div className="server-buttons">
            {EMBED_PROVIDERS.map((provider, index) => (
              <button
                key={provider.id}
                className={`server-btn ${currentProvider === index ? 'active' : ''}`}
                onClick={() => setCurrentProvider(index)}
              >
                {provider.name}
              </button>
            ))}
          </div>
        </div>

        <div className="popup-player-wrapper">
          <iframe
            key={embedUrl}
            src={embedUrl}
            allowFullScreen
            scrolling="no"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          ></iframe>
        </div>
      </div>
    </div>
  )
}

// Episode Card Component
export const EpisodeCard = ({ backdrop, onPlay, season, episode, type, title }) => {
  return (
    <div className="episode-card-wrapper">
      <div className="episode-card glass-panel" onClick={onPlay}>
        <div className="backdrop-container">
          <img 
            src={backdrop || DEFAULT_BACKDROP} 
            alt="Episode backdrop"
            className="episode-backdrop"
          />
          <div className="backdrop-gradient"></div>
        </div>
        <div className="play-overlay">
          <button className="play-btn-large glass-panel">
            <div className="play-icon-wrapper">
              <i className="fas fa-play"></i>
            </div>
          </button>
          <div className="play-label">Assistir Agora</div>
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
  
  const [toast, setToast] = useState(null)
  const [toastClosing, setToastClosing] = useState(false)
  const toastTimerRef = useRef(null)

  const [watchProgress, setWatchProgress] = useState({})

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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style>{`
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
            -webkit-tap-highlight-color: transparent; 
          }
          
          html { 
            scroll-behavior: smooth;
            overflow-x: hidden;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #000;
            color: #f5f5f7;
            line-height: 1.6;
            font-size: 16px;
            min-height: 100vh;
            overflow-y: auto;
            overflow-x: hidden;
            background: linear-gradient(180deg, #0a0a0a 0%, #000 100%);
            position: relative;
          }

          body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 20% 20%, rgba(10, 132, 255, 0.08) 0%, transparent 50%),
                        radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.08) 0%, transparent 50%);
            pointer-events: none;
            z-index: 0;
          }
          
          :root {
            --pill-height: 44px;
            --pill-radius: 50px;
            --pill-max-width: 520px;
            --ios-blue: #0A84FF;
            --purple: #9333EA;
            --ease-elastic: cubic-bezier(0.34, 1.56, 0.64, 1);
            --ease-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94);
            --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
          }

          .glass-panel {
            position: relative;
            background: rgba(255, 255, 255, 0.06);
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: inherit;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            overflow: hidden;
            transition: all 0.4s var(--ease-out);
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

          /* Player Popup Styles */
          .player-popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.95);
            backdrop-filter: blur(30px);
            -webkit-backdrop-filter: blur(30px);
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

          .player-popup-card {
            width: 100%;
            max-width: 1200px;
            aspect-ratio: 16/9;
            border-radius: 28px;
            position: relative;
            animation: cardZoomIn 0.5s var(--ease-elastic) forwards;
            box-shadow: 0 40px 100px rgba(0, 0, 0, 0.9);
          }

          @keyframes cardZoomIn {
            from { opacity: 0; transform: scale(0.85); }
            to { opacity: 1; transform: scale(1); }
          }

          .popup-close-btn {
            position: absolute;
            top: -15px;
            right: -15px;
            width: 48px;
            height: 48px;
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

          .popup-close-btn:hover {
            transform: scale(1.1) rotate(90deg);
            background: rgba(255, 255, 255, 0.15);
          }

          .popup-close-btn:active {
            transform: scale(0.9) rotate(90deg);
          }

          .popup-close-btn i {
            font-size: 20px;
          }

          /* Server Selector */
          .server-selector {
            position: absolute;
            top: 12px;
            left: 12px;
            right: 60px;
            z-index: 10;
            padding: 12px 16px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            gap: 12px;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.15);
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
            flex-wrap: wrap;
          }

          .server-btn {
            padding: 6px 14px;
            border-radius: 14px;
            font-size: 0.8rem;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.7);
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.1);
            cursor: pointer;
            transition: all 0.3s var(--ease-out);
          }

          .server-btn:hover {
            background: rgba(255, 255, 255, 0.12);
            color: #fff;
            transform: translateY(-2px);
          }

          .server-btn.active {
            background: var(--ios-blue);
            border-color: var(--ios-blue);
            color: #fff;
            box-shadow: 0 4px 12px rgba(10, 132, 255, 0.4);
          }

          .popup-player-wrapper {
            width: 100%;
            height: 100%;
            border-radius: 28px;
            overflow: hidden;
          }

          .popup-player-wrapper iframe {
            width: 100%;
            height: 100%;
            border: none;
          }

          /* Main Content */
          .player-container {
            max-width: 1280px;
            margin: 0 auto;
            padding: 7rem 2rem 8rem;
            animation: fadeIn 0.8s var(--ease-out) forwards;
            position: relative;
            z-index: 1;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(40px); }
            to { opacity: 1; transform: translateY(0); }
          }

          /* Episode Card */
          .episode-card-wrapper {
            width: 100%;
            margin-bottom: 3rem;
          }

          .episode-card {
            width: 100%;
            aspect-ratio: 16/9;
            border-radius: 28px;
            position: relative;
            overflow: hidden;
            cursor: pointer;
            transition: all 0.5s var(--ease-out);
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
          }

          .episode-card:hover {
            transform: translateY(-12px) scale(1.02);
            box-shadow: 0 40px 80px rgba(0, 0, 0, 0.7);
          }

          .backdrop-container {
            position: absolute;
            inset: 0;
            overflow: hidden;
          }

          .episode-backdrop {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 1s var(--ease-out);
          }

          .episode-card:hover .episode-backdrop {
            transform: scale(1.15);
          }

          .backdrop-gradient {
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, 
              rgba(0,0,0,0) 0%, 
              rgba(0,0,0,0.3) 50%, 
              rgba(0,0,0,0.8) 100%
            );
            transition: opacity 0.4s ease;
          }

          .episode-card:hover .backdrop-gradient {
            opacity: 0.9;
          }

          .play-overlay {
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            background: rgba(0, 0, 0, 0.2);
            transition: all 0.4s ease;
          }

          .episode-card:hover .play-overlay {
            background: rgba(0, 0, 0, 0.4);
          }

          .play-btn-large {
            width: 90px;
            height: 90px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            cursor: pointer;
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(20px);
            border: 2px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            transition: all 0.5s var(--ease-out);
            position: relative;
          }

          .play-btn-large::before {
            content: '';
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--ios-blue), var(--purple));
            opacity: 0;
            transition: opacity 0.4s ease;
            z-index: -1;
          }

          .episode-card:hover .play-btn-large::before {
            opacity: 1;
          }

          .episode-card:hover .play-btn-large {
            transform: scale(1.15);
            background: rgba(255, 255, 255, 0.12);
            border-color: rgba(255, 255, 255, 0.3);
          }

          .play-icon-wrapper {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .play-icon-wrapper i {
            font-size: 36px;
            color: #fff;
            margin-left: 6px;
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
          }

          .play-label {
            font-size: 1rem;
            font-weight: 600;
            color: #fff;
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.4s var(--ease-out);
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
            letter-spacing: 0.5px;
          }

          .episode-card:hover .play-label {
            opacity: 1;
            transform: translateY(0);
          }

          .episode-info-badge {
            position: absolute;
            top: 20px;
            left: 20px;
            padding: 10px 18px;
            border-radius: 24px;
            font-size: 0.875rem;
            font-weight: 600;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          }

          .episode-info-badge i {
            font-size: 0.875rem;
          }

          /* Controls */
          .controls-section {
            margin-bottom: 3rem;
          }

          .controls-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 16px;
          }

          .control-select {
            height: 58px;
            border-radius: 20px;
            padding: 0 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 0.95rem;
            font-weight: 500;
            color: #fff;
            cursor: pointer;
            position: relative;
            transition: all 0.3s var(--ease-out);
          }

          .control-select:hover {
            transform: translateY(-3px);
            background: rgba(255, 255, 255, 0.1);
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
          }

          .control-select select {
            position: absolute;
            opacity: 0;
            width: 100%;
            left: 0;
            cursor: pointer;
          }

          .control-select i {
            color: var(--ios-blue);
            transition: transform 0.3s ease;
          }

          .control-select:hover i {
            transform: translateX(4px);
          }

          .continue-btn {
            width: 100%;
            height: 58px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            font-size: 1rem;
            font-weight: 600;
            color: #fff;
            background: linear-gradient(135deg, var(--ios-blue) 0%, var(--purple) 100%);
            border: none;
            cursor: pointer;
            transition: all 0.4s var(--ease-out);
            box-shadow: 0 10px 30px rgba(10, 132, 255, 0.3);
            position: relative;
            overflow: hidden;
          }

          .continue-btn::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent);
            opacity: 0;
            transition: opacity 0.3s ease;
          }

          .continue-btn:hover::before {
            opacity: 1;
          }

          .continue-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 40px rgba(10, 132, 255, 0.5);
          }

          .continue-btn:active {
            transform: translateY(-1px);
          }

          /* Info Section */
          .info-section {
            animation: fadeIn 0.6s ease forwards;
          }

          .info-title {
            font-size: 2.5rem;
            font-weight: 800;
            margin-bottom: 1rem;
            color: #fff;
            letter-spacing: -0.04em;
            line-height: 1.2;
            background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .info-meta {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 2rem;
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.6);
            flex-wrap: wrap;
          }

          .info-meta span {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.08);
            transition: all 0.3s ease;
          }

          .info-meta span:hover {
            background: rgba(255, 255, 255, 0.08);
            transform: translateY(-2px);
          }

          .info-meta span i {
            color: var(--ios-blue);
          }

          .synopsis-section {
            margin-bottom: 3rem;
          }

          .synopsis-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.25rem;
          }

          .synopsis-title {
            font-size: 1.35rem;
            font-weight: 700;
            color: #fff;
            letter-spacing: -0.02em;
          }

          .synopsis-toggle {
            background: rgba(10, 132, 255, 0.1);
            border: 1px solid rgba(10, 132, 255, 0.2);
            color: var(--ios-blue);
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            padding: 10px 18px;
            border-radius: 20px;
            transition: all 0.3s var(--ease-out);
          }

          .synopsis-toggle:hover {
            background: rgba(10, 132, 255, 0.2);
            transform: translateY(-2px);
          }

          .synopsis-text {
            font-size: 1rem;
            line-height: 1.8;
            color: rgba(255, 255, 255, 0.75);
            font-weight: 400;
          }

          .synopsis-text.collapsed {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .details-grid {
            display: grid;
            gap: 16px;
          }

          .detail-item {
            padding: 20px;
            border-radius: 24px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            transition: all 0.3s var(--ease-out);
          }

          .detail-item:hover {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(255, 255, 255, 0.12);
            transform: translateY(-3px);
          }

          .detail-label {
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--ios-blue);
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 0.75rem;
          }

          .detail-value {
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.6;
            font-weight: 500;
          }

          .spinner {
            width: 36px;
            height: 36px;
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
            background: #000;
          }

          @media (max-width: 768px) {
            .player-container {
              padding: 5.5rem 1.25rem 7rem;
            }
            
            .info-title {
              font-size: 1.75rem;
            }
            
            .player-popup-card {
              aspect-ratio: 16/9;
              border-radius: 20px;
            }
            
            .controls-grid {
              grid-template-columns: 1fr;
            }
            
            .bar-container {
              width: 94%;
              gap: 8px;
            }

            .play-btn-large {
              width: 70px;
              height: 70px;
            }

            .play-icon-wrapper i {
              font-size: 28px;
            }

            .play-label {
              font-size: 0.875rem;
            }

            .episode-info-badge {
              top: 12px;
              left: 12px;
              padding: 8px 14px;
              font-size: 0.8rem;
            }

            .server-selector {
              position: relative;
              top: 0;
              left: 0;
              right: 0;
              margin-bottom: 12px;
              border-radius: 16px;
            }

            .server-label {
              font-size: 0.75rem;
            }

            .server-btn {
              font-size: 0.75rem;
              padding: 5px 12px;
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
        type={type}
        tmdbId={id}
        season={season}
        episode={episode}
        onClose={() => setShowPlayer(false)}
        isVisible={showPlayer}
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
              title={item.title || item.name}
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
                  <i className="fas fa-calendar"></i>
                  {item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0]}
                </span>
                <span>
                  <i className="fas fa-star"></i>
                  {item.vote_average?.toFixed(1)}
                </span>
                {type === 'tv' && (
                  <span>
                    <i className="fas fa-film"></i>
                    {item.number_of_episodes} Episódios
                  </span>
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
                <i className="fas fa-calendar"></i>
                {item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0]}
              </span>
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
