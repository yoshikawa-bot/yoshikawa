import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
const DEFAULT_POSTER = 'https://yoshikawa-bot.github.io/cache/images/5b509b8f.webp'
const LOGO_URL = 'https://yoshikawa-bot.github.io/cache/images/06486359.png'

const PROFILE_COLORS = ['#E04E4E', '#4D4BAF', '#4A8B4A', '#E97820', '#9D95C8', '#3F6D89', '#C43708', '#43A45D', '#E38CA8', '#72615F']

const CATEGORIES = [
  { name: 'Aventura', color: '#7FA8D8', image: 'https://image.tmdb.org/t/p/w500/8Y43POKjjKDGI9MH89NW0NAzzp8.jpg' },
  { name: 'Ação', color: '#3F6D89', image: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911B6EMThXE6Hj.jpg' },
  { name: 'Comédia', color: '#C43708', image: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg' },
  { name: 'Dublado', color: '#43A45D', image: 'https://image.tmdb.org/t/p/w500/5M0jZmpQBGk5Yh7K3KwG7Gn6o.jpg' },
  { name: 'Drama', color: '#2C3F59', image: 'https://image.tmdb.org/t/p/w500/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg' },
  { name: 'Escolar', color: '#72615F', image: 'https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWm.jpg' },
  { name: 'Fantasia', color: '#E97820', image: 'https://image.tmdb.org/t/p/w500/i6dR2b2sh6MXs4fhHkKpMXrdu.jpg' },
  { name: 'Romance', color: '#A8A8B6', image: 'https://image.tmdb.org/t/p/w500/3TnH1j7bACu3mLSHrP5NHSMpIb.jpg' },
  { name: 'Slice of Life', color: '#E38CA8', image: 'https://image.tmdb.org/t/p/w500/4j0PNHkMr5ax3IA8tjtxcmPU3QT.jpg' },
  { name: 'Sobrenatural', color: '#9D95C8', image: 'https://image.tmdb.org/t/p/w500/5gzz1vKhGmX3gN9w7GmYLfNwOM.jpg' }
]

const FAVORITE_FILTERS = ['Tudo', 'Filmes', 'Séries']
const SEARCH_FILTERS = ['Tudo', 'Animes', 'Filmes', 'Séries']

const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null)
  return useCallback((...args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => callback(...args), delay)
  }, [callback, delay])
}

const getMediaType = (item) => {
  if (!item) return 'movie'
  if (item.media_type) return item.media_type
  const hasAnimeGenre = item.genre_ids?.includes(16)
  const isJapanese = item.original_language === 'ja'
  if (hasAnimeGenre && isJapanese) return 'anime'
  return 'movie'
}

const getItemYear = (item) => {
  if (!item) return null
  return new Date(item.release_date || item.first_air_date).getFullYear() || null
}

const getAvatarUrl = (name, color) => {
  const bg = color?.replace('#', '') || '4D4BAF'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&size=120&bold=true&format=svg`
}

const POSTER_SIZE = 'w780'

export const LoadingScreen = ({ onComplete }) => {
  const [closing, setClosing] = useState(false)
  const [mounted, setMounted] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setClosing(true), 2000)
    return () => clearTimeout(timer)
  }, [])
  useEffect(() => {
    if (closing) {
      const t = setTimeout(() => { setMounted(false); onComplete() }, 800)
      return () => clearTimeout(t)
    }
  }, [closing, onComplete])
  if (!mounted) return null
  return (
    <div className={`loading-overlay ${closing ? 'closing' : ''}`}>
      <div className="loading-content">
        <img src={LOGO_URL} alt="Yoshikawa" className="loading-logo" />
        <div className="loading-spinner" />
      </div>
    </div>
  )
}

export const ContentLoader = () => (
  <div className="content-loader">
    <div className="loading-spinner" />
  </div>
)

export const Header = ({ onSearchClick, userProfile, onProfileClick }) => {
  const avatarSize = 'clamp(40px,6vw,60px)'
  return (
    <header className="header">
      <img src={LOGO_URL} alt="Yoshikawa" className="header-logo" style={{ width: avatarSize, height: avatarSize }} />
      <div className="header-actions">
        <button className="header-btn" onClick={onSearchClick}><i className="fas fa-search" /></button>
        <button
          className="header-btn profile-btn"
          style={userProfile ? { background: userProfile.color } : { background: '#E04E4E' }}
          onClick={onProfileClick}
        >
          {userProfile ? (
            <img src={getAvatarUrl(userProfile.name, userProfile.color)} alt={userProfile.name} className="profile-avatar-img" />
          ) : (
            <i className="fas fa-user" />
          )}
        </button>
      </div>
    </header>
  )
}

export const BottomNav = ({ activeSection, setActiveSection }) => (
  <nav className="bottom-nav">
    <button className={`nav-item ${activeSection === 'home' ? 'active' : ''}`} onClick={() => setActiveSection('home')}><i className="fas fa-home" /><span>Início</span></button>
    <button className={`nav-item ${activeSection === 'animes' ? 'active' : ''}`} onClick={() => setActiveSection('animes')}><i className="fas fa-play" /><span>Animes</span></button>
    <button className={`nav-item ${activeSection === 'favorites' ? 'active' : ''}`} onClick={() => setActiveSection('favorites')}><i className="fas fa-heart" /><span>Favoritos</span></button>
    <button className={`nav-item ${activeSection === 'menu' ? 'active' : ''}`} onClick={() => setActiveSection('menu')}><i className="fas fa-bars" /><span>Menu</span></button>
  </nav>
)

export const HorizontalCard = ({ item, onPlay }) => {
  const year = getItemYear(item)
  return (
    <div className="horizontal-card" onClick={() => onPlay?.(item)}>
      <img src={item.poster_path ? `https://image.tmdb.org/t/p/${POSTER_SIZE}${item.poster_path}` : DEFAULT_POSTER} alt={item.title || item.name} className="horizontal-card-img" />
      <div className="horizontal-card-info">
        <h3 className="horizontal-card-title">{item.title || item.name}</h3>
        <p className="horizontal-card-subtitle">{item.media_type === 'tv' ? 'Série' : 'Filme'}{year ? ` • ${year}` : ''}</p>
      </div>
    </div>
  )
}

export const EpisodeCard = ({ item, onPlay }) => {
  const year = getItemYear(item)
  return (
    <div className="episode-card" onClick={() => onPlay?.(item)}>
      <div className="episode-thumbnail">
        <img src={item.poster_path ? `https://image.tmdb.org/t/p/${POSTER_SIZE}${item.poster_path}` : DEFAULT_POSTER} alt={item.name || item.title} className="episode-img" />
      </div>
      <h4 className="episode-title">{item.name || item.title}</h4>
      <p className="episode-info">Em exibição • {year || 'N/A'}</p>
    </div>
  )
}

export const FeaturedCard = ({ item, onPlay, onInfo }) => {
  const year = getItemYear(item)
  const ratingClass = item.adult ? 'rating-18' : 'rating-L'
  return (
    <div className="featured-card">
      <div className="featured-poster">
        <img src={item.poster_path ? `https://image.tmdb.org/t/p/${POSTER_SIZE}${item.poster_path}` : DEFAULT_POSTER} alt={item.title || item.name} className="featured-img" />
      </div>
      <div className="featured-details">
        <div className="featured-text">
          <h2 className="featured-title">{item.title || item.name}</h2>
          <div className="featured-meta">
            <span className={`featured-rating ${ratingClass}`}>{item.adult ? '18+' : 'L'}</span>
            <span className="featured-genre">{item.genre || 'Ação'}</span>
            {year && <span className="featured-year">{year}</span>}
          </div>
          <p className="featured-synopsis">{item.overview || 'Sinopse não disponível.'}</p>
        </div>
        <div className="featured-actions">
          <button className="featured-btn play-btn" onClick={() => onPlay?.(item)}><i className="fas fa-play" /></button>
          <button className="featured-btn info-btn" onClick={() => onInfo?.(item)}><i className="fas fa-info" /></button>
        </div>
      </div>
    </div>
  )
}

export const MovieCard = ({ item }) => {
  const router = useRouter()
  return (
    <div className="card-wrapper" onClick={() => router.push(`/${item.media_type}/${item.id}`)}>
      <div className="card-poster-frame">
        <img
          src={item.poster_path ? `https://image.tmdb.org/t/p/${POSTER_SIZE}${item.poster_path}` : DEFAULT_POSTER}
          alt={item.title || item.name}
          className="content-poster"
          loading="lazy"
        />
      </div>
    </div>
  )
}

export const FavoriteItem = ({ item, onRemove, onClick }) => {
  const mediaType = item.media_type || 'movie'
  const year = getItemYear(item)
  return (
    <div className="favorite-item" onClick={() => onClick?.(item)}>
      <img src={item.poster_path ? `https://image.tmdb.org/t/p/${POSTER_SIZE}${item.poster_path}` : DEFAULT_POSTER} alt={item.title} className="favorite-poster" />
      <div className="favorite-content">
        <h3 className="favorite-title">{item.title}</h3>
        {year && <p className="favorite-year">{year}</p>}
        <p className="favorite-episodes">{item.episodes || '12 Episódios'}</p>
        <div className="favorite-badge" style={{ background: mediaType === 'anime' ? '#4D4BAF' : mediaType === 'tv' ? '#4A8B4A' : '#8B4A4A' }}>
          {mediaType === 'anime' ? 'Anime' : mediaType === 'tv' ? 'Série' : 'Filme'}
        </div>
      </div>
      <button className="favorite-remove" onClick={(e) => { e.stopPropagation(); onRemove?.(item) }}>
        <i className="fas fa-times" />
      </button>
    </div>
  )
}

export const SearchResultItem = ({ item, onClick }) => {
  const mediaType = getMediaType(item)
  const year = getItemYear(item)
  return (
    <div className="search-result-item" onClick={() => onClick?.(item)}>
      <img src={item.poster_path ? `https://image.tmdb.org/t/p/${POSTER_SIZE}${item.poster_path}` : DEFAULT_POSTER} alt={item.title || item.name} className="search-result-poster" />
      <div className="search-result-content">
        <h3 className="search-result-title">{item.title || item.name}</h3>
        {year && <p className="search-result-year">{year}</p>}
        <p className="search-result-episodes">{item.popularity ? `${Math.round(item.popularity)} Popularidade` : '12 Episódios'}</p>
        <div className="search-result-badge" style={{ background: mediaType === 'anime' ? '#4D4BAF' : mediaType === 'tv' ? '#4A8B4A' : '#8B4A4A' }}>
          {mediaType === 'anime' ? 'Anime' : mediaType === 'tv' ? 'Série' : 'Filme'}
        </div>
      </div>
    </div>
  )
}

export const CategoryCard = ({ category }) => (
  <div className="category-card" style={{ background: category.color }}>
    <h3 className="category-title">{category.name}</h3>
    <img src={category.image || DEFAULT_POSTER} className="category-thumbnail" alt={category.name} onError={e => { e.target.src = DEFAULT_POSTER }} />
  </div>
)

export const SettingsItem = ({ icon, title, description, onClick }) => (
  <div className="settings-item" onClick={onClick}>
    <div className="settings-icon"><i className={`fas fa-${icon}`} /></div>
    <div className="settings-content"><h4 className="settings-title">{title}</h4><p className="settings-desc">{description}</p></div>
  </div>
)

export const LogoutConfirm = ({ onConfirm, onCancel }) => (
  <div className="profile-creation-overlay" onClick={onCancel}>
    <div className="logout-confirm-modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h3 className="logout-confirm-title">Sair do perfil</h3>
        <button className="modal-close-btn" onClick={onCancel}><i className="fas fa-times" /></button>
      </div>
      <p className="logout-confirm-text">Ao sair, todos os seus favoritos serão perdidos permanentemente. Deseja continuar?</p>
      <div className="logout-confirm-actions">
        <button className="logout-cancel-btn" onClick={onCancel}>Cancelar</button>
        <button className="logout-confirm-btn" onClick={onConfirm}>Sair e limpar dados</button>
      </div>
    </div>
  </div>
)

export const ProfileCreation = ({ onCreate, onClose }) => {
  const [name, setName] = useState('')
  const [selectedColor, setSelectedColor] = useState(PROFILE_COLORS[0])
  const [error, setError] = useState('')
  const handleSubmit = () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed.length < 2) { setError('Nome deve ter pelo menos 2 caracteres'); return }
    if (trimmed.length > 20) { setError('Nome deve ter no máximo 20 caracteres'); return }
    onCreate({ name: trimmed, color: selectedColor })
  }
  return (
    <div className="profile-creation-overlay">
      <div className="profile-creation-card">
        <div className="modal-header">
          <h2 className="profile-creation-title">Criar Perfil</h2>
          <button className="modal-close-btn" onClick={onClose}><i className="fas fa-times" /></button>
        </div>
        <p className="profile-creation-subtitle">Escolha seu nome e cor para continuar</p>
        <div className="profile-avatar-preview" style={{ background: selectedColor }}>
          {name.trim() ? <img src={getAvatarUrl(name.trim(), selectedColor)} alt="" className="profile-avatar-img" /> : <i className="fas fa-user" />}
        </div>
        <input type="text" placeholder="Seu nome" className="profile-name-input" value={name} onChange={e => { setName(e.target.value); setError('') }} maxLength={20} autoFocus />
        {error && <p className="profile-error">{error}</p>}
        <div className="profile-colors">
          {PROFILE_COLORS.map(color => (
            <button key={color} className={`profile-color-btn ${selectedColor === color ? 'selected' : ''}`} style={{ background: color }} onClick={() => setSelectedColor(color)} />
          ))}
        </div>
        <p className="profile-terms">Etapa necessária. Ao criar o perfil, você concorda com os <strong>Termos de Uso</strong>.</p>
        <button className="profile-create-btn" onClick={handleSubmit}>Entrar</button>
      </div>
    </div>
  )
}

export const ProfileView = ({ userProfile, onLogout, onClose }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  return (
    <div className="profile-creation-overlay" onClick={onClose}>
      <div className="profile-view-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="profile-view-name">{userProfile.name}</h2>
          <button className="modal-close-btn" onClick={onClose}><i className="fas fa-times" /></button>
        </div>
        <div className="profile-view-avatar" style={{ background: userProfile.color, margin: '0 auto 24px' }}>
          <img src={getAvatarUrl(userProfile.name, userProfile.color)} alt={userProfile.name} className="profile-avatar-img" />
        </div>
        <div className="profile-view-stats">
          <div className="profile-stat">
            <span className="profile-stat-value">{userProfile.favoritesCount || 0}</span>
            <span className="profile-stat-label">Favoritos</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-value">{userProfile.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Hoje'}</span>
            <span className="profile-stat-label">Membro desde</span>
          </div>
        </div>
        <button className="profile-logout-btn" onClick={() => setShowLogoutConfirm(true)}>
          <i className="fas fa-sign-out-alt" /> Sair da conta
        </button>
      </div>
      {showLogoutConfirm && <LogoutConfirm onConfirm={onLogout} onCancel={() => setShowLogoutConfirm(false)} />}
    </div>
  )
}

export const AboutModal = ({ onClose }) => (
  <div className="profile-creation-overlay" onClick={onClose}>
    <div className="about-modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h2 className="about-title">Yoshikawa Player</h2>
        <button className="modal-close-btn" onClick={onClose}><i className="fas fa-times" /></button>
      </div>
      <div className="about-content">
        <p><strong>Créditos</strong></p>
        <p>Desenvolvido por <strong>@kawalyansky</strong></p>
        <p>Design e implementação por Yoshikawa Systems</p>
        <p><strong>Direitos Autorais</strong></p>
        <p>© {new Date().getFullYear()} Yoshikawa Systems. Todos os direitos reservados.</p>
        <p><strong>Isenção de Responsabilidade</strong></p>
        <p>Este site não hospeda nenhum conteúdo. Utiliza APIs públicas de terceiros (TMDB) para indexação de informações. Qualquer violação de direitos autorais deve ser reportada diretamente aos provedores de conteúdo.</p>
        <p><strong>Versão:</strong> 1.4.3.R1.0</p>
      </div>
    </div>
  </div>
)

export default function Home() {
  const [welcomed, setWelcomed] = useState(false)
  const [loadingComplete, setLoadingComplete] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [showProfileCreation, setShowProfileCreation] = useState(false)
  const [showProfileView, setShowProfileView] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [contentLoading, setContentLoading] = useState(true)
  const [trending, setTrending] = useState([])
  const [newEpisodes, setNewEpisodes] = useState([])
  const [recentlyAdded, setRecentlyAdded] = useState([])
  const [featured, setFeatured] = useState(null)
  const [adventure, setAdventure] = useState([])
  const [comedy, setComedy] = useState([])
  const [romance, setRomance] = useState([])
  const [recommended, setRecommended] = useState([])
  const [animes, setAnimes] = useState([])
  const [favorites, setFavorites] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [activeSection, setActiveSection] = useState('home')
  const [activeFilter, setActiveFilter] = useState('Tudo')
  const [activeSearchFilter, setActiveSearchFilter] = useState('Tudo')
  const [showSearch, setShowSearch] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    try { const seen = sessionStorage.getItem('yoshikawaWelcomed'); if (seen) { setWelcomed(true); setLoadingComplete(true) } else { setWelcomed(false) } } catch { setWelcomed(false) }
    try { const saved = localStorage.getItem('yoshikawaProfile'); if (saved) { const p = JSON.parse(saved); p.favoritesCount = JSON.parse(localStorage.getItem('yoshikawaFavorites') || '[]').length; setUserProfile(p) } } catch {}
  }, [])

  const handleLoadingComplete = () => {
    try { sessionStorage.setItem('yoshikawaWelcomed', '1') } catch {}
    setWelcomed(true)
    setLoadingComplete(true)
  }

  useEffect(() => {
    if (loadingComplete) loadAllContent()
  }, [loadingComplete])

  const loadAllContent = async () => {
    setContentLoading(true)
    try {
      const [
        trendingMovies, nowPlaying, onAir, upcoming, popular,
        adventureShows, comedyShows, romanceShows, topRated,
        animeMovies, animeTV
      ] = await Promise.all([
        fetchTMDB(`https://api.themoviedb.org/3/trending/all/week?api_key=${TMDB_API_KEY}&language=pt-BR&region=BR`),
        fetchTMDBPages(`https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&language=pt-BR&region=BR`),
        fetchTMDBPages(`https://api.themoviedb.org/3/tv/on_the_air?api_key=${TMDB_API_KEY}&language=pt-BR&region=BR`),
        fetchTMDB(`https://api.themoviedb.org/3/movie/upcoming?api_key=${TMDB_API_KEY}&language=pt-BR&region=BR`),
        fetchTMDBPages(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=pt-BR&region=BR`),
        fetchTMDB(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=12&region=BR`),
        fetchTMDB(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=35&region=BR`),
        fetchTMDB(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=10749&region=BR`),
        fetchTMDB(`https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_API_KEY}&language=pt-BR&region=BR`),
        fetchTMDB(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=16&with_original_language=ja&region=BR`),
        fetchTMDB(`https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=16&with_original_language=ja&region=BR`)
      ])

      const filterQuality = (items) => items.filter(i => i.poster_path && i.vote_count > 50 && i.popularity > 10)
      setTrending(filterQuality(trendingMovies).slice(0, 10))

      const seriesOnAir = onAir
        .filter(i => i.poster_path)
        .map(i => ({ ...i, media_type: 'tv' }))
        .sort((a, b) => new Date(b.first_air_date || b.release_date) - new Date(a.first_air_date || a.release_date))
        .slice(0, 10)
      setNewEpisodes(seriesOnAir)

      setRecentlyAdded(nowPlaying.filter(i => i.poster_path).slice(0, 10))
      setFeatured(filterQuality(trendingMovies)[0] || null)
      setAdventure(adventureShows.filter(i => i.poster_path).slice(0, 10))
      setComedy(comedyShows.filter(i => i.poster_path).slice(0, 10))
      setRomance(romanceShows.filter(i => i.poster_path).slice(0, 10))
      setRecommended(topRated.filter(i => i.poster_path).slice(0, 10))

      const combinedAnimes = [
        ...animeMovies.map(i => ({ ...i, media_type: 'movie' })),
        ...animeTV.map(i => ({ ...i, media_type: 'tv' }))
      ].filter(i => i.poster_path).sort((a, b) => b.popularity - a.popularity).slice(0, 20)
      setAnimes(combinedAnimes)

      loadFavorites()
    } catch (e) { console.error(e) }
    setContentLoading(false)
  }

  const fetchTMDB = async (url) => {
    try { const r = await fetch(url); if (!r.ok) throw new Error(); const d = await r.json(); return d.results || [] } catch { return [] }
  }

  const fetchTMDBPages = async (endpoint) => {
    try { const [r1, r2] = await Promise.all([fetchTMDB(`${endpoint}&page=1`), fetchTMDB(`${endpoint}&page=2`)]); return [...r1, ...r2] } catch { return [] }
  }

  const loadFavorites = () => {
    try { const s = localStorage.getItem('yoshikawaFavorites'); setFavorites(s ? JSON.parse(s) : []) } catch { setFavorites([]) }
  }

  const handlePlay = (item) => window.location.href = `/${item.media_type || getMediaType(item)}/${item.id}`
  const handleInfo = (item) => window.location.href = `/${item.media_type || getMediaType(item)}/${item.id}`

  const handleLogout = () => {
    setUserProfile(null)
    setFavorites([])
    try { localStorage.removeItem('yoshikawaProfile'); localStorage.removeItem('yoshikawaFavorites') } catch {}
    setShowProfileView(false)
  }

  const handleCreateProfile = (profile) => {
    const newProfile = { ...profile, createdAt: new Date().toISOString(), favoritesCount: 0 }
    setUserProfile(newProfile)
    try { localStorage.setItem('yoshikawaProfile', JSON.stringify(newProfile)) } catch {}
    setShowProfileCreation(false)
  }

  const handleProfileClick = () => {
    if (userProfile) setShowProfileView(true)
    else setShowProfileCreation(true)
  }

  const fetchSearchResults = async (query) => {
    if (!query.trim()) { setSearchResults([]); setSearchLoading(false); return }
    setSearchLoading(true)
    try {
      let results = []
      if (activeSearchFilter === 'Filmes') {
        results = await fetchTMDB(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`)
        results = results.map(i => ({ ...i, media_type: 'movie' }))
      } else if (activeSearchFilter === 'Séries') {
        results = await fetchTMDB(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`)
        results = results.map(i => ({ ...i, media_type: 'tv' }))
      } else {
        const [movies, tv] = await Promise.all([
          fetchTMDB(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`),
          fetchTMDB(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`)
        ])
        results = [...movies.map(i => ({ ...i, media_type: 'movie' })), ...tv.map(i => ({ ...i, media_type: 'tv' }))]
      }
      if (activeSearchFilter === 'Animes') results = results.filter(i => i.genre_ids?.includes(16))
      results = results.filter(i => i.poster_path).sort((a, b) => b.popularity - a.popularity).slice(0, 30)
      setSearchResults(results)
    } catch { setSearchResults([]) }
    finally { setSearchLoading(false) }
  }

  const debouncedSearch = useDebounce(fetchSearchResults, 300)

  const handleSearchChange = (q) => {
    setSearchQuery(q)
    if (!q.trim()) { setSearchResults([]); setSearchLoading(false); return }
    setSearchLoading(true)
    debouncedSearch(q)
  }

  useEffect(() => { if (searchQuery.trim()) fetchSearchResults(searchQuery) }, [activeSearchFilter])

  const filteredFavorites = activeFilter === 'Tudo' ? favorites
    : activeFilter === 'Filmes' ? favorites.filter(f => f.media_type === 'movie')
    : activeFilter === 'Séries' ? favorites.filter(f => f.media_type === 'tv')
    : favorites

  const renderHomePage = () => {
    if (contentLoading) return <ContentLoader />
    return (
      <>
        <section className="section"><h2 className="section-title">Em alta</h2><div className="horizontal-scroll">{trending.map(item => <HorizontalCard key={`${item.media_type}-${item.id}`} item={item} onPlay={handlePlay} />)}</div></section>
        <section className="section"><h2 className="section-title">Novos episódios</h2><div className="horizontal-scroll">{newEpisodes.map(item => <EpisodeCard key={`${item.media_type}-${item.id}`} item={item} onPlay={handlePlay} />)}</div></section>
        <section className="section"><h2 className="section-title">Recém adicionados</h2><div className="vertical-scroll">{recentlyAdded.map(item => <MovieCard key={`${item.media_type}-${item.id}`} item={item} />)}</div></section>
        <section className="section"><h2 className="section-title">Lançamento</h2>{featured && <FeaturedCard item={featured} onPlay={handlePlay} onInfo={handleInfo} />}</section>
        <section className="section"><h2 className="section-title">Aventura</h2><div className="vertical-scroll">{adventure.map(item => <MovieCard key={`${item.media_type}-${item.id}`} item={item} />)}</div></section>
        <section className="section"><h2 className="section-title">Comédia</h2><div className="vertical-scroll">{comedy.map(item => <MovieCard key={`${item.media_type}-${item.id}`} item={item} />)}</div></section>
        <section className="section"><h2 className="section-title">Romance</h2><div className="vertical-scroll">{romance.map(item => <MovieCard key={`${item.media_type}-${item.id}`} item={item} />)}</div></section>
        <section className="section"><h2 className="section-title">Talvez você goste</h2><div className="vertical-scroll">{recommended.map(item => <MovieCard key={`${item.media_type}-${item.id}`} item={item} />)}</div></section>
      </>
    )
  }

  const renderAnimesPage = () => {
    if (contentLoading) return <ContentLoader />
    return (
      <>
        <section className="section"><h2 className="section-title">Animes em destaque</h2><div className="horizontal-scroll">{animes.slice(0, 5).map(item => <HorizontalCard key={`${item.media_type}-${item.id}`} item={item} onPlay={handlePlay} />)}</div></section>
        <section className="section"><h2 className="section-title">Todos os Animes</h2><div className="vertical-scroll">{animes.map(item => <MovieCard key={`${item.media_type}-${item.id}`} item={item} />)}</div></section>
        <section className="section"><h2 className="section-title">Animes populares</h2><div className="horizontal-scroll">{animes.slice(5, 10).map(item => <EpisodeCard key={`${item.media_type}-${item.id}`} item={item} onPlay={handlePlay} />)}</div></section>
        <section className="section"><h2 className="section-title">Recomendados para você</h2><div className="vertical-scroll">{animes.slice(10, 20).map(item => <MovieCard key={`${item.media_type}-${item.id}`} item={item} />)}</div></section>
      </>
    )
  }

  const renderFavoritesPage = () => (
    <section className="section">
      <h2 className="section-title" style={{ fontSize: 'clamp(24px,5vw,34px)', fontWeight: '800' }}>Favoritos</h2>
      <div className="filters-container">{FAVORITE_FILTERS.map(filter => <button key={filter} className={`filter-btn ${activeFilter === filter ? 'active' : ''}`} onClick={() => setActiveFilter(filter)}>{filter}</button>)}</div>
      <div className="favorites-list">
        {filteredFavorites.length === 0 ? (
          <div className="empty-favorites"><i className="far fa-heart" style={{ fontSize: 'clamp(32px,5vw,48px)', color: '#333', marginBottom: 'clamp(12px,2vw,16px)' }} /><p style={{ color: '#666', fontSize: 'clamp(14px,2.5vw,18px)' }}>Nenhum favorito encontrado</p></div>
        ) : filteredFavorites.map(item => <FavoriteItem key={`${item.media_type}-${item.id}`} item={item} onRemove={(fav) => {
          setFavorites(prev => {
            const updated = prev.filter(f => !(f.id === fav.id && f.media_type === fav.media_type))
            try { localStorage.setItem('yoshikawaFavorites', JSON.stringify(updated)) } catch {}
            return updated
          })
        }} onClick={handlePlay} />)}
      </div>
    </section>
  )

  const renderSearchPage = () => (
    <>
      <div className="search-container">
        <button className="search-back-btn" onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); setActiveSearchFilter('Tudo') }}><i className="fas fa-arrow-left" /></button>
        <div className="search-bar">
          <i className="fas fa-search search-icon" />
          <input type="text" placeholder="O que está procurando?" className="search-input" value={searchQuery} onChange={e => handleSearchChange(e.target.value)} autoFocus />
        </div>
      </div>
      {searchQuery.trim() ? (
        <>
          <div className="filters-container" style={{ marginTop: 'clamp(20px,3vw,26px)', marginLeft: 'clamp(20px,4vw,34px)' }}>
            {SEARCH_FILTERS.map(filter => <button key={filter} className={`filter-btn ${activeSearchFilter === filter ? 'active' : ''}`} onClick={() => setActiveSearchFilter(filter)}>{filter}</button>)}
          </div>
          <div className="search-results-list">
            {searchLoading ? <ContentLoader /> :
              searchResults.length > 0 ? searchResults.map((item, index) => <div key={`${item.media_type}-${item.id}`}><SearchResultItem item={item} onClick={handlePlay} />{index < searchResults.length - 1 && <div className="search-divider" />}</div>) :
                <div className="empty-favorites"><i className="fas fa-search" style={{ fontSize: 'clamp(32px,5vw,48px)', color: '#333', marginBottom: 'clamp(12px,2vw,16px)' }} /><p style={{ color: '#666', fontSize: 'clamp(14px,2.5vw,18px)' }}>Nenhum resultado encontrado</p></div>}
          </div>
        </>
      ) : (
        <>
          <div className="filters-container" style={{ marginTop: 'clamp(20px,3vw,30px)' }}>{FAVORITE_FILTERS.map(filter => <button key={filter} className={`filter-btn ${activeFilter === filter ? 'active' : ''}`} onClick={() => setActiveFilter(filter)}>{filter}</button>)}</div>
          <section className="section"><h2 className="section-title" style={{ fontSize: 'clamp(24px,5vw,38px)', fontWeight: '800' }}>Categorias</h2><div className="categories-grid">{CATEGORIES.map((category, index) => <CategoryCard key={index} category={category} />)}</div></section>
        </>
      )}
    </>
  )

  const renderMenuPage = () => (
    <section className="section" style={{ paddingTop: 'clamp(40px,8vw,80px)' }}>
      {!userProfile && (
        <div className="menu-banner-container">
          <div className="verify-banner" onClick={() => setShowProfileCreation(true)} style={{ cursor: 'pointer' }}>
            <span>Crie seu perfil para salvar favoritos e personalizar sua experiência!</span>
            <i className="fas fa-chevron-right" />
          </div>
        </div>
      )}
      <div className="user-card" onClick={() => !userProfile ? setShowProfileCreation(true) : setShowProfileView(true)}>
        <div className="user-avatar" style={userProfile ? { background: userProfile.color } : { background: '#E04E4E' }}>
          {userProfile ? <img src={getAvatarUrl(userProfile.name, userProfile.color)} alt={userProfile.name} className="profile-avatar-img" /> : <i className="fas fa-user" style={{ fontSize: 'clamp(28px,4vw,40px)', color: '#fff' }} />}
        </div>
        <div className="user-info"><h3 className="user-name">{userProfile ? userProfile.name : '@user'}</h3>{!userProfile && <p className="user-email">Criar perfil</p>}</div>
        {userProfile && <button className="logout-btn" onClick={(e) => { e.stopPropagation(); setShowProfileView(true) }}><i className="fas fa-sign-out-alt" /></button>}
      </div>
      <div className="settings-card">
        <SettingsItem icon="user-edit" title={userProfile ? 'Editar Perfil' : 'Criar Perfil'} description={userProfile ? 'Alterar nome e cor' : 'Personalize sua experiência'} onClick={() => setShowProfileCreation(true)} />
        <SettingsItem icon="cog" title="Configurações" description="Ajustes do aplicativo" />
        <SettingsItem icon="shield-alt" title="Privacidade" description="Gerenciar dados" />
        <SettingsItem icon="question-circle" title="Ajuda" description="Central de suporte" />
        <SettingsItem icon="info-circle" title="Sobre" description="Versão do app" onClick={() => setShowAbout(true)} />
      </div>
      <div className="social-links">
        <button className="social-btn"><i className="fas fa-link" /></button>
        <button className="social-btn"><i className="fab fa-tiktok" /></button>
        <button className="social-btn"><i className="fab fa-twitter" /></button>
      </div>
      <div className="version-info"><p>RELEASE BUILD - 1.4.3.R1.0</p></div>
    </section>
  )

  return (
    <>
      <Head>
        <title>Yoshikawa Player</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style>{`
          *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
          html{scroll-behavior:smooth}
          body{font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;background:#101010;color:#f5f5f7;line-height:1.6;font-size:16px;min-height:100vh;overflow-y:auto;overflow-x:hidden}
          a{color:inherit;text-decoration:none}
          button{font-family:inherit;border:none;outline:none;background:none;cursor:pointer;user-select:none}
          img{max-width:100%;height:auto;display:block}

          .loading-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:#101010;transition:opacity 0.8s ease}
          .loading-overlay.closing{opacity:0;pointer-events:none}
          .loading-content{display:flex;flex-direction:column;align-items:center;gap:clamp(24px,4vw,32px)}
          .loading-logo{width:clamp(120px,20vw,180px);height:clamp(120px,20vw,180px);object-fit:contain}
          .loading-spinner{width:clamp(32px,5vw,40px);height:clamp(32px,5vw,40px);border:3px solid rgba(255,255,255,0.1);border-top-color:#ffffff;border-radius:50%;animation:spin 0.8s linear infinite}
          .content-loader{display:flex;align-items:center;justify-content:center;padding:clamp(60px,10vw,100px) 0}
          @keyframes spin{to{transform:rotate(360deg)}}

          .header{position:fixed;top:0;left:0;right:0;z-index:1000;background:#101010;padding:clamp(12px,2vw,24px) clamp(16px,3vw,32px);display:flex;justify-content:space-between;align-items:center;height:clamp(60px,8vw,90px)}
          .header-logo{object-fit:contain}
          .header-actions{display:flex;align-items:center;gap:clamp(16px,3vw,28px)}
          .header-btn{width:clamp(28px,4vw,34px);height:clamp(28px,4vw,34px);display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:clamp(18px,3vw,24px);transition:opacity 0.2s}
          .header-btn:hover{opacity:0.8}
          .profile-btn{width:clamp(40px,6vw,60px);height:clamp(40px,6vw,60px);border-radius:50%;overflow:hidden;cursor:pointer}
          .profile-avatar-img{width:100%;height:100%;object-fit:cover;border-radius:50%}

          .container{padding-top:clamp(60px,8vw,90px);padding-bottom:clamp(70px,9vw,96px)}

          .section{margin-top:clamp(16px,3vw,24px)}
          .section-title{font-size:clamp(20px,4vw,32px);font-weight:700;color:#ffffff;margin-left:clamp(16px,4vw,34px);margin-bottom:clamp(16px,3vw,24px)}

          .horizontal-scroll{display:flex;overflow-x:auto;gap:clamp(12px,2vw,18px);padding-left:clamp(16px,4vw,34px);padding-right:clamp(16px,4vw,34px);-webkit-overflow-scrolling:touch;scrollbar-width:none}
          .horizontal-scroll::-webkit-scrollbar{display:none}
          .horizontal-card{flex-shrink:0;width:clamp(260px,40vw,560px);height:clamp(140px,20vw,255px);border-radius:clamp(16px,3vw,28px);overflow:hidden;position:relative;cursor:pointer;background:#1B1B1B}
          .horizontal-card-img{width:100%;height:100%;object-fit:cover}
          .horizontal-card-info{position:absolute;bottom:0;left:0;right:0;padding:clamp(12px,2vw,20px);background:linear-gradient(to top,rgba(0,0,0,0.85),rgba(0,0,0,0))}
          .horizontal-card-title{font-size:clamp(14px,2vw,18px);font-weight:700;color:#ffffff;margin-bottom:4px}
          .horizontal-card-subtitle{font-size:clamp(10px,1.5vw,12px);font-weight:500;color:#c8c8c8}

          .episode-card{flex-shrink:0;width:clamp(200px,30vw,330px);cursor:pointer}
          .episode-thumbnail{position:relative;height:clamp(120px,18vw,185px);border-radius:clamp(14px,2vw,20px);overflow:hidden;margin-bottom:8px;background:#1B1B1B}
          .episode-img{width:100%;height:100%;object-fit:cover}
          .episode-title{font-size:clamp(14px,2vw,17px);font-weight:700;color:#ffffff;margin-bottom:4px}
          .episode-info{font-size:clamp(10px,1.5vw,12px);font-weight:500;color:#c8c8c8}

          .vertical-scroll{display:flex;overflow-x:auto;gap:clamp(12px,2vw,18px);padding-left:clamp(16px,4vw,34px);padding-right:clamp(16px,4vw,34px);-webkit-overflow-scrolling:touch;scrollbar-width:none}
          .vertical-scroll::-webkit-scrollbar{display:none}
          .card-wrapper{flex-shrink:0;width:clamp(110px,18vw,140px);cursor:pointer}
          .card-poster-frame{position:relative;border-radius:clamp(12px,2vw,16px);overflow:hidden;aspect-ratio:2/3;background:#1B1B1B}
          .content-poster{width:100%;height:100%;object-fit:cover}

          .featured-card{border-radius:clamp(14px,2vw,20px);overflow:hidden;margin:clamp(16px,3vw,24px) clamp(16px,4vw,34px);background:#1B1B1B}
          .featured-poster{width:100%;aspect-ratio:16/9;overflow:hidden}
          .featured-img{width:100%;height:100%;object-fit:cover}
          .featured-details{padding:clamp(16px,3vw,24px);background:#1B1B1B;display:flex;flex-direction:column;gap:clamp(12px,2vw,16px)}
          .featured-text{flex:1}
          .featured-title{font-size:clamp(16px,3vw,24px);font-weight:700;color:#ffffff;margin-bottom:clamp(8px,1.5vw,12px)}
          .featured-meta{display:flex;gap:clamp(8px,2vw,16px);margin-bottom:clamp(12px,2vw,16px);align-items:center;flex-wrap:wrap}
          .featured-rating{padding:clamp(2px,0.5vw,4px) clamp(8px,1.5vw,12px);border-radius:8px;font-size:clamp(12px,1.8vw,14px);font-weight:600;color:#fff}
          .rating-L{background:#4CAF50}.rating-18{background:#f44336}
          .featured-genre{color:#B5B5B5;font-size:clamp(12px,1.8vw,14px);font-weight:500}
          .featured-year{color:#B5B5B5;font-size:clamp(12px,1.8vw,14px);font-weight:500}
          .featured-synopsis{color:#808080;font-size:clamp(12px,1.8vw,14px);line-height:1.6}
          .featured-actions{display:flex;gap:clamp(8px,1.5vw,12px);align-self:flex-end}
          .featured-btn{width:clamp(40px,6vw,48px);height:clamp(40px,6vw,48px);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:clamp(18px,2.5vw,20px);transition:transform 0.2s}
          .featured-btn:hover{transform:scale(1.1)}
          .play-btn{background:#ffffff;color:#000000}
          .info-btn{background:rgba(255,255,255,0.2);color:#ffffff}

          .bottom-nav{position:fixed;bottom:0;left:0;right:0;z-index:1000;background:#101010;height:clamp(73px,10.4vw,104px);display:flex;justify-content:space-around;align-items:center;padding-bottom:clamp(4px,1vw,8px)}
          .nav-item{display:flex;flex-direction:column;align-items:center;gap:clamp(2px,0.5vw,4px);color:#5B5B5B;font-size:clamp(9px,1.5vw,12px);font-weight:600;transition:color 0.2s;padding:clamp(4px,1vw,8px)}
          .nav-item i{font-size:clamp(16px,3vw,24px)}
          .nav-item.active{color:#ffffff}
          .nav-item.active i{color:#ffffff}

          .filters-container{display:flex;gap:clamp(16px,3vw,36px);margin-left:clamp(16px,4vw,34px);margin-top:clamp(20px,3vw,28px);overflow-x:auto;scrollbar-width:none;padding-right:clamp(16px,4vw,34px)}
          .filters-container::-webkit-scrollbar{display:none}
          .filter-btn{height:clamp(36px,6vw,56px);padding:0 clamp(16px,3vw,32px);border-radius:clamp(18px,3vw,28px);font-size:clamp(13px,2vw,18px);font-weight:700;white-space:nowrap;transition:all 0.2s}
          .filter-btn.active{background:#ffffff;color:#000000}
          .filter-btn:not(.active){background:transparent;color:#A0A0A0}

          .favorites-list{padding:0 clamp(12px,2.5vw,20px);margin-top:clamp(16px,3vw,24px)}
          .favorite-item{display:flex;padding:clamp(12px,2vw,18px) clamp(12px,2.5vw,20px);position:relative;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.05);gap:clamp(12px,2vw,18px)}
          .favorite-poster{width:clamp(90px,18vw,160px);height:clamp(125px,25vw,220px);border-radius:clamp(12px,2vw,18px);object-fit:cover;flex-shrink:0;background:#1B1B1B}
          .favorite-content{flex:1;min-width:0;padding-right:clamp(28px,5vw,44px)}
          .favorite-title{font-size:clamp(14px,2vw,18px);font-weight:700;line-height:1.2;margin-bottom:clamp(4px,1vw,8px);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word}
          .favorite-year{font-size:clamp(12px,1.8vw,16px);color:#A5A5A5;margin-bottom:4px}
          .favorite-episodes{font-size:clamp(11px,1.6vw,15px);color:#A5A5A5;margin-bottom:clamp(8px,1.5vw,12px)}
          .favorite-badge{display:inline-block;padding:clamp(3px,0.6vw,6px) clamp(10px,2vw,16px);border-radius:clamp(6px,1vw,10px);font-size:clamp(11px,1.6vw,15px);font-weight:600;color:#ffffff}
          .favorite-remove{position:absolute;top:clamp(12px,2vw,18px);right:clamp(12px,2.5vw,20px);color:#D0D0D0;font-size:clamp(22px,3.5vw,34px);width:clamp(22px,3.5vw,34px);height:clamp(22px,3.5vw,34px);display:flex;align-items:center;justify-content:center;flex-shrink:0;z-index:1}
          .empty-favorites{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:clamp(40px,8vw,80px) clamp(16px,4vw,20px)}

          .search-container{display:flex;align-items:center;gap:clamp(8px,1.5vw,18px);padding:clamp(12px,2vw,24px) clamp(16px,4vw,34px);padding-top:clamp(20px,3vw,40px)}
          .search-back-btn{color:#ffffff;font-size:clamp(24px,4vw,38px);width:clamp(24px,4vw,38px);height:clamp(24px,4vw,38px);display:flex;align-items:center;justify-content:center;flex-shrink:0}
          .search-bar{flex:1;height:clamp(48px,7vw,74px);background:#1B1B1B;border-radius:clamp(24px,4vw,38px);display:flex;align-items:center;padding:0 clamp(16px,2.5vw,24px);gap:clamp(8px,1.5vw,12px)}
          .search-icon{color:#A5A5A5;font-size:clamp(16px,2.5vw,22px);flex-shrink:0}
          .search-input{flex:1;background:transparent;border:none;color:#DCDCDC;font-size:clamp(14px,2vw,20px);font-weight:500;outline:none;min-width:0}
          .search-input::placeholder{color:#888888}

          .search-results-list{padding:0 clamp(12px,2.5vw,24px);margin-top:clamp(20px,3.5vw,30px)}
          .search-result-item{display:flex;padding:clamp(10px,2vw,18px) 0;cursor:pointer;gap:clamp(10px,1.5vw,18px)}
          .search-result-poster{width:clamp(90px,16vw,165px);height:clamp(120px,22vw,220px);border-radius:clamp(12px,2vw,18px);object-fit:cover;flex-shrink:0;background:#1B1B1B}
          .search-result-content{flex:1;min-width:0;display:flex;flex-direction:column}
          .search-result-title{font-size:clamp(14px,2vw,19px);font-weight:700;line-height:1.2;color:#ffffff;margin-bottom:clamp(4px,0.8vw,8px)}
          .search-result-year{font-size:clamp(12px,1.5vw,16px);font-weight:500;color:#B3B3B3;margin-bottom:clamp(4px,0.8vw,8px)}
          .search-result-episodes{font-size:clamp(11px,1.5vw,16px);font-weight:500;color:#9A9A9A;margin-bottom:clamp(8px,1.5vw,12px)}
          .search-result-badge{display:inline-block;padding:clamp(3px,0.5vw,6px) clamp(10px,1.5vw,16px);border-radius:clamp(6px,1vw,10px);font-size:clamp(11px,1.5vw,15px);font-weight:600;color:#ffffff;align-self:flex-start}
          .search-divider{height:1px;background:rgba(255,255,255,0.05)}

          .categories-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:clamp(12px,2vw,20px);padding:0 clamp(16px,3vw,24px);margin-top:clamp(20px,3vw,30px)}
          .category-card{height:clamp(120px,18vw,180px);border-radius:clamp(18px,3vw,26px);position:relative;overflow:hidden;cursor:pointer}
          .category-title{position:absolute;left:clamp(16px,3vw,24px);bottom:clamp(30px,5vw,48px);font-size:clamp(14px,2.5vw,20px);font-weight:700;color:#ffffff;z-index:1}
          .category-thumbnail{position:absolute;right:-5px;top:10px;width:clamp(80px,15vw,130px);height:clamp(110px,20vw,180px);border-radius:clamp(12px,2vw,18px);transform:rotate(18deg);object-fit:cover;background:#1B1B1B}

          .menu-banner-container{padding:0 clamp(16px,3vw,28px);margin-top:clamp(16px,3vw,24px)}
          .verify-banner{height:clamp(48px,7vw,62px);background:#E04E4E;border-radius:clamp(14px,2vw,20px);display:flex;align-items:center;justify-content:space-between;padding:0 clamp(16px,2.5vw,20px);color:#ffffff;font-size:clamp(13px,2.2vw,18px);font-weight:700;gap:clamp(8px,1.5vw,12px)}
          .verify-banner span{flex:1;min-width:0}
          .verify-banner i{flex-shrink:0;font-size:clamp(16px,2.5vw,22px)}
          .user-card{display:flex;align-items:center;padding:clamp(16px,3vw,24px);margin:clamp(16px,3vw,28px);background:#1B1B1B;border-radius:clamp(16px,2.5vw,22px);position:relative;gap:clamp(12px,2vw,16px);cursor:pointer}
          .user-avatar{width:clamp(56px,9vw,80px);height:clamp(56px,9vw,80px);border-radius:50%;background:#2A2A2A;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden}
          .user-info{flex:1;min-width:0}
          .user-name{font-size:clamp(18px,3vw,24px);font-weight:700}
          .user-email{font-size:clamp(12px,2vw,15px);color:#A0A0A0;margin-top:clamp(2px,0.5vw,4px)}
          .logout-btn{color:#D0D0D0;font-size:clamp(28px,4.5vw,42px);width:clamp(28px,4.5vw,42px);height:clamp(28px,4.5vw,42px);display:flex;align-items:center;justify-content:center;flex-shrink:0}
          .settings-card{background:#1B1B1B;border-radius:clamp(16px,2.5vw,22px);padding:clamp(16px,3vw,28px);margin:clamp(16px,3vw,28px)}
          .settings-item{display:flex;align-items:center;gap:clamp(10px,2vw,16px);padding:clamp(10px,1.8vw,16px) 0;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer}
          .settings-item:last-child{border-bottom:none}
          .settings-icon{width:clamp(32px,5vw,42px);height:clamp(32px,5vw,42px);display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:clamp(18px,3vw,24px);flex-shrink:0}
          .settings-content{flex:1;min-width:0}
          .settings-title{font-size:clamp(14px,2.2vw,18px);font-weight:700}
          .settings-desc{font-size:clamp(11px,1.8vw,15px);color:#A0A0A0;margin-top:clamp(1px,0.3vw,2px)}
          .social-links{display:flex;justify-content:center;gap:clamp(16px,3vw,24px);margin-top:clamp(24px,4vw,36px);flex-wrap:wrap}
          .social-btn{width:clamp(52px,8vw,72px);height:clamp(52px,8vw,72px);border-radius:50%;background:#ffffff;display:flex;align-items:center;justify-content:center;font-size:clamp(24px,4vw,34px);color:#000000}
          .version-info{text-align:center;margin-top:clamp(16px,3vw,24px);padding:clamp(12px,2vw,20px)}
          .version-info p{font-size:clamp(13px,2.2vw,18px);font-weight:500;color:#E0E0E0}

          .profile-creation-overlay{position:fixed;inset:0;z-index:10000;background:#101010;display:flex;align-items:center;justify-content:center;padding:20px}
          .profile-creation-card{background:#1B1B1B;border-radius:24px;padding:clamp(24px,4vw,40px);width:100%;max-width:400px;display:flex;flex-direction:column;align-items:center;gap:clamp(16px,2.5vw,24px)}
          .modal-header{display:flex;justify-content:space-between;align-items:center;width:100%}
          .modal-close-btn{width:32px;height:32px;display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:20px;background:transparent;border:none;cursor:pointer;flex-shrink:0}
          .profile-creation-title{font-size:clamp(20px,3vw,28px);font-weight:800;color:#ffffff;margin:0}
          .profile-creation-subtitle{font-size:clamp(13px,2vw,16px);color:#888;text-align:center;width:100%}
          .profile-avatar-preview{width:clamp(64px,10vw,80px);height:clamp(64px,10vw,80px);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:clamp(28px,4vw,40px);font-weight:700;overflow:hidden}
          .profile-name-input{width:100%;padding:12px 16px;border-radius:12px;background:#2a2a2a;border:1px solid #333;color:#ffffff;font-size:16px;outline:none;text-align:center}
          .profile-error{color:#E04E4E;font-size:13px}
          .profile-colors{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
          .profile-color-btn{width:clamp(32px,5vw,40px);height:clamp(32px,5vw,40px);border-radius:50%;border:3px solid transparent;transition:border-color 0.2s}
          .profile-color-btn.selected{border-color:#ffffff}
          .profile-terms{font-size:clamp(11px,1.5vw,13px);color:#888;text-align:center;padding:0 10px}
          .profile-terms strong{color:#ddd}
          .profile-create-btn{width:100%;padding:14px;border-radius:14px;background:#ffffff;color:#000000;font-size:16px;font-weight:700;cursor:pointer;transition:opacity 0.2s}
          .profile-create-btn:hover{opacity:0.9}

          .profile-view-modal{background:#1B1B1B;border-radius:24px;padding:clamp(24px,4vw,40px);width:100%;max-width:380px}
          .profile-view-name{font-size:clamp(20px,3vw,24px);font-weight:700;color:#ffffff;margin:0}
          .profile-view-avatar{width:clamp(72px,12vw,96px);height:clamp(72px,12vw,96px);border-radius:50%;overflow:hidden}
          .profile-view-stats{display:flex;justify-content:space-around;margin-bottom:24px;padding:16px 0;border-top:1px solid rgba(255,255,255,0.1);border-bottom:1px solid rgba(255,255,255,0.1)}
          .profile-stat{display:flex;flex-direction:column;align-items:center;gap:4px}
          .profile-stat-value{font-size:clamp(16px,2.5vw,20px);font-weight:700;color:#ffffff}
          .profile-stat-label{font-size:clamp(11px,1.5vw,13px);color:#888}
          .profile-logout-btn{width:100%;padding:12px;border-radius:12px;background:transparent;border:1px solid rgba(255,255,255,0.2);color:#E04E4E;font-size:15px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:background 0.2s}
          .profile-logout-btn:hover{background:rgba(224,78,78,0.1)}

          .logout-confirm-modal{background:#1B1B1B;border-radius:24px;padding:clamp(24px,4vw,40px);width:100%;max-width:380px}
          .logout-confirm-title{font-size:clamp(18px,3vw,22px);font-weight:700;color:#ffffff;margin:0}
          .logout-confirm-text{font-size:clamp(13px,2vw,15px);color:#888;line-height:1.5;margin-bottom:24px}
          .logout-confirm-actions{display:flex;gap:12px}
          .logout-cancel-btn{flex:1;padding:12px;border-radius:12px;background:transparent;border:1px solid rgba(255,255,255,0.2);color:#ffffff;font-size:14px;font-weight:600;cursor:pointer}
          .logout-confirm-btn{flex:1;padding:12px;border-radius:12px;background:#E04E4E;color:#ffffff;font-size:14px;font-weight:600;cursor:pointer}

          .about-modal{background:#1B1B1B;border-radius:24px;padding:clamp(24px,4vw,40px);width:100%;max-width:500px;max-height:80vh;overflow-y:auto}
          .about-title{font-size:clamp(20px,3vw,28px);font-weight:800;color:#ffffff;margin:0}
          .about-content{color:#ccc;font-size:clamp(13px,2vw,15px);line-height:1.6}
          .about-content p{margin-bottom:12px}
          .about-content strong{color:#fff}
        `}</style>
      </Head>

      {!welcomed && <LoadingScreen onComplete={handleLoadingComplete} />}

      {loadingComplete && (
        <>
          {!showSearch && <Header onSearchClick={() => setShowSearch(true)} userProfile={userProfile} onProfileClick={handleProfileClick} />}

          <main className="container" style={showSearch ? { paddingTop: '0' } : {}}>
            {showSearch ? renderSearchPage() :
              activeSection === 'home' ? renderHomePage() :
              activeSection === 'animes' ? renderAnimesPage() :
              activeSection === 'favorites' ? renderFavoritesPage() :
              activeSection === 'menu' ? renderMenuPage() :
              renderHomePage()}
          </main>

          {!showSearch && <BottomNav activeSection={activeSection} setActiveSection={(section) => {
            setShowSearch(false)
            setSearchQuery('')
            setSearchResults([])
            setActiveSearchFilter('Tudo')
            setActiveSection(section)
          }} />}

          {showProfileCreation && <ProfileCreation onCreate={handleCreateProfile} onClose={() => setShowProfileCreation(false)} />}
          {showProfileView && userProfile && <ProfileView userProfile={userProfile} onLogout={handleLogout} onClose={() => setShowProfileView(false)} />}
          {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
        </>
      )}
    </>
  )
    }
