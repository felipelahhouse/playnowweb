# Script PowerShell para Upload Facilitado no Replit
# PlayNow Emulator - Multiplayer Server Setup
# Data: 17/10/2025

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  UPLOAD AUTOMÁTICO PARA REPLIT" -ForegroundColor Yellow
Write-Host "  PlayNow Multiplayer Server v2.0.0" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se os arquivos existem
$mainPyPath = Join-Path $PSScriptRoot "replit-server\main.py"
$requirementsPath = Join-Path $PSScriptRoot "replit-server\requirements.txt"

if (-not (Test-Path $mainPyPath)) {
    Write-Host "❌ ERRO: Arquivo main.py não encontrado!" -ForegroundColor Red
    Write-Host "   Caminho esperado: $mainPyPath" -ForegroundColor Yellow
    pause
    exit 1
}

if (-not (Test-Path $requirementsPath)) {
    Write-Host "❌ ERRO: Arquivo requirements.txt não encontrado!" -ForegroundColor Red
    Write-Host "   Caminho esperado: $requirementsPath" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✅ Arquivos encontrados!" -ForegroundColor Green
Write-Host ""

# Função para copiar para clipboard
function Copy-ToClipboard {
    param([string]$text)
    Set-Clipboard -Value $text
}

# Menu interativo
Write-Host "ESCOLHA UMA OPÇÃO:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1 - Copiar main.py e abrir Replit (RECOMENDADO)" -ForegroundColor Green
Write-Host "2 - Copiar requirements.txt e abrir Replit" -ForegroundColor Green
Write-Host "3 - Copiar TUDO (main.py + requirements.txt)" -ForegroundColor Yellow
Write-Host "4 - Apenas abrir Replit" -ForegroundColor White
Write-Host "5 - Ver código do main.py" -ForegroundColor Gray
Write-Host "6 - Sair" -ForegroundColor Red
Write-Host ""

$choice = Read-Host "Digite o número da opção"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "📋 Copiando main.py para clipboard..." -ForegroundColor Yellow
        $mainPyContent = Get-Content $mainPyPath -Raw
        Copy-ToClipboard $mainPyContent
        Write-Host "✅ main.py copiado!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🌐 Abrindo Replit..." -ForegroundColor Yellow
        Start-Process "https://replit.com/@felipelars/workspace-felipelars"
        Write-Host ""
        Write-Host "============================================" -ForegroundColor Cyan
        Write-Host "  PRÓXIMOS PASSOS:" -ForegroundColor Yellow
        Write-Host "============================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "1. No Replit, clique em 'Files' no lado esquerdo" -ForegroundColor White
        Write-Host "2. Clique no botão '+' ou 'Add file'" -ForegroundColor White
        Write-Host "3. Digite o nome: main.py" -ForegroundColor White
        Write-Host "4. Pressione Ctrl+A (selecionar tudo)" -ForegroundColor White
        Write-Host "5. Pressione Ctrl+V (colar o código)" -ForegroundColor Green
        Write-Host "6. Pressione Ctrl+S (salvar)" -ForegroundColor White
        Write-Host ""
        Write-Host "7. Execute este script novamente e escolha opção 2" -ForegroundColor Cyan
        Write-Host "   para copiar o requirements.txt" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "============================================" -ForegroundColor Cyan
    }
    
    "2" {
        Write-Host ""
        Write-Host "📋 Copiando requirements.txt para clipboard..." -ForegroundColor Yellow
        $requirementsContent = Get-Content $requirementsPath -Raw
        Copy-ToClipboard $requirementsContent
        Write-Host "✅ requirements.txt copiado!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🌐 Abrindo Replit..." -ForegroundColor Yellow
        Start-Process "https://replit.com/@felipelars/workspace-felipelars"
        Write-Host ""
        Write-Host "============================================" -ForegroundColor Cyan
        Write-Host "  PRÓXIMOS PASSOS:" -ForegroundColor Yellow
        Write-Host "============================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "1. No Replit, clique em 'Add file'" -ForegroundColor White
        Write-Host "2. Digite o nome: requirements.txt" -ForegroundColor White
        Write-Host "3. Pressione Ctrl+V (colar o conteúdo)" -ForegroundColor Green
        Write-Host "4. Pressione Ctrl+S (salvar)" -ForegroundColor White
        Write-Host ""
        Write-Host "5. Abra o 'Shell' (terminal) no Replit" -ForegroundColor Cyan
        Write-Host "6. Digite: pip install -r requirements.txt" -ForegroundColor Yellow
        Write-Host "7. Aguarde a instalação (1-2 minutos)" -ForegroundColor White
        Write-Host ""
        Write-Host "8. Clique no botão 'Run' ▶️" -ForegroundColor Green
        Write-Host ""
        Write-Host "============================================" -ForegroundColor Cyan
    }
    
    "3" {
        Write-Host ""
        Write-Host "📋 Preparando TODOS os arquivos..." -ForegroundColor Yellow
        Write-Host ""
        
        # Copiar main.py primeiro
        $mainPyContent = Get-Content $mainPyPath -Raw
        Copy-ToClipboard $mainPyContent
        Write-Host "✅ main.py copiado para clipboard!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Pressione ENTER depois de colar o main.py no Replit..." -ForegroundColor Yellow
        Read-Host
        
        # Depois copiar requirements.txt
        $requirementsContent = Get-Content $requirementsPath -Raw
        Copy-ToClipboard $requirementsContent
        Write-Host "✅ requirements.txt copiado para clipboard!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Agora cole o requirements.txt no Replit!" -ForegroundColor Yellow
        Write-Host ""
        
        Write-Host "🌐 Abrindo Replit..." -ForegroundColor Yellow
        Start-Process "https://replit.com/@felipelars/workspace-felipelars"
    }
    
    "4" {
        Write-Host ""
        Write-Host "🌐 Abrindo Replit..." -ForegroundColor Yellow
        Start-Process "https://replit.com/@felipelars/workspace-felipelars"
        Write-Host ""
        Write-Host "✅ Navegador aberto!" -ForegroundColor Green
    }
    
    "5" {
        Write-Host ""
        Write-Host "============================================" -ForegroundColor Cyan
        Write-Host "  CONTEÚDO DO main.py (primeiras 50 linhas)" -ForegroundColor Yellow
        Write-Host "============================================" -ForegroundColor Cyan
        Write-Host ""
        Get-Content $mainPyPath | Select-Object -First 50
        Write-Host ""
        Write-Host "... (arquivo completo tem 356 linhas)" -ForegroundColor Gray
        Write-Host ""
    }
    
    "6" {
        Write-Host ""
        Write-Host "Saindo..." -ForegroundColor Yellow
        exit 0
    }
    
    default {
        Write-Host ""
        Write-Host "❌ Opção inválida!" -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host ""
Write-Host "Pressione qualquer tecla para fechar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
