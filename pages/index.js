<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8" />
    <title>Yoshikawa Player</title>
    <meta name="description" content="Yoshikawa Streaming Player" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
</head>
<body>
    <div id="__next"></div>

    <script type="module">
import { useState, useEffect, useRef, useCallback } from 'https://cdn.jsdelivr.net/npm/react@18/umd/react.development.js';
import { useDebounce } from './debounce.js'; // você pode implementar o debounce separadamente ou inline
import Head from 'https://cdn.jsdelivr.net/npm/next@13/head.js';
import Link from 'https://cdn.jsdelivr.net/npm/next@13/link.js';

const DEFAULT_POSTER = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg';
const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287';

const getItemKey = (item) => `${item.media_type}-${item.id}`;

export default function Home() {
  const [releases, setReleases] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loadingHome, setLoadingHome] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('releases');
  const [toasts, setToasts] = useState([]);

  const searchInputRef = useRef(null);

  // Toast único
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts([{ id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Carrega conteúdo inicial e favoritos
  useEffect(() => {
    const loadData = async () => {
      try {
        const [nowPlaying, onTheAir, popularMovies, popularTv] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`),
          fetch(`https://api.themoviedb.org/3/tv/on_the_air?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`),
          fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`),
          fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`)
        ]);

        const [moviesData, tvData, popularMoviesData, popularTvData] = await Promise.all([
          nowPlaying.json(),
          onTheAir.json(),
          popularMovies.json(),
          popularTv.json()
        ]);

        const allReleases = [
          ...(moviesData.results || []).map(i => ({...i, media_type: 'movie'})),
          ...(tvData.results || []).map(i => ({...i, media_type: 'tv'}))
        ].filter(i => i.poster_path)
         .sort((a, b) => new Date(b.release_date || b.first_air_date) - new Date(a.release_date || a.first_air_date))
         .slice(0, 20);

        const allPopular = [
          ...(popularMoviesData.results || []).map(i => ({...i, media_type: 'movie'})),
          ...(popularTvData.results || []).map(i => ({...i, media_type: 'tv'}))
        ].filter(i => i.poster_path)
         .sort(() => 0.5 - Math.random())
         .slice(0, 20);

        setReleases(allReleases);
        setRecommendations(allPopular);
      } catch (err) {
        showToast('Erro ao carregar conteúdo', 'error');
      } finally {
        setLoadingHome(false);
      }
    };

    const saved = localStorage.getItem('yoshikawaFavorites');
    if (saved) setFavorites(JSON.parse(saved));

    loadData();
  }, []);

  // Foco automático na busca
  useEffect(() => {
    if (activeSection === 'search' && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [activeSection]);

  // Busca
  const fetchSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setLoadingSearch(false);
      return;
    }

    setLoadingSearch(true);
    try {
      const [moviesRes, tvRes] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`),
        fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`)
      ]);

      const [movies, tv] = await Promise.all([moviesRes.json(), tvRes.json()]);

      const results = [
        ...(movies.results || []).map(i => ({...i, media_type: 'movie'})),
        ...(tv.results || []).map(i => ({...i, media_type: 'tv'}))
      ].filter(i => i.poster_path)
       .sort((a, b) => b.popularity - a.popularity)
       .slice(0, 40);

      setSearchResults(results);
    } catch (err) {
      showToast('Erro na busca', 'error');
    } finally {
      setLoadingSearch(false);
    }
  };

  const debouncedSearch = useDebounce(fetchSearch, 300);

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    debouncedSearch(q);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    searchInputRef.current?.focus();
  };

  // Favoritos
  const isFavorite = (item) => favorites.some(f => getItemKey(f) === getItemKey(item));

  const toggleFavorite = (item) => {
    setFavorites(prev => {
      const exists = isFavorite(item);
      let newFavs;
      if (exists) {
        newFavs = prev.filter(f => getItemKey(f) !== getItemKey(item));
        showToast('Removido dos favoritos', 'info');
      } else {
        newFavs = [...prev, {
          id: item.id,
          media_type: item.media_type,
          title: item.title || item.name,
          poster_path: item.poster_path,
          release_date: item.release_date,
          first_air_date: item.first_air_date,
          overview: item.overview
        }];
        showToast('Adicionado aos favoritos!', 'success');
      }
      localStorage.setItem('yoshikawaFavorites', JSON.stringify(newFavs));
      return newFavs;
    });
  };

  const getItems = () => {
    switch (activeSection) {
      case 'releases': return releases;
      case 'recommendations': return recommendations;
      case 'favorites': return favorites;
      default: return releases;
    }
  };

  const getSectionInfo = () => {
    switch (activeSection) {
      case 'releases': return { title: 'Lançamentos', icon: 'fas fa-film' };
      case 'recommendations': return { title: 'Populares', icon: 'fas fa-fire' };
      case 'favorites': return { title: 'Favoritos', icon: 'fas fa-heart' };
      default: return { title: 'Lançamentos', icon: 'fas fa-film' };
    }
  };

  const { title: sectionTitle, icon: sectionIcon } = getSectionInfo();

  const ContentGrid = ({ items, extraClass = '' }) => (
    <div className={`content-grid ${extraClass}`}>
      {items.length > 0 ? items.map(item => {
        const fav = isFavorite(item);
        return (
          <Link key={getItemKey(item)} href={`/${item.media_type}/${item.id}`} className="content-card">
            <img
              src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : DEFAULT_POSTER}
              alt={item.title || item.name}
              loading="lazy"
              className="poster"
            />
            <button
              className={`fav-btn ${fav ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(item); }}
            >
              <i className={fav ? 'fas fa-heart' : 'far fa-heart'}></i>
            </button>
            <div className="overlay-text">
              <div className="title">{item.title || item.name}</div>
              <div className="year">
                {item.release_date ? new Date(item.release_date).getFullYear() :
                 item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A'}
              </div>
            </div>
          </Link>
        );
      }) : (
        <div className="empty-message">
          {activeSection === 'favorites' ? 'Nenhum favorito adicionado.' : 'Nada para mostrar aqui.'}
        </div>
      )}
    </div>
  );

  return (
    <>
      <Head>
        <title>Yoshikawa Player</title>
      </Head>

      <header className="header">
        <div className="header-inner">
          <Link href="/" className="logo">
            <img src="https://yoshikawa-bot.github.io/cache/images/14c34900.jpg" alt="Logo" />
            <div className="logo-text">
              <span>Yoshikawa</span>
              <span className="tag">STREAMING</span>
            </div>
          </Link>
        </div>
      </header>

      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <i className={`fas ${
              t.type === 'success' ? 'fa-check-circle' :
              t.type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'
            }`}></i>
            <span>{t.message}</span>
            <button onClick={() => removeToast(t.id)}><i className="fas fa-times"></i></button>
          </div>
        ))}
      </div>

      <main className="main">
        {activeSection === 'search' ? (
          <div className="search-page">
            <h1 className="page-title"><i className="fas fa-search"></i> Busca</h1>

            <div className="search-bar-wrapper">
              <div className="search-bar">
                <i className="fas fa-search icon"></i>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Filmes, séries..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                {searchQuery && <button className="clear-btn" onClick={clearSearch}><i className="fas fa-times"></i></button>}
              </div>
            </div>

            {loadingSearch && (
              <div className="loading-search">
                <i className="fas fa-spinner fa-spin"></i>
                <span>Buscando...</span>
              </div>
            )}

            {!loadingSearch && searchResults.length > 0 && <ContentGrid items={searchResults} />}

            {!loadingSearch && searchResults.length === 0 && searchQuery && (
              <div className="empty-search">
                <i className="fas fa-ghost"></i>
                <p>Nenhum resultado para “{searchQuery}”</p>
              </div>
            )}

            {!loadingSearch && !searchQuery && (
              <div className="search-prompt">
                <i className="fas fa-search big"></i>
                <p>Digite acima para buscar</p>
              </div>
            )}
          </div>
        ) : (
          <div className="home-page">
            <h1 className="page-title"><i className={sectionIcon}></i> {sectionTitle}</h1>
            {loadingHome ? (
              <div className="loading-home">
                <i className="fas fa-spinner fa-spin"></i>
                <span>Carregando...</span>
              </div>
            ) : (
              <ContentGrid items={getItems()} />
            )}
          </div>
        )}
      </main>

      <nav className="tab-bar">
        <button className={`tab ${activeSection === 'releases' ? 'active' : ''}`} onClick={() => setActiveSection('releases')}>
          <i className="fas fa-film"></i>
          <span>Lançamentos</span>
        </button>
        <button className={`tab ${activeSection === 'recommendations' ? 'active' : ''}`} onClick={() => setActiveSection('recommendations')}>
          <i className="fas fa-fire"></i>
          <span>Populares</span>
        </button>
        <button className={`tab ${activeSection === 'favorites' ? 'active' : ''}`} onClick={() => setActiveSection('favorites')}>
          <i className="fas fa-heart"></i>
          <span>Favoritos</span>
        </button>
        <button className={`tab ${activeSection === 'search' ? 'active' : ''}`} onClick={() => setActiveSection('search')}>
          <i className="fas fa-search"></i>
          <span>Busca</span>
        </button>
      </nav>

      <style>{`
        :root {
          --primary: #ff6b6b;
          --primary-dark: #e05555;
          --secondary: #94a3b8;
          --text: #f1f5f9;
          --bg: #0f172a;
          --card: rgba(15, 23, 42, 0.6);
          --border: rgba(255, 255, 255, 0.1);
          --success: #10b981;
          --error: #ef4444;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Inter', -apple-system, sans-serif;
          background: url('https://yoshikawa-bot.github.io/cache/images/2926e9b3.jpg') center/cover fixed;
          color: var(--text);
          min-height: 100dvh;
          position: relative;
        }
        body::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          z-index: -1;
        }

        .header {
          position: sticky;
          top: 0;
          background: rgba(15, 23, 42, 0.7);
          border-bottom: 1px solid var(--border);
          z-index: 100;
        }
        .header-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 12px 16px;
          display: flex;
          align-items: center;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: inherit;
        }
        .logo img {
          width: 36px;
          height: 36px;
          border-radius: 8px;
        }
        .logo-text {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }
        .logo-text span:first-child { font-weight: 600; font-size: 1.1rem; }
        .tag {
          background: var(--primary);
          color: white;
          font-size: 0.65rem;
          padding: 2px 8px;
          border-radius: 12px;
          align-self: flex-start;
        }

        .main {
          padding: 16px 16px calc(90px + env(safe-area-inset-bottom));
          max-width: 1280px;
          margin: 0 auto;
        }
        .page-title {
          font-size: 1.7rem;
          font-weight: 700;
          margin: 8px 0 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .content-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 16px;
        }
        @media (max-width: 768px) {
          .content-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .content-card {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          background: var(--card);
          border: 1px solid var(--border);
          aspect-ratio: 2/3;
          transition: transform 0.3s ease;
        }
        .content-card:hover { transform: translateY(-6px); }
        .poster {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .fav-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(0,0,0,0.7);
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          color: white;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }
        .fav-btn.active { background: var(--primary); }
        .overlay-text {
          position: absolute;
          bottom: 8px;
          left: 8px;
          right: 8px;
          color: white;
        }
        .overlay-text .title {
          background: rgba(0,0,0,0.85);
          padding: 6px 10px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.95rem;
        }
        .overlay-text .year {
          background: rgba(0,0,0,0.85);
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.85rem;
          margin-top: 4px;
          display: inline-block;
        }

        .empty-message, .empty-search, .search-prompt, .loading-home, .loading-search {
          text-align: center;
          padding: 60px 20px;
          color: var(--secondary);
          font-size: 1.1rem;
        }
        .empty-search i, .search-prompt i { font-size: 4rem; margin-bottom: 16px; opacity: 0.5; }

        /* Busca */
        .search-bar-wrapper { padding: 0 8px 20px; }
        .search-bar {
          display: flex;
          align-items: center;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 12px 16px;
        }
        .search-bar .icon { color: var(--secondary); font-size: 20px; margin-right: 12px; }
        .search-bar input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text);
          font-size: 17px;
          outline: none;
        }
        .search-bar input::placeholder { color: var(--secondary); }
        .clear-btn {
          background: none;
          border: none;
          color: var(--secondary);
          font-size: 20px;
          padding: 4px;
          cursor: pointer;
        }

        /* Tab bar iOS-like */
        .tab-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(15, 23, 42, 0.8);
          border-top: 1px solid var(--border);
          display: flex;
          height: 80px;
          padding-bottom: env(safe-area-inset-bottom);
          z-index: 1000;
        }
        .tab {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          color: var(--secondary);
          background: none;
          border: none;
          font-size: 11px;
          transition: color 0.3s;
        }
        .tab i { font-size: 24px; }
        .tab.active {
          color: var(--primary);
        }

        /* Toast */
        .toast-container {
          position: fixed;
          bottom: calc(90px + env(safe-area-inset-bottom));
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          width: 90%;
          max-width: 400px;
        }
        .toast {
          background: rgba(30, 41, 59, 0.9);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: white;
          box-shadow: 0 8px 25px rgba(0,0,0,0.4);
          animation: slideUp 0.4s ease;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .toast i { font-size: 20px; }
        .toast button { margin-left: auto; opacity: 0.7; }
      `}</style>
    </>
  );
}
    </script>
</body>
</html>
