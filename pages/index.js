import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'

// Define a função debounce para limitar chamadas de API
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
  const [favorites, setFavorites] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSection, setActiveSection] = useState('releases')
  const [searchActive, setSearchActive] = useState(false)
  const [toasts, setToasts] = useState([])

  const searchInputRef = useRef(null)
  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const DEFAULT_POSTER = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'

  const getItemKey = (item) => `${item.media_type}-${item.id}`

  // Sistema de Toast Notifications
  const showToast = (message, type = 'info') => {
    const id = Date.now()
    const toast = { id, message, type }
    setToasts([toast])
    setTimeout(() => {
      removeToast(id)
    }, 3000)
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  useEffect(() => {
    loadHomeContent()
    loadFavorites()
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
  
  const fetchSearchResults = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      setLoading(false)
      return
    }
    setLoading(true)
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
      showToast('Erro na busca em tempo real', 'error')
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const debouncedSearch = useDebounce(fetchSearchResults, 300)

  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    if (query.trim() === '') {
        setSearchResults([])
        setLoading(false)
        return
    }
    setLoading(true)
    debouncedSearch(query)
  }

  const loadHomeContent = async () => { 
    try {
      const [moviesResponse, tvResponse, popularMoviesResponse, popularTvResponse] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`),
        fetch(`https://api.themoviedb.org/3/tv/on_the_air?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`),
        fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`),
        fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`)
      ])
      const moviesData = await moviesResponse.json()
      const tvData = await tvResponse.json()
      const popularMoviesData = await popularMoviesResponse.json()
      const popularTvData = await popularTvResponse.json()

      const allReleases = [
        ...(moviesData.results || []).map(item => ({...item, media_type: 'movie'})),
        ...(tvData.results || []).map(item => ({...item, media_type: 'tv'}))
      ]
        .filter(item => item.poster_path)
        .sort((a, b) => new Date(b.release_date || b.first_air_date) - new Date(a.release_date || a.first_air_date))
        .slice(0, 15)

      const allPopular = [
        ...(popularMoviesData.results || []).map(item => ({...item, media_type: 'movie'})),
        ...(popularTvData.results || []).map(item => ({...item, media_type: 'tv'}))
      ]
        .filter(item => item.poster_path)
        .sort(() => 0.5 - Math.random())
        .slice(0, 15)

      setReleases(allReleases)
      setRecommendations(allPopular)
    } catch (error) {
      console.error('Erro ao carregar conteúdo:', error)
    }
  }

  const loadFavorites = () => {
    try {
      const savedFavorites = localStorage.getItem('yoshikawaFavorites')
      const initialFavorites = savedFavorites ? JSON.parse(savedFavorites) : []
      setFavorites(initialFavorites)
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error)
      setFavorites([])
    }
  }
  
  const isFavorite = (item) => {
    return favorites.some(fav => fav.id === item.id && fav.media_type === item.media_type);
  }

  const toggleFavorite = (item) => {
    setFavorites(prevFavorites => {
      let newFavorites
      const wasFavorite = isFavorite(item)
      if (wasFavorite) {
        newFavorites = prevFavorites.filter(fav => getItemKey(fav) !== getItemKey(item))
        showToast('Removido dos favoritos', 'info')
      } else {
        const favoriteItem = {
          id: item.id,
          media_type: item.media_type,
          title: item.title || item.name,
          poster_path: item.poster_path,
          release_date: item.release_date,
          first_air_date: item.first_air_date,
          overview: item.overview
        }
        newFavorites = [...prevFavorites, favoriteItem]
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
  
  const handleSearchSubmit = () => {
    if (searchInputRef.current) {
      const query = searchInputRef.current.value.trim()
      if (query) debouncedSearch(query)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearchSubmit()
  }

  const getActiveItems = () => {
    switch (activeSection) {
      case 'releases': return releases
      case 'recommendations': return recommendations
      case 'favorites': return favorites
      default: return releases
    }
  }
  
  const getActiveSectionDetails = () => {
    switch (activeSection) {
      case 'releases': return { title: 'Lançamentos', icon: 'fas fa-film' }
      case 'recommendations': return { title: 'Populares', icon: 'fas fa-fire' }
      case 'favorites': return { title: 'Favoritos', icon: 'fas fa-heart' }
      default: return { title: 'Conteúdo', icon: 'fas fa-tv' }
    }
  }
  
  const { title: pageTitle, icon: pageIcon } = getActiveSectionDetails()

  // Componentes Internos
  const ContentGrid = ({ items, isFavorite, toggleFavorite, extraClass = '' }) => (
    <div className={`content-grid ${extraClass}`}>
      {items.length > 0 ? (
        items.map(item => {
          const isFav = isFavorite(item)
          return (
            <Link key={getItemKey(item)} href={`/${item.media_type}/${item.id}`} className="content-card">
              <img 
                src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : DEFAULT_POSTER} 
                alt={item.title || item.name}
                className="content-poster"
                loading="lazy"
              />
              <button 
                className={`favorite-btn ${isFav ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(item) }}
              >
                <i className={isFav ? 'fas fa-heart' : 'far fa-heart'}></i>
              </button>
              <div className="floating-text-wrapper">
                <div className="content-title-card">{item.title || item.name}</div>
                <div className="content-year">
                  {item.release_date ? new Date(item.release_date).getFullYear() : 
                   item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A'}
                </div>
              </div>
            </Link>
          )
        })
      ) : (
        <div className="no-content" style={{padding: '2rem', textAlign: 'center', color: '#888', width: '100%', gridColumn: '1 / -1'}}>
          {activeSection === 'favorites' ? 'Nenhum favorito adicionado ainda.' : 'Nenhum conteúdo disponível.'}
        </div>
      )}
    </div>
  )

  const ToastContainer = () => (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type} show`}>
          <div className="toast-content">{toast.message}</div>
        </div>
      ))}
    </div>
  )

  return (
    <>
      <Head>
        <title>Yoshikawa Player</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>

      <header className="github-header">
        <div className="header-content">
          <Link href="/" className="logo-container">
            <img src="https://yoshikawa-bot.github.io/cache/images/14c34900.jpg" alt="Logo" className="logo-image" />
            <div className="logo-text">
              <span className="logo-name">Yoshikawa</span>
              <span className="beta-tag">STREAMING</span>
            </div>
          </Link>
        </div>
      </header>
      
      <ToastContainer />

      <main className="container">
        {loading && !searchActive && <div className="loading">Carregando...</div>}
        {searchActive ? (
            <div className="live-search-results">
                <h1 className="page-title-home"><i className="fas fa-search"></i> Resultados</h1>
                <ContentGrid items={searchResults} isFavorite={isFavorite} toggleFavorite={toggleFavorite} />
            </div>
        ) : (
            <div className="home-sections">
                <h1 className="page-title-home"><i className={pageIcon}></i> {pageTitle}</h1>
                <section className="section">
                    <ContentGrid items={getActiveItems()} isFavorite={isFavorite} toggleFavorite={toggleFavorite} />
                </section>
            </div>
        )}
      </main>

      <div className="bottom-nav-container">
        <div className={`main-nav-bar ${searchActive ? 'search-active' : ''}`}>
          {!searchActive ? (
            <>
              <button className={`nav-item ${activeSection === 'releases' ? 'active' : ''}`} onClick={() => setActiveSection('releases')}>
                <i className="fas fa-film"></i><span>Lançamentos</span>
              </button>
              <button className={`nav-item ${activeSection === 'recommendations' ? 'active' : ''}`} onClick={() => setActiveSection('recommendations')}>
                <i className="fas fa-fire"></i><span>Populares</span>
              </button>
              <button className={`nav-item ${activeSection === 'favorites' ? 'active' : ''}`} onClick={() => setActiveSection('favorites')}>
                <i className="fas fa-heart"></i><span>Favoritos</span>
              </button>
            </>
          ) : (
            <input 
                ref={searchInputRef}
                type="text"
                className="search-input-expanded" 
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyPress={handleKeyPress}
            />
          )}
        </div>
        <button className={`search-circle ${searchActive ? 'active' : ''}`} onClick={() => setSearchActive(!searchActive)}>
          <i className={searchActive ? "fas fa-times" : "fas fa-search"}></i>
        </button>
      </div>

      <style jsx global>{`
        /* --- CONFIGURAÇÕES SOLICITADAS --- */
        
        :root {
            --primary: #ffffff;
            --background: #000000; /* Preto absoluto */
            --text: #ffffff;
            --secondary: #888888;
        }

        body {
          margin: 0;
          padding: 0;
          background-color: var(--background) !important; /* Garante fundo preto */
          color: var(--text);
          font-family: 'Inter', sans-serif;
        }

        .github-header {
            position: relative;
            width: 100%;
            /* Imagem por trás do cabeçalho na proporção original */
            background-image: url('https://yoshikawa-bot.github.io/cache/images/e2fcc30e.jpg');
            background-size: contain; 
            background-repeat: no-repeat;
            background-position: center top;
            padding: 60px 0; /* Espaçamento para dar altura ao header */
            border-bottom: 1px solid rgba(255,255,255,0.1);
            background-color: #000000;
        }

        /* Mantém o conteúdo do logo legível sobre a imagem */
        .header-content {
            position: relative;
            z-index: 2;
            display: flex;
            align-items: center;
            padding: 0 20px;
            background: linear-gradient(to right, rgba(0,0,0,0.7), transparent);
            height: 100%;
        }

        /* --- ESTILOS ADICIONAIS --- */

        .container { padding: 20px 16px 120px 16px; }
        
        .content-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 15px;
        }

        @media (max-width: 768px) {
            .content-grid { grid-template-columns: repeat(2, 1fr); }
            .github-header { padding: 40px 0; }
        }

        .content-card {
           position: relative;
           border-radius: 12px;
           overflow: hidden;
           background: #111;
           transition: transform 0.2s;
        }

        .content-card:hover { transform: scale(1.02); }

        .content-poster {
           width: 100%;
           aspect-ratio: 2/3;
           object-fit: cover;
           display: block;
        }

        .floating-text-wrapper {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 10px;
            background: linear-gradient(transparent, rgba(0,0,0,0.9));
        }

        .content-title-card { font-size: 0.9rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .content-year { font-size: 0.75rem; color: #aaa; }

        .logo-container { display: flex; align-items: center; text-decoration: none; color: white; gap: 12px; }
        .logo-image { width: 40px; height: 40px; border-radius: 8px; }
        .logo-name { font-weight: 700; font-size: 1.2rem; display: block; }
        .beta-tag { font-size: 0.6rem; background: #e50914; padding: 2px 6px; border-radius: 4px; font-weight: 900; }

        .page-title-home { font-size: 1.4rem; margin: 20px 0; display: flex; align-items: center; gap: 10px; }

        /* Bottom Nav */
        .bottom-nav-container {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 100;
            width: 90%;
            max-width: 500px;
        }

        .main-nav-bar {
            background: rgba(20, 20, 20, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 30px;
            padding: 8px 15px;
            display: flex;
            flex: 1;
            justify-content: space-around;
            border: 1px solid rgba(255,255,255,0.1);
        }

        .nav-item {
            background: none;
            border: none;
            color: #888;
            display: flex;
            flex-direction: column;
            align-items: center;
            font-size: 0.7rem;
            cursor: pointer;
        }

        .nav-item.active { color: white; }
        .nav-item i { font-size: 1.1rem; margin-bottom: 3px; }

        .search-circle {
            width: 55px;
            height: 55px;
            border-radius: 50%;
            background: white;
            color: black;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
            cursor: pointer;
        }

        .search-input-expanded {
            background: transparent;
            border: none;
            color: white;
            width: 100%;
            outline: none;
            font-size: 1rem;
        }

        .favorite-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.5);
            border: none;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            z-index: 5;
        }
        .favorite-btn.active { color: #ff4757; }
      `}</style>
    </>
  )
}

const Header = () => null; // Removido pois já está no corpo principal
