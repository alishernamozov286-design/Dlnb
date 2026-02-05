# Dalnoboy Shop - Avtomobil Xizmatlari Boshqaruv Tizimi

Dalnoboy Shop - Full-stack web dastur avtomobil xizmatlari, shogirdlar va qarzlarni boshqarish uchun.

## ✨ Asosiy Xususiyatlar

- 🚗 **Avtomobil Boshqaruvi** - To'liq CRUD operatsiyalar
- 💰 **Moliyaviy Boshqaruv** - Qarzlar, tranzaksiyalar, kassa
- 👨‍🔧 **Shogird Tizimi** - Vazifalar va yutuqlar
- 📱 **PWA Qo'llab-quvvatlash** - Mobil qurilmalarda o'rnatish mumkin
- 🔄 **Offline-First** - Internet yo'q bo'lganda ham ishlaydi (10x tezroq!)
- 🤖 **AI Yordamchi** - Groq AI integratsiyasi
- 📊 **Statistika** - Batafsil hisobotlar va tahlil

## 🛠 Texnologiyalar

### Frontend
- React + TypeScript + Vite
- Tailwind CSS
- IndexedDB (Offline storage)
- Custom Repository Pattern
- Optimistic Updates

### Backend
- Node.js + Express + TypeScript
- MongoDB (Mongoose)
- JWT Authentication
- Telegram Bot API
- Groq AI Integration

## 🚀 Ishga Tushirish

### Bitta buyruq bilan (Tavsiya etiladi)
```bash
npm run dev
```

Bu buyruq frontend va backend ni bir vaqtda ishga tushiradi:
- Frontend: http://localhost:8080
- Backend: http://localhost:4000

### Alohida ishga tushirish
```bash
# Backend
npm run dev:backend

# Frontend  
npm run dev:frontend
```

### Barcha paketlarni o'rnatish
```bash
npm run install:all
```

## 🌐 Portlar

- **Frontend**: 8080 (development), 80 (production)
- **Backend**: 4000
- **MongoDB**: 27017 (faqat Docker ichida)

## 📱 Offline-First Arxitektura

Loyiha yangi **Offline-First** arxitekturaga ega:

### ✅ Xususiyatlar
- ⚡ **10x Tezroq** - 0.1 soniyada operatsiyalar
- 🔄 **Avtomatik Sync** - Background'da sezilmasin
- 💾 **IndexedDB** - Mahalliy saqlash
- 🎯 **Optimistic Updates** - Instant UI
- 🔁 **Retry Logic** - Avtomatik qayta urinish
- 📋 **Queue Management** - Pending operatsiyalar

### 🏗️ Arxitektura Qatlamlari
1. **NetworkManager** - Network holatini boshqaradi
2. **SyncManager** - Sync operatsiyalarini boshqaradi
3. **QueueManager** - Pending operatsiyalarni boshqaradi
4. **IndexedDBManager** - Ma'lumotlarni saqlaydi
5. **Repository Pattern** - CRUD operatsiyalar

### 📊 Performance
- **Delete**: 2.0s → 0.06s (33x tezroq)
- **Create**: 2.8s → 0.09s (31x tezroq)
- **Update**: 2.4s → 0.07s (34x tezroq)
- **Load**: 2.7s → 1.35s (2x tezroq)

Batafsil ma'lumot: [ARCHITECTURE.md](ARCHITECTURE.md)

## 📚 Dokumentatsiya

- 📖 [ARCHITECTURE.md](ARCHITECTURE.md) - Loyiha arxitekturasi
- 🔄 [MIGRATION_TO_USECARS_NEW.md](MIGRATION_TO_USECARS_NEW.md) - Migration guide
- 🗑️ [OFFLINE_DELETE_FINAL_FIX.md](OFFLINE_DELETE_FINAL_FIX.md) - Offline delete fix
- ⚡ [PERFORMANCE_10X_OPTIMIZATION.md](PERFORMANCE_10X_OPTIMIZATION.md) - Performance guide

## ⚙️ Konfiguratsiya

### Backend (.env)
```env
PORT=4000
HOST=0.0.0.0
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_min_64_chars
GROQ_API_KEY=your_groq_api_key
TELEGRAM_BOT_TOKEN_CAR=your_car_bot_token
TELEGRAM_BOT_TOKEN_DEBT=your_debt_bot_token
ADMIN_CHAT_ID=your_admin_chat_id
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:4000/api
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

## 🎯 Asosiy Funksiyalar

- ✅ Avtomobillar CRUD (Offline-First)
- ✅ Xizmatlar boshqaruvi
- ✅ Shogirdlar tizimi (Master/Apprentice)
- ✅ Qarzlar nazorati (Offline-First)
- ✅ Tranzaksiyalar (Offline-First)
- ✅ AI Chat Widget
- ✅ Telegram Bot integratsiyasi
- ✅ PWA qo'llab-quvvatlash
- ✅ Responsive dizayn
- ✅ Background Sync

## 🚀 Foydalanish

1. Loyihani clone qiling
```bash
git clone <repository-url>
cd fura
```

2. Barcha paketlarni o'rnating
```bash
npm run install:all
```

3. Backend va frontend .env fayllarini sozlang

4. Dasturni ishga tushiring
```bash
npm run dev
```

5. Brauzerda oching: http://localhost:8080

## 🏗️ Build va Deploy

### Development
```bash
npm run dev
```

### Production - VPS Multi-Site Deployment

**Quick Deploy (5 minutes):**
```bash
# 1. Clone on VPS
cd /var/www
git clone <repo-url> biznes
cd biznes

# 2. Generate secrets
chmod +x generate-secrets.sh
./generate-secrets.sh

# 3. Configure
nano .env.production
# Update: VPS_IP, ports, secrets, API keys

# 4. Deploy
chmod +x deploy.sh
./deploy.sh
```

**Access:**
- Frontend: `http://YOUR_VPS_IP:8001`
- Backend: `http://YOUR_VPS_IP:4001/api`

**Management:**
```bash
chmod +x manage.sh
./manage.sh help          # Show all commands
./manage.sh logs-be       # Backend logs
./manage.sh restart       # Restart services
./manage.sh backup        # Backup MongoDB
./manage.sh health        # Health check
```

**Documentation:**
- 📖 [PRODUCTION_README.md](PRODUCTION_README.md) - Complete production guide
- ⚡ [QUICK_DEPLOY.md](QUICK_DEPLOY.md) - 5-minute quick start
- 🌐 [MULTI_SITE_VPS_GUIDE.md](MULTI_SITE_VPS_GUIDE.md) - Multi-site VPS setup
- ✅ [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Deployment checklist
- 📊 [PRODUCTION_SUMMARY.md](PRODUCTION_SUMMARY.md) - Overview

**Features:**
- ✅ Unique ports for multi-site VPS (no conflicts)
- ✅ Docker production setup
- ✅ Automated deployment script
- ✅ Health checks & monitoring
- ✅ MongoDB backup scripts
- ✅ Nginx reverse proxy support
- ✅ SSL/TLS ready

### Production (Docker - Legacy)
```bash
docker-compose up -d
docker-compose logs -f
docker-compose down
```

### Production (PM2 - Legacy)
```bash
# Backend
cd backend
npm run build
npm run pm2:start

# Frontend
cd frontend
npm run build
```

## 📝 License

MIT License

## 👨‍💻 Muallif

Dalnoboy Shop Development Team

---

**Versiya:** 2.0.0  
**Oxirgi yangilanish:** 2026-02-05  
**Status:** ✅ Production Ready
