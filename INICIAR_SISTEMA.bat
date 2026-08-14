@echo off
chcp 65001 > nul
title BellaGestão Studio
cd /d "%~dp0"
start "BellaGestao Backend" /min cmd /c "cd backend && node server.js"
timeout /t 2 /nobreak > nul
start http://localhost:3001
