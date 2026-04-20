@echo off
powershell -NoProfile -Command "$s=(New-Object -COM WScript.Shell).CreateShortcut([IO.Path]::Combine([Environment]::GetFolderPath('Startup'),'REVAI Auto-Deploy.lnk')); $s.TargetPath='%~dp0watch-site-start.bat'; $s.WorkingDirectory='%~dp0'; $s.WindowStyle=7; $s.Save()"
echo.
echo Installed. REVAI Auto-Deploy will start automatically when you sign in to Windows.
echo To uninstall: press Win+R, type shell:startup, delete "REVAI Auto-Deploy.lnk".
echo.
echo Start it now? (Y/N)
set /p ans=
if /i "%ans%"=="Y" call "%~dp0watch-site-start.bat"
