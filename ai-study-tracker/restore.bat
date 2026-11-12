@echo off
setlocal
set PYTHONUTF8=1
cd /d "%~dp0"
rem Feche o start.bat antes de restaurar.
rem Uso: restore.bat database\backups\backup-AAAAMMDD-HHMMSS.db
if not exist ".venv\Scripts\python.exe" (echo Rode install.bat primeiro. & pause & exit /b 1)
".venv\Scripts\python.exe" scripts\restore.py %*
pause
