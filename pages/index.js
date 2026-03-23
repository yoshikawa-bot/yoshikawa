import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'

const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287'
const DEFAULT_POSTER = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'
const DEFAULT_BACKDROP = 'https://yoshikawa-bot.github.io/cache/images/14c34900.jpg'

const SECTION_TITLES = {
  releases: 'Lan\u00e7amentos',
  recommendations: 'Populares',
  favorites: 'Favoritos'
}

const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null)
  return useCallback((...args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => callback(...args), delay)
  }, [callback, delay])
}

const getItemKey = (item) => `${item.media_type}-${item.id}`

export const WelcomeScreen = ({ onEnter }) => {
  const [closing, setClosing] = useState(false)

  const handleEnter = () => {
    setClosing(true)
    setTimeout(onEnter, 600)
  }

  return (
    <div className={`welcome-overlay ${closing ? 'closing' : ''}`}>
      <div className={`welcome-card glass-panel ${closing ? 'closing' : ''}`}>
        <div className="welcome-logo-wrap">
          <div className="welcome
