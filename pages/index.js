import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'

// Debounce hook
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
  const [searchActive, setSearchActive] = useState(false)
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
  }, [])

  useEffect(() => {
    if (searchActive && searchInputRef.current) {
      searchInputRef.current.focus()
    }
    if (!searchActive) {
      setSearchResults([])
      setSearchQuery('')
    }
  }, [searchActive])

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
      console.error('Erro ao carregar conteúdo:', error)
      showToast('Erro ao carregar conteúdo', 'error')
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

  const isFavorite = (item) => {
    return favorites.some(fav => fav.id === item.id && fav.media_type === item.media_type)
  }

  const isInWatchlist = (item) => {
    return watchlist.some(w => w.id === item.id && w.media_type === item.media_type)
  }

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
        const favoriteItem = {
          id: item.id,
          media_type: item.media_type,
          title: item.title || item.name,
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
          release_date: item.release_date,
          first_air_date: item.first_air_date,
          overview: item.overview,
          vote_average: item.vote_average
        }
        newFavorites = [...prev, favoriteItem]
        showToast('Adicionado aos favoritos!', 'success')
      }
      
      try {
        localStorage.setItem('yoshikawaFavorites', JSON.stringify(newFavorites))
      } catch (error) {
        console.error('Erro ao salvar favoritos:', error)
      }

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
        showToast('Removido da lista', 'info')
      } else {
        const watchlistItem = {
          id: item.id,
          media_type: item.media_type,
          title: item.title || item.name,
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
          release_date: item.release_date,
          first_air_date: item.first_air_date,
          overview: item.overview,
          vote_average: item.vote_average
        }
        newWatchlist = [...prev, watchlistItem]
        showToast('Adicionado à lista!', 'success')
      }
      
      try {
        localStorage.setItem('yoshikawaWatchlist', JSON.stringify(newWatchlist))
      } catch (error) {
        console.error('Erro ao salvar watchlist:', error)
      }

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
      console.error('Erro na busca:', error)
      showToast('Erro na busca', 'error')
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const debouncedSearch = useDebounce(fetchSearchResults, 400)

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

  // Components
  const HeroSection = ({ content }) => {
    if (!content) return null

    return (
      <div className="hero-section">
        <div className="hero-backdrop">
          <img 
            src={`https://image.tmdb.org/t/p/original${content.backdrop_path}`} 
            alt={content.title || content.name}
          />
          <div className="hero-gradient"></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <i className="fas fa-fire"></i>
            <span>Em Alta</span>
          </div>
          <h1 className="hero-title">{content.title || content.name}</h1>
          <div className="hero-meta">
            <span className="hero-rating">
              <i className="fas fa-star"></i>
              {content.vote_average ? content.vote_average.toFixed(1) : 'N/A'}
            </span>
            <span className="hero-year">
              {content.release_date ? new Date(content.release_date).getFullYear() : 
               content.first_air_date ? new Date(content.first_air_date).getFullYear() : 'N/A'}
            </span>
            <span className="hero-type">
              <i className={`fas fa-${content.media_type === 'movie' ? 'film' : 'tv'}`}></i>
              {content.media_type === 'movie' ? 'Filme' : 'Série'}
            </span>
          </div>
          <p className="hero-overview">
            {content.overview || 'Sem descrição disponível.'}
          </p>
          <div className="hero-actions">
            <Link href={`/${content.media_type}/${content.id}`} className="hero-btn hero-btn-play">
              <i className="fas fa-play"></i>
              <span>Assistir</span>
            </Link>
            <button 
              className={`hero-btn hero-btn-secondary ${isInWatchlist(content) ? 'active' : ''}`}
              onClick={(e) => toggleWatchlist(content, e)}
            >
              <i className={`fas fa-${isInWatchlist(content) ? 'check' : 'plus'}`}></i>
              <span>{isInWatchlist(content) ? 'Na Lista' : 'Minha Lista'}</span>
            </button>
            <button 
              className="hero-btn hero-btn-icon"
              onClick={(e) => toggleFavorite(content, e)}
            >
              <i className={`fa${isFavorite(content) ? 's' : 'r'} fa-heart`}></i>
            </button>
          </div>
        </div>
      </div>
    )
  }

  const ContentRow = ({ title, items, icon }) => {
    const scrollRef = useRef(null)

    const scroll = (direction) => {
      if (scrollRef.current) {
        const scrollAmount = direction === 'left' ? -400 : 400
        scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
      }
    }

    if (!items || items.length === 0) return null

    return (
      <div className="content-row-container">
        <div className="content-row-header">
          <h2 className="content-row-title">
            {icon && <i className={icon}></i>}
            {title}
          </h2>
        </div>
        <div className="content-row-wrapper">
          <button className="scroll-btn scroll-btn-left" onClick={() => scroll('left')}>
            <i className="fas fa-chevron-left"></i>
          </button>
          <div className="content-row-scroll" ref={scrollRef}>
            {items.map(item => (
              <ContentCard key={getItemKey(item)} item={item} />
            ))}
          </div>
          <button className="scroll-btn scroll-btn-right" onClick={() => scroll('right')}>
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    )
  }

  const ContentCard = ({ item }) => {
    const [imageLoaded, setImageLoaded] = useState(false)

    return (
      <Link href={`/${item.media_type}/${item.id}`} className="content-card-modern">
        <div className="card-image-wrapper">
          <img 
            src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : DEFAULT_POSTER}
            alt={item.title || item.name}
            className={`card-image ${imageLoaded ? 'loaded' : ''}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
          />
          {!imageLoaded && <div className="card-skeleton"></div>}
          
          <div className="card-overlay">
            <div className="card-overlay-content">
              <h3 className="card-title">{item.title || item.name}</h3>
              <div className="card-info">
                <span className="card-rating">
                  <i className="fas fa-star"></i>
                  {item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}
                </span>
                <span className="card-year">
                  {item.release_date ? new Date(item.release_date).getFullYear() : 
                   item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A'}
                </span>
              </div>
              <div className="card-actions">
                <button 
                  className="card-action-btn"
                  onClick={(e) => toggleWatchlist(item, e)}
                  title={isInWatchlist(item) ? "Remover da lista" : "Adicionar à lista"}
                >
                  <i className={`fas fa-${isInWatchlist(item) ? 'check' : 'plus'}`}></i>
                </button>
                <button 
                  className="card-action-btn"
                  onClick={(e) => toggleFavorite(item, e)}
                  title={isFavorite(item) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                >
                  <i className={`fa${isFavorite(item) ? 's' : 'r'} fa-heart`}></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  const ContentGrid = ({ items }) => {
    if (!items || items.length === 0) {
      return (
        <div className="empty-state">
          <i className="fas fa-ghost"></i>
          <p>Nenhum conteúdo encontrado</p>
        </div>
      )
    }

    return (
      <div className="content-grid-modern">
        {items.map(item => (
          <ContentCard key={getItemKey(item)} item={item} />
        ))}
      </div>
    )
  }

  const SearchView = () => (
    <div className="search-view">
      <div className="search-view-header">
        <div className="search-input-container-full">
          <i className="fas fa-search search-icon-full"></i>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar filmes e séries..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input-full"
            autoFocus
          />
          {searchQuery && (
            <button className="clear-search-full" onClick={() => setSearchQuery('')}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {searchLoading && (
        <div className="search-loading">
          <div className="spinner"></div>
          <p>Buscando...</p>
        </div>
      )}

      {!searchLoading && searchResults.length > 0 && (
        <div className="search-results-grid">
          <ContentGrid items={searchResults} />
        </div>
      )}

      {!searchLoading && searchQuery && searchResults.length === 0 && (
        <div className="empty-state">
          <i className="fas fa-search"></i>
          <p>Nenhum resultado encontrado</p>
          <span>Tente buscar por outro termo</span>
        </div>
      )}

      {!searchLoading && !searchQuery && (
        <div className="empty-state">
          <i className="fas fa-keyboard"></i>
          <p>Comece a digitar</p>
          <span>Busque por filmes e séries</span>
        </div>
      )}
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <>
            <HeroSection content={heroContent} />
            {continueWatching.length > 0 && (
              <ContentRow 
                title="Continue Assistindo" 
                items={continueWatching} 
                icon="fas fa-play-circle"
              />
            )}
            <ContentRow title="Em Alta" items={trending} icon="fas fa-fire" />
            <ContentRow title="Lançamentos" items={releases} icon="fas fa-sparkles" />
            <ContentRow title="Mais Populares" items={recommendations} icon="fas fa-star" />
            <ContentRow title="Melhor Avaliados" items={topRated} icon="fas fa-award" />
          </>
        )
      case 'movies':
        return (
          <>
            <div className="tab-header">
              <h1 className="tab-title">
                <i className="fas fa-film"></i>
                Filmes
              </h1>
            </div>
            {movies.nowPlaying && <ContentRow title="Nos Cinemas" items={movies.nowPlaying} icon="fas fa-ticket-alt" />}
            {movies.popular && <ContentRow title="Populares" items={movies.popular} icon="fas fa-star" />}
            {movies.topRated && <ContentRow title="Melhor Avaliados" items={movies.topRated} icon="fas fa-award" />}
          </>
        )
      case 'series':
        return (
          <>
            <div className="tab-header">
              <h1 className="tab-title">
                <i className="fas fa-tv"></i>
                Séries
              </h1>
            </div>
            {series.onAir && <ContentRow title="No Ar" items={series.onAir} icon="fas fa-satellite-dish" />}
            {series.popular && <ContentRow title="Populares" items={series.popular} icon="fas fa-star" />}
            {series.topRated && <ContentRow title="Melhor Avaliadas" items={series.topRated} icon="fas fa-award" />}
          </>
        )
      case 'mylist':
        return (
          <>
            <div className="tab-header">
              <h1 className="tab-title">
                <i className="fas fa-bookmark"></i>
                Minha Lista
              </h1>
            </div>
            <div className="grid-wrapper">
              {watchlist.length > 0 ? (
                <ContentGrid items={watchlist} />
              ) : (
                <div className="empty-state">
                  <i className="fas fa-bookmark"></i>
                  <p>Sua lista está vazia</p>
                  <span>Adicione filmes e séries que deseja assistir</span>
                </div>
              )}
            </div>
          </>
        )
      case 'favorites':
        return (
          <>
            <div className="tab-header">
              <h1 className="tab-title">
                <i className="fas fa-heart"></i>
                Favoritos
              </h1>
            </div>
            <div className="grid-wrapper">
              {favorites.length > 0 ? (
                <ContentGrid items={favorites} />
              ) : (
                <div className="empty-state">
                  <i className="fas fa-heart"></i>
                  <p>Nenhum favorito ainda</p>
                  <span>Marque seus filmes e séries favoritos</span>
                </div>
              )}
            </div>
          </>
        )
      default:
        return null
    }
  }

  return (
    <>
      <Head>
        <title>Yoshikawa Streaming</title>
        <meta name="description" content="Sua plataforma de streaming definitiva" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>

      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <Link href="/" className="logo" onClick={() => { setSearchActive(false); setActiveTab('home'); }}>
            <img src="https://yoshikawa-bot.github.io/cache/images/14c34900.jpg" alt="Yoshikawa" />
            <span>Yoshikawa</span>
          </Link>

          <button 
            className={`search-trigger ${searchActive ? 'active' : ''}`}
            onClick={() => setSearchActive(!searchActive)}
          >
            <i className={`fas fa-${searchActive ? 'times' : 'search'}`}></i>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {searchActive ? (
          <SearchView />
        ) : (
          <div className="content-wrapper">
            {loading && !heroContent ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Carregando conteúdo...</p>
              </div>
            ) : (
              renderTabContent()
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button 
          className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => { setActiveTab('home'); setSearchActive(false); }}
        >
          <i className="fas fa-home"></i>
          <span>Início</span>
        </button>
        <button 
          className={`nav-btn ${activeTab === 'movies' ? 'active' : ''}`}
          onClick={() => { setActiveTab('movies'); setSearchActive(false); }}
        >
          <i className="fas fa-film"></i>
          <span>Filmes</span>
        </button>
        <button 
          className={`nav-btn ${activeTab === 'series' ? 'active' : ''}`}
          onClick={() => { setActiveTab('series'); setSearchActive(false); }}
        >
          <i className="fas fa-tv"></i>
          <span>Séries</span>
        </button>
        <button 
          className={`nav-btn ${activeTab === 'mylist' ? 'active' : ''}`}
          onClick={() => { setActiveTab('mylist'); setSearchActive(false); }}
        >
          <i className="fas fa-bookmark"></i>
          <span>Lista</span>
        </button>
        <button 
          className={`nav-btn ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => { setActiveTab('favorites'); setSearchActive(false); }}
        >
          <i className="fas fa-heart"></i>
          <span>Favoritos</span>
        </button>
      </nav>

      {/* Toast Notifications - Lateral Esquerda */}
      <div className="toast-container-left">
        {toasts.map((toast, index) => (
          <div 
            key={toast.id} 
            className={`toast-left toast-left-${toast.type}`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <i className={`fas fa-${
              toast.type === 'success' ? 'check-circle' : 
              toast.type === 'error' ? 'exclamation-circle' : 
              'info-circle'
            }`}></i>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :root {
          --primary: #e50914;
          --primary-hover: #f40612;
          --secondary: #564d4d;
          --background: #141414;
          --surface: #1f1f1f;
          --surface-light: #2f2f2f;
          --text-primary: #ffffff;
          --text-secondary: #b3b3b3;
          --border: rgba(255, 255, 255, 0.1);
          --overlay: rgba(0, 0, 0, 0.7);
          --success: #46d369;
          --error: #e87c03;
          --info: #54b4d3;
        }

        html, body {
          overscroll-behavior: none;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--background);
          color: var(--text-primary);
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Header */
        .app-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: rgba(20,20,20,0.98);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .header-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 1.25rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          color: var(--text-primary);
          font-weight: 700;
          font-size: 1.5rem;
          transition: transform 0.2s ease;
        }

        .logo:hover {
          transform: scale(1.05);
        }

        .logo img {
          width: 42px;
          height: 42px;
          border-radius: 8px;
          object-fit: cover;
        }

        .search-trigger {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid var(--border);
          border-radius: 50%;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .search-trigger:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.1);
        }

        .search-trigger.active {
          background: var(--primary);
          border-color: var(--primary);
        }

        .search-trigger i {
          font-size: 1.1rem;
        }

        /* Main */
        .app-main {
          min-height: 100vh;
          padding-top: 85px;
          padding-bottom: 90px;
        }

        .content-wrapper {
          max-width: 1400px;
          margin: 0 auto;
        }

        /* Search View */
        .search-view {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .search-view-header {
          margin-bottom: 2rem;
        }

        .search-input-container-full {
          position: relative;
          max-width: 800px;
          width: 100%;
        }

        .search-icon-full {
          position: absolute;
          left: 1.25rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary);
          pointer-events: none;
          font-size: 1.2rem;
          z-index: 2;
        }

        .search-input-full {
          width: 100%;
          padding: 1.125rem 3.5rem;
          background: rgba(47, 47, 47, 0.95);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 32px;
          color: var(--text-primary);
          font-size: 1.05rem;
          transition: all 0.3s ease;
          font-weight: 400;
        }

        .search-input-full::placeholder {
          color: var(--text-secondary);
          opacity: 0.8;
        }

        .search-input-full:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.4);
          background: rgba(47, 47, 47, 1);
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.05);
        }

        .clear-search-full {
          position: absolute;
          right: 1.125rem;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          z-index: 2;
        }

        .clear-search-full:hover {
          background: rgba(255, 255, 255, 0.2);
          color: var(--text-primary);
          transform: translateY(-50%) scale(1.1);
        }

        .search-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
        }

        .search-results-grid {
          padding-top: 1rem;
        }

        /* Hero Section */
        .hero-section {
          position: relative;
          height: 70vh;
          min-height: 500px;
          max-height: 700px;
          margin-bottom: 2rem;
          overflow: hidden;
        }

        .hero-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }

        .hero-backdrop img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }

        .hero-gradient {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 100%;
          background: linear-gradient(
            180deg,
            rgba(20,20,20,0.4) 0%,
            rgba(20,20,20,0.6) 40%,
            rgba(20,20,20,0.95) 80%,
            rgba(20,20,20,1) 100%
          );
        }

        .hero-content {
          position: relative;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 1.5rem;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding-bottom: 3rem;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--primary);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          width: fit-content;
          margin-bottom: 1rem;
        }

        .hero-title {
          font-size: clamp(1.8rem, 4vw, 3.5rem);
          font-weight: 900;
          margin-bottom: 1rem;
          text-shadow: 2px 2px 10px rgba(0,0,0,0.8);
          max-width: 700px;
          line-height: 1.2;
        }

        .hero-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
          font-size: 0.95rem;
          color: var(--text-secondary);
          flex-wrap: wrap;
        }

        .hero-rating {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          color: #ffd700;
        }

        .hero-type {
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .hero-overview {
          max-width: 600px;
          font-size: 1rem;
          line-height: 1.6;
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
          text-shadow: 1px 1px 5px rgba(0,0,0,0.8);
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .hero-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .hero-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1.75rem;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
        }

        .hero-btn-play {
          background: var(--text-primary);
          color: var(--background);
        }

        .hero-btn-play:hover {
          background: var(--text-secondary);
          transform: scale(1.05);
        }

        .hero-btn-secondary {
          background: rgba(255, 255, 255, 0.2);
          color: var(--text-primary);
          backdrop-filter: blur(10px);
        }

        .hero-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.05);
        }

        .hero-btn-secondary.active {
          background: rgba(255, 255, 255, 0.4);
        }

        .hero-btn-icon {
          background: rgba(255, 255, 255, 0.2);
          color: var(--text-primary);
          min-width: 48px;
          width: 48px;
          height: 48px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          backdrop-filter: blur(10px);
          flex-shrink: 0;
        }

        .hero-btn-icon:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }

        .hero-btn-icon i {
          font-size: 1.2rem;
        }

        /* Content Rows */
        .content-row-container {
          margin-bottom: 2.5rem;
        }

        .content-row-header {
          padding: 0 1.5rem;
          margin-bottom: 1rem;
        }

        .content-row-title {
          font-size: 1.4rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .content-row-wrapper {
          position: relative;
        }

        .scroll-btn {
          position: absolute;
          top: 0;
          bottom: 0;
          background: rgba(20, 20, 20, 0.8);
          border: none;
          width: 50px;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          z-index: 10;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .content-row-wrapper:hover .scroll-btn {
          opacity: 1;
        }

        .scroll-btn-left {
          left: 0;
        }

        .scroll-btn-right {
          right: 0;
        }

        .scroll-btn:hover {
          background: rgba(20, 20, 20, 0.95);
        }

        .content-row-scroll {
          display: flex;
          gap: 0.75rem;
          overflow-x: auto;
          scroll-behavior: smooth;
          scrollbar-width: none;
          padding: 0 1.5rem;
        }

        .content-row-scroll::-webkit-scrollbar {
          display: none;
        }

        /* Content Card */
        .content-card-modern {
          flex: 0 0 200px;
          text-decoration: none;
          color: inherit;
          transition: transform 0.3s ease;
          cursor: pointer;
        }

        .content-card-modern:hover {
          transform: scale(1.05);
          z-index: 5;
        }

        .card-image-wrapper {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          aspect-ratio: 2/3;
          background: var(--surface);
        }

        .card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .card-image.loaded {
          opacity: 1;
        }

        .card-skeleton {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            var(--surface) 0%,
            var(--surface-light) 50%,
            var(--surface) 100%
          );
          background-size: 200% 100%;
          animation: skeleton 1.5s infinite;
        }

        @keyframes skeleton {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .card-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            180deg,
            transparent 0%,
            rgba(0,0,0,0.8) 100%
          );
          opacity: 0;
          transition: opacity 0.3s ease;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 1rem;
        }

        .content-card-modern:hover .card-overlay {
          opacity: 1;
        }

        .card-overlay-content {
          display: flex;
          flex-direction: column;
        }

        .card-title {
          font-size: 0.95rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 0.75rem;
        }

        .card-rating {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: #ffd700;
        }

        .card-actions {
          display: flex;
          gap: 0.5rem;
        }

        .card-action-btn {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
        }

        .card-action-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }

        /* Content Grid */
        .grid-wrapper {
          padding: 0 1.5rem;
        }

        .content-grid-modern {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 1rem;
        }

        /* Tab Header */
        .tab-header {
          padding: 2rem 1.5rem 1rem;
        }

        .tab-title {
          font-size: 2rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        /* Empty State */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
          color: var(--text-secondary);
        }

        .empty-state i {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-state p {
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }

        .empty-state span {
          font-size: 0.95rem;
        }

        /* Loading */
        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 3px solid var(--surface);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-spinner p {
          color: var(--text-secondary);
        }

        /* Bottom Navigation */
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(31, 31, 31, 0.98);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          justify-content: space-around;
          padding: 0.75rem 0;
          z-index: 100;
          backdrop-filter: blur(10px);
        }

        .nav-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
          padding: 0.5rem 1.5rem;
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        .nav-btn i {
          font-size: 1.6rem;
        }

        .nav-btn.active {
          color: var(--text-primary);
        }

        .nav-btn.active i {
          color: var(--primary);
        }

        .nav-btn:hover {
          color: var(--text-primary);
        }

        /* Toast Notifications - Lateral Esquerda */
        .toast-container-left {
          position: fixed;
          left: 1.5rem;
          bottom: 120px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-width: 280px;
        }

        .toast-left {
          background: rgba(31, 31, 31, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 10px;
          padding: 0.875rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          animation: slideInLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .toast-left.removing {
          animation: slideOutLeft 0.3s ease forwards;
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideOutLeft {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(-100%);
          }
        }

        .toast-left i {
          font-size: 1.1rem;
          flex-shrink: 0;
        }

        .toast-left span {
          font-size: 0.9rem;
          font-weight: 500;
          line-height: 1.3;
          color: var(--text-primary);
        }

        .toast-left-success i {
          color: var(--success);
        }

        .toast-left-error i {
          color: var(--error);
        }

        .toast-left-info i {
          color: var(--info);
        }

        /* Responsive */
        @media (min-width: 1024px) {
          .header-content {
            padding: 1.5rem 2rem;
          }

          .logo {
            font-size: 1.65rem;
          }

          .logo img {
            width: 48px;
            height: 48px;
          }

          .search-trigger {
            width: 48px;
            height: 48px;
          }

          .bottom-nav {
            padding: 1rem 0;
          }

          .nav-btn {
            padding: 0.75rem 2.5rem;
          }

          .nav-btn i {
            font-size: 1.8rem;
          }

          .nav-btn span {
            font-size: 0.9rem;
          }
        }

        @media (max-width: 768px) {
          .hero-section {
            height: 55vh;
            min-height: 450px;
            max-height: 550px;
          }

          .hero-content {
            padding-bottom: 2rem;
            padding-left: 1rem;
            padding-right: 1rem;
          }

          .hero-badge {
            font-size: 0.75rem;
            padding: 0.4rem 0.85rem;
          }

          .hero-title {
            font-size: 1.6rem;
            margin-bottom: 0.75rem;
          }

          .hero-meta {
            font-size: 0.85rem;
            gap: 0.75rem;
          }

          .hero-overview {
            font-size: 0.85rem;
            -webkit-line-clamp: 2;
            margin-bottom: 1.25rem;
          }

          .hero-actions {
            gap: 0.75rem;
          }

          .hero-btn {
            font-size: 0.9rem;
            padding: 0.75rem 1.25rem;
          }

          .hero-btn-icon {
            width: 44px;
            height: 44px;
            min-width: 44px;
          }

          .hero-btn-icon i {
            font-size: 1.1rem;
          }

          .content-row-title {
            font-size: 1.2rem;
          }

          .content-card-modern {
            flex: 0 0 140px;
          }

          .content-grid-modern {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          }

          .scroll-btn {
            display: none;
          }

          .tab-title {
            font-size: 1.5rem;
          }

          .nav-btn span {
            font-size: 0.75rem;
          }

          .toast-container-left {
            left: 1rem;
            bottom: 100px;
            max-width: 240px;
          }

          .toast-left {
            padding: 0.75rem 0.875rem;
          }

          .toast-left i {
            font-size: 1rem;
          }

          .toast-left span {
            font-size: 0.85rem;
          }
        }

        @media (max-width: 480px) {
          .hero-section {
            height: 50vh;
            min-height: 400px;
          }

          .hero-content {
            padding-bottom: 1.5rem;
          }

          .hero-badge {
            font-size: 0.7rem;
            padding: 0.35rem 0.75rem;
          }

          .hero-title {
            font-size: 1.35rem;
            margin-bottom: 0.6rem;
          }

          .hero-meta {
            font-size: 0.8rem;
            gap: 0.6rem;
          }

          .hero-overview {
            font-size: 0.8rem;
            -webkit-line-clamp: 2;
            margin-bottom: 1rem;
          }

          .hero-actions {
            flex-wrap: wrap;
            gap: 0.6rem;
          }

          .hero-btn {
            font-size: 0.85rem;
            padding: 0.7rem 1.1rem;
            flex: 1;
            min-width: calc(50% - 0.3rem);
          }

          .hero-btn-play {
            flex: 1 1 100%;
            min-width: 100%;
          }

          .hero-btn-secondary {
            flex: 1;
          }

          .hero-btn-icon {
            width: 40px;
            height: 40px;
            min-width: 40px;
            flex: 0 0 auto;
          }

          .hero-btn-icon i {
            font-size: 1rem;
          }

          .content-card-modern {
            flex: 0 0 120px;
          }

          .content-grid-modern {
            grid-template-columns: repeat(2, 1fr);
          }

          .nav-btn {
            padding: 0.5rem 0.5rem;
          }

          .nav-btn span {
            display: none;
          }

          .toast-container-left {
            left: 0.75rem;
            bottom: 90px;
            max-width: 220px;
          }

          .toast-left {
            padding: 0.65rem 0.75rem;
          }

          .toast-left i {
            font-size: 0.95rem;
          }

          .toast-left span {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </>
  )
}
