import{useState,useEffect,useRef,useCallback}from'react'
import Head from'next/head'
import Link from'next/link'

const TMDB_API_KEY='66223dd3ad2885cf1129b181c7826287'
const DEFAULT_POSTER='https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'
const LOGO_URL='https://yoshikawa-bot.github.io/cache/images/fec8bb6d.png'

const CATEGORIES=[
  {name:'Aventura',color:'#7FA8D8',genre:12},
  {name:'Ação',color:'#3F6D89',genre:28},
  {name:'Comédia',color:'#C43708',genre:35},
  {name:'Dublado',color:'#43A45D',genre:16},
  {name:'Drama',color:'#2C3F59',genre:18},
  {name:'Escolar',color:'#72615F',genre:10751},
  {name:'Fantasia',color:'#E97820',genre:14},
  {name:'Romance',color:'#A8A8B6',genre:10749},
  {name:'Slice of Life',color:'#E38CA8',genre:35},
  {name:'Sobrenatural',color:'#9D95C8',genre:27}
]

const FILTERS=['Tudo','Filmes','Séries','Animes']

const useDebounce=(callback,delay)=>{
  const timeoutRef=useRef(null)
  return useCallback((...args)=>{
    if(timeoutRef.current)clearTimeout(timeoutRef.current)
    timeoutRef.current=setTimeout(()=>callback(...args),delay)
  },[callback,delay])
}

export const LoadingScreen=({onComplete})=>{
  const[closing,setClosing]=useState(false)
  const[mounted,setMounted]=useState(true)

  useEffect(()=>{
    const timer=setTimeout(()=>{
      setClosing(true)
    },2000)

    return()=>clearTimeout(timer)
  },[])

  useEffect(()=>{
    if(closing){
      const timer=setTimeout(()=>{
        setMounted(false)
        onComplete()
      },800)
      return()=>clearTimeout(timer)
    }
  },[closing,onComplete])

  if(!mounted)return null

  return(
    <div className={`loading-overlay ${closing?'closing':''}`}>
      <div className="loading-content">
        <img src={LOGO_URL} alt="Yoshikawa" className="loading-logo"/>
        <div className="loading-spinner"></div>
      </div>
    </div>
  )
}

export const Header=()=>{
  return(
    <header className="header">
      <img src={LOGO_URL} alt="Yoshikawa" className="header-logo"/>
      <div className="header-actions">
        <Link href="/search">
          <button className="header-btn">
            <i className="fas fa-search"></i>
          </button>
        </Link>
        <Link href="/profile">
          <button className="header-btn profile-btn">
            <i className="fas fa-user"></i>
          </button>
        </Link>
      </div>
    </header>
  )
}

export const BottomNav=({activeSection,setActiveSection})=>{
  return(
    <nav className="bottom-nav">
      <button 
        className={`nav-item ${activeSection==='home'?'active':''}`}
        onClick={()=>setActiveSection('home')}
      >
        <i className="fas fa-home"></i>
        <span>Início</span>
      </button>
      <button 
        className={`nav-item ${activeSection==='animes'?'active':''}`}
        onClick={()=>setActiveSection('animes')}
      >
        <i className="fas fa-play"></i>
        <span>Animes</span>
      </button>
      <button 
        className={`nav-item ${activeSection==='favorites'?'active':''}`}
        onClick={()=>setActiveSection('favorites')}
      >
        <i className="fas fa-heart"></i>
        <span>Favoritos</span>
      </button>
      <button 
        className={`nav-item ${activeSection==='menu'?'active':''}`}
        onClick={()=>setActiveSection('menu')}
      >
        <i className="fas fa-bars"></i>
        <span>Menu</span>
      </button>
    </nav>
  )
}

export const HorizontalCard=({item,onPlay})=>{
  return(
    <div className="horizontal-card" onClick={()=>onPlay?.(item)}>
      <img src={item.poster_path?`https://image.tmdb.org/t/p/w500${item.poster_path}`:DEFAULT_POSTER} alt={item.title||item.name} className="horizontal-card-img"/>
      <div className="horizontal-card-info">
        <h3 className="horizontal-card-title">{item.title||item.name}</h3>
        <p className="horizontal-card-subtitle">{item.media_type==='tv'?'Série':'Filme'} • {new Date(item.release_date||item.first_air_date).getFullYear()||'N/A'}</p>
      </div>
    </div>
  )
}

export const EpisodeCard=({item})=>{
  return(
    <div className="episode-card">
      <div className="episode-thumbnail">
        <img src={item.poster_path?`https://image.tmdb.org/t/p/w500${item.poster_path}`:DEFAULT_POSTER} alt={item.name||item.title} className="episode-img"/>
        <div className="episode-badge">Dublado</div>
      </div>
      <h4 className="episode-title">{item.name||item.title}</h4>
      <p className="episode-info">Episódio {(item.episode_number||1)} • {item.air_date||'N/A'}</p>
    </div>
  )
}

export const FeaturedCard=({item,onPlay,onInfo})=>{
  return(
    <div className="featured-card">
      <div className="featured-poster">
        <img src={item.poster_path?`https://image.tmdb.org/t/p/w500${item.poster_path}`:DEFAULT_POSTER} alt={item.title||item.name} className="featured-img"/>
      </div>
      <div className="featured-details">
        <div className="featured-text">
          <h2 className="featured-title">{item.title||item.name}</h2>
          <div className="featured-meta">
            <span className="featured-rating">{item.adult?'18+':'L'}</span>
            <span className="featured-genre">{item.genre||'Ação'}</span>
            <span className="featured-year">{new Date(item.release_date||item.first_air_date).getFullYear()||'2025'}</span>
          </div>
          <p className="featured-synopsis">{item.overview||'Sinopse não disponível.'}</p>
        </div>
        <div className="featured-actions">
          <button className="featured-btn play-btn" onClick={()=>onPlay?.(item)}>
            <i className="fas fa-play"></i>
          </button>
          <button className="featured-btn info-btn" onClick={()=>onInfo?.(item)}>
            <i className="fas fa-info"></i>
          </button>
        </div>
      </div>
    </div>
  )
}

export const MovieCard=({item,isFavorite,toggleFavorite})=>{
  const[animating,setAnimating]=useState(false)
  const handleFavClick=(e)=>{
    e.preventDefault();e.stopPropagation()
    setAnimating(true);toggleFavorite(item);setTimeout(()=>setAnimating(false),400)
  }
  return(
    <Link href={`/${item.media_type}/${item.id}`} className="card-wrapper">
      <div className="card-poster-frame">
        <img src={item.poster_path?`https://image.tmdb.org/t/p/w500${item.poster_path}`:DEFAULT_POSTER} alt={item.title||item.name} className="content-poster" loading="lazy"/>
        <button className="fav-btn" onClick={handleFavClick}>
          <i className={`${isFavorite?'fas fa-heart':'far fa-heart'} ${animating?'heart-pulse':''}`} style={{color:isFavorite?'#ff3b30':'#ffffff'}}></i>
        </button>
      </div>
    </Link>
  )
}

export const FavoriteItem=({item,onRemove,onClick})=>{
  return(
    <div className="favorite-item" onClick={()=>onClick?.(item)}>
      <img src={item.poster_path?`https://image.tmdb.org/t/p/w500${item.poster_path}`:DEFAULT_POSTER} alt={item.title} className="favorite-poster"/>
      <div className="favorite-content">
        <h3 className="favorite-title">{item.title}</h3>
        <p className="favorite-year">{item.year||'2025'}</p>
        <p className="favorite-episodes">{item.episodes||'12 Episódios'}</p>
        <div className="favorite-badge">Anime</div>
      </div>
      <button className="favorite-remove" onClick={(e)=>{e.stopPropagation();onRemove?.(item)}}>
        <i className="fas fa-times"></i>
      </button>
    </div>
  )
}

export const CategoryCard=({category})=>{
  return(
    <div className="category-card" style={{background:category.color}}>
      <div className="category-overlay"></div>
      <h3 className="category-title">{category.name}</h3>
      <img src={`https://image.tmdb.org/t/p/w500/aQvJ5WPzZgYVDrxLX4R6cLJCEaQ.jpg`} className="category-thumbnail" alt={category.name}/>
    </div>
  )
}

export const SettingsItem=({icon,title,description})=>{
  return(
    <div className="settings-item">
      <div className="settings-icon">
        <i className={`fas fa-${icon}`}></i>
      </div>
      <div className="settings-content">
        <h4 className="settings-title">{title}</h4>
        <p className="settings-desc">{description}</p>
      </div>
    </div>
  )
}

export default function Home(){
  const[welcomed,setWelcomed]=useState(false)
  const[loadingComplete,setLoadingComplete]=useState(false)
  const[trending,setTrending]=useState([])
  const[newEpisodes,setNewEpisodes]=useState([])
  const[recentlyAdded,setRecentlyAdded]=useState([])
  const[weeklies,setWeeklies]=useState([])
  const[featured,setFeatured]=useState(null)
  const[dubbed,setDubbed]=useState([])
  const[adventure,setAdventure]=useState([])
  const[comedy,setComedy]=useState([])
  const[romance,setRomance]=useState([])
  const[recommended,setRecommended]=useState([])
  const[animes,setAnimes]=useState([])
  const[favorites,setFavorites]=useState([])
  const[searchQuery,setSearchQuery]=useState('')
  const[searchResults,setSearchResults]=useState([])
  const[activeSection,setActiveSection]=useState('home')
  const[activeFilter,setActiveFilter]=useState('Tudo')
  const[searchActive,setSearchActive]=useState(false)

  useEffect(()=>{
    try{const seen=sessionStorage.getItem('yoshikawaWelcomed');if(seen){setWelcomed(true);setLoadingComplete(true)}else{setWelcomed(false)}}catch{setWelcomed(false)}
  },[])

  const handleLoadingComplete=()=>{
    try{sessionStorage.setItem('yoshikawaWelcomed','1')}catch{}
    setWelcomed(true)
    setLoadingComplete(true)
  }

  useEffect(()=>{
    loadAllContent()
    loadFavorites()
    loadAnimes()
  },[])

  const fetchTMDB=async(url)=>{
    try{const r=await fetch(url);if(!r.ok)throw new Error();const d=await r.json();return d.results||[]}
    catch{return[]}
  }

  const fetchTMDBPages=async(endpoint)=>{
    try{const[r1,r2]=await Promise.all([fetchTMDB(`${endpoint}&page=1`),fetchTMDB(`${endpoint}&page=2`)]);return[...r1,...r2]}
    catch{return[]}
  }

  const loadAllContent=async()=>{
    try{
      const[trendingMovies,nowPlaying,onAir,upcoming,popular,dubbedShows,adventureShows,comedyShows,romanceShows,topRated]=await Promise.all([
        fetchTMDB(`https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_API_KEY}&language=pt-BR`),
        fetchTMDBPages(`https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&language=pt-BR`),
        fetchTMDBPages(`https://api.themoviedb.org/3/tv/on_the_air?api_key=${TMDB_API_KEY}&language=pt-BR`),
        fetchTMDB(`https://api.themoviedb.org/3/movie/upcoming?api_key=${TMDB_API_KEY}&language=pt-BR`),
        fetchTMDBPages(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=pt-BR`),
        fetchTMDB(`https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&language=pt-BR&with_original_language=pt`),
        fetchTMDB(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=12`),
        fetchTMDB(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=35`),
        fetchTMDB(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=10749`),
        fetchTMDB(`https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_API_KEY}&language=pt-BR`)
      ])

      setTrending(trendingMovies.filter(i=>i.poster_path).slice(0,10))
      setNewEpisodes(onAir.filter(i=>i.poster_path).slice(0,10))
      setRecentlyAdded(nowPlaying.filter(i=>i.poster_path).slice(0,10))
      setWeeklies(upcoming.filter(i=>i.poster_path).slice(0,10))
      setFeatured(trendingMovies.filter(i=>i.poster_path)[0]||null)
      setDubbed(dubbedShows.filter(i=>i.poster_path).slice(0,10))
      setAdventure(adventureShows.filter(i=>i.poster_path).slice(0,10))
      setComedy(comedyShows.filter(i=>i.poster_path).slice(0,10))
      setRomance(romanceShows.filter(i=>i.poster_path).slice(0,10))
      setRecommended(topRated.filter(i=>i.poster_path).slice(0,10))
    }catch(e){console.error(e)}
  }

  const loadAnimes=async()=>{
    try{
      const[animeMovies,animeTV]=await Promise.all([
        fetchTMDB(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=16&with_original_language=ja`),
        fetchTMDB(`https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=16&with_original_language=ja`)
      ])
      const combined=[...animeMovies.map(i=>({...i,media_type:'movie'})),...animeTV.map(i=>({...i,media_type:'tv'}))]
        .filter(i=>i.poster_path).sort((a,b)=>b.popularity-a.popularity).slice(0,20)
      setAnimes(combined)
    }catch(e){console.error(e)}
  }

  const loadFavorites=()=>{
    try{const s=localStorage.getItem('yoshikawaFavorites');setFavorites(s?JSON.parse(s):[])}catch{setFavorites([])}
  }

  const isFavorite=(item)=>favorites.some(f=>f.id===item.id&&f.media_type===item.media_type)

  const toggleFavorite=(item)=>{
    setFavorites(prev=>{
      const exists=prev.some(f=>f.id===item.id&&f.media_type===item.media_type)
      let updated
      if(exists){updated=prev.filter(f=>!(f.id===item.id&&f.media_type===item.media_type))}
      else{updated=[...prev,{id:item.id,media_type:item.media_type,title:item.title||item.name,poster_path:item.poster_path}]}
      try{localStorage.setItem('yoshikawaFavorites',JSON.stringify(updated))}catch{}
      return updated
    })
  }

  const removeFavorite=(item)=>{
    setFavorites(prev=>{
      const updated=prev.filter(f=>!(f.id===item.id&&f.media_type===item.media_type))
      try{localStorage.setItem('yoshikawaFavorites',JSON.stringify(updated))}catch{}
      return updated
    })
  }

  const handlePlay=(item)=>{
    window.location.href=`/${item.media_type}/${item.id}`
  }

  const handleInfo=(item)=>{
    window.location.href=`/${item.media_type}/${item.id}`
  }

  const filteredFavorites=activeFilter==='Tudo'?favorites:
    activeFilter==='Filmes'?favorites.filter(f=>f.media_type==='movie'):
    activeFilter==='Séries'?favorites.filter(f=>f.media_type==='tv'):
    favorites

  const renderHomePage=()=>(
    <>
      <section className="section">
        <h2 className="section-title">Em alta</h2>
        <div className="horizontal-scroll">
          {trending.map(item=>(
            <HorizontalCard key={`${item.media_type}-${item.id}`} item={item} onPlay={handlePlay}/>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Novos episódios</h2>
        <div className="horizontal-scroll">
          {newEpisodes.map(item=>(
            <EpisodeCard key={`${item.media_type}-${item.id}`} item={item}/>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Recém adicionados</h2>
        <div className="vertical-scroll">
          {recentlyAdded.map(item=>(
            <MovieCard key={`${item.media_type}-${item.id}`} item={item} isFavorite={isFavorite(item)} toggleFavorite={toggleFavorite}/>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Semanais</h2>
        <div className="vertical-scroll">
          {weeklies.map(item=>(
            <MovieCard key={`${item.media_type}-${item.id}`} item={item} isFavorite={isFavorite(item)} toggleFavorite={toggleFavorite}/>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Lançamento</h2>
        {featured&&(
          <FeaturedCard item={featured} onPlay={handlePlay} onInfo={handleInfo}/>
        )}
      </section>

      <section className="section">
        <h2 className="section-title">Com dublagem</h2>
        <div className="vertical-scroll">
          {dubbed.map(item=>(
            <MovieCard key={`${item.media_type}-${item.id}`} item={item} isFavorite={isFavorite(item)} toggleFavorite={toggleFavorite}/>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Aventura</h2>
        <div className="vertical-scroll">
          {adventure.map(item=>(
            <MovieCard key={`${item.media_type}-${item.id}`} item={item} isFavorite={isFavorite(item)} toggleFavorite={toggleFavorite}/>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Comédia</h2>
        <div className="vertical-scroll">
          {comedy.map(item=>(
            <MovieCard key={`${item.media_type}-${item.id}`} item={item} isFavorite={isFavorite(item)} toggleFavorite={toggleFavorite}/>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Romance</h2>
        <div className="vertical-scroll">
          {romance.map(item=>(
            <MovieCard key={`${item.media_type}-${item.id}`} item={item} isFavorite={isFavorite(item)} toggleFavorite={toggleFavorite}/>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Talvez você goste</h2>
        <div className="vertical-scroll">
          {recommended.map(item=>(
            <MovieCard key={`${item.media_type}-${item.id}`} item={item} isFavorite={isFavorite(item)} toggleFavorite={toggleFavorite}/>
          ))}
        </div>
      </section>
    </>
  )

  const renderAnimesPage=()=>(
    <>
      <section className="section">
        <h2 className="section-title">Animes em destaque</h2>
        <div className="horizontal-scroll">
          {animes.slice(0,5).map(item=>(
            <HorizontalCard key={`${item.media_type}-${item.id}`} item={item} onPlay={handlePlay}/>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Todos os Animes</h2>
        <div className="vertical-scroll">
          {animes.map(item=>(
            <MovieCard key={`${item.media_type}-${item.id}`} item={item} isFavorite={isFavorite(item)} toggleFavorite={toggleFavorite}/>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Animes populares</h2>
        <div className="horizontal-scroll">
          {animes.slice(5,10).map(item=>(
            <EpisodeCard key={`${item.media_type}-${item.id}`} item={item}/>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Recomendados para você</h2>
        <div className="vertical-scroll">
          {animes.slice(10,20).map(item=>(
            <MovieCard key={`${item.media_type}-${item.id}`} item={item} isFavorite={isFavorite(item)} toggleFavorite={toggleFavorite}/>
          ))}
        </div>
      </section>
    </>
  )

  const renderFavoritesPage=()=>(
    <>
      <section className="section">
        <h2 className="section-title" style={{fontSize:'34px',fontWeight:'800'}}>Favoritos</h2>
        <div className="filters-container">
          {FILTERS.map(filter=>(
            <button 
              key={filter}
              className={`filter-btn ${activeFilter===filter?'active':''}`}
              onClick={()=>setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="favorites-list">
          {filteredFavorites.length===0?(
            <div className="empty-favorites">
              <i className="far fa-heart" style={{fontSize:'48px',color:'#333',marginBottom:'16px'}}></i>
              <p style={{color:'#666',fontSize:'18px'}}>Nenhum favorito encontrado</p>
            </div>
          ):(
            filteredFavorites.map(item=>(
              <FavoriteItem 
                key={`${item.media_type}-${item.id}`} 
                item={item} 
                onRemove={removeFavorite}
                onClick={handlePlay}
              />
            ))
          )}
        </div>
      </section>
    </>
  )

  const renderSearchPage=()=>(
    <>
      <section className="section">
        <div className="search-container">
          <Link href="/">
            <button className="search-back-btn">
              <i className="fas fa-arrow-left"></i>
            </button>
          </Link>
          <div className="search-bar">
            <i className="fas fa-search search-icon"></i>
            <input 
              type="text" 
              placeholder="O que está procurando?"
              className="search-input"
              value={searchQuery}
              onChange={(e)=>setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="filters-container" style={{marginTop:'30px'}}>
          {FILTERS.map(filter=>(
            <button 
              key={filter}
              className={`filter-btn ${activeFilter===filter?'active':''}`}
              onClick={()=>setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title" style={{fontSize:'38px',fontWeight:'800'}}>Categorias</h2>
        <div className="categories-grid">
          {CATEGORIES.map((category,index)=>(
            <CategoryCard key={index} category={category}/>
          ))}
        </div>
      </section>
    </>
  )

  const renderMenuPage=()=>(
    <>
      <section className="section" style={{paddingTop:'80px'}}>
        <div className="banner-container">
          <div className="verify-banner">
            <span>Verifique sua conta para personalização e comentários!</span>
            <i className="fas fa-chevron-right"></i>
          </div>
        </div>

        <div className="user-card">
          <div className="user-avatar">
            <i className="fas fa-user" style={{fontSize:'40px',color:'#666'}}></i>
          </div>
          <div className="user-info">
            <h3 className="user-name">lyansky</h3>
            <p className="user-email">usuario@email.com</p>
          </div>
          <button className="logout-btn">
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>

        <div className="settings-card">
          <SettingsItem icon="cog" title="Configurações" description="Ajustes do aplicativo"/>
          <SettingsItem icon="shield-alt" title="Privacidade" description="Gerenciar dados"/>
          <SettingsItem icon="question-circle" title="Ajuda" description="Central de suporte"/>
          <SettingsItem icon="info-circle" title="Sobre" description="Versão do app"/>
        </div>

        <div className="social-links">
          <button className="social-btn">
            <i className="fas fa-link"></i>
          </button>
          <button className="social-btn">
            <i className="fab fa-tiktok"></i>
          </button>
          <button className="social-btn">
            <i className="fab fa-twitter"></i>
          </button>
        </div>

        <div className="version-info">
          <p>RELEASE BUILD - 1.4.3.R1.0</p>
        </div>
      </section>
    </>
  )

  return(
    <>
      <Head>
        <title>Yoshikawa Player</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
        <style>{`
          *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
          html{scroll-behavior:smooth}
          body{font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;background:#050505;color:#f5f5f7;line-height:1.6;font-size:16px;min-height:100vh;overflow-y:auto;overflow-x:hidden}
          a{color:inherit;text-decoration:none}
          button{font-family:inherit;border:none;outline:none;background:none;cursor:pointer;user-select:none}
          img{max-width:100%;height:auto;display:block}

          .loading-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:#000000;transition:opacity 0.8s ease}
          .loading-overlay.closing{opacity:0;pointer-events:none}
          .loading-content{display:flex;flex-direction:column;align-items:center;gap:32px}
          .loading-logo{width:180px;height:180px;object-fit:contain}
          .loading-spinner{width:40px;height:40px;border:3px solid rgba(255,255,255,0.1);border-top-color:#ffffff;border-radius:50%;animation:spin 0.8s linear infinite}
          @keyframes spin{to{transform:rotate(360deg)}}

          .header{position:fixed;top:0;left:0;right:0;z-index:1000;background:#101010;padding:24px 32px;display:flex;justify-content:space-between;align-items:center;height:90px}
          .header-logo{width:48px;height:48px;object-fit:contain}
          .header-actions{display:flex;align-items:center;gap:28px}
          .header-btn{width:34px;height:34px;display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:24px;transition:opacity 0.2s}
          .header-btn:hover{opacity:0.8}
          .profile-btn{width:60px;height:60px;border-radius:50%;background:#2a2a2a;color:#666;font-size:28px}

          .container{padding-top:90px;padding-bottom:96px}

          .section{margin-top:24px}
          .section-title{font-size:32px;font-weight:700;color:#ffffff;margin-left:34px;margin-bottom:24px}

          .horizontal-scroll{display:flex;overflow-x:auto;gap:18px;padding-left:34px;padding-right:34px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
          .horizontal-scroll::-webkit-scrollbar{display:none}

          .horizontal-card{flex-shrink:0;width:560px;height:255px;border-radius:28px;overflow:hidden;position:relative;cursor:pointer}
          .horizontal-card-img{width:100%;height:100%;object-fit:cover}
          .horizontal-card-info{position:absolute;bottom:0;left:0;right:0;padding:20px;background:linear-gradient(to top,rgba(0,0,0,0.85),rgba(0,0,0,0))}
          .horizontal-card-title{font-size:18px;font-weight:700;color:#ffffff;margin-bottom:4px}
          .horizontal-card-subtitle{font-size:12px;font-weight:500;color:#c8c8c8}

          .episode-card{flex-shrink:0;width:330px}
          .episode-thumbnail{position:relative;height:185px;border-radius:20px;overflow:hidden;margin-bottom:8px}
          .episode-img{width:100%;height:100%;object-fit:cover}
          .episode-badge{position:absolute;top:10px;left:10px;background:rgba(0,0,0,0.65);border-radius:12px;padding:4px 12px;font-size:14px;font-weight:600;color:#ffffff}
          .episode-title{font-size:17px;font-weight:700;color:#ffffff;margin-bottom:4px}
          .episode-info{font-size:12px;font-weight:500;color:#c8c8c8}

          .vertical-scroll{display:flex;overflow-x:auto;gap:18px;padding-left:34px;padding-right:34px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
          .vertical-scroll::-webkit-scrollbar{display:none}

          .card-wrapper{flex-shrink:0;width:140px;cursor:pointer}
          .card-poster-frame{position:relative;border-radius:16px;overflow:hidden;aspect-ratio:2/3;background:#1a1a1a}
          .content-poster{width:100%;height:100%;object-fit:cover}
          .fav-btn{position:absolute;top:8px;right:8px;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;opacity:0;transition:all 0.3s;background:rgba(0,0,0,0.4)}
          .card-poster-frame:hover .fav-btn{opacity:1}
          @media(hover:none){.fav-btn{opacity:1}}
          .heart-pulse{animation:heartZoom 0.5s ease}
          @keyframes heartZoom{0%{transform:scale(1)}50%{transform:scale(1.6)}100%{transform:scale(1)}}

          .featured-card{border-radius:20px;overflow:hidden;margin:24px 34px;background:#121212}
          .featured-poster{width:100%;aspect-ratio:16/9;overflow:hidden}
          .featured-img{width:100%;height:100%;object-fit:cover}
          .featured-details{position:relative;padding:24px;background:#121212}
          .featured-text{margin-bottom:16px}
          .featured-title{font-size:24px;font-weight:700;color:#ffffff;margin-bottom:12px}
          .featured-meta{display:flex;gap:16px;margin-bottom:16px;align-items:center}
          .featured-rating{background:#333;color:#fff;padding:4px 12px;border-radius:8px;font-size:14px;font-weight:600}
          .featured-genre{color:#B5B5B5;font-size:14px;font-weight:500}
          .featured-year{color:#B5B5B5;font-size:14px;font-weight:500}
          .featured-synopsis{color:#808080;font-size:14px;line-height:1.6}
          .featured-actions{position:absolute;top:24px;right:24px;display:flex;gap:12px}
          .featured-btn{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;transition:transform 0.2s}
          .featured-btn:hover{transform:scale(1.1)}
          .play-btn{background:#ffffff;color:#000000}
          .info-btn{background:rgba(255,255,255,0.2);color:#ffffff}

          .bottom-nav{position:fixed;bottom:0;left:0;right:0;z-index:1000;background:#101010;height:80px;display:flex;justify-content:space-around;align-items:center;padding-bottom:8px}
          .nav-item{display:flex;flex-direction:column;align-items:center;gap:4px;color:#5B5B5B;font-size:12px;font-weight:600;transition:color 0.2s}
          .nav-item i{font-size:24px}
          .nav-item.active{color:#ffffff}
          .nav-item.active i{color:#ffffff}

          .filters-container{display:flex;gap:36px;margin-left:34px;margin-top:28px;overflow-x:auto;scrollbar-width:none}
          .filters-container::-webkit-scrollbar{display:none}
          .filter-btn{height:56px;padding:0 32px;border-radius:28px;font-size:18px;font-weight:700;white-space:nowrap;transition:all 0.2s}
          .filter-btn.active{background:#ffffff;color:#000000}
          .filter-btn:not(.active){background:transparent;color:#A9A9A9}

          .favorites-list{padding:0 20px;margin-top:24px}
          .favorite-item{display:flex;padding:18px 20px;position:relative;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.06)}
          .favorite-poster{width:160px;height:220px;border-radius:18px;object-fit:cover}
          .favorite-content{margin-left:18px;flex:1}
          .favorite-title{font-size:18px;font-weight:700;line-height:1.2;margin-bottom:8px}
          .favorite-year{font-size:16px;color:#A5A5A5;margin-bottom:4px}
          .favorite-episodes{font-size:15px;color:#A5A5A5;margin-bottom:12px}
          .favorite-badge{display:inline-block;padding:6px 16px;background:#4A4AA8;border-radius:10px;font-size:15px;font-weight:600}
          .favorite-remove{position:absolute;top:18px;right:20px;color:#D0D0D0;font-size:34px;width:34px;height:34px;display:flex;align-items:center;justify-content:center}
          .empty-favorites{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px}

          .search-container{display:flex;align-items:center;gap:16px;padding:12px 34px;margin-top:12px}
          .search-back-btn{color:#ffffff;font-size:36px;width:36px;height:36px;display:flex;align-items:center;justify-content:center}
          .search-bar{flex:1;height:74px;background:#111111;border-radius:37px;display:flex;align-items:center;padding:0 24px;gap:12px}
          .search-icon{color:#9F9F9F;font-size:26px}
          .search-input{flex:1;background:transparent;border:none;color:#ffffff;font-size:18px;outline:none}
          .search-input::placeholder{color:#888888}

          .categories-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;padding:0 24px;margin-top:30px}
          .category-card{height:180px;border-radius:26px;position:relative;overflow:hidden;cursor:pointer}
          .category-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.18);backdrop-filter:blur(8px);border-radius:10px}
          .category-title{position:absolute;left:24px;bottom:48px;font-size:20px;font-weight:700;color:#ffffff;z-index:1}
          .category-thumbnail{position:absolute;right:-5px;top:10px;width:130px;height:180px;border-radius:18px;transform:rotate(18deg);object-fit:cover}

          .banner-container{padding:0 28px;margin-top:24px}
          .verify-banner{height:62px;background:#E04E4E;border-radius:20px;display:flex;align-items:center;justify-content:space-between;padding:0 20px;color:#ffffff;font-size:18px;font-weight:700}
          .user-card{display:flex;align-items:center;padding:24px;margin:28px;background:#121212;border-radius:22px;position:relative}
          .user-avatar{width:80px;height:80px;border-radius:50%;background:#2A2A2A;display:flex;align-items:center;justify-content:center}
          .user-info{margin-left:16px;flex:1}
          .user-name{font-size:24px;font-weight:700}
          .user-email{font-size:15px;color:#A0A0A0;margin-top:4px}
          .logout-btn{color:#D0D0D0;font-size:42px;width:42px;height:42px;display:flex;align-items:center;justify-content:center}
          .settings-card{background:#121212;border-radius:22px;padding:28px;margin:28px}
          .settings-item{display:flex;align-items:center;gap:16px;padding:16px 0;border-bottom:1px solid rgba(255,255,255,0.05)}
          .settings-item:last-child{border-bottom:none}
          .settings-icon{width:42px;height:42px;display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:24px}
          .settings-content{flex:1}
          .settings-title{font-size:18px;font-weight:700}
          .settings-desc{font-size:15px;color:#A0A0A0;margin-top:2px}
          .social-links{display:flex;justify-content:center;gap:24px;margin-top:36px}
          .social-btn{width:72px;height:72px;border-radius:50%;background:#ffffff;display:flex;align-items:center;justify-content:center;font-size:34px;color:#000000}
          .version-info{text-align:center;margin-top:24px;padding:20px}
          .version-info p{font-size:18px;font-weight:500;color:#E0E0E0}

          @media(max-width:768px){
            .header{padding:16px 20px;height:70px}
            .header-logo{width:40px;height:40px}
            .header-btn{font-size:20px}
            .profile-btn{width:44px;height:44px;font-size:22px}
            .section-title{font-size:24px;margin-left:20px;margin-bottom:16px}
            .horizontal-card{width:280px;height:160px;border-radius:20px}
            .episode-card{width:240px}
            .episode-thumbnail{height:135px}
            .featured-card{margin:24px 20px}
            .featured-title{font-size:18px}
            .featured-synopsis{font-size:12px}
            .featured-actions{position:relative;top:0;right:0;margin-top:16px}
            .horizontal-scroll,.vertical-scroll{padding-left:20px;padding-right:20px}
            .bottom-nav{height:64px}
            .nav-item i{font-size:20px}
            .nav-item{font-size:10px}
            .filters-container{margin-left:20px;gap:24px}
            .filter-btn{height:44px;padding:0 24px;font-size:16px}
            .favorite-poster{width:120px;height:165px}
            .categories-grid{gap:16px;padding:0 16px}
            .category-card{height:140px}
            .category-title{font-size:16px;left:16px;bottom:36px}
            .category-thumbnail{width:100px;height:140px}
          }
        `}</style>
      </Head>

      {!welcomed&&<LoadingScreen onComplete={handleLoadingComplete}/>}

      {loadingComplete&&(
        <>
          {activeSection!=='search'&&<Header/>}

          <main className="container">
            {activeSection==='home'&&renderHomePage()}
            {activeSection==='animes'&&renderAnimesPage()}
            {activeSection==='favorites'&&renderFavoritesPage()}
            {activeSection==='menu'&&renderMenuPage()}
            {activeSection==='search'&&renderSearchPage()}
          </main>

          <BottomNav activeSection={activeSection} setActiveSection={setActiveSection}/>
        </>
      )}
    </>
  )
}
