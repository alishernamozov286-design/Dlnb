# 🚀 VPS Deployment Guide - dalnaboyshop.biznesjon.uz

## Quick Start

Your project is ready for deployment! Follow these simple steps:

### On Your VPS:

```bash
# 1. Go to project directory
cd /var/www/dlnb

# 2. Pull latest changes
git reset --hard
git pull origin main

# 3. Run deployment script
chmod +x QUICK_FIX_VPS.sh
sudo ./QUICK_FIX_VPS.sh

# 4. Setup SSL
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d dalnaboyshop.biznesjon.uz
```

That's it! Your site will be live at: **https://dalnaboyshop.biznesjon.uz**

---

## What the Script Does

The `QUICK_FIX_VPS.sh` script automatically:

1. ✅ Installs PM2 (if needed)
2. ✅ Builds backend (TypeScript compilation)
3. ✅ Starts backend with PM2 on port 4002
4. ✅ Builds frontend (React + Vite)
5. ✅ Deploys frontend to `/var/www/dalnaboyshop/`
6. ✅ Configures nginx
7. ✅ Verifies deployment

---

## Configuration

### Ports (Unique for Multi-Site VPS)
- Frontend: **8002**
- Backend: **4002**
- MongoDB: **27019**

### Domain
- **dalnaboyshop.biznesjon.uz**

### Project Name
- **dlnb**

---

## Management Commands

### PM2 (Backend)
```bash
pm2 status                    # View status
pm2 logs dlnb-backend         # View logs
pm2 restart dlnb-backend      # Restart
pm2 stop dlnb-backend         # Stop
pm2 monit                     # Monitor
```

### Nginx (Frontend)
```bash
sudo nginx -t                 # Test config
sudo systemctl reload nginx   # Reload
sudo systemctl status nginx   # Check status
```

### Updates (After Initial Setup)
```bash
cd /var/www/dlnb
./update.sh                   # Quick update script
```

---

## Troubleshooting

### Backend Not Starting
```bash
# Check logs
pm2 logs dlnb-backend --lines 100

# Check if port is in use
sudo lsof -i :4002

# Restart
pm2 restart dlnb-backend
```

### Frontend 404 Error
```bash
# Check files
ls -la /var/www/dalnaboyshop/

# Rebuild and redeploy
cd /var/www/dlnb/frontend
npm run build
sudo cp -r dist/* /var/www/dalnaboyshop/
sudo systemctl reload nginx
```

### MongoDB Connection Error
```bash
# Check MongoDB
sudo systemctl status mongodb

# Restart MongoDB
sudo systemctl restart mongodb
```

---

## Files Created

### Deployment Scripts
- `QUICK_FIX_VPS.sh` - Main deployment script
- `update.sh` - Quick update script
- `deploy-pm2.sh` - Full PM2 deployment
- `fix-nginx-directory.sh` - Fix nginx directory

### Configuration Files
- `.env.production` - Production environment variables
- `backend/ecosystem.config.js` - PM2 configuration
- `nginx-dalnaboyshop.conf` - Nginx configuration

### Documentation
- `VPS_DEPLOY_COMMANDS.md` - Detailed step-by-step guide
- `VPS_COMMANDS_TO_RUN.txt` - Simple command reference
- `PM2_DEPLOYMENT_GUIDE.md` - PM2 deployment guide
- `QUICK_UPDATE_GUIDE.md` - Update guide
- `FIX_404_ERROR.md` - 404 error troubleshooting

---

## Architecture

```
┌─────────────────────────────────────────┐
│  https://dalnaboyshop.biznesjon.uz      │
│  (Nginx - Port 80/443)                  │
└─────────────┬───────────────────────────┘
              │
              ├─► Frontend (Static Files)
              │   /var/www/dalnaboyshop/
              │
              └─► Backend API (/api)
                  ↓
                  PM2 (Port 4002)
                  ↓
                  MongoDB (Port 27019)
```

---

## Security

- ✅ HTTPS with Let's Encrypt SSL
- ✅ Secure JWT tokens
- ✅ Environment variables for secrets
- ✅ PM2 process management
- ✅ Nginx security headers
- ✅ Auto-restart on failure

---

## Monitoring

### Check Health
```bash
# Backend health
curl http://localhost:4002/api/health

# Frontend
curl https://dalnaboyshop.biznesjon.uz

# PM2 status
pm2 status

# System resources
pm2 monit
```

### View Logs
```bash
# Backend logs
pm2 logs dlnb-backend

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

---

## Backup

### MongoDB Backup
```bash
# Manual backup
mongodump --port 27019 --out /backup/dlnb-$(date +%Y%m%d)

# Restore
mongorestore --port 27019 /backup/dlnb-20240205
```

### Code Backup
```bash
# Your code is on GitHub
git remote -v
# https://github.com/alishernamozov286-design/Dlnb.git
```

---

## Support

### Documentation Files
- `VPS_DEPLOY_COMMANDS.md` - Full deployment guide
- `PM2_DEPLOYMENT_GUIDE.md` - PM2 specific guide
- `NGINX_SETUP.md` - Nginx configuration guide
- `FIX_404_ERROR.md` - Troubleshooting 404 errors

### Quick Help
```bash
# View all available scripts
ls -la *.sh

# View documentation
ls -la *.md
```

---

## Success Checklist

After deployment, verify:

- [ ] PM2 shows `dlnb-backend` as `online`
- [ ] `curl http://localhost:4002/api/health` returns success
- [ ] `https://dalnaboyshop.biznesjon.uz` loads the frontend
- [ ] SSL certificate is valid (green padlock)
- [ ] Backend logs show no errors: `pm2 logs dlnb-backend`
- [ ] Nginx is running: `sudo systemctl status nginx`

---

## Next Steps

1. ✅ Deploy to VPS (follow Quick Start above)
2. ✅ Setup SSL certificate
3. ✅ Test all features
4. ✅ Monitor logs for errors
5. ✅ Setup automated backups
6. ✅ Configure monitoring/alerts

---

**Repository:** https://github.com/alishernamozov286-design/Dlnb.git

**Live Site:** https://dalnaboyshop.biznesjon.uz

**Good luck with your deployment! 🚀**
