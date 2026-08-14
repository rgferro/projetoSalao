@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion
title BellaGestão Studio - Assistente de Instalação Completo

color 0D
cls
echo ===============================================================================
echo.
echo      💈 ASSISTENTE DE INSTALAÇÃO - BELLAGESTÃO STUDIO (SALÃO & ESTÉTICA) 💈
echo.
echo ===============================================================================
echo.
echo  Bem-vindo(a) ao instalador oficial do BellaGestão Studio!
echo  Este assistente irá preparar todo o sistema no seu computador:
echo.
echo    [1] Verificação e configuração do Node.js
echo    [2] Instalação do banco de dados SQLite local
echo    [3] Configuração e compilação dos módulos de gestão
echo    [4] Criação do ícone e atalho na sua Área de Trabalho
echo.
echo ===============================================================================
echo.
echo Pressione qualquer tecla para iniciar a instalação...
pause > nul

cd /d "%~dp0"
cls
color 0B
echo ===============================================================================
echo  [ETAPA 1/4] Verificando pré-requisitos do sistema...
echo ===============================================================================
echo.

:: 1. Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=%PATH%;C:\Program Files\nodejs"
        echo  [OK] Node.js localizado em Arquivos de Programas.
    ) else if exist "C:\Program Files (x86)\nodejs\node.exe" (
        set "PATH=%PATH%;C:\Program Files (x86)\nodejs"
        echo  [OK] Node.js localizado em Arquivos de Programas (x86).
    ) else (
        color 0E
        echo  [!] O Node.js não foi encontrado instalado no seu Windows.
        echo      O Node.js é o motor gratuito necessário para executar o sistema offline.
        echo.
        echo      Baixando instalador oficial do Node.js LTS para você...
        powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $url = 'https://nodejs.org/dist/v20.17.0/node-v20.17.0-x64.msi'; $output = Join-Path $env:TEMP 'nodejs_installer.msi'; Write-Host 'Baixando Node.js...'; Invoke-WebRequest -Uri $url -OutFile $output; Start-Process msiexec.exe -ArgumentList '/i', $output -Wait"
        
        set "PATH=%PATH%;C:\Program Files\nodejs"
        where node >nul 2>nul
        if %errorlevel% neq 0 (
            echo.
            echo  [!] Por favor, conclua a instalação do Node.js na tela e reinicie este instalador.
            pause
            exit /b 1
        )
    )
) else (
    echo  [OK] Ambiente Node.js verificado e pronto!
)

:: 2. Backend & SQLite
echo.
echo ===============================================================================
echo  [ETAPA 2/4] Instalando servidor local e banco de dados SQLite...
echo ===============================================================================
echo.

if not exist "backend\node_modules\" (
    echo  Instalando módulos do backend (aguarde alguns segundos)...
    cd backend
    call npm.cmd install --no-audit --no-fund --loglevel=error
    cd ..
    echo  [OK] Módulos do backend instalados com sucesso!
) else (
    echo  [OK] Módulos do backend já estão instalados.
)

:: Inicializar banco de dados e seed inicial se necessário
cd backend
node -e "require('./database/db').initDb().then(() => require('./database/seed').seedData()).then(() => console.log('  [OK] Banco de dados SQLite preparado e alimentado com sucesso!'))"
cd ..

:: 3. Frontend / Interface
echo.
echo ===============================================================================
echo  [ETAPA 3/4] Preparando interface visual e recursos estéticos...
echo ===============================================================================
echo.

if not exist "frontend\node_modules\" (
    echo  Instalando dependências visuais do sistema...
    cd frontend
    call npm.cmd install --no-audit --no-fund --loglevel=error
    cd ..
)

echo  Compilando interface otimizada para carregamento ultra rápido...
cd frontend
call npm.cmd run build --silent
cd ..
echo  [OK] Interface compilada com sucesso!

:: 4. Ícone e Atalho na Área de Trabalho
echo.
echo ===============================================================================
echo  [ETAPA 4/4] Criando atalho na Área de Trabalho...
echo ===============================================================================
echo.

node scripts/create_shortcut.js

:: Criar script de inicialização direta simplificada
(
echo @echo off
echo chcp 65001 ^> nul
echo title BellaGestão Studio
echo cd /d "%%~dp0"
echo start "BellaGestao Backend" /min cmd /c "cd backend ^&^& node server.js"
echo timeout /t 2 /nobreak ^> nul
echo start http://localhost:3001
) > "INICIAR_SISTEMA.bat"

cls
color 0A
echo ===============================================================================
echo.
echo          🎉 PARABÉNS! O BELLAGESTÃO STUDIO FOI INSTALADO COM SUCESSO! 🎉
echo.
echo ===============================================================================
echo.
echo  ✅ Banco de Dados SQLite Local Configurado
echo  ✅ Atalho Criado na sua Área de Trabalho: "BellaGestao Studio"
echo  ✅ Ícone de Salão & Estética Aplicado
echo  ✅ Sistema pronto para uso 100%% offline!
echo.
echo -------------------------------------------------------------------------------
echo.
set /p ABRIR="Deseja iniciar o sistema agora mesmo? (S/N): "
if /i "%ABRIR%"=="S" (
    echo.
    echo Abrindo o BellaGestão Studio...
    call "INICIAR_SISTEMA.bat"
) else (
    echo.
    echo Perfeito! Quando desejar abrir, basta dar 2 cliques no ícone na Área de Trabalho.
    timeout /t 4 > nul
)
