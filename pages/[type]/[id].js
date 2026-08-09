import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://imltlehcxlokhlteikat.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbHRsZWhjeGxva2hsdGVpa2F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NzA2MDUsImV4cCI6MjA5NjU0NjYwNX0.i7nCX3n6-aQ0uLKmKTzxEb4h-PdHSIRUNP0VoCIy_iU'
)

const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
const DEFAULT_BACKDROP = 'https://yoshikawa-bot.github.io/cache/images/5b509b8f.webp'
const DEFAULT_AVATAR_BG = '#505050'
const MAX_ROOM_USERS = 5
const MESSAGE_COOLDOWN_MS = 2000
const MAX_MESSAGE_LENGTH = 500
const CONTINUE_COLOR = '#F05454'
const LOGO_URL = 'https://yoshikawa-bot.github.io/cache/images/ca96aff2.webp'

const DAYS_OF_WEEK = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB']

const loadedImageCache = new Set()
const observedElements = new Map()

const ImageWithCache = ({ src, alt, className, style, ...props }) => {
  const [loaded, setLoaded] = useState(loadedImageCache.has(src))
  const [inView, setInView] = useState(false)
  const imgRef = useRef(null)

  useEffect(() => {
    const el = imgRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.unobserve(el)
          observedElements.delete(el)
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    observedElements.set(el, observer)

    return () => {
      observer.disconnect()
      observedElements.delete(el)
    }
  }, [])

  useEffect(() => {
    if (!inView || loadedImageCache.has(src)) {
      if (loadedImageCache.has(src)) setLoaded(true)
      return
    }

    const img = new Image()
    img.src = src
    img.onload = () => {
      loadedImageCache.add(src)
      setLoaded(true)
    }
    img.onerror = () => {
      setLoaded(true)
    }
  }, [src, inView])

  return (
    <div
      ref={imgRef}
      className={`img-container ${className || ''} ${!loaded && inView ? 'shimmer' : ''}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: '#1B1B1B',
        ...style
      }}
    >
      {inView && (
        <img
          src={src}
          alt={alt}
          className={`img-loaded ${loaded ? 'img-visible' : ''}`}
          style={{
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
          loading="lazy"
          {...props}
        />
      )}
    </div>
  )
}

const ContentLoader = () => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#101010' }}>
    <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
)

const getAvatarUrl = (name, color = DEFAULT_AVATAR_BG) => {
  const bg = color.replace('#', '')
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=${bg}`
}

const fetchBRCertification = async (item) => {
  if (!item?.id) return null
  try {
    const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie')
    const type = mediaType === 'tv' ? 'tv' : 'movie'
    if (type === 'movie') {
      const res = await fetch(`https://api.themoviedb.org/3/movie/${item.id}/release_dates?api_key=${TMDB_API_KEY}`)
      const data = await res.json()
      const br = data.results?.find(r => r.iso_3166_1 === 'BR')
      if (br) {
        const cert = br.release_dates?.find(d => d.certification && d.certification !== '')
        return cert?.certification || null
      }
    } else {
      const res = await fetch(`https://api.themoviedb.org/3/tv/${item.id}/content_ratings?api_key=${TMDB_API_KEY}`)
      const data = await res.json()
      const br = data.results?.find(r => r.iso_3166_1 === 'BR')
      return br?.rating || null
    }
  } catch {}
  return null
}

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
  const [synopsisOverflow, setSynopsisOverflow] = useState(false)
  const [episodeOrder, setEpisodeOrder] = useState('asc')
  const [watchedEps, setWatchedEps] = useState(new Set())
  const [certification, setCertification] = useState(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [airingDay, setAiringDay] = useState(null)

  const [roomId, setRoomId] = useState(null)
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatDisplayName, setChatDisplayName] = useState('')
  const [isNameSet, setIsNameSet] = useState(false)
  const [roomUsers, setRoomUsers] = useState([])
  const [roomWaiting, setRoomWaiting] = useState(false)
  const [showChat, setShowChat] = useState(true)
  const [isRoomCreator, setIsRoomCreator] = useState(false)
  const [roomClosed, setRoomClosed] = useState(false)
  const [roomFull, setRoomFull] = useState(false)
  const [roomInvalid, setRoomInvalid] = useState(false)

  const [roomLink, setRoomLink] = useState('')
  const [copiedRoomLink, setCopiedRoomLink] = useState(false)

  const [effectiveUserName, setEffectiveUserName] = useState('')
  const [profile, setProfile] = useState(null)

  const chatEndRef = useRef(null)
  const roomTimerRef = useRef(null)
  const heartbeatRef = useRef(null)
  const inactivityTimerRef = useRef(null)
  const currentSeasonRef = useRef(season)
  const currentEpisodeRef = useRef(episode)
  const roomCreatorRef = useRef(false)
  const lastMessageTimeRef = useRef(0)
  const roomCloseTimeoutRef = useRef(null)
  const synopsisRef = useRef(null)
  const isLoggedIn = profile && profile.name && !effectiveUserName.startsWith('Convidado')

  const [disableFriendMode, setDisableFriendMode] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('yoshikawaDisableFriendMode')
      if (saved === 'true') setDisableFriendMode(true)
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem('yoshikawaDisableFriendMode', disableFriendMode ? 'true' : 'false')
  }, [disableFriendMode])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('yoshikawaProfile')
      if (saved) {
        const p = JSON.parse(saved)
        setProfile(p)
        setEffectiveUserName(p.name || '')
        return
      }
    } catch {}
    let guestName = localStorage.getItem('yoshikawaGuestName')
    if (!guestName) {
      guestName = 'Convidado' + Math.random().toString(36).substring(2, 6)
      localStorage.setItem('yoshikawaGuestName', guestName)
    }
    setEffectiveUserName(guestName)
  }, [])

  useEffect(() => { currentSeasonRef.current = season }, [season])
  useEffect(() => { currentEpisodeRef.current = episode }, [episode])

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (seasonData && seasonData.episodes && episode > seasonData.episodes.length) {
      setEpisode(seasonData.episodes.length || 1)
    }
  }, [seasonData, episode])

  useEffect(() => {
    if (isLoggedIn) {
      setChatDisplayName(profile.name)
      setIsNameSet(true)
    } else {
      const savedName = localStorage.getItem('yoshikawaChatName')
      if (savedName) {
        setChatDisplayName(savedName)
        setIsNameSet(true)
      } else {
        setChatDisplayName('')
        setIsNameSet(false)
      }
    }
  }, [isLoggedIn, profile])

  useEffect(() => {
    if (!router.isReady || !roomQuery) return

    const validateRoom = async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('is_active')
        .eq('id', roomQuery)
        .single()

      if (error || !data || !data.is_active) {
        setRoomInvalid(true)
        setRoomId(null)
        return
      }

      setRoomId(roomQuery)
      setShowChat(true)
      setIsRoomCreator(false)
      roomCreatorRef.current = false
      setRoomClosed(false)
      setRoomFull(false)
      setRoomInvalid(false)
      if (type === 'movie') {
        setIsPlaying(true)
      } else if (type === 'tv') {
        if (querySeason) setSeason(parseInt(querySeason))
        if (queryEpisode) setEpisode(parseInt(queryEpisode))
        setIsPlaying(true)
      }
    }

    validateRoom()
  }, [router.isReady, roomQuery])

  useEffect(() => {
    if (!roomId || !effectiveUserName) return

    const subscription = supabase
      .channel(`room-${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` }, (payload) => {
        setMessages(prev => {
          const exists = prev.some(m => m.id === payload.new.id)
          if (exists) return prev
          return [...prev, payload.new]
        })
      })
      .subscribe()

    const userSubscription = supabase
      .channel(`room-users-${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_users', filter: `room_id=eq.${roomId}` }, (payload) => {
        setRoomUsers(prev => {
          if (prev.some(u => u.user_name === payload.new.user_name)) return prev
          return [...prev, payload.new]
        })
        setRoomWaiting(false)
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'room_users', filter: `room_id=eq.${roomId}` }, (payload) => {
        setRoomUsers(prev => prev.filter(u => u.user_name !== payload.old.user_name))
      })
      .subscribe()

    const roomSubscription = supabase
      .channel(`room-status-${roomId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (payload) => {
        if (payload.new.is_active === false) {
          setRoomClosed(true)
          setIsRoomCreator(false)
          roomCreatorRef.current = false
          roomCloseTimeoutRef.current = setTimeout(() => {
            setRoomId(null)
            setMessages([])
            setRoomUsers([])
            setShowChat(false)
            setRoomWaiting(false)
            setIsRoomCreator(false)
            setRoomClosed(false)
            setIsNameSet(false)
            setChatDisplayName('')
          }, 4000)
        }
      })
      .subscribe()

    fetchRoomUsers()
    fetchMessages()
    heartbeatRef.current = setInterval(() => {
      updateHeartbeat()
    }, 30000)
    startInactivityTimer()
    startRoomExpiryTimer()

    return () => {
      subscription.unsubscribe()
      userSubscription.unsubscribe()
      roomSubscription.unsubscribe()
      clearInterval(heartbeatRef.current)
      clearInterval(roomTimerRef.current)
      clearInterval(inactivityTimerRef.current)
      clearTimeout(roomCloseTimeoutRef.current)
    }
  }, [roomId, effectiveUserName])

  useEffect(() => {
    if (roomId && isNameSet && chatDisplayName) {
      announceEntry(chatDisplayName)
    }
  }, [roomId, isNameSet, chatDisplayName])

  useEffect(() => {
    if (!roomId || !effectiveUserName) return

    const initRoom = async () => {
      if (!roomCreatorRef.current) {
        const canJoin = await checkRoomCapacity()
        if (!canJoin) {
          setRoomFull(true)
          setRoomId(null)
          return
        }
      }
      updateHeartbeat()
      startInactivityTimer()
      startRoomExpiryTimer()
    }

    initRoom()
  }, [roomId, effectiveUserName])

  useEffect(() => {
    if (isPlaying) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isPlaying])

  useEffect(() => {
    if (!synopsisExpanded && synopsisRef.current) {
      const el = synopsisRef.current
      setSynopsisOverflow(el.scrollHeight > el.clientHeight)
    }
  }, [content?.overview, synopsisExpanded])

  const announceEntry = async (name) => {
    if (!roomId || !name) return
    await supabase.from('messages').insert({
      room_id: roomId,
      user_name: 'Sistema',
      user_avatar: '',
      content: `${name} entrou no chat`,
      is_system: true,
      created_at: new Date().toISOString()
    })
  }

  const checkRoomCapacity = async () => {
    const { count, error } = await supabase
      .from('room_users')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)
    if (error) return false
    return count < MAX_ROOM_USERS
  }

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
    if (data) {
      setMessages(prev => {
        const dbIds = new Set(data.map(m => m.id))
        const localSystem = prev.filter(m => m.is_system && !dbIds.has(m.id))
        return [...data, ...localSystem]
      })
    }
  }

  const fetchRoomUsers = async () => {
    const { data } = await supabase
      .from('room_users')
      .select('*')
      .eq('room_id', roomId)
    if (data) {
      setRoomUsers(data)
      if (data.length > 0) setRoomWaiting(false)
    }
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
  }

  const leaveRoom = () => {
    setShowChat(false)
  }

  const endRoom = async () => {
    if (!roomId || !effectiveUserName || !isRoomCreator) return
    await supabase.from('messages').insert({
      room_id: roomId,
      user_name: 'Sistema',
      user_avatar: '',
      content: 'O chat foi fechado pelo criador',
      is_system: true,
      created_at: new Date().toISOString()
    })
    await supabase.from('room_users').delete().eq('room_id', roomId).eq('user_name', effectiveUserName)
    closeRoom()
    setRoomClosed(true)
    setIsRoomCreator(false)
    roomCreatorRef.current = false
    setIsNameSet(false)
    setChatDisplayName('')
    clearTimeout(roomCloseTimeoutRef.current)
    roomCloseTimeoutRef.current = setTimeout(() => {
      setRoomId(null)
      setMessages([])
      setRoomUsers([])
      setShowChat(false)
      setRoomWaiting(false)
      setRoomClosed(false)
    }, 4000)
  }

  const createRoomAndRedirect = async () => {
    if (!isLoggedIn) return
    if (!content) return
    const { data, error } = await supabase
      .from('rooms')
      .insert({ content_id: String(content.id), media_type: type, is_active: true })
      .select('id')
      .single()
    if (error) return
    const newRoomId = data.id
    const link = `${window.location.origin}/${type}/${id}?room=${newRoomId}${type === 'tv' ? `&s=${currentSeasonRef.current}&e=${currentEpisodeRef.current}` : ''}`
    setRoomLink(link)
    setRoomId(newRoomId)
    setShowChat(false)
    setIsRoomCreator(true)
    roomCreatorRef.current = true
    setIsPlaying(true)
  }

  const handleCopyRoomLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(roomLink)
      setCopiedRoomLink(true)
      setTimeout(() => setCopiedRoomLink(false), 2000)
    }
    goToChat()
  }

  const goToChat = () => {
    setShowChat(true)
    setRoomLink('')
  }

  const confirmName = () => {
    const trimmed = chatDisplayName.trim()
    if (!trimmed) return
    setChatDisplayName(trimmed)
    setIsNameSet(true)
    if (!isLoggedIn) {
      localStorage.setItem('yoshikawaChatName', trimmed)
    }
  }

  const sendMessage = async () => {
    if (!chatInput.trim() || !roomId || !chatDisplayName || roomClosed) return
    if (chatInput.length > MAX_MESSAGE_LENGTH) return

    const now = Date.now()
    if (now - lastMessageTimeRef.current < MESSAGE_COOLDOWN_MS) return
    lastMessageTimeRef.current = now

    const avatar = profile?.avatarUrl || getAvatarUrl(chatDisplayName)
    await supabase.from('messages').insert({
      room_id: roomId,
      user_name: chatDisplayName,
      user_avatar: avatar,
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
    setCertification(null)
    setAiringDay(null)

    const load = async () => {
      try {
        const append = type === 'tv' ? 'external_ids,next_episode_to_air' : 'external_ids'
        const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=${append}`)
        if (!res.ok) throw new Error('Erro na API')
        const data = await res.json()
        setContent(data)

        if (type === 'tv') {
          try { const w = localStorage.getItem(`yoshikawaWatched_${id}`); if (w) setWatchedEps(new Set(JSON.parse(w))) } catch (e) {}
          const last = getLastWatchedEpisode()
          setSeason(last.season)
          setEpisode(last.episode)
          await fetchSeasonData(id, last.season)

          if (data.next_episode_to_air?.air_date) {
            const airDate = new Date(data.next_episode_to_air.air_date + 'T00:00:00')
            const dayIndex = airDate.getDay()
            setAiringDay(DAYS_OF_WEEK[dayIndex])
          }
        }
        checkFavorite(data)
        try { const liked = localStorage.getItem(`yoshikawaLiked_${id}`); setIsLiked(liked === 'true') } catch (e) {}
        const cert = await fetchBRCertification(data)
        if (cert) setCertification(cert)
        setIsLoading(false)
      } catch (error) { setHasError(true); setIsLoading(false) }
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
    } catch (e) {}
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
    } catch (e) {}
  }

  const toggleLike = () => { const newLiked = !isLiked; setIsLiked(newLiked); try { localStorage.setItem(`yoshikawaLiked_${id}`, newLiked.toString()) } catch (e) {} }

  const handleSeasonChange = (e) => {
    const ns = parseInt(e.target.value)
    fetchSeasonData(id, ns)
    const savedEp = (() => { try { const w = localStorage.getItem(`yoshikawaWatched_${id}`); if (w) { const eps = JSON.parse(w).filter(k => k.startsWith(`${ns}-`)).map(k => parseInt(k.split('-')[1])); if (eps.length) return Math.max(...eps) } } catch (e) {}; return 1 })()
    setEpisode(savedEp)
  }

  const handleEpisodeClick = (epNum) => {
    setEpisode(epNum)
    setIsPlaying(true)
    markWatched(currentSeasonRef.current, epNum)
  }

  const markWatched = useCallback((s, ep) => {
    if (type !== 'tv' || !id) return
    const key = `${s}-${ep}`
    setWatchedEps(prev => {
      if (prev.has(key)) return prev
      const next = new Set([...prev, key])
      try { localStorage.setItem(`yoshikawaWatched_${id}`, JSON.stringify([...next])) } catch (e) {}
      return next
    })
  }, [id, type])

  const handleContinue = () => {
    if (type === 'tv') markWatched(currentSeasonRef.current, currentEpisodeRef.current)
    setIsPlaying(true)
  }

  const getEmbedUrl = () => {
    if (!content) return ''
    const colorCode = CONTINUE_COLOR.replace('#', '')
    const hashes = `noEpList#noLink#transparent#bg${colorCode}`
    if (type === 'movie') {
      const imdbId = content.external_ids?.imdb_id || content.imdb_id
      const base = imdbId ? `https://superflixapi.pro/filme/${imdbId}` : `https://superflixapi.pro/filme/${id}`
      return `${base}#${hashes}`
    }
    return `https://superflixapi.pro/serie/${id}/${season}/${episode}#${hashes}`
  }

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  const copyPageLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => {})
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    }
  }

  const releaseDate = content?.release_date || content?.first_air_date || 'Desconhecido'
  const genres = content?.genres?.map(g => g.name).join(', ') || 'Gênero desconhecido'

  const getRatingClass = (cert) => {
    if (!cert) return 'rating-L'
    if (cert.includes('18')) return 'rating-18'
    if (cert.includes('16')) return 'rating-16'
    if (cert.includes('14')) return 'rating-14'
    if (cert.includes('12')) return 'rating-12'
    if (cert.includes('10')) return 'rating-10'
    return 'rating-L'
  }
  const ratingText = certification || (content?.adult ? '18+' : 'L')
  const ratingClass = getRatingClass(certification || (content?.adult ? '18' : 'L'))

  const orderedEps = seasonData?.episodes ? (episodeOrder === 'asc' ? seasonData.episodes : [...seasonData.episodes].reverse()) : []
  const showContent = content && !hasError

  return (
    <>
      <Head>
        <title>{content ? (content.title || content.name) : 'Yoshikawa'} - Reproduzindo</title>
        <link rel="icon" href="https://yoshikawa-bot.github.io/cache/images/a72f60f7.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="color-scheme" content="dark" />
        <meta property="og:title" content={content ? (content.title || content.name) : 'Yoshikawa Streaming'} />
        <meta property="og:description" content={content?.overview?.slice(0, 200) || 'Assista no Yoshikawa Streaming'} />
        <meta property="og:image" content={content?.backdrop_path ? `https://image.tmdb.org/t/p/w780${content.backdrop_path}` : DEFAULT_BACKDROP} />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        <meta property="og:type" content="website" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style>{`
          *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;forced-color-adjust:none}
          html{color-scheme:dark}
          body{font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;background:#101010;color:#f5f5f7;line-height:1.6;overflow-x:hidden;-webkit-font-smoothing:antialiased;min-height:100vh;overflow-y:auto;forced-color-adjust:none}
          a{color:inherit;text-decoration:none}
          button{font-family:inherit;border:none;outline:none;background:none;cursor:pointer;user-select:none}
          img{max-width:100%;height:auto;display:block}

          .shimmer {
            background: linear-gradient(90deg, #1B1B1B 25%, #2a2a2a 50%, #1B1B1B 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
          }
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          .img-container{background:#1B1B1B}
          .img-visible{opacity:1!important}

          .hero{position:relative;width:100%;height:clamp(450px,60vw,620px);overflow:hidden;background:#0a0a0a}
          .hero-bg{width:100%;height:100%;object-fit:cover}
          .hero-gradient{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.15) 0%,rgba(0,0,0,0.45) 50%,#101010 100%)}
          .hero-content{position:absolute;bottom:0;left:0;right:0;padding:clamp(16px,2.6vw,22px);display:flex;flex-direction:column;gap:8px}
          .top-bar{position:absolute;top:max(16px,env(safe-area-inset-top,16px));left:0;right:0;padding:0 clamp(16px,2.6vw,22px);z-index:10;display:flex;justify-content:space-between;align-items:center}
          .continue-btn{display:flex;align-items:center;gap:4px;padding:4px 10px;background:${CONTINUE_COLOR};border-radius:16px;color:#fff;font-weight:600;font-size:clamp(10px,1.6vw,12px);cursor:pointer;border:none;width:fit-content;transition:transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);will-change:transform}
          .continue-btn:active{transform:scale(0.97)}
          .hero-title{font-size:clamp(18px,3.2vw,24px);font-weight:800;line-height:1.2}
          .hero-meta{display:flex;align-items:center;gap:6px;flex-wrap:nowrap;overflow:hidden;font-size:clamp(10px,1.5vw,12px);color:#AFAFAF}
          .hero-badge{display:inline-flex;align-items:center;justify-content:center;min-width:26px;padding:2px 6px;border-radius:6px;font-weight:700;font-size:clamp(10px,1.5vw,11px);color:#fff;flex-shrink:0}
          .rating-L{background:#4CAF50}.rating-10{background:#2196F3}.rating-12{background:#FFC107}.rating-14{background:#FF9800}.rating-16{background:#f44336}.rating-18{background:#f44336}
          .hero-airing-badge{display:flex;align-items:center;gap:3px;padding:2px 6px;border-radius:6px;font-weight:700;font-size:clamp(10px,1.4vw,11px);color:#fff;background:#64B5F6;flex-shrink:0}
          .hero-airing-badge i{font-size:9px}
          .hero-year-badge{background:#7E57C2;color:#fff;flex-shrink:0}
          .hero-genres{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0}
          .social-bar{display:flex;justify-content:space-around;padding:clamp(12px,2vw,16px) clamp(16px,2.6vw,22px)}
          .social-item{display:flex;flex-direction:column;align-items:center;gap:3px;color:rgba(255,255,255,0.7);cursor:pointer;font-size:clamp(11px,1.6vw,13px);transition:color 0.2s cubic-bezier(0.4, 0, 0.2, 1);background:none;border:none;font-family:inherit}
          .social-item i{font-size:clamp(18px,3vw,22px);transition:transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)}
          .social-item:active i{transform:scale(0.9)}
          .social-item.liked i{color:#2196F3}
          .social-item.favorited i{color:#FF5B5B}
          .social-item.copied i{color:#4CAF50}
          .synopsis{padding:0 clamp(16px,2.6vw,22px) 16px}
          .synopsis p{font-size:clamp(12px,1.8vw,14px);line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin:0;color:#C0C0C0}
          .synopsis p.expanded{-webkit-line-clamp:unset}
          .synopsis-toggle{display:flex;align-items:center;justify-content:center;gap:4px;margin-top:10px;color:#fff;cursor:pointer;font-size:clamp(11px,1.5vw,13px);background:none;border:none;font-family:inherit;width:100%;font-weight:600}
          .episodes-toolbar{display:flex;justify-content:space-between;align-items:center;padding:0 clamp(16px,2.6vw,22px) 12px;gap:8px}
          .episodes-toolbar select,.episodes-toolbar button{background:#1B1B1B;border:none;color:#fff;padding:8px 14px;border-radius:10px;font-family:inherit;font-size:clamp(12px,1.8vw,14px);cursor:pointer;transition:background 0.2s;outline:none;-webkit-appearance:none;-moz-appearance:none;appearance:none}
          .episodes-toolbar select:focus,.episodes-toolbar button:focus{outline:none;border:none;box-shadow:none}
          .episodes-toolbar select{padding-right:28px;background-image:url('data:image/svg+xml;utf8,<svg fill="white" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/></svg>');background-repeat:no-repeat;background-position:right 8px center}
          .episodes-list{padding:0 clamp(16px,2.6vw,22px) 80px;display:flex;flex-direction:column;gap:4px}
          .ep-card{display:flex;gap:10px;padding:6px;cursor:pointer;transition:background 0.2s cubic-bezier(0.4, 0, 0.2, 1);border-radius:8px;margin:0 -4px}
          .ep-card:hover{background:rgba(255,255,255,0.03)}
          .ep-card.active{background:rgba(255,255,255,0.05)}
          .ep-thumb{width:clamp(120px,20vw,160px);height:clamp(68px,12vw,90px);border-radius:10px;overflow:hidden;background:#2a2a2a;flex-shrink:0;position:relative}
          .ep-thumb img{width:100%;height:100%;object-fit:cover}
          .ep-thumb.watched::after{content:'';position:absolute;inset:0;background:rgba(0,0,0,0.45)}
          .watched-label{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:clamp(10px,1.3vw,11px);font-weight:600;z-index:1}
          .ep-info{flex:1;display:flex;flex-direction:column;gap:3px;justify-content:center}
          .ep-info h4{font-size:clamp(13px,1.8vw,15px);font-weight:700;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
          .ep-info span{font-size:clamp(11px,1.5vw,13px);color:#9A9A9A}
          .player-overlay{position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,0.1);backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);display:flex;align-items:center;justify-content:center;padding:max(16px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left));overflow-y:auto}
          .player-box{width:100%;max-width:90vw;display:flex;flex-direction:column;gap:10px;max-height:100%;margin:auto}
          @media(min-width:1024px){.player-box{flex-direction:row;max-width:95vw;align-items:stretch;gap:16px}.player-frame{flex:1;max-height:75vh;aspect-ratio:16/9}.chat-sidebar{width:320px;flex-shrink:0;display:flex;flex-direction:column;gap:10px;max-height:75vh}}
          .player-frame{width:100%;aspect-ratio:1/1;background:#000;border-radius:16px;overflow:hidden;max-height:60vh;flex-shrink:0}
          .player-frame iframe{width:100%;height:100%;border:none}
          .player-controls{display:flex;justify-content:space-between;align-items:center;flex-shrink:0;padding:0 4px}
          .glass-btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 16px;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);background:rgba(128,128,128,0.3);border:1px solid rgba(255,255,255,0.12);border-radius:50px;color:#fff;font-weight:600;font-size:clamp(12px,1.8vw,14px);cursor:pointer;transition:transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),background 0.2s cubic-bezier(0.4, 0, 0.2, 1);will-change:transform;white-space:nowrap;text-decoration:none;forced-color-adjust:none}
          .glass-btn:active{transform:scale(0.97);background:rgba(180,180,180,0.4)}
          .glass-btn:disabled{opacity:0.4;cursor:not-allowed;transform:none}
          .glass-btn.circle{width:clamp(36px,5.5vw,44px);height:clamp(36px,5.5vw,44px);padding:0;border-radius:50%;justify-content:center}
          .nav-ep-btns{display:flex;justify-content:center;gap:10px;flex-shrink:0;flex-wrap:wrap}
          .room-btn{background:${CONTINUE_COLOR};color:#fff;border:none;padding:10px 20px;border-radius:12px;font-weight:600;cursor:pointer;margin:0;font-size:14px;display:flex;align-items:center;gap:8px;transition:transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);will-change:transform;width:100%;justify-content:center}
          .room-btn:active{transform:scale(0.97)}
          .room-btn:disabled{opacity:0.5;cursor:not-allowed}
          .chat-container{height:200px;max-height:200px;flex-shrink:0;background:rgba(20,20,20,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08);border-radius:clamp(14px,2vw,20px);overflow:hidden;display:flex;flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,0.4)}
          .chat-header{display:flex;justify-content:space-between;align-items:center;padding:clamp(8px,1.5vw,12px) clamp(12px,2vw,16px);border-bottom:1px solid rgba(255,255,255,0.08);flex-shrink:0;font-size:clamp(12px,1.8vw,14px);font-weight:600;color:#fff}
          .chat-header-btns{display:flex;gap:6px}
          .chat-header-btns button{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.08);color:#fff;padding:5px 10px;border-radius:8px;font-size:11px;cursor:pointer;display:flex;align-items:center;gap:4px;transition:background 0.2s}
          .chat-header-btns button:active{background:rgba(255,255,255,0.2)}
          .chat-header-btns .danger-btn{background:${CONTINUE_COLOR};border-color:${CONTINUE_COLOR};color:#fff}
          .chat-messages{flex:1;overflow-y:auto;padding:clamp(8px,1.5vw,12px) clamp(12px,2vw,16px);display:flex;flex-direction:column;gap:8px;min-height:0}
          .chat-msg{display:flex;gap:8px;align-items:flex-start}
          .chat-msg.system{justify-content:center;text-align:center;color:rgba(255,255,255,0.5);font-size:11px;padding:4px 0}
          .chat-msg-avatar{width:28px;height:28px;border-radius:50%;object-fit:cover;border:1px solid rgba(255,255,255,0.1)}
          .chat-msg-bubble{background:rgba(255,255,255,0.08);padding:8px 12px;border-radius:12px;max-width:80%;font-size:13px;line-height:1.4}
          .chat-msg-name{font-weight:700;font-size:11px;margin-bottom:2px;color:#ccc}
          .chat-msg-text{color:#ddd}
          .chat-input-bar{display:flex;padding:clamp(8px,1.5vw,12px) clamp(12px,2vw,16px);gap:8px;border-top:1px solid rgba(255,255,255,0.08);flex-shrink:0}
          .chat-input-bar input{flex:1;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);color:#fff;padding:8px 12px;border-radius:20px;font-size:13px;outline:none;transition:border-color 0.2s}
          .chat-input-bar input:focus{border-color:rgba(255,255,255,0.2)}
          .chat-send-btn{background:${CONTINUE_COLOR};border:none;color:#fff;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;flex-shrink:0;transition:transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)}
          .chat-send-btn:active{transform:scale(0.92)}
          .chat-waiting{text-align:center;padding:20px;color:#888;font-size:13px}
          .room-closed-message,.room-full-message{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;padding:20px;gap:12px;text-align:center;color:#aaa;font-size:14px}
          .share-link-area{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;padding:20px;gap:12px}
          .share-link-area p{font-size:14px;color:#ccc;text-align:center}
          .copy-btn{background:${CONTINUE_COLOR};border:none;color:#fff;padding:10px 20px;border-radius:12px;font-weight:600;cursor:pointer;font-size:14px;display:flex;align-items:center;gap:8px;transition:transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);width:100%;justify-content:center}
          .copy-btn:active{transform:scale(0.97)}
          @media(min-width:768px){.ep-thumb{width:clamp(140px,18vw,170px);height:clamp(78px,10vw,95px)}}
          @media(max-height:600px){.player-frame{max-height:50vh}.player-box{gap:8px}.chat-container{height:160px;max-height:160px}}
          @media(max-width:400px){.glass-btn{padding:6px 12px;font-size:12px;gap:4px}}
        `}</style>
      </Head>

      {isLoading && <ContentLoader />}

      {showContent ? (
        <>
          <div className="hero">
            <ImageWithCache className="hero-bg" src={content.backdrop_path ? `https://image.tmdb.org/t/p/original${content.backdrop_path}` : DEFAULT_BACKDROP} alt="" />
            <div className="hero-gradient" />
            <div className="top-bar">
              <button
                className="glass-btn"
                style={{ width: '40px', height: '40px', borderRadius: '50%', padding: 0, justifyContent: 'center', fontSize: '18px' }}
                onClick={handleBack}
              >
                <i className="fas fa-arrow-left" />
              </button>
              <button
                className="glass-btn"
                style={{ width: '40px', height: '40px', borderRadius: '50%', padding: 0, justifyContent: 'center', fontSize: '18px' }}
                onClick={() => setDisableFriendMode(!disableFriendMode)}
                title={disableFriendMode ? 'Ativar modo amigos' : 'Desativar modo amigos'}
              >
                <i className={`fas ${disableFriendMode ? 'fa-user-slash' : 'fa-user-friends'}`} />
              </button>
            </div>
            <div className="hero-content">
              <button className="continue-btn" onClick={handleContinue}>
                <i className="fas fa-play" style={{fontSize:'10px'}} /> {type === 'tv' ? (watchedEps.size > 0 ? 'Continuar' : 'Assistir') : 'Assistir'}
              </button>
              <h1 className="hero-title">{content.title || content.name}</h1>
              <div className="hero-meta">
                <span className={`hero-badge ${ratingClass}`}>{ratingText}</span>
                {airingDay && (
                  <span className="hero-airing-badge">
                    <i className="fas fa-calendar-alt" /> {airingDay}
                  </span>
                )}
                <span className="hero-badge hero-year-badge">{new Date(releaseDate).getFullYear()}</span>
                <span className="hero-genres" title={genres}>{genres}</span>
              </div>
            </div>
          </div>
          <div className="social-bar">
            <button className={`social-item ${isLiked ? 'liked' : ''}`} onClick={toggleLike}><i className="fas fa-thumbs-up" /><span>{isLiked ? 'Curtiu' : 'Curtir'}</span></button>
            <button className={`social-item ${isFavorite ? 'favorited' : ''}`} onClick={toggleFavorite}><i className={isFavorite ? 'fas fa-heart' : 'far fa-heart'} /><span>{isFavorite ? 'Favoritado' : 'Favoritar'}</span></button>
            <button className={`social-item ${linkCopied ? 'copied' : ''}`} onClick={copyPageLink}>
              <i className={`fas ${linkCopied ? 'fa-check' : 'fa-share-alt'}`} />
              <span>{linkCopied ? 'Link copiado' : 'Compartilhar'}</span>
            </button>
          </div>
          <div className="synopsis">
            <p ref={synopsisRef} className={synopsisExpanded ? 'expanded' : ''}>{content.overview || 'Sinopse indisponível.'}</p>
            {synopsisOverflow && (
              <button className="synopsis-toggle" onClick={() => setSynopsisExpanded(!synopsisExpanded)}>
                {synopsisExpanded ? 'Ver menos' : 'Ver mais'} <i className={`fas fa-chevron-${synopsisExpanded ? 'up' : 'down'}`} />
              </button>
            )}
          </div>
          {!disableFriendMode && (
            <div style={{ padding: '0 clamp(16px,2.6vw,22px) 16px' }}>
              {isLoggedIn ? (
                <button className="room-btn" onClick={createRoomAndRedirect}>
                  <i className="fas fa-user-friends" /> Assistir com amigos
                </button>
              ) : (
                <button className="room-btn" disabled>
                  <i className="fas fa-lock" /> Faça login para criar salas
                </button>
              )}
            </div>
          )}
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
                        {ep.still_path ? <ImageWithCache src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} alt="" /> : (
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
                <div className="ep-thumb"><ImageWithCache src={content.poster_path ? `https://image.tmdb.org/t/p/w300${content.poster_path}` : DEFAULT_BACKDROP} alt="" /></div>
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
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 10 }}>
              <div className="player-controls">
                <div className="glass-btn" style={{ cursor: 'default', pointerEvents: 'none' }}>
                  {type === 'tv' ? `S${season}:E${episode}` : 'FILME'}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="glass-btn circle"
                    onClick={() => setDisableFriendMode(!disableFriendMode)}
                    title={disableFriendMode ? 'Ativar modo amigos' : 'Desativar modo amigos'}
                  >
                    <i className={`fas ${disableFriendMode ? 'fa-user-slash' : 'fa-user-friends'}`} />
                  </button>
                  <button className="glass-btn circle" onClick={() => setIsPlaying(false)}><i className="fas fa-times" /></button>
                </div>
              </div>
              <div className="player-frame">
                <iframe
                  key={`${season}-${episode}`}
                  src={getEmbedUrl()}
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  referrerPolicy="origin"
                />
              </div>
              {type === 'tv' && (
                <div className="nav-ep-btns">
                  <button
                    className="glass-btn"
                    onClick={() => {
                      if (episode > 1) {
                        const prevEp = episode - 1
                        setEpisode(prevEp)
                        markWatched(season, prevEp)
                      }
                    }}
                    disabled={episode === 1}
                  >
                    <i className="fas fa-backward" /> Anterior
                  </button>
                  <button
                    className="glass-btn"
                    onClick={() => {
                      if (seasonData && episode < seasonData.episodes.length) {
                        const nextEp = episode + 1
                        setEpisode(nextEp)
                        markWatched(season, nextEp)
                      }
                    }}
                    disabled={!seasonData || episode >= seasonData.episodes.length}
                  >
                    Próximo <i className="fas fa-forward" />
                  </button>
                </div>
              )}
            </div>

            {!disableFriendMode && (
              <div className="chat-sidebar">
                {roomId ? (
                  roomClosed ? (
                    <div className="chat-container">
                      <div className="chat-header">
                        <span><i className="fas fa-comments" /> Chat</span>
                      </div>
                      <div className="room-closed-message">
                        <i className="fas fa-door-closed" style={{ fontSize: 32, color: '#FF6B6B' }} />
                        <span>O chat foi encerrado e não está mais disponível.</span>
                      </div>
                    </div>
                  ) : roomLink && !showChat ? (
                    <div className="chat-container">
                      <div className="chat-header">
                        <span><i className="fas fa-share-alt" /> Compartilhar sala</span>
                        {isRoomCreator && (
                          <div className="chat-header-btns">
                            <button className="danger-btn" onClick={endRoom}>Encerrar</button>
                          </div>
                        )}
                      </div>
                      <div className="share-link-area">
                        <p>Envie o link para assistir junto:</p>
                        <button className="copy-btn" onClick={handleCopyRoomLink}>
                          {copiedRoomLink ? <><i className="fas fa-check" /> Copiado</> : <><i className="fas fa-copy" /> Copiar link</>}
                        </button>
                      </div>
                    </div>
                  ) : showChat ? (
                    <div className="chat-container">
                      <div className="chat-header">
                        <span><i className="fas fa-comments" /> Chat</span>
                        <div className="chat-header-btns">
                          {isRoomCreator && (
                            <button className="danger-btn" onClick={endRoom}>Encerrar</button>
                          )}
                          <button onClick={leaveRoom}>Sair</button>
                        </div>
                      </div>
                      <div className="chat-messages">
                        {messages.length === 0 && roomWaiting && <div className="chat-waiting">Aguardando alguém entrar...</div>}
                        {messages.map(msg => (
                          msg.is_system ? (
                            <div key={msg.id} className="chat-msg system">
                              <span>{msg.content}</span>
                            </div>
                          ) : (
                            <div key={msg.id} className="chat-msg">
                              <img className="chat-msg-avatar" src={msg.user_avatar || getAvatarUrl(msg.user_name)} alt="" />
                              <div className="chat-msg-bubble">
                                <div className="chat-msg-name">{msg.user_name}</div>
                                <div className="chat-msg-text">{msg.content}</div>
                              </div>
                            </div>
                          )
                        ))}
                        <div ref={chatEndRef} />
                      </div>
                      {!roomClosed && (
                        <div className="chat-input-bar">
                          {!isNameSet ? (
                            <>
                              <input
                                type="text"
                                placeholder="Seu nome para o chat"
                                value={chatDisplayName}
                                onChange={(e) => setChatDisplayName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') confirmName() }}
                                maxLength={20}
                              />
                              <button
                                className="chat-send-btn"
                                onClick={confirmName}
                                disabled={!chatDisplayName.trim()}
                              >
                                <i className="fas fa-check" />
                              </button>
                            </>
                          ) : (
                            <>
                              <input
                                type="text"
                                placeholder="Digite sua mensagem..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') sendMessage() }}
                                maxLength={MAX_MESSAGE_LENGTH}
                              />
                              <button className="chat-send-btn" onClick={sendMessage}><i className="fas fa-paper-plane" /></button>
                            </>
                          )}
                        </div>
                      )}
                      {roomClosed && (
                        <div className="chat-input-bar" style={{ opacity: 0.5, pointerEvents: 'none' }}>
                          <input type="text" placeholder="Chat encerrado" disabled />
                          <button className="chat-send-btn" disabled><i className="fas fa-lock" /></button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button className="room-btn" onClick={() => setShowChat(true)}>
                      <i className="fas fa-comments" /> Abrir chat
                    </button>
                  )
                ) : roomInvalid ? (
                  <div className="chat-container">
                    <div className="chat-header">
                      <span><i className="fas fa-comments" /> Chat</span>
                    </div>
                    <div className="room-closed-message">
                      <i className="fas fa-link-slash" style={{ fontSize: 32, color: '#FF6B6B' }} />
                      <span>Este link é inválido ou o chat foi encerrado.</span>
                    </div>
                  </div>
                ) : roomFull ? (
                  <div className="chat-container">
                    <div className="chat-header">
                      <span><i className="fas fa-comments" /> Chat</span>
                    </div>
                    <div className="room-full-message">
                      <i className="fas fa-users-slash" style={{ fontSize: 32, color: '#FF6B6B' }} />
                      <span>Chat cheio (máximo {MAX_ROOM_USERS} pessoas).</span>
                    </div>
                  </div>
                ) : isLoggedIn ? (
                  <button
                    className="room-btn"
                    onClick={createRoomAndRedirect}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <i className="fas fa-user-friends" /> Assistir com amigos
                  </button>
                ) : (
                  <button
                    className="room-btn"
                    disabled
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <i className="fas fa-lock" /> Faça login para criar salas
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
