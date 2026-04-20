@echo off
taskkill /FI "WINDOWTITLE eq REVAI Auto-Deploy" /F >nul 2>&1
echo Auto-deploy watcher stopped.
timeout /t 2 >nul
