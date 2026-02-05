# SSL Certificate Setup Guide for dalnaboyshop.biznesjon.uz

## Prerequisites
- Domain `dalnaboyshop.biznesjon.uz` must be pointing to your VPS IP
- Nginx must be installed and running
- Ports 80 and 443 must be open in firewall

## Step 1: Verify Domain is Pointing to VPS

```bash
# Check if domain resolves to your VPS
nslookup dalnaboyshop.biznesjon.uz

# Or use dig
dig dalnaboyshop.biznesjon.uz

# Or simple ping
ping dalnaboyshop.biznesjon.uz
```

## Step 2: Install Certbot (if not already installed)

```bash
# Update package list
sudo apt update

# Install certbot and nginx plugin
sudo apt install certbot python3-certbot-nginx -y
```

## Step 3: Verify Nginx Configuration

```bash
# Test nginx configuration
sudo nginx -t

# If there are errors, check the config
sudo nano /etc/nginx/sites-available/dalnaboyshop.conf

# Reload nginx if needed
sudo systemctl reload nginx
```

## Step 4: Open Firewall Ports (if using UFW)

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check firewall status
sudo ufw status
```

## Step 5: Obtain SSL Certificate with Certbot

```bash
# Run certbot with nginx plugin
sudo certbot --nginx -d dalnaboyshop.biznesjon.uz

# Follow the prompts:
# 1. Enter your email address
# 2. Agree to terms of service (Y)
# 3. Choose whether to share email (Y/N)
# 4. Choose redirect option (2 - Redirect HTTP to HTTPS - RECOMMENDED)
```

### Alternative: Manual Certificate Only (without auto-configuration)

```bash
# Get certificate without modifying nginx config
sudo certbot certonly --nginx -d dalnaboyshop.biznesjon.uz
```

## Step 6: Verify SSL Certificate

```bash
# Test HTTPS connection
curl -I https://dalnaboyshop.biznesjon.uz

# Check certificate details
sudo certbot certificates

# Test SSL configuration
openssl s_client -connect dalnaboyshop.biznesjon.uz:443 -servername dalnaboyshop.biznesjon.uz
```

## Step 7: Test Auto-Renewal

```bash
# Dry run to test renewal process
sudo certbot renew --dry-run

# If successful, certbot will automatically renew certificates before expiry
```

## Step 8: Verify Your Site

Open in browser:
- http://dalnaboyshop.biznesjon.uz (should redirect to HTTPS)
- https://dalnaboyshop.biznesjon.uz (should show your site with padlock)

## Troubleshooting

### Issue: Domain not resolving
```bash
# Check DNS records
nslookup dalnaboyshop.biznesjon.uz

# Wait for DNS propagation (can take up to 48 hours)
```

### Issue: Port 80/443 blocked
```bash
# Check if ports are listening
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# Check firewall
sudo ufw status
sudo iptables -L -n | grep -E '80|443'
```

### Issue: Nginx not serving site
```bash
# Check nginx status
sudo systemctl status nginx

# Check nginx error logs
sudo tail -f /var/log/nginx/dalnaboyshop_error.log

# Restart nginx
sudo systemctl restart nginx
```

### Issue: Certificate validation failed
```bash
# Make sure nginx is serving on port 80
curl http://dalnaboyshop.biznesjon.uz

# Check if .well-known directory is accessible
curl http://dalnaboyshop.biznesjon.uz/.well-known/

# Try standalone mode (stop nginx first)
sudo systemctl stop nginx
sudo certbot certonly --standalone -d dalnaboyshop.biznesjon.uz
sudo systemctl start nginx
```

## Manual SSL Configuration (if certbot fails)

If certbot automatic configuration doesn't work, you can manually configure SSL:

### 1. Get certificate manually
```bash
sudo certbot certonly --nginx -d dalnaboyshop.biznesjon.uz
```

### 2. Edit nginx configuration
```bash
sudo nano /etc/nginx/sites-available/dalnaboyshop.conf
```

### 3. Add SSL configuration
```nginx
# HTTP - Redirect to HTTPS
server {
    listen 80;
    server_name dalnaboyshop.biznesjon.uz;
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name dalnaboyshop.biznesjon.uz;
    
    # SSL Certificate
    ssl_certificate /etc/letsencrypt/live/dalnaboyshop.biznesjon.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dalnaboyshop.biznesjon.uz/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Logging
    access_log /var/log/nginx/dalnaboyshop_access.log;
    error_log /var/log/nginx/dalnaboyshop_error.log;
    
    # Max upload size
    client_max_body_size 50M;
    
    # Frontend (React App)
    location / {
        proxy_pass http://localhost:8002;
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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
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
    
    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:8002;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 4. Test and reload
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Certificate Renewal

Certbot automatically sets up a cron job or systemd timer for renewal. Certificates are valid for 90 days and will auto-renew at 30 days before expiry.

### Check renewal timer
```bash
# For systemd
sudo systemctl list-timers | grep certbot

# For cron
sudo crontab -l | grep certbot
```

### Manual renewal
```bash
sudo certbot renew
```

## Quick Commands Reference

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (automatic nginx configuration)
sudo certbot --nginx -d dalnaboyshop.biznesjon.uz

# Test renewal
sudo certbot renew --dry-run

# Check certificates
sudo certbot certificates

# Revoke certificate (if needed)
sudo certbot revoke --cert-path /etc/letsencrypt/live/dalnaboyshop.biznesjon.uz/cert.pem

# Delete certificate (if needed)
sudo certbot delete --cert-name dalnaboyshop.biznesjon.uz
```

## Expected Result

After successful SSL setup:
- ✅ http://dalnaboyshop.biznesjon.uz → redirects to HTTPS
- ✅ https://dalnaboyshop.biznesjon.uz → shows your site with padlock icon
- ✅ SSL certificate valid for 90 days
- ✅ Auto-renewal configured
- ✅ A+ rating on SSL Labs test (https://www.ssllabs.com/ssltest/)

## Next Steps

1. Test your site: https://dalnaboyshop.biznesjon.uz
2. Update any hardcoded HTTP URLs to HTTPS
3. Test SSL rating: https://www.ssllabs.com/ssltest/analyze.html?d=dalnaboyshop.biznesjon.uz
4. Monitor certificate expiry (should auto-renew)
