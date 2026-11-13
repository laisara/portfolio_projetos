@echo off
setlocal
set PYTHONUTF8=1
cd /d "%~dp0"
rem Uso: restore.bat                         (lista os backups e voce escolhe)
rem      restore.bat database\backups\arquivo.db
if not exist ".venv\Scripts\python.exe" (echo Rode install.bat primeiro. & pause & exit /b 1)
".venv\Scripts\python.exe" scripts\restore.py %*
pause
