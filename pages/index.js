import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  const [movieReleases, setMovieReleases] = useState([])
  const [tvReleases, setTvReleases] = useState([])
  const [movieRecommendations, setMovieRecommendations] = useState([])
  const [tvRecommendations, setTvRecommendations] = useState([])
  const [favorites, setFavorites] = useState([])
  const [genres, setGenres] = useState({ movie: [], tv: [] })
  const [featured, setFeatured] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchActive, setSearchActive] = useState(false)
  const [toasts, setToasts] = useState([])
  const [contentType, setContentType] = useState('movies')

  const searchInputRef = useRef(null)
  const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
  const DEFAULT_POSTER = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'
  const AVATAR_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjXIoOgKMtGQH1t2QZCC5JALj9gYs04lfVe8GvavYs_Au7aYQClpmzE60aG3a7nrui2xnTaFwb-VhmiC8zJk2TLavabquj-rHvx_aKVf9un9zMb5g8MxEpLKLpVyyrGWPrcDpTqnkmfU6TSxrTwzqRzLQUXYM6a6kj_lWxWRKBaNk-np2x7Y-IaWFYyD-BuyW5Z3YMigU2Bk8ra4rAYvbaqUXt2e7xwVnOu9M6dz8AfkR5lBI3jqIl_jJBysfcI5uo4-n4bCUiPhYr'

  const getItemKey = (item) => `${item.media_type || 'movie'}-${item.id}`

  const showToast = (message, type = 'info') => {
    const id = Date.now()
    setToasts([{ id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }

  const isFavorite = (item) => favorites.some(f => getItemKey(f) === getItemKey(item))

  const toggleFavorite = (item) => {
    setFavorites(prev => {
      const exists = isFavorite(item)
      const newFavorites = exists
        ? prev.filter(f => getItemKey(f) !== getItemKey(item))
        : [...prev, {
            id: item.id,
            media_type: item.media_type || (contentType === 'movies' ? 'movie' : 'tv'),
            title: item.title || item.name,
            poster_path: item.poster_path,
            backdrop_path: item.backdrop_path,
            genre_ids: item.genre_ids,
            release_date: item.release_date || item.first_air_date
          }]
      localStorage.setItem('yoshikawaFavorites', JSON.stringify(newFavorites))
      showToast(exists ? 'Removed from My List' : 'Added to My List', exists ? 'info' : 'success')
      return newFavorites
    })
  }

  const getGenresString = (item) => {
    if (!item.genre_ids?.length) return ''
    const list = item.media_type === 'movie' ? genres.movie : genres.tv
    return item.genre_ids
      .map(id => list.find(g => g.id === id)?.name)
      .filter(Boolean)
      .slice(0, 3)
      .join(', ') || ''
  }

  const getYear = (item) => {
    const date = item.release_date || item.first_air_date || ''
    return date ? new Date(date).getFullYear() : 'N/A'
  }

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const [movieRes, tvRes] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}&language=en-US`),
          fetch(`https://api.themoviedb.org/3/genre/tv/list?api_key=${TMDB_API_KEY}&language=en-US`)
        ])
        const movieData = await movieRes.json()
        const tvData = await tvRes.json()
        setGenres({ movie: movieData.genres, tv: tvData.genres })
      } catch {}
    }
    loadGenres()
  }, [])

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true)
      try {
        const [nowPlayingRes, onAirRes, popularMovieRes, popularTvRes] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&language=en-US&page=1`),
          fetch(`https://api.themoviedb.org/3/tv/on_the_air?api_key=${TMDB_API_KEY}&language=en-US&page=1`),
          fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`),
          fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`)
        ])

        const nowPlaying = await nowPlayingRes.json()
        const onAir = await onAirRes.json()
        const popularMovie = await popularMovieRes.json()
        const popularTv = await popularTvRes.json()

        setMovieReleases((nowPlaying.results || []).filter(i => i.poster_path).map(i => ({ ...i, media_type: 'movie' })))
        setTvReleases((onAir.results || []).filter(i => i.poster_path).map(i => ({ ...i, media_type: 'tv' })))
        setMovieRecommendations((popularMovie.results || []).filter(i => i.poster_path).map(i => ({ ...i, media_type: 'movie' })))
        setTvRecommendations((popularTv.results || []).filter(i => i.poster_path).map(i => ({ ...i, media_type: 'tv' })))
      } catch {
        showToast('Error loading content', 'error')
      } finally {
        setLoading(false)
      }
    }

    const saved = localStorage.getItem('yoshikawaFavorites')
    if (saved) setFavorites(JSON.parse(saved))

    loadContent()
  }, [])

  const currentReleases = contentType === 'movies' ? movieReleases : tvReleases
  const currentTrending = contentType === 'movies' ? movieRecommendations : tvRecommendations

  useEffect(() => {
    const candidates = [...currentReleases, ...currentTrending].filter(i => i.backdrop_path)
    setFeatured(candidates[0] || [...currentReleases, ...currentTrending][0] || null)
  }, [currentReleases, currentTrending])

  useEffect(() => {
    if (!searchActive) {
      setSearchQuery('')
      setSearchResults([])
    } else if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchActive])

  const fetchSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    setLoading(true)
    try {
      const [movieRes, tvRes] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US`),
        fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US`)
      ])
      const movieData = await movieRes.json()
      const tvData = await tvRes.json()
      const results = [
        ...(movieData.results || []).filter(i => i.poster_path).map(i => ({ ...i, media_type: 'movie' })),
        ...(tvData.results || []).filter(i => i.poster_path).map(i => ({ ...i, media_type: 'tv' }))
      ].sort((a, b) => b.popularity - a.popularity).slice(0, 30)
      setSearchResults(results)
    } catch {
      showToast('Search error', 'error')
    } finally {
      setLoading(false)
    }
  }

  const debouncedSearch = ((fn, delay) => {
    let timer
    return (...args) => {
      clearTimeout(timer)
      timer = setTimeout(() => fn(...args), delay)
    }
  })(fetchSearch, 300)

  const handleSearchChange = (e) => {
    const q = e.target.value
    setSearchQuery(q)
    debouncedSearch(q)
  }

  const HorizontalCard = ({ item }) => {
    const fav = isFavorite(item)
    return (
      <div className="min-w-[140px] w-[140px] flex flex-col gap-2 snap-start">
        <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-sm relative group">
          <Link href={`/${item.media_type}/${item.id}`}>
            <img src={`https://image.tmdb.org/t/p/w500${item.poster_path || DEFAULT_POSTER}`} alt={item.title || item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          </Link>
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
            <div className="size-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-3xl">play_arrow</span>
            </div>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(item) }} className="size-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors">
              <span className={`material-symbols-outlined ${fav ? 'fill-1' : ''}`}>bookmark</span>
            </button>
          </div>
        </div>
        <div>
          <h4 className="font-bold text-sm truncate leading-tight">{item.title || item.name}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{getGenresString(item).split(', ')[0] || 'Genre'}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>StreamHub - Home</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
        <script dangerouslySetInnerHTML={{ __html: `
          tailwind.config = {
            darkMode: "class",
            theme: {
              extend: {
                colors: {
                  primary: "#137fec",
                  "background-light": "#f6f7f8",
                  "background-dark": "#101922",
                  "surface-dark": "#1c2630",
                  "surface-light": "#ffffff"
                },
                fontFamily: { display: ["Plus Jakarta Sans", "sans-serif"] },
                borderRadius: { DEFAULT: "0.25rem", lg: "0.5rem", xl: "0.75rem", full: "9999px" }
              }
            }
          }
        ` }} />
        <style dangerouslySetInnerHTML={{ __html: `
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          @keyframes toast-slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        ` }} />
      </Head>

      <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display antialiased selection:bg-primary selection:text-white pb-24 min-h-screen dark">
        <header className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="bg-center bg-no-repeat bg-cover rounded-full size-10 ring-2 ring-primary/20" style={{ backgroundImage: `url(${AVATAR_URL})` }} />
                <div className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-white dark:border-background-dark" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Welcome back,</p>
                <h2 className="text-base font-bold leading-tight">kawa</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setSearchActive(!searchActive)} className="flex items-center justify-center size-10 rounded-full bg-white dark:bg-surface-dark shadow-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <span className="material-symbols-outlined text-[24px]">{searchActive ? 'close' : 'search'}</span>
              </button>
              <button className="flex items-center justify-center size-10 rounded-full bg-white dark:bg-surface-dark shadow-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative">
                <span className="material-symbols-outlined text-[24px]">notifications</span>
                <span className="absolute top-2 right-2 size-2 bg-primary rounded-full" />
              </button>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-screen">
            <span className="material-symbols-outlined text-6xl animate-spin">progress_activity</span>
            <p className="mt-4 text-lg">Loading...</p>
          </div>
        ) : searchActive ? (
          <section className="px-4 pt-4 pb-20">
            <div className="relative mb-6">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search movies, series..."
                className="w-full py-3 pl-4 pr-12 bg-white dark:bg-surface-dark rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-primary"
              />
              <button onClick={() => setSearchActive(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-2xl text-slate-500">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {loading && <div className="flex justify-center py-10"><span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span></div>}
            {!loading && searchResults.length === 0 && searchQuery && <div className="text-center py-20 text-slate-500">No results found</div>}
            {!loading && searchResults.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {searchResults.map(item => (
                  <div key={getItemKey(item)} className="flex flex-col gap-2 group">
                    <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-sm relative">
                      <Link href={`/${item.media_type}/${item.id}`}>
                        <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt={item.title || item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      </Link>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <div className="size-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                          <span className="material-symbols-outlined text-3xl">play_arrow</span>
                        </div>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(item) }} className="size-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                          <span className={`material-symbols-outlined ${isFavorite(item) ? 'fill-1' : ''}`}>bookmark</span>
                        </button>
                      </div>
                    </div>
                    <h4 className="text-sm font-bold truncate text-center">{item.title || item.name}</h4>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            <section className="px-4 py-4">
              <div className="flex p-1 rounded-xl bg-slate-200 dark:bg-surface-dark">
                <label className="flex-1 relative cursor-pointer">
                  <input type="radio" className="peer sr-only" checked={contentType === 'movies'} onChange={() => setContentType('movies')} />
                  <div className="flex items-center justify-center py-2.5 rounded-lg text-sm font-bold text-slate-500 dark:text-slate-400 transition-all duration-300 peer-checked:bg-white dark:peer-checked:bg-background-dark peer-checked:text-primary peer-checked:shadow-sm">
                    Movies
                  </div>
                </label>
                <label className="flex-1 relative cursor-pointer">
                  <input type="radio" className="peer sr-only" checked={contentType === 'anime'} onChange={() => setContentType('anime')} />
                  <div className="flex items-center justify-center py-2.5 rounded-lg text-sm font-bold text-slate-500 dark:text-slate-400 transition-all duration-300 peer-checked:bg-white dark:peer-checked:bg-background-dark peer-checked:text-primary peer-checked:shadow-sm">
                    Anime
                  </div>
                </label>
              </div>
            </section>

            {featured && (
              <section className="px-4 pb-6">
                <div className="relative w-full aspect-[4/5] sm:aspect-video rounded-2xl overflow-hidden shadow-lg group">
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${featured.backdrop_path})` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col items-start gap-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/20 backdrop-blur-md text-xs font-bold text-white border border-white/10">Featured</span>
                    <h2 className="text-3xl font-extrabold text-white leading-tight drop-shadow-md">{featured.title || featured.name}</h2>
                    <div className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                      {getGenresString(featured).split(', ').map((g, i, a) => (
                        <span key={i}>{g}{i < a.length - 1 && <span className="size-1 bg-slate-400 rounded-full mx-3" />}</span>
                      ))}
                      {getGenresString(featured) && <span className="size-1 bg-slate-400 rounded-full mx-3" />}
                      <span>{getYear(featured)}</span>
                    </div>
                    <div className="flex gap-3 w-full mt-2">
                      <Link href={`/${featured.media_type}/${featured.id}`} className="flex-1 h-12 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                        <span className="material-symbols-outlined fill-1">play_arrow</span> Watch Now
                      </Link>
                      <button onClick={() => toggleFavorite(featured)} className="h-12 w-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl flex items-center justify-center transition-colors border border-white/10">
                        <span className={`material-symbols-outlined ${isFavorite(featured) ? 'fill-1' : ''}`}>bookmark</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="px-4 pb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold tracking-tight">Browse by Genre</h3>
                <button className="text-primary text-sm font-bold hover:underline">View All</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button className="relative h-24 overflow-hidden rounded-xl bg-slate-200 dark:bg-surface-dark group flex items-center px-4 hover:ring-2 hover:ring-primary/50 transition-all">
                  <div className="absolute right-[-10px] bottom-[-10px] opacity-10 dark:opacity-[0.05] group-hover:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined text-[100px] text-slate-900 dark:text-white">swords</span>
                  </div>
                  <div className="flex items-center gap-3 z-10">
                    <div className="size-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">swords</span>
                    </div>
                    <span className="text-lg font-bold">Action</span>
                  </div>
                </button>
                <button className="relative h-24 overflow-hidden rounded-xl bg-slate-200 dark:bg-surface-dark group flex items-center px-4 hover:ring-2 hover:ring-primary/50 transition-all">
                  <div className="absolute right-[-10px] bottom-[-10px] opacity-10 dark:opacity-[0.05] group-hover:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined text-[100px] text-slate-900 dark:text-white">sentiment_very_satisfied</span>
                  </div>
                  <div className="flex items-center gap-3 z-10">
                    <div className="size-10 rounded-full bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center text-orange-500">
                      <span className="material-symbols-outlined">sentiment_very_satisfied</span>
                    </div>
                    <span className="text-lg font-bold">Comedy</span>
                  </div>
                </button>
                <button className="relative h-24 overflow-hidden rounded-xl bg-slate-200 dark:bg-surface-dark group flex items-center px-4 hover:ring-2 hover:ring-primary/50 transition-all">
                  <div className="absolute right-[-10px] bottom-[-10px] opacity-10 dark:opacity-[0.05] group-hover:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined text-[100px] text-slate-900 dark:text-white">favorite</span>
                  </div>
                  <div className="flex items-center gap-3 z-10">
                    <div className="size-10 rounded-full bg-pink-500/10 dark:bg-pink-500/20 flex items-center justify-center text-pink-500">
                      <span className="material-symbols-outlined">favorite</span>
                    </div>
                    <span className="text-lg font-bold">Romance</span>
                  </div>
                </button>
                <button className="relative h-24 overflow-hidden rounded-xl bg-slate-200 dark:bg-surface-dark group flex items-center px-4 hover:ring-2 hover:ring-primary/50 transition-all">
                  <div className="absolute right-[-10px] bottom-[-10px] opacity-10 dark:opacity-[0.05] group-hover:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined text-[100px] text-slate-900 dark:text-white">rocket_launch</span>
                  </div>
                  <div className="flex items-center gap-3 z-10">
                    <div className="size-10 rounded-full bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center text-purple-500">
                      <span className="material-symbols-outlined">rocket_launch</span>
                    </div>
                    <span className="text-lg font-bold">Sci-Fi</span>
                  </div>
                </button>
              </div>
            </section>

            {favorites.length > 0 && (
              <section className="pb-8 pl-4">
                <h3 className="text-xl font-bold tracking-tight mb-4 pr-4">My List</h3>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 pr-4 snap-x snap-mandatory">
                  {favorites.map(item => <HorizontalCard key={getItemKey(item)} item={item} />)}
                </div>
              </section>
            )}

            <section className="pb-8 pl-4">
              <h3 className="text-xl font-bold tracking-tight mb-4 pr-4">Trending Now</h3>
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 pr-4 snap-x snap-mandatory">
                {currentTrending.slice(0, 20).map(item => <HorizontalCard key={getItemKey(item)} item={item} />)}
              </div>
            </section>

            <section className="pb-8 pl-4">
              <h3 className="text-xl font-bold tracking-tight mb-4 pr-4">New Releases</h3>
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 pr-4 snap-x snap-mandatory">
                {currentReleases.slice(0, 20).map((item, idx) => (
                  <div key={getItemKey(item)} className="relative">
                    {idx < 2 && <span className="absolute top-2 left-2 z-10 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded">NEW</span>}
                    <HorizontalCard item={item} />
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-background-dark/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-50 pb-[env(safe-area-inset-bottom)]">
          <div className="flex justify-around items-center h-16 px-2 max-w-lg mx-auto">
            <a href="#" className="flex flex-col items-center justify-center w-full h-full gap-1 text-primary group">
              <span className="material-symbols-outlined text-[28px] group-hover:scale-110 transition-transform">home</span>
              <span className="text-[10px] font-medium">Home</span>
            </a>
            <a href="#" className="flex flex-col items-center justify-center w-full h-full gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 group">
              <span className="material-symbols-outlined text-[28px] group-hover:scale-110 transition-transform">explore</span>
              <span className="text-[10px] font-medium">Explore</span>
            </a>
            <a href="#" className="flex flex-col items-center justify-center w-full h-full gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 group">
              <span className="material-symbols-outlined text-[28px] group-hover:scale-110 transition-transform">download_for_offline</span>
              <span className="text-[10px] font-medium">Downloads</span>
            </a>
            <a href="#" className="flex flex-col items-center justify-center w-full h-full gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 group">
              <span className="material-symbols-outlined text-[28px] group-hover:scale-110 transition-transform">person</span>
              <span className="text-[10px] font-medium">Profile</span>
            </a>
          </div>
        </nav>

        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
          {toasts.map(toast => (
            <div key={toast.id} className="px-5 py-3 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md rounded-xl shadow-lg flex items-center gap-3 animate-toast-slide-up">
              <div className={`size-8 rounded-full flex items-center justify-center text-white ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-primary'}`}>
                <span className="material-symbols-outlined text-xl">{toast.type === 'success' ? 'check' : toast.type === 'error' ? 'error' : 'info'}</span>
              </div>
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
  }
