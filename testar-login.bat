@echo off
echo.
echo ================================================
echo   TESTE AUTOMATICO - LOGIN COM GOOGLE
echo ================================================
echo.
echo Iniciando servidor local...
echo.

cd /d "%~dp0"

echo Abrindo servidor de desenvolvimento...
start cmd /k "npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo Aguardando servidor iniciar (5 segundos)...
timeout /t 5 /nobreak >nul

echo.
echo Abrindo pagina de teste no navegador...
start http://localhost:5173/test-auth.html

echo.
echo ================================================
echo   INSTRUCOES:
echo ================================================
echo.
echo 1. A pagina de teste foi aberta no navegador
echo 2. Clique no botao "Entrar com Google"
echo 3. Veja se o popup aparece
echo 4. Faca login com sua conta Google
echo.
echo ================================================
echo   ERROS COMUNS:
echo ================================================
echo.
echo X "auth/unauthorized-domain"
echo   - Volte e adicione os dominios no Passo 1
echo.
echo X "auth/operation-not-allowed"  
echo   - Volte e ative o Google no Passo 2
echo.
echo X "popup bloqueado"
echo   - Clique no icone na barra de endereco
echo   - Permita popups para localhost
echo.
echo ================================================
echo.
echo Pressione qualquer tecla para fechar...
pause >nul
