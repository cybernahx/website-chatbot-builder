@echo off
setlocal

REM Always run from this script's directory (handles paths with spaces)
cd /d "%~dp0"

echo Starting SaaS Project Manager...

REM Ensure virtual environment exists
if not exist ".venv\Scripts\python.exe" (
	echo Creating Python virtual environment in .venv ...
	py -3 -m venv .venv 2>nul
	if errorlevel 1 (
		python -m venv .venv
	)
)

if not exist ".venv\Scripts\python.exe" (
	echo ERROR: Could not create/find .venv. Please install Python 3 and try again.
	pause
	exit /b 1
)

echo Installing/updating Python requirements...
".venv\Scripts\python.exe" -m pip install --upgrade pip >nul
".venv\Scripts\python.exe" -m pip install -r tools\requirements.txt
if errorlevel 1 (
	echo ERROR: Python requirements install failed.
	pause
	exit /b 1
)

echo Launching Project Manager...
".venv\Scripts\python.exe" tools\project_manager.py

pause
