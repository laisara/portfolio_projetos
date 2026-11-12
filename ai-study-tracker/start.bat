@echo off
setlocal
cd /d "%~dp0"
title AI Engineer Study Tracker
set PYTHONUTF8=1
if not exist ".venv\Scripts\python.exe" (
  echo Primeira execucao: instalando...
  call install.bat
  if errorlevel 1 exit /b 1
)
rem Abre http://localhost:8000 (somente neste PC). Para encerrar: Ctrl+C ou feche a janela.
".venv\Scripts\python.exe" scripts\run.py %*
pause
