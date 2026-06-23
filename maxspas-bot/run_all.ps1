# Run MAXSPAS Studio Telegram bot + lead API for website forms
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".env")) {
    Write-Host "Create .env from .env.example and set BOT_TOKEN + ADMIN_CHAT_ID" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..."
    python -m venv venv
}

& ".\venv\Scripts\Activate.ps1"
pip install -q -r requirements.txt 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "pip: skipped optional deps (venv already usable)" -ForegroundColor DarkYellow
}
python run_all.py
