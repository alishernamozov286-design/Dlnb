# SSL Sertifikat O'rnatish (Let's Encrypt)

PWA ishlashi uchun HTTPS majburiy! Quyidagi qadamlarni bajaring:

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
# Nginx to'xtatish (agar ishlab tursa)
sudo systemctl stop nginx

# Sertifikat olish
sudo certbot certonly --standalone -d alochibolajon.uz -d www.alochibolajon.uz

# Yoki Nginx bilan birga
sudo certbot --nginx -d alochibolajon.uz -d www.alochibolajon.uz
```

Certbot sizdan email so'raydi va shartlarni qabul qilishingizni so'raydi.

## 3. Nginx Konfiguratsiyasini Yangilash

Certbot avtomatik ravishda nginx.conf ni yangilaydi. Agar qo'lda qilish kerak bo'lsa:

```nginx
server {
    listen 443 ssl http2;
    server_name alochibolajon.uz www.alochibolajon.uz;
    
    # SSL sertifikatlar (Certbot tomonidan yaratilgan)
    ssl_certificate /etc/letsencrypt/live/alochibolajon.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/alochibolajon.uz/privkey.pem;
    
    # Qolgan konfiguratsiya...
}
```

## 4. Nginx Qayta Yuklash

```bash
# Konfiguratsiyani tekshirish
sudo nginx -t

# Nginx qayta yuklash
sudo systemctl restart nginx
```

## 5. Avtomatik Yangilanish

Let's Encrypt sertifikatlari 90 kun amal qiladi. Avtomatik yangilash uchun:

```bash
# Cron job tekshirish
sudo systemctl status certbot.timer

# Yoki qo'lda test qilish
sudo certbot renew --dry-run
```

## 6. Docker bilan Ishlash

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
sudo certbot certonly --standalone -d alochibolajon.uz -d www.alochibolajon.uz

# Docker qayta ishga tushirish
docker-compose -f docker-compose.production.yml up -d
```

## 7. Tekshirish

SSL to'g'ri o'rnatilganini tekshirish:

```bash
# Browser orqali
https://alochibolajon.uz

# Yoki curl bilan
curl -I https://alochibolajon.uz
```

## 8. PWA Tekshirish

SSL o'rnatilgandan keyin:

1. Telefonda `https://alochibolajon.uz` ochib ko'ring
2. Chrome DevTools > Application > Manifest tekshiring
3. "Install" tugmasi paydo bo'lishi kerak

## Muammolarni Hal Qilish

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

# Firewalld (CentOS)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### DNS muammosi:

Domain DNS sozlamalarida A record to'g'ri ko'rsatilganini tekshiring:
- `alochibolajon.uz` → VPS IP
- `www.alochibolajon.uz` → VPS IP

```bash
# DNS tekshirish
nslookup alochibolajon.uz
dig alochibolajon.uz
```

## Xavfsizlik

SSL o'rnatilgandan keyin:
- ✅ PWA ishlaydi
- ✅ HTTPS majburiy
- ✅ Ma'lumotlar shifrlangan
- ✅ Google SEO yaxshilanadi
- ✅ Foydalanuvchilar ishonadi

---

**Muhim:** Let's Encrypt bepul va 90 kun amal qiladi. Certbot avtomatik yangilaydi!
