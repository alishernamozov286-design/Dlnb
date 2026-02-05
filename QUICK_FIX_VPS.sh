#!/bin/bash

# ============================================
# Quick Fix for 404 Error
# ============================================
# Run this on VPS to fix nginx 404 error

set -e

echo "🔧 Fixing 404 Error for dalnaboyshop.biznesjon.uz"
echo "============================================"
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.production.yml" ]; then
    echo "❌ Error: Not in project directory!"
    echo "Run: cd /var/www/dlnb"
    exit 1
fi

# 1. Check Docker containers
echo "📦 Checking Docker containers..."
if docker ps | grep -q "dlnb"; then
    echo "✅ Containers are running"
    docker ps | grep dlnb
else
    echo "⚠️  Containers not running. Starting..."
    ./deploy.sh
fi

echo ""

# 2. Setup Nginx
echo "🌐 Setting up Nginx configuration..."

if [ -f "nginx-dalnaboyshop.conf" ]; then
    sudo cp nginx-dalnaboyshop.conf /etc/nginx/sites-available/dalnaboyshop.conf
    echo "✅ Nginx config copied"
else
    echo "❌ nginx-dalnaboyshop.conf not found!"
    echo "Please ensure you have the nginx config file"
    exit 1
fi

# Enable site
if [ ! -L "/etc/nginx/sites-enabled/dalnaboyshop.conf" ]; then
    sudo ln -s /etc/nginx/sites-available/dalnaboyshop.conf /etc/nginx/sites-enabled/
    echo "✅ Site enabled"
else
    echo "✅ Site already enabled"
fi

echo ""

# 3. Test Nginx
echo "🧪 Testing Nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx config is valid"
else
    echo "❌ Nginx config has errors!"
    exit 1
fi

echo ""

# 4. Reload Nginx
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx
echo "✅ Nginx reloaded"

echo ""

# 5. Verify services
echo "✅ Verifying services..."

echo -n "Backend (port 4002): "
if curl -s http://localhost:4002/api/health > /dev/null; then
    echo "✅ OK"
else
    echo "❌ Not responding"
fi

echo -n "Frontend (port 8002): "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8002 | grep -q "200"; then
    echo "✅ OK"
else
    echo "❌ Not responding"
fi

echo -n "Domain (dalnaboyshop.biznesjon.uz): "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://dalnaboyshop.biznesjon.uz)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ OK"
else
    echo "⚠️  HTTP $HTTP_CODE"
fi

echo ""
echo "============================================"
echo "✅ Fix completed!"
echo ""
echo "🌐 Your site should now be accessible at:"
echo "   http://dalnaboyshop.biznesjon.uz"
echo ""
echo "🔒 To enable HTTPS, run:"
echo "   sudo certbot --nginx -d dalnaboyshop.biznesjon.uz"
echo ""
