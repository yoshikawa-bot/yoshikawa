import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
const DEFAULT_BACKDROP = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'

// ============================================================================
// CLIENTE TORRENTIO PURO - SEM PASSAR PELA VERCEL
// ============================================================================

class TorrentioClient {
  static async getIMDbId(tmdbId, type) {
    const endpoint = type === 'movie' 
      ? `https://api.themoviedb.org/3/movie/${tmdbId}/external_ids`
      : `https://api.themoviedb.org/3/tv/${tmdbId}/external_ids`;
    
    const response = await fetch(`${endpoint}?api_key=${TMDB_API_KEY}`);
    const data = await response.json();
    return data.imdb_id;
  }

  static async fetchStreams(imdbId, type, season = null, episode = null) {
    let fullId = imdbId;
    if (type === 'tv' && season && episode) {
      fullId = `${imdbId}:${season}:${episode}`;
    }

    const torrentioType = type === 'tv' ? 'series' : 'movie';
    
    // DIRETO DO CLIENTE - SEM PASSAR PELA VERCEL
    const torrentioUrl = `https://torrentio.strem.fun/stream/${torrentioType}/${fullId}.json`;
    
    try {
      const response = await fetch(torrentioUrl);
      const data = await response.json();
      return data.streams || [];
    } catch (error) {
      console.error('Erro ao buscar do Torrentio:', error);
      throw new Error('Falha ao conectar com Torrentio');
    }
  }

  static filterPortugueseStreams(streams) {
    return streams.filter(s => {
      const title = s.title?.toLowerCase() || '';
      const name = s.name?.toLowerCase() || '';
      
      return (
        title.includes('dual') ||
        title.includes('dublado') ||
        title.includes('português') ||
        title.includes('pt-br') ||
        title.includes('pt br') ||
        title.includes('legendado') ||
        name.includes('🇵🇹') ||
        name.includes('🇧🇷')
      );
    });
  }

  static sortStreamsByQuality(streams) {
    const qualityOrder = {
      '2160p': 5,
      '1080p': 4,
      '720p': 3,
      '480p': 2,
      '360p': 1
    };

    return streams.sort((a, b) => {
      const qualityA = qualityOrder[a.name?.split('\n')[1]] || 0;
      const qualityB = qualityOrder[b.name?.split('\n')[1]] || 0;
      return qualityB - qualityA;
    });
  }
}

// ============================================================================
// COMPONENTES UI
// ============================================================================

export const Header = ({ 
  label, scrolled, 
  showInfo, toggleInfo, infoClosing, 
  showTech, toggleTech, techClosing,
  navHidden
}) => {
  
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
      <header className={`bar-container top-bar ${scrolled ? 'scrolled-state' : ''} ${navHidden ? 'nav-hidden' : ''}`}>
        
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
          className={`standard-popup glass-panel ${infoClosing ? 'closing' : ''}`} 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="popup-icon-wrapper info">
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
          className={`standard-popup glass-panel ${techClosing ? 'closing' : ''}`} 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="popup-icon-wrapper tech">
            <i className="fas fa-microchip"></i>
          </div>
          <div className="popup-content">
            <p className="popup-title">Client-Side Streaming</p>
            <p className="popup-text">v4.0.0 • WebTorrent • Torrentio • Zero Server Load</p>
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
    <div className={`bar-container bottom-bar ${navHidden ? 'nav-hidden' : ''}`}>
      <button className="round-btn glass-panel" onClick={handleShare} title="Compartilhar">
        <i className="fas fa-arrow-up-from-bracket" style={{ fontSize: '15px', transform: 'translateY(-1px)' }}></i>
      </button>

      <div className={`pill-container glass-panel ${navHidden ? 'hidden-pill' : ''}`}>
         <button className="nav-btn" onClick={onToggleData} title="Dados do Título">
            <i className="fas fa-film"></i>
         </button>

         <button className="nav-btn hide-toggle-pill-btn" onClick={onToggleNav} title={navHidden ? "Mostrar Menu" : "Ocultar Menu"}>
            <i className={navHidden ? "fas fa-chevron-down" : "fas fa-chevron-up"}></i>
         </button>

         <button className="nav-btn" onClick={onToggleSynopsis} title="Sinopse">
            <i className="fas fa-align-left"></i>
         </button>
      </div>

      <button className={`round-btn glass-panel ${navHidden ? 'hidden-fav' : ''}`} onClick={handleFavClick} title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}>
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

const LoadingScreen = ({ visible }) => {
  if (!visible) return null;
  return (
    <div className={`loading-overlay ${!visible ? 'fade-out' : ''}`}>
      <div className="loading-content">
        <div className="spinner-apple">
          <div className="spinner-ring"></div>
        </div>
        <div className="loading-bar">
          <div className="loading-progress"></div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// PÁGINA PRINCIPAL
// ============================================================================

export default function WatchPage() {
  const router = useRouter()
  const { type, id } = router.query
  const carouselRef = useRef(null)
  const webTorrentClientRef = useRef(null)
  const currentTorrentRef = useRef(null)
  
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

  const [availableStreams, setAvailableStreams] = useState([])
  const [selectedStream, setSelectedStream] = useState(null)
  const [showStreamSelector, setShowStreamSelector] = useState(false)
  const [streamSelectorClosing, setStreamSelectorClosing] = useState(false)
  const [torrentStatus, setTorrentStatus] = useState({ speed: 0, peers: 0, progress: 0 })
  const [isLoadingStreams, setIsLoadingStreams] = useState(false)

  const toastTimerRef = useRef(null)

  useEffect(() => {
    if (content) {
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 1000) 
      return () => clearTimeout(timer)
    }
  }, [content])

  const showToast = (message, type = 'info') => {
    if (showInfoPopup || showTechPopup || showSynopsisPopup || showDataPopup) {
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

  useEffect(() => {
    if (!id || !type) return

    const loadContent = async () => {
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

  // ============================================================================
  // BUSCA DE STREAMS - 100% CLIENT-SIDE
  // ============================================================================
  
  const fetchAvailableStreams = async () => {
    setIsLoadingStreams(true)
    showToast('Buscando streams...', 'info')

    try {
      // 1. Pega IMDb ID direto do TMDB (client-side)
      const imdbId = await TorrentioClient.getIMDbId(id, type)
      
      if (!imdbId) {
        throw new Error('IMDb ID não encontrado')
      }

      showToast(`IMDb: ${imdbId} - Conectando Torrentio...`, 'info')

      // 2. Busca streams direto do Torrentio (client-side, sem Vercel)
      const streams = await TorrentioClient.fetchStreams(
        imdbId, 
        type, 
        type === 'tv' ? season : null, 
        type === 'tv' ? episode : null
      )

      if (streams.length === 0) {
        showToast('Nenhum stream encontrado', 'error')
        setIsLoadingStreams(false)
        return
      }

      // 3. Filtra PT-BR
      const ptStreams = TorrentioClient.filterPortugueseStreams(streams)
      
      // 4. Ordena por qualidade
      const sortedPT = TorrentioClient.sortStreamsByQuality(ptStreams)
      const sortedAll = TorrentioClient.sortStreamsByQuality(streams)

      // 5. Combina: PT primeiro, depois outros
      const finalStreams = [
        ...sortedPT.slice(0, 8),
        ...sortedAll.filter(s => !sortedPT.includes(s)).slice(0, 7)
      ]

      setAvailableStreams(finalStreams)
      setShowStreamSelector(true)
      showToast(`${finalStreams.length} streams encontrados`, 'success')

    } catch (error) {
      console.error('Erro ao buscar streams:', error)
      showToast('Erro: ' + error.message, 'error')
    } finally {
      setIsLoadingStreams(false)
    }
  }

  // ============================================================================
  // WEBTORRENT - STREAMING DIRETO NO CLIENTE
  // ============================================================================

  const startWebTorrentStream = (stream) => {
    if (typeof window === 'undefined') return

    if (!window.WebTorrent) {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/webtorrent@latest/webtorrent.min.js'
      script.onload = () => initializeWebTorrent(stream)
      document.head.appendChild(script)
    } else {
      initializeWebTorrent(stream)
    }
  }

  const initializeWebTorrent = (stream) => {
    setSelectedStream(stream)
    setShowStreamSelector(false)
    setIsPlaying(true)

    if (currentTorrentRef.current) {
      currentTorrentRef.current.destroy()
      currentTorrentRef.current = null
    }

    if (!webTorrentClientRef.current) {
      webTorrentClientRef.current = new window.WebTorrent({
        maxConns: 55,
        tracker: {
          announce: [
            'udp://tracker.opentrackr.org:1337/announce',
            'udp://open.tracker.cl:1337/announce',
            'udp://tracker.torrent.eu.org:451/announce',
            'udp://exodus.desync.com:6969/announce',
            'wss://tracker.btorrent.xyz',
            'wss://tracker.openwebtorrent.com'
          ]
        }
      })
    }

    const magnetURI = `magnet:?xt=urn:btih:${stream.infoHash}&dn=${encodeURIComponent(stream.title)}`
    
    showToast('Conectando aos peers...', 'info')

    const client = webTorrentClientRef.current
    
    client.add(magnetURI, {
      destroyStoreOnDestroy: true,
      storeCacheSlots: 20
    }, (torrent) => {
      currentTorrentRef.current = torrent

      const videoFile = torrent.files
        .filter(f => {
          const ext = f.name.split('.').pop().toLowerCase()
          return ['mp4', 'mkv', 'avi', 'webm', 'mov', 'm4v'].includes(ext)
        })
        .sort((a, b) => b.size - a.size)[0]

      if (!videoFile) {
        showToast('Nenhum arquivo de vídeo encontrado', 'error')
        setIsPlaying(false)
        return
      }

      torrent.deselect(0, torrent.pieces.length - 1, false)
      videoFile.select()

      showToast(`Carregando: ${videoFile.name}`, 'success')

      setTimeout(() => {
        const playerElement = document.getElementById('webtorrent-player')
        if (playerElement) {
          videoFile.appendTo(playerElement, { autoplay: true, controls: true }, (err) => {
            if (err) {
              console.error('Erro ao anexar vídeo:', err)
              showToast('Erro ao carregar vídeo', 'error')
              return
            }

            const video = playerElement.querySelector('video')
            if (video) {
              setupVideoMemoryManagement(video, torrent)
              setupTorrentStatsMonitoring(torrent)
            }
          })
        }
      }, 100)
    })
  }

  const setupVideoMemoryManagement = (video, torrent) => {
    let lastCleanupPiece = 0
    const BUFFER_BEHIND = 10
    const BUFFER_AHEAD = 50

    video.addEventListener('timeupdate', () => {
      const currentTime = video.currentTime
      const duration = video.duration

      if (!duration || currentTime < 30) return

      const currentPiece = Math.floor((currentTime / duration) * torrent.pieces.length)

      const oldestToKeep = Math.max(0, currentPiece - BUFFER_BEHIND)
      if (oldestToKeep > lastCleanupPiece) {
        torrent.deselect(lastCleanupPiece, oldestToKeep - 1)
        lastCleanupPiece = oldestToKeep
      }

      const maxFuture = Math.min(currentPiece + BUFFER_AHEAD, torrent.pieces.length - 1)
      if (maxFuture < torrent.pieces.length - 1) {
        torrent.deselect(maxFuture + 1, torrent.pieces.length - 1)
      }
    })
  }

  const setupTorrentStatsMonitoring = (torrent) => {
    const interval = setInterval(() => {
      if (!torrent || torrent.destroyed) {
        clearInterval(interval)
        return
      }

      setTorrentStatus({
        speed: torrent.downloadSpeed,
        upload: torrent.uploadSpeed,
        peers: torrent.numPeers,
        progress: (torrent.progress * 100).toFixed(1)
      })
    }, 1000)
  }

  useEffect(() => {
    return () => {
      if (currentTorrentRef.current) {
        currentTorrentRef.current.destroy({ destroyStore: true })
      }
      if (webTorrentClientRef.current) {
        webTorrentClientRef.current.destroy()
      }
    }
  }, [])

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

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
    if (showDataPopup && !dataClosing) {
      setDataClosing(true)
      setTimeout(() => { setShowDataPopup(false); setDataClosing(false) }, 400)
    }
    if (showStreamSelector && !streamSelectorClosing) {
      setStreamSelectorClosing(true)
      setTimeout(() => { setShowStreamSelector(false); setStreamSelectorClosing(false) }, 400)
    }
    if (currentToast && !currentToast.closing) {
      setCurrentToast(prev => ({ ...prev, closing: true }))
    }
  }, [showInfoPopup, infoClosing, showTechPopup, techClosing, showSynopsisPopup, synopsisClosing, showDataPopup, dataClosing, showStreamSelector, streamSelectorClosing, currentToast])

  const toggleInfoPopup = () => {
    if (showTechPopup || showSynopsisPopup || showDataPopup || showStreamSelector || currentToast) {
      closeAllPopups()
      setTimeout(() => { if (!showInfoPopup) setShowInfoPopup(true) }, 200)
    } else {
      if (showInfoPopup) {
        setInfoClosing(true)
        setTimeout(() => { setShowInfoPopup(false); setInfoClosing(false) }, 400)
      } else { setShowInfoPopup(true) }
    }
  }

  const toggleTechPopup = () => {
    if (showInfoPopup || showSynopsisPopup || showDataPopup || showStreamSelector || currentToast) {
      closeAllPopups()
      setTimeout(() => { if (!showTechPopup) setShowTechPopup(true) }, 200)
    } else {
      if (showTechPopup) {
        setTechClosing(true)
        setTimeout(() => { setShowTechPopup(false); setTechClosing(false) }, 400)
      } else { setShowTechPopup(true) }
    }
  }

  const toggleDataPopup = () => {
    if (showInfoPopup || showTechPopup || showSynopsisPopup || showStreamSelector || currentToast) {
      closeAllPopups()
      setTimeout(() => { if (!showDataPopup) setShowDataPopup(true) }, 200)
    } else {
      if (showDataPopup) {
        setDataClosing(true)
        setTimeout(() => { setShowDataPopup(false); setDataClosing(false) }, 400)
      } else { setShowDataPopup(true) }
    }
  }

  const toggleSynopsisPopup = () => {
    if (showInfoPopup || showTechPopup || showDataPopup || showStreamSelector || currentToast) {
      closeAllPopups()
      setTimeout(() => { if (!showSynopsisPopup) setShowSynopsisPopup(true) }, 200)
    } else {
      if (showSynopsisPopup) {
        setSynopsisClosing(true)
        setTimeout(() => { setShowSynopsisPopup(false); setSynopsisClosing(false) }, 400)
      } else { setShowSynopsisPopup(true) }
    }
  }

  const toggleNavVisibility = () => {
    setNavHidden(!navHidden)
  }

  useEffect(() => {
    const onScroll = () => { 
      if (window.scrollY > 10) closeAllPopups()
      setScrolled(window.scrollY > 60) 
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    
    const onClick = (e) => { 
      if (!e.target.closest('.standard-popup') && 
          !e.target.closest('.stream-selector-popup') && 
          !e.target.closest('.toast') && 
          !e.target.closest('.round-btn') && 
          !e.target.closest('.pill-container')) {
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
      setIsPlaying(false)
      setAvailableStreams([])
      setSelectedStream(null)
      if (currentTorrentRef.current) {
        currentTorrentRef.current.destroy()
        currentTorrentRef.current = null
      }
    } else {
      showToast('Fim da temporada', 'info')
    }
  }
  
  const handlePrevEp = () => {
    if (episode > 1) {
      setEpisode(episode - 1)
      setIsPlaying(false)
      setAvailableStreams([])
      setSelectedStream(null)
      if (currentTorrentRef.current) {
        currentTorrentRef.current.destroy()
        currentTorrentRef.current = null
      }
    }
  }

  const handleNativeSeasonChange = (e) => {
    const newSeason = parseInt(e.target.value)
    fetchSeason(id, newSeason)
    setEpisode(1)
    setIsPlaying(false)
    setAvailableStreams([])
    setSelectedStream(null)
    if (currentTorrentRef.current) {
      currentTorrentRef.current.destroy()
      currentTorrentRef.current = null
    }
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
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
          }

          .site-wrapper {
            width: 100%;
            min-height: 100vh;
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            position: relative;
            transition: background-image 0.6s ease-out;
          }

          .site-wrapper::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(5, 5, 5, 0.55);
            pointer-events: none;
            z-index: 0;
          }

          .site-wrapper > * {
            position: relative;
            z-index: 1;
          }

          .loading-overlay {
            position: fixed; 
            top: 0; 
            left: 0; 
            width: 100%; 
            height: 100%;
            z-index: 9999;
            display: flex; 
            align-items: center; 
            justify-content: center;
            background: #050505;
            transition: opacity 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94), visibility 0.8s ease;
          }
          
          .loading-overlay.fade-out {
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
          }

          .loading-content {
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            gap: 24px;
          }

          .spinner-apple {
            position: relative;
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .spinner-ring {
            position: absolute;
            width: 100%;
            height: 100%;
            border: 2.5px solid rgba(255, 255, 255, 0.15);
            border-radius: 50%;
            border-top-color: #ffffff;
            border-right-color: rgba(255, 255, 255, 0.3);
            border-bottom-color: rgba(255, 255, 255, 0.15);
            animation: appleSpinner 1s linear infinite;
          }

          @keyframes appleSpinner {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .loading-bar {
            width: 180px;
            height: 2.5px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 2px;
            overflow: hidden;
            position: relative;
          }

          .loading-progress {
            height: 100%;
            background: #ffffff;
            animation: loadingBar 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            width: 0%;
          }

          @keyframes loadingBar {
            0% { width: 0%; }
            20% { width: 15%; }
            40% { width: 35%; }
            60% { width: 65%; }
            80% { width: 85%; }
            100% { width: 100%; }
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
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: inherit;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            overflow: hidden;
            transition: transform 0.3s var(--ease-elastic), background 0.3s ease, border-color 0.3s ease;
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
            transition: all 0.6s var(--ease-smooth);
          }

          .top-bar { 
            top: 20px;
            opacity: 1;
            visibility: visible;
            transition: all 0.6s var(--ease-smooth);
          }

          .bottom-bar { 
            bottom: 20px;
            opacity: 1;
            visibility: visible;
            transition: all 0.6s var(--ease-smooth);
          }

          .top-bar.nav-hidden {
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transform: translateX(-50%) translateY(-100px);
            transition: all 0.6s var(--ease-smooth);
          }

          .bottom-bar.nav-hidden {
            width: auto;
            max-width: auto;
            gap: 12px;
            transition: all 0.6s var(--ease-smooth);
          }

          .bottom-bar.nav-hidden .pill-container {
            width: var(--pill-height);
            height: var(--pill-height);
            min-width: var(--pill-height);
            min-height: var(--pill-height);
            flex: 0 0 auto;
            border-radius: 50%;
            gap: 0;
            padding: 0;
            transition: all 0.7s cubic-bezier(0.6, 0.0, 0.4, 1);
            background: rgba(255, 255, 255, 0.06);
          }

          .bottom-bar.nav-hidden .nav-btn:not(.hide-toggle-pill-btn) {
            position: absolute;
            opacity: 0;
            width: 0;
            height: 0;
            overflow: hidden;
            pointer-events: none;
            transition: opacity 0.7s cubic-bezier(0.6, 0.0, 0.4, 1), width 0.7s cubic-bezier(0.6, 0.0, 0.4, 1);
          }

          .bottom-bar.nav-hidden .hide-toggle-pill-btn {
            position: relative;
            width: 100%;
            height: 100%;
            flex: 1;
            opacity: 1;
            pointer-events: auto;
            transition: all 0.6s var(--ease-smooth);
            color: rgba(255, 255, 255, 0.6);
            border-radius: 50%;
          }

          .bottom-bar.nav-hidden .hide-toggle-pill-btn:hover {
            color: rgba(255, 255, 255, 0.9);
          }

          .bottom-bar.nav-hidden .hidden-fav {
            opacity: 0;
            width: 0;
            height: 0;
            overflow: hidden;
            pointer-events: none;
            transition: all 0.6s var(--ease-smooth);
          }

          .bottom-bar.nav-hidden .round-btn:first-child {
            opacity: 0;
            width: 0;
            height: 0;
            overflow: hidden;
            pointer-events: none;
            transition: all 0.6s var(--ease-smooth);
          }

          .top-bar.scrolled-state { 
            transform: translateX(-50%) translateY(-5px); 
          }

          .round-btn {
            width: var(--pill-height); 
            height: var(--pill-height); 
            border-radius: 50%;
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: rgba(255, 255, 255, 0.9);
            flex-shrink: 0; 
            transition: all 0.5s var(--ease-smooth);
          }

          .round-btn:hover { 
            transform: scale(1.08); 
            background: rgba(255, 255, 255, 0.12); 
            border-color: rgba(255, 255, 255, 0.2); 
          }

          .round-btn:active { 
            transform: scale(0.92); 
          }

          .pill-container {
            height: var(--pill-height); 
            flex: 1; 
            border-radius: var(--pill-radius);
            display: flex; 
            align-items: center; 
            justify-content: center; 
            position: relative;
            transition: all 0.7s cubic-bezier(0.4, 0.0, 0.2, 1);
          }

          .nav-btn { 
            flex: 1; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            height: 100%; 
            color: rgba(255,255,255,0.4); 
            transition: all 0.3s ease;
            position: relative; 
            z-index: 5;
          }

          .hide-toggle-pill-btn {
            color: rgba(255, 255, 255, 0.6);
            transition: all 0.6s var(--ease-smooth);
          }

          .hide-toggle-pill-btn i {
            font-size: 18px;
            transition: all 0.3s var(--ease-smooth);
          }

          .hide-toggle-pill-btn:hover i {
            transform: scale(1.2);
            color: rgba(255, 255, 255, 0.9);
          }

          .nav-btn i { 
            font-size: 18px; 
            transition: all 0.4s var(--ease-elastic); 
          }

          .nav-btn:hover i { 
            transform: scale(1.2); 
            color: rgba(255,255,255,0.8); 
          }

          .nav-btn:active i { 
            transform: scale(0.9); 
          }

          .bar-label { 
            font-size: 0.9rem; 
            font-weight: 600; 
            color: #fff; 
            white-space: nowrap;
            letter-spacing: -0.01em;
            position: relative; 
            z-index: 5;
          }

          .heart-pulse { animation: heartZoom 0.5s var(--ease-elastic); }

          @keyframes heartZoom { 
            0% { transform: scale(1); } 
            50% { transform: scale(1.6); } 
            100% { transform: scale(1); } 
          }

          .standard-popup, .toast {
            position: fixed;
            top: calc(20px + var(--pill-height) + 16px); 
            left: 50%;
            z-index: 960;
            min-width: 320px;
            max-width: 90%;
            display: flex; 
            align-items: center; 
            gap: 14px;
            padding: 16px 18px; 
            border-radius: 22px;
            transform: translateX(-50%) translateY(-50%) scale(0.3);
            transform-origin: top center;
            opacity: 0;
            animation: popupZoomIn 0.5s var(--ease-elastic) forwards;
            box-shadow: 0 20px 60px rgba(0,0,0,0.6);
          }
          
          .standard-popup { 
            z-index: 950; 
            pointer-events: none; 
          }

          .toast { 
            z-index: 960; 
            pointer-events: auto; 
          }

          .standard-popup.closing, .toast.closing { 
            animation: popupZoomOut 0.4s cubic-bezier(0.55, 0.055, 0.675, 0.19) forwards; 
          }

          @keyframes popupZoomIn {
            0% { opacity: 0; transform: translateX(-50%) translateY(-50%) scale(0.3); }
            100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); pointer-events: auto; }
          }

          @keyframes popupZoomOut {
            0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
            100% { opacity: 0; transform: translateX(-50%) translateY(-30%) scale(0.5); pointer-events: none; }
          }
          
          .popup-icon-wrapper, .toast-icon-wrapper { 
            width: 42px; 
            height: 42px; 
            min-width: 42px; 
            border-radius: 12px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            animation: iconPop 0.6s var(--ease-elastic) 0.1s backwards; 
          }
          
          .popup-icon-wrapper.info { 
            background: linear-gradient(135deg, #34c759 0%, #30d158 100%); 
            box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3); 
          }

          .popup-icon-wrapper.tech { 
            background: linear-gradient(135deg, #0a84ff 0%, #007aff 100%); 
            box-shadow: 0 4px 12px rgba(10, 132, 255, 0.3); 
          }

          .popup-icon-wrapper.synopsis { 
            background: linear-gradient(135deg, #ff9500 0%, #ff8c00 100%); 
            box-shadow: 0 4px 12px rgba(255, 149, 0, 0.3); 
          }

          .popup-icon-wrapper.data { 
            background: linear-gradient(135deg, #bf5af2 0%, #a448e0 100%); 
            box-shadow: 0 4px 12px rgba(191, 90, 242, 0.3); 
          }

          .toast-icon-wrapper { 
            border-radius: 50%; 
          }

          .toast.success .toast-icon-wrapper { 
            background: linear-gradient(135deg, #34c759 0%, #30d158 100%); 
            box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3); 
          }

          .toast.info .toast-icon-wrapper { 
            background: linear-gradient(135deg, #0a84ff 0%, #007aff 100%); 
            box-shadow: 0 4px 12px rgba(10, 132, 255, 0.3); 
          }

          .toast.error .toast-icon-wrapper { 
            background: linear-gradient(135deg, #ff453a 0%, #ff3b30 100%); 
            box-shadow: 0 4px 12px rgba(255, 69, 58, 0.3); 
          }

          .popup-icon-wrapper i, .toast-icon-wrapper i { 
            font-size: 20px; 
            color: #fff; 
          }

          .popup-content, .toast-content { 
            flex: 1; 
            display: flex; 
            flex-direction: column; 
            gap: 4px; 
            max-height: 60vh; 
            overflow-y: auto;
            opacity: 0; 
            animation: contentFade 0.4s ease 0.2s forwards; 
          }

          @keyframes contentFade { 
            from { opacity: 0; transform: translateX(10px); } 
            to { opacity: 1; transform: translateX(0); } 
          }
          
          .popup-title, .toast-title { 
            font-size: 0.95rem; 
            font-weight: 600; 
            color: #fff; 
            margin: 0; 
            line-height: 1.3; 
          }

          .popup-text, .toast-msg { 
            font-size: 0.8rem; 
            color: rgba(255, 255, 255, 0.7); 
            margin: 0; 
            line-height: 1.4; 
          }

          @keyframes iconPop { 
            from { transform: scale(0); opacity: 0; } 
            to { transform: scale(1); opacity: 1; } 
          }

          .toast-wrap { 
            position: fixed; 
            top: calc(20px + var(--pill-height) + 16px); 
            left: 50%; 
            z-index: 960; 
            pointer-events: none; 
          }

          .stream-selector-popup {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.3);
            z-index: 980;
            width: 90%;
            max-width: 600px;
            max-height: 70vh;
            background: rgba(20, 20, 20, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 24px;
            padding: 24px;
            overflow-y: auto;
            opacity: 0;
            animation: popupZoomIn 0.5s var(--ease-elastic) forwards;
            box-shadow: 0 30px 80px rgba(0, 0, 0, 0.8);
          }

          .stream-selector-popup.closing {
            animation: popupZoomOut 0.4s cubic-bezier(0.55, 0.055, 0.675, 0.19) forwards;
          }

          .stream-selector-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }

          .stream-selector-title {
            font-size: 1.2rem;
            font-weight: 700;
            color: #fff;
          }

          .close-selector-btn {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .close-selector-btn:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: scale(1.1);
          }

          .streams-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .stream-item {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 16px;
            cursor: pointer;
            transition: all 0.3s var(--ease-smooth);
          }

          .stream-item:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.3);
            transform: translateX(4px);
          }

          .stream-item-title {
            font-size: 0.9rem;
            font-weight: 600;
            color: #fff;
            margin-bottom: 8px;
          }

          .stream-item-info {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.6);
          }

          .stream-badge {
            background: rgba(10, 132, 255, 0.2);
            padding: 4px 10px;
            border-radius: 12px;
            font-weight: 600;
            color: #0a84ff;
          }

          .stream-badge.pt {
            background: rgba(52, 199, 89, 0.2);
            color: #34c759;
          }

          .container {
            max-width: 1280px; 
            margin: 0 auto;
            padding-top: 6.5rem; 
            padding-bottom: 7rem;
            padding-left: 2rem; 
            padding-right: 2rem;
          }

          .page-header { 
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
            margin-bottom: 1.5rem; 
          }

          .page-title { 
            font-size: 1.3rem; 
            font-weight: 700; 
            color: #fff; 
            text-shadow: 0 4px 20px rgba(0,0,0,0.5); 
          }
          
          .status-dots { 
            display: flex; 
            align-items: center; 
            gap: 8px; 
          }

          .dot { 
            width: 10px; 
            height: 10px; 
            border-radius: 50%; 
            animation: dotPulse 2s ease-in-out infinite; 
          }

          .dot.red { 
            background: linear-gradient(135deg, #ff453a, #ff3b30); 
            box-shadow: 0 2px 8px rgba(255, 69, 58, 0.4); 
          }

          .dot.yellow { 
            background: linear-gradient(135deg, #ffd60a, #ffcc00); 
            box-shadow: 0 2px 8px rgba(255, 204, 0, 0.4); 
            animation-delay: 0.3s; 
          }

          .dot.green { 
            background: linear-gradient(135deg, #34c759, #30d158); 
            box-shadow: 0 2px 8px rgba(52, 199, 89, 0.4); 
            animation-delay: 0.6s; 
          }

          @keyframes dotPulse { 
            0%, 100% { transform: scale(1); opacity: 1; } 
            50% { transform: scale(1.4); opacity: 0.6; } 
          }

          .player-banner-container {
            width: 100%; 
            aspect-ratio: 16/9; 
            border-radius: 24px; 
            overflow: hidden; 
            position: relative;
            background-color: #1a1a1a; 
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
            margin-bottom: 24px; 
            cursor: pointer;
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
          }

          .play-button-static i { 
            color: #fff; 
            font-size: 24px; 
            margin-left: 4px; 
          }

          .details-container {
            border-radius: 24px; 
            padding: 18px; 
            display: flex; 
            flex-direction: column; 
            gap: 16px;
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: none;
            background: rgba(255, 255, 255, 0.03);
          }

          .media-title { 
            font-size: 1.15rem; 
            font-weight: 700; 
            color: #fff; 
            line-height: 1.2; 
          }

          .season-controls { 
            display: flex; 
            align-items: center; 
            margin-top: 8px; 
          }

          .native-season-select {
            appearance: none; 
            -webkit-appearance: none;
            background: rgba(255,255,255,0.1) url('data:image/svg+xml;utf8,<svg fill="white" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>') no-repeat right 10px center;
            padding: 8px 36px 8px 16px; 
            border-radius: 12px;
            font-size: 0.9rem; 
            color: #fff; 
            border: 1px solid rgba(255,255,255,0.1);
            cursor: pointer; 
            font-family: inherit; 
            outline: none; 
            transition: background 0.2s;
          }

          .native-season-select:hover { 
            background-color: rgba(255,255,255,0.15); 
          }

          .native-season-select option { 
            background: #1a1a1a; 
            color: #fff; 
          }

          .episodes-carousel { 
            display: flex; 
            gap: 10px; 
            overflow-x: auto; 
            padding: 10px 14px 14px 14px; 
            scrollbar-width: none; 
            margin: 0 -14px; 
          }

          .episodes-carousel::-webkit-scrollbar { 
            display: none; 
          }
          
          .ep-card {
            min-width: 110px; 
            height: 65px; 
            background-size: cover; 
            background-position: center;
            border-radius: 10px; 
            padding: 0; 
            border: 1px solid rgba(255,255,255,0.15);
            cursor: pointer; 
            transition: all 0.2s ease; 
            position: relative; 
            overflow: visible; 
            box-shadow: none;
          }
          
          .ep-card::before {
            content: ''; 
            position: absolute; 
            inset: 0; 
            width: 100%; 
            height: 100%;
            background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 50%, transparent 100%);
            z-index: 1;
            border-radius: 10px;
          }
          
          .ep-card::after {
            content: '';
            position: absolute;
            bottom: -12px;
            left: 50%;
            transform: translateX(-50%) scale(0);
            width: 8px;
            height: 8px;
            background: #ffffff;
            border-radius: 50%;
            transition: transform 0.3s var(--ease-smooth);
            z-index: 3;
          }
          
          .ep-card-info {
             position: relative; 
             z-index: 2;
             width: 100%; 
             height: 100%;
             padding: 6px 8px;
             display: flex; 
             flex-direction: column; 
             justify-content: flex-end;
          }

          .ep-card:hover { 
            border-color: rgba(255,255,255,0.4); 
            transform: scale(1.05); 
          }
          
          .ep-card.active { 
            border: 1px solid rgba(255,255,255,0.15);
          }

          .ep-card.active::after {
            transform: translateX(-50%) scale(1);
          }
          
          .ep-card-num { 
            font-size: 0.75rem; 
            font-weight: 700; 
            color: #fff; 
          }

          .ep-card-title { 
            font-size: 0.65rem; 
            color: rgba(255,255,255,0.8); 
            white-space: nowrap; 
            overflow: hidden; 
            text-overflow: ellipsis; 
          }

          .player-overlay {
            position: fixed; 
            top: 0; 
            left: 0; 
            right: 0; 
            bottom: 0;
            backdrop-filter: blur(20px); 
            -webkit-backdrop-filter: blur(20px);
            z-index: 2000; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            animation: overlayFadeIn 0.4s var(--ease-smooth);
          }

          @keyframes overlayFadeIn {
            from {
              opacity: 0;
              backdrop-filter: blur(0px);
            }
            to {
              opacity: 1;
              backdrop-filter: blur(20px);
            }
          }

          .player-wrapper-vertical {
            display: flex; 
            flex-direction: column; 
            align-items: center;
            position: relative;
            width: auto;
            animation: playerSlideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          @keyframes playerSlideUp {
            from {
              opacity: 0;
              transform: translateY(60px) scale(0.9);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          .player-popup-container {
            position: relative; 
            background: #000; 
            border-radius: 20px; 
            overflow: hidden;
            box-shadow: 0 0 60px rgba(0,0,0,0.9), 0 20px 60px rgba(10, 132, 255, 0.15);
            border: 1.5px solid rgba(255, 255, 255, 0.2);
            transition: all 0.4s var(--ease-elastic); 
            display: flex; 
            align-items: center; 
            justify-content: center;
            animation: playerContainerPop 0.6s var(--ease-elastic) 0.1s backwards;
          }

          @keyframes playerContainerPop {
            from {
              opacity: 0;
              transform: scale(0.8);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          .popup-size-square { 
            width: min(70vw, 40vh); 
            height: min(70vw, 40vh); 
            aspect-ratio: 1/1; 
          }

          .popup-size-banner { 
            width: 80vw; 
            max-width: 900px; 
            aspect-ratio: 16/9; 
          }

          .player-embed { 
            width: 100%; 
            height: 100%; 
            border: none;
            animation: embedFadeIn 0.5s ease 0.2s backwards;
          }

          @keyframes embedFadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          
          .player-header-controls {
            width: 100%; 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            margin-bottom: 20px; 
            animation: controlsFadeIn 0.5s ease 0.15s backwards;
          }

          @keyframes controlsFadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .ep-indicator { 
            font-size: 1rem; 
            font-weight: 700; 
            color: #fff; 
            text-shadow: 0 2px 10px rgba(0,0,0,0.8);
            background: rgba(0,0,0,0.4); 
            padding: 10px 20px; 
            border-radius: 12px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            transition: all 0.3s var(--ease-smooth);
          }

          .ep-indicator:hover {
            background: rgba(0, 0, 0, 0.5);
            border-color: rgba(255, 255, 255, 0.25);
            transform: scale(1.05);
          }

          .right-controls { 
            display: flex; 
            gap: 12px; 
          }

          .control-btn {
            width: 48px; 
            height: 48px; 
            background: rgba(255, 255, 255, 0.08); 
            backdrop-filter: blur(10px);
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: rgba(255, 255, 255, 0.9); 
            transition: all 0.3s var(--ease-smooth); 
            border: 1px solid rgba(255, 255, 255, 0.15);
            cursor: pointer;
            position: relative;
            overflow: hidden;
          }

          .control-btn:hover { 
            background: rgba(255, 255, 255, 0.15); 
            transform: scale(1.1);
            border-color: rgba(255, 255, 255, 0.3);
          }

          .control-btn:active {
            transform: scale(0.95);
          }

          .control-btn i {
            font-size: 18px;
            transition: all 0.3s var(--ease-smooth);
          }

          .control-btn:hover i {
            transform: scale(1.15);
          }
          
          .player-bottom-controls {
            display: flex; 
            justify-content: center; 
            gap: 20px;
            margin-top: 20px;
            animation: controlsFadeIn 0.5s ease 0.25s backwards;
          }

          .nav-ep-btn {
            background: rgba(255, 255, 255, 0.08); 
            padding: 12px 32px; 
            border-radius: 50px;
            color: rgba(255, 255, 255, 0.9); 
            font-weight: 600; 
            font-size: 0.95rem;
            display: flex; 
            align-items: center; 
            gap: 10px;
            transition: all 0.3s var(--ease-smooth); 
            backdrop-filter: blur(10px); 
            border: 1px solid rgba(255, 255, 255, 0.15);
            cursor: pointer;
            position: relative;
            overflow: hidden;
          }

          .nav-ep-btn:hover { 
            background: rgba(255, 255, 255, 0.15); 
            transform: scale(1.08);
            border-color: rgba(255, 255, 255, 0.3);
          }

          .nav-ep-btn:active { 
            transform: scale(0.95); 
          }

          .nav-ep-btn i {
            transition: all 0.3s var(--ease-smooth);
          }

          .nav-ep-btn:hover i {
            transform: scale(1.2);
          }

          .nav-ep-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }

          .nav-ep-btn:disabled:hover {
            transform: scale(1);
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.15);
          }

          .torrent-stats {
            position: absolute;
            bottom: 70px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.15);
            white-space: nowrap;
          }

          #webtorrent-player video {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }

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
            .page-title { font-size: 1.2rem; }
            .dot { width: 8px; height: 8px; }
            .status-dots { gap: 6px; }
            
            .ep-indicator { font-size: 0.85rem; padding: 6px 12px; }
            .control-btn { width: 38px; height: 38px; }
            .nav-ep-btn { padding: 8px 18px; font-size: 0.9rem; }
            .stream-selector-popup { width: 95%; max-height: 80vh; padding: 20px; }
            .torrent-stats { font-size: 0.7rem; padding: 6px 12px; bottom: 60px; }
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
            label={scrolled ? "Reproduzindo" : "Yoshikawa"}
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
            <div 
              className={`standard-popup glass-panel ${synopsisClosing ? 'closing' : ''}`} 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="popup-icon-wrapper synopsis">
                <i className="fas fa-align-left"></i>
              </div>
              <div className="popup-content">
                <p className="popup-title">Sinopse</p>
                <p className="popup-text">
                  {type === 'tv' && currentEpisodeData?.overview 
                    ? currentEpisodeData.overview 
                    : content?.overview || "Sinopse indisponível."}
                </p>
              </div>
            </div>
          )}

          {showDataPopup && (
            <div 
              className={`standard-popup glass-panel ${dataClosing ? 'closing' : ''}`} 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="popup-icon-wrapper data">
                <i className="fas fa-film"></i>
              </div>
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

          {showStreamSelector && (
            <div className={`stream-selector-popup ${streamSelectorClosing ? 'closing' : ''}`}>
              <div className="stream-selector-header">
                <h3 className="stream-selector-title">Escolha a Qualidade</h3>
                <button className="close-selector-btn" onClick={() => {
                  setStreamSelectorClosing(true)
                  setTimeout(() => {
                    setShowStreamSelector(false)
                    setStreamSelectorClosing(false)
                  }, 400)
                }}>
                  <i className="fas fa-xmark"></i>
                </button>
              </div>

              <div className="streams-list">
                {availableStreams.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.6)' }}>
                    Nenhum stream disponível
                  </div>
                ) : (
                  availableStreams.map((stream, idx) => {
                    const quality = stream.name?.split('\n')[1] || 'SD'
                    const size = stream.title?.match(/💾 ([\d.]+\s*[GM]B)/)?.[1] || ''
                    const seeders = stream.title?.match(/👤 (\d+)/)?.[1] || '?'
                    const isPT = stream.title?.toLowerCase().includes('dual') || 
                                 stream.title?.toLowerCase().includes('dublado') ||
                                 stream.title?.toLowerCase().includes('pt-br')

                    return (
                      <div 
                        key={idx} 
                        className="stream-item" 
                        onClick={() => startWebTorrentStream(stream)}
                      >
                        <div className="stream-item-title">
                          {isPT && <span className="stream-badge pt">PT-BR</span>}
                          {' '}{stream.title.substring(0, 60)}
                        </div>
                        <div className="stream-item-info">
                          <span>📺 {quality}</span>
                          {size && <span>💾 {size}</span>}
                          <span>👥 {seeders} seeders</span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          <main className="container">
            <div className="page-header">
              <h1 className="page-title">Reproduzindo</h1>
              <div className="status-dots">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
              </div>
            </div>

            <div 
              className="player-banner-container" 
              onClick={fetchAvailableStreams}
              style={{
                backgroundImage: currentEpisodeData?.still_path 
                  ? `url(https://image.tmdb.org/t/p/original${currentEpisodeData.still_path})`
                  : content.backdrop_path 
                    ? `url(https://image.tmdb.org/t/p/original${content.backdrop_path})`
                    : `url(${DEFAULT_BACKDROP})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="play-button-static">
                <i className={isLoadingStreams ? "fas fa-spinner fa-spin" : "fas fa-play"}></i>
              </div>
            </div>

            <div className="glass-panel details-container">
              <div className="text-left">
                <h2 className="media-title">{content.title || content.name}</h2>
              </div>

              {type === 'tv' && (
                <>
                  <div className="season-controls">
                    <select 
                      className="native-season-select"
                      value={season}
                      onChange={handleNativeSeasonChange}
                    >
                       {Array.from({ length: content?.number_of_seasons || 1 }, (_, i) => i + 1).map(num => (
                          <option key={num} value={num}>Temporada {num}</option>
                       ))}
                    </select>
                  </div>

                  <div className="episodes-carousel" ref={carouselRef}>
                    {seasonData && seasonData.episodes ? seasonData.episodes.map(ep => (
                      <div 
                        key={ep.id} 
                        className={`ep-card ${ep.episode_number === episode ? 'active' : ''}`}
                        onClick={() => setEpisode(ep.episode_number)}
                        style={{
                          backgroundImage: ep.still_path 
                            ? `url(https://image.tmdb.org/t/p/w300${ep.still_path})`
                            : 'linear-gradient(135deg, #1a1a1a, #0a0a0a)'
                        }}
                      >
                        <div className="ep-card-info">
                          <span className="ep-card-num">Ep {ep.episode_number}</span>
                          <span className="ep-card-title">{ep.name}</span>
                        </div>
                      </div>
                    )) : (
                      <div style={{color:'#666', fontSize:'0.8rem', paddingLeft: '8px'}}>Carregando...</div>
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
        </div>
      )}

      {isPlaying && selectedStream && (
        <div className="player-overlay">
          <div className="player-wrapper-vertical">
            
            <div className="player-header-controls">
              <span className="ep-indicator">
                 {type === 'tv' ? `S${season}:E${episode}` : 'FILME'}
              </span>
              <div className="right-controls">
                <button className="control-btn" onClick={() => setIsWideMode(!isWideMode)} title="Alterar Formato">
                  <i className={isWideMode ? "fas fa-compress" : "fas fa-expand"}></i>
                </button>
                <button className="control-btn" onClick={() => {
                  setIsPlaying(false)
                  if (currentTorrentRef.current) {
                    currentTorrentRef.current.destroy()
                    currentTorrentRef.current = null
                  }
                }} title="Fechar">
                  <i className="fas fa-xmark"></i>
                </button>
              </div>
            </div>

            <div className={`player-popup-container ${isWideMode ? 'popup-size-banner' : 'popup-size-square'}`}>
              <div id="webtorrent-player" className="player-embed"></div>
            </div>

            {torrentStatus.peers > 0 && (
              <div className="torrent-stats">
                📥 {formatBytes(torrentStatus.speed)}/s | 👥 {torrentStatus.peers} peers | 📊 {torrentStatus.progress}%
              </div>
            )}

            {type === 'tv' && (
              <div className="player-bottom-controls">
                <button className="nav-ep-btn glass-panel" onClick={handlePrevEp} disabled={episode === 1}>
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
    </>
  )
}
