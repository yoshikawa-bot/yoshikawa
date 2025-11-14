import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  const [releases, setReleases] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [favorites, setFavorites] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSection, setActiveSection] = useState('releases') // releases, recommendations, favorites
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false); // NOVO: Estado para a busca flutuante

  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const DEFAULT_POSTER = 'https://yoshikawa-bot.github.io/cache/images/6e595b38.jpg'

  useEffect(() => {
    loadHomeContent()
    loadFavorites()
  }, [])

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

      // Últimos lançamentos
      const allReleases = [
        ...(moviesData.results || []).map(item => ({...item, media_type: 'movie'})),
        ...(tvData.results || []).map(item => ({...item, media_type: 'tv'}))
      ]
        .filter(item => item.poster_path)
        .sort((a, b) => new Date(b.release_date || b.first_air_date) - new Date(a.release_date || a.first_air_date))
        .slice(0, 15)

      // Conteúdo popular
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
    // Carregar favoritos do localStorage
    try {
      const savedFavorites = localStorage.getItem('yoshikawaFavorites')
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites))
      }
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error)
    }
  }

  // NOVA FUNÇÃO PARA RESETAR A TELA APÓS BUSCA
  const resetSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchOverlayOpen(false);
  }

  const handleSearch = async (query) => {
    if (!query.trim()) {
      resetSearch();
      return
    }
    
    setLoading(true)
    setSearchQuery(query)
    // Fechar overlay após iniciar busca
    setIsSearchOverlayOpen(false); 

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

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'releases':
        return 'Últimos Lançamentos'
      case 'recommendations':
        return 'Populares e Recomendações'
      case 'favorites':
        return 'Meus Favoritos'
      default:
        return 'Últimos Lançamentos'
    }
  }

  // MUDANÇA CRUCIAL: Adicionar .floating-text-wrapper ao ContentCard
  const ContentCard = ({ item }) => (
    <Link 
      key={`${item.media_type}-${item.id}`}
      href={`/${item.media_type}/${item.id}`}
      className="content-card"
    >
      <img 
        src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : DEFAULT_POSTER} 
        alt={item.title || item.name}
        className="content-poster"
      />
      
      {/* NOVO WRAPPER: Para posicionamento flutuante do título/ano */}
      <div className="floating-text-wrapper">
        <div className="content-title-card">{item.title || item.name}</div>
        <div className="content-year">
          {item.release_date ? new Date(item.release_date).getFullYear() : 
           item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A'}
        </div>
      </div>
      
      {/* O content-info-card é mantido vazio para compatibilidade com o CSS, mas não tem padding/fundo */}
      <div className="content-info-card"></div> 
    </Link>
  );

  const ContentGrid = ({ items, title }) => (
    <section className="section">
      {/* Título Grande da Seção (Ajustado) */}
      {searchResults.length === 0 && (
          <h1 className="page-title-home">
              <i className="fas fa-play-circle"></i> {title}
          </h1>
      )}

      {/* NOVO: A Grid agora é um Content Row para rolar horizontalmente */}
      <div className="content-grid">
        <div className="content-row">
          {items.length > 0 ? (
            items.map(item => (
              <ContentCard key={`${item.media_type}-${item.id}`} item={item} />
            ))
          ) : (
            <div className="no-content" style={{padding: '2rem', textAlign: 'center', color: 'var(--secondary)', width: '100%'}}>
              {activeSection === 'favorites' ? 'Nenhum favorito adicionado ainda.' : 'Nenhum conteúdo disponível.'}
            </div>
          )}
        </div>
      </div>
    </section>
  )

  const SearchResults = () => (
    <div className="search-results-section active">
      <div className="section-header">
        <h2 className="section-title"><i className="fas fa-search"></i> Resultados para:</h2>
        <span style={{color: 'var(--primary)', marginLeft: 'auto', fontWeight: '600'}}>{searchQuery}</span>
      </div>
      <div className="search-list">
        {searchResults.length > 0 ? searchResults.map(item => (
          <Link
            key={`${item.media_type}-${item.id}`}
            href={`/${item.media_type}/${item.id}`}
            className="search-list-item"
            onClick={() => setSearchResults([])} // Limpa a busca ao navegar
          >
            <img 
              src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : DEFAULT_POSTER}
              alt={item.title || item.name}
              className="search-list-poster"
            />
            <div className="search-list-info">
              <div className="search-list-title">{item.title || item.name}</div>
              <div className="search-list-meta">
                {item.media_type === 'movie' ? 'Filme' : 'Série'} | 
                {item.release_date ? new Date(item.release_date).getFullYear() : 
                 item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A'}
              </div>
              <div className="search-list-overview">
                {item.overview || 'Sinopse não disponível'}
              </div>
            </div>
          </Link>
        )) : (
            <div className="error-message active" style={{width: '100%', borderLeftColor: 'var(--secondary)'}}>
                <h3><i className="fas fa-info-circle"></i> Sem Resultados</h3>
                <p>Não encontramos nenhum filme ou série para a busca: **{searchQuery}**.</p>
                <button 
                  className="nav-button secondary" 
                  style={{marginTop: '1rem', width: 'auto'}}
                  onClick={() => resetSearch()}
                >
                  <i className="fas fa-arrow-left"></i> Voltar
                </button>
            </div>
        )}
      </div>
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

      {/* Remover o Header antigo e a busca duplicada */}
      {/* <Header onSearch={handleSearch} /> */}

      <main className="container">
        {loading && (
          <div className="loading active">
            <div className="spinner"></div>
            <p>Carregando conteúdo...</p>
          </div>
        )}
        
        {searchResults.length > 0 || searchQuery ? (
          <SearchResults />
        ) : (
          <div className="home-sections">
            {/* NOVO: Exibe todas as seções (Lançamentos, Recomendações e Favoritos) na Home, usando a navegação inferior para destacar o conteúdo, se não houver busca ativa */}
            <ContentGrid items={releases} title="🎬 Últimos Lançamentos" />
            <ContentGrid items={recommendations} title="🔥 Populares e Recomendações" />
            
            {/* Seção de Favoritos sempre no final, mas só se tiver itens */}
            {favorites.length > 0 && (
                <ContentGrid items={favorites} title="❤️ Meus Favoritos" />
            )}
          </div>
        )}
        
        {/* Adicionar botão de "Voltar" se estiver em busca ativa */}
        {searchResults.length > 0 && (
          <button 
            className="back-to-home" 
            onClick={() => resetSearch()}
            style={{display: 'flex'}}
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </main>

      {/* NOVO: Container Flutuante de Navegação e Busca */}
      <BottomNavigationBar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection}
        setIsSearchOverlayOpen={setIsSearchOverlayOpen}
      />
      
      {/* NOVO: Overlay de Busca */}
      <SearchOverlay 
        isOpen={isSearchOverlayOpen} 
        onClose={() => setIsSearchOverlayOpen(false)}
        onSearch={handleSearch}
        currentQuery={searchQuery}
      />
      
      {/* Remover o Footer (já que o CSS o esconde) */}
      {/* <Footer /> */}
    </>
  )
}

// REMOVER o componente Header (foi substituído pela barra inferior e pelo overlay de busca)
/* const Header = (...) => { ... } */

// NOVO: Componente para a barra de navegação flutuante inferior (Glassmorphism)
const BottomNavigationBar = ({ activeSection, setActiveSection, setIsSearchOverlayOpen }) => (
    <div className="bottom-nav-container">
        <div className="main-nav-bar">
            {/* Lançamentos */}
            <button 
                className={`nav-item ${activeSection === 'releases' ? 'active' : ''}`}
                onClick={() => setActiveSection('releases')}
            >
                <i className="fas fa-film"></i>
                <span>Lançamentos</span>
            </button>
            
            {/* Populares */}
            <button 
                className={`nav-item ${activeSection === 'recommendations' ? 'active' : ''}`}
                onClick={() => setActiveSection('recommendations')}
            >
                <i className="fas fa-fire"></i>
                <span>Populares</span>
            </button>
            
            {/* Favoritos */}
            <button 
                className={`nav-item ${activeSection === 'favorites' ? 'active' : ''}`}
                onClick={() => setActiveSection('favorites')}
            >
                <i className="fas fa-heart"></i>
                <span>Favoritos</span>
            </button>
        </div>

        {/* Círculo de Pesquisa Separado */}
        <button 
            className="search-circle"
            onClick={() => setIsSearchOverlayOpen(true)}
        >
            <i className="fas fa-search"></i>
        </button>
    </div>
);

// NOVO: Componente para o overlay de busca (tela cheia)
const SearchOverlay = ({ isOpen, onClose, onSearch, currentQuery }) => {
    const [localQuery, setLocalQuery] = useState(currentQuery);

    useEffect(() => {
        // Atualiza a query local se a busca externa mudar (e o overlay estiver fechado)
        if (!isOpen) {
            setLocalQuery(currentQuery);
        }
    }, [currentQuery, isOpen]);
    
    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch(localQuery);
        onClose(); // Fecha o overlay após iniciar a busca
    }

    return (
        <div className={`search-overlay ${isOpen ? 'active' : ''}`}>
            <div className="search-overlay-content">
                <div className="search-overlay-header">
                    <h2 className="search-overlay-title">Buscar Conteúdo</h2>
                    <button 
                        className="close-search-overlay" 
                        onClick={onClose}
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="overlay-search-container">
                    <input
                        type="text"
                        className="overlay-search-input"
                        placeholder="Digite o nome do filme ou série..."
                        value={localQuery}
                        onChange={(e) => setLocalQuery(e.target.value)}
                        autoFocus
                    />
                    <button type="submit" className="overlay-search-button">
                        <i className="fas fa-search"></i>
                    </button>
                </form>
            </div>
        </div>
    );
};

// REMOVER o componente Footer (foi mantido no código original mas está escondido no CSS)
/* const Footer = () => (...) */
