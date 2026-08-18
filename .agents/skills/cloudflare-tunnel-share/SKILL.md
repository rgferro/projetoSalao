---
name: cloudflare-tunnel-share
description: >-
  Arquitetura e script 1-clique para compartilhamento instantâneo de aplicações locais via Cloudflare Quick Tunnel (sem cadastro, sem senhas, HTTPS gratuito).
---

# 🌐 Compartilhamento Online Instantâneo com Cloudflare Tunnel

Esta habilidade ensina como expor qualquer servidor web local (Next.js, Vite, Node, Express, FastAPI, Django) na internet com **HTTPS público, gratuito, sem senhas e sem necessidade de criar conta**, utilizando os binários oficiais do **Cloudflare Tunnel (`cloudflared`)**.

---

## 🎯 Por que Cloudflare Tunnel em vez de Localtunnel / Ngrok?
1. **Zero Telas Intermediárias:** Não exige que o cliente digite senhas ou IPs (ao contrário do `loca.lt`).
2. **Sem Limite de Tempo / Quedas 503:** Utiliza a rede Anycast da Cloudflare com alta disponibilidade.
3. **Suporte Total a WebSockets & SSE:** Ideal para aplicações em tempo real, painéis e integrações com WhatsApp.
4. **Sem Cadastro:** Usa os Quick Tunnels públicos (`*.trycloudflare.com`).

---

## 🛠️ 1. Script Batch de 1-Clique para Windows (`COMPARTILHAR_ONLINE.bat`)
```batch
@echo off
chcp 65001 > nul
cd /d "%~dp0"
title Compartilhar Link Online com Cliente
cls

echo =======================================================================
echo          COMPARTILHAMENTO ONLINE INSTANTANEO (CLOUDFLARE)
echo =======================================================================
echo.
echo Iniciando conexao segura global Cloudflare com HTTPS...
echo.

if not exist cloudflared.exe (
    echo [Download] Baixando Cloudflare Tunnel oficial...
    curl -L -o cloudflared.exe https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
)

echo.
echo =======================================================================
echo   SISTEMA ONLINE E PRONTO PARA O SEU CLIENTE!
echo   Copie o link que comeca com https://....trycloudflare.com abaixo:
echo =======================================================================
echo.
echo Mantendo o link ativo enquanto esta janela estiver aberta...
echo Pressione Ctrl+C para encerrar o compartilhamento quando terminar.
echo.

cloudflared.exe tunnel --url http://localhost:3000
```

---

## 🛡️ 2. Boas Práticas
* Adicionar `cloudflared.exe` ao `.gitignore` para não inflar o repositório Git.
* A porta pode ser parametrizada conforme a aplicação (`3000`, `5173`, `8000`, etc.).
