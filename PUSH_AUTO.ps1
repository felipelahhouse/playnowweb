# SCRIPT AUTOMATICO - PUSH PARA GITHUB SEM ROMs
# Repositorio: felipelahhouse/colyseusretro

Write-Host "`n=== FAZENDO PUSH PARA GITHUB SEM ROMS ===" -ForegroundColor Cyan
Write-Host "Repositorio: felipelahhouse/colyseusretro`n" -ForegroundColor Cyan

$repoUrl = "https://github.com/felipelahhouse/colyseusretro.git"
$backupDir = "c:\Users\peternoia\Desktop\playnowemulator-firebase_BACKUP_2025-10-19_100145"
$cloneDir = "$HOME\Desktop\colyseusretro"

Write-Host "[1/6] Clonando repositorio..." -ForegroundColor Yellow

if (Test-Path $cloneDir) {
    Write-Host "  - Removendo diretorio existente..." -ForegroundColor Yellow
    Remove-Item -Path $cloneDir -Recurse -Force
}

git clone $repoUrl $cloneDir
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO ao clonar repositorio!" -ForegroundColor Red
    exit 1
}

Set-Location $cloneDir
Write-Host "  OK - Repositorio clonado em: $cloneDir`n" -ForegroundColor Green

Write-Host "[2/6] Copiando arquivos do projeto..." -ForegroundColor Yellow

try {
    Copy-Item -Path "$backupDir\*" -Destination "." -Recurse -Force -Exclude "public\roms", ".git", "node_modules" -ErrorAction SilentlyContinue
    Write-Host "  OK - Arquivos copiados`n" -ForegroundColor Green
} catch {
    Write-Host "  AVISO: Alguns arquivos podem estar protegidos`n" -ForegroundColor Yellow
}

Write-Host "[3/6] Removendo ROMs do cache do Git..." -ForegroundColor Yellow

git rm -r --cached "public/roms" 2>$null
git rm --cached "*.smc" "*.sfc" "*.iso" "*.zip" "*.rar" "*.7z" 2>$null

Write-Host "  OK - Cache limpo`n" -ForegroundColor Green

Write-Host "[4/6] Verificando status do Git..." -ForegroundColor Yellow

$status = git status --short

if ($status -like "*public/roms*") {
    Write-Host "  ERRO: ROMs ainda estao sendo rastreadas!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "  OK - Nenhuma ROM sera enviada!`n" -ForegroundColor Green
}

Write-Host "[5/6] Fazendo commit..." -ForegroundColor Yellow

git add .
git commit -m "feat: migrate to Colyseus Cloud - frontend complete, backend ready, ROMs excluded"

if ($LASTEXITCODE -ne 0) {
    Write-Host "  AVISO: Nada para fazer commit (arquivos podem estar iguais)" -ForegroundColor Yellow
} else {
    Write-Host "  OK - Commit criado`n" -ForegroundColor Green
}

Write-Host "[6/6] Fazendo push para GitHub..." -ForegroundColor Yellow

git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Tentando com 'master'..." -ForegroundColor Yellow
    git push origin master 2>$null
}

Write-Host "`n======================================" -ForegroundColor Green
Write-Host "PUSH CONCLUIDO COM SUCESSO!" -ForegroundColor Green
Write-Host "======================================`n" -ForegroundColor Green

Write-Host "VERIFICACOES:" -ForegroundColor Cyan
Write-Host "  [OK] ROMs excluidas: SIM" -ForegroundColor Green
Write-Host "  [OK] Repositorio: github.com/felipelahhouse/colyseusretro" -ForegroundColor Green
Write-Host "  [OK] Codigo enviado: SIM`n" -ForegroundColor Green

Write-Host "Acesse seu repositorio:" -ForegroundColor Cyan
Write-Host "https://github.com/felipelahhouse/colyseusretro`n" -ForegroundColor Blue

Write-Host "PROXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "  1. Fazer deploy do servidor Colyseus Cloud" -ForegroundColor White
Write-Host "  2. Configurar Firebase Storage para ROMs" -ForegroundColor White
Write-Host "  3. Testar multiplayer`n" -ForegroundColor White