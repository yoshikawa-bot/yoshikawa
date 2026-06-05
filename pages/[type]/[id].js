import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
const DEFAULT_BACKDROP = 'https://yoshikawa-bot.github.io/cache/images/5b509b8f.webp'
const LOGO_URL = 'https://yoshikawa-bot.github.io/cache/images/06486359.png'

export const Header = ({ label, scrolled, showInfo, toggleInfo, infoClosing, showTech, toggleTech, techClosing, navHidden }) => {
  const handleRightClick = (e) => {
    e.stopPropagation()
    if (scrolled) window.scrollTo({ top: 0, behavior: 'smooth' })
    else toggleInfo()
  }

  return (
    <>
      <header className={`bar-container top-bar ${scrolled ? 'scrolled-state' : ''} ${navHidden ? 'nav-hidden' : ''}`}>
        <Link href="/">
          <button className="round-btn glass-panel" title="Voltar ao Início">
            <i className="fas fa-arrow-left" style={{ fontSize: '14px' }}></i>
          </button>
        </Link>

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
            <p className="popup-text">Use <strong>Brave</strong> ou <strong>AdBlock</strong> para melhor experiência</p>
          </div>
        </div>
      )}

      {showTech && (
        <div className={`standard-popup glass-panel ${techClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="popup-icon-wrapper tech"><i className="fas fa-microchip"></i></div>
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
      try { await navigator.share({ title: 'Yoshikawa Player', url: window.location.href }) } catch (err) {}
    } else { alert('Compartilhar não suportado') }
  }

  const handleFavClick = () => {
    setAnimating(true)
    onToggleFavorite()
    setTimeout(() => setAnimating(false), 600)
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
          <i className="fas fa-minus" style={{ fontSize: '18px', WebkitTextStroke: '1px currentColor' }}></i>
        </button>
        <button className="nav-btn" onClick={onToggleSynopsis} title="Sinopse">
          <i className="fas fa-align-left"></i>
        </button>
      </div>

      <button className={`round-btn glass-panel ${navHidden ? 'hidden-fav' : ''}`} onClick={handleFavClick} title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}>
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
  return (
    <div className={`loading-overlay${!visible ? ' fade-out' : ''}`}>
      <div className="loading-spinner">
        <span></span><span></span><span></span><span></span>
        <span></span><span></span><span></span><span></span>
        <span></span><span></span><span></span><span></span>
      </div>
    </div>
  )
}

export default function WatchPage() {
  const router = useRouter()
  const { type, id } = router.query

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
  const [isFavorite, setIsFavorite] = useState(false)
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [seasonData, setSeasonData] = useState(null)
  const [watchedEps, setWatchedEps] = useState(new Set())
  const [allSeasonsData, setAllSeasonsData] = useState({})
  const [synopsisExpanded, setSynopsisExpanded] = useState(false)
  const [episodeOrder, setEpisodeOrder] = useState('asc')

  const toastTimerRef = useRef(null)
  const contentLoaded = useRef(false)

  const getLastWatchedEpisode = useCallback(() => {
    if (!id || type !== 'tv') return { season: 1, episode: 1 }
    const savedWatched = localStorage.getItem(`yoshikawaWatched_${id}`)
    if (savedWatched) {
      try {
        const watchedArray = JSON.parse(savedWatched)
        if (watchedArray.length > 0) {
          const allWatched = watchedArray.map(key => {
            const [s, e] = key.split('-').map(Number)
            return { season: s, episode: e }
          })
          allWatched.sort((a, b) => {
            if (a.season !== b.season) return b.season - a.season
            return b.episode - a.episode
          })
          return allWatched[0]
        }
      } catch (e) {}
    }
    try {
      const saved = localStorage.getItem(`yoshikawaProgress_${id}`)
      if (saved) {
        const p = JSON.parse(saved)
        return { season: p.season || 1, episode: p.episode || 1 }
      }
    } catch (e) {}
    return { season: 1, episode: 1 }
  }, [id, type])

  useEffect(() => {
    if (!id || !type) return
    if (contentLoaded.current) return

    const loadContent = async () => {
      try {
        const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=external_ids`)
        const data = await res.json()
        setContent(data)

        if (type === 'tv') {
          try {
            const w = localStorage.getItem(`yoshikawaWatched_${id}`)
            if (w) setWatchedEps(new Set(JSON.parse(w)))
          } catch (e) {}

          const lastWatched = getLastWatchedEpisode()
          setSeason(lastWatched.season)
          setEpisode(lastWatched.episode)
          await fetchSeasonData(id, lastWatched.season)
        }

        checkFavoriteStatus(data)
        contentLoaded.current = true
      } catch (error) {
        showToast('Erro ao carregar conteúdo', 'error')
        setIsLoading(false)
      }
    }
    loadContent()
  }, [id, type, getLastWatchedEpisode])

  useEffect(() => {
    if (content) {
      const timer = setTimeout(() => setIsLoading(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [content])

  useEffect(() => {
    if (type !== 'tv' || !id || !contentLoaded.current) return
    try {
      localStorage.setItem(`yoshikawaProgress_${id}`, JSON.stringify({ season, episode }))
    } catch (e) {}
  }, [season, episode, id, type])

  useEffect(() => {
    if (type !== 'tv' || !id || !isPlaying) return
    const key = `${season}-${episode}`
    setWatchedEps(prev => {
      if (prev.has(key)) return prev
      const next = new Set([...prev, key])
      try { localStorage.setItem(`yoshikawaWatched_${id}`, JSON.stringify([...next])) } catch (e) {}
      return next
    })
  }, [season, episode, isPlaying, id, type])

  const fetchSeasonData = async (tvId, seasonNum) => {
    try {
      if (allSeasonsData[seasonNum]) {
        setSeasonData(allSeasonsData[seasonNum])
        setSeason(seasonNum)
        return
      }
      const res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNum}?api_key=${TMDB_API_KEY}&language=pt-BR`)
      const data = await res.json()
      setAllSeasonsData(prev => ({ ...prev, [seasonNum]: data }))
      setSeasonData(data)
      setSeason(seasonNum)
    } catch (err) {
      showToast('Erro ao carregar temporada', 'error')
    }
  }

  const showToast = (message, type = 'info') => {
    if (showInfoPopup || showTechPopup || showSynopsisPopup || showDataPopup) closeAllPopups()
    if (currentToast && !currentToast.closing) {
      setCurrentToast(prev => ({ ...prev, closing: true }))
      setTimeout(() => setToastQueue(prev => [...prev, { message, type, id: Date.now() }]), 300)
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

  const checkFavoriteStatus = (item) => {
    try {
      const stored = localStorage.getItem('yoshikawaFavorites')
      const favorites = stored ? JSON.parse(stored) : []
      setIsFavorite(favorites.some(f => f.id === item.id && f.media_type === type))
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
    if (showInfoPopup && !infoClosing) { setInfoClosing(true); setTimeout(() => { setShowInfoPopup(false); setInfoClosing(false) }, 400) }
    if (showTechPopup && !techClosing) { setTechClosing(true); setTimeout(() => { setShowTechPopup(false); setTechClosing(false) }, 400) }
    if (showSynopsisPopup && !synopsisClosing) { setSynopsisClosing(true); setTimeout(() => { setShowSynopsisPopup(false); setSynopsisClosing(false) }, 400) }
    if (showDataPopup && !dataClosing) { setDataClosing(true); setTimeout(() => { setShowDataPopup(false); setDataClosing(false) }, 400) }
    if (currentToast && !currentToast.closing) setCurrentToast(prev => ({ ...prev, closing: true }))
  }, [showInfoPopup, infoClosing, showTechPopup, techClosing, showSynopsisPopup, synopsisClosing, showDataPopup, dataClosing, currentToast])

  const toggleInfoPopup = () => {
    if (showTechPopup || showSynopsisPopup || showDataPopup || currentToast) { closeAllPopups(); setTimeout(() => { if (!showInfoPopup) setShowInfoPopup(true) }, 300) }
    else if (showInfoPopup) { setInfoClosing(true); setTimeout(() => { setShowInfoPopup(false); setInfoClosing(false) }, 400) }
    else setShowInfoPopup(true)
  }

  const toggleTechPopup = () => {
    if (showInfoPopup || showSynopsisPopup || showDataPopup || currentToast) { closeAllPopups(); setTimeout(() => { if (!showTechPopup) setShowTechPopup(true) }, 300) }
    else if (showTechPopup) { setTechClosing(true); setTimeout(() => { setShowTechPopup(false); setTechClosing(false) }, 400) }
    else setShowTechPopup(true)
  }

  const toggleDataPopup = () => {
    if (showInfoPopup || showTechPopup || showSynopsisPopup || currentToast) { closeAllPopups(); setTimeout(() => { if (!showDataPopup) setShowDataPopup(true) }, 300) }
    else if (showDataPopup) { setDataClosing(true); setTimeout(() => { setShowDataPopup(false); setDataClosing(false) }, 400) }
    else setShowDataPopup(true)
  }

  const toggleSynopsisPopup = () => {
    if (showInfoPopup || showTechPopup || showDataPopup || currentToast) { closeAllPopups(); setTimeout(() => { if (!showSynopsisPopup) setShowSynopsisPopup(true) }, 300) }
    else if (showSynopsisPopup) { setSynopsisClosing(true); setTimeout(() => { setShowSynopsisPopup(false); setSynopsisClosing(false) }, 400) }
    else setShowSynopsisPopup(true)
  }

  const toggleNavVisibility = () => {
    if (!navHidden) closeAllPopups()
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

  const handleNativeSeasonChange = (e) => {
    const newSeason = parseInt(e.target.value)
    const savedEp = getLastWatchedEpisodeForSeason(newSeason)
    fetchSeasonData(id, newSeason)
    setEpisode(savedEp)
  }

  const getLastWatchedEpisodeForSeason = (seasonNum) => {
    try {
      const w = localStorage.getItem(`yoshikawaWatched_${id}`)
      if (w) {
        const watchedArray = JSON.parse(w)
        const seasonEps = watchedArray.filter(key => key.startsWith(`${seasonNum}-`)).map(key => parseInt(key.split('-')[1]))
        if (seasonEps.length > 0) return Math.max(...seasonEps)
      }
    } catch (e) {}
    return 1
  }

  const handleEpisodeClick = (epNumber) => {
    setEpisode(epNumber)
    setIsPlaying(true)
  }

  const getEmbedUrl = () => {
    if (!content) return ''
    if (type === 'movie') {
      const imdbId = content.external_ids?.imdb_id || content.imdb_id
      if (!imdbId) { showToast('ID IMDB não encontrado', 'error'); return '' }
      return `https://superflixapi.best/filme/${imdbId}`
    }
    return `https://superflixapi.best/serie/${id}/${season}/${episode}`
  }

  const handleNextEp = () => {
    const nextEp = episode + 1
    if (seasonData?.episodes && nextEp <= seasonData.episodes.length) setEpisode(nextEp)
    else showToast('Fim da temporada', 'info')
  }

  const handlePrevEp = () => {
    if (episode > 1) setEpisode(episode - 1)
  }

  const releaseDate = content?.release_date || content?.first_air_date || 'Desconhecido'
  const rating = content?.vote_average ? content.vote_average.toFixed(1) : 'N/A'
  const genres = content?.genres ? content.genres.map(g => g.name).join(', ') : 'Gênero desconhecido'
  const currentEpisodeData = seasonData?.episodes?.find(e => e.episode_number === episode)

  const getOrderedEpisodes = () => {
    if (!seasonData?.episodes) return []
    return episodeOrder === 'asc' ? seasonData.episodes : [...seasonData.episodes].reverse()
  }

  const getRatingClass = (adult) => adult ? 'rating-18' : 'rating-L'

  return (
    <>
      <Head>
        <title>{content ? (content.title || content.name) : 'Yoshikawa'} - Reproduzindo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
          html { scroll-behavior: smooth; }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #101010;
            color: #f5f5f7;
            line-height: 1.6;
            font-size: 16px;
            min-height: 100vh;
            overflow-y: auto;
            overflow-x: hidden;
          }

          .loading-overlay {
            position: fixed; inset: 0; z-index: 9999;
            display: flex; align-items: center; justify-content: center;
            background: #101010;
          }
          .loading-overlay.fade-out { display: none; }
          .loading-spinner {
            width: 48px; height: 48px; position: relative;
          }
          .loading-spinner span {
            position: absolute; top: 0; left: 50%;
            width: 3px; height: 11px; margin-left: -1.5px;
            border-radius: 999px; background: rgba(255,255,255,0.15);
            transform-origin: center 24px;
            animation: spinnerTick 1s linear infinite;
          }
          .loading-spinner span:nth-child(1) { transform: rotate(0deg); animation-delay: -0.917s; }
          .loading-spinner span:nth-child(2) { transform: rotate(30deg); animation-delay: -0.833s; }
          .loading-spinner span:nth-child(3) { transform: rotate(60deg); animation-delay: -0.750s; }
          .loading-spinner span:nth-child(4) { transform: rotate(90deg); animation-delay: -0.750s; }
          .loading-spinner span:nth-child(5) { transform: rotate(120deg); animation-delay: -0.583s; }
          .loading-spinner span:nth-child(6) { transform: rotate(150deg); animation-delay: -0.500s; }
          .loading-spinner span:nth-child(7) { transform: rotate(180deg); animation-delay: -0.417s; }
          .loading-spinner span:nth-child(8) { transform: rotate(210deg); animation-delay: -0.333s; }
          .loading-spinner span:nth-child(9) { transform: rotate(240deg); animation-delay: -0.250s; }
          .loading-spinner span:nth-child(10) { transform: rotate(270deg); animation-delay: -0.167s; }
          .loading-spinner span:nth-child(11) { transform: rotate(300deg); animation-delay: -0.083s; }
          .loading-spinner span:nth-child(12) { transform: rotate(330deg); animation-delay: 0s; }

          @keyframes spinnerTick {
            0% { background: rgba(255,255,255,0.85); }
            100% { background: rgba(255,255,255,0.10); }
          }

          a { color: inherit; text-decoration: none; }
          button { font-family: inherit; border: none; outline: none; background: none; cursor: pointer; user-select: none; }
          img { max-width: 100%; height: auto; display: block; }

          :root {
            --pill-height: 44px;
            --pill-radius: 50px;
            --pill-max-width: 520px;
            --ease-elastic: cubic-bezier(0.34, 1.56, 0.64, 1);
            --ease-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }

          .glass-panel {
            position: relative;
            background: rgba(255, 255, 255, 0.06);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: inherit;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            overflow: hidden;
          }

          .bar-container {
            position: fixed; left: 50%; transform: translateX(-50%); z-index: 1000;
            display: flex; align-items: center; justify-content: center; gap: 12px;
            width: 90%; max-width: var(--pill-max-width);
            transition: all 0.6s var(--ease-smooth);
          }
          .top-bar { top: max(20px, env(safe-area-inset-top, 20px)); }
          .bottom-bar { bottom: max(20px, env(safe-area-inset-bottom, 20px)); }
          .top-bar.nav-hidden, .bottom-bar.nav-hidden { opacity: 0; visibility: hidden; pointer-events: none; }
          .round-btn {
            width: var(--pill-height); height: var(--pill-height); border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            color: rgba(255, 255, 255, 0.9); flex-shrink: 0;
          }
          .pill-container {
            height: var(--pill-height); flex: 1; border-radius: var(--pill-radius);
            display: flex; align-items: center; justify-content: center;
          }
          .nav-btn { flex: 1; display: flex; align-items: center; justify-content: center; height: 100%; color: rgba(255,255,255,0.4); }
          .bar-label { font-size: 0.9rem; font-weight: 600; color: #fff; white-space: nowrap; letter-spacing: -0.01em; }

          .standard-popup, .toast {
            position: fixed;
            top: calc(max(20px, env(safe-area-inset-top, 20px)) + var(--pill-height) + 16px);
            left: 50%; z-index: 960;
            min-width: 280px; max-width: min(360px, calc(100vw - 32px));
            display: flex; align-items: center; gap: 14px;
            padding: 14px 16px; border-radius: 22px;
            transform: translate3d(-50%, -50%, 0) scale3d(0.3, 0.3, 1);
            transform-origin: top center; opacity: 0;
            animation: popupZoomIn 0.5s var(--ease-elastic) forwards;
            box-shadow: 0 20px 60px rgba(0,0,0,0.6);
          }
          .standard-popup.closing, .toast.closing { animation: popupZoomOut 0.3s cubic-bezier(0.55, 0.055, 0.675, 0.19) forwards; }
          @keyframes popupZoomIn {
            0% { opacity: 0; transform: translate3d(-50%, -50%, 0) scale3d(0.3, 0.3, 1); }
            100% { opacity: 1; transform: translate3d(-50%, 0, 0) scale3d(1, 1, 1); pointer-events: auto; }
          }
          @keyframes popupZoomOut {
            0% { opacity: 1; transform: translate3d(-50%, 0, 0) scale3d(1, 1, 1); }
            100% { opacity: 0; transform: translate3d(-50%, -30%, 0) scale3d(0.5, 0.5, 1); pointer-events: none; }
          }
          .popup-icon-wrapper, .toast-icon-wrapper {
            width: 38px; height: 38px; min-width: 38px; border-radius: 12px;
            display: flex; align-items: center; justify-content: center;
          }
          .popup-icon-wrapper.info { background: linear-gradient(135deg, #34c759 0%, #30d158 100%); }
          .popup-icon-wrapper.tech { background: linear-gradient(135deg, #0a84ff 0%, #007aff 100%); }
          .popup-icon-wrapper.synopsis { background: linear-gradient(135deg, #ff9500 0%, #ff8c00 100%); }
          .popup-icon-wrapper.data { background: linear-gradient(135deg, #bf5af2 0%, #a448e0 100%); }
          .toast-icon-wrapper { border-radius: 50%; }
          .toast.success .toast-icon-wrapper { background: linear-gradient(135deg, #34c759, #30d158); }
          .toast.info .toast-icon-wrapper { background: linear-gradient(135deg, #0a84ff, #007aff); }
          .toast.error .toast-icon-wrapper { background: linear-gradient(135deg, #ff453a, #ff3b30); }
          .popup-icon-wrapper i, .toast-icon-wrapper i { font-size: 18px; color: #fff; }
          .popup-content, .toast-content { flex: 1; display: flex; flex-direction: column; gap: 4px; }
          .popup-title, .toast-title { font-size: 0.88rem; font-weight: 600; color: #fff; }
          .popup-text, .toast-msg { font-size: 0.75rem; color: rgba(255,255,255,0.7); }
          .toast-wrap { position: fixed; top: calc(max(20px, env(safe-area-inset-top, 20px)) + var(--pill-height) + 16px); left: 50%; z-index: 960; pointer-events: none; }

          .hero-section {
            position: relative;
            width: 100%;
            height: clamp(500px, 60vw, 620px);
            overflow: hidden;
          }
          .hero-backdrop {
            position: absolute; inset: 0;
            width: 100%; height: 100%;
            object-fit: cover;
          }
          .hero-gradient {
            position: absolute; inset: 0;
            background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.95) 100%);
          }
          .hero-content {
            position: absolute; bottom: 0; left: 0; right: 0;
            padding: clamp(20px, 4vw, 32px);
            display: flex; flex-direction: column; gap: clamp(12px, 2vw, 20px);
          }
          .hero-continue-btn {
            display: flex; align-items: center; gap: 10px;
            padding: clamp(10px, 2vw, 14px) clamp(20px, 4vw, 28px);
            background: #DA7757; border-radius: 28px;
            color: #ffffff; font-size: clamp(14px, 2vw, 16px); font-weight: 700;
            cursor: pointer; transition: transform 0.2s, opacity 0.2s;
            width: fit-content;
          }
          .hero-continue-btn:hover { transform: scale(1.05); }
          .hero-continue-btn:active { transform: scale(0.95); }
          .hero-continue-btn i { font-size: clamp(16px, 2.5vw, 22px); }
          .hero-title {
            font-size: clamp(24px, 5vw, 30px); font-weight: 800;
            color: #ffffff; line-height: 1.1;
          }
          .hero-meta {
            display: flex; align-items: center; gap: clamp(8px, 1.5vw, 12px);
            flex-wrap: wrap; font-size: clamp(13px, 2vw, 15px);
            color: #AFAFAF;
          }
          .hero-rating-badge {
            padding: clamp(2px, 0.4vw, 4px) clamp(6px, 1vw, 10px);
            border-radius: 8px; font-size: clamp(12px, 1.5vw, 14px);
            font-weight: 700; color: #fff;
          }
          .rating-L { background: #4CAF50; }
          .rating-18 { background: #f44336; }

          .social-section {
            display: flex; justify-content: space-around; align-items: center;
            padding: clamp(16px, 3vw, 24px) clamp(16px, 4vw, 32px);
          }
          .social-action {
            display: flex; flex-direction: column; align-items: center; gap: 6px;
            color: rgba(255,255,255,0.7); font-size: clamp(12px, 1.8vw, 15px);
            cursor: pointer; transition: color 0.2s;
          }
          .social-action:hover { color: #ffffff; }
          .social-action i { font-size: clamp(20px, 3vw, 24px); }
          .social-action.active i { color: #FF5B5B; }

          .synopsis-section {
            padding: 0 clamp(16px, 4vw, 32px); margin-bottom: clamp(12px, 2vw, 20px);
          }
          .synopsis-text {
            font-size: clamp(14px, 2vw, 17px); font-weight: 500;
            line-height: 1.45; color: #ffffff;
            display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical;
            overflow: hidden; transition: all 0.3s ease;
          }
          .synopsis-text.expanded { -webkit-line-clamp: unset; }
          .synopsis-expand-btn {
            display: flex; align-items: center; justify-content: center; gap: 6px;
            margin: 12px auto 0; color: rgba(255,255,255,0.6);
            font-size: clamp(12px, 1.8vw, 14px); cursor: pointer;
            transition: color 0.2s;
          }
          .synopsis-expand-btn:hover { color: #ffffff; }

          .episodes-toolbar {
            display: flex; justify-content: space-between; align-items: center;
            padding: 0 clamp(16px, 4vw, 32px); margin-bottom: clamp(16px, 3vw, 24px);
            gap: 12px;
          }
          .toolbar-btn {
            display: flex; align-items: center; gap: 8px;
            padding: clamp(8px, 1.5vw, 12px) clamp(14px, 2.5vw, 20px);
            background: #1B1B1B; border-radius: 12px;
            color: #ffffff; font-size: clamp(13px, 2vw, 15px);
            font-weight: 600; cursor: pointer; transition: background 0.2s;
          }
          .toolbar-btn:hover { background: #2a2a2a; }
          .toolbar-select {
            appearance: none; -webkit-appearance: none;
            background: #1B1B1B url('data:image/svg+xml;utf8,<svg fill="white" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/></svg>') no-repeat right 8px center;
            padding: clamp(8px, 1.5vw, 12px) 32px clamp(8px, 1.5vw, 12px) clamp(14px, 2.5vw, 20px);
            border-radius: 12px; border: none;
            color: #ffffff; font-size: clamp(13px, 2vw, 15px);
            font-weight: 600; cursor: pointer; font-family: inherit;
          }

          .episodes-list {
            padding: 0 clamp(12px, 2.5vw, 24px);
            display: flex; flex-direction: column;
            gap: clamp(8px, 1.5vw, 12px);
            margin-bottom: 100px;
          }
          .episode-card {
            display: flex; gap: clamp(10px, 2vw, 14px);
            padding: clamp(10px, 2vw, 14px);
            background: #1B1B1B; border-radius: 16px;
            cursor: pointer; transition: background 0.2s, transform 0.2s;
            align-items: center;
          }
          .episode-card:hover { background: #252525; transform: translateY(-2px); }
          .episode-card.active { border: 1px solid rgba(255,255,255,0.2); }
          .episode-thumb {
            width: clamp(120px, 25vw, 170px); height: clamp(65px, 14vw, 95px);
            border-radius: 12px; overflow: hidden; flex-shrink: 0;
            background: #2a2a2a;
          }
          .episode-thumb img {
            width: 100%; height: 100%; object-fit: cover;
          }
          .episode-thumb-placeholder {
            width: 100%; height: 100%;
            display: flex; align-items: center; justify-content: center;
            color: rgba(255,255,255,0.2); font-size: 20px;
          }
          .episode-info {
            flex: 1; min-width: 0;
            display: flex; flex-direction: column; gap: clamp(2px, 0.5vw, 4px);
          }
          .episode-title {
            font-size: clamp(14px, 2vw, 17px); font-weight: 700;
            line-height: 1.3; color: #ffffff;
            display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .episode-duration {
            font-size: clamp(12px, 1.8vw, 15px); font-weight: 500;
            color: #9A9A9A;
          }
          .episode-watched-badge {
            flex-shrink: 0;
            width: 24px; height: 24px;
            display: flex; align-items: center; justify-content: center;
            color: #4CAF50; font-size: 14px;
          }

          .player-overlay {
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.95); backdrop-filter: blur(20px);
            z-index: 2000; display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            padding: 16px; animation: overlayFadeIn 0.4s ease;
          }
          @keyframes overlayFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .player-wrapper {
            display: flex; flex-direction: column; align-items: center;
            width: 100%; max-width: 90vw;
          }
          .player-container {
            position: relative; background: #000; border-radius: 20px;
            overflow: hidden; box-shadow: 0 0 60px rgba(0,0,0,0.9);
            width: 100%; aspect-ratio: 16/9;
          }
          .player-embed { width: 100%; height: 100%; border: none; }
          .player-controls {
            width: 100%; display: flex; justify-content: space-between;
            align-items: center; margin-bottom: 12px;
          }
          .ep-indicator {
            font-size: clamp(0.8rem, 2vw, 1rem); font-weight: 700;
            color: #fff; background: rgba(0,0,0,0.4);
            padding: 8px 16px; border-radius: 12px;
            backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.15);
          }
          .close-btn {
            width: 44px; height: 44px; background: rgba(255,255,255,0.08);
            backdrop-filter: blur(10px); border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            color: rgba(255,255,255,0.9); border: 1px solid rgba(255,255,255,0.15);
            cursor: pointer; transition: transform 0.2s;
          }
          .close-btn:hover { transform: scale(1.1); }
          .nav-ep-btns {
            display: flex; justify-content: center; gap: 12px; margin-top: 12px;
          }
          .nav-ep-btn {
            padding: 10px 20px; border-radius: 50px;
            background: rgba(255,255,255,0.08); color: #fff;
            font-weight: 600; font-size: 0.9rem;
            display: flex; align-items: center; gap: 8px;
            backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.15);
            cursor: pointer; transition: transform 0.2s;
          }
          .nav-ep-btn:hover { transform: scale(1.05); }
          .nav-ep-btn:disabled { opacity: 0.4; cursor: not-allowed; }

          .show-nav-btn {
            position: fixed; bottom: max(20px, env(safe-area-inset-bottom, 20px));
            left: 50%; z-index: 999;
            width: 48px; height: 48px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            color: rgba(255,255,255,0.9);
            transition: all 0.6s var(--ease-smooth);
            transform: translateX(-50%);
          }
          .show-nav-btn:not(.visible) { opacity: 0; visibility: hidden; pointer-events: none; }
          .show-nav-btn.visible { opacity: 1; visibility: visible; pointer-events: auto; }

          @media (min-width: 769px) {
            .player-wrapper { max-width: 800px; }
          }

          @media (max-width: 768px) {
            .hero-section { height: clamp(400px, 80vw, 500px); }
            .episode-card { padding: 10px; }
          }
        `}</style>
      </Head>

      <LoadingScreen visible={isLoading} />

      {content && (
        <>
          <div className="hero-section">
            <img
              className="hero-backdrop"
              src={content?.backdrop_path ? `https://image.tmdb.org/t/p/original${content.backdrop_path}` : DEFAULT_BACKDROP}
              alt={content.title || content.name}
            />
            <div className="hero-gradient"></div>
            <div className="hero-content">
              {type === 'tv' ? (
                <button className="hero-continue-btn" onClick={() => setIsPlaying(true)}>
                  <i className="fas fa-play"></i> Continuar S{season}:E{episode}
                </button>
              ) : (
                <button className="hero-continue-btn" onClick={() => setIsPlaying(true)}>
                  <i className="fas fa-play"></i> Assistir
                </button>
              )}
              <h1 className="hero-title">{content.title || content.name}</h1>
              <div className="hero-meta">
                <span className={`hero-rating-badge ${getRatingClass(content.adult)}`}>{content.adult ? '18+' : 'L'}</span>
                <span>{genres}</span>
                <span>• {new Date(releaseDate).getFullYear() || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="social-section">
            <div className="social-action">
              <i className="fas fa-comment"></i>
              <span>Comentários</span>
            </div>
            <div className="social-action">
              <i className="fas fa-thumbs-up"></i>
              <span>{Math.round(content.popularity || 0)}</span>
            </div>
            <div className={`social-action ${isFavorite ? 'active' : ''}`} onClick={toggleFavorite}>
              <i className={isFavorite ? 'fas fa-heart' : 'far fa-heart'}></i>
              <span>{isFavorite ? 'Favoritado' : 'Favoritar'}</span>
            </div>
            <div className="social-action" onClick={() => {
              if (navigator.share) navigator.share({ title: content.title || content.name, url: window.location.href })
            }}>
              <i className="fas fa-share-alt"></i>
              <span>Compartilhar</span>
            </div>
          </div>

          <div className="synopsis-section">
            <p className={`synopsis-text ${synopsisExpanded ? 'expanded' : ''}`}>
              {content?.overview || 'Sinopse indisponível.'}
            </p>
            {content?.overview && content.overview.length > 200 && (
              <button className="synopsis-expand-btn" onClick={() => setSynopsisExpanded(!synopsisExpanded)}>
                {synopsisExpanded ? 'Ver menos' : 'Ver mais'} <i className={`fas fa-chevron-${synopsisExpanded ? 'up' : 'down'}`}></i>
              </button>
            )}
          </div>

          {type === 'tv' && (
            <>
              <div className="episodes-toolbar">
                <select className="toolbar-select" value={season} onChange={handleNativeSeasonChange}>
                  {Array.from({ length: content?.number_of_seasons || 1 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>Temporada {num}</option>
                  ))}
                </select>
                <button className="toolbar-btn" onClick={() => setEpisodeOrder(episodeOrder === 'asc' ? 'desc' : 'asc')}>
                  {episodeOrder === 'asc' ? 'Antigos' : 'Recentes'} <i className="fas fa-sort"></i>
                </button>
              </div>

              <div className="episodes-list">
                {getOrderedEpisodes().map(ep => {
                  const isWatched = watchedEps.has(`${season}-${ep.episode_number}`)
                  const isCurrent = ep.episode_number === episode
                  return (
                    <div
                      key={ep.id}
                      className={`episode-card ${isCurrent ? 'active' : ''}`}
                      onClick={() => handleEpisodeClick(ep.episode_number)}
                    >
                      <div className="episode-thumb">
                        {ep.still_path ? (
                          <img src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} alt={`Episódio ${ep.episode_number}`} />
                        ) : (
                          <div className="episode-thumb-placeholder"><i className="fas fa-image"></i></div>
                        )}
                      </div>
                      <div className="episode-info">
                        <h4 className="episode-title">{ep.episode_number}. {ep.name || 'Sem título'}</h4>
                        <p className="episode-duration">{ep.runtime ? `${ep.runtime} min` : 'Duração indisponível'}</p>
                      </div>
                      {isWatched && (
                        <div className="episode-watched-badge">
                          <i className="fas fa-check-circle"></i>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          <Header
            label={scrolled ? (content.title || content.name) : "Yoshikawa"}
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
            <div className={`standard-popup glass-panel ${synopsisClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
              <div className="popup-icon-wrapper synopsis"><i className="fas fa-align-left"></i></div>
              <div className="popup-content">
                <p className="popup-title">Sinopse</p>
                <p className="popup-text">{content?.overview || "Sinopse indisponível."}</p>
              </div>
            </div>
          )}

          {showDataPopup && (
            <div className={`standard-popup glass-panel ${dataClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
              <div className="popup-icon-wrapper data"><i className="fas fa-film"></i></div>
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
            title={navHidden ? "Mostrar Navegação" : "Ocultar Navegação"}
          >
            <i className={navHidden ? "fas fa-chevron-up" : "fas fa-chevron-down"}></i>
          </button>

          {isPlaying && (
            <div className="player-overlay">
              <div className="player-wrapper">
                <div className="player-controls">
                  <span className="ep-indicator">
                    {type === 'tv' ? `S${season}:E${episode}` : 'FILME'}
                  </span>
                  <button className="close-btn" onClick={() => setIsPlaying(false)}>
                    <i className="fas fa-xmark"></i>
                  </button>
                </div>
                <div className="player-container">
                  <iframe src={getEmbedUrl()} className="player-embed" frameBorder="0" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerPolicy="origin" title="Player"></iframe>
                </div>
                {type === 'tv' && (
                  <div className="nav-ep-btns">
                    <button className="nav-ep-btn" onClick={handlePrevEp} disabled={episode === 1}>
                      <i className="fas fa-backward-step"></i> Ant
                    </button>
                    <button className="nav-ep-btn" onClick={handleNextEp}>
                      Prox <i className="fas fa-forward-step"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
  }
