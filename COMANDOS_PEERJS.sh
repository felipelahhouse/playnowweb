# ==========================================
# 🚀 COMANDOS RÁPIDOS - SISTEMA PEERJS
# ==========================================

# ✅ PASSO 1: TESTAR LOCALMENTE
# ==========================================

# Navegar para a pasta
cd peerjs-multiplayer

# Instalar dependências
npm install

# Iniciar servidor
npm start

# Abrir navegador em:
# http://localhost:9000/lobby.html


# ✅ PASSO 2: FAZER DEPLOY NO RENDER.COM
# ==========================================

# 1. Inicializar Git na pasta
cd peerjs-multiplayer
git init
git add .
git commit -m "Sistema PeerJS Multiplayer - Deploy Render.com"

# 2. Criar repositório no GitHub
# Acesse: https://github.com/new
# Nome sugerido: peerjs-multiplayer-server

# 3. Conectar e fazer push
git remote add origin https://github.com/SEU_USUARIO/peerjs-multiplayer-server.git
git branch -M main
git push -u origin main

# 4. No Render.com (https://dashboard.render.com/)
# - New Web Service
# - Connect Repository: peerjs-multiplayer-server
# - Name: peerjs-multiplayer-server
# - Build Command: npm install
# - Start Command: npm start
# - Instance Type: Free
# - Create Web Service

# 5. Aguardar deploy (2-5 minutos)
# URL gerada será algo como:
# https://peerjs-multiplayer-server.onrender.com


# ✅ PASSO 3: ATUALIZAR URLs (APÓS DEPLOY)
# ==========================================

# Editar estes arquivos e substituir a URL do servidor:
# - peerjs-multiplayer/public/lobby.html
# - peerjs-multiplayer/public/host.html  
# - peerjs-multiplayer/public/player.html

# Procurar por:
# const SERVIDOR_URL = window.location.hostname === 'localhost' 
#     ? 'http://localhost:9000'
#     : window.location.origin;

# Substituir por (use SUA URL do Render):
# const SERVIDOR_URL = window.location.hostname === 'localhost' 
#     ? 'http://localhost:9000'
#     : 'https://peerjs-multiplayer-server.onrender.com';


# ✅ COMANDOS ÚTEIS
# ==========================================

# Ver salas ativas (API)
curl http://localhost:9000/api/salas

# Matar processo na porta 9000 (se estiver ocupada)
# Windows:
netstat -ano | findstr :9000
taskkill /PID <PID> /F

# Ver logs em tempo real
npm start

# Reinstalar dependências
rm -rf node_modules
npm install


# ✅ ESTRUTURA DE PASTAS
# ==========================================
# peerjs-multiplayer/
#   ├── servidor-peerjs.js       # Servidor
#   ├── package.json             # Dependências
#   └── public/
#       ├── lobby.html          # Lobby
#       ├── host.html           # HOST
#       └── player.html         # PLAYER


# ✅ TESTAR COMPLETO
# ==========================================

# Navegador 1 - HOST:
# 1. http://localhost:9000/lobby.html
# 2. Criar sala "Teste Mario"
# 3. Selecionar "SNES - Super Nintendo"
# 4. Carregar ROM
# 5. Iniciar Streaming

# Navegador 2 - PLAYER:
# 1. http://localhost:9000/lobby.html
# 2. Clicar na sala
# 3. Ver vídeo aparecer
# 4. Controlar com WASD


# ✅ INTEGRAR NO SITE PRINCIPAL
# ==========================================

# Adicionar botão no index.html:
# <a href="https://SEU-SERVIDOR.onrender.com/lobby.html" target="_blank">
#   🎮 Multiplayer Online
# </a>

# Ou abrir em popup:
# <button onclick="window.open('https://SEU-SERVIDOR.onrender.com/lobby.html', 'Multiplayer', 'width=1400,height=900')">
#   🎮 Jogar Online
# </button>


# ✅ VERIFICAR STATUS
# ==========================================

# Servidor local rodando?
curl http://localhost:9000

# Servidor Render rodando?
curl https://peerjs-multiplayer-server.onrender.com

# Ver salas ativas:
curl http://localhost:9000/api/salas
# Ou no navegador:
# http://localhost:9000/api/salas


# ✅ TROUBLESHOOTING
# ==========================================

# Problema: "Cannot find module 'peer'"
npm install peer express cors

# Problema: "Porta já em uso"
# Windows:
netstat -ano | findstr :9000
taskkill /PID <PID> /F

# Problema: "PeerJS not loaded"
# Adicione no HTML:
# <script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>

# Problema: "Stream não aparece"
# 1. Aguarde 2-3s após carregar emulador
# 2. Clique "Iniciar Streaming"
# 3. Use Chrome/Edge


# ✅ ARQUIVOS CRIADOS
# ==========================================
# ✅ peerjs-multiplayer/servidor-peerjs.js
# ✅ peerjs-multiplayer/package.json
# ✅ peerjs-multiplayer/public/lobby.html
# ✅ peerjs-multiplayer/public/host.html
# ✅ peerjs-multiplayer/public/player.html
# ✅ peerjs-multiplayer/README.md
# ✅ peerjs-multiplayer/README_DEPLOY_RENDER.md
# ✅ src/services/multiplayerServicePeerJS.js
# ✅ 🎮_SISTEMA_MULTIPLAYER_PEERJS_PRONTO.md


# 🎉 TUDO PRONTO!
# Execute: npm start
# Abra: http://localhost:9000/lobby.html
