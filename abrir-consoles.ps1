# Script para abrir automaticamente todas as páginas necessárias do Firebase e Google Cloud Console
# Execute este script para abrir todas as páginas de configuração

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  ABRINDO CONSOLES DE CONFIGURACAO" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Abrindo páginas de configuração..." -ForegroundColor Yellow
Write-Host ""

# Página 1: Domínios Autorizados
Write-Host "[1/3] Firebase Authentication - Authorized Domains" -ForegroundColor Green
Start-Process "https://console.firebase.google.com/project/planowemulator/authentication/settings"
Start-Sleep -Seconds 2

# Página 2: Google Sign-In Provider
Write-Host "[2/3] Firebase Authentication - Providers" -ForegroundColor Green
Start-Process "https://console.firebase.google.com/project/planowemulator/authentication/providers"
Start-Sleep -Seconds 2

# Página 3: Google Cloud Console - OAuth
Write-Host "[3/3] Google Cloud Console - OAuth Credentials" -ForegroundColor Green
Start-Process "https://console.cloud.google.com/apis/credentials?project=planowemulator"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  PAGINAS ABERTAS NO NAVEGADOR!" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Siga as instrucoes no arquivo:" -ForegroundColor Yellow
Write-Host "  CONFIGURAR_GOOGLE_LOGIN_AGORA.md" -ForegroundColor White
Write-Host ""

Write-Host "ORDEM DE CONFIGURACAO:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Authorized Domains (primeira aba)" -ForegroundColor White
Write-Host "   - Adicione: playnowemulator.com" -ForegroundColor Gray
Write-Host "   - Adicione: www.playnowemulator.com" -ForegroundColor Gray
Write-Host "   - Adicione: planowemulator.web.app" -ForegroundColor Gray
Write-Host "   - Adicione: planowemulator.firebaseapp.com" -ForegroundColor Gray
Write-Host ""

Write-Host "2. Sign-in Providers (segunda aba)" -ForegroundColor White
Write-Host "   - Clique em 'Google'" -ForegroundColor Gray
Write-Host "   - Ative o toggle 'Enable'" -ForegroundColor Gray
Write-Host "   - Selecione o email de suporte" -ForegroundColor Gray
Write-Host "   - Clique em 'Save'" -ForegroundColor Gray
Write-Host ""

Write-Host "3. Google Cloud Console (terceira aba)" -ForegroundColor White
Write-Host "   - Configure OAuth Consent Screen" -ForegroundColor Gray
Write-Host "   - Configure OAuth Client ID" -ForegroundColor Gray
Write-Host "   - Adicione os URIs autorizados" -ForegroundColor Gray
Write-Host ""

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Deseja abrir o arquivo de instrucoes? (S/N): " -ForegroundColor Yellow -NoNewline
$response = Read-Host

if ($response -eq "S" -or $response -eq "s") {
    notepad "CONFIGURAR_GOOGLE_LOGIN_AGORA.md"
}

Write-Host ""
Write-Host "Concluido! Boa configuracao!" -ForegroundColor Green
Write-Host ""
