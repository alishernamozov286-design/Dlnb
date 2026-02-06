#!/bin/bash

# VPSda PWA Deploy Script
# Bu scriptni VPSda /var/www/dlnb papkasida saqlang

set -e  # Xato bo'lsa to'xtatish

echo "🚀 PWA Deploy Boshlandi..."
echo ""

# 1. Loyiha papkasiga o'tish
cd /var/www/dlnb

# 2. Git'dan yangilash
echo "📥 Git'dan yangilanmoqda..."
git pull origin main

# 3. Frontend build
echo "🔨 Frontend build qilinmoqda..."
cd frontend
npm install
npm run build

# 4. Fayllarni ko'chirish
echo "📦 Fayllar ko'chirilmoqda..."
cp -r dist/* /var/www/dlnb/

# 5. Ruxsatlarni to'g'rilash
echo "🔐 Ruxsatlar sozlanmoqda..."
sudo chown -R www-data:www-data /var/www/dlnb/
sudo chmod -R 755 /var/www/dlnb/

# 6. Nginx qayta yuklash
echo "🔄 Nginx qayta yuklanmoqda..."
sudo systemctl reload nginx

echo ""
echo "✅ Deploy muvaffaqiyatli yakunlandi!"
echo ""
echo "🔍 PWA Fayllar:"
ls -lh /var/www/dlnb/manifest.webmanifest 2>/dev/null || echo "❌ manifest.webmanifest topilmadi"
ls -lh /var/www/dlnb/sw.js 2>/dev/null || echo "❌ sw.js topilmadi"
ls -lh /var/www/dlnb/index.html 2>/dev/null || echo "❌ index.html topilmadi"
echo ""
echo "🌐 Sayt: https://dalnaboyshop.biznesjon.uz"
echo ""
