# VPSda PWA To'g'rilash - Qadamma-qadam

## Faqat 1 ta Fayl Tahrirlash Kerak! 📝

VPSda faqat **Nginx konfiguratsiyasini** yangilash kerak. Qolgan hamma narsa Git orqali avtomatik yangilanadi.

## 🚀 To'liq Qadamlar

### 1. VPSga Kirish
```bash
ssh root@YOUR_VPS_IP
```

### 2. Loyiha Papkasiga O'tish
```bash
cd /var/www/dalnaboyshop
```

### 3. Git'dan Yangilash
```bash
git pull origin main
```

### 4. Frontend Build
```bash
cd frontend
npm install
npm run build
```

### 5. Fayllarni Ko'chirish
```bash
# dist papkasidan asosiy papkaga
cp -r dist/* /var/www/dalnaboyshop/
cd ..
```

### 6. Nginx Konfiguratsiyasini Yangilash (ASOSIY QADAM!)
```bash
# Yangi konfiguratsiyani ko'chirish
sudo cp nginx-dalnaboyshop.conf /etc/nginx/sites-available/dalnaboyshop

# Konfiguratsiyani tekshirish
sudo nginx -t

# Nginx qayta yuklash
sudo systemctl reload nginx
```

## 📝 Yoki Qo'lda Tahrirlash

Agar `nginx-dalnaboyshop.conf` faylini qo'lda tahrirlashni xohlasangiz:

```bash
sudo nano /etc/nginx/sites-available/dalnaboyshop
```

Quyidagi qismlarni qo'shing:

### PWA Manifest (server {} bloki ichiga)
```nginx
# PWA Manifest
location ~ ^/(manifest\.webmanifest|manifest\.json)$ {
    root /var/www/dalnaboyshop;
    add_header Content-Type application/manifest+json;
    add_header Cache-Control "public, max-age=604800";
    add_header Access-Control-Allow-Origin *;
}
```

### Service Worker (server {} bloki ichiga)
```nginx
# Service Worker - NO CACHE
location ~ ^/(sw\.js|workbox-.*\.js)$ {
    root /var/www/dalnaboyshop;
    add_header Content-Type application/javascript;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
}
```

**Muhim:** Bu qismlarni `location /` dan **OLDIN** qo'shing!

### Saqlash va Chiqish
```
Ctrl + O  (saqlash)
Enter     (tasdiqlash)
Ctrl + X  (chiqish)
```

### Nginx Qayta Yuklash
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 SSL O'rnatish (Agar o'rnatilmagan bo'lsa)

```bash
# Certbot o'rnatish
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# SSL sertifikat olish
sudo certbot --nginx -d dalnaboyshop.biznesjon.uz
```

## ✅ Tekshirish

### 1. Fayllar Mavjudligini Tekshirish
```bash
# Manifest
ls -lh /var/www/dalnaboyshop/manifest.webmanifest

# Service Worker
ls -lh /var/www/dalnaboyshop/sw.js

# Index
ls -lh /var/www/dalnaboyshop/index.html
```

### 2. Nginx Konfiguratsiyasini Ko'rish
```bash
sudo cat /etc/nginx/sites-available/dalnaboyshop
```

### 3. Nginx Statusini Tekshirish
```bash
sudo systemctl status nginx
```

### 4. Loglarni Ko'rish
```bash
# Error logs
sudo tail -f /var/log/nginx/dalnaboyshop_error.log

# Access logs
sudo tail -f /var/log/nginx/dalnaboyshop_access.log
```

### 5. Browser'da Test
```
https://dalnaboyshop.biznesjon.uz
```

F12 > Console'da ko'rinishi kerak:
```
[PWA] Service Worker registered successfully
[PWA] ✅ beforeinstallprompt event fired!
```

## 🔧 Muammolarni Hal Qilish

### Nginx Qayta Ishga Tushirish
```bash
sudo systemctl restart nginx
```

### Nginx Konfiguratsiya Xatolarini Ko'rish
```bash
sudo nginx -t
```

### Fayllar Ruxsatlarini Tekshirish
```bash
ls -la /var/www/dalnaboyshop/
```

Agar ruxsatlar noto'g'ri bo'lsa:
```bash
sudo chown -R www-data:www-data /var/www/dalnaboyshop/
sudo chmod -R 755 /var/www/dalnaboyshop/
```

### Cache Tozalash (Browser'da)
```
Ctrl + Shift + R
F12 > Application > Clear storage > Clear site data
```

## 📊 Xulosa

VPSda faqat **1 ta fayl** tahrirlash kerak:
- ✅ `/etc/nginx/sites-available/dalnaboyshop` - Nginx konfiguratsiyasi

Qolgan hamma narsa Git orqali avtomatik yangilanadi:
- ✅ Frontend kodi
- ✅ Service Worker
- ✅ Manifest
- ✅ PWA komponenti

---

**Muvaffaqiyatli deploy! 🎉**
