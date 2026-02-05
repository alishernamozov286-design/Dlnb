#!/bin/bash

echo "Starting Mator Life Development Environment..."
echo ""
echo "Backend: http://localhost:4000"
echo "Frontend: http://localhost:5173"
echo ""

# Function to handle cleanup
cleanup() {
    echo ""
    echo "Shutting down development servers..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting backend server..."
cd backend && npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "Starting frontend server..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "Development servers are running:"
echo "Backend API: http://localhost:4000/api"
echo "Frontend App: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for background processes
wait