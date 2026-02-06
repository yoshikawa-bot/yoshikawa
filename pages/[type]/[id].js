import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
const DEFAULT_BACKDROP = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'

// ============================================================================
// LISTA DE TRACKERS WEBSOCKET (O SEGREDO DO STREMIO WEB)
// Navegadores SÓ funcionam com wss://. Magnet links normais usam udp://
// ============================================================================
const WSS_TRACKERS = [
  'wss://tracker.openwebtorrent.com',
  'wss://tracker.btorrent.xyz',
  'wss://tracker.webtorrent.dev',
  'wss://tracker.files.fm:7073/announce',
  'wss://spacetradersapi-chatbox.herokuapp.com:443/announce',
  'wss://to.lag.re/announce',
  'wss://ws-tracker.files.fm:7073/announce'
];

// ============================================================================
// CLIENTE TORRENTIO PURO
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
    // Usamos a URL padrão, mas vamos manipular o magnet depois
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
      return (
        title.includes('dual') || title.includes('dublado') ||
        title.includes('português') || title.includes('pt-br') ||
        title.includes('legendado') || title.includes('multi')
      );
    });
  }

  static sortStreamsByQuality(streams) {
    const qualityOrder = { '2160p': 5, '1080p': 4, '720p': 3, '480p': 2, '360p': 1 };
    return streams.sort((a, b) => {
      const qA = qualityOrder[a.name?.split('\n')[1]] || 0;
      const qB = qualityOrder[b.name?.split('\n')[1]] || 0;
      return qB - qA;
    });
  }
}

// ============================================================================
// COMPONENTES UI (Mantidos iguais para consistência visual)
// ============================================================================

export const Header = ({ label, scrolled, showInfo, toggleInfo, infoClosing, showTech, toggleTech, techClosing, navHidden }) => {
  const handleRightClick = (e) => {
    e.stopPropagation()
    if (scrolled) window.scrollTo({ top: 0, behavior: 'smooth' })
    else toggleInfo()
  }

  return (
    <>
      <header className={`bar-container top-bar ${scrolled ? 'scrolled-state' : ''} ${navHidden ? 'nav-hidden' : ''}`}>
        <button className="round-btn glass-panel" onClick={(e) => { e.stopPropagation(); toggleTech() }}>
          <i className="fas fa-microchip" style={{ fontSize: '14px' }}></i>
        </button>
        <div className="pill-container glass-panel">
          <span key={label} className="bar-label">{label}</span>
        </div>
        <button className="round-btn glass-panel" onClick={handleRightClick}>
          <i className={scrolled ? "fas fa-chevron-up" : "fas fa-info-circle"} style={{ fontSize: '14px' }}></i>
        </button>
      </header>
      {/* Popups omitidos para brevidade, mantenha os seus se desejar */}
    </>
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
        <div className="spinner-apple"><div className="spinner-ring"></div></div>
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
  
  const [currentToast, setCurrentToast] = useState(null)
  const [toastQueue, setToastQueue] = useState([])
  
  const [content, setContent] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isWideMode, setIsWideMode] = useState(false)
  
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [seasonData, setSeasonData] = useState(null)

  const [availableStreams, setAvailableStreams] = useState([])
  const [selectedStream, setSelectedStream] = useState(null)
  const [showStreamSelector, setShowStreamSelector] = useState(false)
  const [streamSelectorClosing, setStreamSelectorClosing] = useState(false)
  const [torrentStatus, setTorrentStatus] = useState({ speed: 0, peers: 0, progress: 0 })
  const [isLoadingStreams, setIsLoadingStreams] = useState(false)
  const [debugLogs, setDebugLogs] = useState([])

  const addDebugLog = (message, type = 'info') => {
    const log = { message, type, time: new Date().toLocaleTimeString() }
    setDebugLogs(prev => [...prev.slice(-4), log])
    console.log(`[${type.toUpperCase()}] ${message}`)
  }

  const toastTimerRef = useRef(null)

  // -- Efeitos de UI (Toast, Loading) --
  useEffect(() => {
    if (content) setTimeout(() => setIsLoading(false), 1000)
  }, [content])

  const showToast = (message, type = 'info') => {
    if (currentToast && !currentToast.closing) {
      setCurrentToast(prev => ({ ...prev, closing: true }))
      setTimeout(() => setToastQueue(prev => [...prev, { message, type, id: Date.now() }]), 200)
    } else {
      setToastQueue(prev => [...prev, { message, type, id: Date.now() }])
    }
  }

  useEffect(() => {
    if (toastQueue.length > 0 && !currentToast) {
      const next = toastQueue[0]
      setToastQueue(prev => prev.slice(1))
      setCurrentToast({ ...next, closing: false })
      toastTimerRef.current = setTimeout(() => {
        setCurrentToast(t => (t && t.id === next.id ? { ...t, closing: true } : t))
      }, 3000)
    }
  }, [toastQueue, currentToast])

  useEffect(() => {
    if (currentToast?.closing) {
      const t = setTimeout(() => setCurrentToast(null), 400)
      return () => clearTimeout(t)
    }
  }, [currentToast])

  // -- Carregamento de Conteúdo --
  useEffect(() => {
    if (!id || !type) return
    const loadContent = async () => {
      try {
        const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR`)
        const data = await res.json()
        setContent(data)
        if (type === 'tv') await fetchSeason(id, 1)
      } catch (error) {
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
    } catch (err) { console.error(err) }
  }

  const fetchAvailableStreams = async () => {
    setIsLoadingStreams(true)
    showToast('Buscando streams P2P...', 'info')
    try {
      const imdbId = await TorrentioClient.getIMDbId(id, type)
      if (!imdbId) throw new Error('IMDb ID não encontrado')
      
      const streams = await TorrentioClient.fetchStreams(imdbId, type, type === 'tv' ? season : null, type === 'tv' ? episode : null)
      if (streams.length === 0) {
        showToast('Nenhum stream encontrado', 'error')
        setIsLoadingStreams(false)
        return
      }

      const ptStreams = TorrentioClient.filterPortugueseStreams(streams)
      const sortedPT = TorrentioClient.sortStreamsByQuality(ptStreams)
      const sortedAll = TorrentioClient.sortStreamsByQuality(streams)
      const finalStreams = [...sortedPT.slice(0, 10), ...sortedAll.filter(s => !sortedPT.includes(s)).slice(0, 5)]

      setAvailableStreams(finalStreams)
      setShowStreamSelector(true)
      showToast(`${finalStreams.length} streams encontrados`, 'success')
    } catch (error) {
      showToast('Erro: ' + error.message, 'error')
    } finally {
      setIsLoadingStreams(false)
    }
  }

  // ============================================================================
  // WEBTORRENT - IMPLEMENTAÇÃO ESTILO STREMIO WEB
  // ============================================================================

  const startWebTorrentStream = (stream) => {
    if (typeof window === 'undefined') return
    addDebugLog('Iniciando motor Torrent...', 'info')

    if (!window.WebTorrent) {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/webtorrent@latest/webtorrent.min.js'
      script.onload = () => initializeWebTorrent(stream)
      script.onerror = () => showToast('Falha ao carregar WebTorrent.js', 'error')
      document.head.appendChild(script)
    } else {
      initializeWebTorrent(stream)
    }
  }

  const initializeWebTorrent = (stream) => {
    // 1. Limpeza
    setSelectedStream(stream)
    setShowStreamSelector(false)
    setIsPlaying(true)
    
    if (webTorrentClientRef.current) {
      try { webTorrentClientRef.current.destroy() } catch(e){}
      webTorrentClientRef.current = null
    }
    const playerEl = document.getElementById('webtorrent-player')
    if (playerEl) playerEl.innerHTML = ''

    // 2. Criação do Cliente com Configuração STUN (WebRTC)
    addDebugLog('Criando cliente WebRTC...', 'info')
    try {
      webTorrentClientRef.current = new window.WebTorrent({
        tracker: {
          rtcConfig: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        }
      })
    } catch (err) {
      showToast('Erro fatal WebTorrent', 'error')
      return
    }

    // 3. O SEGREDO DO SUCESSO: Reconstruir o Magnet Link
    // Magnet links de apps Desktop não têm trackers WebSocket.
    // Nós forçamos a lista de WSS_TRACKERS no magnet manualmente.
    if (!stream.infoHash) {
      showToast('Hash inválido', 'error')
      return
    }

    const trackersQuery = WSS_TRACKERS.map(t => `&tr=${encodeURIComponent(t)}`).join('')
    const magnetURI = `magnet:?xt=urn:btih:${stream.infoHash}&dn=${encodeURIComponent(stream.title || 'video')}${trackersQuery}`
    
    addDebugLog('Conectando ao Swarm...', 'info')
    
    const client = webTorrentClientRef.current
    let foundMetadata = false

    // Timeout de segurança
    const timeoutCheck = setTimeout(() => {
      if (!foundMetadata) {
        addDebugLog('Demorando para encontrar peers...', 'warning')
        showToast('Tentando conexões alternativas...', 'info')
      }
    }, 15000)

    client.add(magnetURI, { announce: WSS_TRACKERS }, (torrent) => {
      foundMetadata = true
      clearTimeout(timeoutCheck)
      addDebugLog(`Metadados OK. Arquivos: ${torrent.files.length}`, 'success')
      
      currentTorrentRef.current = torrent

      // Monitoramento
      const statsInterval = setInterval(() => {
        if (!torrent || torrent.destroyed) {
          clearInterval(statsInterval)
          return
        }
        setTorrentStatus({
          speed: torrent.downloadSpeed,
          peers: torrent.numPeers,
          progress: (torrent.progress * 100).toFixed(1)
        })
        if (torrent.numPeers > 0) addDebugLog(`Conectado a ${torrent.numPeers} peers`, 'success')
      }, 2000)

      // 4. Seleção Inteligente do Arquivo de Vídeo
      // Tenta achar o maior arquivo que seja video
      const file = torrent.files
        .filter(f => /\.(mp4|mkv|webm|mov|avi)$/i.test(f.name))
        .sort((a, b) => b.length - a.length)[0]

      if (!file) {
        showToast('Nenhum arquivo de vídeo reconhecido', 'error')
        return
      }

      addDebugLog(`Reproduzindo: ${file.name}`, 'info')
      
      // Prioriza o arquivo selecionado para download
      torrent.deselect(0, torrent.pieces.length - 1, false)
      file.select()

      const renderTarget = document.getElementById('webtorrent-player')
      
      // 5. Renderização
      file.appendTo(renderTarget, { 
        autoplay: true, 
        controls: true, 
        maxBlobLength: 2 * 1024 * 1024 * 1024 // 2GB Buffer
      }, (err, elem) => {
        if (err) {
          addDebugLog(`Erro playback: ${err.message}`, 'error')
          return
        }
        if (elem && elem.tagName === 'VIDEO') {
          addDebugLog('Player Anexado!', 'success')
          elem.addEventListener('error', () => {
            addDebugLog('Erro de codec (tente outro stream)', 'error')
            showToast('Navegador não suporta este codec (tente MP4/WebM)', 'error')
          })
        }
      })
    })

    client.on('error', (err) => {
      addDebugLog(`Erro Client: ${err.message}`, 'error')
    })
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Styles e JSX
  return (
    <>
      <Head>
        <title>{content ? (content.title || content.name) : 'Yoshikawa Player'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style>{`
          /* CSS OMITIDO - É EXATAMENTE O MESMO DO SEU CÓDIGO ANTERIOR PARA ECONOMIZAR ESPAÇO NA RESPOSTA */
          /* MANTENHA O SEU BLOCO DE ESTILO ORIGINAL AQUI */
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
          html { scroll-behavior: smooth; }
          body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #050505; color: #f5f5f7; }
          .glass-panel { background: rgba(255, 255, 255, 0.06); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.15); }
          /* ...Cole seus estilos originais aqui... */
          .player-overlay { position: fixed; inset: 0; background: #000; z-index: 2000; display: flex; align-items: center; justify-content: center; }
          .player-popup-container { width: 100%; height: 100%; max-width: 100vw; display: flex; flex-direction: column; }
          #webtorrent-player { flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; background: #000; }
          #webtorrent-player video { max-width: 100%; max-height: 100vh; }
          .stream-selector-popup { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #111; padding: 20px; border-radius: 12px; z-index: 3000; width: 90%; max-width: 500px; max-height: 80vh; overflow-y: auto; border: 1px solid #333; }
          .stream-item { padding: 12px; border-bottom: 1px solid #222; cursor: pointer; }
          .stream-item:hover { background: #222; }
          .debug-panel { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.8); padding: 10px; font-size: 10px; color: #0f0; z-index: 9999; pointer-events: none; }
          .torrent-stats { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); padding: 5px 15px; border-radius: 20px; z-index: 2001; }
          .close-btn-player { position: absolute; top: 20px; right: 20px; z-index: 2002; color: white; font-size: 24px; cursor: pointer; background: rgba(0,0,0,0.5); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        `}</style>
      </Head>

      <LoadingScreen visible={isLoading} />
      <ToastContainer toast={currentToast} closeToast={() => setCurrentToast(null)} />

      {content && (
        <div style={{ padding: '20px', minHeight: '100vh', backgroundImage: `url(${DEFAULT_BACKDROP})`, backgroundSize: 'cover' }}>
          
          {/* Header Simplificado */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
            <h1>{content.title || content.name}</h1>
            <button onClick={fetchAvailableStreams} style={{ marginTop: '10px', padding: '10px 20px', background: '#0A84FF', color: 'white', borderRadius: '8px' }}>
               {isLoadingStreams ? 'Buscando...' : '▶ Assistir'}
            </button>
          </div>

          {/* Seletor de Streams */}
          {showStreamSelector && (
            <div className="stream-selector-popup">
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
                 <h3>Selecione uma Fonte</h3>
                 <button onClick={() => setShowStreamSelector(false)} style={{color:'red'}}>X</button>
              </div>
              {availableStreams.map((stream, idx) => (
                <div key={idx} className="stream-item" onClick={() => startWebTorrentStream(stream)}>
                  <div style={{fontWeight:'bold'}}>{stream.title.split('\n')[0]}</div>
                  <div style={{fontSize:'0.8em', color:'#aaa'}}>{stream.name}</div>
                </div>
              ))}
            </div>
          )}

          {/* Player Overlay */}
          {isPlaying && (
            <div className="player-overlay">
              <div className="player-popup-container">
                <div className="close-btn-player" onClick={() => {
                  if(webTorrentClientRef.current) webTorrentClientRef.current.destroy();
                  setIsPlaying(false);
                }}><i className="fas fa-times"></i></div>
                
                <div id="webtorrent-player"></div>
                
                <div className="torrent-stats">
                  ⬇ {formatBytes(torrentStatus.speed)}/s | 👥 {torrentStatus.peers} peers | {torrentStatus.progress}%
                </div>

                <div className="debug-panel">
                   {debugLogs.map((l, i) => <div key={i}>{l.time} - {l.message}</div>)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
