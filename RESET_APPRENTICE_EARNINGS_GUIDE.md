# Shogirtlarning pullarini va vazifalarini 0 ga tushirish

## Script haqida
Bu script barcha shogirtlarning daromadlarini 0 ga tushiradi va barcha vazifalarni o'chiradi.

## Nima qiladi?
1. ✅ Barcha shogirtlarning `earnings` (joriy oylik) ni 0 ga o'zgartiradi
2. ✅ Barcha shogirtlarning `totalEarnings` (jami daromad) ni 0 ga o'zgartiradi
3. ✅ Barcha vazifalarni (Tasks) MongoDB'dan o'chiradi

## Ishga tushirish

### Windows (CMD):
```cmd
cd backend
npm run reset-apprentice-earnings
```

### Linux/Mac:
```bash
cd backend
npm run reset-apprentice-earnings
```

## Natija
Script ishga tushgandan keyin quyidagi ma'lumotlarni ko'rasiz:
- Nechta shogirtning pullari 0 ga tushirildi
- Nechta vazifa o'chirildi
- Har bir shogirtning eski va yangi balansini

## ⚠️ OGOHLANTIRISH
Bu script **qaytarib bo'lmaydigan** o'zgarishlar qiladi:
- Barcha shogirtlarning daromadlari 0 ga tushadi
- Barcha vazifalar o'chiriladi
- Bu ma'lumotlarni qaytarib bo'lmaydi!

Agar ishonchingiz komil bo'lsa, yuqoridagi buyruqni bajaring.

## Muqobil: Faqat ma'lum shogirtni reset qilish
Agar faqat bitta shogirtni reset qilmoqchi bo'lsangiz, MongoDB Compass yoki mongo shell'dan qo'lda o'zgartiring:

```javascript
// Bitta shogirtni reset qilish
db.users.updateOne(
  { username: "shogirt_username" },
  { $set: { earnings: 0, totalEarnings: 0 } }
)

// Bitta shogirtning vazifalarini o'chirish
db.tasks.deleteMany({ assignedTo: ObjectId("shogirt_id") })
```
