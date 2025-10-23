# Configuracao Automatica do Google Sign-In
# PlayNow Emulator

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Google Sign-In - Configuracao Automatica" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$PROJECT_ID = "planowemulator"
$CUSTOM_DOMAIN = "playnowemulator.com"
$WWW_DOMAIN = "www.playnowemulator.com"

Write-Host "Projeto: $PROJECT_ID" -ForegroundColor Yellow
Write-Host "Dominio: $CUSTOM_DOMAIN" -ForegroundColor Yellow
Write-Host ""

# Verificar autenticacao
Write-Host "[1/3] Verificando autenticacao Firebase..." -ForegroundColor Cyan
firebase projects:list > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Nao esta logado no Firebase CLI" -ForegroundColor Red
    Write-Host "Execute: firebase login" -ForegroundColor Yellow
    exit 1
}
Write-Host "OK - Autenticado!" -ForegroundColor Green
Write-Host ""

# Passo 1: Ativar Google Sign-In
Write-Host "[2/3] Ativando Google Sign-In Provider..." -ForegroundColor Cyan
Write-Host ""
Write-Host "ABRA ESTE LINK:" -ForegroundColor Yellow
Write-Host "https://console.firebase.google.com/project/$PROJECT_ID/authentication/providers" -ForegroundColor Blue
Write-Host ""
Write-Host "Faca:" -ForegroundColor White
Write-Host "  1. Clique em 'Google'" -ForegroundColor White
Write-Host "  2. Ative o toggle 'Enable'" -ForegroundColor White
Write-Host "  3. Configure o email de suporte" -ForegroundColor White
Write-Host "  4. Clique em 'Save'" -ForegroundColor White
Write-Host ""

# Abrir automaticamente
Start-Process "https://console.firebase.google.com/project/$PROJECT_ID/authentication/providers"

$response = Read-Host "Ja fez isso? (s/n)"
if ($response -ne "s") {
    Write-Host "Configure primeiro e execute novamente" -ForegroundColor Red
    exit 1
}
Write-Host "OK - Google Sign-In ativado!" -ForegroundColor Green
Write-Host ""

# Passo 2: Adicionar dominios
Write-Host "[3/3] Adicionando dominios autorizados..." -ForegroundColor Cyan
Write-Host ""
Write-Host "ABRA ESTE LINK:" -ForegroundColor Yellow
Write-Host "https://console.firebase.google.com/project/$PROJECT_ID/authentication/settings" -ForegroundColor Blue
Write-Host ""
Write-Host "Faca:" -ForegroundColor White
Write-Host "  1. Role ate 'Authorized domains'" -ForegroundColor White
Write-Host "  2. Clique em 'Add domain'" -ForegroundColor White
Write-Host "  3. Adicione: $CUSTOM_DOMAIN" -ForegroundColor Cyan
Write-Host "  4. Clique em 'Add domain' novamente" -ForegroundColor White
Write-Host "  5. Adicione: $WWW_DOMAIN" -ForegroundColor Cyan
Write-Host ""

# Abrir automaticamente
Start-Process "https://console.firebase.google.com/project/$PROJECT_ID/authentication/settings"

$response = Read-Host "Ja fez isso? (s/n)"
if ($response -ne "s") {
    Write-Host "Configure primeiro e execute novamente" -ForegroundColor Red
    exit 1
}
Write-Host "OK - Dominios adicionados!" -ForegroundColor Green
Write-Host ""

# Passo 3: OAuth Google Cloud
Write-Host "[4/4] Configurando OAuth no Google Cloud..." -ForegroundColor Cyan
Write-Host ""
Write-Host "ABRA ESTE LINK:" -ForegroundColor Yellow
Write-Host "https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID" -ForegroundColor Blue
Write-Host ""
Write-Host "Faca:" -ForegroundColor White
Write-Host "  1. Clique no OAuth 2.0 Client ID" -ForegroundColor White
Write-Host "  2. Em 'Authorized JavaScript origins', adicione:" -ForegroundColor White
Write-Host "     - https://$CUSTOM_DOMAIN" -ForegroundColor Cyan
Write-Host "     - https://$WWW_DOMAIN" -ForegroundColor Cyan
Write-Host "  3. Em 'Authorized redirect URIs', adicione:" -ForegroundColor White
Write-Host "     - https://$CUSTOM_DOMAIN/__/auth/handler" -ForegroundColor Cyan
Write-Host "     - https://$WWW_DOMAIN/__/auth/handler" -ForegroundColor Cyan
Write-Host "  4. Clique em 'Save'" -ForegroundColor White
Write-Host ""

# Abrir automaticamente
Start-Process "https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"

$response = Read-Host "Ja fez isso? (s/n)"
if ($response -ne "s") {
    Write-Host "Configure primeiro e execute novamente" -ForegroundColor Red
    exit 1
}
Write-Host "OK - OAuth configurado!" -ForegroundColor Green
Write-Host ""

# Conclusao
Write-Host "========================================" -ForegroundColor Green
Write-Host "  CONFIGURACAO CONCLUIDA!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Aguarde 5-10 minutos para propagacao" -ForegroundColor Yellow
Write-Host ""
Write-Host "Para testar, acesse:" -ForegroundColor Cyan
Write-Host "https://$CUSTOM_DOMAIN/test-google-auth.html" -ForegroundColor Blue
Write-Host ""
Write-Host "Dica: Limpe o cache do navegador antes de testar" -ForegroundColor Yellow
Write-Host ""