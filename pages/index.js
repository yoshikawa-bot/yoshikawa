import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
const DEFAULT_POSTER = 'https://yoshikawa-bot.github.io/cache/images/1c17bcf7.jpg'
const LOGO_URL = 'https://yoshikawa-bot.github.io/cache/images/ca96aff2.webp'
const DEFAULT_PROFILE_COLOR = '#FF6B6B'
const DEFAULT_AVATAR_BG = '#505050'

const GENRE_IMAGES = {
  12: 'https://image.tmdb.org/t/p/w500/8Y43POKjjKDGI9MH89NW0NAzzp8.jpg',
  28: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911B6EMThXE6Hj.jpg',
  35: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
  18: 'https://image.tmdb.org/t/p/w500/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
  14: 'https://image.tmdb.org/t/p/w500/i6dR2b2sh6MXs4fhHkKpMXrdu.jpg',
  10749: 'https://image.tmdb.org/t/p/w500/3TnH1j7bACu3mLSHrP5NHSMpIb.jpg',
  16: 'https://image.tmdb.org/t/p/w500/4j0PNHkMr5ax3IA8tjtxcmPU3QT.jpg',
  27: 'https://image.tmdb.org/t/p/w500/5gzz1vKhGmX3gN9w7GmYLfNwOM.jpg',
  53: 'https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWm.jpg',
  878: 'https://image.tmdb.org/t/p/w500/5M0jZmpQBGk5Yh7K3KwG7Gn6o.jpg'
}

const CATEGORIES = [
  { name: 'Aventura', color: '#7FA8D8' },
  { name: 'Ação', color: '#3F6D89' },
  { name: 'Drama', color: '#2C3F59' },
  { name: 'Fantasia', color: '#E97820' },
  { name: 'Romance', color: '#A8A8B6' },
  { name: 'Sobrenatural', color: '#9D95C8' }
]

const CATEGORY_GENRE_MAP = {
  'Aventura': 12,
  'Ação': 28,
  'Drama': 18,
  'Fantasia': 14,
  'Romance': 10749,
  'Sobrenatural': 27
}

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

const getRouteType = (item) => {
  if (item.media_type === 'tv' || item.first_air_date) return 'tv'
  return 'movie'
}

const getItemYear = (item) => {
  if (!item) return null
  return new Date(item.release_date || item.first_air_date).getFullYear() || null
}

const getAvatarUrl = (name, color = DEFAULT_AVATAR_BG) => {
  const bg = color.replace('#', '')
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=${bg}`
}

const POSTER_SIZE = 'w780'

const fetchLogoForItem = async (item) => {
  if (!item?.id) return null
  const mediaType = item.media_type || getMediaType(item)
  const type = mediaType === 'tv' ? 'tv' : 'movie'
  try {
    const res = await fetch(`https://api.themoviedb.org/3/${type}/${item.id}/images?api_key=${TMDB_API_KEY}&include_image_language=pt,en,null`)
    const data = await res.json()
    if (data.logos?.length) return data.logos[0].file_path
  } catch {}
  return null
}

const enrichSeriesWithLastEpisode = async (seriesList) => {
  const enriched = await Promise.all(seriesList.map(async (series) => {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/tv/${series.id}?api_key=${TMDB_API_KEY}&append_to_response=last_episode_to_air`)
      const data = await res.json()
      const episode = data.last_episode_to_air
      return {
        id: series.id,
        media_type: 'tv',
        name: episode?.name || series.name,
        title: series.name,
        episode_number: episode?.episode_number,
        still_path: episode?.still_path,
        backdrop_path: series.backdrop_path,
        poster_path: series.poster_path,
        year: getItemYear(series),
        genre_ids: series.genre_ids,
        overview: series.overview,
      }
    } catch {
      return {
        id: series.id,
        media_type: 'tv',
        name: series.name,
        title: series.name,
        episode_number: null,
        still_path: null,
        backdrop_path: series.backdrop_path,
        poster_path: series.poster_path,
        year: getItemYear(series),
        genre_ids: series.genre_ids,
        overview: series.overview,
      }
    }
  }))
  return enriched
}

const useHorizontalScrollRoot = () => {
  const ref = useRef(null)
  const [root, setRoot] = useState(null)
  useEffect(() => {
    if (ref.current) {
      let el = ref.current.parentElement
      while (el) {
        if (el.classList.contains('horizontal-scroll') || el.classList.contains('vertical-scroll')) {
          setRoot(el)
          break
        }
        el = el.parentElement
      }
    }
  }, [ref.current])
  return [ref, root]
}

const HorizontalFade = ({ children }) => {
  const [ref, root] = useHorizontalScrollRoot()
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node || !root) return
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0, root }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref, root])
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.3s' }}>
      {children}
    </div>
  )
}

export const LoadingScreen = ({ onComplete }) => {
  const [closing, setClosing] = useState(false)
  const [mounted, setMounted] = useState(true)
  useEffect(() => { const t = setTimeout(() => setClosing(true), 2000); return () => clearTimeout(t) }, [])
  useEffect(() => { if (closing) { const t = setTimeout(() => { setMounted(false); onComplete() }, 800); return () => clearTimeout(t) } }, [closing, onComplete])
  if (!mounted) return null
  return <div className={`loading-overlay ${closing ? 'closing' : ''}`}><div className="loading-content"><img src={LOGO_URL} alt="Yoshikawa" className="loading-logo" /><div className="loading-spinner" /></div></div>
}

export const ContentLoader = () => <div className="content-loader"><div className="loading-spinner" /></div>

export const Header = ({ onSearchClick, userProfile, onProfileClick, onLogoClick }) => {
  return (
    <header className="header">
      <img src={LOGO_URL} alt="Yoshikawa" className="header-logo" onClick={onLogoClick} />
      <div className="header-actions">
        <button className="header-btn" onClick={onSearchClick}><i className="fas fa-search" /></button>
        <button className="header-btn profile-btn" style={{ background: DEFAULT_AVATAR_BG }} onClick={onProfileClick}>
          {userProfile ? (
            <img
              src={userProfile.avatarUrl || getAvatarUrl(userProfile.name)}
              alt={userProfile.name}
              className="profile-avatar-img"
            />
          ) : (
            <i className="fas fa-user" style={{ fontSize: 'clamp(14px,2.2vw,20px)', color: '#fff', display: 'block', lineHeight: 1 }} />
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
    <button className={`nav-item ${activeSection === 'tv' ? 'active' : ''}`} onClick={() => setActiveSection('tv')}><i className="fas fa-tv" /><span>TV</span></button>
    <button className={`nav-item ${activeSection === 'favorites' ? 'active' : ''}`} onClick={() => setActiveSection('favorites')}>
      <i className="fas fa-heart" style={activeSection === 'favorites' ? { color: '#E04E4E' } : {}} />
      <span>Favoritos</span>
    </button>
    <button className={`nav-item ${activeSection === 'menu' ? 'active' : ''}`} onClick={() => setActiveSection('menu')}><i className="fas fa-bars" /><span>Menu</span></button>
  </nav>
)

export const HighlightBanner = ({ item, onPlay, logoPath }) => {
  const posterUrl = item.poster_path
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : DEFAULT_POSTER
  const backdropUrl = item.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
    : posterUrl
  const logoFullUrl = logoPath ? `https://image.tmdb.org/t/p/w500${logoPath}` : null

  return (
    <HorizontalFade>
      <div className="highlight-banner" onClick={() => onPlay?.(item)}>
        <div className="highlight-poster-half">
          <img src={backdropUrl} alt={item.title || item.name} className="highlight-poster-img" />
        </div>
        <div className="highlight-backdrop-half">
          <div className="highlight-blur-bg">
            <img src={backdropUrl} alt="" className="highlight-blur-img" />
            <div className="highlight-blur-overlay" />
          </div>
          <div className="highlight-logo-container">
            {logoFullUrl ? (
              <img src={logoFullUrl} alt={item.title || item.name} className="highlight-logo-img" />
            ) : (
              <span className="highlight-fallback-title">{item.title || item.name}</span>
            )}
          </div>
        </div>
      </div>
    </HorizontalFade>
  )
}

export const TrendingCard = ({ item, onPlay }) => {
  const backdropUrl = item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : DEFAULT_POSTER
  return (
    <HorizontalFade>
      <div className="trending-card" onClick={() => onPlay?.(item)}>
        <img src={backdropUrl} alt={item.title || item.name} className="trending-bg-img" />
        <div className="trending-title">
          <span className="trending-title-text">{item.title || item.name}</span>
        </div>
      </div>
    </HorizontalFade>
  )
}

export const EpisodeCard = ({ item, onPlay }) => {
  const year = getItemYear(item)
  const imageUrl = item.still_path
    ? `https://image.tmdb.org/t/p/w780${item.still_path}`
    : (item.backdrop_path
      ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
      : (item.poster_path
        ? `https://image.tmdb.org/t/p/${POSTER_SIZE}${item.poster_path}`
        : DEFAULT_POSTER))
  return (
    <HorizontalFade>
      <div className="episode-card" onClick={() => onPlay?.(item)}>
        <div className="episode-thumbnail episode-thumbnail-horizontal">
          <img src={imageUrl} alt={item.name || item.title} className="episode-img" />
        </div>
        <h4 className="episode-title">{item.title || item.name}</h4>
        <p className="episode-info">{item.episode_number ? `Episódio ${item.episode_number}` : `Em exibição • ${year || 'N/A'}`}</p>
      </div>
    </HorizontalFade>
  )
}

export const FeaturedCard = ({ item, onPlay, onInfo }) => {
  const year = getItemYear(item)
  const ratingClass = item.adult ? 'rating-18' : 'rating-L'
  const backdropUrl = item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : (item.poster_path ? `https://image.tmdb.org/t/p/w780${item.poster_path}` : DEFAULT_POSTER)
  return (
    <div className="featured-card">
      <div className="featured-poster"><img src={backdropUrl} alt={item.title || item.name} className="featured-img" /></div>
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
  const routeType = getRouteType(item)
  return (
    <HorizontalFade>
      <div className="card-wrapper" onClick={() => router.push(`/${routeType}/${item.id}`)}>
        <div className="card-poster-frame">
          <img src={item.poster_path ? `https://image.tmdb.org/t/p/${POSTER_SIZE}${item.poster_path}` : DEFAULT_POSTER} alt={item.title || item.name} className="content-poster" loading="lazy" />
        </div>
      </div>
    </HorizontalFade>
  )
}

export const FavoriteItem = ({ item, onRemove, onClick }) => {
  const mediaType = getMediaType(item)
  const year = getItemYear(item)
  const badgeColor = mediaType === 'anime' ? '#4D4BAF' : mediaType === 'tv' ? '#4A8B4A' : '#E97820'
  const badgeText = mediaType === 'anime' ? 'Anime' : mediaType === 'tv' ? 'Série' : 'Filme'
  return (
    <div className="favorite-item" onClick={() => onClick?.(item)}>
      <img src={item.poster_path ? `https://image.tmdb.org/t/p/${POSTER_SIZE}${item.poster_path}` : DEFAULT_POSTER} alt={item.title} className="favorite-poster" />
      <div className="favorite-content">
        <h3 className="favorite-title">{item.title}</h3>
        {year && <p className="favorite-year">{year}</p>}
        <p className="favorite-episodes">{item.episodes || '12 Episódios'}</p>
        <div className="favorite-badge" style={{ background: badgeColor }}>
          {badgeText}
        </div>
      </div>
      <button className="favorite-remove" onClick={(e) => { e.stopPropagation(); onRemove?.(item) }}><i className="fas fa-times" /></button>
    </div>
  )
}

const getGenreFallbackImage = (genreIds) => {
  if (!genreIds?.length) return DEFAULT_POSTER
  for (const id of genreIds) {
    if (GENRE_IMAGES[id]) return GENRE_IMAGES[id]
  }
  return DEFAULT_POSTER
}

export const SearchResultItem = ({ item, onClick }) => {
  const mediaType = getMediaType(item)
  const year = getItemYear(item)
  const imageSrc = item.poster_path
    ? `https://image.tmdb.org/t/p/${POSTER_SIZE}${item.poster_path}`
    : (item.backdrop_path
      ? `https://image.tmdb.org/t/p/${POSTER_SIZE}${item.backdrop_path}`
      : getGenreFallbackImage(item.genre_ids))
  const badgeColor = mediaType === 'anime' ? '#4D4BAF' : mediaType === 'tv' ? '#4A8B4A' : '#E97820'
  const badgeText = mediaType === 'anime' ? 'Anime' : mediaType === 'tv' ? 'Série' : 'Filme'

  return (
    <div className="search-result-item" onClick={() => onClick?.(item)}>
      <img src={imageSrc} alt={item.title || item.name} className="search-result-poster" loading="lazy" />
      <div className="search-result-content">
        <h3 className="search-result-title">{item.title || item.name}</h3>
        {year && <p className="search-result-year">{year}</p>}
        <p className="search-result-episodes">{item.popularity ? `${Math.round(item.popularity)} Popularidade` : '12 Episódios'}</p>
        <div className="search-result-badge" style={{ background: badgeColor }}>
          {badgeText}
        </div>
      </div>
    </div>
  )
}

export const CategoryCard = ({ category, onClick }) => (
  <div className="category-card" style={{ background: category.color }} onClick={onClick}>
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

export const ProfilePage = ({ userProfile, favorites, onPlay, onSave, onLogout, onClose, mode, onRemoveFavorite }) => {
  const isNew = mode === 'create'
  const startInEdit = mode === 'edit' || mode === 'create'
  const [editing, setEditing] = useState(startInEdit)
  const [name, setName] = useState(userProfile?.name || '')
  const [username, setUsername] = useState(userProfile?.username || '')
  const [avatarPreview, setAvatarPreview] = useState(userProfile?.avatarUrl || null)
  const [bannerPreview, setBannerPreview] = useState(userProfile?.bannerUrl || null)
  const [error, setError] = useState('')
  const [showLogout, setShowLogout] = useState(false)

  const handleFileRead = (file, setPreview) => {
    if (file.size > 1048576) {
      setError('A imagem deve ter no máximo 1MB')
      return
    }
    setError('')
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    handleFileRead(file, setAvatarPreview)
  }

  const handleBannerChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    handleFileRead(file, setBannerPreview)
  }

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed.length < 2) { setError('Nome deve ter pelo menos 2 caracteres'); return }
    if (trimmed.length > 20) { setError('Nome deve ter no máximo 20 caracteres'); return }
    const trimmedUsername = username.trim().toLowerCase().replace(/\s/g, '')
    if (trimmedUsername && trimmedUsername.length < 2) { setError('Username deve ter pelo menos 2 caracteres'); return }
    onSave({
      name: trimmed,
      username: trimmedUsername,
      avatarUrl: avatarPreview,
      bannerUrl: bannerPreview
    })
  }

  const bannerStyle = (bannerPreview || userProfile?.bannerUrl)
    ? { backgroundImage: `url(${bannerPreview || userProfile?.bannerUrl})` }
    : { background: DEFAULT_PROFILE_COLOR }

  const displayUsername = userProfile?.username || username || (userProfile?.name ? userProfile.name.toLowerCase().replace(/\s/g, '') : 'user')
  const moviesCount = favorites?.filter(f => f.media_type === 'movie' || getMediaType(f) === 'movie').length || 0
  const seriesCount = favorites?.filter(f => f.media_type === 'tv' || getMediaType(f) === 'tv').length || 0

  return (
    <div className="profile-fullpage-overlay">
      <div className="profile-top-bar">
        <button className="profile-top-btn" onClick={onClose}>
          <i className="fas fa-arrow-left" />
        </button>
        <div style={{ flex: 1 }} />
        {editing ? (
          <button className="profile-save-btn" onClick={handleSave}>Salvar</button>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="profile-top-btn" onClick={() => setEditing(true)}>
              <i className="fas fa-pencil" />
            </button>
            {!isNew && (
              <button className="profile-top-btn" onClick={() => setShowLogout(true)}>
                <i className="fas fa-sign-out-alt" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="profile-body">
        <div
          className="profile-cover"
          style={bannerStyle}
          onClick={editing ? () => document.getElementById('bannerFileInput').click() : undefined}
        >
          {editing && (
            <div className="cover-edit-icon">
              <i className="fas fa-camera" />
            </div>
          )}
        </div>

        <div className="profile-avatar-wrapper">
          <div
            className={`profile-avatar-circle ${editing ? 'avatar-editable' : ''}`}
            onClick={editing ? () => document.getElementById('avatarFileInput').click() : undefined}
          >
            {(avatarPreview || userProfile?.avatarUrl) ? (
              <img src={avatarPreview || userProfile?.avatarUrl} alt="" className="profile-avatar-img" />
            ) : (
              <img src={getAvatarUrl(name || '?')} alt="" className="profile-avatar-img" />
            )}
            {editing && (
              <div className="avatar-edit-overlay">
                <i className="fas fa-camera" />
              </div>
            )}
          </div>
        </div>

        <div className="profile-info">
          {editing ? (
            <div className="edit-form">
              <div className="edit-field">
                <label className="edit-label">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); setError('') }}
                  className="edit-input"
                  maxLength={20}
                  placeholder="Seu nome"
                  autoFocus
                />
              </div>
              <div className="edit-field">
                <label className="edit-label">Username</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ color: '#888', fontSize: '18px', fontWeight: 600 }}>@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={e => { setUsername(e.target.value); setError('') }}
                    className="edit-input"
                    maxLength={20}
                    placeholder="username"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
              {error && <p className="profile-error">{error}</p>}
              {isNew && (
                <p className="profile-create-hint">Crie um perfil para salvar seus favoritos e personalizar a experiência.</p>
              )}
            </div>
          ) : (
            <>
              <div className="profile-name-row">
                <h2 className="profile-name">{userProfile?.name || name}</h2>
              </div>
              <p className="profile-username">@{displayUsername}</p>
              <p className="profile-meta">
                <i className="fas fa-calendar-alt" /> Entrou em {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 'hoje'}
              </p>
              <div className="profile-stats">
                <span><strong>{moviesCount}</strong> Filmes</span>
                <span><strong>{seriesCount}</strong> Séries</span>
              </div>
            </>
          )}
        </div>

        {!editing && (
          <>
            <div className="profile-divider" />
            <div className="profile-favorites-section">
              <h3 className="profile-favorites-title">Favoritos</h3>
              {(!favorites || favorites.length === 0) ? (
                <div className="empty-favorites">
                  <i className="fas fa-heart" style={{ fontSize: 'clamp(32px,5vw,48px)', color: '#333', marginBottom: 'clamp(12px,2vw,16px)' }} />
                  <p style={{ color: '#666', fontSize: 'clamp(14px,2.5vw,18px)' }}>Nenhum favorito ainda</p>
                </div>
              ) : (
                <div className="favorites-list">
                  {favorites.map(item => (
                    <FavoriteItem key={`${item.media_type}-${item.id}`} item={item} onRemove={onRemoveFavorite} onClick={onPlay} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <input type="file" id="avatarFileInput" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
      <input type="file" id="bannerFileInput" accept="image/*" style={{ display: 'none' }} onChange={handleBannerChange} />

      {showLogout && <LogoutConfirm onConfirm={() => { setShowLogout(false); onLogout() }} onCancel={() => setShowLogout(false)} />}
    </div>
  )
}

export const PrivacyModal = ({ onClose }) => (
  <div className="profile-creation-overlay" onClick={onClose}>
    <div className="about-modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h2 className="about-title">Privacidade</h2>
        <button className="modal-close-btn" onClick={onClose}><i className="fas fa-times" /></button>
      </div>
      <div className="about-content">
        <p><strong>Política de Privacidade</strong></p>
        <p>Este aplicativo não coleta, armazena ou compartilha dados pessoais dos usuários. As informações de perfil e favoritos são armazenadas localmente no seu dispositivo e podem ser removidas a qualquer momento.</p>
        <p>Utilizamos a API do TMDB para indexação de conteúdo, nenhum dado é enviado a servidores próprios.</p>
        <p>Para dúvidas, entre em contato pelo e-mail yoshikawa_bot@proton.me.</p>
      </div>
    </div>
  </div>
)

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
        <p><strong>Versão:</strong> 1.0.90 beta</p>
      </div>
    </div>
  </div>
)

export default function Home() {
  const router = useRouter()
  const [welcomed, setWelcomed] = useState(false)
  const [loadingComplete, setLoadingComplete] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [profileMode, setProfileMode] = useState('view')
  const [showAbout, setShowAbout] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [contentLoading, setContentLoading] = useState(true)
  const [trending, setTrending] = useState([])
  const [trendingLogos, setTrendingLogos] = useState({})
  const [newEpisodes, setNewEpisodes] = useState([])
  const [recentlyAdded, setRecentlyAdded] = useState([])
  const [featured, setFeatured] = useState(null)
  const [adventure, setAdventure] = useState([])
  const [comedy, setComedy] = useState([])
  const [romance, setRomance] = useState([])
  const [recommended, setRecommended] = useState([])
  const [animes, setAnimes] = useState([])
  const [animeLogos, setAnimeLogos] = useState({})
  const [favorites, setFavorites] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [activeSection, setActiveSection] = useState('home')
  const [activeFilter, setActiveFilter] = useState('Tudo')
  const [activeSearchFilter, setActiveSearchFilter] = useState('Tudo')
  const [showSearch, setShowSearch] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [categoryImages, setCategoryImages] = useState({})

  const [animeTrending, setAnimeTrending] = useState([])
  const [animeTrendingLogos, setAnimeTrendingLogos] = useState({})
  const [animeNewEpisodes, setAnimeNewEpisodes] = useState([])
  const [animeRecentlyAdded, setAnimeRecentlyAdded] = useState([])
  const [animeFeatured, setAnimeFeatured] = useState(null)
  const [animeAdventure, setAnimeAdventure] = useState([])
  const [animeComedy, setAnimeComedy] = useState([])
  const [animeRomance, setAnimeRomance] = useState([])
  const [animeRecommended, setAnimeRecommended] = useState([])

  const [tvChannels, setTvChannels] = useState([])
  const [tvEvents, setTvEvents] = useState([])
  const [calendarEntries, setCalendarEntries] = useState([])
  const [tvSubSection, setTvSubSection] = useState('channels')
  const [tvLoading, setTvLoading] = useState(false)

  const [navHistory, setNavHistory] = useState(['home'])
  const [navIndex, setNavIndex] = useState(0)

  useEffect(() => {
    const savedSection = sessionStorage.getItem('yoshikawaActiveSection')
    if (savedSection && savedSection !== 'home') {
      setActiveSection(savedSection)
    }
  }, [])

  useEffect(() => {
    sessionStorage.setItem('yoshikawaActiveSection', activeSection)
  }, [activeSection])

  useEffect(() => {
    const savedSearch = sessionStorage.getItem('yoshikawaShowSearch') === 'true'
    const savedProfile = sessionStorage.getItem('yoshikawaShowProfile') === 'true'
    const savedProfileMode = sessionStorage.getItem('yoshikawaProfileMode') || 'view'
    if (savedSearch) {
      setShowSearch(true)
      setShowProfile(false)
    } else if (savedProfile) {
      setShowProfile(true)
      setProfileMode(savedProfileMode)
      setShowSearch(false)
    }
  }, [])

  useEffect(() => {
    sessionStorage.setItem('yoshikawaShowSearch', showSearch)
    if (!showSearch) sessionStorage.removeItem('yoshikawaShowSearch')
  }, [showSearch])

  useEffect(() => {
    sessionStorage.setItem('yoshikawaShowProfile', showProfile)
    if (!showProfile) sessionStorage.removeItem('yoshikawaShowProfile')
    else sessionStorage.setItem('yoshikawaProfileMode', profileMode)
  }, [showProfile, profileMode])

  useEffect(() => {
    const handlePopState = () => {
      if (navIndex > 0) {
        const newIndex = navIndex - 1
        setNavIndex(newIndex)
        setActiveSection(navHistory[newIndex])
        setShowSearch(false)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [navHistory, navIndex])

  const navigateTo = (section) => {
    const newHistory = navHistory.slice(0, navIndex + 1)
    newHistory.push(section)
    setNavHistory(newHistory)
    setNavIndex(newHistory.length - 1)
    setActiveSection(section)
    window.history.pushState(null, '', window.location.pathname)
  }

  useEffect(() => {
    try { const seen = sessionStorage.getItem('yoshikawaWelcomed'); if (seen) { setWelcomed(true); setLoadingComplete(true) } else { setWelcomed(false) } } catch { setWelcomed(false) }
    try { const saved = localStorage.getItem('yoshikawaProfile'); if (saved) { const p = JSON.parse(saved); p.favoritesCount = JSON.parse(localStorage.getItem('yoshikawaFavorites') || '[]').length; setUserProfile(p) } } catch {}
    if (router.query.section) navigateTo(router.query.section)
  }, [router.query.section])

  const handleLoadingComplete = () => {
    try { sessionStorage.setItem('yoshikawaWelcomed', '1') } catch {}
    setWelcomed(true)
    setLoadingComplete(true)
  }

  useEffect(() => { if (loadingComplete) loadAllContent() }, [loadingComplete])

  useEffect(() => {
    if (showSearch && !searchQuery.trim()) {
      fetchCategoryImages()
    }
  }, [showSearch, searchQuery])

  useEffect(() => {
    if (activeSection === 'tv') {
      loadTVContent()
    }
  }, [activeSection, tvSubSection])

  const deduplicateById = (items) => {
    const seen = new Set()
    return items.filter(item => {
      const key = `${item.media_type || getMediaType(item)}-${item.id}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  const fetchCategoryImages = async () => {
    const newImages = {}
    await Promise.all(CATEGORIES.map(async (cat) => {
      const genreId = CATEGORY_GENRE_MAP[cat.name]
      if (!genreId) return
      try {
        const data = await fetchTMDB(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&language=pt-BR&region=BR&sort_by=popularity.desc`)
        if (data && data.length > 0) {
          const item = data[0]
          const img = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : (item.backdrop_path ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}` : null)
          if (img) newImages[cat.name] = img
        }
      } catch {}
    }))
    setCategoryImages(newImages)
  }

  const loadAllContent = async () => {
    setContentLoading(true)
    try {
      const baseParams = `api_key=${TMDB_API_KEY}&language=pt-BR&region=BR`
      const watchParams = `watch_region=BR&with_watch_monetization_types=flatrate|free|ads`
      const animeMovieParams = `&with_genres=16&with_original_language=ja`
      const animeTVParams = animeMovieParams

      const [
        trendingMovies,
        nowPlaying,
        onAirSeries,
        upcoming,
        popular,
        adventureShows,
        comedyShows,
        romanceShows,
        topRated,
        animeMovies,
        animeTV
      ] = await Promise.all([
        fetchTMDB(`https://api.themoviedb.org/3/trending/all/week?${baseParams}`),
        fetchTMDBPages(`https://api.themoviedb.org/3/movie/now_playing?${baseParams}`),
        fetchTMDBPages(`https://api.themoviedb.org/3/discover/tv?${baseParams}&${watchParams}&sort_by=first_air_date.desc`),
        fetchTMDB(`https://api.themoviedb.org/3/movie/upcoming?${baseParams}`),
        fetchTMDBPages(`https://api.themoviedb.org/3/discover/movie?${baseParams}&${watchParams}&sort_by=popularity.desc`),
        fetchTMDB(`https://api.themoviedb.org/3/discover/movie?${baseParams}&with_genres=12&${watchParams}`),
        fetchTMDB(`https://api.themoviedb.org/3/discover/movie?${baseParams}&with_genres=35&${watchParams}`),
        fetchTMDB(`https://api.themoviedb.org/3/discover/movie?${baseParams}&with_genres=10749&${watchParams}`),
        fetchTMDB(`https://api.themoviedb.org/3/movie/top_rated?${baseParams}`),
        fetchTMDB(`https://api.themoviedb.org/3/discover/movie?${baseParams}${animeMovieParams}&${watchParams}`),
        fetchTMDB(`https://api.themoviedb.org/3/discover/tv?${baseParams}${animeTVParams}&${watchParams}`)
      ])

      const [
        animeTrendingRaw,
        animeOnAirRaw,
        animeRecentRaw,
        animeAdventureRaw,
        animeComedyRaw,
        animeRomanceRaw,
        animeRecommendedRaw
      ] = await Promise.all([
        fetchTMDB(`https://api.themoviedb.org/3/discover/movie?${baseParams}${animeMovieParams}&${watchParams}&sort_by=popularity.desc`),
        fetchTMDB(`https://api.themoviedb.org/3/discover/tv?${baseParams}${animeTVParams}&${watchParams}&sort_by=first_air_date.desc`),
        fetchTMDB(`https://api.themoviedb.org/3/discover/movie?${baseParams}${animeMovieParams}&${watchParams}&sort_by=release_date.desc`),
        fetchTMDB(`https://api.themoviedb.org/3/discover/movie?${baseParams}&with_genres=12,16&with_original_language=ja&${watchParams}`),
        fetchTMDB(`https://api.themoviedb.org/3/discover/movie?${baseParams}&with_genres=35,16&with_original_language=ja&${watchParams}`),
        fetchTMDB(`https://api.themoviedb.org/3/discover/movie?${baseParams}&with_genres=10749,16&with_original_language=ja&${watchParams}`),
        fetchTMDB(`https://api.themoviedb.org/3/discover/movie?${baseParams}${animeMovieParams}&${watchParams}&sort_by=vote_average.desc&vote_count.gte=100`)
      ])

      const filterQuality = (items) => items.filter(i => i.poster_path && i.vote_count > 50 && i.popularity > 10)

      const trendingClean = deduplicateById(filterQuality(trendingMovies)).slice(0, 10)
      setTrending(trendingClean)

      const nowPlayingClean = deduplicateById(nowPlaying.filter(i => i.poster_path).map(i => ({ ...i, media_type: 'movie' })))
      const latestRelease = nowPlayingClean.sort((a, b) => new Date(b.release_date) - new Date(a.release_date))[0] || null
      setFeatured(latestRelease)

      const seriesOnAir = deduplicateById(onAirSeries.filter(i => i.poster_path).map(i => ({ ...i, media_type: 'tv' }))).slice(0, 10)
      const enrichedSeries = await enrichSeriesWithLastEpisode(seriesOnAir)
      setNewEpisodes(enrichedSeries)

      setRecentlyAdded(nowPlayingClean.slice(0, 10))
      setAdventure(deduplicateById(adventureShows.filter(i => i.poster_path).map(i => ({ ...i, media_type: 'movie' }))).slice(0, 10))
      setComedy(deduplicateById(comedyShows.filter(i => i.poster_path).map(i => ({ ...i, media_type: 'movie' }))).slice(0, 10))
      setRomance(deduplicateById(romanceShows.filter(i => i.poster_path).map(i => ({ ...i, media_type: 'movie' }))).slice(0, 10))
      setRecommended(deduplicateById(topRated.filter(i => i.poster_path).map(i => ({ ...i, media_type: 'movie' }))).slice(0, 10))
      const combinedAnimes = deduplicateById([...animeMovies.map(i => ({ ...i, media_type: 'movie' })), ...animeTV.map(i => ({ ...i, media_type: 'tv' }))].filter(i => i.poster_path).sort((a, b) => b.popularity - a.popularity)).slice(0, 20)
      setAnimes(combinedAnimes)

      const trendingHighlights = trendingClean.slice(0, 5)
      const animeHighlights = combinedAnimes.slice(0, 5)

      const [trendingLogosArr, animeLogosArr] = await Promise.all([
        Promise.all(trendingHighlights.map(item => fetchLogoForItem(item))),
        Promise.all(animeHighlights.map(item => fetchLogoForItem(item)))
      ])

      const trendingLogosMap = {}
      trendingHighlights.forEach((item, idx) => { trendingLogosMap[item.id] = trendingLogosArr[idx] })
      const animeLogosMap = {}
      animeHighlights.forEach((item, idx) => { animeLogosMap[item.id] = animeLogosArr[idx] })

      setTrendingLogos(trendingLogosMap)
      setAnimeLogos(animeLogosMap)

      const animeTrendingClean = deduplicateById(filterQuality(animeTrendingRaw)).slice(0, 10)
      setAnimeTrending(animeTrendingClean)

      const animeRecentClean = deduplicateById(animeRecentRaw.filter(i => i.poster_path).map(i => ({ ...i, media_type: 'movie' })))
      const latestAnimeRelease = animeRecentClean.sort((a, b) => new Date(b.release_date) - new Date(a.release_date))[0] || null
      setAnimeFeatured(latestAnimeRelease)
      setAnimeRecentlyAdded(animeRecentClean.slice(0, 10))

      const animeOnAirClean = deduplicateById(animeOnAirRaw.filter(i => i.poster_path).map(i => ({ ...i, media_type: 'tv' }))).slice(0, 10)
      const enrichedAnimeSeries = await enrichSeriesWithLastEpisode(animeOnAirClean)
      setAnimeNewEpisodes(enrichedAnimeSeries)

      setAnimeAdventure(deduplicateById(animeAdventureRaw.filter(i => i.poster_path).map(i => ({ ...i, media_type: 'movie' }))).slice(0, 10))
      setAnimeComedy(deduplicateById(animeComedyRaw.filter(i => i.poster_path).map(i => ({ ...i, media_type: 'movie' }))).slice(0, 10))
      setAnimeRomance(deduplicateById(animeRomanceRaw.filter(i => i.poster_path).map(i => ({ ...i, media_type: 'movie' }))).slice(0, 10))
      setAnimeRecommended(deduplicateById(animeRecommendedRaw.filter(i => i.poster_path).map(i => ({ ...i, media_type: 'movie' }))).slice(0, 10))

      const animeTrendingHighlights = animeTrendingClean.slice(0, 5)
      const animeTrendingLogosArr = await Promise.all(animeTrendingHighlights.map(item => fetchLogoForItem(item)))
      const animeTrendingLogosMap = {}
      animeTrendingHighlights.forEach((item, idx) => { animeTrendingLogosMap[item.id] = animeTrendingLogosArr[idx] })
      setAnimeTrendingLogos(animeTrendingLogosMap)

      loadFavorites()
    } catch (e) { console.error(e) }
    setContentLoading(false)
  }

  const loadTVContent = async () => {
    setTvLoading(true)
    try {
      if (tvSubSection === 'channels') {
        const res = await fetch('https://superflixapi.best/lista?category=canais&format=json')
        const data = await res.json()
        setTvChannels(data || [])
      } else if (tvSubSection === 'events') {
        const res = await fetch('https://superflixapi.best/lista?category=eventos&format=json')
        const data = await res.json()
        setTvEvents(data || [])
      } else if (tvSubSection === 'calendar') {
        const res = await fetch('https://superflixapi.best/calendario.php')
        const data = await res.json()
        setCalendarEntries(data || [])
      }
    } catch (e) {
      console.error('Erro ao carregar TV', e)
    }
    setTvLoading(false)
  }

  const fetchTMDB = async (url) => { try { const r = await fetch(url); if (!r.ok) throw new Error(); const d = await r.json(); return d.results || [] } catch { return [] } }
  const fetchTMDBPages = async (endpoint) => { try { const [r1, r2] = await Promise.all([fetchTMDB(`${endpoint}&page=1`), fetchTMDB(`${endpoint}&page=2`)]); return [...r1, ...r2] } catch { return [] } }
  const loadFavorites = () => { try { const s = localStorage.getItem('yoshikawaFavorites'); setFavorites(s ? JSON.parse(s) : []) } catch { setFavorites([]) } }

  const handlePlay = (item) => window.location.href = `/${getRouteType(item)}/${item.id}`
  const handleInfo = (item) => window.location.href = `/${getRouteType(item)}/${item.id}`

  const handleLogout = () => {
    setUserProfile(null)
    setFavorites([])
    try { localStorage.removeItem('yoshikawaProfile'); localStorage.removeItem('yoshikawaFavorites') } catch {}
    setShowProfile(false)
  }

  const handleSaveProfile = (profileData) => {
    const now = new Date().toISOString()
    const updatedProfile = {
      ...userProfile,
      name: profileData.name,
      username: profileData.username,
      avatarUrl: profileData.avatarUrl,
      bannerUrl: profileData.bannerUrl,
      color: DEFAULT_PROFILE_COLOR,
      createdAt: userProfile?.createdAt || now,
      favoritesCount: userProfile?.favoritesCount || 0
    }
    setUserProfile(updatedProfile)
    try { localStorage.setItem('yoshikawaProfile', JSON.stringify(updatedProfile)) } catch {}
    setShowProfile(false)
    setProfileMode('view')
    navigateTo('home')
  }

  const openProfile = (mode = 'view') => {
    setProfileMode(mode)
    setShowProfile(true)
  }

  const handleProfileClick = () => {
    if (userProfile) openProfile('view')
    else openProfile('create')
  }

  const handleLogoClick = () => {
    navigateTo('home')
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])
    setActiveSearchFilter('Tudo')
  }

  const fetchSearchResults = async (query) => {
    if (!query.trim()) { setSearchResults([]); setSearchLoading(false); return }
    setSearchLoading(true)
    try {
      let results = []
      const baseSearch = `api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR&region=BR`

      if (activeSearchFilter === 'Filmes') {
        results = await fetchTMDB(`https://api.themoviedb.org/3/search/movie?${baseSearch}`)
        results = results.map(i => ({ ...i, media_type: 'movie' }))
      } else if (activeSearchFilter === 'Séries') {
        results = await fetchTMDB(`https://api.themoviedb.org/3/search/tv?${baseSearch}`)
        results = results.map(i => ({ ...i, media_type: 'tv' }))
      } else {
        const [movies, tv] = await Promise.all([
          fetchTMDB(`https://api.themoviedb.org/3/search/movie?${baseSearch}`),
          fetchTMDB(`https://api.themoviedb.org/3/search/tv?${baseSearch}`)
        ])
        results = [...movies.map(i => ({ ...i, media_type: 'movie' })), ...tv.map(i => ({ ...i, media_type: 'tv' }))]
      }

      if (activeSearchFilter === 'Animes') {
        results = results.filter(i => i.genre_ids?.includes(16))
      }

      const superflixRes = await fetch(`https://superflixapi.best/lista?category=pesquisa&q=${encodeURIComponent(query)}&format=json`)
      if (superflixRes.ok) {
        const superData = await superflixRes.json()
        if (Array.isArray(superData)) {
          const superItems = superData.map(item => ({
            ...item,
            id: item.id,
            title: item.title || item.name,
            poster_path: item.poster_path || null,
            media_type: item.media_type || 'movie'
          }))
          results = [...results, ...superItems]
        }
      }

      results = deduplicateById(results).sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 30)
      setSearchResults(results)
    } catch { setSearchResults([]) } finally { setSearchLoading(false) }
  }

  const debouncedSearch = useDebounce(fetchSearchResults, 300)
  const handleSearchChange = (q) => { setSearchQuery(q); if (!q.trim()) { setSearchResults([]); setSearchLoading(false); return }; setSearchLoading(true); debouncedSearch(q) }
  useEffect(() => { if (searchQuery.trim()) fetchSearchResults(searchQuery) }, [activeSearchFilter])

  const filteredFavorites = activeFilter === 'Tudo' ? favorites : activeFilter === 'Filmes' ? favorites.filter(f => f.media_type === 'movie') : activeFilter === 'Séries' ? favorites.filter(f => f.media_type === 'tv') : favorites

  const handleCategoryClick = (categoryName) => {
    navigateTo('search')
    setShowSearch(true)
    setSearchQuery(categoryName)
    setActiveSearchFilter('Tudo')
    setSearchLoading(true)
    fetchSearchResults(categoryName)
  }

  const removeFavorite = (fav) => {
    setFavorites(prev => {
      const updated = prev.filter(f => !(f.id === fav.id && f.media_type === fav.media_type))
      try { localStorage.setItem('yoshikawaFavorites', JSON.stringify(updated)) } catch {}
      return updated
    })
  }

  const handleChannelPlay = (channel) => {
    if (channel.url) {
      window.open(channel.url, '_blank')
    }
  }

  const handleEventClick = (event) => {
    if (event.play_event_url) {
      window.open(event.play_event_url, '_blank')
    } else if (event.page_url) {
      window.open(event.page_url, '_blank')
    }
  }

  const renderTVPage = () => (
    <div>
      <div className="filters-container" style={{ marginTop: 'clamp(20px,3vw,28px)' }}>
        {['Canais', 'Eventos', 'Calendário'].map(sub => (
          <button
            key={sub}
            className={`filter-btn ${tvSubSection === (sub === 'Canais' ? 'channels' : sub === 'Eventos' ? 'events' : 'calendar') ? 'active' : ''}`}
            onClick={() => setTvSubSection(sub === 'Canais' ? 'channels' : sub === 'Eventos' ? 'events' : 'calendar')}
          >
            {sub}
          </button>
        ))}
      </div>
      <section className="section">
        {tvLoading ? <ContentLoader /> : (
          tvSubSection === 'channels' ? (
            <div className="vertical-scroll" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
              {tvChannels.length > 0 ? tvChannels.map((channel, idx) => (
                <div key={channel.id || idx} className="episode-card" style={{ width: 'clamp(200px,30vw,330px)', cursor: 'pointer' }} onClick={() => handleChannelPlay(channel)}>
                  <div className="episode-thumbnail episode-thumbnail-horizontal">
                    <img src={channel.logo || DEFAULT_POSTER} alt={channel.name} className="episode-img" style={{ objectFit: 'contain', background: '#111' }} />
                  </div>
                  <h4 className="episode-title">{channel.name}</h4>
                  <p className="episode-info">{channel.category || 'Canal ao vivo'}</p>
                </div>
              )) : <div className="empty-favorites"><p style={{ color: '#666', fontSize: 'clamp(14px,2.5vw,18px)' }}>Nenhum canal disponível</p></div>}
            </div>
          ) : tvSubSection === 'events' ? (
            <div className="vertical-scroll" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
              {tvEvents.length > 0 ? tvEvents.map((event, idx) => (
                <div key={event.id || idx} className="episode-card" style={{ width: 'clamp(200px,30vw,330px)', cursor: 'pointer' }} onClick={() => handleEventClick(event)}>
                  <div className="episode-thumbnail episode-thumbnail-horizontal">
                    <img src={event.event_logo || event.competition_logo || DEFAULT_POSTER} alt={event.name} className="episode-img" style={{ objectFit: 'contain', background: '#111' }} />
                  </div>
                  <h4 className="episode-title">{event.name}</h4>
                  <p className="episode-info">{event.competition} {event.status ? `• ${event.status}` : ''}</p>
                </div>
              )) : <div className="empty-favorites"><p style={{ color: '#666', fontSize: 'clamp(14px,2.5vw,18px)' }}>Nenhum evento no momento</p></div>}
            </div>
          ) : (
            <div className="favorites-list">
              {calendarEntries.length > 0 ? calendarEntries.map((entry, idx) => (
                <div key={idx} className="favorite-item" style={{ cursor: 'default' }}>
                  <div className="favorite-content" style={{ paddingRight: 0 }}>
                    <h3 className="favorite-title">{entry.title || entry.name}</h3>
                    <p className="favorite-year">{entry.date || entry.air_date}</p>
                    <p className="favorite-episodes">{entry.episode ? `Episódio ${entry.episode}` : 'Novo'}</p>
                  </div>
                </div>
              )) : <div className="empty-favorites"><p style={{ color: '#666', fontSize: 'clamp(14px,2.5vw,18px)' }}>Calendário vazio</p></div>}
            </div>
          )
        )}
      </section>
    </div>
  )

  const renderHomePage = () => {
    if (contentLoading) return <ContentLoader />
    return (
      <>
        <section className="section">
          <h2 className="section-title">Em alta</h2>
          <div className="horizontal-scroll">
            {trending.slice(0, 5).map(item => (
              <HighlightBanner key={`${item.media_type || getMediaType(item)}-${item.id}`} item={item} onPlay={handlePlay} logoPath={trendingLogos[item.id] || null} />
            ))}
          </div>
        </section>
        <section className="section">
          <h2 className="section-title">Novos episódios</h2>
          <div className="horizontal-scroll">
            {newEpisodes.map(item => <EpisodeCard key={`${item.media_type}-${item.id}`} item={item} onPlay={handlePlay} />)}
          </div>
        </section>
        <section className="section">
          <h2 className="section-title">Recém adicionados</h2>
          <div className="vertical-scroll">
            {recentlyAdded.map(item => <MovieCard key={`${item.media_type}-${item.id}`} item={item} />)}
          </div>
        </section>
        <section className="section">
          <h2 className="section-title">Lançamento</h2>
          {featured && <FeaturedCard item={featured} onPlay={handlePlay} onInfo={handleInfo} />}
        </section>
        <section className="section">
          <h2 className="section-title">Aventura</h2>
          <div className="vertical-scroll">
            {adventure.map(item => <MovieCard key={`${item.media_type}-${item.id}`} item={item} />)}
          </div>
        </section>
        <section className="section">
          <h2 className="section-title">Comédia</h2>
          <div className="vertical-scroll">
            {comedy.map(item => <MovieCard key={`${item.media_type}-${item.id}`} item={item} />)}
          </div>
        </section>
        <section className="section">
          <h2 className="section-title">Romance</h2>
          <div className="vertical-scroll">
            {romance.map(item => <MovieCard key={`${item.media_type}-${item.id}`} item={item} />)}
          </div>
        </section>
        <section className="section">
          <h2 className="section-title">Talvez você goste</h2>
          <div className="vertical-scroll">
            {recommended.map(item => <MovieCard key={`${item.media_type}-${item.id}`} item={item} />)}
          </div>
        </section>
      </>
    )
  }

  const renderAnimesPage = () => {
    if (contentLoading) return <ContentLoader />
    return (
      <>
        <section className="section">
          <h2 className="section-title">Em alta</h2>
          <div className="horizontal-scroll">
            {animeTrending.slice(0, 5).map(item => (
              <HighlightBanner key={`${item.media_type || getMediaType(item)}-${item.id}`} item={item} onPlay={handlePlay} logoPath={animeTrendingLogos[item.id] || null} />
            ))}
          </div>
        </section>
        <section className="section">
          <h2 className="section-title">Novos episódios</h2>
          <div className="horizontal-scroll">
            {animeNewEpisodes.map(item => <EpisodeCard key={`${item.media_type}-${item.id}`} item={item} onPlay={handlePlay} />)}
          </div>
        </section>
        <section className="section">
          <h2 className="section-title">Recém adicionados</h2>
          <div className="vertical-scroll">
            {animeRecentlyAdded.map(item => <MovieCard key={`${item.media_type}-${item.id}`} item={item} />)}
          </div>
        </section>
        <section className="section">
          <h2 className="section-title">Lançamento</h2>
          {animeFeatured && <FeaturedCard item={animeFeatured} onPlay={handlePlay} onInfo={handleInfo} />}
        </section>
        <section className="section">
          <h2 className="section-title">Aventura</h2>
          <div className="vertical-scroll">
            {animeAdventure.map(item => <MovieCard key={`${item.media_type}-${item.id}`} item={item} />)}
          </div>
        </section>
        <section className="section">
          <h2 className="section-title">Comédia</h2>
          <div className="vertical-scroll">
            {animeComedy.map(item => <MovieCard key={`${item.media_type}-${item.id}`} item={item} />)}
          </div>
        </section>
        <section className="section">
          <h2 className="section-title">Romance</h2>
          <div className="vertical-scroll">
            {animeRomance.map(item => <MovieCard key={`${item.media_type}-${item.id}`} item={item} />)}
          </div>
        </section>
        <section className="section">
          <h2 className="section-title">Talvez você goste</h2>
          <div className="vertical-scroll">
            {animeRecommended.map(item => <MovieCard key={`${item.media_type}-${item.id}`} item={item} />)}
          </div>
        </section>
      </>
    )
  }

  const renderFavoritesPage = () => (
    <section className="section">
      <h2 className="section-title" style={{ fontSize: 'clamp(24px,5vw,34px)', fontWeight: '800' }}>Favoritos</h2>
      <div className="filters-container">{FAVORITE_FILTERS.map(filter => <button key={filter} className={`filter-btn ${activeFilter === filter ? 'active' : ''}`} onClick={() => setActiveFilter(filter)}>{filter}</button>)}</div>
      <div className="favorites-list">
        {filteredFavorites.length === 0 ? <div className="empty-favorites"><i className="fas fa-heart" style={{ fontSize: 'clamp(32px,5vw,48px)', color: '#333', marginBottom: 'clamp(12px,2vw,16px)' }} /><p style={{ color: '#666', fontSize: 'clamp(14px,2.5vw,18px)' }}>Nenhum favorito encontrado</p></div> : filteredFavorites.map(item => <FavoriteItem key={`${item.media_type}-${item.id}`} item={item} onRemove={removeFavorite} onClick={handlePlay} />)}
      </div>
    </section>
  )

  const renderSearchPage = () => (
    <div className="search-page-container">
      <div className="search-fixed-header">
        <button className="search-back-btn" onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); setActiveSearchFilter('Tudo'); window.history.back() }}><i className="fas fa-arrow-left" /></button>
        <div className="search-bar"><i className="fas fa-search search-icon" /><input type="text" placeholder="O que está procurando?" className="search-input" value={searchQuery} onChange={e => handleSearchChange(e.target.value)} autoFocus /></div>
      </div>
      <div className="search-content" style={{ paddingTop: '70px' }}>
        {searchQuery.trim() ? (
          <>
            <div className="filters-container" style={{ marginTop: 'clamp(20px,3vw,26px)', marginLeft: 'clamp(10px,2.6vw,22px)' }}>{SEARCH_FILTERS.map(filter => <button key={filter} className={`filter-btn ${activeSearchFilter === filter ? 'active' : ''}`} onClick={() => setActiveSearchFilter(filter)}>{filter}</button>)}</div>
            <div className="search-results-list">
              {searchLoading ? <ContentLoader /> : searchResults.length > 0 ? searchResults.map((item, index) => <div key={`${item.media_type || getMediaType(item)}-${item.id}`}><SearchResultItem item={item} onClick={handlePlay} />{index < searchResults.length - 1 && <div className="search-divider" />}</div>) : <div className="empty-favorites"><i className="fas fa-search" style={{ fontSize: 'clamp(32px,5vw,48px)', color: '#333', marginBottom: 'clamp(12px,2vw,16px)' }} /><p style={{ color: '#666', fontSize: 'clamp(14px,2.5vw,18px)' }}>Nenhum resultado encontrado</p></div>}
            </div>
          </>
        ) : (
          <>
            <div className="filters-container" style={{ marginTop: 'clamp(20px,3vw,30px)' }}>{FAVORITE_FILTERS.map(filter => <button key={filter} className={`filter-btn ${activeFilter === filter ? 'active' : ''}`} onClick={() => setActiveFilter(filter)}>{filter}</button>)}</div>
            <section className="section">
              <h2 className="section-title" style={{ fontSize: 'clamp(24px,5vw,38px)', fontWeight: '800' }}>Categorias</h2>
              <div className="categories-grid">
                {CATEGORIES.map((category, index) => {
                  const genreId = CATEGORY_GENRE_MAP[category.name]
                  const image = categoryImages[category.name] || GENRE_IMAGES[genreId] || DEFAULT_POSTER
                  return (
                    <CategoryCard
                      key={index}
                      category={{ ...category, image }}
                      onClick={() => handleCategoryClick(category.name)}
                    />
                  )
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )

  const renderMenuPage = () => (
    <section className="section" style={{ paddingTop: 'clamp(40px,8vw,80px)' }}>
      {!userProfile && (
        <div className="menu-banner-container">
          <div className="verify-banner" onClick={() => openProfile('create')} style={{ cursor: 'pointer' }}>
            <span>Crie seu perfil para personalizar sua experiência!</span>
            <i className="fas fa-chevron-right" />
          </div>
        </div>
      )}
      <div className="user-card" onClick={() => !userProfile ? openProfile('create') : openProfile('view')}>
        <div className="user-avatar" style={{ background: DEFAULT_AVATAR_BG }}>
          {userProfile ? <img src={userProfile.avatarUrl || getAvatarUrl(userProfile.name)} alt={userProfile.name} className="profile-avatar-img" /> : <i className="fas fa-user" style={{ fontSize: 'clamp(18px,3.2vw,27px)', color: '#fff', display: 'block', lineHeight: 1 }} />}
        </div>
        <div className="user-info"><h3 className="user-name">{userProfile ? userProfile.name : '@user'}</h3>{!userProfile && <p className="user-email">Criar perfil</p>}</div>
        {userProfile && <button className="logout-btn" onClick={(e) => { e.stopPropagation(); openProfile('view') }}><i className="fas fa-sign-out-alt" /></button>}
      </div>
      <div className="settings-card">
        <SettingsItem icon="user-edit" title={userProfile ? 'Editar Perfil' : 'Criar Perfil'} description={userProfile ? 'Alterar nome, foto e banner' : 'Personalize sua experiência'} onClick={() => openProfile(userProfile ? 'edit' : 'create')} />
        <SettingsItem icon="shield-alt" title="Privacidade" description="Política de privacidade" onClick={() => setShowPrivacy(true)} />
        <SettingsItem icon="question-circle" title="Ajuda" description="Fale conosco" onClick={() => window.location.href = 'mailto:yoshikawa_bot@proton.me'} />
        <SettingsItem icon="info-circle" title="Sobre" description="Versão do app" onClick={() => setShowAbout(true)} />
      </div>
      <div className="social-links">
        <button className="social-btn" onClick={() => window.open('https://yoshikawa.vercel.app', '_blank')}><i className="fas fa-link" /></button>
        <button className="social-btn" onClick={() => window.open('https://whatsapp.com/channel/0029VbBfav37z4kWNMkFPb1G', '_blank')}><i className="fab fa-whatsapp" /></button>
        <button className="social-btn" onClick={() => window.open('https://github.com/kawa-lyansky', '_blank')}><i className="fab fa-github" /></button>
      </div>
      <div className="version-info"><p>RELEASE BUILD - 1.0.90 beta</p></div>
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
          .header-logo{object-fit:contain;width:clamp(42px,6.3vw,63px);height:clamp(42px,6.3vw,63px);cursor:pointer}
          .header-actions{display:flex;align-items:center;gap:clamp(16px,3vw,28px)}
          .header-btn{width:clamp(28px,4vw,34px);height:clamp(28px,4vw,34px);display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:clamp(18px,3vw,24px);transition:opacity 0.2s}
          .header-btn:hover{opacity:0.8}
          .profile-btn{width:clamp(32px,4.5vw,42px);height:clamp(32px,4.5vw,42px);border-radius:50%;overflow:hidden;cursor:pointer;display:flex;align-items:center;justify-content:center}
          .profile-avatar-img{width:100%;height:100%;object-fit:cover;border-radius:50%}

          .container{padding-top:clamp(60px,8vw,90px);padding-bottom:clamp(70px,9vw,96px)}

          .section{margin-top:clamp(16px,3vw,24px)}
          .section-title{font-size:clamp(14px,2.9vw,22px);font-weight:700;color:#ffffff;margin-left:clamp(10px,2.6vw,22px);margin-bottom:clamp(8px,1.5vw,12px)}

          .horizontal-scroll{display:flex;overflow-x:auto;gap:clamp(8px,1.3vw,12px);padding-left:clamp(10px,2.6vw,22px);padding-right:clamp(10px,2.6vw,22px);-webkit-overflow-scrolling:touch;scrollbar-width:none}
          .horizontal-scroll::-webkit-scrollbar{display:none}

          .trending-card{width:clamp(280px,45vw,560px);height:clamp(160px,24vw,255px);border-radius:clamp(16px,3vw,28px);overflow:hidden;position:relative;cursor:pointer}
          .trending-bg-img{width:100%;height:100%;object-fit:cover}
          .trending-title{position:absolute;bottom:0;left:0;right:0;padding:clamp(8px,1.5vw,12px);z-index:2}
          .trending-title-text{font-size:clamp(11px,1.6vw,14px);font-weight:700;color:#fff;line-height:1.2;text-shadow:0 2px 8px rgba(0,0,0,0.8)}

          .highlight-banner{flex-shrink:0;width:clamp(280px,45vw,560px);height:clamp(160px,24vw,255px);border-radius:clamp(16px,3vw,28px);overflow:hidden;display:flex;cursor:pointer;flex-direction:row-reverse}
          .highlight-poster-half{width:50%;height:100%;overflow:hidden;flex-shrink:0}
          .highlight-poster-img{width:100%;height:100%;object-fit:cover}
          .highlight-backdrop-half{width:50%;height:100%;position:relative;overflow:hidden}
          .highlight-blur-bg{position:absolute;inset:0;filter:blur(12px);transform:scale(1.15)}
          .highlight-blur-img{width:100%;height:100%;object-fit:cover}
          .highlight-blur-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.4)}
          .highlight-logo-container{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:12px}
          .highlight-logo-img{max-width:80%;max-height:60%;object-fit:contain;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.7))}
          .highlight-fallback-title{font-size:clamp(10px,1.6vw,13px);font-weight:800;color:#fff;text-align:center;text-shadow:0 2px 8px rgba(0,0,0,0.9);line-height:1.2}

          .episode-card{width:clamp(200px,30vw,330px);cursor:pointer}
          .episode-thumbnail{position:relative;border-radius:clamp(14px,2vw,20px);overflow:hidden;margin-bottom:8px;background:#1B1B1B}
          .episode-thumbnail-horizontal{aspect-ratio:16/9}
          .episode-img{width:100%;height:100%;object-fit:cover}
          .episode-title{font-size:clamp(11px,1.6vw,14px);font-weight:700;color:#ffffff;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
          .episode-info{font-size:clamp(8px,1.2vw,10px);font-weight:500;color:#c8c8c8}

          .vertical-scroll{display:flex;overflow-x:auto;gap:clamp(8px,1.3vw,12px);padding-left:clamp(10px,2.6vw,22px);padding-right:clamp(10px,2.6vw,22px);-webkit-overflow-scrolling:touch;scrollbar-width:none}
          .vertical-scroll::-webkit-scrollbar{display:none}
          .card-wrapper{flex-shrink:0;width:clamp(110px,18vw,140px);cursor:pointer}
          .card-poster-frame{position:relative;border-radius:clamp(12px,2vw,16px);overflow:hidden;aspect-ratio:2/3;background:#1B1B1B}
          .content-poster{width:100%;height:100%;object-fit:cover}

          .featured-card{border-radius:clamp(14px,2vw,20px);overflow:hidden;margin:clamp(16px,3vw,24px) clamp(10px,2.6vw,22px);background:#1B1B1B}
          .featured-poster{width:100%;aspect-ratio:16/9;overflow:hidden}
          .featured-img{width:100%;height:100%;object-fit:cover}
          .featured-details{padding:clamp(16px,3vw,24px);background:#1B1B1B;display:flex;flex-direction:column;gap:clamp(12px,2vw,16px)}
          .featured-text{flex:1}
          .featured-title{font-size:clamp(13px,2.4vw,19px);font-weight:700;color:#ffffff;margin-bottom:clamp(8px,1.5vw,12px)}
          .featured-meta{display:flex;gap:clamp(8px,2vw,16px);margin-bottom:clamp(12px,2vw,16px);align-items:center;flex-wrap:wrap}
          .featured-rating{padding:clamp(2px,0.5vw,4px) clamp(8px,1.5vw,12px);border-radius:8px;font-size:clamp(10px,1.5vw,11px);font-weight:600;color:#fff}
          .rating-L{background:#4CAF50}.rating-18{background:#f44336}
          .featured-genre{color:#B5B5B5;font-size:clamp(10px,1.5vw,11px);font-weight:500}
          .featured-year{color:#B5B5B5;font-size:clamp(10px,1.5vw,11px);font-weight:500}
          .featured-synopsis{color:#808080;font-size:clamp(10px,1.5vw,11px);line-height:1.6}
          .featured-actions{display:flex;gap:clamp(8px,1.5vw,12px);align-self:flex-end}
          .featured-btn{width:clamp(40px,6vw,48px);height:clamp(40px,6vw,48px);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:clamp(18px,2.5vw,20px);transition:transform 0.2s}
          .featured-btn:hover{transform:scale(1.1)}
          .play-btn{background:#ffffff;color:#000000}
          .info-btn{background:rgba(255,255,255,0.2);color:#ffffff}

          .bottom-nav{position:fixed;bottom:0;left:0;right:0;z-index:1000;background:#101010;height:clamp(56px,8vw,80px);display:flex;justify-content:space-around;align-items:center;padding-bottom:clamp(4px,1vw,8px)}
          .nav-item{display:flex;flex-direction:column;align-items:center;gap:clamp(2px,0.5vw,4px);color:#5B5B5B;font-size:clamp(9px,1.5vw,12px);font-weight:600;transition:color 0.2s;padding:clamp(4px,1vw,8px)}
          .nav-item i{font-size:clamp(16px,3vw,24px)}
          .nav-item.active{color:#ffffff}

          .filters-container{display:flex;gap:clamp(10px,2vw,23px);margin-left:clamp(10px,2.6vw,22px);margin-top:clamp(20px,3vw,28px);overflow-x:auto;scrollbar-width:none;padding-right:clamp(10px,2.6vw,22px)}
          .filters-container::-webkit-scrollbar{display:none}
          .filter-btn{height:clamp(36px,6vw,56px);padding:0 clamp(16px,3vw,32px);border-radius:clamp(18px,3vw,28px);font-size:clamp(13px,2vw,18px);font-weight:700;white-space:nowrap;transition:all 0.2s}
          .filter-btn.active{background:#ffffff;color:#000000}
          .filter-btn:not(.active){background:transparent;color:#A0A0A0}

          .favorites-list{padding:0 clamp(8px,1.6vw,13px);margin-top:clamp(16px,3vw,24px)}
          .favorite-item{display:flex;padding:clamp(12px,2vw,18px) clamp(8px,1.6vw,13px);position:relative;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.05);gap:clamp(12px,2vw,18px)}
          .favorite-poster{width:clamp(90px,18vw,160px);height:clamp(125px,25vw,220px);border-radius:clamp(12px,2vw,18px);object-fit:cover;flex-shrink:0;background:#1B1B1B}
          .favorite-content{flex:1;min-width:0;padding-right:clamp(28px,5vw,44px)}
          .favorite-title{font-size:clamp(11px,1.6vw,14px);font-weight:700;line-height:1.2;margin-bottom:clamp(4px,1vw,8px);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word}
          .favorite-year{font-size:clamp(10px,1.5vw,13px);color:#A5A5A5;margin-bottom:4px}
          .favorite-episodes{font-size:clamp(9px,1.3vw,12px);color:#A5A5A5;margin-bottom:clamp(8px,1.5vw,12px)}
          .favorite-badge{display:inline-block;padding:clamp(3px,0.6vw,6px) clamp(10px,2vw,16px);border-radius:clamp(6px,1vw,10px);font-size:clamp(11px,1.6vw,15px);font-weight:600;color:#ffffff}
          .favorite-remove{position:absolute;top:clamp(12px,2vw,18px);right:clamp(12px,2.5vw,20px);color:#D0D0D0;font-size:clamp(22px,3.5vw,34px);width:clamp(22px,3.5vw,34px);height:clamp(22px,3.5vw,34px);display:flex;align-items:center;justify-content:center;flex-shrink:0;z-index:1}
          .empty-favorites{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:clamp(40px,8vw,80px) clamp(16px,4vw,20px)}

          .search-page-container{display:flex;flex-direction:column;height:100vh;overflow:hidden}
          .search-fixed-header{position:fixed;top:0;left:0;right:0;z-index:1000;background:#101010;padding:clamp(12px,2vw,20px) clamp(16px,3vw,24px);display:flex;align-items:center;gap:clamp(10px,2vw,18px);height:clamp(60px,8vw,90px)}
          .search-back-btn{color:#ffffff;font-size:clamp(24px,4vw,38px);width:clamp(24px,4vw,38px);height:clamp(24px,4vw,38px);display:flex;align-items:center;justify-content:center;flex-shrink:0}
          .search-bar{flex:1;height:clamp(40px,6vw,52px);background:#1B1B1B;border-radius:clamp(20px,4vw,26px);display:flex;align-items:center;padding:0 clamp(12px,2vw,18px);gap:clamp(6px,1vw,10px)}
          .search-icon{color:#A5A5A5;font-size:clamp(14px,2vw,18px);flex-shrink:0}
          .search-input{flex:1;background:transparent;border:none;color:#DCDCDC;font-size:clamp(14px,2vw,16px);font-weight:500;outline:none;min-width:0}
          .search-input::placeholder{color:#888888}
          .search-content{flex:1;overflow-y:auto;padding-bottom:clamp(70px,9vw,96px)}

          .search-results-list{padding:0 clamp(8px,1.6vw,16px);margin-top:clamp(20px,3.5vw,30px)}
          .search-result-item{display:flex;padding:clamp(10px,2vw,18px) 0;cursor:pointer;gap:clamp(10px,1.5vw,18px)}
          .search-result-poster{width:clamp(90px,16vw,165px);height:clamp(120px,22vw,220px);border-radius:clamp(12px,2vw,18px);object-fit:cover;flex-shrink:0;background:#1B1B1B}
          .search-result-content{flex:1;min-width:0;display:flex;flex-direction:column}
          .search-result-title{font-size:clamp(11px,1.6vw,15px);font-weight:700;line-height:1.2;color:#ffffff;margin-bottom:clamp(4px,0.8vw,8px);text-shadow:0 1px 4px rgba(0,0,0,0.6)}
          .search-result-year{font-size:clamp(10px,1.5vw,13px);font-weight:500;color:#B3B3B3;margin-bottom:clamp(4px,0.8vw,8px);text-shadow:0 1px 2px rgba(0,0,0,0.5)}
          .search-result-episodes{font-size:clamp(9px,1.3vw,12px);font-weight:500;color:#9A9A9A;margin-bottom:clamp(8px,1.5vw,12px);text-shadow:0 1px 2px rgba(0,0,0,0.5)}
          .search-result-badge{display:inline-block;padding:clamp(3px,0.5vw,6px) clamp(10px,1.5vw,16px);border-radius:clamp(6px,1vw,10px);font-size:clamp(11px,1.5vw,15px);font-weight:600;color:#ffffff;align-self:flex-start;text-shadow:0 1px 2px rgba(0,0,0,0.5)}
          .search-divider{height:1px;background:rgba(255,255,255,0.05)}

          .categories-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:clamp(8px,1.3vw,13px);padding:0 clamp(10px,2vw,15px);margin-top:clamp(20px,3vw,30px)}
          .category-card{height:clamp(120px,18vw,180px);border-radius:clamp(18px,3vw,26px);position:relative;overflow:hidden;cursor:pointer}
          .category-title{position:absolute;left:clamp(16px,3vw,24px);bottom:clamp(30px,5vw,48px);font-size:clamp(14px,2.5vw,20px);font-weight:700;color:#ffffff;z-index:1;text-shadow:0 2px 8px rgba(0,0,0,0.7)}
          .category-thumbnail{position:absolute;right:-5px;top:10px;width:clamp(80px,15vw,130px);height:clamp(110px,20vw,180px);border-radius:clamp(12px,2vw,18px);transform:rotate(18deg);object-fit:cover;background:#1B1B1B}

          .menu-banner-container{padding:0 clamp(16px,3vw,28px);margin-top:clamp(16px,3vw,24px)}
          .verify-banner{height:clamp(48px,7vw,62px);background:#E04E4E;border-radius:clamp(14px,2vw,20px);display:flex;align-items:center;justify-content:space-between;padding:0 clamp(16px,2.5vw,20px);color:#ffffff;font-size:clamp(13px,2.2vw,18px);font-weight:700;gap:clamp(8px,1.5vw,12px)}
          .verify-banner span{flex:1;min-width:0}
          .verify-banner i{flex-shrink:0;font-size:clamp(16px,2.5vw,22px)}
          .user-card{display:flex;align-items:center;padding:clamp(16px,3vw,24px);margin:clamp(16px,3vw,28px);background:#1B1B1B;border-radius:clamp(16px,2.5vw,22px);position:relative;gap:clamp(12px,2vw,16px);cursor:pointer}
          .user-avatar{width:clamp(56px,9vw,80px);height:clamp(56px,9vw,80px);border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center}
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
          .modal-header{display:flex;justify-content:space-between;align-items:center;width:100%}
          .modal-close-btn{width:32px;height:32px;display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:20px;background:transparent;border:none;cursor:pointer;flex-shrink:0}
          .profile-error{color:#E04E4E;font-size:13px;margin-top:8px}

          .profile-fullpage-overlay{position:fixed;inset:0;z-index:10000;background:#101010;display:flex;flex-direction:column;overflow-y:auto}
          .profile-top-bar{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;min-height:60px;background:transparent;position:absolute;top:0;left:0;right:0;z-index:10}
          .profile-top-btn{width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px}
          .profile-save-btn{background:#fff;color:#000;font-size:16px;font-weight:700;padding:8px 20px;border-radius:20px}
          .profile-body{flex:1}
          .profile-cover{width:100%;height:160px;background-size:cover;background-position:center;position:relative;display:flex;align-items:center;justify-content:center}
          .cover-edit-icon{width:48px;height:48px;border-radius:50%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.85);font-size:22px}
          .profile-avatar-wrapper{display:flex;justify-content:flex-start;padding-left:20px;margin-top:-50px;position:relative;z-index:2}
          .profile-avatar-circle{width:100px;height:100px;border-radius:50%;border:4px solid #101010;overflow:hidden;position:relative;background:#505050}
          .avatar-editable{cursor:pointer}
          .avatar-edit-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px}
          .profile-info{padding:8px 24px 0}
          .profile-create-hint{font-size:14px;color:#888;text-align:center;margin:12px 0 0;padding:0 8px}
          .profile-name-row{display:flex;align-items:center;gap:8px;margin-bottom:2px}
          .profile-name{font-size:22px;font-weight:800;color:#fff}
          .profile-username{font-size:15px;color:#888;margin-bottom:8px}
          .profile-meta{font-size:14px;color:#888;display:flex;align-items:center;gap:8px;margin-bottom:6px}
          .profile-meta i{width:16px;text-align:center}
          .profile-stats{display:flex;gap:20px;margin:12px 0;font-size:14px;color:#888}
          .profile-stats strong{color:#fff;font-weight:700}
          .profile-divider{height:1px;background:rgba(255,255,255,0.1);margin:20px 0 0}
          .profile-favorites-section{padding:16px 0 24px}
          .profile-favorites-title{font-size:clamp(14px,2.9vw,22px);font-weight:700;color:#fff;padding:0 clamp(8px,1.6vw,13px);margin:0 0 clamp(8px,1.5vw,12px)}
          .edit-form{display:flex;flex-direction:column;gap:0}
          .edit-field{padding:16px 0;border-bottom:1px solid rgba(255,255,255,0.1)}
          .edit-label{font-size:15px;color:#888;margin-bottom:8px;display:block}
          .edit-input{width:100%;background:transparent;border:none;color:#fff;font-size:18px;font-weight:600;outline:none;padding:4px 0}

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

          @media (min-width: 768px) {
            .profile-cover {
              height: 224px;
            }
            .profile-favorites-title {
              padding: 0 24px !important;
              font-size: 15px !important;
            }
            .favorite-remove {
              font-size: clamp(14px, 2.275vw, 22px) !important;
              width: clamp(14px, 2.275vw, 22px) !important;
              height: clamp(14px, 2.275vw, 22px) !important;
            }
          }
        `}</style>
      </Head>

      {!welcomed && <LoadingScreen onComplete={handleLoadingComplete} />}

      {loadingComplete && (
        <>
          {!showSearch && !showProfile && <Header onSearchClick={() => { navigateTo('search'); setShowSearch(true) }} userProfile={userProfile} onProfileClick={handleProfileClick} onLogoClick={handleLogoClick} />}

          <main className="container" style={showSearch || showProfile ? { paddingTop: '0' } : {}}>
            {showSearch ? renderSearchPage() :
              showProfile ? null :
              activeSection === 'home' ? renderHomePage() :
              activeSection === 'animes' ? renderAnimesPage() :
              activeSection === 'tv' ? renderTVPage() :
              activeSection === 'favorites' ? renderFavoritesPage() :
              activeSection === 'menu' ? renderMenuPage() :
              renderHomePage()}
          </main>

          {!showSearch && !showProfile && <BottomNav activeSection={activeSection} setActiveSection={(section) => {
            navigateTo(section)
            setShowSearch(false)
            setSearchQuery('')
            setSearchResults([])
            setActiveSearchFilter('Tudo')
          }} />}

          {showProfile && (
            <ProfilePage
              userProfile={userProfile}
              favorites={favorites}
              onPlay={handlePlay}
              onSave={handleSaveProfile}
              onLogout={handleLogout}
              onClose={() => setShowProfile(false)}
              mode={profileMode}
              onRemoveFavorite={removeFavorite}
            />
          )}
          {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
          {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
        </>
      )}
    </>
  )
}
