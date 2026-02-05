#!/bin/bash

# ============================================
# Quick Update Script for VPS
# ============================================
# Use this when project is already cloned

set -e

echo "🔄 Updating dalnaboyshop.biznesjon.uz"
echo "============================================"
echo ""

# Check if we're in the right directory
if [ ! -f "backend/package.json" ]; then
    echo "❌ Error: Not in project root!"
    echo "Run: cd /var/www/dlnb"
    exit 1
fi

# ============================================
# 1. Pull Latest Changes
# ============================================
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

echo ""
echo "📋 Recent changes:"
git log -3 --oneline

echo ""

# ============================================
# 2. Update Backend
# ============================================
echo "🔧 Updating Backend..."
cd backend

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build TypeScript
echo "🏗️  Building TypeScript..."
npm run build

echo "✅ Backend built"

cd ..

# ============================================
# 3. Update Frontend
# ============================================
echo ""
echo "🎨 Updating Frontend..."
cd frontend

# Install dependencies
npm ci

# Build frontend
echo "🏗️  Building frontend..."
npm run build

# Deploy to nginx directory
echo "📦 Deploying to nginx..."
sudo cp -r dist/* /var/www/dalnaboyshop/

echo "✅ Frontend deployed"

cd ..

# ============================================
# 4. Restart Services
# ============================================
echo ""
echo "🔄 Restarting services..."

# Restart backend with PM2
pm2 restart dlnb-backend

# Reload nginx
sudo systemctl reload nginx

echo "✅ Services restarted"

# ============================================
# 5. Verify
# ============================================
echo ""
echo "✅ Verifying deployment..."

sleep 2

# Check PM2 status
echo ""
echo "📊 PM2 Status:"
pm2 status

# Check backend health
echo ""
echo "🏥 Backend Health:"
if curl -s http://localhost:4002/api/health > /dev/null; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
fi

# Check frontend
echo ""
echo "🌐 Frontend:"
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200"; then
    echo "✅ Frontend is accessible"
else
    echo "⚠️  Frontend check failed"
fi

echo ""
echo "============================================"
echo "✅ Update Complete!"
echo "============================================"
echo ""
echo "🌐 Site: https://dalnaboyshop.biznesjon.uz"
echo ""
echo "📊 View logs: pm2 logs dlnb-backend"
echo "🔄 Restart: pm2 restart dlnb-backend"
echo ""
