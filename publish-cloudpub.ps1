# MAXSPAS Studio — публикация сайта и API через CloudPub
# Требуется аккаунт на https://cloudpub.ru (clo login или clo set token)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
$Clo = Join-Path $Root "tools\cloudpub\clo.exe"
$SitePort = 5500
$ApiPort = 8787
$SiteName = "maxspas-site"
$ApiName = "maxspas-api"

function Ensure-Clo {
    if (Test-Path $Clo) { return }
    $dir = Split-Path $Clo -Parent
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    $zip = Join-Path $dir "clo.zip"
    Write-Host "Скачиваю CloudPub CLI..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri "https://cloudpub.ru/download/stable/clo-3.1.0-stable-windows-x86_64.zip" -OutFile $zip -UseBasicParsing
    Expand-Archive -Path $zip -DestinationPath $dir -Force
}

function Get-PublicUrl {
    param([string]$Name)
    $ls = & $Clo ls 2>&1 | Out-String
    if ($ls -match "\[$Name\][^\n]*->\s+(https://[^\s:]+)") {
        return $Matches[1]
    }
    return $null
}

function Update-Config {
    param([string]$SiteUrl, [string]$ApiUrl)
    $siteJson = Join-Path $Root "config\site.json"
    $json = Get-Content $siteJson -Raw -Encoding UTF8 | ConvertFrom-Json
    $json.contacts.leadApiUrl = "$ApiUrl/api/lead"
    $json.contacts | Add-Member -NotePropertyName publicSiteUrl -NotePropertyValue $SiteUrl -Force
    ($json | ConvertTo-Json -Depth 10) + "`n" | Set-Content $siteJson -Encoding UTF8

    $envFile = Join-Path $Root "maxspas-bot\.env"
    if (Test-Path $envFile) {
        $lines = Get-Content $envFile
        $cors = "http://127.0.0.1:$SitePort,http://localhost:$SitePort,$SiteUrl"
        $found = $false
        $out = foreach ($line in $lines) {
            if ($line -match '^LEAD_API_CORS_ORIGINS=') {
                $found = $true
                "LEAD_API_CORS_ORIGINS=$cors"
            } else { $line }
        }
        if (-not $found) { $out += "LEAD_API_CORS_ORIGINS=$cors" }
        $out | Set-Content $envFile -Encoding UTF8
        Write-Host "Обновлён .env (CORS). Перезапустите бот, если он уже был запущен." -ForegroundColor Yellow
    }

    $pub = @{
        siteUrl = $SiteUrl
        apiUrl = $ApiUrl
        updatedAt = (Get-Date).ToString("o")
    } | ConvertTo-Json
    Set-Content (Join-Path $Root "config\cloudpub.json") $pub -Encoding UTF8
}

Ensure-Clo

$ping = & $Clo ping 2>&1 | Out-String
if ($ping -match "токен|token|login|авториз") {
    Write-Host "Сначала войдите в CloudPub:" -ForegroundColor Yellow
    Write-Host "  & `"$Clo`" login" -ForegroundColor White
    Write-Host "или вставьте токен из личного кабинета:" -ForegroundColor Yellow
    Write-Host "  & `"$Clo`" set token <ваш_токен>" -ForegroundColor White
    exit 1
}

Write-Host "Запуск бота и API..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoProfile", "-ExecutionPolicy", "Bypass",
    "-File", (Join-Path $Root "maxspas-bot\run_all.ps1")
) -WindowStyle Minimized
Start-Sleep -Seconds 3

$siteProc = Get-CimInstance Win32_Process -Filter "Name='python.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match "http\.server $SitePort" }
if (-not $siteProc) {
    Write-Host "Запуск сайта на порту $SitePort..." -ForegroundColor Cyan
    Start-Process python -ArgumentList "-m", "http.server", "$SitePort" -WorkingDirectory $Root -WindowStyle Minimized
    Start-Sleep -Seconds 2
}

Write-Host "Регистрация туннелей CloudPub..." -ForegroundColor Cyan
& $Clo clean 2>&1 | Out-Null
& $Clo register -n $SiteName "http" $SitePort
& $Clo register -n $ApiName "http" $ApiPort

$siteUrl = Get-PublicUrl $SiteName
$apiUrl = Get-PublicUrl $ApiName
if ($siteUrl -and $apiUrl) {
    Update-Config $siteUrl $apiUrl
    Write-Host ""
    Write-Host "=== MAXSPAS Studio в интернете ===" -ForegroundColor Green
    Write-Host "  Сайт:  $siteUrl"
    Write-Host "  API:   $apiUrl/api/lead"
    Write-Host ""
    Write-Host "Запуск туннелей (окно не закрывайте)..." -ForegroundColor Cyan
    & $Clo run
} else {
    Write-Host "Не удалось получить публичные URL. Проверьте: clo ls" -ForegroundColor Red
    exit 1
}
