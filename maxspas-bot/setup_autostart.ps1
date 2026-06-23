# Run MAXSPAS bot at Windows logon (optional)
$ErrorActionPreference = "Stop"
$botDir = "C:\Users\MAXSPAS\Projects\maxspas-studio\maxspas-bot"
$runScript = Join-Path $botDir "run_all.ps1"
$taskName = "MAXSPAS-Studio-Bot"

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -WindowStyle Hidden -File `"$runScript`""
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
Write-Host "Autostart registered: $taskName"
