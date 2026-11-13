@echo off
setlocal
cd /d "%~dp0"
title AI Engineer Study Tracker (diagnostico)
set PYTHONUTF8=1
echo Modo diagnostico. No dia a dia, use o duplo clique em "AI Engineer Study Tracker.exe".
echo.
if not exist ".venv\Scripts\python.exe" goto :install
".venv\Scripts\python.exe" -c "import fastapi, uvicorn, multipart" >nul 2>nul
if errorlevel 1 goto :install
goto :run
:install
echo Preparando o ambiente...
call install.bat auto
if errorlevel 1 exit /b 1
:run
rem Abre http://localhost:8000 (somente neste PC). Para encerrar: Ctrl+C ou feche a janela.
".venv\Scripts\python.exe" scripts\run.py %*
pause
