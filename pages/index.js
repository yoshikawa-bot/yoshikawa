import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'

const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null)
  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }, [callback, delay])
}

export default function Home() {
  const [releases, setReleases] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [trending, setTrending] = useState([])
  const [topRated, setTopRated] = useState([])
  const [movies, setMovies] = useState({})
  const [series, setSeries] = useState({})
  const [favorites, setFavorites] = useState([])
  const [watchlist, setWatchlist] = useState([])
  const [continueWatching, setContinueWatching] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('home')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [heroContent, setHeroContent] = useState(null)
  const [toasts, setToasts] = useState([])

  const searchInputRef = useRef(null)
  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const DEFAULT_POSTER = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'

  const getItemKey = (item) => `${item.media_type}-${item.id}`

  const showToast = (message, type = 'info') => {
    const id = Date.now()
    const newToast = { id, message, type }
    setToasts(prev => [...prev, newToast])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3500)
  }

  useEffect(() => {
    loadAllContent()
    loadFavorites()
    loadWatchlist()
    loadContinueWatching()
    
    const handleResize = () => {
      if (window.innerWidth < 1024) setIsSidebarOpen(false)
      else setIsSidebarOpen(true)
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const loadAllContent = async () => {
    setLoading(true)
    try {
      const [
        nowPlayingRes,
        onAirRes,
        popularMoviesRes,
        popularTvRes,
        trendingRes,
        topRatedMoviesRes,
        topRatedTvRes
      ] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`),
        fetch(`https://api.themoviedb.org/3/tv/on_the_air?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`),
        fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`),
        fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`),
        fetch(`https://api.themoviedb.org/3/trending/all/week?api_key=${TMDB_API_KEY}&language=pt-BR`),
        fetch(`https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`),
        fetch(`https://api.themoviedb.org/3/tv/top_rated?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`)
      ])

      const nowPlaying = await nowPlayingRes.json()
      const onAir = await onAirRes.json()
      const popularMovies = await popularMoviesRes.json()
      const popularTv = await popularTvRes.json()
      const trendingData = await trendingRes.json()
      const topRatedMovies = await topRatedMoviesRes.json()
      const topRatedTv = await topRatedTvRes.json()

      const allReleases = [
        ...(nowPlaying.results || []).map(item => ({...item, media_type: 'movie'})),
        ...(onAir.results || []).map(item => ({...item, media_type: 'tv'}))
      ].filter(item => item.poster_path).slice(0, 20)

      const allPopular = [
        ...(popularMovies.results || []).map(item => ({...item, media_type: 'movie'})),
        ...(popularTv.results || []).map(item => ({...item, media_type: 'tv'}))
      ].filter(item => item.poster_path).slice(0, 20)

      const allTrending = (trendingData.results || [])
        .filter(item => item.poster_path && item.backdrop_path)
        .slice(0, 20)

      const allTopRated = [
        ...(topRatedMovies.results || []).map(item => ({...item, media_type: 'movie'})),
        ...(topRatedTv.results || []).map(item => ({...item, media_type: 'tv'}))
      ].filter(item => item.poster_path).slice(0, 20)

      const moviesList = (nowPlaying.results || [])
        .map(item => ({...item, media_type: 'movie'}))
        .filter(item => item.poster_path)
        .slice(0, 20)

      const seriesList = (onAir.results || [])
        .map(item => ({...item, media_type: 'tv'}))
        .filter(item => item.poster_path)
        .slice(0, 20)

      const popularMoviesList = (popularMovies.results || [])
        .map(item => ({...item, media_type: 'movie'}))
        .filter(item => item.poster_path)
        .slice(0, 20)

      const popularSeriesList = (popularTv.results || [])
        .map(item => ({...item, media_type: 'tv'}))
        .filter(item => item.poster_path)
        .slice(0, 20)

      const topRatedMoviesList = (topRatedMovies.results || [])
        .map(item => ({...item, media_type: 'movie'}))
        .filter(item => item.poster_path)
        .slice(0, 20)

      const topRatedSeriesList = (topRatedTv.results || [])
        .map(item => ({...item, media_type: 'tv'}))
        .filter(item => item.poster_path)
        .slice(0, 20)

      setReleases(allReleases)
      setRecommendations(allPopular)
      setTrending(allTrending)
      setTopRated(allTopRated)
      
      setMovies({
        nowPlaying: moviesList,
        popular: popularMoviesList,
        topRated: topRatedMoviesList
      })

      setSeries({
        onAir: seriesList,
        popular: popularSeriesList,
        topRated: topRatedSeriesList
      })

      if (allTrending.length > 0) {
        setHeroContent(allTrending[0])
      }

    } catch (error) {
      showToast('Falha ao conectar com o servidor', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadFavorites = () => {
    try {
      const saved = localStorage.getItem('yoshikawaFavorites')
      setFavorites(saved ? JSON.parse(saved) : [])
    } catch (error) {
      setFavorites([])
    }
  }

  const loadWatchlist = () => {
    try {
      const saved = localStorage.getItem('yoshikawaWatchlist')
      setWatchlist(saved ? JSON.parse(saved) : [])
    } catch (error) {
      setWatchlist([])
    }
  }

  const loadContinueWatching = () => {
    try {
      const saved = localStorage.getItem('yoshikawaContinueWatching')
      setContinueWatching(saved ? JSON.parse(saved) : [])
    } catch (error) {
      setContinueWatching([])
    }
  }

  const isFavorite = (item) => favorites.some(fav => fav.id === item.id)
  const isInWatchlist = (item) => watchlist.some(w => w.id === item.id)

  const toggleFavorite = (item, e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    setFavorites(prev => {
      const exists = prev.some(fav => getItemKey(fav) === getItemKey(item))
      let newFavorites
      
      if (exists) {
        newFavorites = prev.filter(fav => getItemKey(fav) !== getItemKey(item))
        showToast('Removido dos favoritos', 'info')
      } else {
        newFavorites = [...prev, item]
        showToast('Adicionado aos favoritos', 'success')
      }
      localStorage.setItem('yoshikawaFavorites', JSON.stringify(newFavorites))
      return newFavorites
    })
  }

  const toggleWatchlist = (item, e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    setWatchlist(prev => {
      const exists = prev.some(w => getItemKey(w) === getItemKey(item))
      let newWatchlist
      
      if (exists) {
        newWatchlist = prev.filter(w => getItemKey(w) !== getItemKey(item))
        showToast('Removido da biblioteca', 'info')
      } else {
        newWatchlist = [...prev, item]
        showToast('Salvo na biblioteca', 'success')
      }
      localStorage.setItem('yoshikawaWatchlist', JSON.stringify(newWatchlist))
      return newWatchlist
    })
  }

  const fetchSearchResults = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      setSearchLoading(false)
      return
    }
    
    setSearchLoading(true)
    
    try {
      const [moviesResponse, tvResponse] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR&page=1`),
        fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR&page=1`)
      ])

      const moviesData = await moviesResponse.json()
      const tvData = await tvResponse.json()

      const allResults = [
        ...(moviesData.results || []).map(item => ({ ...item, media_type: 'movie' })),
        ...(tvData.results || []).map(item => ({ ...item, media_type: 'tv' }))
      ].filter(item => item.poster_path)
       .sort((a, b) => b.popularity - a.popularity)
       .slice(0, 30)

      setSearchResults(allResults)
    } catch (error) {
      showToast('Erro na pesquisa', 'error')
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const debouncedSearch = useDebounce(fetchSearchResults, 300)

  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    if (query.trim() === '') {
      setSearchResults([])
      setSearchLoading(false)
      return
    }
    setSearchLoading(true)
    debouncedSearch(query)
  }

  const YouTubeCard = ({ item, isHero = false }) => {
    const [hover, setHover] = useState(false)

    if (isHero) return (
      <div className="yt-hero-container">
        <div className="yt-hero-backdrop">
          <img src={`https://image.tmdb.org/t/p/original${item.backdrop_path}`} alt="" />
          <div className="yt-hero-gradient"></div>
        </div>
        <div className="yt-hero-content">
          <div className="yt-chip-hero">Em alta</div>
          <h1>{item.title || item.name}</h1>
          <div className="yt-meta-row">
            <span>{item.vote_average?.toFixed(1)} <i className="fas fa-star" style={{fontSize: '10px'}}></i></span>
            <span className="dot">•</span>
            <span>{new Date(item.release_date || item.first_air_date).getFullYear()}</span>
            <span className="dot">•</span>
            <span>{item.media_type === 'movie' ? 'Filme' : 'Série'}</span>
          </div>
          <p className="yt-desc">{item.overview}</p>
          <div className="yt-actions">
            <Link href={`/${item.media_type}/${item.id}`} className="yt-btn-primary">
              <i className="fas fa-play"></i> Assistir
            </Link>
            <button className="yt-btn-secondary" onClick={(e) => toggleWatchlist(item, e)}>
              <i className={`fas fa-${isInWatchlist(item) ? 'check' : 'plus'}`}></i> Minha Lista
            </button>
          </div>
        </div>
      </div>
    )

    return (
      <Link href={`/${item.media_type}/${item.id}`}>
        <div 
          className="yt-video-card"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          <div className="yt-thumbnail-container">
            <img 
              src={item.backdrop_path ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}` : `https://image.tmdb.org/t/p/w500${item.poster_path}`} 
              className="yt-thumbnail"
              alt=""
            />
            <div className="yt-duration">HD</div>
            {hover && <div className="yt-hover-overlay"><i className="fas fa-play"></i></div>}
          </div>
          <div className="yt-details">
            <div className="yt-avatar">
              <img src={item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : DEFAULT_POSTER} alt="" />
            </div>
            <div className="yt-text-info">
              <h3 className="yt-title">{item.title || item.name}</h3>
              <div className="yt-channel-name">
                {item.media_type === 'movie' ? 'Cinema' : 'TV Show'}
                <i className="fas fa-check-circle verified"></i>
              </div>
              <div className="yt-meta-line">
                {item.vote_average?.toFixed(1)} avaliações <span className="dot">•</span> {new Date(item.release_date || item.first_air_date).getFullYear()}
              </div>
            </div>
            <div className="yt-menu-dots">
              <button onClick={(e) => toggleFavorite(item, e)}>
                <i className={`fa${isFavorite(item) ? 's' : 'r'} fa-heart`}></i>
              </button>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  const ChipBar = () => (
    <div className="yt-chips-wrapper">
      <div className="yt-chips-scroll">
        {['Tudo', 'Ao vivo', 'Filmes', 'Séries', 'Jogos', 'Notícias', 'Esportes', 'Podcasts', 'Mixes'].map((chip, i) => (
          <button key={i} className={`yt-chip ${i === 0 ? 'active' : ''}`}>
            {chip}
          </button>
        ))}
      </div>
    </div>
  )

  const Sidebar = () => (
    <aside className={`yt-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
      <div className="yt-nav-section">
        <button className={`yt-nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <i className={`fas fa-home ${activeTab === 'home' ? '' : 'outlined'}`}></i>
          <span>Início</span>
        </button>
        <button className={`yt-nav-item ${activeTab === 'series' ? 'active' : ''}`} onClick={() => setActiveTab('series')}>
          <i className="fas fa-film"></i>
          <span>Shorts</span>
        </button>
        <button className={`yt-nav-item ${activeTab === 'movies' ? 'active' : ''}`} onClick={() => setActiveTab('movies')}>
          <i className="fab fa-youtube"></i>
          <span>Inscrições</span>
        </button>
      </div>
      <div className="yt-divider"></div>
      <div className="yt-nav-section">
        <div className="yt-section-title">Você <i className="fas fa-chevron-right" style={{fontSize: '12px', marginLeft: '6px'}}></i></div>
        <button className={`yt-nav-item ${activeTab === 'mylist' ? 'active' : ''}`} onClick={() => setActiveTab('mylist')}>
          <i className="fas fa-history"></i>
          <span>Histórico</span>
        </button>
        <button className={`yt-nav-item ${activeTab === 'favorites' ? 'active' : ''}`} onClick={() => setActiveTab('favorites')}>
          <i className="fas fa-list-ul"></i>
          <span>Playlists</span>
        </button>
        <button className="yt-nav-item">
          <i className="fas fa-clock"></i>
          <span>Assistir mais tarde</span>
        </button>
        <button className="yt-nav-item">
          <i className="fas fa-thumbs-up"></i>
          <span>Vídeos com "Gostei"</span>
        </button>
      </div>
    </aside>
  )

  const GridContent = ({ items }) => (
    <div className="yt-grid">
      {items.map(item => <YouTubeCard key={getItemKey(item)} item={item} />)}
    </div>
  )

  return (
    <div className="yt-app">
      <Head>
        <title>YouTube 2026 Clone</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>

      <header className="yt-header">
        <div className="yt-header-start">
          <button className="yt-icon-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <i className="fas fa-bars"></i>
          </button>
          <div className="yt-logo" onClick={() => setActiveTab('home')}>
            <div className="yt-logo-icon"><i className="fas fa-play"></i></div>
            <span>YouTube</span>
            <span className="yt-country">BR</span>
          </div>
        </div>

        <div className="yt-header-center">
          <div className="yt-search-container">
            <div className={`yt-search-box ${searchQuery ? 'has-text' : ''}`}>
              <div className="yt-search-focus-icon"><i className="fas fa-search"></i></div>
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Pesquisar" 
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {searchQuery && (
                <button className="yt-clear-btn" onClick={() => setSearchQuery('')}>
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
            <button className="yt-search-btn">
              <i className="fas fa-search"></i>
              <div className="yt-tooltip">Pesquisar</div>
            </button>
          </div>
          <button className="yt-mic-btn">
            <i className="fas fa-microphone"></i>
          </button>
        </div>

        <div className="yt-header-end">
          <button className="yt-icon-btn"><i className="fas fa-video"></i></button>
          <button className="yt-icon-btn"><i className="far fa-bell"></i></button>
          <div className="yt-avatar-btn">Y</div>
        </div>
      </header>

      <div className="yt-body">
        <Sidebar />
        
        <main className={`yt-main ${isSidebarOpen ? 'shifted' : ''}`}>
          <ChipBar />
          
          <div className="yt-content-scroll">
            {searchQuery ? (
              <div className="yt-container">
                {searchLoading ? (
                   <div className="yt-loading"></div>
                ) : (
                  <GridContent items={searchResults} />
                )}
              </div>
            ) : (
              <div className="yt-container">
                {activeTab === 'home' && (
                  <>
                    {heroContent && <YouTubeCard item={heroContent} isHero={true} />}
                    <GridContent items={[...trending, ...releases, ...recommendations]} />
                  </>
                )}
                {activeTab === 'movies' && <GridContent items={[...(movies.nowPlaying || []), ...(movies.popular || [])]} />}
                {activeTab === 'series' && <GridContent items={[...(series.onAir || []), ...(series.popular || [])]} />}
                {activeTab === 'mylist' && <GridContent items={watchlist} />}
                {activeTab === 'favorites' && <GridContent items={favorites} />}
              </div>
            )}
          </div>
        </main>
      </div>

      <div className="yt-toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className="yt-toast">
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      <style jsx global>{`
        :root {
          --yt-bg: #0f0f0f;
          --yt-raised: #282828;
          --yt-border: #303030;
          --yt-text: #f1f1f1;
          --yt-text-sec: #aaaaaa;
          --yt-brand: #ff0000;
          --yt-hover: #3f3f3f;
          --yt-search-bg: #121212;
          --yt-font: 'Roboto', sans-serif;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
          background-color: var(--yt-bg);
          color: var(--yt-text);
          font-family: var(--yt-font);
          overflow: hidden;
        }

        /* Header */
        .yt-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          background: var(--yt-bg);
          z-index: 1000;
        }

        .yt-header-start, .yt-header-end {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .yt-icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: transparent;
          color: var(--yt-text);
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .yt-icon-btn:hover { background: var(--yt-raised); }

        .yt-logo {
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          padding-left: 16px;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .yt-logo-icon {
          color: var(--yt-brand);
          font-size: 24px;
        }

        .yt-country {
          font-size: 10px;
          color: var(--yt-text-sec);
          margin-top: -10px;
          margin-left: 2px;
        }

        /* Search */
        .yt-header-center {
          flex: 0 1 732px;
          display: flex;
          align-items: center;
          gap: 16px;
          margin-left: 40px;
        }

        .yt-search-container {
          display: flex;
          align-items: center;
          flex: 1;
        }

        .yt-search-box {
          flex: 1;
          display: flex;
          align-items: center;
          background: var(--yt-search-bg);
          border: 1px solid var(--yt-border);
          border-right: none;
          border-radius: 40px 0 0 40px;
          padding: 0 4px 0 16px;
          height: 40px;
          position: relative;
        }

        .yt-search-focus-icon { display: none; margin-right: 12px; color: var(--yt-text); }
        .yt-search-box:focus-within { border-color: #1c62b9; margin-left: 0; }
        .yt-search-box:focus-within .yt-search-focus-icon { display: block; }

        .yt-search-box input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--yt-text);
          font-size: 16px;
          height: 100%;
          outline: none;
          font-family: var(--yt-font);
        }

        .yt-search-btn {
          height: 40px;
          width: 64px;
          background: var(--yt-raised);
          border: 1px solid var(--yt-border);
          border-radius: 0 40px 40px 0;
          color: var(--yt-text);
          cursor: pointer;
          position: relative;
        }

        .yt-search-btn:hover { background: var(--yt-hover); }

        .yt-mic-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: var(--yt-search-bg);
          color: var(--yt-text);
          cursor: pointer;
        }
        .yt-mic-btn:hover { background: var(--yt-raised); }

        .yt-clear-btn {
          background: transparent;
          border: none;
          color: var(--yt-text);
          cursor: pointer;
          padding: 8px;
        }

        .yt-avatar-btn {
          width: 32px;
          height: 32px;
          background: #5c6bc0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          margin-left: 8px;
        }

        /* Layout */
        .yt-body {
          display: flex;
          height: calc(100vh - 56px);
          margin-top: 56px;
        }

        .yt-sidebar {
          width: 72px;
          background: var(--yt-bg);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          padding: 4px;
          transition: width 0.1s;
        }

        .yt-sidebar.open { width: 240px; padding: 12px; }

        .yt-nav-section { padding-bottom: 12px; }
        .yt-divider { height: 1px; background: var(--yt-border); margin: 12px 0; }

        .yt-section-title {
          padding: 6px 12px;
          font-size: 16px;
          font-weight: 700;
          display: flex;
          align-items: center;
        }

        .yt-nav-item {
          display: flex;
          align-items: center;
          width: 100%;
          height: 40px;
          padding: 0 12px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: var(--yt-text);
          cursor: pointer;
          gap: 24px;
          font-family: var(--yt-font);
        }

        .yt-nav-item:hover { background: var(--yt-raised); }
        .yt-nav-item.active { background: var(--yt-raised); font-weight: 500; }
        .yt-nav-item.active i { color: var(--yt-text); }
        
        .yt-sidebar:not(.open) .yt-nav-item {
          flex-direction: column;
          gap: 4px;
          height: 72px;
          padding: 16px 0;
          font-size: 10px;
          border-radius: 10px;
        }
        
        .yt-sidebar:not(.open) .yt-nav-item i { font-size: 24px; margin-bottom: 6px; }
        .yt-sidebar:not(.open) .yt-section-title, 
        .yt-sidebar:not(.open) .yt-divider { display: none; }

        .yt-nav-item i { font-size: 20px; width: 24px; text-align: center; }

        /* Main Content */
        .yt-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .yt-chips-wrapper {
          height: 56px;
          display: flex;
          align-items: center;
          background: var(--yt-bg);
          width: 100%;
          border-bottom: 1px solid transparent;
          z-index: 10;
        }

        .yt-chips-scroll {
          display: flex;
          gap: 12px;
          padding: 0 24px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .yt-chips-scroll::-webkit-scrollbar { display: none; }

        .yt-chip {
          padding: 0 12px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: var(--yt-raised);
          color: var(--yt-text);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: 0.2s;
          font-family: var(--yt-font);
        }

        .yt-chip:hover { background: var(--yt-hover); }
        .yt-chip.active { background: var(--yt-text); color: var(--yt-bg); }

        .yt-content-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .yt-container {
          max-width: 2200px;
          margin: 0 auto;
        }

        /* Grid System */
        .yt-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          column-gap: 16px;
          row-gap: 40px;
        }

        /* Video Card */
        .yt-video-card {
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .yt-thumbnail-container {
          position: relative;
          width: 100%;
          padding-top: 56.25%; /* 16:9 Aspect Ratio */
          border-radius: 12px;
          overflow: hidden;
          background: #202020;
        }

        .yt-thumbnail {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          object-fit: cover;
        }

        .yt-duration {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 1px 4px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .yt-hover-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          color: white;
        }

        .yt-details {
          display: flex;
          gap: 12px;
          padding-right: 24px;
          position: relative;
        }

        .yt-avatar img {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
        }

        .yt-text-info {
          display: flex;
          flex-direction: column;
        }

        .yt-title {
          font-size: 16px;
          font-weight: 500;
          line-height: 22px;
          margin-bottom: 4px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          color: var(--yt-text);
        }

        .yt-channel-name {
          font-size: 14px;
          color: var(--yt-text-sec);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .yt-channel-name:hover { color: var(--yt-text); }
        .verified { font-size: 12px; }

        .yt-meta-line {
          font-size: 14px;
          color: var(--yt-text-sec);
        }
        
        .yt-menu-dots {
          position: absolute;
          top: 0;
          right: 0;
          opacity: 0;
          transition: 0.2s;
        }
        
        .yt-video-card:hover .yt-menu-dots { opacity: 1; }
        
        .yt-menu-dots button {
          background: transparent;
          border: none;
          color: var(--yt-text);
          cursor: pointer;
          padding: 4px;
        }

        /* Hero */
        .yt-hero-container {
          position: relative;
          height: 400px;
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 40px;
          grid-column: 1 / -1;
        }
        
        .yt-hero-backdrop img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .yt-hero-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, #0f0f0f 0%, rgba(15,15,15,0.8) 40%, transparent 100%);
        }
        
        .yt-hero-content {
          position: absolute;
          top: 0; left: 0; bottom: 0;
          width: 50%;
          padding: 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 16px;
        }
        
        .yt-chip-hero {
          background: var(--yt-brand);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 700;
          width: fit-content;
          text-transform: uppercase;
        }
        
        .yt-hero-content h1 {
          font-size: 40px;
          font-weight: 700;
        }
        
        .yt-meta-row {
          display: flex;
          gap: 8px;
          color: var(--yt-text-sec);
          font-size: 14px;
        }
        
        .yt-desc {
          font-size: 16px;
          color: #e0e0e0;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.5;
        }
        
        .yt-actions {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }
        
        .yt-btn-primary, .yt-btn-secondary {
          padding: 10px 24px;
          border-radius: 24px;
          font-size: 14px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }
        
        .yt-btn-primary { background: var(--yt-text); color: var(--yt-bg); }
        .yt-btn-primary:hover { background: #d9d9d9; }
        
        .yt-btn-secondary { background: rgba(255,255,255,0.1); color: var(--yt-text); }
        .yt-btn-secondary:hover { background: rgba(255,255,255,0.2); }

        /* Toast */
        .yt-toast-container {
          position: fixed;
          bottom: 24px;
          left: 24px;
          z-index: 2000;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .yt-toast {
          background: var(--yt-text);
          color: var(--yt-bg);
          padding: 12px 24px;
          border-radius: 4px;
          font-size: 14px;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .yt-header-center { margin-left: 16px; flex: 1; }
          .yt-mic-btn { display: none; }
        }

        @media (max-width: 768px) {
          .yt-sidebar { display: none; }
          .yt-sidebar.open { position: fixed; height: 100%; z-index: 1200; box-shadow: 5px 0 10px rgba(0,0,0,0.5); }
          .yt-search-box { display: none; }
          .yt-search-btn { background: transparent; border: none; width: 40px; border-radius: 50%; }
          .yt-search-btn:hover { background: var(--yt-raised); }
          .yt-grid { grid-template-columns: 1fr; }
          .yt-hero-container { height: auto; }
          .yt-hero-content { position: relative; width: 100%; padding: 24px; background: linear-gradient(0deg, #0f0f0f 0%, transparent 100%); margin-top: -100px; }
        }
      `}</style>
    </div>
  )
}
