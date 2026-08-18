#!/bin/bash
# ==============================================================================
# Script de Instalação e Inicialização Automática do Auto-Retry OCI Ampere A1
# ==============================================================================

set -e

echo "=================================================================="
echo "   PREPARANDO AMBIENTE NA VM PARA OCI AMPERE AUTO-ALLOCATOR"
echo "=================================================================="

# 1. Atualizar pacotes e instalar Python/Pip
echo "[1/4] Instalando dependências de sistema..."
if [ -f /etc/oracle-release ] || [ -f /etc/redhat-release ]; then
    sudo dnf install -y python3-pip python3-devel gcc || sudo yum install -y python3-pip
elif [ -f /etc/debian_version ]; then
    sudo apt-get update -y && sudo apt-get install -y python3-pip python3-venv
fi

# 2. Instalar OCI CLI via Pip
echo "[2/4] Instalando OCI CLI oficial..."
pip3 install --upgrade pip
pip3 install oci-cli

# 3. Testar se oci cli responde
if ! command -v oci &> /dev/null; then
    export PATH="$PATH:$HOME/.local/bin"
    echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.bashrc
fi

echo "[3/4] Versão da OCI CLI instalada:"
oci --version

# 4. Verificar se ~/.oci/config existe
if [ ! -f "$HOME/.oci/config" ]; then
    echo "=================================================================="
    echo "⚠️  ATENÇÃO: As credenciais da OCI ainda não foram configuradas!"
    echo "Execute o comando abaixo para configurar:"
    echo "    oci setup config"
    echo "=================================================================="
else
    echo "[4/4] Iniciando auto-retry em segundo plano com nohup..."
    chmod +x auto_create_ampere.py
    nohup python3 auto_create_ampere.py > ampere_retry.log 2>&1 &
    echo "=================================================================="
    echo "🚀 PROCESSO INICIADO EM SEGUNDO PLANO!"
    echo "Acompanhe o log com o comando: tail -f ampere_retry.log"
    echo "=================================================================="
fi
