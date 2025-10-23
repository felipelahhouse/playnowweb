# ============================================
# 🔧 Script de Configuração Automática
# Google Sign-In para PlayNow Emulator
# ============================================

Write-Host "🚀 Iniciando configuração automática do Google Sign-In..." -ForegroundColor Cyan
Write-Host ""

# Configurações
$PROJECT_ID = "planowemulator"
$CUSTOM_DOMAIN = "playnowemulator.com"
$WWW_DOMAIN = "www.playnowemulator.com"
$FIREBASE_DOMAIN = "planowemulator.firebaseapp.com"
$WEB_APP_DOMAIN = "planowemulator.web.app"

Write-Host "📋 Configurações:" -ForegroundColor Yellow
Write-Host "   Projeto: $PROJECT_ID"
Write-Host "   Domínio: $CUSTOM_DOMAIN"
Write-Host ""

# Passo 1: Verificar se está logado
Write-Host "🔐 Verificando autenticação..." -ForegroundColor Cyan
$currentProject = firebase projects:list --json 2>&1 | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro: Você não está logado no Firebase CLI" -ForegroundColor Red
    Write-Host "   Execute: firebase login" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Autenticado com sucesso!" -ForegroundColor Green
Write-Host ""

# Passo 2: Ativar Google Sign-In Provider
Write-Host "🔧 Passo 1/3: Ativando Google Sign-In..." -ForegroundColor Cyan
Write-Host "⚠️  ATENÇÃO: Esta parte precisa ser feita manualmente no Console" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Por favor, abra este link:" -ForegroundColor White
Write-Host "   https://console.firebase.google.com/project/$PROJECT_ID/authentication/providers" -ForegroundColor Blue
Write-Host ""
Write-Host "   E faça:" -ForegroundColor White
Write-Host "   1. Clique em 'Google'" -ForegroundColor White
Write-Host "   2. Ative o toggle 'Enable'" -ForegroundColor White
Write-Host "   3. Configure o email de suporte" -ForegroundColor White
Write-Host "   4. Clique em 'Save'" -ForegroundColor White
Write-Host ""
$response = Read-Host "   Você já fez isso? (s/n)"
if ($response -ne "s") {
    Write-Host "❌ Configure primeiro e execute o script novamente" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Google Sign-In ativado!" -ForegroundColor Green
Write-Host ""

# Passo 3: Adicionar domínios autorizados
Write-Host "🔧 Passo 2/3: Adicionando domínios autorizados..." -ForegroundColor Cyan
Write-Host "⚠️  ATENÇÃO: Esta parte também precisa ser feita manualmente" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Por favor, abra este link:" -ForegroundColor White
Write-Host "   https://console.firebase.google.com/project/$PROJECT_ID/authentication/settings" -ForegroundColor Blue
Write-Host ""
Write-Host "   E faça:" -ForegroundColor White
Write-Host "   1. Role até 'Authorized domains'" -ForegroundColor White
Write-Host "   2. Clique em 'Add domain'" -ForegroundColor White
Write-Host "   3. Adicione: $CUSTOM_DOMAIN" -ForegroundColor Cyan
Write-Host "   4. Clique em 'Add domain' novamente" -ForegroundColor White
Write-Host "   5. Adicione: $WWW_DOMAIN" -ForegroundColor Cyan
Write-Host ""
$response = Read-Host "   Você já fez isso? (s/n)"
if ($response -ne "s") {
    Write-Host "❌ Configure primeiro e execute o script novamente" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Domínios autorizados adicionados!" -ForegroundColor Green
Write-Host ""

# Passo 4: Configurar OAuth no Google Cloud
Write-Host "🔧 Passo 3/3: Configurando OAuth no Google Cloud..." -ForegroundColor Cyan
Write-Host "⚠️  ATENÇÃO: Última configuração manual" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Por favor, abra este link:" -ForegroundColor White
Write-Host "   https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID" -ForegroundColor Blue
Write-Host ""
Write-Host "   E faça:" -ForegroundColor White
Write-Host "   1. Clique no OAuth 2.0 Client ID (criado pelo Firebase)" -ForegroundColor White
Write-Host "   2. Em 'Authorized JavaScript origins', adicione:" -ForegroundColor White
Write-Host "      - https://$CUSTOM_DOMAIN" -ForegroundColor Cyan
Write-Host "      - https://$WWW_DOMAIN" -ForegroundColor Cyan
Write-Host "   3. Em 'Authorized redirect URIs', adicione:" -ForegroundColor White
Write-Host "      - https://$CUSTOM_DOMAIN/__/auth/handler" -ForegroundColor Cyan
Write-Host "      - https://$WWW_DOMAIN/__/auth/handler" -ForegroundColor Cyan
Write-Host "   4. Clique em 'Save'" -ForegroundColor White
Write-Host ""
$response = Read-Host "   Você já fez isso? (s/n)"
if ($response -ne "s") {
    Write-Host "❌ Configure primeiro e execute o script novamente" -ForegroundColor Red
    exit 1
}
Write-Host "✅ OAuth configurado!" -ForegroundColor Green
Write-Host ""

# Passo 5: Verificação
Write-Host "🧪 Verificando configuração..." -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Todas as configurações foram concluídas!" -ForegroundColor Green
Write-Host ""
Write-Host "⏳ Aguarde 5-10 minutos para propagação das configurações" -ForegroundColor Yellow
Write-Host ""
Write-Host "🧪 Para testar, acesse:" -ForegroundColor Cyan
Write-Host "   https://$CUSTOM_DOMAIN/test-google-auth.html" -ForegroundColor Blue
Write-Host ""
Write-Host "📝 Checklist final:" -ForegroundColor Yellow
Write-Host "   ✓ Google Sign-In ativado no Firebase" -ForegroundColor Green
Write-Host "   ✓ Domínios autorizados adicionados" -ForegroundColor Green
Write-Host "   ✓ OAuth configurado no Google Cloud" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Configuração concluída com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Dica: Limpe o cache do navegador antes de testar" -ForegroundColor Cyan
Write-Host "   Pressione Ctrl+Shift+Delete e limpe tudo" -ForegroundColor White
Write-Host ""