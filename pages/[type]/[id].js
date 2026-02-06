import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
const DEFAULT_BACKDROP = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'

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
            <p className="popup-title">Informações Técnicas</p>
            <p className="popup-text">v3.0.0 • WebTorrent • Torrentio API</p>
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
  const [autoTrying, setAutoTrying] = useState(false)

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

  const prioritizeStreams = (streams) => {
    return streams.sort((a, b) => {
      const aTitle = (a.title || '').toLowerCase()
      const bTitle = (b.title || '').toLowerCase()
      
      const aPT = aTitle.includes('dual') || aTitle.includes('dublado') || aTitle.includes('pt-br') || aTitle.includes('português')
      const bPT = bTitle.includes('dual') || bTitle.includes('dublado') || bTitle.includes('pt-br') || bTitle.includes('português')
      if (aPT && !bPT) return -1
      if (!aPT && bPT) return 1
      
      const aWeb = aTitle.includes('webrip') || aTitle.includes('webdl') || aTitle.includes('web ')
      const bWeb = bTitle.includes('webrip') || bTitle.includes('webdl') || bTitle.includes('web ')
      if (aWeb && !bWeb) return -1
      if (!aWeb && bWeb) return 1
      
      const aSeed = parseInt(aTitle.match(/👥 (\d+)/)?.[1] || '0')
      const bSeed = parseInt(bTitle.match(/👥 (\d+)/)?.[1] || '0')
      if (aSeed !== bSeed) return bSeed - aSeed
      
      const getSize = (title) => {
        const match = title.match(/💾 ([\d.]+) ?([GM])B/)
        if (!match) return 999
        const size = parseFloat(match[1])
        return match[2] === 'G' ? size * 1000 : size
      }
      return getSize(aTitle) - getSize(bTitle)
    })
  }

  const fetchAvailableStreams = async () => {
    setIsLoadingStreams(true)
    try {
      const params = new URLSearchParams({
        tmdbId: id,
        type: type
      })

      if (type === 'tv') {
        params.append('season', season)
        params.append('episode', episode)
      }

      const response = await fetch(`/api/streams-from-tmdb?${params}`)
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const allStreams = [...(data.portuguese || []), ...(data.all || [])]
      const prioritized = prioritizeStreams(allStreams)
      setAvailableStreams(prioritized)
      
      if (prioritized.length === 0) {
        showToast('Nenhum stream encontrado', 'error')
      } else {
        setShowStreamSelector(true)
      }

    } catch (error) {
      console.error('Erro ao buscar streams:', error)
      showToast('Erro ao buscar streams: ' + error.message, 'error')
    } finally {
      setIsLoadingStreams(false)
    }
  }

  const autoTryStreams = async () => {
    if (autoTrying || availableStreams.length === 0) return
    setAutoTrying(true)
    showToast('Buscando stream compatível automaticamente...', 'info')

    for (const stream of availableStreams) {
      try {
        await new Promise((resolve, reject) => {
          startWebTorrentStream(stream, true, resolve, reject)
        })
        setAutoTrying(false)
        return
      } catch (e) {
        console.log('Stream incompatível, tentando próximo...')
      }
    }
    
    showToast('Nenhum stream compatível encontrado (MP4/WebM)', 'error')
    setAutoTrying(false)
    setIsPlaying(false)
  }

  const startWebTorrentStream = (stream, autoMode = false, onSuccess, onFail) => {
    if (typeof window === 'undefined') return

    if (!window.WebTorrent) {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/webtorrent@latest/webtorrent.min.js'
      script.onload = () => initializeWebTorrent(stream, autoMode, onSuccess, onFail)
      document.head.appendChild(script)
    } else {
      initializeWebTorrent(stream, autoMode, onSuccess, onFail)
    }
  }

  const initializeWebTorrent = (stream, autoMode = false, onSuccess, onFail) => {
    setSelectedStream(stream)
    if (!autoMode) {
      setShowStreamSelector(false)
      setIsPlaying(true)
    }

    if (currentTorrentRef.current) {
      currentTorrentRef.current.destroy()
      currentTorrentRef.current = null
    }

    if (!webTorrentClientRef.current) {
      webTorrentClientRef.current = new window.WebTorrent({
        maxConns: 80,
        tracker: {
          announce: [
            'udp://tracker.opentrackr.org:1337/announce',
            'udp://open.tracker.cl:1337/announce',
            'udp://tracker.torrent.eu.org:451/announce',
            'udp://exodus.desync.com:6969/announce',
            'udp://tracker.openbittorrent.com:80/announce',
            'udp://open.stealth.si:80/announce',
            'udp://tracker.cyberia.is:6969/announce',
            'udp://tracker.tamersunion.org:1337/announce'
          ]
        }
      })
    }

    const magnetURI = `magnet:?xt=urn:btih:${stream.infoHash}&dn=${encodeURIComponent(stream.title)}`
    
    if (!autoMode) showToast('Conectando aos peers...', 'info')

    const client = webTorrentClientRef.current
    
    client.add(magnetURI, { storeCacheSlots: 40 }, (torrent) => {
      currentTorrentRef.current = torrent

      const videoFile = torrent.files
        .filter(f => {
          const ext = f.name.split('.').pop().toLowerCase()
          return ['mp4', 'webm'].includes(ext)
        })
        .sort((a, b) => b.length - a.length)[0]

      if (!videoFile) {
        torrent.destroy()
        if (autoMode) {
          onFail && onFail('no compatible file')
        } else {
          showToast('Formato incompatível (precisa MP4/WebM). Tente outro stream.', 'error')
          setIsPlaying(false)
        }
        return
      }

      if (!autoMode) showToast(`Reproduzindo: ${videoFile.name}`, 'success')

      setTimeout(() => {
        const playerElement = document.getElementById('webtorrent-player')
        if (playerElement) {
          videoFile.appendTo(playerElement, { autoplay: true, muted: true, controls: true }, (err) => {
            if (err) {
              torrent.destroy()
              if (autoMode) onFail && onFail(err)
              else {
                showToast('Erro ao carregar vídeo', 'error')
                setIsPlaying(false)
              }
              return
            }

            const video = playerElement.querySelector('video')
            if (video) {
              video.muted = true
              video.play().catch(() => {})

              video.addEventListener('error', () => {
                if (autoMode) onFail && onFail('video error')
                else showToast('Erro de decodificação. Tente outro stream.', 'error')
              })

              setupVideoMemoryManagement(video, torrent)
              setupTorrentStatsMonitoring(torrent)
            }

            if (autoMode) onSuccess && onSuccess()
          })
        }
      }, 100)
    })

    client.on('error', (err) => {
      if (autoMode) onFail && onFail(err)
      else {
        showToast('Erro no torrent: ' + err.message, 'error')
        setIsPlaying(false)
      }
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
          /* TODO O CSS ORIGINAL AQUI (não alterado) */
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
          /* ... cole todo o <style> original aqui ... */
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
            <div className={`standard-popup glass-panel ${synopsisClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
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
            <div className={`standard-popup glass-panel ${dataClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
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
                <div 
                  className="stream-item" 
                  onClick={autoTryStreams}
                  style={{ 
                    background: 'rgba(10,132,255,0.15)', 
                    justifyContent: 'center',
                    fontWeight: '600',
                    cursor: autoTrying ? 'not-allowed' : 'pointer',
                    opacity: autoTrying ? 0.7 : 1
                  }}
                >
                  {autoTrying ? '🔄 Tentando automaticamente...' : '🔄 Tentar compatível automaticamente'}
                </div>

                {availableStreams.map((stream, idx) => {
                  const titleLower = (stream.title || '').toLowerCase()
                  const isPT = titleLower.includes('dual') || titleLower.includes('dublado') || titleLower.includes('pt-br') || titleLower.includes('português')
                  const isWeb = titleLower.includes('webrip') || titleLower.includes('webdl') || titleLower.includes('web ')
                  const quality = stream.name?.split('\n')[1] || 'SD'
                  const size = stream.title?.match(/💾 ([\d.]+\s*[GM]B)/)?.[1] || ''
                  const seeders = stream.title?.match(/👤 (\d+)/)?.[1] || '?'

                  return (
                    <div key={idx} className="stream-item" onClick={() => startWebTorrentStream(stream)}>
                      <div className="stream-item-title">
                        {isPT && <span className="stream-badge pt">PT-BR</span>}
                        {isWeb && <span className="stream-badge" style={{background:'rgba(52,199,89,0.2)',color:'#34c759'}}>WEB</span>}
                        {' '}{stream.title.substring(0, 60)}
                      </div>
                      <div className="stream-item-info">
                        <span>📺 {quality}</span>
                        {size && <span>💾 {size}</span>}
                        <span>👥 {seeders} seeders</span>
                      </div>
                    </div>
                  )
                })}
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
                        onClick={() => {
                          setEpisode(ep.episode_number)
                          setIsPlaying(false)
                          setAvailableStreams([])
                          setSelectedStream(null)
                          if (currentTorrentRef.current) {
                            currentTorrentRef.current.destroy()
                            currentTorrentRef.current = null
                          }
                        }}
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
