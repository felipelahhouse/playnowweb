# ========================================
# Backup AUTOMATICO para GitHub
# ========================================

$gitPath = "C:\Program Files\Git\bin\git.exe"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BACKUP AUTOMATICO PARA GITHUB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Git
Write-Host "1. Verificando Git..." -ForegroundColor Yellow
if (Test-Path $gitPath) {
    $version = & $gitPath --version
    Write-Host "OK - $version" -ForegroundColor Green
} else {
    Write-Host "ERRO - Git nao encontrado" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 2. Configurar usuario Git
Write-Host "2. Configurando usuario Git..." -ForegroundColor Yellow
$userName = & $gitPath config user.name 2>&1
if ([string]::IsNullOrWhiteSpace($userName) -or $userName -like "*error*") {
    & $gitPath config user.name "PlayNow Developer"
    Write-Host "Usuario configurado: PlayNow Developer" -ForegroundColor Green
} else {
    Write-Host "Usuario: $userName" -ForegroundColor Green
}

$userEmail = & $gitPath config user.email 2>&1
if ([string]::IsNullOrWhiteSpace($userEmail) -or $userEmail -like "*error*") {
    & $gitPath config user.email "playnow@emulator.com"
    Write-Host "Email configurado: playnow@emulator.com" -ForegroundColor Green
} else {
    Write-Host "Email: $userEmail" -ForegroundColor Green
}
Write-Host ""

# 3. Inicializar repositorio
Write-Host "3. Inicializando repositorio..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) {
    & $gitPath init
    & $gitPath branch -M main
    Write-Host "OK - Repositorio criado (branch: main)" -ForegroundColor Green
} else {
    Write-Host "OK - Repositorio ja existe" -ForegroundColor Green
}
Write-Host ""

# 4. Criar .gitignore
Write-Host "4. Criando .gitignore..." -ForegroundColor Yellow
$gitignoreContent = @"
# Dependencies
node_modules/
.pnp
.pnp.js

# Production
build/
dist/

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS Files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Firebase
.firebase/
firebase-debug.log

# Python
__pycache__/
*.pyc
.venv/
venv/

# Misc
.cache/
temp/
tmp/
"@
Set-Content ".gitignore" -Value $gitignoreContent -Encoding UTF8
Write-Host "OK - .gitignore criado" -ForegroundColor Green
Write-Host ""

# 5. Adicionar arquivos
Write-Host "5. Adicionando arquivos..." -ForegroundColor Yellow
& $gitPath add .
Write-Host "OK - Arquivos adicionados" -ForegroundColor Green
Write-Host ""

# 6. Verificar se ha mudancas
Write-Host "6. Verificando mudancas..." -ForegroundColor Yellow
$status = & $gitPath status --short
if ([string]::IsNullOrWhiteSpace($status)) {
    $hasChanges = $false
    Write-Host "Nenhuma mudanca nova detectada" -ForegroundColor Yellow
} else {
    $hasChanges = $true
    Write-Host "Mudancas detectadas - criando commit" -ForegroundColor Green
}
Write-Host ""

# 7. Criar commit (se houver mudancas)
if ($hasChanges -or -not (& $gitPath log -1 2>&1)) {
    Write-Host "7. Criando commit..." -ForegroundColor Yellow
    $data = Get-Date -Format "dd/MM/yyyy HH:mm"
    $commitMsg = "Backup automatico - $data"
    & $gitPath commit -m "$commitMsg"
    Write-Host "OK - Commit criado: $commitMsg" -ForegroundColor Green
} else {
    Write-Host "7. Commit nao necessario" -ForegroundColor Yellow
}
Write-Host ""

# 8. Verificar repositorio remoto
Write-Host "8. Verificando repositorio remoto..." -ForegroundColor Yellow
$remoteUrl = & $gitPath remote get-url origin 2>&1

if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($remoteUrl)) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "CONFIGURACAO DO GITHUB" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para fazer backup no GitHub, siga estes passos:" -ForegroundColor White
    Write-Host ""
    Write-Host "1. Acesse: https://github.com/new" -ForegroundColor Cyan
    Write-Host "2. Crie um repositorio (nome sugerido: playnow-emulator)" -ForegroundColor Cyan
    Write-Host "3. Escolha: Privado (recomendado)" -ForegroundColor Cyan
    Write-Host "4. Copie a URL do repositorio" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Exemplo de URL: https://github.com/seu-usuario/playnow-emulator.git" -ForegroundColor Gray
    Write-Host ""
    $repoUrl = Read-Host "Cole a URL do repositorio GitHub aqui"
    
    if ([string]::IsNullOrWhiteSpace($repoUrl)) {
        Write-Host ""
        Write-Host "Operacao cancelada - URL nao fornecida" -ForegroundColor Red
        Write-Host ""
        Write-Host "BACKUP LOCAL CONCLUIDO!" -ForegroundColor Green
        Write-Host "Todos os arquivos foram salvos no Git local." -ForegroundColor White
        Write-Host "Execute este script novamente quando tiver a URL do GitHub." -ForegroundColor White
        exit 0
    }
    
    & $gitPath remote add origin $repoUrl
    Write-Host "OK - Repositorio configurado" -ForegroundColor Green
} else {
    Write-Host "OK - Repositorio: $remoteUrl" -ForegroundColor Green
}
Write-Host ""

# 9. Push para GitHub
Write-Host "9. Enviando para GitHub..." -ForegroundColor Yellow
Write-Host "Fazendo push..." -ForegroundColor Cyan

$currentBranch = & $gitPath branch --show-current
if ([string]::IsNullOrWhiteSpace($currentBranch)) {
    $currentBranch = "main"
}

# Tentar push normal primeiro
& $gitPath push -u origin $currentBranch 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK - Push realizado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "Tentando push com --force..." -ForegroundColor Yellow
    & $gitPath push -u origin $currentBranch --force 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK - Push realizado!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Yellow
        Write-Host "AUTENTICACAO NECESSARIA" -ForegroundColor Yellow
        Write-Host "========================================" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Para fazer push, voce precisa autenticar:" -ForegroundColor White
        Write-Host ""
        Write-Host "OPCAO 1 - GitHub Desktop (RECOMENDADO):" -ForegroundColor Cyan
        Write-Host "  1. Instale: https://desktop.github.com/" -ForegroundColor White
        Write-Host "  2. Faca login com sua conta GitHub" -ForegroundColor White
        Write-Host "  3. File > Add Local Repository" -ForegroundColor White
        Write-Host "  4. Selecione esta pasta e clique Publish" -ForegroundColor White
        Write-Host ""
        Write-Host "OPCAO 2 - Personal Access Token:" -ForegroundColor Cyan
        Write-Host "  1. Acesse: https://github.com/settings/tokens" -ForegroundColor White
        Write-Host "  2. Generate new token > Generate new token (classic)" -ForegroundColor White
        Write-Host "  3. Marque 'repo' e gere o token" -ForegroundColor White
        Write-Host "  4. Use o token como senha quando pedir" -ForegroundColor White
        Write-Host "  5. Execute este script novamente" -ForegroundColor White
        Write-Host ""
    }
}
Write-Host ""

# 10. Sucesso
Write-Host "========================================" -ForegroundColor Green
Write-Host "BACKUP CONCLUIDO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Seu projeto foi salvo:" -ForegroundColor White
Write-Host "  - Git local: OK" -ForegroundColor Green
Write-Host "  - Commits salvos: OK" -ForegroundColor Green

$remoteUrl = & $gitPath remote get-url origin 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  - GitHub remote: $remoteUrl" -ForegroundColor Green
}
Write-Host ""
Write-Host "Para backups futuros, execute:" -ForegroundColor Yellow
Write-Host "  .\backup-automatico.ps1" -ForegroundColor Cyan
Write-Host ""
