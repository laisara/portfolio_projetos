@echo off
setlocal
set PYTHONUTF8=1
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (echo Rode install.bat primeiro. & pause & exit /b 1)
".venv\Scripts\python.exe" scripts\backup.py
echo Os backups ficam em database\backups (os 30 mais recentes sao mantidos).
pause
