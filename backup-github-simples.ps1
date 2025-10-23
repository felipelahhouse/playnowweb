# ========================================
# Backup Simplificado para GitHub
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Backup para GitHub - PlayNow Emulator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Git
Write-Host "1. Verificando Git..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "OK - Git instalado: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "ERRO - Git nao instalado!" -ForegroundColor Red
    Write-Host "Baixe em: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# 2. Inicializar Git se necessario
Write-Host "2. Verificando repositorio..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) {
    Write-Host "Inicializando repositorio Git..." -ForegroundColor Yellow
    git init
    git branch -M main
    Write-Host "OK - Repositorio criado" -ForegroundColor Green
} else {
    Write-Host "OK - Repositorio ja existe" -ForegroundColor Green
}
Write-Host ""

# 3. Criar .gitignore
Write-Host "3. Configurando .gitignore..." -ForegroundColor Yellow
$gitignore = @"
node_modules/
.env
.env.local
build/
dist/
.vscode/
.DS_Store
*.log
.firebase/
__pycache__/
.venv/
venv/
.cache/
"@
Set-Content ".gitignore" -Value $gitignore
Write-Host "OK - .gitignore configurado" -ForegroundColor Green
Write-Host ""

# 4. Adicionar arquivos
Write-Host "4. Adicionando arquivos..." -ForegroundColor Yellow
git add .
Write-Host "OK - Arquivos adicionados" -ForegroundColor Green
Write-Host ""

# 5. Criar commit
Write-Host "5. Criando commit..." -ForegroundColor Yellow
$data = Get-Date -Format "dd/MM/yyyy HH:mm"
$commitMsg = "Backup completo - $data"
git commit -m "$commitMsg"
Write-Host "OK - Commit: $commitMsg" -ForegroundColor Green
Write-Host ""

# 6. Configurar repositorio remoto
Write-Host "6. Configurando repositorio GitHub..." -ForegroundColor Yellow
$remoteExists = git remote get-url origin 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "IMPORTANTE: Antes de continuar:" -ForegroundColor Yellow
    Write-Host "1. Va para: https://github.com/new" -ForegroundColor White
    Write-Host "2. Crie um repositorio (privado ou publico)" -ForegroundColor White
    Write-Host "3. Copie a URL (ex: https://github.com/usuario/repo.git)" -ForegroundColor White
    Write-Host ""
    $repoUrl = Read-Host "Cole a URL do seu repositorio GitHub"
    
    if ($repoUrl) {
        git remote add origin $repoUrl
        Write-Host "OK - Repositorio configurado" -ForegroundColor Green
    } else {
        Write-Host "ERRO - URL invalida" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "OK - Repositorio: $remoteExists" -ForegroundColor Green
}
Write-Host ""

# 7. Push para GitHub
Write-Host "7. Enviando para GitHub..." -ForegroundColor Yellow
Write-Host "Fazendo push..." -ForegroundColor Cyan
git push -u origin main 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK - Push realizado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "Tentando com --force..." -ForegroundColor Yellow
    git push -u origin main --force 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK - Push realizado!" -ForegroundColor Green
    } else {
        Write-Host "AVISO - Erro no push" -ForegroundColor Red
        Write-Host ""
        Write-Host "Possiveis solucoes:" -ForegroundColor Yellow
        Write-Host "1. Configure Personal Access Token:" -ForegroundColor White
        Write-Host "   https://github.com/settings/tokens" -ForegroundColor Cyan
        Write-Host "2. Use o token como senha quando pedir" -ForegroundColor White
        Write-Host "3. Ou instale GitHub Desktop: https://desktop.github.com/" -ForegroundColor White
    }
}
Write-Host ""

# 8. Sucesso
Write-Host "========================================" -ForegroundColor Green
Write-Host "BACKUP CONCLUIDO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Para backups futuros, execute:" -ForegroundColor Yellow
Write-Host "  .\backup-github-simples.ps1" -ForegroundColor Cyan
Write-Host ""
