import Head from 'next/head'; // Importação necessária para gerenciar o cabeçalho da página
import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        {/* CORREÇÃO PARA OS ÍCONES: Link do CDN do Font Awesome (versão 6.5.2) */}
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" 
          integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLMDJd44dJ9I/y7LndS5lY0xL2k4l9B5O3bQJjI+Y8tG3tB4uL8Y6dC6cWd9q5eA==" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer" 
        />
      </Head>
      <Component {...pageProps} />
    </>
  )
}
