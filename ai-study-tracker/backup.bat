@echo off
setlocal
set PYTHONUTF8=1
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (echo Rode install.bat primeiro. & pause & exit /b 1)
".venv\Scripts\python.exe" scripts\backup.py
echo Os backups ficam em database\backups. Nada e apagado alem dos backups manuais mais antigos que os 30 mais recentes.
pause
