#!/bin/bash

# Change to the directory containing the script
cd "$(dirname "$0")"

# Exit immediately if a command exits with a non-zero status
set -e

echo "==============================="
echo "First-Time Setup: Installing Dependencies"
echo "==============================="

# Setup Backend
echo "Setting up Backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "../.venv" ]; then
    echo "Creating virtual environment..."
    # Attempt to use python3, fallback to python
    if command -v python3.11 &>/dev/null; then
        python3.11 -m venv ../.venv
    elif command -v python3.10 &>/dev/null; then
        python3.10 -m venv ../.venv
    elif command -v python3 &>/dev/null; then
        python3 -m venv ../.venv
    else
        python -m venv ../.venv
    fi
fi

# Activate virtual environment
source ../.venv/bin/activate

# Install requirements
echo "Installing backend dependencies..."
pip install -r requirements.txt

cd ..

# Setup Frontend
echo "Setting up Frontend..."
cd frontend

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

echo "==============================="
echo "Setup Complete! 🎉"
echo "You can now run the project at any time using: ./start.sh"
echo "==============================="