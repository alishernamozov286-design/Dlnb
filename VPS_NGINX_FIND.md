# Nginx Konfiguratsiyasini Topish

VPSda quyidagi buyruqlarni bajaring:

## 1. Mavjud Nginx Konfiguratsiyalarini Topish

```bash
# Barcha nginx konfiguratsiyalarini ko'rish
ls -la /etc/nginx/sites-available/

# Yoki
ls -la /etc/nginx/conf.d/

# Faol konfiguratsiyalarni ko'rish
ls -la /etc/nginx/sites-enabled/
```

## 2. Nginx Asosiy Konfiguratsiyasini Ko'rish

```bash
cat /etc/nginx/nginx.conf
```

## 3. Loyihangiz Uchun Konfiguratsiya Topish

```bash
# "dlnb" yoki "dalnaboyshop" so'zini qidirish
sudo grep -r "dlnb" /etc/nginx/
sudo grep -r "dalnaboyshop" /etc/nginx/
sudo grep -r "4002" /etc/nginx/
```

## 4. Agar Hech Narsa Topilmasa

Nginx to'g'ridan-to'g'ri asosiy konfiguratsiyada bo'lishi mumkin:

```bash
sudo nano /etc/nginx/nginx.conf
```

Yoki yangi konfiguratsiya yaratish:

```bash
sudo nano /etc/nginx/sites-available/dlnb
```

## 5. Nginx Qanday Ishlayotganini Tekshirish

```bash
# Nginx jarayonlarini ko'rish
ps aux | grep nginx

# Qaysi portlarda tinglayotganini ko'rish
sudo netstat -tlnp | grep nginx

# Yoki
sudo ss -tlnp | grep nginx
```

## 6. Nginx Test Konfiguratsiyasi

```bash
sudo nginx -t
```

Bu sizga qaysi konfiguratsiya fayllarini ishlatayotganini ko'rsatadi.
