# ⚡ Quick Deploy Guide

VPS'ga tez deploy qilish uchun qisqa yo'riqnoma.

## 🚀 5 Minutda Deploy

### 1. Repository Clone

```bash
cd /var/www
git clone <your-repo-url> biznes
cd biznes
```

### 2. Configure .env.production

```bash
nano .env.production
```

**Minimal kerakli o'zgarishlar:**

```bash
# VPS IP manzilini kiriting
VPS_IP=123.45.67.89

# Portlarni tekshiring (boshqa saytlar bilan konflikt bo'lmasligi uchun)
FRONTEND_PORT=8001
BACKEND_PORT=4001
MONGO_PORT=27018

# Secure passwords yarating
MONGO_ROOT_PASSWORD=<openssl rand -base64 32>
JWT_SECRET=<openssl rand -base64 64>

# API keys
GROQ_API_KEY=gsk_...
TELEGRAM_BOT_TOKEN_CAR=123456:ABC...
TELEGRAM_BOT_TOKEN_DEBT=123456:DEF...
ADMIN_CHAT_ID=123456789
VITE_GOOGLE_MAPS_API_KEY=AIza...

# API URL'ni yangilang
VITE_API_URL=http://123.45.67.89:4001/api
WEBHOOK_URL=http://123.45.67.89:4001/api/telegram
```

### 3. Deploy

```bash
chmod +x deploy.sh
./deploy.sh
```

### 4. Test

```bash
# Backend health check
curl http://localhost:4001/api/health

# Frontend (browserda)
http://YOUR_VPS_IP:8001
```

## ✅ Done!

Sayt ishga tushdi:
- Frontend: `http://YOUR_VPS_IP:8001`
- Backend: `http://YOUR_VPS_IP:4001/api`

## 🔧 Keyingi Saytni Deploy Qilish

Har bir sayt uchun unique portlar:

```bash
# Site 2
cd /var/www
git clone <repo2-url> shop
cd shop
nano .env.production
# FRONTEND_PORT=8002, BACKEND_PORT=4002, MONGO_PORT=27019
./deploy.sh

# Site 3
cd /var/www
git clone <repo3-url> blog
cd blog
nano .env.production
# FRONTEND_PORT=8003, BACKEND_PORT=4003, MONGO_PORT=27020
./deploy.sh
```

## 📊 Useful Commands

```bash
# Logs
docker logs biznes-backend -f

# Restart
docker restart biznes-backend

# Stop
docker-compose -f docker-compose.production.yml --env-file .env.production down

# Update
git pull && ./deploy.sh
```

## 🔥 Firewall

```bash
sudo ufw allow 8001/tcp  # Frontend
sudo ufw allow 4001/tcp  # Backend
sudo ufw enable
```

## 🆘 Troubleshooting

**Port band bo'lsa:**
```bash
sudo lsof -i :8001
sudo kill -9 <PID>
```

**Backend ishlamasa:**
```bash
docker logs biznes-backend --tail 100
```

**MongoDB connection error:**
```bash
docker exec biznes-mongodb mongosh -u admin -p YOUR_PASSWORD
```

---

**To'liq guide:** `MULTI_SITE_VPS_GUIDE.md`
