# 🚀 Production Deployment - VPS Multi-Site Setup

Bu loyiha VPS'da bir nechta saytlar bilan birga ishlaydigan production-ready konfiguratsiyaga ega.

## 📦 Nima Tayyorlandi?

✅ **Unique Port Configuration** - Har bir sayt o'z portlarida ishlaydi  
✅ **Docker Production Setup** - Optimized production containers  
✅ **Automated Deployment** - One-command deploy script  
✅ **Security Hardened** - Secure defaults and best practices  
✅ **Nginx Reverse Proxy** - Optional domain-based access  
✅ **Health Checks** - Automatic service monitoring  
✅ **Backup Ready** - MongoDB backup scripts included  

## 🎯 Quick Start

### 1. VPS'ga Clone

```bash
cd /var/www
git clone <your-repo-url> biznes
cd biznes
```

### 2. Generate Secrets

```bash
chmod +x generate-secrets.sh
./generate-secrets.sh
```

Output'ni copy qiling va `.env.production`ga qo'ying.

### 3. Configure Environment

```bash
nano .env.production
```

**Minimal kerakli o'zgarishlar:**

```bash
# VPS IP
VPS_IP=123.45.67.89

# Unique ports (boshqa saytlar bilan konflikt bo'lmasligi uchun!)
FRONTEND_PORT=8001
BACKEND_PORT=4001
MONGO_PORT=27018

# Secrets (generate-secrets.sh dan)
MONGO_ROOT_PASSWORD=<generated-password>
JWT_SECRET=<generated-secret>

# API Keys
GROQ_API_KEY=gsk_...
TELEGRAM_BOT_TOKEN_CAR=...
TELEGRAM_BOT_TOKEN_DEBT=...
ADMIN_CHAT_ID=...
VITE_GOOGLE_MAPS_API_KEY=...

# API URLs
VITE_API_URL=http://123.45.67.89:4001/api
WEBHOOK_URL=http://123.45.67.89:4001/api/telegram
```

### 4. Check Ports

```bash
chmod +x check-ports.sh
./check-ports.sh
```

### 5. Deploy

```bash
chmod +x deploy.sh
./deploy.sh
```

### 6. Access

```
Frontend: http://YOUR_VPS_IP:8001
Backend:  http://YOUR_VPS_IP:4001/api
```

## 📚 Documentation

- **[QUICK_DEPLOY.md](QUICK_DEPLOY.md)** - 5 minutda deploy qilish
- **[MULTI_SITE_VPS_GUIDE.md](MULTI_SITE_VPS_GUIDE.md)** - To'liq VPS setup guide
- **[nginx-reverse-proxy.conf](nginx-reverse-proxy.conf)** - Domain setup uchun nginx config

## 🔧 Port Planning

Agar VPS'da 10+ sayt bo'lsa, har biriga unique portlar bering:

```
Site 1 (biznes):  Frontend=8001, Backend=4001, MongoDB=27018
Site 2 (shop):    Frontend=8002, Backend=4002, MongoDB=27019
Site 3 (blog):    Frontend=8003, Backend=4003, MongoDB=27020
Site 4 (crm):     Frontend=8004, Backend=4004, MongoDB=27021
...
Site 10:          Frontend=8010, Backend=4010, MongoDB=27027
```

## 🌐 Access Methods

### Method 1: Direct IP (Simple)

```
http://YOUR_VPS_IP:8001
```

**Pros:** Tez, qo'shimcha konfiguratsiya kerak emas  
**Cons:** Port raqamlarini eslab qolish kerak, SSL yo'q

### Method 2: Domain + Nginx (Recommended)

```
https://biznes.yourdomain.com
```

**Pros:** Clean URLs, Free SSL, Professional  
**Cons:** Domain va nginx setup kerak

Setup: `nginx-reverse-proxy.conf` faylga qarang

## 📊 Management

### Logs

```bash
# All services
docker-compose -f docker-compose.production.yml --env-file .env.production logs -f

# Specific service
docker logs biznes-backend -f
```

### Restart

```bash
docker-compose -f docker-compose.production.yml --env-file .env.production restart
```

### Stop

```bash
docker-compose -f docker-compose.production.yml --env-file .env.production down
```

### Update

```bash
git pull
./deploy.sh
```

### Backup MongoDB

```bash
docker exec biznes-mongodb mongodump \
  --username admin \
  --password YOUR_MONGO_PASSWORD \
  --authenticationDatabase admin \
  --db car-repair-workshop \
  --out /backup/$(date +%Y%m%d_%H%M%S)
```

Backup files: `./mongodb-backup/`

## 🔥 Firewall

```bash
# SSH
sudo ufw allow 22/tcp

# HTTP/HTTPS (if using nginx)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Direct port access (if not using nginx)
sudo ufw allow 8001/tcp  # Frontend
sudo ufw allow 4001/tcp  # Backend

# Enable
sudo ufw enable
```

## 🔍 Troubleshooting

### Port band bo'lsa

```bash
# Find process
sudo lsof -i :8001

# Kill process
sudo kill -9 <PID>
```

### Backend ishlamasa

```bash
# Check logs
docker logs biznes-backend --tail 100

# Check health
curl http://localhost:4001/api/health
```

### Frontend backend'ga ulanmasa

`.env.production`da `VITE_API_URL` to'g'riligini tekshiring:
- IP mode: `http://YOUR_VPS_IP:4001/api`
- Domain mode: `https://biznes.yourdomain.com/api`

## 🔐 Security Checklist

- [x] Strong passwords generated (32+ chars)
- [x] JWT secret generated (64+ chars)
- [x] `.env.production` in `.gitignore`
- [ ] Firewall configured
- [ ] SSL/TLS enabled (if using domain)
- [ ] Regular backups scheduled
- [ ] Log monitoring setup
- [ ] Non-root user for deployment

## 📈 Monitoring

```bash
# Container stats
docker stats

# Disk usage
df -h
docker system df

# Memory
free -h

# Clean up
docker image prune -a
docker volume prune
```

## 🎯 Files Overview

```
.env.production.template    # Template with all options
.env.production            # Your actual config (git ignored)
docker-compose.production.yml  # Production docker setup
deploy.sh                  # Automated deployment script
check-ports.sh            # Port availability checker
generate-secrets.sh       # Secure password generator
nginx-reverse-proxy.conf  # Nginx config for domain setup
QUICK_DEPLOY.md          # 5-minute deploy guide
MULTI_SITE_VPS_GUIDE.md  # Complete VPS setup guide
```

## 🆘 Support

Issues bo'lsa:

1. **Logs tekshiring:** `docker logs biznes-backend -f`
2. **Portlarni tekshiring:** `./check-ports.sh`
3. **Health check:** `curl http://localhost:4001/api/health`
4. **Environment:** `cat .env.production`
5. **Firewall:** `sudo ufw status`

## 🚀 Next Steps

1. ✅ Deploy qilish
2. ⬜ Firewall sozlash
3. ⬜ Backup schedule qilish
4. ⬜ Monitoring setup (optional)
5. ⬜ Domain + SSL setup (optional)

---

**Note:** Bu production-ready setup VPS'da bir nechta saytlarni parallel ishlatish uchun optimallashtirilgan. Har bir sayt o'z unique portlarida ishlaydi va bir-biriga ta'sir qilmaydi.

**Security:** `.env.production` faylini hech qachon git'ga commit qilmang! U allaqachon `.gitignore`da.
