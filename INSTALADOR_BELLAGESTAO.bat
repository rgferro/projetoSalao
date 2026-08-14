@echo off
title BellaGestao Studio - Instalador

cls
echo ===============================================================================
echo   BELLAGESTAO STUDIO - SISTEMA DE GESTAO PARA SALAO E ESTETICA
echo   (Instalacao e Configuracao 100%% Local)
echo ===============================================================================
echo.
echo   Bem-vindo ao assistente de instalacao do BellaGestao Studio!
echo   Este assistente ira verificar tudo e preparar o sistema automaticamente.
echo.
echo ===============================================================================
echo.

cd /d "%~dp0"

echo [1/4] Verificando se o Node.js esta instalado no Windows...
where node >nul 2>nul
if %errorlevel% equ 0 goto :node_ok

if exist "C:\Program Files\nodejs\node.exe" goto :add_path_64
if exist "C:\Program Files (x86)\nodejs\node.exe" goto :add_path_32

echo.
echo [!] Node.js nao foi encontrado no seu computador.
echo Baixando o instalador oficial do Node.js LTS...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $output = Join-Path $env:TEMP 'nodejs_installer.msi'; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.17.0/node-v20.17.0-x64.msi' -OutFile $output; Start-Process msiexec.exe -ArgumentList '/i', $output -Wait"

if exist "C:\Program Files\nodejs\node.exe" goto :add_path_64
if exist "C:\Program Files (x86)\nodejs\node.exe" goto :add_path_32

echo.
echo [!] Apos concluir a instalacao do Node.js, execute este instalador novamente.
echo.
pause
exit /b 1

:add_path_64
set "PATH=%PATH%;C:\Program Files\nodejs"
echo [OK] Node.js localizado em C:\Program Files\nodejs
goto :node_ok

:add_path_32
set "PATH=%PATH%;C:\Program Files (x86)\nodejs"
echo [OK] Node.js localizado em C:\Program Files (x86)\nodejs
goto :node_ok

:node_ok
echo [OK] Node.js verificado e pronto!

echo.
echo [2/4] Verificando modulos do servidor backend...
if exist "backend\node_modules\" goto :backend_ok
echo Instalando pacotes do backend (aguarde)...
cd backend
call npm.cmd install --no-audit --no-fund
cd ..
echo [OK] Backend instalado!

:backend_ok
echo Inicializando banco de dados SQLite local...
cd backend
node -e "require('./database/db').initDb().then(() => require('./database/seed').seedData()).then(() => console.log('[OK] Banco SQLite inicializado com sucesso!'))"
cd ..

echo.
echo [3/4] Verificando e preparando a interface visual...
if exist "frontend\node_modules\" goto :frontend_modules_ok
echo Instalando pacotes do frontend...
cd frontend
call npm.cmd install --no-audit --no-fund
cd ..

:frontend_modules_ok
echo Compilando interface para maxima velocidade...
cd frontend
call npm.cmd run build
cd ..
echo [OK] Interface compilada com sucesso!

echo.
echo [4/4] Criando atalho oficial na Area de Trabalho...
node scripts/create_shortcut.js

echo.
echo ===============================================================================
echo   INSTALACAO CONCLUIDA COM SUCESSO!
echo ===============================================================================
echo.
echo   O atalho "BellaGestao Studio" foi criado na sua Area de Trabalho.
echo  :: Iniciar o servidor backend e daemon WhatsApp em segundo plano
start "BellaGestao Server" /min cmd /c "cd /d "%~dp0backend" && npm.cmd start"
ping 127.0.0.1 -n 4 > nul
start http://localhost:3001

echo ===============================================================================
echo   Sistema em execucao no endereco: http://localhost:3001
echo   Pressione qualquer tecla para fechar esta janela do instalador.
echo ===============================================================================
echo.
pause
