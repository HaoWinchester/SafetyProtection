#!/bin/bash

# LLM Security Detection Tool - Startup Script

set -e

echo "Starting LLM Security Detection Tool Backend..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies if requirements.txt is newer
if [ requirements.txt -nt venv/.installed ]; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
    touch venv/.installed
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "Warning: .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "Please edit .env with your configuration"
fi

# Run Alembic migrations if database is configured
if [ -n "$DATABASE_URL" ]; then
    echo "Running database migrations..."
    alembic upgrade head || echo "Warning: Migration failed. Database may not be ready."
fi

# Start the application
echo "Starting FastAPI application..."
if [ "$1" = "--prod" ]; then
    # Production mode with multiple workers
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
else
    # Development mode with auto-reload
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
fi
