#!/bin/bash

# PWA Fix Deployment Script
# Bu script PWA install tugmasini VPSda ishlashini ta'minlaydi

set -e

echo "🚀 PWA Fix Deployment boshlandi..."

# 1. Frontend build
echo "📦 Frontend build qilinmoqda..."
cd frontend
npm install
npm run build

# 2. Dist papkasini tekshirish
if [ ! -d "dist" ]; then
    echo "❌ Xato: dist papkasi topilmadi!"
    exit 1
fi

echo "✅ Build muvaffaqiyatli yakunlandi"

# 3. Fayllarni sanash
echo "📊 Build statistikasi:"
echo "   - Jami fayllar: $(find dist -type f | wc -l)"
echo "   - Manifest: $(ls -lh dist/manifest.webmanifest 2>/dev/null || echo 'Topilmadi')"
echo "   - Service Worker: $(ls -lh dist/sw.js 2>/dev/null || echo 'Topilmadi')"

cd ..

echo ""
echo "✅ Build tayyor!"
echo ""
echo "📋 Keyingi qadamlar (VPSda):"
echo ""
echo "1. Fayllarni VPSga yuklash:"
echo "   scp -r frontend/dist/* root@YOUR_VPS_IP:/var/www/dalnaboyshop/"
echo ""
echo "2. Nginx konfiguratsiyasini yangilash:"
echo "   sudo cp nginx-dalnaboyshop.conf /etc/nginx/sites-available/dalnaboyshop"
echo "   sudo nginx -t"
echo "   sudo systemctl reload nginx"
echo ""
echo "3. HTTPS o'rnatish (MUHIM!):"
echo "   sudo certbot --nginx -d dalnaboyshop.biznesjon.uz"
echo ""
echo "4. Browser cache tozalash:"
echo "   Ctrl + Shift + R (hard refresh)"
echo ""
echo "📖 Batafsil: PWA_FIX_DEPLOYMENT.md"
