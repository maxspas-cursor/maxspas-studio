# Локальный запуск сайта + бот (один порт 5500)
$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$Port = 5500
Set-Location $Root

$listening = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue

function Show-Urls {
    Write-Host ""
    Write-Host "  Сайт:         http://localhost:$Port/" -ForegroundColor Green
    Write-Host "  Черновики:    http://localhost:$Port/idei" -ForegroundColor Green
    Write-Host "  Sincopa v1:   http://localhost:$Port/idei/sincopa-draft" -ForegroundColor Green
    Write-Host "  API заявок:   http://127.0.0.1:8787/api/lead" -ForegroundColor DarkGray
    Write-Host ""
}

if ($listening) {
    Write-Host "Порт $Port уже занят — сервер, похоже, уже запущен." -ForegroundColor Yellow
    Show-Urls
    Write-Host "Откройте ссылку в браузере. Остановка: закройте окно с vercel dev или python." -ForegroundColor Yellow
    Start-Process "http://localhost:$Port/idei/sincopa-draft"
    exit 0
}

Write-Host "MAXSPAS Studio — запуск..." -ForegroundColor Cyan
Write-Host "  Бот + API в фоне..."
Start-Process powershell -ArgumentList @(
    "-NoProfile", "-ExecutionPolicy", "Bypass",
    "-File", (Join-Path $Root "maxspas-bot\run_all.ps1")
) -WindowStyle Minimized

Start-Sleep -Seconds 2

Show-Urls
Write-Host "Сервер (Ctrl+C для остановки):" -ForegroundColor Cyan
Write-Host ""

# Vercel dev: clean URLs, /idei, /api — как на проде
$vercel = Get-Command npx -ErrorAction SilentlyContinue
if ($vercel) {
    npx vercel dev --listen $Port --yes
    exit $LASTEXITCODE
}

Write-Host "Vercel CLI не найден — запускаю python http.server" -ForegroundColor Yellow
Write-Host "(Черновики: добавьте /index.html к пути, напр. .../idei/sincopa-draft/index.html)" -ForegroundColor Yellow
python -m http.server $Port
