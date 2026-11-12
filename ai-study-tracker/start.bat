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
rem Uso: start.bat            (somente este PC)
rem      start.bat --lan      (celular na mesma rede Wi-Fi; qualquer aparelho da rede acessa)
rem      start.bat --lan --https
".venv\Scripts\python.exe" scripts\run.py %*
pause
