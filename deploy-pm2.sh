#!/bin/bash

# ============================================
# PM2 Deployment Script for VPS
# ============================================
# Deploy backend with PM2 instead of Docker

set -e

echo "🚀 PM2 Deployment for dalnaboyshop.biznesjon.uz"
echo "============================================"
echo ""

# Check if we're in the right directory
if [ ! -f "backend/package.json" ]; then
    echo "❌ Error: Not in project root directory!"
    echo "Run: cd /var/www/dlnb"
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ Error: .env.production not found!"
    echo "Please create it first"
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

echo "📦 Project: $PROJECT_NAME"
echo "🔌 Backend Port: $BACKEND_PORT"
echo ""

# ============================================
# 1. Install PM2 globally if not installed
# ============================================
if ! command -v pm2 &> /dev/null; then
    echo "📥 Installing PM2..."
    sudo npm install -g pm2
    echo "✅ PM2 installed"
else
    echo "✅ PM2 already installed"
fi

echo ""

# ============================================
# 2. Setup MongoDB (if not using Docker)
# ============================================
echo "🗄️  MongoDB Setup"
echo "Note: You need MongoDB running separately"
echo "Options:"
echo "  1. Use MongoDB Atlas (cloud)"
echo "  2. Install MongoDB locally: sudo apt install mongodb"
echo "  3. Use Docker for MongoDB only"
echo ""

# ============================================
# 3. Backend Setup
# ============================================
echo "🔧 Setting up Backend..."
cd backend

# Create logs directory
mkdir -p logs

# Install dependencies
echo "📥 Installing dependencies..."
npm ci

# Build TypeScript
echo "🏗️  Building TypeScript..."
npm run build

# Copy .env file
if [ -f "../.env.production" ]; then
    cp ../.env.production .env
    echo "✅ Environment file copied"
fi

echo ""

# ============================================
# 4. Start with PM2
# ============================================
echo "🚀 Starting backend with PM2..."

# Stop if already running
pm2 stop dlnb-backend 2>/dev/null || true
pm2 delete dlnb-backend 2>/dev/null || true

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Setup PM2 startup script
sudo pm2 startup systemd -u $USER --hp $HOME

echo "✅ Backend started with PM2"

cd ..

echo ""

# ============================================
# 5. Frontend Setup (Nginx)
# ============================================
echo "🌐 Frontend Setup"
echo "Building frontend..."

cd frontend

# Install dependencies
npm ci

# Build frontend
VITE_API_URL=$VITE_API_URL \
VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY \
npm run build

echo "✅ Frontend built"

# Create nginx directory if not exists
echo "📁 Creating nginx directory..."
sudo mkdir -p /var/www/dalnaboyshop
sudo chown -R $USER:$USER /var/www/dalnaboyshop

# Setup nginx to serve frontend
echo ""
echo "📝 Nginx Configuration:"
echo "1. Copy built files to nginx directory:"
echo "   sudo mkdir -p /var/www/dalnaboyshop"
echo "   sudo cp -r dist/* /var/www/dalnaboyshop/"
echo ""
echo "2. Create nginx config:"
echo "   sudo nano /etc/nginx/sites-available/dalnaboyshop.conf"
echo ""

cd ..

# ============================================
# 6. Setup Nginx
# ============================================
echo "🌐 Setting up Nginx..."

# Copy frontend build to nginx directory
sudo mkdir -p /var/www/dalnaboyshop
sudo cp -r frontend/dist/* /var/www/dalnaboyshop/

# Create nginx config
sudo tee /etc/nginx/sites-available/dalnaboyshop.conf > /dev/null <<EOF
server {
    listen 80;
    server_name dalnaboyshop.biznesjon.uz;
    
    # Frontend
    location / {
        root /var/www/dalnaboyshop;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
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

# Test nginx
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

echo "✅ Nginx configured"

echo ""

# ============================================
# 7. Verify Deployment
# ============================================
echo "✅ Verifying deployment..."

echo ""
echo "PM2 Status:"
pm2 status

echo ""
echo "Backend Health:"
sleep 2
curl -s http://localhost:$BACKEND_PORT/api/health || echo "Backend not responding yet"

echo ""
echo "============================================"
echo "✅ Deployment Complete!"
echo "============================================"
echo ""
echo "🌐 Your site is accessible at:"
echo "   http://dalnaboyshop.biznesjon.uz"
echo ""
echo "📊 PM2 Commands:"
echo "   pm2 status              - View status"
echo "   pm2 logs dlnb-backend   - View logs"
echo "   pm2 restart dlnb-backend - Restart"
echo "   pm2 stop dlnb-backend   - Stop"
echo "   pm2 monit               - Monitor"
echo ""
echo "🔒 Setup SSL:"
echo "   sudo certbot --nginx -d dalnaboyshop.biznesjon.uz"
echo ""
