export default async function handler(req, res) {
  const { id, type, s, e } = req.query

  if (!id || !type) {
    res.status(400).send('Missing params')
    return
  }

  const DOMAINS = [
    'https://superflixapi.fit',
    'https://superflixapi.rest',
    'https://superflixapi.best',
    'https://superflixapi.online',
  ]

  const buildPath = (base) => {
    if (type === 'movie') return `${base}/filme/${id}`
    if (type === 'tv') return `${base}/serie/${id}/${s || 1}/${e || 1}`
    return null
  }

  let html = null
  let usedBase = DOMAINS[0]

  for (const base of DOMAINS) {
    const url = buildPath(base)
    if (!url) break
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          'Referer': base,
        },
        signal: AbortSignal.timeout(8000),
      })
      if (response.ok) {
        html = await response.text()
        usedBase = base
        break
      }
    } catch {}
  }

  if (!html) {
    res.status(502).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { margin: 0; background: #101010; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: Inter, sans-serif; color: #888; flex-direction: column; gap: 12px; }
            p { font-size: 14px; text-align: center; margin: 0; }
          </style>
        </head>
        <body>
          <p>Conteúdo indisponível no momento.</p>
          <p style="font-size:12px;color:#555">Tente novamente em alguns instantes.</p>
        </body>
      </html>
    `)
    return
  }

  html = html.replace(/<head>/i, `<head>
    <base href="${usedBase}/">
    <style>
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: #000; overflow: hidden; }
    </style>
  `)

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self'")
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).send(html)
}
