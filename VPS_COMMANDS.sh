#!/bin/bash
# VPSda PWA Deploy - Barcha Buyruqlar

echo "🚀 PWA Deploy Boshlandi..."

# 1. Loyiha papkasiga o'tish
cd /var/www/dalnaboyshop

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
cp -r dist/* /var/www/dalnaboyshop/
cd ..

# 5. Nginx konfiguratsiyasini yangilash
echo "⚙️  Nginx yangilanmoqda..."
sudo cp nginx-dalnaboyshop.conf /etc/nginx/sites-available/dalnaboyshop

# 6. Nginx tekshirish
echo "✅ Nginx tekshirilmoqda..."
sudo nginx -t

# 7. Nginx qayta yuklash
echo "🔄 Nginx qayta yuklanmoqda..."
sudo systemctl reload nginx

echo ""
echo "✅ Deploy muvaffaqiyatli yakunlandi!"
echo ""
echo "🔍 Tekshirish:"
echo "   Browser: https://dalnaboyshop.biznesjon.uz"
echo "   Console: F12 > Console"
echo ""
echo "📝 Loglar:"
echo "   sudo tail -f /var/log/nginx/dalnaboyshop_error.log"
echo ""
