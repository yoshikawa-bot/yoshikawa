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
  const [showCoffeePopup, setShowCoffeePopup] = useState(false) // Novo estado para o popup de café

  const searchInputRef = useRef(null)
  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const DEFAULT_POSTER = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'

  const getItemKey = (item) => `${item.media_type}-${item.id}`

  // Sistema de Toast Notifications (Atualizado com lógica de animação)
  const showToast = (message, type = 'info') => {
    const id = Date.now()
    const toast = { id, message, type }
    // Usando Date.now() no ID garante que o componente remonte e a animação toque.
    setToasts(prev => [...prev, toast])
    
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
    // Limpa resultados ao desativar a busca (modo de live search)
    if (!searchActive) {
        setSearchResults([])
        setSearchQuery('')
    }
  }, [searchActive])
  
  // Função para fechar o pop-up de café com animação
  const closeCoffeePopup = () => {
    const element = document.querySelector('.coffee-popup-container.active');
    if (element) {
        element.classList.add('closing');
        setTimeout(() => {
            setShowCoffeePopup(false);
            element.classList.remove('closing');
        }, 300);
    } else {
        setShowCoffeePopup(false);
    }
  };

  // Função central de busca, agora usada pelo debounce
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

  // Hook debounce aplicado à função de busca
  const debouncedSearch = useDebounce(fetchSearchResults, 300)

  // Novo handler para a mudança do input
  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    // Limpa os resultados instantaneamente se a query for vazia
    if (query.trim() === '') {
        setSearchResults([])
        setLoading(false)
        return
    }
    setLoading(true)
    debouncedSearch(query)
  }

  // --- Funções de Carregamento de Conteúdo ---
  const loadHomeContent = async () => { /* ... (Mantido o mesmo) ... */
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

  const loadFavorites = () => { /* ... (Mantido o mesmo) ... */
    try {
      const savedFavorites = localStorage.getItem('yoshikawaFavorites')
      const initialFavorites = savedFavorites ? JSON.parse(savedFavorites) : []
      setFavorites(initialFavorites)
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error)
      setFavorites([])
    }
  }
  
  const isFavorite = (item) => { /* ... (Mantido o mesmo) ... */
    return favorites.some(fav => fav.id === item.id && fav.media_type === item.media_type);
  }

  const toggleFavorite = (item) => { /* ... (Mantido o mesmo) ... */
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
  
  // Função de busca antiga (mantida apenas para a lógica Enter, mas não deve ser usada no live search)
  const handleSearchSubmit = () => {
    if (searchInputRef.current) {
      const query = searchInputRef.current.value.trim()
      if (query) {
        // Agora, em vez de carregar a página, apenas garante que o debounce foi disparado.
        // Se o usuário clicar Enter, o live search já deve ter iniciado.
        debouncedSearch(query)
      } else {
        setSearchResults([])
        showToast('Digite algo para pesquisar', 'info')
      }
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      // Força a execução da busca imediatamente ao pressionar Enter
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

  const ContentGrid = ({ items, isFavorite, toggleFavorite }) => (
    <section className="section">
      <div className="content-grid">
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
                
                <div className="content-info-card">
                </div>
              </Link>
            )
          })
        ) : (
          <div className="no-content" style={{padding: '2rem', textAlign: 'center', color: 'var(--secondary)', width: '100%'}}>
            {activeSection === 'favorites' ? 'Nenhum favorito adicionado ainda.' : 'Nenhum conteúdo disponível.'}
          </div>
        )}
      </div>
    </section>
  )

  // Novo componente para resultados da busca em tempo real
  const LiveSearchResults = () => {
    if (!searchActive || searchQuery.trim() === '') return null
    
    return (
      <div className="live-search-results active">
        {loading && (
            <div className="live-search-loading">
                <i className="fas fa-spinner fa-spin"></i>
                <span> Buscando...</span>
            </div>
        )}
        
        {!loading && searchResults.length > 0 ? (
            <div className="content-grid live-grid">
                {searchResults.map(item => {
                    const isFav = isFavorite(item)
                    return (
                        <Link 
                          key={getItemKey(item)}
                          href={`/${item.media_type}/${item.id}`}
                          className="content-card"
                          onClick={() => setSearchActive(false)} // Fecha ao clicar no resultado
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
                          
                          <div className="content-info-card">
                          </div>
                        </Link>
                    )
                })}
            </div>
        ) : (!loading && searchQuery.trim() !== '' && (
            <div className="no-results-live">
                <i className="fas fa-ghost"></i>
                <p>Nenhum resultado encontrado para "{searchQuery}".</p>
            </div>
        ))}
      </div>
    )
  }

  // Componente de Notificação com Animação
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
  
  // Novo componente Pop-up de Café
  const CoffeePopup = () => {
    if (!showCoffeePopup) return null
    return (
      <div 
        className="coffee-popup-container active"
        style={{ animation: 'toast-slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        onClick={closeCoffeePopup}
      >
        <span className="coffee-text">Sistema by: **@kawalyansky**</span>
        <button className="coffee-close-btn" onClick={closeCoffeePopup}>
          <i className="fas fa-times"></i>
        </button>
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

      <Header onCoffeeClick={() => {
          if (showCoffeePopup) {
              closeCoffeePopup();
          } else {
              setShowCoffeePopup(true);
          }
      }} />

      <CoffeePopup />
      <ToastContainer />

      <main className="container">
        
        {/* Mostra a tela de loading global apenas se não estiver na busca live */}
        {loading && !searchActive && (
          <div className="loading active">
            <div className="spinner"></div>
            <p>Carregando conteúdo...</p>
          </div>
        )}

        {/* Live Search Results (Pop-up) */}
        <LiveSearchResults />

        {/* Home Sections (Escondido se a busca estiver ativa) */}
        {!searchActive && (
          <div className="home-sections">
            <h1 className="page-title-home"><i className={pageIcon} style={{marginRight: '8px'}}></i>{pageTitle}</h1>
            <ContentGrid 
                items={getActiveItems()} 
                isFavorite={isFavorite} 
                toggleFavorite={toggleFavorite} 
            />
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
                value={searchQuery} // Controlado pelo estado
                onChange={handleSearchChange} // Dispara live search
                onKeyPress={handleKeyPress}
              />
              <button 
                className="close-search-expanded"
                onClick={() => {
                  setSearchActive(false)
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          )}
        </div>
        
        <button 
          className={`search-circle ${searchActive ? 'active' : ''}`}
          onClick={() => {
            if (searchActive) {
              // Já ativo: clica no botão principal de busca, que agora apenas limpa se já tiver resultados
              if (searchQuery.trim()) {
                 setSearchActive(false);
              } else {
                 setSearchActive(false);
              }
            } else {
              // Não ativo: ativa a barra de pesquisa
              setSearchActive(true)
            }
          }}
        >
          <i className="fas fa-search"></i>
        </button>
      </div>

      {/* --- ESTILOS --- */}
      <style jsx global>{`
        /* Animação para notificação (Toast) */
        @keyframes toast-slide-up {
          0% { 
            opacity: 0; 
            transform: translateY(20px) scale(0.95); 
          }
          100% { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
        
        /* Animação para popup de café (Slide Down) */
        @keyframes toast-slide-down {
          0% {
            opacity: 0;
            transform: translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Estilos do Live Search Popup */
        .live-search-results {
            position: fixed;
            top: 70px; /* Abaixo do header */
            left: 0;
            right: 0;
            bottom: 60px; /* Acima do bottom nav */
            z-index: 15;
            padding: 10px;
            background-color: var(--background);
            overflow-y: auto;
            border-top: 1px solid var(--border);
            /* Garante que não apareça na Home se a search não estiver ativa */
            visibility: hidden;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
        }

        .live-search-results.active {
            visibility: visible;
            opacity: 1;
        }
        
        .live-search-results .live-grid {
            grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
            gap: 12px;
            padding: 0;
        }

        .live-search-loading, .no-results-live {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: var(--secondary);
            font-size: 1rem;
            flex-direction: column;
            padding-top: 50px;
            text-align: center;
        }
        
        .live-search-loading i {
            margin-right: 8px;
            font-size: 1.5rem;
        }
        
        .no-results-live i {
            font-size: 2rem;
            margin-bottom: 10px;
        }

        /* Estilos do Popup de Café */
        .coffee-popup-container {
            position: fixed;
            top: 70px; /* Abaixo do header (50px) + margem */
            left: 50%;
            transform: translateX(-50%);
            z-index: 20;
            background-color: var(--card-bg);
            border: 1px solid var(--primary);
            color: var(--text);
            padding: 8px 15px;
            border-radius: 8px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 0.9rem;
            /* Início da transição de fechar */
            opacity: 0;
            transition: opacity 0.3s ease, transform 0.3s ease;
        }
        
        .coffee-popup-container.closing {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        
        .coffee-text {
            white-space: nowrap;
        }

        .coffee-close-btn {
            background: none;
            border: none;
            color: var(--secondary);
            cursor: pointer;
            font-size: 0.9rem;
        }
        .coffee-close-btn:hover {
            color: var(--text);
        }

        /* Ajuste do Header para o botão de café */
        .header-content {
            justify-content: space-between;
            width: 100%;
            padding-right: 15px;
        }
        
        .coffee-button {
            background: none;
            border: none;
            color: var(--secondary);
            font-size: 1.2rem;
            cursor: pointer;
            padding: 5px;
        }
        
        .coffee-button:hover {
            color: var(--primary);
        }

        /* Ajuste no NavBar para não ter espaçamento quando o Live Search está ativo */
        .main-nav-bar.search-active {
            padding: 0 10px;
        }
      `}</style>
    </>
  )
}

// Header atualizado para incluir o botão de café
const Header = ({ onCoffeeClick }) => {
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
        <button className="coffee-button" onClick={onCoffeeClick} title="Sistema By">
          <i className="fas fa-mug-saucer"></i> {/* Ícone de xícara de café */}
        </button>
      </div>
    </header>
  )
}
