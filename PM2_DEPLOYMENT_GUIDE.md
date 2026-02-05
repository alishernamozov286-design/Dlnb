# 🚀 PM2 Deployment Guide - dalnaboyshop.biznesjon.uz

PM2 bilan deploy qilish (Docker o'rniga).

## 📋 Prerequisites

1. **Node.js** installed (v18+)
2. **MongoDB** running (Atlas yoki local)
3. **Nginx** installed
4. **PM2** installed globally

## 🔧 Quick Deployment

### 1. Clone Repository

```bash
cd /var/www/dlnb
git clone https://github.com/alishernamozov286-design/Dlnb.git .
```

### 2. Generate Secrets

```bash
chmod +x generate-secrets.sh
./generate-secrets.sh
```

### 3. Configure Environment

```bash
nano .env.production
```

Update:
- `MONGO_ROOT_PASSWORD` - from generate-secrets.sh
- `JWT_SECRET` - from generate-secrets.sh
- `MONGODB_URI` - your MongoDB connection string

### 4. Run Deployment Script

```bash
chmod +x deploy-pm2.sh
./deploy-pm2.sh
```

## 📊 PM2 Management Commands

### View Status

```bash
pm2 status
pm2 list
```

### View Logs

```bash
# All logs
pm2 logs dlnb-backend

# Only errors
pm2 logs dlnb-backend --err

# Last 100 lines
pm2 logs dlnb-backend --lines 100

# Follow logs
pm2 logs dlnb-backend -f
```

### Restart/Stop/Start

```bash
# Restart
pm2 restart dlnb-backend

# Stop
pm2 stop dlnb-backend

# Start
pm2 start dlnb-backend

# Reload (zero-downtime)
pm2 reload dlnb-backend
```

### Monitor

```bash
# Real-time monitoring
pm2 monit

# CPU/Memory usage
pm2 status
```

### Save Configuration

```bash
# Save current PM2 process list
pm2 save

# Setup auto-start on boot
pm2 startup
sudo pm2 startup systemd -u $USER --hp $HOME
```

## 🔄 Update Application

```bash
cd /var/www/dlnb

# Pull latest code
git pull

# Backend
cd backend
npm ci
npm run build
pm2 restart dlnb-backend

# Frontend
cd ../frontend
npm ci
npm run build
sudo cp -r dist/* /var/www/dalnaboyshop/
sudo systemctl reload nginx
```

## 🗄️ MongoDB Setup Options

### Option 1: MongoDB Atlas (Recommended)

1. Create cluster at https://cloud.mongodb.com
2. Get connection string
3. Update `.env.production`:
   ```bash
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dlnb?retryWrites=true&w=majority
   ```

### Option 2: Local MongoDB

```bash
# Install MongoDB
sudo apt update
sudo apt install mongodb -y

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Update .env.production
MONGODB_URI=mongodb://localhost:27017/dlnb
```

### Option 3: Docker MongoDB Only

```bash
# Run MongoDB in Docker
docker run -d \
  --name dlnb-mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=your_password \
  -v dlnb_mongodb_data:/data/db \
  --restart unless-stopped \
  mongo:7

# Update .env.production
MONGODB_URI=mongodb://admin:your_password@localhost:27017/dlnb?authSource=admin
```

## 🌐 Nginx Configuration

Nginx config automatically created by `deploy-pm2.sh`.

Manual setup:

```bash
sudo nano /etc/nginx/sites-available/dalnaboyshop.conf
```

```nginx
server {
    listen 80;
    server_name dalnaboyshop.biznesjon.uz;
    
    # Frontend
    location / {
        root /var/www/dalnaboyshop;
        try_files $uri $uri/ /index.html;
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
    }
}
```

```bash
# Enable and reload
sudo ln -s /etc/nginx/sites-available/dalnaboyshop.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 SSL Setup

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d dalnaboyshop.biznesjon.uz

# Auto-renewal test
sudo certbot renew --dry-run
```

## 🆘 Troubleshooting

### Backend not starting

```bash
# Check logs
pm2 logs dlnb-backend --err

# Check if port is available
sudo lsof -i :4002

# Restart
pm2 restart dlnb-backend
```

### MongoDB connection error

```bash
# Check MongoDB status
sudo systemctl status mongodb

# Or check Docker container
docker ps | grep mongodb

# Test connection
mongo mongodb://localhost:27017
```

### PM2 not starting on boot

```bash
# Setup startup script
pm2 startup
sudo pm2 startup systemd -u $USER --hp $HOME

# Save process list
pm2 save
```

### High memory usage

```bash
# Check memory
pm2 status

# Restart to clear memory
pm2 restart dlnb-backend

# Or configure max memory in ecosystem.config.js
max_memory_restart: '500M'
```

## 📋 PM2 Ecosystem Config

Located at `backend/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'dlnb-backend',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 4002,
      HOST: '0.0.0.0'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    cron_restart: '0 3 * * *', // Restart daily at 3 AM
  }]
};
```

## 🎯 Advantages of PM2

✅ **Auto-restart** on crashes  
✅ **Zero-downtime** reload  
✅ **Log management** built-in  
✅ **Monitoring** dashboard  
✅ **Cluster mode** for scaling  
✅ **Startup scripts** for auto-start  
✅ **Memory limits** to prevent leaks  

## 📊 Monitoring

### PM2 Plus (Optional)

```bash
# Link to PM2 Plus for advanced monitoring
pm2 link <secret> <public>

# Or use free monitoring
pm2 web
```

### Basic Monitoring

```bash
# Real-time monitoring
pm2 monit

# Status
pm2 status

# Logs
pm2 logs
```

## 🔄 Comparison: PM2 vs Docker

| Feature | PM2 | Docker |
|---------|-----|--------|
| Setup | Simpler | More complex |
| Memory | Lower | Higher |
| Restart | Faster | Slower |
| Isolation | Process-level | Container-level |
| Scaling | PM2 cluster | Docker Swarm/K8s |
| Best for | Single server | Multi-server |

---

**Recommendation:** Use PM2 for simple VPS deployments, Docker for complex multi-service setups.
