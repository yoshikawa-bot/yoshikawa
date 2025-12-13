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

const HeroImage = () => {
    const imageUrl = "https://yoshikawa-bot.github.io/cache/images/e2fcc30e.jpg";
    return (
        // O container da imagem é posicionado de forma absoluta/fixa no fundo do topo
        <div className="hero-image-container">
            <img src={imageUrl} alt="Background Splash" className="hero-image" />
        </div>
    );
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

  // Sistema de Toast Notifications (Modificado para não acumular)
  const showToast = (message, type = 'info') => {
    const id = Date.now()
    const toast = { id, message, type }
    
    // Substitui o array anterior pelo novo toast, garantindo apenas um por vez
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
        showToast('Erro ao salvar favoritos', 'error')
      }

      return newFavorites
    })
  }
  
  const handleSearchSubmit = () => {
    if (searchInputRef.current) {
      const query = searchInputRef.current.value.trim()
      if (query) {
        debouncedSearch(query)
      } else {
        setSearchResults([])
        showToast('Digite algo para pesquisar', 'info')
      }
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit()
    }
  }

  const getActiveItems = () => {
    switch (activeSection) {
      case 'releases':
        return releases
      case 'recommendations':
        return recommendations
      case 'favorites':
        return favorites
      default:
        return releases
    }
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

        {loading && (
            <div className="live-search-loading">
                <i className="fas fa-spinner fa-spin"></i>
                <span> Buscando...</span>
            </div>
        )}
        
        {!loading && searchResults.length > 0 ? (
            <ContentGrid 
                items={searchResults}
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
  

  return (
    <>
      <Head>
        <title>Yoshikawa Player</title>
        <meta name="description" content="Yoshikawa Streaming Player" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>

      {/* 1. Imagem de fundo flutuante */}
      <HeroImage /> 
      
      {/* 2. Cabeçalho (flutua por cima da imagem) */}
      <Header />
      
      <ToastContainer />

      {/* 3. Conteúdo principal, deslocado para baixo para não começar por cima do cabeçalho + imagem */}
      <main className="container">
        
        {loading && !searchActive && (
          <div className="loading active">
            <div className="spinner"></div>
            <p>Carregando conteúdo...</p>
          </div>
        )}

        {/* Lógica de Renderização Condicional - Página Inteira */}
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
              {/* Botão de fechar removido daqui */}
            </div>
          )}
        </div>
        
        {/* Botão circular que vira X quando ativo */}
        <button 
          className={`search-circle ${searchActive ? 'active' : ''}`}
          onClick={() => setSearchActive(!searchActive)}
        >
          <i className={searchActive ? "fas fa-times" : "fas fa-search"}></i>
        </button>
      </div>

      <style jsx global>{`
        /* --- ESTILOS GLOBAIS/BASE (ATUALIZADOS) --- */
        :root {
            /* Adicionado uma variável para altura do cabeçalho + imagem para uso em padding */
            --top-area-height: 330px; /* Altura do HeroImage (250px) + Altura do Header (aprox. 80px) */
        }
        body {
            background-color: #000 !important; /* Fundo preto absoluto */
            color: white; 
            margin: 0;
            padding: 0;
        }
        
        /* O cabeçalho deve manter-se no topo com z-index alto */
        .github-header {
            position: fixed; /* Usa fixed para garantir que ele flutue por cima */
            top: 0;
            left: 0;
            width: 100%;
            z-index: 200; /* Alto z-index para flutuar sobre a imagem (z-index: 10) */
            background-color: transparent; /* Remove o fundo aqui, se o original for transparente/escuro */
            /* Se o cabeçalho original tiver um fundo sólido, ele deve ser mantido */
            /* Exemplo: background-color: #1a1a1a; */
        }
        
        /* --- IMAGEM DE TOPO (POSICIONAMENTO ABSOLUTO/FIXO) --- */
        .hero-image-container {
            position: fixed; /* Fica por baixo de tudo no topo */
            top: 0;
            left: 0;
            width: 100%;
            height: 250px; /* Altura da imagem (ajustável) */
            overflow: hidden;
            z-index: 10; /* Fica abaixo do cabeçalho (200) mas acima do conteúdo (1) */
        }
        
        /* Adicionando um degradê preto suave por cima da imagem para melhor leitura do cabeçalho e transição */
        .hero-image-container::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(to top, #000000 0%, rgba(0, 0, 0, 0.4) 50%, rgba(0, 0, 0, 0.2) 100%);
        }

        .hero-image {
            width: 100%;
            height: 100%;
            object-fit: cover; 
            object-position: top center; 
            display: block;
        }

        /* Ajuste do container principal: forçar o conteúdo a começar abaixo da área de cabeçalho + imagem */
        .container {
            padding: var(--top-area-height) 16px 100px 16px; /* Adiciona padding-top igual à altura da área de topo */
            width: 100%;
            position: relative;
            z-index: 50; /* Garante que o conteúdo flua por cima da imagem */
        }
        
        /* --- O restante dos estilos permanece inalterado --- */
        
        /* Animação para notificação (Toast) */
        @keyframes toast-slide-up {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
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

        /* Mobile: 2 colunas exatas */
        @media (max-width: 768px) {
            .content-grid {
                grid-template-columns: repeat(2, 1fr) !important;
            }
            .hero-image-container {
                height: 200px;
            }
            :root {
                --top-area-height: 280px; /* Reajusta a altura para mobile: 200px (imagem) + 80px (header) */
            }
        }

        /* --- Estilos da Busca (Live Search) como PÁGINA NORMAL --- */
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

        /* --- Header Adjustments --- */
        .header-content {
            display: flex;
            justify-content: flex-start;
            align-items: center;
            width: 100%;
            padding: 0 16px;
        }
        
        .main-nav-bar.search-active {
            padding: 0 10px;
        }

        /* Ajuste do input quando não há botão X interno */
        .search-input-expanded {
            width: 100%;
        }
      `}</style>
    </>
  )
}

// Header
const Header = () => {
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
            <span className="beta-tag">STREAMING</span>
          </div>
        </Link>
      </div>
    </header>
  )
}
