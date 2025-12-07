import { useRouter } from 'next/router'
import { useState, useEffect, useRef, useCallback } from 'react'
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
  const [selectedPlayer, setSelectedPlayer] = useState('superflix') 
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [showPlayerSelector, setShowPlayerSelector] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  // ALTERAÇÃO 2: Apenas um toast é mantido no estado
  const [currentToast, setCurrentToast] = useState(null)
  
  const [showSynopsis, setShowSynopsis] = useState(false)
  
  const episodeListRef = useRef(null)

  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const STREAM_BASE_URL = 'https://superflixapi.blog'

  // ALTERAÇÃO 4: Função para forçar tela cheia
  const toggleFullScreen = () => {
    const doc = window.document.documentElement;
    const isFullscreen = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;

    if (!isFullscreen) {
      if (doc.requestFullscreen) {
        doc.requestFullscreen();
      } else if (doc.mozRequestFullScreen) { /* Firefox */
        doc.mozRequestFullScreen();
      } else if (doc.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
        doc.webkitRequestFullscreen();
      } else if (doc.msRequestFullscreen) { /* IE/Edge */
        doc.msRequestFullscreen();
      }
    }
    // Não remove a tela cheia automaticamente, apenas tenta iniciá-la
  }
  
  // ALTERAÇÃO 2: Lógica de substituição e animação de toast
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    const iconMap = {
      info: 'fas fa-info-circle',
      success: 'fas fa-check-circle',
      error: 'fas fa-times-circle',
    }
    const newToast = { id, message, type, icon: iconMap[type] }
    
    // Se já houver um toast, inicia a animação de saída
    if (currentToast) {
        // Marcamos o toast atual para iniciar a animação de saída
        setCurrentToast(prev => ({ ...prev, closing: true }));
        
        // Espera a animação de saída (300ms) e então exibe o novo
        setTimeout(() => {
            setCurrentToast(newToast);
            // Inicia o timer para remover o novo toast após 3 segundos
            setTimeout(() => {
                setCurrentToast(prev => prev ? { ...prev, closing: true } : null);
                setTimeout(() => setCurrentToast(null), 300);
            }, 3000);
        }, 300);
    } else {
        // Se não houver toast, exibe imediatamente
        setCurrentToast(newToast);
        setTimeout(() => {
            setCurrentToast(prev => prev ? { ...prev, closing: true } : null);
            setTimeout(() => setCurrentToast(null), 300);
        }, 3000);
    }
  }, [currentToast])
  
  // EFEITOS
  useEffect(() => {
    if (id) {
      loadTvShow(id)
      checkIfFavorite()
      
      // Tenta entrar em tela cheia logo no início (depende da permissão do navegador)
      toggleFullScreen() 
      
      setTimeout(() => {
        showToast('Player padrão definido: SuperFlix (DUB)', 'info')
      }, 1000)
    }
  }, [id])

  useEffect(() => {
    if (episodeListRef.current && seasonDetails) {
      const activeCard = episodeListRef.current.querySelector('.episode-card.active')
      if (activeCard) {
        activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [episode, seasonDetails])

  useEffect(() => {
    setShowSynopsis(false)
  }, [episode, season])

  // Lógica de carregamento e favoritos (mantida)
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
      showToast('Erro ao salvar favorito', 'error')
    }
  }

  const getPlayerUrl = () => {
    if (selectedPlayer === 'superflix') {
      return `${STREAM_BASE_URL}/serie/${id}/${season}/${episode}#noEpList#noLink#transparent#noBackground`
    } else {
      return `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`
    }
  }
  
  const closePopup = (setter) => {
    const element = document.querySelector('.info-popup-overlay.active, .player-selector-bubble.active');
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
  
  const handleSeasonChange = async (newSeason) => {
    setSeason(newSeason)
    await loadSeasonDetails(newSeason)
  }

  const handleEpisodeChange = (newEpisode) => {
    setEpisode(newEpisode)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePlayerChange = (player) => {
    setSelectedPlayer(player)
    closePopup(setShowPlayerSelector)
    showToast(`Servidor alterado para ${player === 'superflix' ? 'SuperFlix (DUB)' : 'VidSrc (LEG)'}`, 'info')
  }

  if (loading) return <div className="loading active"><div className="spinner"></div><p>Carregando...</p></div>
  if (error) return <div className="error-message active"><h3>Erro</h3><p>{error}</p><Link href="/">Voltar</Link></div>
  if (!tvShow) return null

  const currentEpisode = seasonDetails?.episodes?.find(ep => ep.episode_number === episode)
  const availableSeasons = tvShow.seasons?.filter(s => s.season_number > 0 && s.episode_count > 0) || []
  
  const backgroundImageUrl = tvShow.backdrop_path ? `https://image.tmdb.org/t/p/original${tvShow.backdrop_path}` : ''

  const ToastContainer = () => (
    <div className="toast-container">
      {currentToast && (
        <div 
          key={currentToast.id} 
          className={`toast toast-${currentToast.type} ${currentToast.closing ? 'closing' : 'show'}`}
        >
            <i className={currentToast.icon}></i>
            <div className="toast-content">{currentToast.message}</div>
        </div>
      )}
    </div>
  )

  return (
    <>
      <Head>
        <title>{tvShow.name} - Yoshikawa</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>

      {backgroundImageUrl && (
        <>
            <div className="background-image-cover" style={{ backgroundImage: `url(${backgroundImageUrl})` }}></div>
            {/* ALTERAÇÃO 1: Overlay escuro */}
            <div className="background-overlay"></div> 
        </>
      )}

      <Header />

      <main className="streaming-container">
        {/* PLAYER AREA */}
        <div className="player-container">
          <div className="player-wrapper">
            <iframe 
              src={getPlayerUrl()}
              allow="autoplay; encrypted-media; picture-in-picture" 
              allowFullScreen 
              loading="lazy" 
              title={`Player`}
            ></iframe>
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
                                    Reproduzindo
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

        {/* OVERLAYS (Player Selector & Info) */}
        {showPlayerSelector && (
            <div className="player-selector-overlay menu-overlay active" onClick={handleSelectorOverlayClick}>
                <div className={`player-selector-bubble ${showPlayerSelector ? 'active' : ''}`} onClick={(e) => e.stopPropagation()}>
                    <div className="player-options-bubble">
                        <div className="player-option-bubble" onClick={() => handlePlayerChange('superflix')}>
                            <div className="option-main-line">
                                <i className="fas fa-film"></i> <span>SuperFlix</span> <span className="player-tag-bubble player-tag-dub">DUB</span>
                            </div>
                        </div>
                        <div className="player-option-bubble" onClick={() => handlePlayerChange('vidsrc')}>
                            <div className="option-main-line">
                                <i className="fas fa-bolt"></i> <span>VidSrc</span> <span className="player-tag-bubble player-tag-sub">LEG</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {showInfoPopup && (
            <div className="info-popup-overlay active" onClick={handleInfoOverlayClick}>
              <div className="info-popup-content" onClick={(e) => e.stopPropagation()}>
                <div className="info-popup-header">
                  <img src={tvShow.poster_path ? `https://image.tmdb.org/t/p/w200${tvShow.poster_path}` : ''} className="info-poster" />
                  <div className="info-details">
                    <h2 className="info-title">{tvShow.name}</h2>
                    <p>{tvShow.overview}</p>
                  </div>
                </div>
                <button className="close-popup-btn" onClick={() => closePopup(setShowInfoPopup)}>Fechar</button>
              </div>
            </div>
        )}
      </main>

      <ToastContainer />
      <BottomNav 
        selectedPlayer={selectedPlayer}
        onPlayerChange={() => setShowPlayerSelector(true)}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        onShowInfo={() => setShowInfoPopup(true)}
      />

      <style jsx global>{`
        :root {
            --primary: #FF6B6B; 
            --card-bg: rgba(255, 255, 255, 0.1);
            --text: #F8F8F8;
            --secondary: #AAAAAA;
            --border: rgba(255, 255, 255, 0.15);
            --toast-info: #2096F3;
            --toast-success: #4CAF50;
            --toast-error: #F44336;
        }

        body, html, #__next {
            height: 100%;
            margin: 0;
            padding: 0;
            overflow-x: hidden;
        }
        
        /* ALTERAÇÃO 1: Imagem de fundo */
        .background-image-cover {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-size: cover;
            background-position: center;
            z-index: -2;
        }

        /* ALTERAÇÃO 1: Overlay escuro para melhorar contraste */
        .background-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            /* Escurecimento leve, mantendo a visibilidade da imagem */
            background: rgba(0, 0, 0, 0.6); 
            z-index: -1;
        }
      `}</style>
      
      <style jsx>{`
        /* ------------------------------------ */
        /* TOAST CONTAINER (ALTERAÇÃO 2) */
        /* ------------------------------------ */
        .toast-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            pointer-events: none;
        }

        .toast {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 15px;
            border-radius: 8px;
            color: var(--text);
            font-size: 0.9rem;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
            min-width: 250px;
            pointer-events: auto;
            /* Inicia fora da tela e com escala 0 */
            opacity: 0;
            transform: translateX(100%) scale(0.5);
            transition: all 0.3s ease-in-out; 
            /* Para quando o closing for aplicado, ter sua própria animação */
            position: absolute; 
            right: 0;
            top: 0;
        }
        
        /* Animação de Entrada: Aumenta e entra */
        .toast.show {
            opacity: 1;
            transform: translateX(0) scale(1);
        }

        /* Animação de Saída: Diminui e desaparece */
        .toast.closing {
            opacity: 0;
            transform: translateX(0) scale(0.5);
        }

        /* Cores dos Tipos de Toast */
        .toast-info {
            background-color: var(--toast-info);
            border-left: 5px solid #146EB4;
        }
        .toast-success {
            background-color: var(--toast-success);
            border-left: 5px solid #2E7D32;
        }
        .toast-error {
            background-color: var(--toast-error);
            border-left: 5px solid #C62828;
        }
        
        .toast i {
            font-size: 1.1rem;
            margin-right: 5px;
        }
        
        /* ------------------------------------ */
        /* LAYOUT E COMPONENTES */
        /* ------------------------------------ */

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

        /* ... outros estilos de sinopse e lista de episódios (mantidos) ... */
        
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

        /* ------------------------------------ */
        /* BOTTOM NAV (ALTERAÇÃO 3: Player ativo) */
        /* ------------------------------------ */
        .player-circle {
            /* Adicione estilos visuais para indicar qual player está ativo */
            position: absolute;
            bottom: 40px;
            right: 20px;
            background: var(--primary);
            color: white;
            border: 5px solid ${selectedPlayer === 'superflix' ? 'var(--toast-info)' : 'var(--border)'}; /* Indica Superflix */
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 10px rgba(0,0,0,0.4);
            font-size: 1.1rem;
        }

        .player-circle i {
            /* Ajuste o ícone para refletir o player ativo */
            color: ${selectedPlayer === 'superflix' ? 'var(--text)' : 'var(--text)'};
        }
        
        /* Indicador de Player Ativo */
        .player-circle::after {
            content: "${selectedPlayer === 'superflix' ? 'DUB' : 'LEG'}";
            position: absolute;
            top: -10px;
            padding: 2px 5px;
            border-radius: 4px;
            font-size: 0.6rem;
            font-weight: 700;
            background: ${selectedPlayer === 'superflix' ? 'var(--toast-info)' : 'var(--toast-success)'};
            color: white;
            white-space: nowrap;
        }
      `}</style>
    </>
  )
}

const Header = () => (
  <header className="github-header">
    <div className="header-content">
      <Link href="/" className="logo-container">
        <img src="https://yoshikawa-bot.github.io/cache/images/14c34900.jpg" alt="Yoshikawa" className="logo-image" />
        <div className="logo-text"><span className="logo-name">Yoshikawa</span><span className="beta-tag">STREAMING</span></div>
      </Link>
    </div>
  </header>
)

// O BottomNav agora tem um estilo dinâmico mais claro para o botão do player
const BottomNav = ({ selectedPlayer, onPlayerChange, isFavorite, onToggleFavorite, onShowInfo }) => (
  <div className="bottom-nav-container streaming-mode">
    <div className="main-nav-bar">
      <Link href="/" className="nav-item"><i className="fas fa-home"></i><span>Início</span></Link>
      <button className="nav-item" onClick={onShowInfo}><i className="fas fa-info-circle"></i><span>Info</span></button>
      <button className="nav-item favorite-btn" onClick={onToggleFavorite}>
        <i className={isFavorite ? 'fas fa-heart' : 'far fa-heart'}></i><span>Favorito</span>
      </button>
    </div>
    
    <button className="player-circle" onClick={onPlayerChange} data-player-active={selectedPlayer}>
      {/* O ícone representa a função de trocar, o indicador de player ativo está no CSS via ::after */}
      <i className="fas fa-sync-alt"></i> 
    </button>

    <style jsx>{`
      /* Estilos locais para o BottomNav, especialmente para o botão flutuante */
      .player-circle {
          position: fixed; /* Fixado em vez de absolute para manter a posição */
          bottom: 20px; /* Ajuste para ficar acima da nav bar */
          right: 20px;
          
          /* Cor e estilo geral */
          background: var(--primary);
          color: var(--text);
          border: 3px solid ${selectedPlayer === 'superflix' ? 'var(--toast-info)' : 'var(--toast-success)'}; 
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 10px rgba(0,0,0,0.6);
          font-size: 1.1rem;
          z-index: 900; 
      }

      /* Indicador de Player Ativo (DUB/LEG) */
      .player-circle::after {
          content: attr(data-player-active) === 'superflix' ? 'DUB' : 'LEG';
          position: absolute;
          top: -10px;
          padding: 2px 5px;
          border-radius: 4px;
          font-size: 0.6rem;
          font-weight: 700;
          /* Cor mais clara para o fundo da badge */
          background: attr(data-player-active) === 'superflix' ? 'var(--toast-info)' : 'var(--toast-success)';
          color: white;
          white-space: nowrap;
      }
      
      .player-circle:hover {
          transform: scale(1.1);
      }

      /* Outros estilos do BottomNav */
      .bottom-nav-container {
        /* ... estilos existentes ... */
      }
      
      .main-nav-bar {
         /* ... estilos existentes ... */
      }
    `}</style>
  </div>
)
