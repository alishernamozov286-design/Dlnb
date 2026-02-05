#!/bin/bash

# ============================================
# Production Deployment Script
# ============================================
# This script deploys the application on VPS with unique ports

set -e  # Exit on any error

echo "🚀 Starting Production Deployment..."

# ============================================
# 1. Check if .env.production exists
# ============================================
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found!"
    echo "📝 Please copy .env.production.template to .env.production and configure it:"
    echo "   cp .env.production.template .env.production"
    echo "   nano .env.production"
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

echo "✅ Environment file loaded"
echo "📦 Project: $PROJECT_NAME"
echo "🔌 Ports: Frontend=$FRONTEND_PORT, Backend=$BACKEND_PORT, MongoDB=$MONGO_PORT"

# ============================================
# 2. Check if ports are available
# ============================================
echo ""
echo "🔍 Checking port availability..."

check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "⚠️  Warning: Port $port ($service) is already in use!"
        echo "   Current process: $(lsof -Pi :$port -sTCP:LISTEN | tail -n 1)"
        read -p "   Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        echo "✅ Port $port ($service) is available"
    fi
}

check_port $FRONTEND_PORT "Frontend"
check_port $BACKEND_PORT "Backend"
check_port $MONGO_PORT "MongoDB"

# ============================================
# 3. Stop existing containers (if any)
# ============================================
echo ""
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.production.yml --env-file .env.production down || true

# ============================================
# 4. Build and start containers
# ============================================
echo ""
echo "🏗️  Building Docker images..."
docker-compose -f docker-compose.production.yml --env-file .env.production build --no-cache

echo ""
echo "🚀 Starting containers..."
docker-compose -f docker-compose.production.yml --env-file .env.production up -d

# ============================================
# 5. Wait for services to be healthy
# ============================================
echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check backend health
echo "🔍 Checking backend health..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -f http://localhost:$BACKEND_PORT/api/health >/dev/null 2>&1; then
        echo "✅ Backend is healthy!"
        break
    fi
    attempt=$((attempt + 1))
    echo "   Attempt $attempt/$max_attempts..."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ Backend health check failed!"
    echo "📋 Backend logs:"
    docker logs ${PROJECT_NAME}-backend --tail 50
    exit 1
fi

# ============================================
# 6. Display deployment info
# ============================================
echo ""
echo "============================================"
echo "✅ Deployment Successful!"
echo "============================================"
echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose.production.yml --env-file .env.production ps
echo ""
echo "🌐 Access URLs:"
if [ "$DEPLOYMENT_MODE" = "domain" ]; then
    echo "   Frontend: https://$DOMAIN"
    echo "   Backend API: https://$DOMAIN/api"
else
    echo "   Frontend: http://$VPS_IP:$FRONTEND_PORT"
    echo "   Backend API: http://$VPS_IP:$BACKEND_PORT/api"
fi
echo ""
echo "📝 Useful Commands:"
echo "   View logs:        docker-compose -f docker-compose.production.yml --env-file .env.production logs -f"
echo "   Stop services:    docker-compose -f docker-compose.production.yml --env-file .env.production down"
echo "   Restart services: docker-compose -f docker-compose.production.yml --env-file .env.production restart"
echo "   View status:      docker-compose -f docker-compose.production.yml --env-file .env.production ps"
echo ""
echo "🔐 Security Reminders:"
echo "   1. Configure firewall to allow only necessary ports"
echo "   2. Set up SSL/TLS if using domain"
echo "   3. Regular backups of MongoDB data"
echo "   4. Monitor logs for suspicious activity"
echo ""
