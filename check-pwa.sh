#!/bin/bash

echo "🔍 PWA Diagnostika..."
echo ""

# 1. HTTPS tekshirish
echo "1️⃣ HTTPS tekshirish:"
curl -I https://alochibolajon.uz 2>&1 | head -1
echo ""

# 2. Manifest.json tekshirish
echo "2️⃣ Manifest.json:"
curl -s https://alochibolajon.uz/manifest.json | head -5
echo ""

# 3. Service Worker tekshirish
echo "3️⃣ Service Worker (sw.js):"
curl -I https://alochibolajon.uz/sw.js 2>&1 | grep -E "HTTP|Content-Type"
echo ""

# 4. Logo tekshirish
echo "4️⃣ Logo (logo.png):"
curl -I https://alochibolajon.uz/logo.png 2>&1 | grep -E "HTTP|Content-Type"
echo ""

# 5. Fayllar mavjudligini tekshirish (agar server access bo'lsa)
if [ -d "/var/www/html" ]; then
    echo "5️⃣ Server fayllar:"
    ls -lh /var/www/html/ | grep -E "manifest.json|sw.js|logo.png|index.html"
    echo ""
fi

# 6. Nginx konfiguratsiya
if [ -f "/etc/nginx/sites-available/default" ]; then
    echo "6️⃣ Nginx SSL:"
    grep -E "ssl_certificate|listen 443" /etc/nginx/sites-available/default | head -3
    echo ""
fi

echo "✅ Diagnostika tugadi!"
echo ""
echo "📱 Keyingi qadam:"
echo "   1. Telefonda https://alochibolajon.uz ochib ko'ring"
echo "   2. Chrome DevTools > Console ni oching"
echo "   3. [PWA] loglarini o'qing"
