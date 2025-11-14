import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

// Componente Pop-up de Informações (Adaptado para Séries)
const InfoPopup = ({ content, contentType, onClose }) => {
  if (!content) return null

  // Dados específicos para série
  const title = content.name
  const year = content.first_air_date ? new Date(content.first_air_date).getFullYear() : 'N/A'
  const numSeasons = content.number_of_seasons
  const genres = content.genres ? content.genres.map(g => g.name).join(', ') : ''
  const overview = content.overview || 'Descrição não disponível.'
  const posterPath = content.poster_path ? `https://image.tmdb.org/t/p/w500${content.poster_path}` : 'https://yoshikawa-bot.github.io/cache/images/6e595b38.jpg'

  return (
    <div className="info-popup-overlay active" onClick={onClose}>
      <div className="info-popup-content" onClick={e => e.stopPropagation()}>
        <button className="close-popup-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
        <div className="content-header">
          <img 
            src={posterPath} 
            alt={`Poster de ${title}`} 
            className="content-poster-large"
          />
          <div className="content-info-main">
            <h1 className="content-title-large">{title}</h1>
            <div className="content-meta-large">
              <span><i className="fas fa-calendar"></i> {year}</span>
              <span><i className="fas fa-layer-group"></i> {numSeasons} Temporadas</span>
              <span><i className="fas fa-tags"></i> {genres}</span>
            </div>
            <h3 style={{marginTop: '1rem', marginBottom: '0.5rem'}}>Sinopse</h3>
            <p className="content-description-large">
              {overview}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TVShow() {
  const router = useRouter()
  const { id } = router.query
  const [tvShow, setTvShow] = useState(null)
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [seasonDetails, setSeasonDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // Define um player inicial (por exemplo, SuperFlix)
  const [selectedPlayer, setSelectedPlayer] = useState('superflix') 
  const [showInfoPopup, setShowInfoPopup] = useState(false)

  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const STREAM_BASE_URL = 'https://superflixapi.blog'

  useEffect(() => {
    if (id) {
      loadTvShow(id)
    }
  }, [id])

  useEffect(() => {
    if (tvShow && season) {
      loadSeasonDetails(season)
    }
  }, [tvShow, id, season]) // Adicione id como dependência

  const loadTvShow = async (tvId) => {
    try {
      setLoading(true)
      const tvUrl = `https://api.themoviedb.org/3/tv/${tvId}?api_key=${TMDB_API_KEY}&language=pt-BR`
      const tvResponse = await fetch(tvUrl)
      
      if (!tvResponse.ok) throw new Error('Série não encontrada')
      
      const tvData = await tvResponse.json()
      setTvShow(tvData)

      // Tenta definir a temporada inicial (primeira disponível com episódios)
      const firstSeason = tvData.seasons.find(s => s.season_number >= 1 && s.episode_count > 0)?.season_number || 1
      setSeason(firstSeason)
      
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
        // Se mudarmos de temporada, garante que o episódio volte para 1
        setEpisode(1) 
      }
    } catch (err) {
      console.error('Erro ao carregar temporada:', err)
    }
  }

  const togglePlayer = () => {
    setSelectedPlayer(prevPlayer => 
      prevPlayer === 'superflix' ? 'vidsrc' : 'superflix'
    )
  }

  const toggleFavorite = () => {
    // Lógica para adicionar/remover dos favoritos
    console.log(`Série ${tvShow.name} favoritado/desfavoritado!`)
  }
  
  const handleSeasonChange = (newSeason) => {
    setSeason(newSeason)
    // O useEffect loadSeasonDetails se encarrega de resetar o episódio para 1
  }

  const handleEpisodeChange = (newEpisode) => {
    setEpisode(newEpisode)
  }

  const getPlayerUrl = () => {
    if (!tvShow || !seasonDetails) return ''
    
    if (selectedPlayer === 'superflix') {
      return `${STREAM_BASE_URL}/serie/${id}/${season}/${episode}#noEpList#noLink#transparent#noBackground`
    } else {
      return `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`
    }
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
        <Link href="/" className="nav-button" style={{marginTop: '1rem'}}>
          <i className="fas fa-home"></i>
          Voltar para Home
        </Link>
      </div>
    )
  }

  if (!tvShow) return null

  const currentEpisodeDetails = seasonDetails?.episodes?.find(ep => ep.episode_number === episode)

  // Propriedades para o BottomNav
  const navProps = {
    isReproductionMode: true,
    contentType: 'tv',
    selectedPlayer,
    togglePlayer,
    toggleInfoPopup: () => setShowInfoPopup(true),
    toggleFavorite,
    handleSeasonChange,
    handleEpisodeChange,
    currentSeason: season,
    currentEpisode: episode,
    tvShowSeasons: tvShow.seasons,
    seasonDetails,
  }

  return (
    <>
      <Head>
        <title>{tvShow.name} S{season} E{episode} - Yoshikawa Player</title>
      </Head>

      <Header />

      <main className="container player-page-container">
        {/* Player Wrapper */}
        <div className="player-wrapper">
          <iframe 
            key={`${selectedPlayer}-${season}-${episode}`} // Força a recarregar o iframe ao trocar o player ou ep/temp
            src={getPlayerUrl()}
            allow="autoplay; encrypted-media; picture-in-picture" 
            allowFullScreen 
            loading="lazy" 
            title={`Yoshikawa Player - ${tvShow.name} S${season} E${episode} (${selectedPlayer})`}
          ></iframe>
        </div>

        {/* Informações Abaixo do Embed */}
        <div className="content-info-player">
          <h1 className="content-title-player">
            {tvShow.name} - S{season}E{episode}: {currentEpisodeDetails?.name || `Episódio ${episode}`}
          </h1>
          <div className="content-meta-player">
            <span><i className="fas fa-layer-group"></i> Temporada {season}</span>
            <span><i className="fas fa-tv"></i> Episódio {episode}</span>
            <span><i className="fas fa-clock"></i> {currentEpisodeDetails?.runtime ? `${currentEpisodeDetails.runtime} min` : ''}</span>
          </div>
          <p className="player-overview">
            {currentEpisodeDetails?.overview || tvShow.overview || 'Descrição não disponível'}
          </p>
        </div>

        {/* Pop-up de Informações - Exibido quando showInfoPopup é true */}
        {showInfoPopup && (
          <InfoPopup 
            content={tvShow} 
            contentType="tv" 
            onClose={() => setShowInfoPopup(false)} 
          />
        )}
      </main>

      <BottomNav {...navProps} />
      <Footer />
    </>
  )
}

// --- Componentes Compartilhados (Header, BottomNav, Footer) ---
// Utilize as implementações fornecidas no arquivo Movie.js, garantindo que o BottomNav 
// esteja presente e adaptado para receber as props de controle de Temporada/Episódio. 
// Para evitar repetição, vou incluir apenas os componentes adicionais e modificações 
// necessárias no CSS.
// NOTE: Você deve copiar e colar os componentes Header, BottomNav e Footer do arquivo Movie.js 
// para o TVShow.js para garantir que o BottomNav funcione corretamente em ambos. 
// A versão do BottomNav está inclusa no arquivo Movie.js.

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

const BottomNav = ({ 
  isReproductionMode, 
  contentType, 
  selectedPlayer, 
  togglePlayer, 
  toggleInfoPopup,
  toggleFavorite,
  handleSeasonChange, 
  handleEpisodeChange, 
  currentSeason, 
  currentEpisode, 
  tvShowSeasons, 
  seasonDetails, 
}) => {

  const PlayerSelectorButton = () => {
    const isSuperflix = selectedPlayer === 'superflix'
    return (
      <button className="nav-item player-control-btn" onClick={togglePlayer} title={`Trocar para ${isSuperflix ? 'VidSrc' : 'SuperFlix'}`}>
        <i className={`fas ${isSuperflix ? 'fa-film' : 'fa-bolt'}`}></i>
        <span>{isSuperflix ? 'SuperFlix' : 'VidSrc'}</span>
      </button>
    )
  }

  const InfoButton = () => (
    <button className="nav-item player-control-btn" onClick={toggleInfoPopup} title="Ver Informações">
      <i className="fas fa-info-circle"></i>
      <span>Informações</span>
    </button>
  )

  const FavoriteButton = () => (
    <button className="nav-item player-control-btn" onClick={toggleFavorite} title="Adicionar aos Favoritos">
      <i className="fas fa-heart"></i>
      <span>Favorito</span>
    </button>
  )
  
  const HomeButton = () => (
    <Link href="/" className="nav-item player-control-btn" title="Voltar para Home">
      <i className="fas fa-home"></i>
      <span>Home</span>
    </Link>
  )
  
  // Controles de Episódio/Temporada (Apenas para Série)
  const SeasonEpisodeControls = () => {
    if (contentType !== 'tv') return null
    
    return (
      <>
        {/* Dropdown de Temporada */}
        <div className="nav-item selector-nav-item">
            <span className="selector-label">Temp:</span>
            <select 
              className="selector-select nav-select" 
              value={currentSeason}
              onChange={(e) => handleSeasonChange(parseInt(e.target.value))}
            >
              {tvShowSeasons
                .filter(s => s.season_number > 0 && s.episode_count > 0)
                .map(season => (
                  <option key={season.season_number} value={season.season_number}>
                    T{season.season_number}
                  </option>
                ))
              }
            </select>
        </div>
        
        {/* Dropdown de Episódio */}
        <div className="nav-item selector-nav-item">
            <span className="selector-label">Ep:</span>
            <select 
              className="selector-select nav-select" 
              value={currentEpisode}
              onChange={(e) => handleEpisodeChange(parseInt(e.target.value))}
            >
              {seasonDetails?.episodes?.map(ep => (
                <option key={ep.episode_number} value={ep.episode_number}>
                  E{ep.episode_number}
                </option>
              ))}
            </select>
        </div>
      </>
    )
  }

  return (
    <div className={`bottom-nav-container ${isReproductionMode ? 'reproduction-mode' : ''}`}>
      <div className="main-nav-bar reproduction-nav">
        {/* Botão de Info (Substitui a Search) */}
        <InfoButton /> 

        {/* Controles de Episódio/Temporada (Apenas para Série) */}
        <SeasonEpisodeControls />

        {/* Botões do canto (Juntos no canto oposto ao Info/Controles) */}
        <div className="player-extra-controls">
          <HomeButton /> 
          <PlayerSelectorButton />
          <FavoriteButton />
        </div>
      </div>
      {/* Search Circle e outros itens da Home (Ocultos em reproduction-mode) */}
      <div className="search-circle hidden-on-repro">
         {/* ... (Seus componentes de busca aqui) */}
      </div>
    </div>
  )
}

const Footer = () => (
  <footer>
    <div className="footer-content">
      <p>© 2025 Yoshikawa Bot · Todos os direitos reservados.</p>
      <div className="footer-links">
        <a href="https://yoshikawa-bot.github.io/termos/" className="footer-link" target="_blank" rel="noopener noreferrer">
          Termos de Uso
        </a>
        <a href="https://wa.me/18589258076" className="footer-link" target="_blank" rel="noopener noreferrer">
          Suporte
        </a>
      </div>
    </div>
  </footer>
)
