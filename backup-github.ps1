# ========================================
# Backup para GitHub - PlayNow Emulator
# ========================================
# Data: 18 de Outubro de 2025
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Backup do Projeto para GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar se Git está instalado
Write-Host "1️⃣ Verificando Git..." -ForegroundColor Yellow
$gitVersion = git --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git não está instalado!" -ForegroundColor Red
    Write-Host "📥 Baixe e instale: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Git instalado: $gitVersion" -ForegroundColor Green
Write-Host ""

# 2. Verificar se já é um repositório Git
Write-Host "2️⃣ Verificando repositório Git..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "✅ Repositório Git já existe" -ForegroundColor Green
    
    # Verificar se há remote configurado
    $remoteUrl = git remote get-url origin 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "📡 Remote atual: $remoteUrl" -ForegroundColor Cyan
        Write-Host ""
        $continuar = Read-Host "Deseja fazer push neste repositório? (S/N)"
        if ($continuar -ne "S" -and $continuar -ne "s") {
            Write-Host "❌ Operação cancelada" -ForegroundColor Red
            exit 0
        }
    }
} else {
    Write-Host "📦 Inicializando repositório Git..." -ForegroundColor Yellow
    git init
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Repositório inicializado" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao inicializar repositório" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# 3. Criar/Atualizar .gitignore
Write-Host "3️⃣ Configurando .gitignore..." -ForegroundColor Yellow
$gitignoreContent = @"
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
build/
dist/

# Environment Variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
logs/
*.log

# OS Files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Firebase
.firebase/
firebase-debug.log
firestore-debug.log

# Python
__pycache__/
*.py[cod]
*$py.class
.Python
.venv/
venv/
ENV/

# Misc
.cache/
.temp/
temp/
tmp/
"@

Set-Content -Path ".gitignore" -Value $gitignoreContent -Encoding UTF8
Write-Host "✅ .gitignore configurado" -ForegroundColor Green
Write-Host ""

# 4. Configurar usuário Git (se necessário)
Write-Host "4️⃣ Configurando usuário Git..." -ForegroundColor Yellow
$gitUser = git config user.name 2>&1
$gitEmail = git config user.email 2>&1

if ([string]::IsNullOrWhiteSpace($gitUser)) {
    Write-Host "📝 Configure seu nome:" -ForegroundColor Cyan
    $nome = Read-Host "Nome"
    git config user.name "$nome"
}

if ([string]::IsNullOrWhiteSpace($gitEmail)) {
    Write-Host "📧 Configure seu email:" -ForegroundColor Cyan
    $email = Read-Host "Email"
    git config user.email "$email"
}

$gitUser = git config user.name
$gitEmail = git config user.email
Write-Host "✅ Usuário: $gitUser <$gitEmail>" -ForegroundColor Green
Write-Host ""

# 5. Adicionar todos os arquivos
Write-Host "5️⃣ Adicionando arquivos ao Git..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Arquivos adicionados" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao adicionar arquivos" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 6. Criar commit
Write-Host "6️⃣ Criando commit..." -ForegroundColor Yellow
$commitMsg = "🚀 Backup completo do projeto PlayNow Emulator - $(Get-Date -Format 'dd/MM/yyyy HH:mm')"
git commit -m "$commitMsg"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit criado: $commitMsg" -ForegroundColor Green
} else {
    Write-Host "⚠️ Nenhuma mudança para commitar ou erro no commit" -ForegroundColor Yellow
}
Write-Host ""

# 7. Configurar repositório remoto
Write-Host "7️⃣ Configurando repositório GitHub..." -ForegroundColor Yellow
$remoteUrl = git remote get-url origin 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "📡 Nenhum repositório remoto configurado" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🔗 Opções:" -ForegroundColor Yellow
    Write-Host "1. Criar novo repositório em: https://github.com/new" -ForegroundColor White
    Write-Host "2. Copie a URL HTTPS do repositório (ex: https://github.com/usuario/repo.git)" -ForegroundColor White
    Write-Host ""
    $repoUrl = Read-Host "Cole a URL do repositório GitHub"
    
    if ([string]::IsNullOrWhiteSpace($repoUrl)) {
        Write-Host "❌ URL inválida" -ForegroundColor Red
        exit 1
    }
    
    git remote add origin $repoUrl
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Repositório remoto configurado: $repoUrl" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao configurar repositório remoto" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Repositório remoto já configurado: $remoteUrl" -ForegroundColor Green
}
Write-Host ""

# 8. Fazer push para GitHub
Write-Host "8️⃣ Enviando para GitHub..." -ForegroundColor Yellow
Write-Host "📤 Fazendo push..." -ForegroundColor Cyan

# Tentar push na branch atual
$currentBranch = git branch --show-current

if ([string]::IsNullOrWhiteSpace($currentBranch)) {
    # Se não há branch, criar main
    git branch -M main
    $currentBranch = "main"
}

Write-Host "🌿 Branch: $currentBranch" -ForegroundColor Cyan

# Push com força na primeira vez (caso seja um repositório novo)
git push -u origin $currentBranch --force 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Push realizado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Tentando push normal..." -ForegroundColor Yellow
    git push -u origin $currentBranch 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Push realizado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao fazer push" -ForegroundColor Red
        Write-Host ""
        Write-Host "💡 Possíveis soluções:" -ForegroundColor Yellow
        Write-Host "1. Verifique suas credenciais do GitHub" -ForegroundColor White
        Write-Host "2. Verifique se tem permissão no repositório" -ForegroundColor White
        Write-Host "3. Configure um Personal Access Token:" -ForegroundColor White
        Write-Host "   https://github.com/settings/tokens" -ForegroundColor Cyan
        exit 1
    }
}
Write-Host ""

# 9. Sucesso!
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ BACKUP CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Resumo:" -ForegroundColor Cyan
Write-Host "   • Repositório: $remoteUrl" -ForegroundColor White
Write-Host "   • Branch: $currentBranch" -ForegroundColor White
Write-Host "   • Commit: $commitMsg" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Acesse seu repositório em:" -ForegroundColor Yellow
$repoWebUrl = $remoteUrl -replace '\.git$', '' -replace 'git@github.com:', 'https://github.com/'
Write-Host "   $repoWebUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Para fazer backups futuros, execute:" -ForegroundColor Yellow
Write-Host "   .\backup-github.ps1" -ForegroundColor Cyan
Write-Host ""
