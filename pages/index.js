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

export const Header=({onSearchClick})=>{
  return(
    <header className="header">
      <img src={LOGO_URL} alt="Yoshikawa" className="header-logo"/>
      <div className="header-actions">
        <button className="header-btn" onClick={onSearchClick}>
          <i className="fas fa-search"></i>
        </button>
        <button className="header-btn profile-btn">
          <i className="fas fa-user"></i>
        </button>
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
    <div className="card-wrapper" onClick={()=>window.location.href=`/${item.media_type}/${item.id}`}>
      <div className="card-poster-frame">
        <img src={item.poster_path?`https://image.tmdb.org/t/p/w500${item.poster_path}`:DEFAULT_POSTER} alt={item.title||item.name} className="content-poster" loading="lazy"/>
        <button className="fav-btn" onClick={handleFavClick}>
          <i className={`${isFavorite?'fas fa-heart':'far fa-heart'} ${animating?'heart-pulse':''}`} style={{color:isFavorite?'#ff3b30':'#ffffff'}}></i>
        </button>
      </div>
    </div>
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
  const[showSearch,setShowSearch]=useState(false)
  const[searchLoading,setSearchLoading]=useState(false)

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

  const fetchSearchResults=async(query)=>{
    if(!query.trim()){setSearchResults([]);setSearchLoading(false);return}
    setSearchLoading(true)
    try{
      const[movies,tv]=await Promise.all([
        fetchTMDBPages(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`),
        fetchTMDBPages(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`)
      ])
      const combined=[...movies.map(i=>({...i,media_type:'movie'})),...tv.map(i=>({...i,media_type:'tv'}))]
        .filter(i=>i.poster_path).sort((a,b)=>b.popularity-a.popularity).slice(0,20)
      setSearchResults(combined)
    }catch{setSearchResults([])}
    finally{setSearchLoading(false)}
  }

  const debouncedSearch=useDebounce(fetchSearchResults,300)

  const handleSearchChange=(q)=>{
    setSearchQuery(q)
    if(!q.trim()){setSearchResults([]);setSearchLoading(false);return}
    setSearchLoading(true)
    debouncedSearch(q)
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
        <h2 className="section-title" style={{fontSize:'clamp(24px,5vw,34px)',fontWeight:'800'}}>Favoritos</h2>
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
              <i className="far fa-heart" style={{fontSize:'clamp(32px,5vw,48px)',color:'#333',marginBottom:'clamp(12px,2vw,16px)'}}></i>
              <p style={{color:'#666',fontSize:'clamp(14px,2.5vw,18px)'}}>Nenhum favorito encontrado</p>
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
          <button className="search-back-btn" onClick={()=>{setShowSearch(false);setSearchQuery('');setSearchResults([])}}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <div className="search-bar">
            <i className="fas fa-search search-icon"></i>
            <input 
              type="text" 
              placeholder="O que está procurando?"
              className="search-input"
              value={searchQuery}
              onChange={(e)=>handleSearchChange(e.target.value)}
              autoFocus
            />
          </div>
        </div>
      </section>

      {searchQuery.trim()?(
        <section className="section">
          <h2 className="section-title" style={{fontSize:'clamp(20px,4vw,28px)'}}>Resultados</h2>
          {searchLoading?(
            <div className="empty-favorites">
              <div className="loading-spinner"></div>
            </div>
          ):searchResults.length>0?(
            <div className="vertical-scroll">
              {searchResults.map(item=>(
                <MovieCard key={`${item.media_type}-${item.id}`} item={item} isFavorite={isFavorite(item)} toggleFavorite={toggleFavorite}/>
              ))}
            </div>
          ):(
            <div className="empty-favorites">
              <i className="fas fa-search" style={{fontSize:'clamp(32px,5vw,48px)',color:'#333',marginBottom:'clamp(12px,2vw,16px)'}}></i>
              <p style={{color:'#666',fontSize:'clamp(14px,2.5vw,18px)'}}>Nenhum resultado encontrado</p>
            </div>
          )}
        </section>
      ):(
        <>
          <section className="section">
            <div className="filters-container" style={{marginTop:'clamp(20px,3vw,30px)'}}>
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
            <h2 className="section-title" style={{fontSize:'clamp(24px,5vw,38px)',fontWeight:'800'}}>Categorias</h2>
            <div className="categories-grid">
              {CATEGORIES.map((category,index)=>(
                <CategoryCard key={index} category={category}/>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  )

  const renderMenuPage=()=>(
    <>
      <section className="section" style={{paddingTop:'clamp(40px,8vw,80px)'}}>
        <div className="menu-banner-container">
          <div className="verify-banner">
            <span>Verifique sua conta para personalização e comentários!</span>
            <i className="fas fa-chevron-right"></i>
          </div>
        </div>

        <div className="user-card">
          <div className="user-avatar">
            <i className="fas fa-user" style={{fontSize:'clamp(28px,4vw,40px)',color:'#666'}}></i>
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
          .loading-content{display:flex;flex-direction:column;align-items:center;gap:clamp(24px,4vw,32px)}
          .loading-logo{width:clamp(120px,20vw,180px);height:clamp(120px,20vw,180px);object-fit:contain}
          .loading-spinner{width:clamp(32px,5vw,40px);height:clamp(32px,5vw,40px);border:3px solid rgba(255,255,255,0.1);border-top-color:#ffffff;border-radius:50%;animation:spin 0.8s linear infinite}
          @keyframes spin{to{transform:rotate(360deg)}}

          .header{position:fixed;top:0;left:0;right:0;z-index:1000;background:#101010;padding:clamp(12px,2vw,24px) clamp(16px,3vw,32px);display:flex;justify-content:space-between;align-items:center;height:clamp(60px,8vw,90px)}
          .header-logo{width:clamp(36px,5vw,48px);height:clamp(36px,5vw,48px);object-fit:contain}
          .header-actions{display:flex;align-items:center;gap:clamp(16px,3vw,28px)}
          .header-btn{width:clamp(28px,4vw,34px);height:clamp(28px,4vw,34px);display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:clamp(18px,3vw,24px);transition:opacity 0.2s}
          .header-btn:hover{opacity:0.8}
          .profile-btn{width:clamp(40px,6vw,60px);height:clamp(40px,6vw,60px);border-radius:50%;background:#2a2a2a;color:#666;font-size:clamp(20px,3vw,28px)}

          .container{padding-top:clamp(60px,8vw,90px);padding-bottom:clamp(70px,9vw,96px)}

          .section{margin-top:clamp(16px,3vw,24px)}
          .section-title{font-size:clamp(20px,4vw,32px);font-weight:700;color:#ffffff;margin-left:clamp(16px,4vw,34px);margin-bottom:clamp(16px,3vw,24px)}

          .horizontal-scroll{display:flex;overflow-x:auto;gap:clamp(12px,2vw,18px);padding-left:clamp(16px,4vw,34px);padding-right:clamp(16px,4vw,34px);-webkit-overflow-scrolling:touch;scrollbar-width:none}
          .horizontal-scroll::-webkit-scrollbar{display:none}

          .horizontal-card{flex-shrink:0;width:clamp(260px,40vw,560px);height:clamp(140px,20vw,255px);border-radius:clamp(16px,3vw,28px);overflow:hidden;position:relative;cursor:pointer}
          .horizontal-card-img{width:100%;height:100%;object-fit:cover}
          .horizontal-card-info{position:absolute;bottom:0;left:0;right:0;padding:clamp(12px,2vw,20px);background:linear-gradient(to top,rgba(0,0,0,0.85),rgba(0,0,0,0))}
          .horizontal-card-title{font-size:clamp(14px,2vw,18px);font-weight:700;color:#ffffff;margin-bottom:4px}
          .horizontal-card-subtitle{font-size:clamp(10px,1.5vw,12px);font-weight:500;color:#c8c8c8}

          .episode-card{flex-shrink:0;width:clamp(200px,30vw,330px)}
          .episode-thumbnail{position:relative;height:clamp(120px,18vw,185px);border-radius:clamp(14px,2vw,20px);overflow:hidden;margin-bottom:8px}
          .episode-img{width:100%;height:100%;object-fit:cover}
          .episode-badge{position:absolute;top:10px;left:10px;background:rgba(0,0,0,0.65);border-radius:12px;padding:clamp(2px,0.5vw,4px) clamp(8px,1.5vw,12px);font-size:clamp(11px,1.5vw,14px);font-weight:600;color:#ffffff}
          .episode-title{font-size:clamp(14px,2vw,17px);font-weight:700;color:#ffffff;margin-bottom:4px}
          .episode-info{font-size:clamp(10px,1.5vw,12px);font-weight:500;color:#c8c8c8}

          .vertical-scroll{display:flex;overflow-x:auto;gap:clamp(12px,2vw,18px);padding-left:clamp(16px,4vw,34px);padding-right:clamp(16px,4vw,34px);-webkit-overflow-scrolling:touch;scrollbar-width:none}
          .vertical-scroll::-webkit-scrollbar{display:none}

          .card-wrapper{flex-shrink:0;width:clamp(110px,18vw,140px);cursor:pointer}
          .card-poster-frame{position:relative;border-radius:clamp(12px,2vw,16px);overflow:hidden;aspect-ratio:2/3;background:#1a1a1a}
          .content-poster{width:100%;height:100%;object-fit:cover}
          .fav-btn{position:absolute;top:clamp(4px,1vw,8px);right:clamp(4px,1vw,8px);width:clamp(26px,4vw,32px);height:clamp(26px,4vw,32px);border-radius:50%;display:flex;align-items:center;justify-content:center;opacity:0;transition:all 0.3s;background:rgba(0,0,0,0.4);font-size:clamp(12px,2vw,14px)}
          .card-poster-frame:hover .fav-btn{opacity:1}
          @media(hover:none){.fav-btn{opacity:1}}
          .heart-pulse{animation:heartZoom 0.5s ease}
          @keyframes heartZoom{0%{transform:scale(1)}50%{transform:scale(1.6)}100%{transform:scale(1)}}

          .featured-card{border-radius:clamp(14px,2vw,20px);overflow:hidden;margin:clamp(16px,3vw,24px) clamp(16px,4vw,34px);background:#121212}
          .featured-poster{width:100%;aspect-ratio:16/9;overflow:hidden}
          .featured-img{width:100%;height:100%;object-fit:cover}
          .featured-details{position:relative;padding:clamp(16px,3vw,24px);background:#121212}
          .featured-text{margin-bottom:clamp(12px,2vw,16px)}
          .featured-title{font-size:clamp(16px,3vw,24px);font-weight:700;color:#ffffff;margin-bottom:clamp(8px,1.5vw,12px)}
          .featured-meta{display:flex;gap:clamp(8px,2vw,16px);margin-bottom:clamp(12px,2vw,16px);align-items:center;flex-wrap:wrap}
          .featured-rating{background:#333;color:#fff;padding:clamp(2px,0.5vw,4px) clamp(8px,1.5vw,12px);border-radius:8px;font-size:clamp(12px,1.8vw,14px);font-weight:600}
          .featured-genre{color:#B5B5B5;font-size:clamp(12px,1.8vw,14px);font-weight:500}
          .featured-year{color:#B5B5B5;font-size:clamp(12px,1.8vw,14px);font-weight:500}
          .featured-synopsis{color:#808080;font-size:clamp(12px,1.8vw,14px);line-height:1.6}
          .featured-actions{position:absolute;top:clamp(16px,3vw,24px);right:clamp(16px,3vw,24px);display:flex;gap:clamp(8px,1.5vw,12px)}
          .featured-btn{width:clamp(36px,5vw,48px);height:clamp(36px,5vw,48px);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:clamp(16px,2.5vw,20px);transition:transform 0.2s}
          .featured-btn:hover{transform:scale(1.1)}
          .play-btn{background:#ffffff;color:#000000}
          .info-btn{background:rgba(255,255,255,0.2);color:#ffffff}

          .bottom-nav{position:fixed;bottom:0;left:0;right:0;z-index:1000;background:#101010;height:clamp(56px,8vw,80px);display:flex;justify-content:space-around;align-items:center;padding-bottom:clamp(4px,1vw,8px)}
          .nav-item{display:flex;flex-direction:column;align-items:center;gap:clamp(2px,0.5vw,4px);color:#5B5B5B;font-size:clamp(9px,1.5vw,12px);font-weight:600;transition:color 0.2s;padding:clamp(4px,1vw,8px)}
          .nav-item i{font-size:clamp(16px,3vw,24px)}
          .nav-item.active{color:#ffffff}
          .nav-item.active i{color:#ffffff}

          .filters-container{display:flex;gap:clamp(16px,3vw,36px);margin-left:clamp(16px,4vw,34px);margin-top:clamp(20px,3vw,28px);overflow-x:auto;scrollbar-width:none;padding-right:clamp(16px,4vw,34px)}
          .filters-container::-webkit-scrollbar{display:none}
          .filter-btn{height:clamp(36px,6vw,56px);padding:0 clamp(16px,3vw,32px);border-radius:clamp(18px,3vw,28px);font-size:clamp(13px,2vw,18px);font-weight:700;white-space:nowrap;transition:all 0.2s}
          .filter-btn.active{background:#ffffff;color:#000000}
          .filter-btn:not(.active){background:transparent;color:#A9A9A9}

          .favorites-list{padding:0 clamp(12px,2.5vw,20px);margin-top:clamp(16px,3vw,24px)}
          .favorite-item{display:flex;padding:clamp(12px,2vw,18px) clamp(12px,2.5vw,20px);position:relative;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.06);gap:clamp(12px,2vw,18px)}
          .favorite-poster{width:clamp(90px,18vw,160px);height:clamp(125px,25vw,220px);border-radius:clamp(12px,2vw,18px);object-fit:cover;flex-shrink:0}
          .favorite-content{flex:1;min-width:0}
          .favorite-title{font-size:clamp(14px,2vw,18px);font-weight:700;line-height:1.2;margin-bottom:clamp(4px,1vw,8px);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
          .favorite-year{font-size:clamp(12px,1.8vw,16px);color:#A5A5A5;margin-bottom:4px}
          .favorite-episodes{font-size:clamp(11px,1.6vw,15px);color:#A5A5A5;margin-bottom:clamp(8px,1.5vw,12px)}
          .favorite-badge{display:inline-block;padding:clamp(3px,0.6vw,6px) clamp(10px,2vw,16px);background:#4A4AA8;border-radius:clamp(6px,1vw,10px);font-size:clamp(11px,1.6vw,15px);font-weight:600}
          .favorite-remove{position:absolute;top:clamp(12px,2vw,18px);right:clamp(12px,2.5vw,20px);color:#D0D0D0;font-size:clamp(22px,3.5vw,34px);width:clamp(22px,3.5vw,34px);height:clamp(22px,3.5vw,34px);display:flex;align-items:center;justify-content:center}
          .empty-favorites{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:clamp(40px,8vw,80px) clamp(16px,4vw,20px)}

          .search-container{display:flex;align-items:center;gap:clamp(8px,1.5vw,16px);padding:clamp(8px,1.5vw,12px) clamp(16px,4vw,34px);margin-top:clamp(8px,1.5vw,12px)}
          .search-back-btn{color:#ffffff;font-size:clamp(24px,4vw,36px);width:clamp(24px,4vw,36px);height:clamp(24px,4vw,36px);display:flex;align-items:center;justify-content:center;flex-shrink:0}
          .search-bar{flex:1;height:clamp(50px,8vw,74px);background:#111111;border-radius:clamp(25px,4vw,37px);display:flex;align-items:center;padding:0 clamp(16px,3vw,24px);gap:clamp(8px,1.5vw,12px)}
          .search-icon{color:#9F9F9F;font-size:clamp(18px,3vw,26px);flex-shrink:0}
          .search-input{flex:1;background:transparent;border:none;color:#ffffff;font-size:clamp(14px,2.5vw,18px);outline:none;min-width:0}
          .search-input::placeholder{color:#888888}

          .categories-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:clamp(12px,2vw,20px);padding:0 clamp(16px,3vw,24px);margin-top:clamp(20px,3vw,30px)}
          .category-card{height:clamp(120px,18vw,180px);border-radius:clamp(18px,3vw,26px);position:relative;overflow:hidden;cursor:pointer}
          .category-title{position:absolute;left:clamp(16px,3vw,24px);bottom:clamp(30px,5vw,48px);font-size:clamp(14px,2.5vw,20px);font-weight:700;color:#ffffff;z-index:1}
          .category-thumbnail{position:absolute;right:-5px;top:10px;width:clamp(80px,15vw,130px);height:clamp(110px,20vw,180px);border-radius:clamp(12px,2vw,18px);transform:rotate(18deg);object-fit:cover}

          .menu-banner-container{padding:0 clamp(16px,3vw,28px);margin-top:clamp(16px,3vw,24px)}
          .verify-banner{height:clamp(48px,7vw,62px);background:#E04E4E;border-radius:clamp(14px,2vw,20px);display:flex;align-items:center;justify-content:space-between;padding:0 clamp(16px,2.5vw,20px);color:#ffffff;font-size:clamp(13px,2.2vw,18px);font-weight:700;gap:clamp(8px,1.5vw,12px)}
          .verify-banner span{flex:1;min-width:0}
          .verify-banner i{flex-shrink:0;font-size:clamp(16px,2.5vw,22px)}
          .user-card{display:flex;align-items:center;padding:clamp(16px,3vw,24px);margin:clamp(16px,3vw,28px);background:#121212;border-radius:clamp(16px,2.5vw,22px);position:relative;gap:clamp(12px,2vw,16px)}
          .user-avatar{width:clamp(56px,9vw,80px);height:clamp(56px,9vw,80px);border-radius:50%;background:#2A2A2A;display:flex;align-items:center;justify-content:center;flex-shrink:0}
          .user-info{flex:1;min-width:0}
          .user-name{font-size:clamp(18px,3vw,24px);font-weight:700}
          .user-email{font-size:clamp(12px,2vw,15px);color:#A0A0A0;margin-top:clamp(2px,0.5vw,4px)}
          .logout-btn{color:#D0D0D0;font-size:clamp(28px,4.5vw,42px);width:clamp(28px,4.5vw,42px);height:clamp(28px,4.5vw,42px);display:flex;align-items:center;justify-content:center;flex-shrink:0}
          .settings-card{background:#121212;border-radius:clamp(16px,2.5vw,22px);padding:clamp(16px,3vw,28px);margin:clamp(16px,3vw,28px)}
          .settings-item{display:flex;align-items:center;gap:clamp(10px,2vw,16px);padding:clamp(10px,1.8vw,16px) 0;border-bottom:1px solid rgba(255,255,255,0.05)}
          .settings-item:last-child{border-bottom:none}
          .settings-icon{width:clamp(32px,5vw,42px);height:clamp(32px,5vw,42px);display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:clamp(18px,3vw,24px);flex-shrink:0}
          .settings-content{flex:1;min-width:0}
          .settings-title{font-size:clamp(14px,2.2vw,18px);font-weight:700}
          .settings-desc{font-size:clamp(11px,1.8vw,15px);color:#A0A0A0;margin-top:clamp(1px,0.3vw,2px)}
          .social-links{display:flex;justify-content:center;gap:clamp(16px,3vw,24px);margin-top:clamp(24px,4vw,36px);flex-wrap:wrap}
          .social-btn{width:clamp(52px,8vw,72px);height:clamp(52px,8vw,72px);border-radius:50%;background:#ffffff;display:flex;align-items:center;justify-content:center;font-size:clamp(24px,4vw,34px);color:#000000}
          .version-info{text-align:center;margin-top:clamp(16px,3vw,24px);padding:clamp(12px,2vw,20px)}
          .version-info p{font-size:clamp(13px,2.2vw,18px);font-weight:500;color:#E0E0E0}
        `}</style>
      </Head>

      {!welcomed&&<LoadingScreen onComplete={handleLoadingComplete}/>}

      {loadingComplete&&(
        <>
          {!showSearch&&<Header onSearchClick={()=>setShowSearch(true)}/>}

          <main className="container">
            {showSearch?renderSearchPage():
              activeSection==='home'?renderHomePage():
              activeSection==='animes'?renderAnimesPage():
              activeSection==='favorites'?renderFavoritesPage():
              activeSection==='menu'?renderMenuPage():
              renderHomePage()
            }
          </main>

          <BottomNav activeSection={activeSection} setActiveSection={(section)=>{
            setShowSearch(false)
            setSearchQuery('')
            setSearchResults([])
            setActiveSection(section)
          }}/>
        </>
      )}
    </>
  )
}
