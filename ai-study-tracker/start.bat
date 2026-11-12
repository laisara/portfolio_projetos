@echo off
setlocal
cd /d "%~dp0"
title AI Engineer Study Tracker
if not exist ".venv\Scripts\python.exe" (
  echo Primeira execucao: instalando...
  call install.bat || exit /b 1
)
rem Uso: start.bat            (somente este PC)
rem      start.bat --lan      (acesso pelo celular na mesma rede)
rem      start.bat --lan --https
".venv\Scripts\python.exe" scripts\run.py %*
pause
