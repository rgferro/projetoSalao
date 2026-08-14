@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion
title BellaGestão Studio - Instalador e Inicializador Automático

cls
color 0B
echo ===============================================================================
echo.
echo      💈 BELLAGESTÃO STUDIO - SISTEMA DE GESTÃO PARA SALÃO DE BELEZA 💈
echo                     (Instalação e Execução 100%% Local)
echo.
echo ===============================================================================
echo.
echo  Olá! Este assistente vai preparar e iniciar todo o sistema automaticamente.
echo  Você não precisa configurar nada técnico!
echo.
echo -------------------------------------------------------------------------------

cd /d "%~dp0"

:: 1. Verificar se o Node.js está instalado
echo [Passo 1/4] Verificando ambiente no seu computador...
where node >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=%PATH%;C:\Program Files\nodejs"
    ) else if exist "C:\Program Files (x86)\nodejs\node.exe" (
        set "PATH=%PATH%;C:\Program Files (x86)\nodejs"
    ) else (
        color 0C
        echo.
        echo ===============================================================================
        echo ⚠️ AVISO: O Node.js não foi encontrado no seu computador!
        echo.
        echo O Node.js é gratuito e necessário apenas uma vez para executar o sistema local.
        echo Estamos abrindo a página oficial de download para você (baixe a versão LTS).
        echo.
        echo Após instalar o Node.js, basta dar dois cliques neste mesmo arquivo novamente.
        echo ===============================================================================
        start https://nodejs.org/en/download
        echo.
        pause
        exit /b 1
    )
)
echo  --> Node.js detectado com sucesso!

:: 2. Instalar dependências do Backend se necessário
echo.
echo [Passo 2/4] Verificando módulos do servidor local...
if not exist "backend\node_modules\" (
    echo  --> Instalando componentes do backend pela primeira vez...
    echo      (Isso pode levar de 30 a 60 segundos, por favor aguarde...)
    cd backend
    call npm.cmd install --no-audit --no-fund --loglevel=error
    cd ..
    echo  --> Componentes do backend instalados com sucesso!
) else (
    echo  --> Componentes do backend já estão prontos!
)

:: 3. Instalar e compilar Frontend se necessário
echo.
echo [Passo 3/4] Verificando interface visual do sistema...
if not exist "frontend\node_modules\" (
    echo  --> Instalando componentes visuais...
    cd frontend
    call npm.cmd install --no-audit --no-fund --loglevel=error
    cd ..
)

if not exist "frontend\dist\" (
    echo  --> Otimizando interface para carregamento instantâneo...
    cd frontend
    call npm.cmd run build --silent
    cd ..
    echo  --> Interface visual pronta!
) else (
    echo  --> Interface visual já está pronta!
)

:: 4. Inicializar o Servidor e Abrir o Navegador
echo.
echo [Passo 4/4] Iniciando seu Salão BellaGestão Studio...
echo.

:: Iniciar o servidor em janela separada/minimizada
start "BellaGestão - Servidor Local (Não Fechar)" /min cmd /c "cd /d "%~dp0backend" && node server.js"

:: Aguardar 3 segundos para o banco SQLite iniciar
timeout /t 3 /nobreak > nul

:: Abrir o sistema no navegador padrão
start http://localhost:3001

color 0A
cls
echo ===============================================================================
echo.
echo   🎉 TUDO PRONTO! O BELLA GESTÃO STUDIO ESTÁ FUNCIONANDO PERFEITAMENTE! 🎉
echo.
echo ===============================================================================
echo.
echo   📍 Endereço de Acesso Local: http://localhost:3001
echo   💾 Banco de Dados: SQLite Local Seguro (Não depende de internet)
echo.
echo   ⌨️ ATALHOS RÁPIDOS NO TECLADO:
echo      • F1 : Guia de Atalhos
echo      • F2 : Novo Agendamento Multisserviços
echo      • F3 : Frente de Caixa / PDV
echo      • F4 : Cadastrar Novo Cliente
echo.
echo   ℹ️ INFORMAÇÃO:
echo      Para usar o sistema no dia a dia, mantenha o navegador aberto.
echo      Quando quiser fechar, basta fechar o navegador e esta janela.
echo      Para abrir novamente amanhã, dê 2 cliques neste mesmo arquivo!
echo.
echo ===============================================================================
echo.
echo Pressione qualquer tecla para minimizar este painel...
pause > nul
