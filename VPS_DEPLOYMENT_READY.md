# ✅ VPS Deployment Ready - dalnoboyshop.biznesjon.uz

Loyiha VPS'ga deploy qilishga tayyor!

## 🎯 Configuration Summary

### Domain & Ports
- **Domain:** dalnoboyshop.biznesjon.uz
- **Frontend Port:** 8002
- **Backend Port:** 4002
- **MongoDB Port:** 27019
- **Project Name:** dlnb

### API Keys (Configured)
- ✅ GROQ_API_KEY: Configured
- ✅ TELEGRAM_BOT_TOKEN_CAR: Configured
- ✅ TELEGRAM_BOT_TOKEN_DEBT: Configured
- ✅ ADMIN_CHAT_ID: Configured
- ✅ GOOGLE_MAPS_API_KEY: Configured

### URLs
- **Frontend:** https://dalnoboyshop.biznesjon.uz
- **Backend API:** https://dalnoboyshop.biznesjon.uz/api
- **Telegram Webhook:** https://dalnoboyshop.biznesjon.uz/api/telegram

## 🚀 VPS Deployment Commands

### 1. Clone Repository

```bash
cd /var/www/dlnb
git clone https://github.com/alishernamozov286-design/Dlnb.git .
```

### 2. Generate Secure Passwords

```bash
chmod +x generate-secrets.sh
./generate-secrets.sh
```

**Copy the output and update these in .env.production:**
- `MONGO_ROOT_PASSWORD=<generated-password>`
- `JWT_SECRET=<generated-secret>`

### 3. Create .env.production

```bash
nano .env.production
```

**Paste this content:**

```bash
# ============================================
# PRODUCTION ENVIRONMENT CONFIGURATION
# ============================================

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
# PORT CONFIGURATION
# ============================================
FRONTEND_PORT=8002
BACKEND_PORT=4002
MONGO_PORT=27019

# ============================================
# MONGODB CONFIGURATION
# ============================================
MONGO_ROOT_PASSWORD=<PASTE_GENERATED_PASSWORD_HERE>

# ============================================
# BACKEND SECURITY
# ============================================
JWT_SECRET=<PASTE_GENERATED_JWT_SECRET_HERE>

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

### 4. Check Ports

```bash
chmod +x check-ports.sh
./check-ports.sh
```

If ports are in use, change them in `.env.production`

### 5. Deploy

```bash
chmod +x deploy.sh manage.sh
./deploy.sh
```

### 6. Configure Nginx

```bash
# Copy nginx config
sudo cp nginx-reverse-proxy.conf /etc/nginx/sites-available/dalnoboy.conf

# Edit config
sudo nano /etc/nginx/sites-available/dalnoboy.conf
```

**Update these lines:**
```nginx
server_name dalnoboyshop.biznesjon.uz;

location / {
    proxy_pass http://localhost:8002;
}

location /api {
    proxy_pass http://localhost:4002;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/dalnoboy.conf /etc/nginx/sites-enabled/

# Test nginx
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 7. Get SSL Certificate

```bash
sudo certbot --nginx -d dalnoboyshop.biznesjon.uz
```

### 8. Verify Deployment

```bash
# Check services
./manage.sh status

# Check logs
./manage.sh logs-be

# Check health
./manage.sh health

# Test URL
curl https://dalnoboyshop.biznesjon.uz/api/health
```

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

# View status
./manage.sh status
```

## 🔥 Firewall (Optional)

```bash
# Allow ports
sudo ufw allow 8002/tcp
sudo ufw allow 4002/tcp

# Or if using nginx (recommended)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## ✅ Deployment Checklist

- [ ] Repository cloned to `/var/www/dlnb`
- [ ] Secure passwords generated
- [ ] `.env.production` created with all values
- [ ] Ports checked (no conflicts)
- [ ] Docker deployed successfully
- [ ] Nginx configured
- [ ] SSL certificate obtained
- [ ] Services running
- [ ] Health check passing
- [ ] Website accessible at https://dalnoboyshop.biznesjon.uz

## 🆘 Troubleshooting

**Port in use:**
```bash
sudo lsof -i :8002
sudo kill -9 <PID>
```

**Backend not starting:**
```bash
docker logs dlnb-backend --tail 100
```

**Nginx error:**
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

**SSL issues:**
```bash
sudo certbot renew --dry-run
```

## 📝 Notes

- All API keys are configured from development environment
- MongoDB password and JWT secret MUST be generated on VPS
- Domain is configured for HTTPS with nginx reverse proxy
- Ports 8002/4002/27019 are used to avoid conflicts with other sites

---

**Ready to deploy!** Follow the commands above step by step. 🚀
