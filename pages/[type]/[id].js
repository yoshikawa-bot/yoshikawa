import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
const DEFAULT_BACKDROP = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'

// --- COMPONENTES AUXILIARES (EXATAMENTE COMO NA HOME) ---

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
          <span className="bar-label">{label}</span>
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

// --- PÁGINA DINÂMICA DE REPRODUÇÃO ---

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

  // ... (toggle popups permanecem iguais)

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
             transition: filter 0.4s ease;
             width: 100%;
             min-height: 100vh;
          }
          .site-wrapper.blurred {
             filter: blur(12px); /* apenas blur, sem escurecimento */
             pointer-events: none;
          }

          /* barras fixas */
          .bar-container { ... } /* (mantido igual) */

          .round-btn { ... } /* (mantido) */
          .pill-container { ... } /* (mantido) */

          .bar-label { 
            font-size: 0.9rem; font-weight: 600; color: #fff; white-space: nowrap;
            letter-spacing: -0.01em;
            opacity: 1; /* sem animação de entrada */
          }

          .heart-pulse { animation: heartZoom 0.5s var(--ease-elastic); }
          @keyframes heartZoom { 
            0% { transform: scale(1); }
            50% { transform: scale(1.6); } 
            100% { transform: scale(1); }
          }

          /* popups gerais (info, toast, sinopse) */
          .info-popup, .toast, .synopsis-popup {
            padding: 16px 18px; /* padding padronizado */
            /* ... resto mantido ... */
          }

          /* cards de episódio */
          .ep-card {
            min-width: 120px;
            height: 70px;
            padding: 10px;
            border: 0.5px solid rgba(255,255,255,0.08);
            transition: all 0.2s ease;
          }
          .ep-card::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, transparent 100%);
          }
          .ep-card.active {
            border-width: 2px;
            border-color: var(--ios-blue);
            box-shadow: 0 0 0 2px var(--ios-blue);
          }

          /* player popup */
          .player-overlay {
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            background: transparent; /* incolor */
          }

          .popup-size-square {
            width: min(85vw, 750px);
            aspect-ratio: 16/9;
          }
          .popup-size-banner {
            width: min(95vw, 1100px);
            aspect-ratio: 16/9;
          }

          /* títulos menores */
          .page-title { font-size: 1.35rem; }
          .media-title { font-size: 1.15rem; }

          @media (max-width: 768px) {
            .media-title { font-size: 1rem; }
            .page-title { font-size: 1.2rem; }
            /* outros ajustes mobile mantidos */
          }

          /* remoção total de animações de entrada da página */
          /* removidos: labelFadeIn, dotPulse, iconPop, playerPopIn inicial, etc. */
        `}</style>
      </Head>

      {/* ... resto do JSX permanece exatamente igual ao anterior, exceto as classes que usam os estilos novos ... */}

      {isPlaying && (
        <div className="player-overlay">
          <div className={`player-popup-container ${isWideMode ? 'popup-size-banner' : 'popup-size-square'}`}>
            <div className="player-header-controls">
              <span className="ep-indicator">
                {type === 'tv' ? `S${season}:E${episode}` : 'FILME'}
              </span>
              <div className="right-controls">
                <button className="control-btn" onClick={() => setIsWideMode(!isWideMode)}>
                  <i className={isWideMode ? "fas fa-compress" : "fas fa-expand"}></i>
                </button>
                <button className="control-btn" onClick={() => setIsPlaying(false)}>
                  <i className="fas fa-xmark"></i>
                </button>
              </div>
            </div>

            <iframe src={getEmbedUrl()} className="player-embed" allowFullScreen title="Player"></iframe>

            {type === 'tv' && (
              <div className="player-bottom-controls">
                <button className="nav-ep-btn glass-panel" onClick={handlePrevEp} disabled={episode === 1}>
                  <i className="fas fa-backward-step"></i> Anterior
                </button>
                <button className="nav-ep-btn glass-panel" onClick={handleNextEp}>
                  Próximo <i className="fas fa-forward-step"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
    }
