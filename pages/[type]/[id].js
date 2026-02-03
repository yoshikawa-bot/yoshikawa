import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
const DEFAULT_BACKDROP = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'

export default function PlayerPage() {
  const router = useRouter()
  const { type, id } = router.query

  // --- Estados de Dados ---
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // --- Estados de Controle do Player ---
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [showPlayer, setShowPlayer] = useState(false) // Controla o Pop-up do Embed
  
  // --- Estados de Interface ---
  const [scrolled, setScrolled] = useState(false)
  const [showFullSynopsis, setShowFullSynopsis] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  
  // --- Toast System (Feedback visual igual Home) ---
  const [toast, setToast] = useState(null)

  // Carregar dados
  useEffect(() => {
    if (!id || !type) return
    
    const fetchData = async () => {
      try {
        const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR`)
        const data = await res.json()
        setItem(data)
        
        // Recuperar progresso salvo
        const savedProgress = localStorage.getItem(`yoshikawa_progress_${id}`)
        if (savedProgress && type === 'tv') {
          const { s, e } = JSON.parse(savedProgress)
          setSeason(s)
          setEpisode(e)
          showToast(`Continuando da T${s}:E${e}`, 'info')
        }
        
        // Verificar favoritos
        const favs = JSON.parse(localStorage.getItem('yoshikawaFavorites') || '[]')
        setIsFavorite(favs.some(f => f.id === Number(id)))
        
        setLoading(false)
      } catch (err) {
        console.error(err)
        setLoading(false)
      }
    }
    fetchData()
  }, [id, type])

  // Salvar progresso automaticamente ao mudar ep/temp
  useEffect(() => {
    if (type === 'tv' && id) {
      localStorage.setItem(`yoshikawa_progress_${id}`, JSON.stringify({ s: season, e: episode }))
    }
  }, [season, episode, id, type])

  // Scroll listener para Header
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Helpers
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type, closing: false })
    setTimeout(() => setToast(prev => prev ? { ...prev, closing: true } : null), 2500)
    setTimeout(() => setToast(null), 2900)
  }

  const toggleFavorite = () => {
    const favs = JSON.parse(localStorage.getItem('yoshikawaFavorites') || '[]')
    let newFavs
    if (isFavorite) {
      newFavs = favs.filter(f => f.id !== Number(id))
      showToast('Removido dos favoritos', 'info')
    } else {
      newFavs = [...favs, { 
        id: Number(id), 
        media_type: type, 
        title: item.title || item.name, 
        poster_path: item.poster_path 
      }]
      showToast('Adicionado aos favoritos', 'success')
    }
    localStorage.setItem('yoshikawaFavorites', JSON.stringify(newFavs))
    setIsFavorite(!isFavorite)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title || item.name, url: window.location.href })
      } catch (e) {}
    } else {
      navigator.clipboard.writeText(window.location.href)
      showToast('Link copiado!', 'success')
    }
  }

  const getEmbedUrl = () => {
    if (type === 'movie') return `https://superflixapi.cv/filme/${item.imdb_id || item.id}#color:#0A84FF`
    return `https://superflixapi.cv/serie/${id}/${season}/${episode}#color:#0A84FF`
  }

  if (loading) return (
    <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505'}}>
      <div className="spinner"></div>
      <style>{`.spinner { width: 30px; height: 30px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <>
      <Head>
        <title>{item.title || item.name} | Yoshikawa</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style>{`
          /* --- GLOBAL STYLES (Mesmo da Home) --- */
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
          body {
            font-family: 'Inter', sans-serif;
            background: #050505;
            color: #f5f5f7;
            overflow-x: hidden;
            background-image: radial-gradient(circle at 50% 0%, #1a1a1a, #050505 80%);
            min-height: 100vh;
          }
          button { font-family: inherit; border: none; outline: none; background: none; cursor: pointer; user-select: none; }
          
          :root {
            --pill-height: 44px;
            --pill-radius: 50px;
            --pill-max-width: 520px;
            --ease-elastic: cubic-bezier(0.34, 1.56, 0.64, 1);
            --ease-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }

          /* --- COMPONENTS --- */
          .glass-panel {
            position: relative;
            background: rgba(255, 255, 255, 0.06);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: inherit;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            transition: transform 0.2s ease, background 0.3s ease;
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
          .top-bar.scrolled { transform: translateX(-50%) translateY(-5px); }

          .round-btn {
            width: var(--pill-height);
            height: var(--pill-height);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            color: rgba(255, 255, 255, 0.9);
            flex-shrink: 0;
            transition: all 0.3s var(--ease-elastic);
          }
          .round-btn:active { transform: scale(0.9); }

          .pill-container {
            height: var(--pill-height);
            flex: 1;
            border-radius: var(--pill-radius);
            display: flex; align-items: center; justify-content: center;
          }
          
          .bar-label { font-size: 0.9rem; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }

          /* --- TOAST --- */
          .toast-wrap { position: fixed; top: 90px; left: 50%; transform: translateX(-50%); z-index: 2100; pointer-events: none; }
          .toast {
            background: rgba(20, 20, 20, 0.9); backdrop-filter: blur(12px);
            padding: 12px 20px; border-radius: 50px;
            display: flex; align-items: center; gap: 10px;
            border: 1px solid rgba(255,255,255,0.15);
            animation: toastIn 0.5s var(--ease-elastic) forwards;
          }
          .toast.closing { animation: toastOut 0.4s ease forwards; }
          .toast i { color: #34c759; }
          .toast.info i { color: #0a84ff; }
          .toast-msg { font-size: 0.85rem; font-weight: 500; }
          
          @keyframes toastIn { from { opacity: 0; transform: translateY(20px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
          @keyframes toastOut { to { opacity: 0; transform: translateY(-20px); } }

          /* --- PAGE SPECIFIC --- */
          .hero-section {
            position: relative;
            width: 100%;
            height: 65vh; /* Altura do card principal */
            max-height: 600px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 20px;
          }

          .backdrop-blur {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background-size: cover; background-position: center;
            opacity: 0.3; mask-image: linear-gradient(to bottom, black 0%, transparent 100%);
            -webkit-mask-image: linear-gradient(to bottom, black 0%, transparent 100%);
            z-index: 1;
          }

          .play-card-wrapper {
            position: relative;
            z-index: 10;
            width: 85%;
            max-width: 340px;
            aspect-ratio: 2/3;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 25px 60px rgba(0,0,0,0.6);
            border: 1px solid rgba(255,255,255,0.15);
            animation: cardEntrance 0.8s var(--ease-elastic);
          }

          .play-card-img { width: 100%; height: 100%; object-fit: cover; }
          
          .play-overlay {
            position: absolute; inset: 0;
            background: rgba(0,0,0,0.3);
            display: flex; flex-direction: column; align-items: center; justifyContent: center;
            gap: 12px;
            transition: background 0.3s;
          }
          
          .play-btn-hero {
            width: 70px; height: 70px;
            border-radius: 50%;
            background: rgba(255,255,255,0.2);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.4);
            display: flex; align-items: center; justify-content: center;
            color: #fff; font-size: 24px; padding-left: 4px;
            animation: pulseBtn 2s infinite;
            transition: transform 0.3s var(--ease-elastic);
          }
          
          .play-btn-hero:hover { transform: scale(1.15); background: rgba(255,255,255,0.3); }
          .play-card-wrapper:hover .play-btn-hero { transform: scale(1.1); }

          @keyframes pulseBtn {
            0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
            70% { box-shadow: 0 0 0 20px rgba(255, 255, 255, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
          }
          
          @keyframes cardEntrance { from { opacity: 0; transform: translateY(40px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }

          /* --- INFO SECTION --- */
          .info-container {
            position: relative; z-index: 10;
            padding: 0 24px 100px 24px;
            max-width: 800px; margin: 0 auto;
            transform: translateY(-40px);
          }

          .meta-title {
            font-size: 1.8rem; font-weight: 700; text-align: center;
            margin-bottom: 12px; text-shadow: 0 4px 20px rgba(0,0,0,0.8);
          }
          
          .meta-tags {
            display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;
            margin-bottom: 24px;
          }
          
          .tag {
            font-size: 0.75rem; color: rgba(255,255,255,0.7);
            background: rgba(255,255,255,0.08); padding: 4px 10px; border-radius: 6px;
          }

          .controls-row {
            display: flex; gap: 12px; margin-bottom: 24px;
          }
          
          .select-glass {
            flex: 1; height: 48px; border-radius: 14px;
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 16px; font-size: 0.9rem; color: #fff;
            position: relative;
          }
          
          .select-glass select {
            position: absolute; inset: 0; opacity: 0; width: 100%; cursor: pointer;
          }

          .synopsis-box {
            background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px;
            border: 1px solid rgba(255,255,255,0.05);
          }
          
          .synopsis-text {
            font-size: 0.9rem; color: rgba(255,255,255,0.7); line-height: 1.6;
            overflow: hidden; transition: max-height 0.5s ease;
          }
          
          .toggle-text-btn {
            margin-top: 10px; font-size: 0.8rem; color: #fff; font-weight: 600;
            display: flex; align-items: center; gap: 6px;
          }

          /* --- PLAYER POPUP MODAL --- */
          .player-overlay {
            position: fixed; inset: 0; z-index: 2000;
            background: rgba(0,0,0,0.85);
            backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
            display: flex; align-items: center; justify-content: center;
            animation: overlayFade 0.4s ease;
            padding: 20px;
          }
          
          .player-modal {
            width: 100%; max-width: 900px;
            aspect-ratio: 16/9;
            background: #000;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 0 100px rgba(0,0,0,0.5);
            border: 1px solid rgba(255,255,255,0.1);
            position: relative;
            animation: modalZoom 0.5s var(--ease-elastic);
          }
          
          .close-modal-btn {
            position: absolute; top: -50px; right: 0;
            color: #fff; font-size: 14px; background: rgba(255,255,255,0.1);
            padding: 8px 16px; border-radius: 30px;
          }

          iframe { width: 100%; height: 100%; border: none; }

          @keyframes overlayFade { from { opacity: 0; } to { opacity: 1; } }
          @keyframes modalZoom { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }

          /* --- MOBILE --- */
          @media (max-width: 768px) {
            .hero-section { height: 55vh; }
            .meta-title { font-size: 1.5rem; }
            .play-card-wrapper { max-width: 260px; }
            .player-modal { border-radius: 12px; }
          }
        `}</style>
      </Head>

      {/* --- HEADER (IGUAL HOME) --- */}
      <header className={`bar-container top-bar ${scrolled ? 'scrolled' : ''}`}>
        <button 
          className="round-btn glass-panel" 
          onClick={() => router.back()}
          title="Voltar"
        >
          <i className="fas fa-arrow-left" style={{ fontSize: '16px' }}></i>
        </button>

        <div className="pill-container glass-panel">
          <span className="bar-label">{item.title || item.name}</span>
        </div>

        <button 
          className="round-btn glass-panel" 
          onClick={() => setShowInfoPopup(!showInfoPopup)}
        >
          <i className="fas fa-info" style={{ fontSize: '14px' }}></i>
        </button>
      </header>
      
      {/* Toast Feedback */}
      {toast && (
        <div className={`toast-wrap`}>
          <div className={`toast ${toast.type} ${toast.closing ? 'closing' : ''}`}>
            <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}`}></i>
            <span className="toast-msg">{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Info Popup (Simples) */}
      {showInfoPopup && (
        <div className="glass-panel" style={{
          position: 'fixed', top: '80px', right: '20px', width: '250px', 
          padding: '20px', borderRadius: '20px', zIndex: 1100,
          animation: 'cardEntrance 0.4s var(--ease-elastic)'
        }}>
          <h4 style={{marginBottom: '5px'}}>Sobre</h4>
          <p style={{fontSize: '12px', opacity: 0.7}}>TMDB ID: {item.id}</p>
          <p style={{fontSize: '12px', opacity: 0.7}}>Status: {item.status}</p>
          <p style={{fontSize: '12px', opacity: 0.7}}>Nota: {item.vote_average?.toFixed(1)}</p>
        </div>
      )}

      {/* --- MAIN CONTENT --- */ }
      <main>
        {/* Hero Backdrop */}
        <div className="backdrop-blur" style={{ backgroundImage: `url(https://image.tmdb.org/t/p/w1280${item.backdrop_path || item.poster_path})` }}></div>

        {/* Central Play Card */}
        <div className="hero-section">
          <div className="play-card-wrapper glass-panel" onClick={() => setShowPlayer(true)}>
            <img 
              src={item.poster_path ? `https://image.tmdb.org/t/p/w780${item.poster_path}` : DEFAULT_BACKDROP} 
              alt="Capa" 
              className="play-card-img" 
            />
            <div className="play-overlay">
              <div className="play-btn-hero">
                <i className="fas fa-play"></i>
              </div>
              <span style={{fontSize: '0.8rem', fontWeight: 600, letterSpacing: '1px'}}>ASSISTIR</span>
            </div>
          </div>
        </div>

        {/* Detalhes & Controles */}
        <div className="info-container">
          <h1 className="meta-title">{item.title || item.name}</h1>
          
          <div className="meta-tags">
            <span className="tag">{item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0]}</span>
            <span className="tag">{item.vote_average?.toFixed(1)} <i className="fas fa-star" style={{fontSize: '10px', color: '#ffd700'}}></i></span>
            {item.genres?.slice(0, 3).map(g => (
              <span key={g.id} className="tag">{g.name}</span>
            ))}
          </div>

          {/* Seletores (Apenas para Séries) */}
          {type === 'tv' && (
            <div className="controls-row">
              <div className="select-glass glass-panel">
                <span>Temp. {season}</span>
                <select value={season} onChange={e => { setSeason(Number(e.target.value)); setEpisode(1) }}>
                  {[...Array(item.number_of_seasons)].map((_, i) => (
                    <option key={i} value={i+1}>Temporada {i+1}</option>
                  ))}
                </select>
                <i className="fas fa-chevron-down" style={{fontSize: '12px', opacity: 0.5}}></i>
              </div>

              <div className="select-glass glass-panel">
                <span>Episódio {episode}</span>
                <select value={episode} onChange={e => setEpisode(Number(e.target.value))}>
                  {[...Array(40)].map((_, i) => (
                    <option key={i} value={i+1}>Episódio {i+1}</option>
                  ))}
                </select>
                <i className="fas fa-list-ol" style={{fontSize: '12px', opacity: 0.5}}></i>
              </div>
            </div>
          )}

          {/* Sinopse Box */}
          <div className="synopsis-box glass-panel">
            <div className="synopsis-text" style={{ maxHeight: showFullSynopsis ? '500px' : '60px' }}>
              {item.overview || "Sem sinopse disponível."}
            </div>
            {item.overview && item.overview.length > 100 && (
              <button className="toggle-text-btn" onClick={() => setShowFullSynopsis(!showFullSynopsis)}>
                {showFullSynopsis ? 'Ler menos' : 'Ler mais'}
                <i className={`fas fa-chevron-${showFullSynopsis ? 'up' : 'down'}`}></i>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* --- PLAYER OVERLAY POPUP (O Modal Pedido) --- */}
      {showPlayer && (
        <div className="player-overlay" onClick={(e) => { if(e.target === e.currentTarget) setShowPlayer(false) }}>
          <div style={{position: 'relative', width: '100%', maxWidth: '900px'}}>
            <button className="close-modal-btn glass-panel" onClick={() => setShowPlayer(false)}>
              Fechar <i className="fas fa-times" style={{marginLeft: '6px'}}></i>
            </button>
            
            <div className="player-modal glass-panel">
              <iframe 
                src={getEmbedUrl()} 
                allowFullScreen 
                scrolling="no"
                title="Player"
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {/* --- BOTTOM NAV (Controles do Usuário) --- */}
      <div className="bar-container bottom-bar">
        <button 
          className="round-btn glass-panel" 
          onClick={handleShare}
          title="Compartilhar"
        >
          <i className="fas fa-arrow-up-from-bracket" style={{ fontSize: '15px' }}></i>
        </button>

        <div className="pill-container glass-panel">
           {/* Botão Central - Ação Principal (Trailer ou Play Rápido) */}
           <button 
             className="nav-btn" 
             style={{width: '100%', height: '100%', color: '#fff', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}
             onClick={() => setShowPlayer(true)}
           >
             <i className="fas fa-play"></i> Assistir Agora
           </button>
        </div>

        <button 
          className="round-btn glass-panel" 
          onClick={toggleFavorite}
          style={{ color: isFavorite ? '#ff3b30' : '#fff' }}
        >
          <i className={`${isFavorite ? 'fas' : 'far'} fa-heart`} style={{ fontSize: '16px' }}></i>
        </button>
      </div>
    </>
  )
            }
