# 🚀 VPS Deployment Commands - dalnoboyshop.biznesjon.uz

Bu faylda VPS'ga deploy qilish uchun barcha kerakli commandlar ketma-ket berilgan.

## 📋 Pre-requisites

VPS'da Docker va Docker Compose o'rnatilgan bo'lishi kerak:

```bash
# Check Docker
docker --version
docker-compose --version

# If not installed:
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose -y
```

## 🔧 Step 1: Clone Repository

```bash
cd /var/www/dlnb
git clone https://github.com/alishernamozov286-design/Dlnb.git .
```

## 🔐 Step 2: Generate Secure Passwords

```bash
chmod +x generate-secrets.sh
./generate-secrets.sh
```

**Output'ni copy qiling va keyingi qadamda ishlatasiz!**

## ⚙️ Step 3: Create .env.production

```bash
nano .env.production
```

Quyidagi contentni paste qiling va `MONGO_ROOT_PASSWORD` va `JWT_SECRET` ni generate-secrets.sh dan olingan qiymatlar bilan almashtiring:

```bash
# ============================================
# DEPLOYMENT MODE
# ============================================
DEPLOYMENT_MODE=domain

# ============================================
# DOMAIN/IP CONFIGURATION
# ============================================
DOMAIN=dalnoboyshop.biznesjon.uz

# ============================================
# PROJECT IDENTIFICATION
# ============================================
PROJECT_NAME=dlnb
DB_NAME=car-repair-workshop

# ============================================
# PORT CONFIGURATION (MUST BE UNIQUE ON VPS!)
# ============================================
FRONTEND_PORT=8002
BACKEND_PORT=4002
MONGO_PORT=27019

# ============================================
# MONGODB CONFIGURATION
# ============================================
# PASTE HERE from generate-secrets.sh output
MONGO_ROOT_PASSWORD=PASTE_GENERATED_PASSWORD_HERE

# ============================================
# BACKEND SECURITY
# ============================================
# PASTE HERE from generate-secrets.sh output
JWT_SECRET=PASTE_GENERATED_JWT_SECRET_HERE

# ============================================
# AI SERVICE (GROQ)
# ============================================
GROQ_API_KEY=your_groq_api_key_here

# ============================================
# TELEGRAM BOT CONFIGURATION
# ============================================
TELEGRAM_BOT_TOKEN_CAR=8175946564:AAHhqrQyIf6A76CYfB6QZtX3UlCt1DdV_L8
TELEGRAM_BOT_TOKEN_DEBT=8555536634:AAGCnx2bU40IdPQIrFDBakLq78o9adpENN4
ADMIN_CHAT_ID=7935196609

# ============================================
# API URLS
# ============================================
VITE_API_URL=https://dalnoboyshop.biznesjon.uz/api
WEBHOOK_URL=https://dalnoboyshop.biznesjon.uz/api/telegram

# ============================================
# GOOGLE MAPS API
# ============================================
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBFw0Qbyq9zTFTd-tUY6dpoWktVXuLiRD4
```

Save: `Ctrl+O`, `Enter`, `Ctrl+X`

## 🔍 Step 4: Check Ports

```bash
chmod +x check-ports.sh
./check-ports.sh
```

Agar portlar band bo'lsa, `.env.production` da boshqa portlarni tanlang.

## 🚀 Step 5: Deploy

```bash
chmod +x deploy.sh manage.sh
./deploy.sh
```

Bu script:
- ✅ Portlarni tekshiradi
- ✅ Docker images build qiladi
- ✅ Containers'ni ishga tushiradi
- ✅ Health check qiladi

## 🌐 Step 6: Configure Nginx (Domain uchun)

```bash
# Copy nginx config
sudo cp nginx-reverse-proxy.conf /etc/nginx/sites-available/dalnoboy.conf

# Edit config
sudo nano /etc/nginx/sites-available/dalnoboy.conf
```

O'zgartirish kerak bo'lgan qismlar:

```nginx
server_name dalnoboyshop.biznesjon.uz;

location / {
    proxy_pass http://localhost:8002;  # FRONTEND_PORT
    # ... rest of config
}

location /api {
    proxy_pass http://localhost:4002;  # BACKEND_PORT
    # ... rest of config
}
```

Save va enable qiling:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/dalnoboy.conf /etc/nginx/sites-enabled/

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## 🔒 Step 7: Setup SSL Certificate

```bash
# Install certbot if not installed
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d dalnoboyshop.biznesjon.uz
```

Certbot automatically:
- ✅ Gets SSL certificate
- ✅ Configures nginx for HTTPS
- ✅ Sets up auto-renewal

## ✅ Step 8: Verify Deployment

```bash
# Check containers
docker ps

# Check logs
./manage.sh logs-be

# Check health
curl http://localhost:4002/api/health

# Check frontend
curl -I https://dalnoboyshop.biznesjon.uz
```

## 🎉 Done!

Sayt endi ishlaydi:
- **Frontend:** https://dalnoboyshop.biznesjon.uz
- **Backend API:** https://dalnoboyshop.biznesjon.uz/api

## 📊 Management Commands

```bash
# View logs
./manage.sh logs-be        # Backend logs
./manage.sh logs-fe        # Frontend logs
./manage.sh logs-db        # MongoDB logs

# Restart services
./manage.sh restart

# Stop services
./manage.sh stop

# Start services
./manage.sh start

# Backup MongoDB
./manage.sh backup

# Check health
./manage.sh health

# View all commands
./manage.sh help
```

## 🔄 Update Application

```bash
cd /var/www/dlnb
git pull
./deploy.sh
```

## 🆘 Troubleshooting

### Port already in use
```bash
sudo lsof -i :8002
sudo kill -9 <PID>
```

### Backend not starting
```bash
docker logs dlnb-backend --tail 100
```

### Frontend can't reach backend
Check `.env.production`:
```bash
cat .env.production | grep VITE_API_URL
# Should be: https://dalnoboyshop.biznesjon.uz/api
```

### SSL certificate issues
```bash
sudo certbot renew --dry-run
sudo systemctl status certbot.timer
```

## 📝 Important Notes

1. **Portlar:** 8002, 4002, 27019 - boshqa saytlar bilan konflikt yo'q
2. **Domain:** dalnoboyshop.biznesjon.uz - DNS A record VPS IP'ga ko'rsatishi kerak
3. **SSL:** Let's Encrypt - 90 kundan keyin auto-renew
4. **Backup:** `./manage.sh backup` - har kuni backup qiling
5. **Logs:** `./manage.sh logs-be -f` - real-time monitoring

---

**Created for:** dalnoboyshop.biznesjon.uz  
**VPS Path:** /var/www/dlnb  
**Ports:** Frontend=8002, Backend=4002, MongoDB=27019  
**Status:** Production Ready ✅
