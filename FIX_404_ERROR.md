# 🔧 Fix 404 Error - dalnaboyshop.biznesjon.uz

404 xatosi - nginx konfiguratsiyasi yo'q yoki Docker containers ishlamayapti.

## 🔍 Step 1: Check Docker Containers

```bash
cd /var/www/dlnb

# Check if containers are running
docker ps | grep dlnb

# If not running, check logs
docker logs dlnb-backend --tail 50
docker logs dlnb-frontend --tail 50

# Check if containers exist but stopped
docker ps -a | grep dlnb
```

**If containers are not running:**

```bash
# Start containers
./manage.sh start

# Or redeploy
./deploy.sh
```

## 🌐 Step 2: Setup Nginx Configuration

```bash
cd /var/www/dlnb

# Copy nginx config
sudo cp nginx-dalnaboyshop.conf /etc/nginx/sites-available/dalnaboyshop.conf

# Enable the site
sudo ln -s /etc/nginx/sites-available/dalnaboyshop.conf /etc/nginx/sites-enabled/

# Remove default site if it conflicts
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

## ✅ Step 3: Verify Services

```bash
# 1. Check if backend is responding on port 4002
curl http://localhost:4002/api/health

# 2. Check if frontend is responding on port 8002
curl http://localhost:8002

# 3. Check nginx is proxying correctly
curl http://dalnaboyshop.biznesjon.uz/api/health

# 4. Check containers status
docker ps | grep dlnb
```

## 🔒 Step 4: Setup SSL (Optional but Recommended)

```bash
# Install certbot if not installed
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d dalnaboyshop.biznesjon.uz

# Test auto-renewal
sudo certbot renew --dry-run
```

## 🆘 Troubleshooting

### Problem 1: Containers not running

```bash
# Check why containers stopped
docker logs dlnb-backend --tail 100

# Common issues:
# - Port already in use
# - MongoDB connection failed
# - Environment variables missing

# Fix: Check .env.production
cat .env.production

# Restart
./deploy.sh
```

### Problem 2: Port 8002 or 4002 already in use

```bash
# Find what's using the port
sudo lsof -i :8002
sudo lsof -i :4002

# Kill the process
sudo kill -9 <PID>

# Or change ports in .env.production
nano .env.production
# Change FRONTEND_PORT and BACKEND_PORT
./deploy.sh
```

### Problem 3: Nginx 404 error

```bash
# Check nginx error log
sudo tail -f /var/log/nginx/error.log

# Check if site is enabled
ls -la /etc/nginx/sites-enabled/ | grep dalnaboyshop

# Check nginx config syntax
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Problem 4: Backend returns 502 Bad Gateway

```bash
# Backend is not responding
# Check if backend container is running
docker ps | grep dlnb-backend

# Check backend logs
docker logs dlnb-backend --tail 100

# Check if backend is listening on port 4002
curl http://localhost:4002/api/health

# If not, restart backend
docker restart dlnb-backend
```

### Problem 5: DNS not resolving

```bash
# Check if domain points to VPS
nslookup dalnaboyshop.biznesjon.uz

# Check VPS IP
curl ifconfig.me

# If IPs don't match, update DNS A record
```

## 📋 Complete Fix Commands (Copy-Paste)

```bash
# Navigate to project
cd /var/www/dlnb

# Check containers
docker ps | grep dlnb

# If not running, deploy
./deploy.sh

# Setup nginx
sudo cp nginx-dalnaboyshop.conf /etc/nginx/sites-available/dalnaboyshop.conf
sudo ln -s /etc/nginx/sites-available/dalnaboyshop.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL
sudo certbot --nginx -d dalnaboyshop.biznesjon.uz

# Verify
curl http://localhost:4002/api/health
curl https://dalnaboyshop.biznesjon.uz/api/health
```

## ✅ Expected Results

After fixing:

1. **Backend health check:**
   ```bash
   curl http://localhost:4002/api/health
   # Should return: {"status":"ok"}
   ```

2. **Frontend:**
   ```bash
   curl http://localhost:8002
   # Should return: HTML content
   ```

3. **Domain:**
   ```bash
   curl https://dalnaboyshop.biznesjon.uz
   # Should return: HTML content (login page)
   ```

4. **Containers:**
   ```bash
   docker ps | grep dlnb
   # Should show 3 running containers:
   # - dlnb-frontend
   # - dlnb-backend
   # - dlnb-mongodb
   ```

## 📞 Quick Diagnostics

Run this to get full status:

```bash
echo "=== Docker Containers ==="
docker ps | grep dlnb

echo -e "\n=== Backend Health ==="
curl -s http://localhost:4002/api/health || echo "Backend not responding"

echo -e "\n=== Frontend ==="
curl -s -o /dev/null -w "%{http_code}" http://localhost:8002 || echo "Frontend not responding"

echo -e "\n=== Nginx Sites ==="
ls -la /etc/nginx/sites-enabled/ | grep dalnaboyshop

echo -e "\n=== Nginx Test ==="
sudo nginx -t

echo -e "\n=== Domain Check ==="
curl -s -o /dev/null -w "%{http_code}" http://dalnaboyshop.biznesjon.uz
```

---

**Most Common Issue:** Nginx configuration not created or not enabled. Follow Step 2 above to fix.
