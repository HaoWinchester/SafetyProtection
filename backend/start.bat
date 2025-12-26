@echo off
REM LLM Security Detection Tool - Windows Startup Script

echo Starting LLM Security Detection Tool Backend...

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Check if .env exists
if not exist ".env" (
    echo Warning: .env file not found. Copying from .env.example...
    copy .env.example .env
    echo Please edit .env with your configuration
)

REM Run Alembic migrations
echo Running database migrations...
alembic upgrade head || echo Warning: Migration failed. Database may not be ready.

REM Start the application
echo Starting FastAPI application...
if "%1"=="--prod" (
    REM Production mode
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
) else (
    REM Development mode with auto-reload
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
)

pause
