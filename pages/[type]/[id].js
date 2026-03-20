
import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion'

const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
const DEFAULT_BACKDROP = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'

const SP = {
  snappy:  { type: 'spring', stiffness: 500, damping: 36, mass: 1 },
  gentle:  { type: 'spring', stiffness: 320, damping: 30, mass: 1 },
  bouncy:  { type: 'spring', stiffness: 420, damping: 24, mass: 0.8 },
  sluggish:{ type: 'spring', stiffness: 220, damping: 28, mass: 1.2 },
  ios:     { type: 'spring', stiffness: 400, damping: 38, mass: 1 },
}

export const Header = ({
  label, scrolled,
  showInfo, toggleInfo, infoClosing,
  showTech, toggleTech, techClosing,
  navHidden
}) => {
  const handleRightClick = (e) => {
    e.stopPropagation()
    if (scrolled) { window.scrollTo({ top: 0, behavior: 'smooth' }) }
    else { toggleInfo() }
  }

  return (
    <>
      <AnimatePresence>
        {!navHidden && (
          <motion.header
            className="bar-container top-bar"
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: scrolled ? -5 : 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={SP.ios}
            style={{ position: 'fixed', left: '50%', x: '-50%' }}
          >
            <Link href="/">
              <motion.button
                className="round-btn glass-panel"
                title="Voltar ao Início"
                whileTap={{ scale: 0.88 }}
                whileHover={{ scale: 1.08 }}
                transition={SP.bouncy}
              >
                <i className="fas fa-arrow-left" style={{ fontSize: '14px' }}></i>
              </motion.button>
            </Link>

            <div className="pill-container glass-panel">
              <AnimatePresence mode="wait">
                <motion.span
                  key={label}
                  className="bar-label"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={SP.snappy}
                >
                  {label}
                </motion.span>
              </AnimatePresence>
            </div>

            <motion.button
              className="round-btn glass-panel"
              title={scrolled ? 'Voltar ao topo' : 'Informações'}
              onClick={handleRightClick}
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.08 }}
              transition={SP.bouncy}
            >
              <AnimatePresence mode="wait">
                <motion.i
                  key={scrolled ? 'up' : 'info'}
                  className={scrolled ? 'fas fa-chevron-up' : 'fas fa-info-circle'}
                  style={{ fontSize: '14px' }}
                  initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 30 }}
                  transition={SP.bouncy}
                />
              </AnimatePresence>
            </motion.button>
          </motion.header>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInfo && (
          <motion.div
            className="standard-popup glass-panel"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: -20, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.9 }}
            transition={SP.bouncy}
            style={{ originY: 0 }}
          >
            <motion.div
              className="popup-icon-wrapper info"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...SP.bouncy, delay: 0.05 }}
            >
              <i className="fas fa-shield-halved"></i>
            </motion.div>
            <motion.div
              className="popup-content"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...SP.gentle, delay: 0.1 }}
            >
              <p className="popup-title">Proteção Recomendada</p>
              <p className="popup-text">Use <strong>Brave</strong> ou <strong>AdBlock</strong> para melhor experiência</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTech && (
          <motion.div
            className="standard-popup glass-panel"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: -20, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.9 }}
            transition={SP.bouncy}
            style={{ originY: 0 }}
          >
            <motion.div
              className="popup-icon-wrapper tech"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...SP.bouncy, delay: 0.05 }}
            >
              <i className="fas fa-microchip"></i>
            </motion.div>
            <motion.div
              className="popup-content"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...SP.gentle, delay: 0.1 }}
            >
              <p className="popup-title">Informações Técnicas</p>
              <p className="popup-text">v2.8.0 • React 18 • TMDB API • EmbedMovies API</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export const BottomNav = ({ isFavorite, onToggleFavorite, onToggleSynopsis, onToggleData, onToggleNav, navHidden }) => {
  const [animating, setAnimating] = useState(false)

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Yoshikawa Player', url: window.location.href }) }
      catch (err) {}
    } else { alert('Compartilhar não suportado') }
  }

  const handleFavClick = () => {
    setAnimating(true)
    onToggleFavorite()
    setTimeout(() => setAnimating(false), 400)
  }

  return (
    <AnimatePresence>
      {!navHidden && (
        <motion.div
          className="bar-container bottom-bar"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={SP.ios}
          style={{ position: 'fixed', left: '50%', x: '-50%' }}
        >
          <motion.button
            className="round-btn glass-panel"
            onClick={handleShare}
            title="Compartilhar"
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.08 }}
            transition={SP.bouncy}
          >
            <i className="fas fa-arrow-up-from-bracket" style={{ fontSize: '15px', transform: 'translateY(-1px)' }}></i>
          </motion.button>

          <div className="pill-container glass-panel">
            <motion.button
              className="nav-btn"
              onClick={onToggleData}
              title="Dados do Título"
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.2 }}
              transition={SP.bouncy}
            >
              <i className="fas fa-film"></i>
            </motion.button>

            <motion.button
              className="nav-btn hide-toggle-pill-btn"
              onClick={onToggleNav}
              title="Ocultar Menu"
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.2 }}
              transition={SP.bouncy}
            >
              <i className="fas fa-minus" style={{ fontSize: '18px', WebkitTextStroke: '1px currentColor' }}></i>
            </motion.button>

            <motion.button
              className="nav-btn"
              onClick={onToggleSynopsis}
              title="Sinopse"
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.2 }}
              transition={SP.bouncy}
            >
              <i className="fas fa-align-left"></i>
            </motion.button>
          </div>

          <motion.button
            className="round-btn glass-panel"
            onClick={handleFavClick}
            title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.08 }}
            transition={SP.bouncy}
          >
            <motion.i
              className={isFavorite ? 'fas fa-heart' : 'far fa-heart'}
              style={{ color: isFavorite ? '#ff3b30' : '#ffffff', fontSize: '15px', display: 'block' }}
              animate={animating ? { scale: [1, 1.6, 1] } : { scale: 1 }}
              transition={SP.bouncy}
            />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export const ToastContainer = ({ toast, closeToast }) => (
  <AnimatePresence>
    {toast && (
      <div className="toast-wrap">
        <motion.div
          className={`toast glass-panel ${toast.type}`}
          onClick={closeToast}
          initial={{ opacity: 0, y: -20, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.9 }}
          transition={SP.bouncy}
          style={{ originY: 0, position: 'relative', left: 'auto', top: 'auto', transform: 'none' }}
        >
          <motion.div
            className="toast-icon-wrapper"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ ...SP.bouncy, delay: 0.05 }}
          >
            <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : toast.type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}`}></i>
          </motion.div>
          <motion.div
            className="toast-content"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...SP.gentle, delay: 0.1 }}
          >
            <div className="toast-title">{toast.type === 'success' ? 'Sucesso' : toast.type === 'error' ? 'Erro' : 'Info'}</div>
            <div className="toast-msg">{toast.message}</div>
          </motion.div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
)

const LoadingScreen = ({ visible }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        className="loading-overlay"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0 }}
      >
        <div className="loading-spinner">
          <span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
)

const IndicatorArrow = ({ left }) => {
  const motionLeft = useMotionValue(left)
  const springLeft = useSpring(motionLeft, { stiffness: 380, damping: 32, mass: 1 })

  useEffect(() => {
    motionLeft.set(left)
  }, [left, motionLeft])

  return (
    <motion.i
      className="indicator-arrow fas fa-chevron-up"
      style={{ left: springLeft, opacity: 1 }}
    />
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

  const [indicatorLeft, setIndicatorLeft] = useState(null)

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
        if (type === 'tv') await fetchSeason(id, 1)
        checkFavoriteStatus(data)
      } catch {
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
    } catch {
      showToast('Erro ao carregar temporada', 'error')
    }
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
      if (!e.target.closest('.standard-popup') && !e.target.closest('.toast') && !e.target.closest('.round-btn') && !e.target.closest('.pill-container') && !e.target.closest('.show-nav-btn')) closeAllPopups()
    }
    window.addEventListener('click', onClick)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('click', onClick) }
  }, [closeAllPopups])

  useEffect(() => {
    if (!carouselRef.current || !seasonData) return
    const activeCard = carouselRef.current.querySelector('.ep-card.active')
    if (!activeCard) return
    activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    const cardCenter = activeCard.offsetLeft + activeCard.offsetWidth / 2
    setIndicatorLeft(cardCenter)
  }, [episode, seasonData])

  const handleNextEp = () => {
    const nextEp = episode + 1
    if (seasonData?.episodes && nextEp <= seasonData.episodes.length) setEpisode(nextEp)
    else showToast('Fim da temporada', 'info')
  }

  const handlePrevEp = () => { if (episode > 1) setEpisode(episode - 1) }

  const getEmbedUrl = () => {
    if (!content) return ''
    if (type === 'movie') {
      const imdbId = content.external_ids?.imdb_id || content.imdb_id
      if (!imdbId) { showToast('ID IMDB não encontrado', 'error'); return '' }
      return `https://playerflixapi.com/filme/${imdbId}`
    }
    return `https://playerflixapi.com/serie/${id}/${season}/${episode}`
  }

  const handleNativeSeasonChange = (e) => {
    fetchSeason(id, parseInt(e.target.value))
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@300;400&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
          html { scroll-behavior: smooth; }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #050505; color: #f5f5f7;
            line-height: 1.6; font-size: 16px;
            min-height: 100vh; overflow-y: auto; overflow-x: hidden;
          }

          .site-wrapper {
            width: 100%; min-height: 100vh;
            background-size: cover; background-position: center;
            background-attachment: fixed; position: relative;
          }

          .site-wrapper::before {
            content: ''; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(5,5,5,0.4);
            backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
            pointer-events: none; z-index: 0;
          }

          .site-wrapper > * { position: relative; z-index: 1; }

          .loading-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            z-index: 9999; display: flex; align-items: center; justify-content: center;
            background: #000;
          }

          .loading-spinner { width: 48px; height: 48px; position: relative; }

          .loading-spinner span {
            position: absolute; top: 0; left: 50%;
            width: 3px; height: 11px; margin-left: -1.5px;
            border-radius: 999px; background: rgba(255,255,255,0.15);
            transform-origin: center 24px;
            animation: spinnerTick 1s linear infinite;
          }

          .loading-spinner span:nth-child(1)  { transform: rotate(0deg);   animation-delay: -0.917s; }
          .loading-spinner span:nth-child(2)  { transform: rotate(30deg);  animation-delay: -0.833s; }
          .loading-spinner span:nth-child(3)  { transform: rotate(60deg);  animation-delay: -0.750s; }
          .loading-spinner span:nth-child(4)  { transform: rotate(90deg);  animation-delay: -0.667s; }
          .loading-spinner span:nth-child(5)  { transform: rotate(120deg); animation-delay: -0.583s; }
          .loading-spinner span:nth-child(6)  { transform: rotate(150deg); animation-delay: -0.500s; }
          .loading-spinner span:nth-child(7)  { transform: rotate(180deg); animation-delay: -0.417s; }
          .loading-spinner span:nth-child(8)  { transform: rotate(210deg); animation-delay: -0.333s; }
          .loading-spinner span:nth-child(9)  { transform: rotate(240deg); animation-delay: -0.250s; }
          .loading-spinner span:nth-child(10) { transform: rotate(270deg); animation-delay: -0.167s; }
          .loading-spinner span:nth-child(11) { transform: rotate(300deg); animation-delay: -0.083s; }
          .loading-spinner span:nth-child(12) { transform: rotate(330deg); animation-delay: 0s;      }

          @keyframes spinnerTick {
            0%   { background: rgba(255,255,255,0.85); }
            100% { background: rgba(255,255,255,0.10); }
          }

          a { color: inherit; text-decoration: none; }
          button { font-family: inherit; border: none; outline: none; background: none; cursor: pointer; user-select: none; }
          img { max-width: 100%; height: auto; display: block; }

          :root {
            --pill-height: 44px; --pill-radius: 50px;
            --pill-max-width: 520px; --ios-blue: #0A84FF;
          }

          .glass-panel {
            position: relative;
            background: rgba(255,255,255,0.06);
            backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: inherit;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            overflow: hidden;
          }

          .bar-container {
            position: fixed; left: 50%; z-index: 1000;
            display: flex; align-items: center; justify-content: center;
            gap: 12px; width: 90%; max-width: var(--pill-max-width);
          }

          .top-bar { top: 20px; }
          .bottom-bar { bottom: 20px; }

          .round-btn {
            width: var(--pill-height); height: var(--pill-height);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            color: rgba(255,255,255,0.9); flex-shrink: 0;
          }

          .pill-container {
            height: var(--pill-height); flex: 1; border-radius: var(--pill-radius);
            display: flex; align-items: center; justify-content: center; position: relative;
          }

          .nav-btn {
            flex: 1; display: flex; align-items: center; justify-content: center;
            height: 100%; color: rgba(255,255,255,0.4);
            position: relative; z-index: 5;
          }

          .hide-toggle-pill-btn { color: rgba(255,255,255,0.6); }
          .nav-btn i { font-size: 18px; }

          .bar-label {
            font-size: 0.9rem; font-weight: 600; color: #fff;
            white-space: nowrap; letter-spacing: -0.01em;
            position: relative; z-index: 5; display: block;
          }

          .show-nav-btn {
            position: fixed; bottom: 20px; left: 50%;
            z-index: 999; width: 48px; height: 48px;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            color: rgba(255,255,255,0.9);
          }

          .standard-popup, .toast {
            position: fixed;
            top: calc(20px + var(--pill-height) + 16px);
            left: 50%; z-index: 960;
            min-width: 320px; max-width: 90%;
            display: flex; align-items: center; gap: 14px;
            padding: 16px 18px; border-radius: 22px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.6);
          }

          .standard-popup { z-index: 950; pointer-events: none; }
          .toast { z-index: 960; pointer-events: auto; }

          .popup-icon-wrapper, .toast-icon-wrapper {
            width: 42px; height: 42px; min-width: 42px;
            border-radius: 12px;
            display: flex; align-items: center; justify-content: center;
          }

          .popup-icon-wrapper.info  { background: linear-gradient(135deg,#34c759,#30d158); box-shadow: 0 4px 12px rgba(52,199,89,0.3); }
          .popup-icon-wrapper.tech  { background: linear-gradient(135deg,#0a84ff,#007aff); box-shadow: 0 4px 12px rgba(10,132,255,0.3); }
          .popup-icon-wrapper.synopsis { background: linear-gradient(135deg,#ff9500,#ff8c00); box-shadow: 0 4px 12px rgba(255,149,0,0.3); }
          .popup-icon-wrapper.data  { background: linear-gradient(135deg,#bf5af2,#a448e0); box-shadow: 0 4px 12px rgba(191,90,242,0.3); }

          .toast-icon-wrapper { border-radius: 50%; }
          .toast.success .toast-icon-wrapper { background: linear-gradient(135deg,#34c759,#30d158); box-shadow: 0 4px 12px rgba(52,199,89,0.3); }
          .toast.info    .toast-icon-wrapper { background: linear-gradient(135deg,#0a84ff,#007aff); box-shadow: 0 4px 12px rgba(10,132,255,0.3); }
          .toast.error   .toast-icon-wrapper { background: linear-gradient(135deg,#ff453a,#ff3b30); box-shadow: 0 4px 12px rgba(255,69,58,0.3); }

          .popup-icon-wrapper i, .toast-icon-wrapper i { font-size: 20px; color: #fff; }

          .popup-content, .toast-content {
            flex: 1; display: flex; flex-direction: column; gap: 4px;
            max-height: 60vh; overflow-y: auto;
          }

          .popup-title, .toast-title { font-size: 0.95rem; font-weight: 600; color: #fff; margin: 0; line-height: 1.3; }
          .popup-text,  .toast-msg   { font-size: 0.8rem; color: rgba(255,255,255,0.7); margin: 0; line-height: 1.4; }

          .toast-wrap {
            position: fixed;
            top: calc(20px + var(--pill-height) + 16px);
            left: 50%; z-index: 960; pointer-events: none;
          }

          .container {
            max-width: 1280px; margin: 0 auto;
            padding-top: 6.5rem; padding-bottom: 7rem;
            padding-left: 2rem; padding-right: 2rem;
          }

          .player-banner-container {
            width: 100%; aspect-ratio: 16/9; border-radius: 24px; overflow: hidden;
            position: relative; background-color: #1a1a1a;
            border: 1px solid rgba(255,255,255,0.15);
            margin-bottom: 24px; cursor: pointer;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -2px rgba(0,0,0,0.2);
          }

          .banner-image { width: 100%; height: 100%; object-fit: cover; }

          .play-button-static {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
            width: 64px; height: 64px; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px);
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            border: 1px solid rgba(255,255,255,0.3); z-index: 2;
          }

          .play-button-static i { color: #fff; font-size: 24px; margin-left: 4px; }

          .details-container {
            border-radius: 24px; padding: 18px;
            display: flex; flex-direction: column; gap: 16px;
            border: 1px solid rgba(255,255,255,0.15);
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -2px rgba(0,0,0,0.2);
            background: rgba(255,255,255,0.03);
          }

          .media-title { font-size: 1.15rem; font-weight: 700; color: #fff; line-height: 1.2; }
          .season-controls { display: flex; align-items: center; margin-top: 8px; }

          .native-season-select {
            appearance: none; -webkit-appearance: none;
            background: rgba(255,255,255,0.1) url('data:image/svg+xml;utf8,<svg fill="white" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>') no-repeat right 8px center;
            padding: 4px 28px 4px 10px; border-radius: 12px;
            font-size: 0.8rem; color: #fff; border: 1px solid rgba(255,255,255,0.1);
            cursor: pointer; font-family: inherit; outline: none; transition: background 0.2s;
          }

          .native-season-select:hover { background-color: rgba(255,255,255,0.15); }
          .native-season-select option { background: #1a1a1a; color: #fff; }

          .episodes-carousel {
            display: flex; gap: 10px; overflow-x: auto;
            padding: 10px 14px 28px 14px;
            scrollbar-width: none; margin: 0 -14px; position: relative;
          }

          .episodes-carousel::-webkit-scrollbar { display: none; }

          .ep-card {
            min-width: 110px; height: 65px;
            background-size: cover; background-position: center;
            border-radius: 10px; padding: 0;
            border: 1px solid rgba(255,255,255,0.15);
            cursor: pointer; position: relative; overflow: hidden;
            background-color: #1a1a1a;
          }

          .ep-card-info {
            position: relative; z-index: 2;
            width: 100%; height: 100%; padding: 6px 8px;
            display: flex; align-items: flex-start; justify-content: flex-start;
          }

          .ep-card.active { border: 1px solid rgba(255,255,255,0.4); }

          .ep-card-num {
            font-size: 0.8rem; font-weight: 700; color: #fff;
            background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
            padding: 2px 6px; border-radius: 4px;
          }

          .indicator-arrow {
            position: absolute; bottom: 4px;
            pointer-events: none; z-index: 10;
            transform: translateX(-50%);
            font-size: 13px; color: rgba(255,255,255,0.75); line-height: 1;
          }

          .no-image-placeholder {
            position: absolute; inset: 0;
            display: flex; align-items: center; justify-content: center;
            background: #111; color: rgba(255,255,255,0.2); font-size: 20px;
          }

          .player-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
            z-index: 2000; display: flex; align-items: center; justify-content: center;
          }

          .player-wrapper-vertical {
            display: flex; flex-direction: column; align-items: center;
            position: relative; width: auto;
          }

          .player-popup-container {
            position: relative; background: #000; border-radius: 20px; overflow: hidden;
            box-shadow: 0 0 60px rgba(0,0,0,0.9), 0 20px 60px rgba(10,132,255,0.15);
            border: 1.5px solid rgba(255,255,255,0.2);
            display: flex; align-items: center; justify-content: center;
          }

          .popup-size-square { width: min(70vw,40vh); height: min(70vw,40vh); aspect-ratio: 1/1; }
          .popup-size-banner { width: 80vw; max-width: 900px; aspect-ratio: 16/9; }

          .player-embed { width: 100%; height: 100%; border: none; }

          .player-header-controls {
            width: 100%; display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 20px;
          }

          .ep-indicator {
            font-size: 1rem; font-weight: 700; color: #fff;
            text-shadow: 0 2px 10px rgba(0,0,0,0.8);
            background: rgba(0,0,0,0.4); padding: 10px 20px; border-radius: 12px;
            backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.15);
          }

          .right-controls { display: flex; gap: 12px; }

          .control-btn {
            width: 48px; height: 48px; background: rgba(255,255,255,0.08); backdrop-filter: blur(10px);
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            color: rgba(255,255,255,0.9); border: 1px solid rgba(255,255,255,0.15);
            cursor: pointer; position: relative; overflow: hidden;
          }

          .control-btn i { font-size: 18px; }

          .player-bottom-controls {
            display: flex; justify-content: center; gap: 20px; margin-top: 20px;
          }

          .nav-ep-btn {
            background: rgba(255,255,255,0.08); padding: 12px 32px; border-radius: 50px;
            color: rgba(255,255,255,0.9); font-weight: 600; font-size: 0.95rem;
            display: flex; align-items: center; gap: 10px;
            backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.15);
            cursor: pointer;
          }

          .nav-ep-btn:disabled { opacity: 0.4; cursor: not-allowed; }
          .nav-ep-btn i { font-size: 16px; }

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
            label={scrolled ? 'Reproduzindo' : 'Yoshikawa'}
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

          <AnimatePresence>
            {showSynopsisPopup && (
              <motion.div
                className="standard-popup glass-panel"
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, y: -20, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.9 }}
                transition={SP.bouncy}
                style={{ originY: 0 }}
              >
                <motion.div className="popup-icon-wrapper synopsis" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...SP.bouncy, delay: 0.05 }}>
                  <i className="fas fa-align-left"></i>
                </motion.div>
                <motion.div className="popup-content" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ ...SP.gentle, delay: 0.1 }}>
                  <p className="popup-title">Sinopse</p>
                  <p className="popup-text">{type === 'tv' && currentEpisodeData?.overview ? currentEpisodeData.overview : content?.overview || 'Sinopse indisponível.'}</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showDataPopup && (
              <motion.div
                className="standard-popup glass-panel"
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, y: -20, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.9 }}
                transition={SP.bouncy}
                style={{ originY: 0 }}
              >
                <motion.div className="popup-icon-wrapper data" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...SP.bouncy, delay: 0.05 }}>
                  <i className="fas fa-film"></i>
                </motion.div>
                <motion.div className="popup-content" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ ...SP.gentle, delay: 0.1 }}>
                  <p className="popup-title">Ficha Técnica</p>
                  <div className="popup-text">
                    <strong>Lançamento:</strong> {releaseDate.split('-').reverse().join('/')}<br/>
                    <strong>Avaliação:</strong> {rating} ⭐<br/>
                    <strong>Gêneros:</strong> {genres}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <main className="container">
            <motion.div
              className="player-banner-container"
              onClick={() => setIsPlaying(true)}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.005 }}
              transition={SP.snappy}
              style={{
                backgroundImage: currentEpisodeData?.still_path
                  ? `url(https://image.tmdb.org/t/p/original${currentEpisodeData.still_path})`
                  : content.backdrop_path
                    ? `url(https://image.tmdb.org/t/p/original${content.backdrop_path})`
                    : `url(${DEFAULT_BACKDROP})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
              }}
            >
              <motion.div
                className="play-button-static"
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
                transition={SP.bouncy}
              >
                <i className="fas fa-play"></i>
              </motion.div>
            </motion.div>

            <div className="glass-panel details-container">
              <div className="text-left">
                <h2 className="media-title">{content.title || content.name}</h2>
              </div>

              {type === 'tv' && (
                <>
                  <div className="season-controls">
                    <select className="native-season-select" value={season} onChange={handleNativeSeasonChange}>
                      {Array.from({ length: content?.number_of_seasons || 1 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>Temporada {num}</option>
                      ))}
                    </select>
                  </div>

                  <div className="episodes-carousel" ref={carouselRef}>
                    {indicatorLeft !== null && <IndicatorArrow left={indicatorLeft} />}

                    {seasonData?.episodes ? seasonData.episodes.map(ep => (
                      <motion.div
                        key={ep.id}
                        className={`ep-card ${ep.episode_number === episode ? 'active' : ''}`}
                        onClick={() => setEpisode(ep.episode_number)}
                        whileTap={{ scale: 0.93 }}
                        whileHover={{ scale: 1.05, borderColor: 'rgba(255,255,255,0.4)' }}
                        transition={SP.bouncy}
                        style={{
                          backgroundImage: ep.still_path ? `url(https://image.tmdb.org/t/p/w300${ep.still_path})` : 'none',
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
                      </motion.div>
                    )) : (
                      <div style={{ color: '#666', fontSize: '0.8rem', paddingLeft: '8px' }}>Carregando...</div>
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

          <AnimatePresence>
            {navHidden && (
              <motion.button
                className="show-nav-btn glass-panel"
                onClick={toggleNavVisibility}
                title="Mostrar Navegação"
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 80, opacity: 0 }}
                transition={SP.ios}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.08, background: 'rgba(255,255,255,0.12)' }}
                style={{ x: '-50%' }}
              >
                <i className="fas fa-chevron-up"></i>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {isPlaying && (
          <motion.div
            className="player-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <motion.div
              className="player-wrapper-vertical"
              initial={{ y: 50, opacity: 0, scale: 0.92 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0, scale: 0.95 }}
              transition={SP.bouncy}
            >
              <motion.div
                className="player-header-controls"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SP.gentle, delay: 0.08 }}
              >
                <span className="ep-indicator">
                  {type === 'tv' ? `S${season}:E${episode}` : 'FILME'}
                </span>
                <div className="right-controls">
                  <motion.button
                    className="control-btn"
                    onClick={() => setIsWideMode(!isWideMode)}
                    title="Alterar Formato"
                    whileTap={{ scale: 0.88 }}
                    whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.15)' }}
                    transition={SP.bouncy}
                  >
                    <AnimatePresence mode="wait">
                      <motion.i
                        key={isWideMode ? 'compress' : 'expand'}
                        className={isWideMode ? 'fas fa-compress' : 'fas fa-expand'}
                        initial={{ opacity: 0, rotate: -30, scale: 0.5 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, rotate: 30, scale: 0.5 }}
                        transition={SP.bouncy}
                      />
                    </AnimatePresence>
                  </motion.button>
                  <motion.button
                    className="control-btn"
                    onClick={() => setIsPlaying(false)}
                    title="Fechar"
                    whileTap={{ scale: 0.88 }}
                    whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.15)' }}
                    transition={SP.bouncy}
                  >
                    <i className="fas fa-xmark"></i>
                  </motion.button>
                </div>
              </motion.div>

              <motion.div
                className={`player-popup-container ${isWideMode ? 'popup-size-banner' : 'popup-size-square'}`}
                layout
                transition={SP.ios}
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...SP.bouncy, delay: 0.06 }}
              >
                <motion.iframe
                  src={getEmbedUrl()}
                  className="player-embed"
                  frameBorder="0"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  referrerPolicy="origin"
                  title="Player"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                />
              </motion.div>

              {type === 'tv' && (
                <motion.div
                  className="player-bottom-controls"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...SP.gentle, delay: 0.14 }}
                >
                  <motion.button
                    className="nav-ep-btn glass-panel"
                    onClick={handlePrevEp}
                    disabled={episode === 1}
                    whileTap={{ scale: 0.93 }}
                    whileHover={{ scale: 1.06, background: 'rgba(255,255,255,0.15)' }}
                    transition={SP.bouncy}
                  >
                    <i className="fas fa-backward-step"></i> Ant
                  </motion.button>
                  <motion.button
                    className="nav-ep-btn glass-panel"
                    onClick={handleNextEp}
                    whileTap={{ scale: 0.93 }}
                    whileHover={{ scale: 1.06, background: 'rgba(255,255,255,0.15)' }}
                    transition={SP.bouncy}
                  >
                    Prox <i className="fas fa-forward-step"></i>
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
