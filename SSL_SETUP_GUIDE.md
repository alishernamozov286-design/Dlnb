# SSL Sertifikat O'rnatish (Let's Encrypt)

⚠️ **MUHIM:** PWA ishlashi uchun HTTPS majburiy! PWA install tugmasi faqat HTTPS yoki localhost'da ko'rinadi.

## 1. Certbot O'rnatish

VPS serveringizga SSH orqali kiring va quyidagi buyruqlarni bajaring:

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx -y
```

## 2. SSL Sertifikat Olish

```bash
# Nginx bilan birga (TAVSIYA ETILADI)
sudo certbot --nginx -d dalnaboyshop.biznesjon.uz

# Yoki standalone (Nginx to'xtatib)
sudo systemctl stop nginx
sudo certbot certonly --standalone -d dalnaboyshop.biznesjon.uz
sudo systemctl start nginx
```

Certbot sizdan email so'raydi va shartlarni qabul qilishingizni so'raydi.

## 3. Nginx Konfiguratsiyasini Tekshirish

Certbot avtomatik ravishda nginx.conf ni yangilaydi. Quyidagi qatorlar qo'shilgan bo'lishi kerak:

```nginx
server {
    listen 443 ssl http2;
    server_name dalnaboyshop.biznesjon.uz;
    
    # SSL sertifikatlar (Certbot tomonidan yaratilgan)
    ssl_certificate /etc/letsencrypt/live/dalnaboyshop.biznesjon.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dalnaboyshop.biznesjon.uz/privkey.pem;
    
    # PWA uchun muhim headerlar
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Qolgan konfiguratsiya...
}

# HTTP dan HTTPS ga redirect
server {
    listen 80;
    server_name dalnaboyshop.biznesjon.uz;
    return 301 https://$server_name$request_uri;
}
```

## 4. Nginx Qayta Yuklash

```bash
# Konfiguratsiyani tekshirish
sudo nginx -t

# Nginx qayta yuklash
sudo systemctl reload nginx
```

## 5. Avtomatik Yangilanish

Let's Encrypt sertifikatlari 90 kun amal qiladi. Avtomatik yangilash uchun:

```bash
# Cron job tekshirish
sudo systemctl status certbot.timer

# Yoki qo'lda test qilish
sudo certbot renew --dry-run
```

## 6. PWA Tekshirish

SSL o'rnatilgandan keyin:

### Browser'da:
1. `https://dalnaboyshop.biznesjon.uz` ochib ko'ring
2. `F12` > `Application` > `Manifest` tekshiring
3. `F12` > `Console` loglarni ko'ring:
   ```
   [PWA] Service Worker registered successfully
   [PWA] ✅ beforeinstallprompt event fired!
   ```

### Telefonda:
1. Chrome'da `https://dalnaboyshop.biznesjon.uz` oching
2. 2-3 soniya kuting
3. "Ilovani o'rnatish" tugmasi paydo bo'lishi kerak

### Lighthouse Test:
```
F12 > Lighthouse > Progressive Web App > Generate report
```
90+ ball bo'lishi kerak

## 7. Muammolarni Hal Qilish

### Port 80/443 band bo'lsa:

```bash
# Qaysi dastur ishlatayotganini tekshirish
sudo lsof -i :80
sudo lsof -i :443

# Nginx to'xtatish
sudo systemctl stop nginx
```

### Firewall muammosi:

```bash
# UFW (Ubuntu)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload

# Firewalld (CentOS)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### DNS muammosi:

Domain DNS sozlamalarida A record to'g'ri ko'rsatilganini tekshiring:
- `dalnaboyshop.biznesjon.uz` → VPS IP

```bash
# DNS tekshirish
nslookup dalnaboyshop.biznesjon.uz
dig dalnaboyshop.biznesjon.uz
```

### PWA install tugmasi chiqmasa:

1. **Browser cache tozalash:**
   ```
   Ctrl + Shift + R (hard refresh)
   F12 > Application > Clear storage > Clear site data
   ```

2. **PWA dismiss flagini tozalash:**
   ```javascript
   // Browser Console'da
   localStorage.removeItem('pwa-install-dismissed')
   localStorage.removeItem('pwa-install-dismissed-ios')
   location.reload()
   ```

3. **Service Worker tekshirish:**
   ```
   F12 > Application > Service Workers
   ```
   "Activated and is running" ko'rinishi kerak

4. **Manifest tekshirish:**
   ```bash
   curl https://dalnaboyshop.biznesjon.uz/manifest.webmanifest
   ```
   JSON qaytishi kerak

## 8. Docker bilan Ishlash

Agar Docker ishlatayotgan bo'lsangiz:

### docker-compose.production.yml ga qo'shish:

```yaml
services:
  nginx:
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - /var/lib/letsencrypt:/var/lib/letsencrypt:ro
```

### Sertifikat olish (Docker tashqarida):

```bash
# Docker to'xtatish
docker-compose -f docker-compose.production.yml down

# Sertifikat olish
sudo certbot certonly --standalone -d dalnaboyshop.biznesjon.uz

# Docker qayta ishga tushirish
docker-compose -f docker-compose.production.yml up -d
```

## Xavfsizlik va Foydalari

SSL o'rnatilgandan keyin:
- ✅ PWA ishlaydi (install tugmasi chiqadi)
- ✅ HTTPS majburiy
- ✅ Ma'lumotlar shifrlangan
- ✅ Google SEO yaxshilanadi
- ✅ Foydalanuvchilar ishonadi
- ✅ Service Worker ishlaydi
- ✅ Offline rejim ishlaydi

---

**Muhim:** 
- Let's Encrypt bepul va 90 kun amal qiladi
- Certbot avtomatik yangilaydi
- PWA faqat HTTPS'da ishlaydi (localhost bundan mustasno)
