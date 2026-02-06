# Nginx Konfiguratsiyasini Yaratish

## VPSda Bajaring

### 1. Mavjud Konfiguratsiyalarni Topish
```bash
# Barcha konfiguratsiyalarni ko'rish
ls -la /etc/nginx/sites-available/
ls -la /etc/nginx/sites-enabled/
ls -la /etc/nginx/conf.d/
```

### 2. Yangi Konfiguratsiya Yaratish
```bash
sudo nano /etc/nginx/sites-available/dlnb
```

### 3. Quyidagi Kodni Joylashtiring

```nginx
server {
    listen 80;
    server_name dalnaboyshop.biznesjon.uz;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Logging
    access_log /var/log/nginx/dlnb_access.log;
    error_log /var/log/nginx/dlnb_error.log;
    
    # Max upload size
    client_max_body_size 50M;
    
    # PWA Manifest
    location ~ ^/(manifest\.webmanifest|manifest\.json)$ {
        root /var/www/dlnb;
        add_header Content-Type application/manifest+json;
        add_header Cache-Control "public, max-age=604800";
        add_header Access-Control-Allow-Origin *;
    }
    
    # Service Worker - NO CACHE
    location ~ ^/(sw\.js|workbox-.*\.js)$ {
        root /var/www/dlnb;
        add_header Content-Type application/javascript;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
    
    # Frontend (Static Files)
    location / {
        root /var/www/dlnb;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:4002;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_cache_bypass $http_upgrade;
        
        # Longer timeouts for API
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }
}
```

### 4. Saqlash va Chiqish
```
Ctrl + O  (saqlash)
Enter     (tasdiqlash)
Ctrl + X  (chiqish)
```

### 5. Konfiguratsiyani Faollashtirish
```bash
# Symlink yaratish
sudo ln -s /etc/nginx/sites-available/dlnb /etc/nginx/sites-enabled/dlnb

# Yoki agar sites-enabled ishlatilmasa
# Faylni to'g'ridan-to'g'ri conf.d ga ko'chirish
sudo cp /etc/nginx/sites-available/dlnb /etc/nginx/conf.d/dlnb.conf
```

### 6. Nginx Tekshirish
```bash
sudo nginx -t
```

### 7. Nginx Qayta Yuklash
```bash
sudo systemctl reload nginx
```

## Agar Xato Bo'lsa

### Default Konfiguratsiyani O'chirish
```bash
# Agar default konfiguratsiya bilan konflikt bo'lsa
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### Portni Tekshirish
```bash
# Port 80 band bo'lsa
sudo lsof -i :80

# Yoki
sudo netstat -tlnp | grep :80
```

### Nginx Loglarini Ko'rish
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/dlnb_error.log
```

## Tezkor Buyruqlar

```bash
# 1. Konfiguratsiya yaratish
sudo nano /etc/nginx/sites-available/dlnb

# 2. Faollashtirish
sudo ln -s /etc/nginx/sites-available/dlnb /etc/nginx/sites-enabled/dlnb

# 3. Tekshirish
sudo nginx -t

# 4. Qayta yuklash
sudo systemctl reload nginx

# 5. Statusni ko'rish
sudo systemctl status nginx
```

## SSL O'rnatish (Keyin)

```bash
sudo certbot --nginx -d dalnaboyshop.biznesjon.uz
```

Bu avtomatik ravishda konfiguratsiyani yangilaydi va HTTPS qo'shadi.
