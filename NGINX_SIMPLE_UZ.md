# Nginx - Oddiy Tushuntirish

## VPSda Bajaring

### 1. Fayl Ochish
```bash
sudo nano /etc/nginx/sites-available/dlnb
```

### 2. Quyidagi Kodni Yozing

```nginx
server {
    listen 80;
    server_name dalnaboyshop.biznesjon.uz;
    
    # PWA Manifest (MUHIM!)
    location ~ ^/(manifest\.webmanifest|manifest\.json)$ {
        root /var/www/dlnb;
        add_header Content-Type application/manifest+json;
        add_header Access-Control-Allow-Origin *;
    }
    
    # Service Worker (MUHIM!)
    location ~ ^/(sw\.js|workbox-.*\.js)$ {
        root /var/www/dlnb;
        add_header Content-Type application/javascript;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
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
    }
}
```

### 3. Saqlash
```
Ctrl + O  (saqlash)
Enter     (tasdiqlash)
Ctrl + X  (chiqish)
```

### 4. Faollashtirish
```bash
sudo ln -s /etc/nginx/sites-available/dlnb /etc/nginx/sites-enabled/dlnb
sudo nginx -t
sudo systemctl reload nginx
```

## Nima Qildik?

### 1. `listen 80` 
- 80-portni tingla (HTTP)

### 2. `server_name`
- Sizning domeningiz

### 3. PWA Manifest (1-chi muhim qism)
- `manifest.webmanifest` faylini to'g'ri serve qilish
- Bu fayl ilovaning nomi, ikonkasi haqida ma'lumot beradi

### 4. Service Worker (2-chi muhim qism)
- `sw.js` faylini cache qilmasdan serve qilish
- Bu PWA'ning asosiy qismi

### 5. Frontend
- Barcha fayllarni `/var/www/dlnb` dan serve qilish
- React Router uchun `index.html` qaytarish

### 6. Backend API
- `/api` so'rovlarini backend'ga yo'naltirish

## Eng Muhim!

**Bu 2 ta qism bo'lmasa, PWA ishlamaydi:**

```nginx
# 1. Manifest
location ~ ^/(manifest\.webmanifest|manifest\.json)$ {
    root /var/www/dlnb;
    add_header Content-Type application/manifest+json;
}

# 2. Service Worker
location ~ ^/(sw\.js|workbox-.*\.js)$ {
    root /var/www/dlnb;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

Shunchaki! 🎉
