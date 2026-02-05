# 🚀 Multi-Site VPS Deployment Guide

Bu guide VPS'da bir nechta saytlarni unique portlarda deploy qilish uchun.

## 📋 Port Planning

VPS'da 10+ sayt bo'lsa, har biriga unique portlar kerak:

```
Site 1 (biznes):     Frontend=8001, Backend=4001, MongoDB=27018
Site 2 (shop):       Frontend=8002, Backend=4002, MongoDB=27019
Site 3 (blog):       Frontend=8003, Backend=4003, MongoDB=27020
Site 4 (crm):        Frontend=8004, Backend=4004, MongoDB=27021
...
Site 10:             Frontend=8010, Backend=4010, MongoDB=27027
```

## 🔧 Deployment Steps

### 1. Clone Repository

```bash
cd /var/www
git clone <your-repo-url> biznes
cd biznes
```

### 2. Configure Environment

```bash
# Copy template
cp .env.production.template .env.production

# Edit configuration
nano .env.production
```

**Important settings:**

```bash
# Unique project name
PROJECT_NAME=biznes

# Unique ports (check other sites first!)
FRONTEND_PORT=8001
BACKEND_PORT=4001
MONGO_PORT=27018

# VPS IP or Domain
DEPLOYMENT_MODE=ip
VPS_IP=YOUR_VPS_IP

# Or if using domain:
DEPLOYMENT_MODE=domain
DOMAIN=biznes.yourdomain.com

# Security (generate strong passwords!)
MONGO_ROOT_PASSWORD=<generate-strong-password>
JWT_SECRET=<generate-64-char-random-string>

# API Keys
GROQ_API_KEY=<your-groq-key>
TELEGRAM_BOT_TOKEN_CAR=<your-bot-token>
TELEGRAM_BOT_TOKEN_DEBT=<your-bot-token>
ADMIN_CHAT_ID=<your-chat-id>
VITE_GOOGLE_MAPS_API_KEY=<your-maps-key>
```

### 3. Make Deploy Script Executable

```bash
chmod +x deploy.sh
```

### 4. Deploy

```bash
./deploy.sh
```

Script automatically:
- ✅ Checks port availability
- ✅ Stops old containers
- ✅ Builds new images
- ✅ Starts services
- ✅ Verifies health

## 🌐 Access Methods

### Method 1: Direct IP Access (Simple)

```
Frontend: http://YOUR_VPS_IP:8001
Backend:  http://YOUR_VPS_IP:4001/api
```

**Pros:**
- No additional configuration needed
- Works immediately after deployment

**Cons:**
- Users must remember port numbers
- No SSL/HTTPS by default

### Method 2: Domain with Reverse Proxy (Recommended)

Setup nginx reverse proxy:

```nginx
# /etc/nginx/sites-available/biznes.conf

server {
    listen 80;
    server_name biznes.yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:4001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and add SSL:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/biznes.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Add SSL with Let's Encrypt
sudo certbot --nginx -d biznes.yourdomain.com
```

**Pros:**
- Clean URLs (no ports)
- Free SSL/HTTPS
- Professional setup

## 🔥 Firewall Configuration

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS (if using reverse proxy)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow direct port access (if not using reverse proxy)
sudo ufw allow 8001/tcp  # Frontend
sudo ufw allow 4001/tcp  # Backend

# Enable firewall
sudo ufw enable
```

## 📊 Management Commands

### View Logs

```bash
# All services
docker-compose -f docker-compose.production.yml --env-file .env.production logs -f

# Specific service
docker logs biznes-backend -f
docker logs biznes-frontend -f
docker logs biznes-mongodb -f
```

### Restart Services

```bash
# All services
docker-compose -f docker-compose.production.yml --env-file .env.production restart

# Specific service
docker restart biznes-backend
```

### Stop Services

```bash
docker-compose -f docker-compose.production.yml --env-file .env.production down
```

### Update Application

```bash
# Pull latest code
git pull

# Redeploy
./deploy.sh
```

### Backup MongoDB

```bash
# Create backup
docker exec biznes-mongodb mongodump \
  --username admin \
  --password YOUR_MONGO_PASSWORD \
  --authenticationDatabase admin \
  --db car-repair-workshop \
  --out /backup/$(date +%Y%m%d_%H%M%S)

# Backup files are in ./mongodb-backup/
```

### Restore MongoDB

```bash
docker exec biznes-mongodb mongorestore \
  --username admin \
  --password YOUR_MONGO_PASSWORD \
  --authenticationDatabase admin \
  --db car-repair-workshop \
  /backup/BACKUP_FOLDER_NAME
```

## 🔍 Troubleshooting

### Port Already in Use

```bash
# Find what's using the port
sudo lsof -i :8001

# Kill the process
sudo kill -9 <PID>
```

### Container Won't Start

```bash
# Check logs
docker logs biznes-backend --tail 100

# Check container status
docker ps -a | grep biznes
```

### Backend Health Check Fails

```bash
# Check if backend is running
curl http://localhost:4001/api/health

# Check MongoDB connection
docker exec biznes-backend env | grep MONGODB_URI
```

### Frontend Can't Connect to Backend

Check `VITE_API_URL` in `.env.production`:
- For IP mode: `http://YOUR_VPS_IP:4001/api`
- For domain mode: `https://biznes.yourdomain.com/api`

## 🔐 Security Checklist

- [ ] Strong MongoDB password (32+ characters)
- [ ] Strong JWT secret (64+ characters)
- [ ] Firewall configured
- [ ] SSL/TLS enabled (if using domain)
- [ ] Regular backups scheduled
- [ ] Log monitoring setup
- [ ] Non-root user for deployment
- [ ] Docker containers run as non-root
- [ ] Environment files not in git (.gitignore)
- [ ] API rate limiting enabled

## 📈 Monitoring

### Check Resource Usage

```bash
# Container stats
docker stats

# Disk usage
df -h
docker system df

# Memory usage
free -h
```

### Clean Up Old Images

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune
```

## 🎯 Quick Reference

```bash
# Deploy
./deploy.sh

# Logs
docker-compose -f docker-compose.production.yml --env-file .env.production logs -f

# Restart
docker-compose -f docker-compose.production.yml --env-file .env.production restart

# Stop
docker-compose -f docker-compose.production.yml --env-file .env.production down

# Status
docker-compose -f docker-compose.production.yml --env-file .env.production ps

# Backup
docker exec biznes-mongodb mongodump --username admin --password PASS --authenticationDatabase admin --db car-repair-workshop --out /backup/$(date +%Y%m%d)
```

## 🆘 Support

If you encounter issues:

1. Check logs: `docker logs biznes-backend -f`
2. Verify ports: `sudo lsof -i :8001`
3. Check firewall: `sudo ufw status`
4. Test backend: `curl http://localhost:4001/api/health`
5. Verify environment: `cat .env.production`

---

**Note:** Bu guide VPS'da bir nechta saytlarni parallel ishlatish uchun optimallashtirilgan. Har bir sayt o'z unique portlarida ishlaydi va bir-biriga ta'sir qilmaydi.
