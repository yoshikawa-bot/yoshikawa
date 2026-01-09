import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'

// --- Hooks Auxiliares ---
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
  // --- Estados ---
  const [releases, setReleases] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [favorites, setFavorites] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSection, setActiveSection] = useState('releases')
  const [searchActive, setSearchActive] = useState(false) // Controla o Overlay de busca
  const [toasts, setToasts] = useState([])

  const searchInputRef = useRef(null)
  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const DEFAULT_POSTER = 'https://via.placeholder.com/500x750?text=No+Poster' 

  const getItemKey = (item) => `${item.media_type}-${item.id}`

  // --- Toast System ---
  const showToast = (message, type = 'info') => {
    const id = Date.now()
    const toast = { id, message, type }
    setToasts([toast])
    setTimeout(() => removeToast(id), 3000)
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  // --- Efeitos ---
  useEffect(() => {
    loadHomeContent()
    loadFavorites()
  }, [])

  useEffect(() => {
    if (searchActive && searchInputRef.current) {
      // Pequeno delay para garantir que o CSS transition terminou
      setTimeout(() => searchInputRef.current.focus(), 100)
    }
    if (!searchActive) {
        // Limpar busca ao fechar (opcional)
        // setSearchResults([])
        // setSearchQuery('')
    }
  }, [searchActive])

  // --- Lógica de Busca ---
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
      showToast('Erro na busca', 'error')
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

  // --- Carregamento de Dados ---
  const loadHomeContent = async () => { 
    try {
      setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  const loadFavorites = () => {
    try {
      const savedFavorites = localStorage.getItem('yoshikawaFavorites')
      const initialFavorites = savedFavorites ? JSON.parse(savedFavorites) : []
      setFavorites(initialFavorites)
    } catch (error) {
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
          first_air_date: item.first_air_date
        }
        newFavorites = [...prevFavorites, favoriteItem]
        showToast('Adicionado aos favoritos!', 'success')
      }
      localStorage.setItem('yoshikawaFavorites', JSON.stringify(newFavorites))
      return newFavorites
    })
  }

  const getActiveItems = () => {
    switch (activeSection) {
      case 'releases': return releases
      case 'recommendations': return recommendations
      case 'favorites': return favorites
      default: return releases
    }
  }

  // --- Subcomponentes ---

  const ContentGrid = ({ items, toggleFavorite, isFavorite }) => (
    <div className="content-grid">
      {items.length > 0 ? (
        items.map(item => {
          const isFav = isFavorite(item)
          return (
            <Link 
              key={getItemKey(item)}
              href={`/${item.media_type}/${item.id}`}
              className="content-card liquid-glass"
            >
              <div className="poster-container">
                <img 
                    src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : DEFAULT_POSTER} 
                    alt={item.title || item.name}
                    className="content-poster"
                    loading="lazy"
                />
                <button 
                    className={`favorite-btn ${isFav ? 'active' : ''}`}
                    onClick={(e) => {
                    e.preventDefault() 
                    e.stopPropagation() 
                    toggleFavorite(item)
                    }}
                >
                    <i className={isFav ? 'fas fa-heart' : 'far fa-heart'}></i>
                </button>
              </div>
              
              <div className="content-info">
                <h3 className="content-title">{item.title || item.name}</h3>
                <div className="content-meta">
                  <span className="year">
                    {item.release_date ? new Date(item.release_date).getFullYear() : 
                     item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A'}
                  </span>
                  <span className="type">
                    {item.media_type === 'movie' ? 'Filme' : 'Série'}
                  </span>
                </div>
              </div>
            </Link>
          )
        })
      ) : (
        <div className="no-content">
           <i className="far fa-sad-tear"></i>
           <p>Nada encontrado aqui.</p>
        </div>
      )}
    </div>
  )

  const ToastContainer = () => (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type} liquid-glass`}>
           <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}`}></i>
           <span>{toast.message}</span>
        </div>
      ))}
    </div>
  )

  return (
    <>
      <Head>
        <title>Yoshikawa Player</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>

      {/* --- Header (Novo Navbar idêntico à referência) --- */}
      <header id="header">
        <nav className="container-nav">
            <div className="header-grid">
                {/* Menu Principal */}
                <div className="menu-container liquid-glass" style={{ paddingLeft: '20px', paddingRight: '20px' }}>
                    <button 
                        className={`clickable menu-item-btn ${activeSection === 'releases' ? 'menu-item__active' : ''}`}
                        onClick={() => setActiveSection('releases')}
                    >
                        <div className="menu-item">
                            <span className="svg-icon"><i className="fas fa-home"></i></span>
                            <span className="menu-text">Home</span>
                        </div>
                    </button>
                    
                    <button 
                        className={`clickable menu-item-btn ${activeSection === 'recommendations' ? 'menu-item__active' : ''}`}
                        onClick={() => setActiveSection('recommendations')}
                    >
                        <div className="menu-item">
                            <span className="svg-icon"><i className="fas fa-gamepad"></i></span>
                            <span className="menu-text">Games</span>
                        </div>
                    </button>

                    <button 
                        className={`clickable menu-item-btn ${activeSection === 'favorites' ? 'menu-item__active' : ''}`}
                        onClick={() => setActiveSection('favorites')}
                    >
                        <div className="menu-item">
                            <span className="svg-icon"><i className="fas fa-mobile-alt"></i></span>
                            <span className="menu-text">Apps</span>
                        </div>
                    </button>

                    <button type="button" className="button-link clickable sidenav-trigger ml-auto">
                        <div className="menu-item" style={{ textAlign: 'end', paddingRight: 0 }}>
                            <span className="svg-icon"><i className="fas fa-bars"></i></span>
                            <span className="menu-text">Menu</span>
                        </div>
                    </button>
                </div>

                {/* Botão de Busca */}
                <div className="menu-container liquid-glass search-trigger-container">
                    <button 
                        type="button" 
                        className="button-link clickable" 
                        onClick={() => setSearchActive(true)}
                        aria-label="Search" 
                        style={{ width: '100%', height: '100%' }}
                    >
                        <div className="menu-item justify-center">
                            <span className="svg-icon"><i className="fas fa-search"></i></span>
                        </div>
                    </button>
                </div>
            </div>
        </nav>
      </header>

      {/* --- Overlay de Busca (Popup) --- */}
      <div id="search-form" className={searchActive ? 'active' : ''}>
        <button 
            type="button" 
            className="button-link close-search-area" 
            onClick={() => setSearchActive(false)}
            aria-label="Close Search"
        ></button>
        
        <div className="search-form__content">
            <div className="container-search">
                
                {/* Input Area */}
                <div className="search-box liquid-glass">
                    <button type="submit" aria-label="Search">
                        <span className="svg-icon"><i className="fas fa-search"></i></span>
                    </button>
                    <input 
                        ref={searchInputRef}
                        id="search-input" 
                        type="search" 
                        placeholder="Pesquisar filmes ou séries..." 
                        value={searchQuery}
                        onChange={handleSearchChange}
                        autoComplete="off" 
                    />
                     {searchQuery && (
                        <button type="button" onClick={() => {setSearchQuery(''); setSearchResults([])}} className="clear-btn">
                            <i className="fas fa-times"></i>
                        </button>
                    )}
                </div>

                {/* Resultados da Busca dentro do Overlay */}
                <div id="search-results" className={`liquid-glass ${searchResults.length > 0 || loading ? 'has-content' : ''}`}>
                    {loading && (
                        <div className="search-status">
                            <i className="fas fa-spinner fa-spin"></i> Buscando...
                        </div>
                    )}
                    
                    {!loading && searchResults.length > 0 && (
                        <div className="search-results-grid">
                            {searchResults.map(item => (
                                <Link key={item.id} href={`/${item.media_type}/${item.id}`} onClick={() => setSearchActive(false)} className="search-result-item">
                                    <img src={item.poster_path ? `https://image.tmdb.org/t/p/w92${item.poster_path}` : DEFAULT_POSTER} alt={item.title} />
                                    <div className="meta">
                                        <h4>{item.title || item.name}</h4>
                                        <span>{item.media_type === 'movie' ? 'Filme' : 'Série'} • {item.release_date ? item.release_date.substring(0,4) : ''}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {!loading && searchQuery && searchResults.length === 0 && (
                        <div className="search-status">
                            Nenhum resultado encontrado.
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      <ToastContainer />

      <main className="container main-content">
        <div className="header-spacer"></div>
        
        <h1 className="page-title">
            {activeSection === 'releases' && 'Lançamentos Recentes'}
            {activeSection === 'recommendations' && 'Jogos (Populares)'}
            {activeSection === 'favorites' && 'Meus Apps (Favoritos)'}
        </h1>

        {loading && !searchActive ? (
            <div className="loading-state">
                <div className="spinner"></div>
            </div>
        ) : (
            <ContentGrid 
                items={getActiveItems()} 
                isFavorite={isFavorite} 
                toggleFavorite={toggleFavorite} 
            />
        )}
      </main>

      <style jsx global>{`
        :root {
            --bg-color: #f5f7fa; /* Fundo claro quase branco */
            --text-main: #212121;
            --text-secondary: #666;
            --glass-bg: rgba(255, 255, 255, 0.75);
            --glass-border: rgba(255, 255, 255, 0.6);
            --glass-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            --primary: #3b82f6;
            --danger: #ef4444;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-tap-highlight-color: transparent;
        }

        body {
            background-color: var(--bg-color);
            background-image: 
                radial-gradient(at 0% 0%, hsla(253,16%,7%,0) 0, transparent 50%), 
                radial-gradient(at 50% 0%, hsla(225,39%,30%,0) 0, transparent 50%), 
                radial-gradient(at 100% 0%, hsla(339,49%,30%,0) 0, transparent 50%);
            font-family: 'Poppins', sans-serif;
            color: var(--text-main);
            min-height: 100vh;
        }

        /* --- Estilo "Liquid Glass" (Referência) --- */
        .liquid-glass {
            background: var(--glass-bg);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid var(--glass-border);
            box-shadow: var(--glass-shadow);
        }

        /* --- Header & Navigation --- */
        #header {
            position: fixed;
            top: 20px;
            left: 0;
            width: 100%;
            z-index: 1000;
            pointer-events: none; /* Permite clicar no conteúdo atrás se não clicar no menu */
        }

        .container-nav {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 15px;
            pointer-events: auto;
        }

        .header-grid {
            display: grid;
            grid-template-rows: 64px;
            grid-template-columns: calc(100% - 10px - 64px) 64px;
            gap: 10px;
        }

        .menu-container {
            border-radius: 16px;
            overflow: hidden;
            display: flex;
            align-items: center;
        }

        .menu-item-btn {
            background: none;
            border: none;
            height: 100%;
            cursor: pointer;
            color: inherit;
            font-family: inherit;
        }

        .menu-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 0 16px;
            font-weight: 500;
            color: #212121;
            transition: all 0.3s ease;
            height: 100%;
            font-size: 15px;
        }
        
        .justify-center {
            justify-content: center;
            width: 100%;
        }

        .menu-item-btn:hover, .menu-item__active {
            background: rgba(0, 0, 0, 0.05);
            color: var(--primary);
        }

        .ml-auto {
            margin-left: auto;
        }

        .svg-icon i {
            font-size: 20px;
        }

        /* Responsividade do Menu */
        @media only screen and (max-width: 720px) {
            .menu-text {
                display: none;
            }
            .menu-item {
                padding: 0 12px;
                gap: 0;
            }
            .header-grid {
                 /* Em telas muito pequenas, o grid se mantém, mas escondemos o texto */
            }
        }

        /* --- Overlay de Busca (Referência) --- */
        #search-form {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(5px);
            z-index: 2000;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s, visibility 0.3s;
            display: flex;
            align-items: flex-start;
            padding-top: 100px;
        }

        #search-form.active {
            opacity: 1;
            visibility: visible;
        }

        .close-search-area {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: transparent;
            border: none;
            cursor: default;
        }

        .search-form__content {
            position: relative;
            width: 100%;
            pointer-events: none;
            z-index: 2001;
        }

        .container-search {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 15px;
            pointer-events: auto;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .search-box {
            display: flex;
            align-items: center;
            height: 64px;
            border-radius: 16px;
            padding: 0 20px;
        }

        .search-box input {
            flex: 1;
            border: none;
            background: transparent;
            height: 100%;
            font-size: 18px;
            margin-left: 15px;
            color: var(--text-main);
            outline: none;
        }

        .search-box button {
            background: none;
            border: none;
            cursor: pointer;
            color: var(--text-secondary);
            font-size: 18px;
        }

        #search-results {
            border-radius: 16px;
            max-height: 60vh;
            overflow-y: auto;
            display: none;
            padding: 0;
        }
        
        #search-results.has-content {
            display: block;
            padding: 10px 0;
        }

        .search-status {
            padding: 20px;
            text-align: center;
            color: var(--text-secondary);
        }

        .search-results-grid {
            display: flex;
            flex-direction: column;
        }

        .search-result-item {
            display: flex;
            align-items: center;
            padding: 10px 20px;
            gap: 15px;
            text-decoration: none;
            color: inherit;
            transition: background 0.2s;
            border-bottom: 1px solid rgba(0,0,0,0.05);
        }

        .search-result-item:hover {
            background: rgba(0,0,0,0.03);
        }

        .search-result-item img {
            width: 40px;
            height: 60px;
            object-fit: cover;
            border-radius: 6px;
        }

        .search-result-item .meta {
            display: flex;
            flex-direction: column;
        }
        
        .search-result-item h4 {
            font-size: 15px;
            font-weight: 500;
        }
        
        .search-result-item span {
            font-size: 12px;
            color: var(--text-secondary);
        }

        /* --- Conteúdo Principal --- */
        .header-spacer {
            height: 100px; /* Espaço para o header fixo */
        }

        .main-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 15px 40px 15px;
        }

        .page-title {
            font-size: 24px;
            margin-bottom: 25px;
            font-weight: 700;
            color: var(--text-main);
            padding-left: 5px;
        }

        .content-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 20px;
        }

        .content-card {
            display: flex;
            flex-direction: column;
            border-radius: 16px;
            overflow: hidden;
            text-decoration: none;
            color: inherit;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            height: 100%;
        }

        .content-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .poster-container {
            position: relative;
            width: 100%;
            aspect-ratio: 2/3;
            overflow: hidden;
        }

        .content-poster {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.5s ease;
        }

        .content-card:hover .content-poster {
            transform: scale(1.05);
        }

        .favorite-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.9);
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            transition: all 0.2s;
            color: #ccc;
        }

        .favorite-btn:hover {
            transform: scale(1.1);
        }

        .favorite-btn.active {
            color: var(--danger);
        }

        .content-info {
            padding: 15px;
            display: flex;
            flex-direction: column;
            flex: 1;
        }

        .content-title {
            font-size: 15px;
            font-weight: 600;
            margin-bottom: 5px;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .content-meta {
            margin-top: auto;
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: var(--text-secondary);
            font-weight: 500;
        }

        .type {
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.5px;
            background: rgba(0,0,0,0.05);
            padding: 2px 6px;
            border-radius: 4px;
        }

        /* --- Loading Spinner --- */
        .loading-state {
            display: flex;
            justify-content: center;
            padding: 50px;
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(0,0,0,0.1);
            border-top: 3px solid var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        /* --- Toast Notification --- */
        .toast-container {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 3000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .toast {
            padding: 12px 20px;
            border-radius: 50px;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
            font-weight: 500;
            background: white; /* Fallback */
            background: rgba(255, 255, 255, 0.9);
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            animation: slideUp 0.3s ease forwards;
        }

        .toast-success i { color: #10b981; }
        .toast-error i { color: #ef4444; }
        .toast-info i { color: #3b82f6; }

        @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        /* --- Responsividade Geral --- */
        @media (max-width: 600px) {
            .content-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
            }
            .content-title {
                font-size: 14px;
            }
            .content-info {
                padding: 10px;
            }
            .header-grid {
                grid-template-columns: calc(100% - 10px - 56px) 56px;
            }
            .header-grid {
                grid-template-rows: 56px;
            }
            .page-title {
                font-size: 20px;
            }
        }
      `}</style>
    </>
  )
}
