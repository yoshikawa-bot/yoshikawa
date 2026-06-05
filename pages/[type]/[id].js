import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
const DEFAULT_BACKDROP = 'https://yoshikawa-bot.github.io/cache/images/5b509b8f.webp'

// Componente de Loading mantido para carregamento inicial
const LoadingScreen = ({ visible }) => (
  <div className={`loading-overlay${!visible ? ' fade-out' : ''}`}>
    <div className="loading-spinner">
      {[...Array(12)].map((_, i) => <span key={i}></span>)}
    </div>
  </div>
)

export default function WatchPage() {
  const router = useRouter()
  const { type, id } = router.query

  const [isLoading, setIsLoading] = useState(true)
  const [content, setContent] = useState(null)
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [seasonData, setSeasonData] = useState(null)
  const [allSeasonsData, setAllSeasonsData] = useState({})
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [synopsisExpanded, setSynopsisExpanded] = useState(false)
  const [episodeOrder, setEpisodeOrder] = useState('asc')
  const [watchedEps, setWatchedEps] = useState(new Set())
  const contentLoaded = useRef(false)

  const getLastWatchedEpisode = useCallback(() => {
    if (!id || type !== 'tv') return { season: 1, episode: 1 }
    try {
      const w = localStorage.getItem(`yoshikawaWatched_${id}`)
      if (w) {
        const arr = JSON.parse(w)
        if (arr.length > 0) {
          const all = arr.map(key => key.split('-').map(Number))
          all.sort((a, b) => a[0] === b[0] ? b[1] - a[1] : b[0] - a[0])
          return { season: all[0][0], episode: all[0][1] }
        }
      }
    } catch (e) {}
    return { season: 1, episode: 1 }
  }, [id, type])

  useEffect(() => {
    if (!id || !type || contentLoaded.current) return
    const load = async () => {
      try {
        const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=external_ids`)
        const data = await res.json()
        setContent(data)
        if (type === 'tv') {
          try {
            const w = localStorage.getItem(`yoshikawaWatched_${id}`)
            if (w) setWatchedEps(new Set(JSON.parse(w)))
          } catch (e) {}
          const last = getLastWatchedEpisode()
          setSeason(last.season)
          setEpisode(last.episode)
          await fetchSeasonData(id, last.season)
        }
        checkFavorite(data)
        // Like baseado em localstorage
        try {
          const liked = localStorage.getItem(`yoshikawaLiked_${id}`)
          setIsLiked(liked === 'true')
        } catch (e) {}
        contentLoaded.current = true
      } catch { /* silencioso */ }
      setIsLoading(false)
    }
    load()
  }, [id, type, getLastWatchedEpisode])

  const fetchSeasonData = async (tvId, sn) => {
    try {
      if (allSeasonsData[sn]) { setSeasonData(allSeasonsData[sn]); setSeason(sn); return }
      const res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${sn}?api_key=${TMDB_API_KEY}&language=pt-BR`)
      const data = await res.json()
      setAllSeasonsData(prev => ({ ...prev, [sn]: data }))
      setSeasonData(data)
      setSeason(sn)
    } catch { /* silencioso */ }
  }

  const checkFavorite = (item) => {
    try {
      const stored = localStorage.getItem('yoshikawaFavorites')
      const favs = stored ? JSON.parse(stored) : []
      setIsFavorite(favs.some(f => f.id === item.id && f.media_type === type))
    } catch { setIsFavorite(false) }
  }

  const toggleFavorite = () => {
    if (!content) return
    try {
      const stored = localStorage.getItem('yoshikawaFavorites')
      let favs = stored ? JSON.parse(stored) : []
      const exists = favs.some(f => f.id === content.id && f.media_type === type)
      if (exists) favs = favs.filter(f => !(f.id === content.id && f.media_type === type))
      else favs.push({ id: content.id, media_type: type, title: content.title || content.name, poster_path: content.poster_path })
      localStorage.setItem('yoshikawaFavorites', JSON.stringify(favs))
      setIsFavorite(!exists)
    } catch { /* silencioso */ }
  }

  const toggleLike = () => {
    const newLiked = !isLiked
    setIsLiked(newLiked)
    try { localStorage.setItem(`yoshikawaLiked_${id}`, newLiked.toString()) } catch (e) {}
  }

  const handleSeasonChange = (e) => {
    const ns = parseInt(e.target.value)
    const savedEp = (() => {
      try {
        const w = localStorage.getItem(`yoshikawaWatched_${id}`)
        if (w) {
          const eps = JSON.parse(w).filter(k => k.startsWith(`${ns}-`)).map(k => parseInt(k.split('-')[1]))
          if (eps.length) return Math.max(...eps)
        }
      } catch (e) {}
      return 1
    })()
    fetchSeasonData(id, ns)
    setEpisode(savedEp)
  }

  const handleEpisodeClick = (epNum) => { setEpisode(epNum); setIsPlaying(true) }

  const markWatched = () => {
    if (type !== 'tv' || !id) return
    const key = `${season}-${episode}`
    setWatchedEps(prev => {
      if (prev.has(key)) return prev
      const next = new Set([...prev, key])
      try { localStorage.setItem(`yoshikawaWatched_${id}`, JSON.stringify([...next])) } catch (e) {}
      return next
    })
  }

  const getEmbedUrl = () => {
    if (!content) return ''
    if (type === 'movie') {
      const imdb = content.external_ids?.imdb_id || content.imdb_id
      return imdb ? `https://superflixapi.best/filme/${imdb}` : ''
    }
    return `https://superflixapi.best/serie/${id}/${season}/${episode}`
  }

  const handleShare = () => {
    if (navigator.share) navigator.share({ title: content.title || content.name, url: window.location.href })
  }

  const releaseDate = content?.release_date || content?.first_air_date || 'Desconhecido'
  const genres = content?.genres?.map(g => g.name).join(', ') || 'Gênero desconhecido'
  const ratingClass = content?.adult ? 'rating-18' : 'rating-L'
  const orderedEps = seasonData?.episodes ? (episodeOrder === 'asc' ? seasonData.episodes : [...seasonData.episodes].reverse()) : []
  const hasLongSynopsis = content?.overview && content.overview.length > 200

  return (
    <>
      <Head>
        <title>{content ? (content.title || content.name) : 'Yoshikawa'} - Reproduzindo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
          body { font-family: 'Inter', sans-serif; background: #050505; color: #fff; line-height: 1.6; overflow-x: hidden; -webkit-font-smoothing: antialiased; }

          /* Loading */
          .loading-overlay { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; background: #050505; }
          .loading-overlay.fade-out { display: none; }
          .loading-spinner { width: 48px; height: 48px; position: relative; }
          .loading-spinner span { position: absolute; top: 0; left: 50%; width: 3px; height: 11px; margin-left: -1.5px; border-radius: 999px; background: rgba(255,255,255,0.15); transform-origin: center 24px; animation: spinTick 1s linear infinite; }
          .loading-spinner span:nth-child(1) { transform: rotate(0deg); animation-delay: -0.917s; }
          .loading-spinner span:nth-child(2) { transform: rotate(30deg); animation-delay: -0.833s; }
          .loading-spinner span:nth-child(3) { transform: rotate(60deg); animation-delay: -0.750s; }
          .loading-spinner span:nth-child(4) { transform: rotate(90deg); animation-delay: -0.750s; }
          .loading-spinner span:nth-child(5) { transform: rotate(120deg); animation-delay: -0.583s; }
          .loading-spinner span:nth-child(6) { transform: rotate(150deg); animation-delay: -0.500s; }
          .loading-spinner span:nth-child(7) { transform: rotate(180deg); animation-delay: -0.417s; }
          .loading-spinner span:nth-child(8) { transform: rotate(210deg); animation-delay: -0.333s; }
          .loading-spinner span:nth-child(9) { transform: rotate(240deg); animation-delay: -0.250s; }
          .loading-spinner span:nth-child(10) { transform: rotate(270deg); animation-delay: -0.167s; }
          .loading-spinner span:nth-child(11) { transform: rotate(300deg); animation-delay: -0.083s; }
          .loading-spinner span:nth-child(12) { transform: rotate(330deg); animation-delay: 0s; }
          @keyframes spinTick { 0% { background: rgba(255,255,255,0.85); } 100% { background: rgba(255,255,255,0.10); } }

          /* Hero */
          .hero { position: relative; width: 100%; height: clamp(450px, 60vw, 620px); overflow: hidden; }
          .hero-bg { width: 100%; height: 100%; object-fit: cover; }
          .hero-gradient { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 50%, #050505 100%); }
          .hero-content { position: absolute; bottom: 0; left: 0; right: 0; padding: clamp(20px,4vw,32px); display: flex; flex-direction: column; gap: 12px; }

          .top-bar { position: absolute; top: max(20px, env(safe-area-inset-top, 20px)); left: 0; right: 0; display: flex; justify-content: space-between; align-items: center; padding: 0 clamp(16px,4vw,24px); z-index: 10; }
          .top-btn { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 20px; background: rgba(0,0,0,0.4); backdrop-filter: blur(10px); border-radius: 50%; border: 1px solid rgba(255,255,255,0.2); cursor: pointer; transition: background 0.2s; text-decoration: none; }
          .top-btn:hover { background: rgba(255,255,255,0.15); }

          .continue-btn { display: flex; align-items: center; gap: 8px; padding: 10px 24px; background: #F05454; border-radius: 28px; color: #fff; font-weight: 700; font-size: clamp(14px,2vw,16px); cursor: pointer; border: none; width: fit-content; transition: transform 0.2s; }
          .continue-btn:hover { transform: scale(1.03); }
          .hero-title { font-size: clamp(24px,5vw,30px); font-weight: 800; line-height: 1.1; }
          .hero-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: clamp(13px,2vw,15px); color: #AFAFAF; }
          .hero-rating { padding: 2px 8px; border-radius: 8px; font-weight: 700; font-size: 12px; color: #fff; }
          .rating-L { background: #4CAF50; } .rating-18 { background: #f44336; }

          /* Social */
          .social-bar { display: flex; justify-content: space-around; padding: 20px 16px; }
          .social-item { display: flex; flex-direction: column; align-items: center; gap: 4px; color: rgba(255,255,255,0.7); cursor: pointer; font-size: 13px; transition: color 0.2s; background: none; border: none; font-family: inherit; }
          .social-item i { font-size: 22px; }
          .social-item.liked i { color: #2196F3; }
          .social-item.favorited i { color: #FF5B5B; }

          /* Synopsis */
          .synopsis { padding: 0 16px 20px; }
          .synopsis p { font-size: 15px; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; margin: 0; }
          .synopsis p.expanded { -webkit-line-clamp: unset; }
          .synopsis-toggle { display: flex; align-items: center; justify-content: center; gap: 4px; margin-top: 12px; color: rgba(255,255,255,0.6); cursor: pointer; font-size: 13px; background: none; border: none; font-family: inherit; width: 100%; }

          /* Episodes */
          .episodes-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 0 16px 16px; gap: 10px; }
          .episodes-toolbar select, .episodes-toolbar button { background: #121212; border: none; color: #fff; padding: 10px 16px; border-radius: 12px; font-family: inherit; font-size: 14px; cursor: pointer; }
          .episodes-toolbar select { appearance: none; padding-right: 30px; background-image: url('data:image/svg+xml;utf8,<svg fill="white" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/></svg>'); background-repeat: no-repeat; background-position: right 8px center; }
          .episodes-list { padding: 0 12px 100px; display: flex; flex-direction: column; gap: 4px; }
          .ep-card { display: flex; gap: 12px; padding: 8px 4px; cursor: pointer; transition: background 0.2s; border-radius: 8px; margin: 0 -4px; }
          .ep-card:hover { background: rgba(255,255,255,0.03); }
          .ep-thumb { width: 140px; height: 80px; border-radius: 12px; overflow: hidden; background: #2a2a2a; flex-shrink: 0; position: relative; }
          .ep-thumb img { width: 100%; height: 100%; object-fit: cover; }
          .ep-thumb.watched::after { content: ''; position: absolute; inset: 0; background: rgba(0,0,0,0.45); }
          .ep-thumb.watched .watched-label { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: 600; z-index: 1; }
          .ep-info { flex: 1; display: flex; flex-direction: column; gap: 4px; justify-content: center; }
          .ep-info h4 { font-size: 15px; font-weight: 700; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
          .ep-info span { font-size: 13px; color: #9A9A9A; }
          .ep-card.active h4 { color: #F05454; }

          /* Player Overlay */
          .player-overlay { position: fixed; inset: 0; z-index: 2000; background: rgba(0,0,0,0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); display: flex; align-items: center; justify-content: center; padding: 16px; }
          .player-box { width: 100%; max-width: 900px; display: flex; flex-direction: column; gap: 12px; }
          .player-frame { background: #000; border-radius: 20px; overflow: hidden; aspect-ratio: 16/9; }
          .player-frame iframe { width: 100%; height: 100%; border: none; }
          .player-controls { display: flex; justify-content: space-between; align-items: center; }
          .player-controls span { font-weight: 700; background: rgba(0,0,0,0.5); padding: 6px 14px; border-radius: 8px; }
          .player-controls button { background: rgba(255,255,255,0.1); border: none; color: #fff; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 18px; }
          .nav-ep-btn { display: flex; align-items: center; gap: 8px; padding: 8px 20px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 50px; color: #fff; font-weight: 600; font-size: 14px; cursor: pointer; transition: background 0.2s; font-family: inherit; }
          .nav-ep-btn:hover { background: rgba(255,255,255,0.2); }
          .nav-ep-btn:disabled { opacity: 0.4; cursor: not-allowed; }

          @media (min-width: 768px) {
            .ep-thumb { width: 170px; height: 95px; }
            .player-box { max-width: 800px; }
          }
        `}</style>
      </Head>

      <LoadingScreen visible={isLoading} />

      {content && (
        <>
          <div className="hero">
            <img className="hero-bg" src={content.backdrop_path ? `https://image.tmdb.org/t/p/original${content.backdrop_path}` : DEFAULT_BACKDROP} alt="" />
            <div className="hero-gradient" />
            <div className="top-bar">
              <Link href="/" className="top-btn">
                <i className="fas fa-arrow-left"></i>
              </Link>
              <button className="top-btn" onClick={handleShare} title="Compartilhar">
                <i className="fas fa-share-alt"></i>
              </button>
            </div>
            <div className="hero-content">
              <button className="continue-btn" onClick={() => { setIsPlaying(true); markWatched(); }}>
                <i className="fas fa-play"></i> {type === 'tv' ? `Continuar S${season}:E${episode}` : 'Assistir'}
              </button>
              <h1 className="hero-title">{content.title || content.name}</h1>
              <div className="hero-meta">
                <span className={`hero-rating ${ratingClass}`}>{content.adult ? '18+' : 'L'}</span>
                <span>{genres}</span>
                <span>• {new Date(releaseDate).getFullYear()}</span>
              </div>
            </div>
          </div>

          <div className="social-bar">
            <button className={`social-item ${isLiked ? 'liked' : ''}`} onClick={toggleLike}>
              <i className="fas fa-thumbs-up"></i>
              <span>{isLiked ? 'Curtiu' : 'Curtir'}</span>
            </button>
            <button className={`social-item ${isFavorite ? 'favorited' : ''}`} onClick={toggleFavorite}>
              <i className={isFavorite ? 'fas fa-heart' : 'far fa-heart'}></i>
              <span>{isFavorite ? 'Favoritado' : 'Favoritar'}</span>
            </button>
            <button className="social-item" onClick={handleShare}>
              <i className="fas fa-share-alt"></i>
              <span>Compartilhar</span>
            </button>
          </div>

          <div className="synopsis">
            <p className={synopsisExpanded ? 'expanded' : ''}>{content.overview || 'Sinopse indisponível.'}</p>
            {hasLongSynopsis && (
              <button className="synopsis-toggle" onClick={() => setSynopsisExpanded(!synopsisExpanded)}>
                {synopsisExpanded ? 'Ver menos' : 'Ver mais'} <i className={`fas fa-chevron-${synopsisExpanded ? 'up' : 'down'}`}></i>
              </button>
            )}
          </div>

          {type === 'tv' && (
            <>
              <div className="episodes-toolbar">
                <select value={season} onChange={handleSeasonChange}>
                  {Array.from({ length: content.number_of_seasons || 1 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>Temporada {n}</option>
                  ))}
                </select>
                <button onClick={() => setEpisodeOrder(o => o === 'asc' ? 'desc' : 'asc')}>
                  {episodeOrder === 'asc' ? 'Antigos' : 'Recentes'} <i className="fas fa-sort"></i>
                </button>
              </div>

              <div className="episodes-list">
                {orderedEps.map(ep => {
                  const watched = watchedEps.has(`${season}-${ep.episode_number}`)
                  const isCurrent = ep.episode_number === episode
                  return (
                    <div key={ep.id} className={`ep-card ${isCurrent ? 'active' : ''}`} onClick={() => handleEpisodeClick(ep.episode_number)}>
                      <div className={`ep-thumb ${watched ? 'watched' : ''}`}>
                        {ep.still_path ? <img src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} alt="" /> : (
                          <div style={{ color: '#444', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><i className="fas fa-image"></i></div>
                        )}
                        {watched && <div className="watched-label">Assistido</div>}
                      </div>
                      <div className="ep-info">
                        <h4>{ep.episode_number}. {ep.name || 'Sem título'}</h4>
                        <span>{ep.runtime ? `${ep.runtime} min` : 'Duração indisponível'}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}

      {isPlaying && (
        <div className="player-overlay">
          <div className="player-box">
            <div className="player-controls">
              <span>{type === 'tv' ? `S${season}:E${episode}` : 'FILME'}</span>
              <button onClick={() => setIsPlaying(false)}><i className="fas fa-times"></i></button>
            </div>
            <div className="player-frame">
              <iframe src={getEmbedUrl()} allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerPolicy="origin" />
            </div>
            {type === 'tv' && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                <button className="nav-ep-btn" onClick={() => setEpisode(e => Math.max(1, e - 1))} disabled={episode === 1}>
                  <i className="fas fa-backward"></i> Anterior
                </button>
                <button className="nav-ep-btn" onClick={() => {
                  if (seasonData && episode < seasonData.episodes.length) setEpisode(e => e + 1)
                }}>
                  Próximo <i className="fas fa-forward"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
      }
