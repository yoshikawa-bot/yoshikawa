:root {
  /* CORES PRINCIPAIS */
  --primary: #ff6b6b; /* Cor de destaque principal */
  --primary-dark: #e05555; /* Cor mais escura para hover */
  --secondary: #94a3b8; /* Cor secundária */
  --accent: #4dabf7; /* Cor para elementos clicáveis secundários */
  --accent-dark: #339af0; /* Cor mais escura para hover de elementos secundários */
  
  --dark: #f1f5f9;
  --light: #0f172a;
  --border: rgba(255, 255, 255, 0.15);
  --card-bg: rgba(0, 0, 0, 0.25);
  --text: #f1f5f9;
  --bg: transparent;
  --header-bg: rgba(0, 0, 0, 0.25);
  --header-border: rgba(255, 255, 255, 0.15);
  --header-text: #f0f6fc;
  --success: #10b981;
  --error: #ef4444;
  --overlay-bg: rgba(0, 0, 0, 0.5);
  --highlight: rgba(255, 255, 255, 0.15);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', Arial, sans-serif;
  background: url('https://yoshikawa-bot.github.io/cache/images/ea6ceee5.jpg') no-repeat center/cover fixed;
  color: var(--text);
  line-height: 1.6;
  font-size: 16px;
  min-height: 100vh;
  position: relative;
  /* ROLAGEM PERMITIDA */
  overflow-y: auto; 
}

body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  min-height: 100vh;
  height: auto;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: -1;
}

/* Efeito de vidro base */
.glass-filter {
  backdrop-filter: blur(10px);
  filter: saturate(120%) brightness(1.15);
}

.glass-overlay {
  background: var(--card-bg);
}

.glass-specular {
  box-shadow: inset 1px 1px 1px var(--highlight);
}

/* Animação para o botão de Favoritar */
@keyframes heart-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

/* Animação para o ícone do Menu Toggle */
.favorite-btn i {
  transition: transform 0.3s ease;
}

/* Estado do menu aberto para animar o ícone */
#headerFavoriteBtn.menu-open i {
  transform: rotate(45deg);
}

/* Cabeçalho - CORRIGIDO */
.github-header {
  background-color: transparent;
  border-bottom: 1px solid var(--header-border);
  padding: 0.75rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.github-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(10px);
  filter: saturate(120%) brightness(1.15);
  z-index: -1;
}

.github-header::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--header-bg);
  z-index: -1;
}

.header-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  position: relative;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
  cursor: pointer;
  text-decoration: none;
}

.logo-image {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
  transition: all 0.3s;
}

.logo-image:hover {
  transform: scale(1.05);
}

.logo-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--header-text);
}

.beta-tag {
  background: var(--primary);
  color: white;
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* BARRA DE BUSCA MELHORADA - Design de vidro */
.search-container {
  position: relative;
  max-width: 400px;
  width: 100%;
  display: none; /* Escondida pois a busca foi movida para o contêiner flutuante */
}

/* BOTÃO DE FAVORITOS NO HEADER - CORRIGIDO */
#headerFavoriteBtn {
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  background: transparent; /* Transparente para usar o blur do header */
  border: 1px solid var(--border);
  color: var(--text);
  backdrop-filter: blur(10px);
  flex-shrink: 0;
}

#headerFavoriteBtn:hover {
  background: var(--primary);
  transform: scale(1.05);
  border-color: var(--primary);
}

#headerFavoriteBtn.active {
  background: var(--primary);
  border-color: var(--primary);
}

/* Menu de Favoritos - CORRIGIDO */
.favorites-menu {
  position: fixed;
  top: 0;
  right: -50%;
  width: 50%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(15px);
  z-index: 1000;
  transition: right 0.4s cubic-bezier(0.785, 0.135, 0.15, 0.86);
  display: flex;
  flex-direction: column;
  box-shadow: -5px 0 25px rgba(0, 0, 0, 0.4);
  overflow-y: auto;
}

.favorites-menu.open {
  right: 0;
}

.favorites-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  position: relative;
}

.favorites-header::before {
  content: '';
  position: absolute;
  inset: 0;
  backdrop-filter: blur(15px);
  z-index: -1;
}

.favorites-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.favorites-title i {
  color: var(--primary);
}

/* Botão de fechar - CORRIGIDO para X */
#closeFavoritesMenu {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text);
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  flex-shrink: 0;
}

#closeFavoritesMenu:hover {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
  transform: scale(1.05);
}

.favorites-actions {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
  background: rgba(0, 0, 0, 0.2);
}

.favorites-action-btn {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border);
  border-radius: 25px;
  padding: 0.6rem 1rem;
  color: var(--text);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  backdrop-filter: blur(10px);
}

.favorites-action-btn:hover {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.favorites-list {
  padding: 1rem;
  flex: 1;
  overflow-y: auto;
  background: transparent;
}

.favorite-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-radius: 15px;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(10px);
  position: relative;
}

.favorite-item:hover {
  background-color: rgba(255, 107, 107, 0.15);
  border-color: var(--primary);
  transform: translateX(5px);
}

.favorite-poster {
  width: 50px;
  height: 70px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 1rem;
  flex-shrink: 0;
}

.favorite-info {
  flex: 1;
}

.favorite-title {
  font-weight: 500;
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
  color: var(--text);
}

.favorite-meta {
  font-size: 0.8rem;
  color: var(--secondary);
}

.remove-favorite {
  background: none;
  border: none;
  color: var(--error);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.3s ease;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-favorite:hover {
  background-color: rgba(239, 68, 68, 0.15);
  transform: scale(1.1);
}

#closeFavoritesMenu {
   transition: all 0.3s ease;
}

#closeFavoritesMenu:hover {
  color: var(--primary);
}

.no-favorites {
  padding: 3rem 1rem;
  text-align: center;
  color: var(--secondary);
}

/* Overlay para fechar o menu */
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: none;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.menu-overlay.active {
  display: block;
  opacity: 1;
}

/* Container Principal - CORRIGIDO */
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 1.5rem;
  min-height: calc(100vh - 80px);
  /* REMOVIDO: display: flex e propriedades que quebravam o player */
}

/* Player - CORRIGIDO */
.player-wrapper {
  position: relative;
  padding-bottom: 56.25%; /* Mantém proporção 16:9 */
  height: 0;
  overflow: hidden;
  border-radius: 15px;
  margin-bottom: 2rem;
  background-color: #000;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  width: 100%; /* Garante que ocupe toda a largura disponível */
}

.player-wrapper iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 15px;
}

/* Botão de Favoritar na página de exibição - NOVA POSIÇÃO */
.player-favorite-btn {
  position: fixed;
  bottom: 7rem;
  right: 2rem;
  background-color: var(--card-bg);
  color: var(--text);
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  cursor: pointer;
  display: none;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  z-index: 90;
  border: 1px solid var(--border);
  backdrop-filter: blur(10px);
}

.player-favorite-btn:hover {
  background: var(--primary);
  color: white;
  transform: scale(1.1);
  border-color: var(--primary);
}

/* BOTÃO DE FAVORITAR SÓ COLORIDO SE ESTIVER FAVORITADO */
.player-favorite-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

/* Aplica animação ao ser ativado (favoritado) */
.player-favorite-btn.active i {
  animation: heart-pop 0.5s; 
}

/* Controles de Navegação */
.navigation-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.nav-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--primary);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  flex: 1;
  min-width: 150px;
  justify-content: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  text-decoration: none;
  position: relative;
  overflow: hidden;
}

.nav-button::before {
  content: '';
  position: absolute;
  inset: 0;
  backdrop-filter: blur(10px);
  z-index: -1;
}

.nav-button:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-3px);
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.3);
}

.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.nav-button.secondary {
  background-color: var(--card-bg);
  border: 1px solid var(--border);
  color: var(--text);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-button.secondary:hover:not(:disabled) {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

/* Informações do Conteúdo - FUNDO RESTAURADO COMO ERA ANTES */
.content-info {
  background-color: var(--card-bg);
  padding: 1.5rem;
  border-radius: 15px;
  margin-bottom: 2rem;
  border-left: 4px solid var(--primary);
  transition: border-left-color 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.content-info::before {
  content: '';
  position: absolute;
  inset: 0;
  backdrop-filter: blur(10px);
  z-index: -1;
}

.content-title {
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text);
}

.content-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  color: var(--secondary);
  font-size: 0.9rem;
}

.content-meta span {
  transition: color 0.3s ease;
}

.content-description {
  color: var(--text);
  line-height: 1.6;
}

/* Seletor de Episódios - Melhorado para Mobile */
.episode-selector {
  display: none;
  gap: 1rem;
  margin: 1rem 0;
  align-items: center;
  flex-wrap: wrap;
}

.episode-selector.active {
  display: flex;
}

.selector-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.selector-label {
  color: var(--secondary);
  font-size: 0.9rem;
}

.selector-select {
  background-color: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 25px;
  padding: 0.5rem;
  color: var(--text);
  min-width: 120px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.selector-select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.4);
}

/* Seções da Home */
.home-sections {
  display: block;
  width: 100%;
  max-width: 1280px;
  margin: auto; 
  padding-bottom: 7rem; 
}

.home-sections.hidden {
  display: none;
}

.section {
  margin-bottom: 2rem;
}

/* NOVO: Título da Página com Ícone - TAMANHO REDUZIDO */
.page-title-home {
    font-size: 1.6rem; /* REDUZIDO de 2rem */
    font-weight: 700;
    color: var(--text);
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding-top: 1rem;
}

.page-title-home i {
    font-size: 2rem; /* REDUZIDO de 2.5rem */
    color: var(--primary); /* Cor do ícone */
}
/* FIM NOVO: Título da Página com Ícone */

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border);
}

.section-title {
  font-size: 1.4rem;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-title i {
  color: var(--primary);
  font-size: 1.2rem;
}

/* Grid de Conteúdo Horizontal - AGORA É UM GRID REAL */
.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); /* Ajusta para mobile e desktop */
  gap: 1.5rem; /* Aumenta o espaçamento */
  justify-content: center; /* Centraliza os cards */
  padding: 0.5rem 0;
}

.content-row {
  /* REMOVIDO: propriedades de rolagem horizontal */
  display: contents; /* Usado para manter os cards no grid principal */
}

/* BARRA DE ROLAGEM HORIZONTAL - ESTILIZADA - REMOVIDO pois agora é grid vertical */

/* ************************************************* */
/* ALTERAÇÕES APLICADAS AQUI PARA O CARD DO CONTEÚDO */
/* ************************************************* */

.content-card {
  background-color: var(--card-bg); /* Voltou ao original */
  border-radius: 15px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid var(--border);
  flex: none; /* REMOVIDO: flex: 0 0 160px; - Deixando o grid controlar o tamanho */
  position: relative;
  text-decoration: none;
  color: inherit;
  backdrop-filter: blur(10px);
}

.content-card:hover {
  transform: translateY(-5px);
  border-color: var(--primary);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
}

.content-poster {
  width: 100%;
  height: 240px;
  object-fit: cover;
  display: block; 
}

/* Reverter .content-info-card para a posição original, abaixo da imagem */
.content-info-card {
  padding: 0; /* Padding zero, pois o texto flutuará sobre a imagem */
  background: transparent; /* Fundo transparente */
  position: static; /* Voltar à posição normal */
  color: inherit;
  backdrop-filter: none;
  border: none;
  height: 0; /* Ocupa altura zero para não estragar a proporção do card */
}

.content-title-card {
  font-weight: 500;
  font-size: 0.9rem;
  /* Estas propriedades foram movidas para o .floating-text-wrapper e seus filhos */
}

.content-year {
  font-size: 0.8rem;
  color: var(--secondary);
  /* Estas propriedades foram movidas para o .floating-text-wrapper e seus filhos */
}

/* NOVO: Container para o texto flutuante */
/* Este é o elemento que simula o design da imagem fornecida */
.floating-text-wrapper {
    position: absolute; /* Posição absoluta sobre a imagem */
    bottom: 10px;       /* ALTERADO: Distância do fundo */
    left: 10px;         /* Distância da esquerda */
    right: 10px;        /* Garante que o texto se ajuste à largura do card */
    z-index: 5;
    color: white;       /* Texto branco */
    line-height: 1.2;
    font-size: 0.95rem;
}

/* Estilo para o Título */
.floating-text-wrapper .content-title-card {
    /* Exatamente como você pediu: fundo preto sólido apenas atrás do texto */
    display: block; /* Garante que o bloco flutuante respeite a quebra */
    padding: 4px 7px; /* Padding ao redor do texto */
    background-color: rgba(0, 0, 0, 0.85); /* Fundo preto sólido semi-transparente */
    box-decoration-break: clone; /* Aplica o background em cada linha quebrada */
    -webkit-box-decoration-break: clone;
    font-weight: 600;
    font-size: 1rem;
    white-space: normal;
    width: fit-content; /* Ajusta a largura ao texto */
    border-radius: 4px; /* Pequeno arredondamento */
    text-shadow: none;
}

/* Estilo para o Ano (e Rating, se houver) */
.floating-text-wrapper .content-year {
    display: block; /* Garante que o bloco flutuante respeite a quebra */
    padding: 4px 7px; /* Padding ao redor do texto */
    background-color: rgba(0, 0, 0, 0.85); /* Fundo preto sólido semi-transparente */
    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
    font-size: 0.85rem;
    color: white; 
    opacity: 0.9;
    font-weight: 500;
    margin-top: 3px; /* Espaçamento entre Título e Ano */
    width: fit-content; /* Ajusta a largura ao texto */
    border-radius: 4px; /* Pequeno arredondamento */
    text-shadow: none;
}

/* Estilo para a classificação por estrelas - Mantido, caso queira adicionar depois */
.content-rating {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    color: gold; /* Cor das estrelas */
    font-weight: 500;
}

.content-rating i {
    font-size: 0.8rem;
    color: gold;
}
/* FIM DAS ALTERAÇÕES NO CARD */

/* ************************************************* */

/* BOTÃO DE FAVORITAR NOS CARDS - Só colorido se estiver favoritado */
.favorite-btn {
  position: absolute;
  top: auto; /* Removido o top, usaremos o bottom */
  bottom: 8px; /* ALTERADO: Distância do fundo */
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  color: white;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
  z-index: 10;
  backdrop-filter: blur(5px);
}

.favorite-btn:not(#headerFavoriteBtn):hover {
  background: rgba(255, 107, 107, 0.9);
  transform: scale(1.1);
}

/* SÓ FICA COLORIDO SE ESTIVER FAVORITADO */
.favorite-btn.active:not(#headerFavoriteBtn) {
  background: var(--primary);
  color: white;
}

/* Aplica animação ao ser ativado (favoritado) */
.favorite-btn.active:not(#headerFavoriteBtn) i {
  animation: heart-pop 0.5s; 
}

/* Resultados da Busca - Antigas classes removidas, agora usa .content-grid */
.search-results-section {
    display: block; /* Sempre visível para usar a estrutura da home */
}

/* Remover estilos de lista da busca anterior */
.search-list, .search-list-item, .search-list-poster, .search-list-info, .search-list-title, .search-list-meta, .search-list-overview {
    /* Estas classes não são mais usadas, os resultados usam ContentGrid */
    display: contents; 
}

/* Botão Voltar para Home */
.back-to-home {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  cursor: pointer;
  display: none;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  z-index: 90;
  text-decoration: none;
  backdrop-filter: blur(10px);
}

.back-to-home:hover {
  background: var(--primary-dark);
  transform: scale(1.1) rotate(5deg);
}

/* Estados de Carregamento e Erro */
.loading {
  display: none;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  color: var(--secondary);
  flex-direction: column;
}

.loading.active {
  display: flex;
}

.spinner {
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top: 3px solid var(--primary);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  display: none;
  background-color: var(--card-bg);
  padding: 1.5rem;
  border-radius: 15px;
  border-left: 4px solid var(--error);
  margin-bottom: 2rem;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.error-message::before {
  content: '';
  position: absolute;
  inset: 0;
  backdrop-filter: blur(10px);
  z-index: -1;
}

.error-message.active {
  display: block;
}

.error-message h3 {
  color: var(--error);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

/* Footer REMOVIDO */
footer {
  display: none;
}


/* ********************************************************* */
/* NOVO: Container Flutuante de Navegação e Busca com Transição */
/* ********************************************************* */

/* Container geral que irá se expandir/retrair */
.bottom-nav-search-container {
  position: fixed;
  bottom: 25px; 
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  max-width: 90%; /* Máximo em modo de navegação */
  width: fit-content;
  gap: 15px; 
  z-index: 100;
  transition: max-width 0.4s ease, width 0.4s ease, transform 0.4s ease;
}

/* Estado de PESQUISA: Ocupa a largura máxima e esconde a barra de navegação */
.bottom-nav-search-container.searching {
    max-width: 600px;
    width: 90%;
    /* O gap será controlado por flexbox no interior */
}

/* Barra de Navegação (Ícones) */
.main-nav-bar {
  /* Efeito idêntico ao cabeçalho (github-header) */
  background-color: transparent;
  border: 2px solid var(--header-border); 
  border-radius: 40px; 
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5); 
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 70px; 
  flex-grow: 1;
  overflow: hidden;
  padding: 0 10px; 
  position: relative;
  transition: all 0.4s ease; /* Transição para esconder/mostrar */
  opacity: 1;
  visibility: visible;
  flex-shrink: 1;
  min-width: 200px; /* Largura mínima para os 3 ícones */
}

.main-nav-bar::before, .main-nav-bar::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    backdrop-filter: blur(10px); 
    filter: saturate(120%) brightness(1.15); 
    z-index: -1;
    border-radius: 40px;
}

.main-nav-bar::after {
    background: var(--header-bg); 
}

/* ESCONDENDO A BARRA DE NAVEGAÇÃO NO MODO PESQUISANDO */
.bottom-nav-search-container.searching .main-nav-bar {
    opacity: 0;
    visibility: hidden;
    flex-grow: 0; /* Não ocupa mais espaço */
    min-width: 0;
    width: 0; /* Ocupa 0 de largura */
    padding: 0;
    margin-right: -15px; /* Compensa o gap para o circle */
}

/* Itens de Navegação (Ícones) */
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--secondary);
  font-size: 12px; 
  font-weight: 500;
  padding: 5px 0;
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
  background: none;
  position: relative;
  height: 100%; 
  justify-content: center; 
}

/* NOVO: Oculta o título (span) e anula seu espaço */
.nav-item span {
  display: none; 
}

/* NOVO: Define a cor BRANCA (var(--text)) para o ícone por padrão (não ativo) */
.nav-item i {
  font-size: 26px; 
  margin-bottom: 0; 
  transition: color 0.3s ease, transform 0.3s ease;
  color: var(--text); /* Ícone BRANCO quando não ativo/hover */
}

.nav-item:hover i {
    transform: scale(1.1);
    color: var(--primary); /* Cor primária no hover */
}

/* ATUALIZADO: ÍCONE COLORIDO QUANDO ATIVO */
.nav-item.active {
  color: initial; 
}

.nav-item.active i {
  color: var(--primary); /* Ícone primário quando ativo */
  transform: none; 
}

/* Ícone de Lupa Separado (Permanece sempre visível) */
.search-circle {
  /* Efeito idêntico ao cabeçalho (github-header) */
  background-color: transparent;
  border: 2px solid var(--header-border); 
  backdrop-filter: blur(10px); 
  filter: saturate(120%) brightness(1.15); 
  border-radius: 50%;
  width: 70px; 
  height: 70px; 
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5); 
  flex-shrink: 0;
  cursor: pointer;
  color: var(--text); /* ALTERADO para branco */
  transition: all 0.4s ease; /* Transição para rotação/cor */
  position: relative;
  z-index: 2; /* Garante que fique acima da barra de pesquisa */
}

.search-circle::after {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--header-bg);
    border-radius: 50%;
    z-index: -1;
    transition: all 0.4s ease;
}

.search-circle:hover {
  background-color: var(--primary);
  color: var(--text);
  border-color: var(--primary);
}

.search-circle i {
  font-size: 32px; 
  z-index: 1;
  transition: all 0.4s ease;
}

/* Rotação e Cor da Lupa no modo de pesquisa */
.bottom-nav-search-container.searching .search-circle {
    transform: rotate(360deg);
    background-color: var(--primary); /* Destaca a lupa quando a barra de pesquisa está ativa */
    border-color: var(--primary);
}

.bottom-nav-search-container.searching .search-circle i {
    color: var(--text); 
}

/* Barra de Pesquisa Flutuante (Nova) */
.floating-search-bar {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    /* Começa ESCONDIDA */
    left: 70px; /* Alinhado à esquerda da lupa (70px de largura da lupa) */
    width: calc(100% - 70px - 15px); /* Largura total - largura da lupa - gap */
    opacity: 0;
    visibility: hidden;
    transition: all 0.4s ease;
    z-index: 1; /* Abaixo da lupa */
    height: 70px; /* Altura igual à lupa */
}

/* MODO PESQUISA: A barra de pesquisa se move para a esquerda (ficando VISÍVEL) */
.bottom-nav-search-container.searching .floating-search-bar {
    left: 0; /* Move para a esquerda do contêiner */
    opacity: 1;
    visibility: visible;
    width: calc(100% - 70px - 15px);
}

.floating-search-form {
    display: flex;
    align-items: center;
    position: relative;
    height: 100%;
    /* Efeito de vidro para a barra de pesquisa */
    background-color: transparent;
    border: 2px solid var(--header-border); 
    border-radius: 40px; 
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5); 
    overflow: hidden;
}

.floating-search-form::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    backdrop-filter: blur(10px); 
    filter: saturate(120%) brightness(1.15); 
    z-index: -1;
    border-radius: 40px;
}

.floating-search-form::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--header-bg); 
    border-radius: 40px;
    z-index: -1;
}

.floating-search-input {
    background: transparent;
    border: none;
    padding: 0 1rem;
    font-size: 1.1rem;
    color: var(--text); /* Texto branco */
    flex-grow: 1;
    height: 100%;
    min-width: 0; /* Permite o encolhimento */
}

.floating-search-input::placeholder {
    color: var(--text); /* Placeholder branco */
    opacity: 0.8; 
}

.floating-search-input:focus {
    outline: none;
}

/* Botão de Enviar (Lupa dentro da barra) - Ícone menor, alinhado à direita */
.floating-search-button {
    background: transparent;
    border: none;
    color: var(--secondary);
    cursor: pointer;
    transition: all 0.3s ease;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-right: 5px; /* Espaçamento com o botão fechar */
}

.floating-search-button:hover {
    color: var(--primary);
    transform: scale(1.1);
}

/* Botão de Fechar (X) - Ícone menor, alinhado à direita */
.floating-search-close {
    background: transparent;
    border: none;
    color: var(--secondary);
    cursor: pointer;
    transition: all 0.3s ease;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-right: 15px; /* Alinhamento final */
}

.floating-search-close:hover {
    color: var(--error);
    transform: scale(1.1);
}


/* Responsividade para o container flutuante */
@media (max-width: 768px) {
  .bottom-nav-search-container {
    bottom: 20px; 
    max-width: 95%; 
    gap: 10px;
  }
  
  .main-nav-bar {
    height: 65px; 
    border-radius: 35px;
    border: 1px solid var(--header-border); 
  }
  
  .main-nav-bar::before, .main-nav-bar::after {
      border-radius: 35px;
  }
  
  .nav-item {
    font-size: 11px;
  }
  
  .nav-item i {
    font-size: 24px;
  }
  
  .search-circle {
    width: 65px; 
    height: 65px; 
    border: 1px solid var(--header-border); 
  }
  
  .search-circle i {
    font-size: 28px;
  }
  
  /* Ajuste para a barra de pesquisa no modo mobile */
  .floating-search-bar {
      left: 65px; /* Largura da lupa (65px) */
      width: calc(100% - 65px - 10px); /* Largura total - largura da lupa - gap */
      height: 65px;
  }
  
  .bottom-nav-search-container.searching .floating-search-bar {
      width: calc(100% - 65px - 10px);
  }
  
  .floating-search-input {
      font-size: 1rem;
      padding: 0 0.8rem;
  }
  
  .floating-search-button, .floating-search-close {
      width: 35px;
      height: 35px;
  }
  
  .floating-search-close {
      margin-right: 10px;
  }

  .floating-search-form {
      border-radius: 35px;
      border: 1px solid var(--header-border); 
  }
  
  .floating-search-form::before, .floating-search-form::after {
      border-radius: 35px;
  }
  
  .container {
    padding: 1rem;
    min-height: calc(100vh - 80px); 
  }
  
  .home-sections {
    padding-bottom: 6rem; 
  }

  .content-card {
    /* Ajuste para grids mobile */
    min-width: 140px; 
    max-width: 100%;
  }

  .content-poster {
    height: 210px;
  }
}

@media (max-width: 480px) {
  .logo-name {
    font-size: 1rem;
  }
  
  .content-title {
    font-size: 1.4rem;
  }
  
  .content-grid {
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 1rem;
  }
  
  .content-card {
    min-width: 120px;
  }

  .content-poster {
    height: 180px;
  }
  
  /* Ajuste no card para telas muito pequenas */
  .floating-text-wrapper {
      font-size: 0.8rem;
  }

  .floating-text-wrapper .content-title-card {
      font-size: 0.9rem;
  }

  .floating-text-wrapper .content-year {
      font-size: 0.75rem;
  }
  
  .floating-search-input {
      font-size: 0.9rem;
  }
}

/* Responsividade - Melhorias para Mobile */
@media (max-width: 768px) {
  .header-content {
    padding: 0 1rem;
    flex-wrap: wrap;
  }

  .search-container {
    order: 3;
    max-width: 100%;
    margin-top: 0.5rem;
  }

  .navigation-controls {
    flex-direction: column;
  }

  .nav-button {
    min-width: auto;
  }

  .back-to-home {
    bottom: 1rem;
    right: 1rem;
  }

  .player-favorite-btn {
    bottom: 6rem;
    right: 1rem;
  }

  /* Menu de favoritos responsivo */
  .favorites-menu {
    width: 85%;
    right: -85%;
  }

  .favorites-action-btn {
    min-width: 100px;
    font-size: 0.8rem;
    padding: 0.5rem 0.8rem;
  }

  /* Seletor de episódios otimizado para mobile */
  .episode-selector {
    flex-direction: column;
    align-items: stretch;
  }

  .selector-group {
    justify-content: space-between;
  }

  .selector-select {
    min-width: 100px;
    width: 100%;
  }

  .selector-label {
    min-width: 80px;
  }
}

@media (max-width: 480px) {
  .logo-name {
    font-size: 1rem;
  }
  
  .content-title {
    font-size: 1.4rem;
  }
  
  .favorites-menu {
    width: 90%;
    right: -90%;
  }
}

/* Estilos adicionais para o Next.js */
a {
  color: inherit;
  text-decoration: none;
}

button {
  font-family: inherit;
}

select {
  font-family: inherit;
}

/* Garantir que as imagens sejam responsivas */
img {
  max-width: 100%;
  height: auto;
}

/* Melhorar a acessibilidade */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
