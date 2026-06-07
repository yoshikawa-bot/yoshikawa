import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://cbnowjchxxvetoxtbtax.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibm93amNoeHh2ZXRveHRidGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NTUyODQsImV4cCI6MjA5NjQzMTI4NH0.pC6DfDa723mSfj65g5qtoBWLXQt7h3ldLWYr5FocOU0'
)

const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
const DEFAULT_BACKDROP = 'https://yoshikawa-bot.github.io/cache/images/5b509b8f.webp'
const DEFAULT_AVATAR_BG = '#505050'

const getAvatarUrl = (name, color = DEFAULT_AVATAR_BG) => {
  const bg = color.replace('#', '')
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=${bg}`
}

const getUserProfile = () => {
  try {
    const saved = localStorage.getItem('yoshikawaProfile')
    if (saved) return JSON.parse(saved)
  } catch {}
  return null
}

const getGuestName = () => {
  const existing = localStorage.getItem('yoshikawaGuestName')
  if (existing) return existing
  const newName = 'Convidado' + Math.random().toString(36).substring(2, 6)
  localStorage.setItem('yoshikawaGuestName', newName)
  return newName
}

const ContentLoader = () => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#101010' }}>
    <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
)

export default function WatchPage() {
  const router = useRouter()
  const { type, id, room: roomQuery, s: querySeason, e: queryEpisode } = router.query

  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
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

  const [roomId, setRoomId] = useState(null)
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [roomUsers, setRoomUsers] = useState([])
  const [roomWaiting, setRoomWaiting] = useState(false)
  const [showChat, setShowChat] = useState(true)

  const chatEndRef = useRef(null)
  const roomTimerRef = useRef(null)
  const heartbeatRef = useRef(null)
  const inactivityTimerRef = useRef(null)
  const currentSeasonRef = useRef(season)
  const currentEpisodeRef = useRef(episode)
  const profile = getUserProfile()
  const guestName = getGuestName()
  const effectiveUserName = profile?.name || guestName

  useEffect(() => { currentSeasonRef.current = season }, [season])
  useEffect(() => { currentEpisodeRef.current = episode }, [episode])

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!roomId) return
    const subscription = supabase
      .channel(`room-${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` }, (payload) => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    const userSubscription = supabase
      .channel(`room-users-${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_users', filter: `room_id=eq.${roomId}` }, (payload) => {
        setRoomUsers(prev => {
          if (prev.some(u => u.user_name === payload.new.user_name)) return prev
          return [...prev, payload.new]
        })
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'room_users', filter: `room_id=eq.${roomId}` }, (payload) => {
        setRoomUsers(prev => prev.filter(u => u.user_name !== payload.old.user_name))
      })
      .subscribe()

    fetchRoomUsers()
    heartbeatRef.current = setInterval(() => {
      updateHeartbeat()
    }, 30000)

    return () => {
      subscription.unsubscribe()
      userSubscription.unsubscribe()
      clearInterval(heartbeatRef.current)
      clearInterval(roomTimerRef.current)
      clearInterval(inactivityTimerRef.current)
    }
  }, [roomId])

  useEffect(() => {
    if (roomId && effectiveUserName) {
      fetchMessages()
      updateHeartbeat()
      startInactivityTimer()
      startRoomExpiryTimer()
    }
  }, [roomId, effectiveUserName])

  // FIX: depende só de roomQuery, não de content
  // Assim dispara corretamente mesmo quando content já está carregado
  useEffect(() => {
    if (!roomQuery) return
    setRoomId(roomQuery)
    setShowChat(true)
    if (type === 'movie') {
      setIsPlaying(true)
    } else if (type === 'tv') {
      if (querySeason) setSeason(parseInt(querySeason))
      if (queryEpisode) setEpisode(parseInt(queryEpisode))
      setIsPlaying(true)
    }
  }, [roomQuery])

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
    if (data) setMessages(data)
  }

  const fetchRoomUsers = async () => {
    const { data } = await supabase
      .from('room_users')
      .select('*')
      .eq('room_id', roomId)
    if (data) setRoomUsers(data)
  }

  const updateHeartbeat = async () => {
    if (!roomId || !effectiveUserName) return
    await supabase.from('room_users').upsert({
      room_id: roomId,
      user_name: effectiveUserName,
      last_seen: new Date().toISOString()
    }, { onConflict: 'room_id, user_name' })
  }

  const startInactivityTimer = () => {
    clearInterval(inactivityTimerRef.current)
    inactivityTimerRef.current = setInterval(async () => {
      const { data } = await supabase
        .from('messages')
        .select('created_at')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(1)
      if (data && data.length > 0) {
        const lastMsg = new Date(data[0].created_at)
        if (Date.now() - lastMsg.getTime() > 20 * 60 * 1000) {
          closeRoom()
        }
      } else {
        closeRoom()
      }
    }, 60000)
  }

  const startRoomExpiryTimer = () => {
    roomTimerRef.current = setTimeout(() => {
      closeRoom()
    }, 2 * 60 * 60 * 1000)
  }

  const closeRoom = () => {
    if (roomId) {
      supabase.from('rooms').update({ is_active: false }).eq('id', roomId)
    }
    setRoomId(null)
    setMessages([])
    setRoomUsers([])
    setRoomWaiting(false)
    setShowChat(false)
    clearInterval(heartbeatRef.current)
    clearInterval(roomTimerRef.current)
    clearInterval(inactivityTimerRef.current)
  }

  const leaveRoom = async () => {
    if (!roomId || !effectiveUserName) return
    await supabase.from('room_users').delete().eq('room_id', roomId).eq('user_name', effectiveUserName)
    setRoomId(null)
    setMessages([])
    setRoomUsers([])
    setShowChat(false)
  }

  // FIX: reutiliza sala ativa existente em vez de sempre criar uma nova
  const createRoomAndRedirect = async () => {
    if (!content) return

    const { data: existing } = await supabase
      .from('rooms')
      .select('id')
      .eq('content_id', content.id)
      .eq('media_type', type)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let roomIdToUse = existing?.id

    if (!roomIdToUse) {
      const { data, error } = await supabase
        .from('rooms')
        .insert({ content_id: content.id, media_type: type, is_active: true })
        .select('id')
        .single()
      if (error) return
      roomIdToUse = data.id
    }

    const link = `/${type}/${id}?room=${roomIdToUse}${type === 'tv' ? `&s=${currentSeasonRef.current}&e=${currentEpisodeRef.current}` : ''}`
    router.push(link)
  }

  const sendMessage = async () => {
    if (!chatInput.trim() || !roomId || !effectiveUserName) return
    await supabase.from('messages').insert({
      room_id: roomId,
      user_name: effectiveUserName,
      user_avatar: profile?.avatarUrl || getAvatarUrl(effectiveUserName),
      content: chatInput.trim()
    })
    setChatInput('')
    clearInterval(inactivityTimerRef.current)
    startInactivityTimer()
  }

  const getLastWatchedEpisode = useCallback(() => {
    if (!id || type !== 'tv') return { season: 1, episode: 1 }
    try {
      const w = localStorage.getItem(`yoshikawaWatched_${id}`)
      if (w) {
        const arr = JSON.parse(w)
        if (arr.length > 0) {
          const all = arr.map(key => key.split('-').map(Number))
          all.sort((a, b) => b[0] - a[0] || b[1] - a[1])
          return { season: all[0][0], episode: all[0][1] }
        }
      }
    } catch (e) {}
    try {
      const saved = localStorage.getItem(`yoshikawaProgress_${id}`)
      if (saved) { const p = JSON.parse(saved); if (p.season && p.episode) return { season: p.season, episode: p.episode } }
    } catch (e) {}
    return { season: 1, episode: 1 }
  }, [id, type])

  useEffect(() => {
    if (type === 'tv' && id && content) {
      try { localStorage.setItem(`yoshikawaProgress_${id}`, JSON.stringify({ season, episode })) } catch (e) {}
    }
  }, [season, episode, id, type, content])

  useEffect(() => {
    if (!id || !type) return
    setContent(null)
    setIsLoading(true)
    setHasError(false)
    setSeason(1)
    setEpisode(1)
    setSeasonData(null)
    setAllSeasonsData({})
    setWatchedEps(new Set())

    const load = async () => {
      try {
        const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=external_ids`)
        if (!res.ok) throw new Error('Erro na API')
        const data = await res.json()
        setContent(data)
        if (type === 'tv') {
          try { const w = localStorage.getItem(`yoshikawaWatched_${id}`); if (w) setWatchedEps(new Set(JSON.parse(w))) } catch (e) {}
          const last = getLastWatchedEpisode()
          setSeason(last.season)
          setEpisode(last.episode)
          await fetchSeasonData(id, last.season)
        }
        checkFavorite(data)
        try { const liked = localStorage.getItem(`yoshikawaLiked_${id}`); setIsLiked(liked === 'true') } catch (e) {}
        setIsLoading(false)
      } catch (error) { console.error('Erro ao carregar conteúdo:', error); setHasError(true); setIsLoading(false) }
    }
    load()
  }, [id, type])

  const fetchSeasonData = async (tvId, sn) => {
    try {
      if (allSeasonsData[sn]) { setSeasonData(allSeasonsData[sn]); setSeason(sn); return }
      const res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${sn}?api_key=${TMDB_API_KEY}&language=pt-BR`)
      const data = await res.json()
      setAllSeasonsData(prev => ({ ...prev, [sn]: data }))
      setSeasonData(data)
      setSeason(sn)
    } catch (e) { console.error('Erro ao carregar temporada:', e) }
  }

  const checkFavorite = (item) => {
    try { const stored = localStorage.getItem('yoshikawaFavorites'); const favs = stored ? JSON.parse(stored) : []; setIsFavorite(favs.some(f => f.id === item.id && f.media_type === type)) } catch { setIsFavorite(false) }
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
    } catch (e) { console.error('Erro ao favoritar:', e) }
  }

  const toggleLike = () => { const newLiked = !isLiked; setIsLiked(newLiked); try { localStorage.setItem(`yoshikawaLiked_${id}`, newLiked.toString()) } catch (e) {} }

  const handleSeasonChange = (e) => {
    const ns = parseInt(e.target.value)
    const savedEp = (() => { try { const w = localStorage.getItem(`yoshikawaWatched_${id}`); if (w) { const eps = JSON.parse(w).filter(k => k.startsWith(`${ns}-`)).map(k => parseInt(k.split('-')[1])); if (eps.length) return Math.max(...eps) } } catch (e) {}; return 1 })()
    fetchSeasonData(id, ns)
    setEpisode(savedEp)
  }

  const handleEpisodeClick = (epNum) => { setEpisode(epNum); setIsPlaying(true); markWatched(currentSeasonRef.current, epNum) }

  const markWatched = useCallback((s, ep) => {
    if (type !== 'tv' || !id) return
    const key = `${s}-${ep}`
    setWatchedEps(prev => { if (prev.has(key)) return prev; const next = new Set([...prev, key]); try { localStorage.setItem(`yoshikawaWatched_${id}`, JSON.stringify([...next])) } catch (e) {}; return next })
  }, [id, type])

  const handleContinue = () => { if (type === 'tv') markWatched(currentSeasonRef.current, currentEpisodeRef.current); setIsPlaying(true) }

  const getEmbedUrl = () => {
    if (!content) return ''
    if (type === 'movie') { const imdbId = content.external_ids?.imdb_id || content.imdb_id; return imdbId ? `https://superflixapi.best/filme/${imdbId}` : `https://superflixapi.best/filme/${id}` }
    return `https://superflixapi.best/serie/${id}/${currentSeasonRef.current}/${currentEpisodeRef.current}`
  }

  const handleShare = () => { if (navigator.share) navigator.share({ title: content.title || content.name, url: window.location.href }) }

  const releaseDate = content?.release_date || content?.first_air_date || 'Desconhecido'
  const genres = content?.genres?.map(g => g.name).join(', ') || 'Gênero desconhecido'
  const ratingClass = content?.adult ? 'rating-18' : 'rating-L'
  const orderedEps = seasonData?.episodes ? (episodeOrder === 'asc' ? seasonData.episodes : [...seasonData.episodes].reverse()) : []
  const hasLongSynopsis = content?.overview && content.overview.length > 200
  const showContent = content && !hasError

  return (
    <>
      <Head>
        <title>{content ? (content.title || content.name) : 'Yoshikawa'} - Reproduzindo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style>{`
          *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
          body{font-family:'Inter',sans-serif;background:#101010;color:#fff;line-height:1.6;overflow-x:hidden;-webkit-font-smoothing:antialiased}
          .hero{position:relative;width:100%;height:clamp(450px,60vw,620px);overflow:hidden;background:#0a0a0a}
          .hero-bg{width:100%;height:100%;object-fit:cover}
          .hero-gradient{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.15) 0%,rgba(0,0,0,0.45) 50%,#101010 100%)}
          .hero-content{position:absolute;bottom:0;left:0;right:0;padding:clamp(16px,3vw,24px);display:flex;flex-direction:column;gap:8px}
          .top-bar{position:absolute;top:max(16px,env(safe-area-inset-top,16px));left:0;padding:0 clamp(16px,4vw,34px);z-index:10}
          .top-btn{width:clamp(32px,5vw,42px);height:clamp(32px,5vw,42px);display:flex;align-items:center;justify-content:center;color:#000;font-size:clamp(16px,2.5vw,20px);background:#fff;border-radius:50%;cursor:pointer;border:none;transition:transform 0.2s;text-decoration:none}
          .top-btn:hover{transform:scale(1.1)}
          .continue-btn{display:flex;align-items:center;gap:4px;padding:6px 14px;background:#F05454;border-radius:20px;color:#fff;font-weight:700;font-size:clamp(11px,1.8vw,13px);cursor:pointer;border:none;width:fit-content;transition:transform 0.2s}
          .continue-btn:hover{transform:scale(1.03)}
          .hero-title{font-size:clamp(18px,3.2vw,24px);font-weight:800;line-height:1.2}
          .hero-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:clamp(10px,1.5vw,12px);color:#AFAFAF}
          .hero-rating{padding:2px 8px;border-radius:6px;font-weight:700;font-size:clamp(10px,1.5vw,11px);color:#fff}
          .rating-L{background:#4CAF50}.rating-18{background:#f44336}
          .social-bar{display:flex;justify-content:space-around;padding:16px clamp(16px,4vw,34px)}
          .social-item{display:flex;flex-direction:column;align-items:center;gap:3px;color:rgba(255,255,255,0.7);cursor:pointer;font-size:clamp(11px,1.6vw,13px);transition:color 0.2s;background:none;border:none;font-family:inherit}
          .social-item i{font-size:clamp(18px,3vw,22px)}
          .social-item.liked i{color:#2196F3}
          .social-item.favorited i{color:#FF5B5B}
          .synopsis{padding:0 clamp(16px,4vw,34px) 16px}
          .synopsis p{font-size:clamp(12px,1.8vw,14px);line-height:1.45;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;margin:0}
          .synopsis p.expanded{-webkit-line-clamp:unset}
          .synopsis-toggle{display:flex;align-items:center;justify-content:center;gap:4px;margin-top:10px;color:rgba(255,255,255,0.6);cursor:pointer;font-size:clamp(11px,1.5vw,13px);background:none;border:none;font-family:inherit;width:100%}
          .episodes-toolbar{display:flex;justify-content:space-between;align-items:center;padding:0 clamp(16px,4vw,34px) 12px;gap:8px}
          .episodes-toolbar select,.episodes-toolbar button{background:#1B1B1B;border:none;color:#fff;padding:8px 14px;border-radius:10px;font-family:inherit;font-size:clamp(12px,1.8vw,14px);cursor:pointer}
          .episodes-toolbar select{appearance:none;padding-right:28px;background-image:url('data:image/svg+xml;utf8,<svg fill="white" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/></svg>');background-repeat:no-repeat;background-position:right 8px center}
          .episodes-list{padding:0 clamp(12px,2.5vw,24px) 80px;display:flex;flex-direction:column;gap:4px}
          .ep-card{display:flex;gap:10px;padding:6px 4px;cursor:pointer;transition:background 0.2s;border-radius:8px;margin:0 -4px}
          .ep-card:hover{background:rgba(255,255,255,0.03)}
          .ep-thumb{width:clamp(120px,20vw,160px);height:clamp(68px,12vw,90px);border-radius:10px;overflow:hidden;background:#2a2a2a;flex-shrink:0;position:relative}
          .ep-thumb img{width:100%;height:100%;object-fit:cover}
          .ep-thumb.watched::after{content:'';position:absolute;inset:0;background:rgba(0,0,0,0.45)}
          .watched-label{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:clamp(10px,1.3vw,11px);font-weight:600;z-index:1}
          .ep-info{flex:1;display:flex;flex-direction:column;gap:3px;justify-content:center}
          .ep-info h4{font-size:clamp(13px,1.8vw,15px);font-weight:700;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
          .ep-info span{font-size:clamp(11px,1.5vw,13px);color:#9A9A9A}
          .player-overlay{position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,0.1);backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);display:flex;align-items:center;justify-content:center;padding:max(16px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left));overflow-y:auto}
          .player-box{width:100%;max-width:min(90vw,90vh);display:flex;flex-direction:column;gap:10px;max-height:100%;margin:auto}
          .player-frame{width:100%;aspect-ratio:1/1;background:#000;border-radius:16px;overflow:hidden;max-height:60vh;flex-shrink:0}
          .player-frame iframe{width:100%;height:100%;border:none}
          .player-controls{display:flex;justify-content:space-between;align-items:center;flex-shrink:0;padding:0 4px}
          .glass-btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 16px;background:rgba(255,255,255,0.15);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:50px;color:#fff;font-weight:600;font-size:clamp(12px,1.8vw,14px);cursor:pointer;border:1px solid rgba(255,255,255,0.2);transition:all 0.2s;white-space:nowrap;text-decoration:none}
          .glass-btn:hover{background:rgba(255,255,255,0.25);transform:scale(1.02)}
          .glass-btn:disabled{opacity:0.4;cursor:not-allowed;transform:none}
          .glass-btn.circle{width:clamp(36px,5.5vw,44px);height:clamp(36px,5.5vw,44px);padding:0;border-radius:50%;justify-content:center}
          .nav-ep-btns{display:flex;justify-content:center;gap:10px;flex-shrink:0;flex-wrap:wrap}
          .room-btn{background:#FF6B6B;color:#fff;border:none;padding:10px 20px;border-radius:12px;font-weight:600;cursor:pointer;margin:0;font-size:14px;display:flex;align-items:center;gap:8px}
          .chat-container{flex-shrink:0;background:rgba(0,0,0,0.4);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;max-height:220px;min-height:180px}
          .chat-header{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.08)}
          .chat-header-btns{display:flex;gap:8px}
          .chat-header-btns button{background:rgba(255,255,255,0.1);border:none;color:#fff;padding:6px 12px;border-radius:8px;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:4px}
          .chat-messages{flex:1;overflow-y:auto;padding:10px 14px;display:flex;flex-direction:column;gap:8px}
          .chat-msg{display:flex;gap:8px;align-items:flex-start}
          .chat-msg-avatar{width:28px;height:28px;border-radius:50%;object-fit:cover}
          .chat-msg-bubble{background:rgba(255,255,255,0.08);padding:8px 12px;border-radius:12px;max-width:80%;font-size:13px}
          .chat-msg-name{font-weight:700;font-size:12px;margin-bottom:2px}
          .chat-msg-text{color:#ddd}
          .chat-input-bar{display:flex;padding:8px 14px;gap:8px;border-top:1px solid rgba(255,255,255,0.08)}
          .chat-input-bar input{flex:1;background:rgba(255,255,255,0.05);border:none;color:#fff;padding:8px 12px;border-radius:20px;font-size:13px;outline:none}
          .chat-send-btn{background:#FF6B6B;border:none;color:#fff;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px}
          .chat-waiting{text-align:center;padding:20px;color:#888;font-size:13px}
          @media(min-width:768px){.ep-thumb{width:clamp(140px,18vw,170px);height:clamp(78px,10vw,95px)}.player-frame{max-height:70vh}.chat-container{max-height:260px}}
          @media(max-height:600px){.player-frame{max-height:50vh}.player-box{gap:8px}.chat-container{max-height:150px}}
          @media(max-width:400px){.glass-btn{padding:6px 12px;font-size:12px;gap:4px}}
        `}</style>
      </Head>

      {isLoading && <ContentLoader />}

      {showContent ? (
        <>
          <div className="hero">
            <img className="hero-bg" src={content.backdrop_path ? `https://image.tmdb.org/t/p/original${content.backdrop_path}` : DEFAULT_BACKDROP} alt="" />
            <div className="hero-gradient" />
            <div className="top-bar">
              <Link href="/" className="top-btn"><i className="fas fa-arrow-left" /></Link>
            </div>
            <div className="hero-content">
              <button className="continue-btn" onClick={handleContinue}><i className="fas fa-play" /> {type === 'tv' ? `Continuar S${season}:E${episode}` : 'Assistir'}</button>
              <h1 className="hero-title">{content.title || content.name}</h1>
              <div className="hero-meta">
                <span className={`hero-rating ${ratingClass}`}>{content.adult ? '18+' : 'L'}</span>
                <span>{genres}</span>
                <span>• {new Date(releaseDate).getFullYear()}</span>
              </div>
            </div>
          </div>
          <div className="social-bar">
            <button className={`social-item ${isLiked ? 'liked' : ''}`} onClick={toggleLike}><i className="fas fa-thumbs-up" /><span>{isLiked ? 'Curtiu' : 'Curtir'}</span></button>
            <button className={`social-item ${isFavorite ? 'favorited' : ''}`} onClick={toggleFavorite}><i className={isFavorite ? 'fas fa-heart' : 'far fa-heart'} /><span>{isFavorite ? 'Favoritado' : 'Favoritar'}</span></button>
            <button className="social-item" onClick={handleShare}><i className="fas fa-share-alt" /><span>Compartilhar</span></button>
          </div>
          <div className="synopsis">
            <p className={synopsisExpanded ? 'expanded' : ''}>{content.overview || 'Sinopse indisponível.'}</p>
            {hasLongSynopsis && <button className="synopsis-toggle" onClick={() => setSynopsisExpanded(!synopsisExpanded)}>{synopsisExpanded ? 'Ver menos' : 'Ver mais'} <i className={`fas fa-chevron-${synopsisExpanded ? 'up' : 'down'}`} /></button>}
          </div>
          <div style={{ padding: '0 clamp(16px,4vw,34px) 16px' }}>
            <button className="room-btn" onClick={createRoomAndRedirect} style={{ margin: 0, width: '100%', justifyContent: 'center' }}>
              <i className="fas fa-users" /> Assistir com amigo
            </button>
          </div>
          {type === 'tv' ? (
            <>
              <div className="episodes-toolbar">
                <select value={season} onChange={handleSeasonChange}>
                  {Array.from({ length: content.number_of_seasons || 1 }, (_, i) => i + 1).map(n => <option key={n} value={n}>Temporada {n}</option>)}
                </select>
                <button onClick={() => setEpisodeOrder(o => o === 'asc' ? 'desc' : 'asc')}>{episodeOrder === 'asc' ? 'Antigos' : 'Recentes'} <i className="fas fa-sort" /></button>
              </div>
              <div className="episodes-list">
                {orderedEps.map(ep => {
                  const watched = watchedEps.has(`${season}-${ep.episode_number}`)
                  const isCurrent = ep.episode_number === episode
                  return (
                    <div key={ep.id} className={`ep-card ${isCurrent ? 'active' : ''}`} onClick={() => handleEpisodeClick(ep.episode_number)}>
                      <div className={`ep-thumb ${watched ? 'watched' : ''}`}>
                        {ep.still_path ? <img src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} alt="" /> : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#1a1a1a', color: '#888', fontSize: 11, fontWeight: 500, gap: 6 }}>
                            <i className="fas fa-clock" style={{ fontSize: 12 }} /> Em breve
                          </div>
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
          ) : (
            <div className="episodes-list">
              <div className="ep-card" onClick={handleContinue}>
                <div className="ep-thumb"><img src={content.poster_path ? `https://image.tmdb.org/t/p/w300${content.poster_path}` : DEFAULT_BACKDROP} alt="" /></div>
                <div className="ep-info"><h4>{content.title || content.name}</h4><span>{content.runtime ? `${content.runtime} min` : 'Duração indisponível'}</span></div>
              </div>
            </div>
          )}
        </>
      ) : hasError ? (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#101010', flexDirection: 'column', gap: 16, padding: 20 }}>
          <i className="fas fa-exclamation-triangle" style={{ fontSize: 48, color: '#F05454' }} />
          <p style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>Erro ao carregar conteúdo</p>
          <Link href="/" style={{ color: '#2196F3', textDecoration: 'none', fontSize: 14 }}>Voltar ao início</Link>
        </div>
      ) : <div className="hero" />}

      {isPlaying && (
        <div className="player-overlay">
          <div className="player-box">
            <div className="player-controls">
              <div className="glass-btn" style={{ cursor: 'default', pointerEvents: 'none' }}>
                {type === 'tv' ? `S${season}:E${episode}` : 'FILME'}
              </div>
              <button className="glass-btn circle" onClick={() => setIsPlaying(false)}><i className="fas fa-times" /></button>
            </div>
            <div className="player-frame">
              <iframe src={getEmbedUrl()} allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerPolicy="origin" />
            </div>
            {type === 'tv' && (
              <div className="nav-ep-btns">
                <button className="glass-btn" onClick={() => { if (episode > 1) { const prevEp = episode - 1; setEpisode(prevEp); markWatched(season, prevEp) } }} disabled={episode === 1}>
                  <i className="fas fa-backward" /> Anterior
                </button>
                <button className="glass-btn" onClick={() => { if (seasonData && episode < seasonData.episodes.length) { const nextEp = episode + 1; setEpisode(nextEp); markWatched(season, nextEp) } }}>
                  Próximo <i className="fas fa-forward" />
                </button>
              </div>
            )}

            {roomId && showChat ? (
              <div className="chat-container">
                <div className="chat-header">
                  <span style={{ fontWeight: 600, fontSize: 14 }}>💬 Chat da sala</span>
                  <div className="chat-header-btns">
                    <button onClick={() => setShowChat(false)}>Fechar</button>
                    <button onClick={leaveRoom}>Sair da sala</button>
                  </div>
                </div>
                <div className="chat-messages">
                  {messages.length === 0 && roomWaiting && <div className="chat-waiting">Aguardando alguém entrar...</div>}
                  {messages.map(msg => (
                    <div key={msg.id} className="chat-msg">
                      <img className="chat-msg-avatar" src={msg.user_avatar || getAvatarUrl(msg.user_name)} alt="" />
                      <div className="chat-msg-bubble">
                        <div className="chat-msg-name">{msg.user_name}</div>
                        <div className="chat-msg-text">{msg.content}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="chat-input-bar">
                  <input
                    type="text"
                    placeholder="Digite sua mensagem..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') sendMessage() }}
                  />
                  <button className="chat-send-btn" onClick={sendMessage}><i className="fas fa-paper-plane" /></button>
                </div>
              </div>
            ) : (
              <button className="room-btn" onClick={createRoomAndRedirect}>
                <i className="fas fa-users" /> Assistir com amigo
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
                    }
