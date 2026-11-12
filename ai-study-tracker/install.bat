@echo off
setlocal
cd /d "%~dp0"
title AI Engineer Study Tracker - Instalacao
echo.
echo  == AI Engineer Study Tracker: instalacao ==
echo.
set "PY="
where py >nul 2>nul && set "PY=py -3"
if not defined PY (where python >nul 2>nul && set "PY=python")
if not defined PY (
  echo Python 3.10+ nao encontrado.
  echo Instale em https://www.python.org/downloads/ marcando "Add python.exe to PATH".
  pause
  exit /b 1
)
%PY% -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)" || (echo Python 3.10 ou superior e necessario. & pause & exit /b 1)
if not exist ".venv\Scripts\python.exe" (
  echo Criando ambiente virtual .venv ...
  %PY% -m venv .venv || (echo Falha ao criar o ambiente virtual. & pause & exit /b 1)
)
echo Instalando dependencias...
".venv\Scripts\python.exe" -m pip install --upgrade pip >nul
".venv\Scripts\python.exe" -m pip install -r requirements.txt || (echo Falha ao instalar dependencias. & pause & exit /b 1)
if not exist "database\backups" mkdir "database\backups"
echo.
echo  Instalacao concluida! Agora execute start.bat
echo.
pause
