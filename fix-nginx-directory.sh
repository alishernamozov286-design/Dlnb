#!/bin/bash

# ============================================
# Fix Nginx Directory Issue
# ============================================

echo "🔧 Fixing nginx directory..."

# Create directory
sudo mkdir -p /var/www/dalnaboyshop

# Set ownership
sudo chown -R $USER:$USER /var/www/dalnaboyshop

# Copy frontend build
if [ -d "frontend/dist" ]; then
    sudo cp -r frontend/dist/* /var/www/dalnaboyshop/
    echo "✅ Frontend files copied"
else
    echo "❌ frontend/dist not found. Build frontend first:"
    echo "   cd frontend && npm run build"
    exit 1
fi

# Verify
echo ""
echo "📁 Files in /var/www/dalnaboyshop/:"
ls -la /var/www/dalnaboyshop/

echo ""
echo "✅ Directory fixed!"
echo ""
echo "Now reload nginx:"
echo "   sudo systemctl reload nginx"
