import{useState,useEffect,useRef,useCallback}from'react'
import Head from'next/head'
import Link from'next/link'

const TMDB_API_KEY='66223dd3ad2885cf1129b181c7826287'
const DEFAULT_POSTER='https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'
const LOGO_URL='https://yoshikawa-bot.github.io/cache/images/fec8bb6d.png'

const FILTERS=['Tudo','Filmes','Séries','Animes']

export const GLOBAL_STYLES=`
  *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  html{scroll-behavior:smooth}
  body{font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;background:#101010;color:#f5f5f7;line-height:1.6;font-size:16px;min-height:100vh;overflow-y:auto;overflow-x:hidden}
  a{color:inherit;text-decoration:none}
  button{font-family:inherit;border:none;outline:none;background:none;cursor:pointer;user-select:none}
  img{max-width:100%;height:auto;display:block}

  .loading-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:#101010;transition:opacity 0.8s ease}
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

  .featured-card{border-radius:20px;overflow:hidden;margin:0 34px;background:#181818}
  .featured-poster{width:100%;aspect-ratio:16/9;overflow:hidden}
  .featured-img{width:100%;height:100%;object-fit:cover}
  .featured-details{position:relative;padding:24px;background:#181818}
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

  .filters-container{display:flex;gap:16px;margin-left:34px;margin-top:28px;overflow-x:auto;scrollbar-width:none;padding-right:34px}
  .filters-container::-webkit-scrollbar{display:none}
  .filter-btn{height:44px;padding:0 24px;border-radius:22px;font-size:16px;font-weight:700;white-space:nowrap;transition:all 0.2s;flex-shrink:0}
  .filter-btn.active{background:#ffffff;color:#000000}
  .filter-btn:not(.active){background:#1e1e1e;color:#A9A9A9}

  .favorites-list{padding:0 20px;margin-top:24px}
  .favorite-item{display:flex;padding:18px 4px;position:relative;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.06)}
  .favorite-poster{width:100px;height:150px;border-radius:14px;object-fit:cover;flex-shrink:0}
  .favorite-content{margin-left:16px;flex:1;min-width:0;padding-right:40px}
  .favorite-title{font-size:16px;font-weight:700;line-height:1.3;margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .favorite-year{font-size:14px;color:#A5A5A5;margin-bottom:4px}
  .favorite-episodes{font-size:13px;color:#A5A5A5;margin-bottom:12px}
  .favorite-badge{display:inline-block;padding:4px 14px;background:#4A4AA8;border-radius:8px;font-size:13px;font-weight:600}
  .favorite-remove{position:absolute;top:18px;right:4px;color:#888;font-size:20px;width:32px;height:32px;display:flex;align-items:center;justify-content:center}
  .empty-favorites{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;text-align:center}

  @media(max-width:768px){
    .header{padding:16px 20px;height:70px}
    .header-logo{width:40px;height:40px}
    .header-btn{font-size:20px}
    .profile-btn{width:44px;height:44px;font-size:22px}
    .section-title{font-size:24px;margin-left:20px;margin-bottom:16px}
    .horizontal-card{width:260px;height:150px;border-radius:18px}
    .episode-card{width:200px}
    .episode-thumbnail{height:120px}
    .featured-card{margin:0 20px}
    .featured-title{font-size:18px}
    .featured-synopsis{font-size:12px}
    .featured-actions{position:relative;top:0;right:0;margin-top:16px}
    .horizontal-scroll,.vertical-scroll{padding-left:20px;padding-right:20px;gap:12px}
    .bottom-nav{height:64px}
    .nav-item i{font-size:20px}
    .nav-item{font-size:10px}
    .filters-container{margin-left:20px;padding-right:20px;gap:10px;margin-top:16px}
    .filter-btn{height:38px;padding:0 18px;font-size:14px}
    .card-wrapper{width:110px}
    .container{padding-top:70px;padding-bottom:80px}
  }
`

export const LoadingScreen=({onComplete})=>{
  const[closing,setClosing]=useState(false)
  const[mounted,setMounted]=useState(true)
  useEffect(()=>{const t=setTimeout(()=>setClosing(true),2000);return()=>clearTimeout(t)},[])
  useEffect(()=>{
    if(closing){const t=setTimeout(()=>{setMounted(false);onComplete()},800);return()=>clearTimeout(t)}
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

export const Header=()=>(
  <header className="header">
    <img src={LOGO_URL} alt="Yoshikawa" className="header-logo"/>
    <div className="header-actions">
      <Link href="/search">
        <button className="header-btn"><i className="fas fa-search"></i></button>
      </Link>
      <Link href="/profile">
        <button className="header-btn profile-btn"><i className="fas fa-user"></i></button>
      </Link>
    </div>
  </header>
)

export const BottomNav=({activeSection,setActiveSection})=>(
  <nav className="bottom-nav">
    {[
      {id:'home',icon:'fa-home',label:'Início'},
      {id:'animes',icon:'fa-play',label:'Animes'},
      {id:'favorites',icon:'fa-heart',label:'Favoritos'},
      {id:'menu',icon:'fa-bars',label:'Menu'},
    ].map(({id,icon,label})=>(
      <button key={id} className={`nav-item ${activeSection===id?'active':''}`} onClick={()=>setActiveSection(id)}>
        <i className={`fas ${icon}`}></i>
        <span>{label}</span>
      </button>
    ))}
  </nav>
)

export const HorizontalCard=({item,onPlay})=>(
  <div className="horizontal-card" onClick={()=>onPlay?.(item)}>
    <img src={item.poster_path?`https://image.tmdb.org/t/p/w500${item.poster_path}`:DEFAULT_POSTER} alt={item.title||item.name} className="horizontal-card-img"/>
    <div className="horizontal-card-info">
      <h3 className="horizontal-card-title">{item.title||item.name}</h3>
      <p className="horizontal-card-subtitle">{item.media_type==='tv'?'Série':'Filme'} • {new Date(item.release_date||item.first_air_date).getFullYear()||'N/A'}</p>
    </div>
  </div>
)

export const EpisodeCard=({item})=>(
  <div className="episode-card">
    <div className="episode-thumbnail">
      <img src={item.poster_path?`https://image.tmdb.org/t/p/w500${item.poster_path}`:DEFAULT_POSTER} alt={item.name||item.title} className="episode-img"/>
      <div className="episode-badge">Dublado</div>
    </div>
    <h4 className="episode-title">{item.name||item.title}</h4>
    <p className="episode-info">Ep. {item.episode_number||1} • {item.air_date||'N/A'}</p>
  </div>
)

export const FeaturedCard=({item,onPlay,onInfo})=>(
  <div className="featured-card">
    <div className="featured-poster">
      <img src={item.poster_path?`https://image.tmdb.org/t/p/w500${item.poster_path}`:DEFAULT_POSTER} alt={item.title||item.name} className="featured-img"/>
    </div>
    <div className="featured-details">
      <div className="featured-text">
        <h2 className="featured-title">{item.title||item.name}</h2>
        <div className="featured-meta">
          <span className="featured-rating">{item.adult?'18+':'L'}</span>
          <span className="featured-genre">{item.media_type==='tv'?'Série':'Filme'}</span>
          <span className="featured-year">{new Date(item.release_date||item.first_air_date).getFullYear()||'2025'}</span>
        </div>
        <p className="featured-synopsis">{item.overview||'Sinopse não disponível.'}</p>
      </div>
      <div className="featured-actions">
        <button className="featured-btn play-btn" onClick={()=>onPlay?.(item)}><i className="fas fa-play"></i></button>
        <button className="featured-btn info-btn" onClick={()=>onInfo?.(item)}><i className="fas fa-info"></i></button>
      </div>
    </div>
  </div>
)

export const MovieCard=({item,isFavorite,toggleFavorite})=>{
  const[animating,setAnimating]=useState(false)
  const handleFavClick=(e)=>{
    e.preventDefault();e.stopPropagation()
    setAnimating(true);toggleFavorite(item);setTimeout(()=>setAnimating(false),400)
  }
  return(
    <Link href={`/${item.media_type||'movie'}/${item.id}`} className="card-wrapper">
      <div className="card-poster-frame">
        <img src={item.poster_path?`https://image.tmdb.org/t/p/w500${item.poster_path}`:DEFAULT_POSTER} alt={item.title||item.name} className="content-poster" loading="lazy"/>
        <button className="fav-btn" onClick={handleFavClick}>
          <i className={`${isFavorite?'fas fa-heart':'far fa-heart'} ${animating?'heart-pulse':''}`} style={{color:isFavorite?'#ff3b30':'#ffffff'}}></i>
        </button>
      </div>
    </Link>
  )
}

export const FavoriteItem=({item,onRemove,onClick})=>(
  <div className="favorite-item" onClick={()=>onClick?.(item)}>
    <img src={item.poster_path?`https://image.tmdb.org/t/p/w500${item.poster_path}`:DEFAULT_POSTER} alt={item.title} className="favorite-poster"/>
    <div className="favorite-content">
      <h3 className="favorite-title">{item.title||item.name}</h3>
      <p className="favorite-year">{item.year||new Date().getFullYear()}</p>
      <p className="favorite-episodes">{item.media_type==='tv'?'Série':'Filme'}</p>
      <div className="favorite-badge">{item.media_type==='tv'?'Série':'Filme'}</div>
    </div>
    <button className="favorite-remove" onClick={(e)=>{e.stopPropagation();onRemove?.(item)}}>
      <i className="fas fa-times"></i>
    </button>
  </div>
)

export const SettingsItem=({icon,title,description})=>(
  <div className="settings-item">
    <div className="settings-icon"><i className={`fas fa-${icon}`}></i></div>
    <div className="settings-content">
      <h4 className="settings-title">{title}</h4>
      <p className="settings-desc">{description}</p>
    </div>
  </div>
)

const fetchTMDB=async(url)=>{
  try{const r=await fetch(url);if(!r.ok)throw new Error();const d=await r.json();return d.results||[]}
  catch{return[]}
}
const fetchTMDBPages=async(endpoint)=>{
  try{const[r1,r2]=await Promise.all([fetchTMDB(`${endpoint}&page=1`),fetchTMDB(`${endpoint}&page=2`)]);return[...r1,...r2]}
  catch{return[]}
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
  const[activeSection,setActiveSection]=useState('home')
  const[activeFilter,setActiveFilter]=useState('Tudo')

  useEffect(()=>{
    try{const seen=sessionStorage.getItem('yoshikawaWelcomed');if(seen){setWelcomed(true);setLoadingComplete(true)}}catch{}
  },[])

  const handleLoadingComplete=()=>{
    try{sessionStorage.setItem('yoshikawaWelcomed','1')}catch{}
    setWelcomed(true);setLoadingComplete(true)
  }

  useEffect(()=>{loadAllContent();loadFavorites();loadAnimes()},[])

  const loadAllContent=async()=>{
    try{
      const[trendingData,nowPlaying,onAir,upcoming,topRated,dubbedShows,adventureShows,comedyShows,romanceShows]=await Promise.all([
        fetchTMDB(`https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_API_KEY}&language=pt-BR`),
        fetchTMDBPages(`https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&language=pt-BR`),
        fetchTMDBPages(`https://api.themoviedb.org/3/tv/on_the_air?api_key=${TMDB_API_KEY}&language=pt-BR`),
        fetchTMDB(`https://api.themoviedb.org/3/movie/upcoming?api_key=${TMDB_API_KEY}&language=pt-BR`),
        fetchTMDB(`https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_API_KEY}&language=pt-BR`),
        fetchTMDB(`https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&language=pt-BR&with_original_language=pt`),
        fetchTMDB(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=12`),
        fetchTMDB(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=35`),
        fetchTMDB(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=10749`),
      ])
      const t=trendingData.filter(i=>i.poster_path)
      setTrending(t.slice(0,10));setFeatured(t[0]||null)
      setNewEpisodes(onAir.filter(i=>i.poster_path).slice(0,10))
      setRecentlyAdded(nowPlaying.filter(i=>i.poster_path).slice(0,10))
      setWeeklies(upcoming.filter(i=>i.poster_path).slice(0,10))
      setDubbed(dubbedShows.filter(i=>i.poster_path).slice(0,10))
      setAdventure(adventureShows.filter(i=>i.poster_path).slice(0,10))
      setComedy(comedyShows.filter(i=>i.poster_path).slice(0,10))
      setRomance(romanceShows.filter(i=>i.poster_path).slice(0,10))
      setRecommended(topRated.filter(i=>i.poster_path).slice(0,10))
    }catch(e){console.error(e)}
  }

  const loadAnimes=async()=>{
    try{
      const[am,at]=await Promise.all([
        fetchTMDB(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=16&with_original_language=ja`),
        fetchTMDB(`https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=16&with_original_language=ja`)
      ])
      const combined=[...am.map(i=>({...i,media_type:'movie'})),...at.map(i=>({...i,media_type:'tv'}))]
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
      const updated=exists
        ?prev.filter(f=>!(f.id===item.id&&f.media_type===item.media_type))
        :[...prev,{id:item.id,media_type:item.media_type||'movie',title:item.title||item.name,poster_path:item.poster_path}]
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

  const handlePlay=(item)=>{window.location.href=`/${item.media_type||'movie'}/${item.id}`}
  const handleInfo=(item)=>{window.location.href=`/${item.media_type||'movie'}/${item.id}`}

  const filteredFavorites=activeFilter==='Tudo'?favorites
    :activeFilter==='Filmes'?favorites.filter(f=>f.media_type==='movie')
    :activeFilter==='Séries'?favorites.filter(f=>f.media_type==='tv')
    :favorites

  const renderSection=(title,items,type='vertical')=>(
    <section className="section" key={title}>
      <h2 className="section-title">{title}</h2>
      <div className={type==='horizontal'?'horizontal-scroll':'vertical-scroll'}>
        {items.map(item=>
          type==='horizontal'
            ?<HorizontalCard key={`${item.media_type}-${item.id}`} item={item} onPlay={handlePlay}/>
            :type==='episode'
            ?<EpisodeCard key={`${item.media_type}-${item.id}`} item={item}/>
            :<MovieCard key={`${item.media_type||'m'}-${item.id}`} item={item} isFavorite={isFavorite(item)} toggleFavorite={toggleFavorite}/>
        )}
      </div>
    </section>
  )

  const renderHomePage=()=>(
    <>
      {renderSection('Em alta',trending,'horizontal')}
      {renderSection('Novos episódios',newEpisodes,'episode')}
      {renderSection('Recém adicionados',recentlyAdded)}
      {renderSection('Semanais',weeklies)}
      {featured&&(
        <section className="section">
          <h2 className="section-title">Lançamento</h2>
          <FeaturedCard item={featured} onPlay={handlePlay} onInfo={handleInfo}/>
        </section>
      )}
      {renderSection('Com dublagem',dubbed)}
      {renderSection('Aventura',adventure)}
      {renderSection('Comédia',comedy)}
      {renderSection('Romance',romance)}
      {renderSection('Talvez você goste',recommended)}
    </>
  )

  const renderAnimesPage=()=>(
    <>
      {renderSection('Animes em destaque',animes.slice(0,5),'horizontal')}
      {renderSection('Todos os Animes',animes.slice(0,10))}
      {renderSection('Animes populares',animes.slice(5,10),'episode')}
      {renderSection('Recomendados para você',animes.slice(10,20))}
    </>
  )

  const renderFavoritesPage=()=>(
    <section className="section" style={{paddingTop:'8px'}}>
      <h2 className="section-title" style={{fontSize:'34px',fontWeight:'800'}}>Favoritos</h2>
      <div className="filters-container">
        {FILTERS.map(f=>(
          <button key={f} className={`filter-btn ${activeFilter===f?'active':''}`} onClick={()=>setActiveFilter(f)}>{f}</button>
        ))}
      </div>
      <div className="favorites-list">
        {filteredFavorites.length===0?(
          <div className="empty-favorites">
            <i className="far fa-heart" style={{fontSize:'48px',color:'#333',marginBottom:'16px'}}></i>
            <p style={{color:'#666',fontSize:'18px'}}>Nenhum favorito encontrado</p>
          </div>
        ):filteredFavorites.map(item=>(
          <FavoriteItem key={`${item.media_type}-${item.id}`} item={item} onRemove={removeFavorite} onClick={handlePlay}/>
        ))}
      </div>
    </section>
  )

  const renderMenuPage=()=>(
    <section className="section" style={{paddingTop:'16px'}}>
      <div style={{padding:'0 28px'}}>
        <div style={{height:'62px',background:'#E04E4E',borderRadius:'20px',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px',color:'#fff',fontSize:'16px',fontWeight:'700'}}>
          <span>Verifique sua conta para personalização!</span>
          <i className="fas fa-chevron-right"></i>
        </div>
      </div>

      <div style={{display:'flex',alignItems:'center',padding:'24px',margin:'20px 28px 0',background:'#181818',borderRadius:'22px',position:'relative'}}>
        <div style={{width:'72px',height:'72px',borderRadius:'50%',background:'#2A2A2A',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <i className="fas fa-user" style={{fontSize:'32px',color:'#666'}}></i>
        </div>
        <div style={{marginLeft:'16px',flex:1}}>
          <h3 style={{fontSize:'22px',fontWeight:'700'}}>lyansky</h3>
          <p style={{fontSize:'14px',color:'#A0A0A0',marginTop:'4px'}}>usuario@email.com</p>
        </div>
        <button style={{color:'#D0D0D0',fontSize:'22px',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <i className="fas fa-sign-out-alt"></i>
        </button>
      </div>

      <div style={{background:'#181818',borderRadius:'22px',padding:'8px 24px',margin:'16px 28px'}}>
        {[
          {icon:'cog',title:'Configurações',desc:'Ajustes do aplicativo'},
          {icon:'shield-alt',title:'Privacidade',desc:'Gerenciar dados'},
          {icon:'question-circle',title:'Ajuda',desc:'Central de suporte'},
          {icon:'info-circle',title:'Sobre',desc:'Versão do app'},
        ].map(({icon,title,desc},i,arr)=>(
          <div key={title} style={{display:'flex',alignItems:'center',gap:'16px',padding:'18px 0',borderBottom:i<arr.length-1?'1px solid rgba(255,255,255,0.05)':'none'}}>
            <div style={{width:'42px',height:'42px',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'22px'}}>
              <i className={`fas fa-${icon}`}></i>
            </div>
            <div style={{flex:1}}>
              <h4 style={{fontSize:'17px',fontWeight:'700'}}>{title}</h4>
              <p style={{fontSize:'14px',color:'#A0A0A0',marginTop:'2px'}}>{desc}</p>
            </div>
            <i className="fas fa-chevron-right" style={{color:'#444',fontSize:'14px'}}></i>
          </div>
        ))}
      </div>

      <div style={{display:'flex',justifyContent:'center',gap:'20px',marginTop:'28px'}}>
        {['link','tiktok','twitter'].map(s=>(
          <button key={s} style={{width:'64px',height:'64px',borderRadius:'50%',background:'#1e1e1e',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'26px',color:'#fff'}}>
            <i className={s==='link'?'fas fa-link':`fab fa-${s}`}></i>
          </button>
        ))}
      </div>

      <div style={{textAlign:'center',marginTop:'24px',padding:'20px'}}>
        <p style={{fontSize:'13px',fontWeight:'500',color:'#555'}}>RELEASE BUILD — 1.4.3.R1.0</p>
      </div>
    </section>
  )

  return(
    <>
      <Head>
        <title>Yoshikawa Player</title>
        <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
        <style>{GLOBAL_STYLES}</style>
      </Head>

      {!welcomed&&<LoadingScreen onComplete={handleLoadingComplete}/>}

      {loadingComplete&&(
        <>
          <Header/>
          <main className="container">
            {activeSection==='home'&&renderHomePage()}
            {activeSection==='animes'&&renderAnimesPage()}
            {activeSection==='favorites'&&renderFavoritesPage()}
            {activeSection==='menu'&&renderMenuPage()}
          </main>
          <BottomNav activeSection={activeSection} setActiveSection={setActiveSection}/>
        </>
      )}
    </>
  )
  }
