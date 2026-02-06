# PWA Install Tugmasi - Tezkor Yechim

## Muammo
✅ Localhost'da ishlaydi  
❌ VPSda chiqmayapti

## Asosiy Sabab
🔴 **HTTPS yo'q!** PWA faqat HTTPS yoki localhost'da ishlaydi.

## Tezkor Yechim (5 qadam)

### 1. Local'da Build
```bash
cd frontend
npm install
npm run build
```

### 2. VPSga Yuklash
```bash
# Local mashinadan
scp -r frontend/dist/* root@YOUR_VPS_IP:/var/www/dalnaboyshop/

# Yoki VPSda
cd /var/www/dalnaboyshop
git pull
cd frontend && npm install && npm run build
cp -r dist/* /var/www/dalnaboyshop/
```

### 3. Nginx Yangilash
```bash
# VPSda
sudo cp nginx-dalnaboyshop.conf /etc/nginx/sites-available/dalnaboyshop
sudo nginx -t
sudo systemctl reload nginx
```

### 4. SSL O'rnatish (ENG MUHIM!)
```bash
# VPSda
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d dalnaboyshop.biznesjon.uz
```

### 5. Browser Cache Tozalash
- `Ctrl + Shift + R` (hard refresh)
- `F12` > `Application` > `Clear storage` > `Clear site data`

## Tekshirish

### Console'da ko'rinishi kerak:
```
[PWA] Service Worker registered successfully
[PWA] ✅ beforeinstallprompt event fired!
[PWA] Showing install prompt
```

### Agar chiqmasa:
```javascript
// Browser Console'da
localStorage.removeItem('pwa-install-dismissed')
localStorage.removeItem('pwa-install-dismissed-ios')
location.reload()
```

## Batafsil
- `PWA_FIX_DEPLOYMENT.md` - To'liq qo'llanma
- `SSL_SETUP_GUIDE.md` - SSL sozlash
