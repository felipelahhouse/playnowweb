# 🧪 Script de Teste - Correção Loading Infinito
# Este script verifica se as correções foram aplicadas corretamente

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🧪 TESTE: Correção Loading Infinito" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verifica se os arquivos existem
$publicFile = "c:\Users\peternoia\Desktop\playnowemulator-firebase\public\universal-player.html"
$distFile = "c:\Users\peternoia\Desktop\playnowemulator-firebase\dist\universal-player.html"

Write-Host "📁 Verificando arquivos..." -ForegroundColor Yellow

if (Test-Path $publicFile) {
    Write-Host "✅ public/universal-player.html encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ public/universal-player.html NÃO encontrado" -ForegroundColor Red
    exit 1
}

if (Test-Path $distFile) {
    Write-Host "✅ dist/universal-player.html encontrado" -ForegroundColor Green
} else {
    Write-Host "⚠️  dist/universal-player.html NÃO encontrado (será criado no build)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔍 Verificando correções implementadas..." -ForegroundColor Yellow

# Verifica se as correções estão presentes
$content = Get-Content $publicFile -Raw

$checks = @(
    @{
        Name = "Timeout de CDN (15s)"
        Pattern = "15000.*15 segundos"
        Found = $content -match "15000.*15 segundos"
    },
    @{
        Name = "Aviso intermediário de loading"
        Pattern = "ainda carregando"
        Found = $content -match "ainda carregando"
    },
    @{
        Name = "Logs detalhados de diagnóstico"
        Pattern = "Starting emulator initialization"
        Found = $content -match "Starting emulator initialization"
    },
    @{
        Name = "Contador de tentativas CDN"
        Pattern = "Attempt.*CDN_SOURCES.length"
        Found = $content -match "Attempt.*CDN_SOURCES.length"
    },
    @{
        Name = "Mensagem de erro melhorada"
        Pattern = "Verifique sua conexão com a internet"
        Found = $content -match "Verifique sua conexão com a internet"
    }
)

$allPassed = $true
foreach ($check in $checks) {
    if ($check.Found) {
        Write-Host "✅ $($check.Name)" -ForegroundColor Green
    } else {
        Write-Host "❌ $($check.Name)" -ForegroundColor Red
        $allPassed = $false
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan

if ($allPassed) {
    Write-Host "✅ TODAS AS CORREÇÕES FORAM APLICADAS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
    Write-Host "1. Execute: npm run dev" -ForegroundColor White
    Write-Host "2. Abra: http://localhost:5173" -ForegroundColor White
    Write-Host "3. Abra o Console (F12)" -ForegroundColor White
    Write-Host "4. Teste um jogo SNES" -ForegroundColor White
    Write-Host "5. Observe os logs no console" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 Leia: CORRECAO_LOADING_INFINITO.md para mais detalhes" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  ALGUMAS CORREÇÕES PODEM ESTAR FALTANDO" -ForegroundColor Yellow
    Write-Host "Verifique o arquivo manualmente" -ForegroundColor Yellow
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Pergunta se quer iniciar o servidor de desenvolvimento
$response = Read-Host "Deseja iniciar o servidor de desenvolvimento agora? (S/N)"
if ($response -eq "S" -or $response -eq "s") {
    Write-Host ""
    Write-Host "🚀 Iniciando servidor de desenvolvimento..." -ForegroundColor Green
    Write-Host "Pressione Ctrl+C para parar" -ForegroundColor Yellow
    Write-Host ""
    npm run dev
}