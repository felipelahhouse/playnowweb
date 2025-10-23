# Start Multiplayer System
# Inicia servidor Socket.IO e frontend automaticamente

Write-Host ""
Write-Host "🚀 Iniciando PlayNowEmulator Multiplayer System..." -ForegroundColor Cyan
Write-Host ""

$projectRoot = "C:\Users\peternoia\Desktop\playnowemulator-firebase"
$socketServerPath = Join-Path $projectRoot "socket-server-local"

# Verificar se os diretórios existem
if (-not (Test-Path $socketServerPath)) {
    Write-Host "❌ Erro: Diretório socket-server-local não encontrado!" -ForegroundColor Red
    exit 1
}

# Terminal 1: Socket.IO Server
Write-Host "📡 Iniciando Socket.IO Server (porta 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$socketServerPath'; Write-Host '🔌 Socket.IO Server' -ForegroundColor Cyan; node index.js"
)

# Aguardar servidor iniciar
Write-Host "⏳ Aguardando servidor inicializar..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Verificar se servidor está rodando
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Socket.IO Server iniciado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Não foi possível verificar o servidor, mas continuando..." -ForegroundColor Yellow
}

# Terminal 2: Frontend Vite
Write-Host "🎮 Iniciando Frontend (porta 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$projectRoot'; Write-Host '💻 Frontend Vite' -ForegroundColor Cyan; npm run dev"
)

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "✅ Multiplayer System iniciado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Informações:" -ForegroundColor Cyan
Write-Host "   Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "   Socket.IO: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "⚠️ Mantenha ambos os terminais abertos!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Para testar:" -ForegroundColor Cyan
Write-Host "1. Acesse http://localhost:5173" -ForegroundColor White
Write-Host "2. Faça login" -ForegroundColor White
Write-Host "3. Abra o Multiplayer Lobby" -ForegroundColor White
Write-Host "4. Aguarde indicador 🟢 Online" -ForegroundColor White
Write-Host "5. Crie uma nova sala" -ForegroundColor White
Write-Host ""
