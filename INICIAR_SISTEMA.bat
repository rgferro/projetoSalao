@echo off
title BellaGestao Studio - Inicializador

cls
echo ===============================================================================
echo   BELLAGESTAO STUDIO - INICIALIZANDO O SISTEMA
echo ===============================================================================
echo.

cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% equ 0 goto :node_found

if exist "C:\Program Files\nodejs\node.exe" (
    set "PATH=%PATH%;C:\Program Files\nodejs"
    goto :node_found
)
if exist "C:\Program Files (x86)\nodejs\node.exe" (
    set "PATH=%PATH%;C:\Program Files (x86)\nodejs"
    goto :node_found
)

echo [ERRO] Node.js nao encontrado!
echo Execute o arquivo INSTALADOR_BELLAGESTAO.bat para configurar o sistema.
echo.
pause
exit /b 1

:node_found
echo [1/2] Iniciando Servidor Local e Daemon WhatsApp Multi-Device...
start "BellaGestao Server" /min cmd /c "cd /d "%~dp0backend" && npm.cmd start"

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
