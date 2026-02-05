import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

// --- CONFIGURAÇÕES ---
const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287' // Sua chave
const SUPERFLIX_URL = 'https://superflixapi.cv' // API Atualizada

// --- COMPONENTES AUXILIARES (IDÊNTICOS À HOME) ---

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

      {/* POPUP INFO */}
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
            <p className="popup-text">Use <strong>Brave</strong> ou <strong>AdBlock</strong> para evitar anúncios do player.</p>
          </div>
        </div>
      )}

      {/* POPUP TECH */}
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
            <p className="popup-text">v2.8.0 Pro • SuperFlix API • TMDB</p>
          </div>
        </div>
      )}
    </>
  )
}

export const BottomNav = ({ isFavorite, toggleFavorite }) => {
  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Yoshikawa Player', url: window.location.href }) } 
      catch (err) { console.log('Share canceled') }
    } else { alert('Link copiado para a área de transferência!') }
  }

  return (
    <div className="bar-container bottom-bar">
      <button className="round-btn glass-panel" onClick={handleShare} title="Compartilhar">
        <i className="fas fa-arrow-up-from-bracket" style={{ fontSize: '15px', transform: 'translateY(-1px)' }}></i>
      </button>

      <div className="pill-container glass-panel">
         <Link href="/" className={`nav-btn`}>
            <i className="fas fa-home"></i>
         </Link>
      </div>

      {/* BOTÃO FAVORITAR (CORAÇÃO) */}
      <button className="round-btn glass-panel" onClick={toggleFavorite}>
        <i className={isFavorite ? 'fas fa-heart' : 'far fa-heart'} style={{ fontSize: '16px', color: isFavorite ? '#ff3b30' : '#fff' }}></i>
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

// --- PÁGINA PRINCIPAL ---

export default function WatchPage() {
  const router = useRouter()
  const { type, id } = router.query 
  
  // UI States
  const [scrolled, setScrolled] = useState(false)
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [infoClosing, setInfoClosing] = useState(false)
  const [showTechPopup, setShowTechPopup] = useState(false)
  const [techClosing, setTechClosing] = useState(false)
  const [currentToast, setCurrentToast] = useState(null)
  
  // Content States
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showSynopsis, setShowSynopsis] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  
  // Series Specific
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [seasonData, setSeasonData] = useState(null)
  const [showSeasonList, setShowSeasonList] = useState(false)
  
  // Refs
  const episodesRef = useRef(null)

  // --- FUNÇÕES DE AJUDA ---
  const triggerToast = (type, message) => {
    setCurrentToast({ type, message, closing: false })
    setTimeout(() => {
        setCurrentToast(prev => prev ? { ...prev, closing: true } : null)
        setTimeout(() => setCurrentToast(null), 400) // Tempo da animação de saída
    }, 3000)
  }

  // --- FETCHING ---
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
      } catch (error) {
        console.error("Erro ao carregar", error)
        triggerToast('error', 'Falha ao carregar detalhes.')
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
        setShowSeasonList(false) // Fecha o menu se estiver aberto
      } catch (err) { console.error(err) }
  }

  // Scroll automático para o episódio ativo
  useEffect(() => {
    if (episodesRef.current) {
        const activeCard = episodesRef.current.querySelector('.ep-card.active')
        if (activeCard) {
            activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
        }
    }
  }, [episode, seasonData])

  // --- HANDLERS ---
  const handleFavorite = () => {
    const newState = !isFavorite
    setIsFavorite(newState)
    triggerToast('success', newState ? 'Adicionado aos Favoritos' : 'Removido dos Favoritos')
  }

  const closeAllPopups = useCallback(() => {
    if (showInfoPopup && !infoClosing) {
      setInfoClosing(true); setTimeout(() => { setShowInfoPopup(false); setInfoClosing(false) }, 400)
    }
    if (showTechPopup && !techClosing) {
      setTechClosing(true); setTimeout(() => { setShowTechPopup(false); setTechClosing(false) }, 400)
    }
  }, [showInfoPopup, infoClosing, showTechPopup, techClosing])

  const toggleInfoPopup = () => { if (showInfoPopup) { setInfoClosing(true); setTimeout(() => { setShowInfoPopup(false); setInfoClosing(false) }, 400) } else { closeAllPopups(); setShowInfoPopup(true) } }
  const toggleTechPopup = () => { if (showTechPopup) { setTechClosing(true); setTimeout(() => { setShowTechPopup(false); setTechClosing(false) }, 400) } else { closeAllPopups(); setShowTechPopup(true) } }

  useEffect(() => {
    const onScroll = () => { if (window.scrollY > 10) closeAllPopups(); setScrolled(window.scrollY > 60) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [closeAllPopups])

  // --- PLAYER URL LOGIC (SUPERFLIX API) ---
  const getEmbedUrl = () => {
    if (!content) return ''
    if (type === 'movie') {
      return `${SUPERFLIX_URL}/filme/${id}`
    }
    // SuperFlix para TV: /serie/ID_TMDB/SEASON/EPISODE
    return `${SUPERFLIX_URL}/serie/${id}/${season}/${episode}`
  }

  if (loading) return <div style={{background:'#050505', height:'100vh'}} />
  if (!content) return null

  return (
    <>
      <Head>
        <title>{content.title || content.name}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        
        <style>{`
          /* --- GLOBAL & BASE --- */
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
          html { scroll-behavior: smooth; }
          body {
            font-family: 'Inter', sans-serif;
            background: #050505; color: #f5f5f7;
            min-height: 100vh; overflow-x: hidden;
            background-image: radial-gradient(circle at 50% 0%, #1a1a1a, #050505 80%);
            background-attachment: fixed;
          }

          :root {
            --pill-height: 44px; --pill-radius: 50px; --pill-max-width: 520px;
            --ios-blue: #0A84FF; --ease-elastic: cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          /* --- UTILITARIOS GLASS --- */
          .glass-panel {
            background: rgba(255, 255, 255, 0.06);
            backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: inherit;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            transition: transform 0.3s var(--ease-elastic), background 0.3s ease;
          }

          /* --- BLUR EFFECT NO SITE --- */
          .site-wrapper { transition: filter 0.4s ease; width: 100%; min-height: 100vh; }
          .site-wrapper.blurred { filter: blur(12px) brightness(0.5); pointer-events: none; }

          /* --- HEADER & NAV (IGUAL HOME) --- */
          .bar-container {
            position: fixed; left: 50%; transform: translateX(-50%); z-index: 1000;
            display: flex; align-items: center; justify-content: center; gap: 12px; 
            width: 90%; max-width: var(--pill-max-width); transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          .top-bar { top: 20px; }
          .bottom-bar { bottom: 20px; }
          .top-bar.scrolled-state { transform: translateX(-50%) translateY(-5px); }

          .round-btn {
            width: var(--pill-height); height: var(--pill-height); border-radius: 50%;
            display: flex; align-items: center; justify-content: center; color: rgba(255, 255, 255, 0.9);
            flex-shrink: 0; transition: all 0.3s var(--ease-elastic);
          }
          .round-btn:hover { transform: scale(1.08); background: rgba(255, 255, 255, 0.12); }
          .round-btn:active { transform: scale(0.92); }

          .pill-container {
            height: var(--pill-height); flex: 1; border-radius: var(--pill-radius);
            display: flex; align-items: center; justify-content: center; position: relative;
          }
          .bar-label { font-size: 0.9rem; font-weight: 600; color: #fff; animation: labelFadeIn 0.4s var(--ease-elastic); }
          @keyframes labelFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

          /* --- POPUPS & TOASTS (ANIMAÇÃO E TAMANHO IDÊNTICOS) --- */
          .info-popup, .toast {
            position: fixed; top: calc(20px + var(--pill-height) + 16px); left: 50%; z-index: 2000;
            min-width: 320px; max-width: 90%; display: flex; align-items: center; gap: 14px;
            padding: 16px 18px; border-radius: 22px;
            transform: translateX(-50%) translateY(-50%) scale(0.3); opacity: 0;
            animation: popupZoomIn 0.5s var(--ease-elastic) forwards;
          }
          .info-popup.closing, .toast.closing { animation: popupZoomOut 0.4s cubic-bezier(0.55, 0.055, 0.675, 0.19) forwards; }

          @keyframes popupZoomIn {
            0% { opacity: 0; transform: translateX(-50%) translateY(-50%) scale(0.3); }
            100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          }
          @keyframes popupZoomOut {
            0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
            100% { opacity: 0; transform: translateX(-50%) translateY(-30%) scale(0.5); }
          }
          
          .popup-icon-wrapper, .toast-icon-wrapper { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
          .popup-icon-wrapper { background: linear-gradient(135deg, #34c759, #30d158); }
          .popup-icon-wrapper.tech { background: linear-gradient(135deg, #0a84ff, #007aff); }
          .toast.success .toast-icon-wrapper { background: linear-gradient(135deg, #34c759, #30d158); }
          .toast.error .toast-icon-wrapper { background: linear-gradient(135deg, #ff453a, #ff3b30); }
          .popup-content, .toast-content { flex: 1; }
          .popup-title, .toast-title { font-size: 0.95rem; font-weight: 600; color: #fff; }
          .popup-text, .toast-msg { font-size: 0.8rem; color: rgba(255, 255, 255, 0.7); }

          /* --- LAYOUT PÁGINA --- */
          .container { max-width: 1280px; margin: 0 auto; padding: 6.5rem 2rem 7rem 2rem; }
          
          /* HEADER TITLE IDENTICO HOME */
          .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; animation: headerFadeIn 0.8s var(--ease-elastic) forwards; }
          .page-title { font-size: 1.5rem; font-weight: 700; color: #fff; text-shadow: 0 4px 20px rgba(0,0,0,0.5); }
          .status-dots { display: flex; gap: 8px; }
          .dot { width: 10px; height: 10px; border-radius: 50%; animation: dotPulse 2s infinite; }
          .dot.red { background: #ff453a; box-shadow: 0 2px 8px rgba(255,69,58,0.4); }
          .dot.yellow { background: #ffd60a; animation-delay: 0.3s; box-shadow: 0 2px 8px rgba(255,204,0,0.4); }
          .dot.green { background: #34c759; animation-delay: 0.6s; box-shadow: 0 2px 8px rgba(52,199,89,0.4); }
          @keyframes dotPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.6; } }

          /* --- PLAYER BANNER --- */
          .player-banner {
            width: 100%; aspect-ratio: 16/9; border-radius: 24px; overflow: hidden; position: relative;
            background: #1a1a1a; cursor: pointer; border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 20px 40px rgba(0,0,0,0.4); margin-bottom: 24px;
            animation: cardEntrance 0.7s var(--ease-elastic) backwards;
          }
          .banner-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.8s var(--ease-elastic); }
          .player-banner:hover .banner-img { transform: scale(1.05); }
          .play-btn {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 64px; height: 64px; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px);
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            border: 1px solid rgba(255,255,255,0.3); font-size: 24px;
          }

          /* --- DETAILS & CAROUSEL --- */
          .details-card {
            border-radius: 24px; padding: 24px; display: flex; flex-direction: column; gap: 16px;
            animation: cardEntrance 0.7s var(--ease-elastic) 0.1s backwards;
          }
          @keyframes cardEntrance { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }

          .media-title { font-size: 1.4rem; font-weight: 700; line-height: 1.2; }
          .ep-info { font-size: 1rem; color: rgba(255,255,255,0.7); }

          /* SELETOR DE TEMPORADA */
          .season-select-wrapper { position: relative; align-self: flex-start; }
          .season-btn {
            background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 12px; color: #fff;
            display: flex; align-items: center; gap: 8px; font-weight: 500;
          }
          .season-dropdown {
            position: absolute; top: 110%; left: 0; background: #1c1c1e; border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px; padding: 6px; z-index: 100; max-height: 200px; overflow-y: auto;
            min-width: 120px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          }
          .season-opt {
            padding: 8px 12px; border-radius: 8px; font-size: 0.9rem; cursor: pointer; color: #ccc;
          }
          .season-opt:hover { background: rgba(255,255,255,0.1); color: #fff; }

          /* CARROSSEL EPISODIOS */
          .ep-carousel { 
            display: flex; gap: 16px; overflow-x: auto; padding: 10px 0 20px 0; 
            scroll-behavior: smooth; 
          }
          .ep-carousel::-webkit-scrollbar { display: none; }
          
          .ep-card {
            min-width: 160px; max-width: 160px; display: flex; flex-direction: column; gap: 8px;
            cursor: pointer; opacity: 0.7; transition: all 0.3s ease;
          }
          .ep-card:hover, .ep-card.active { opacity: 1; transform: scale(1.02); }
          .ep-card.active .ep-thumb-box { border-color: var(--ios-blue); box-shadow: 0 0 0 2px var(--ios-blue); }
          
          .ep-thumb-box {
            width: 100%; aspect-ratio: 16/9; border-radius: 12px; overflow: hidden;
            border: 2px solid transparent; position: relative; background: #333;
          }
          .ep-thumb { width: 100%; height: 100%; object-fit: cover; }
          .ep-number { font-size: 0.8rem; font-weight: 700; color: #fff; }
          .ep-name { font-size: 0.75rem; color: rgba(255,255,255,0.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

          /* SINOPSE */
          .synopsis-toggle {
            color: var(--ios-blue); font-size: 0.9rem; font-weight: 600; cursor: pointer;
            display: flex; align-items: center; gap: 6px; margin-top: 4px;
          }
          .synopsis-txt { font-size: 0.9rem; color: #ccc; line-height: 1.6; margin-top: 8px; animation: fadeIn 0.3s ease; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

          /* --- PLAYER OVERLAY POPUP --- */
          .overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 3000;
            background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center;
            animation: fadeIn 0.4s ease;
          }
          .player-popup {
            width: min(85vw, 1000px); aspect-ratio: 16/9; /* Tamanho ajustado e responsivo */
            background: #000; border-radius: 40px; /* Bordas muito arredondadas */
            position: relative; box-shadow: 0 40px 80px rgba(0,0,0,0.8);
            overflow: hidden; /* Garante que o iframe respeite a borda arredondada */
            animation: popupScale 0.4s var(--ease-elastic);
          }
          @keyframes popupScale { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }

          .player-close {
            position: absolute; top: 16px; right: 16px; width: 40px; height: 40px;
            background: rgba(0,0,0,0.6); border-radius: 50%; z-index: 10;
            display: flex; align-items: center; justify-content: center; color: #fff;
            backdrop-filter: blur(4px); cursor: pointer; border: 1px solid rgba(255,255,255,0.2);
          }

          @media (max-width: 768px) {
            .container { padding-left: 1.5rem; padding-right: 1.5rem; }
            .player-popup { width: 92vw; border-radius: 28px; }
            .info-popup, .toast { min-width: 280px; }
          }
        `}</style>
      </Head>

      <div className={`site-wrapper ${isPlaying ? 'blurred' : ''}`}>
        
        <Header 
          label={scrolled ? "Reproduzindo" : "Yoshikawa"} 
          scrolled={scrolled}
          showInfo={showInfoPopup} toggleInfo={toggleInfoPopup} infoClosing={infoClosing}
          showTech={showTechPopup} toggleTech={toggleTechPopup} techClosing={techClosing}
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

          <div className="player-banner" onClick={() => setIsPlaying(true)}>
            <img 
              src={content.backdrop_path ? `https://image.tmdb.org/t/p/original${content.backdrop_path}` : ''} 
              className="banner-img" alt="Capa"
            />
            <div className="play-btn"><i className="fas fa-play"></i></div>
          </div>

          <div className="glass-panel details-card">
            <div>
              <h2 className="media-title">{content.title || content.name}</h2>
              {type === 'tv' && (
                <p className="ep-info">
                   Temporada {season} • Episódio {episode} 
                   {seasonData?.episodes && ` - ${seasonData.episodes.find(e => e.episode_number === episode)?.name || ''}`}
                </p>
              )}
            </div>

            {type === 'tv' && (
              <>
                <div className="season-select-wrapper">
                  <button className="season-btn" onClick={() => setShowSeasonList(!showSeasonList)}>
                    Temporada {season} <i className="fas fa-chevron-down" style={{fontSize: '10px'}}></i>
                  </button>
                  
                  {showSeasonList && (
                    <div className="season-dropdown glass-panel">
                      {Array.from({ length: content.number_of_seasons || 1 }, (_, i) => i + 1).map(num => (
                        <div key={num} className="season-opt" onClick={() => fetchSeason(id, num)}>
                           Temporada {num}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="ep-carousel" ref={episodesRef}>
                  {seasonData ? seasonData.episodes.map(ep => (
                    <div 
                      key={ep.id} 
                      id={`ep-card-${ep.episode_number}`}
                      className={`ep-card ${ep.episode_number === episode ? 'active' : ''}`}
                      onClick={() => setEpisode(ep.episode_number)}
                    >
                      <div className="ep-thumb-box">
                         {ep.still_path ? (
                           <img src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} className="ep-thumb" alt="" />
                         ) : (
                           <div style={{width:'100%',height:'100%',background:'#222'}}></div>
                         )}
                      </div>
                      <span className="ep-number">Ep {ep.episode_number}</span>
                      <span className="ep-name">{ep.name}</span>
                    </div>
                  )) : <p style={{fontSize:'0.8rem', color:'#666'}}>Carregando lista...</p>}
                </div>
              </>
            )}

            <div onClick={() => setShowSynopsis(!showSynopsis)} className="synopsis-toggle">
               {showSynopsis ? "Ocultar Sinopse" : "Ler Sinopse"}
               <i className={`fas fa-chevron-down ${showSynopsis ? 'fa-rotate-180' : ''}`} style={{transition:'0.3s'}}></i>
            </div>
            {showSynopsis && <p className="synopsis-txt">{content.overview}</p>}

          </div>
        </main>

        <BottomNav isFavorite={isFavorite} toggleFavorite={handleFavorite} />
      </div>

      {/* POPUP DO PLAYER - ARREDONDADO E MENOR */}
      {isPlaying && (
        <div className="overlay">
          <div className="player-popup">
            <button className="player-close" onClick={() => setIsPlaying(false)}>
              <i className="fas fa-xmark"></i>
            </button>
            <iframe 
              src={getEmbedUrl()} 
              width="100%" height="100%" 
              frameBorder="0" allowFullScreen 
              title="Player"
            ></iframe>
          </div>
        </div>
      )}
    </>
  )
}
