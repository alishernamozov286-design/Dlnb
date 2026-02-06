# PWA Debug Checklist

Agar VPS da PWA install tugmasi chiqmasa, quyidagilarni tekshiring:

## 1. Browser Console Tekshirish

Chrome DevTools (F12) > Console da quyidagilarni qidiring:

```
[PWA] Debug Info: { ... }
[PWA] ✅ beforeinstallprompt event fired!
```

Agar `beforeinstallprompt` chiqmasa, quyidagi xatolarni qidiring.

## 2. Manifest.json Tekshirish

Chrome DevTools > Application > Manifest

**Tekshirish kerak:**
- ✅ Manifest yuklanganmi?
- ✅ `name` va `short_name` bormi?
- ✅ `start_url` to'g'rimi?
- ✅ `display: standalone` bormi?
- ✅ Icons (192x192, 512x512) bormi?
- ✅ `theme_color` va `background_color` bormi?

**Xato bo'lsa:**
```
Manifest: Line 1, column 1, Syntax error.
```

## 3. Service Worker Tekshirish

Chrome DevTools > Application > Service Workers

**Tekshirish kerak:**
- ✅ Service Worker ro'yxatdan o'tganmi?
- ✅ Status: "activated and is running"
- ✅ Scope: "/"

**Agar xato bo'lsa:**
```bash
# VPS da
cd /var/www/html  # yoki sizning frontend papkangiz
ls -la sw.js manifest.json

# Fayllar borligini tekshiring
```

## 4. HTTPS Tekshirish

Browser address bar da:
- ✅ Qulf belgisi ko'rinishi kerak
- ✅ "Secure" yoki "Connection is secure"

**Test:**
```bash
curl -I https://alochibolajon.uz
# HTTP/2 200 yoki HTTP/1.1 200 bo'lishi kerak
```

## 5. Foydalanuvchi Dismiss Qilganmi?

Browser Console da:
```javascript
// Tekshirish
localStorage.getItem('pwa-install-dismissed')
localStorage.getItem('pwa-install-dismissed-ios')

// Tozalash (test uchun)
localStorage.removeItem('pwa-install-dismissed')
localStorage.removeItem('pwa-install-dismissed-ios')
```

## 6. Browser Qo'llab-quvvatlashmi?

**Qo'llab-quvvatlaydigan browserlar:**
- ✅ Chrome (Android)
- ✅ Edge (Android, Windows)
- ✅ Samsung Internet
- ✅ Safari (iOS) - boshqacha usul
- ❌ Firefox (Android) - cheklangan
- ❌ Chrome (iOS) - ishlamaydi

## 7. Allaqachon O'rnatilganmi?

Agar ilova allaqachon o'rnatilgan bo'lsa, tugma ko'rinmaydi.

**Tekshirish:**
- Telefon bosh ekranida ilova ikonkasi bormi?
- Browser address bar yo'qmi? (standalone mode)

**Test uchun o'chirish:**
- Android: Settings > Apps > [App name] > Uninstall
- iOS: Bosh ekrandan ikonkani o'chirish

## 8. Nginx Konfiguratsiya

`/etc/nginx/sites-available/default` yoki nginx.conf da:

```nginx
# Manifest va SW uchun to'g'ri MIME types
location ~* \.(json|webmanifest)$ {
    add_header Content-Type application/manifest+json;
    add_header Cache-Control "public, max-age=3600";
}

location /sw.js {
    add_header Content-Type application/javascript;
    add_header Cache-Control "no-cache";
    add_header Service-Worker-Allowed "/";
}
```

## 9. Build Tekshirish

VPS da:

```bash
# Frontend build papkasida
cd /var/www/html  # yoki dist/

# Kerakli fayllar borligini tekshirish
ls -la | grep -E "manifest.json|sw.js|index.html"

# Manifest.json ichini ko'rish
cat manifest.json

# Service Worker ichini ko'rish
head -20 sw.js
```

## 10. Network Tab Tekshirish

Chrome DevTools > Network

**Qidirish kerak:**
- `manifest.json` - Status: 200
- `sw.js` - Status: 200
- `logo.png` - Status: 200

**Agar 404:**
```bash
# VPS da fayllarni to'g'ri joyga ko'chirish
cp frontend/public/manifest.json /var/www/html/
cp frontend/public/sw.js /var/www/html/
cp frontend/public/logo.png /var/www/html/
```

## Tez Test

VPS da saytni ochib, Console da:

```javascript
// 1. Manifest tekshirish
fetch('/manifest.json').then(r => r.json()).then(console.log)

// 2. Service Worker tekshirish
navigator.serviceWorker.getRegistrations().then(console.log)

// 3. PWA installable mi?
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('✅ PWA installable!');
});
```

## Umumiy Muammolar

### 1. "beforeinstallprompt" chiqmaydi
- Manifest.json xato
- Service Worker ro'yxatdan o'tmagan
- HTTPS yo'q
- Allaqachon o'rnatilgan

### 2. Service Worker xato
- sw.js fayli yo'q
- Scope noto'g'ri
- Cache xatolari

### 3. Manifest xato
- JSON syntax xato
- Icons yo'q yoki noto'g'ri o'lcham
- start_url noto'g'ri

### 4. iOS da ishlamaydi
- Safari ishlatilmagan (Chrome iOS da ishlamaydi)
- "Add to Home Screen" qo'lda qilish kerak

---

**Eng tez yechim:** Browser Console ni oching va `[PWA]` loglarini o'qing!
