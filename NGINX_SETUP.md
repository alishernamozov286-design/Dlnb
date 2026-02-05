# 🌐 Nginx Setup for dalnaboyshop.biznesjon.uz

## ❌ Problem: 404 Not Found

Nginx konfiguratsiyasi yo'q yoki noto'g'ri.

## ✅ Solution: VPS'da quyidagi commandlarni bajaring

### 1. Check Current Status

```bash
# Check if containers are running
cd /var/www/dlnb
docker ps | grep dlnb

# Should show:
# dlnb-frontend (port 8002)
# dlnb-backend (port 4002)
# dlnb-mongodb (port 27019)
```

Agar container'lar ishlamasa:

```bash
cd /var/www/dlnb
./deploy.sh
```

### 2. Create Nginx Configuration

```bash
cd /var/www/dlnb

# Copy nginx config
sudo cp nginx-dalnaboyshop.conf /etc/nginx/sites-available/dalnaboyshop.conf

# Enable site
sudo ln -s /etc/nginx/sites-available/dalnaboyshop.conf /etc/nginx/sites-enabled/

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 3. Get SSL Certificate

```bash
# Install certbot if not installed
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d dalnaboyshop.biznesjon.uz
```

### 4. Verify

```bash
# Check nginx status
sudo systemctl status nginx

# Check site
curl -I http://dalnaboyshop.biznesjon.uz
curl -I https://dalnaboyshop.biznesjon.uz

# Check backend
curl http://localhost:4002/api/health
```

## 🔍 Troubleshooting

### Container'lar ishlamasa:

```bash
cd /var/www/dlnb

# Check logs
docker logs dlnb-backend --tail 50
docker logs dlnb-frontend --tail 50

# Restart
docker-compose -f docker-compose.production.yml --env-file .env.production restart
```

### Nginx xatosi:

```bash
# Check nginx error log
sudo tail -f /var/log/nginx/error.log

# Check nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### Port band bo'lsa:

```bash
# Check what's using port 8002
sudo lsof -i :8002

# Check what's using port 4002
sudo lsof -i :4002
```

### DNS tekshirish:

```bash
# Check DNS
nslookup dalnaboyshop.biznesjon.uz

# Should point to your VPS IP
```

## 📋 Quick Fix Commands

```bash
# Full setup in one go:
cd /var/www/dlnb
sudo cp nginx-dalnaboyshop.conf /etc/nginx/sites-available/dalnaboyshop.conf
sudo ln -s /etc/nginx/sites-available/dalnaboyshop.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d dalnaboyshop.biznesjon.uz
```

## ✅ Expected Result

After setup:
- **HTTP:** http://dalnaboyshop.biznesjon.uz → redirects to HTTPS
- **HTTPS:** https://dalnaboyshop.biznesjon.uz → works ✅
- **API:** https://dalnaboyshop.biznesjon.uz/api/health → returns health status

---

**Note:** Agar hali ham ishlamasa, container'lar to'g'ri ishlab turganligini tekshiring: `docker ps | grep dlnb`
