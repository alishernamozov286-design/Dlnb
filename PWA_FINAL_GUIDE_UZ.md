# PWA Install Tugmasi - Yakuniy Qo'llanma 🎯

## Muammo
✅ Localhost'da ishlaydi  
❌ VPSda chiqmayapti

## Yechim (3 qadam)

### 1️⃣ VPSga Kirish va Yangilash
```bash
ssh root@YOUR_VPS_IP
cd /var/www/dalnaboyshop
git pull origin main
```

### 2️⃣ Build va Deploy
```bash
cd frontend
npm install
npm run build
cp -r dist/* /var/www/dalnaboyshop/
cd ..
```

### 3️⃣ Nginx Yangilash
```bash
sudo cp nginx-dalnaboyshop.conf /etc/nginx/sites-available/dalnaboyshop
sudo nginx -t
sudo systemctl reload nginx
```

## SSL O'rnatish (Agar yo'q bo'lsa)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d dalnaboyshop.biznesjon.uz
```

## Tekshirish
1. Browser: `https://dalnaboyshop.biznesjon.uz`
2. F12 > Console: `[PWA] ✅ beforeinstallprompt event fired!`
3. 2-3 soniya kutish
4. "Ilovani o'rnatish" tugmasi paydo bo'ladi

## Agar Chiqmasa
```javascript
// Browser Console'da
localStorage.removeItem('pwa-install-dismissed')
localStorage.removeItem('pwa-install-dismissed-ios')
location.reload()
```

## Nima O'zgardi?
- ✅ Vite PWA plugin qo'shildi
- ✅ Service Worker avtomatik yaratiladi
- ✅ Nginx PWA uchun sozlandi
- ✅ Manifest to'g'ri konfiguratsiya qilindi

## Fayllar
- `frontend/vite.config.ts` - PWA plugin
- `frontend/src/main.tsx` - SW registration
- `nginx-dalnaboyshop.conf` - Nginx config
- `frontend/src/components/InstallPWA.tsx` - Install button

## Muhim!
PWA faqat **HTTPS**'da ishlaydi. HTTP'da chiqmaydi!

---

**Muvaffaqiyatli deploy! 🎉**
