#!/usr/bin/env pwsh
<#
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║        🚀 COLYSEUS CLOUD UPLOAD - AUTOMÁTICO EM 2 CLIQUES          ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
#>

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════════╗"
Write-Host "║                 📤 FAZENDO UPLOAD COLYSEUS CLOUD                     ║"
Write-Host "╚══════════════════════════════════════════════════════════════════════╝"
Write-Host ""

$zipPath = "c:\Users\peternoia\Desktop\playnowemulator-firebase_BACKUP_2025-10-19_100145\colyseus-server\deploy-colyseus-fix.zip"
$dashboardUrl = "https://dashboard.colyseus.dev"

# Verificar se ZIP existe
if (-not (Test-Path $zipPath)) {
    Write-Host "❌ ERRO: ZIP não encontrado em:" -ForegroundColor Red
    Write-Host "   $zipPath" -ForegroundColor Red
    exit 1
}

$zipSize = (Get-Item $zipPath).Length / 1MB
Write-Host "✅ ZIP encontrado: $zipSize MB" -ForegroundColor Green
Write-Host ""

# Abrir dashboard
Write-Host "🌐 Abrindo Colyseus Cloud Dashboard..." -ForegroundColor Cyan
Start-Process $dashboardUrl

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════════╗"
Write-Host "║                   👉 SIGA ESTES 3 PASSOS NO DASHBOARD               ║"
Write-Host "╚══════════════════════════════════════════════════════════════════════╝"
Write-Host ""

Write-Host "PASSO 1️⃣  - LOGIN" -ForegroundColor Yellow
Write-Host "   • Se solicitado, faça login com sua conta"
Write-Host ""

Write-Host "PASSO 2️⃣  - SELECIONE PROJETO" -ForegroundColor Yellow
Write-Host "   • Clique em: PlayNowEmulator"
Write-Host "   • Vá para: Deployments"
Write-Host ""

Write-Host "PASSO 3️⃣  - UPLOAD DO ZIP" -ForegroundColor Yellow
Write-Host "   • Clique: Upload New Version"
Write-Host "   • Selecione: deploy-colyseus-fix.zip"
Write-Host "   • Clique: Upload"
Write-Host ""

Write-Host "📍 Arquivo pronto em:" -ForegroundColor Green
Write-Host "   📁 $zipPath" -ForegroundColor Green
Write-Host ""

Write-Host "⏱️  Tempo estimado:" -ForegroundColor Cyan
Write-Host "   • Upload: 2-5 minutos"
Write-Host "   • Deployment: 3-10 minutos"
Write-Host "   • TOTAL: ~15 minutos"
Write-Host ""

Write-Host "✨ O dashboard já foi aberto. Agora é com você!" -ForegroundColor Green
Write-Host ""
Write-Host "Quando terminar o upload, você verá:" -ForegroundColor Yellow
Write-Host "   ✅ Status mudará para: Running (verde)"
Write-Host "   ✅ Health check funcionará"
Write-Host ""

$null = Read-Host "Pressione ENTER quando terminar o upload"

Write-Host ""
Write-Host "🧪 Testando health check..." -ForegroundColor Cyan
Write-Host ""

$healthUrl = "https://us-mia-84dbc265.colyseus.cloud/health"
$maxAttempts = 5
$attempt = 0

do {
    $attempt++
    try {
        $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ SUCESSO! Servidor está respondendo!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Resposta:" -ForegroundColor Green
            Write-Host $response.Content -ForegroundColor Green
            Write-Host ""
            exit 0
        }
    } catch {
        if ($attempt -lt $maxAttempts) {
            Write-Host "⏳ Tentativa $attempt/$maxAttempts - Servidor ainda está inicializando..." -ForegroundColor Yellow
            Start-Sleep -Seconds 3
        } else {
            Write-Host "❌ Servidor ainda não respondeu após $maxAttempts tentativas" -ForegroundColor Red
            Write-Host "Aguarde mais 5-10 minutos e tente novamente!" -ForegroundColor Yellow
            exit 1
        }
    }
} while ($attempt -lt $maxAttempts)