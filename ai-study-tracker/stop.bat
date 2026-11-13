@echo off
setlocal
cd /d "%~dp0"
rem Encerra o servidor do tracker com seguranca (faz um backup antes).
if not exist "Fechar AI Engineer Study Tracker.exe" (
  echo Arquivo "Fechar AI Engineer Study Tracker.exe" nao encontrado nesta pasta.
  pause
  exit /b 1
)
start "" /wait "Fechar AI Engineer Study Tracker.exe"
