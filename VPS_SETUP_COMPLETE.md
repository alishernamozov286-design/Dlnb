# VPSda PWA To'liq Sozlash

## 🎯 Muammo va Yechim

**Muammo:** `dist/` papkasi `.gitignore`da, shuning uchun PWA fayllari Git orqali VPSga kelmaydi.

**Yechim:** VPSda build qilish kerak (bu to'g'ri amaliyot).

---

## 📋 VPSda Bajariladigan Qadamlar

### 1. Deploy Script Yaratish

```bash
# VPSda
cd /var/www/dlnb
nano deploy.sh
```

Quyidagini yozing:

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
ls -lh /var/www/dlnb/manifest.webmanifest
ls -lh /var/www/dlnb/sw.js
```

Ruxsat bering:
```bash
chmod +x deploy.sh
```

### 2. Nginx Konfiguratsiyasi

```bash
sudo nano /etc/nginx/sites-available/dalnaboyshop.conf
```

To'liq konfiguratsiya:

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
    
    # SSL
    ssl_certificate /etc/letsencrypt/live/dalnaboyshop.biznesjon.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dalnaboyshop.biznesjon.uz/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Logging
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

### 3. Deploy Qilish

```bash
cd /var/www/dlnb
./deploy.sh
```

### 4. Tekshirish

```bash
# Fayllar mavjudligini tekshirish
ls -lh /var/www/dlnb/ | grep -E "(manifest|sw\.js|index\.html)"

# Nginx statusini tekshirish
sudo systemctl status nginx

# Loglarni ko'rish
sudo tail -f /var/log/nginx/dalnaboyshop_error.log
```

---

## 🌐 Browser'da Test

1. `https://dalnaboyshop.biznesjon.uz` oching
2. `F12` > `Console`
3. Quyidagi loglar ko'rinishi kerak:
   ```
   [PWA] Service Worker registered successfully
   [PWA] ✅ beforeinstallprompt event fired!
   ```
4. 2-3 soniya kutib, "Ilovani o'rnatish" tugmasi paydo bo'ladi

---

## 🔧 Muammolarni Hal Qilish

### Agar PWA Tugmasi Chiqmasa

```javascript
// Browser Console'da
localStorage.removeItem('pwa-install-dismissed')
localStorage.removeItem('pwa-install-dismissed-ios')
location.reload()
```

### Agar Fayllar Topilmasa

```bash
# Build qayta qilish
cd /var/www/dlnb/frontend
npm run build
cp -r dist/* /var/www/dlnb/

# Ruxsatlarni tekshirish
ls -la /var/www/dlnb/
```

### Nginx Xatolari

```bash
# Konfiguratsiyani tekshirish
sudo nginx -t

# Nginx qayta ishga tushirish
sudo systemctl restart nginx

# Loglarni ko'rish
sudo tail -f /var/log/nginx/error.log
```

---

## 📊 Keyingi Deploylar

Har safar kod o'zgarganda:

```bash
cd /var/www/dlnb
./deploy.sh
```

Shunchaki! 🎉

---

## ✅ Xulosa

- ✅ `.gitignore` to'g'ri (dist/ ignore qilingan)
- ✅ VPSda build qilish kerak
- ✅ Deploy script yaratildi
- ✅ Nginx PWA uchun sozlangan
- ✅ SSL ishlayapti

**Muammo hal qilindi!** 🎉
