# ✅ Production Deployment Checklist

VPS'ga deploy qilishdan oldin bu checklist'ni bajaring.

## 📋 Pre-Deployment

### 1. Environment Configuration

- [ ] `.env.production` fayli yaratilgan
- [ ] `VPS_IP` to'g'ri kiritilgan
- [ ] Unique portlar tanlangan (boshqa saytlar bilan konflikt yo'q)
- [ ] `MONGO_ROOT_PASSWORD` strong password (32+ chars)
- [ ] `JWT_SECRET` strong secret (64+ chars)
- [ ] `GROQ_API_KEY` kiritilgan
- [ ] Telegram bot tokenlar kiritilgan
- [ ] `ADMIN_CHAT_ID` kiritilgan
- [ ] `VITE_GOOGLE_MAPS_API_KEY` kiritilgan
- [ ] `VITE_API_URL` to'g'ri (IP yoki domain)
- [ ] `WEBHOOK_URL` to'g'ri

### 2. Port Planning

- [ ] Frontend port available: `./check-ports.sh`
- [ ] Backend port available
- [ ] MongoDB port available
- [ ] Portlar boshqa saytlar bilan konflikt qilmaydi

### 3. VPS Requirements

- [ ] Docker installed: `docker --version`
- [ ] Docker Compose installed: `docker-compose --version`
- [ ] Git installed: `git --version`
- [ ] Sufficient disk space: `df -h` (minimum 10GB free)
- [ ] Sufficient RAM: `free -h` (minimum 2GB)

### 4. Security

- [ ] Strong passwords generated: `./generate-secrets.sh`
- [ ] `.env.production` not in git: `git status`
- [ ] SSH key authentication enabled
- [ ] Root login disabled (optional but recommended)

## 🚀 Deployment

### 5. Clone & Setup

```bash
cd /var/www
git clone <repo-url> biznes
cd biznes
```

- [ ] Repository cloned successfully
- [ ] All files present: `ls -la`

### 6. Configuration

```bash
nano .env.production
```

- [ ] All environment variables configured
- [ ] Saved and closed editor

### 7. Port Check

```bash
chmod +x check-ports.sh
./check-ports.sh
```

- [ ] All ports available
- [ ] No conflicts detected

### 8. Deploy

```bash
chmod +x deploy.sh
./deploy.sh
```

- [ ] Docker images built successfully
- [ ] Containers started
- [ ] Backend health check passed
- [ ] No errors in deployment output

## ✅ Post-Deployment

### 9. Verify Services

```bash
# Check container status
docker-compose -f docker-compose.production.yml --env-file .env.production ps
```

- [ ] All containers running
- [ ] No containers in "Restarting" state

```bash
# Check backend health
curl http://localhost:4001/api/health
```

- [ ] Backend responds with 200 OK
- [ ] Health check returns success

```bash
# Check logs
docker logs biznes-backend --tail 50
```

- [ ] No critical errors in logs
- [ ] MongoDB connected successfully
- [ ] Server listening on correct port

### 10. Access Test

**Frontend:**
```
http://YOUR_VPS_IP:8001
```

- [ ] Frontend loads successfully
- [ ] No console errors
- [ ] Assets loading correctly

**Backend:**
```
http://YOUR_VPS_IP:4001/api/health
```

- [ ] API responds
- [ ] Returns health status

### 11. Functional Tests

- [ ] Login page loads
- [ ] Can create account (if applicable)
- [ ] Can login with credentials
- [ ] Dashboard loads after login
- [ ] API calls working
- [ ] No CORS errors

### 12. Firewall Configuration

```bash
sudo ufw status
```

- [ ] Firewall enabled
- [ ] SSH port allowed (22)
- [ ] Frontend port allowed (8001)
- [ ] Backend port allowed (4001)
- [ ] HTTP/HTTPS allowed (if using nginx)

```bash
# Configure if needed
sudo ufw allow 22/tcp
sudo ufw allow 8001/tcp
sudo ufw allow 4001/tcp
sudo ufw enable
```

### 13. Backup Setup

```bash
# Test backup
docker exec biznes-mongodb mongodump \
  --username admin \
  --password YOUR_MONGO_PASSWORD \
  --authenticationDatabase admin \
  --db car-repair-workshop \
  --out /backup/test
```

- [ ] Backup created successfully
- [ ] Backup files in `./mongodb-backup/test/`

```bash
# Setup cron for daily backups (optional)
crontab -e
# Add: 0 2 * * * cd /var/www/biznes && docker exec biznes-mongodb mongodump --username admin --password PASS --authenticationDatabase admin --db car-repair-workshop --out /backup/$(date +\%Y\%m\%d)
```

- [ ] Cron job added (optional)

### 14. Monitoring Setup (Optional)

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs
```

- [ ] Monitoring tools installed
- [ ] Can monitor resource usage

### 15. Documentation

- [ ] Access URLs documented
- [ ] Credentials stored securely (password manager)
- [ ] Team members notified
- [ ] Deployment notes updated

## 🔧 Optional: Domain Setup

### 16. Nginx Reverse Proxy

```bash
# Copy nginx config
sudo cp nginx-reverse-proxy.conf /etc/nginx/sites-available/biznes.conf

# Edit domain
sudo nano /etc/nginx/sites-available/biznes.conf
# Change: server_name biznes.yourdomain.com

# Enable site
sudo ln -s /etc/nginx/sites-available/biznes.conf /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

- [ ] Nginx config created
- [ ] Domain configured
- [ ] Site enabled
- [ ] Nginx reloaded successfully

### 17. SSL Certificate

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d biznes.yourdomain.com
```

- [ ] Certbot installed
- [ ] SSL certificate obtained
- [ ] HTTPS working
- [ ] Auto-renewal configured

### 18. Update Environment for Domain

```bash
nano .env.production
# Change:
# DEPLOYMENT_MODE=domain
# DOMAIN=biznes.yourdomain.com
# VITE_API_URL=https://biznes.yourdomain.com/api
# WEBHOOK_URL=https://biznes.yourdomain.com/api/telegram

# Redeploy
./deploy.sh
```

- [ ] Environment updated
- [ ] Redeployed successfully
- [ ] Domain access working

## 📊 Final Verification

### 19. Complete System Test

- [ ] Frontend accessible via IP or domain
- [ ] Backend API responding
- [ ] Database operations working
- [ ] File uploads working (if applicable)
- [ ] Telegram webhooks working (if applicable)
- [ ] All features functional
- [ ] No errors in logs
- [ ] Performance acceptable

### 20. Documentation & Handoff

- [ ] Access URLs documented
- [ ] Credentials shared securely
- [ ] Deployment guide shared with team
- [ ] Support contacts documented
- [ ] Monitoring dashboard setup (if applicable)

## 🎉 Deployment Complete!

```
✅ Frontend: http://YOUR_VPS_IP:8001
✅ Backend:  http://YOUR_VPS_IP:4001/api
✅ Status:   All systems operational
```

## 📝 Next Steps

1. Monitor logs for first 24 hours
2. Setup automated backups
3. Configure monitoring alerts
4. Plan for scaling (if needed)
5. Document any issues and solutions

## 🆘 Rollback Plan

If something goes wrong:

```bash
# Stop containers
docker-compose -f docker-compose.production.yml --env-file .env.production down

# Check logs
docker logs biznes-backend --tail 200

# Fix issues in .env.production or code

# Redeploy
./deploy.sh
```

---

**Remember:** Keep `.env.production` secure and never commit it to git!
