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
  
  // Novos estados para o Filtro de Conteúdo
  const [filterMode, setFilterMode] = useState('all') // 'all', 'default' (séries/filmes), 'anime'
  const [showSettings, setShowSettings] = useState(false)

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
    loadUserPreferences()
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
  
  // Carregar preferência salva
  const loadUserPreferences = () => {
      const savedFilter = localStorage.getItem('yoshikawaContentFilter')
      if (savedFilter) {
          setFilterMode(savedFilter)
      }
  }

  // Salvar e aplicar preferência
  const handleFilterChange = (mode) => {
      setFilterMode(mode)
      localStorage.setItem('yoshikawaContentFilter', mode)
      setShowSettings(false)
      
      let message = 'Exibindo todo o conteúdo'
      if (mode === 'default') message = 'Exibindo Séries e Filmes'
      if (mode === 'anime') message = 'Exibindo apenas Animes'
      
      showToast(message, 'success')
  }
  
  // Função central de busca
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

  // --- Funções de Carregamento de Conteúdo ---
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

      // Carregamos mais itens inicialmente (slice maior) para permitir filtragem client-side sem esvaziar a lista
      const allReleases = [
        ...(moviesData.results || []).map(item => ({...item, media_type: 'movie'})),
        ...(tvData.results || []).map(item => ({...item, media_type: 'tv'}))
      ]
        .filter(item => item.poster_path)
        .sort((a, b) => new Date(b.release_date || b.first_air_date) - new Date(a.release_date || a.first_air_date))

      const allPopular = [
        ...(popularMoviesData.results || []).map(item => ({...item, media_type: 'movie'})),
        ...(popularTvData.results || []).map(item => ({...item, media_type: 'tv'}))
      ]
        .filter(item => item.poster_path)
        .sort(() => 0.5 - Math.random())

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
          overview: item.overview,
          original_language: item.original_language,
          genre_ids: item.genre_ids
        }
        newFavorites = [...prevFavorites, favoriteItem]
        showToast('Adicionado aos favoritos!', 'success')
      }
      
      try {
        localStorage.setItem('yoshikawaFavorites', JSON.stringify(newFavorites))
      } catch (error) {
        console.error('Erro ao salvar favoritos:', error)
        showToast('Erro ao salvar favoritos', 'error')
      }

      return newFavorites
    })
  }
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
       if (searchInputRef.current) {
          debouncedSearch(searchInputRef.current.value)
       }
    }
  }
  
  // --- LÓGICA DE FILTRAGEM ---
  const getFilteredItems = (items) => {
      if (!items) return [];

      return items.filter(item => {
          // Lógica para detectar Anime: Língua japonesa E (Gênero Animação OU Tipo TV)
          // 16 é o ID de gênero para Animação no TMDB
          const isAnime = item.original_language === 'ja' && (item.genre_ids?.includes(16) || item.media_type === 'tv');

          if (filterMode === 'all') return true;
          if (filterMode === 'anime') return isAnime;
          if (filterMode === 'default') return !isAnime; // Exclui animes (apenas séries ocidentais e filmes)
          
          return true;
      }).slice(0, 15); // Aplica o limite apenas APÓS filtrar para garantir que haja conteúdo
  }

  const getActiveItems = () => {
    let items = [];
    switch (activeSection) {
      case 'releases':
        items = releases
        break;
      case 'recommendations':
        items = recommendations
        break;
      case 'favorites':
        items = favorites // Favoritos também obedecem o filtro visual, mas mantemos todos salvos
        break;
      default:
        items = releases
    }
    return getFilteredItems(items);
  }
  
  const getActiveSectionDetails = () => {
    switch (activeSection) {
      case 'releases':
        return { title: 'Lançamentos', icon: 'fas fa-film' }
      case 'recommendations':
        return { title: 'Populares', icon: 'fas fa-fire' }
      case 'favorites':
        return { title: 'Favoritos', icon: 'fas fa-heart' }
      default:
        return { title: 'Conteúdo', icon: 'fas fa-tv' }
    }
  }
  
  const { title: pageTitle, icon: pageIcon } = getActiveSectionDetails()

  // --- Componentes ---

  const ContentGrid = ({ items, isFavorite, toggleFavorite, extraClass = '' }) => (
    <div className={`content-grid ${extraClass}`}>
      {items.length > 0 ? (
        items.map(item => {
          const isFav = isFavorite(item)
          return (
            <Link 
              key={getItemKey(item)}
              href={`/${item.media_type}/${item.id}`}
              className="content-card"
            >
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
                title={isFav ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
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
        <div className="no-content" style={{padding: '2rem', textAlign: 'center', color: 'var(--secondary)', width: '100%', gridColumn: '1 / -1'}}>
          {activeSection === 'favorites' 
            ? 'Nenhum favorito encontrado neste modo.' 
            : 'Nenhum conteúdo disponível com o filtro atual.'}
        </div>
      )}
    </div>
  )

  const LiveSearchResults = () => {
    if (!searchActive) return null
    
    return (
      <div className="live-search-results">
        <h1 className="page-title-home"><i className="fas fa-search" style={{marginRight: '8px'}}></i>Resultados</h1>

        {loading && (
            <div className="live-search-loading">
                <i className="fas fa-spinner fa-spin"></i>
                <span> Buscando...</span>
            </div>
        )}
        
        {!loading && searchResults.length > 0 ? (
            <ContentGrid 
                items={searchResults} // A busca retorna tudo, não obedece ao filtro de categoria (UX padrão)
                isFavorite={isFavorite}
                toggleFavorite={toggleFavorite}
                extraClass="live-grid"
            />
        ) : (!loading && searchQuery.trim() !== '' && (
            <div className="no-results-live">
                <i className="fas fa-ghost"></i>
                <p>Nenhum resultado encontrado para "{searchQuery}".</p>
            </div>
        ))}
        
        {!loading && searchQuery.trim() === '' && (
            <div className="no-results-live">
                <p>Comece a digitar para pesquisar...</p>
            </div>
        )}
      </div>
    )
  }

  const ToastContainer = () => (
    <div className="toast-container">
      {toasts.map(toast => (
        <div 
          key={toast.id} 
          className={`toast toast-${toast.type} show`}
          style={{ animation: 'toast-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        >
          <div className="toast-icon">
            <i className={`fas ${
              toast.type === 'success' ? 'fa-check' : 
              toast.type === 'error' ? 'fa-exclamation-triangle' : 
              'fa-info'
            }`}></i>
          </div>
          <div className="toast-content">{toast.message}</div>
          <button 
            className="toast-close"
            onClick={() => removeToast(toast.id)}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      ))}
    </div>
  )
  
  // Componente de Pop-up de Configurações
  const SettingsPopup = () => {
      if (!showSettings) return null;
      
      const closeSettings = () => {
          const el = document.querySelector('.settings-overlay');
          el.classList.add('closing');
          setTimeout(() => setShowSettings(false), 300);
      }

      const handleOverlayClick = (e) => {
        if(e.target.classList.contains('settings-overlay')) closeSettings();
      }

      return (
          <div className="settings-overlay active" onClick={handleOverlayClick}>
              <div className="settings-content">
                  <div className="settings-header">
                      <h3><i className="fas fa-cog"></i> Preferências</h3>
                      <button className="close-popup-btn-simple" onClick={closeSettings}>
                          <i className="fas fa-times"></i>
                      </button>
                  </div>
                  <div className="settings-body">
                      <p className="settings-label">Selecione o tipo de conteúdo:</p>
                      
                      <button 
                        className={`setting-option ${filterMode === 'default' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('default')}
                      >
                        <i className="fas fa-film"></i>
                        <span>Séries e Filmes</span>
                        {filterMode === 'default' && <i className="fas fa-check check-icon"></i>}
                      </button>

                      <button 
                        className={`setting-option ${filterMode === 'anime' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('anime')}
                      >
                        <i className="fas fa-dragon"></i>
                        <span>Animes</span>
                        {filterMode === 'anime' && <i className="fas fa-check check-icon"></i>}
                      </button>

                      <button 
                        className={`setting-option ${filterMode === 'all' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('all')}
                      >
                        <i className="fas fa-globe"></i>
                        <span>Todos</span>
                        {filterMode === 'all' && <i className="fas fa-check check-icon"></i>}
                      </button>
                  </div>
              </div>
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

      {/* Header Atualizado com botão de configurações */}
      <Header onOpenSettings={() => setShowSettings(true)} />
      
      <ToastContainer />
      <SettingsPopup />

      <main className="container">
        
        {loading && !searchActive && (
          <div className="loading active">
            <div className="spinner"></div>
            <p>Carregando conteúdo...</p>
          </div>
        )}

        {searchActive ? (
            <LiveSearchResults />
        ) : (
            <div className="home-sections">
                <h1 className="page-title-home"><i className={pageIcon} style={{marginRight: '8px'}}></i>{pageTitle}</h1>
                <section className="section">
                    <ContentGrid 
                        items={getActiveItems()} 
                        isFavorite={isFavorite} 
                        toggleFavorite={toggleFavorite}
                        extraClass="main-grid"
                    />
                </section>
            </div>
        )}
      </main>

      <div className="bottom-nav-container">
        <div className={`main-nav-bar ${searchActive ? 'search-active' : ''}`}>
          {!searchActive ? (
            <>
              <button 
                className={`nav-item ${activeSection === 'releases' ? 'active' : ''}`}
                onClick={() => setActiveSection('releases')}
              >
                <i className="fas fa-film"></i>
                <span>Lançamentos</span>
              </button>
              <button 
                className={`nav-item ${activeSection === 'recommendations' ? 'active' : ''}`}
                onClick={() => setActiveSection('recommendations')}
              >
                <i className="fas fa-fire"></i>
                <span>Populares</span>
              </button>
              <button 
                className={`nav-item ${activeSection === 'favorites' ? 'active' : ''}`}
                onClick={() => setActiveSection('favorites')}
              >
                <i className="fas fa-heart"></i>
                <span>Favoritos</span>
              </button>
            </>
          ) : (
            <div className="search-input-container">
              <input 
                ref={searchInputRef}
                type="text"
                className="search-input-expanded" 
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyPress={handleKeyPress}
              />
            </div>
          )}
        </div>
        
        <button 
          className={`search-circle ${searchActive ? 'active' : ''}`}
          onClick={() => setSearchActive(!searchActive)}
        >
          <i className={searchActive ? "fas fa-times" : "fas fa-search"}></i>
        </button>
      </div>

      <style jsx global>{`
        /* Animação para notificação (Toast) */
        @keyframes toast-slide-up {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        /* --- Settings Popup Styles --- */
        .settings-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(5px);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
            padding: 20px;
        }

        .settings-overlay.closing {
            animation: fadeOut 0.3s ease forwards;
        }

        .settings-content {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 20px;
            width: 100%;
            max-width: 320px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
            animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .settings-header {
            padding: 15px 20px;
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(255,255,255,0.03);
        }

        .settings-header h3 {
            margin: 0;
            font-size: 1.1rem;
            color: var(--text);
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .close-popup-btn-simple {
            background: none;
            border: none;
            color: var(--secondary);
            font-size: 1.2rem;
            cursor: pointer;
            padding: 5px;
        }

        .settings-body {
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .settings-label {
            color: var(--secondary);
            font-size: 0.9rem;
            margin-bottom: 5px;
        }

        .setting-option {
            background: rgba(255,255,255,0.05);
            border: 1px solid transparent;
            padding: 15px;
            border-radius: 12px;
            color: var(--text);
            display: flex;
            align-items: center;
            cursor: pointer;
            transition: all 0.2s ease;
            text-align: left;
        }

        .setting-option i {
            width: 25px;
            font-size: 1.1rem;
        }

        .setting-option span {
            flex: 1;
            font-weight: 500;
        }

        .setting-option:hover {
            background: rgba(255,255,255,0.1);
        }

        .setting-option.active {
            background: var(--primary);
            color: white;
            border-color: var(--primary);
        }

        .check-icon {
            margin-left: auto;
            font-size: 0.9rem;
        }

        @keyframes scaleIn {
            0% { transform: scale(0.9); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
        }

        /* --- Padronização do Grid (Home e Busca) --- */
        .content-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
            gap: 12px;
            padding: 0;
            width: 100%;
        }

        .content-card {
           position: relative;
           display: block;
           overflow: hidden;
           border-radius: 12px;
        }

        .content-poster {
           width: 100%;
           height: auto;
           aspect-ratio: 2/3;
           object-fit: cover;
           display: block;
           border-radius: 12px;
        }

        @media (max-width: 768px) {
            .content-grid {
                grid-template-columns: repeat(2, 1fr) !important;
            }
        }

        .live-search-results {
            position: static;
            width: 100%;
            height: auto;
            background-color: transparent;
            padding: 0;
            margin-bottom: 20px;
        }

        .page-title-home {
            margin-top: 20px;
            margin-bottom: 15px;
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text);
            display: flex;
            align-items: center;
        }
        
        .live-search-loading, .no-results-live {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 50vh; 
            color: var(--secondary);
            font-size: 1rem;
            flex-direction: column;
            text-align: center;
            width: 100%;
        }
        
        .live-search-loading i, .no-results-live i {
            margin-bottom: 10px;
            font-size: 2rem;
        }

        .container {
            padding: 0 16px 100px 16px;
            width: 100%;
        }

        .header-content {
            display: flex;
            justify-content: space-between; /* Alterado para space-between para acomodar a engrenagem */
            align-items: center;
            width: 100%;
            padding: 0 16px;
        }

        /* Estilo do botão de engrenagem no header */
        .settings-header-btn {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: var(--text);
            width: 36px;
            height: 36px;
            border-radius: 50%; /* Apple style circle */
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 1rem;
        }

        .settings-header-btn:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: rotate(30deg);
        }
        
        .main-nav-bar.search-active {
            padding: 0 10px;
        }

        .search-input-expanded {
            width: 100%;
        }
      `}</style>
    </>
  )
}

// Header Atualizado
const Header = ({ onOpenSettings }) => {
  return (
    <header className="github-header">
      <div className="header-content">
        <Link href="/" className="logo-container">
          <img 
            src="https://yoshikawa-bot.github.io/cache/images/14c34900.jpg" 
            alt="Yoshikawa Bot" 
            className="logo-image"
          />
          <div className="logo-text">
            <span className="logo-name">Yoshikawa</span>
            <span className="beta-tag">S</span> {/* Texto alterado para S */}
          </div>
        </Link>
        
        {/* Botão de Engrenagem */}
        <button className="settings-header-btn" onClick={onOpenSettings}>
            <i className="fas fa-cog"></i>
        </button>
      </div>
    </header>
  )
}
