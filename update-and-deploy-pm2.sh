#!/bin/bash

# ============================================
# Quick Update & Deploy with PM2
# ============================================
# For existing VPS installation - just pull and deploy

set -e

echo "🔄 Updating and Deploying..."
echo "============================================"
echo ""

# ============================================
# 1. Pull Latest Code
# ============================================
echo "📥 Pulling latest code from GitHub..."
git pull origin main
echo "✅ Code updated"
echo ""

# ============================================
# 2. Backend Update
# ============================================
echo "🔧 Updating Backend..."
cd backend

# Install/update dependencies
npm ci

# Build TypeScript
npm run build

# Restart PM2
pm2 restart dlnb-backend

echo "✅ Backend updated and restarted"
cd ..
echo ""

# ============================================
# 3. Frontend Update
# ============================================
echo "🌐 Updating Frontend..."
cd frontend

# Install/update dependencies
npm ci

# Build frontend
npm run build

# Copy to nginx directory
sudo cp -r dist/* /var/www/dalnaboyshop/

# Reload nginx
sudo systemctl reload nginx

echo "✅ Frontend updated"
cd ..
echo ""

# ============================================
# 4. Verify
# ============================================
echo "✅ Verifying..."
echo ""

# PM2 status
echo "📊 PM2 Status:"
pm2 status

echo ""

# Backend health
echo "🏥 Backend Health:"
curl -s http://localhost:4002/api/health || echo "Backend not responding"

echo ""
echo "============================================"
echo "✅ Update Complete!"
echo "============================================"
echo ""
echo "🌐 Site: https://dalnaboyshop.biznesjon.uz"
echo ""
echo "📊 Commands:"
echo "   pm2 logs dlnb-backend  - View logs"
echo "   pm2 monit              - Monitor"
echo ""
