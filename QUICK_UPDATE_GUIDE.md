# ⚡ Quick Update Guide - VPS'da Mavjud Loyihani Yangilash

VPS'da allaqachon clone qilingan loyihani yangilash uchun.

## 🚀 Tez Yangilash (1 Command)

```bash
cd /var/www/dlnb
git pull
chmod +x update-and-deploy-pm2.sh
./update-and-deploy-pm2.sh
```

## 📋 Qo'lda Yangilash

### 1. Pull Latest Code

```bash
cd /var/www/dlnb
git pull origin main
```

### 2. Update Backend

```bash
cd backend
npm ci
npm run build
pm2 restart dlnb-backend
cd ..
```

### 3. Update Frontend

```bash
cd frontend
npm ci
npm run build
sudo cp -r dist/* /var/www/dalnaboyshop/
sudo systemctl reload nginx
cd ..
```

### 4. Verify

```bash
pm2 status
pm2 logs dlnb-backend --lines 50
curl http://localhost:4002/api/health
```

## 🔄 Faqat Backend Yangilash

```bash
cd /var/www/dlnb
git pull
cd backend
npm ci
npm run build
pm2 restart dlnb-backend
```

## 🌐 Faqat Frontend Yangilash

```bash
cd /var/www/dlnb
git pull
cd frontend
npm ci
npm run build
sudo cp -r dist/* /var/www/dalnaboyshop/
sudo systemctl reload nginx
```

## 📊 PM2 Commands

```bash
# Status
pm2 status

# Logs
pm2 logs dlnb-backend

# Restart
pm2 restart dlnb-backend

# Stop
pm2 stop dlnb-backend

# Start
pm2 start dlnb-backend

# Monitor
pm2 monit
```

## 🆘 Agar Xato Bo'lsa

### Backend ishlamasa:

```bash
# Check logs
pm2 logs dlnb-backend --err

# Restart
pm2 restart dlnb-backend

# Or rebuild
cd /var/www/dlnb/backend
npm run build
pm2 restart dlnb-backend
```

### Frontend ko'rinmasa:

```bash
# Check nginx
sudo nginx -t
sudo systemctl status nginx

# Rebuild frontend
cd /var/www/dlnb/frontend
npm run build
sudo cp -r dist/* /var/www/dalnaboyshop/
sudo systemctl reload nginx
```

### Git pull xatosi:

```bash
# Discard local changes
git reset --hard
git pull origin main
```

## ✅ Verification Checklist

- [ ] `git pull` successful
- [ ] Backend built: `ls backend/dist/`
- [ ] PM2 running: `pm2 status`
- [ ] Backend health: `curl http://localhost:4002/api/health`
- [ ] Frontend built: `ls frontend/dist/`
- [ ] Nginx serving: `curl http://localhost/`
- [ ] Site accessible: `curl https://dalnaboyshop.biznesjon.uz`

## 🎯 One-Liner Updates

```bash
# Full update
cd /var/www/dlnb && git pull && ./update-and-deploy-pm2.sh

# Backend only
cd /var/www/dlnb && git pull && cd backend && npm ci && npm run build && pm2 restart dlnb-backend

# Frontend only
cd /var/www/dlnb && git pull && cd frontend && npm ci && npm run build && sudo cp -r dist/* /var/www/dalnaboyshop/ && sudo systemctl reload nginx
```

## 📝 Notes

- `npm ci` tezroq va ishonchliroq `npm install`dan
- `pm2 restart` zero-downtime restart qiladi
- Frontend o'zgarishlar uchun nginx reload kerak
- Backend o'zgarishlar uchun PM2 restart kerak

---

**Tip:** Har safar update qilishdan oldin backup oling:
```bash
pm2 save
sudo cp -r /var/www/dalnaboyshop /var/www/dalnaboyshop.backup
```
