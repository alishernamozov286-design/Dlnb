# Git Commit va VPS Deploy

## 1️⃣ Local'da Commit Qilish

```bash
# Barcha o'zgarishlarni qo'shish
git add .

# Commit
git commit -m "PWA fix: Added Vite PWA plugin, updated nginx config, added deploy script"

# Push
git push origin main
```

## 2️⃣ VPSda Deploy Qilish

### A. Deploy Script Yaratish

```bash
# VPSga kirish
ssh root@YOUR_VPS_IP

# Loyiha papkasiga o'tish
cd /var/www/dlnb

# Deploy script yaratish
nano deploy.sh
```

Quyidagini copy-paste qiling:

```bash
#!/bin/bash
set -e

echo "🚀 Deploy boshlandi..."

cd /var/www/dlnb
git pull origin main

cd frontend
npm install
npm run build

cp -r dist/* /var/www/dlnb/

sudo chown -R www-data:www-data /var/www/dlnb/
sudo chmod -R 755 /var/www/dlnb/

sudo systemctl reload nginx

echo "✅ Deploy tugadi!"
echo ""
echo "🔍 PWA Fayllar:"
ls -lh /var/www/dlnb/manifest.webmanifest 2>/dev/null || echo "❌ manifest.webmanifest topilmadi"
ls -lh /var/www/dlnb/sw.js 2>/dev/null || echo "❌ sw.js topilmadi"
ls -lh /var/www/dlnb/index.html 2>/dev/null || echo "❌ index.html topilmadi"
echo ""
echo "🌐 Sayt: https://dalnaboyshop.biznesjon.uz"
```

Saqlash: `Ctrl + O`, `Enter`, `Ctrl + X`

Ruxsat berish:
```bash
chmod +x deploy.sh
```

### B. Nginx Konfiguratsiyasini Yangilash

```bash
sudo nano /etc/nginx/sites-available/dalnaboyshop.conf
```

Faylni to'liq tozalang va quyidagini yozing:

```nginx
# HTTP dan HTTPS ga redirect
server {
    listen 80;
    server_name dalnaboyshop.biznesjon.uz;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name dalnaboyshop.biznesjon.uz;
    
    ssl_certificate /etc/letsencrypt/live/dalnaboyshop.biznesjon.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dalnaboyshop.biznesjon.uz/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    access_log /var/log/nginx/dalnaboyshop_access.log;
    error_log /var/log/nginx/dalnaboyshop_error.log;
    client_max_body_size 50M;
    
    # PWA Manifest
    location ~ ^/(manifest\.webmanifest|manifest\.json)$ {
        root /var/www/dlnb;
        add_header Content-Type application/manifest+json;
        add_header Cache-Control "public, max-age=604800";
        add_header Access-Control-Allow-Origin *;
    }
    
    # Service Worker
    location ~ ^/(sw\.js|workbox-.*\.js)$ {
        root /var/www/dlnb;
        add_header Content-Type application/javascript;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
    
    # Frontend
    location / {
        root /var/www/dlnb;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:4002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Saqlash: `Ctrl + O`, `Enter`, `Ctrl + X`

Nginx tekshirish:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### C. Deploy Qilish

```bash
cd /var/www/dlnb
./deploy.sh
```

## 3️⃣ Tekshirish

### Browser'da
1. `https://dalnaboyshop.biznesjon.uz` oching
2. `Ctrl + Shift + R` (hard refresh)
3. `F12` > `Console`
4. Quyidagi loglar ko'rinishi kerak:
   ```
   [PWA] Service Worker registered successfully
   [PWA] ✅ beforeinstallprompt event fired!
   ```
5. 2-3 soniya kutib, "Ilovani o'rnatish" tugmasi paydo bo'ladi

### Agar Chiqmasa
```javascript
// Browser Console'da
localStorage.removeItem('pwa-install-dismissed')
localStorage.removeItem('pwa-install-dismissed-ios')
location.reload()
```

## 4️⃣ Keyingi Deploylar

Har safar kod o'zgarganda:

```bash
# Local'da
git add .
git commit -m "Your message"
git push origin main

# VPSda
cd /var/www/dlnb
./deploy.sh
```

---

## ✅ Tayyor!

PWA install tugmasi endi ishlashi kerak! 🎉
