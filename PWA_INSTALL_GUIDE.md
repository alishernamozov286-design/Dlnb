# PWA O'rnatish Yo'riqnomasi

Loyihani telefonga o'rnatish uchun quyidagi qadamlarni bajaring:

## 1. Loyihani Build Qilish

```bash
cd frontend
npm run build
```

## 2. Telefonda Ochish

### Android (Chrome/Edge):
1. Telefonda Chrome yoki Edge brauzerida saytni oching
2. Pastda "Telefonga o'rnatish" tugmasi paydo bo'ladi
3. "O'rnatish" tugmasini bosing
4. Ilova bosh ekranga qo'shiladi

### iPhone (Safari):
1. Safari brauzerida saytni oching
2. Pastda "Ilovani o'rnatish" yo'riqnomasi paydo bo'ladi
3. Pastdagi "Ulashish" tugmasini bosing (⎙)
4. "Bosh ekranga qo'shish" ni tanlang
5. "Qo'shish" tugmasini bosing

## 3. Xususiyatlar

✅ Offline ishlash
✅ Tez yuklash
✅ Bosh ekrandan ochish
✅ To'liq ekran rejimi
✅ Push bildirishnomalar (kelajakda)

## 4. Muammolarni Hal Qilish

### Agar "O'rnatish" tugmasi ko'rinmasa:

1. **HTTPS** orqali ochilganligini tekshiring
2. Brauzer keshini tozalang
3. Sahifani yangilang (F5)
4. Service Worker ro'yxatdan o'tganligini tekshiring:
   - Chrome DevTools > Application > Service Workers

### Logo ko'rinmasa:

`frontend/public/logo.png` faylini tekshiring va kamida 512x512 o'lchamda bo'lishi kerak.

## 5. Test Qilish

Local serverda test qilish uchun:

```bash
# Frontend
cd frontend
npm run build
npm run preview

# Backend
cd backend
npm run dev
```

Keyin telefonda `http://[server-ip]:4173` ochib ko'ring.

## 6. Production Deploy

Production serverda HTTPS bilan deploy qilganingizdan keyin, foydalanuvchilar avtomatik ravishda "O'rnatish" tugmasini ko'radilar.

---

**Eslatma:** PWA faqat HTTPS yoki localhost da ishlaydi!
