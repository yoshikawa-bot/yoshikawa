import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
const DEFAULT_BACKDROP = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'

// Lista de Trackers WebRTC (Essenciais para funcionar no navegador)
const WEBRTC_TRACKERS = [
  'wss://tracker.openwebtorrent.com',
  'wss://tracker.btorrent.xyz',
  'wss://tracker.webtorrent.dev',
  'wss://tracker.files.fm:7073/announce',
  'wss://spacetradersapi-chatbox.herokuapp.com:443/announce',
  'wss://qwe.qwe.qwe', // Placeholder comum em listas mistas
]

// --- Componentes UI (Mantidos iguais para brevidade, foquei na lógica) ---
// (Header, BottomNav, ToastContainer, LoadingScreen... Mantenha o seu código original aqui)
// Vou omitir para o código não ficar gigante, mas assuma que eles estão aqui.
// ... INSIRA SEUS COMPONENTES HEADER, BOTTOMNAV, ETC AQUI ...
import { Header, BottomNav, ToastContainer } from '../components/YourComponents' // Exemplo: Ajuste seus imports ou mantenha o código deles no mesmo arquivo

const LoadingScreen = ({ visible }) => {
    if (!visible) return null;
    return <div className={`loading-overlay ${!visible ? 'fade-out' : ''}`}>Loading...</div>
}

export default function WatchPage() {
  const router = useRouter()
  const { type, id } = router.query
  const carouselRef = useRef(null)
  
  // Referências para o WebTorrent
  const webTorrentClientRef = useRef(null)
  const currentTorrentRef = useRef(null)
  
  // Estados UI
  const [isLoading, setIsLoading] = useState(true)
  const [navHidden, setNavHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  
  // Estados Popups
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [infoClosing, setInfoClosing] = useState(false)
  const [showTechPopup, setShowTechPopup] = useState(false)
  const [techClosing, setTechClosing] = useState(false)
  const [showSynopsisPopup, setShowSynopsisPopup] = useState(false)
  const [synopsisClosing, setSynopsisClosing] = useState(false)
  const [showDataPopup, setShowDataPopup] = useState(false)
  const [dataClosing, setDataClosing] = useState(false)
  
  // Toast
  const [currentToast, setCurrentToast] = useState(null)
  const [toastQueue, setToastQueue] = useState([])
  const toastTimerRef = useRef(null)
  
  // Dados
  const [content, setContent] = useState(null)
  const [seasonData, setSeasonData] = useState(null)
  
  // Player e Streams
  const [isPlaying, setIsPlaying] = useState(false)
  const [isWideMode, setIsWideMode] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)

  const [availableStreams, setAvailableStreams] = useState([])
  const [selectedStream, setSelectedStream] = useState(null)
  const [showStreamSelector, setShowStreamSelector] = useState(false)
  const [streamSelectorClosing, setStreamSelectorClosing] = useState(false)
  const [torrentStatus, setTorrentStatus] = useState({ speed: 0, peers: 0, progress: 0 })
  const [isLoadingStreams, setIsLoadingStreams] = useState(false)

  // --- Funções Auxiliares de Toast e UI (Mantenha as suas originais) ---
  const showToast = (message, type = 'info') => {
      // (Sua lógica original de toast)
      console.log(type, message); // Fallback para exemplo
  }

  const closeAllPopups = useCallback(() => {
     // (Sua lógica original)
     setShowStreamSelector(false)
  }, [])
  
  // --- Efeitos de Scroll e Click (Mantenha os seus originais) ---

  // 1. Carregamento Inicial
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
        setIsLoading(false)
      } catch (error) {
        console.error("Erro ao carregar", error)
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

  // -------------------------------------------------------------------------
  // 2. NOVA LÓGICA: Fetch Client-Side (Substitui a API Route)
  // -------------------------------------------------------------------------
  const fetchAvailableStreams = async () => {
    setIsLoadingStreams(true)
    try {
      // A. Buscar IDs Externos (IMDb) no TMDB
      const endpoint = type === 'movie' 
        ? `https://api.themoviedb.org/3/movie/${id}/external_ids`
        : `https://api.themoviedb.org/3/tv/${id}/external_ids`;
      
      const tmdbRes = await fetch(`${endpoint}?api_key=${TMDB_API_KEY}`);
      const tmdbData = await tmdbRes.json();
      const imdbId = tmdbData.imdb_id;

      if (!imdbId) throw new Error('IMDb ID não encontrado.');

      // B. Montar ID Torrentio
      let torrentioId = imdbId;
      if (type === 'tv') {
        torrentioId = `${imdbId}:${season}:${episode}`;
      }

      // C. Chamar Torrentio Diretamente (Suporta CORS)
      const torrentioType = type === 'tv' ? 'series' : 'movie';
      const res = await fetch(`https://torrentio.strem.fun/stream/${torrentioType}/${torrentioId}.json`);
      const data = await res.json();
      const streams = data.streams || [];

      // D. Filtrar Streams (Lógica movida para o front)
      const ptStreams = streams.filter(s => {
        const title = (s.title || '').toLowerCase();
        return title.includes('dual') || title.includes('dublado') || 
               title.includes('pt-br') || title.includes('legendado');
      });

      // Combinar listas priorizando PT-BR
      const allStreams = [...ptStreams, ...streams.filter(s => !ptStreams.includes(s))].slice(0, 20);
      
      setAvailableStreams(allStreams);
      
      if (allStreams.length === 0) {
        showToast('Nenhum stream encontrado', 'error');
      } else {
        setShowStreamSelector(true);
      }

    } catch (error) {
      console.error('Erro ao buscar streams:', error);
      showToast('Erro ao buscar streams', 'error');
    } finally {
      setIsLoadingStreams(false);
    }
  }

  // -------------------------------------------------------------------------
  // 3. WebTorrent Player (Otimizado para Navegador)
  // -------------------------------------------------------------------------
  const startWebTorrentStream = (stream) => {
    if (typeof window === 'undefined') return

    // Verifica biblioteca
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

    // Limpeza
    if (currentTorrentRef.current) {
      try { currentTorrentRef.current.destroy() } catch(e) {}
      currentTorrentRef.current = null
    }

    if (!webTorrentClientRef.current) {
      webTorrentClientRef.current = new window.WebTorrent()
    }

    const client = webTorrentClientRef.current

    // IMPORTANTE: Adiciona Trackers WebRTC ao Magnet Link original
    // O Torrentio retorna magnets "pelados" ou com trackers UDP (inúteis no browser)
    let magnetURI = `magnet:?xt=urn:btih:${stream.infoHash}&dn=${encodeURIComponent(stream.title)}`
    
    // Adicionar nossos trackers WebRTC na string do magnet
    WEBRTC_TRACKERS.forEach(tracker => {
      magnetURI += `&tr=${encodeURIComponent(tracker)}`
    })

    showToast('Buscando peers (pode demorar)...', 'info')
    
    // Adiciona timeout de segurança
    const timeoutId = setTimeout(() => {
        if (currentTorrentRef.current && currentTorrentRef.current.numPeers === 0) {
            showToast('Sem peers WebRTC. Tente outra opção.', 'error')
        }
    }, 15000)

    client.add(magnetURI, {
      announce: WEBRTC_TRACKERS // Força trackers WebRTC
    }, (torrent) => {
      clearTimeout(timeoutId)
      currentTorrentRef.current = torrent

      // Busca arquivo de vídeo
      const videoFile = torrent.files.find(f => 
        ['.mp4', '.mkv', '.webm', '.mov'].some(ext => f.name.toLowerCase().endsWith(ext))
      )

      if (!videoFile) {
        showToast('Nenhum vídeo compatível encontrado', 'error')
        return
      }

      // IMPORTANTE: Navegadores não rodam .mkv ou .avi nativamente bem.
      // Se for .mp4 ou .webm roda liso. Outros formatos podem travar ou ficar preto sem transcodificação.
      
      videoFile.select() // Prioriza o download do vídeo

      // Renderiza
      const playerContainer = document.getElementById('webtorrent-player')
      if (playerContainer) {
        playerContainer.innerHTML = '' // Limpa anterior
        
        videoFile.appendTo(playerContainer, { 
            autoplay: true, 
            muted: false,
            controls: true,
            maxBlobLength: 2 * 1000 * 1000 * 1000 // Aumenta limite de blob
        }, (err, elem) => {
            if (err) {
                console.error(err)
                showToast('Erro de renderização', 'error')
                return
            }
            // Monitoramento básico
            setupTorrentStats(torrent)
        })
      }
    })
  }

  const setupTorrentStats = (torrent) => {
      const interval = setInterval(() => {
          if(!torrent || torrent.destroyed) {
              clearInterval(interval)
              return
          }
          setTorrentStatus({
              speed: torrent.downloadSpeed,
              peers: torrent.numPeers,
              progress: (torrent.progress * 100).toFixed(1)
          })
      }, 1000)
  }

  // (Cleanup e o resto do Return do JSX)
  // ... Mantenha o seu JSX original do return ...
  // Certifique-se de que no JSX, onde tem o botão play, chame `fetchAvailableStreams`
  
  // Exemplo de como o JSX deve estar no botão principal:
  /*
  <div className="player-banner-container" onClick={fetchAvailableStreams} ... >
  */

  return (
    <>
      <Head>
        <title>Yoshikawa Player</title>
        {/* Seus styles */}
      </Head>
      
      {/* Aqui você renderiza Header, Main, etc, igual ao seu código original */}
      {/* Apenas certifique-se de usar as funções atualizadas acima */}
      
      {/* Exemplo resumido para contexto */}
      <main className="container">
          {/* ... */}
          <div className="player-banner-container" onClick={fetchAvailableStreams}>
             <div className="play-button-static">
                <i className={isLoadingStreams ? "fas fa-spinner fa-spin" : "fas fa-play"}></i>
             </div>
          </div>
          {/* ... */}
      </main>

      {/* Selector e Player Popup (Mantenha igual, apenas certifique que usam as vars novas) */}
      {showStreamSelector && (
          <div className="stream-selector-popup">
              {/* Botão fechar */}
              <button onClick={() => setShowStreamSelector(false)}>X</button>
              <div className="streams-list">
                  {availableStreams.map((stream, idx) => (
                      <div key={idx} className="stream-item" onClick={() => startWebTorrentStream(stream)}>
                          {stream.title}
                      </div>
                  ))}
              </div>
          </div>
      )}

      {isPlaying && (
          <div className="player-overlay">
              <div id="webtorrent-player"></div>
              {/* Stats */}
              <div style={{color:'white', position:'absolute', bottom: 20}}>
                  Peers: {torrentStatus.peers} | Vel: {Math.round(torrentStatus.speed/1024)} KB/s
              </div>
              <button onClick={() => {
                  setIsPlaying(false)
                  if(currentTorrentRef.current) currentTorrentRef.current.destroy()
              }} style={{position:'absolute', top: 20, right: 20, color: 'white'}}>Fechar</button>
          </div>
      )}
    </>
  )
}
