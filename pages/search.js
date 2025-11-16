import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Search() {
  const [searchResults, setSearchResults] = useState([])
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchActive, setSearchActive] = useState(false)
  const router = useRouter()

  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const DEFAULT_POSTER = 'https://yoshikawa-bot.github.io/cache/images/6e595b38.jpg'

  const getItemKey = (item) => `${item.media_type}-${item.id}`

  useEffect(() => {
    loadFavorites()
    if (router.query.q) {
      setSearchQuery(router.query.q)
      performSearch(router.query.q)
    }
  }, [router.query.q])

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
      if (isFavorite(item)) {
        newFavorites = prevFavorites.filter(fav => getItemKey(fav) !== getItemKey(item))
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
      }
      
      try {
        localStorage.setItem('yoshikawaFavorites', JSON.stringify(newFavorites))
      } catch (error) {
        console.error('Erro ao salvar favoritos:', error)
      }

      return newFavorites
    })
  }

  const performSearch = async (query) => {
    if (!query.trim()) return
    
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
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (query) => {
    if (!query.trim()) return
    
    setLoading(true)

    try {
      // Atualiza a URL com a nova query
      router.push(`/search?q=${encodeURIComponent(query)}`, undefined, { shallow: true })
    } catch (error) {
      console.error('Erro na busca:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearSearchResults = () => {
    router.push('/')
  }

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
            {!loading ? 'Nenhum resultado encontrado.' : ''}
          </div>
        )}
      </div>
    </section>
  )

  return (
    <>
      <Head>
        <title>Yoshikawa Player - Pesquisa</title>
        <meta name="description" content="Yoshikawa Streaming Player - Resultados da Pesquisa" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>

      <Header />

      <main className="container">
        {loading && (
          <div className="loading active">
            <div className="spinner"></div>
            <p>Carregando resultados...</p>
          </div>
        )}

        <div className="search-results-section active">
          <div className="search-results-header">
            <h2 className="page-title-home">Resultados para: "{searchQuery}"</h2>
            <button 
              className="clear-search-btn"
              onClick={clearSearchResults}
              title="Voltar para a página inicial"
            >
              <i className="fas fa-times"></i>
              <span>Limpar</span>
            </button>
          </div>
          <ContentGrid 
            items={searchResults} 
            isFavorite={isFavorite} 
            toggleFavorite={toggleFavorite} 
          />
        </div>
      </main>

      <div className="bottom-nav-container">
        <div className={`main-nav-bar ${searchActive ? 'search-active' : ''}`}>
          {!searchActive && (
            <>
              <button 
                className="nav-item"
                onClick={() => router.push('/')}
              >
                <i className="fas fa-film"></i>
                <span>Lançamentos</span>
              </button>
              <button 
                className="nav-item"
                onClick={() => router.push('/')}
              >
                <i className="fas fa-fire"></i>
                <span>Populares</span>
              </button>
              <button 
                className="nav-item"
                onClick={() => router.push('/')}
              >
                <i className="fas fa-heart"></i>
                <span>Favoritos</span>
              </button>
            </>
          )}
          
          <div className={`search-container ${searchActive ? 'active' : ''}`}>
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target)
                handleSearch(formData.get('search'))
              }}
              className="search-form"
            >
              <input 
                type="text" 
                name="search"
                className="search-input" 
                placeholder="Pesquisar conteúdo"
                autoFocus={searchActive}
                defaultValue={searchQuery}
              />
              <button type="submit" className="search-button">
                <i className="fas fa-search"></i>
              </button>
            </form>
            {searchActive && (
              <button 
                className="close-search"
                onClick={() => setSearchActive(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>
        
        {!searchActive && (
          <button 
            className="search-circle"
            onClick={() => setSearchActive(true)}
          >
            <i className="fas fa-search"></i>
          </button>
        )}
      </div>
    </>
  )
}

const Header = () => {
  const router = useRouter()
  
  return (
    <header className="github-header">
      <div className="header-content">
        <Link href="/" className="logo-container">
          <img 
            src="https://yoshikawa-bot.github.io/cache/images/47126171.jpg" 
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
