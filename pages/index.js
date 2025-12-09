import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'

// Define a função debounce
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
  
  // Sistema de Notificação na Navbar
  const [activeToast, setActiveToast] = useState(null)
  const toastTimeoutRef = useRef(null)

  const searchInputRef = useRef(null)
  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const DEFAULT_POSTER = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'

  const getItemKey = (item) => `${item.media_type}-${item.id}`

  // Sistema de Toast Integrado na Navbar
  const showToast = (message, type = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    
    if (searchActive) setSearchActive(false)

    setActiveToast({ message, type })
    
    toastTimeoutRef.current = setTimeout(() => {
      setActiveToast(null)
      toastTimeoutRef.current = null
    }, 2000)
  }

  const dismissToast = () => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setActiveToast(null)
  }

  useEffect(() => {
    loadHomeContent()
    loadFavorites()
    return () => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    }
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
      ].filter(item => item.poster_path)
       .sort((a, b) => new Date(b.release_date || b.first_air_date) - new Date(a.release_date || a.first_air_date))
       .slice(0, 15)

      const allPopular = [
        ...(popularMoviesData.results || []).map(item => ({...item, media_type: 'movie'})),
        ...(popularTvData.results || []).map(item => ({...item, media_type: 'tv'}))
      ].filter(item => item.poster_path)
       .sort(() => 0.5 - Math.random())
       .slice(0, 15)

      setReleases(allReleases)
      setRecommendations(allPopular)
    } catch (error) {
      showToast('Erro ao carregar conteúdo', 'error')
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
  
  const isFavorite = (item) => favorites.some(fav => fav.id === item.id && fav.media_type === item.media_type)

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
      localStorage.setItem('yoshikawaFavorites', JSON.stringify(newFavorites))
      return newFavorites
    })
  }
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
       if (searchInputRef.current) {
          const query = searchInputRef.current.value.trim()
          if (query) debouncedSearch(query)
          else showToast('Digite algo para pesquisar', 'info')
       }
    }
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

  const ContentGrid = ({ items, isFavorite, toggleFavorite, extraClass = '' }) => (
    <div className={`content-grid ${extraClass}`}>
      {items.length > 0 ? (
        items.map(item => {
          const isFav = isFavorite(item)
          return (
            <Link key={getItemKey(item)} href={`/${item.media_type}/${item.id}`} className="content-card">
              <img src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : DEFAULT_POSTER} alt={item.title || item.name} className="content-poster" loading="lazy"/>
              <button className={`favorite-btn ${isFav ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(item) }}>
                <i className={isFav ? 'fas fa-heart' : 'far fa-heart'}></i>
              </button>
              <div className="floating-text-wrapper">
                <div className="content-title-card">{item.title || item.name}</div>
                <div className="content-year">
                  {item.release_date ? new Date(item.release_date).getFullYear() : item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A'}
                </div>
              </div>
            </Link>
          )
        })
      ) : (
        <div className="no-content" style={{padding: '2rem', textAlign: 'center', color: 'var(--secondary)', width: '100%', gridColumn: '1 / -1'}}>
          {activeSection === 'favorites' ? 'Nenhum favorito adicionado ainda.' : 'Nenhum conteúdo disponível.'}
        </div>
      )}
    </div>
  )

  const LiveSearchResults = () => {
    if (!searchActive) return null
    return (
      <div className="live-search-results">
        <h1 className="page-title-home"><i className="fas fa-search" style={{marginRight: '8px'}}></i>Resultados</h1>
        {loading && <div className="live-search-loading"><i className="fas fa-spinner fa-spin"></i><span> Buscando...</span></div>}
        {!loading && searchResults.length > 0 ? (
            <ContentGrid items={searchResults} isFavorite={isFavorite} toggleFavorite={toggleFavorite} extraClass="live-grid" />
        ) : (!loading && searchQuery.trim() !== '' && (
            <div className="no-results-live"><i className="fas fa-ghost"></i><p>Nenhum resultado para "{searchQuery}".</p></div>
        ))}
        {!loading && searchQuery.trim() === '' && <div className="no-results-live"><p>Comece a digitar para pesquisar...</p></div>}
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Yoshikawa Player</title>
        <meta name="description" content="Yoshikawa Streaming Player" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>

      <Header />
      
      <main className="container">
        {loading && !searchActive && (
          <div className="loading active"><div className="spinner"></div><p>Carregando conteúdo...</p></div>
        )}
        {searchActive ? (
            <LiveSearchResults />
        ) : (
            <div className="home-sections">
                <h1 className="page-title-home"><i className={pageIcon} style={{marginRight: '8px'}}></i>{pageTitle}</h1>
                <section className="section">
                    <ContentGrid items={getActiveItems()} isFavorite={isFavorite} toggleFavorite={toggleFavorite} extraClass="main-grid" />
                </section>
            </div>
        )}
      </main>

      <div className="bottom-nav-container">
        {/* Navbar ajustável */}
        <div className={`main-nav-bar ${searchActive ? 'search-active' : ''} ${activeToast ? 'notification-active' : ''}`}>
          
          {activeToast ? (
             <div className={`nav-notification-text toast-type-${activeToast.type}`}>
                 <i className={`fas ${activeToast.type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}`}></i>
                 <span>{activeToast.message}</span>
             </div>
          ) : searchActive ? (
            <div className="search-input-container">
              <input 
                ref={searchInputRef} type="text" className="search-input-expanded" placeholder="Pesquisar..."
                value={searchQuery} onChange={handleSearchChange} onKeyPress={handleKeyPress}
              />
            </div>
          ) : (
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
          )}
        </div>
        
        {/* Botão circular que controla tudo */}
        <button 
          className={`search-circle ${(searchActive || activeToast) ? 'active' : ''}`}
          onClick={() => {
            if (activeToast) dismissToast();
            else if (searchActive) setSearchActive(false);
            else setSearchActive(true)
          }}
        >
          <i className={`fas ${activeToast ? 'fa-times' : (searchActive ? 'fa-times' : 'fa-search')}`}></i>
        </button>
      </div>

      <style jsx global>{`
        /* --- ESTILO DA NAVBAR AJUSTÁVEL --- */
        .bottom-nav-container {
            display: flex;
            align-items: flex-end;
            padding-bottom: 20px;
            width: 100%;
            position: fixed;
            bottom: 0;
            left: 0;
            z-index: 100;
            pointer-events: none; /* Permite clicar através da area transparente */
            justify-content: center;
        }

        .main-nav-bar {
            height: 60px !important; /* Altura forçada fixa */
            padding: 0 10px;
            
            /* EFEITO BLUR PERMANENTE */
            background: rgba(20, 20, 20, 0.8) !important;
            backdrop-filter: blur(10px) !important;
            -webkit-backdrop-filter: blur(10px) !important;
            
            /* Layout */
            display: flex;
            align-items: center;
            border-radius: 30px; /* Arredondado nas pontas */
            margin-right: 10px;
            pointer-events: auto; /* Reativa cliques */
            
            /* Transição apenas de largura, nunca de cor/altura */
            transition: width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            
            width: calc(100% - 90px); /* Largura padrão */
            max-width: 500px;
        }

        /* Mesmo com notificação, mantemos a estrutura visual idêntica */
        .main-nav-bar.notification-active {
            width: calc(100% - 90px);
            justify-content: flex-start;
        }

        .nav-notification-text {
            display: flex;
            align-items: center;
            gap: 12px;
            color: var(--text);
            font-size: 0.9rem;
            width: 100%;
            animation: fadeIn 0.3s ease;
            line-height: 1.4;
            height: 100%; /* Ocupa altura total para centralizar */
        }
        
        /* CORES VIVAS (ICONES) */
        .nav-notification-text i {
            font-size: 1.2rem;
            flex-shrink: 0;
        }
        
        /* Verde Neon Vivo para Sucesso */
        .toast-type-success i {
            color: #00E676 !important; 
        }

        /* Azul Neon Vivo para Info/Erro */
        .toast-type-info i,
        .toast-type-error i {
            color: #2979FF !important; 
        }

        .nav-notification-text span {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .search-input-container {
            width: 100%;
            padding-right: 0;
            height: 100%;
            display: flex;
            align-items: center;
        }

        .search-input-expanded {
             background: transparent;
             border: none;
             color: white;
             width: 100%;
             height: 100%;
             font-size: 1rem;
             outline: none;
        }

        /* --- BOTÃO REDONDO (FUNDO BLUR SEMPRE) --- */
        
        .search-circle {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            
            /* EFEITO BLUR PERMANENTE (Igual navbar) */
            background: rgba(20, 20, 20, 0.8) !important;
            backdrop-filter: blur(10px) !important;
            -webkit-backdrop-filter: blur(10px) !important;
            
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            color: white;
            cursor: pointer;
            pointer-events: auto;
            border: none !important; /* Sem borda nunca */
            box-shadow: none !important; /* Sem sombra colorida */
            transition: transform 0.2s ease;
        }
        
        /* Estado ativo apenas muda o ícone ou escala leve, NUNCA cor */
        .search-circle.active {
            transform: scale(0.95);
        }

        /* --- RESTANTE DO CSS (Itens de navegação) --- */
        .nav-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: none;
            color: #aaa;
            height: 100%;
            font-size: 0.75rem;
            cursor: pointer;
            gap: 4px;
        }
        .nav-item.active { color: white; }
        .nav-item i { font-size: 1.2rem; }

        .content-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px; padding: 0; width: 100%; }
        .content-card { position: relative; display: block; overflow: hidden; border-radius: 12px; }
        .content-poster { width: 100%; height: auto; aspect-ratio: 2/3; object-fit: cover; display: block; border-radius: 12px; }
        @media (max-width: 768px) { .content-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        .live-search-results { position: static; width: 100%; height: auto; padding: 0; margin-bottom: 20px; }
        .page-title-home { margin-top: 20px; margin-bottom: 15px; font-size: 1.5rem; font-weight: 700; color: var(--text); display: flex; align-items: center; }
        .live-search-loading, .no-results-live { display: flex; align-items: center; justify-content: center; min-height: 50vh; color: var(--secondary); font-size: 1rem; flex-direction: column; text-align: center; width: 100%; }
        .live-search-loading i, .no-results-live i { margin-bottom: 10px; font-size: 2rem; }
        .container { padding: 0 16px 100px 16px; width: 100%; }
        .header-content { display: flex; justify-content: flex-start; align-items: center; width: 100%; padding: 0 16px; }
      `}</style>
    </>
  )
}

const Header = () => (
  <header className="github-header">
    <div className="header-content">
      <Link href="/" className="logo-container">
        <img src="https://yoshikawa-bot.github.io/cache/images/14c34900.jpg" alt="Yoshikawa Bot" className="logo-image" />
        <div className="logo-text"><span className="logo-name">Yoshikawa</span><span className="beta-tag">STREAMING</span></div>
      </Link>
    </div>
  </header>
)
