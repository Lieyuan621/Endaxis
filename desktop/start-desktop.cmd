@echo off
setlocal
rem Run the launcher in its own hidden window, then release this CMD window.
start "" "%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0start-desktop.ps1" %*
exit /b
