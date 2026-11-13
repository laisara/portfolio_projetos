@echo off
setlocal
cd /d "%~dp0"
rem Cria o atalho "AI Engineer Study Tracker" na Area de Trabalho, com o icone do aplicativo.
if not exist "AI Engineer Study Tracker.exe" (
  echo Arquivo "AI Engineer Study Tracker.exe" nao encontrado nesta pasta.
  pause
  exit /b 1
)
start "" /wait "AI Engineer Study Tracker.exe" --shortcut
