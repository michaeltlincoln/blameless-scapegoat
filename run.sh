#!/bin/bash

# Start the API server
echo "Starting API server..."
uvicorn api.main:app --port 5000 --reload &
API_PID=$!

# Start the UI development server
echo "Starting UI development server..."
cd ui && yarn dev &
UI_PID=$!

# Function to handle script termination
cleanup() {
    echo "Shutting down servers..."
    kill $API_PID
    kill $UI_PID
    exit 0
}

# Set up signal handling
trap cleanup SIGINT SIGTERM

# Keep the script running
wait