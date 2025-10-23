# ========================================
# 🎮 Setup EmulatorJS - Download Completo
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎮 Configurando EmulatorJS Localmente" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$EmulatorJSPath = "public/emulatorjs"
$TempZip = "emulatorjs-temp.zip"
$CDN_URL = "https://cdn.emulatorjs.org/stable/data/emulator.min.zip"

# Criar diretório se não existir
if (!(Test-Path $EmulatorJSPath)) {
    Write-Host "📁 Criando diretório $EmulatorJSPath..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $EmulatorJSPath -Force | Out-Null
}

# Baixar pacote completo do EmulatorJS
Write-Host "⬇️  Baixando EmulatorJS completo da CDN..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $CDN_URL -OutFile $TempZip -UseBasicParsing
    Write-Host "✅ Download concluído!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao baixar: $_" -ForegroundColor Red
    exit 1
}

# Extrair arquivos
Write-Host "📦 Extraindo arquivos..." -ForegroundColor Yellow
try {
    Expand-Archive -Path $TempZip -DestinationPath $EmulatorJSPath -Force
    Write-Host "✅ Arquivos extraídos!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao extrair: $_" -ForegroundColor Red
    exit 1
}

# Limpar arquivo temporário
Remove-Item $TempZip -Force
Write-Host "🧹 Limpeza concluída!" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ EmulatorJS configurado com sucesso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📂 Estrutura criada em: $EmulatorJSPath" -ForegroundColor Cyan
Write-Host "🎮 Agora você pode fazer deploy: npm run deploy" -ForegroundColor Cyan
Write-Host ""
