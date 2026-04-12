#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "==============================="
echo "Starting Backend and Frontend Servers"
echo "==============================="

# Start Backend
echo "Starting FastAPI Backend..."
cd backend

# Activate virtual environment
source ../.venv/bin/activate

# Start backend server in the background
python -m uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

cd ..

# Start Frontend
echo "Starting Next.js Frontend..."
cd frontend

# Start frontend server in the background
npm run dev &
FRONTEND_PID=$!

echo "==============================="
echo "Both servers are running!"
echo "Backend (FastAPI):  http://127.0.0.1:8000  (PID: $BACKEND_PID)"
echo "Frontend (Next.js): http://127.0.0.1:3000  (PID: $FRONTEND_PID)"
echo "==============================="
echo "Press Ctrl+C to stop both servers."

# Trap INT and TERM signals to kill background processes when the script exits
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit 0" INT TERM

# Wait for background processes
wait