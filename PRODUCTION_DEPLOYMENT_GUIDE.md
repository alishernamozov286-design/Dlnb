# 🚀 Production Deployment Guide

## 📋 Tayyorgarlik

### 1. Server Talablari
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM**: Minimum 2GB (4GB tavsiya etiladi)
- **CPU**: 2 core (4 core tavsiya etiladi)
- **Disk**: 20GB+ bo'sh joy
- **Domain**: SSL sertifikat uchun domen nomi

### 2. Kerakli Dasturlar
```bash
# Node.js 18+ o'rnatish
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Docker va Docker Compose o'rnatish
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt-get install docker-compose-plugin

# PM2 o'rnatish (agar Docker ishlatmasangiz)
sudo npm install -g pm2

# Nginx o'rnatish
sudo apt-get install nginx

# Certbot o'rnatish (SSL uchun)
sudo apt-get install certbot python3-certbot-nginx
```

## 🔧 1-Usul: Docker bilan Deploy (Tavsiya etiladi)

### Qadam 1: Loyihani Clone qilish
```bash
cd /var/www
sudo git 
### 2. Security Checklist
- ✅ JWT_SECRET kamida 64 belgi (random)
- ✅ MongoDB parol kuchli
- ✅ HTTPS sozlangan (SSL sertifikat)
- ✅ Firewall sozlangan
- ✅ Rate limiting yoqilgan
- ✅ CORS to'g'ri sozlangan
- ✅ Helmet.js yoqilgan

### 3. Domain va SSL
- Domain: alochibolajon.uz
- SSL: Let's Encrypt (Certbot)
- Nginx HTTPS redirect

## 🚀 Deployment Options

### Option 1: Docker Compose (Tavsiya etiladi)

#### 1. Server'ga ulanish
```bash
ssh user@your-server-ip
```

#### 2. Kerakli dasturlarni o'rnatish
```bash
# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Git
sudo apt-get install git
```

#### 3. Loyihani clone qilish
```bash
git clone <your-repo-url>
cd fura
```

#### 4. Environment fayllarni sozlash
```bash
# Root .env fayl yaratish
cp .env.production.example .env
nano .env

# Backend .env
cp backend/.env.production.example backend/.env
nano backend/.env

# Frontend .env
cp frontend/.env.production.example frontend/.env.production
nano frontend/.env.production
```

#### 5. Docker build va run
```bash
# Build
docker-compose build

# Run
docker-compose up -d

# Loglarni ko'rish
docker-compose logs -f

# Status tekshirish
docker-compose ps
```

#### 6. SSL sozlash (Certbot)
```bash
# Certbot o'rnatish
sudo apt-get install certbot python3-certbot-nginx

# SSL sertifikat olish
sudo certbot --nginx -d alochibolajon.uz -d www.alochibolajon.uz

# Auto-renewal test
sudo certbot renew --dry-run
```

#### 7. Nginx konfiguratsiyasini yangilash
```bash
# Frontend container ichida
docker exec -it biznes-frontend sh

# SSL yo'llarini yangilash
vi /etc/nginx/conf.d/default.conf

# Nginx restart
nginx -s reload
exit
```

### Option 2: Manual Deployment (PM2)

#### 1. Node.js o'rnatish
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 2. PM2 o'rnatish
```bash
sudo npm install -g pm2
```

#### 3. MongoDB o'rnatish
```bash
# MongoDB 7.0
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### 4. Backend deploy
```bash
cd backend
npm install
npm run build
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

#### 5. Frontend build
```bash
cd frontend
npm install
npm run build
```

#### 6. Nginx o'rnatish va sozlash
```bash
sudo apt-get install nginx

# Nginx config
sudo nano /etc/nginx/sites-available/dalnoboy

# Config yozish (frontend/nginx.conf dan nusxa)
# ...

# Enable site
sudo ln -s /etc/nginx/sites-available/dalnoboy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🔧 Post-Deployment

### 1. Health Check
```bash
# Backend
curl http://localhost:4000/api/health

# Frontend
curl http://localhost:80
```

### 2. Database Setup
```bash
# Backend container'ga kirish
docker exec -it biznes-backend sh

# Master user yaratish
npm run seed-master

# Subscription yaratish
npm run create-subscription
```

### 3. Monitoring Setup
```bash
# PM2 monitoring (agar PM2 ishlatilsa)
pm2 monit

# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 4. Backup Setup
```bash
# MongoDB backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec biznes-mongodb mongodump --out /backup/dump_$DATE
```

## 🔄 Update va Maintenance

### Docker Compose
```bash
# Pull latest code
git pull

# Rebuild va restart
docker-compose down
docker-compose build
docker-compose up -d

# Loglarni ko'rish
docker-compose logs -f
```

### PM2
```bash
# Pull latest code
git pull

# Backend
cd backend
npm install
npm run build
pm2 restart mator-life-backend

# Frontend
cd frontend
npm install
npm run build
sudo systemctl reload nginx
```

## 📊 Monitoring Commands

```bash
# Docker status
docker-compose ps

# Resource usage
docker stats

# Logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb

# PM2 (agar ishlatilsa)
pm2 status
pm2 logs
pm2 monit
```

## 🐛 Troubleshooting

### Backend ishlamayapti
```bash
# Logs
docker-compose logs backend

# Restart
docker-compose restart backend

# MongoDB connection
docker exec -it biznes-backend sh
ping mongodb
```

### Frontend ishlamayapti
```bash
# Logs
docker-compose logs frontend

# Nginx test
docker exec -it biznes-frontend nginx -t

# Restart
docker-compose restart frontend
```

### MongoDB connection error
```bash
# MongoDB status
docker-compose ps mongodb

# MongoDB logs
docker-compose logs mongodb

# Restart
docker-compose restart mongodb
```

## 🔐 Security Best Practices

1. **Firewall sozlash**
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

2. **SSH key authentication**
```bash
ssh-keygen -t rsa -b 4096
ssh-copy-id user@server
```

3. **Automatic updates**
```bash
sudo apt-get install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

4. **Fail2ban**
```bash
sudo apt-get install fail2ban
sudo systemctl enable fail2ban
```

## 📝 Checklist

- [ ] Environment variables sozlangan
- [ ] SSL sertifikat o'rnatilgan
- [ ] Firewall sozlangan
- [ ] Database backup sozlangan
- [ ] Monitoring sozlangan
- [ ] Health checks ishlayapti
- [ ] Logs accessible
- [ ] Auto-restart sozlangan
- [ ] Domain DNS sozlangan
- [ ] HTTPS redirect ishlayapti

## 🎯 Production URLs

- **Frontend**: https://alochibolajon.uz
- **Backend API**: https://alochibolajon.uz/api
- **Health Check**: https://alochibolajon.uz/api/health

---

**Oxirgi yangilanish:** 2026-02-05
**Status:** ✅ Production Ready
