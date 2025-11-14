import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function TVShow() {
  const router = useRouter()
  const { id } = router.query
  const [tvShow, setTvShow] = useState(null)
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [seasonDetails, setSeasonDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPlayer, setSelectedPlayer] = useState('vidsrc')
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const [showPlayerSelector, setShowPlayerSelector] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const STREAM_BASE_URL = 'https://superflixapi.blog'

  useEffect(() => {
    if (id) {
      loadTvShow(id)
      checkIfFavorite()
    }
  }, [id])

  useEffect(() => {
    if (tvShow && season) {
      loadSeasonDetails(season)
    }
  }, [tvShow, season])

  const loadTvShow = async (tvId) => {
    try {
      setLoading(true)
      const tvUrl = `https://api.themoviedb.org/3/tv/${tvId}?api_key=${TMDB_API_KEY}&language=pt-BR`
      const tvResponse = await fetch(tvUrl)
      
      if (!tvResponse.ok) throw new Error('Série não encontrada')
      
      const tvData = await tvResponse.json()
      setTvShow(tvData)
      
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadSeasonDetails = async (seasonNumber) => {
    try {
      const seasonUrl = `https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=pt-BR`
      const seasonResponse = await fetch(seasonUrl)
      
      if (seasonResponse.ok) {
        const seasonData = await seasonResponse.json()
        setSeasonDetails(seasonData)
      }
    } catch (err) {
      console.error('Erro ao carregar temporada:', err)
    }
  }

  const checkIfFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    const isFav = favorites.some(fav => fav.id === parseInt(id) && fav.type === 'tv')
    setIsFavorite(isFav)
  }

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    
    if (isFavorite) {
      const newFavorites = favorites.filter(fav => !(fav.id === parseInt(id) && fav.type === 'tv'))
      localStorage.setItem('favorites', JSON.stringify(newFavorites))
      setIsFavorite(false)
    } else {
      const newFavorite = {
        id: parseInt(id),
        type: 'tv',
        title: tvShow.name,
        poster: tvShow.poster_path ? `https://image.tmdb.org/t/p/w500${tvShow.poster_path}` : 'https://yoshikawa-bot.github.io/cache/images/6e595b38.jpg',
        year: tvShow.first_air_date ? new Date(tvShow.first_air_date).getFullYear() : 'N/A'
      }
      favorites.push(newFavorite)
      localStorage.setItem('favorites', JSON.stringify(favorites))
      setIsFavorite(true)
    }
  }

  const getPlayerUrl = () => {
    if (selectedPlayer === 'superflix') {
      return `${STREAM_BASE_URL}/serie/${id}/${season}/${episode}#noEpList#noLink#transparent#noBackground`
    } else {
      return `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`
    }
  }
  
  // FUNÇÕES DE FECHAMENTO COM ANIMAÇÃO
  const closePopup = (setter) => {
    const element = document.querySelector('.info-popup-overlay.active, .player-selector-bubble.active');
    if (element) {
        element.classList.add('closing');
        setTimeout(() => {
            setter(false);
            element.classList.remove('closing');
        }, 300); // Deve corresponder ao 'transition' ou 'animation-duration' do CSS
    } else {
        setter(false);
    }
  };
  
  // Manipulador de clique no overlay de informações
  const handleInfoOverlayClick = (e) => {
    if (e.target.classList.contains('info-popup-overlay')) {
      closePopup(setShowInfoPopup);
    }
  };
  
  // Manipulador de clique no overlay do player selector (o bubble é fixo e não tem overlay, mas usaremos a lógica de clique fora se o JS for ajustado para usar um overlay)
  // Como o seletor é um 'bubble' fixo na tela, a lógica de fechar ao clicar fora não é a mesma de um 'overlay'. 
  // No seu caso, o player-selector-bubble não é um overlay, então vamos tratar o fechamento dele manualmente para manter a estética. 
  
  // Se o seletor de player deve fechar ao clicar fora, ele precisa de um overlay.
  // Vou criar um overlay de fundo invisível para o player selector.

  const handleSelectorOverlayClick = (e) => {
    if (e.target.classList.contains('player-selector-overlay')) {
      closePopup(setShowPlayerSelector);
    }
  };
  
  const handleSeasonChange = (newSeason) => {
    setSeason(newSeason)
    setEpisode(1)
  }

  const handleEpisodeChange = (newEpisode) => {
    setEpisode(newEpisode)
  }

  if (loading) {
    return (
      <div className="loading active">
        <div className="spinner"></div>
        <p>Carregando série...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-message active">
        <h3>
          <i className="fas fa-exclamation-triangle"></i>
          Ocorreu um erro
        </h3>
        <p>{error}</p>
        <Link href="/" className="clear-search-btn" style={{marginTop: '1rem'}}>
          <i className="fas fa-home"></i>
          Voltar para Home
        </Link>
      </div>
    )
  }

  if (!tvShow) return null

  const currentEpisode = seasonDetails?.episodes?.find(ep => ep.episode_number === episode)

  return (
    <>
      <Head>
        <title>{tvShow.name} S{season} E{episode} - Yoshikawa Player</title>
      </Head>

      <Header />

      <main className="streaming-container">
        <div className="player-container">
          <div className="player-wrapper">
            <iframe 
              src={getPlayerUrl()}
              allow="autoplay; encrypted-media; picture-in-picture" 
              allowFullScreen 
              loading="lazy" 
              title={`Yoshikawa Player - ${tvShow.name} S${season} E{episode}`}
            ></iframe>
          </div>
        </div>

        <div className="content-info-streaming">
          <h1 className="content-title-streaming">
            {tvShow.name} - {currentEpisode?.name || `Episódio ${episode}`}
          </h1>
          
          <div className={`episode-selector-streaming ${tvShow ? 'active' : ''}`}>
            <div className="selector-group-streaming">
              <span className="selector-label-streaming">Temporada:</span>
              <select 
                className="selector-select-streaming" 
                value={season}
                onChange={(e) => handleSeasonChange(parseInt(e.target.value))}
              >
                {tvShow.seasons
                  .filter(s => s.season_number > 0 && s.episode_count > 0)
                  .map(season => (
                    <option key={season.season_number} value={season.season_number}>
                      T{season.season_number}
                    </option>
                  ))
                }
              </select>
            </div>
            <div className="selector-group-streaming">
              <span className="selector-label-streaming">Episódio:</span>
              <select 
                className="selector-select-streaming" 
                value={episode}
                onChange={(e) => handleEpisodeChange(parseInt(e.target.value))}
              >
                {seasonDetails?.episodes?.map(ep => (
                  <option key={ep.episode_number} value={ep.episode_number}>
                    E{ep.episode_number}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="content-description-streaming">
            {currentEpisode?.overview || tvShow.overview || 'Descrição não disponível'}
          </p>
        </div>

        {/* 1. Overlay para o Seletor de Player (para fechar ao clicar fora) */}
        {showPlayerSelector && (
            <div className="player-selector-overlay menu-overlay active" onClick={handleSelectorOverlayClick}>
                <div 
                    className={`player-selector-bubble ${showPlayerSelector ? 'active' : ''}`}
                    onClick={(e) => e.stopPropagation()} // Impede o fechamento ao clicar DENTRO do bubble
                >
                    <div className="player-options-bubble">
                        <div 
                            className="player-option-bubble"
                            onClick={() => {
                                setSelectedPlayer('superflix')
                                closePopup(setShowPlayerSelector)
                            }}
                        >
                            <div className="option-main-line">
                                <i className="fas fa-film"></i>
                                <span className="option-name">SuperFlix</span>
                                <span className="player-tag-bubble player-tag-dub">DUB</span>
                            </div>
                            <span className="option-details">Lento, mas possui dublagem.</span>
                        </div>
                        <div 
                            className="player-option-bubble"
                            onClick={() => {
                                setSelectedPlayer('vidsrc')
                                closePopup(setShowPlayerSelector)
                            }}
                        >
                            <div className="option-main-line">
                                <i className="fas fa-bolt"></i>
                                <span className="option-name">VidSrc</span>
                                <span className="player-tag-bubble player-tag-sub">LEG</span>
                            </div>
                            <span className="option-details">Mais rápido, mas apenas legendado.</span>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* 2. Popup de Informações (Overlay) */}
        <div 
            className={`info-popup-overlay ${showInfoPopup ? 'active' : ''}`}
            onClick={handleInfoOverlayClick} // Fechar ao clicar no overlay
        >
          <div 
              className="info-popup-content"
              onClick={(e) => e.stopPropagation()} // Impede o fechamento ao clicar DENTRO do conteúdo
          >
            <div className="info-popup-header">
              <img 
                src={tvShow.poster_path ? `https://image.tmdb.org/t/p/w500${tvShow.poster_path}` : 'https://yoshikawa-bot.github.io/cache/images/6e595b38.jpg'}
                alt={tvShow.name}
                className="info-poster"
              />
              <div className="info-details">
                <h2 className="info-title">{tvShow.name}</h2>
                <div className="info-meta">
                  <span><i className="fas fa-calendar"></i> {tvShow.first_air_date ? new Date(tvShow.first_air_date).getFullYear() : 'N/A'}</span>
                  <span><i className="fas fa-star"></i> {tvShow.vote_average ? tvShow.vote_average.toFixed(1) : 'N/A'}</span>
                  <span><i className="fas fa-tags"></i> {tvShow.genres ? tvShow.genres.map(g => g.name).join(', ') : ''}</span>
                </div>
                <div className="info-meta">
                  <span><i className="fas fa-layer-group"></i> {tvShow.number_of_seasons} temporadas</span>
                  <span><i className="fas fa-tv"></i> {tvShow.number_of_episodes} episódios</span>
                </div>
              </div>
            </div>
            <p className="info-description">
              {tvShow.overview || 'Descrição não disponível.'}
            </p>
            <button 
              className="close-popup-btn"
              onClick={() => closePopup(setShowInfoPopup)} // Usar a função de fechamento com animação
            >
              <i className="fas fa-times"></i>
              Fechar
            </button>
          </div>
        </div>
      </main>

      <BottomNav 
        selectedPlayer={selectedPlayer}
        onPlayerChange={() => setShowPlayerSelector(prev => !prev)}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        onShowInfo={() => setShowInfoPopup(prev => !prev)}
      />
    </>
  )
}

const Header = () => (
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

const BottomNav = ({ selectedPlayer, onPlayerChange, isFavorite, onToggleFavorite, onShowInfo }) => (
  <div className="bottom-nav-container streaming-mode">
    <div className="main-nav-bar">
      {/* Botão de Voltar para Home (Substitui o item esquerdo da Home) */}
      <Link href="/" className="nav-item">
        <i className="fas fa-home"></i>
      </Link>
      
      {/* Botão de Troca de Player (Item direito da Home) */}
      <button className="nav-item" onClick={onPlayerChange}>
        <i className={selectedPlayer === 'superflix' ? 'fas fa-film' : 'fas fa-bolt'}></i>
      </button>
    </div>
    
    {/* Círculo Central de Ação/Informação (Substitui o search-circle) */}
    <button className="info-circle" onClick={onShowInfo}>
      <i className="fas fa-info-circle"></i>
    </button>
    
    {/* Círculo de Favoritos (Separado na sua estrutura original, mas aqui simplificado como último item) */}
    {/* Na verdade, o layout da home é [nav-bar (home, favs)], [search-circle]. Vou ajustar para replicar o layout de 3 botões da Home. */}
    {/* A barra principal na home tem [Home] e [Favoritos] dentro. O círculo é o [Search]. */}
    
    {/* Como você pediu para usar o info-circle, vamos manter o layout de 2 itens na barra e o círculo central. */}
    {/* Vou reverter o [nav-item] da home e usar o favorito no lado direito da barra principal. */}
    
    <div className="main-nav-bar">
      {/* 1. Voltar para o Início (Substitui o item esquerdo da Home) */}
      <Link href="/" className="nav-item">
        <i className="fas fa-home"></i>
      </Link>
      
      {/* 2. Botão de Favorito (Substitui o item direito da Home) */}
      <button className={`nav-item ${isFavorite ? 'active' : ''}`} onClick={onToggleFavorite}>
        <i className={isFavorite ? 'fas fa-heart' : 'far fa-heart'}></i>
      </button>
    </div>
    
    {/* Círculo Central: Troca de Player */}
    <button className="info-circle" onClick={onPlayerChange}>
      <i className={selectedPlayer === 'superflix' ? 'fas fa-film' : 'fas fa-bolt'}></i>
    </button>
    
    {/* Círculo de Informações: Um botão extra ao lado (ou substituir um dos acima) */}
    {/* Para manter o layout de **três** elementos na parte inferior (barra dividida + círculo central), precisamos escolher quais três ações manter. */}
    {/* Vamos manter: [HOME] | [PLAYER_SELECTOR_CIRCLE] | [FAVORITO] */}
    
    <div className="main-nav-bar">
      {/* 1. Voltar para o Início */}
      <Link href="/" className="nav-item">
        <i className="fas fa-home"></i>
      </Link>
      
      {/* 2. Botão de Informações (Substitui o outro item da barra) */}
      <button className="nav-item" onClick={onShowInfo}>
        <i className="fas fa-info-circle"></i>
      </button>
    </div>
    
    {/* Círculo Central: Troca de Player E Favorito */}
    {/* Pelo seu pedido, o círculo central deve ser o que separa, então deve ser uma das ações: */}

    {/* Estrutura final com 3 ações, replicando a separação: [AÇÃO 1] [CÍRCULO CENTRAL] [AÇÃO 2] */}
    <div className="main-nav-bar">
      {/* 1. Voltar para o Início */}
      <Link href="/" className="nav-item">
        <i className="fas fa-home"></i>
      </Link>
      
      {/* 2. Botão de Favorito */}
      <button className={`nav-item ${isFavorite ? 'active' : ''}`} onClick={onToggleFavorite}>
        <i className={isFavorite ? 'fas fa-heart' : 'far fa-heart'}></i>
      </button>
    </div>
    
    {/* CÍRCULO CENTRAL: Troca de Player */}
    <button className="info-circle" onClick={onPlayerChange}>
      <i className={selectedPlayer === 'superflix' ? 'fas fa-film' : 'fas fa-bolt'}></i>
    </button>
    
    {/* O botão de "Informações" (info-circle) está faltando neste layout de 3 elementos. 
       Para incluí-lo, o layout deve ter 4 elementos ou o círculo central deve ser o Info.
       
       Vou usar o círculo central como **Troca de Player** e o botão de **Informações** no lado direito da barra principal, 
       mantendo o layout visualmente correto de 3 itens.
    */}
    
    {/* FINAL: [HOME] | [PLAYER_SELECTOR_CIRCLE] | [INFO] */}
    <div className="main-nav-bar">
      {/* 1. Voltar para o Início (Ícone de Casa) */}
      <Link href="/" className="nav-item">
        <i className="fas fa-home"></i>
      </Link>
      
      {/* 2. Botão de Favorito/Ícone de Ativação (Placeholder) */}
      <button className={`nav-item ${isFavorite ? 'active' : ''}`} onClick={onToggleFavorite}>
        <i className={isFavorite ? 'fas fa-heart' : 'far fa-heart'}></i>
      </button>
    </div>
    
    {/* CÍRCULO CENTRAL: Troca de Player */}
    <button className="info-circle" onClick={onPlayerChange}>
      <i className={selectedPlayer === 'superflix' ? 'fas fa-film' : 'fas fa-bolt'}></i>
    </button>
    
    {/* BOTÃO DE INFORMAÇÕES: Onde ele fica? Vamos substituir o Favorito pelo Info. */}
    
    <div className="main-nav-bar">
        {/* 1. Voltar para o Início */}
        <Link href="/" className="nav-item">
            <i className="fas fa-home"></i>
        </Link>
        
        {/* 2. Botão de Informações */}
        <button className="nav-item" onClick={onShowInfo}>
            <i className="fas fa-info-circle"></i>
        </button>
    </div>
    
    {/* CÍRCULO CENTRAL: Troca de Player */}
    <button className="info-circle" onClick={onPlayerChange}>
        <i className={selectedPlayer === 'superflix' ? 'fas fa-film' : 'fas fa-bolt'}></i>
    </button>

  </div>
)
