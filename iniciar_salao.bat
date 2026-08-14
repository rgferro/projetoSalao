@echo off
chcp 65001 > nul
title BellaGestão Studio - Sistema de Gestão para Salão de Beleza e Estética

echo =========================================================================
echo       💈 BELLAGESTÃO STUDIO - SISTEMA DE GESTÃO PARA SALÃO 💈
echo                     (Execução 100%% Local / Offline)
echo =========================================================================
echo.

cd /d "%~dp0"

echo [1/3] Verificando dependências do backend...
if not exist "backend\node_modules" (
    echo Instalando dependências do backend pela primeira vez...
    cd backend
    call npm.cmd install
    cd ..
)

echo [2/3] Iniciando Servidor Local (SQLite + Express API)...
start "BellaGestao Backend" cmd /c "cd backend && node server.js"

echo [3/3] Aguardando inicialização do servidor local...
timeout /t 3 /nobreak > nul

echo Abrindo BellaGestão Studio no seu navegador padrão...
start http://localhost:3001

echo.
echo =========================================================================
echo  ✅ Sistema em execução com sucesso!
echo  📍 Endereço local: http://localhost:3001
echo  Para encerrar o sistema, basta fechar esta janela e a janela do servidor.
echo =========================================================================
echo.
pause
