import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

// --- CONSTANTES E DADOS MOCKADOS PARA EXEMPLO VISUAL ---
// Em produção, você substituiria 'mockData' pelos dados vindos da API do TMDB
const MOCK_DATA = {
  id: 12345,
  title: "Arcane",
  name: "Arcane", // Séries usam 'name'
  backdrop_path: "/2FkRK4eE7507r86q856XpBwLhJ.jpg", // Exemplo
  poster_path: "/fqldf2t8ztc9aiwn3k6mlXftfPa.jpg",
  overview: "Em meio ao conflito entre as cidades-gêmeas de Piltover e Zaun, duas irmãs lutam em lados opostos de uma guerra entre tecnologias mágicas e convicções incompatíveis.",
  media_type: "tv", // ou 'movie'
  seasons: [1, 2],
  current_season: 2,
  current_episode: 4,
  episode_name: "Luzes no Escuro"
}

// --- COMPONENTES AUXILIARES (CÓPIA EXATA DO SEU CÓDIGO) ---

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

export const BottomNav = ({ activeSection, setActiveSection, searchActive, setSearchActive }) => {
  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Yoshikawa Player', url: window.location.href }) } 
      catch (err) { console.log('Share canceled') }
    } else { alert('Compartilhar não suportado') }
  }

  return (
    <div className="bar-container bottom-bar">
      <button className="round-btn glass-panel" onClick={handleShare} title="Compartilhar">
        <i className="fas fa-arrow-up-from-bracket" style={{ fontSize: '15px', transform: 'translateY(-1px)' }}></i>
      </button>

      <div className={`pill-container glass-panel ${searchActive ? 'search-mode' : ''}`}>
         {/* Navegação simplificada para a demo, já que estamos na página de player */}
         <Link href="/" className={`nav-btn`}>
            <i className="fas fa-home"></i>
         </Link>
      </div>

      <button className="round-btn glass-panel" onClick={() => setSearchActive(s => !s)}>
        <i className={searchActive ? 'fas fa-xmark' : 'fas fa-magnifying-glass'} style={{ fontSize: searchActive ? '17px' : '15px' }}></i>
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

// --- PÁGINA DE REPRODUÇÃO ---

export default function PlayerPage() {
  // Estados Globais (Copiados da Home para manter funcionamento)
  const [scrolled, setScrolled] = useState(false)
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [infoClosing, setInfoClosing] = useState(false)
  const [showTechPopup, setShowTechPopup] = useState(false)
  const [techClosing, setTechClosing] = useState(false)
  const [currentToast, setCurrentToast] = useState(null)
  
  // Estados do Player
  const [isPlaying, setIsPlaying] = useState(false) // Controla se o popup está aberto
  const [isWideMode, setIsWideMode] = useState(false) // Controla proporção 1x1 vs Banner (16:9)
  const [showSynopsis, setShowSynopsis] = useState(false)
  const [searchActive, setSearchActive] = useState(false)
  
  // Dados do Conteúdo
  const [season, setSeason] = useState(MOCK_DATA.current_season)
  const [episode, setEpisode] = useState(MOCK_DATA.current_episode)
  
  // Handlers de Popup (Iguais a Home)
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

  // Lógica do Player
  const handleNextEp = () => setEpisode(prev => prev + 1)
  const handlePrevEp = () => setEpisode(prev => prev > 1 ? prev - 1 : 1)
  
  // URL Superflix
  // Se for filme: https://superflixapi.dev/movie/{tmdb_id}
  // Se for série: https://superflixapi.dev/tv/{tmdb_id}/{season}/{episode}
  const getEmbedUrl = () => {
    if (MOCK_DATA.media_type === 'movie') {
      return `https://superflixapi.dev/embed/movie/${MOCK_DATA.id}`
    }
    return `https://superflixapi.dev/embed/tv/${MOCK_DATA.id}/${season}/${episode}`
  }

  return (
    <>
      <Head>
        <title>{MOCK_DATA.title || MOCK_DATA.name} - Yoshikawa Player</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        {/* CSS COMPLETO COPIADO E ESTENDIDO */}
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
          /* COMPONENTES GLOBAIS (Glass, Buttons, Bars, Popups) */
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
          .bar-label { font-size: 0.9rem; font-weight: 600; color: #fff; animation: labelFadeIn 0.4s var(--ease-elastic) forwards; }
          @keyframes labelFadeIn { from { opacity: 0; transform: translateY(12px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
          
          .info-popup, .toast {
            position: fixed; top: calc(20px + var(--pill-height) + 16px); left: 50%; z-index: 960;
            min-width: 320px; max-width: 90%; display: flex; align-items: flex-start; gap: 14px;
            padding: 16px 18px; border-radius: 22px; transform: translateX(-50%) translateY(-50%) scale(0.3);
            transform-origin: top center; opacity: 0; animation: popupZoomIn 0.5s var(--ease-elastic) forwards;
            box-shadow: 0 20px 60px rgba(0,0,0,0.6);
          }
          .info-popup { z-index: 950; pointer-events: none; }
          .toast { z-index: 960; pointer-events: auto; align-items: center; }
          .info-popup.closing, .toast.closing { animation: popupZoomOut 0.4s cubic-bezier(0.55, 0.055, 0.675, 0.19) forwards; }
          @keyframes popupZoomIn { 0% { opacity: 0; transform: translateX(-50%) translateY(-50%) scale(0.3); } 100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); pointer-events: auto; } }
          @keyframes popupZoomOut { 0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); } 100% { opacity: 0; transform: translateX(-50%) translateY(-30%) scale(0.5); pointer-events: none; } }
          .popup-icon-wrapper { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #34c759 0%, #30d158 100%); box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3); }
          .popup-icon-wrapper.tech { background: linear-gradient(135deg, #0a84ff 0%, #007aff 100%); box-shadow: 0 4px 12px rgba(10, 132, 255, 0.3); }
          .popup-icon-wrapper i { font-size: 20px; color: #fff; }
          .popup-content { flex: 1; display: flex; flex-direction: column; gap: 4px; }
          .popup-title { font-size: 0.95rem; font-weight: 600; color: #fff; margin: 0; }
          .popup-text { font-size: 0.8rem; color: rgba(255, 255, 255, 0.7); margin: 0; }

          /* LAYOUT DA PAGINA */
          .container {
            max-width: 1280px; margin: 0 auto;
            padding-top: 6.5rem; padding-bottom: 7rem;
            padding-left: 2rem; padding-right: 2rem;
          }
          .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
          .page-title { font-size: 1.5rem; font-weight: 700; color: #fff; text-shadow: 0 4px 20px rgba(0,0,0,0.5); }
          .status-dots { display: flex; gap: 8px; }
          .dot { width: 10px; height: 10px; border-radius: 50%; animation: dotPulse 2s ease-in-out infinite; }
          .dot.red { background: linear-gradient(135deg, #ff453a, #ff3b30); }
          .dot.yellow { background: linear-gradient(135deg, #ffd60a, #ffcc00); animation-delay: 0.3s; }
          .dot.green { background: linear-gradient(135deg, #34c759, #30d158); animation-delay: 0.6s; }
          @keyframes dotPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.6; } }

          /* --- ESTILOS ESPECÍFICOS DO PLAYER (REPRODUZINDO) --- */
          
          /* Banner Container */
          .player-banner-container {
            width: 100%;
            aspect-ratio: 16/9; /* Horizontal, não quadrado */
            border-radius: 24px; /* Bordas arredondadas */
            overflow: hidden;
            position: relative;
            background-color: #1a1a1a;
            border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
            margin-bottom: 24px;
            cursor: pointer;
            group: 'banner';
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
            /* Sem animações conforme pedido */
          }
          
          .play-button-static i {
            color: #fff;
            font-size: 24px;
            margin-left: 4px; /* Ajuste visual pro icone de play */
          }

          /* Detalhes Container (Blur) */
          .details-container {
            border-radius: 24px;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            animation: cardEntrance 0.7s var(--ease-elastic) backwards;
          }
          
          @keyframes cardEntrance { from { opacity: 0; transform: translateY(40px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }

          .media-title { font-size: 1.4rem; font-weight: 700; color: #fff; line-height: 1.2; }
          .episode-title { font-size: 1.1rem; font-weight: 500; color: rgba(255,255,255,0.8); }
          
          .controls-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 4px;
          }
          
          .season-btn {
            background: rgba(255,255,255,0.1);
            padding: 8px 16px;
            border-radius: 12px;
            font-size: 0.9rem;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: background 0.2s;
          }
          .season-btn:hover { background: rgba(255,255,255,0.2); }

          /* Carrossel de Episódios */
          .episodes-carousel {
            display: flex;
            gap: 12px;
            overflow-x: auto;
            padding: 4px 0 12px 0;
            scrollbar-width: none; /* Firefox */
          }
          .episodes-carousel::-webkit-scrollbar { display: none; }
          
          .ep-card {
            min-width: 140px;
            height: 80px;
            background: rgba(255,255,255,0.05);
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 12px;
            border: 1px solid rgba(255,255,255,0.05);
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .ep-card:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }
          .ep-card.active { border-color: var(--ios-blue); background: rgba(10, 132, 255, 0.1); }
          
          .ep-card-num { font-size: 0.8rem; font-weight: 700; color: #fff; }
          .ep-card-title { font-size: 0.7rem; color: rgba(255,255,255,0.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

          /* Sinopse */
          .synopsis-btn {
            align-self: flex-start;
            color: var(--ios-blue);
            font-size: 0.9rem;
            font-weight: 600;
            margin-top: 8px;
          }
          .synopsis-text {
            font-size: 0.9rem;
            color: rgba(255,255,255,0.7);
            line-height: 1.6;
            margin-top: 8px;
            animation: fadeIn 0.3s ease;
          }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

          /* --- PLAYER POPUP OVERLAY --- */
          .player-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.85);
            backdrop-filter: blur(20px);
            z-index: 2000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            animation: overlayFadeIn 0.4s var(--ease-smooth);
          }
          @keyframes overlayFadeIn { from { opacity: 0; } to { opacity: 1; } }
          
          .player-popup-container {
            position: relative;
            background: #000;
            border-radius: 0; /* Embed geralmente é quadrado ou reto */
            box-shadow: 0 0 50px rgba(0,0,0,0.8);
            transition: all 0.5s var(--ease-elastic);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          /* Configurações de Tamanho do Popup */
          .popup-size-square {
            width: min(90vw, 50vh);
            height: min(90vw, 50vh);
            aspect-ratio: 1/1; /* Quadrado 1x1 pedido */
          }
          
          .popup-size-banner {
            width: 90vw;
            max-width: 1000px;
            aspect-ratio: 16/9;
          }

          .player-embed {
            width: 100%;
            height: 100%;
            border: none;
          }

          /* Controles fora do embed */
          .player-header-controls {
            position: absolute;
            top: -50px;
            left: 0;
            right: 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
          }
          
          .ep-indicator {
            font-size: 1.2rem;
            font-weight: 700;
            color: #fff;
            text-shadow: 0 2px 10px rgba(0,0,0,0.5);
          }
          
          .right-controls { display: flex; gap: 12px; }
          
          .control-btn {
            width: 40px; height: 40px;
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            color: #fff;
            transition: background 0.3s;
          }
          .control-btn:hover { background: rgba(255,255,255,0.25); }
          
          .player-bottom-controls {
            position: absolute;
            bottom: -60px;
            left: 0;
            right: 0;
            display: flex;
            justify-content: center;
            gap: 24px;
          }
          
          .nav-ep-btn {
            background: rgba(255,255,255,0.1);
            padding: 10px 24px;
            border-radius: 50px;
            color: #fff;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: transform 0.2s;
          }
          .nav-ep-btn:active { transform: scale(0.95); }

          @media (max-width: 768px) {
            .container { padding-left: 1rem; padding-right: 1rem; }
            .bar-container { width: 94%; }
            .player-banner-container { border-radius: 16px; }
            .details-container { padding: 16px; }
            .media-title { font-size: 1.2rem; }
            .popup-size-square { width: 90vw; height: 90vw; }
          }
        `}</style>
      </Head>

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

      <ToastContainer toast={currentToast} closeToast={() => setCurrentToast(prev => ({...prev, closing: true}))} />

      <main className="container">
        {/* Header da Página */}
        <div className="page-header">
          <h1 className="page-title">Reproduzindo</h1>
          <div className="status-dots">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
          </div>
        </div>

        {/* 1. Container Banner com Botão Play */}
        <div className="player-banner-container" onClick={() => setIsPlaying(true)}>
          <img 
            src={`https://image.tmdb.org/t/p/original${MOCK_DATA.backdrop_path}`} 
            className="banner-image" 
            alt="Capa" 
          />
          <div className="play-button-static">
            <i className="fas fa-play"></i>
          </div>
        </div>

        {/* 2. Container Detalhes (Glassmorphism Blur) */}
        <div className="glass-panel details-container">
          {/* Títulos Alinhados a Esquerda */}
          <div className="text-left">
            <h2 className="media-title">{MOCK_DATA.title || MOCK_DATA.name}</h2>
            {MOCK_DATA.media_type === 'tv' && (
              <h3 className="episode-title">T{season}:E{episode} - {MOCK_DATA.episode_name}</h3>
            )}
          </div>

          {/* Botão Temporada */}
          {MOCK_DATA.media_type === 'tv' && (
            <div className="controls-row">
              <button className="season-btn">
                Temporada {season} <i className="fas fa-chevron-down" style={{fontSize: '10px'}}></i>
              </button>
            </div>
          )}

          {/* Carrossel de Cards Pequenos Horizontais */}
          {MOCK_DATA.media_type === 'tv' && (
            <div className="episodes-carousel">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(ep => (
                <div 
                  key={ep} 
                  className={`ep-card ${ep === episode ? 'active' : ''}`}
                  onClick={() => setEpisode(ep)}
                >
                  <span className="ep-card-num">Ep {ep}</span>
                  <span className="ep-card-title">Episódio {ep}</span>
                </div>
              ))}
            </div>
          )}

          {/* Botão Sinopse */}
          <button className="synopsis-btn" onClick={() => setShowSynopsis(!showSynopsis)}>
            {showSynopsis ? 'Ocultar Sinopse' : 'Ler Sinopse'}
          </button>
          
          {showSynopsis && (
            <p className="synopsis-text">{MOCK_DATA.overview}</p>
          )}
        </div>
      </main>

      {/* 3. PLAYER POPUP (Quadrado 1x1 ao centro) */}
      {isPlaying && (
        <div className="player-overlay">
          {/* Container Relativo para posicionar os botões "fora" */}
          <div className={`player-popup-container ${isWideMode ? 'popup-size-banner' : 'popup-size-square'}`}>
            
            {/* Controles Acima (Fora) */}
            <div className="player-header-controls">
              <span className="ep-indicator">
                 {MOCK_DATA.media_type === 'tv' ? `S${season}:E${episode}` : 'Filme'}
              </span>
              <div className="right-controls">
                 {/* Botão Mudar Proporção */}
                <button className="control-btn" onClick={() => setIsWideMode(!isWideMode)} title="Alterar Formato">
                  <i className={isWideMode ? "fas fa-compress" : "fas fa-expand"}></i>
                </button>
                 {/* Botão Fechar */}
                <button className="control-btn" onClick={() => setIsPlaying(false)} title="Fechar">
                  <i className="fas fa-xmark"></i>
                </button>
              </div>
            </div>

            {/* O Embed Superflix */}
            <iframe 
              src={getEmbedUrl()} 
              className="player-embed" 
              allowFullScreen 
              scrolling="no"
              title="Player"
            ></iframe>

            {/* Controles Abaixo (Fora) - Se for série */}
            {MOCK_DATA.media_type === 'tv' && (
              <div className="player-bottom-controls">
                <button className="nav-ep-btn glass-panel" onClick={handlePrevEp}>
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

      <BottomNav 
        activeSection="releases" 
        searchActive={searchActive}
        setSearchActive={setSearchActive}
        setActiveSection={() => {}}
      />
    </>
  )
}
