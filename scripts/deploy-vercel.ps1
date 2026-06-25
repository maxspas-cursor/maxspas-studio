# Deploy MAXSPAS Studio to Vercel via API
# Usage: $env:VERCEL_TOKEN="your_token"; .\scripts\deploy-vercel.ps1

param(
    [string]$Token = $env:VERCEL_TOKEN,
    [string]$Repo = "maxspas-cursor/maxspas-studio",
    [string]$ProjectName = "maxspas-studio",
    [string]$Domain = "maxspas.ru"
)

$ErrorActionPreference = "Stop"
if (-not $Token) {
    Write-Host "Set VERCEL_TOKEN first (from https://vercel.com/account/settings/tokens)" -ForegroundColor Yellow
    exit 1
}

$headers = @{
    Authorization = "Bearer $Token"
    "Content-Type" = "application/json"
}

# Bot credentials from local .env
$envFile = Join-Path $PSScriptRoot "..\maxspas-bot\.env"
$botToken = ""
$adminId = ""
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^BOT_TOKEN=(.+)$') { $botToken = $Matches[1].Trim() }
        if ($_ -match '^ADMIN_CHAT_ID=(.+)$') { $adminId = $Matches[1].Trim() }
    }
}
if (-not $botToken -or -not $adminId) {
    Write-Host "Missing BOT_TOKEN or ADMIN_CHAT_ID in maxspas-bot\.env" -ForegroundColor Yellow
    exit 1
}

Write-Host "Creating / linking project $ProjectName ..." -ForegroundColor Cyan
$body = @{
    name = $ProjectName
    framework = $null
    gitRepository = @{
        type = "github"
        repo = $Repo
    }
} | ConvertTo-Json -Depth 5

try {
    $project = Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects" -Method POST -Headers $headers -Body $body
    Write-Host "Project created: $($project.id)" -ForegroundColor Green
} catch {
    $err = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($err.error.code -eq "project_already_exists") {
        $project = Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects/$ProjectName" -Headers $headers
        Write-Host "Project exists: $($project.id)" -ForegroundColor Green
    } else {
        throw
    }
}

$projectId = $project.id

function Set-EnvVar($key, $value) {
    $envBody = @{
        key = $key
        value = $value
        type = "encrypted"
        target = @("production", "preview", "development")
    } | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri "https://api.vercel.com/v10/projects/$projectId/env" -Method POST -Headers $headers -Body $envBody | Out-Null
        Write-Host "  env $key OK"
    } catch {
        Write-Host "  env $key (may exist): $($_.Exception.Message)" -ForegroundColor DarkYellow
    }
}

Write-Host "Setting environment variables ..." -ForegroundColor Cyan
Set-EnvVar "BOT_TOKEN" $botToken
Set-EnvVar "ADMIN_CHAT_ID" $adminId

Write-Host "Triggering deployment from GitHub ..." -ForegroundColor Cyan
$deployBody = @{
    name = $ProjectName
    gitSource = @{
        type = "github"
        repoId = $Repo
        ref = "master"
    }
    target = "production"
} | ConvertTo-Json -Depth 5

try {
    $deploy = Invoke-RestMethod -Uri "https://api.vercel.com/v13/deployments" -Method POST -Headers $headers -Body $deployBody
    Write-Host "Deploy started: https://$($deploy.url)" -ForegroundColor Green
} catch {
    Write-Host "Deploy via API failed (GitHub may need linking in Vercel UI once):" -ForegroundColor Yellow
    Write-Host $_.ErrorDetails.Message
}

Write-Host "Adding domain $Domain ..." -ForegroundColor Cyan
$domainBody = @{ name = $Domain } | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "https://api.vercel.com/v10/projects/$projectId/domains" -Method POST -Headers $headers -Body $domainBody | Out-Null
    Write-Host "Domain $Domain added — configure DNS in REG.RU" -ForegroundColor Green
} catch {
    Write-Host "Domain step: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
}

$wwwBody = @{ name = "www.$Domain" } | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "https://api.vercel.com/v10/projects/$projectId/domains" -Method POST -Headers $headers -Body $wwwBody | Out-Null
} catch { }

Write-Host ""
Write-Host "Done. Check https://vercel.com/dashboard" -ForegroundColor Green
