# 🔄 Update and Deploy - VPS'da allaqachon clone bor

VPS'da loyiha allaqachon clone qilingan. Faqat yangilanishlarni pull qilib deploy qilish.

## ⚡ Quick Update Commands

```bash
cd /var/www/dlnb

# 1. Pull latest changes
git pull

# 2. Deploy with PM2
chmod +x deploy-pm2.sh
./deploy-pm2.sh
```

## 📋 Step by Step

### 1. Navigate to Project

```bash
cd /var/www/dlnb
```

### 2. Pull Latest Changes

```bash
git pull origin main
```

### 3. Check What Changed

```bash
git log -5 --oneline
```

### 4. Deploy

**Option A: Automatic (Recommended)**

```bash
chmod +x deploy-pm2.sh
./deploy-pm2.sh
```

**Option B: Manual**

```bash
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

## 🔍 Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check backend health
curl http://localhost:4002/api/health

# Check logs
pm2 logs dlnb-backend --lines 50

# Check website
curl https://dalnaboyshop.biznesjon.uz
```

## 🆘 If Something Goes Wrong

### Rollback to Previous Version

```bash
cd /var/www/dlnb

# See commit history
git log --oneline -10

# Rollback to previous commit
git reset --hard HEAD~1

# Or rollback to specific commit
git reset --hard <commit-hash>

# Redeploy
./deploy-pm2.sh
```

### Check Logs

```bash
# PM2 logs
pm2 logs dlnb-backend --err

# Nginx logs
sudo tail -f /var/log/nginx/error.log

# Backend logs
cat backend/logs/err.log
```

### Restart Services

```bash
# Restart backend
pm2 restart dlnb-backend

# Restart nginx
sudo systemctl restart nginx

# Restart MongoDB (if local)
sudo systemctl restart mongodb
```

## 📊 Common Update Scenarios

### 1. Only Backend Changed

```bash
cd /var/www/dlnb
git pull

cd backend
npm ci
npm run build
pm2 restart dlnb-backend
```

### 2. Only Frontend Changed

```bash
cd /var/www/dlnb
git pull

cd frontend
npm ci
npm run build
sudo cp -r dist/* /var/www/dalnaboyshop/
sudo systemctl reload nginx
```

### 3. Environment Variables Changed

```bash
cd /var/www/dlnb
git pull

# Update .env.production
nano .env.production

# Restart backend
pm2 restart dlnb-backend --update-env
```

### 4. Dependencies Changed

```bash
cd /var/www/dlnb
git pull

# Backend
cd backend
rm -rf node_modules package-lock.json
npm install
npm run build
pm2 restart dlnb-backend

# Frontend
cd ../frontend
rm -rf node_modules package-lock.json
npm install
npm run build
sudo cp -r dist/* /var/www/dalnaboyshop/
```

## 🔄 Automated Update Script

Create `update.sh`:

```bash
#!/bin/bash

cd /var/www/dlnb

echo "🔄 Pulling latest changes..."
git pull

echo "🏗️  Building backend..."
cd backend
npm ci
npm run build

echo "🔄 Restarting backend..."
pm2 restart dlnb-backend

echo "🏗️  Building frontend..."
cd ../frontend
npm ci
npm run build

echo "📦 Deploying frontend..."
sudo cp -r dist/* /var/www/dalnaboyshop/
sudo systemctl reload nginx

echo "✅ Update complete!"
pm2 status
```

```bash
chmod +x update.sh
./update.sh
```

## 📝 Pre-Update Checklist

- [ ] Backup database: `./manage.sh backup` (if using Docker)
- [ ] Check current version: `git log -1`
- [ ] Check PM2 status: `pm2 status`
- [ ] Check disk space: `df -h`
- [ ] Check memory: `free -h`

## 🎯 Quick Commands Reference

```bash
# Pull and deploy
cd /var/www/dlnb && git pull && ./deploy-pm2.sh

# Quick backend restart
cd /var/www/dlnb/backend && npm run build && pm2 restart dlnb-backend

# Quick frontend update
cd /var/www/dlnb/frontend && npm run build && sudo cp -r dist/* /var/www/dalnaboyshop/

# View logs
pm2 logs dlnb-backend -f

# Check status
pm2 status && curl http://localhost:4002/api/health
```

---

**Note:** VPS'da allaqachon clone bor, faqat `git pull` qilib deploy qilish kifoya!
