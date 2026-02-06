# VPS Update Checklist

## 1. Git Pull
```bash
cd /path/to/your/project
git status
git pull origin main
```

## 2. Install Dependencies (agar package.json o'zgarga bo'lsa)
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## 3. Build
```bash
# Root directory'dan
npm run build

# Yoki alohida
cd backend && npm run build
cd ../frontend && npm run build
```

## 4. Restart Services
```bash
# PM2 restart
pm2 restart all

# Yoki to'liq restart
pm2 delete all
pm2 start ecosystem.config.js

# PM2 status tekshirish
pm2 status
pm2 logs
```

## 5. Nginx Restart (agar kerak bo'lsa)
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 6. Browser Cache Tozalash
- **Ctrl + Shift + R** (Hard refresh)
- Yoki DevTools > Application > Clear storage

## 7. Service Worker Tozalash
Browser console'da:
```javascript
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister();
  }
});
location.reload();
```

## 8. Logs Tekshirish
```bash
# PM2 logs
pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Application logs
tail -f backend/logs/*.log
```

## 9. Version Tekshirish
```bash
# Git commit
git log -1

# Node version
node -v

# NPM version
npm -v

# PM2 version
pm2 -v
```

## 10. Disk Space Tekshirish
```bash
df -h
du -sh node_modules/
```

## Tez-tez uchraydigan muammolar:

### 1. Build xatolari
```bash
# Build loglarini ko'rish
npm run build 2>&1 | tee build.log
```

### 2. Port band
```bash
# Port tekshirish
sudo lsof -i :8080
sudo lsof -i :3000
```

### 3. Environment variables
```bash
# .env fayllarni tekshirish
cat backend/.env
cat frontend/.env.production

# Environment variables to'g'ri o'rnatilganligini tekshirish
printenv | grep NODE_ENV
```

### 4. File permissions
```bash
# Permissions tekshirish
ls -la
chmod -R 755 dist/
chmod -R 755 build/
```

## Deployment Script (avtomatik)
```bash
#!/bin/bash
# deploy.sh

echo "🚀 Deployment boshlandi..."

# 1. Git pull
echo "📥 Git pull..."
git pull origin main

# 2. Install dependencies
echo "📦 Dependencies o'rnatilmoqda..."
cd backend && npm install
cd ../frontend && npm install
cd ..

# 3. Build
echo "🔨 Build qilinmoqda..."
npm run build

# 4. Restart PM2
echo "🔄 PM2 restart..."
pm2 restart all

# 5. Nginx reload
echo "🌐 Nginx reload..."
sudo systemctl reload nginx

echo "✅ Deployment tugadi!"
echo "📊 PM2 status:"
pm2 status
```

Ishlatish:
```bash
chmod +x deploy.sh
./deploy.sh
```
