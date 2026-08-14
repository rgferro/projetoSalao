@echo off
setlocal EnableDelayedExpansion
title BellaGestao Studio - Inicializador

cls
echo ===============================================================================
echo   BELLAGESTAO STUDIO - INICIALIZANDO O SISTEMA
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
        echo [ERRO] Node.js nao encontrado!
        echo Execute o arquivo INSTALADOR_BELLAGESTAO.bat para configurar o sistema.
        echo.
        pause
        exit /b 1
    )
)

echo [1/2] Iniciando o servidor local (SQLite + Express)...
start "BellaGestao Server" /min cmd /c "cd /d "%~dp0backend" && node server.js"

echo [2/2] Abrindo BellaGestao Studio no navegador...
ping 127.0.0.1 -n 3 > nul
start http://localhost:3001

echo.
echo ===============================================================================
echo   SISTEMA INICIADO COM SUCESSO!
echo   Acesse no navegador: http://localhost:3001
echo.
echo   Para encerrar o sistema, basta fechar o navegador e esta janela.
echo ===============================================================================
echo.
pause
