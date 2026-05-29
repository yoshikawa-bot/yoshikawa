import{useState,useEffect,useRef,useCallback}from'react'
import Head from'next/head'
import Link from'next/link'

const TMDB_API_KEY='66223dd3ad2885cf1129b181c7826287'
const DEFAULT_POSTER='https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'

const SECTION_TITLES={releases:'Lançamentos',recommendations:'Populares',favorites:'Favoritos'}

const SECTION_HERO={
  releases:<><em>Filmes</em> e <em>séries</em> atualmente em cartaz, ordenados pelos lançamentos mais recentes. Conteúdo atualizado em tempo real via <em>TMDB</em>.</>,
  recommendations:<>Os títulos mais <em>populares</em> do momento entre filmes e séries, classificados pelo índice de popularidade do <em>TMDB</em>.</>,
  favorites:<>Sua lista <em>pessoal</em> de favoritos, salva localmente no seu dispositivo — sem conta, sem servidor, sempre <em>disponível</em>.</>,
  search:<><em>Resultados</em> da sua busca em filmes e séries, ordenados por <em>popularidade</em>.</>
}

const useDebounce=(callback,delay)=>{
  const timeoutRef=useRef(null)
  return useCallback((...args)=>{
    if(timeoutRef.current)clearTimeout(timeoutRef.current)
    timeoutRef.current=setTimeout(()=>callback(...args),delay)
  },[callback,delay])
}

const getItemKey=(item)=>`${item.media_type}-${item.id}`

export const LoadingScreen=({onComplete})=>{
  const canvasRef=useRef(null)
  const animFrameRef=useRef(null)
  const timeRef=useRef(0)
  const[closing,setClosing]=useState(false)
  const[mounted,setMounted]=useState(true)

  useEffect(()=>{
    const canvas=canvasRef.current
    if(!canvas)return
    const ctx=canvas.getContext('2d')
    const W=canvas.width=280
    const H=canvas.height=280
    const cx=W/2
    const cy=H/2

    const drawModulatedRing=(t,baseR,amplitude,freq,phase,alpha,lineW)=>{
      ctx.beginPath()
      const steps=280
      for(let i=0;i<=steps;i++){
        const angle=(i/steps)*Math.PI*2
        const mod=Math.sin(freq*angle+phase+t*0.75)+Math.sin(freq*2.4*angle+phase*1.6+t*1.05)*0.45+Math.sin(freq*0.35*angle-phase*0.7+t*0.55)*0.55
        const r=baseR+amplitude*mod
        const x=cx+r*Math.cos(angle)
        const y=cy+r*Math.sin(angle)
        if(i===0)ctx.moveTo(x,y)
        else ctx.lineTo(x,y)
      }
      ctx.closePath()
      ctx.strokeStyle=`rgba(218,119,87,${alpha})`
      ctx.lineWidth=lineW
      ctx.stroke()
    }

    const drawDot=(x,y,r,alpha)=>{
      ctx.beginPath()
      ctx.arc(x,y,r,0,Math.PI*2)
      ctx.fillStyle=`rgba(218,119,87,${alpha})`
      ctx.fill()
    }

    const animate=()=>{
      ctx.clearRect(0,0,W,H)
      timeRef.current+=0.016

      drawModulatedRing(timeRef.current,76,20,5.2,0.0,0.50,1.8)
      drawModulatedRing(timeRef.current,88,13,7.3,2.3,0.32,1.2)
      drawModulatedRing(timeRef.current,58,9,3.1,4.8,0.42,1.0)
      drawModulatedRing(timeRef.current,45,5.5,1.9,1.6,0.24,0.7)

      const numParticles=3
      for(let i=0;i<numParticles;i++){
        const orbitR=42+i*20
        const speed=0.65+i*0.28
        const angle=timeRef.current*speed+i*(Math.PI*2/numParticles)
        const px=cx+orbitR*Math.cos(angle)
        const py=cy+orbitR*Math.sin(angle)
        const dotR=2.6-i*0.45
        drawDot(px,py,dotR,0.68-i*0.14)
      }

      animFrameRef.current=requestAnimationFrame(animate)
    }

    animate()

    return()=>{
      if(animFrameRef.current)cancelAnimationFrame(animFrameRef.current)
    }
  },[])

  const handleEnter=()=>{
    setClosing(true)
  }

  useEffect(()=>{
    if(closing){
      const timer=setTimeout(()=>{
        if(animFrameRef.current)cancelAnimationFrame(animFrameRef.current)
        setMounted(false)
        onComplete()
      },400)
      return()=>clearTimeout(timer)
    }
  },[closing,onComplete])

  if(!mounted)return null

  return(
    <div className={`loading-overlay ${closing?'closing':''}`}>
      <div className="loading-visual-container">
        <canvas ref={canvasRef} width="280" height="280"></canvas>
      </div>
      <button className="loading-enter-btn" onClick={handleEnter}>
        <span>Entrar</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 74 74"
          height="28"
          width="28"
        >
          <circle stroke-width="3" stroke="white" r="35.5" cy="37" cx="37"></circle>
          <path
            fill="white"
            d="M25 35.5C24.1716 35.5 23.5 36.1716 23.5 37C23.5 37.8284 24.1716 38.5 25 38.5V35.5ZM49.0607 38.0607C49.6464 37.4749 49.6464 36.5251 49.0607 35.9393L39.5147 26.3934C38.9289 25.8076 37.9792 25.8076 37.3934 26.3934C36.8076 26.9792 36.8076 27.9289 37.3934 28.5147L45.8787 37L37.3934 45.4853C36.8076 46.0711 36.8076 47.0208 37.3934 47.6066C37.9792 48.1924 38.9289 48.1924 39.5147 47.6066L49.0607 38.0607ZM25 38.5L48 38.5V35.5L25 35.5V38.5Z"
          ></path>
        </svg>
      </button>
      <div className="loading-brand-text">YOSHIKAWA ESM</div>
      <div className="loading-scanlines"></div>
      <div className="loading-vignette"></div>
      <div className="loading-noise"></div>
    </div>
  )
}

export const Header=({label,scrolled,showInfo,toggleInfo,infoClosing,showTech,toggleTech,techClosing})=>{
  const handleRightClick=(e)=>{
    e.stopPropagation()
    if(scrolled){window.scrollTo({top:0,behavior:'smooth'})}else{toggleInfo()}
  }
  return(
    <>
      <header className={`bar-container top-bar ${scrolled?'scrolled-state':''}`}>
        <button className="round-btn glass-panel" onClick={(e)=>{e.stopPropagation();toggleTech()}} title="Info Técnica">
          <i className="fas fa-microchip" style={{fontSize:'14px'}}></i>
        </button>
        <div className="pill-container glass-panel">
          <span key={label} className="bar-label">{label}</span>
        </div>
        <button className="round-btn glass-panel" title={scrolled?"Voltar ao topo":"Informações"} onClick={handleRightClick}>
          <i className={scrolled?"fas fa-chevron-up":"fas fa-info-circle"} style={{fontSize:'14px'}}></i>
        </button>
      </header>
      {showInfo&&(
        <div className={`info-popup glass-panel ${infoClosing?'closing':''}`} onClick={(e)=>e.stopPropagation()}>
          <div className="popup-icon-wrapper"><i className="fas fa-shield-halved"></i></div>
          <div className="popup-content">
            <p className="popup-title">Proteção Recomendada</p>
            <p className="popup-text">Use <strong>Brave</strong> ou <strong>AdBlock</strong> para melhor experiência</p>
          </div>
        </div>
      )}
      {showTech&&(
        <div className={`info-popup glass-panel ${techClosing?'closing':''}`} onClick={(e)=>e.stopPropagation()}>
          <div className="popup-icon-wrapper tech"><i className="fas fa-microchip"></i></div>
          <div className="popup-content">
            <p className="popup-title">Informações Técnicas</p>
            <p className="popup-text">v2.6.0 Slim • React 18 • TMDB API</p>
          </div>
        </div>
      )}
    </>
  )
}

export const BottomNav=({activeSection,setActiveSection,searchActive,setSearchActive,searchQuery,setSearchQuery,onSearchSubmit,inputRef})=>{
  const handleShare=async()=>{
    if(navigator.share){
      try{await navigator.share({title:'Yoshikawa Player',url:window.location.href})}catch(err){}
    }else{alert('Compartilhar não suportado neste navegador')}
  }
  return(
    <div className="bar-container bottom-bar">
      <button className="round-btn glass-panel" onClick={handleShare} title="Compartilhar">
        <i className="fas fa-arrow-up-from-bracket" style={{fontSize:'15px',transform:'translateY(-1px)'}}></i>
      </button>
      <div className={`pill-container glass-panel ${searchActive?'search-mode':''}`}>
        {searchActive?(
          <div className="search-wrap">
            <input ref={inputRef} type="text" placeholder="Buscar..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&onSearchSubmit(searchQuery)}/>
          </div>
        ):(
          <>
            <button className={`nav-btn ${activeSection==='releases'?'active':''}`} onClick={()=>setActiveSection('releases')}><i className="fas fa-film"></i></button>
            <button className={`nav-btn ${activeSection==='recommendations'?'active':''}`} onClick={()=>setActiveSection('recommendations')}><i className="fas fa-fire-flame-curved"></i></button>
            <button className={`nav-btn ${activeSection==='favorites'?'active':''}`} onClick={()=>setActiveSection('favorites')}><i className="fas fa-heart"></i></button>
          </>
        )}
      </div>
      <button className="round-btn glass-panel" onClick={()=>setSearchActive(s=>!s)}>
        <i className={searchActive?'fas fa-xmark':'fas fa-magnifying-glass'} style={{fontSize:searchActive?'17px':'15px'}}></i>
      </button>
    </div>
  )
}

export const ToastContainer=({toast,closeToast})=>{
  if(!toast)return null
  return(
    <div className="toast-wrap">
      <div className={`toast glass-panel ${toast.type} ${toast.closing?'closing':''}`} onClick={closeToast}>
        <div className="toast-icon-wrapper">
          <i className={`fas ${toast.type==='success'?'fa-check-circle':toast.type==='error'?'fa-exclamation-circle':'fa-info-circle'}`}></i>
        </div>
        <div className="toast-content">
          <div className="toast-title">{toast.type==='success'?'Sucesso':toast.type==='error'?'Erro':'Info'}</div>
          <div className="toast-msg">{toast.message}</div>
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
        <button className="fav-btn glass-panel" onClick={handleFavClick}>
          <i className={`${isFavorite?'fas fa-heart':'far fa-heart'} ${animating?'heart-pulse':''}`} style={{color:isFavorite?'#ff3b30':'#ffffff'}}></i>
        </button>
      </div>
    </Link>
  )
}

export const Footer=()=>(
  <footer className="footer-credits">
    <p className="footer-main">Yoshikawa Systems &copy; {new Date().getFullYear()}</p>
    <p className="footer-author">Desenvolvido por @kawalyansky</p>
    <p className="footer-tech">React 18 • TMDB API • v2.6.0</p>
  </footer>
)

export default function Home(){
  const[welcomed,setWelcomed]=useState(true)
  const[loadingComplete,setLoadingComplete]=useState(false)
  const[releases,setReleases]=useState([])
  const[recommendations,setRecommendations]=useState([])
  const[favorites,setFavorites]=useState([])
  const[searchResults,setSearchResults]=useState([])
  const[loading,setLoading]=useState(false)
  const[searchQuery,setSearchQuery]=useState('')
  const[activeSection,setActiveSection]=useState('releases')
  const[searchActive,setSearchActive]=useState(false)
  const[currentToast,setCurrentToast]=useState(null)
  const[toastQueue,setToastQueue]=useState([])
  const[scrolled,setScrolled]=useState(false)
  const[showInfoPopup,setShowInfoPopup]=useState(false)
  const[infoClosing,setInfoClosing]=useState(false)
  const[showTechPopup,setShowTechPopup]=useState(false)
  const[techClosing,setTechClosing]=useState(false)
  const[heroOpen,setHeroOpen]=useState(false)
  const[heroClosing,setHeroClosing]=useState(false)
  const searchInputRef=useRef(null)
  const toastTimerRef=useRef(null)

  useEffect(()=>{
    try{const seen=sessionStorage.getItem('yoshikawaWelcomed');if(seen){setWelcomed(true);setLoadingComplete(true)}else{setWelcomed(false)}}catch{setWelcomed(false)}
  },[])

  const handleLoadingComplete=()=>{
    try{sessionStorage.setItem('yoshikawaWelcomed','1')}catch{}
    setWelcomed(true)
    setLoadingComplete(true)
  }

  const toggleHero=()=>{
    if(heroOpen){
      setHeroClosing(true)
      setTimeout(()=>{setHeroOpen(false);setHeroClosing(false)},350)
    }else{setHeroOpen(true)}
  }

  useEffect(()=>{
    if(!heroOpen)return
    setHeroClosing(true)
    const t=setTimeout(()=>{setHeroOpen(false);setHeroClosing(false)},350)
    return()=>clearTimeout(t)
  },[activeSection,searchActive])

  const showToast=(message,type='info')=>{
    if(showInfoPopup||showTechPopup)closeAllPopups()
    if(currentToast&&!currentToast.closing){
      setCurrentToast(prev=>({...prev,closing:true}))
      setTimeout(()=>setToastQueue(prev=>[...prev,{message,type,id:Date.now()}]),200)
    }else{setToastQueue(prev=>[...prev,{message,type,id:Date.now()}])}
  }

  useEffect(()=>{
    if(toastQueue.length>0){
      if(currentToast&&!currentToast.closing){
        if(toastTimerRef.current)clearTimeout(toastTimerRef.current)
        setCurrentToast(prev=>({...prev,closing:true}))
      }else if(!currentToast){
        const next=toastQueue[0]
        setToastQueue(prev=>prev.slice(1))
        setCurrentToast({...next,closing:false})
        if(toastTimerRef.current)clearTimeout(toastTimerRef.current)
        toastTimerRef.current=setTimeout(()=>setCurrentToast(t=>(t&&t.id===next.id?{...t,closing:true}:t)),2500)
      }
    }
  },[toastQueue,currentToast])

  useEffect(()=>{
    if(currentToast?.closing){const t=setTimeout(()=>setCurrentToast(null),400);return()=>clearTimeout(t)}
  },[currentToast])

  const manualCloseToast=()=>{if(currentToast)setCurrentToast({...currentToast,closing:true})}

  const closeAllPopups=useCallback(()=>{
    if(showInfoPopup&&!infoClosing){setInfoClosing(true);setTimeout(()=>{setShowInfoPopup(false);setInfoClosing(false)},400)}
    if(showTechPopup&&!techClosing){setTechClosing(true);setTimeout(()=>{setShowTechPopup(false);setTechClosing(false)},400)}
    if(currentToast&&!currentToast.closing)setCurrentToast(prev=>({...prev,closing:true}))
  },[showInfoPopup,infoClosing,showTechPopup,techClosing,currentToast])

  const toggleInfoPopup=()=>{
    if(showTechPopup||currentToast){closeAllPopups();setTimeout(()=>{if(!showInfoPopup)setShowInfoPopup(true)},200)}
    else{if(showInfoPopup){setInfoClosing(true);setTimeout(()=>{setShowInfoPopup(false);setInfoClosing(false)},400)}else{setShowInfoPopup(true)}}
  }

  const toggleTechPopup=()=>{
    if(showInfoPopup||currentToast){closeAllPopups();setTimeout(()=>{if(!showTechPopup)setShowTechPopup(true)},200)}
    else{if(showTechPopup){setTechClosing(true);setTimeout(()=>{setShowTechPopup(false);setTechClosing(false)},400)}else{setShowTechPopup(true)}}
  }

  useEffect(()=>{
    const onScroll=()=>{if(window.scrollY>10)closeAllPopups();setScrolled(window.scrollY>60)}
    window.addEventListener('scroll',onScroll,{passive:true})
    const onClick=(e)=>{
      if(!e.target.closest('.info-popup')&&!e.target.closest('.toast')&&!e.target.closest('.round-btn')&&!e.target.closest('.pill-container'))closeAllPopups()
    }
    window.addEventListener('click',onClick)
    return()=>{window.removeEventListener('scroll',onScroll);window.removeEventListener('click',onClick)}
  },[closeAllPopups])

  useEffect(()=>{loadHomeContent();loadFavorites()},[])

  useEffect(()=>{
    if(searchActive&&searchInputRef.current)searchInputRef.current.focus()
    if(!searchActive){setSearchResults([]);setSearchQuery('')}
  },[searchActive])

  const fetchTMDB=async(url)=>{
    try{const r=await fetch(url);if(!r.ok)throw new Error();const d=await r.json();return d.results||[]}
    catch{return[]}
  }

  const fetchTMDBPages=async(endpoint)=>{
    try{const[r1,r2]=await Promise.all([fetchTMDB(`${endpoint}&page=1`),fetchTMDB(`${endpoint}&page=2`)]);return[...r1,...r2]}
    catch{return[]}
  }

  const fetchSearchResults=async(query)=>{
    if(!query.trim()){setSearchResults([]);setLoading(false);return}
    setLoading(true)
    try{
      const[movies,tv]=await Promise.all([
        fetchTMDBPages(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`),
        fetchTMDBPages(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`)
      ])
      const combined=[...movies.map(i=>({...i,media_type:'movie'})),...tv.map(i=>({...i,media_type:'tv'}))]
        .filter(i=>i.poster_path).sort((a,b)=>b.popularity-a.popularity).slice(0,40)
      setSearchResults(combined)
    }catch{showToast('Erro na busca','error');setSearchResults([])}
    finally{setLoading(false)}
  }

  const debouncedSearch=useDebounce(fetchSearchResults,300)

  const handleSearchChange=(q)=>{
    setSearchQuery(q)
    if(!q.trim()){setSearchResults([]);setLoading(false);return}
    setLoading(true);debouncedSearch(q)
  }

  const loadHomeContent=async()=>{
    try{
      const[moviesNow,tvNow,moviesPopular,tvPopular]=await Promise.all([
        fetchTMDBPages(`https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&language=pt-BR`),
        fetchTMDBPages(`https://api.themoviedb.org/3/tv/on_the_air?api_key=${TMDB_API_KEY}&language=pt-BR`),
        fetchTMDBPages(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=pt-BR`),
        fetchTMDBPages(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&language=pt-BR`)
      ])
      setReleases([...moviesNow.map(i=>({...i,media_type:'movie'})),...tvNow.map(i=>({...i,media_type:'tv'}))]
        .filter(i=>i.poster_path).sort((a,b)=>new Date(b.release_date||b.first_air_date)-new Date(a.release_date||a.first_air_date)).slice(0,36))
      setRecommendations([...moviesPopular.map(i=>({...i,media_type:'movie'})),...tvPopular.map(i=>({...i,media_type:'tv'}))]
        .filter(i=>i.poster_path).sort((a,b)=>b.popularity-a.popularity).slice(0,36))
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
      if(exists){updated=prev.filter(f=>!(f.id===item.id&&f.media_type===item.media_type));showToast('Removido dos favoritos','info')}
      else{updated=[...prev,{id:item.id,media_type:item.media_type,title:item.title||item.name,poster_path:item.poster_path}];showToast('Adicionado aos favoritos','success')}
      try{localStorage.setItem('yoshikawaFavorites',JSON.stringify(updated))}catch{showToast('Erro ao salvar favoritos','error')}
      return updated
    })
  }

  const activeList=searchActive?searchResults:(activeSection==='releases'?releases:(activeSection==='recommendations'?recommendations:favorites))
  const pageTitle=searchActive?'Resultados':(SECTION_TITLES[activeSection]||'Conteúdo')
  const headerLabel=scrolled?(searchActive?'Resultados':SECTION_TITLES[activeSection]||'Conteúdo'):'Yoshikawa'

  return(
    <>
      <Head>
        <title>Yoshikawa Player</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap" rel="stylesheet"/>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
        <style>{`
          *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
          html{scroll-behavior:smooth}
          body{font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;background:#050505;color:#f5f5f7;line-height:1.6;font-size:16px;min-height:100vh;overflow-y:auto;overflow-x:hidden;background-image:radial-gradient(circle at 50% 0%,#1a1a1a,#050505 80%);background-attachment:fixed}
          a{color:inherit;text-decoration:none}
          button{font-family:inherit;border:none;outline:none;background:none;cursor:pointer;user-select:none}
          img{max-width:100%;height:auto;display:block}
          :root{--pill-height:44px;--pill-radius:50px;--pill-max-width:520px;--ios-blue:#0A84FF;--ease-elastic:cubic-bezier(0.34,1.56,0.64,1);--ease-smooth:cubic-bezier(0.25,0.46,0.45,0.94)}
          .glass-panel{position:relative;background:rgba(255,255,255,0.06);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.1);border-radius:inherit;box-shadow:0 8px 32px rgba(0,0,0,0.3);overflow:hidden;transition:transform 0.3s var(--ease-elastic),background 0.3s ease,border-color 0.3s ease}

          .loading-overlay{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#000000;animation:loadingSlideRight 0.35s cubic-bezier(0.55,0.055,0.675,0.19) forwards;animation-play-state:paused}
          .loading-overlay.closing{animation-play-state:running}
          @keyframes loadingSlideRight{from{transform:translateX(0)}to{transform:translateX(100%)}}
          .loading-visual-container{position:relative;width:280px;height:280px;margin-bottom:20px;display:flex;align-items:center;justify-content:center}
          .loading-visual-container canvas{display:block;position:relative;z-index:2}
          .loading-enter-btn{cursor:pointer;font-weight:700;transition:all 0.2s;padding:8px 18px;border-radius:100px;background:#DA7757;border:1px solid transparent;display:flex;align-items:center;font-size:14px;color:#ffffff;z-index:13;position:relative;margin-bottom:32px}
          .loading-enter-btn:hover{background:#c96a4d}
          .loading-enter-btn>svg{width:28px;margin-left:8px;transition:transform 0.3s ease-in-out}
          .loading-enter-btn:hover svg{transform:translateX(4px)}
          .loading-enter-btn:active{transform:scale(0.95)}
          .loading-brand-text{position:fixed;bottom:32px;left:50%;transform:translateX(-50%);z-index:12;font-family:'Inter','Inter Black','Helvetica Neue','Arial Black',sans-serif;font-weight:900;color:#ffffff;font-size:1.25rem;letter-spacing:0.12em;text-transform:uppercase;white-space:nowrap}
          .loading-scanlines{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.09) 2px,rgba(0,0,0,0.09) 4px)}
          .loading-vignette{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9;background:radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,0.7) 100%)}
          .loading-noise{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:11;opacity:0.035;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-repeat:repeat;background-size:200px 200px}

          .bar-container{position:fixed;left:50%;transform:translateX(-50%);z-index:1000;display:flex;align-items:center;justify-content:center;gap:12px;width:90%;max-width:var(--pill-max-width);transition:all 0.4s var(--ease-smooth)}
          .top-bar{top:20px}
          .bottom-bar{bottom:20px}
          .top-bar.scrolled-state{transform:translateX(-50%) translateY(-5px)}
          .round-btn{width:var(--pill-height);height:var(--pill-height);border-radius:50%;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.9);flex-shrink:0;transition:all 0.3s var(--ease-elastic)}
          .round-btn:hover{transform:scale(1.08);background:rgba(255,255,255,0.12);border-color:rgba(255,255,255,0.2)}
          .round-btn:active{transform:scale(0.92)}
          .pill-container{height:var(--pill-height);flex:1;border-radius:var(--pill-radius);display:flex;align-items:center;justify-content:center;position:relative;transition:all 0.4s var(--ease-elastic)}
          .bar-label{font-size:0.9rem;font-weight:600;color:#fff;white-space:nowrap;letter-spacing:-0.01em;animation:labelFadeIn 0.4s var(--ease-elastic) forwards;position:relative;z-index:5}
          @keyframes labelFadeIn{from{opacity:0;transform:translateY(12px) scale(0.9)}to{opacity:1;transform:translateY(0) scale(1)}}
          .info-popup,.toast{position:fixed;top:calc(20px + var(--pill-height) + 16px);left:50%;z-index:960;min-width:320px;max-width:90%;display:flex;align-items:flex-start;gap:14px;padding:16px 18px;border-radius:22px;transform:translate3d(-50%,-50%,0) scale3d(0.3,0.3,1);transform-origin:top center;opacity:0;will-change:transform,opacity;backface-visibility:hidden;-webkit-backface-visibility:hidden;perspective:1000px;-webkit-perspective:1000px;animation:popupZoomIn 0.5s var(--ease-elastic) forwards;box-shadow:0 20px 60px rgba(0,0,0,0.6);contain:layout style paint}
          .info-popup{z-index:950;pointer-events:none}
          .toast{z-index:960;pointer-events:auto;align-items:center}
          .info-popup.closing,.toast.closing{animation:popupZoomOut 0.4s cubic-bezier(0.55,0.055,0.675,0.19) forwards}
          @keyframes popupZoomIn{0%{opacity:0;transform:translate3d(-50%,-50%,0) scale3d(0.3,0.3,1)}100%{opacity:1;transform:translate3d(-50%,0,0) scale3d(1,1,1);pointer-events:auto}}
          @keyframes popupZoomOut{0%{opacity:1;transform:translate3d(-50%,0,0) scale3d(1,1,1)}100%{opacity:0;transform:translate3d(-50%,-30%,0) scale3d(0.5,0.5,1);pointer-events:none}}
          .popup-icon-wrapper,.toast-icon-wrapper{width:42px;height:42px;min-width:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;will-change:transform,opacity;backface-visibility:hidden;-webkit-backface-visibility:hidden;transform:translate3d(0,0,0);animation:iconPop 0.6s var(--ease-elastic) 0.1s backwards;contain:layout style paint}
          .popup-icon-wrapper{background:linear-gradient(135deg,#34c759 0%,#30d158 100%);box-shadow:0 4px 12px rgba(52,199,89,0.3)}
          .toast-icon-wrapper{border-radius:50%}
          @keyframes iconPop{from{transform:scale3d(0,0,1);opacity:0}to{transform:scale3d(1,1,1);opacity:1}}
          .popup-icon-wrapper.tech{background:linear-gradient(135deg,#0a84ff 0%,#007aff 100%);box-shadow:0 4px 12px rgba(10,132,255,0.3)}
          .toast.success .toast-icon-wrapper{background:linear-gradient(135deg,#34c759 0%,#30d158 100%);box-shadow:0 4px 12px rgba(52,199,89,0.3)}
          .toast.info .toast-icon-wrapper{background:linear-gradient(135deg,#0a84ff 0%,#007aff 100%);box-shadow:0 4px 12px rgba(10,132,255,0.3)}
          .toast.error .toast-icon-wrapper{background:linear-gradient(135deg,#ff453a 0%,#ff3b30 100%);box-shadow:0 4px 12px rgba(255,69,58,0.3)}
          .popup-icon-wrapper i,.toast-icon-wrapper i{font-size:20px;color:#fff;will-change:transform;backface-visibility:hidden;-webkit-backface-visibility:hidden;transform:translate3d(0,0,0)}
          .popup-content,.toast-content{flex:1;display:flex;flex-direction:column;gap:4px;opacity:0;will-change:transform,opacity;backface-visibility:hidden;-webkit-backface-visibility:hidden;animation:contentFade 0.4s ease 0.2s forwards;contain:layout style}
          @keyframes contentFade{from{opacity:0;transform:translate3d(10px,0,0)}to{opacity:1;transform:translate3d(0,0,0)}}
          .popup-title,.toast-title{font-size:0.95rem;font-weight:600;color:#fff;margin:0;line-height:1.3}
          .popup-text,.toast-msg{font-size:0.8rem;color:rgba(255,255,255,0.7);margin:0;line-height:1.4}
          .container{max-width:1280px;margin:0 auto;padding-top:6.5rem;padding-bottom:7rem;padding-left:2rem;padding-right:2rem}
          .page-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;animation:headerFadeIn 0.8s var(--ease-elastic) forwards}
          @keyframes headerFadeIn{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
          .page-title{font-size:1.5rem;font-weight:700;margin:0;color:#fff;letter-spacing:-0.03em;text-shadow:0 4px 20px rgba(0,0,0,0.5)}
          .title-row{display:flex;align-items:center;gap:10px}
          .hero-toggle{display:flex;align-items:center;justify-content:center;color:#fff;background:none;border:none;padding:0;flex-shrink:0;opacity:0.85}
          .hero-toggle:hover{opacity:1}
          .hero-toggle:active{opacity:0.6}
          .hero-toggle i{font-size:13px;transition:transform 0.45s cubic-bezier(0.34,1.56,0.64,1)}
          .hero-toggle.open i{transform:rotate(180deg)}
          .section-hero{border-radius:16px;padding:16px 20px;margin-bottom:1.5rem;font-family:Georgia,'Times New Roman',serif;font-size:0.88rem;color:rgba(255,255,255,0.58);line-height:1.8;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);animation:heroIn 0.35s var(--ease-elastic) forwards}
          .section-hero.closing{animation:heroOut 0.3s ease forwards}
          .section-hero em{color:rgba(255,255,255,0.9);font-style:italic}
          @keyframes heroIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
          @keyframes heroOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-8px)}}
          .status-dots{display:flex;align-items:center;gap:8px}
          .dot{width:10px;height:10px;border-radius:50%}
          .dot.red{background:linear-gradient(135deg,#ff453a,#ff3b30)}
          .dot.yellow{background:linear-gradient(135deg,#ffd60a,#ffcc00)}
          .dot.green{background:linear-gradient(135deg,#34c759,#30d158)}
          .content-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:24px 12px;width:100%}
          .card-wrapper{display:flex;flex-direction:column;width:100%;position:relative;animation:cardEntrance 0.7s var(--ease-elastic) backwards;transition:transform 0.2s ease}
          .card-wrapper:active{transform:scale(0.95)}
          @keyframes cardEntrance{from{opacity:0;transform:translateY(40px) scale(0.9)}to{opacity:1;transform:translateY(0) scale(1)}}
          .card-wrapper:nth-child(1){animation-delay:30ms}.card-wrapper:nth-child(2){animation-delay:60ms}.card-wrapper:nth-child(3){animation-delay:90ms}.card-wrapper:nth-child(4){animation-delay:120ms}.card-wrapper:nth-child(5){animation-delay:150ms}.card-wrapper:nth-child(6){animation-delay:180ms}.card-wrapper:nth-child(7){animation-delay:210ms}.card-wrapper:nth-child(8){animation-delay:240ms}.card-wrapper:nth-child(9){animation-delay:270ms}.card-wrapper:nth-child(10){animation-delay:300ms}.card-wrapper:nth-child(11){animation-delay:330ms}.card-wrapper:nth-child(12){animation-delay:360ms}.card-wrapper:nth-child(13){animation-delay:390ms}.card-wrapper:nth-child(14){animation-delay:420ms}.card-wrapper:nth-child(15){animation-delay:450ms}.card-wrapper:nth-child(16){animation-delay:480ms}.card-wrapper:nth-child(17){animation-delay:510ms}.card-wrapper:nth-child(18){animation-delay:540ms}.card-wrapper:nth-child(19){animation-delay:570ms}.card-wrapper:nth-child(20){animation-delay:600ms}
          .card-poster-frame{position:relative;border-radius:16px;overflow:hidden;aspect-ratio:2/3;background:#1a1a1a;border:1px solid rgba(255,255,255,0.18);transition:all 0.5s var(--ease-elastic)}
          .card-wrapper:hover .card-poster-frame{transform:translateY(-8px);box-shadow:0 20px 40px rgba(0,0,0,0.6);border-color:rgba(255,255,255,0.4)}
          .content-poster{width:100%;height:100%;object-fit:cover;transition:transform 0.8s var(--ease-elastic)}
          .card-wrapper:hover .content-poster{transform:scale(1.12)}
          .fav-btn{position:absolute;top:8px;right:8px;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;opacity:0;transform:scale(0.8);transition:all 0.4s var(--ease-elastic);border:none;z-index:20;background:rgba(0,0,0,0.4);backdrop-filter:blur(4px)}
          .card-poster-frame:hover .fav-btn,.fav-btn:active{opacity:1;transform:scale(1)}
          .fav-btn:hover{background:rgba(255,255,255,0.2);transform:scale(1.1)}
          .fav-btn:active{transform:scale(0.9)}
          @media(hover:none){.fav-btn{opacity:1;transform:scale(1)}}
          .heart-pulse{animation:heartZoom 0.5s var(--ease-elastic)}
          @keyframes heartZoom{0%{transform:scale(1)}50%{transform:scale(1.6)}100%{transform:scale(1)}}
          .nav-btn{flex:1;display:flex;align-items:center;justify-content:center;height:100%;color:rgba(255,255,255,0.4);transition:all 0.3s ease;position:relative;z-index:5}
          .nav-btn i{font-size:18px;transition:all 0.4s var(--ease-elastic);transform-origin:center}
          .nav-btn:hover i{transform:scale(1.2);color:rgba(255,255,255,0.8)}
          .nav-btn:active i{transform:scale(0.9)}
          .nav-btn.active{color:#fff}
          .nav-btn.active i{transform:scale(1.15)}
          .search-wrap{width:100%;padding:0 16px;position:relative;z-index:5;animation:searchExpand 0.4s var(--ease-elastic)}
          @keyframes searchExpand{from{opacity:0;transform:scaleX(0.9)}to{opacity:1;transform:scaleX(1)}}
          .search-wrap input{width:100%;background:transparent;border:none;outline:none;color:#fff;font-size:15px;font-family:inherit}
          .toast-wrap{position:fixed;top:calc(20px + var(--pill-height) + 16px);left:50%;z-index:960;pointer-events:none}
          .footer-credits{margin-top:3rem;padding:2rem;text-align:center;color:rgba(255,255,255,0.3);font-size:0.75rem;border-top:1px solid rgba(255,255,255,0.05);animation:footerFadeIn 0.8s ease forwards;display:flex;flex-direction:column;gap:6px}
          .footer-main{font-size:0.8rem;font-weight:500;color:rgba(255,255,255,0.4)}
          .footer-author{font-size:0.7rem;color:rgba(255,255,255,0.25);font-style:italic}
          .footer-tech{font-size:0.65rem;color:rgba(255,255,255,0.2);font-family:'Courier New',monospace}
          @keyframes footerFadeIn{from{opacity:0}to{opacity:1}}
          .spinner{width:24px;height:24px;border:2px solid rgba(255,255,255,0.1);border-top-color:#fff;border-radius:50%;animation:spin 0.8s linear infinite}
          @keyframes spin{to{transform:rotate(360deg)}}
          .empty-state{display:flex;flex-direction:column;align-items:center;color:#555;margin-top:3rem;gap:12px;animation:emptyStateFadeIn 0.6s var(--ease-elastic) forwards}
          .empty-state i{font-size:2rem;opacity:0.5;margin-bottom:8px;animation:floatIcon 3s ease-in-out infinite}
          @keyframes floatIcon{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
          @keyframes emptyStateFadeIn{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
          @media(max-width:768px){
            .container{padding-left:1rem;padding-right:1rem}
            .content-grid{grid-template-columns:repeat(2,1fr)!important;gap:16px 10px}
            .bar-container{width:94%;gap:8px}
            .card-poster-frame{border-radius:14px}
            .info-popup,.toast{min-width:280px;padding:14px 16px}
            .popup-icon-wrapper,.toast-icon-wrapper{width:38px;height:38px;min-width:38px}
            .popup-icon-wrapper i,.toast-icon-wrapper i{font-size:18px}
            .popup-title,.toast-title{font-size:0.88rem}
            .popup-text,.toast-msg{font-size:0.75rem}
            .page-title{font-size:1.3rem}
            .dot{width:8px;height:8px}
            .status-dots{gap:6px}
            .loading-visual-container{width:220px;height:220px;margin-bottom:16px}
            .loading-visual-container canvas{width:220px;height:220px}
            .loading-enter-btn{margin-bottom:24px}
            .loading-brand-text{font-size:1rem;bottom:24px}
          }
        `}</style>
      </Head>

      {!welcomed&&<LoadingScreen onComplete={handleLoadingComplete}/>}

      {loadingComplete&&(
        <>
          <Header label={headerLabel} scrolled={scrolled} showInfo={showInfoPopup} toggleInfo={toggleInfoPopup} infoClosing={infoClosing} showTech={showTechPopup} toggleTech={toggleTechPopup} techClosing={techClosing}/>

          <ToastContainer toast={currentToast} closeToast={manualCloseToast}/>

          <main className="container">
            <div className="page-header">
              <div className="title-row">
                <h1 className="page-title">{pageTitle}</h1>
                <button className={`hero-toggle ${heroOpen?'open':''}`} onClick={toggleHero}>
                  <i className="fas fa-chevron-down"></i>
                </button>
              </div>
              <div className="status-dots">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
              </div>
            </div>

            {heroOpen&&(
              <div className={`section-hero ${heroClosing?'closing':''}`}>
                {SECTION_HERO[searchActive?'search':activeSection]}
              </div>
            )}

            {loading&&(searchActive||releases.length===0)&&(
              <div className="empty-state"><div className="spinner"></div></div>
            )}

            {searchActive&&!loading&&searchResults.length===0&&searchQuery.trim()&&(
              <div className="empty-state"><i className="fas fa-ghost"></i><p>Nada encontrado</p></div>
            )}

            {activeList.length>0&&!loading&&(
              <div className="content-grid" key={activeSection+(searchActive?'-search':'')}>
                {activeList.map(item=>(
                  <MovieCard key={getItemKey(item)} item={item} isFavorite={isFavorite(item)} toggleFavorite={toggleFavorite}/>
                ))}
              </div>
            )}

            {!searchActive&&activeSection==='favorites'&&favorites.length===0&&!loading&&(
              <div className="empty-state"><i className="far fa-folder-open"></i><p>Lista vazia</p></div>
            )}

            <Footer/>
          </main>

          <BottomNav activeSection={activeSection} setActiveSection={setActiveSection} searchActive={searchActive} setSearchActive={setSearchActive} searchQuery={searchQuery} setSearchQuery={handleSearchChange} onSearchSubmit={debouncedSearch} inputRef={searchInputRef}/>
        </>
      )}
    </>
  )
    }
