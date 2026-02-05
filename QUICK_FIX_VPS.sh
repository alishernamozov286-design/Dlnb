#!/bin/bash

# ============================================
# QUICK FIX FOR VPS - Run this on VPS
# ============================================
# This script fixes the current issues and deploys

set -e

echo "🚀 Quick Fix and Deploy for dalnaboyshop.biznesjon.uz"
echo "============================================"
echo ""

# ============================================
# 1. Fix Git Conflict
# ============================================
echo "📥 Step 1: Fixing git conflict and pulling latest..."
cd /var/www/dlnb
git reset --hard
git pull origin main
echo "✅ Latest code pulled"
echo ""

# ============================================
# 2. Install PM2 if needed
# ============================================
echo "📦 Step 2: Checking PM2..."
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
    echo "✅ PM2 installed"
else
    echo "✅ PM2 already installed"
fi
echo ""

# ============================================
# 3. Build Backend
# ============================================
echo "🔧 Step 3: Building backend..."
cd /var/www/dlnb/backend

# Install dependencies
npm ci

# Build
npm run build

# Copy env
cp ../.env.production .env

echo "✅ Backend built"
echo ""

# ============================================
# 4. Start Backend with PM2
# ============================================
echo "🚀 Step 4: Starting backend with PM2..."

# Stop if running
pm2 stop dlnb-backend 2>/dev/null || true
pm2 delete dlnb-backend 2>/dev/null || true

# Start
pm2 start ecosystem.config.js --env production

# Save
pm2 save

# Setup startup
sudo pm2 startup systemd -u $USER --hp $HOME

echo "✅ Backend started"
echo ""

# ============================================
# 5. Build Frontend
# ============================================
echo "🎨 Step 5: Building frontend..."
cd /var/www/dlnb/frontend

# Install dependencies
npm ci

# Build
npm run build

echo "✅ Frontend built"
echo ""

# ============================================
# 6. Deploy Frontend to Nginx
# ============================================
echo "📦 Step 6: Deploying frontend to nginx..."

# Create directory
sudo mkdir -p /var/www/dalnaboyshop
sudo chown -R $USER:$USER /var/www/dalnaboyshop

# Copy files
sudo cp -r dist/* /var/www/dalnaboyshop/

echo "✅ Frontend deployed"
echo ""

# ============================================
# 7. Configure Nginx (if not already)
# ============================================
echo "🌐 Step 7: Configuring nginx..."

if [ ! -f /etc/nginx/sites-available/dalnaboyshop.conf ]; then
    echo "Creating nginx config..."
    sudo tee /etc/nginx/sites-available/dalnaboyshop.conf > /dev/null <<'EOF'
server {
    listen 80;
    server_name dalnaboyshop.biznesjon.uz;
    
    # Frontend
    location / {
        root /var/www/dalnaboyshop;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:4002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    client_max_body_size 50M;
}
EOF

    # Enable site
    sudo ln -sf /etc/nginx/sites-available/dalnaboyshop.conf /etc/nginx/sites-enabled/
    
    echo "✅ Nginx config created"
else
    echo "✅ Nginx config already exists"
fi

# Test and reload nginx
sudo nginx -t
sudo systemctl reload nginx

echo "✅ Nginx reloaded"
echo ""

# ============================================
# 8. Verify Deployment
# ============================================
echo "✅ Step 8: Verifying deployment..."
echo ""

# PM2 status
echo "📊 PM2 Status:"
pm2 status

echo ""

# Backend health
echo "🏥 Backend Health:"
sleep 2
if curl -s http://localhost:4002/api/health > /dev/null; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    echo "Check logs: pm2 logs dlnb-backend"
fi

echo ""

# Frontend check
echo "🌐 Frontend:"
if [ -f /var/www/dalnaboyshop/index.html ]; then
    echo "✅ Frontend files deployed"
else
    echo "❌ Frontend files not found"
fi

echo ""
echo "============================================"
echo "✅ Deployment Complete!"
echo "============================================"
echo ""
echo "🌐 Your site: http://dalnaboyshop.biznesjon.uz"
echo ""
echo "📊 Useful commands:"
echo "   pm2 status              - View PM2 status"
echo "   pm2 logs dlnb-backend   - View backend logs"
echo "   pm2 restart dlnb-backend - Restart backend"
echo ""
echo "🔒 Setup SSL (HTTPS):"
echo "   sudo apt install -y certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d dalnaboyshop.biznesjon.uz"
echo ""
echo "📝 View logs:"
echo "   pm2 logs dlnb-backend"
echo "   sudo tail -f /var/log/nginx/error.log"
echo ""
