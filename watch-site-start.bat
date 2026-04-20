@echo off
start "REVAI Auto-Deploy" /min powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0watch-site.ps1"
echo Auto-deploy watcher started (minimized in taskbar).
echo To stop: run watch-site-stop.bat or close the PowerShell window.
timeout /t 3 >nul
