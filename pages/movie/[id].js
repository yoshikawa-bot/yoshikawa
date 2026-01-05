import { useRouter } from 'next/router'
import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function Movie() {
  const router = useRouter()
  const { id } = router.query
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Player Padrão SuperFlix
  const [selectedPlayer, setSelectedPlayer] = useState('superflix')
  
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [showPlayerSelector, setShowPlayerSelector] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  
  // Estados para o Pop-up de Vídeo
  const [showVideoPlayer, setShowVideoPlayer] = useState(false)
  const [isWideScreen, setIsWideScreen] = useState(false)

  // Estado para notificação única
  const [toast, setToast] = useState(null)
  const toastTimeoutRef = useRef(null)
  
  const [showSynopsis, setShowSynopsis] = useState(false)

  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const STREAM_BASE_URL = 'https://superflixapi.blog'

  const showToast = (message, type = 'info') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
    }

    setToast({ message, type, id: Date.now() })

    toastTimeoutRef.current = setTimeout(() => {
      setToast(null)
      toastTimeoutRef.current = null
    }, 3000)
  }

  const removeToast = () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
    }
    setToast(null)
  }

  useEffect(() => {
    if (id) {
      loadMovie(id)
      checkIfFavorite()
    }

    return () => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    }
  }, [id])
  
  useEffect(() => {
    if (showVideoPlayer) {
        removeToast();
    }
    document.body.style.overflow = showVideoPlayer ? 'hidden' : 'auto';
    return () => {
        document.body.style.overflow = 'auto';
    };
  }, [showVideoPlayer]); 

  useEffect(() => {
    if (showVideoPlayer) {
      const handleResize = () => {
        setIsWideScreen(window.innerWidth > window.innerHeight);
      };
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [showVideoPlayer]);

  const loadMovie = async (movieId) => {
    try {
      setLoading(true)
      const movieUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=external_ids,images`
      const movieResponse = await fetch(movieUrl)
      if (!movieResponse.ok) throw new Error('Filme não encontrado')
      const movieData = await movieResponse.json()
      setMovie(movieData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const checkIfFavorite = () => {
    try {
      const savedFavorites = localStorage.getItem('yoshikawaFavorites')
      const favorites = savedFavorites ? JSON.parse(savedFavorites) : []
      const isFav = favorites.some(fav => fav.id === parseInt(id) && fav.media_type === 'movie')
      setIsFavorite(isFav)
    } catch (error) {
      setIsFavorite(false)
    }
  }

  const toggleFavorite = () => {
    if (!movie) return
    try {
      const savedFavorites = localStorage.getItem('yoshikawaFavorites')
      const favorites = savedFavorites ? JSON.parse(savedFavorites) : []
      if (isFavorite) {
        const newFavorites = favorites.filter(fav => !(fav.id === parseInt(id) && fav.media_type === 'movie'))
        localStorage.setItem('yoshikawaFavorites', JSON.stringify(newFavorites))
        setIsFavorite(false)
        showToast('Removido dos favoritos', 'info')
      } else {
        const newFavorite = {
          id: parseInt(id),
          media_type: 'movie',
          title: movie.title,
          poster_path: movie.poster_path,
          release_date: movie.release_date,
          overview: movie.overview
        }
        const newFavorites = [...favorites, newFavorite]
        localStorage.setItem('yoshikawaFavorites', JSON.stringify(newFavorites))
        setIsFavorite(true)
        showToast('Adicionado aos favoritos!', 'success')
      }
    } catch (error) {
      showToast('Erro ao salvar favorito', 'info')
    }
  }

  const getPlayerUrl = () => {
    const identifier = movie?.external_ids?.imdb_id || id
    const fullScreenParam = '&fullScreen=false' 
    if (selectedPlayer === 'superflix') {
      return `${STREAM_BASE_URL}/filme/${identifier}#noLink#transparent#noBackground${fullScreenParam}`
    } else {
      return `https://vidsrc.to/embed/movie/${identifier}`
    }
  }
  
  const closePopup = (setter) => {
    const element = document.querySelector('.info-popup-overlay.active, .player-selector-bubble.active, .video-overlay-wrapper.active');
    if (element) {
        element.classList.add('closing');
        setTimeout(() => {
            setter(false);
            element.classList.remove('closing');
        }, 300);
    } else {
        setter(false);
    }
  };
  
  const handleInfoOverlayClick = (e) => {
    if (e.target.classList.contains('info-popup-overlay')) {
      closePopup(setShowInfoPopup);
    }
  };
  
  const handleSelectorOverlayClick = (e) => {
    if (e.target.classList.contains('player-selector-overlay')) {
      closePopup(setShowPlayerSelector);
    }
  };

  const toggleVideoFormat = () => setIsWideScreen(!isWideScreen);

  const handlePlayerChange = (player) => {
    setSelectedPlayer(player)
    closePopup(setShowPlayerSelector)
    showToast(`Servidor alterado para ${player === 'superflix' ? 'SuperFlix (DUB)' : 'VidSrc (LEG)'}`, 'info')
    if (showVideoPlayer) {
        setShowVideoPlayer(false)
        setTimeout(() => setShowVideoPlayer(true), 100); 
    }
  }

  if (loading) return <div className="loading active"><div className="spinner"></div><p>Carregando filme...</p></div>
  if (error) return <div className="error-message active"><h3>Erro</h3><p>{error}</p><Link href="/">Voltar</Link></div>
  if (!movie) return null

  const coverImage = movie.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : (movie.poster_path ? `https://image.tmdb.org/t/p/original${movie.poster_path}` : null);


  const SingleToast = ({ showVideoPlayer }) => {
    if (!toast || showVideoPlayer) return null;
    return (
      <div className="toast-container">
        <div key={toast.id} className={`toast toast-${toast.type} show`} style={{ animation: 'toast-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
          <div className="toast-icon">
            <i className={`fas ${toast.type === 'success' ? 'fa-check' : toast.type === 'error' ? 'fa-exclamation-triangle' : 'fa-info'}`}></i>
          </div>
          <div className="toast-content">{toast.message}</div>
          <button className="toast-close" onClick={removeToast}><i className="fas fa-times"></i></button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>{movie.title} - Yoshikawa Player</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>

      <Header />

      <main className="streaming-container">
        <div className="player-container">
          <div className="player-wrapper">
             <div className="episode-cover-placeholder" onClick={() => setShowVideoPlayer(true)}>
                {coverImage ? <img src={coverImage} alt="Movie Cover" className="cover-img" /> : <div className="cover-fallback"></div>}
                <div className="play-btn-circle-thin">
                    <i className="fas fa-play"></i>
                </div>
             </div>
          </div>
        </div>

        <div className="content-info-streaming">
          <h1 className="clean-episode-title">{movie.title}</h1>
          <div className="meta-header-row" style={{marginBottom: '1rem', color: 'var(--secondary)', fontSize: '0.9rem'}}>
            <span style={{marginRight: '15px'}}><i className="fas fa-calendar"></i> {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}</span>
            <span style={{marginRight: '15px'}}><i className="fas fa-clock"></i> {movie.runtime ? `${movie.runtime} min` : ''}</span>
            <span><i className="fas fa-tags"></i> {movie.genres ? movie.genres.map(g => g.name).slice(0, 3).join(', ') : ''}</span>
          </div>

          <div className="synopsis-wrapper">
            {showSynopsis && (
                <p className="content-description-streaming fade-in">
                    {movie.overview || 'Descrição não disponível.'}
                </p>
            )}
            <button className="synopsis-toggle-btn" onClick={() => setShowSynopsis(!showSynopsis)}>
                {showSynopsis ? <span><i className="fas fa-chevron-up"></i> Ocultar Sinopse</span> : <span><i className="fas fa-align-left"></i> Ler Sinopse</span>}
            </button>
          </div>
        </div>

        {showVideoPlayer && (
            <div className="video-overlay-wrapper active">
                <div className={`video-player-group ${isWideScreen ? 'widescreen' : 'square'}`} onClick={(e) => e.stopPropagation()}>
                    <div className="video-controls-toolbar">
                        <button className="toolbar-btn" onClick={toggleVideoFormat}><i className={`fas ${isWideScreen ? 'fa-compress' : 'fa-expand'}`}></i></button>
                        <button className="toolbar-btn close-btn" onClick={() => closePopup(setShowVideoPlayer)}><i className="fas fa-times"></i></button>
                    </div>
                    <div className="video-floating-container">
                        <iframe src={getPlayerUrl()} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen title={`Player`}></iframe>
                    </div>
                </div>
            </div>
        )}

        {showPlayerSelector && (
            <div className="player-selector-overlay menu-overlay active" onClick={handleSelectorOverlayClick}>
                <div className={`player-selector-bubble ${showPlayerSelector ? 'active' : ''}`} onClick={(e) => e.stopPropagation()}>
                    <div className="player-options-bubble">
                        <div className="player-option-bubble" onClick={() => handlePlayerChange('superflix')}>
                            <div className="option-main-line"><i className="fas fa-film"></i><span className="option-name">SuperFlix</span><span className="player-tag-bubble player-tag-dub">DUB</span></div>
                            <span className="option-details">Lento, mas possui dublagem.</span>
                        </div>
                        <div className="player-option-bubble" onClick={() => handlePlayerChange('vidsrc')}>
                            <div className="option-main-line"><i className="fas fa-bolt"></i><span className="option-name">VidSrc</span><span className="player-tag-bubble player-tag-sub">LEG</span></div>
                            <span className="option-details">Mais rápido, mas apenas legendado.</span>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className={`info-popup-overlay ${showInfoPopup ? 'active' : ''}`} onClick={handleInfoOverlayClick}>
          <div className="info-popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="info-popup-header">
              <img src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://yoshikawa-bot.github.io/cache/images/6e595b38.jpg'} alt={movie.title} className="info-poster" />
              <div className="info-details">
                <h2 className="info-title">{movie.title}</h2>
                <div className="info-meta">
                  <span><i className="fas fa-calendar"></i> {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}</span>
                  <span><i className="fas fa-star"></i> {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
                  <span><i className="fas fa-tags"></i> {movie.genres ? movie.genres.map(g => g.name).slice(0, 2).join(', ') : ''}</span>
                </div>
                <div className="info-meta">
                  <span><i className="fas fa-clock"></i> {movie.runtime ? `${movie.runtime} min` : ''}</span>
                  <span><i className="fas fa-language"></i> {movie.original_language?.toUpperCase()}</span>
                </div>
              </div>
            </div>
            <button className="close-popup-btn" onClick={() => closePopup(setShowInfoPopup)}><i className="fas fa-times"></i> Fechar</button>
          </div>
        </div>
      </main>

      <SingleToast showVideoPlayer={showVideoPlayer} />
      <BottomNav selectedPlayer={selectedPlayer} onPlayerChange={() => setShowPlayerSelector(true)} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} onShowInfo={() => setShowInfoPopup(true)} />

      <style jsx>{`
        .episode-cover-placeholder {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
        }

        .cover-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0.6;
            transition: opacity 0.3s, transform 0.3s;
        }
        
        .episode-cover-placeholder:hover .cover-img {
            opacity: 0.4;
            transform: scale(1.02);
        }

        .play-btn-circle-thin {
            position: absolute;
            z-index: 2;
            width: 65px;
            height: 65px;
            border: 1px solid rgba(255, 255, 255, 0.6);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 1.4rem;
            background: rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(2px);
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            padding-left: 4px;
        }

        .episode-cover-placeholder:hover .play-btn-circle-thin {
            transform: scale(1.1);
            background: rgba(0, 0, 0, 0.3);
            border-color: #fff;
        }

        .video-overlay-wrapper {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
            padding: 20px;
            pointer-events: none;
        }

        .video-overlay-wrapper.active {
            pointer-events: auto;
        }

        .video-overlay-wrapper::before {
            content: '';
            position: absolute;
            inset: 0;
            backdrop-filter: blur(20px) saturate(120%) brightness(1.15);
            -webkit-backdrop-filter: blur(20px) saturate(120%) brightness(1.15);
            z-index: -1;
        }

        .video-overlay-wrapper::after {
            content: '';
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            z-index: -1;
        }

        .video-overlay-wrapper.closing { 
            animation: fadeOut 0.3s ease forwards; 
        }

        .video-player-group {
            display: flex;
            flex-direction: column;
            gap: 10px;
            position: relative;
            transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
            pointer-events: auto;
        }

        .video-player-group.square { width: min(90vw, 90vh); max-width: 600px; }
        .video-player-group.square .video-floating-container { aspect-ratio: 1 / 1; }
        .video-player-group.widescreen { width: 90vw; max-width: 1200px; }
        .video-player-group.widescreen .video-floating-container { aspect-ratio: 16 / 9; max-height: 80vh; }

        .video-floating-container {
            width: 100%;
            background: #000;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
            border-radius: 24px;
            overflow: hidden;
            position: relative;
            transition: aspect-ratio 0.4s ease;
        }

        .video-floating-container iframe { width: 100%; height: 100%; border: none; }
        .video-controls-toolbar { display: flex; justify-content: flex-end; gap: 12px; padding-right: 8px; }

        .toolbar-btn {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            font-size: 1.1rem;
            cursor: pointer;
            backdrop-filter: blur(5px);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }

        .toolbar-btn:hover { background: rgba(255, 255, 255, 0.25); transform: scale(1.1); }
        .toolbar-btn.close-btn:hover { background: var(--primary); border-color: var(--primary); }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }

        .toast-container {
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 999;
            width: 100%;
            max-width: 350px;
            padding: 0 10px;
            pointer-events: none;
        }
        
        .toast {
            background: var(--card-bg);
            border: 1px solid var(--border);
            color: var(--text);
            border-radius: 12px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            padding: 10px 15px;
            max-width: 100%;
            pointer-events: auto;
        }

        .clean-episode-title { font-size: 1.5rem; color: var(--text); margin: 0 0 0.5rem 0; font-weight: 600; line-height: 1.3; }
        .synopsis-wrapper { margin-bottom: 1.2rem; margin-top: 1rem; }
        .synopsis-toggle-btn { background: none; border: none; color: var(--secondary); font-size: 0.85rem; cursor: pointer; padding: 0; display: flex; align-items: center; gap: 6px; font-weight: 500; }
        .content-description-streaming { margin-bottom: 0.8rem; font-size: 0.9rem; line-height: 1.5; color: var(--text); opacity: 0.9; }
        .fade-in { animation: fadeIn 0.2s ease-in; }
      `}</style>
    </>
  )
}

const Header = () => (
  <header className="github-header">
    <div className="header-content">
      <Link href="/" className="logo-container">
        <img src="https://yoshikawa-bot.github.io/cache/images/14c34900.jpg" alt="Yoshikawa Bot" className="logo-image" />
        <div className="logo-text">
          <span className="logo-name">Yoshikawa</span>
          <span className="beta-tag">STREAMING</span>
        </div>
      </Link>
    </div>
  </header>
)

const BottomNav = ({ selectedPlayer, onPlayerChange, isFavorite, onToggleFavorite, onShowInfo }) => (
  <div className="bottom-nav-container streaming-mode">
    <div className="main-nav-bar">
      <Link href="/" className="nav-item"><i className="fas fa-home"></i><span>Início</span></Link>
      <button className="nav-item" onClick={onShowInfo}><i className="fas fa-info-circle"></i><span>Info</span></button>
      <button className={`nav-item ${isFavorite ? 'active' : ''}`} onClick={onToggleFavorite}>
        <i className={isFavorite ? 'fas fa-heart' : 'far fa-heart'}></i><span>Favorito</span>
      </button>
    </div>
    <button className="player-circle" onClick={onPlayerChange}>
      <i className={selectedPlayer === 'superflix' ? 'fas fa-film' : 'fas fa-bolt'}></i>
    </button>
  </div>
)
