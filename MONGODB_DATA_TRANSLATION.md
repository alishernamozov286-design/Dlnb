# MongoDB Ma'lumotlarini Til Bo'yicha Tarjima Qilish

## Muammo
Avtomobillar sahifasida MongoDB'dan kelayotgan ma'lumotlar (status, paymentStatus) sidebar'da sozlangan tilga mos kelmasdi. Barcha ma'lumotlar faqat lotin yozuvida ko'rsatilardi.

## Yechim

### 1. Markazlashtirilgan Tarjima Funksiyalari
`frontend/src/lib/utils.ts` fayliga ikkita yangi funksiya qo'shildi:

#### `translateStatus(status, language)`
Mashina holatini tarjima qiladi:
- `pending` → Kutilmoqda / Кутилмоқда
- `in-progress` → Jarayonda / Жараёнда
- `completed` → Tayyor / Тайёр
- `delivered` → Topshirilgan / Топширилган

#### `translatePaymentStatus(status, language)`
To'lov holatini tarjima qiladi:
- `paid` → To'landi / Тўланди
- `partial` → Qisman / Қисман
- `unpaid` → To'lanmagan / Тўланмаган

### 2. Yangilangan Fayllar

#### `frontend/src/lib/utils.ts`
- `translateStatus()` funksiyasi qo'shildi
- `translatePaymentStatus()` funksiyasi qo'shildi
- Markazlashtirilgan tarjima lug'ati yaratildi

#### `frontend/src/pages/apprentice/Cars.tsx`
- `translateStatus()` import qilindi
- `getStatusText()` funksiyasi soddalashtirildi - endi markazlashtirilgan funksiyadan foydalanadi
- `language` state qo'shildi (localStorage'dan o'qiladi)

#### `frontend/src/pages/Cars.tsx`
- Allaqachon `t()` funksiyasidan foydalanadi
- Status filter dropdown'da tarjima ishlaydi
- Arxiv jadvalidagi statuslar tarjima qilinadi

#### `frontend/src/components/ViewCarModal.tsx`
- Allaqachon `t()` funksiyasidan foydalanadi
- Barcha statuslar to'g'ri tarjima qilinadi

## Qanday Ishlaydi

1. **Til Aniqlash**: Har bir komponent localStorage'dan tilni o'qiydi:
   ```typescript
   const language = React.useMemo<'latin' | 'cyrillic'>(() => {
     const savedLanguage = localStorage.getItem('language');
     return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
   }, []);
   ```

2. **Status Tarjimasi**: MongoDB'dan kelgan status qiymati tarjima funksiyasiga o'tkaziladi:
   ```typescript
   translateStatus(car.status, language)
   ```

3. **Avtomatik Yangilanish**: Sidebar'da til o'zgartirilganda, barcha statuslar avtomatik yangilanadi (React re-render).

## Foydalanish

### Status Tarjimasi
```typescript
import { translateStatus } from '@/lib/utils';

const statusText = translateStatus('in-progress', 'cyrillic');
// Natija: "Жараёнда"
```

### To'lov Holati Tarjimasi
```typescript
import { translatePaymentStatus } from '@/lib/utils';

const paymentText = translatePaymentStatus('partial', 'latin');
// Natija: "Qisman"
```

## Afzalliklari

1. **Markazlashtirilgan**: Barcha tarjimalar bitta joyda
2. **Qayta Foydalanish**: Har qanday komponentda ishlatish mumkin
3. **Oson Kengaytirish**: Yangi statuslar qo'shish oson
4. **Type-Safe**: TypeScript type checking ishlaydi
5. **Izchil**: Barcha joylarda bir xil tarjima

## Kelajakda Qo'shish Mumkin

- Task statuslari uchun tarjima funksiyasi
- Part statuslari uchun tarjima funksiyasi
- Boshqa enum qiymatlar uchun tarjima funksiyalari

## Test Qilish

1. Sidebar'da tilni o'zgartiring (Lotin ↔ Кирил)
2. Avtomobillar sahifasiga o'ting
3. Barcha statuslar tanlangan tilda ko'rsatilishini tekshiring:
   - Filter dropdown
   - Mashina kartalari
   - Arxiv jadvali
   - Ko'rish modali

## Xulosa

MongoDB'dan kelayotgan barcha ma'lumotlar endi sidebar'da sozlangan tilga mos ravishda ko'rsatiladi. Tarjima tizimi markazlashtirilgan va oson kengaytiriladi.
