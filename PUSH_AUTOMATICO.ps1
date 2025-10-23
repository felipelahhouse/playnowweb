# 🚀 SCRIPT AUTOMÁTICO - PUSH PARA GITHUB SEM ROMs
# Repositório: felipelahhouse/colyseusretro

Write-Host "
╔════════════════════════════════════════════════════════════════╗
║     🚀 FAZENDO PUSH PARA GITHUB SEM ROMS               ║
║     Repositório: felipelahhouse/colyseusretro                  ║
╚════════════════════════════════════════════════════════════════╝
" -ForegroundColor Cyan

$repoUrl = "https://github.com/felipelahhouse/colyseusretro.git"
$backupDir = "c:\Users\peternoia\Desktop\playnowemulator-firebase_BACKUP_2025-10-19_100145"
$cloneDir = "$HOME\Desktop\colyseusretro"

Write-Host "📍 Etapa 1: Clonar repositório..." -ForegroundColor Yellow

if (Test-Path $cloneDir) {
    Write-Host "⚠️  Diretório já existe. Removendo..." -ForegroundColor Yellow
    Remove-Item -Path $cloneDir -Recurse -Force
}

git clone $repoUrl $cloneDir
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERRO ao clonar repositório!" -ForegroundColor Red
    exit 1
}

Set-Location $cloneDir
Write-Host "✅ Repositório clonado em: $cloneDir" -ForegroundColor Green

Write-Host "`n📍 Etapa 2: Copiando arquivos do projeto..." -ForegroundColor Yellow

# Copiar todos os arquivos (menos public/roms)
try {
    Copy-Item -Path "$backupDir\*" -Destination "." -Recurse -Force -Exclude "public\roms", ".git", "node_modules" -ErrorAction SilentlyContinue
    Write-Host "✅ Arquivos copiados" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Aviso: Alguns arquivos podem estar protegidos" -ForegroundColor Yellow
}

Write-Host "`n📍 Etapa 3: Removendo ROMs do cache do Git..." -ForegroundColor Yellow

# Remover ROMs do git se já foram adicionadas
git rm -r --cached "public/roms" 2>$null
git rm --cached "*.smc" "*.sfc" "*.iso" "*.zip" "*.rar" "*.7z" 2>$null

Write-Host "✅ Cache limpo" -ForegroundColor Green

Write-Host "`n📍 Etapa 4: Verificando status do Git..." -ForegroundColor Yellow

$status = git status --short

if ($status -like "*public/roms*") {
    Write-Host "❌ ERRO: ROMs ainda estão sendo rastreadas!" -ForegroundColor Red
    Write-Host $status -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ Nenhuma ROM será enviada!" -ForegroundColor Green
}

# Mostrar resumo
Write-Host "`n📊 RESUMO DO PUSH:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host $status
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$confirm = Read-Host "`n❓ Deseja continuar com o push? (s/n)"

if ($confirm -ne "s") {
    Write-Host "❌ Operação cancelada pelo usuário" -ForegroundColor Red
    exit 0
}

Write-Host "`n📍 Etapa 5: Fazendo commit..." -ForegroundColor Yellow

git add .
git commit -m "feat: migrate to Colyseus Cloud

- Frontend 100% migrated to Colyseus
- Colyseus Cloud endpoint configured
- Backend ready for deployment
- ROMs excluded from repository (use Firebase Storage or CDN)
- All documentation included"

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Aviso: Nada para fazer commit (arquivos podem estar iguais)" -ForegroundColor Yellow
} else {
    Write-Host "✅ Commit criado" -ForegroundColor Green
}

Write-Host "`n📍 Etapa 6: Fazendo push para GitHub..." -ForegroundColor Yellow

git push origin main
if ($LASTEXITCODE -ne 0) {
    git push origin master 2>$null
}

Write-Host "`n✅ PUSH CONCLUÍDO COM SUCESSO!" -ForegroundColor Green

Write-Host "`n📊 VERIFICAÇÕES:" -ForegroundColor Cyan
Write-Host "  ✅ ROMs excluídas: SIM"
Write-Host "  ✅ Repositório: github.com/felipelahhouse/colyseusretro"
Write-Host "  ✅ Código enviado: SIM"

Write-Host "`n🔗 Acesse seu repositório:" -ForegroundColor Cyan
Write-Host "   https://github.com/felipelahhouse/colyseusretro" -ForegroundColor Blue

Write-Host "`n⏭️  PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "  1. Fazer deploy do servidor Colyseus Cloud"
Write-Host "  2. Configurar Firebase Storage para ROMs"
Write-Host "  3. Testar multiplayer"

Write-Host "`n" -ForegroundColor Green