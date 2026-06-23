@echo off
cd /d "%~dp0"
set PORT=5500

echo MAXSPAS Studio
echo   Site:  http://localhost:%PORT%
echo   API:   http://127.0.0.1:8787/api/lead
echo.
echo Starting bot + lead API in background...
start "MAXSPAS Bot+API" /MIN powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0maxspas-bot\run_all.ps1"
timeout /t 2 /nobreak >nul
echo Starting web server...
python -m http.server %PORT%
