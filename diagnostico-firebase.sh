#!/bin/bash

echo "🔍 DIAGNÓSTICO COMPLETO - CRIAÇÃO DE CONTAS"
echo "============================================"
echo ""

# 1. Verificar configuração Firebase
echo "1️⃣ Configuração Firebase (.env):"
echo "-----------------------------------"
grep FIREBASE .env | sed 's/=.*/=***/' || echo "❌ Arquivo .env não encontrado!"
echo ""

# 2. Verificar se o projeto existe no Firebase
echo "2️⃣ Verificando projeto Firebase:"
echo "-----------------------------------"
if command -v firebase &> /dev/null; then
    npx firebase-tools projects:list 2>&1 | grep planowemulator || echo "⚠️ Projeto não encontrado na lista"
else
    echo "Firebase CLI não instalado"
fi
echo ""

# 3. Verificar regras do Firestore
echo "3️⃣ Regras do Firestore (firestore.rules):"
echo "-----------------------------------"
if [ -f "firestore.rules" ]; then
    echo "✅ Arquivo existe"
    echo ""
    cat firestore.rules | grep -A 5 "match /users"
else
    echo "❌ Arquivo firestore.rules não encontrado!"
fi
echo ""

# 4. Testar conectividade com Firebase
echo "4️⃣ Testando conectividade com Firebase:"
echo "-----------------------------------"
curl -s "https://planowemulator.firebaseapp.com" -o /dev/null -w "Status HTTP: %{http_code}\n"
echo ""

# 5. Verificar último deploy
echo "5️⃣ Último deploy Firebase:"
echo "-----------------------------------"
if [ -d ".firebase" ]; then
    echo "✅ Diretório .firebase existe"
    ls -lh .firebase/ 2>/dev/null | tail -3
else
    echo "❌ Diretório .firebase não encontrado!"
fi
echo ""

# 6. Verificar build
echo "6️⃣ Status do último build:"
echo "-----------------------------------"
if [ -d "dist" ]; then
    echo "✅ Diretório dist existe"
    echo "Arquivos principais:"
    ls -lh dist/*.html dist/assets/*.js 2>/dev/null | head -5
    echo ""
    echo "Total de arquivos: $(find dist -type f | wc -l)"
else
    echo "❌ Diretório dist não encontrado! Execute: npm run build"
fi
echo ""

# 7. Verificar dependências
echo "7️⃣ Dependências Firebase instaladas:"
echo "-----------------------------------"
if [ -f "package.json" ]; then
    cat package.json | grep -A 3 '"firebase"' || echo "❌ Firebase não está no package.json!"
else
    echo "❌ package.json não encontrado!"
fi
echo ""

# 8. Instruções para ativar Email/Password
echo "8️⃣ CHECKLIST - ATIVE NO FIREBASE CONSOLE:"
echo "=========================================="
echo ""
echo "🔗 Abra este link:"
echo "https://console.firebase.google.com/project/planowemulator/authentication/providers"
echo ""
echo "✅ Verifique se está ATIVADO:"
echo "  [ ] Email/Password"
echo "  [ ] Google (opcional)"
echo ""
echo "🔗 Depois abra este link:"
echo "https://console.firebase.google.com/project/planowemulator/authentication/settings"
echo ""
echo "✅ Verifique Domínios Autorizados:"
echo "  [ ] planowemulator.web.app"
echo "  [ ] planowemulator.firebaseapp.com"
echo "  [ ] localhost"
echo ""

# 9. Teste prático
echo "9️⃣ TESTE AGORA:"
echo "=========================================="
echo ""
echo "Abra este arquivo no navegador:"
echo "file://$(pwd)/test-firebase-auth.html"
echo ""
echo "Ou execute:"
echo "open test-firebase-auth.html"
echo ""

echo "✅ Diagnóstico completo!"
