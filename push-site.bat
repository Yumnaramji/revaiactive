@echo off
cd /d "%~dp0"
git add -A
git commit -m "Site update"
git push origin main
echo.
echo Done! Site will be live in about 1 minute.
pause
