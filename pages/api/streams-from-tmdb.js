import axios from 'axios';

const TMDB_API_KEY = '66223dd3ad2885cf1129b181c7826287';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const { tmdbId, type, season, episode } = req.query;
  
  if (!tmdbId || !type) {
    return res.status(400).json({ error: 'Faltam parâmetros: tmdbId e type' });
  }
  
  try {
    // 1. Pega IMDb ID do TMDb
    const tmdbEndpoint = type === 'movie' 
      ? `https://api.themoviedb.org/3/movie/${tmdbId}/external_ids`
      : `https://api.themoviedb.org/3/tv/${tmdbId}/external_ids`;
    
    const tmdbResponse = await axios.get(tmdbEndpoint, {
      params: { api_key: TMDB_API_KEY }
    });
    
    const imdbId = tmdbResponse.data.imdb_id;
    
    if (!imdbId) {
      return res.status(404).json({ error: 'IMDb ID não encontrado para este conteúdo' });
    }
    
    // 2. Monta o ID completo para Torrentio
    let fullId = imdbId;
    if (type === 'tv' && season && episode) {
      fullId = `${imdbId}:${season}:${episode}`;
    }
    
    // 3. Busca streams no Torrentio
    const torrentioType = type === 'tv' ? 'series' : 'movie';
    const torrentioUrl = `https://torrentio.strem.fun/stream/${torrentioType}/${fullId}.json`;
    
    const torrentioResponse = await axios.get(torrentioUrl);
    const streams = torrentioResponse.data.streams || [];
    
    // 4. Filtra português/dual áudio
    const ptStreams = streams.filter(s => {
      const title = s.title?.toLowerCase() || '';
      const name = s.name?.toLowerCase() || '';
      
      return (
        title.includes('dual') ||
        title.includes('dublado') ||
        title.includes('português') ||
        title.includes('pt-br') ||
        title.includes('pt br') ||
        title.includes('legendado') ||
        name.includes('🇵🇹') ||
        name.includes('🇧🇷')
      );
    });
    
    // 5. Retorna resultados
    res.status(200).json({
      success: true,
      imdbId,
      tmdbId,
      portuguese: ptStreams.slice(0, 10),
      all: streams.slice(0, 15)
    });
    
  } catch (error) {
    console.error('Erro ao processar:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar streams',
      details: error.message 
    });
  }
  }
