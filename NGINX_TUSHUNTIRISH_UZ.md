# Nginx Konfiguratsiyasi - To'liq Tushuntirish

## 1. Server Asoslari

```nginx
server {
    listen 80;
    server_name dalnaboyshop.biznesjon.uz;
```

**Tushuntirish:**
- `listen 80` - 80-portni tingla (HTTP)
- `server_name` - Sizning domeningiz yoki IP manzilingiz

---

## 2. Xavfsizlik Headerlari

```nginx
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
```

**Tushuntirish:**
- Saytni xakerlardan himoya qilish uchun
- Iframe, XSS hujumlaridan saqlaydi

---

## 3. Loglar

```nginx
    access_log /var/log/nginx/dlnb_access.log;
    error_log /var/log/nginx/dlnb_error.log;
```

**Tushuntirish:**
- Barcha so'rovlar va xatolar saqlanadi
- Muammolarni topish uchun kerak

---

## 4. Fayl Yuklash Hajmi

```nginx
    client_max_body_size 50M;
```

**Tushuntirish:**
- Maksimal 50MB fayl yuklash mumkin
- Rasm, PDF yuklash uchun kerak

---

## 5. PWA Manifest (ENG MUHIM!)

```nginx
    location ~ ^/(manifest\.webmanifest|manifest\.json)$ {
        root /var/www/dlnb;
        add_header Content-Type application/manifest+json;
        add_header Cache-Control "public, max-age=604800";
        add_header Access-Control-Allow-Origin *;
    }
```

**Tushuntirish:**
- `manifest.webmanifest` yoki `manifest.json` faylini serve qiladi
- PWA uchun JUDA MUHIM!
- Bu fayl ilovaning nomi, ikonkasi, ranglarini o'z ichiga oladi
- `Content-Type` - To'g'ri fayl turi
- `Cache-Control` - 7 kun cache qilish
- `Access-Control-Allow-Origin *` - Barcha domenlardan kirish mumkin

**Bu qism bo'lmasa:** PWA install tugmasi chiqmaydi!

---

## 6. Service Worker (ENG MUHIM!)

```nginx
    location ~ ^/(sw\.js|workbox-.*\.js)$ {
        root /var/www/dlnb;
        add_header Content-Type application/javascript;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
```

**Tushuntirish:**
- `sw.js` va `workbox-*.js` fayllarini serve qiladi
- Service Worker - PWA'ning asosiy qismi
- **CACHE QILMASLIK KERAK!** Har doim yangi versiya yuklanishi kerak
- `no-cache` - Hech qachon cache qilma
- `must-revalidate` - Har safar serverdan tekshir

**Bu qism bo'lmasa:** Service Worker ishlamaydi, PWA ishlamaydi!

---

## 7. Frontend (Statik Fayllar)

```nginx
    location / {
        root /var/www/dlnb;
        try_files $uri $uri/ /index.html;
```

**Tushuntirish:**
- `/` - Barcha so'rovlar uchun
- `root /var/www/dlnb` - Fayllar qayerda joylashgan
- `try_files $uri $uri/ /index.html` - React Router uchun kerak
  - Avval faylni topishga harakat qil
  - Topilmasa, index.html'ni qaytir

**Misol:**
- `/about` so'rovi kelsa → `index.html` qaytariladi
- React Router `/about` sahifasini ko'rsatadi

---

## 8. Statik Fayllarni Cache Qilish

```nginx
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
```

**Tushuntirish:**
- Rasmlar, CSS, JS fayllarni 1 yil cache qilish
- Tezroq yuklash uchun
- `immutable` - Fayl hech qachon o'zgarmaydi

---

## 9. Backend API

```nginx
    location /api {
        proxy_pass http://localhost:4002;
        proxy_http_version 1.1;
```

**Tushuntirish:**
- `/api` bilan boshlanadigan barcha so'rovlar
- Backend serverga yo'naltiriladi (port 4002)
- `proxy_pass` - So'rovni boshqa serverga yuborish

**Misol:**
- `https://dalnaboyshop.biznesjon.uz/api/users` → `http://localhost:4002/api/users`

---

## 10. WebSocket Support

```nginx
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
```

**Tushuntirish:**
- Real-time aloqa uchun
- Chat, notification uchun kerak

---

## 11. Proxy Headerlar

```nginx
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
```

**Tushuntirish:**
- Backend'ga foydalanuvchi haqida ma'lumot yuborish
- `X-Real-IP` - Foydalanuvchining haqiqiy IP manzili
- `X-Forwarded-For` - Proxy orqali o'tgan IP manzillar
- `X-Forwarded-Proto` - HTTP yoki HTTPS

---

## 12. Timeout Sozlamalari

```nginx
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }
}
```

**Tushuntirish:**
- Uzoq so'rovlar uchun
- 120 soniya kutish
- AI, rasmlarni qayta ishlash uchun kerak

---

## PWA Uchun Eng Muhim Qismlar

### ✅ 1. Manifest Location
```nginx
location ~ ^/(manifest\.webmanifest|manifest\.json)$ {
    root /var/www/dlnb;
    add_header Content-Type application/manifest+json;
    add_header Access-Control-Allow-Origin *;
}
```

### ✅ 2. Service Worker Location
```nginx
location ~ ^/(sw\.js|workbox-.*\.js)$ {
    root /var/www/dlnb;
    add_header Content-Type application/javascript;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

**Bu 2 ta qism bo'lmasa, PWA install tugmasi chiqmaydi!**

---

## To'liq Konfiguratsiya (Copy-Paste Qiling)

```nginx
server {
    listen 80;
    server_name dalnaboyshop.biznesjon.uz;
    
    access_log /var/log/nginx/dlnb_access.log;
    error_log /var/log/nginx/dlnb_error.log;
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
    }
}
```

---

## VPSda Qanday Yozish

```bash
# 1. Fayl ochish
sudo nano /etc/nginx/sites-available/dlnb

# 2. Yuqoridagi konfiguratsiyani copy-paste qiling

# 3. Saqlash
Ctrl + O
Enter
Ctrl + X

# 4. Faollashtirish
sudo ln -s /etc/nginx/sites-available/dlnb /etc/nginx/sites-enabled/dlnb

# 5. Tekshirish
sudo nginx -t

# 6. Qayta yuklash
sudo systemctl reload nginx
```

---

## Xulosa

**PWA uchun 2 ta qism majburiy:**
1. ✅ Manifest location - PWA ma'lumotlari
2. ✅ Service Worker location - Offline rejim

**Bu qismlar bo'lmasa:**
- ❌ PWA install tugmasi chiqmaydi
- ❌ Offline rejim ishlamaydi
- ❌ Service Worker ro'yxatdan o'tmaydi

**Qolgan qismlar:**
- Frontend serve qilish
- Backend API proxy
- Cache sozlamalari
- Xavfsizlik
