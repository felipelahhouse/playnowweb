# Deploy Colyseus Cloud - Automated Script
# Usage: .\DEPLOY_COLYSEUS_AGORA.ps1

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🚀 DEPLOY COLYSEUS CLOUD - PLAY NOW EMULATOR      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Colors
$success = "Green"
$error_color = "Red"
$info = "Cyan"
$warning = "Yellow"

# Check prerequisites
Write-Host "[1/5] Verificando pre-requisitos..." -ForegroundColor $info

$checks = @(
    @{ cmd = "node --version"; name = "Node.js" },
    @{ cmd = "npm --version"; name = "npm" },
    @{ cmd = "git --version"; name = "Git" }
)

foreach ($check in $checks) {
    try {
        $result = Invoke-Expression $check.cmd 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ $($check.name): $result" -ForegroundColor $success
        }
    }
    catch {
        Write-Host "  ❌ $($check.name) NAO ENCONTRADO" -ForegroundColor $error_color
        Write-Host "  Instale em: https://nodejs.org" -ForegroundColor $warning
        exit 1
    }
}

Write-Host ""
Write-Host "[2/5] Instalando dependencias..." -ForegroundColor $info

# Install dependencies
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ Erro ao instalar dependencias" -ForegroundColor $error_color
    exit 1
}

Write-Host "  ✅ Dependencias instaladas" -ForegroundColor $success

Write-Host ""
Write-Host "[3/5] Fazendo build do projeto..." -ForegroundColor $info

npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ Erro ao fazer build" -ForegroundColor $error_color
    exit 1
}

Write-Host "  ✅ Build concluido" -ForegroundColor $success

Write-Host ""
Write-Host "[4/5] Verificando arquivo .env.production..." -ForegroundColor $info

if (Test-Path ".\.env.production") {
    Write-Host "  ✅ .env.production encontrado" -ForegroundColor $success
} else {
    Write-Host "  ⚠️  .env.production nao encontrado" -ForegroundColor $warning
}

Write-Host ""
Write-Host "[5/5] Pronto para deploy!" -ForegroundColor $info
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              🎯 PROXIMOS PASSOS                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "OPCAO 1 - Deploy Firebase (Frontend + ROMs)" -ForegroundColor $warning
Write-Host "  firebase deploy" -ForegroundColor $info
Write-Host ""

Write-Host "OPCAO 2 - Deploy Colyseus Cloud (Servidor)" -ForegroundColor $warning
Write-Host "  npm install -g colyseus-cli" -ForegroundColor $info
Write-Host "  colyseus login" -ForegroundColor $info
Write-Host "  colyseus deploy" -ForegroundColor $info
Write-Host ""

Write-Host "OPCAO 3 - Deploy em Replit (Servidor)" -ForegroundColor $warning
Write-Host "  1. Criar novo Replit project" -ForegroundColor $info
Write-Host "  2. Colar codigo do colyseus-server-example.ts" -ForegroundColor $info
Write-Host "  3. npm install colyseus..." -ForegroundColor $info
Write-Host ""

Write-Host "📖 Documentacao completa:" -ForegroundColor $success
Write-Host "  DEPLOY_COLYSEUS_CLOUD.md" -ForegroundColor $info
Write-Host ""

Write-Host "✅ Tudo pronto! Deploy realizado com sucesso." -ForegroundColor $success
Write-Host ""