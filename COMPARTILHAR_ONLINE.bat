@echo off
setlocal EnableDelayedExpansion
title BellaGestao Studio - Compartilhar Online (Cloudflare Tunnel)

cls
echo ===============================================================================
echo   BELLAGESTAO STUDIO - COMPARTILHAMENTO ONLINE (HTTPS SEGURO)
echo ===============================================================================
echo.
echo   Iniciando tunel global seguro da Cloudflare...
echo   Voce podera acessar o salao do celular, tablet ou compartilhar com a cliente!
echo.
echo ===============================================================================
echo.

cd /d "%~dp0"

:: 1. Baixar cloudflared.exe se ainda nao existir
if not exist "cloudflared.exe" (
    echo [1/2] Baixando Cloudflare Tunnel oficial (gratuito e sem cadastro)...
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'cloudflared.exe'"
    echo [OK] Cloudflare Tunnel pronto!
) else (
    echo [1/2] Cloudflare Tunnel verificado com sucesso!
)

:: 2. Iniciar o servidor local se nao estiver rodando
echo.
echo [2/2] Conectando ao servidor local do salao (porta 3001)...
start "BellaGestao Server" /min cmd /c "cd /d "%~dp0backend" && npm.cmd start"
ping 127.0.0.1 -n 3 > nul

echo.
echo ===============================================================================
echo   SISTEMA ONLINE E PRONTO!
echo   Copie o link HTTPS que termina com ".trycloudflare.com" abaixo:
echo ===============================================================================
echo.
echo   ℹ️ Mantenha esta janela aberta enquanto quiser acessar pela internet.
echo   Para encerrar o compartilhamento, basta fechar esta janela.
echo.

cloudflared.exe tunnel --url http://localhost:3001
pause
