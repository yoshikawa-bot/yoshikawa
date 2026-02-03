import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'

export default function PlayerPage() {
  const router = useRouter()
  const { type, id } = router.query

  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [activeTab, setActiveTab] = useState('player') // 'player' ou 'info'
  const [scrolled, setScrolled] = useState(false)

  // Sincronização de scroll para a header
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Carregar dados do TMDB
  useEffect(() => {
    if (!id || !type) return
    const fetchData = async () => {
      try {
        const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR`)
        const data = await res.json()
        setItem(data)
        setLoading(false)
      } catch (err) {
        console.error(err)
      }
    }
    fetchData()
  }, [id, type])

  if (loading || !item) return <div className="loading-screen"><div className="spinner"></div></div>

  // Gerador de URL da SuperFlix
  const getEmbedUrl = () => {
    if (type === 'movie') {
      // Filmes usam ID IMDB se disponível, senão TMDB (ajuste conforme a necessidade do título)
      return `https://superflixapi.cv/filme/${item.imdb_id || item.id}#color:#0A84FF`
    }
    return `https://superflixapi.cv/serie/${id}/${season}/${episode}#color:#0A84FF`
  }

  return (
    <>
      <Head>
        <title>{item.title || item.name} | Yoshikawa</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style>{`
          /* Herança de estilos globais da Home */
          body { 
            background: #050505; color: #fff; font-family: 'Inter', sans-serif; margin: 0; 
            background-image: radial-gradient(circle at 50% 0%, #1a1a1a, #050505 90%);
          }
          
          :root {
            --ios-blue: #0A84FF;
            --ease-elastic: cubic-bezier(0.34, 1.56, 0.64, 1);
            --pill-height: 44px;
          }

          .glass-panel {
            background: rgba(255, 255, 255, 0.06);
            backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          /* Header fixa estilo Home */
          .header-nav {
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            width: 90%; max-width: 520px; z-index: 1000;
            display: flex; gap: 12px; transition: all 0.4s var(--ease-elastic);
          }
          
          .header-nav.scrolled { transform: translateX(-50%) translateY(-5px); opacity: 0.4; }
          .header-nav.scrolled:hover { opacity: 1; }

          .back-btn, .info-pill {
            height: var(--pill-height); border-radius: 50px;
            display: flex; align-items: center; justify-content: center;
          }
          
          .back-btn { width: var(--pill-height); color: #fff; }
          .info-pill { flex: 1; font-size: 0.85rem; font-weight: 600; padding: 0 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

          /* Hero & Player Section */
          .player-container {
            width: 100%; max-width: 1000px; margin: 0 auto;
            padding-top: 100px; padding-bottom: 120px;
            animation: fadeIn 0.8s var(--ease-elastic);
          }

          .video-wrapper {
            width: 100%; aspect-ratio: 16/9; border-radius: 24px;
            overflow: hidden; background: #000; position: relative;
            box-shadow: 0 20px 50px rgba(0,0,0,0.8);
            border: 1px solid rgba(255,255,255,0.1);
          }

          iframe { width: 100%; height: 100%; border: none; }

          /* Controles de Episódios */
          .controls-grid {
            margin-top: 25px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
            padding: 0 20px;
          }

          .control-select {
            height: 50px; border-radius: 15px; padding: 0 15px;
            color: #fff; display: flex; align-items: center; justify-content: space-between;
            font-size: 0.9rem; cursor: pointer;
          }

          /* Info do Conteúdo */
          .meta-info { padding: 30px 20px; text-align: left; }
          .meta-title { font-size: 1.8rem; font-weight: 800; margin-bottom: 10px; }
          .meta-desc { font-size: 0.9rem; color: rgba(255,255,255,0.6); line-height: 1.6; }

          /* Navbar Inferior Estilo Home */
          .bottom-bar {
            position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
            width: 90%; max-width: 520px; height: 50px;
            display: flex; align-items: center; justify-content: space-around;
            border-radius: 50px; z-index: 1000;
          }

          .nav-action {
            flex: 1; height: 100%; display: flex; align-items: center; justify-content: center;
            color: rgba(255,255,255,0.4); font-size: 1.2rem; transition: 0.3s;
          }
          .nav-action.active { color: #fff; }

          @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

          .spinner { width: 30px; height: 30px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--ios-blue); border-radius: 50%; animation: spin 1s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
          .loading-screen { height: 100vh; display: flex; align-items: center; justify-content: center; }

          @media (max-width: 768px) {
            .meta-title { font-size: 1.4rem; }
            .player-container { padding-top: 85px; }
            .video-wrapper { border-radius: 0; border-left: none; border-right: none; }
          }
        `}</style>
      </Head>

      {/* Header Superior */}
      <nav className={`header-nav ${scrolled ? 'scrolled' : ''}`}>
        <button className="back-btn glass-panel" onClick={() => router.back()}>
          <i className="fas fa-chevron-left"></i>
        </button>
        <div className="info-pill glass-panel">
          {item.title || item.name}
        </div>
      </nav>

      <main className="player-container">
        {activeTab === 'player' ? (
          <>
            {/* Player Iframe */}
            <div className="video-wrapper">
              <iframe
                src={getEmbedUrl()}
                allowFullScreen
                scrolling="no"
              ></iframe>
            </div>

            {/* Seletores de Série */}
            {type === 'tv' && (
              <div className="controls-grid">
                <div className="control-select glass-panel">
                  <span>Temp. {season}</span>
                  <select 
                    value={season} 
                    onChange={(e) => {setSeason(e.target.value); setEpisode(1)}}
                    style={{ position: 'absolute', opacity: 0, width: '100%', left: 0 }}
                  >
                    {[...Array(item.number_of_seasons)].map((_, i) => (
                      <option key={i} value={i + 1}>Temporada {i + 1}</option>
                    ))}
                  </select>
                  <i className="fas fa-chevron-down" style={{fontSize: '12px'}}></i>
                </div>

                <div className="control-select glass-panel">
                  <span>Episódio {episode}</span>
                  <select 
                    value={episode} 
                    onChange={(e) => setEpisode(e.target.value)}
                    style={{ position: 'absolute', opacity: 0, width: '100%', left: 0 }}
                  >
                    {[...Array(40)].map((_, i) => (
                      <option key={i} value={i + 1}>Episódio {i + 1}</option>
                    ))}
                  </select>
                  <i className="fas fa-play-circle" style={{fontSize: '12px'}}></i>
                </div>
              </div>
            )}

            <div className="meta-info">
              <h1 className="meta-title">{item.title || item.name}</h1>
              <div style={{display: 'flex', gap: '10px', marginBottom: '15px', fontSize: '0.8rem', color: 'var(--ios-blue)'}}>
                <span>{item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0]}</span>
                <span>•</span>
                <span>{item.vote_average?.toFixed(1)} <i className="fas fa-star"></i></span>
                {type === 'tv' && <span>•</span>}
                {type === 'tv' && <span>{item.number_of_episodes} Eps</span>}
              </div>
              <p className="meta-desc">{item.overview || "Nenhuma sinopse disponível em português."}</p>
            </div>
          </>
        ) : (
          <div className="meta-info" style={{animation: 'fadeIn 0.5s ease'}}>
             {/* Aqui você pode adicionar elenco ou recomendações similares futuramente */}
             <h2 className="meta-title">Mais Detalhes</h2>
             <p className="meta-desc">Gêneros: {item.genres?.map(g => g.name).join(', ')}</p>
          </div>
        )}
      </main>

      {/* Navbar Inferior Estilo Home */}
      <div className="bottom-bar glass-panel">
        <button 
          className={`nav-action ${activeTab === 'player' ? 'active' : ''}`}
          onClick={() => setActiveTab('player')}
        >
          <i className="fas fa-play"></i>
        </button>
        <button 
          className={`nav-action ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          <i className="fas fa-circle-info"></i>
        </button>
        <button className="nav-action" onClick={() => window.open(`https://www.youtube.com/results?search_query=${item.title || item.name}+trailer`, '_blank')}>
          <i className="fab fa-youtube"></i>
        </button>
      </div>
    </>
  )
}
