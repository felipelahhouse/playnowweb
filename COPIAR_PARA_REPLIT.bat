@echo off
echo ========================================
echo   COPIAR ARQUIVOS PARA REPLIT
echo ========================================
echo.
echo Este script vai abrir os arquivos que voce precisa copiar.
echo.
echo Instrucoes:
echo 1. Cada arquivo sera aberto no Notepad
echo 2. Pressione Ctrl+A (selecionar tudo)
echo 3. Pressione Ctrl+C (copiar)
echo 4. Cole no Replit (Ctrl+V)
echo 5. Feche o Notepad para abrir o proximo arquivo
echo.
pause

echo.
echo Abrindo arquivo 1/3: main.py
echo.
notepad "%~dp0replit-server\main.py"

echo.
echo Abrindo arquivo 2/3: requirements.txt
echo.
notepad "%~dp0replit-server\requirements.txt"

echo.
echo Abrindo arquivo 3/3: .replit
echo.
notepad "%~dp0replit-server\.replit"

echo.
echo ========================================
echo   CONCLUIDO!
echo ========================================
echo.
echo Agora:
echo 1. Acesse: https://replit.com
echo 2. Abra seu projeto
echo 3. Cole os arquivos que voce copiou
echo 4. Clique em RUN
echo 5. Teste: https://9d82cbde-f257-42c0-a522-97242fdf17c9-00-3qtza34279pqe.worf.replit.dev/health
echo.
pause
