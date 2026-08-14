@echo off
setlocal EnableDelayedExpansion
title BellaGestao Studio - Inicializador 1-Clique

cls
echo ===============================================================================
echo   BELLAGESTAO STUDIO - INICIANDO SISTEMA DE GESTAO
echo ===============================================================================
echo.

cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=%PATH%;C:\Program Files\nodejs"
    ) else if exist "C:\Program Files (x86)\nodejs\node.exe" (
        set "PATH=%PATH%;C:\Program Files (x86)\nodejs"
    ) else (
        echo [!] Node.js nao encontrado. Executando assistente de instalacao...
        call INSTALADOR_BELLAGESTAO.bat
        exit /b 0
    )
)

if not exist "backend\node_modules\" (
    echo Instalando componentes necessarios...
    call INSTALADOR_BELLAGESTAO.bat
    exit /b 0
)

echo [1/2] Iniciando Servidor Local SQLite...
start "BellaGestao Server" /min cmd /c "cd /d "%~dp0backend" && node server.js"

echo [2/2] Abrindo BellaGestao Studio...
timeout /t 2 /nobreak > nul
start http://localhost:3001

echo.
echo ===============================================================================
echo   SISTEMA PRONTO E EM EXECUCAO!
echo   Acesse: http://localhost:3001
echo.
echo   Pressione qualquer tecla para finalizar ou feche esta janela.
echo ===============================================================================
echo.
pause
