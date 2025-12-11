import { useRouter } from 'next/router'
import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function TVShow() {
  const router = useRouter()
  const { id } = router.query
  const [tvShow, setTvShow] = useState(null)
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [seasonDetails, setSeasonDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Padrão SuperFlix
  const [selectedPlayer, setSelectedPlayer] = useState('superflix')
  
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [showPlayerSelector, setShowPlayerSelector] = useState(false)
  
  // Estado para controlar o Pop-up do Vídeo
  const [showVideoPlayer, setShowVideoPlayer] = useState(false)
  // Estado para controlar formato (Quadrado 1:1 ou Wide 16:9)
  const [isWideScreen, setIsWideScreen] = useState(false)

  const [isFavorite, setIsFavorite] = useState(false)
  
  // Estado para notificação única
  const [toast, setToast] = useState(null)
  const toastTimeoutRef = useRef(null)
  
  const [showSynopsis, setShowSynopsis] = useState(false)
  
  const episodeListRef = useRef(null)

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
      loadTvShow(id)
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
  }, [showVideoPlayer]) 

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
      const handleResize = () => {
        if (window.innerWidth > window.innerHeight) {
            setIsWideScreen(true);
        } else {
            setIsWideScreen(false);
        }
      };
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [showVideoPlayer]);

  useEffect(() => {
    setShowSynopsis(false)
  }, [episode, season])

  const loadTvShow = async (tvId) => {
    try {
      setLoading(true)
      const tvUrl = `https://api.themoviedb.org/3/tv/${tvId}?api_key=${TMDB_API_KEY}&language=pt-BR`
      const tvResponse = await fetch(tvUrl)
      if (!tvResponse.ok) throw new Error('Série não encontrada')
      const tvData = await tvResponse.json()
      setTvShow(tvData)
      
      if (tvData.seasons && tvData.seasons.length > 0) {
        const firstSeason = tvData.seasons.find(s => s.season_number > 0) || tvData.seasons[0]
        if (firstSeason) {
          setSeason(firstSeason.season_number)
          await loadSeasonDetails(firstSeason.season_number)
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadSeasonDetails = async (seasonNumber) => {
    try {
      setLoading(true)
      const seasonUrl = `https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=pt-BR`
      const seasonResponse = await fetch(seasonUrl)
      if (seasonResponse.ok) {
        const seasonData = await seasonResponse.json()
        setSeasonDetails(seasonData)
        if (seasonData.episodes && seasonData.episodes.length > 0) {
          setEpisode(1)
        }
      } else {
        setSeasonDetails(null)
      }
    } catch (err) {
      setSeasonDetails(null)
    } finally {
      setLoading(false)
    }
  }

  const checkIfFavorite = () => {
    try {
      const savedFavorites = localStorage.getItem('yoshikawaFavorites')
      const favorites = savedFavorites ? JSON.parse(savedFavorites) : []
      const isFav = favorites.some(fav => fav.id === parseInt(id) && fav.media_type === 'tv')
      setIsFavorite(isFav)
    } catch (error) {
      setIsFavorite(false)
    }
  }

  const toggleFavorite = () => {
    if (!tvShow) return
    try {
      const savedFavorites = localStorage.getItem('yoshikawaFavorites')
      const favorites = savedFavorites ? JSON.parse(savedFavorites) : []
      if (isFavorite) {
        const newFavorites = favorites.filter(fav => !(fav.id === parseInt(id) && fav.media_type === 'tv'))
        localStorage.setItem('yoshikawaFavorites', JSON.stringify(newFavorites))
        setIsFavorite(false)
        showToast('Removido dos favoritos', 'info')
      } else {
        const newFavorite = {
          id: parseInt(id),
          media_type: 'tv',
          title: tvShow.name,
          poster_path: tvShow.poster_path,
          first_air_date: tvShow.first_air_date,
          overview: tvShow.overview
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
    const fullScreenParam = '&fullScreen=false' 
    if (selectedPlayer === 'superflix') {
      return `${STREAM_BASE_URL}/serie/${id}/${season}/${episode}#noEpList#noLink#transparent#noBackground${fullScreenParam}`
    } else {
      return `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`
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

  const handleVideoOverlayClick = (e) => {
    e.stopPropagation(); 
  }
  
  const toggleVideoFormat = () => {
    setIsWideScreen(!isWideScreen);
  }
  
  const handleSeasonChange = async (newSeason) => {
    setShowVideoPlayer(false)
    setSeason(newSeason)
    await loadSeasonDetails(newSeason)
  }

  const handleEpisodeChange = (newEpisode) => {
    setShowVideoPlayer(false)
    setEpisode(newEpisode)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePlayerChange = (player) => {
    setSelectedPlayer(player)
    closePopup(setShowPlayerSelector)
    showToast(`Servidor alterado para ${player === 'superflix' ? 'SuperFlix (DUB)' : 'VidSrc (LEG)'}`, 'info')
    if (showVideoPlayer) {
        setShowVideoPlayer(false)
        setTimeout(() => setShowVideoPlayer(true), 100); 
    }
  }

  if (loading) return <div className="loading active"><div className="spinner"></div><p>Carregando...</p></div>
  if (error) return <div className="error-message active"><h3>Erro</h3><p>{error}</p><Link href="/">Voltar</Link></div>
  if (!tvShow) return null

  const currentEpisode = seasonDetails?.episodes?.find(ep => ep.episode_number === episode)
  const availableSeasons = tvShow.seasons?.filter(s => s.season_number > 0 && s.episode_count > 0) || []

  const coverImage = currentEpisode?.still_path 
    ? `https://image.tmdb.org/t/p/original${currentEpisode.still_path}`
    : (tvShow.backdrop_path ? `https://image.tmdb.org/t/p/original${tvShow.backdrop_path}` : null);

  const SingleToast = ({ showVideoPlayer }) => {
    if (!toast) return null;
    if (showVideoPlayer) return null; 

    return (
      <div className="toast-container">
        <div 
            key={toast.id} 
            className={`toast toast-${toast.type} show`}
            style={{ animation: 'toast-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        >
            <div className="toast-icon">
                <i className={`fas ${
                  toast.type === 'success' ? 'fa-check' : 
                  toast.type === 'error' ? 'fa-exclamation-triangle' : 
                  'fa-info'
                }`}></i>
            </div>
            <div className="toast-content">{toast.message}</div>
            <button className="toast-close" onClick={removeToast}>
                <i className="fas fa-times"></i>
            </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>{tvShow.name} - Yoshikawa</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>

      <main className="streaming-container">
        
        {/* ÁREA DA CAPA / BOTÃO DE PLAY SIMPLES */}
        <div className="player-container">
          <div className="player-wrapper">
             <div className="episode-cover-placeholder" onClick={() => setShowVideoPlayer(true)}>
                {coverImage ? (
                    <img src={coverImage} alt="Episode Cover" className="cover-img" />
                ) : (
                    <div className="cover-fallback"></div>
                )}
                {/* Botão de Play Simples (Sem círculo, ícone menor) */}
                <div className="simple-play-circle">
                    <i className="fas fa-play"></i>
                </div>
             </div>
          </div>
        </div>

        {/* INFO AREA */}
        <div className="content-info-streaming">
            
          <div className="meta-header-row">
            <span className="episode-label-simple">Episódio {episode}</span>
            
            <div className="season-selector-wrapper">
                <select 
                    className="modern-season-select"
                    value={season}
                    onChange={(e) => handleSeasonChange(parseInt(e.target.value))}
                >
                    {availableSeasons.map(s => (
                        <option key={s.season_number} value={s.season_number}>
                            Temporada {s.season_number}
                        </option>
                    ))}
                </select>
            </div>
          </div>
          
          <h1 className="clean-episode-title">
             {currentEpisode?.name || `Episódio ${episode}`}
          </h1>

          <div className="synopsis-wrapper">
            {showSynopsis && (
                <p className="content-description-streaming fade-in">
                    {currentEpisode?.overview || tvShow.overview || 'Sinopse não disponível.'}
                </p>
            )}
            <button 
                className="synopsis-toggle-btn"
                onClick={() => setShowSynopsis(!showSynopsis)}
            >
                {showSynopsis ? (
                    <span><i className="fas fa-chevron-up"></i> Ocultar Sinopse</span>
                ) : (
                    <span><i className="fas fa-align-left"></i> Ler Sinopse</span>
                )}
            </button>
          </div>

          <div className="episodes-list-container">
            <div className="episodes-scroller" ref={episodeListRef}>
                {seasonDetails?.episodes?.map(ep => (
                    <div 
                        key={ep.episode_number}
                        className={`episode-card ${ep.episode_number === episode ? 'active' : ''}`}
                        onClick={() => handleEpisodeChange(ep.episode_number)}
                    >
                        <div className="episode-thumbnail">
                            {ep.still_path ? (
                                <img 
                                    src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} 
                                    alt={`Episódio ${ep.episode_number}`}
                                    loading="lazy"
                                />
                            ) : (
                                <div className="no-thumbnail"><i className="fas fa-play"></i></div>
                            )}
                            <div className="episode-number-badge">{ep.episode_number}</div>
                            {ep.episode_number === episode && (
                                <div className="playing-indicator">
                                    Selecionado
                                </div>
                            )}
                        </div>
                        <div className="episode-info-mini">
                            <span className="ep-title">{ep.name}</span>
                        </div>
                    </div>
                )) || <div className="loading-eps">Carregando...</div>}
            </div>
          </div>
        </div>

        {/* OVERLAY DO VIDEO PLAYER (POPUP) */}
        {showVideoPlayer && (
            <div className="video-overlay-wrapper active" onClick={handleVideoOverlayClick}>
                
                <div className={`video-player-group ${isWideScreen ? 'widescreen' : 'square'}`} onClick={(e) => e.stopPropagation()}>
                    
                    <div className="video-controls-toolbar">
                        <button className="toolbar-btn" onClick={toggleVideoFormat} title="Girar / Alterar Formato">
                            <i className={`fas ${isWideScreen ? 'fa-compress' : 'fa-expand'}`}></i>
                        </button>
                        <button className="toolbar-btn close-btn" onClick={() => closePopup(setShowVideoPlayer)} title="Fechar">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    <div className="video-floating-container">
                        <iframe 
                            src={getPlayerUrl()}
                            allow="autoplay; encrypted-media; picture-in-picture" 
                            allowFullScreen 
                            title={`Player`}
                        ></iframe>
                    </div>
                </div>
            </div>
        )}

        {/* SELETOR DE PLAYER - FUNDO 100% TRANSPARENTE, BLUR SÓ NO BUBBLE */}
        {showPlayerSelector && (
            <div className="player-selector-overlay menu-overlay active" onClick={handleSelectorOverlayClick}>
                <div 
                    className={`player-selector-bubble ${showPlayerSelector ? 'active' : ''}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="player-options-bubble">
                        <div 
                            className="player-option-bubble"
                            onClick={() => handlePlayerChange('superflix')}
                        >
                            <div className="option-main-line">
                                <i className="fas fa-film"></i>
                                <span className="option-name">SuperFlix</span>
                                <span className="player-tag-bubble player-tag-dub">DUB</span>
                            </div>
                            <span className="option-details">Lento, mas possui dublagem.</span>
                        </div>
                        <div 
                            className="player-option-bubble"
                            onClick={() => handlePlayerChange('vidsrc')}
                        >
                            <div className="option-main-line">
                                <i className="fas fa-bolt"></i>
                                <span className="option-name">VidSrc</span>
                                <span className="player-tag-bubble player-tag-sub">LEG</span>
                            </div>
                            <span className="option-details">Mais rápido, mas apenas legendado.</span>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* POPUP DE INFO - FUNDO 100% TRANSPARENTE, BLUR SÓ NO CARD */}
        {showInfoPopup && (
            <div className="info-popup-overlay active" onClick={handleInfoOverlayClick}>
              <div className="info-popup-content technical-info" onClick={(e) => e.stopPropagation()}>
                <div className="info-popup-header-tech">
                    <h2 className="info-title-tech">Informações Técnicas</h2>
                </div>
                <div className="tech-info-list">
                    <div className="tech-item">
                        <span className="tech-label">Título Original:</span>
                        <span className="tech-value">{tvShow.original_name}</span>
                    </div>
                    <div className="tech-item">
                        <span className="tech-label">Lançamento:</span>
                        <span className="tech-value">{tvShow.first_air_date ? new Date(tvShow.first_air_date).toLocaleDateString('pt-BR') : 'N/A'}</span>
                    </div>
                    <div className="tech-item">
                        <span className="tech-label">Gêneros:</span>
                        <span className="tech-value">{tvShow.genres?.map(g => g.name).join(', ')}</span>
                    </div>
                    <div className="tech-item">
                        <span className="tech-label">Temporadas:</span>
                        <span className="tech-value">{tvShow.number_of_seasons}</span>
                    </div>
                    <div className="tech-item">
                        <span className="tech-label">Episódios:</span>
                        <span className="tech-value">{tvShow.number_of_episodes}</span>
                    </div>
                    <div className="tech-item">
                        <span className="tech-label">Nota (TMDB):</span>
                        <span className="tech-value"><i className="fas fa-star" style={{color: '#ffd700', marginRight: '5px'}}></i>{tvShow.vote_average?.toFixed(1)}</span>
                    </div>
                    <div className="tech-item">
                        <span className="tech-label">Status:</span>
                        <span className="tech-value">{tvShow.status}</span>
                    </div>
                </div>
                <button className="close-popup-btn tech-close" onClick={() => closePopup(setShowInfoPopup)}>Fechar</button>
              </div>
            </div>
        )}
      </main>

      <SingleToast showVideoPlayer={showVideoPlayer} />
      <BottomNav 
        selectedPlayer={selectedPlayer}
        onPlayerChange={() => setShowPlayerSelector(true)}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        onShowInfo={() => setShowInfoPopup(true)}
      />

      <style jsx>{`
        /* --- ESTILOS DA CAPA E BOTÃO PLAY SIMPLES --- */
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

        /* Botão play ajustado: Menor e sem fundo */
        .simple-play-circle {
            position: absolute;
            z-index: 2;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 2.5rem; /* Reduzido de 4rem */
            text-shadow: 0 4px 20px rgba(0,0,0,0.6);
            transition: transform 0.3s;
        }

        .episode-cover-placeholder:hover .simple-play-circle {
            transform: scale(1.1);
        }

        /* --- ESTILOS DOS POPUPS --- */
        /* O fundo (overlay) é transparente e sem blur */
        .video-overlay-wrapper,
        .info-popup-overlay,
        .player-selector-overlay {
            position: fixed;
            inset: 0;
            background: transparent !important;
            backdrop-filter: none !important;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
            padding: 20px;
        }
        
        /* Apenas o conteúdo (o card) tem blur e fundo semi-transparente */
        .info-popup-content.technical-info {
            background: rgba(18, 18, 18, 0.95); /* Fundo com opacidade para blur */
            backdrop-filter: blur(20px); /* Blur aplicado aqui */
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid var(--border, #333);
            border-radius: 12px;
            padding: 25px;
            width: 100%;
            max-width: 500px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            color: var(--text);
            text-align: left;
        }
        
        /* Seletor de Player: Blur no Bubble */
        .player-selector-bubble {
            background: rgba(26, 26, 26, 0.95); /* Fundo semi-transparente */
            backdrop-filter: blur(20px); /* Blur aplicado aqui */
            -webkit-backdrop-filter: blur(20px);
            /* ... (outros estilos herdados globalmente ou definidos aqui se necessário) ... */
            border-radius: 16px;
            border: 1px solid var(--border, #333);
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        }

        .info-popup-header-tech {
            margin-bottom: 20px;
            border-bottom: 1px solid var(--border, #333);
            padding-bottom: 10px;
        }

        .info-title-tech {
            font-size: 1.4rem;
            color: var(--text);
            margin: 0;
            font-weight: 600;
        }

        .tech-info-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 20px;
        }

        .tech-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            padding-bottom: 8px;
        }

        .tech-label {
            color: var(--secondary, #aaa);
            font-weight: 500;
            font-size: 0.95rem;
        }

        .tech-value {
            color: var(--text, #fff);
            font-weight: 600;
            font-size: 0.95rem;
            text-align: right;
            max-width: 60%;
        }

        .close-popup-btn.tech-close {
            width: 100%;
            padding: 12px;
            background: var(--primary, #e50914);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.2s;
        }
        
        .close-popup-btn.tech-close:hover {
            opacity: 0.9;
        }

        /* --- RESTANTE DO CSS --- */
        .video-overlay-wrapper.closing {
            animation: fadeOut 0.3s ease forwards;
        }

        .video-player-group {
            display: flex;
            flex-direction: column;
            gap: 10px;
            position: relative;
            transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .video-player-group.square {
            width: min(90vw, 90vh);
            max-width: 600px; 
        }

        .video-player-group.square .video-floating-container {
            aspect-ratio: 1 / 1;
        }

        .video-player-group.widescreen {
            width: 90vw;
            max-width: 1200px;
        }

        .video-player-group.widescreen .video-floating-container {
            aspect-ratio: 16 / 9;
            max-height: 80vh; 
        }

        .video-floating-container {
            width: 100%;
            background: #000;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
            border-radius: 24px; 
            overflow: hidden;
            position: relative;
            transition: aspect-ratio 0.4s ease;
        }

        .video-floating-container iframe {
            width: 100%;
            height: 100%;
            border: none;
        }

        .video-controls-toolbar {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            padding-right: 8px;
        }

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

        .toolbar-btn:hover {
            background: rgba(255, 255, 255, 0.25);
            transform: scale(1.1);
        }

        .toolbar-btn.close-btn:hover {
            background: var(--primary);
            border-color: var(--primary);
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }

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
            top: 0; 
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

        @keyframes toast-slide-up {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        .meta-header-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }

        .episode-label-simple {
            color: var(--primary); 
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 700;
        }

        .season-selector-wrapper select {
            appearance: none;
            background: var(--card-bg);
            color: var(--text);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 4px 12px;
            font-size: 0.85rem;
            outline: none;
            cursor: pointer;
            backdrop-filter: blur(5px);
            font-family: 'Inter', sans-serif;
            transition: none;
        }

        .season-selector-wrapper select:focus,
        .season-selector-wrapper select:hover {
            border-color: var(--border);
            box-shadow: none;
        }
        
        .season-selector-wrapper select option {
            background: #1a1a1a; 
            color: var(--text);
        }

        .clean-episode-title {
            font-size: 1.3rem;
            color: var(--text);
            margin: 0 0 0.8rem 0;
            font-weight: 600;
            line-height: 1.3;
        }

        .synopsis-wrapper {
            margin-bottom: 1.2rem;
        }
        
        .synopsis-toggle-btn {
            background: none;
            border: none;
            color: var(--secondary);
            font-size: 0.85rem;
            cursor: pointer;
            padding: 0;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: none;
            font-weight: 500;
        }
        
        .synopsis-toggle-btn:hover {
            color: var(--secondary);
        }

        .content-description-streaming {
            margin-bottom: 0.8rem;
            font-size: 0.9rem;
            line-height: 1.5;
            color: var(--text);
            opacity: 0.9;
        }

        .fade-in {
            animation: fadeIn 0.2s ease-in;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .episodes-list-container {
            width: 100%;
        }

        .episodes-scroller {
            display: flex;
            gap: 10px;
            overflow-x: auto;
            padding-bottom: 8px;
            scrollbar-width: none;
        }
        
        .episodes-scroller::-webkit-scrollbar {
            display: none;
        }

        .episode-card {
            min-width: 130px;
            width: 130px;
            cursor: pointer;
            opacity: 0.6;
            transition: opacity 0.2s;
        }

        .episode-card.active {
            opacity: 1;
        }

        .episode-thumbnail {
            position: relative;
            width: 100%;
            aspect-ratio: 16/9;
            border-radius: 8px;
            overflow: hidden;
            background: var(--card-bg);
            margin-bottom: 4px;
            border: 2px solid var(--border);
        }

        .episode-card.active .episode-thumbnail {
            border-color: var(--primary); 
        }

        .episode-thumbnail img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .no-thumbnail {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--card-bg);
            color: var(--secondary);
        }

        .episode-number-badge {
            position: absolute;
            top: 4px;
            left: 4px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 1px 5px;
            font-size: 0.7rem;
            border-radius: 4px;
            font-weight: 600;
        }

        .playing-indicator {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: var(--primary);
            color: white;
            font-size: 0.65rem;
            text-align: center;
            padding: 2px 0;
            font-weight: 600;
        }

        .ep-title {
            font-size: 0.8rem;
            color: var(--secondary);
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            line-height: 1.2;
        }

        .episode-card.active .ep-title {
            color: var(--text);
            font-weight: 600;
        }
      `}</style>
    </>
  )
}

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
