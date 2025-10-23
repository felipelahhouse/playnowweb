#!/bin/bash

echo "🔍 VERIFICANDO CONFIGURAÇÃO DO FIREBASE AUTHENTICATION"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Verificar projeto
echo "📦 PROJETO FIREBASE:"
echo "   Nome: planowemulator"
echo "   URL Console: https://console.firebase.google.com/project/planowemulator"
echo ""

# 2. Verificar usuários cadastrados
echo "👥 USUÁRIOS CADASTRADOS:"
npx firebase-tools auth:export users.json --project planowemulator 2>&1 | grep -E "(Exporting|Exported)"
echo ""

# 3. Mostrar métodos de autenticação
echo "🔐 MÉTODOS DE AUTENTICAÇÃO A ATIVAR:"
echo ""
echo "   1️⃣ Email/Password (OBRIGATÓRIO)"
echo "      URL: https://console.firebase.google.com/project/planowemulator/authentication/providers"
echo "      Status: ⚠️ VOCÊ PRECISA VERIFICAR SE ESTÁ ATIVADO"
echo ""
echo "   2️⃣ Google Sign-In (OPCIONAL)"
echo "      URL: https://console.firebase.google.com/project/planowemulator/authentication/providers"
echo "      Status: ⚠️ VOCÊ PRECISA VERIFICAR SE ESTÁ ATIVADO"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 PASSO A PASSO PARA ATIVAR:"
echo ""
echo "1. Abra: https://console.firebase.google.com/project/planowemulator/authentication/providers"
echo ""
echo "2. Encontre 'Email/Password' na lista"
echo ""
echo "3. Clique no ícone de lápis (editar)"
echo ""
echo "4. Ative a opção 'Enable'"
echo ""
echo "5. Clique em 'Save'"
echo ""
echo "6. (OPCIONAL) Faça o mesmo para 'Google'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🧪 TESTAR DEPOIS DE ATIVAR:"
echo ""
echo "1. Acesse: https://planowemulator.web.app"
echo "2. Tente criar uma conta nova"
echo "3. Se funcionar = ✅ Tudo certo!"
echo "4. Se der erro = ❌ Me manda o log do console"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Limpar arquivo temporário
rm -f users.json
