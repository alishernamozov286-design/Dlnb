#!/bin/bash

# ============================================
# Port Availability Checker
# ============================================
# This script checks if your chosen ports are available on VPS

echo "🔍 Port Availability Checker"
echo "============================================"
echo ""

# Load environment if exists
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
    echo "📋 Checking ports from .env.production:"
    echo "   Frontend: $FRONTEND_PORT"
    echo "   Backend:  $BACKEND_PORT"
    echo "   MongoDB:  $MONGO_PORT"
else
    echo "⚠️  .env.production not found, using default ports:"
    FRONTEND_PORT=8001
    BACKEND_PORT=4001
    MONGO_PORT=27018
    echo "   Frontend: $FRONTEND_PORT"
    echo "   Backend:  $BACKEND_PORT"
    echo "   MongoDB:  $MONGO_PORT"
fi

echo ""
echo "============================================"
echo ""

# Function to check port
check_port() {
    local port=$1
    local service=$2
    
    echo -n "Checking port $port ($service)... "
    
    if command -v lsof >/dev/null 2>&1; then
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
            echo "❌ IN USE"
            echo "   Process: $(lsof -Pi :$port -sTCP:LISTEN | tail -n 1 | awk '{print $1, $2}')"
            return 1
        else
            echo "✅ Available"
            return 0
        fi
    elif command -v netstat >/dev/null 2>&1; then
        if netstat -tuln | grep ":$port " >/dev/null 2>&1; then
            echo "❌ IN USE"
            echo "   Use: sudo netstat -tulnp | grep :$port to see details"
            return 1
        else
            echo "✅ Available"
            return 0
        fi
    elif command -v ss >/dev/null 2>&1; then
        if ss -tuln | grep ":$port " >/dev/null 2>&1; then
            echo "❌ IN USE"
            echo "   Use: sudo ss -tulnp | grep :$port to see details"
            return 1
        else
            echo "✅ Available"
            return 0
        fi
    else
        echo "⚠️  Cannot check (install lsof, netstat, or ss)"
        return 2
    fi
}

# Check all ports
all_available=true

check_port $FRONTEND_PORT "Frontend" || all_available=false
check_port $BACKEND_PORT "Backend" || all_available=false
check_port $MONGO_PORT "MongoDB" || all_available=false

echo ""
echo "============================================"

if [ "$all_available" = true ]; then
    echo "✅ All ports are available!"
    echo "   You can proceed with deployment."
    exit 0
else
    echo "❌ Some ports are in use!"
    echo ""
    echo "Solutions:"
    echo "1. Stop the services using those ports"
    echo "2. Choose different ports in .env.production"
    echo ""
    echo "To find what's using a port:"
    echo "   sudo lsof -i :PORT"
    echo "   sudo netstat -tulnp | grep :PORT"
    echo "   sudo ss -tulnp | grep :PORT"
    echo ""
    echo "To kill a process:"
    echo "   sudo kill -9 <PID>"
    exit 1
fi
