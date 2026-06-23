# Run MAXSPAS Studio Telegram bot + lead API (website forms)
# For bot only without API use: python bot.py
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

# Stop duplicate bot processes
Get-CimInstance Win32_Process -Filter "name='python.exe' OR name='pythonw.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like "*$PSScriptRoot*bot.py*" } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

& ".\venv\Scripts\Activate.ps1"
pip install -q -r requirements.txt
python bot.py
