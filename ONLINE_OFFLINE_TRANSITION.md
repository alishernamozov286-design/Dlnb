# Online ↔ Offline Transition Modal

## Xususiyatlar

Professional modal ikki yo'nalishda ishlaydi:
1. **Online → Offline** (Internet o'chganda)
2. **Offline → Online** (Internet yonganda)

## Offline → Online Transition

### Timeline
1. **0ms:** Internet yondi → Modal darhol ko'rsatiladi
2. **0-1500ms:** Progress bar 0% → 100% (smooth animation)
   - 0-30%: "Online rejimga o'tish boshlandi"
   - 30-70%: "Server bilan bog'lanmoqda..."
   - 70-100%: "Sinxronlashtirilmoqda..."
3. **1500ms:** Progress 100%, "Tayyor!" xabari
4. **2000ms:** Modal avtomatik yopiladi (500ms keyin)
5. **Online rejim ochiladi**

### Dizayn
- **Gradient:** Green (#10b981 → #059669) - Online uchun
- **Icon:** 📱 → 🌐 (Offline'dan Online'ga)
- **Status xabarlari:**
  - "Online rejimga o'tish boshlandi"
  - "Server bilan bog'lanmoqda..."
  - "Sinxronlashtirilmoqda..."
  - "Tayyor!"

## Online → Offline Transition

### Timeline
1. **0ms:** Internet o'chdi → Modal darhol ko'rsatiladi
2. **0-1500ms:** Progress bar 0% → 100% (smooth animation)
   - 0-30%: "Offline rejimga o'tish boshlandi"
   - 30-70%: "Ma'lumotlar yuklanmoqda..."
   - 70-100%: "Tayyor bo'lmoqda..."
3. **1500ms:** Progress 100%, "Tayyor!" xabari
4. **2000ms:** Modal avtomatik yopiladi (500ms keyin)
5. **Offline rejim ochiladi**

### Dizayn
- **Gradient:** Purple (#667eea → #764ba2) - Offline uchun
- **Icon:** 🌐 → 📱 (Online'dan Offline'ga)
- **Status xabarlari:**
  - "Offline rejimga o'tish boshlandi"
  - "Ma'lumotlar yuklanmoqda..."
  - "Tayyor bo'lmoqda..."
  - "Tayyor!"

## Texnik Tafsilotlar

### State Management
```typescript
const [isOnlineTransition, setIsOnlineTransition] = useState(false);
let lastOfflineState = networkManager.getStatus().isOnline ? false : true;
```

### Transition Detection
```typescript
// ONLINE → OFFLINE
if (isCurrentlyOffline && !lastOfflineState) {
  lastOfflineState = true;
  startProgressAnimation(false); // Going offline
}

// OFFLINE → ONLINE
else if (!isCurrentlyOffline && lastOfflineState) {
  lastOfflineState = false;
  startProgressAnimation(true); // Going online
}
```

### Progress Animation
- **Duration:** 1500ms (1.5 sekund)
- **Update interval:** 30ms
- **Total steps:** 50
- **Progress per step:** 2%
- **Smooth linear transition**

### Gradient Colors
```typescript
// Online (Green)
bg-gradient-to-br from-[#10b981] via-[#059669] to-[#10b981]

// Offline (Purple)
bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#667eea]
```

## Test qilish

### 1. Online → Offline
1. VPS'da saytni oching (online rejim)
2. Internet o'chiring
3. **Purple modal** ko'rinishi kerak
4. Progress bar 1.5 sekundda to'lishi kerak
5. Icon: 🌐 → 📱
6. Modal yopiladi, offline rejim ochiladi

### 2. Offline → Online
1. Offline rejimda bo'ling
2. Internet yoqing
3. **Green modal** ko'rinishi kerak
4. Progress bar 1.5 sekundda to'lishi kerak
5. Icon: 📱 → 🌐
6. Modal yopiladi, online rejim ochiladi

## Xususiyatlar

✅ **Ikki yo'nalishli transition** (Online ↔ Offline)
✅ **Turli ranglar** (Green - Online, Purple - Offline)
✅ **Turli iconlar** (🌐 ↔ 📱)
✅ **Turli xabarlar** (har bir rejim uchun)
✅ **Smooth animation** (1.5 sekund)
✅ **Professional dizayn** (gradient, blur, pulse)
✅ **Auto-hide** (500ms keyin)

## Natija

Endi foydalanuvchi internet o'chganda yoki yonganda professional modal ko'radi va qaysi rejimga o'tayotganini tushunadi! 🎉
