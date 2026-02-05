# VPS Deployment Commands - Step by Step

## Current Situation
- VPS already has repository cloned at `/var/www/dlnb`
- Git conflict exists (local changes to update.sh)
- Need to pull latest changes and deploy

---

## Step 1: Fix Git Conflict and Pull Latest Changes

```bash
cd /var/www/dlnb

# Reset local changes and pull
git reset --hard
git pull origin main

# Verify you have latest code
git log -1 --oneline
```

---

## Step 2: Install PM2 (if not installed)

```bash
# Check if PM2 is installed
pm2 --version

# If not installed, install it globally
sudo npm install -g pm2
```

---

## Step 3: Setup MongoDB

You have 3 options:

### Option A: MongoDB Atlas (Recommended - Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update `.env.production` with connection string

### Option B: Install MongoDB Locally
```bash
# Install MongoDB
sudo apt update
sudo apt install -y mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Verify
sudo systemctl status mongodb
```

### Option C: Use Docker for MongoDB Only
```bash
# Run MongoDB in Docker
docker run -d \
  --name dlnb-mongodb \
  -p 27019:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=your_secure_password \
  --restart unless-stopped \
  mongo:7
```

---

## Step 4: Generate Secure Secrets

```bash
cd /var/www/dlnb

# Generate secure passwords
./generate-secrets.sh

# Copy the generated values and update .env.production
nano .env.production
```

Update these values in `.env.production`:
- `MONGO_ROOT_PASSWORD` - from generate-secrets.sh
- `JWT_SECRET` - from generate-secrets.sh

---

## Step 5: Build and Deploy Backend with PM2

```bash
cd /var/www/dlnb/backend

# Install dependencies
npm ci

# Build TypeScript
npm run build

# Copy environment file
cp ../.env.production .env

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
sudo pm2 startup systemd -u $USER --hp $HOME

# Verify backend is running
pm2 status
pm2 logs dlnb-backend --lines 50
```

---

## Step 6: Build and Deploy Frontend

```bash
cd /var/www/dlnb/frontend

# Install dependencies
npm ci

# Build frontend
npm run build

# Create nginx directory
sudo mkdir -p /var/www/dalnaboyshop
sudo chown -R $USER:$USER /var/www/dalnaboyshop

# Copy built files to nginx directory
sudo cp -r dist/* /var/www/dalnaboyshop/

# Verify files copied
ls -la /var/www/dalnaboyshop/
```

---

## Step 7: Configure Nginx

```bash
# Create nginx configuration
sudo nano /etc/nginx/sites-available/dalnaboyshop.conf
```

Paste this configuration:

```nginx
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
```

Enable the site:

```bash
# Enable site
sudo ln -sf /etc/nginx/sites-available/dalnaboyshop.conf /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

## Step 8: Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check backend logs
pm2 logs dlnb-backend --lines 50

# Test backend health
curl http://localhost:4002/api/health

# Test frontend
curl -I http://dalnaboyshop.biznesjon.uz

# Check nginx status
sudo systemctl status nginx
```

---

## Step 9: Setup SSL Certificate (HTTPS)

```bash
# Install certbot
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d dalnaboyshop.biznesjon.uz

# Follow the prompts:
# - Enter email address
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (option 2)

# Verify auto-renewal
sudo certbot renew --dry-run
```

---

## Step 10: Final Verification

```bash
# Check all services
pm2 status
sudo systemctl status nginx
sudo systemctl status mongodb  # if using local MongoDB

# Test HTTPS site
curl -I https://dalnaboyshop.biznesjon.uz

# View backend logs
pm2 logs dlnb-backend
```

---

## Quick Commands Reference

### PM2 Commands
```bash
pm2 status                    # View all processes
pm2 logs dlnb-backend         # View logs
pm2 logs dlnb-backend --lines 100  # View last 100 lines
pm2 restart dlnb-backend      # Restart backend
pm2 stop dlnb-backend         # Stop backend
pm2 start dlnb-backend        # Start backend
pm2 monit                     # Monitor in real-time
pm2 save                      # Save process list
```

### Nginx Commands
```bash
sudo nginx -t                 # Test configuration
sudo systemctl reload nginx   # Reload nginx
sudo systemctl restart nginx  # Restart nginx
sudo systemctl status nginx   # Check status
```

### Update Commands (After Initial Setup)
```bash
cd /var/www/dlnb
./update.sh                   # Quick update script
```

---

## Troubleshooting

### Backend not starting
```bash
# Check logs
pm2 logs dlnb-backend --lines 100

# Check if port is in use
sudo lsof -i :4002

# Restart backend
pm2 restart dlnb-backend
```

### Frontend 404 Error
```bash
# Check if files exist
ls -la /var/www/dalnaboyshop/

# Rebuild and redeploy
cd /var/www/dlnb/frontend
npm run build
sudo cp -r dist/* /var/www/dalnaboyshop/
sudo systemctl reload nginx
```

### MongoDB Connection Error
```bash
# Check MongoDB status
sudo systemctl status mongodb

# Check MongoDB logs
sudo journalctl -u mongodb -n 50

# Restart MongoDB
sudo systemctl restart mongodb
```

### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

---

## Environment Variables

Make sure these are set in `.env.production`:

```bash
DEPLOYMENT_MODE=domain
DOMAIN=dalnaboyshop.biznesjon.uz
PROJECT_NAME=dlnb
FRONTEND_PORT=8002
BACKEND_PORT=4002
MONGO_PORT=27019
MONGO_ROOT_PASSWORD=<generated-secure-password>
JWT_SECRET=<generated-secure-jwt-secret>
GROQ_API_KEY=<your-groq-api-key>
TELEGRAM_BOT_TOKEN_CAR=<your-telegram-bot-token>
TELEGRAM_BOT_TOKEN_DEBT=<your-telegram-debt-bot-token>
ADMIN_CHAT_ID=<your-admin-chat-id>
VITE_API_URL=https://dalnaboyshop.biznesjon.uz/api
WEBHOOK_URL=https://dalnaboyshop.biznesjon.uz/api/telegram
VITE_GOOGLE_MAPS_API_KEY=<your-google-maps-api-key>
```

---

## Success Indicators

✅ PM2 shows `dlnb-backend` as `online`
✅ `curl http://localhost:4002/api/health` returns success
✅ `https://dalnaboyshop.biznesjon.uz` loads the frontend
✅ `https://dalnaboyshop.biznesjon.uz/api/health` returns success
✅ SSL certificate is valid (green padlock in browser)

---

## Next Steps After Deployment

1. Test all features in production
2. Monitor logs: `pm2 logs dlnb-backend`
3. Set up monitoring/alerts
4. Configure database backups
5. Document any custom configurations

---

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs dlnb-backend`
2. Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Check MongoDB logs: `sudo journalctl -u mongodb -n 100`
4. Verify all environment variables are set correctly
