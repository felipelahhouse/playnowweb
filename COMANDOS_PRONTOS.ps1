# ⚡ COMANDOS PRONTOS - Copiar e Colar
# PowerShell - Windows 10/11
# Substitua: SEU_USUARIO, SEU_EMAIL pelo seu GitHub username/email

# ============================================================
# PASSO 1: CLONAR REPOSITÓRIO
# ============================================================
Write-Host "📁 Clonando repositório..." -ForegroundColor Cyan

# Entre em uma pasta limpa (ex: Desktop)
Set-Location "c:\Users\peternoia\Desktop"

# Clone (substitua SEU_USUARIO)
git clone https://github.com/SEU_USUARIO/playnowemulator.git servidor-colyseus

# Entre na pasta
Set-Location "servidor-colyseus"

Write-Host "✅ Repositório clonado!" -ForegroundColor Green

# ============================================================
# PASSO 2: CRIAR ESTRUTURA DE PASTAS
# ============================================================
Write-Host "📁 Criando pastas..." -ForegroundColor Cyan

New-Item -ItemType Directory -Path "src" -Force | Out-Null
New-Item -ItemType Directory -Path ".github\workflows" -Force | Out-Null

Write-Host "✅ Pastas criadas!" -ForegroundColor Green

# ============================================================
# PASSO 3: COPIAR ARQUIVOS DO PROJETO ORIGINAL
# ============================================================
Write-Host "📋 Copiando arquivos de configuração..." -ForegroundColor Cyan

# Caminho do projeto original
$originalProject = "c:\Users\peternoia\Desktop\playnowemulator-firebase_BACKUP_2025-10-19_100145"

# Copiar exemplo do servidor
Copy-Item -Path "$originalProject\colyseus-server-example.ts" -Destination "src\Room.ts" -Force
Write-Host "  ✅ Copiado: src/Room.ts" -ForegroundColor Green

# Copiar package.json
Copy-Item -Path "$originalProject\server-package.json" -Destination "package.json" -Force
Write-Host "  ✅ Copiado: package.json" -ForegroundColor Green

# Copiar tsconfig.json
Copy-Item -Path "$originalProject\server-tsconfig.json" -Destination "tsconfig.json" -Force
Write-Host "  ✅ Copiado: tsconfig.json" -ForegroundColor Green

# ============================================================
# PASSO 4: CRIAR SRC/INDEX.TS
# ============================================================
Write-Host "📄 Criando src/index.ts..." -ForegroundColor Cyan

$indexContent = @'
import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { GameSession } from "./Room";

const app = express();
app.use(express.json());
app.use(cors());

const gameServer = new Server({
  transport: new WebSocketTransport({
    server: http.createServer(app),
  }),
});

gameServer.define("game_session", GameSession);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "online", version: "1.0" });
});

// List rooms endpoint
app.get("/api/rooms", async (req, res) => {
  const rooms = await gameServer.getRoomList("game_session");
  res.json(rooms);
});

const PORT = process.env.PORT || 3000;
gameServer.listen(PORT);
console.log(`🎮 Servidor Colyseus rodando em: ws://localhost:${PORT}`);
'@

Set-Content -Path "src/index.ts" -Value $indexContent -Encoding UTF8
Write-Host "✅ Arquivo src/index.ts criado!" -ForegroundColor Green

# ============================================================
# PASSO 5: CRIAR .GITIGNORE
# ============================================================
Write-Host "📄 Criando .gitignore..." -ForegroundColor Cyan

$gitignoreContent = @'
node_modules/
dist/
.env
.DS_Store
*.log
coverage/
'@

Set-Content -Path ".gitignore" -Value $gitignoreContent -Encoding UTF8
Write-Host "✅ .gitignore criado!" -ForegroundColor Green

# ============================================================
# PASSO 6: CRIAR .ENV.LOCAL
# ============================================================
Write-Host "📄 Criando .env.local..." -ForegroundColor Cyan

$envContent = @'
NODE_ENV=development
PORT=3000
'@

Set-Content -Path ".env.local" -Value $envContent -Encoding UTF8
Write-Host "✅ .env.local criado!" -ForegroundColor Green

# ============================================================
# PASSO 7: CONFIGURAR GIT (PRIMEIRA VEZ)
# ============================================================
Write-Host "🔧 Configurando Git..." -ForegroundColor Cyan

# Substitua pelos seus dados
git config user.name "Seu Nome Completo"
git config user.email "seu.email@github.com"

Write-Host "✅ Git configurado!" -ForegroundColor Green

# ============================================================
# PASSO 8: INSTALAR DEPENDÊNCIAS
# ============================================================
Write-Host "📦 Instalando dependências (pode levar 2-3 minutos)..." -ForegroundColor Cyan

npm install

Write-Host "✅ Dependências instaladas!" -ForegroundColor Green

# ============================================================
# PASSO 9: VERIFICAR INSTALAÇÃO
# ============================================================
Write-Host "🔍 Verificando instalação..." -ForegroundColor Cyan

if (Test-Path "node_modules\colyseus") {
  Write-Host "✅ Colyseus instalado corretamente!" -ForegroundColor Green
} else {
  Write-Host "❌ Colyseus não encontrado! Rode: npm install" -ForegroundColor Red
}

# ============================================================
# PASSO 10: TESTAR LOCALMENTE (RECOMENDADO)
# ============================================================
Write-Host "`n" -ForegroundColor Cyan
Write-Host "🧪 PRÓXIMO: Teste localmente com:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor Yellow
Write-Host "`n  Depois abra outra aba PowerShell para git push" -ForegroundColor Cyan

# Perguntar se quer rodar agora
$runLocal = Read-Host "Rodar 'npm run dev' agora? (S/N)"
if ($runLocal -eq "S" -or $runLocal -eq "s") {
  Write-Host "Iniciando servidor..." -ForegroundColor Cyan
  npm run dev
  # Se quiser fazer push enquanto roda, abra outra aba PowerShell
} else {
  Write-Host "Saltando teste local" -ForegroundColor Yellow
  
  # ============================================================
  # PASSO 11: FAZER GIT PUSH
  # ============================================================
  Write-Host "`n📤 Fazendo push para GitHub..." -ForegroundColor Cyan
  
  git add .
  Write-Host "  ✅ Arquivos adicionados" -ForegroundColor Green
  
  git commit -m "Colyseus server setup - initial deployment"
  Write-Host "  ✅ Commit realizado" -ForegroundColor Green
  
  git push -u origin main
  Write-Host "  ✅ Push completo!" -ForegroundColor Green
  
  # ============================================================
  # PASSO 12: DEPLOY COLYSEUS CLOUD
  # ============================================================
  Write-Host "`n🚀 Próximo: Deploy no Colyseus Cloud" -ForegroundColor Cyan
  Write-Host "  1. npm install -g @colyseus/cloud" -ForegroundColor Yellow
  Write-Host "  2. colyseus-cloud login" -ForegroundColor Yellow
  Write-Host "  3. colyseus-cloud deploy" -ForegroundColor Yellow
  
  $doDeploy = Read-Host "`nFazer deploy agora? (S/N)"
  if ($doDeploy -eq "S" -or $doDeploy -eq "s") {
    Write-Host "Instalando CLI..." -ForegroundColor Cyan
    npm install -g @colyseus/cloud
    
    Write-Host "Fazendo login..." -ForegroundColor Cyan
    colyseus-cloud login
    
    Write-Host "Fazendo deploy..." -ForegroundColor Cyan
    colyseus-cloud deploy
    
    Write-Host "`n✅ DEPLOY COMPLETO!" -ForegroundColor Green
    Write-Host "Seu servidor está em: wss://us-mia-84dbc265.colyseus.cloud" -ForegroundColor Green
  }
}

Write-Host "`n" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ CONFIGURAÇÃO COMPLETA!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green