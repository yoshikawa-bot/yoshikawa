import { useRouter } from 'next/router'
import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'

const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
const STREAM_BASE_URL = 'https://superflixapi.blog'

/* --- COMPONENTES UI REUTILIZADOS DA HOME --- */

const Header = ({ label, scrolled, goBack, toggleInfo, infoActive }) => {
  return (
    <header className="header-pill">
      <button 
        className="header-btn-left" 
        onClick={goBack}
        title="Voltar"
      >
        <i className="fas fa-arrow-left"></i>
      </button>

      <div className="header-center">
        <span className="header-label">{label}</span>
      </div>

      <button 
        className={`header-btn-right ${infoActive ? 'active-icon' : ''}`}
        title="Detalhes da Série"
        onClick={toggleInfo}
      >
        <i className="fas fa-info-circle"></i>
      </button>
    </header>
  )
}

const ToastContainer = ({ toast, closeToast }) => {
  if (!toast) return null
  return (
    <div className="toast-wrap">
      <div className={`toast ${toast.type} ${toast.closing ? 'closing' : ''}`} onClick={closeToast}>
        <div className="toast-icon">
          <i className={`fas ${toast.type === 'success' ? 'fa-check' : toast.type === 'error' ? 'fa-exclamation-triangle' : 'fa-info'}`}></i>
        </div>
        <div className="toast-msg">{toast.message}</div>
      </div>
    </div>
  )
}

const BottomNav = ({ 
  isFavorite, 
  toggleFavorite, 
  togglePlayerMenu, 
  playerMenuActive,
  selectedPlayer 
}) => (
  <div className="bottom-nav">
    <div className="nav-pill">
      <div className="nav-content-row">
        <Link href="/" className="nav-btn">
          <i className="fas fa-home"></i>
        </Link>
        
        <button 
          className={`nav-btn ${isFavorite ? 'active-heart' : ''}`} 
          onClick={toggleFavorite}
        >
          <i className={isFavorite ? "fas fa-heart" : "far fa-heart"}></i>
        </button>
      </div>
    </div>
    <button 
      className={`search-circle ${playerMenuActive ? 'active' : ''}`} 
      onClick={togglePlayerMenu}
      title="Trocar Player"
    >
      <i className={selectedPlayer === 'superflix' ? 'fas fa-film' : 'fas fa-bolt'}></i>
    </button>
  </div>
)

/* --- PÁGINA PRINCIPAL --- */

export default function TVShow() {
  const router = useRouter()
  const { id } = router.query
  
  // Dados
  const [tvShow, setTvShow] = useState(null)
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [seasonDetails, setSeasonDetails] = useState(null)
  
  // UI States
  const [loading, setLoading] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [showVideoPlayer, setShowVideoPlayer] = useState(false)
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [showPlayerMenu, setShowPlayerMenu] = useState(false)
  const [closingPopup, setClosingPopup] = useState(null) // 'info' or 'player'
  const [isWideScreen, setIsWideScreen] = useState(false)
  
  // Player & Fav
  const [selectedPlayer, setSelectedPlayer] = useState('superflix')
  const [isFavorite, setIsFavorite] = useState(false)
  
  // Toast
  const [currentToast, setCurrentToast] = useState(null)
  const toastTimerRef = useRef(null)
  const episodeListRef = useRef(null)

  // --- EFEITOS ---

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (id) {
      loadTvShow(id)
      checkIfFavorite()
    }
  }, [id])

  // Scroll automático para o episódio ativo na lista
  useEffect(() => {
    if (episodeListRef.current && seasonDetails) {
      const activeCard = episodeListRef.current.querySelector('.episode-card.active')
      if (activeCard) {
        activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [episode, seasonDetails])

  useEffect(() => {
    if (showVideoPlayer) {
      document.body.style.overflow = 'hidden'
      const handleResize = () => setIsWideScreen(window.innerWidth > window.innerHeight)
      handleResize()
      window.addEventListener('resize', handleResize)
      return () => {
        window.removeEventListener('resize', handleResize)
        document.body.style.overflow = 'auto'
      }
    }
  }, [showVideoPlayer])

  // --- LOGICA DE DADOS ---

  const showToast = (message, type = 'info') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setCurrentToast({ message, type, id: Date.now(), closing: false })
    toastTimerRef.current = setTimeout(() => {
      setCurrentToast(prev => prev ? { ...prev, closing: true } : null)
      setTimeout(() => setCurrentToast(null), 400)
    }, 3000)
  }

  const loadTvShow = async (tvId) => {
    try {
      setLoading(true)
      const res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}?api_key=${TMDB_API_KEY}&language=pt-BR`)
      if (!res.ok) throw new Error('Série não encontrada')
      const data = await res.json()
      setTvShow(data)
      
      if (data.seasons?.length > 0) {
        // Tenta pegar a temporada 1 ou a primeira disponível > 0
        const firstSeason = data.seasons.find(s => s.season_number === 1) || data.seasons.find(s => s.season_number > 0) || data.seasons[0]
        if (firstSeason) {
          setSeason(firstSeason.season_number)
          await loadSeasonDetails(tvId, firstSeason.season_number)
        }
      }
    } catch (err) {
      showToast('Erro ao carregar série', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadSeasonDetails = async (tvId, seasonNumber) => {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=pt-BR`)
      if (res.ok) {
        const data = await res.json()
        setSeasonDetails(data)
        // Se mudou de temporada, volta para ep 1 se possível
        if (data.episodes?.length > 0) {
            // Verifica se o episódio atual existe na nova temporada, senão reseta
            const epExists = data.episodes.find(e => e.episode_number === episode)
            if (!epExists) setEpisode(1)
        }
      }
    } catch {
      setSeasonDetails(null)
    }
  }

  // --- LOGICA DE UI ---

  const handleClosePopups = () => {
    if (showInfoPopup) {
        setClosingPopup('info')
        setTimeout(() => { setShowInfoPopup(false); setClosingPopup(null) }, 300)
    }
    if (showPlayerMenu) {
        setClosingPopup('player')
        setTimeout(() => { setShowPlayerMenu(false); setClosingPopup(null) }, 300)
    }
  }

  const toggleInfo = (e) => {
    e.stopPropagation()
    if (showPlayerMenu) handleClosePopups()
    
    if (showInfoPopup) handleClosePopups()
    else setShowInfoPopup(true)
  }

  const togglePlayerMenu = (e) => {
    e.stopPropagation()
    if (showInfoPopup) handleClosePopups()

    if (showPlayerMenu) handleClosePopups()
    else setShowPlayerMenu(true)
  }

  const handleSeasonChange = async (e) => {
    const newSeason = parseInt(e.target.value)
    setSeason(newSeason)
    await loadSeasonDetails(id, newSeason)
  }

  const changePlayer = (type) => {
    setSelectedPlayer(type)
    showToast(`Player alterado para ${type === 'superflix' ? 'SuperFlix' : 'VidSrc'}`, 'success')
    handleClosePopups()
    if (showVideoPlayer) {
        // Reinicia o player visualmente
        setShowVideoPlayer(false)
        setTimeout(() => setShowVideoPlayer(true), 200)
    }
  }

  const checkIfFavorite = () => {
    try {
      const stored = localStorage.getItem('yoshikawaFavorites')
      if (stored) {
        const favs = JSON.parse(stored)
        setIsFavorite(favs.some(f => f.id === parseInt(id) && f.media_type === 'tv'))
      }
    } catch {}
  }

  const toggleFavorite = () => {
    try {
      const stored = localStorage.getItem('yoshikawaFavorites')
      let favs = stored ? JSON.parse(stored) : []
      
      if (isFavorite) {
        favs = favs.filter(f => !(f.id === parseInt(id) && f.media_type === 'tv'))
        showToast('Removido dos favoritos', 'info')
        setIsFavorite(false)
      } else {
        favs.push({
          id: parseInt(id),
          media_type: 'tv',
          title: tvShow.name,
          poster_path: tvShow.poster_path
        })
        showToast('Adicionado aos favoritos', 'success')
        setIsFavorite(true)
      }
      localStorage.setItem('yoshikawaFavorites', JSON.stringify(favs))
    } catch {
      showToast('Erro ao salvar', 'error')
    }
  }

  const getPlayerUrl = () => {
    if (selectedPlayer === 'superflix') {
      return `${STREAM_BASE_URL}/serie/${id}/${season}/${episode}#noEpList#noLink#transparent#noBackground`
    }
    return `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`
  }

  // Render Helpers
  if (loading && !tvShow) return (
    <div style={{display:'flex', height:'100vh', alignItems:'center', justifyContent:'center', background:'#000', color:'#fff'}}>
        <div className="spinner" style={{width: 40, height: 40, border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#ff6b6b', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
  
  if (!tvShow) return null

  const currentEpData = seasonDetails?.episodes?.find(e => e.episode_number === episode)
  const backdropUrl = currentEpData?.still_path 
    ? `https://image.tmdb.org/t/p/original${currentEpData.still_path}`
    : (tvShow.backdrop_path ? `https://image.tmdb.org/t/p/original${tvShow.backdrop_path}` : null)

  const headerLabel = scrolled ? tvShow.name : `S${season} : E${episode}`

  return (
    <>
      <Head>
        <title>{tvShow.name} - Yoshikawa Player</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        {/* INJECTED CSS FROM HOME PAGE + TV SPECIFIC STYLES */}
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; background: #000; color: #f1f5f9; line-height: 1.6; overflow-x: hidden; }
          select, button { font-family: inherit; }
          
          :root {
            --pill-height: 62px;
            --pill-radius: 44px;
            --pill-bg: rgba(35, 35, 35, 0.65);
            --pill-border: 1px solid rgba(255, 255, 255, 0.15);
            --pill-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
            --pill-blur: blur(20px);
            --pill-max-width: 680px;
            --accent: #ff6b6b;
          }

          /* --- HEADER --- */
          .header-pill {
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 1000;
            display: flex; align-items: center; justify-content: space-between;
            height: var(--pill-height); width: 90%; max-width: var(--pill-max-width);
            padding: 0 0.8rem; border-radius: var(--pill-radius); border: var(--pill-border);
            background: var(--pill-bg); backdrop-filter: var(--pill-blur); -webkit-backdrop-filter: var(--pill-blur);
            box-shadow: var(--pill-shadow);
          }
          .header-btn-left, .header-btn-right {
            background: none; border: none; color: rgba(255,255,255,0.5); font-size: 1.2rem;
            cursor: pointer; display: flex; align-items: center; justify-content: center;
            width: 44px; height: 44px; border-radius: 50%; transition: 0.2s ease; z-index: 2;
          }
          .header-btn-left:hover, .header-btn-right:hover, .active-icon { color: #fff; transform: scale(1.05); }
          .active-icon { color: var(--accent); }
          
          .header-center {
            position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
            width: 60%; text-align: center; pointer-events: none;
          }
          .header-label { font-size: 1rem; font-weight: 600; color: #f0f6fc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }

          /* --- CONTAINER MAIN --- */
          .container {
            max-width: 1280px; margin: 0 auto;
            padding-top: calc(var(--pill-height) + 40px);
            padding-bottom: 8rem; padding-left: 2rem; padding-right: 2rem;
          }

          /* --- HERO / PLAYER AREA --- */
          .hero-wrapper {
            display: block; width: 100%; aspect-ratio: 16 / 9; max-height: 550px;
            position: relative; border-radius: 24px; overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
            margin-bottom: 2rem; cursor: pointer; group;
          }
          .hero-wrapper img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; opacity: 0.8; }
          .hero-wrapper:hover img { transform: scale(1.02); opacity: 0.6; }
          
          .play-overlay {
            position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 2;
          }
          .play-btn {
            width: 70px; height: 70px; border-radius: 50%;
            background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.3);
            display: flex; align-items: center; justify-content: center;
            color: #fff; font-size: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.3s;
          }
          .play-btn { padding-left: 4px; } /* Optical adjust for play icon */
          .hero-wrapper:hover .play-btn { transform: scale(1.15); background: var(--accent); border-color: var(--accent); }

          .hero-content {
            position: absolute; bottom: 0; left: 0; width: 100%; padding: 2rem; z-index: 2;
            background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
            pointer-events: none;
          }
          .hero-title { font-size: 2rem; font-weight: 800; color: #fff; line-height: 1.2; text-shadow: 0 2px 10px rgba(0,0,0,0.5); margin-bottom: 4px; }
          .hero-meta { color: rgba(255,255,255,0.7); font-size: 0.9rem; font-weight: 500; }

          /* --- CONTROLS ROW --- */
          .controls-row {
            display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 10px;
          }
          .ep-title { font-size: 1.4rem; font-weight: 600; color: #f1f5f9; }
          
          .season-select {
            appearance: none; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15);
            color: #fff; padding: 10px 35px 10px 15px; border-radius: 12px;
            font-size: 0.9rem; font-weight: 500; outline: none; cursor: pointer;
            background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
            background-repeat: no-repeat; background-position: right 12px top 50%; background-size: 10px auto;
            transition: border-color 0.2s;
          }
          .season-select:hover { border-color: rgba(255,255,255,0.3); }

          /* --- EPISODE LIST --- */
          .ep-scroller {
            display: flex; gap: 14px; overflow-x: auto; padding-bottom: 20px;
            scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.3) rgba(255,255,255,0.05);
          }
          .ep-scroller::-webkit-scrollbar { height: 6px; }
          .ep-scroller::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 3px; }
          .ep-scroller::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 3px; }
          
          .episode-card {
            min-width: 160px; width: 160px; cursor: pointer;
            display: flex; flex-direction: column; gap: 8px;
            opacity: 0.6; transition: opacity 0.3s, transform 0.3s;
          }
          .episode-card:hover { opacity: 0.9; transform: translateY(-4px); }
          .episode-card.active { opacity: 1; transform: translateY(0); }
          
          .ep-thumb-wrapper {
            position: relative; width: 100%; aspect-ratio: 16/9;
            border-radius: 12px; overflow: hidden; background: #1e1e1e;
            border: 2px solid transparent; transition: border-color 0.3s;
          }
          .episode-card.active .ep-thumb-wrapper { border-color: var(--accent); box-shadow: 0 0 15px rgba(255, 107, 107, 0.2); }
          
          .ep-img { width: 100%; height: 100%; object-fit: cover; }
          .ep-badge {
            position: absolute; top: 6px; left: 6px;
            background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
            padding: 2px 6px; border-radius: 6px; font-size: 0.7rem; font-weight: 700;
          }
          .ep-info-h { font-size: 0.85rem; font-weight: 500; line-height: 1.3; color: #cbd5e1;
            display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
          }
          .episode-card.active .ep-info-h { color: #fff; font-weight: 600; }

          /* --- POPUPS (Info & Player Menu) --- */
          .popup-bubble {
            position: fixed; top: calc(20px + var(--pill-height) + 10px); right: 50%; transform: translateX(50%);
            z-index: 900; width: 90%; max-width: 380px;
            padding: 1.2rem; border-radius: 24px;
            border: var(--pill-border); background: var(--pill-bg);
            backdrop-filter: var(--pill-blur); -webkit-backdrop-filter: var(--pill-blur);
            box-shadow: var(--pill-shadow);
            animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .popup-bubble.closing { animation: slideOut 0.2s forwards; }
          
          @keyframes slideIn { from { opacity: 0; transform: translate(50%, -10px); } to { opacity: 1; transform: translate(50%, 0); } }
          @keyframes slideOut { to { opacity: 0; transform: translate(50%, -10px); } }

          /* Ajuste para mobile onde o right 50% pode centralizar estranho, usar left */
          @media (max-width: 768px) {
             .popup-bubble { right: auto; left: 50%; transform: translateX(-50%); }
             @keyframes slideIn { from { opacity: 0; transform: translate(-50%, -10px); } to { opacity: 1; transform: translate(-50%, 0); } }
             @keyframes slideOut { to { opacity: 0; transform: translate(-50%, -10px); } }
          }
          
          .popup-header { display: flex; gap: 15px; align-items: flex-start; margin-bottom: 1rem; }
          .popup-poster { width: 70px; border-radius: 8px; aspect-ratio: 2/3; object-fit: cover; }
          .popup-meta h3 { font-size: 1.1rem; margin-bottom: 4px; line-height: 1.2; }
          .popup-meta p { font-size: 0.8rem; color: rgba(255,255,255,0.6); margin-bottom: 2px; }
          .popup-desc { font-size: 0.85rem; color: rgba(255,255,255,0.8); line-height: 1.5; max-height: 100px; overflow-y: auto; }

          .player-option {
            display: flex; align-items: center; gap: 12px; padding: 12px;
            border-radius: 12px; cursor: pointer; transition: background 0.2s;
            border: 1px solid transparent;
          }
          .player-option:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); }
          .player-option.active { border-color: var(--accent); background: rgba(255, 107, 107, 0.1); }
          .p-icon { width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; }
          .p-info h4 { font-size: 0.95rem; margin-bottom: 2px; }
          .p-info span { font-size: 0.75rem; color: rgba(255,255,255,0.5); }
          .tag { font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; background: #333; margin-left: auto; }
          .tag.dub { background: #3b82f6; color: #fff; }
          .tag.leg { background: #eab308; color: #000; }

          /* --- VIDEO OVERLAY --- */
          .video-overlay {
            position: fixed; inset: 0; z-index: 2000; background: #000;
            display: flex; align-items: center; justify-content: center;
            animation: fadeIn 0.3s ease;
          }
          .video-container { position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; }
          .video-frame { flex: 1; width: 100%; height: 100%; border: none; }
          .video-header {
            position: absolute; top: 0; left: 0; width: 100%; padding: 20px;
            display: flex; justify-content: space-between; align-items: center;
            background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
            pointer-events: none; z-index: 5;
          }
          .video-header button { pointer-events: auto; }
          .close-video {
            background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
            color: #fff; width: 40px; height: 40px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center; cursor: pointer;
            backdrop-filter: blur(5px);
          }
          .close-video:hover { background: var(--accent); border-color: var(--accent); }

          /* --- BOTTOM NAV --- */
          .bottom-nav {
            position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
            display: flex; align-items: center; gap: 12px; z-index: 1000;
            width: 90%; max-width: var(--pill-max-width);
          }
          .nav-pill {
            flex: 1; height: var(--pill-height); border-radius: var(--pill-radius);
            border: var(--pill-border); background: var(--pill-bg);
            backdrop-filter: var(--pill-blur); -webkit-backdrop-filter: var(--pill-blur);
            box-shadow: var(--pill-shadow); padding: 0 1.5rem;
            display: flex; align-items: center; justify-content: center;
          }
          .nav-content-row { display: flex; align-items: center; gap: 3rem; width: 100%; justify-content: space-around; }
          .nav-btn {
            background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.5);
            font-size: 1.4rem; transition: transform 0.2s, color 0.2s;
          }
          .nav-btn:hover { color: #fff; transform: scale(1.1); }
          .active-heart { color: var(--accent); }
          
          .search-circle {
            width: var(--pill-height); height: var(--pill-height); border-radius: 50%;
            border: var(--pill-border); background: var(--pill-bg);
            backdrop-filter: var(--pill-blur); -webkit-backdrop-filter: var(--pill-blur);
            box-shadow: var(--pill-shadow); display: flex; align-items: center; justify-content: center;
            cursor: pointer; color: rgba(255,255,255,0.7); font-size: 1.3rem;
            transition: 0.2s; flex-shrink: 0;
          }
          .search-circle:hover, .search-circle.active { background: rgba(60,60,60,0.8); color: #fff; transform: scale(1.05); }

          /* --- TOAST --- */
          .toast-wrap {
            position: fixed; bottom: calc(20px + var(--pill-height) + 12px);
            left: 50%; transform: translateX(-50%); z-index: 990;
            display: flex; flex-direction: column; align-items: center; pointer-events: none; width: 90%;
          }
          .toast {
            pointer-events: auto; display: flex; align-items: center; gap: 12px; padding: 0 1.5rem;
            height: 48px; border-radius: 30px; border: var(--pill-border); background: var(--pill-bg);
            backdrop-filter: var(--pill-blur); -webkit-backdrop-filter: var(--pill-blur);
            box-shadow: 0 4px 20px rgba(0,0,0,0.6); animation: toastIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }
          .toast.closing { animation: toastOut 0.4s forwards; }
          .toast-icon { width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; }
          .toast.success .toast-icon { background:#10b981; color:#fff; }
          .toast.info .toast-icon { background:#4dabf7; color:#fff; }
          .toast.error .toast-icon { background:#ef4444; color:#fff; }
          .toast-msg { font-size:13px; color:#fff; font-weight:500; }
          
          @keyframes toastIn { from { opacity:0; transform:translateY(60px) scale(0.6); } to { opacity:1; transform:translateY(0) scale(1); } }
          @keyframes toastOut { to { opacity:0; transform:translateY(60px) scale(0.6); } }

          /* --- RESPONSIVE --- */
          @media (max-width: 768px) {
            :root { --pill-height: 56px; }
            .container { padding-left: 1.5rem; padding-right: 1.5rem; }
            .hero-title { font-size: 1.5rem; }
            .controls-row { margin-bottom: 1rem; }
            .ep-title { font-size: 1.1rem; }
            .header-pill, .bottom-nav { width: 92%; }
            .hero-wrapper { aspect-ratio: 4/3; border-radius: 16px; }
          }
        `}</style>
      </Head>

      {/* --- HEADER --- */}
      <Header
        label={headerLabel}
        scrolled={scrolled}
        goBack={() => router.push('/')}
        toggleInfo={toggleInfo}
        infoActive={showInfoPopup}
      />

      {/* --- POPUPS --- */}
      {showInfoPopup && (
        <div 
          className={`popup-bubble ${closingPopup === 'info' ? 'closing' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="popup-header">
             <img src={`https://image.tmdb.org/t/p/w200${tvShow.poster_path}`} alt="poster" className="popup-poster" />
             <div className="popup-meta">
               <h3>{tvShow.name}</h3>
               <p>{tvShow.number_of_seasons} Temporadas</p>
               <p>{new Date(tvShow.first_air_date).getFullYear()}</p>
             </div>
          </div>
          <div className="popup-desc">
            {tvShow.overview || "Sem descrição disponível."}
          </div>
        </div>
      )}

      {showPlayerMenu && (
        <div 
          className={`popup-bubble ${closingPopup === 'player' ? 'closing' : ''}`}
          onClick={(e) => e.stopPropagation()}
          style={{ bottom: '100px', top: 'auto', right: '50%', transform: 'translateX(50%)' }} // Override para aparecer em baixo
        >
           <h4 style={{marginBottom: '10px', opacity: 0.7, fontSize: '0.8rem', textTransform: 'uppercase'}}>Selecionar Fonte</h4>
           <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
             <div className={`player-option ${selectedPlayer === 'superflix' ? 'active' : ''}`} onClick={() => changePlayer('superflix')}>
                <div className="p-icon"><i className="fas fa-film"></i></div>
                <div className="p-info">
                    <h4>SuperFlix</h4>
                    <span>Recomendado (Estável)</span>
                </div>
                <span className="tag dub">DUB</span>
             </div>
             <div className={`player-option ${selectedPlayer === 'vidsrc' ? 'active' : ''}`} onClick={() => changePlayer('vidsrc')}>
                <div className="p-icon"><i className="fas fa-bolt"></i></div>
                <div className="p-info">
                    <h4>VidSrc</h4>
                    <span>Alternativo (Rápido)</span>
                </div>
                <span className="tag leg">LEG</span>
             </div>
           </div>
        </div>
      )}

      <ToastContainer toast={currentToast} closeToast={() => setCurrentToast(null)} />

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <main className="container" onClick={handleClosePopups}>
        
        {/* PLAYER HERO CARD */}
        <div className="hero-wrapper" onClick={() => setShowVideoPlayer(true)}>
          <img src={backdropUrl || 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'} alt="Backdrop" />
          <div className="play-overlay">
            <div className="play-btn">
                <i className="fas fa-play"></i>
            </div>
          </div>
          <div className="hero-content">
             <div className="hero-meta">Temporada {season} | Episódio {episode}</div>
             <h1 className="hero-title">{currentEpData?.name || `Episódio ${episode}`}</h1>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="controls-row">
            <h2 className="ep-title">Episódios</h2>
            <select 
                className="season-select" 
                value={season} 
                onChange={handleSeasonChange}
            >
                {tvShow.seasons?.filter(s => s.season_number > 0).map(s => (
                    <option key={s.id} value={s.season_number}>Temporada {s.season_number}</option>
                ))}
            </select>
        </div>

        {/* EPISODES LIST */}
        <div className="ep-scroller" ref={episodeListRef}>
            {seasonDetails?.episodes?.map(ep => (
                <div 
                    key={ep.id} 
                    className={`episode-card ${ep.episode_number === episode ? 'active' : ''}`}
                    onClick={() => { setEpisode(ep.episode_number); window.scrollTo({top: 0, behavior:'smooth'}); }}
                >
                    <div className="ep-thumb-wrapper">
                        {ep.still_path ? (
                            <img src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} className="ep-img" loading="lazy" />
                        ) : (
                            <div style={{width:'100%', height:'100%', background:'#333', display:'flex', alignItems:'center', justifyContent:'center'}}>
                                <i className="fas fa-image" style={{opacity:0.3}}></i>
                            </div>
                        )}
                        <span className="ep-badge">EP {ep.episode_number}</span>
                    </div>
                    <span className="ep-info-h">{ep.name}</span>
                </div>
            )) || <div style={{opacity:0.5, padding:'20px'}}>Carregando episódios...</div>}
        </div>

      </main>

      {/* --- VIDEO PLAYER OVERLAY --- */}
      {showVideoPlayer && (
        <div className="video-overlay" onClick={() => setShowVideoPlayer(false)}>
            <div className="video-container" onClick={e => e.stopPropagation()}>
                <div className="video-header">
                    <span style={{fontWeight:700, textShadow:'0 2px 4px #000'}}>S{season}:E{episode} - {selectedPlayer === 'superflix' ? 'SuperFlix' : 'VidSrc'}</span>
                    <button className="close-video" onClick={() => setShowVideoPlayer(false)}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <iframe 
                    src={getPlayerUrl()} 
                    className="video-frame" 
                    allowFullScreen 
                    allow="autoplay; encrypted-media"
                    title="Player"
                ></iframe>
            </div>
        </div>
      )}

      {/* --- FOOTER NAV --- */}
      <BottomNav 
        isFavorite={isFavorite}
        toggleFavorite={toggleFavorite}
        togglePlayerMenu={togglePlayerMenu}
        playerMenuActive={showPlayerMenu}
        selectedPlayer={selectedPlayer}
      />
    </>
  )
}
