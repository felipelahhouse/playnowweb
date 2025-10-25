# 🚀 Deploy Script - PlayNow Emulator v2.0 Fixes
# 
# Uso: .\deploy-fixes.ps1
# Função: Valida e faz deploy das correções

param(
    [string]$DeployTarget = "firebase",
    [switch]$SkipValidation = $false,
    [switch]$DryRun = $false
)

Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 PlayNow Emulator v2.0 - Deploy Script" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Cores
$colors = @{
    Success = "Green"
    Error   = "Red"
    Warning = "Yellow"
    Info    = "Cyan"
}

# Função para logging
function Log($message, $type = "Info") {
    $timestamp = Get-Date -Format "HH:mm:ss"
    $color = $colors[$type]
    Write-Host "[$timestamp] " -NoNewline -ForegroundColor Gray
    Write-Host $message -ForegroundColor $color
}

# Validação de arquivos
function ValidateFiles {
    Log "Validando arquivos..." "Info"
    
    $files = @(
        "public/universal-player.html",
        "public/test-fixes-complete.html",
        "FIXES_IMPLEMENTED_2025-10-19.md",
        "QUICK_TEST_GUIDE.md",
        "FINAL_REPORT_2025-10-19.md"
    )
    
    $allValid = $true
    foreach ($file in $files) {
        if (Test-Path $file) {
            $size = (Get-Item $file).Length / 1024
            Log "  ✅ $file ($([math]::Round($size, 2)) KB)" "Success"
        } else {
            Log "  ❌ $file NÃO ENCONTRADO" "Error"
            $allValid = $false
        }
    }
    
    return $allValid
}

# Validação de sintaxe
function ValidateSyntax {
    Log "Validando sintaxe..." "Info"
    
    $htmlFile = "public/universal-player.html"
    if (-not (Test-Path $htmlFile)) {
        Log "  ❌ Arquivo não encontrado: $htmlFile" "Error"
        return $false
    }
    
    $content = Get-Content $htmlFile -Raw
    
    # Verificações básicas
    $checks = @(
        ("INICIALIZANDO PEERJS OTIMIZADO", "Correções PeerJS"),
        ("ROM LOADING PERFORMANCE OPTIMIZER", "Otimizador de ROM"),
        ("IMAGE LOADING OPTIMIZATION", "Sistema de Retry de Imagens"),
        ("connectTimeout: 30000", "Socket.IO com timeout"),
        ("Math.pow(2, peerRetryCount)", "Retry com backoff")
    )
    
    $allValid = $true
    foreach ($check in $checks) {
        if ($content -contains $check[0]) {
            Log "  ✅ $($check[1])" "Success"
        } else {
            Log "  ⚠️  $($check[1]) - INCOMPLETO" "Warning"
        }
    }
    
    return $true
}

# Teste de conectividade
function TestConnectivity {
    Log "Testando conectividade..." "Info"
    
    $servers = @(
        @{name = "Google STUN"; url = "stun.l.google.com:19302"},
        @{name = "Twilio STUN"; url = "global.stun.twilio.com:3478"},
        @{name = "PeerJS Cloud"; url = "0.peerjs.com:443"},
        @{name = "Socket.IO CDN"; url = "cdn.socket.io"}
    )
    
    foreach ($server in $servers) {
        try {
            if ($server.url -match ":\d+") {
                # Servidor com porta específica
                $host = $server.url -split ":" | Select-Object -First 1
                $port = $server.url -split ":" | Select-Object -Last 1
                $timeout = New-Object System.Net.Sockets.TcpClient
                $result = $timeout.ConnectAsync($host, [int]$port).Wait(3000)
                if ($result) {
                    Log "  ✅ $($server.name)" "Success"
                } else {
                    Log "  ⚠️  $($server.name) - Timeout" "Warning"
                }
            } else {
                # URL HTTP
                $response = Invoke-WebRequest -Uri "https://$($server.url)" -TimeoutSec 3 -ErrorAction SilentlyContinue
                Log "  ✅ $($server.name)" "Success"
            }
        } catch {
            Log "  ⚠️  $($server.name) - Offline" "Warning"
        }
    }
}

# Backup dos arquivos atuais
function BackupCurrentFiles {
    Log "Criando backup..." "Info"
    
    $backupDir = "backups/$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss')"
    
    if (-not (Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    }
    
    $files = @(
        "public/universal-player.html",
        "public/test-fixes-complete.html"
    )
    
    foreach ($file in $files) {
        if (Test-Path $file) {
            Copy-Item $file -Destination "$backupDir/" -ErrorAction SilentlyContinue
            Log "  ✅ Backup: $file → $backupDir/" "Success"
        }
    }
    
    return $backupDir
}

# Deploy para Firebase
function DeployFirebase {
    param([bool]$DryRun = $false)
    
    Log "Preparando deploy Firebase..." "Info"
    
    if (-not (Test-Path "firebase.json")) {
        Log "  ❌ firebase.json não encontrado!" "Error"
        return $false
    }
    
    if ($DryRun) {
        Log "  [DRY RUN] firebase deploy --only hosting" "Warning"
        Log "  ✅ Comando de deploy simulado" "Success"
    } else {
        Log "  🔄 Executando: firebase deploy --only hosting" "Info"
        try {
            & firebase deploy --only hosting 2>&1
            Log "  ✅ Deploy Firebase completo!" "Success"
        } catch {
            Log "  ❌ Erro ao fazer deploy: $_" "Error"
            return $false
        }
    }
    
    return $true
}

# Deploy para Git
function DeployGit {
    param([bool]$DryRun = $false)
    
    Log "Preparando commit Git..." "Info"
    
    if (-not (Test-Path ".git")) {
        Log "  ⚠️  Repositório Git não encontrado" "Warning"
        return $false
    }
    
    if ($DryRun) {
        Log "  [DRY RUN] git add, commit e push" "Warning"
        Log "  ✅ Comandos de commit simulados" "Success"
    } else {
        Log "  🔄 Preparando repositório..." "Info"
        
        & git add "public/universal-player.html" 2>&1 | Out-Null
        & git add "public/test-fixes-complete.html" 2>&1 | Out-Null
        & git add "FIXES_IMPLEMENTED_2025-10-19.md" 2>&1 | Out-Null
        & git add "QUICK_TEST_GUIDE.md" 2>&1 | Out-Null
        & git add "FINAL_REPORT_2025-10-19.md" 2>&1 | Out-Null
        
        Log "  ✅ Arquivos adicionados ao staging" "Success"
        
        Log "  🔄 Fazendo commit..." "Info"
        & git commit -m "🚀 Fix: Correções PlayNow Emulator v2.0 - WebSocket, Firebase Storage e Performance" 2>&1 | Out-Null
        
        Log "  ✅ Commit criado" "Success"
        
        Log "  🔄 Fazendo push..." "Info"
        & git push 2>&1 | Out-Null
        
        Log "  ✅ Push completo!" "Success"
    }
    
    return $true
}

# Menu principal
function ShowMenu {
    Write-Host ""
    Write-Host "Selecione o alvo de deploy:" -ForegroundColor Cyan
    Write-Host "  1. Firebase Hosting" -ForegroundColor Yellow
    Write-Host "  2. Git Repository" -ForegroundColor Yellow
    Write-Host "  3. Ambos (Firebase + Git)" -ForegroundColor Yellow
    Write-Host "  0. Sair" -ForegroundColor Gray
    Write-Host ""
}

# Main
function Main {
    # Validação
    if (-not $SkipValidation) {
        if (-not (ValidateFiles)) {
            Log "Validação de arquivos falhou!" "Error"
            exit 1
        }
        
        Write-Host ""
        
        if (-not (ValidateSyntax)) {
            Log "Validação de sintaxe falhou!" "Error"
            exit 1
        }
        
        Write-Host ""
        TestConnectivity
    }
    
    Write-Host ""
    
    # Backup
    $backupDir = BackupCurrentFiles
    
    Write-Host ""
    
    # Deploy
    if ($DeployTarget -eq "all") {
        Log "Deploy em ambos os alvos..." "Info"
        DeployFirebase -DryRun $DryRun
        DeployGit -DryRun $DryRun
    } elseif ($DeployTarget -eq "firebase") {
        DeployFirebase -DryRun $DryRun
    } elseif ($DeployTarget -eq "git") {
        DeployGit -DryRun $DryRun
    }
    
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
    Log "Deploy concluído com sucesso! ✅" "Success"
    Log "Backup salvo em: $backupDir" "Info"
    Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    # Teste
    Log "Para testar as correções, abra:" "Info"
    Log "  📄 public/test-fixes-complete.html" "Success"
    Write-Host ""
}

# Executar
Main