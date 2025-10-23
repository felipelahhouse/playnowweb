# Script Simplificado - Upload Replit
# PlayNow Emulator - Multiplayer Server Setup

Write-Host "============================================"
Write-Host "  UPLOAD PARA REPLIT - VERSAO SIMPLES"
Write-Host "============================================"
Write-Host ""

$mainPyPath = ".\replit-server\main.py"
$requirementsPath = ".\replit-server\requirements.txt"

Write-Host "OPCAO 1: Copiar main.py" -ForegroundColor Green
Write-Host "OPCAO 2: Copiar requirements.txt" -ForegroundColor Green
Write-Host "OPCAO 3: Abrir Replit" -ForegroundColor Yellow
Write-Host ""

$opcao = Read-Host "Escolha (1, 2 ou 3)"

if ($opcao -eq "1") {
    $content = Get-Content $mainPyPath -Raw
    Set-Clipboard -Value $content
    Write-Host ""
    Write-Host "OK! main.py copiado para clipboard!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Agora:"
    Write-Host "1. Va ate o Replit"
    Write-Host "2. Crie arquivo main.py"
    Write-Host "3. Pressione Ctrl+V para colar"
    Write-Host "4. Salve com Ctrl+S"
}
elseif ($opcao -eq "2") {
    $content = Get-Content $requirementsPath -Raw
    Set-Clipboard -Value $content
    Write-Host ""
    Write-Host "OK! requirements.txt copiado para clipboard!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Agora:"
    Write-Host "1. Va ate o Replit"
    Write-Host "2. Crie arquivo requirements.txt"
    Write-Host "3. Pressione Ctrl+V para colar"
    Write-Host "4. Salve com Ctrl+S"
    Write-Host "5. No terminal do Replit digite: pip install -r requirements.txt"
    Write-Host "6. Clique no botao Run"
}
elseif ($opcao -eq "3") {
    Write-Host ""
    Write-Host "Abrindo Replit..." -ForegroundColor Yellow
    Start-Process "https://replit.com/@felipelars/workspace-felipelars"
}

Write-Host ""
Write-Host "Pressione Enter para fechar..."
Read-Host
