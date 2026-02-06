# PWA Tugmasi VPS'da Ko'rinmasligi - Tezkor Yechim

## Muammo
Localhost'da PWA install tugmasi ishlaydi, VPS'da chiqmaydi.

## Sabab
Nginx konfiguratsiyasida Service Worker va Manifest uchun kerakli headerlar yo'q edi.

## Yechim (3 qadam)

### 1. VPS'ga Kirish
```bash
ssh user@your-vps-ip
cd /var/www/biznes  # yoki sizning loyihangiz
```

### 2. Kodni Yangilash
```bash
git pull origin main
```

### 3. Qayta Deploy Qilish
```bash
./deploy.sh
```

## Tekshirish

### Browser'da (F12 > Console):
```javascript
console.log('HTTPS:', window.location.protocol === 'https:');
console.log('SW:', 'serviceWorker' in navigator);
```

### Service Worker (F12 > Application > Service Workers):
- `sw.js` - Status: **Activated** ko'rinishi kerak

### Manifest (F12 > Application > Manifest):
- Barcha ma'lumotlar to'g'ri ko'rinishi kerak

## Agar Hali Ham Ishlamasa

### 1. HTTPS Yo'q Bo'lsa
```bash
sudo certbot --nginx -d yourdomain.com
```

### 2. Cache Tozalash
Browser'da: `F12 > Application > Clear storage > Clear site data`

### 3. Loglarni Ko'rish
```bash
docker logs biznes-frontend --tail 50
docker logs biznes-backend --tail 50
```

## Nima O'zgardi?

### frontend/nginx.conf:
- ✅ Service Worker uchun to'g'ri headerlar
- ✅ Manifest.json uchun to'g'ri MIME type
- ✅ CSP'ga `worker-src` va `manifest-src` qo'shildi

### frontend/src/components/InstallPWA.tsx:
- ✅ Development test kodi olib tashlandi
- ✅ Soddalashtirildi

## Muhim!

PWA faqat **HTTPS** yoki **localhost**'da ishlaydi. Agar VPS'da HTTP ishlatilsa, SSL sertifikat o'rnatish kerak:

```bash
sudo certbot --nginx -d yourdomain.com
```

Keyin `.env.production` faylida:
```env
DEPLOYMENT_MODE=domain
DOMAIN=yourdomain.com
VITE_API_URL=https://yourdomain.com/api
```

Va qayta deploy:
```bash
./deploy.sh
```

---

**Xulosa:** Nginx konfiguratsiyasi yangilandi, endi PWA VPS'da ham ishlashi kerak! 🎉
