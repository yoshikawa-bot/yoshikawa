import{useState,useEffect,useRef,useCallback}from'react'
import Head from'next/head'
import Link from'next/link'
import{useRouter}from'next/router'
import{GLOBAL_STYLES,Header,BottomNav,MovieCard}from'./index'

const TMDB_API_KEY='66223dd3ad2885cf1129b181c7826287'
const LOGO_URL='https://yoshikawa-bot.github.io/cache/images/fec8bb6d.png'

const CATEGORIES=[
  {name:'Aventura',color:'#7FA8D8',genre:12},
  {name:'Ação',color:'#3F6D89',genre:28},
  {name:'Comédia',color:'#C43708',genre:35},
  {name:'Dublado',color:'#43A45D',genre:16},
  {name:'Drama',color:'#2C3F59',genre:18},
  {name:'Família',color:'#72615F',genre:10751},
  {name:'Fantasia',color:'#E97820',genre:14},
  {name:'Romance',color:'#A8A8B6',genre:10749},
  {name:'Animação',color:'#E38CA8',genre:16},
  {name:'Terror',color:'#9D95C8',genre:27},
]

const FILTERS=['Tudo','Filmes','Séries','Animes']
const POSTER_COVERS=[
  '/aQvJ5WPzZgYVDrxLX4R6cLJCEaQ.jpg',
  '/1E5baAaEse26fej7uHcjOgEE2t2.jpg',
  '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
  '/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
  '/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg',
  '/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
  '/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg',
  '/4MCKNDDgteC8i3TFbRhQAhFNcts.jpg',
  '/jtsJs4vMhZFAqFwVLqSQWF7PXtF.jpg',
  '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
]

const useDebounce=(fn,delay)=>{
  const t=useRef(null)
  return useCallback((...args)=>{
    if(t.current)clearTimeout(t.current)
    t.current=setTimeout(()=>fn(...args),delay)
  },[fn,delay])
}

export default function SearchPage(){
  const router=useRouter()
  const[query,setQuery]=useState('')
  const[results,setResults]=useState([])
  const[loading,setLoading]=useState(false)
  const[activeFilter,setActiveFilter]=useState('Tudo')
  const[favorites,setFavorites]=useState([])
  const[activeSection,setActiveSection]=useState('home')
  const inputRef=useRef(null)

  useEffect(()=>{
    try{const s=localStorage.getItem('yoshikawaFavorites');setFavorites(s?JSON.parse(s):[])}catch{}
    setTimeout(()=>inputRef.current?.focus(),300)
  },[])

  const doSearch=useCallback(async(q,filter)=>{
    if(!q.trim()){setResults([]);return}
    setLoading(true)
    try{
      const type=filter==='Filmes'?'movie':filter==='Séries'?'tv':'multi'
      const url=`https://api.themoviedb.org/3/search/${type}?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(q)}`
      const r=await fetch(url)
      const d=await r.json()
      let items=(d.results||[]).filter(i=>i.poster_path)
      if(filter==='Animes')items=items.filter(i=>i.original_language==='ja'||(i.genre_ids||[]).includes(16))
      if(type==='multi')items=items.map(i=>({...i,media_type:i.media_type||'movie'}))
      else items=items.map(i=>({...i,media_type:type}))
      setResults(items.slice(0,20))
    }catch{setResults([])}
    finally{setLoading(false)}
  },[])

  const debouncedSearch=useDebounce((q,f)=>doSearch(q,f),400)

  useEffect(()=>{debouncedSearch(query,activeFilter)},[query,activeFilter])

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

  const handleNavChange=(section)=>{
    setActiveSection(section)
    if(section==='home')router.push('/')
  }

  return(
    <>
      <Head>
        <title>Buscar — Yoshikawa Player</title>
        <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
        <style>{GLOBAL_STYLES}{`
          .search-page-header{
            position:fixed;top:0;left:0;right:0;z-index:1000;
            background:#101010;padding:16px 20px;
            display:flex;align-items:center;gap:14px;
            height:78px;
          }
          .search-back-btn{
            color:#fff;font-size:22px;width:40px;height:40px;
            display:flex;align-items:center;justify-content:center;
            flex-shrink:0;border-radius:50%;transition:background 0.2s;
          }
          .search-back-btn:hover{background:#1e1e1e}
          .search-bar{
            flex:1;height:50px;background:#1a1a1a;
            border-radius:25px;display:flex;align-items:center;
            padding:0 18px;gap:10px;border:1px solid #2a2a2a;
            transition:border-color 0.2s;
          }
          .search-bar:focus-within{border-color:#444}
          .search-icon{color:#888;font-size:18px;flex-shrink:0}
          .search-input{flex:1;background:transparent;border:none;color:#fff;font-size:16px;outline:none}
          .search-input::placeholder{color:#666}
          .search-clear{color:#888;font-size:16px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
          .search-body{padding-top:78px;padding-bottom:80px}
          .search-filters{display:flex;gap:10px;padding:16px 20px 0;overflow-x:auto;scrollbar-width:none}
          .search-filters::-webkit-scrollbar{display:none}
          .categories-section{padding:24px 20px 0}
          .categories-title{font-size:22px;font-weight:700;color:#fff;margin-bottom:16px}
          .categories-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
          .category-card{
            height:110px;border-radius:20px;position:relative;
            overflow:hidden;cursor:pointer;
          }
          .category-bg{position:absolute;inset:0;background-size:cover;background-position:center;filter:brightness(0.6)}
          .category-overlay{position:absolute;inset:0;opacity:0.55}
          .category-name{position:absolute;left:16px;bottom:14px;font-size:18px;font-weight:700;color:#fff;z-index:1;text-shadow:0 1px 4px rgba(0,0,0,0.6)}
          .results-section{padding:20px}
          .results-title{font-size:20px;font-weight:700;color:#fff;margin-bottom:16px}
          .results-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
          .no-results{text-align:center;padding:60px 20px;color:#555}
          .no-results i{font-size:44px;margin-bottom:12px;display:block}
          .loading-dots{display:flex;justify-content:center;padding:40px;gap:8px}
          .dot{width:8px;height:8px;border-radius:50%;background:#444;animation:dotPulse 1.4s infinite}
          .dot:nth-child(2){animation-delay:0.2s}
          .dot:nth-child(3){animation-delay:0.4s}
          @keyframes dotPulse{0%,80%,100%{transform:scale(0.6);background:#333}40%{transform:scale(1);background:#888}}
        `}</style>
      </Head>

      <header className="search-page-header">
        <Link href="/">
          <button className="search-back-btn"><i className="fas fa-arrow-left"></i></button>
        </Link>
        <div className="search-bar">
          <i className="fas fa-search search-icon"></i>
          <input
            ref={inputRef}
            type="text"
            placeholder="O que está procurando?"
            className="search-input"
            value={query}
            onChange={e=>setQuery(e.target.value)}
          />
          {query&&(
            <button className="search-clear" onClick={()=>setQuery('')}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </header>

      <div className="search-body">
        <div className="search-filters">
          {FILTERS.map(f=>(
            <button key={f} className={`filter-btn ${activeFilter===f?'active':''}`} onClick={()=>setActiveFilter(f)}>
              {f}
            </button>
          ))}
        </div>

        {loading&&(
          <div className="loading-dots">
            <div className="dot"/><div className="dot"/><div className="dot"/>
          </div>
        )}

        {!loading&&query&&results.length===0&&(
          <div className="no-results">
            <i className="fas fa-search"></i>
            <p style={{fontSize:'16px',fontWeight:'600',color:'#666'}}>Nenhum resultado para</p>
            <p style={{fontSize:'18px',fontWeight:'700',color:'#888',marginTop:'4px'}}>"{query}"</p>
          </div>
        )}

        {!loading&&results.length>0&&(
          <div className="results-section">
            <h2 className="results-title">Resultados ({results.length})</h2>
            <div className="results-grid">
              {results.map(item=>(
                <MovieCard key={`${item.media_type}-${item.id}`} item={item} isFavorite={isFavorite(item)} toggleFavorite={toggleFavorite}/>
              ))}
            </div>
          </div>
        )}

        {!query&&(
          <div className="categories-section">
            <h2 className="categories-title">Categorias</h2>
            <div className="categories-grid">
              {CATEGORIES.map((cat,i)=>(
                <div
                  key={i}
                  className="category-card"
                  onClick={()=>setQuery(cat.name)}
                >
                  <div
                    className="category-bg"
                    style={{backgroundImage:`url(https://image.tmdb.org/t/p/w500${POSTER_COVERS[i]||POSTER_COVERS[0]})`}}
                  />
                  <div className="category-overlay" style={{background:cat.color}}/>
                  <span className="category-name">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav activeSection={activeSection} setActiveSection={handleNavChange}/>
    </>
  )
      }
