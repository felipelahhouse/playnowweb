@echo off
echo ========================================
echo  EMULATORJS MULTIPLAYER SERVER
echo ========================================
echo.
echo Iniciando servidor Socket.IO...
echo.

cd emulatorjs-multiplayer

REM Verificar se node_modules existe
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
    echo.
)

echo Servidor rodando em: http://localhost:3000
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

node servidor-streaming.js

pause