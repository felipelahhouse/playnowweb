# Script para verificar e guiar a configuração do Google Sign-In
# Execute este script para ver o status da configuração

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   VERIFICAÇÃO: Login com Google" -ForegroundColor Cyan
Write-Host "   PLAYnowemulator - Firebase Auth" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Firebase CLI está instalado
Write-Host "1. Verificando Firebase CLI..." -ForegroundColor Yellow
$firebaseInstalled = Get-Command firebase -ErrorAction SilentlyContinue
if ($firebaseInstalled) {
    Write-Host "   ✅ Firebase CLI instalado" -ForegroundColor Green
} else {
    Write-Host "   ❌ Firebase CLI não encontrado" -ForegroundColor Red
    Write-Host "   Instale com: npm install -g firebase-tools" -ForegroundColor Yellow
    exit
}

Write-Host ""

# Verificar projeto Firebase
Write-Host "2. Projeto Firebase atual:" -ForegroundColor Yellow
firebase projects:list
Write-Host ""

# Verificar configuração do Firebase no código
Write-Host "3. Verificando configuração do Firebase..." -ForegroundColor Yellow
$firebaseConfigPath = "src\lib\firebase.ts"
if (Test-Path $firebaseConfigPath) {
    Write-Host "   ✅ Arquivo firebase.ts encontrado" -ForegroundColor Green
    
    $content = Get-Content $firebaseConfigPath -Raw
    
    # Verificar authDomain
    if ($content -match 'authDomain:\s*"([^"]+)"') {
        $authDomain = $matches[1]
        Write-Host "   authDomain: $authDomain" -ForegroundColor Cyan
    }
    
    # Verificar projectId
    if ($content -match 'projectId:\s*"(.+?)"') {
        $projectId = $matches[1]
        Write-Host "   projectId: $projectId" -ForegroundColor Cyan
    }
} else {
    Write-Host "   ❌ Arquivo firebase.ts não encontrado" -ForegroundColor Red
}

Write-Host ""

# Instruções para configuração manual
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   AÇÕES NECESSÁRIAS NO FIREBASE CONSOLE" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 PASSO A PASSO:" -ForegroundColor Yellow
Write-Host ""

Write-Host "1️⃣  Abra o Firebase Console:" -ForegroundColor White
Write-Host "   https://console.firebase.google.com/project/planowemulator" -ForegroundColor Blue
Write-Host ""

Write-Host "2️⃣  Vá para Authentication > Settings > Authorized domains" -ForegroundColor White
Write-Host "   Adicione estes domínios:" -ForegroundColor Yellow
Write-Host "   ✅ playnowemulator.com" -ForegroundColor Green
Write-Host "   ✅ www.playnowemulator.com" -ForegroundColor Green
Write-Host "   ✅ planowemulator.firebaseapp.com" -ForegroundColor Green
Write-Host "   ✅ planowemulator.web.app" -ForegroundColor Green
Write-Host "   ✅ localhost" -ForegroundColor Green
Write-Host ""

Write-Host "3️⃣  Vá para Authentication > Sign-in method" -ForegroundColor White
Write-Host "   Ative o provider 'Google'" -ForegroundColor Yellow
Write-Host "   Preencha o 'Project support email'" -ForegroundColor Yellow
Write-Host ""

Write-Host "4️⃣  Configure OAuth no Google Cloud Console:" -ForegroundColor White
Write-Host "   https://console.cloud.google.com/apis/credentials?project=planowemulator" -ForegroundColor Blue
Write-Host ""
Write-Host "   A) OAuth consent screen:" -ForegroundColor Yellow
Write-Host "      - User Type: External" -ForegroundColor Gray
Write-Host "      - App name: PLAYnowemulator" -ForegroundColor Gray
Write-Host "      - Authorized domains: playnowemulator.com" -ForegroundColor Gray
Write-Host ""
Write-Host "   B) Credentials > OAuth 2.0 Client ID:" -ForegroundColor Yellow
Write-Host "      Authorized JavaScript origins:" -ForegroundColor Gray
Write-Host "        https://playnowemulator.com" -ForegroundColor Gray
Write-Host "        https://www.playnowemulator.com" -ForegroundColor Gray
Write-Host "        https://planowemulator.firebaseapp.com" -ForegroundColor Gray
Write-Host "        https://planowemulator.web.app" -ForegroundColor Gray
Write-Host "        http://localhost:5173" -ForegroundColor Gray
Write-Host ""
Write-Host "      Authorized redirect URIs:" -ForegroundColor Gray
Write-Host "        https://playnowemulator.com/__/auth/handler" -ForegroundColor Gray
Write-Host "        https://www.playnowemulator.com/__/auth/handler" -ForegroundColor Gray
Write-Host "        https://planowemulator.firebaseapp.com/__/auth/handler" -ForegroundColor Gray
Write-Host "        https://planowemulator.web.app/__/auth/handler" -ForegroundColor Gray
Write-Host "        http://localhost:5173/__/auth/handler" -ForegroundColor Gray
Write-Host ""

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   APÓS CONFIGURAR NO CONSOLE" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "5️⃣  Aguarde 2-5 minutos para as mudanças propagarem" -ForegroundColor White
Write-Host ""

Write-Host "6️⃣  Execute os comandos para testar:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Yellow
Write-Host "   Abra: http://localhost:5173" -ForegroundColor Blue
Write-Host "   Teste o login com Google" -ForegroundColor Yellow
Write-Host ""

Write-Host "7️⃣  Se funcionar localmente, faça deploy:" -ForegroundColor White
Write-Host "   npm run build" -ForegroundColor Yellow
Write-Host "   firebase deploy --only hosting" -ForegroundColor Yellow
Write-Host ""

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   VERIFICAÇÃO DE ERROS COMUNS" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "❌ Se aparecer 'popup-blocked':" -ForegroundColor Red
Write-Host "   → Desbloquear pop-ups no navegador" -ForegroundColor Yellow
Write-Host ""

Write-Host "❌ Se aparecer 'auth/unauthorized-domain':" -ForegroundColor Red
Write-Host "   → Adicionar domínio nos Authorized domains" -ForegroundColor Yellow
Write-Host ""

Write-Host "❌ Se aparecer 'auth/operation-not-allowed':" -ForegroundColor Red
Write-Host "   → Ativar Google Provider no Firebase" -ForegroundColor Yellow
Write-Host ""

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Para mais detalhes, veja:" -ForegroundColor White
Write-Host "   CORRECAO_LOGIN_GOOGLE_URGENTE.md" -ForegroundColor Yellow
Write-Host ""

# Perguntar se quer abrir o console
Write-Host "Deseja abrir o Firebase Console agora? (S/N): " -ForegroundColor Cyan -NoNewline
$response = Read-Host
if ($response -eq "S" -or $response -eq "s") {
    Start-Process "https://console.firebase.google.com/project/planowemulator/authentication/providers"
    Start-Sleep -Seconds 2
    Start-Process "https://console.cloud.google.com/apis/credentials?project=planowemulator"
}

Write-Host ""
Write-Host "✅ Script concluído!" -ForegroundColor Green
Write-Host ""
