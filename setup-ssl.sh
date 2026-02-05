#!/bin/bash

# ============================================
# SSL Setup Script for dalnaboyshop.biznesjon.uz
# ============================================

set -e

DOMAIN="dalnaboyshop.biznesjon.uz"
EMAIL="your-email@example.com"  # Change this to your email

echo "============================================"
echo "SSL Setup for $DOMAIN"
echo "============================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Step 1: Check if domain resolves
echo "📡 Step 1: Checking DNS resolution..."
if nslookup $DOMAIN > /dev/null 2>&1; then
    echo "✅ Domain resolves correctly"
else
    echo "⚠️  Warning: Domain may not be resolving yet"
    echo "   Continue anyway? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
echo ""

# Step 2: Install certbot if not installed
echo "📦 Step 2: Checking certbot installation..."
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    apt update
    apt install certbot python3-certbot-nginx -y
    echo "✅ Certbot installed"
else
    echo "✅ Certbot already installed"
fi
echo ""

# Step 3: Check nginx
echo "🔧 Step 3: Checking nginx..."
if ! systemctl is-active --quiet nginx; then
    echo "Starting nginx..."
    systemctl start nginx
fi

if nginx -t > /dev/null 2>&1; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors"
    nginx -t
    exit 1
fi
echo ""

# Step 4: Open firewall ports
echo "🔥 Step 4: Configuring firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp > /dev/null 2>&1 || true
    ufw allow 443/tcp > /dev/null 2>&1 || true
    echo "✅ Firewall ports opened (80, 443)"
else
    echo "⚠️  UFW not found, skipping firewall configuration"
fi
echo ""

# Step 5: Get SSL certificate
echo "🔐 Step 5: Obtaining SSL certificate..."
echo "   This will:"
echo "   - Get SSL certificate from Let's Encrypt"
echo "   - Automatically configure nginx"
echo "   - Set up auto-renewal"
echo ""
echo "   You will be asked for:"
echo "   - Email address (for renewal notifications)"
echo "   - Agreement to terms of service"
echo "   - Whether to redirect HTTP to HTTPS (choose YES)"
echo ""
echo "Press Enter to continue..."
read

certbot --nginx -d $DOMAIN

echo ""
echo "============================================"
echo "✅ SSL Setup Complete!"
echo "============================================"
echo ""
echo "Your site should now be available at:"
echo "  https://$DOMAIN"
echo ""
echo "Testing SSL certificate..."
if curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN | grep -q "200\|301\|302"; then
    echo "✅ HTTPS is working!"
else
    echo "⚠️  HTTPS may not be working yet. Please check manually."
fi
echo ""
echo "Next steps:"
echo "1. Visit https://$DOMAIN in your browser"
echo "2. Verify the padlock icon appears"
echo "3. Test SSL rating: https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
echo ""
echo "Certificate will auto-renew before expiry."
echo "To test renewal: sudo certbot renew --dry-run"
echo ""
