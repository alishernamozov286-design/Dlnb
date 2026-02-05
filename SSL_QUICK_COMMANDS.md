# SSL Quick Commands - dalnaboyshop.biznesjon.uz

## 🚀 Quick Setup (Recommended)

```bash
# On your VPS, run:
cd /var/www/dlnb
sudo bash setup-ssl.sh
```

## 📋 Manual Setup (Step by Step)

### 1. Install Certbot
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Get SSL Certificate
```bash
sudo certbot --nginx -d dalnaboyshop.biznesjon.uz
```

### 3. Follow the prompts:
- Enter your email
- Agree to terms (Y)
- Choose redirect HTTP to HTTPS (2)

### 4. Verify
```bash
curl -I https://dalnaboyshop.biznesjon.uz
```

## 🔍 Verification Commands

```bash
# Check if domain resolves
nslookup dalnaboyshop.biznesjon.uz

# Test HTTP (should redirect to HTTPS)
curl -I http://dalnaboyshop.biznesjon.uz

# Test HTTPS
curl -I https://dalnaboyshop.biznesjon.uz

# Check certificate details
sudo certbot certificates

# View certificate info
openssl s_client -connect dalnaboyshop.biznesjon.uz:443 -servername dalnaboyshop.biznesjon.uz < /dev/null
```

## 🔄 Renewal Commands

```bash
# Test renewal (dry run)
sudo certbot renew --dry-run

# Force renewal (if needed)
sudo certbot renew --force-renewal

# Check renewal timer
sudo systemctl list-timers | grep certbot
```

## 🛠️ Troubleshooting

### Domain not resolving
```bash
# Check DNS
nslookup dalnaboyshop.biznesjon.uz
dig dalnaboyshop.biznesjon.uz
```

### Nginx issues
```bash
# Check nginx status
sudo systemctl status nginx

# Test nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Check logs
sudo tail -f /var/log/nginx/dalnaboyshop_error.log
```

### Port issues
```bash
# Check if ports are open
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# Open firewall ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

### Certificate issues
```bash
# Check certificate status
sudo certbot certificates

# Revoke certificate
sudo certbot revoke --cert-path /etc/letsencrypt/live/dalnaboyshop.biznesjon.uz/cert.pem

# Delete certificate
sudo certbot delete --cert-name dalnaboyshop.biznesjon.uz

# Try standalone mode
sudo systemctl stop nginx
sudo certbot certonly --standalone -d dalnaboyshop.biznesjon.uz
sudo systemctl start nginx
```

## 📊 SSL Testing

```bash
# Test SSL configuration
openssl s_client -connect dalnaboyshop.biznesjon.uz:443 -servername dalnaboyshop.biznesjon.uz

# Check SSL Labs rating (in browser)
# https://www.ssllabs.com/ssltest/analyze.html?d=dalnaboyshop.biznesjon.uz
```

## 🎯 Expected Results

After successful setup:
- ✅ http://dalnaboyshop.biznesjon.uz → redirects to HTTPS
- ✅ https://dalnaboyshop.biznesjon.uz → shows site with padlock
- ✅ Certificate valid for 90 days
- ✅ Auto-renewal configured

## 📝 Certificate Locations

```
Certificate: /etc/letsencrypt/live/dalnaboyshop.biznesjon.uz/fullchain.pem
Private Key: /etc/letsencrypt/live/dalnaboyshop.biznesjon.uz/privkey.pem
Chain: /etc/letsencrypt/live/dalnaboyshop.biznesjon.uz/chain.pem
```

## 🔐 Security Headers (Already Configured)

Your nginx config already includes:
- ✅ HSTS (Strict-Transport-Security)
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ X-XSS-Protection

## 📞 Support

If you encounter issues:
1. Check logs: `sudo tail -f /var/log/nginx/dalnaboyshop_error.log`
2. Verify DNS: `nslookup dalnaboyshop.biznesjon.uz`
3. Test nginx: `sudo nginx -t`
4. Check certbot logs: `sudo tail -f /var/log/letsencrypt/letsencrypt.log`
