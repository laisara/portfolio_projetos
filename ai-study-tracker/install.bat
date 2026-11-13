@echo off
setlocal
set PYTHONUTF8=1
cd /d "%~dp0"
title AI Engineer Study Tracker - Instalacao
set "AUTO="
if /i "%~1"=="auto" set "AUTO=1"
echo.
echo  == AI Engineer Study Tracker: instalacao ==
echo.
call :findpy
if defined PY goto :havepy
echo Python 3.10+ nao encontrado.
where winget >nul 2>nul
if errorlevel 1 goto :nopython
echo Tentando instalar o Python 3.12 automaticamente com o winget. Aguarde...
winget install -e --id Python.Python.3.12 --scope user --silent --accept-package-agreements --accept-source-agreements
call :findpy
if not defined PY goto :nopython
:havepy
if not exist ".venv\Scripts\python.exe" (
  echo Criando ambiente virtual .venv ...
  %PY% -m venv .venv
  if errorlevel 1 goto :fail
)
echo Instalando dependencias...
".venv\Scripts\python.exe" -m pip install --upgrade pip >nul 2>nul
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 goto :fail
if not exist "database\backups" mkdir "database\backups"
echo.
echo  Instalacao concluida!
if defined AUTO exit /b 0
echo.
choice /c SN /m "Criar atalho na Area de Trabalho"
if errorlevel 2 goto :done
if exist "AI Engineer Study Tracker.exe" "AI Engineer Study Tracker.exe" --shortcut
:done
echo.
echo  Para usar no dia a dia: duplo clique em "AI Engineer Study Tracker.exe".
echo.
pause
exit /b 0

:nopython
echo.
echo Instale o Python 3.10 ou superior em https://www.python.org/downloads/
echo marcando "Add python.exe to PATH". Depois rode este install.bat novamente.
pause
exit /b 1

:fail
echo.
echo Falha na instalacao. Verifique a internet e tente novamente.
pause
exit /b 1

:findpy
set "PY="
where py >nul 2>nul
if not errorlevel 1 py -3 -c "import sys; sys.exit(0 if sys.version_info[:2] >= (3,10) else 1)" >nul 2>nul && set "PY=py -3"
if defined PY goto :eof
where python >nul 2>nul
if not errorlevel 1 python -c "import sys; sys.exit(0 if sys.version_info[:2] >= (3,10) else 1)" >nul 2>nul && set "PY=python"
if defined PY goto :eof
for %%V in (313 312 311 310) do if exist "%LOCALAPPDATA%\Programs\Python\Python%%V\python.exe" if not defined PY set PY="%LOCALAPPDATA%\Programs\Python\Python%%V\python.exe"
goto :eof
